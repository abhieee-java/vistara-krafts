import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { TEST_PRODUCTS } from '../test-fixtures.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function createIsolatedStore() {
  const storeBridgeCode = fs.readFileSync(path.join(ROOT_DIR, 'store-bridge.js'), 'utf8');
  const appCode = fs.readFileSync(path.join(ROOT_DIR, 'app.js'), 'utf8');

  const storage = new Map();
  const localStorageMock = {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear()
  };

  const elements = new Map();
  function makeElement(id = '') {
    const classes = new Set();
    const el = {
      id,
      value: '',
      checked: false,
      textContent: '',
      innerHTML: '',
      src: '',
      href: '',
      style: {},
      dataset: {},
      scrollHeight: 40,
      classList: {
        classes,
        add: (...c) => c.forEach(x => classes.add(x)),
        remove: (...c) => c.forEach(x => classes.delete(x)),
        toggle: (c, force) => {
          if (force === undefined) {
            if (classes.has(c)) { classes.delete(c); return false; }
            classes.add(c); return true;
          }
          if (force) { classes.add(c); return true; }
          classes.delete(c); return false;
        },
        contains: (c) => classes.has(c)
      },
      removeAttribute: () => {},
      setAttribute: () => {},
      getAttribute: () => null,
      focus: () => {},
      addEventListener: () => {},
      querySelector: () => makeElement(),
      querySelectorAll: () => [],
      closest: () => makeElement()
    };
    if (id) elements.set(id, el);
    return el;
  }

  const documentMock = {
    body: makeElement('body'),
    documentElement: makeElement('html'),
    contains: () => true,
    getElementById: (id) => {
      if (!elements.has(id)) makeElement(id);
      return elements.get(id);
    },
    querySelector: (sel) => {
      if (sel && sel.startsWith('#')) {
        const id = sel.slice(1);
        if (!elements.has(id)) makeElement(id);
        return elements.get(id);
      }
      return makeElement();
    },
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement: () => makeElement()
  };

  const sandbox = {
    window: null,
    global: null,
    globalThis: null,
    document: documentMock,
    localStorage: localStorageMock,
    sessionStorage: localStorageMock,
    location: { hash: '#/bag', href: 'http://localhost/index.html#/bag' },
    history: { pushState: () => {}, replaceState: () => {} },
    BroadcastChannel: class { postMessage() {} close() {} },
    fetch: async () => ({ ok: true, json: async () => ({}) }),
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: () => {},
    console: { log: () => {}, warn: () => {}, error: () => {} },
    __VK_TEST_ENV__: true,
    __VK_TEST_FIXTURES__: TEST_PRODUCTS,
    navigator: { onLine: true, clipboard: { writeText: async () => {} } },
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {}
  };
  sandbox.window = sandbox;
  sandbox.global = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(storeBridgeCode, sandbox);
  vm.runInContext(appCode, sandbox);

  return { sandbox, Store: sandbox.StorefrontBridge || sandbox.Store, document: documentMock, elements };
}

test('1. Authoritative Account Section Address strictly overrides any cached checkout draft', () => {
  const { Store, document, sandbox } = createIsolatedStore();

  // User logs in and saves address in Account Profile section
  const loginRes = Store.loginPatron({
    provider: 'google',
    email: 'priya.sharma@example.com',
    name: 'Priya Sharma',
    address: 'Flat 402, Lotus Towers, Indiranagar, Bengaluru',
    pincode: '560038'
  });
  assert.strictEqual(loginRes.valid, true, 'User login must succeed');

  // Simulate an old stale draft left in checkout cache
  Store.saveCheckoutDraft({
    name: 'Old Cached Name',
    phone: '+91 90000 00000',
    address: '99 Stale Street, Old City, Mumbai',
    pincode: '400001'
  });

  // Add item to cart and open checkout modal
  Store.addToCart('vk-cat-res-201', 'var-201-300g', 1);
  sandbox.window.openCheckoutModal();

  // The checkout address MUST show the saved Account Section address, NOT the stale draft!
  const chkAddr = document.getElementById('chk-address').value;
  const chkName = document.getElementById('chk-name').value;
  const chkPin = document.getElementById('chk-pincode').value;

  assert.strictEqual(
    chkAddr,
    'Flat 402, Lotus Towers, Indiranagar, Bengaluru - 560038',
    'Checkout modal MUST show address saved in account section, not the stale cached draft'
  );
  assert.strictEqual(
    chkName,
    'Priya Sharma',
    'Checkout modal MUST show name saved in account section'
  );
  assert.strictEqual(
    chkPin,
    '560038',
    'Checkout modal MUST show pincode from account section'
  );
});

test('2. Multi-Account Isolation: Account B never receives Account A cached checkout draft', () => {
  const { Store, document, sandbox } = createIsolatedStore();

  // Account A logs in and types an address in checkout
  Store.loginPatron({
    provider: 'google',
    email: 'account.a@example.com',
    name: 'User A',
    address: '101 User A Residence, Guwahati',
    pincode: '781001'
  });

  Store.saveCheckoutDraft({
    name: 'User A Draft',
    phone: '+91 91111 11111',
    address: '101 User A Residence, Guwahati',
    pincode: '781001'
  });

  // Account A logs out
  Store.logoutPatron();

  // Account B logs in with their own saved account address
  Store.loginPatron({
    provider: 'google',
    email: 'account.b@example.com',
    name: 'User B',
    address: '202 User B Villa, Pune',
    pincode: '411001'
  });

  // Add item to cart and open checkout modal as Account B
  Store.addToCart('vk-cat-res-201', 'var-201-300g', 1);
  sandbox.window.openCheckoutModal();

  const chkAddr = document.getElementById('chk-address').value;
  const chkName = document.getElementById('chk-name').value;
  const chkPin = document.getElementById('chk-pincode').value;

  assert.strictEqual(
    chkAddr,
    '202 User B Villa, Pune - 411001',
    'Account B must see their own saved account address, never Account A cached address'
  );
  assert.strictEqual(
    chkName,
    'User B',
    'Account B must see their own saved account name'
  );
  assert.strictEqual(
    chkPin,
    '411001',
    'Account B must see their own account PIN code'
  );
});

test('3. Updating address in Account Profile immediately invalidates checkout cache', () => {
  const { Store, document, sandbox } = createIsolatedStore();

  Store.loginPatron({
    provider: 'google',
    email: 'rohit.verma@example.com',
    name: 'Rohit Verma',
    address: 'Initial Address 1, Jaipur',
    pincode: '302001'
  });

  // User saves a new address in the Account Profile section
  document.getElementById('acc-prof-name').value = 'Rohit Verma';
  document.getElementById('acc-prof-phone').value = '+91 98765 43210';
  document.getElementById('acc-prof-email').value = 'rohit.verma@example.com';
  document.getElementById('acc-prof-address').value = '77 Luxury Heights, Civil Lines, Jaipur 302006';

  sandbox.window.saveAccountProfile({ preventDefault: () => {} });

  // Add item to cart and open checkout modal
  Store.addToCart('vk-cat-res-201', 'var-201-300g', 1);
  sandbox.window.openCheckoutModal();

  assert.strictEqual(
    document.getElementById('chk-address').value,
    '77 Luxury Heights, Civil Lines, Jaipur 302006',
    'Checkout modal must immediately reflect the updated address saved in the account section'
  );
});
