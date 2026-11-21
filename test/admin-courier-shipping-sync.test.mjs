import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storefrontDir = path.resolve(__dirname, '..');

// Test 1: Verify index.html does not contain chk-gift-wrap or Silk Potli in checkout
test('HTML Verification: chk-gift-wrap and Silk Potli completely removed from checkout modal', () => {
  const indexHtml = fs.readFileSync(path.join(storefrontDir, 'index.html'), 'utf8');

  assert.ok(!indexHtml.includes('id="chk-gift-wrap"'), 'index.html must NOT contain chk-gift-wrap');
  assert.ok(!indexHtml.includes('Complimentary Silk Potli'), 'index.html checkout must NOT offer Complimentary Silk Potli');
  assert.ok(!indexHtml.includes('Silk Potli &amp; Gift Note'), 'index.html must NOT mention Silk Potli & Gift Note');
  assert.ok(indexHtml.includes('id="chk-dpdp-consent-text"'), 'index.html must have chk-dpdp-consent-text for dynamic courier injection');
  assert.ok(!indexHtml.includes('for BlueDart delivery'), 'index.html DPDP consent must NOT mention BlueDart');
});

// Test 2: Storefront store-bridge settings & order courier synchronization
test('StoreBridge: Dynamic Default Courier & Shipping Threshold sync and order creation', () => {
  // Setup sandbox mock environment
  global.__VK_TEST_ENV__ = true;
  global.window = global;
  const storageMock = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  };
  global.localStorage = storageMock;
  global.sessionStorage = storageMock;
  global.document = {
    getElementById(id) {
      return {
        value: '',
        textContent: '',
        innerHTML: '',
        classList: { add() {}, remove() {}, toggle() {} },
        style: {},
        addEventListener() {},
        querySelectorAll() { return []; }
      };
    },
    querySelectorAll() { return []; },
    addEventListener() {},
    head: { appendChild() {} },
    body: { classList: { add() {}, remove() {}, toggle() {} } }
  };

  const storeBridgeCode = fs.readFileSync(path.join(storefrontDir, 'store-bridge.js'), 'utf8');
  const evalStoreCode = storeBridgeCode.replace(/\(function \(global\) \{/, '(function (global) {\n');
  new Function('global', evalStoreCode)(global);

  const Store = global.ResinStore;
  assert.ok(Store, 'ResinStore must be initialized');

  // Initial default settings
  const initialSettings = Store.getSettings();
  assert.strictEqual(initialSettings.defaultCourier, 'DTDC Express', 'Default courier must default to DTDC Express');
  assert.strictEqual(initialSettings.freeShippingThreshold, 999, 'Default free shipping threshold must be 999');

  // Push new settings: Change Default Courier to Speed Post and Threshold to 1499
  Store.receiveStudioPush({
    type: 'SETTINGS_UPDATED',
    settings: {
      defaultCourier: 'Speed Post',
      freeShippingThreshold: 1499,
      standardShippingFee: 99
    }
  });

  const updatedSettings = Store.getSettings();
  assert.strictEqual(updatedSettings.defaultCourier, 'Speed Post', 'Updated default courier must be Speed Post');
  assert.strictEqual(updatedSettings.freeShippingThreshold, 1499, 'Updated threshold must be 1499');

  // Cart summary reflects updated threshold
  // Cart with item subtotal 1299 (< 1499) -> shippingFee should be 99
  Store.addToCart({ productId: 'prod-test-1', name: 'Ocean Board', price: 1299, qty: 1 });
  const summary1 = Store.getCartSummary();
  assert.strictEqual(summary1.subtotal, 1299);
  assert.strictEqual(summary1.freeShippingThreshold, 1499);
  assert.strictEqual(summary1.isFreeShipping, false, '₹1,299 subtotal should not qualify for free shipping when threshold is 1499');
  assert.strictEqual(summary1.shippingFee, 99);

  // Cart with subtotal 1599 (>= 1499) -> free shipping
  Store.addToCart({ productId: 'prod-test-2', name: 'Coaster', price: 300, qty: 1 });
  const summary2 = Store.getCartSummary();
  assert.strictEqual(summary2.subtotal, 1599);
  assert.strictEqual(summary2.isFreeShipping, true, '₹1,599 subtotal should qualify for free shipping when threshold is 1499');
  assert.strictEqual(summary2.shippingFee, 0);

  // Login patron and create an order, verify order.courier uses the active Default Courier ('Speed Post') and giftWrap is false
  Store.loginPatron({
    provider: 'google',
    userId: 'usr_test_priya_1234',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91 98765 43210',
    address: 'Salt Lake Sector 5, Kolkata',
    pincode: '700091'
  });

  const orderResult = Store.createOrder({
    items: [{ id: 'p1', name: 'Test Piece', price: 1599, qty: 1 }],
    subtotal: 1599,
    shippingFee: 0,
    total: 1599,
    fullName: 'Priya Sharma',
    customerName: 'Priya Sharma',
    phone: '+91 98765 43210',
    address: 'Salt Lake Sector 5, Kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700091',
    paymentMethod: 'UPI'
  });

  assert.ok(orderResult.order, 'Order must be created successfully');
  assert.strictEqual(orderResult.order.courier, 'Speed Post', 'New order courier must use configured default courier (Speed Post)');
  assert.strictEqual(orderResult.order.giftWrap, false, 'New order must have giftWrap set to false');

  // Normalization of legacy BlueDart orders
  const legacyBlueDartOrder = {
    order_number: 'VK-LEGACY-001',
    customer_name: 'Rahul Roy',
    courier: 'BlueDart Air Express',
    total: 2499,
    order_status: 'confirmed'
  };
  const normalized = Store.normalizeStorefrontOrder(legacyBlueDartOrder);
  assert.strictEqual(normalized.courier, 'Speed Post', 'NormalizeStorefrontOrder must replace legacy BlueDart with configured default courier (Speed Post)');
  assert.ok(!normalized.status.includes('BlueDart'), 'Order status text must NOT contain BlueDart');
});

// Test 3: app.js applyStorefrontSettings dynamic updates
test('Storefront app.js: applyStorefrontSettings updates DOM elements and courier names', () => {
  const appCode = fs.readFileSync(path.join(storefrontDir, 'app.js'), 'utf8');

  // Verify app.js applyStorefrontSettings updates DOM elements
  assert.ok(appCode.includes('cartEmptyCourier.textContent = defaultCourier'), 'applyStorefrontSettings must update cart-empty-courier-name');
  assert.ok(appCode.includes('dpdpConsentEl.textContent = `I consent to processing my address & contact for ${defaultCourier} delivery'), 'applyStorefrontSettings must update chk-dpdp-consent-text');
  assert.ok(appCode.includes('pincodeModalExplainer.textContent = `Check ${defaultCourier} transit'), 'applyStorefrontSettings must update modal-pincode-explainer');
  assert.ok(appCode.includes('homeDeliveryExplainer.textContent = `Check ${defaultCourier} transit'), 'applyStorefrontSettings must update home-delivery-explainer');

  // Verify Silk Potli is purged from orders list and checkout
  assert.ok(!appCode.includes('Silk Potli</span></span>'), 'app.js must not render Silk Potli badge in orders view');
  assert.ok(!appCode.includes("Boolean(document.getElementById('chk-gift-wrap')?.checked)"), 'app.js checkout must not query chk-gift-wrap');
});

console.log('🎉 ALL DEFAULT COURIER, SHIPPING SYNC & GIFTWRAP PURGE TESTS PASSED!');
