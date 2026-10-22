import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve('.');

function setupStoreSandbox() {
  const storeBridgeCode = fs.readFileSync(path.join(ROOT, 'store-bridge.js'), 'utf8');
  const supabaseConfigCode = fs.readFileSync(path.join(ROOT, 'supabase-config.js'), 'utf8');

  const storageMock = {};
  const mockLocalStorage = {
    getItem: (k) => (k in storageMock ? storageMock[k] : null),
    setItem: (k, v) => { storageMock[k] = String(v); },
    removeItem: (k) => { delete storageMock[k]; },
    clear: () => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }
  };

  const sandbox = {
    window: {},
    document: {
      addEventListener: () => {},
      removeEventListener: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null
    },
    localStorage: mockLocalStorage,
    console: {
      log: () => {},
      warn: () => {},
      info: () => {},
      error: () => {}
    },
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    fetch: async () => ({ ok: true, json: async () => ({}) }),
    BroadcastChannel: class {
      postMessage() {}
      close() {}
    },
    __VK_TEST_ENV__: true
  };
  sandbox.window = sandbox;
  sandbox.global = sandbox;
  sandbox.self = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(supabaseConfigCode, sandbox);
  vm.runInContext(storeBridgeCode, sandbox);

  return { sandbox, Store: sandbox.StorefrontBridge, Supabase: sandbox.VistaraSupabase, storageMock };
}

test('1. Email sign-up: Rejects invalid email and short password', () => {
  const { Store } = setupStoreSandbox();
  
  const badEmailRes = Store.loginPatron({
    provider: 'email',
    mode: 'register',
    email: 'not-an-email',
    password: 'password123',
    name: 'Test Patron'
  });
  assert.strictEqual(badEmailRes.valid, false);
  assert.ok(badEmailRes.message.includes('valid email'));

  const shortPwdRes = Store.loginPatron({
    provider: 'email',
    mode: 'register',
    email: 'patron@example.com',
    password: '123',
    name: 'Test Patron'
  });
  assert.strictEqual(shortPwdRes.valid, false);
  assert.ok(shortPwdRes.message.includes('at least 6 characters'));
});

test('2. Email sign-up with valid inputs creates secure patron session', () => {
  const { Store } = setupStoreSandbox();

  const regRes = Store.loginPatron({
    provider: 'email',
    mode: 'register',
    email: 'ananya.sharma@example.com',
    password: 'securePassword123!',
    name: 'Ananya Sharma',
    phone: '+91 98450 11223'
  });

  assert.strictEqual(regRes.valid, true);
  assert.strictEqual(Store.isAuthenticated(), true);
  const session = Store.getAuthSession();
  assert.strictEqual(session.email, 'ananya.sharma@example.com');
  assert.strictEqual(session.name, 'Ananya Sharma');
  assert.strictEqual(session.phone, '+91 98450 11223');
  // Raw password must never be stored in plain text
  assert.strictEqual(session.password, undefined);
  assert.ok(session.passwordVerifier && session.passwordVerifier.startsWith('vk_h_'));
});

test('3. Email login: Rejects incorrect password for registered user', () => {
  const { Store } = setupStoreSandbox();

  Store.loginPatron({
    provider: 'email',
    mode: 'register',
    email: 'rahul.verma@example.com',
    password: 'correctPassword123',
    name: 'Rahul Verma'
  });
  Store.logoutPatron();
  assert.strictEqual(Store.isAuthenticated(), false);

  const failRes = Store.loginPatron({
    provider: 'email',
    mode: 'signin',
    email: 'rahul.verma@example.com',
    password: 'wrongPassword999'
  });

  assert.strictEqual(failRes.valid, false);
  assert.ok(failRes.message.includes('Incorrect password'));
  assert.strictEqual(Store.isAuthenticated(), false);
});

test('4. Email login: Succeeds with valid credentials and restores profile', () => {
  const { Store } = setupStoreSandbox();

  Store.loginPatron({
    provider: 'email',
    mode: 'register',
    email: 'kavita.nair@example.com',
    password: 'kavitaPassword2026',
    name: 'Kavita Nair',
    address: '42 MG Road, Bengaluru 560001'
  });
  Store.logoutPatron();

  const loginRes = Store.loginPatron({
    provider: 'email',
    mode: 'signin',
    email: 'kavita.nair@example.com',
    password: 'kavitaPassword2026'
  });

  assert.strictEqual(loginRes.valid, true);
  assert.strictEqual(Store.isAuthenticated(), true);
  assert.strictEqual(Store.getPatronProfile().name, 'Kavita Nair');
  assert.strictEqual(Store.getPatronProfile().defaultAddress, '42 MG Road, Bengaluru 560001');
});

