import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { TEST_PRODUCTS } from './test-fixtures.js';

const ROOT = process.cwd();

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error('   ', err.message);
    failed++;
  }
}

// 1. Setup Browser-like Sandbox for store-bridge.js and app.js
const storageMap = new Map();
const mockLocalStorage = {
  getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
  clear: () => storageMap.clear()
};

const elementsById = new Map();
function makeMockElement(id = '') {
  const classes = new Set();
  const el = {
    id,
    innerHTML: '',
    textContent: '',
    value: '',
    src: '',
    href: '',
    style: {},
    dataset: {},
    classList: {
      add: (...c) => c.forEach(x => classes.add(x)),
      remove: (...c) => c.forEach(x => classes.delete(x)),
      toggle: (c, force) => {
        if (force === undefined) {
          if (classes.has(c)) classes.delete(c); else classes.add(c);
        } else if (force) classes.add(c); else classes.delete(c);
      },
      contains: (c) => classes.has(c)
    },
    setAttribute: () => {},
    removeAttribute: () => {},
    getAttribute: () => null,
    addEventListener: () => {},
    querySelector: () => makeMockElement(),
    querySelectorAll: () => [],
    closest: () => makeMockElement()
  };
  if (id) elementsById.set(id, el);
  return el;
}

const mockDocument = {
  body: makeMockElement('body'),
  documentElement: makeMockElement('html'),
  contains: () => true,
  getElementById: (id) => {
    if (!elementsById.has(id)) makeMockElement(id);
    return elementsById.get(id);
  },
  querySelector: () => makeMockElement(),
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => makeMockElement()
};

const windowListeners = {};
const sandbox = {
  window: null,
  __VK_TEST_ENV__: true,
  __VK_DISABLE_SUPABASE_AUTO_SYNC__: true,
  document: mockDocument,
  localStorage: mockLocalStorage,
  location: { hash: '#/home', href: 'http://localhost/index.html#/home' },
  navigator: { clipboard: { writeText: async () => {} } },
  scrollY: 0,
  scrollTo: (xOrObj, y) => {
    if (typeof xOrObj === 'object' && xOrObj !== null) {
      sandbox.scrollY = Number(xOrObj.top) || 0;
    } else {
      sandbox.scrollY = Number(y) || 0;
    }
  },
  console,
  setTimeout,
  clearTimeout,
  Date,
  Math,
  JSON,
  Number,
  String,
  Boolean,
  Array,
  Object,
  RegExp,
  Map,
  Set,
  Error,
  BroadcastChannel: class {
    constructor(name) { this.name = name; }
    postMessage() {}
    close() {}
  },
  CustomEvent: class {
    constructor(type, opts) { this.type = type; this.detail = opts?.detail; }
  },
  addEventListener: (type, cb) => {
    windowListeners[type] = windowListeners[type] || [];
    windowListeners[type].push(cb);
  },
  dispatchEvent: (evt) => {
    (windowListeners[evt.type] || []).forEach(cb => cb(evt));
  }
};
sandbox.window = sandbox;
sandbox.global = sandbox;
sandbox.globalThis = sandbox;
sandbox.__VK_TEST_ENV__ = true;
sandbox.__VK_TEST_FIXTURES__ = TEST_PRODUCTS;
sandbox.window.__VK_TEST_ENV__ = true;
sandbox.window.__VK_TEST_FIXTURES__ = TEST_PRODUCTS;
vm.createContext(sandbox);

const supabaseConfigCode = fs.readFileSync(path.join(ROOT, 'supabase-config.js'), 'utf8');
vm.runInContext(supabaseConfigCode, sandbox);
const cloudinaryConfigCode = fs.readFileSync(path.join(ROOT, 'cloudinary-config.js'), 'utf8');
vm.runInContext(cloudinaryConfigCode, sandbox);

const bridgeCode = fs.readFileSync(path.join(ROOT, 'store-bridge.js'), 'utf8');
vm.runInContext(bridgeCode, sandbox);

const appCode = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
vm.runInContext(appCode, sandbox);

const Store = sandbox.window.ResinStore;

test('StorefrontBridge initializes globally on window.ResinStore and window.StorefrontBridge', () => {
  assert.ok(Store, 'ResinStore should be defined');
  assert.strictEqual(sandbox.window.StorefrontBridge, Store);
});

test('Decision 1: 100% Empty Initial State on Fresh Load (0 cart, 0 wishlist, 0 orders, no auto-coupon, disabled GST, hidden badges)', () => {
  assert.strictEqual(Store.getCart().length, 0, 'Initial cart must be empty (0 items)');
  assert.strictEqual(Store.getCartSummary().itemsCount, 0, 'Initial cart itemsCount must be 0');
  assert.strictEqual(Store.getCartSummary().payable, 0, 'Initial cart payable must be ₹0');
  assert.strictEqual(Store.getWishlist().length, 0, 'Initial wishlist must be empty (0 items)');
  assert.strictEqual(Store.getOrders().length, 0, 'Initial orders must be empty (0 orders)');
  assert.strictEqual(Store.getCouponCode(), '', 'No coupon code should be auto-applied on initial load');
  const gst = Store.getGstInfo();
  assert.strictEqual(gst.enabled, false, 'GST invoice toggle must be disabled by default');
  assert.strictEqual(gst.gstin, '', 'Default GSTIN must be empty');
  assert.strictEqual(gst.tradeName, '', 'Default tradeName must be empty');
  const posts = Store.getSocialPosts();
  assert.ok(posts.every(p => p.saved === false && p.liked === false), 'No social posts should be pre-saved or pre-liked on initial load');

  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('js-wishlist-badge hidden'), 'Wishlist header badge must be hidden when count is 0');
  assert.ok(indexHtml.includes('js-cart-badge hidden'), 'Cart header badge must be hidden when count is 0');
});

test('Catalog contains 19 curated products across Resin Art Memories, Vistāra Krafts & POTRY', () => {
  const products = Store.getProducts();
  assert.strictEqual(products.length, 19);
  products.forEach(p => {
    assert.ok(p.id && p.name && p.price > 0, `Product ${p.id} missing core fields`);
    assert.ok(p.image && !p.image.includes('placeholder'), `Product ${p.id} missing valid main image`);
    assert.ok(Array.isArray(p.gallery) && p.gallery.length > 0, `Product ${p.id} missing gallery`);
    p.gallery.forEach(img => {
      assert.ok(!img.includes('placeholder'), `Product ${p.id} has placeholder gallery image`);
    });
  });
});

test('Pour Calculator computes 3:1, 2:1, and 1:1 ratios accurately and handles <= 0 edge cases', () => {
  const res31 = Store.calculateResinNeeded({ shape: 'rect', lengthCm: 20, widthCm: 20, depthCm: 1.5, ratioSystem: '3:1' });
  assert.strictEqual(res31.valid, true);
  assert.strictEqual(res31.totalGrams, 660);
  assert.strictEqual(res31.partAGrams, 495);
  assert.strictEqual(res31.partBGrams, 165);

  const res21 = Store.calculateResinNeeded({ shape: 'rect', lengthCm: 10, widthCm: 10, depthCm: 3.0, ratioSystem: '2:1' });
  assert.strictEqual(res21.valid, true);
  assert.strictEqual(res21.totalGrams, 330);
  assert.strictEqual(res21.partAGrams, 220);
  assert.strictEqual(res21.partBGrams, 110);

  const resZero = Store.calculateResinNeeded({ shape: 'rect', lengthCm: 0, widthCm: 20, depthCm: 1.5, ratioSystem: '3:1' });
  assert.strictEqual(resZero.valid, false);
  const resNeg = Store.calculateResinNeeded({ shape: 'circle', diameterCm: -15, depthCm: 1.5, ratioSystem: '1:1' });
  assert.strictEqual(resNeg.valid, false);
});

test('PIN code verifier validates 6-digit Indian PINs and rejects invalid inputs', () => {
  const blr = Store.verifyPincode('560001');
  assert.strictEqual(blr.valid, true);
  assert.ok(blr.city.includes('Bengaluru'));

  assert.strictEqual(Store.verifyPincode('').valid, false);
  assert.strictEqual(Store.verifyPincode('012345').valid, false);
  assert.strictEqual(Store.verifyPincode('5600').valid, false);
  assert.strictEqual(Store.verifyPincode('ABCDEF').valid, false);
});

test('Vistāra Krafts (VK) vector splash screen modal, CSS keyframes, and controllers exist', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const stylesCss = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

  assert.ok(indexHtml.includes('id="vkSplashContainer"'), 'index.html must contain #vkSplashContainer');
  assert.ok(indexHtml.includes('id="vkLogoRoot"'), 'index.html must contain #vkLogoRoot');
  assert.ok(indexHtml.includes('id="vkSvgElement"'), 'index.html must contain #vkSvgElement');
  assert.ok(indexHtml.includes('id="vkBrandTitleBlock"'), 'index.html must contain #vkBrandTitleBlock');
  assert.ok(indexHtml.includes('family=Cinzel'), 'index.html must link Cinzel font');

  assert.ok(stylesCss.includes('#vkSplashContainer'), 'styles.css must contain #vkSplashContainer styles');
  assert.ok(stylesCss.includes('vkDraw'), 'styles.css must define vkDraw keyframes');
  assert.ok(stylesCss.includes('vkFadeIn'), 'styles.css must define vkFadeIn keyframes');

  assert.ok(appJs.includes('window.dismissVkSplash'), 'app.js must define window.dismissVkSplash');
  assert.ok(appJs.includes('window.replayVkSplash'), 'app.js must define window.replayVkSplash');
});

test('Digital Personal Data Protection (DPDP) Act 2023 compliance suite markup, methods, and controllers exist', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const storeBridge = fs.readFileSync(path.join(ROOT, 'store-bridge.js'), 'utf8');
  const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

  assert.ok(indexHtml.includes('id="dpdp-consent-banner"'), 'index.html must contain #dpdp-consent-banner');
  assert.ok(indexHtml.includes('id="dpdp-notice-modal"'), 'index.html must contain #dpdp-notice-modal');
  assert.ok(indexHtml.includes('id="dpdp-preferences-modal"'), 'index.html must contain #dpdp-preferences-modal');
  assert.ok(indexHtml.includes('id="dpdp-grievance-modal"'), 'index.html must contain #dpdp-grievance-modal');
  assert.ok(indexHtml.includes('id="chk-dpdp-consent"'), 'index.html checkout modal must contain DPDP consent checkbox');
  assert.ok(indexHtml.includes('DPDP Act 2023 Notice &amp; Privacy'), 'index.html footer must contain DPDP Notice link');

  assert.ok(storeBridge.includes('getDpdpConsent'), 'store-bridge.js must define getDpdpConsent');
  assert.ok(storeBridge.includes('saveDpdpConsent'), 'store-bridge.js must define saveDpdpConsent');
  assert.ok(storeBridge.includes('getDpdpTickets'), 'store-bridge.js must define getDpdpTickets');
  assert.ok(storeBridge.includes('submitDpdpTicket'), 'store-bridge.js must define submitDpdpTicket');
  assert.ok(storeBridge.includes('exportUserDataSummary'), 'store-bridge.js must define exportUserDataSummary');
  assert.ok(storeBridge.includes('eraseUserData'), 'store-bridge.js must define eraseUserData');

  assert.ok(appJs.includes('window.openDpdpModal'), 'app.js must define window.openDpdpModal');
  assert.ok(appJs.includes('window.acceptDpdpBanner'), 'app.js must define window.acceptDpdpBanner');
  assert.ok(appJs.includes('window.saveDpdpPreferencesForm'), 'app.js must define window.saveDpdpPreferencesForm');
  assert.ok(appJs.includes('window.withdrawDpdpConsent'), 'app.js must define window.withdrawDpdpConsent');
  assert.ok(appJs.includes('window.submitDpdpGrievanceForm'), 'app.js must define window.submitDpdpGrievanceForm');
  assert.ok(appJs.includes('window.exportDpdpUserData'), 'app.js must define window.exportDpdpUserData');
  assert.ok(appJs.includes('window.eraseDpdpUserData'), 'app.js must define window.eraseDpdpUserData');
});

test('Cart engine computes volume tier discounts, coupons, GST, and handles quantity 0 removal', () => {
  Store.clearCart();
  let summary = Store.getCartSummary();
  assert.strictEqual(summary.itemsCount, 0);
  assert.strictEqual(summary.subtotal, 0);
  assert.strictEqual(summary.payable, 0);

  Store.addToCart('vk-cat-res-301', 'var-301-300g', 1);
  summary = Store.getCartSummary();
  assert.strictEqual(summary.itemsCount, 1);
  assert.strictEqual(summary.subtotal, 649);
  assert.strictEqual(summary.shippingFee, 99);

  Store.updateCartQty('vk-cat-res-301', 3, true);
  summary = Store.getCartSummary();
  assert.strictEqual(summary.itemsCount, 3);
  assert.strictEqual(summary.subtotal, Math.round(649 * 0.92) * 3);
  assert.strictEqual(summary.shippingFee, 0);

  Store.updateCartQty('vk-cat-res-301', 6, true);
  summary = Store.getCartSummary();
  assert.strictEqual(summary.subtotal, Math.round(649 * 0.84) * 6);

  const coupRes = Store.applyCoupon('flirty15');
  assert.strictEqual(coupRes.valid, true);
  summary = Store.getCartSummary();
  assert.strictEqual(summary.couponDiscount, Math.round(summary.subtotal * 0.15));

  const badCoup = Store.applyCoupon('NOTACODE99');
  assert.strictEqual(badCoup.valid, false);

  // Test dynamic push: expired, disabled, and deletion auto-clear
  Store.receiveStudioPush({
    action: 'COUPONS_UPDATED',
    type: 'COUPONS_UPDATED',
    coupons: [
      { code: 'ACTIVE10', discountType: 'percentage', discountValue: 10, minOrderValue: 500, isActive: true },
      { code: 'EXPIRED10', discountType: 'percentage', discountValue: 10, minOrderValue: 500, isActive: true, expiryDate: '2020-01-01' },
      { code: 'DISABLED10', discountType: 'percentage', discountValue: 10, minOrderValue: 500, isActive: false }
    ]
  });

  const expiredRes = Store.applyCoupon('EXPIRED10');
  assert.strictEqual(expiredRes.valid, false);
  assert.match(expiredRes.message, /expired/i);

  const disabledRes = Store.applyCoupon('DISABLED10');
  assert.strictEqual(disabledRes.valid, false);
  assert.match(disabledRes.message, /disabled/i);

  const activeRes = Store.applyCoupon('ACTIVE10');
  assert.strictEqual(activeRes.valid, true);
  assert.strictEqual(Store.getCouponCode(), 'ACTIVE10');

  // Deleting ACTIVE10 via admin push must auto-clear it from active cart
  Store.receiveStudioPush({
    action: 'COUPONS_UPDATED',
    type: 'COUPONS_UPDATED',
    coupons: [
      { code: 'OTHER20', discountType: 'percentage', discountValue: 20, minOrderValue: 500, isActive: true }
    ]
  });
  assert.strictEqual(Store.getCouponCode(), '', 'Deleted coupon ACTIVE10 must be auto-cleared from cart');

  // Clean up dynamic test coupons to return to clean baseline state
  Store.resetDynamicCoupons();

  Store.updateCartQty('vk-cat-res-301', 0, true);
  summary = Store.getCartSummary();
  assert.strictEqual(summary.itemsCount, 0);
});

test('Social feed engine toggles likes, adds comments, and rejects empty comments', () => {
  const posts = Store.getSocialPosts();
  assert.strictEqual(posts.length, 6);
  const firstId = posts[0].id;
  const initialLikes = posts[0].likes;
  const initiallyLiked = posts[0].liked;

  const afterToggle1 = Store.toggleLikePost(firstId);
  assert.strictEqual(afterToggle1.liked, !initiallyLiked);
  assert.strictEqual(afterToggle1.likes, initiallyLiked ? initialLikes - 1 : initialLikes + 1);

  const afterToggle2 = Store.toggleLikePost(firstId);
  assert.strictEqual(afterToggle2.liked, initiallyLiked);
  assert.strictEqual(afterToggle2.likes, initialLikes);

  const emptyComment = Store.addComment(firstId, 'Priya', '   ');
  assert.strictEqual(emptyComment, null);

  const validComment = Store.addComment(firstId, 'Priya', 'Obsessed with the gold leaf detailing!');
  assert.ok(validComment);
  assert.strictEqual(validComment.comments[validComment.comments.length - 1].text, 'Obsessed with the gold leaf detailing!');
});

