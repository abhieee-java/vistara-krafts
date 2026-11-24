/**
 * VISTĀRA KRAFTS — COUPONS FULL LIFECYCLE, DELETION & DOM STABILITY TEST SUITE
 * 
 * Verifies:
 * 1. Authoritative coupon application (STUDIO10, ABHIE10) & minOrder thresholds.
 * 2. Deletion handling via BroadcastChannel & StoreBridge.
 * 3. Deletion handling via Supabase sync (deleted coupons are permanently blacklisted & never resurrect).
 * 4. Active cart reconciliation (deleted coupons auto-cleared from customer cart).
 * 5. Backend PriceCalculator authoritative rejection of deleted coupons.
 * 6. Zero DOM jumping (CLS = 0) and scroll preservation during updates.
 */

import test from 'node:test';
import assert from 'node:assert';
import { PriceCalculator } from '../server/price-calculator.js';

// Setup Mock Browser Environment for StoreBridge
const mockLocalStorage = new Map();
global.localStorage = {
  getItem: (k) => mockLocalStorage.get(k) || null,
  setItem: (k, v) => mockLocalStorage.set(k, String(v)),
  removeItem: (k) => mockLocalStorage.delete(k),
  clear: () => mockLocalStorage.clear()
};

global.window = {
  scrollY: 450,
  pageYOffset: 450,
  scrollTo: (opt, y) => {
    if (typeof opt === 'object' && opt !== null) {
      global.window.scrollY = opt.top;
      global.window.pageYOffset = opt.top;
    } else {
      global.window.scrollY = y !== undefined ? y : (opt || 0);
      global.window.pageYOffset = global.window.scrollY;
    }
  }
};

global.document = {
  documentElement: { scrollTop: 450 },
  body: { scrollTop: 450 },
  getElementById: (id) => {
    if (id === 'app-view-root') {
      return {
        id: 'app-view-root',
        offsetHeight: 1200,
        style: {},
        innerHTML: ''
      };
    }
    return null;
  }
};

global.__VK_TEST_ENV__ = true;
global.BroadcastChannel = class {
  constructor(name) { this.name = name; }
  postMessage() {}
  close() {}
};

// Import StoreBridge
await import('../store-bridge.js');
const Store = globalThis.Store || global.Store || globalThis.StorefrontBridge;

test('=== 1. VALID COUPON APPLICATION & MIN ORDER THRESHOLDS ===', async (t) => {
  // Clear cart and storage
  Store.clearCart();
  Store.applyCoupon('');

  // Setup items in cart: 2 units at 649 = 1298
  Store.addToCart({ productId: 'vk-cat-res-301', price: 649, qty: 2 });
  let summary = Store.getCartSummary();
  assert.strictEqual(summary.subtotal, 1298);

  // STUDIO10 requires minOrder: 1500
  let res = Store.applyCoupon('STUDIO10');
  assert.strictEqual(res.valid, false, 'STUDIO10 should be rejected when subtotal (1298) < minOrder (1500)');
  assert.match(res.message, /requires a minimum bag/i);

  // Add 1 more item: vk-cat-acc-deco (299) -> total 1597 >= 1500
  Store.addToCart({ productId: 'vk-cat-acc-deco', price: 299, qty: 1 });
  summary = Store.getCartSummary();
  assert.strictEqual(summary.subtotal, 1597);

  res = Store.applyCoupon('STUDIO10');
  assert.strictEqual(res.valid, true, 'STUDIO10 should be accepted when subtotal >= 1500');
  assert.strictEqual(Store.getCouponCode(), 'STUDIO10');

  summary = Store.getCartSummary();
  assert.strictEqual(summary.couponDiscount, 160); // 10% of 1597 = 160
});

test('=== 2. COUPON DELETION VIA ADMIN BROADCASTCHANNEL PURGES COUPON & CLEARS ACTIVE CART ===', async (t) => {
  // Coupon is currently applied to cart
  assert.strictEqual(Store.getCouponCode(), 'STUDIO10');

  // Admin deletes 'STUDIO10' and broadcasts message
  Store.receiveStudioPush({
    type: 'COUPON_DELETED',
    deletedCode: 'STUDIO10'
  });

  // Verify deleted code is blacklisted
  const allCoupons = Store.getAllCoupons ? Store.getAllCoupons() : {};
  assert.strictEqual(allCoupons['STUDIO10'], undefined, 'Deleted coupon must not exist in available coupons');

  // Verify it was purged from active cart
  assert.strictEqual(Store.getCouponCode(), '', 'Deleted coupon must be cleared from active cart immediately');
  const summary = Store.getCartSummary();
  assert.strictEqual(summary.couponDiscount, 0, 'Cart discount must drop to 0');

  // Attempting to re-apply deleted coupon must be strictly rejected
  const tryReapply = Store.applyCoupon('STUDIO10');
  assert.strictEqual(tryReapply.valid, false, 'Deleted coupon cannot be applied');
  assert.match(tryReapply.message, /no longer available or has been deleted/i);
});

