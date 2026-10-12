import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

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
    getAttribute: () => null,
    addEventListener: () => {},
    querySelector: () => makeMockElement(),
    querySelectorAll: () => []
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
vm.createContext(sandbox);

const cfConfigCode = fs.readFileSync(path.join(ROOT, 'cloudflare-config.js'), 'utf8');
vm.runInContext(cfConfigCode, sandbox);

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

test('SPA Router in app.js renders all 7 customer routes, enforces zero owner/admin UI leakage, and keeps programmatic bridge intact', () => {
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

  // 4. 1:1 Doming Resin calculator product resolution
  assert.strictEqual(Store.getProductById('vk-dom-101').id, 'vk-res-003');
  assert.strictEqual(Store.getProductById('vk-res-003').id, 'vk-res-003');

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
  assert.ok(appCode.includes('Express Buy Now (UPI / Card / COD)'), 'PDP right column must include inline primary conversion actions');

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
  assert.ok(castingCatalogHtml.includes('Pressed Rose &amp; 24K Gold Foil') || castingCatalogHtml.includes('ram-keep-004'), 'Casting category filter must include related botanical coaster keepsake (ram-keep-004)');

  // 3. Verify Recently Viewed products tracking & Express Buy Now on PDP
  sandbox.window.navigateTo('product', 'vk-epx-301');
  const recent = Store.getRecentlyViewedProducts('vk-epx-301', 4);
  assert.ok(recent.length > 0 && recent.some(p => p.id === 'ram-keep-001'), 'Recently viewed products must include previously visited ram-keep-001');
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
  Store.addToCart('vk-epx-301', 'kit-1200g', 1);
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
  assert.ok(indexHtml.includes('./cloudflare-config.js'), 'index.html must load ./cloudflare-config.js');

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

  // 2. Verify Cloudflare Full-Stack Framework files exist
  ['cloudflare-config.js', 'wrangler.toml', 'cloudflare/schema.sql', 'functions/api/[[route]].js', 'CLOUDFLARE_SETUP.md'].forEach(rel => {
    assert.ok(fs.existsSync(path.join(ROOT, rel)), `Cloudflare framework file ${rel} must exist`);
  });

  // 3. Decision 4: Test Guest Wishlist Sync across Sign-In and Sign-Out
  sandbox.window.handlePatronLogout();
  assert.strictEqual(Store.isAuthenticated(), false, 'Patron must be unauthenticated after logout');
  assert.strictEqual(Store.getWishlist().length, 0, 'Guest wishlist must be empty after logout');

  // Guest hearts 2 items while unauthenticated
  Store.toggleWishlist('ram-keep-001');
  Store.toggleWishlist('vk-epx-301');
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
  assert.deepStrictEqual(Store.getWishlist(), ['ram-keep-001', 'vk-epx-301'], 'Guest wishlist must merge into authenticated user account');

  // Logout resets active guest wishlist to [] while preserving Kavya's saved wishlist
  sandbox.window.handlePatronLogout();
  assert.strictEqual(Store.isAuthenticated(), false);
  assert.strictEqual(Store.getWishlist().length, 0, 'Logout must reset active guest wishlist to 0 items');

  // When Kavya logs back in via 1-click Google, her saved wishlist is restored
  sandbox.window.completeOAuthChooserAccount('google', 'kavya.nair@gmail.com', 'Kavya Nair');
  assert.strictEqual(Store.isAuthenticated(), true);
  assert.deepStrictEqual(Store.getWishlist(), ['ram-keep-001', 'vk-epx-301'], 'Returning user login must restore saved account wishlist');
  sandbox.window.handlePatronLogout();

  // 4. Test Guest Checkout Gate -> Step 1 (Sign In) -> Step 2 (Delivery Address at Checkout)
  Store.clearCart();
  Store.addToCart('vk-epx-301', 'kit-1200g', 1);
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
  Store.addToCart('vk-epx-301', 'kit-1200g', 1);
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
  assert.strictEqual(coreProducts.length, 12, 'Core catalogue must have 12 products');

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
    assert.ok(llmsContent.includes('https://vistarakrafts.in'), `${relPath} must document future custom domain https://vistarakrafts.in`);
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
  assert.strictEqual(catalogListNode.itemListElement.length, 12, 'Static JSON-LD ItemList must contain all 12 products');
  for (const listEl of catalogListNode.itemListElement) {
    assert.ok(listEl.item.offers.shippingDetails, `Static JSON-LD Product ${listEl.item.productID} must include OfferShippingDetails`);
    assert.ok(listEl.item.offers.hasMerchantReturnPolicy, `Static JSON-LD Product ${listEl.item.productID} must include hasMerchantReturnPolicy`);
  }

  // 3. Verify Store.getSeoConfig() and dynamic per-route / per-product / per-variant SEO updates in app.js
  const seoCfg = Store.getSeoConfig();
  assert.strictEqual(seoCfg.siteUrl, 'https://vistara-krafts.vercel.app');
  assert.strictEqual(seoCfg.futureCustomDomain, 'https://vistarakrafts.in');
  assert.strictEqual(seoCfg.geo.region, 'IN-KA');

  sandbox.window.navigateTo('product', 'ram-keep-001');
  const pdpSeo1 = sandbox.window.getActiveSeoSnapshot();
  assert.strictEqual(pdpSeo1.route, 'product');
  assert.strictEqual(pdpSeo1.productId, 'ram-keep-001');
  assert.strictEqual(pdpSeo1.canonicalUrl, 'https://vistara-krafts.vercel.app/#/product/ram-keep-001');
  assert.strictEqual(pdpSeo1.ogType, 'product');
  assert.ok(mockDocument.title.includes('Eternal Varmala & Bridal Bouquet Time-Capsule Block'), 'Document title must dynamically update to active product name');
  assert.strictEqual(mockDocument.getElementById('link-canonical').href, 'https://vistara-krafts.vercel.app/#/product/ram-keep-001');
  assert.strictEqual(mockDocument.getElementById('twitter-url').content, 'https://vistara-krafts.vercel.app/#/product/ram-keep-001');

  // Select variant index 2 (16" Gallery Mantel Frame + Coasters (2x) at ₹6,999) and verify dynamic price & title update
  sandbox.window.selectPdpVariant(2);
  const pdpSeoVariant2 = sandbox.window.getActiveSeoSnapshot();
  assert.strictEqual(pdpSeoVariant2.priceAmount, '6999', 'Selecting PDP variant must dynamically update og:price:amount and schema Offer price');
  assert.strictEqual(mockDocument.getElementById('og-price-amount').content, '6999');
  const dynamicGraphStr = mockDocument.getElementById('vistara-schema-jsonld').textContent;
  assert.ok(!dynamicGraphStr.includes('VK-DOM-101-1K'), 'Dynamic JSON-LD must not reference non-existent SKU VK-DOM-101-1K');
  assert.ok(dynamicGraphStr.includes('VK-HG-11-500'), 'Dynamic JSON-LD FAQPage must reference real SKU VK-HG-11-500');
  const dynamicGraphObj = JSON.parse(dynamicGraphStr);
  const activeOrgSchema = dynamicGraphObj['@graph'].find(n => Array.isArray(n['@type']) && n['@type'].includes('Organization'));
  assert.ok(activeOrgSchema.areaServed.includes('IN'), 'Dynamic Organization schema must include "IN" in areaServed');
  assert.ok(activeOrgSchema.hasMerchantReturnPolicy, 'Dynamic Organization schema must retain hasMerchantReturnPolicy');
  const howToNodes = dynamicGraphObj['@graph'].filter(n => n['@type'] === 'HowTo');
  assert.strictEqual(howToNodes.length, 2, 'Dynamic JSON-LD @graph must retain both HowTo nodes (#howto-varmala-preservation and #howto-epoxy-mixing)');
  const activeProdSchema = dynamicGraphObj['@graph'].find(n => n['@id'] && n['@id'].endsWith('#active-product'));
  assert.ok(activeProdSchema, 'Product route JSON-LD @graph must include dedicated #active-product node');
  assert.strictEqual(activeProdSchema.offers.price, '6999', 'Active product JSON-LD Offer price must match selected variant');
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

  // 4. Verify runtime custom domain swap via window.VISTARA_SITE_URL = 'https://vistarakrafts.in'
  sandbox.window.VISTARA_SITE_URL = 'https://vistarakrafts.in';
  sandbox.window.navigateTo('custom-studio');
  const swappedSeo = sandbox.window.getActiveSeoSnapshot();
  assert.strictEqual(swappedSeo.siteUrl, 'https://vistarakrafts.in', 'Setting window.VISTARA_SITE_URL must swap active siteUrl without refactoring');
  assert.strictEqual(swappedSeo.canonicalUrl, 'https://vistarakrafts.in/#/custom-studio');
  assert.strictEqual(mockDocument.getElementById('link-canonical').href, 'https://vistarakrafts.in/#/custom-studio');
  const swappedGraph = JSON.parse(mockDocument.getElementById('vistara-schema-jsonld').textContent);
  assert.strictEqual(swappedGraph['@graph'][0]['@id'], 'https://vistarakrafts.in/#organization');

  // Reset back to default Vercel domain and #/home
  delete sandbox.window.VISTARA_SITE_URL;
  sandbox.window.navigateTo('home');
  assert.strictEqual(mockDocument.getElementById('link-canonical').href, 'https://vistara-krafts.vercel.app/');
});

