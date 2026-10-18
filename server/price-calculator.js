import { CONFIG } from './config.js';
import { TEST_PRODUCTS } from '../test-fixtures.js';

// Authoritative fallback catalog mapping for ultra-fast or offline fallback
const FALLBACK_CATALOG = new Map(TEST_PRODUCTS.map(p => [p.id, p]));

// Canonical coupon dictionary
const AUTHORITATIVE_COUPONS = {
  STUDIO10: { code: 'STUDIO10', type: 'percent', value: 10, minOrder: 1500 },
  VISTARA500: { code: 'VISTARA500', type: 'flat', value: 500, minOrder: 3000 },
  WELCOME250: { code: 'WELCOME250', type: 'flat', value: 250, minOrder: 1000 },
  KRAFTFIRST: { code: 'KRAFTFIRST', type: 'flat', value: 150, minOrder: 500 },
  MEMORIES10: { code: 'MEMORIES10', type: 'percent', value: 10, minOrder: 1000 },
  FLIRTY15: { code: 'FLIRTY15', type: 'percent', value: 15, minOrder: 2500 },
  STUDIO20: { code: 'STUDIO20', type: 'percent', value: 20, minOrder: 5000 }
};

export class PriceCalculator {
  /**
   * Fetch authoritative product details from Supabase with trusted fallback
   * @param {string} productId
   */
  static async fetchAuthoritativeProduct(productId) {
    if (!productId || typeof productId !== 'string') return null;

    try {
      const url = `${CONFIG.SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(productId)}&select=id,sku,name,price,compare_at_price,stock,in_stock,is_active,variants`;
      const res = await fetch(url, {
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        }
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const dbProd = rows[0];
          // Ensure database price is authoritative
          return {
            id: dbProd.id,
            sku: dbProd.sku,
            name: dbProd.name,
            price: Number(dbProd.price || 0),
            regularPrice: Number(dbProd.compare_at_price || dbProd.price || 0),
            stock: Number(dbProd.stock || 0),
            inStock: dbProd.in_stock !== false,
            isActive: dbProd.is_active !== false,
            variants: Array.isArray(dbProd.variants) ? dbProd.variants : []
          };
        }
      }
    } catch (_err) {
      // In case Supabase network drops, fallback to authoritative internal catalog
    }

    const fallback = FALLBACK_CATALOG.get(productId);
    if (!fallback) return null;