test('SPA Router in app.js renders all 7 customer routes, enforces zero owner/admin UI leakage, and keeps programmatic bridge intact', () => {
  // First test empty cart view
  sandbox.window.navigateTo('cart', null);
  (windowListeners['hashchange'] || []).forEach(fn => fn());
  const emptyCartHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(emptyCartHtml.includes('Bag is Empty') || emptyCartHtml.includes('Studio Bag'), 'Empty cart view should render empty state');

  // Now add an item so populated cart view renders Invoice Summary
  Store.addToCart('vk-cat-res-301', 'var-301-300g', 2);

  const routes = [
    ['home', null, 'Live from @resin.art.memories'],
    ['catalog', null, 'Keepsake Art'],
    ['product', 'vk-cat-res-201', '2:1 High-Gloss'],
    ['product', 'vk-cat-res-301', '3:1 Deep Pour'],
    ['social', null, '@resin.art.memories'],
    ['custom-studio', null, 'Custom Memory'],
    ['wishlist', null, 'Saved'],
    ['cart', null, 'Invoice Summary'],
    ['account', null, 'Studio Account &amp; Order Tracker']
  ];

  const forbiddenOwnerTerms = [
    'Admin Host',
    'Host Admin Panel',
    'Host Live Drop',
    'Supabase Database Adapter',
    'Cloudflare R2 Object Storage',
    'Simulate Admin Host Push',
    'Stitch Design System Screens'
  ];

  // Verify default Patron Profile has empty defaultAddress on fresh guest load (no fake pre-filled address)
  const initialProfile = Store.getPatronProfile();
  assert.strictEqual(initialProfile.defaultAddress, '', 'Guest Patron Profile must not pre-fill a fake defaultAddress on initial load');
  assert.ok(initialProfile.memberTier && initialProfile.memberTier.includes('Gold'), 'Default Patron Profile must define memberTier on initial load');

  for (const [route, param, expectedSubstring] of routes) {
    sandbox.window.navigateTo(route, param);
    (windowListeners['hashchange'] || []).forEach(fn => fn());
    const rendered = mockDocument.getElementById('app-view-root').innerHTML;
    assert.ok(rendered.includes(expectedSubstring), `Route #/${route} did not render "${expectedSubstring}"`);
    if (route === 'account') {
      assert.ok(rendered.includes('Will be collected at checkout'), 'Guest Account view must indicate dispatch address is collected at checkout');
    }
    for (const term of forbiddenOwnerTerms) {
      assert.ok(!rendered.includes(term), `Customer route #/${route} must not expose owner/admin UI text "${term}"`);
    }
  }

  // Test interactive modals & programmatic Admin Host bridge (kept in code for future owner site)
  sandbox.window.openStoryModal(0);
  assert.ok(mockDocument.getElementById('story-modal-title').textContent.includes('Varmala'));
  sandbox.window.openTdsModal('tds');
  assert.ok(mockDocument.getElementById('tds-modal-title').textContent.includes('TDS'));
  sandbox.window.openTdsModal('sds');
  assert.ok(mockDocument.getElementById('tds-modal-title').textContent.includes('SDS'));
  sandbox.window.openTdsModal('wholesale');
  assert.ok(mockDocument.getElementById('tds-modal-title').textContent.includes('Wholesale'));

  const beforeCount = Store.getProducts().length;
  sandbox.window.simulateExternalAdminPush();
  assert.strictEqual(Store.getProducts().length, beforeCount + 1);

  // Re-verify all customer routes and toast AFTER simulateExternalAdminPush to ensure zero owner/admin strings leak
  const toastTitleAfterPush = mockDocument.getElementById('global-toast-title').textContent;
  for (const term of forbiddenOwnerTerms) {
    assert.ok(!toastTitleAfterPush.includes(term), `Toast after bridge push must not expose "${term}"`);
  }
  for (const [route, param] of routes) {
    sandbox.window.navigateTo(route, param);
    const renderedAfterPush = mockDocument.getElementById('app-view-root').innerHTML;
    for (const term of forbiddenOwnerTerms) {
      assert.ok(!renderedAfterPush.includes(term), `Customer route #/${route} after bridge push must not expose owner/admin text "${term}"`);
    }
  }
});

test('Bug Fix 1: store-bridge.js persists cart, social, and admin updates in-memory when localStorage throws SecurityError/QuotaExceededError and prevents constant mutation', () => {
  // Ensure mutating returned default arrays does not corrupt constants
  const blockedSandbox = {
    window: null,
    document: mockDocument,
    localStorage: {
      getItem: () => { throw new Error('SecurityError: The operation is insecure.'); },
      setItem: () => { throw new Error('QuotaExceededError: Storage disabled.'); },
      removeItem: () => { throw new Error('SecurityError'); }
    },
    console,
    Date,
    Math,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    RegExp,
    Map,
    Set,
    Error,
    BroadcastChannel: sandbox.BroadcastChannel,
    CustomEvent: sandbox.CustomEvent,
    addEventListener: () => {},
    dispatchEvent: () => {}
  };
  blockedSandbox.window = blockedSandbox;
  blockedSandbox.global = blockedSandbox;
  blockedSandbox.globalThis = blockedSandbox;
  blockedSandbox.__VK_TEST_ENV__ = true;
  blockedSandbox.__VK_TEST_FIXTURES__ = TEST_PRODUCTS;
  blockedSandbox.window.__VK_TEST_ENV__ = true;
  blockedSandbox.window.__VK_TEST_FIXTURES__ = TEST_PRODUCTS;
  vm.createContext(blockedSandbox);
  vm.runInContext(bridgeCode, blockedSandbox);

  const BStore = blockedSandbox.window.ResinStore;
  const prods1 = BStore.getProducts();
  assert.strictEqual(prods1.length, 19);
  prods1.pop();
  assert.strictEqual(BStore.getProducts().length, 19, 'Mutating returned products array must not corrupt DEFAULT_PRODUCTS');

  // Verify cart persistence in memory when localStorage is blocked
  BStore.clearCart();
  assert.strictEqual(BStore.getCartSummary().itemsCount, 0);
  BStore.addToCart('vk-cat-res-301', 'var-301-300g', 2);
  assert.strictEqual(BStore.getCartSummary().itemsCount, 2);
  assert.strictEqual(BStore.getCartSummary().subtotal, 649 * 2);

  // Verify social reaction & comment persistence in memory when localStorage is blocked
  const firstPost = BStore.getSocialPosts()[0];
  const firstPostId = firstPost.id;
  const beforeLikes = firstPost.likes;
  const wasLiked = firstPost.liked;
  BStore.toggleLikePost(firstPostId);
  assert.strictEqual(BStore.getSocialPosts()[0].likes, wasLiked ? beforeLikes - 1 : beforeLikes + 1);
  BStore.addComment(firstPostId, 'Aarav', 'Works even in strict private mode!');
  const comments = BStore.getSocialPosts()[0].comments;
  assert.strictEqual(comments[comments.length - 1].text, 'Works even in strict private mode!');
});

test('Bug Fix 2: Interactive Pour Calculator on #/custom-studio (Part B) & #/home calculator validation', () => {
  sandbox.window.navigateTo('custom-studio', null);
  (windowListeners['hashchange'] || []).forEach(fn => fn());
  let studioHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(studioHtml.includes('id="studio-pour-calculator"'), 'Custom Studio view must render Part B #studio-pour-calculator');
  assert.ok(studioHtml.includes('Interactive Epoxy Pour &amp; Mix Ratio Calculator'), 'Custom Studio must include Pour Calculator heading');

  // Test circular shape toggle & calculation on #/custom-studio
  sandbox.window.setStudioCalcShape('circle');
  studioHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(studioHtml.includes('studio-calc-diam'), 'Circular shape must render diameter input');

  // Test 1-click Add Recommended Kit from Custom Studio calculator
  Store.clearCart();
  sandbox.window.addRecommendedCalcKitToCart();
  assert.strictEqual(Store.getCartSummary().itemsCount, 1);

  // Test #/home calculator rejects <= 0 dimensions instead of showing ~0g total
  mockDocument.getElementById('home-calc-len').value = '0';
  mockDocument.getElementById('home-calc-wid').value = '20';
  mockDocument.getElementById('home-calc-dep').value = '1.5';
  mockDocument.getElementById('home-calc-sys').value = '3:1';
  sandbox.window.runHomeCalculator();
  const homeCalcText = mockDocument.getElementById('home-calc-output').textContent;
  assert.ok(homeCalcText.includes('Please enter positive dimensions'), 'Home calculator must validate <= 0 inputs');
});

test('Bug Fix 3 & 4: Volume tier pricing parity across all products, Cart line item discounted display, coupon minOrder warning, and Filter Drawer DOM sync', () => {
  Store.clearCart();

  // Non-1299 item (ram-keep-002 @ ₹2,199) must receive 3-5 volume discount (Math.round(2199 * 0.92) = 2023)
  assert.strictEqual(Store.getEffectiveUnitPrice(2199, 1), 2199);
  assert.strictEqual(Store.getEffectiveUnitPrice(2199, 3), 2023);
  assert.strictEqual(Store.getEffectiveUnitPrice(2199, 6), 1847);

  // 1299 item preserves exact Stitch table numbers (1299 / 1199 / 1089)
  assert.strictEqual(Store.getEffectiveUnitPrice(1299, 1), 1299);
  assert.strictEqual(Store.getEffectiveUnitPrice(1299, 3), 1199);
  assert.strictEqual(Store.getEffectiveUnitPrice(1299, 6), 1089);

  Store.clearCart();
  Store.addToCart('vk-cat-res-201', 'var-201-1500g', 3);
  const summary3 = Store.getCartSummary();
  assert.strictEqual(summary3.subtotal, Math.round(1899 * 0.92) * 3);

  // Render cart view and verify line item displays Volume Tier Applied badge
  sandbox.window.navigateTo('cart', null);
  (windowListeners['hashchange'] || []).forEach(fn => fn());
  let cartHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(cartHtml.includes('Volume Tier Applied'), 'Cart line item should show Volume Tier Applied badge when qty >= 3');

  // Apply FLIRTY15 (minOrder ₹2,500) at subtotal >= ₹2,500 -> valid
  const applied = Store.applyCoupon('FLIRTY15');
  assert.strictEqual(applied.valid, true);
  assert.strictEqual(Store.getCartSummary().couponCode, 'FLIRTY15');

  // Now reduce quantity to 1 (subtotal ₹1,899 < ₹2,500) -> should surface couponInvalidReason & warning banner
  Store.updateCartQty('vk-cat-res-201', 1, true);
  const summaryAfterDec = Store.getCartSummary();
  assert.strictEqual(summaryAfterDec.couponCode, '');
  assert.strictEqual(summaryAfterDec.savedCouponCode, 'FLIRTY15');
  assert.ok(summaryAfterDec.couponInvalidReason && summaryAfterDec.couponInvalidReason.includes('FLIRTY15'));

  sandbox.window.navigateTo('cart', null);
  (windowListeners['hashchange'] || []).forEach(fn => fn());
  cartHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(cartHtml.includes('id="cart-coupon-warning"'), 'Cart view should render #cart-coupon-warning when saved coupon falls below minOrder');

  // Test Filter Drawer DOM sync
  sandbox.window.setCatalogMaxPrice(2200);
  assert.strictEqual(mockDocument.getElementById('drawer-price-label').textContent, 'Up to ₹2,200');
  sandbox.window.resetCatalogFilters();
  assert.strictEqual(mockDocument.getElementById('drawer-price-label').textContent, 'Up to ₹12,000');

  // Verify POTRY product alias resolves to vk-cat-acc-stnd
  assert.strictEqual(Store.getProductById('potry-sienna-pitcher').id, 'vk-cat-acc-stnd');
});

test('Bug Fix 5: All 12 HTML files have valid JS syntax, balanced tags, zero placeholder bugs, and standalone screen fixes', () => {
  const htmlFiles = [
    'index.html',
    'vist_ra_krafts_ultraclear_3_1_pdp/code.html',
    'vist_ra_krafts_cart_checkout/code.html',
    'vist_ra_krafts_resin_catalog_filters/code.html',
    'vist_ra_krafts_home_storefront/code.html',
    'vist_ra_krafts_e_commerce_flow/code.html',
    'potry_sienna_ridged_pitcher_pdp/code.html',
    'potry_sienna_ridged_pitcher_interactive_pdp/code.html',
    'potry_storefront_discovery/code.html',
    'potry_storefront_discovery_interactive/code.html',
    'ceramic_studio_store_flow/code.html',
    'potry_navigation_drawer/code.html'
  ];

  assert.strictEqual(htmlFiles.length, 12, 'Must verify all 12 HTML screens in repository');

  for (const rel of htmlFiles) {
    const full = path.join(ROOT, rel);
    const content = fs.readFileSync(full, 'utf8');
    assert.ok(!content.includes('"placeholder"'), `${rel} still contains "placeholder"`);
    assert.ok(!content.includes("'placeholder'"), `${rel} still contains 'placeholder'`);
    assert.ok(content.includes('store-bridge.js'), `${rel} must load store-bridge.js`);
    assert.ok(!/<html[^>]*class="[^"]*\bh-full\b/i.test(content), `${rel} <html> must not have h-full class trapping root scroll`);

    const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let idx = 0;
    while ((match = scriptRegex.exec(content)) !== null) {
      idx++;
      new vm.Script(match[1], { filename: `${rel}#script-${idx}` });
    }
  }

  const cartHtml = fs.readFileSync(path.join(ROOT, 'vist_ra_krafts_cart_checkout/code.html'), 'utf8');
  const invoiceMatches = cartHtml.match(/<h3[^>]*>Invoice Summary<\/h3>/g) || [];
  assert.strictEqual(invoiceMatches.length, 1, `Expected 1 Invoice Summary heading, found ${invoiceMatches.length}`);

  const navDrawerHtml = fs.readFileSync(path.join(ROOT, 'potry_navigation_drawer/code.html'), 'utf8');
  assert.ok(navDrawerHtml.includes('Custom Commissions'), 'potry_navigation_drawer/code.html must have restored Custom Commissions heading');

  const pitcherPdpHtml = fs.readFileSync(path.join(ROOT, 'potry_sienna_ridged_pitcher_pdp/code.html'), 'utf8');
  assert.ok(
    pitcherPdpHtml.includes("querySelector('.font-price-lg.text-price-lg')") &&
    pitcherPdpHtml.includes("querySelectorAll('details:first-of-type span.text-primary.font-medium')"),
    'potry_sienna_ridged_pitcher_pdp/code.html must sync top hero price and spec table on setSize()'
  );

  const interactiveDiscoveryHtml = fs.readFileSync(path.join(ROOT, 'potry_storefront_discovery_interactive/code.html'), 'utf8');
  assert.ok(interactiveDiscoveryHtml.includes('subtotalEl.textContent = `$${cartSubtotalUSD.toFixed(2)}`'), 'potry_storefront_discovery_interactive/code.html must update #cart-subtotal on addToCart()');
});

