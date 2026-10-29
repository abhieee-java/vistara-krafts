import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG } from '../server/config.js';
import { OrderService } from '../server/order-service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createTestCustomer(email) {
  const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/create_test_suspended_user`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_email: email })
  });
  const userId = await res.json();
  return { userId, email };
}

test('1. Supabase RPC toggle_customer_block_status toggles profile & directory status', async () => {
  const testEmail = `patron_block_test_${Date.now()}@vistarakrafts.com`;
  const { userId } = await createTestCustomer(testEmail);
  assert.ok(userId, 'Test customer user ID must exist');

  // Verify initially blocked via RPC create_test_suspended_user
  const checkRes1 = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/is_customer_blocked`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_email: testEmail })
  });
  assert.equal(checkRes1.status, 200);
  const isBlocked1 = await checkRes1.json();
  assert.equal(isBlocked1, true, 'is_customer_blocked must return true for suspended account');

  // Unblock and verify status returns to false
  const unblockRes = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/toggle_customer_block_status`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_user_id: userId, p_blocked: false })
  });
  assert.equal(unblockRes.status, 200);

  const checkRes2 = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/is_customer_blocked`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_email: testEmail })
  });
  const isBlocked2 = await checkRes2.json();
  assert.equal(isBlocked2, false, 'is_customer_blocked must return false after unblocking');

  // Re-block and verify status returns to true
  await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/toggle_customer_block_status`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_user_id: userId, p_blocked: true })
  });

  const checkRes3 = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/is_customer_blocked`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_email: testEmail })
  });
  const isBlocked3 = await checkRes3.json();
  assert.equal(isBlocked3, true, 'is_customer_blocked must return true after re-blocking');
});

test('2. Server-Side Unbypassable Defense: Blocked customer cannot create orders via OrderService', async () => {
  const testEmail = `patron_order_blocked_${Date.now()}@vistarakrafts.com`;
  const { userId } = await createTestCustomer(testEmail);
  assert.ok(userId);

  // Attempt to call OrderService.createCheckoutOrder
  await assert.rejects(
    async () => {
      await OrderService.createCheckoutOrder({
        name: 'Blocked User Test',
        email: testEmail,
        phone: '9876543210',
        address: '123 Atelier Street, Guwahati',
        pincode: '781028',
        userId: userId,
        items: [{ productId: 'vk-cat-res-301', quantity: 1 }]
      });
    },
    /suspended by administration/i,
    'OrderService must reject checkout for suspended customer'
  );
});

test('3. Database Trigger Unbypassable Defense: Direct SQL INSERT rejected by PostgreSQL trigger', async () => {
  const testEmail = `patron_direct_db_${Date.now()}@vistarakrafts.com`;
  const { userId } = await createTestCustomer(testEmail);
  assert.ok(userId);

  // Direct REST insert into orders table attempting to bypass client JS
  const insertRes = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/orders`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      order_number: `VK-TEST-${Date.now()}`,
      customer_email: testEmail,
      user_id: userId,
      total: 1000,
      subtotal: 1000,
      customer_name: 'Bypass Attempt',
      customer_phone: '9876543210',
      shipping_address: '123 Hacker Way',
      shipping_pincode: '781028',
      items: []
    })
  });

  assert.equal(insertRes.ok, false, 'PostgreSQL trigger trg_check_user_not_blocked must abort direct insert');
  const errText = await insertRes.text();
  assert.ok(errText.includes('suspended by administration') || insertRes.status >= 400);
});

test('4. Server-Side OTP Defense: Blocked customer cannot request verification codes', async () => {
  const testEmail = `patron_otp_blocked_${Date.now()}@vistarakrafts.com`;
  const { userId } = await createTestCustomer(testEmail);
  assert.ok(userId);

  const { default: otpHandler } = await import('../api/send-verification-otp.js');

  let statusCode = 0;
  let responseData = null;
  const mockRes = {
    setHeader: () => {},
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => {
          responseData = data;
          return data;
        }
      };
    }
  };

  const mockReq = {
    method: 'POST',
    headers: { 'x-forwarded-for': '127.0.0.1' },
    body: { email: testEmail, name: 'Blocked User' }
  };

  await otpHandler(mockReq, mockRes);
  assert.equal(statusCode, 403, 'Blocked user OTP request must return HTTP 403');
  assert.equal(responseData.blocked, true);
  assert.ok(responseData.error.includes('support@vistarakrafts.com'));
});

test('5. Lockout Screen UX & Anti-Tamper DevTools Defense Verification', () => {
  const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  const appJs = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');

  // Verify index.html contains the unbypassable lockout component
  assert.ok(indexHtml.includes('id="vk-account-suspended-screen"'), 'Must have #vk-account-suspended-screen element');
  assert.ok(indexHtml.includes('support@vistarakrafts.com'), 'Must provide support@vistarakrafts.com contact email');
  assert.ok(indexHtml.includes('If you believe this was done in error or if we have made any mistake'), 'Must state mistake resolution clause');

  // Verify app.js contains the anti-tamper MutationObserver & guard
  assert.ok(appJs.includes('window.triggerAccountSuspension'), 'app.js must define triggerAccountSuspension');
  assert.ok(appJs.includes('window.startSuspensionAntiTamperGuard'), 'app.js must implement anti-tamper guard');
  assert.ok(appJs.includes('MutationObserver'), 'app.js must use MutationObserver against DevTools removal');
  assert.ok(appJs.includes('window.dismissSuspensionAndContinueAsGuest'), 'app.js must provide sign out & guest fallback');
});
