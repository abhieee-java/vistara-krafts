import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('🧪 [TEST SUITE] DPDP System Auto-Fill & Authenticated Session Verification');

const rootDir = process.cwd();

// Setup global mock environment
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

// DOM Mock
const domStore = new Map();
function getMockElement(id) {
  if (!domStore.has(id)) {
    domStore.set(id, {
      id,
      value: '',
      innerHTML: '',
      classList: {
        _classes: new Set(['hidden']),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        contains(c) { return this._classes.has(c); }
      }
    });
  }
  return domStore.get(id);
}

global.document = {
  getElementById(id) { return getMockElement(id); },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {},
  head: { appendChild() {} }
};

// Mock BroadcastChannel
class MockBroadcastChannel {
  constructor(name) { this.name = name; }
  postMessage() {}
  close() {}
}
global.BroadcastChannel = MockBroadcastChannel;

// Load store-bridge.js
const storeBridgeCode = fs.readFileSync(path.join(rootDir, 'store-bridge.js'), 'utf8');
const evalStoreCode = storeBridgeCode.replace(/\(function \(global\) \{/, '(function (global) {\n');
new Function('global', evalStoreCode)(global);

const Store = global.ResinStore;
assert(Store, 'ResinStore must be defined');

// Extract and load populateDpdpGrievanceForm from app.js
const appJsContent = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');
const populateFnMatch = appJsContent.match(/window\.populateDpdpGrievanceForm\s*=\s*function\s*\(\)\s*\{([\s\S]*?)\};\s*window\.submitDpdpGrievanceForm/);
assert(populateFnMatch, 'Must find populateDpdpGrievanceForm implementation in app.js');

global.esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
new Function('global', 'window.populateDpdpGrievanceForm = function () {' + populateFnMatch[1] + '};')(global);

// 1. Test when Guest (Unauthenticated)
console.log('  Testing Guest Mode behavior in DPDP Portal...');
Store.logoutPatron();

const nameEl = getMockElement('dpdp-req-name');
const emailEl = getMockElement('dpdp-req-email');
const mobileEl = getMockElement('dpdp-req-mobile');
const orderIdEl = getMockElement('dpdp-req-orderid');
const badgeEl = getMockElement('dpdp-auth-autofill-badge');

nameEl.value = '';
emailEl.value = '';
mobileEl.value = '';
orderIdEl.value = '';

window.populateDpdpGrievanceForm();

assert.strictEqual(nameEl.value, '', 'Guest name must remain blank');
assert.strictEqual(emailEl.value, '', 'Guest email must remain blank');
assert(badgeEl.classList.contains('hidden'), 'Auto-fill badge must be hidden for guests');
console.log('  ✅ Guest mode: Form remains clean with standard placeholders');

// 2. Test when Authenticated Patron
console.log('  Testing Authenticated Patron System Auto-Fill...');
Store.loginPatron({
  userId: 'usr_patron_aditi_9921',
  name: 'Aditi Sharma',
  email: 'aditi.sharma@example.com',
  phone: '+91 98765 43210',
  address: '22 Bandra West, Mumbai 400050',
  provider: 'google'
});

// Seed an order for this patron
const mockOrder = {
  orderId: 'VK-2026-991204',
  orderNumber: 'VK-2026-991204',
  customerEmail: 'aditi.sharma@example.com',
  customerPhone: '+91 98765 43210',
  totalAmount: 2499,
  orderStatus: 'delivered',
  items: []
};
Store.receiveStudioPush({
  type: 'ORDERS_UPDATED',
  orders: [mockOrder]
});

// Clear DOM values before invoking
nameEl.value = '';
emailEl.value = '';
mobileEl.value = '';
orderIdEl.value = '';

window.populateDpdpGrievanceForm();

assert.strictEqual(nameEl.value, 'Aditi Sharma', `Expected name "Aditi Sharma", got "${nameEl.value}"`);
assert.strictEqual(emailEl.value, 'aditi.sharma@example.com', `Expected email "aditi.sharma@example.com", got "${emailEl.value}"`);
assert.strictEqual(mobileEl.value, '+91 98765 43210', `Expected phone "+91 98765 43210", got "${mobileEl.value}"`);
assert.strictEqual(orderIdEl.value, 'VK-2026-991204', `Expected orderId "VK-2026-991204", got "${orderIdEl.value}"`);
assert(!badgeEl.classList.contains('hidden'), 'Auto-fill badge must be visible for authenticated patrons');
assert(badgeEl.innerHTML.includes('Verified Patron'), 'Badge must state Verified Patron');
assert(badgeEl.innerHTML.includes('Aditi Sharma'), 'Badge must include patron name');
console.log('  ✅ Authenticated patron: All inputs directly auto-filled by system + Verified Patron badge shown');

// 3. Test submitDpdpTicket with automatic system fallback
console.log('  Testing submitDpdpTicket with automatic fallback & userId binding...');
const ticket = Store.submitDpdpTicket({
  requestType: 'Right to Correct Inaccurate Information',
  details: 'Please update my billing surname.'
  // Notice fullName, email, mobile are omitted to test fallback
});

assert.strictEqual(ticket.fullName, 'Aditi Sharma', 'Omitted fullName should fallback to authenticated name');
assert.strictEqual(ticket.email, 'aditi.sharma@example.com', 'Omitted email should fallback to authenticated email');
assert.strictEqual(ticket.mobile, '+91 98765 43210', 'Omitted mobile should fallback to authenticated phone');
assert.strictEqual(ticket.userId, 'usr_patron_aditi_9921', 'Ticket must bind authenticated userId');
assert.strictEqual(ticket.authenticatedSubmission, true, 'Ticket must flag authenticatedSubmission: true');
console.log('  ✅ submitDpdpTicket: Auto-fallback and userId binding confirmed');

console.log('🎉 ALL DPDP SYSTEM AUTO-FILL TESTS PASSED!');