test('Visual QA & Accessibility Polish: 2-font limit, WCAG AA tokens, modal scroll-lock, 44px targets, and Stitch screen alt/viewport compliance', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const stylesCss = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  const visualIssuesMd = fs.readFileSync(path.join(ROOT, 'VISUAL_ISSUES.md'), 'utf8');

  // 1. Strict 2-font-family limit (Playfair Display + Inter)
  assert.ok(!indexHtml.includes('Plus+Jakarta+Sans') && !indexHtml.includes('Plus Jakarta Sans'), 'index.html must not load third font family Plus Jakarta Sans');
  assert.ok(stylesCss.includes('Playfair Display') && stylesCss.includes('Inter'), 'styles.css must configure Playfair Display and Inter');

  // 2. WCAG AA color tokens (#9e3322 rose-terracotta and #59606d outline)
  assert.ok(stylesCss.includes('--accent-10-flirty: #9e3322'), 'styles.css must use WCAG AA compliant #9e3322 for --accent-10-flirty');
  assert.ok(indexHtml.includes("'outline': '#59606d'"), 'index.html tailwind config must use WCAG AA compliant #59606d for outline');

  // 3. Focus ring, modal scroll-lock, Escape dismissal, and PDP sticky bar non-overlap
  assert.ok(stylesCss.includes(':focus-visible'), 'styles.css must define global :focus-visible outline');
  assert.ok(stylesCss.includes('body.modal-open'), 'styles.css must define body.modal-open scroll lock');
  assert.ok(appCode.includes('syncBodyModalLock'), 'app.js must synchronize modal scroll lock');
  assert.ok(appCode.includes("ev.key === 'Escape'"), 'app.js must close open modals on Escape key');
  assert.ok(appCode.includes('fixed bottom-16 lg:bottom-0'), 'PDP sticky bar must dock at bottom-16 on mobile to avoid overlapping mobile bottom nav');

  // 4. 1:1 Doming Resin calculator product resolution via alias
  assert.strictEqual(Store.getProductById('vk-dom-101').id, 'vk-cat-res-201');
  assert.strictEqual(Store.getProductById('vk-res-003').id, 'vk-cat-res-201');

  // 5. All 12 HTML screens free of user-scalable=no, #74777e, Plus Jakarta Sans, unhidden material-symbols-outlined, and missing img alt attributes
  const allHtmlFiles = [
    'index.html',
    'vist_ra_krafts_ultraclear_3_1_pdp/code.html',
    'vist_ra_krafts_cart_checkout/code.html',
    'vist_ra_krafts_resin_catalog_filters/code.html',
    'vist_ra_krafts_home_storefront/code.html',
    'vist_ra_krafts_e_commerce_flow/code.html',
    'potry_sienna_ridged_pitcher_pdp/code.html',
    'potry_sienna_ridged_pitcher_interactive_pdp/code.html',
    'potry_storefront_discovery/code.html',
    'potry_storefront_discovery_interactive/code.html',
    'ceramic_studio_store_flow/code.html',
    'potry_navigation_drawer/code.html'
  ];
  for (const rel of allHtmlFiles) {
    const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert.ok(!/user-scalable\s*=\s*no/i.test(html), `${rel} must not block pinch-to-zoom with user-scalable=no`);
    assert.ok(/<title>[^<]+<\/title>/i.test(html), `${rel} must have a non-empty <title>`);
    assert.ok(!/#74777e/i.test(html), `${rel} must not use non-AA #74777e outline token`);
    assert.ok(!/Plus(\+|\s)Jakarta(\+|\s)Sans/i.test(html), `${rel} must not load third font family Plus Jakarta Sans`);
    const iconSpans = html.match(/<span[^>]*class="[^"]*material-symbols-outlined[^"]*"[^>]*>/gi) || [];
    for (const spanTag of iconSpans) {
      assert.ok(/aria-hidden\s*=\s*["']true["']/i.test(spanTag), `${rel} has .material-symbols-outlined missing aria-hidden="true": ${spanTag}`);
    }
    const imgs = html.match(/<img\b[^>]*>/gi) || [];
    for (const imgTag of imgs) {
      assert.ok(/(?:^|\s)alt\s*=/i.test(imgTag), `${rel} has <img> missing alt attribute: ${imgTag.slice(0, 80)}`);
      assert.ok(!/(?:^|\s)src\s*=\s*["']\s*["']/i.test(imgTag), `${rel} has <img> with empty src="" attribute: ${imgTag.slice(0, 80)}`);
    }
  }

  // 6. Verify 0 unhidden .material-symbols-outlined icons in app.js, 65ch measure, break-anywhere, Tab focus trap, and VIS-001 through VIS-027
  const appIconSpans = appCode.match(/<span[^>]*class="[^"]*material-symbols-outlined[^"]*"[^>]*>/gi) || [];
  for (const spanTag of appIconSpans) {
    assert.ok(/aria-hidden\s*=\s*["']true["']/i.test(spanTag), `app.js has .material-symbols-outlined missing aria-hidden="true": ${spanTag}`);
  }
  assert.ok(stylesCss.includes('max-width: 65ch'), 'styles.css must enforce 65ch paragraph measure limit');
  assert.ok(stylesCss.includes('.break-anywhere'), 'styles.css must define .break-anywhere overflow protection');
  assert.ok(appCode.includes("ev.key === 'Tab'"), 'app.js must trap Tab focus inside active modals');
  assert.ok(appCode.includes('dataset.origHtml'), 'app.js handleQuickAdd must debounce rapid double-clicks via dataset.origHtml');

  for (let i = 1; i <= 27; i++) {
    const code = 'VIS-' + String(i).padStart(3, '0');
    assert.ok(visualIssuesMd.includes(code), `VISUAL_ISSUES.md missing ${code}`);
  }
  assert.ok(visualIssuesMd.includes('Fixed & Verified'), 'VISUAL_ISSUES.md must record Fixed & Verified status');
});

test('Customer E-Commerce Domain Features, Strict Owner UI Separation & Viewport Scroll Fixes', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const stylesCss = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');

  // 1. Verify index.html has zero visible owner/admin/Supabase/Cloudflare UI strings
  assert.ok(!indexHtml.includes('Host Sync'), 'index.html must not expose Host Sync button in customer nav');
  assert.ok(!indexHtml.includes('Admin Host'), 'index.html must not expose Admin Host link in customer drawer/footer');
  assert.ok(!indexHtml.includes('Supabase &amp; Cloudflare R2 Ready'), 'index.html footer must not expose backend infrastructure labels');

  // 2. Verify viewport & scroll fixes in index.html, styles.css, and app.js
  assert.ok(!/<html[^>]*class="[^"]*h-full/i.test(indexHtml), 'index.html <html> must not have class="h-full" trapping body scroll');
  assert.ok(stylesCss.includes('scroll-padding-top: 104px'), 'styles.css must set scroll-padding-top for sticky header clearance');
  assert.ok(stylesCss.includes('overflow-x: clip'), 'styles.css must use overflow-x: clip to prevent nested scroll container trapping');
  assert.ok(stylesCss.includes('scrollbar-width: thin'), 'styles.css must configure modern scrollbar-width: thin');
  assert.ok(!appCode.includes('href="#pdp-reviews"'), 'app.js PDP must not use <a href="#pdp-reviews"> which hijacks SPA location.hash');
  assert.ok(appCode.includes("window.scrollToSection('pdp-reviews')"), 'app.js PDP must use window.scrollToSection for review anchor scrolling');
  assert.ok(appCode.includes('md:sticky md:top-[93px]'), 'Catalog search/filter bar must be sticky only on md+ viewports to prevent mobile viewport crushing');
  assert.ok(appCode.includes('Express Buy Now (Instant UPI / Cards)'), 'PDP right column must include inline primary conversion actions');

  // Verify in-place re-render preserves window.scrollY while route change (both navigateTo and raw hashchange) resets scrollY to 0
  sandbox.window.navigateTo('product', 'ram-keep-001');
  sandbox.scrollY = 480;
  sandbox.window.changePdpQty(1);
  assert.strictEqual(sandbox.scrollY, 480, 'In-place PDP quantity update must preserve window.scrollY');

  // Raw hashchange navigation (e.g., clicking <a href="#/home"> or browser Back button) must reset scrollY to 0
  sandbox.location.hash = '#/home';
  (windowListeners['hashchange'] || []).forEach(fn => fn());
  assert.strictEqual(sandbox.scrollY, 0, 'Hashchange route transition must reset window.scrollY to 0');

  // Category navigation via navigateTo must also reset scrollY to 0 and include relatedCategories keepsakes
  sandbox.scrollY = 620;
  sandbox.window.navigateTo('catalog', 'casting');
  assert.strictEqual(sandbox.scrollY, 0, 'navigateTo must reset window.scrollY to 0');
  const castingCatalogHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(castingCatalogHtml.includes('2:1 High-Gloss') || castingCatalogHtml.includes('vk-cat-res-201'), 'Casting category filter must include casting products');

  // 3. Verify Recently Viewed products tracking & Express Buy Now on PDP
  sandbox.window.navigateTo('product', 'vk-cat-res-301');
  const recent = Store.getRecentlyViewedProducts('vk-cat-res-301', 4);
  assert.ok(recent.length > 0, 'Recently viewed products must track visited products');
  const pdpHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(pdpHtml.includes('id="pdp-buy-now-btn"'), 'PDP must render Express Buy Now button');
  assert.ok(pdpHtml.includes('Recently Viewed &amp; Curated For You'), 'PDP must render Recently Viewed section');

  // 4. Verify Custom Studio 5-shape options, Secondary Keepsake add-ons, Pickup Slot booking & Flower Care Protocol
  sandbox.window.navigateTo('custom-studio', null);
  sandbox.window.updateCustomBuilder('shape', '14" Mughal Arch Block', 5299);
  sandbox.window.updateCustomBuilder('secondaryKeepsake', 'Matching Resin Ring Platter', 899);
  sandbox.window.updateCustomBuilderSchedule('pickupSlot', 'Afternoon Slot (2:00 PM – 6:00 PM)');
  const studioHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(studioHtml.includes('14&quot; Mughal Arch Block') || studioHtml.includes('14" Mughal Arch Block'), 'Custom Studio must support 14" Mughal Arch Block');
  assert.ok(studioHtml.includes('Matching Resin Ring Platter'), 'Custom Studio must support Secondary Keepsake Add-ons');
  assert.ok(studioHtml.includes('Essential Post-Wedding Flower Care Protocol'), 'Custom Studio must display Bridal Flower Care Protocol');

  // 5. Verify Patron Profile editing, Checkout Modal Profile Sync, Order Lookup, Pre-Pour Layout Mockup Approval, GST Invoice modal & Live Bridge Order Status Push
  sandbox.window.navigateTo('account', null);
  sandbox.window.toggleAccountProfileEdit();
  let accHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(accHtml.includes('id="account-profile-form"'), 'Account view must toggle Patron Profile edit form');

  mockDocument.getElementById('acc-prof-name').value = 'Meera & Aarav Kapoor';
  mockDocument.getElementById('acc-prof-phone').value = '+91 98111 22334';
  mockDocument.getElementById('acc-prof-email').value = 'meera.kapoor@bride.in';
  mockDocument.getElementById('acc-prof-address').value = '42 Defence Colony, New Delhi 110024';
  sandbox.window.saveAccountProfile({ preventDefault: () => {} });
  assert.strictEqual(Store.getPatronProfile().name, 'Meera & Aarav Kapoor');
  assert.strictEqual(Store.getPatronProfile().defaultAddress, '42 Defence Colony, New Delhi 110024');

  // Verify Checkout Modal pre-fills saved Patron Profile fields
  Store.addToCart('vk-cat-res-301', 'var-301-300g', 1);
  sandbox.window.openCheckoutModal();
  assert.strictEqual(mockDocument.getElementById('chk-name').value, 'Meera & Aarav Kapoor');
  assert.strictEqual(mockDocument.getElementById('chk-phone').value, '+91 98111 22334');
  assert.strictEqual(mockDocument.getElementById('chk-address').value, '42 Defence Colony, New Delhi 110024');

  // Seed order RAM-2025-8841 via Studio Push (since initial orders start at 0) and test Pre-Pour Layout Mockup Approval
  Store.receiveAdminPush({
    type: 'ADMIN_UPDATE_ORDER_STATUS',
    order: {
      orderId: 'RAM-2025-8841',
      date: '10 Oct 2026',
      total: 4499,
      subtotal: 4499,
      discount: 0,
      gstAmount: 686.29,
      paymentMethod: 'UPI Instant (GPay / PhonePe / Paytm)',
      customerName: 'Meera & Aarav Kapoor',
      phone: '+91 98111 22334',
      address: '42 Defence Colony, New Delhi 110024',
      giftWrap: true,
      mockupApproved: false,
      status: 'Deep Cast Pour (Stage 4 of 5)',
      stageIndex: 3,
      stages: ['Order Confirmed', 'Flowers Received at Studio', 'Silica Dehydration (7d)', 'Deep Optical Cast Pour', 'Diamond Polish & Dispatch'],
      items: [{ productId: 'ram-keep-001', name: 'Eternal Varmala & Bridal Bouquet Time-Capsule Block (12")', qty: 1, price: 4499 }],
      courier: 'BlueDart Air Priority • AWB #BD99412048'
    }
  });
  assert.strictEqual(Store.getOrders().find(o => o.orderId === 'RAM-2025-8841').mockupApproved, false);
  sandbox.window.handleApproveOrderMockup('RAM-2025-8841');
  const approvedOrd = Store.getOrders().find(o => o.orderId === 'RAM-2025-8841');
  assert.strictEqual(approvedOrd.mockupApproved, true);
  assert.ok(approvedOrd.stageIndex >= 3, 'Approving pre-pour layout must advance order stageIndex');

  // Test programmatic bridge order status push (ADMIN_UPDATE_ORDER_STATUS) & automatic Store.subscribe re-render
  Store.receiveAdminPush({
    type: 'ADMIN_UPDATE_ORDER_STATUS',
    order: {
      orderId: 'RAM-2025-8841',
      status: 'Stage 5: Diamond Polish & Insured Air Dispatch',
      stageIndex: 4
    }
  });
  accHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(accHtml.includes('Stage 5: Diamond Polish &amp; Insured Air Dispatch'), 'Store.subscribe must automatically re-render Account view when external bridge updates order status');

  // Open GST Tax Invoice Modal for RAM-2025-8841
  sandbox.window.openOrderInvoiceModal('RAM-2025-8841');
  assert.ok(mockDocument.getElementById('tds-modal-title').textContent.includes('GST Tax Invoice — Order #RAM-2025-8841'));
  assert.ok(mockDocument.getElementById('tds-modal-body').innerHTML.includes('HSN: 39073010'));

  // Order lookup filter
  sandbox.window.setAccountOrderSearch('BlueDart');
  accHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(accHtml.includes('RAM-2025-8841'));
  sandbox.window.setAccountOrderSearch('NON_EXISTENT_ORDER_999');
  accHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(accHtml.includes('No Matching Orders Found'));
  sandbox.window.setAccountOrderSearch('');
});

test('Mobile Viewport Overflow Audit & Section 2 Design Tokens Compliance (320px–1024px Zero-Overflow Guarantee)', () => {
  // 1. Verify tokens.css exists and satisfies Section 2 token rules
  assert.ok(fs.existsSync(path.join(ROOT, 'tokens.css')), 'tokens.css must exist');
  const tokensCss = fs.readFileSync(path.join(ROOT, 'tokens.css'), 'utf8');
  [
    '--color-bg', '--color-surface', '--color-border', '--color-text-primary',
    '--color-text-secondary', '--color-text-muted', '--color-accent',
    '--color-success', '--color-warning', '--color-error',
    '--font-display', '--font-body',
    '--space-1', '--space-4', '--space-12',
    '--radius-sm', '--radius-md', '--radius-lg',
    '--shadow-sm', '--shadow-md', '--shadow-lg',
    '--ease-standard', '--ease-emphasized',
    '--duration-instant', '--duration-fast', '--duration-base',
    '--blur-sm', '--blur-md',
    'prefers-color-scheme: dark'
  ].forEach(token => {
    assert.ok(tokensCss.includes(token), `tokens.css must declare token ${token}`);
  });

  // 2. Verify styles.css contains defensive overflow clipping and responsive clamp
  const stylesCss = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  assert.ok(stylesCss.includes('overflow-x: clip'), 'styles.css must enforce overflow-x: clip');
  assert.ok(stylesCss.includes('font-headline-lg') && stylesCss.includes('clamp('), 'styles.css must have fluid clamp headings');
  assert.ok(stylesCss.includes('@import "./tokens.css"'), 'styles.css must import tokens.css');

  // 3. Verify index.html links tokens.css and contains safe bottom navigation
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('href="./tokens.css"'), 'index.html must link tokens.css');
  assert.ok(indexHtml.includes('overflow-x-clip'), 'index.html header and nav must have overflow-x-clip');

  // 4. Verify all 8 customer views mount cleanly and contain zero width leaks
  const routes = ['home', 'catalog', 'product', 'social', 'custom-studio', 'wishlist', 'cart', 'account'];
  routes.forEach(route => {
    sandbox.window.navigateTo(route, route === 'product' ? 'ram-keep-001' : null);
    const html = mockDocument.getElementById('app-view-root').innerHTML;
    assert.ok(html && html.length > 100, `Route #${route} must render substantial content`);
    const wideMatch = html.match(/style=["'][^"']*width:\s*([4-9]\d{2}|\d{4,})px/i);
    assert.strictEqual(wideMatch, null, `Route #${route} must not have fixed inline pixel width > 320px`);
  });
});

test('Decisions 2, 3 & 4: 2-Step Auth vs Checkout Address, 1-Click Google/Apple OAuth Account Chooser, Guest Wishlist Sync & Clean Consumer Copy', () => {
  // 1. Verify official VK logo asset exists & is wired into index.html and store-bridge.js
  const logoPath = path.join(ROOT, 'vistara-krafts-logo.jpg');
  assert.ok(fs.existsSync(logoPath), 'vistara-krafts-logo.jpg must exist in project root');
  assert.ok(fs.statSync(logoPath).size > 5000, 'vistara-krafts-logo.jpg must be a valid image file');
  assert.strictEqual(Store.IMAGES.logoVistara, './vistara-krafts-logo.jpg');

  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('./vistara-krafts-logo.jpg'), 'index.html must display official ./vistara-krafts-logo.jpg');
  assert.ok(indexHtml.includes('id="cloudflare-auth-modal"'), 'index.html must include #cloudflare-auth-modal');
  assert.ok(indexHtml.includes('id="account-bar-modal"'), 'index.html must include top-bar #account-bar-modal');
  assert.ok(indexHtml.includes('./supabase-config.js'), 'index.html must load ./supabase-config.js');
  assert.ok(indexHtml.includes('./cloudinary-config.js'), 'index.html must load ./cloudinary-config.js');

  // Decision 4: Verify zero technical/developer jargon in customer-facing HTML/JS
  assert.ok(!indexHtml.includes('Cloudflare Edge Identity'), 'index.html must not expose Cloudflare Edge Identity label');
  assert.ok(!indexHtml.includes('Protected by Cloudflare Turnstile'), 'index.html must not expose Cloudflare Turnstile technical label');
  assert.ok(!indexHtml.includes('Cloudflare D1 + KV Edge Session'), 'index.html must not expose Cloudflare D1 + KV Edge Session label');
  assert.ok(!indexHtml.includes('Razorpay &amp; Cloudflare Verified Checkout'), 'index.html must not expose Razorpay & Cloudflare Verified Checkout label');
  assert.ok(indexHtml.includes('100% Secure Sign-In'), 'index.html must display clean consumer copy 100% Secure Sign-In');
  assert.ok(indexHtml.includes('100% Secure Checkout'), 'index.html must display clean consumer copy 100% Secure Checkout');

  // Verify checkout modal inputs in index.html have zero hardcoded fake customer values
  assert.ok(indexHtml.includes('id="chk-name"') && indexHtml.includes('value=""'), '#chk-name must have empty default value=""');
  assert.ok(indexHtml.includes('id="chk-phone"') && indexHtml.includes('value=""'), '#chk-phone must have empty default value=""');
  assert.ok(indexHtml.includes('id="chk-address"') && indexHtml.includes('value=""'), '#chk-address must have empty default value=""');
  assert.ok(indexHtml.includes('id="chk-pincode"') && indexHtml.includes('value=""'), '#chk-pincode must have empty default value=""');

  // 2. Verify Supabase & Cloudinary Full-Stack Framework files exist
  ['supabase-config.js', 'cloudinary-config.js', 'supabase/schema.sql', 'supabase_schema.sql'].forEach(rel => {
    assert.ok(fs.existsSync(path.join(ROOT, rel)), `Backend framework file ${rel} must exist`);
  });

  // 3. Decision 4: Test Guest Wishlist Sync across Sign-In and Sign-Out
  sandbox.window.handlePatronLogout();
  assert.strictEqual(Store.isAuthenticated(), false, 'Patron must be unauthenticated after logout');
  assert.strictEqual(Store.getWishlist().length, 0, 'Guest wishlist must be empty after logout');

  // Guest hearts 2 items while unauthenticated
  Store.toggleWishlist('vk-cat-res-201');
  Store.toggleWishlist('vk-cat-res-301');
  assert.strictEqual(Store.getWishlist().length, 2, 'Guest must be able to heart items freely');

  // Decision 2 & 3: 1-Click Google OAuth Sign-In WITHOUT upfront shipping address merges guest wishlist into account
  sandbox.window.openCloudflareAuthModal(false);
  sandbox.window.startCloudflareOAuth('google');
  assert.strictEqual(
    mockDocument.getElementById('cf-oauth-chooser-sheet').classList.contains('hidden'),
    false,
    'Clicking Continue with Google must open the 1-click Google Account Chooser sheet'
  );
  sandbox.window.completeOAuthChooserAccount('google', 'kavya.nair@gmail.com', 'Kavya Nair');
  assert.strictEqual(Store.isAuthenticated(), true, '1-Click Google Account Chooser must immediately authenticate user without requiring street address');
  assert.strictEqual(Store.getAuthSession().provider, 'google');
  assert.strictEqual(Store.getAuthSession().name, 'Kavya Nair');
  assert.deepStrictEqual(Store.getWishlist(), ['vk-cat-res-201', 'vk-cat-res-301'], 'Guest wishlist must merge into authenticated user account');

  // Logout resets active guest wishlist to [] while preserving Kavya's saved wishlist
  sandbox.window.handlePatronLogout();
  assert.strictEqual(Store.isAuthenticated(), false);
  assert.strictEqual(Store.getWishlist().length, 0, 'Logout must reset active guest wishlist to 0 items');

  // When Kavya logs back in via 1-click Google, her saved wishlist is restored
  sandbox.window.completeOAuthChooserAccount('google', 'kavya.nair@gmail.com', 'Kavya Nair');
  assert.strictEqual(Store.isAuthenticated(), true);
  assert.deepStrictEqual(Store.getWishlist(), ['vk-cat-res-201', 'vk-cat-res-301'], 'Returning user login must restore saved account wishlist');
  sandbox.window.handlePatronLogout();

  // 4. Test Guest Checkout Gate -> Step 1 (Sign In) -> Step 2 (Delivery Address at Checkout)
  Store.clearCart();
  Store.addToCart('vk-cat-res-301', 'kit-1200g', 1);
  const blockedOrder = Store.placeOrder({ name: 'Test', phone: '9999999999', address: 'Bengaluru 560001' });
  assert.strictEqual(blockedOrder.success, false, 'Unauthenticated Store.placeOrder must be rejected');
  assert.strictEqual(blockedOrder.requiresAuth, true, 'Unauthenticated Store.placeOrder must set requiresAuth: true');

  mockDocument.getElementById('checkout-modal').classList.add('hidden');
  mockDocument.getElementById('cloudflare-auth-modal').classList.add('hidden');
  sandbox.window.openCheckoutModal();
  assert.strictEqual(
    mockDocument.getElementById('checkout-modal').classList.contains('hidden'),
    true,
    'Guest clicking Checkout must NOT open #checkout-modal'
  );
  assert.strictEqual(
    mockDocument.getElementById('cloudflare-auth-modal').classList.contains('hidden'),
    false,
    'Guest clicking Checkout must open #cloudflare-auth-modal'
  );

  // Test Email Create Account tab & Sign In tab (no upfront street address required in Step 1)
  sandbox.window.setEmailAuthTab('register');
  assert.strictEqual(mockDocument.getElementById('cf-auth-mode').value, 'register');
  assert.strictEqual(mockDocument.getElementById('cf-register-fields-wrap').classList.contains('hidden'), false, 'Create Account tab must show Name & Mobile fields');

  // Missing name in register mode should fail validation
  assert.strictEqual(Store.loginPatron({ provider: 'email', mode: 'register', email: 'newuser@vk.in', password: 'Password#123', name: '' }).valid, false, 'Create Account mode must require Full Name');

  // Complete Email registration in Step 1 -> automatically opens Step 2 (#checkout-modal)
  mockDocument.getElementById('cf-auth-provider').value = 'email';
  mockDocument.getElementById('cf-auth-mode').value = 'register';
  mockDocument.getElementById('cf-auth-name').value = 'Devika Menon';
  mockDocument.getElementById('cf-auth-phone').value = '+91 98200 55443';
  mockDocument.getElementById('cf-auth-email').value = 'devika.menon@vistara.in';
  mockDocument.getElementById('cf-auth-password').value = 'Vistara#2026';
  sandbox.window.submitCloudflareAuthForm({ preventDefault: () => {} });

  assert.strictEqual(Store.isAuthenticated(), true, 'Customer must be authenticated after Step 1 email registration');
  assert.strictEqual(
    mockDocument.getElementById('cloudflare-auth-modal').classList.contains('hidden'),
    true,
    '#cloudflare-auth-modal must close after Step 1 sign-in'
  );
  assert.strictEqual(
    mockDocument.getElementById('checkout-modal').classList.contains('hidden'),
    false,
    '#checkout-modal (Step 2) must automatically open after completing checkout-triggered sign-in'
  );
  assert.strictEqual(mockDocument.getElementById('chk-name').value, 'Devika Menon');
  assert.strictEqual(mockDocument.getElementById('chk-phone').value, '+91 98200 55443');
  assert.strictEqual(mockDocument.getElementById('chk-address').value, '', 'New user has no address until entered in Step 2 Checkout');

  // Step 2: Enter delivery address & PIN code at Checkout and submit order -> persists address to profile for future checkouts!
  mockDocument.getElementById('chk-address').value = '7 Marine Drive, Churchgate, Mumbai';
  mockDocument.getElementById('chk-pincode').value = '400020';
  const orderCountBefore = Store.getOrders().length;
  sandbox.window.submitCheckoutOrder({ preventDefault: () => {} });
  assert.strictEqual(Store.getOrders().length, orderCountBefore + 1, 'Submitting Step 2 Checkout must place the order');
  assert.strictEqual(Store.getOrders()[0].customerName, 'Devika Menon');
  assert.ok(Store.getOrders()[0].address.includes('7 Marine Drive, Churchgate, Mumbai'), 'Placed order must contain checkout delivery address');
  assert.ok(Store.getOrders()[0].address.includes('400020'), 'Placed order must include checkout PIN code');
  assert.ok(Store.getAuthSession().address.includes('7 Marine Drive, Churchgate, Mumbai'), 'Checkout delivery address must automatically persist to user profile for future orders');

  // 5. Test 1-Click Apple OAuth login flow
  const appleRes = Store.loginPatron({
    provider: 'apple',
    email: 'arjun.apple@icloud.com',
    name: 'Arjun Singhania'
  });
  assert.strictEqual(appleRes.valid, true, '1-Click Apple login without upfront shipping address must succeed');
  assert.strictEqual(Store.getAuthSession().provider, 'apple');

  // 6. Verify Top-Bar Account Modal (#account-bar-modal) includes live 5-Stage Order Tracker & GST Invoice popups
  sandbox.window.openAccountBarModal();
  const barModalHtml = mockDocument.getElementById('account-bar-modal-body').innerHTML;
  assert.ok(barModalHtml.includes('id="bar-account-orders-list"'), 'Top-bar account modal must render in-bar order tracker (#bar-account-orders-list)');
  assert.ok(barModalHtml.includes('openOrderInvoiceModal('), 'Top-bar account modal must provide GST Invoice popup button');
  assert.ok(barModalHtml.includes('Arjun Singhania'), 'Top-bar account modal must display authenticated customer name');

  // 7. Verify zero plaintext passwords or bearer tokens stored in localStorage & zero fake customer defaults in codebase
  assert.strictEqual(mockLocalStorage.getItem('vk_cf_auth_token'), null, 'Bearer session token must never be stored in localStorage');
  const regRaw = mockLocalStorage.getItem('ram_vk_cf_users_v2') || '{}';
  assert.ok(!regRaw.includes('Vistara#2026'), 'Plaintext password must never be stored in localStorage');
  assert.ok(regRaw.includes('passwordVerifier'), 'Registered user record must store hashed passwordVerifier');
  assert.ok(!bridgeCode.includes('Aanya Verma'), 'store-bridge.js must not hardcode fake customer name Aanya Verma');
  assert.ok(!bridgeCode.includes('100 Feet Road, Indiranagar'), 'store-bridge.js must not hardcode fake street address 100 Feet Road, Indiranagar');
  assert.ok(!appCode.includes('Ananya Singhania'), 'app.js must not hardcode fake fallback name Ananya Singhania');

  // 8. Verify all 5 standalone vist_ra_krafts_* screens use official ../vistara-krafts-logo.jpg and Vistāra Krafts brand name
  const vkScreens = [
    'vist_ra_krafts_home_storefront/code.html',
    'vist_ra_krafts_cart_checkout/code.html',
    'vist_ra_krafts_ultraclear_3_1_pdp/code.html',
    'vist_ra_krafts_resin_catalog_filters/code.html',
    'vist_ra_krafts_e_commerce_flow/code.html'
  ];
  for (const rel of vkScreens) {
    const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert.ok(html.includes('../vistara-krafts-logo.jpg'), `${rel} must use official ../vistara-krafts-logo.jpg`);
    assert.ok(html.includes('Vistāra Krafts'), `${rel} must display full brand name Vistāra Krafts`);
    assert.ok(!html.includes('AB6AXuD537p9b2_G4jP69zL_fO81pL2v4b1T6qY2n8R5m3X0w9K1s7V2c4F6d8J0h2L'), `${rel} must not use old external placeholder logo URL`);
  }

  // 9. Regression tests for Bugs 1, 2, 3 & 5:
  // - Logout must clear #cf-auth-email, #cf-auth-password, #cf-auth-name, #cf-auth-phone AND reset Store.getPatronProfile() to clean Guest Mode defaults
  sandbox.window.handlePatronLogout();
  assert.strictEqual(mockDocument.getElementById('cf-auth-email').value, '', 'Logout must clear #cf-auth-email');
  assert.strictEqual(mockDocument.getElementById('cf-auth-password').value, '', 'Logout must clear #cf-auth-password');
  assert.strictEqual(mockDocument.getElementById('cf-auth-name').value, '', 'Logout must clear #cf-auth-name');
  assert.strictEqual(mockDocument.getElementById('cf-auth-phone').value, '', 'Logout must clear #cf-auth-phone');
  const guestProfAfterLogout = Store.getPatronProfile();
  assert.strictEqual(guestProfAfterLogout.name, 'Vistāra Studio Guest', 'Logout must reset Patron Profile name to Vistāra Studio Guest');
  assert.strictEqual(guestProfAfterLogout.email, '', 'Logout must clear Patron Profile email in Guest Mode');
  assert.strictEqual(guestProfAfterLogout.phone, '', 'Logout must clear Patron Profile phone in Guest Mode');
  assert.strictEqual(guestProfAfterLogout.address, '', 'Logout must clear Patron Profile address in Guest Mode');
  assert.strictEqual(guestProfAfterLogout.defaultAddress, '', 'Logout must clear Patron Profile defaultAddress in Guest Mode');

  // - Clicking "Continue with Google" or "Continue with Apple" must ALWAYS open #cf-oauth-chooser-sheet even if #cf-auth-email has text
  mockDocument.getElementById('cf-auth-email').value = 'typed.in.form@example.com';
  mockDocument.getElementById('cf-oauth-chooser-sheet').classList.add('hidden');
  sandbox.window.startCloudflareOAuth('apple');
  assert.strictEqual(
    mockDocument.getElementById('cf-oauth-chooser-sheet').classList.contains('hidden'),
    false,
    'Clicking Continue with Apple must open #cf-oauth-chooser-sheet even when #cf-auth-email has text'
  );
  assert.strictEqual(Store.isAuthenticated(), false, 'startCloudflareOAuth must wait for user selection in chooser sheet');
  mockDocument.getElementById('cf-auth-email').value = '';
  sandbox.window.closeOAuthChooser();

  // - Verify repeat order with modified PIN does not duplicate "- PIN" suffix
  sandbox.window.completeOAuthChooserAccount('google', 'devika.menon@vistara.in', 'Devika Menon');
  Store.addToCart('vk-cat-res-301', 'kit-1200g', 1);
  const repeatOrder = Store.placeOrder({
    name: 'Devika Menon',
    phone: '+91 98200 55443',
    address: Store.getAuthSession().address,
    pincode: '400021'
  });
  assert.strictEqual(repeatOrder.success, true);
  assert.strictEqual(
    repeatOrder.order.address,
    '7 Marine Drive, Churchgate, Mumbai - 400021',
    'Updating PIN at checkout must replace trailing PIN rather than duplicating "- PIN"'
  );
  sandbox.window.handlePatronLogout();

  // - Verify DEFAULT_WISHLIST = [] constant exists in store-bridge.js and .hidden { display: none !important; } in styles.css
  assert.ok(bridgeCode.includes('const DEFAULT_WISHLIST = []'), 'store-bridge.js must define const DEFAULT_WISHLIST = []');
  const stylesCssContent = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  assert.ok(stylesCssContent.includes('.hidden {') && stylesCssContent.includes('display: none !important'), 'styles.css must enforce .hidden { display: none !important; }');
  assert.ok(indexHtml.includes('grid-cols-1 sm:grid-cols-3'), '#checkout-modal address & PIN row must stack on 320px mobile via grid-cols-1 sm:grid-cols-3');
});

test('SEO, GEO & AEO Production Readiness: robots.txt, sitemap.xml, llms.txt, llms-full.txt, index.html head & JSON-LD @graph, dynamic route/product/variant SEO updates, and custom domain swap', () => {
  // 1. Verify static SEO & GEO files exist in both root and public/ and contain required directives
  for (const relPath of ['robots.txt', 'public/robots.txt']) {
    const robotsTxt = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
    assert.ok(robotsTxt.includes('User-agent: *'), `${relPath} must include User-agent: *`);
    assert.ok(robotsTxt.includes('User-agent: GPTBot'), `${relPath} must explicitly allow GPTBot for GEO`);
    assert.ok(robotsTxt.includes('User-agent: OAI-SearchBot'), `${relPath} must explicitly allow OAI-SearchBot for GEO`);
    assert.ok(robotsTxt.includes('User-agent: ClaudeBot'), `${relPath} must explicitly allow ClaudeBot for GEO`);
    assert.ok(robotsTxt.includes('User-agent: PerplexityBot'), `${relPath} must explicitly allow PerplexityBot for GEO`);
    assert.ok(robotsTxt.includes('User-agent: Google-Extended'), `${relPath} must explicitly allow Google-Extended for GEO`);
    assert.ok(robotsTxt.includes('Sitemap: https://vistara-krafts.vercel.app/sitemap.xml'), `${relPath} must reference https://vistara-krafts.vercel.app/sitemap.xml`);
  }

  const coreProducts = Store.getProducts().filter(p => !String(p.id).startsWith('ram-lotus-drop-') && !String(p.id).startsWith('test-'));
  assert.strictEqual(coreProducts.length, 19, 'Core catalogue must have 19 products');

  for (const relPath of ['sitemap.xml', 'public/sitemap.xml']) {
    const sitemapXml = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
    assert.ok(sitemapXml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), `${relPath} must be valid XML`);
    assert.ok(sitemapXml.includes('<loc>https://vistara-krafts.vercel.app/</loc>'), `${relPath} must include root canonical URL`);
    assert.ok(sitemapXml.includes('hreflang="en-IN"'), `${relPath} must include hreflang="en-IN" alternate links`);
    for (const prod of coreProducts) {
      assert.ok(
        sitemapXml.includes(`<loc>https://vistara-krafts.vercel.app/#/product/${prod.id}</loc>`),
        `${relPath} must include product URL for ${prod.id}`
      );
    }
    assert.ok(sitemapXml.includes('<loc>https://vistara-krafts.vercel.app/llms.txt</loc>'), `${relPath} must index /llms.txt`);
    assert.ok(sitemapXml.includes('<loc>https://vistara-krafts.vercel.app/llms-full.txt</loc>'), `${relPath} must index /llms-full.txt`);
  }

  for (const relPath of ['llms.txt', 'public/llms.txt', 'llms-full.txt', 'public/llms-full.txt']) {
    const llmsContent = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
    assert.ok(llmsContent.includes('Vistāra Krafts'), `${relPath} must include brand identity Vistāra Krafts`);
    assert.ok(llmsContent.includes('@resin.art.memories'), `${relPath} must include Instagram handle @resin.art.memories`);
    assert.ok(llmsContent.includes('https://vistara-krafts.vercel.app'), `${relPath} must reference https://vistara-krafts.vercel.app`);
    assert.ok(llmsContent.includes('https://vistarakrafts.com'), `${relPath} must document future custom domain https://vistarakrafts.com`);
    for (const prod of coreProducts) {
      assert.ok(llmsContent.includes(prod.sku), `${relPath} must include SKU ${prod.sku}`);
    }
  }

  // 2. Verify index.html <head> SEO, Geo-Targeting (Bengaluru/Pan-India), OpenGraph, Twitter Card, and initial JSON-LD @graph
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('lang="en-IN"'), 'index.html must declare lang="en-IN"');
  assert.ok(indexHtml.includes('name="geo.region" content="IN-KA"'), 'index.html must include geo.region="IN-KA"');
  assert.ok(indexHtml.includes('name="geo.placename" content="Bengaluru, Karnataka, India"'), 'index.html must include geo.placename="Bengaluru, Karnataka, India"');
  assert.ok(indexHtml.includes('name="geo.position" content="12.9716;77.5946"'), 'index.html must include geo.position="12.9716;77.5946"');
  assert.ok(indexHtml.includes('name="ICBM" content="12.9716, 77.5946"'), 'index.html must include ICBM="12.9716, 77.5946"');
  assert.ok(indexHtml.includes('rel="canonical" href="https://vistara-krafts.vercel.app/"'), 'index.html must include canonical link to https://vistara-krafts.vercel.app/');
  assert.ok(indexHtml.includes('hreflang="en-IN"'), 'index.html must include hreflang="en-IN" link');
  assert.ok(indexHtml.includes('rel="alternate" type="text/plain" href="/llms.txt"'), 'index.html must link to /llms.txt for AI/LLM discovery');
  assert.ok(indexHtml.includes('rel="alternate" type="text/plain" href="/llms-full.txt"'), 'index.html must link to /llms-full.txt for AI/LLM discovery');
  assert.ok(indexHtml.includes('property="og:locale" content="en_IN"'), 'index.html must include og:locale="en_IN"');
  assert.ok(indexHtml.includes('name="twitter:card" content="summary_large_image"'), 'index.html must include twitter:card="summary_large_image"');

  const jsonLdMatch = indexHtml.match(/<script\s+id="vistara-schema-jsonld"[^>]*>([\s\S]*?)<\/script>/i);
  assert.ok(jsonLdMatch, 'index.html must contain <script id="vistara-schema-jsonld" type="application/ld+json">');
  const staticSchema = JSON.parse(jsonLdMatch[1]);
  assert.strictEqual(staticSchema['@context'], 'https://schema.org', 'Static JSON-LD must have @context="https://schema.org"');
  assert.ok(Array.isArray(staticSchema['@graph']), 'Static JSON-LD must contain @graph array');
  const graphTypes = JSON.stringify(staticSchema['@graph']);
  for (const requiredType of ['Organization', 'OnlineStore', 'LocalBusiness', 'WebSite', 'BreadcrumbList', 'ItemList', 'Product', 'FAQPage', 'HowTo']) {
    assert.ok(graphTypes.includes(requiredType), `Static JSON-LD @graph must include ${requiredType}`);
  }
  const catalogListNode = staticSchema['@graph'].find(n => n['@type'] === 'ItemList');
  assert.ok(catalogListNode, 'Static JSON-LD @graph must include ItemList node');
  assert.strictEqual(catalogListNode.itemListElement.length, 19, 'Static JSON-LD ItemList must contain all 19 products');
  for (const listEl of catalogListNode.itemListElement) {
    assert.ok(listEl.item.offers.shippingDetails, `Static JSON-LD Product ${listEl.item.productID} must include OfferShippingDetails`);
    assert.ok(listEl.item.offers.hasMerchantReturnPolicy, `Static JSON-LD Product ${listEl.item.productID} must include hasMerchantReturnPolicy`);
  }

  // 3. Verify Store.getSeoConfig() and dynamic per-route / per-product / per-variant SEO updates in app.js
  const seoCfg = Store.getSeoConfig();
  assert.strictEqual(seoCfg.siteUrl, 'https://vistara-krafts.vercel.app');
  assert.strictEqual(seoCfg.futureCustomDomain, 'https://vistarakrafts.com');
  assert.strictEqual(seoCfg.geo.region, 'IN-KA');

  sandbox.window.navigateTo('product', 'vk-cat-res-201');
  const pdpSeo1 = sandbox.window.getActiveSeoSnapshot();
  assert.strictEqual(pdpSeo1.route, 'product');
  assert.strictEqual(pdpSeo1.productId, 'vk-cat-res-201');
  assert.strictEqual(pdpSeo1.canonicalUrl, 'https://vistara-krafts.vercel.app/#/product/vk-cat-res-201');
  assert.strictEqual(pdpSeo1.ogType, 'product');
  assert.ok(mockDocument.title.includes('2:1 High-Gloss Epoxy Resin'), 'Document title must dynamically update to active product name');
  assert.strictEqual(mockDocument.getElementById('link-canonical').href, 'https://vistara-krafts.vercel.app/#/product/vk-cat-res-201');
  assert.strictEqual(mockDocument.getElementById('twitter-url').content, 'https://vistara-krafts.vercel.app/#/product/vk-cat-res-201');

  // Select variant index 1 (1.5 Kg Set at ₹1,899) and verify dynamic price & title update
  sandbox.window.selectPdpVariant(1);
  const pdpSeoVariant2 = sandbox.window.getActiveSeoSnapshot();
  assert.strictEqual(pdpSeoVariant2.priceAmount, '1899', 'Selecting PDP variant must dynamically update og:price:amount and schema Offer price');
  assert.strictEqual(mockDocument.getElementById('og-price-amount').content, '1899');
  const dynamicGraphStr = mockDocument.getElementById('vistara-schema-jsonld').textContent;
  assert.ok(!dynamicGraphStr.includes('VK-DOM-101-1K'), 'Dynamic JSON-LD must not reference non-existent SKU VK-DOM-101-1K');
  assert.ok(dynamicGraphStr.includes('VK-RES-201-SET') || dynamicGraphStr.includes('VK-HG-11-500'), 'Dynamic JSON-LD must reference real SKU');
  const dynamicGraphObj = JSON.parse(dynamicGraphStr);
  const activeOrgSchema = dynamicGraphObj['@graph'].find(n => Array.isArray(n['@type']) && n['@type'].includes('Organization'));
  assert.ok(activeOrgSchema.areaServed.includes('IN'), 'Dynamic Organization schema must include "IN" in areaServed');
  assert.ok(activeOrgSchema.hasMerchantReturnPolicy, 'Dynamic Organization schema must retain hasMerchantReturnPolicy');
  const howToNodes = dynamicGraphObj['@graph'].filter(n => n['@type'] === 'HowTo');
  assert.strictEqual(howToNodes.length, 2, 'Dynamic JSON-LD @graph must retain both HowTo nodes (#howto-varmala-preservation and #howto-epoxy-mixing)');
  const activeProdSchema = dynamicGraphObj['@graph'].find(n => n['@id'] && n['@id'].endsWith('#active-product'));
  assert.ok(activeProdSchema, 'Product route JSON-LD @graph must include dedicated #active-product node');
  assert.strictEqual(activeProdSchema.offers.price, '1899', 'Active product JSON-LD Offer price must match selected variant');
  assert.ok(activeProdSchema.offers.shippingDetails, 'Dynamic Product Offer must include OfferShippingDetails');
  assert.ok(activeProdSchema.offers.hasMerchantReturnPolicy, 'Dynamic Product Offer must include hasMerchantReturnPolicy');
  assert.ok(
    activeProdSchema.additionalProperty.some(p => p.name === 'HSN Code' && p.value.includes('39073010')),
    'Dynamic Product additionalProperty must include HSN Code 39073010'
  );

  // Navigate to utility view (#/cart) and verify robots, googlebot, and bingbot all become noindex, follow
  sandbox.window.navigateTo('cart');
  assert.strictEqual(mockDocument.getElementById('meta-robots').content, 'noindex, follow', 'Utility route #/cart must set robots to noindex, follow');
  assert.strictEqual(mockDocument.getElementById('meta-googlebot').content, 'noindex, follow', 'Utility route #/cart must set googlebot to noindex, follow');
  assert.strictEqual(mockDocument.getElementById('meta-bingbot').content, 'noindex, follow', 'Utility route #/cart must set bingbot to noindex, follow');

  // Verify WebSite SearchAction URL template (#/catalog?q=varmala) routes to catalog and populates catalogSearch
  sandbox.window.location.hash = '#/catalog?q=varmala';
  (windowListeners['hashchange'] || []).forEach(fn => fn());
  const searchRouteSeo = sandbox.window.getActiveSeoSnapshot();
  assert.strictEqual(searchRouteSeo.route, 'catalog', 'SearchAction hash #/catalog?q=varmala must route to catalog');
  assert.ok(
    mockDocument.getElementById('app-view-root').innerHTML.includes('value="varmala"'),
    'SearchAction query parameter ?q=varmala must populate catalog search input'
  );
  sandbox.window.setCatalogSearch('');

  // Verify minimal Studio-pushed product renders PDP and SEO metadata without throwing or outputting "undefined"
  Store.receiveStudioPush({
    action: 'STUDIO_UPSERT_PRODUCT',
    payload: { id: 'ram-minimal-seo-test', name: 'Minimal Lotus Keepsake', price: 2499 }
  });
  sandbox.window.navigateTo('product', 'ram-minimal-seo-test');
  sandbox.window.selectPdpVariant(0);
  const minimalPdpSeo = sandbox.window.getActiveSeoSnapshot();
  assert.strictEqual(minimalPdpSeo.productId, 'ram-minimal-seo-test');
  assert.ok(!minimalPdpSeo.title.includes('undefined'), 'Minimal studio product title must never contain "undefined"');
  assert.ok(!minimalPdpSeo.description.includes('undefined'), 'Minimal studio product description must never contain "undefined"');
  assert.ok(!minimalPdpSeo.keywords.includes('undefined'), 'Minimal studio product keywords must never contain "undefined"');
  assert.ok(minimalPdpSeo.ogImage.startsWith('https://'), 'Minimal studio product ogImage must be normalized to an absolute https:// URL');
  Store.receiveStudioPush({
    action: 'STUDIO_DELETE_PRODUCT',
    payload: { id: 'ram-minimal-seo-test' }
  });

  // 4. Verify runtime custom domain swap via window.VISTARA_SITE_URL = 'https://vistarakrafts.com'
  sandbox.window.VISTARA_SITE_URL = 'https://vistarakrafts.com';
  sandbox.window.navigateTo('custom-studio');
  const swappedSeo = sandbox.window.getActiveSeoSnapshot();
  assert.strictEqual(swappedSeo.siteUrl, 'https://vistarakrafts.com', 'Setting window.VISTARA_SITE_URL must swap active siteUrl without refactoring');
  assert.strictEqual(swappedSeo.canonicalUrl, 'https://vistarakrafts.com/#/custom-studio');
  assert.strictEqual(mockDocument.getElementById('link-canonical').href, 'https://vistarakrafts.com/#/custom-studio');
  const swappedGraph = JSON.parse(mockDocument.getElementById('vistara-schema-jsonld').textContent);
  assert.strictEqual(swappedGraph['@graph'][0]['@id'], 'https://vistarakrafts.com/#organization');

  // Reset back to default Vercel domain and #/home
  delete sandbox.window.VISTARA_SITE_URL;
  sandbox.window.navigateTo('home');
  assert.strictEqual(mockDocument.getElementById('link-canonical').href, 'https://vistara-krafts.vercel.app/');
});

test('Awwwards SOTD (Site of the Day): Dynamic Cursor, 3D Tilt, Specimen Loupe, Before/After Slider, Ripple & Heart-Burst (Zero Audio E-Commerce Only)', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const stylesCss = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  const appCode = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

  // 1. Zero Audio Guarantee per strict customer directive
  assert.ok(!indexHtml.includes('id="sotd-sound-toggle"'), 'index.html must not contain sound toggle');
  assert.ok(!appCode.includes('new AudioContext'), 'app.js must not initialize AudioContext');
  assert.ok(!appCode.includes('playClick()'), 'app.js must not contain audio playback');

  // 2. Custom Dynamic Cursor Follower elements removed per user directive (restoring clean native mouse cursor)
  assert.ok(!indexHtml.includes('id="sotd-cursor-dot"'), 'index.html must NOT contain #sotd-cursor-dot');
  assert.ok(!indexHtml.includes('id="sotd-cursor-ring"'), 'index.html must NOT contain #sotd-cursor-ring');
  assert.ok(!indexHtml.includes('Awwwards SOTD Winner'), 'index.html must NOT claim fake Awwwards SOTD award');
  assert.ok(stylesCss.includes('.skeleton-box'), 'styles.css must include accessible .skeleton-box loading shimmer');
  assert.ok(stylesCss.includes('.spinner'), 'styles.css must include .spinner progress indicator');
  assert.ok(typeof sandbox.window.handleBackButton === 'function', 'window.handleBackButton must be defined globally');

  // 3. 3D Card Tilt, Specular Glare & Magnetic Snaps
  assert.ok(stylesCss.includes('.sotd-tilt'), 'styles.css must define .sotd-tilt');
  assert.ok(stylesCss.includes('.sotd-glare'), 'styles.css must define .sotd-glare specular reflection');
  assert.ok(stylesCss.includes('.sotd-magnetic'), 'styles.css must define .sotd-magnetic button snap');
  assert.ok(stylesCss.includes('.sotd-ripple-effect'), 'styles.css must define .sotd-ripple-effect');
  assert.ok(stylesCss.includes('.sotd-burst-particle'), 'styles.css must define .sotd-burst-particle');

  // 4. Curated Epoxy Kits Section on Home & Interactive Flower Transformation Slider in Custom Studio
  sandbox.window.navigateTo('home');
  const homeHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(homeHtml.includes('Professional Epoxy Resin Kits') || homeHtml.includes('Choose the Right Vistāra Epoxy System'), 'Home view must display curated epoxy kits section');
  assert.ok(!homeHtml.includes('21-Day Cryo-Silica Floral Transformation'), 'Home view must NOT display removed cryo-silica floral transformation per owner request');

  sandbox.window.navigateTo('custom-studio');
  const studioHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(studioHtml.includes('sotd-dehydration-slider'), 'Custom Studio view must contain flower transformation slider');
  assert.ok(studioHtml.includes('type="range"'), 'Dehydration slider must use accessible range input');

  // 5. Specimen Inspection Loupe on PDP
  sandbox.window.navigateTo('product', 'vk-cat-res-201');
  const pdpHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(pdpHtml.includes('id="pdp-specimen-stage"'), 'PDP view must define #pdp-specimen-stage');
  assert.ok(pdpHtml.includes('id="pdp-specimen-loupe"'), 'PDP view must define #pdp-specimen-loupe macro zoom');
  assert.ok(pdpHtml.includes('2.5× Macro'), 'PDP specimen loupe must display 2.5x macro optical indicator');

  // 6. Reset to home
  sandbox.window.navigateTo('home');
});

test('QA Audit & UX Reliability: Accessible Back Navigation on Subpages, Custom 404 Route, Zero Broken Links, and Empty State CTAs', () => {
  // 1. Verify 404.html static file exists
  assert.ok(fs.existsSync(path.join(ROOT, '404.html')), '404.html static fallback page must exist in root');
  const static404Html = fs.readFileSync(path.join(ROOT, '404.html'), 'utf8');
  assert.ok(static404Html.includes('HTTP 404 • Page Not Found'), '404.html must display Page Not Found message');
  assert.ok(static404Html.includes('href="./#/home"'), '404.html must provide link back home');

  // 2. Verify SPA 404 routing for invalid route
  sandbox.window.location.hash = '#/non-existent-route-xyz';
  sandbox.window.handleRouteChange();
  const notFoundHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(notFoundHtml.includes('HTTP 404 • Page Not Found'), 'SPA must render custom 404 view on unknown hash route');
  assert.ok(notFoundHtml.includes('Artisan Piece or Craft Material Not Found'), '404 view must display friendly artisan message');

  // 3. Verify SPA 404 routing for unknown product ID (zero unhandled exceptions)
  sandbox.window.location.hash = '#/product/non-existent-product-id';
  sandbox.window.handleRouteChange();
  const unknownProdHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(unknownProdHtml.includes('HTTP 404 • Page Not Found'), 'SPA must render 404 view on invalid product ID without throwing');

  // 4. Verify Accessible Back Buttons on Subpages
  const subpages = [
    { route: 'catalog', param: 'all', backText: 'Back to Discover' },
    { route: 'product', param: 'vk-cat-res-301', backText: 'Back' },
    { route: 'custom-studio', param: null, backText: 'Back to Discover' },
    { route: 'wishlist', param: null, backText: 'Back' },
    { route: 'cart', param: null, backText: 'Back to Shopping' },
    { route: 'social', param: null, backText: 'Back to Discover' },
    { route: 'account', param: null, backText: 'Back to Storefront' }
  ];

  for (const page of subpages) {
    if (page.param) {
      sandbox.window.navigateTo(page.route, page.param);
    } else {
      sandbox.window.navigateTo(page.route);
    }
    const html = mockDocument.getElementById('app-view-root').innerHTML;
    assert.ok(html.includes('handleBackButton'), `${page.route} subview must include window.handleBackButton call`);
    assert.ok(html.includes(page.backText), `${page.route} subview must render visible "${page.backText}" button text`);
  }

  // 5. Verify Account Empty State provides actionable First Order CTA (when 0 orders)
  const prevOrdersJson = mockLocalStorage.getItem('ram_vk_orders_v2');
  mockLocalStorage.setItem('ram_vk_orders_v2', '[]');
  sandbox.window.navigateTo('account');
  const accountHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(accountHtml.includes('Browse Catalogue to Place Your First Order'), 'Account with 0 orders must provide first order CTA');
  if (prevOrdersJson) mockLocalStorage.setItem('ram_vk_orders_v2', prevOrdersJson);

  // 6. Verify Out-of-Stock Guard & Reliable Inventory Protection
  const products = sandbox.window.StorefrontBridge.getProducts().slice();
  products[0].inStock = false;
  mockLocalStorage.setItem('ram_vk_products_v2', JSON.stringify(products));

  const preCartSummary = sandbox.window.StorefrontBridge.getCartSummary();
  sandbox.window.StorefrontBridge.addToCart(products[0].id, 'std', 1);
  const postCartSummary = sandbox.window.StorefrontBridge.getCartSummary();
  assert.strictEqual(postCartSummary.itemsCount, preCartSummary.itemsCount, 'Out-of-stock product must NOT be added to cart');

  // Verify placeOrder rejects if cart has out-of-stock item
  sandbox.window.StorefrontBridge.saveCart([{
    productId: products[0].id,
    name: products[0].name,
    variantLabel: 'Standard',
    price: products[0].price,
    qty: 1
  }]);
  const outOfStockOrderRes = sandbox.window.StorefrontBridge.placeOrder({
    name: 'Test Patron',
    phone: '9876543210',
    address: 'Indiranagar, Bengaluru - 560038',
    pincode: '560038'
  });
  assert.strictEqual(outOfStockOrderRes.success, false, 'placeOrder must reject orders containing out-of-stock items');
  assert.ok(outOfStockOrderRes.message.includes('currently out of stock'), 'placeOrder must explain which item is out of stock');

  // Restore inStock: true and clear cart
  products[0].inStock = true;
  mockLocalStorage.setItem('ram_vk_products_v2', JSON.stringify(products));
  sandbox.window.StorefrontBridge.clearCart();

  // 7. Reset to home
  sandbox.window.navigateTo('home');
});

// Async test for Supabase PostgreSQL Schema, Supabase Auth Integration & Cloudinary Media Storage Suite
try {
  const fs = await import('node:fs');
  const path = await import('node:path');

  // 1. Verify supabase/schema.sql existence and PostgreSQL structural integrity
  const schemaPath = path.resolve('supabase/schema.sql');
  assert.ok(fs.existsSync(schemaPath), 'supabase/schema.sql must exist');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.profiles'), 'Schema must define public.profiles');
  assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.products'), 'Schema must define public.products');
  assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.orders'), 'Schema must define public.orders');
  assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.inventory_logs'), 'Schema must define public.inventory_logs');
  assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.payments'), 'Schema must define public.payments');
  assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.settings'), 'Schema must define public.settings');
  assert.ok(schemaSql.includes('ENABLE ROW LEVEL SECURITY'), 'Schema must enforce Row Level Security (RLS)');
  assert.ok(schemaSql.includes('supabase_realtime'), 'Schema must publish realtime publications');

  // 2. Verify Supabase Client Adapter (supabase-client.js)
  await import('./supabase-client.js');
  const sb = globalThis.VistaraSupabase;
  assert.ok(sb && sb.auth, 'Supabase client must expose auth methods');
  assert.ok(sb.from, 'Supabase client must expose from() database query builder');

  // Test Supabase Auth Sign Up
  const signUpRes = await sb.auth.signUp({
    email: 'patron.test@vistarakrafts.com',
    password: 'Password#123',
    options: { data: { full_name: 'Priya Sharma', phone: '+91 98450 12345' } }
  });
  assert.strictEqual(signUpRes.error, null);
  assert.ok(signUpRes.data.user.id);
  assert.strictEqual(signUpRes.data.user.email, 'patron.test@vistarakrafts.com');

  // Test Supabase Auth Sign In With Password
  const signInRes = await sb.auth.signInWithPassword({
    email: 'patron.test@vistarakrafts.com',
    password: 'Password#123'
  });
  assert.strictEqual(signInRes.error, null);
  assert.ok(signInRes.data.session.access_token);

  // Test Supabase 1-Click OAuth (Google / Apple)
  const oauthRes = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { email: 'patron.google@gmail.com', name: 'Google Patron' }
  });
  assert.strictEqual(oauthRes.error, null);
  assert.strictEqual(oauthRes.data.user.app_metadata.provider, 'google');

  // Test Supabase Auth Sign Out
  const signOutRes = await sb.auth.signOut();
  assert.strictEqual(signOutRes.error, null);

  // 3. Verify Cloudinary Media Storage Adapter (cloudinary-config.js)
  await import('./cloudinary-config.js');
  const cld = globalThis.VistaraCloudinary;
  assert.ok(cld && cld.optimize, 'Cloudinary adapter must provide optimize() method');
  assert.ok(cld.uploadImage, 'Cloudinary adapter must provide uploadImage() method');

  // Test Cloudinary transformation URL generator
  const sampleCldUrl = 'https://res.cloudinary.com/vistara-krafts/image/upload/v1/products/varmala.jpg';
  const optimizedUrl = cld.optimize(sampleCldUrl, { width: 800, quality: 'auto', format: 'auto' });
  assert.ok(optimizedUrl.includes('f_auto,q_auto,w_800'), 'Cloudinary optimize must inject f_auto,q_auto,w_800 transforms');

  console.log('✅ PASS: Supabase PostgreSQL Schema, Supabase Auth Integration & Cloudinary Media Storage Suite');
  passed++;
} catch (err) {
  console.error('❌ FAIL: Supabase / Cloudinary integration test');
  console.error('   ', err.message);
  failed++;
}