// Async test for Cloudflare Pages Function (functions/api/[[route]].js) against real SQLite with PRAGMA foreign_keys = ON
try {
  const { DatabaseSync } = await import('node:sqlite');
  const { onRequest } = await import('./functions/api/[[route]].js');
  // Test against a blank SQLite DB (without manually running schema.sql first) to verify ensureD1Schema auto-initializes tables!
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');

  const d1Mock = {
    prepare(sql) {
      return {
        _args: [],
        bind(...args) { this._args = args; return this; },
        async run() { return sqlite.prepare(sql).run(...this._args); },
        async first() { return sqlite.prepare(sql).get(...this._args) || null; },
        async all() { return { results: sqlite.prepare(sql).all(...this._args) }; }
      };
    }
  };
  const kvMap = new Map();
  const kvMock = {
    async put(k, v) { kvMap.set(k, v); },
    async get(k) { return kvMap.get(k) || null; },
    async delete(k) { kvMap.delete(k); }
  };
  const env = { DB: d1Mock, SESSIONS_KV: kvMock };

  async function callWorker(p, method = 'GET', body = null, token = '') {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = new Request(`https://vistarakrafts.com/api${p}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const res = await onRequest({ request: req, env });
    const data = await res.json();
    return { status: res.status, headers: res.headers, data };
  }

  // 1. Health endpoint, COOP header & SEO/Sitemap/LLMs endpoints
  const health = await callWorker('/health', 'GET');
  assert.strictEqual(health.status, 200);
  assert.strictEqual(health.headers.get('Cross-Origin-Opener-Policy'), 'same-origin-allow-popups');

  const seoApi = await callWorker('/seo', 'GET');
  assert.strictEqual(seoApi.status, 200);
  assert.strictEqual(seoApi.data.ok, true);
  assert.strictEqual(seoApi.data.siteUrl, 'https://vistara-krafts.vercel.app');
  assert.strictEqual(seoApi.data.futureCustomDomain, 'https://vistarakrafts.in');
  assert.strictEqual(seoApi.data.productsCount, 12);

  const seoCustomDomain = await callWorker('/seo?domain=https://vistarakrafts.in', 'GET');
  assert.strictEqual(seoCustomDomain.status, 200);
  assert.strictEqual(seoCustomDomain.data.siteUrl, 'https://vistarakrafts.in');
  assert.strictEqual(seoCustomDomain.data.sitemapUrl, 'https://vistarakrafts.in/sitemap.xml');

  const sitemapRes = await onRequest({
    request: new Request('https://vistarakrafts.com/api/sitemap.xml', { method: 'GET' }),
    env
  });
  assert.strictEqual(sitemapRes.status, 200);
  assert.ok((sitemapRes.headers.get('Content-Type') || '').includes('application/xml'));
  const sitemapText = await sitemapRes.text();
  const realCatalogIds = [
    'ram-keep-001', 'vk-epx-301', 'ram-keep-002', 'vk-epx-201',
    'ram-keep-003', 'vk-uv-hard', 'vk-pig-cham', 'ram-keep-004',
    'vk-res-003', 'vk-mld-geo', 'vk-res-006', 'potry-sienna-01'
  ];
  for (const pid of realCatalogIds) {
    assert.ok(sitemapText.includes(`<loc>https://vistara-krafts.vercel.app/#/product/${pid}</loc>`), `/api/sitemap.xml must include real product ID ${pid}`);
  }
  assert.ok(!sitemapText.includes('vk-res-004') && !sitemapText.includes('vk-uv-100') && !sitemapText.includes('vk-pig-ocean'), '/api/sitemap.xml must not include hallucinated product IDs');

  const llmsRes = await onRequest({
    request: new Request('https://vistarakrafts.com/api/llms.txt', { method: 'GET' }),
    env
  });
  assert.strictEqual(llmsRes.status, 200);
  const llmsText = await llmsRes.text();
  assert.ok(llmsText.includes('Vistāra Krafts'));
  for (const pid of realCatalogIds) {
    assert.ok(llmsText.includes(`/#/product/${pid}`), `/api/llms.txt must include real product ID ${pid}`);
  }

  // 2. First-time user login on /auth/login without upfront shipping address
  const login1 = await callWorker('/auth/login', 'POST', {
    email: 'first.login@vistara.in',
    password: 'Password#123'
  });
  assert.strictEqual(login1.status, 200, 'First-time /auth/login without upfront shipping address must succeed with 200 OK');
  assert.ok(login1.headers.get('Set-Cookie').includes('HttpOnly'), '/auth/login must set HttpOnly session cookie');

  // Verify both GET /auth/me and GET /auth/session work
  const meCheck = await callWorker('/auth/me', 'GET', null, login1.data.token);
  assert.strictEqual(meCheck.status, 200, 'GET /auth/me must return 200 OK');
  assert.strictEqual(meCheck.data.authenticated, true);
  const sessionCheck = await callWorker('/auth/session', 'GET', null, login1.data.token);
  assert.strictEqual(sessionCheck.status, 200, 'GET /auth/session must return 200 OK');
  assert.strictEqual(sessionCheck.data.authenticated, true);

  // 3. Duplicate email registration on /auth/register (resolves canonical users.id -> no FK error)
  const reg1 = await callWorker('/auth/register', 'POST', {
    email: 'dup.reg@vistara.in',
    password: 'Password#123',
    name: 'Rohan Mehta',
    phone: '+91 98201 33445',
    wishlist: ['ram-keep-001']
  });
  assert.strictEqual(reg1.status, 200);
  const reg2 = await callWorker('/auth/register', 'POST', {
    email: 'dup.reg@vistara.in',
    password: 'Password#123',
    name: 'Rohan Mehta Updated',
    wishlist: ['vk-epx-301']
  });
  assert.strictEqual(reg2.status, 200, 'Second /auth/register for existing email must succeed without D1 foreign key error');
  assert.deepStrictEqual(reg2.data.user.wishlist, ['ram-keep-001', 'vk-epx-301'], 'D1 /auth/register must merge wishlists');

  // 4. Dedicated /auth/google and /auth/apple endpoints without upfront address
  const googleAuth = await callWorker('/auth/google', 'POST', {
    email: 'dup.reg@vistara.in',
    name: 'Rohan Mehta Google'
  });
  assert.strictEqual(googleAuth.status, 200, 'POST /auth/google must succeed without upfront address');
  const appleAuth = await callWorker('/auth/apple', 'POST', {
    email: 'apple.patron@icloud.com',
    name: 'Ananya Apple'
  });
  assert.strictEqual(appleAuth.status, 200, 'POST /auth/apple must succeed without upfront address');

  // 5. PUT /auth/profile updates D1 user profile & wishlist
  const profUpdate = await callWorker('/auth/profile', 'PUT', {
    email: 'dup.reg@vistara.in',
    name: 'Rohan Mehta Atelier',
    phone: '+91 98201 99999',
    address: '88 Worli Sea Face, Mumbai - 400030',
    pincode: '400030',
    wishlist: ['ram-keep-001', 'vk-epx-301']
  }, googleAuth.data.token);
  assert.strictEqual(profUpdate.status, 200, 'PUT /auth/profile must return 200 OK');
  assert.strictEqual(profUpdate.data.user.name, 'Rohan Mehta Atelier');

  // 6. POST /orders & GET /orders persist and retrieve orders in D1 AND update user address in both D1 and edgeMemoryUsers
  const postOrd = await callWorker('/orders', 'POST', {
    orderId: 'VK-2026-9901',
    customerName: 'Rohan Mehta Atelier',
    customerEmail: 'dup.reg@vistara.in',
    phone: '+91 98201 99999',
    address: '99 Cuffe Parade, Mumbai - 400005',
    pincode: '400005',
    subtotal: 2598,
    discount: 150,
    gstAmount: 373.42,
    total: 2448,
    paymentMethod: 'UPI Instant',
    giftWrap: true,
    items: [{ productId: 'vk-epx-301', name: 'UltraClear 3:1 Casting Resin', qty: 2, price: 1299 }]
  }, googleAuth.data.token);
  assert.strictEqual(postOrd.status, 200, 'POST /orders must persist order in D1 and return 200 OK');

  // Verify subsequent Google login without address preserves the address saved during POST /orders
  const googleReauth = await callWorker('/auth/google', 'POST', {
    email: 'dup.reg@vistara.in',
    name: 'Rohan Mehta Atelier'
  });
  assert.strictEqual(googleReauth.data.user.address, '99 Cuffe Parade, Mumbai - 400005', 'POST /orders must persist delivery address to user profile in D1 and edgeMemoryUsers');
  assert.strictEqual(googleReauth.data.user.pincode, '400005', 'POST /orders must persist PIN code to user profile in D1 and edgeMemoryUsers');

  const getOrds = await callWorker('/orders?email=dup.reg@vistara.in', 'GET', null, googleAuth.data.token);
  assert.strictEqual(getOrds.status, 200, 'GET /orders must return 200 OK');
  assert.strictEqual(getOrds.data.orders.length, 1);
  assert.strictEqual(getOrds.data.orders[0].orderId, 'VK-2026-9901');

  console.log('✅ PASS: Cloudflare Pages Function (functions/api/[[route]].js) passes real SQLite/D1 foreign-key, 1-Click OAuth, Wishlist Merge & Order persistence tests');
  passed++;
} catch (err) {
  console.error('❌ FAIL: Cloudflare Pages Function D1/SQLite integration test');
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
    const { DatabaseSync } = await import('node:sqlite');
    const { onRequest } = await import('./functions/api/[[route]].js');

    const e2eSqlite = new DatabaseSync(':memory:');
    e2eSqlite.exec('PRAGMA foreign_keys = ON;');
    const e2eD1 = {
      prepare(sql) {
        return {
          _args: [],
          bind(...args) { this._args = args; return this; },
          async run() { return e2eSqlite.prepare(sql).run(...this._args); },
          async first() { return e2eSqlite.prepare(sql).get(...this._args) || null; },
          async all() { return { results: e2eSqlite.prepare(sql).all(...this._args) }; }
        };
      }
    };
    const e2eKvMap = new Map();
    const e2eEnv = {
      DB: e2eD1,
      SESSIONS_KV: {
        async put(k, v) { e2eKvMap.set(k, v); },
        async get(k) { return e2eKvMap.get(k) || null; },
        async delete(k) { e2eKvMap.delete(k); }
      }
    };

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
          const chunks = [];
          for await (const c of req) chunks.push(c);
          const bodyBuf = Buffer.concat(chunks);
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) {
            if (v) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
          }
          const cfReq = new Request(`http://127.0.0.1${u.pathname}${u.search}`, {
            method: req.method,
            headers,
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : bodyBuf
          });
          const cfRes = await onRequest({ request: cfReq, env: e2eEnv });
          res.statusCode = cfRes.status;
          cfRes.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await cfRes.arrayBuffer()));
          return;
        }
        let filePath = path.join(ROOT, u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname));
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(ROOT, 'index.html');
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

    // 1b. Verify SEO, GEO, and AEO endpoints & dynamic DOM head updates in real Headless Chrome
    const chromeSeoAudit = await cdpEval(`(async () => {
      const [robotsRes, sitemapRes, llmsRes, llmsFullRes, apiSeoRes] = await Promise.all([
        fetch('/robots.txt'),
        fetch('/sitemap.xml'),
        fetch('/llms.txt'),
        fetch('/llms-full.txt'),
        fetch('/api/seo')
      ]);
      const apiSeoJson = await apiSeoRes.json();

      window.navigateTo('product', 'ram-keep-001');
      window.selectPdpVariant(1);
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
    assert.ok(chromeSeoAudit.pdpTitle.includes('Eternal Varmala'), 'Headless Chrome: PDP title must include product name');
    assert.strictEqual(chromeSeoAudit.pdpCanonical, 'https://vistara-krafts.vercel.app/#/product/ram-keep-001');
    assert.strictEqual(chromeSeoAudit.pdpOgPrice, '4499');
    assert.ok(chromeSeoAudit.pdpGraphCount >= 7, 'Headless Chrome: PDP JSON-LD @graph must contain at least 7 structured nodes');

    // 2. Verify full E2E user journey in real Chrome:
    // Guest wishlist -> Add to bag -> Checkout Gate -> 1-Click Google OAuth Chooser -> Step 2 Checkout Address -> Order Placement -> Logout -> Apple OAuth Chooser
    const e2eResult = await cdpEval(`(async () => {
      window.VistaraStore.toggleWishlist('ram-keep-001');
      window.VistaraStore.addToCart('vk-epx-301', 'kit-1200g', 1);
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

    // 3. Verify zero horizontal overflow across all 8 SPA routes and modals at 320x568, 375x812, and 1280x800
    for (const vp of [{ width: 320, height: 568 }, { width: 375, height: 812 }, { width: 1280, height: 800 }]) {
      await cdpSend('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: vp.width < 768
      });
      for (const route of ['home', 'catalog', 'product', 'social', 'custom-studio', 'wishlist', 'cart', 'account']) {
        const metrics = await cdpEval(`(async () => {
          window.navigateTo('${route}', ${route === 'product' ? "'ram-keep-001'" : 'null'});
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
      window.StorefrontBridge.addToCart('vk-epx-301', 'kit-1200g', 1);
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

    console.log('✅ PASS: Real Headless Chrome E2E & Multi-Viewport Layout Verification (320px, 375px, 1280px)');
    passed++;
  } catch (err) {
    console.error('❌ FAIL: Real Headless Chrome E2E verification');
    console.error('   ', err.message);
    failed++;
  }
}

console.log(`\n========================================`);
console.log(`Verification Summary: ${passed} passed, ${failed} failed`);
console.log(`========================================`);
if (failed > 0) process.exit(1);


