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

test('7. Database RPC Rate Limiting: Max 5 OTP code requests per email in 15 minutes', async () => {
  const targetEmail = `rate_limit_email_${Date.now()}@vistarakrafts.com`;

  // Make 5 successful code requests for this email
  for (let i = 1; i <= 5; i++) {
    const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/create_email_verification_code`, {
      method: 'POST',
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_email: targetEmail, p_code: `10000${i}`, p_ip_address: `10.0.0.${i}` })
    });
    const data = await res.json();
    assert.equal(data.success, true, `Request ${i} of 5 should succeed`);
  }

  // 6th request for same email must be strictly blocked with rate limit error
  const blockedRes = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/create_email_verification_code`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_email: targetEmail, p_code: '999999', p_ip_address: '10.0.0.99' })
  });
  const blockedData = await blockedRes.json();
  assert.equal(blockedData.success, false, '6th request for same email must be blocked');
  assert.equal(blockedData.rateLimited, true, 'Response must identify rateLimited true');
  assert.equal(blockedData.code, 'RATE_LIMIT_EMAIL_EXCEEDED');
  assert.ok(blockedData.error.includes('Too many verification requests for this email'));
});

test('8. Database RPC Rate Limiting: Max 5 OTP code requests per IP address in 15 minutes', async () => {
  const testIp = `203.0.113.${Math.floor(10 + Math.random() * 80)}`;

  // Make 5 requests from this same IP address across 5 different email addresses
  for (let i = 1; i <= 5; i++) {
    const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/create_email_verification_code`, {
      method: 'POST',
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_email: `user_${i}_${Date.now()}@vistarakrafts.com`, p_code: `20000${i}`, p_ip_address: testIp })
    });
    const data = await res.json();
    assert.equal(data.success, true, `Request ${i} of 5 from IP ${testIp} should succeed`);
  }

  // 6th request from same IP address must be blocked even if email is completely new
  const blockedRes = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/create_email_verification_code`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_email: `victim_new_${Date.now()}@vistarakrafts.com`, p_code: '888888', p_ip_address: testIp })
  });
  const blockedData = await blockedRes.json();
  assert.equal(blockedData.success, false, '6th request from same IP must be blocked');
  assert.equal(blockedData.rateLimited, true, 'Response must identify rateLimited true');
  assert.equal(blockedData.code, 'RATE_LIMIT_IP_EXCEEDED');
  assert.ok(blockedData.error.includes('Too many verification requests from this network'));
});

test('9. In-Memory Sliding Window Rate Limiting Engine: Anti-Bot & Cooldown Protection', async () => {
  const { extractClientIp, evaluateRateLimit, commitRateLimitEntry, _resetRateLimitHistory } = await import('../api/send-verification-otp.js');

  // Test IP extraction across headers
  const mockReq1 = { headers: { 'x-forwarded-for': '198.51.100.42, 10.0.0.1' } };
  assert.equal(extractClientIp(mockReq1), '198.51.100.42', 'Must extract first client IP from x-forwarded-for');

  const mockReq2 = { headers: { 'cf-connecting-ip': '198.51.100.99' } };
  assert.equal(extractClientIp(mockReq2), '198.51.100.99', 'Must extract cf-connecting-ip');

  // Test Sliding Window Limiter (5 requests allowed)
  _resetRateLimitHistory();
  const testMap = new Map();
  const testKey = 'test_bot_ip_1';

  // 1st request
  const check1 = evaluateRateLimit(testKey, testMap, 5, 60000);
  assert.equal(check1.allowed, true);
  assert.equal(check1.remaining, 4);
  commitRateLimitEntry(testKey, testMap, 60000);

  // Rapid programmatic request immediately without cooldown
  const rapidCheck = evaluateRateLimit(testKey, testMap, 5, 60000);
  assert.equal(rapidCheck.allowed, false);
  assert.equal(rapidCheck.reason, 'COOLDOWN', 'Must enforce cooldown throttle against rapid script clicks');

  // Manually simulate spaced-out requests
  testMap.set(testKey, {
    timestamps: [Date.now() - 50000, Date.now() - 40000, Date.now() - 30000, Date.now() - 20000, Date.now() - 15000],
    lastRequest: Date.now() - 15000
  });

  // 6th request within window must be rejected
  const sixthCheck = evaluateRateLimit(testKey, testMap, 5, 60000);
  assert.equal(sixthCheck.allowed, false);
  assert.equal(sixthCheck.reason, 'LIMIT_EXCEEDED');
  assert.ok(sixthCheck.error.includes('limit of 5 verification requests'));
});

test('10. Privacy Policy & Terms of Service Transparency: IP Telemetry & Rate Limiting Disclosed', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const privacyHtml = fs.readFileSync(path.resolve(__dirname, '../privacy.html'), 'utf8');
  const termsHtml = fs.readFileSync(path.resolve(__dirname, '../terms.html'), 'utf8');

  // Privacy Policy checks
  assert.ok(privacyHtml.includes('Technical Telemetry, Anti-Bot &amp; Rate-Limiting Protection'), 'Privacy policy must disclose anti-bot & rate limiting');
  assert.ok(privacyHtml.includes('IP address') || privacyHtml.includes('Internet Protocol (IP) address'), 'Privacy policy must explicitly state IP address collection');
  assert.ok(privacyHtml.includes('5 verification code requests per 15 minutes'), 'Privacy policy must state the 5-request rate limit quota');
  assert.ok(privacyHtml.includes('Digital Personal Data Protection (DPDP) Act, 2023'), 'Privacy policy must cite lawful basis under DPDP Act 2023');

  // Terms of Service checks
  assert.ok(termsHtml.includes('Anti-Abuse &amp; Rate Limiting'), 'Terms must state anti-abuse and rate limiting rules');
  assert.ok(termsHtml.includes('maximum 5 verification requests per 15-minute sliding window'), 'Terms must specify rate limit window');
});