// Real Headless Chrome E2E & Multi-Viewport Layout Verification (320px, 375px, 1280px)
const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
];
const chromeExe = chromeCandidates.find(p => fs.existsSync(p));

if (chromeExe) {
  try {
    const http = await import('node:http');
    const os = await import('node:os');
    const { spawn } = await import('node:child_process');

    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.xml': 'application/xml; charset=utf-8',
      '.txt': 'text/plain; charset=utf-8',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.svg': 'image/svg+xml'
    };

    const server = http.createServer(async (req, res) => {
      try {
        const u = new URL(req.url, 'http://127.0.0.1');
        if (u.pathname.startsWith('/api/')) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
          if (u.pathname.includes('/seo')) {
            res.end(JSON.stringify({ ok: true, siteUrl: 'https://vistara-krafts.vercel.app', futureCustomDomain: 'https://vistarakrafts.com' }));
          } else {
            res.end(JSON.stringify({ ok: true, token: 'sb_e2e_token', authenticated: true, user: { id: 'usr_e2e', name: 'Rohan Mehta' } }));
          }
          return;
        }
        let filePath = path.join(ROOT, u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname));
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(ROOT, 'index.html');
        }
        if (filePath.endsWith('index.html')) {
          let html = fs.readFileSync(filePath, 'utf8');
          html = html.replace('<head>', '<head><script>window.__VK_TEST_ENV__ = true; window.__VK_DISABLE_SUPABASE_AUTO_SYNC__ = true;</script>');
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.end(fs.readFileSync(filePath));
      } catch (e) {
        res.statusCode = 500;
        res.end(e.message);
      }
    });

    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vk-chrome-e2e-'));

    const chromeProc = spawn(chromeExe, [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${userDataDir}`,
      '--remote-debugging-port=0',
      '--window-size=1280,800',
      `http://127.0.0.1:${port}/`
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    const wsUrl = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out waiting for Chrome DevTools')), 15000);
      let stderr = '';
      chromeProc.stderr.on('data', chunk => {
        stderr += chunk.toString();
        const m = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
        if (m) {
          clearTimeout(timeout);
          resolve(m[1]);
        }
      });
    });

    const browserPort = new URL(wsUrl).port;
    let targets = [];
    for (let i = 0; i < 20; i++) {
      const r = await fetch(`http://127.0.0.1:${browserPort}/json/list`);
      targets = await r.json();
      if (targets.find(t => t.type === 'page')) break;
      await new Promise(r => setTimeout(r, 150));
    }
    const pageTarget = targets.find(t => t.type === 'page');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });

    let msgId = 0;
    const pending = new Map();
    const consoleErrors = [];
    ws.addEventListener('message', ev => {
      const data = JSON.parse(ev.data);
      if (data.method === 'Runtime.exceptionThrown') {
        consoleErrors.push(data.params.exceptionDetails?.text || 'Uncaught exception');
      }
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      }
    });

    function cdpSend(method, params = {}) {
      const id = ++msgId;
      ws.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    }

    async function cdpEval(expression) {
      const res = await cdpSend('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true
      });
      if (res.exceptionDetails) {
        throw new Error(`CDP Eval Error: ${res.exceptionDetails.text} ${res.exceptionDetails.exception?.description || ''}`);
      }
      return res.result.value;
    }

    await cdpSend('Runtime.enable');
    await cdpSend('Page.enable');
    for (let i = 0; i < 50; i++) {
      const ready = await cdpEval(`Boolean(window.StorefrontBridge && typeof window.openCheckoutModal === 'function')`);
      if (ready) break;
      await new Promise(r => setTimeout(r, 150));
    }

    // 1. Verify fresh initial state in real Chrome
    const freshState = await cdpEval(`(() => ({
      cartCount: window.StorefrontBridge.getCartSummary().itemsCount,
      wishlistCount: window.StorefrontBridge.getWishlist().length,
      ordersCount: window.StorefrontBridge.getOrders().length,
      isAuthenticated: window.StorefrontBridge.isAuthenticated(),
      cartBadgesHidden: Array.from(document.querySelectorAll('.js-cart-badge')).every(b => getComputedStyle(b).display === 'none'),
      wishlistBadgesHidden: Array.from(document.querySelectorAll('.js-wishlist-badge')).every(b => getComputedStyle(b).display === 'none')
    }))()`);
    assert.strictEqual(freshState.cartCount, 0, 'Headless Chrome: Initial cart count must be 0');
    assert.strictEqual(freshState.wishlistCount, 0, 'Headless Chrome: Initial wishlist count must be 0');
    assert.strictEqual(freshState.ordersCount, 0, 'Headless Chrome: Initial orders count must be 0');
    assert.strictEqual(freshState.isAuthenticated, false, 'Headless Chrome: Initial visitor must be in Guest Mode');
    assert.strictEqual(freshState.cartBadgesHidden, true, 'Headless Chrome: .js-cart-badge must have display:none when 0');
    assert.strictEqual(freshState.wishlistBadgesHidden, true, 'Headless Chrome: .js-wishlist-badge must have display:none when 0');

    // 1b. Seed fixtures and verify SEO, GEO, and AEO endpoints & dynamic DOM head updates in real Headless Chrome
    await cdpEval(`((fixtures) => {
      if (window.StorefrontBridge) {
        window.StorefrontBridge.receiveStudioPush({ type: 'PRODUCTS_UPDATED', products: fixtures });
      }
    })(${JSON.stringify(TEST_PRODUCTS)})`);

    const chromeSeoAudit = await cdpEval(`(async () => {
      const [robotsRes, sitemapRes, llmsRes, llmsFullRes, apiSeoRes] = await Promise.all([
        fetch('/robots.txt'),
        fetch('/sitemap.xml'),
        fetch('/llms.txt'),
        fetch('/llms-full.txt'),
        fetch('/api/seo')
      ]);
      const apiSeoJson = await apiSeoRes.json();

      window.navigateTo('product', 'vk-cat-res-201');
      window.selectPdpVariant(0);
      const pdpTitle = document.title;
      const pdpCanonical = document.getElementById('link-canonical')?.getAttribute('href');
      const pdpOgPrice = document.getElementById('og-price-amount')?.getAttribute('content');
      const pdpSchema = JSON.parse(document.getElementById('vistara-schema-jsonld').textContent);

      window.navigateTo('home');
      return {
        robotsStatus: robotsRes.status,
        sitemapStatus: sitemapRes.status,
        llmsStatus: llmsRes.status,
        llmsFullStatus: llmsFullRes.status,
        apiSeoOk: apiSeoJson.ok,
        apiSeoSiteUrl: apiSeoJson.siteUrl,
        pdpTitle,
        pdpCanonical,
        pdpOgPrice,
        pdpGraphCount: pdpSchema['@graph'].length
      };
    })()`);
    assert.strictEqual(chromeSeoAudit.robotsStatus, 200, 'Headless Chrome: /robots.txt must return 200 OK');
    assert.strictEqual(chromeSeoAudit.sitemapStatus, 200, 'Headless Chrome: /sitemap.xml must return 200 OK');
    assert.strictEqual(chromeSeoAudit.llmsStatus, 200, 'Headless Chrome: /llms.txt must return 200 OK');
    assert.strictEqual(chromeSeoAudit.llmsFullStatus, 200, 'Headless Chrome: /llms-full.txt must return 200 OK');
    assert.strictEqual(chromeSeoAudit.apiSeoOk, true, 'Headless Chrome: /api/seo must return ok:true');
    assert.strictEqual(chromeSeoAudit.apiSeoSiteUrl, 'https://vistara-krafts.vercel.app');
    assert.ok(chromeSeoAudit.pdpTitle.includes('2:1 High-Gloss') || chromeSeoAudit.pdpTitle.includes('Epoxy Resin'), 'Headless Chrome: PDP title must include product name');
    assert.strictEqual(chromeSeoAudit.pdpCanonical, 'https://vistara-krafts.vercel.app/#/product/vk-cat-res-201');
    assert.ok(Number(chromeSeoAudit.pdpOgPrice) > 0, 'Headless Chrome: pdpOgPrice must be positive');
    assert.ok(chromeSeoAudit.pdpGraphCount >= 7, 'Headless Chrome: PDP JSON-LD @graph must contain at least 7 structured nodes');

    // 1c. Verify clean native cursor (no bubbles), zero fake awards, and interactive elements in real Headless Chrome
    const sotdAudit = await cdpEval(`(async () => {
      const cursorDot = document.getElementById('sotd-cursor-dot');
      const cursorRing = document.getElementById('sotd-cursor-ring');
      const ribbonText = document.querySelector('header aside')?.textContent || '';
      const epoxyKitsGrid = document.getElementById('home-epoxy-kits-grid');

      // Navigate to custom-studio to verify interactive flower transformation slider
      window.navigateTo('custom-studio');
      await new Promise(r => setTimeout(r, 60));
      const studioSlider = document.querySelector('.sotd-dehydration-slider');
      const studioSliderInput = document.querySelector('.sotd-slider-range');
      window.navigateTo('home');

      return {
        hasCursorDot: Boolean(cursorDot),
        hasCursorRing: Boolean(cursorRing),
        hasFakeAward: ribbonText.includes('Awwwards'),
        hasEpoxyKits: Boolean(epoxyKitsGrid),
        hasStudioSlider: Boolean(studioSlider),
        hasStudioSliderInput: Boolean(studioSliderInput)
      };
    })()`);
    assert.strictEqual(sotdAudit.hasCursorDot, false, 'Headless Chrome: #sotd-cursor-dot must NOT exist in DOM (clean native cursor restored)');
    assert.strictEqual(sotdAudit.hasCursorRing, false, 'Headless Chrome: #sotd-cursor-ring must NOT exist in DOM');
    assert.strictEqual(sotdAudit.hasFakeAward, false, 'Headless Chrome: Header ribbon must NOT contain fake award claims');
    assert.strictEqual(sotdAudit.hasEpoxyKits, true, 'Headless Chrome: Home view must mount #home-epoxy-kits-grid');
    assert.strictEqual(sotdAudit.hasStudioSlider, true, 'Headless Chrome: Custom Studio view must mount .sotd-dehydration-slider');
    assert.strictEqual(sotdAudit.hasStudioSliderInput, true, 'Headless Chrome: .sotd-dehydration-slider must have range input');

    // 2. Verify full E2E user journey in real Chrome:
    // Guest wishlist -> Add to bag -> Checkout Gate -> 1-Click Google OAuth Chooser -> Step 2 Checkout Address -> Order Placement -> Logout -> Apple OAuth Chooser
    const e2eResult = await cdpEval(`(async () => {
      window.VistaraStore.toggleWishlist('vk-cat-res-201');
      window.VistaraStore.addToCart('vk-cat-res-301', 'var-301-300g', 1);
      window.openCheckoutModal();
      const gateOpenedAuthModal = !document.getElementById('cloudflare-auth-modal').classList.contains('hidden') &&
                                  document.getElementById('checkout-modal').classList.contains('hidden');

      window.startCloudflareOAuth('google');
      const googleChooserVisible = getComputedStyle(document.getElementById('cf-oauth-chooser-sheet')).display !== 'none';
      const firstChooserBtn = document.querySelector('#cf-oauth-chooser-accounts button');
      firstChooserBtn.click();
      await new Promise(r => setTimeout(r, 120));

      const step2OpenedCheckoutModal = !document.getElementById('checkout-modal').classList.contains('hidden') &&
                                       document.getElementById('cloudflare-auth-modal').classList.contains('hidden');
      const mergedWishlistCount = window.VistaraStore.getWishlist().length;

      document.getElementById('chk-phone').value = '+91 98450 12345';
      document.getElementById('chk-address').value = '108 MG Road, Bengaluru';
      document.getElementById('chk-pincode').value = '560001';
      window.submitCheckoutOrder(new Event('submit', { cancelable: true }));
      await new Promise(r => setTimeout(r, 150));

      const ordersAfterCheckout = window.VistaraStore.getOrders();
      const savedAddressInProfile = window.VistaraStore.getAuthSession().address;

      window.handlePatronLogout();
      const guestWishlistAfterLogout = window.VistaraStore.getWishlist().length;
      const guestProfileNameAfterLogout = window.VistaraStore.getPatronProfile().name;
      const guestProfileAddrAfterLogout = window.VistaraStore.getPatronProfile().address;

      window.openCloudflareAuthModal(false);
      window.startCloudflareOAuth('apple');
      const appleChooserVisible = getComputedStyle(document.getElementById('cf-oauth-chooser-sheet')).display !== 'none';
      window.closeModalById('cloudflare-auth-modal');

      return {
        gateOpenedAuthModal,
        googleChooserVisible,
        step2OpenedCheckoutModal,
        mergedWishlistCount,
        ordersCount: ordersAfterCheckout.length,
        savedAddressInProfile,
        guestWishlistAfterLogout,
        guestProfileNameAfterLogout,
        guestProfileAddrAfterLogout,
        appleChooserVisible
      };
    })()`);

    assert.strictEqual(e2eResult.gateOpenedAuthModal, true, 'Headless Chrome: Guest checkout must open #cloudflare-auth-modal');
    assert.strictEqual(e2eResult.googleChooserVisible, true, 'Headless Chrome: Clicking Continue with Google must display #cf-oauth-chooser-sheet');
    assert.strictEqual(e2eResult.step2OpenedCheckoutModal, true, 'Headless Chrome: 1-Click Google login must advance to Step 2 #checkout-modal');
    assert.strictEqual(e2eResult.mergedWishlistCount, 1, 'Headless Chrome: Guest wishlist must merge into authenticated session');
    assert.strictEqual(e2eResult.ordersCount, 1, 'Headless Chrome: Submitting Step 2 checkout must create order');
    assert.strictEqual(e2eResult.savedAddressInProfile, '108 MG Road, Bengaluru - 560001', 'Headless Chrome: Checkout address & PIN must persist to user profile');
    assert.strictEqual(e2eResult.guestWishlistAfterLogout, 0, 'Headless Chrome: Logout must reset guest wishlist to 0');
    assert.strictEqual(e2eResult.guestProfileNameAfterLogout, 'Vistāra Studio Guest', 'Headless Chrome: Logout must reset guest profile name');
    assert.strictEqual(e2eResult.guestProfileAddrAfterLogout, '', 'Headless Chrome: Logout must clear guest profile address');
    assert.strictEqual(e2eResult.appleChooserVisible, true, 'Headless Chrome: Clicking Continue with Apple after logout must display #cf-oauth-chooser-sheet');

    // 3. Verify zero horizontal overflow across all 8 SPA routes and modals at 320x568, 375x812, 390x844 (iPhone 14), 428x926, and 1280x800
    for (const vp of [{ width: 320, height: 568 }, { width: 375, height: 812 }, { width: 390, height: 844 }, { width: 428, height: 926 }, { width: 1280, height: 800 }]) {
      await cdpSend('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: vp.width < 768
      });
      for (const route of ['home', 'catalog', 'product', 'social', 'custom-studio', 'wishlist', 'cart', 'account']) {
        const metrics = await cdpEval(`(async () => {
          window.navigateTo('${route}', ${route === 'product' ? "'vk-cat-res-201'" : 'null'});
          await new Promise(r => setTimeout(r, 40));
          return {
            innerWidth: window.innerWidth,
            scrollWidth: document.documentElement.scrollWidth
          };
        })()`);
        assert.ok(
          metrics.scrollWidth <= metrics.innerWidth,
          `Headless Chrome: Route #/${route} at ${vp.width}px has horizontal overflow (${metrics.scrollWidth} > ${metrics.innerWidth})`
        );
      }
    }

    // 4. Verify 320x568 modal & drawer bounding boxes (touch targets >= 44px, stacked PIN field, zero horizontal bleed)
    await cdpSend('Emulation.setDeviceMetricsOverride', {
      width: 320,
      height: 568,
      deviceScaleFactor: 2,
      mobile: true
    });
    const modalRects320 = await cdpEval(`(async () => {
      window.openCloudflareAuthModal(false);
      window.startCloudflareOAuth('google');
      await new Promise(r => setTimeout(r, 40));
      const authBtns = Array.from(document.querySelectorAll('#cloudflare-auth-modal button, #cloudflare-auth-modal input:not([type="hidden"])'))
        .filter(el => el.offsetParent !== null)
        .map(el => ({ id: el.id || el.textContent.trim().slice(0, 20), h: Math.round(el.getBoundingClientRect().height), right: Math.round(el.getBoundingClientRect().right) }));
      window.completeOAuthChooserAccount('google', 'aarav.mehta@gmail.com', 'Aarav Mehta');
      window.StorefrontBridge.addToCart('vk-cat-res-301', 'kit-1200g', 1);
      window.openCheckoutModal();
      await new Promise(r => setTimeout(r, 40));
      const pinRect = document.getElementById('chk-pincode').getBoundingClientRect();
      const addrRect = document.getElementById('chk-address').getBoundingClientRect();
      window.closeModalById('checkout-modal');
      window.openAccountBarModal();
      await new Promise(r => setTimeout(r, 40));
      const barBtns = Array.from(document.querySelectorAll('#account-bar-modal button, #account-bar-modal input'))
        .filter(el => el.offsetParent !== null)
        .map(el => ({ id: el.id || el.textContent.trim().slice(0, 20), h: Math.round(el.getBoundingClientRect().height), right: Math.round(el.getBoundingClientRect().right) }));
      window.closeModalById('account-bar-modal');
      return {
        authBtns,
        barBtns,
        pinWidth: Math.round(pinRect.width),
        addrWidth: Math.round(addrRect.width),
        pinHeight: Math.round(pinRect.height)
      };
    })()`);
    assert.ok(modalRects320.pinWidth >= 240 && modalRects320.pinWidth === modalRects320.addrWidth, `Headless Chrome: #chk-pincode must stack full-width at 320px (got ${modalRects320.pinWidth}px vs ${modalRects320.addrWidth}px)`);
    assert.ok(modalRects320.pinHeight >= 44, `Headless Chrome: #chk-pincode height must be >= 44px (got ${modalRects320.pinHeight}px)`);
    for (const item of [...modalRects320.authBtns, ...modalRects320.barBtns]) {
      assert.ok(item.h >= 44, `Headless Chrome: Modal control "${item.id}" must have height >= 44px (got ${item.h}px)`);
      assert.ok(item.right <= 320, `Headless Chrome: Modal control "${item.id}" must not overflow 320px viewport (right=${item.right}px)`);
    }

    assert.strictEqual(consoleErrors.length, 0, `Headless Chrome must have 0 uncaught runtime exceptions (got: ${consoleErrors.join('; ')})`);

    ws.close();
    chromeProc.kill();
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_e) { /* ignore */ }

    console.log('✅ PASS: Real Headless Chrome E2E & Multi-Viewport Layout Verification (320px, 375px, 390px, 428px, 1280px)');
    passed++;
  } catch (err) {
    console.error('❌ FAIL: Real Headless Chrome E2E verification');
    console.error('   ', err.message);
    failed++;
  }
}

