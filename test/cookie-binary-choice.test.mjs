import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

describe('Vistāra Krafts — Binary Cookie & Privacy Choice Suite', () => {
  const rootDir = process.cwd();
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const storeBridgeCode = fs.readFileSync(path.join(rootDir, 'store-bridge.js'), 'utf8');
  const analyticsCode = fs.readFileSync(path.join(rootDir, 'analytics.js'), 'utf8');
  const privacyHtml = fs.readFileSync(path.join(rootDir, 'privacy.html'), 'utf8');

  it('1. Markup Verification: index.html contains exact Binary Choice copy, buttons, and Privacy link', () => {
    // Exact requested copy
    const expectedCopy = 'We use cookies to personalize your atelier experience and analyze traffic. You can choose to accept all or keep only essential cookies.';
    assert.ok(indexHtml.includes(expectedCopy), 'index.html must contain exact Binary Choice copy');

    // Banner region
    assert.ok(indexHtml.includes('id="dpdp-consent-banner"'), 'index.html must contain #dpdp-consent-banner');

    // Accept All button (primary navy pill)
    assert.ok(indexHtml.includes('id="btn-cookie-accept-all"'), 'index.html must have #btn-cookie-accept-all');
    assert.ok(indexHtml.includes('Accept All'), 'index.html must have "Accept All" button text');
    assert.ok(indexHtml.includes('bg-primary'), 'Accept All must use primary navy pill styling');

    // Essential Only button (subtle outline / ghost button)
    assert.ok(indexHtml.includes('id="btn-cookie-essential"'), 'index.html must have #btn-cookie-essential');
    assert.ok(indexHtml.includes('Essential Only'), 'index.html must have "Essential Only" button text');
    assert.ok(indexHtml.includes('border border-primary/25'), 'Essential Only must use subtle outline styling');

    // Privacy Policy link
    assert.ok(indexHtml.includes('href="./privacy.html"'), 'index.html must link to ./privacy.html');
    assert.ok(indexHtml.includes('Privacy Policy'), 'index.html banner must show Privacy Policy link');
  });

  it('2. Statutory Policy Disclosure: privacy.html contains explicit Cookie Choice & Telemetry section', () => {
    assert.ok(privacyHtml.includes('Cookie Policy &amp; Binary Choice Telemetry Controls'), 'privacy.html must have dedicated Cookie Policy heading');
    assert.ok(privacyHtml.includes('Essential Cookies &amp; Storage (Always Active)'), 'privacy.html must describe essential storage');
    assert.ok(privacyHtml.includes('Analytics &amp; Ad Trackers (Requires "Accept All")'), 'privacy.html must detail optional trackers');
  });

  describe('3. Functional Consent State Machine & Tracker Gating in Sandbox', () => {
    let context;
    let gtagCalls;
    let fbqCalls;
    let clarityCalls;
    let localStorageStore;

    beforeEach(() => {
      gtagCalls = [];
      fbqCalls = [];
      clarityCalls = [];
      localStorageStore = {};

      context = {
        console: console,
        dataLayer: [],
        gtag: (...args) => gtagCalls.push(args),
        fbq: (...args) => fbqCalls.push(args),
        clarity: (...args) => clarityCalls.push(args),
        localStorage: {
          getItem: (key) => localStorageStore[key] || null,
          setItem: (key, val) => { localStorageStore[key] = String(val); },
          removeItem: (key) => { delete localStorageStore[key]; },
          clear: () => { localStorageStore = {}; }
        },
        document: {
          title: 'Vistāra Krafts — Keepsake Atelier',
          querySelector: () => null,
          getElementById: () => ({ classList: { add: () => {}, remove: () => {} } })
        }
      };
      context.window = context;
      context.globalThis = context;

      // Execute store-bridge.js and analytics.js in VM
      vm.createContext(context);
      vm.runInContext(storeBridgeCode, context);
      vm.runInContext(analyticsCode, context);
    });

    it('3a. acceptAllCookies() enables GA4, Meta Pixel, and Microsoft Clarity', () => {
      const Store = context.ResinStore;
      const Analytics = context.VistaraAnalytics;

      // Perform Accept All
      const result = Store.acceptAllCookies();
      Analytics.setConsent('all');

      assert.equal(result.accepted, true);
      assert.equal(result.choice, 'all');
      assert.equal(result.categories.analyticsSession, true);
      assert.equal(result.categories.marketingPromos, true);

      // Check GA4 Consent Mode
      const consentUpdate = gtagCalls.find(c => c[0] === 'consent' && c[1] === 'update');
      assert.ok(consentUpdate, 'gtag consent update must be emitted');
      assert.equal(consentUpdate[2].analytics_storage, 'granted');
      assert.equal(consentUpdate[2].ad_storage, 'granted');
      assert.equal(context['ga-disable-G-QVM9JT6BW3'], false);

      // Check Meta Pixel consent
      const metaConsent = fbqCalls.find(c => c[0] === 'consent' && c[1] === 'grant');
      assert.ok(metaConsent, 'fbq consent grant must be emitted');

      // Check Clarity consent
      const clarityConsent = clarityCalls.find(c => c[0] === 'consent' && c[1] === true);
      assert.ok(clarityConsent, 'clarity consent true must be emitted');

      // Verify telemetry is allowed and active
      assert.equal(Analytics.isAnalyticsAllowed(), true);

      gtagCalls.length = 0;
      fbqCalls.length = 0;
      Analytics.trackPageView('home', 'Vistāra Krafts Studio');

      assert.equal(gtagCalls.some(c => c[0] === 'event' && c[1] === 'page_view'), true, 'GA4 page_view must be dispatched');
      assert.equal(fbqCalls.some(c => c[0] === 'track' && c[1] === 'PageView'), true, 'Meta PageView must be dispatched');
    });

    it('3b. acceptEssentialCookies() disables GA4, Meta Pixel, and Clarity while keeping telemetry suppressed', () => {
      const Store = context.ResinStore;
      const Analytics = context.VistaraAnalytics;

      // Perform Essential Only
      const result = Store.acceptEssentialCookies();
      Analytics.setConsent('essential');

      assert.equal(result.accepted, true);
      assert.equal(result.choice, 'essential');
      assert.equal(result.categories.analyticsSession, false);
      assert.equal(result.categories.marketingPromos, false);

      // Check GA4 Consent Mode set to denied
      const consentDenied = gtagCalls.find(c => c[0] === 'consent' && c[1] === 'update' && c[2].analytics_storage === 'denied');
      assert.ok(consentDenied, 'gtag consent must be updated to denied');
      assert.equal(context['ga-disable-G-QVM9JT6BW3'], true, 'GA4 disable flag must be true');

      // Check Meta Pixel consent revoked
      const metaRevoke = fbqCalls.find(c => c[0] === 'consent' && c[1] === 'revoke');
      assert.ok(metaRevoke, 'fbq consent revoke must be emitted');

      // Check Clarity consent false
      const clarityFalse = clarityCalls.find(c => c[0] === 'consent' && c[1] === false);
      assert.ok(clarityFalse, 'clarity consent false must be emitted');

      // Verify telemetry is strictly suppressed
      assert.equal(Analytics.isAnalyticsAllowed(), false, 'Analytics must not be allowed in essential mode');

      gtagCalls.length = 0;
      fbqCalls.length = 0;

      Analytics.trackPageView('catalog', 'Catalogue');
      Analytics.trackAddToCart({ id: 'vk-1', name: 'Test Resin', price: 999 });
      Analytics.trackInitiateCheckout({ total: 999, cart: [] });
      Analytics.trackPurchase({ orderId: 'VK-100', total: 999 });

      assert.equal(gtagCalls.length, 0, 'Zero GA4 calls must be emitted when essential mode is active');
      assert.equal(fbqCalls.length, 0, 'Zero Meta Pixel calls must be emitted when essential mode is active');
    });

    it('3c. Essential Atelier Services (Cart, Wishlist, State) operate without interruption in Essential Mode', () => {
      const Store = context.ResinStore;
      Store.acceptEssentialCookies();

      // Cart works seamlessly
      assert.equal(Store.getCart().length, 0);
      Store.addToCart('vk-cat-res-301', null, 2);
      const cart = Store.getCart();
      assert.equal(cart.length, 1);
      assert.equal(cart[0].qty, 2);

      // Wishlist works seamlessly
      assert.equal(Store.getWishlist().length, 0);
      Store.toggleWishlist('vk-cat-res-301');
      assert.equal(Store.getWishlist().includes('vk-cat-res-301'), true);

      // Order draft and PIN verifier work seamlessly
      assert.equal(Store.verifyPincode('560001').valid, true);
      assert.equal(Store.verifyPincode('000000').valid, false);
    });
  });
});