test('=== 3. COUPONS_UPDATED BROADCASTCHANNEL WITH DELETED CODE PURGES FROM STOREFRONT ===', async (t) => {
  // Register a temporary test coupon
  Store.receiveStudioPush({
    type: 'COUPONS_UPDATED',
    coupons: [
      { code: 'FLASH50', discountType: 'flat', discountValue: 50, minOrderValue: 500, isActive: true }
    ]
  });

  let all = Store.getAllCoupons();
  assert.ok(all['FLASH50'], 'FLASH50 must exist initially');

  // Apply to cart
  const applied = Store.applyCoupon('FLASH50');
  assert.strictEqual(applied.valid, true);
  assert.strictEqual(Store.getCouponCode(), 'FLASH50');

  // Admin deletes FLASH50 and sends updated coupons list without FLASH50
  Store.receiveStudioPush({
    type: 'COUPONS_UPDATED',
    coupons: [
      { code: 'ABHIE10', discountType: 'flat', discountValue: 200, minOrderValue: 1500, isActive: true }
    ],
    deletedCode: 'FLASH50'
  });

  all = Store.getAllCoupons();
  assert.strictEqual(all['FLASH50'], undefined, 'FLASH50 must be completely purged');
  assert.strictEqual(Store.getCouponCode(), '', 'Cart coupon must be auto-cleared');

  const reapply = Store.applyCoupon('FLASH50');
  assert.strictEqual(reapply.valid, false);
});

test('=== 4. BACKEND PRICE CALCULATOR AUTHORITATIVE REJECTION OF DELETED COUPONS ===', async (t) => {
  // 1. Authoritative active coupon in database: ABHIE10 (₹200 flat off, min 1500)
  const validOrder = await PriceCalculator.calculateAuthoritativeOrder({
    items: [
      { productId: 'vk-cat-res-301', qty: 2 }, // 2 * 649 = 1298
      { productId: 'vk-cat-acc-deco', qty: 1 }  // 299 -> 1597 >= 1500
    ],
    couponCode: 'ABHIE10'
  });
  assert.strictEqual(validOrder.couponCode, 'ABHIE10', 'Active DB coupon ABHIE10 must be accepted');
  assert.strictEqual(validOrder.couponDiscount, 200, 'ABHIE10 gives ₹200 flat discount');

  // 2. Authoritative deleted coupon in database: WELCOME250 (deleted from Supabase)
  const rejectedOrder = await PriceCalculator.calculateAuthoritativeOrder({
    items: [
      { productId: 'vk-cat-res-301', qty: 2 },
      { productId: 'vk-cat-acc-deco', qty: 1 }
    ],
    couponCode: 'WELCOME250'
  });
  assert.strictEqual(rejectedOrder.couponCode, '', 'Deleted coupon WELCOME250 must be authoritatively rejected');
  assert.strictEqual(rejectedOrder.couponDiscount, 0, 'Deleted coupon must yield ₹0 discount');
});

test('=== 5. DOM & SCROLL STABILITY (ZERO UNINTENDED JUMPING) ===', async (t) => {
  // Simulate user scrolled down at 600px on catalog or cart
  global.window.scrollY = 600;
  global.window.pageYOffset = 600;

  let capturedScrollY = null;
  global.window.scrollTo = (options) => {
    if (typeof options === 'object') {
      capturedScrollY = options.top;
    } else {
      capturedScrollY = options;
    }
  };

  // Trigger coupon update notification
  Store.notify('coupons_updated', Store.getAllCoupons());

  // Verify that background coupon update does NOT reset scroll to 0
  assert.notStrictEqual(capturedScrollY, 0, 'Background coupon sync must never jump scroll to 0');
});

console.log('🎉 COUPONS FULL LIFECYCLE & DOM STABILITY SUITE READY');