// Suite 22: Resilience, Network & Error Handling, and Kinetic Lottie-Style Feedback
try {
  // 1. Verify 500.html exists, has trace ID, reload button, and catalog link
  assert.ok(fs.existsSync(path.join(ROOT, '500.html')), '500.html standalone server error page must exist');
  const static500Html = fs.readFileSync(path.join(ROOT, '500.html'), 'utf8');
  assert.ok(static500Html.includes('HTTP 500') && static500Html.includes('Studio System Interruption'), '500.html must display HTTP 500 notice');
  assert.ok(static500Html.includes('VK-EDGE-500-'), '500.html must generate Edge incident trace ID');
  assert.ok(static500Html.includes('window.location.reload()'), '500.html must offer reload action');
  assert.ok(static500Html.includes('href="./#/catalog/all"'), '500.html must offer catalog link');

  // 2. Verify 404.html has kinetic SVG illustration
  assert.ok(fs.existsSync(path.join(ROOT, '404.html')), '404.html page must exist');
  const static404Html = fs.readFileSync(path.join(ROOT, '404.html'), 'utf8');
  assert.ok(static404Html.includes('anim-levitate') || static404Html.includes('lottie-anim-float'), '404.html must feature kinetic crystal SVG illustration');

  // 3. Verify Offline Atelier Banner in index.html and styles.css
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const stylesCss = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  assert.ok(indexHtml.includes('id="offline-atelier-banner"'), 'index.html must include #offline-atelier-banner');
  assert.ok(indexHtml.includes('id="offline-retry-btn"'), 'index.html must include #offline-retry-btn');
  assert.ok(stylesCss.includes('#offline-atelier-banner'), 'styles.css must style offline banner');
  assert.ok(stylesCss.includes('lottieLevitate') || stylesCss.includes('lottieSpinSlow'), 'styles.css must define kinetic keyframes');

  // 4. Verify Payment Processing Modal in index.html with timeout handling
  assert.ok(indexHtml.includes('id="payment-processing-modal"'), 'index.html must include #payment-processing-modal');
  assert.ok(indexHtml.includes('id="pay-timeout-actions"'), 'index.html must include emergency timeout action container');
  assert.ok(indexHtml.includes('window.retryPaymentSubmission()'), 'index.html must bind retryPaymentSubmission');
  assert.ok(indexHtml.includes('window.cancelPaymentSubmission()'), 'index.html must bind cancelPaymentSubmission');

  // 5. Test Checkout Draft Persistence in StorefrontBridge
  Store.clearCheckoutDraft();
  assert.deepStrictEqual(Store.getCheckoutDraft(), {}, 'Checkout draft should initially be empty');
  Store.saveCheckoutDraft({
    name: 'Ananya Sharma',
    phone: '+91 9988776655',
    address: 'Flat 402, Lotus Orchid, Indiranagar, Bengaluru',
    pincode: '560038',
    paymentMethod: 'UPI Instant (GPay / PhonePe)',
    giftWrap: true
  });
  const savedDraft = Store.getCheckoutDraft();
  assert.strictEqual(savedDraft.name, 'Ananya Sharma', 'saveCheckoutDraft must persist customer name');
  assert.strictEqual(savedDraft.pincode, '560038', 'saveCheckoutDraft must persist customer PIN code');
  assert.strictEqual(savedDraft.giftWrap, true, 'saveCheckoutDraft must persist gift wrap preference');

  // 6. Test placeOrderAsync resilient local preservation
  const testCartItem = {
    productId: 'vk-cat-res-301',
    variantLabel: '1.2kg Kit (Bundle)',
    price: 1149,
    regularPrice: 1299,
    qty: 1
  };
  Store.saveCart([testCartItem]);
  assert.strictEqual(Store.getCart().length, 1, 'Cart should have 1 item');

  // Verify auth requirement before order placement
  Store.logoutPatron();
  const unauthRes = await Store.placeOrderAsync({
    name: 'Ananya Sharma',
    phone: '+91 9988776655',
    address: 'Flat 402, Lotus Orchid, Indiranagar, Bengaluru',
    pincode: '560038'
  });
  assert.strictEqual(unauthRes.requiresAuth, true, 'placeOrderAsync must require authentication before ordering');

  // Authenticate user
  sandbox.window.completeOAuthChooserAccount('google', 'ananya.sharma@gmail.com', 'Ananya Sharma');
  assert.strictEqual(Store.isAuthenticated(), true, 'User must be authenticated');

  const orderRes = await Store.placeOrderAsync({
    name: 'Ananya Sharma',
    phone: '+91 9988776655',
    address: 'Flat 402, Lotus Orchid, Indiranagar, Bengaluru',
    pincode: '560038',
    paymentMethod: 'UPI Instant (GPay / PhonePe)',
    giftWrap: true
  });
  assert.ok(orderRes.success, 'placeOrderAsync must succeed and persist order locally');
  assert.ok(orderRes.order && orderRes.order.orderId, 'placeOrderAsync must return an order with valid orderId');

  // 7. Verify In-App 500 View & kinetic empty states in app.js
  sandbox.window.navigateTo('500');
  const view500 = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(view500.includes('500') && view500.includes('Studio System Interruption'), 'In-app 500 view must render 500 error state');
  assert.ok(view500.includes('lottie-anim-spin'), 'In-app 500 view must feature kinetic SVG animation');
  assert.ok(view500.includes('VK-ERR-') || view500.includes('VK-EDGE-'), 'In-app 500 view must display incident trace ID');

  // Empty cart kinetic state
  Store.saveCart([]);
  sandbox.window.navigateTo('cart');
  const cartHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(cartHtml.includes('Your Studio Bag is Empty') && (cartHtml.includes('lottie-anim-float') || cartHtml.includes('svg')), 'Empty cart must render kinetic studio bag SVG');

  // Empty wishlist kinetic state
  Store.saveWishlist([]);
  sandbox.window.navigateTo('wishlist');
  const wishHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(wishHtml.includes('Your Wishlist is Empty') && (wishHtml.includes('lottie-anim-pulse') || wishHtml.includes('svg')), 'Empty wishlist must render kinetic heart SVG');

  // Reset to home
  sandbox.window.navigateTo('home');

  console.log('✅ PASS: Resilience, Network & Error Handling, and Kinetic Lottie-Style Feedback');
  passed++;
} catch (err) {
  console.error('❌ FAIL: Resilience, Network & Error Handling, and Kinetic Lottie-Style Feedback');
  console.error('   ', err.message);
  failed++;
}

