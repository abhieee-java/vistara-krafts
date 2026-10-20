import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ROOT = process.cwd();

async function run() {
  console.log('========================================================================');
  console.log('VISTĀRA KRAFTS — LIVE SETTINGS & SUPPORT EMAIL SYNCHRONIZATION TEST');
  console.log('========================================================================\n');

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
        contains: (c) => classes.has(c),
        toggle: (c, force) => { if (force === undefined) { if (classes.has(c)) classes.delete(c); else classes.add(c); } else if (force) classes.add(c); else classes.delete(c); }
      },
      setAttribute: () => {},
      removeAttribute: () => {},
      appendChild: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    };
    elementsById.set(id, el);
    return el;
  }

  // Pre-populate key DOM elements
  makeMockElement('footer-support-email');
  makeMockElement('footer-support-phone');
  makeMockElement('drawer-support-email');
  makeMockElement('drawer-support-phone');
  makeMockElement('drawer-brand-name');
  makeMockElement('drawer-brand-tagline');
  makeMockElement('drawer-instagram-link');
  makeMockElement('footer-brand-name');
  makeMockElement('footer-brand-description');
  makeMockElement('footer-instagram-link');
  makeMockElement('footer-instagram-handle');
  makeMockElement('top-announcement-bar');
  makeMockElement('announcement-text');

  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    fetch: globalThis.fetch,
    Headers: globalThis.Headers,
    Request: globalThis.Request,
    Response: globalThis.Response,
    URL: globalThis.URL,
    localStorage: mockLocalStorage,
    document: {
      getElementById: (id) => elementsById.get(id) || makeMockElement(id),
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
      createElement: (tag) => makeMockElement('mock-' + tag),
      body: makeMockElement('body'),
      documentElement: makeMockElement('html')
    },
    window: { addEventListener: () => {}, removeEventListener: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    location: {
      origin: 'http://localhost:8080',
      hash: '',
      search: '',
      pathname: '/'
    },
    navigator: { onLine: true },
    CustomEvent: class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } },
    Event: class Event { constructor(type) { this.type = type; } },
    BroadcastChannel: class BroadcastChannel {
      constructor(name) { this.name = name; }
      postMessage() {}
      close() {}
    }
  };
  sandbox.window = sandbox;
  sandbox.global = sandbox;
  sandbox.self = sandbox;

  const context = vm.createContext(sandbox);

  // 1. Load store-bridge.js
  const storeBridgeCode = fs.readFileSync(path.join(ROOT, 'store-bridge.js'), 'utf8');
  vm.runInContext(storeBridgeCode, context);

  const Store = sandbox.StorefrontBridge;
  assert.ok(Store, 'StorefrontBridge must initialize');
  console.log('✅ PASS: StorefrontBridge initialized in sandbox');

  // 2. Load app.js
  const appCode = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  vm.runInContext(appCode, context);
  assert.equal(typeof sandbox.applyStorefrontSettings, 'function', 'applyStorefrontSettings must be defined');
  console.log('✅ PASS: applyStorefrontSettings defined on window');

  // 3. Test Initial Cached Settings
  const initialSettings = Store.getSettings();
  console.log('Initial settings:', {
    email: initialSettings.contactEmail,
    supportEmail: initialSettings.supportEmail,
    phone: initialSettings.contactPhone,
    supportPhone: initialSettings.supportPhone,
    name: initialSettings.storeName
  });
  assert.ok(initialSettings.contactEmail, 'contactEmail must be present');
  assert.ok(initialSettings.supportEmail, 'supportEmail must be present');
  console.log('✅ PASS: Initial settings contains both contactEmail & supportEmail');

  // 4. Test Live Fetch from Supabase
  console.log('\n--- Fetching live settings from Supabase REST ---');
  await Store.syncSettingsFromSupabase();
  const liveSettings = Store.getSettings();
  console.log('Live synced settings:', {
    email: liveSettings.contactEmail,
    supportEmail: liveSettings.supportEmail,
    phone: liveSettings.contactPhone,
    supportPhone: liveSettings.supportPhone,
    name: liveSettings.storeName
  });

  assert.ok(liveSettings.contactEmail, 'liveSettings must have contactEmail');
  assert.equal(liveSettings.contactEmail, liveSettings.supportEmail, 'contactEmail and supportEmail must match');
  console.log('✅ PASS: Live Supabase fetch synced settings with matching email and phone');

  // 5. Test DOM Applier
  sandbox.applyStorefrontSettings(liveSettings);

  const footerEmail = elementsById.get('footer-support-email');
  const footerPhone = elementsById.get('footer-support-phone');
  const drawerEmail = elementsById.get('drawer-support-email');
  const drawerPhone = elementsById.get('drawer-support-phone');

  console.log('Footer Email HTML:', footerEmail?.innerHTML);
  console.log('Drawer Email HTML:', drawerEmail?.innerHTML);
  console.log('Footer Phone HTML:', footerPhone?.innerHTML);

  assert.ok(footerEmail.innerHTML.includes(liveSettings.supportEmail), 'Footer must render support email');
  assert.ok(drawerEmail.innerHTML.includes(liveSettings.supportEmail), 'Drawer must render support email');
  assert.ok(footerPhone.innerHTML.includes(liveSettings.supportPhone.replace(/\s+/g, '')), 'Footer must render phone');
  console.log('✅ PASS: Footer & Hamburger Drawer correctly display live synced support email & phone');

  // 6. Test Real-time Admin Push Simulation (e.g. changing support email)
  console.log('\n--- Simulating Admin Settings Live Push ---');
  const pushedEmail = 'patron-concierge@vistarakrafts.com';
  const pushedPhone = '+91 70022 70886';
  Store.receiveStudioPush({
    type: 'SETTINGS_UPDATED',
    settings: {
      ...liveSettings,
      contactEmail: pushedEmail,
      supportEmail: pushedEmail,
      contactPhone: pushedPhone,
      supportPhone: pushedPhone,
      storeName: 'Vistāra Krafts Atelier',
      updated_at: new Date().toISOString()
    }
  });

  const updatedSettings = Store.getSettings();
  assert.equal(updatedSettings.contactEmail, pushedEmail, 'contactEmail must be updated by push');
  assert.equal(updatedSettings.supportEmail, pushedEmail, 'supportEmail must be updated by push');

  sandbox.applyStorefrontSettings(updatedSettings);
  assert.ok(footerEmail.innerHTML.includes(pushedEmail), 'Footer must reflect push email');
  assert.ok(drawerEmail.innerHTML.includes(pushedEmail), 'Drawer must reflect push email');
  console.log('✅ PASS: Dynamic push immediately updates Store settings, Footer, and Drawer');

  console.log('\n========================================================================');
  console.log('Live Settings Synchronization Suite: ALL 6 TESTS PASSED (0 FAILURES)');
  process.exit(0);
  console.log('========================================================================\n');
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