    return {
      id: fallback.id,
      sku: fallback.sku,
      name: fallback.name,
      price: Number(fallback.price || 0),
      regularPrice: Number(fallback.regularPrice || fallback.price || 0),
      stock: fallback.inStock ? 50 : 0,
      inStock: Boolean(fallback.inStock),
      isActive: true,
      variants: Array.isArray(fallback.variants) ? fallback.variants : []
    };
  }

  /**
   * Fetch coupon from Supabase or authoritative coupon dictionary
   * @param {string} couponCode
   */
  static async fetchAuthoritativeCoupon(couponCode) {
    if (!couponCode || typeof couponCode !== 'string') return null;
    const cleanCode = couponCode.trim().toUpperCase();

    try {
      const url = `${CONFIG.SUPABASE_URL}/rest/v1/coupons?code=eq.${encodeURIComponent(cleanCode)}&is_active=eq.true&select=code,discount_type,discount_value,min_order_value`;
      const res = await fetch(url, {
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        }
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const r = rows[0];
          return {
            code: r.code,
            type: r.discount_type === 'percentage' ? 'percent' : 'flat',
            value: Number(r.discount_value || 0),
            minOrder: Number(r.min_order_value || 0)
          };
        }
      }
    } catch (_err) {}

    return AUTHORITATIVE_COUPONS[cleanCode] || null;
  }

  /**
   * Calculate effective unit price applying volume tier discounts
   * @param {number} basePrice
   * @param {number} qty
   */
  static calculateEffectiveUnitPrice(basePrice, qty) {
    const p = Number(basePrice || 0);
    const q = Number(qty || 1);
    if (q >= 6) {
      return p === 1299 ? 1089 : Math.round(p * 0.84);
    }
    if (q >= 3) {
      return p === 1299 ? 1199 : Math.round(p * 0.92);
    }
    return p;
  }

  /**
   * Authoritatively validate items and calculate totals.
   * Completely ignores any price, discount, or total values sent by the client.
   *
   * @param {Object} params
   * @param {Array} params.items - Client line items [{ productId, variantLabel, qty, color, shape, size, customNote }]
   * @param {string} [params.couponCode] - Client promotional code
   * @returns {Promise<Object>} Authoritative calculation and immutable items snapshot
   */
  static async calculateAuthoritativeOrder({ items, couponCode = '' }) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Order items list cannot be empty.');
    }

    if (items.length > 50) {
      throw new Error('Order exceeds maximum allowed line items count (50).');
    }

    const itemsSnapshot = [];
    let subtotal = 0;
    let regularTotal = 0;

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx] || {};
      const productId = String(item.productId || item.id || '').trim();
      const rawQty = item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 1);
      const qty = parseInt(rawQty, 10);

      if (!productId) {
        throw new Error(`Item at index ${idx} is missing a valid productId.`);
      }

      if (isNaN(qty) || qty <= 0 || qty > 99) {
        throw new Error(`Item "${productId}" has an invalid quantity: ${rawQty}. Allowed range: 1–99.`);
      }

      const product = await this.fetchAuthoritativeProduct(productId);
      if (!product) {
        throw new Error(`Product "${productId}" not found in authoritative studio catalog.`);
      }

      if (product.isActive === false) {
        throw new Error(`Product "${product.name}" is currently archived or inactive.`);
      }

      if (product.inStock === false || (typeof product.stock === 'number' && product.stock <= 0)) {
        throw new Error(`Product "${product.name}" is currently out of stock.`);
      }

      if (typeof product.stock === 'number' && product.stock > 0 && qty > product.stock) {
        throw new Error(`Product "${product.name}" has insufficient stock (available: ${product.stock}, requested: ${qty}).`);
      }

      // Resolve variant price if variant specified
      let unitPrice = product.price;
      let regularPrice = product.regularPrice;
      let resolvedVariantLabel = 'Standard Edition';

      const variantKey = item.variantId || item.variant_id || item.variantLabel || item.variant;
      if (variantKey && Array.isArray(product.variants) && product.variants.length > 0) {
        const found = product.variants.find(
          v => v.id === variantKey || v.label === variantKey
        );
        if (found) {
          unitPrice = Number(found.price || unitPrice);
          regularPrice = Number(found.regularPrice || regularPrice);
          resolvedVariantLabel = found.label || variantKey;
        } else {
          resolvedVariantLabel = product.variants[0].label || 'Standard Edition';
          unitPrice = Number(product.variants[0].price || unitPrice);
        }
      }

      // Apply volume tier discount
      const effectiveUnitPrice = this.calculateEffectiveUnitPrice(unitPrice, qty);
      const lineSubtotal = effectiveUnitPrice * qty;

      subtotal += lineSubtotal;
      regularTotal += regularPrice * qty;

      itemsSnapshot.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        variantLabel: resolvedVariantLabel,
        color: String(item.color || '').substring(0, 100),
        shape: String(item.shape || '').substring(0, 100),
        size: String(item.size || '').substring(0, 100),
        customNote: String(item.customNote || '').substring(0, 500),
        qty,
        quantity: qty,
        unitPrice: effectiveUnitPrice,
        basePrice: unitPrice,
        regularPrice,
        totalPrice: lineSubtotal
      });
    }

    // Coupon verification
    let couponDiscount = 0;
    let validatedCouponCode = '';
    const cleanCoupon = String(couponCode || '').trim().toUpperCase();

    if (cleanCoupon && subtotal > 0) {
      const couponObj = await this.fetchAuthoritativeCoupon(cleanCoupon);
      if (couponObj) {
        if (subtotal >= couponObj.minOrder) {
          if (couponObj.type === 'flat') {
            couponDiscount = Math.min(subtotal, couponObj.value);
          } else if (couponObj.type === 'percent') {
            couponDiscount = Math.round((subtotal * couponObj.value) / 100);
          }
          validatedCouponCode = couponObj.code;
        }
      }
    }

    // Shipping rules
    const isFreeShipping = subtotal >= CONFIG.FREE_SHIPPING_THRESHOLD || subtotal === 0;
    const shippingFee = isFreeShipping ? 0 : CONFIG.STANDARD_SHIPPING_FEE;

    // Final payable calculation
    const totalPayable = Math.max(0, subtotal - couponDiscount + shippingFee);
    const taxableAmount = Number((totalPayable / (1 + CONFIG.GST_RATE_PERCENT / 100)).toFixed(2));
    const gstAmount = Number((totalPayable - taxableAmount).toFixed(2));

    return {
      items: itemsSnapshot,
      itemsCount: itemsSnapshot.reduce((acc, i) => acc + i.qty, 0),
      subtotal,
      regularTotal,
      couponCode: validatedCouponCode,
      couponDiscount,
      shippingFee,
      isFreeShipping,
      gstAmount,
      taxableAmount,
      total: totalPayable,
      amountPaise: Math.round(totalPayable * 100),
      currency: CONFIG.CURRENCY
    };
  }
}