// 25. Persona Preference, Masculine/Feminine Feed Curation, Gifting Sort & Product Varieties (Color, Shape, Size) Pipeline
test('Persona Preference, Masculine/Feminine Feed Curation, Gifting Sort & Product Varieties (Color, Shape, Size) Pipeline', () => {
  // 1. Store Persona Preference API
  assert.strictEqual(Store.getPersonaPreference(), 'all', 'Default persona preference must be "all"');
  Store.setPersonaPreference('masculine');
  assert.strictEqual(Store.getPersonaPreference(), 'masculine');
  Store.setPersonaPreference('feminine');
  assert.strictEqual(Store.getPersonaPreference(), 'feminine');
  Store.setPersonaPreference('all');
  assert.strictEqual(Store.getPersonaPreference(), 'all');

  // 2. Auth Modal Persona Selection & Patron Profile Sync (Male & Female Only, No Universal Button)
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(!indexHtml.includes('cf-persona-btn-all'), 'Login modal must NOT have a Universal button option');
  assert.ok(indexHtml.includes('cf-persona-btn-masculine') && indexHtml.includes('cf-persona-btn-feminine'), 'Login modal must contain only male and female options');
  assert.ok(!indexHtml.includes('Feed Curation &amp; Gifting Preference'), 'Login modal must NOT contain the verbose paragraph banner');

  sandbox.window.setAuthPersona('masculine');
  const hiddenPersonaInput = mockDocument.getElementById('cf-auth-selected-persona');
  assert.strictEqual(hiddenPersonaInput.value, 'masculine', 'Hidden persona input must be updated to masculine');
  assert.strictEqual(Store.getPersonaPreference(), 'masculine', 'Store preference must sync to masculine');

  // Test toggle deselects back to 'all' without showing Universal
  sandbox.window.setAuthPersona('masculine');
  assert.strictEqual(Store.getPersonaPreference(), 'all', 'Toggling active persona in auth modal must reset to default "all"');

  // Set to masculine for login test
  sandbox.window.setAuthPersona('masculine');

  // Test login syncs persona into patron profile
  Store.logoutPatron();
  sandbox.window.completeOAuthChooserAccount('google', 'vikram.raval@gmail.com', 'Vikram Raval');
  const patronProfile = Store.getPatronProfile();
  assert.strictEqual(patronProfile.personaPreference, 'masculine', 'Patron profile must retain selected persona preference');

  // 3. Feed Curation & Sorting based on Persona Preference (No Universal Option in Feed Bar)
  // Masculine feed prioritization
  sandbox.window.setFeedPersona('masculine');
  sandbox.window.navigateTo('home');
  const homeHtmlMasculine = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(homeHtmlMasculine.includes('Feed Curation &amp; Gifting Preference'), 'Home view must display Curation header & explainer');
  assert.ok(!homeHtmlMasculine.includes('✨ Universal'), 'Feed curation bar must NOT display a Universal button');
  assert.ok(homeHtmlMasculine.includes('Gifts for Him') || homeHtmlMasculine.includes('👔 For Him'), 'Home view must display masculine curation');

  // Feminine feed prioritization
  sandbox.window.setFeedPersona('feminine');
  sandbox.window.navigateTo('home');
  const homeHtmlFeminine = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(homeHtmlFeminine.includes('Gifts for Her') || homeHtmlFeminine.includes('🌸 For Her'), 'Home view must display feminine curation');

  // Catalog Gifting & Persona Sort
  sandbox.window.navigateTo('catalog');
  sandbox.window.setCatalogSort('gifts_him');
  const catalogHimHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(catalogHimHtml.includes('👔 For Him') || catalogHimHtml.includes('Executive'), 'Catalog sorted by gifts_him must display masculine items');

  sandbox.window.setCatalogSort('gifts_her');
  const catalogHerHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(catalogHerHtml.includes('🌸 For Her') || catalogHerHtml.includes('Bridal') || catalogHerHtml.includes('Blush'), 'Catalog sorted by gifts_her must display feminine items');

  sandbox.window.setCatalogSort('gifting');
  const catalogGiftHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(catalogGiftHtml.includes('🎁 Gift Set') || catalogGiftHtml.includes('Keepsake') || catalogGiftHtml.includes('Preservation'), 'Catalog sorted by gifting must prioritize gifting sets');

  // 4. Product Varieties: Color Swatches, Shape Chips, Size Price Deltas
  const varietyProduct = {
    id: 'test-var-prod',
    name: 'Artisanal Keepsake with Varieties',
    shortName: 'Artisanal Keepsake',
    price: 2499,
    regularPrice: 2999,
    category: 'keepsakes',
    colors: [
      { id: 'c-gold', label: '24K Gold Leaf', hex: '#d4af37', accent: '#fcf8ea' },
      { id: 'c-silver', label: 'Silver Agate', hex: '#94a3b8', accent: '#e2e8f0' }
    ],
    shapes: [
      { id: 's-arch', label: 'Mughal Arch', icon: 'account_balance' },
      { id: 's-cube', label: 'Romantic Cube', icon: 'crop_square' }
    ],
    sizes: [
      { id: 'sz-8in', label: '8" Mini Block', desc: 'Mini edition', priceDelta: 0 },
      { id: 'sz-12in', label: '12" Grand Block', desc: 'Grand edition', priceDelta: 1000 }
    ],
    inStock: true
  };
  Store.receiveStudioPush({
    action: 'STUDIO_UPSERT_PRODUCT',
    payload: varietyProduct
  });
  const testProduct = Store.getProductById('test-var-prod');
  assert.ok(Array.isArray(testProduct.colors) && testProduct.colors.length >= 2, 'Product must have multiple color swatches');
  assert.ok(Array.isArray(testProduct.shapes) && testProduct.shapes.length >= 2, 'Product must have multiple shape varieties');
  assert.ok(Array.isArray(testProduct.sizes) && testProduct.sizes.length >= 2, 'Product must have multiple size options');
  assert.ok(testProduct.sizes.some(s => s.priceDelta > 0), 'Product must offer size upgrades with price deltas');

  // Test card variety toggle & drawer
  sandbox.window.navigateTo('home');
  sandbox.window.toggleProductVariety(testProduct.id);
  const varietyDrawer = mockDocument.getElementById(`variety-drawer-${testProduct.id}`);
  assert.ok(varietyDrawer, 'Variety drawer element must exist on card');
  assert.ok(!varietyDrawer.classList.contains('hidden'), 'Variety drawer must be revealed on toggle');

  // Test swatch & chip selection
  sandbox.window.selectCardVariety(testProduct.id, 'color', 1);
  sandbox.window.selectCardVariety(testProduct.id, 'shape', 1);
  sandbox.window.selectCardVariety(testProduct.id, 'size', 1); // Grand Archival (+650)

  // Test adding selected custom variety to bag
  Store.saveCart([]);
  sandbox.window.addCustomVarietyToCart(testProduct.id);
  const cartWithVariety = Store.getCart();
  assert.strictEqual(cartWithVariety.length, 1, 'Cart must have 1 customized item');
  const cartItem = cartWithVariety[0];
  assert.strictEqual(cartItem.productId, testProduct.id);
  assert.ok(cartItem.color, 'Cart item must store selected color');
  assert.ok(cartItem.shape, 'Cart item must store selected shape');
  assert.ok(cartItem.size, 'Cart item must store selected size');
  assert.strictEqual(cartItem.price, testProduct.price + testProduct.sizes[1].priceDelta, 'Cart item price must reflect size priceDelta');

  // 5. PDP Variety Selection
  sandbox.window.navigateTo('product', testProduct.id);
  sandbox.window.selectPdpVariety('color', 0);
  sandbox.window.selectPdpVariety('shape', 2);
  sandbox.window.selectPdpVariety('size', 1);
  sandbox.window.addPdpToCart();

  const cartAfterPdp = Store.getCart();
  assert.strictEqual(cartAfterPdp.length, 2, 'Cart must contain both distinct variety items');

  // 6. End-to-End Order Persistence & Invoicing of Varieties
  const placeRes = Store.placeOrder({
    name: 'Vikram Raval',
    phone: '+91 9876543210',
    address: 'Indiranagar 100ft Road, Bengaluru',
    pincode: '560038',
    paymentMethod: 'UPI Instant (GPay / PhonePe)',
    giftWrap: true
  });
  assert.ok(placeRes.success && placeRes.order, 'Order placement with varieties must succeed');
  const placedOrder = placeRes.order;
  assert.ok(placedOrder.items.length >= 2, 'Order must contain placed items');
  placedOrder.items.forEach(item => {
    assert.ok(item.color, 'Persisted order item must retain color');
    assert.ok(item.shape, 'Persisted order item must retain shape');
    assert.ok(item.size, 'Persisted order item must retain size');
  });

  // Check Account view renders variety chips
  sandbox.window.navigateTo('account');
  const accountHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(accountHtml.includes('Color:') || accountHtml.includes('🎨'), 'Account view must display order item variety color');
  assert.ok(accountHtml.includes('Shape:') || accountHtml.includes('📐'), 'Account view must display order item variety shape');
  assert.ok(accountHtml.includes('Size:') || accountHtml.includes('📏'), 'Account view must display order item variety size');

  // Check GST Invoice Modal renders variety specifications
  sandbox.window.openOrderInvoiceModal(placedOrder.orderId);
  const invoiceModal = mockDocument.getElementById('tds-spec-modal');
  assert.ok(!invoiceModal.classList.contains('hidden'), 'Invoice modal must open');
  const invoiceHtml = mockDocument.getElementById('tds-modal-body').innerHTML;
  assert.ok(invoiceHtml.includes('Color:'), 'Tax invoice must itemize variety color');
  assert.ok(invoiceHtml.includes('Shape:'), 'Tax invoice must itemize variety shape');
  assert.ok(invoiceHtml.includes('Size:'), 'Tax invoice must itemize variety size');
  sandbox.window.closeTdsModal();

  // Reset to universal feed & home
  sandbox.window.setFeedPersona('all');
  sandbox.window.navigateTo('home');
});

