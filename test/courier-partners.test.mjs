import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('🧪 [TEST SUITE] Courier Elevation & Air Delivery Elimination Verification');

const rootDir = process.cwd();

// 1. Audit storefront files for eliminated air delivery guarantees
const filesToAudit = [
  'index.html',
  'app.js',
  'store-bridge.js',
  'terms.html',
  'privacy.html',
  'server/email-service.js',
  'llms.txt',
  'public/llms.txt'
];

const forbiddenPhrases = [
  /air\s+delivery/i,
  /express\s+air/i,
  /priority\s+air/i,
  /air\s+cargo/i,
  /air\s+shipping/i,
  /air\s+courier/i,
  /air\s+pickup/i,
  /insured\s+air/i
];

for (const relPath of filesToAudit) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, 'utf8');
  for (const regex of forbiddenPhrases) {
    const match = content.match(regex);
    assert.strictEqual(
      match,
      null,
      `🚨 Found forbidden air delivery reference "${match && match[0]}" in ${relPath}`
    );
  }
  console.log(`  ✅ ${relPath} completely free of misleading air delivery promises`);
}

// 2. Validate DTDC Express and Speed Post in PINCODE_DIRECTORY & verifyPincode()
global.__VK_TEST_ENV__ = true;
global.window = global;
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};
global.sessionStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};
global.document = {
  getElementById() { return null; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {},
  head: { appendChild() {} }
};

const storeBridgeCode = fs.readFileSync(path.join(rootDir, 'store-bridge.js'), 'utf8');
const evalCode = storeBridgeCode.replace(/\(function \(global\) \{/, '(function (global) {\n');
new Function('global', evalCode)(global);

const Store = global.ResinStore;
assert(Store, 'ResinStore must be initialized');

// Test Metro Pincode SLA (Mumbai)
const mumbaiPincode = Store.verifyPincode('400001');
assert(mumbaiPincode.valid, 'Metro pincode 400001 must be valid');
assert(
  mumbaiPincode.courier.includes('DTDC Express'),
  `Expected DTDC Express for 400001, got ${mumbaiPincode.courier}`
);
assert(
  mumbaiPincode.message.includes('DTDC Express'),
  `Expected message to name DTDC Express, got: ${mumbaiPincode.message}`
);
console.log('  ✅ Mumbai 400001 routes via DTDC Express:', mumbaiPincode.message);

// Test Rest of India Pincode SLA (Speed Post default)
const ruralPincode = Store.verifyPincode('176057');
assert(ruralPincode.valid, 'Rest of India pincode must be valid');
assert(
  ruralPincode.courier.includes('Speed Post') || ruralPincode.courier.includes('DTDC Express'),
  `Expected Speed Post or DTDC Express, got ${ruralPincode.courier}`
);
assert(
  ruralPincode.message.includes('Speed Post') || ruralPincode.message.includes('DTDC Express'),
  `Expected Speed Post / DTDC Express in message, got: ${ruralPincode.message}`
);
console.log('  ✅ Pincode 176057 routes via designated courier:', ruralPincode.courier, '|', ruralPincode.message);

// 3. Test Direct Consignment Tracking URLs in app.js
const appJsContent = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');
assert(
  appJsContent.includes('dtdc.in/tracking.asp') || appJsContent.includes('dtdc.in'),
  'app.js must include DTDC direct consignment tracking lookup URL'
);
assert(
  appJsContent.includes('indiapost.gov.in') || appJsContent.includes('trackconsignment'),
  'app.js must include India Post / Speed Post consignment tracking lookup URL'
);
console.log('  ✅ Direct DTDC Express and India Post Speed Post consignment tracking URLs verified');

console.log('🎉 ALL COURIER ELEVATION & AIR DELIVERY PURGE TESTS PASSED!');
