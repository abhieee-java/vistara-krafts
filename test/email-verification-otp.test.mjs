import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../server/config.js';
import { EmailService } from '../server/email-service.js';

test('1. OTP Email Template: Prominent 6-digit code display & zero broken links', async () => {
  const code = '789123';
  const name = 'Anjana Kalita';
  const html = EmailService.buildOtpEmailHtml({ name, code });

  assert.ok(html.includes('789123'), 'HTML template must contain the 6-digit code');
  assert.ok(html.includes('Anjana Kalita'), 'HTML template must greet by name');
  assert.ok(html.includes('Valid for 15 minutes'), 'HTML template must specify expiration time');
  assert.ok(!html.includes('{{ .ConfirmationURL }}'), 'HTML template must not contain unexpanded GoTrue template tags');
  assert.ok(!html.includes('href=""'), 'HTML template must not have empty links');
});

test('2. OTP Email Plain-Text Fallback: Clear code presentation', async () => {
  const code = '456789';
  const text = EmailService.buildOtpEmailText({ name: 'Patron', code });

  assert.ok(text.includes('456789'), 'Plain-text template must contain the 6-digit code');
  assert.ok(text.includes('Valid for 15 minutes') || text.includes('valid for 15 minutes'), 'Plain-text template must specify validity');
});

test('2b. Sender Identity: OTP Sender is team@vistarakrafts.com', () => {
  const sender = EmailService.getSenderAddress(CONFIG.RESEND_OTP_FROM_EMAIL || 'Vistāra Krafts <team@vistarakrafts.com>');
  assert.ok(sender.includes('team@vistarakrafts.com'), 'Sender must use team@vistarakrafts.com');
  assert.ok(sender.includes('Vistāra Krafts') || sender.includes('Vistara Krafts'), 'Sender must include atelier brand name');
});

test('3. Database RPC create_email_verification_code persists code', async () => {
  const testEmail = `test_otp_${Date.now()}@vistarakrafts.com`;
  const testCode = '882211';

  const rpcRes = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/create_email_verification_code`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_email: testEmail,
      p_code: testCode
    })
  });

  assert.equal(rpcRes.status, 200, 'create_email_verification_code should succeed with status 200');
  const data = await rpcRes.json();
  assert.equal(data.success, true, 'create_email_verification_code should return success true');
});

test('4. Database RPC verify_email_code_and_confirm_user rejects wrong code', async () => {
  const testEmail = `test_otp_wrong_${Date.now()}@vistarakrafts.com`;
  const realCode = '112233';
  const wrongCode = '999999';

  // Create code
  await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/create_email_verification_code`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_email: testEmail, p_code: realCode })
  });

  // Verify wrong code
  const verifyRes = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/verify_email_code_and_confirm_user`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_email: testEmail, p_code: wrongCode })
  });

  assert.equal(verifyRes.status, 200);
  const data = await verifyRes.json();
  assert.equal(data.success, false, 'Wrong code must return success false');
  assert.ok(data.error.includes('Invalid 6-digit code'), 'Error should specify code is invalid');
});

test('5. Database RPC verify_email_code_and_confirm_user accepts matching code', async () => {
  const testEmail = `test_otp_correct_${Date.now()}@vistarakrafts.com`;
  const realCode = '654321';

  // Create code
  await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/create_email_verification_code`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_email: testEmail, p_code: realCode })
  });

  // Verify matching code
  const verifyRes = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/verify_email_code_and_confirm_user`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_email: testEmail, p_code: realCode })
  });

  assert.equal(verifyRes.status, 200);
  const data = await verifyRes.json();
  assert.equal(data.success, true, 'Matching code must return success true');
  assert.equal(data.email, testEmail, 'Returned email must match');
});

test('6. Attempt Throttling: Max 5 incorrect attempts locks the code', async () => {
  const testEmail = `test_otp_throttle_${Date.now()}@vistarakrafts.com`;
  const realCode = '555666';

  await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/create_email_verification_code`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_email: testEmail, p_code: realCode })
  });

  // 5 incorrect attempts
  for (let i = 0; i < 5; i++) {
    await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/verify_email_code_and_confirm_user`, {
      method: 'POST',
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_email: testEmail, p_code: '000000' })
    });
  }

  // 6th attempt should return rate limit error
  const lockedRes = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/verify_email_code_and_confirm_user`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_email: testEmail, p_code: realCode })
  });

  const lockedData = await lockedRes.json();
  assert.equal(lockedData.success, false, 'After 5 failed attempts, code should be locked');
  assert.ok(lockedData.error.includes('Too many incorrect attempts'), 'Error message should indicate attempt limit reached');
});
