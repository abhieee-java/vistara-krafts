import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('🧪 [TEST SUITE] DPDP Grievance Portal & Admin Sync Verification');

const rootDir = process.cwd();

// Setup sandbox global environment
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
  getElementById() { return null; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {},
  head: { appendChild() {} }
};

// Track broadcast channel messages
const broadcastMessages = [];
class MockBroadcastChannel {
  constructor(name) {
    this.name = name;
  }
  postMessage(data) {
    broadcastMessages.push({ channel: this.name, data });
  }
  close() {}
}
global.BroadcastChannel = MockBroadcastChannel;

const storeBridgeCode = fs.readFileSync(path.join(rootDir, 'store-bridge.js'), 'utf8');
const evalCode = storeBridgeCode.replace(/\(function \(global\) \{/, '(function (global) {\n');
new Function('global', evalCode)(global);

const Store = global.ResinStore;
assert(Store, 'ResinStore must be defined');

// 1. Submit a statutory DPDP grievance from Storefront
console.log('  Testing Storefront DPDP ticket submission...');
const payload = {
  requestType: 'Right to Erasure (DPDP Section 12)',
  fullName: 'Pooja Verma',
  email: 'pooja.verma@example.com',
  mobile: '+91 98200 12345',
  orderId: 'VK-2026-884129',
  details: 'Please erase my personal phone number and saved shipping address in accordance with Section 12 of DPDP Act 2023.'
};

const ticket = Store.submitDpdpTicket(payload);
assert(ticket, 'Ticket must be returned upon submission');
assert(ticket.ticketId.startsWith('DPDP-2026-'), `Expected DPDP-2026- prefix, got ${ticket.ticketId}`);
assert.strictEqual(ticket.fullName, 'Pooja Verma');
assert.strictEqual(ticket.email, 'pooja.verma@example.com');
assert.strictEqual(ticket.orderId, 'VK-2026-884129');
assert.strictEqual(ticket.status, 'open');
assert(ticket.slaDeadline, 'Ticket must contain statutory 7-day SLA deadline');

const createdTime = new Date(ticket.createdAtIso).getTime();
const deadlineTime = new Date(ticket.slaDeadline).getTime();
const diffDays = Math.round((deadlineTime - createdTime) / (1000 * 60 * 60 * 24));
assert.strictEqual(diffDays, 7, `Expected exactly 7 days statutory SLA, got ${diffDays} days`);

console.log(`  ✅ Ticket generated: ${ticket.ticketId} with statutory 7-day SLA deadline: ${ticket.slaDeadline}`);

// 2. Verify persistence in localStorage
const storedTickets = Store.getDpdpTickets();
assert(storedTickets.length >= 1, 'Stored tickets must contain at least 1 ticket');
assert.strictEqual(storedTickets[0].ticketId, ticket.ticketId);
console.log(`  ✅ Ticket successfully persisted in localStorage (${storedTickets.length} tickets)`);

// 3. Verify BroadcastChannel alert was emitted
const broadcastEvent = broadcastMessages.find(
  (m) => m.channel === 'RAM_STUDIO_LIVE_DROP_CHANNEL' && m.data.type === 'DPDP_TICKET_SUBMITTED'
);
assert(broadcastEvent, 'BroadcastChannel must emit DPDP_TICKET_SUBMITTED');
assert.strictEqual(broadcastEvent.data.ticket.ticketId, ticket.ticketId);
console.log('  ✅ Live cross-tab BroadcastChannel event emitted to Admin Portal');

// 4. Test Admin-side status update & resolution notes sync
console.log('  Testing resolution flow & synchronization...');
const updatedTicket = Store.updateDpdpTicket(ticket.ticketId, {
  status: 'resolved',
  resolutionNotes: 'Patron session profile, phone, and saved shipping details erased. Verified in accordance with DPDP Section 12.',
  resolvedAt: new Date().toISOString()
});

assert(updatedTicket, 'Updated ticket must be returned');
assert.strictEqual(updatedTicket.status, 'resolved');
assert(updatedTicket.resolutionNotes.includes('DPDP Section 12'));
assert(updatedTicket.resolvedAt, 'ResolvedAt timestamp must be recorded');

const reloadedTickets = Store.getDpdpTickets();
assert.strictEqual(reloadedTickets[0].status, 'resolved');
assert.strictEqual(reloadedTickets[0].resolutionNotes, updatedTicket.resolutionNotes);
console.log('  ✅ Ticket resolution and notes verified in state machine');

// 5. Test receiveStudioPush for DPDP_TICKET_UPDATED
const pushResult = Store.receiveStudioPush({
  type: 'DPDP_TICKET_UPDATED',
  ticket: {
    ticketId: ticket.ticketId,
    status: 'resolved',
    resolutionNotes: 'Updated via studio push receiver.'
  }
});
assert(pushResult.ok, 'receiveStudioPush must succeed for DPDP_TICKET_UPDATED');
assert.strictEqual(Store.getDpdpTickets()[0].resolutionNotes, 'Updated via studio push receiver.');
console.log('  ✅ Cross-window push receiver successfully processed DPDP update');

console.log('🎉 ALL DPDP GRIEVANCE & ADMIN SYNC TESTS PASSED!');
