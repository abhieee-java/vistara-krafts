import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

describe('Vistāra Krafts — E-Commerce Ad Tracking & Conversion Pixels', () => {
  let context;
  let gtagCalls;
  let fbqCalls;

  beforeEach(() => {
    gtagCalls = [];
    fbqCalls = [];

    context = {
      console: console,
      dataLayer: [],
      gtag: (...args) => gtagCalls.push(args),
      fbq: (...args) => fbqCalls.push(args),
      window: {},
      document: {
        title: 'Vistāra Krafts — Handcrafted Resin Art & Preserved Keepsakes',
        querySelector: () => null
      }
    };
    context.window = context;
    context.globalThis = context;

    // Load analytics.js into isolated VM context
    const analyticsCode = fs.readFileSync(path.resolve('analytics.js'), 'utf8');
    vm.createContext(context);
    vm.runInContext(analyticsCode, context);
  });

  it('initializes with authoritative Google Analytics 4 ID G-QVM9JT6BW3 and Meta Pixel ID', () => {
    assert.ok(context.VistaraAnalytics, 'VistaraAnalytics must be defined on window/global');
    assert.equal(context.VistaraAnalytics.GA_MEASUREMENT_ID, 'G-QVM9JT6BW3');
    assert.equal(context.VistaraAnalytics.META_PIXEL_ID, '1183595563273188');
  });

  it('tracks virtual page views across SPA route transitions', () => {
    context.VistaraAnalytics.trackPageView('catalog', 'Catalogue & Supplies — Vistāra Krafts');

    // GA4 verification
    const gaEvent = gtagCalls.find(call => call[0] === 'event' && call[1] === 'page_view');
    assert.ok(gaEvent, 'Must emit GA4 page_view event');
    assert.equal(gaEvent[2].page_title, 'Catalogue & Supplies — Vistāra Krafts');
    assert.equal(gaEvent[2].send_to, 'G-QVM9JT6BW3');

    // Meta Pixel verification
    const fbEvent = fbqCalls.find(call => call[0] === 'track' && call[1] === 'PageView');
    assert.ok(fbEvent, 'Must emit Meta Pixel PageView event');
  });

  it('tracks view_item on Product Detail Page (PDP) render with currency and item schema', () => {
    const mockProduct = {
      id: 'vk-cat-res-301',
      name: 'UltraClear 3:1 Casting Resin Kit',
      category: 'epoxy-resin',
      price: 1299
    };
    const mockVariant = {
      label: '1.2 Kg Studio Pouch',
      price: 1299
    };

    context.VistaraAnalytics.trackViewItem(mockProduct, mockVariant);

    // GA4 view_item
    const gaItem = gtagCalls.find(call => call[0] === 'event' && call[1] === 'view_item');
    assert.ok(gaItem, 'Must emit GA4 view_item event');
    assert.equal(gaItem[2].currency, 'INR');
    assert.equal(gaItem[2].value, 1299);
    assert.equal(gaItem[2].items[0].item_id, 'vk-cat-res-301');
    assert.equal(gaItem[2].items[0].item_name, 'UltraClear 3:1 Casting Resin Kit');
    assert.equal(gaItem[2].items[0].item_variant, '1.2 Kg Studio Pouch');

    // Meta ViewContent
    const fbView = fbqCalls.find(call => call[0] === 'track' && call[1] === 'ViewContent');
    assert.ok(fbView, 'Must emit Meta ViewContent event');
    assert.equal(fbView[2].value, 1299);
    assert.equal(fbView[2].currency, 'INR');
    assert.equal(fbView[2].content_ids[0], 'vk-cat-res-301');
  });

  it('tracks add_to_cart when items are added to studio bag', () => {
    const mockProduct = {
      id: 'vk-sil-magic',
      name: 'Magic Flower Drying Silica Gel',
      category: 'supplies',
      price: 599
    };
    const mockVariant = {
      label: '1 Kg Airtight Pouch',
      price: 599
    };

    context.VistaraAnalytics.trackAddToCart(mockProduct, mockVariant, 2);

    // GA4 add_to_cart
    const gaAdd = gtagCalls.find(call => call[0] === 'event' && call[1] === 'add_to_cart');
    assert.ok(gaAdd, 'Must emit GA4 add_to_cart event');
    assert.equal(gaAdd[2].currency, 'INR');
    assert.equal(gaAdd[2].value, 1198); // 599 * 2
    assert.equal(gaAdd[2].items[0].quantity, 2);

    // Meta AddToCart
    const fbAdd = fbqCalls.find(call => call[0] === 'track' && call[1] === 'AddToCart');
    assert.ok(fbAdd, 'Must emit Meta AddToCart event');
    assert.equal(fbAdd[2].value, 1198);
    assert.equal(fbAdd[2].currency, 'INR');
  });

  it('tracks initiate_checkout / begin_checkout with cart items and monetary total', () => {
    const mockSummary = {
      total: 2498,
      itemsCount: 2,
      cart: [
        { productId: 'vk-1', name: 'Preserved Varmala Frame', price: 1899, qty: 1 },
        { productId: 'vk-2', name: 'Resin Glow Pigment', price: 599, qty: 1 }
      ]
    };

    context.VistaraAnalytics.trackInitiateCheckout(mockSummary);

    // GA4 begin_checkout
    const gaBegin = gtagCalls.find(call => call[0] === 'event' && call[1] === 'begin_checkout');
    assert.ok(gaBegin, 'Must emit GA4 begin_checkout');
    assert.equal(gaBegin[2].value, 2498);
    assert.equal(gaBegin[2].items.length, 2);

    // Meta InitiateCheckout
    const fbInit = fbqCalls.find(call => call[0] === 'track' && call[1] === 'InitiateCheckout');
    assert.ok(fbInit, 'Must emit Meta InitiateCheckout');
    assert.equal(fbInit[2].value, 2498);
    assert.equal(fbInit[2].num_items, 2);
  });

  it('tracks purchase with transaction ID, tax, shipping, and deduplicates repeated calls', () => {
    const mockOrder = {
      orderId: 'VK-ORD-998822',
      total: 3500,
      gstAmount: 534,
      shippingFee: 0,
      items: [
        { productId: 'vk-cat-res-301', name: 'UltraClear 3:1', price: 3500, qty: 1 }
      ]
    };

    // First call: Should track
    context.VistaraAnalytics.trackPurchase(mockOrder);

    const gaPurchases = gtagCalls.filter(call => call[0] === 'event' && call[1] === 'purchase');
    assert.equal(gaPurchases.length, 1, 'First purchase call must emit GA4 purchase event');
    assert.equal(gaPurchases[0][2].transaction_id, 'VK-ORD-998822');
    assert.equal(gaPurchases[0][2].value, 3500);
    assert.equal(gaPurchases[0][2].tax, 534);

    const fbPurchases = fbqCalls.filter(call => call[0] === 'track' && call[1] === 'Purchase');
    assert.equal(fbPurchases.length, 1, 'First purchase call must emit Meta Purchase event');
    assert.equal(fbPurchases[0][2].value, 3500);

    // Duplicate call with same orderId (e.g. from both store-bridge and app.js UI handler)
    context.VistaraAnalytics.trackPurchase(mockOrder);

    const gaPurchasesAfter = gtagCalls.filter(call => call[0] === 'event' && call[1] === 'purchase');
    assert.equal(gaPurchasesAfter.length, 1, 'Deduplication must prevent double counting in GA4');

    const fbPurchasesAfter = fbqCalls.filter(call => call[0] === 'track' && call[1] === 'Purchase');
    assert.equal(fbPurchasesAfter.length, 1, 'Deduplication must prevent double counting in Meta Pixel');
  });

  it('tracks search queries defensively', () => {
    context.VistaraAnalytics.trackSearch('Bridal Varmala Preservation');

    const gaSearch = gtagCalls.find(call => call[0] === 'event' && call[1] === 'search');
    assert.ok(gaSearch, 'Must emit GA4 search event');
    assert.equal(gaSearch[2].search_term, 'Bridal Varmala Preservation');

    const fbSearch = fbqCalls.find(call => call[0] === 'track' && call[1] === 'Search');
    assert.ok(fbSearch, 'Must emit Meta Search event');
    assert.equal(fbSearch[2].search_string, 'Bridal Varmala Preservation');
  });

  it('remains 100% resilient when ad blocker disables gtag and fbq or throws errors', () => {
    // Simulate aggressive ad blocker
    const adBlockerContext = {
      console: console,
      dataLayer: undefined,
      gtag: () => { throw new Error('Blocked by uBlock Origin'); },
      fbq: () => { throw new Error('Blocked by Brave Shields'); },
      window: {},
      document: { querySelector: () => null }
    };
    adBlockerContext.window = adBlockerContext;
    adBlockerContext.globalThis = adBlockerContext;

    const analyticsCode = fs.readFileSync(path.resolve('analytics.js'), 'utf8');
    vm.createContext(adBlockerContext);
    vm.runInContext(analyticsCode, adBlockerContext);

    // None of these should throw
    assert.doesNotThrow(() => {
      adBlockerContext.VistaraAnalytics.trackPageView('home');
      adBlockerContext.VistaraAnalytics.trackViewItem({ id: '1', price: 100 });
      adBlockerContext.VistaraAnalytics.trackAddToCart({ id: '1', price: 100 });
      adBlockerContext.VistaraAnalytics.trackInitiateCheckout({ total: 100, itemsCount: 1 });
      adBlockerContext.VistaraAnalytics.trackPurchase({ orderId: 'VK-1', total: 100 });
      adBlockerContext.VistaraAnalytics.trackSearch('resin');
    }, 'Ad blocker errors must never crash or throw unhandled exceptions');
  });
});
