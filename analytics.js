/**
 * VISTĀRA KRAFTS — E-COMMERCE AD TRACKING & CONVERSION PIXELS ENGINE
 * 
 * Provides unified, defensive tracking for:
 * 1. Google Analytics 4 (GA4 - G-QVM9JT6BW3):
 *    - Events: page_view, view_item, add_to_cart, begin_checkout, initiate_checkout, purchase, search, view_item_list
 * 2. Meta Pixel (Facebook & Instagram Ads):
 *    - Events: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Search
 * 
 * DESIGN PRINCIPLES:
 * - 100% Defensive: Never throws or breaks application execution if an ad blocker is enabled.
 * - Standardized E-Commerce Schemas: Matches Google Analytics 4 & Meta Business standard contracts.
 * - Currency: All monetary values tracked in Indian Rupees (INR).
 * - Universal Browser & Node.js Environment Support.
 */

(function (global) {
  'use strict';

  // Defensive wrappers for Google Analytics and Meta Pixel
  function sendGtag(...args) {
    if (typeof global.gtag === 'function') {
      try {
        global.gtag(...args);
      } catch (err) {
        console.debug('[Vistāra Analytics] gtag error suppressed:', err);
      }
    } else if (Array.isArray(global.dataLayer)) {
      global.dataLayer.push(args);
    }
  }

  function sendFbq(...args) {
    if (typeof global.fbq === 'function') {
      try {
        global.fbq(...args);
      } catch (err) {
        console.debug('[Vistāra Analytics] fbq error suppressed:', err);
      }
    }
  }

  const VistaraAnalytics = {
    // Configurable tracking IDs
    GA_MEASUREMENT_ID: 'G-QVM9JT6BW3',
    META_PIXEL_ID: (typeof document !== 'undefined' && document.querySelector('meta[name="meta-pixel-id"]')?.getAttribute('content')) ||
                   (typeof global.VISTARA_META_PIXEL_ID !== 'undefined' ? global.VISTARA_META_PIXEL_ID : '1183595563273188'),

    /**
     * Virtual Page View for SPA Route Changes
     * @param {string} routeName - e.g. 'home', 'catalog', 'product', 'cart', 'orders'
     * @param {string} pageTitle - Document or view title
     */
    trackPageView(routeName, pageTitle = '') {
      const pagePath = (typeof window !== 'undefined' && window.location)
        ? (window.location.pathname + window.location.hash)
        : `/#/${routeName}`;
      const title = pageTitle || (typeof document !== 'undefined' ? document.title : `Vistāra Krafts — ${routeName}`);

      // GA4 Virtual Page View
      sendGtag('event', 'page_view', {
        page_title: title,
        page_location: (typeof window !== 'undefined' && window.location) ? window.location.href : `https://www.vistarakrafts.com${pagePath}`,
        page_path: pagePath,
        send_to: this.GA_MEASUREMENT_ID
      });

      // Meta Pixel PageView
      sendFbq('track', 'PageView');
    },

    /**
     * E-Commerce: View Item (PDP Render)
     * Fired when a customer navigates to a product detail view.
     * @param {Object} product - Product record
     * @param {Object} [activeVariant] - Currently selected edition/size/variant
     */
    trackViewItem(product, activeVariant = null) {
      if (!product) return;
      const price = Number(activeVariant?.price || product.price || 0);
      const itemId = String(product.id || product.sku || '');
      const itemName = String(product.name || 'Handcrafted Studio Product');
      const itemCategory = String(product.category || 'Resin Art');
      const variantName = activeVariant?.label || 'Standard Edition';

      // 1. Google Analytics 4: view_item
      sendGtag('event', 'view_item', {
        currency: 'INR',
        value: price,
        items: [{
          item_id: itemId,
          item_name: itemName,
          item_category: itemCategory,
          item_variant: variantName,
          price: price,
          quantity: 1
        }]
      });

      // 2. Meta Pixel: ViewContent
      sendFbq('track', 'ViewContent', {
        content_name: itemName,
        content_category: itemCategory,
        content_ids: [itemId],
        content_type: 'product',
        value: price,
        currency: 'INR'
      });
    },

    /**
     * E-Commerce: Add To Cart
     * Fired when a customer clicks "Add to Bag" / "Add to Cart"
     * @param {Object} product - Product record
     * @param {Object} [activeVariant] - Selected variant
     * @param {number} [qty=1] - Quantity added
     */
    trackAddToCart(product, activeVariant = null, qty = 1) {
      if (!product) return;
      const quantity = Math.max(1, Number(qty) || 1);
      const unitPrice = Number(activeVariant?.price || product.price || 0);
      const totalPrice = unitPrice * quantity;
      const itemId = String(product.id || product.sku || '');
      const itemName = String(product.name || 'Handcrafted Studio Product');
      const itemCategory = String(product.category || 'Resin Art');
      const variantName = activeVariant?.label || 'Standard Edition';

      // 1. Google Analytics 4: add_to_cart
      sendGtag('event', 'add_to_cart', {
        currency: 'INR',
        value: totalPrice,
        items: [{
          item_id: itemId,
          item_name: itemName,
          item_category: itemCategory,
          item_variant: variantName,
          price: unitPrice,
          quantity: quantity
        }]
      });

      // 2. Meta Pixel: AddToCart
      sendFbq('track', 'AddToCart', {
        content_name: itemName,
        content_category: itemCategory,
        content_ids: [itemId],
        content_type: 'product',
        value: totalPrice,
        currency: 'INR'
      });
    },

    /**
     * E-Commerce: Initiate Checkout / Begin Checkout
     * Fired when the delivery address modal opens to begin order checkout.
     * @param {Object} cartSummary - Summary object from Store.getCartSummary()
     */
    trackInitiateCheckout(cartSummary) {
      if (!cartSummary) return;
      const cartItems = Array.isArray(cartSummary.cart) ? cartSummary.cart : [];
      const total = Number(cartSummary.total || 0);
      const numItems = Number(cartSummary.itemsCount || cartItems.length || 0);

      const gaItems = cartItems.map(item => ({
        item_id: String(item.productId || item.id || ''),
        item_name: String(item.name || item.productName || 'Studio Item'),
        item_variant: String(item.variantLabel || 'Standard Edition'),
        price: Number(item.price || 0),
        quantity: Number(item.qty || 1)
      }));

      // 1. Google Analytics 4: begin_checkout & initiate_checkout
      sendGtag('event', 'begin_checkout', {
        currency: 'INR',
        value: total,
        coupon: cartSummary.couponCode || undefined,
        items: gaItems
      });

      sendGtag('event', 'initiate_checkout', {
        currency: 'INR',
        value: total,
        coupon: cartSummary.couponCode || undefined,
        items: gaItems
      });

      // 2. Meta Pixel: InitiateCheckout
      sendFbq('track', 'InitiateCheckout', {
        num_items: numItems,
        content_ids: cartItems.map(i => String(i.productId || i.id || '')),
        content_type: 'product',
        value: total,
        currency: 'INR'
      });
    },

    _lastTrackedPurchaseId: null,

    /**
     * E-Commerce: Purchase Confirmation
     * Fired when payment is captured and verified by Razorpay / backend.
     * @param {Object} order - Confirmed order object
     */
    trackPurchase(order) {
      if (!order) return;
      const orderId = String(order.orderId || order.orderNumber || order.id || `VK-${Date.now()}`);
      if (this._lastTrackedPurchaseId === orderId) {
        return;
      }
      this._lastTrackedPurchaseId = orderId;
      const total = Number(order.total || 0);
      const tax = Number(order.gstAmount || 0);
      const shipping = Number(order.shippingFee || 0);
      const items = Array.isArray(order.items) ? order.items : [];

      const gaItems = items.map(item => ({
        item_id: String(item.productId || item.id || ''),
        item_name: String(item.name || item.productName || 'Studio Item'),
        item_variant: String(item.variantLabel || 'Standard Edition'),
        price: Number(item.price || 0),
        quantity: Number(item.qty || 1)
      }));

      // 1. Google Analytics 4: purchase
      sendGtag('event', 'purchase', {
        transaction_id: orderId,
        value: total,
        tax: tax,
        shipping: shipping,
        currency: 'INR',
        coupon: order.couponCode || undefined,
        items: gaItems
      });

      // 2. Meta Pixel: Purchase
      sendFbq('track', 'Purchase', {
        content_name: 'Vistāra Krafts Studio Order',
        content_type: 'product',
        content_ids: items.map(i => String(i.productId || i.id || '')),
        num_items: items.reduce((sum, i) => sum + (Number(i.qty) || 1), 0),
        value: total,
        currency: 'INR'
      });
    },

    /**
     * E-Commerce / Discovery: Search
     * Fired when a customer searches products in the search bar.
     * @param {string} query - Clean search term
     */
    trackSearch(query) {
      const q = String(query || '').trim();
      if (!q) return;

      // 1. Google Analytics 4: search
      sendGtag('event', 'search', {
        search_term: q
      });

      // 2. Meta Pixel: Search
      sendFbq('track', 'Search', {
        search_string: q
      });
    }
  };

  // Expose globally
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VistaraAnalytics;
  }
  if (typeof global !== 'undefined') {
    global.VistaraAnalytics = VistaraAnalytics;
  }
})(typeof window !== 'undefined' ? window : globalThis);