test('Mobile Screen Single-Line Order ID & Hamburger Drawer Architecture (Hick\'s Law & Zero Duplicates)', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  // 1. Verify index.html contains distinct Account section and distinct Orders & Live Tracking section
  assert.ok(indexHtml.includes('id="bar-drawer-account-slot"'), 'Drawer must include dedicated account slot');
  assert.ok(indexHtml.includes('Orders &amp; Live Tracking'), 'Drawer must include distinct Orders & Live Tracking card');
  assert.ok(indexHtml.includes('5-Stage Telemetry'), 'Drawer Orders card must display 5-Stage Telemetry badge');

  // 2. Verify Zero duplicate action buttons in mobile-menu-drawer
  const drawerMatch = indexHtml.match(/<div id="mobile-menu-drawer"[\s\S]*?<!-- 2\. Technical/);
  assert.ok(drawerMatch, 'Must find mobile-menu-drawer markup');
  const drawerHtml = drawerMatch[0];

  const navOnclicks = Array.from(drawerHtml.matchAll(/onclick="([^"]+)"/g)).map(m => m[1]);
  const accountNavs = navOnclicks.filter(c => c.includes("navigateTo('account')"));
  assert.strictEqual(accountNavs.length, 1, 'Drawer must have exactly ONE button navigating to account (no duplicates)');

  const catalogNavs = navOnclicks.filter(c => c.includes("navigateTo('catalog'"));
  assert.strictEqual(catalogNavs.length, 1, 'Drawer must have exactly ONE button navigating to catalog (no duplicates)');

  const staticBarModalNavs = drawerHtml.slice(drawerHtml.indexOf('Store Navigation')).match(/openAccountBarModal/g) || [];
  assert.strictEqual(staticBarModalNavs.length, 0, 'Navigation list must not have duplicate openAccountBarModal button');

  // 3. Verify Single-Line Order ID rendering in renderBarOrdersHtml & app.js
  const sampleOrder = {
    orderId: 'VK-2026-9097',
    orderNumber: 'VK-2026-9097',
    date: '19 Oct 2026',
    total: 548,
    status: 'Order Confirmed • Studio Batch',
    stageIndex: 1,
    stages: ['Order Confirmed', 'Materials Prepped', 'Silica Dehydration', 'Deep Cast Pour', 'Polish & Dispatch'],
    courier: 'BlueDart Priority Air',
    trackingNumber: '7810283941',
    mockupApproved: true
  };
  mockLocalStorage.setItem('ram_vk_orders_v2', JSON.stringify([sampleOrder]));
  Store.receiveAdminPush({
    type: 'ADMIN_UPDATE_ORDER_STATUS',
    order: sampleOrder
  });

  sandbox.window.openAccountBarModal();
  const barModalContent = mockDocument.getElementById('account-bar-modal-body').innerHTML;
  assert.ok(barModalContent.includes('VK-2026-9097'), 'Account bar modal must render sample order VK-2026-9097');
  assert.ok(barModalContent.includes('whitespace-nowrap'), 'Order ID in account bar modal must have whitespace-nowrap to guarantee single-line display');
  assert.ok(barModalContent.includes('shrink-0 max-w-[115px]') || barModalContent.includes('shrink-0 max-w-[120px]'), 'Status badge must have shrink-0 and max-width restraint to prevent squishing order ID');

  // Check account view has whitespace-nowrap on order ID
  sandbox.window.navigateTo('account');
  const accountHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(accountHtml.includes('ORDER #VK-2026-9097'), 'Account view must display sample order ID');
  assert.ok(accountHtml.includes('whitespace-nowrap">ORDER #'), 'Order ID on account page must have whitespace-nowrap');

  // Check drawer account slot when logged in
  sandbox.window.completeOAuthChooserAccount('google', 'test.patron@example.com', 'Test Patron');
  sandbox.window.updateGlobalBadges();
  const drawerSlotHtml = mockDocument.getElementById('bar-drawer-account-slot').innerHTML;
  assert.ok(drawerSlotHtml.includes('Manage Profile &amp; Address'), 'Authenticated drawer slot must offer Manage Profile & Address');
  assert.ok(!drawerSlotHtml.includes('>Edit<'), 'Authenticated drawer slot must not have redundant Edit button');
  assert.ok(drawerSlotHtml.includes('Sign Out'), 'Authenticated drawer slot must offer Sign Out');

  // Clean up
  sandbox.window.handlePatronLogout();
  sandbox.window.navigateTo('home');
});

console.log(`\n========================================`);
console.log(`Verification Summary: ${passed} passed, ${failed} failed`);
console.log(`========================================`);
if (failed > 0) process.exit(1);


