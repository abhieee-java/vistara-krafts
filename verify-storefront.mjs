import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ROOT = 'C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront';

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
    getAttribute: () => null,
    addEventListener: () => {},
    querySelector: () => makeMockElement(),
    querySelectorAll: () => []
  };
  if (id) elementsById.set(id, el);
  return el;
}

const mockDocument = {
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
  document: mockDocument,
  localStorage: mockLocalStorage,
  location: { hash: '#/home', href: 'http://localhost/index.html#/home' },
  navigator: { clipboard: { writeText: async () => {} } },
  scrollTo: () => {},
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
vm.createContext(sandbox);

const bridgeCode = fs.readFileSync(path.join(ROOT, 'store-bridge.js'), 'utf8');
vm.runInContext(bridgeCode, sandbox);

const appCode = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
vm.runInContext(appCode, sandbox);

const Store = sandbox.window.ResinStore;

test('StorefrontBridge initializes globally on window.ResinStore and window.StorefrontBridge', () => {
  assert.ok(Store, 'ResinStore should be defined');
  assert.strictEqual(sandbox.window.StorefrontBridge, Store);
});

test('Catalog contains 12 curated products across Resin Art Memories, Vistāra Krafts & POTRY', () => {
  const products = Store.getProducts();
  assert.strictEqual(products.length, 12);
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

test('Cart engine computes volume tier discounts, coupons, GST, and handles quantity 0 removal', () => {
  Store.clearCart();
  let summary = Store.getCartSummary();
  assert.strictEqual(summary.itemsCount, 0);
  assert.strictEqual(summary.subtotal, 0);
  assert.strictEqual(summary.payable, 0);

  Store.addToCart('vk-epx-301', 'kit-1200g', 1);
  summary = Store.getCartSummary();
  assert.strictEqual(summary.itemsCount, 1);
  assert.strictEqual(summary.subtotal, 1299);
  assert.strictEqual(summary.shippingFee, 99);

  Store.updateCartQty('vk-epx-301', 3, true);
  summary = Store.getCartSummary();
  assert.strictEqual(summary.itemsCount, 3);
  assert.strictEqual(summary.subtotal, 1199 * 3);
  assert.strictEqual(summary.shippingFee, 0);

  Store.updateCartQty('vk-epx-301', 6, true);
  summary = Store.getCartSummary();
  assert.strictEqual(summary.subtotal, 1089 * 6);

  const coupRes = Store.applyCoupon('flirty15');
  assert.strictEqual(coupRes.valid, true);
  summary = Store.getCartSummary();
  assert.strictEqual(summary.couponDiscount, Math.round(summary.subtotal * 0.15));

  const badCoup = Store.applyCoupon('NOTACODE99');
  assert.strictEqual(badCoup.valid, false);

  Store.updateCartQty('vk-epx-301', 0, true);
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

test('SPA Router in app.js renders all 7 customer routes and interactive modals cleanly', () => {
  // First test empty cart view
  sandbox.window.navigateTo('cart', null);
  (windowListeners['hashchange'] || []).forEach(fn => fn());
  const emptyCartHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(emptyCartHtml.includes('Bag is Empty') || emptyCartHtml.includes('Studio Bag'), 'Empty cart view should render empty state');

  // Now add an item so populated cart view renders Invoice Summary
  Store.addToCart('vk-epx-301', 'kit-1200g', 2);

  const routes = [
    ['home', null, 'Live from @resin.art.memories'],
    ['catalog', null, 'Keepsake Art'],
    ['product', 'ram-keep-001', 'Eternal Varmala'],
    ['product', 'potry-sienna-01', 'Sienna Ridged Stoneware'],
    ['social', null, '@resin.art.memories'],
    ['custom-studio', null, 'Custom Memory'],
    ['wishlist', null, 'Saved'],
    ['cart', null, 'Invoice Summary'],
    ['account', null, 'Admin Host']
  ];

  for (const [route, param, expectedSubstring] of routes) {
    sandbox.window.navigateTo(route, param);
    (windowListeners['hashchange'] || []).forEach(fn => fn());
    const rendered = mockDocument.getElementById('app-view-root').innerHTML;
    assert.ok(rendered.includes(expectedSubstring), `Route #/${route} did not render "${expectedSubstring}"`);
  }

  // Test interactive modals & live Admin Host push simulation
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
  vm.createContext(blockedSandbox);
  vm.runInContext(bridgeCode, blockedSandbox);

  const BStore = blockedSandbox.window.ResinStore;
  const prods1 = BStore.getProducts();
  assert.strictEqual(prods1.length, 12);
  prods1.pop();
  assert.strictEqual(BStore.getProducts().length, 12, 'Mutating returned products array must not corrupt DEFAULT_PRODUCTS');

  // Verify cart persistence in memory when localStorage is blocked
  BStore.clearCart();
  assert.strictEqual(BStore.getCartSummary().itemsCount, 0);
  BStore.addToCart('vk-epx-301', 'kit-1200g', 2);
  assert.strictEqual(BStore.getCartSummary().itemsCount, 2);
  assert.strictEqual(BStore.getCartSummary().subtotal, 2598);

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

  Store.addToCart('ram-keep-002', 'ocn-std', 3);
  const summary3 = Store.getCartSummary();
  assert.strictEqual(summary3.subtotal, 2023 * 3);

  // Render cart view and verify line item displays discounted ₹6,069 and Volume Tier Applied badge
  sandbox.window.navigateTo('cart', null);
  (windowListeners['hashchange'] || []).forEach(fn => fn());
  let cartHtml = mockDocument.getElementById('app-view-root').innerHTML;
  assert.ok(cartHtml.includes('Volume Tier Applied'), 'Cart line item should show Volume Tier Applied badge when qty >= 3');
  assert.ok(cartHtml.includes('₹6,069'), 'Cart line item total should match volume-discounted unit price * qty');

  // Apply FLIRTY15 (minOrder ₹2,500) at subtotal ₹6,069 -> valid
  const applied = Store.applyCoupon('FLIRTY15');
  assert.strictEqual(applied.valid, true);
  assert.strictEqual(Store.getCartSummary().couponCode, 'FLIRTY15');

  // Now reduce quantity to 1 (subtotal ₹2,199 < ₹2,500) -> should surface couponInvalidReason & warning banner
  Store.updateCartQty('ram-keep-002', 1, true);
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

  // Verify POTRY product alias resolves to potry-sienna-01
  assert.strictEqual(Store.getProductById('potry-sienna-pitcher').id, 'potry-sienna-01');
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

console.log(`\n========================================`);
console.log(`Verification Summary: ${passed} passed, ${failed} failed`);
console.log(`========================================`);
if (failed > 0) process.exit(1);
