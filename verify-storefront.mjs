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

  // Verify default Patron Profile has non-empty defaultAddress & memberTier on fresh load before any edits
  const initialProfile = Store.getPatronProfile();
  assert.ok(initialProfile.defaultAddress && initialProfile.defaultAddress.includes('Bengaluru'), 'Default Patron Profile must define non-empty defaultAddress on initial load');
  assert.ok(initialProfile.memberTier && initialProfile.memberTier.includes('Gold'), 'Default Patron Profile must define memberTier on initial load');

  for (const [route, param, expectedSubstring] of routes) {
    sandbox.window.navigateTo(route, param);
    (windowListeners['hashchange'] || []).forEach(fn => fn());
    const rendered = mockDocument.getElementById('app-view-root').innerHTML;
    assert.ok(rendered.includes(expectedSubstring), `Route #/${route} did not render "${expectedSubstring}"`);
    if (route === 'account') {
      assert.ok(rendered.includes(initialProfile.defaultAddress), 'Account view must render default dispatch address on initial load');
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

  // Approve pre-pour layout mockup for default order RAM-2025-8841
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

console.log(`\n========================================`);
console.log(`Verification Summary: ${passed} passed, ${failed} failed`);
console.log(`========================================`);
if (failed > 0) process.exit(1);