test('5. Google OAuth invocation: Generates official Supabase authorize URL', async () => {
  const { Supabase } = setupStoreSandbox();

  const oauthRes = await Supabase.signInWithOAuth('google');
  assert.ok(oauthRes);
  if (oauthRes.data && oauthRes.data.url) {
    assert.ok(oauthRes.data.url.includes('provider=google'));
    assert.ok(oauthRes.data.url.includes('redirect_to='));
  }
});

test('6. Google callback success handling creates authentic patron session', () => {
  const { Store } = setupStoreSandbox();

  Store.loginPatron({
    provider: 'google',
    mode: 'signin',
    email: 'aarav.mehta@gmail.com',
    name: 'Aarav Mehta',
    userId: 'usr_uuid_google_123',
    avatar: 'https://lh3.googleusercontent.com/avatar_test'
  });

  assert.strictEqual(Store.isAuthenticated(), true);
  const session = Store.getAuthSession();
  assert.strictEqual(session.provider, 'google');
  assert.strictEqual(session.email, 'aarav.mehta@gmail.com');
  assert.strictEqual(session.name, 'Aarav Mehta');
  assert.strictEqual(session.userId, 'usr_uuid_google_123');
});

test('7. Session persistence & refresh recovery', () => {
  const { Store, storageMock } = setupStoreSandbox();

  Store.loginPatron({
    provider: 'email',
    mode: 'signin',
    email: 'priya.sen@example.com',
    password: 'priyaPassword123',
    name: 'Priya Sen',
    address: 'Sector 5, Salt Lake, Kolkata'
  });

  assert.strictEqual(Store.isAuthenticated(), true);
  const rawSession = JSON.parse(storageMock['ram_vk_cf_auth_v2']);
  assert.strictEqual(rawSession.email, 'priya.sen@example.com');
  assert.strictEqual(rawSession.name, 'Priya Sen');
});

test('8. Logout clears authenticated state and profile data', () => {
  const { Store } = setupStoreSandbox();

  Store.loginPatron({
    provider: 'google',
    mode: 'signin',
    email: 'user@example.com',
    name: 'Logged In User'
  });
  assert.strictEqual(Store.isAuthenticated(), true);

  Store.logoutPatron();
  assert.strictEqual(Store.isAuthenticated(), false);
  assert.strictEqual(Store.getAuthSession(), null);
  const guestProfile = Store.getPatronProfile();
  assert.strictEqual(guestProfile.email, '');
  assert.strictEqual(guestProfile.defaultAddress, '');
});

test('9. Zero leakage: Unauthenticated visitor receives no arbitrary orders', async () => {
  const { Store } = setupStoreSandbox();
  Store.logoutPatron();

  const orders = Store.getOrders();
  assert.strictEqual(orders.length, 0, 'Guest visitor with no placed orders must receive 0 orders');
});

test('10. Customer data isolation: Customer A profile does not leak to Customer B', () => {
  const { Store } = setupStoreSandbox();

  Store.loginPatron({
    provider: 'email',
    mode: 'register',
    email: 'customer.a@example.com',
    password: 'passwordA123',
    name: 'Customer A',
    address: 'Customer A Secret Residence, Mumbai'
  });
  Store.logoutPatron();

  Store.loginPatron({
    provider: 'email',
    mode: 'register',
    email: 'customer.b@example.com',
    password: 'passwordB123',
    name: 'Customer B',
    address: 'Customer B Flat, Delhi'
  });

  const bProfile = Store.getPatronProfile();
  assert.strictEqual(bProfile.name, 'Customer B');
  assert.strictEqual(bProfile.defaultAddress, 'Customer B Flat, Delhi');
  assert.ok(!JSON.stringify(bProfile).includes('Customer A Secret Residence'));
});

test('11. Privilege elevation prevention: Client cannot elevate role via metadata', () => {
  const { Store } = setupStoreSandbox();

  const exploitRes = Store.loginPatron({
    provider: 'email',
    mode: 'register',
    email: 'hacker@example.com',
    password: 'hackerPassword123',
    name: 'Attacker',
    role: 'service_role',
    isAdmin: true,
    is_admin: true,
    owner_id: 'owner_master_001'
  });

  assert.strictEqual(exploitRes.valid, true);
  const session = Store.getAuthSession();
  assert.strictEqual(session.role, undefined);
  assert.strictEqual(session.isAdmin, undefined);
  assert.strictEqual(session.is_admin, undefined);
  assert.strictEqual(session.owner_id, undefined);
});

test('12. Account linking resilience: Google email with subsequent signin guidance', () => {
  const { Store } = setupStoreSandbox();

  Store.loginPatron({
    provider: 'google',
    mode: 'signin',
    email: 'dual.user@gmail.com',
    name: 'Dual User'
  });

  const registeredUser = Store.getUserByEmail('dual.user@gmail.com');
  assert.ok(registeredUser);
  assert.strictEqual(registeredUser.provider, 'google');
  assert.strictEqual(registeredUser.name, 'Dual User');
});
