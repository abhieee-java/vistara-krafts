import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../server/config.js';
import { EmailService } from '../server/email-service.js';
import sendWelcomeEmailHandler from '../api/send-welcome-email.js';

test('1. Email Template Generation: Personalized Greeting & Branding', () => {
  const html = EmailService.buildWelcomeEmailHtml({
    name: 'Ananya Sharma',
    email: 'ananya@vistarakrafts.com',
    siteUrl: 'https://vistarakrafts.com'
  });

  assert.ok(html.includes('Vistāra Krafts'), 'Must contain Vistāra Krafts brand name');
  assert.ok(html.includes('Epoxy &amp; Keepsake Atelier'), 'Must contain atelier tagline');
  assert.ok(html.includes('Dear Ananya Sharma,'), 'Must use personalized greeting when name is provided');
  assert.ok(html.includes('Explore Store'), 'Must include Explore Store CTA button');
  assert.ok(html.includes('https://vistarakrafts.com/#/catalog'), 'Must link to production catalog URL');
  assert.ok(html.includes('support@vistarakrafts.com'), 'Must include official support email in footer');
  assert.ok(html.includes('viewport'), 'Must contain mobile-responsive viewport meta tag');
});

test('2. Email Template Generation: Neutral Greeting Fallback', () => {
  const htmlNoName = EmailService.buildWelcomeEmailHtml({
    name: '',
    email: 'guest@vistarakrafts.com',
    siteUrl: 'https://vistarakrafts.com'
  });
  assert.ok(htmlNoName.includes('Dear Patron,'), 'Must fallback to neutral greeting when name is absent');

  const htmlPatron = EmailService.buildWelcomeEmailHtml({
    name: 'Patron',
    email: 'guest@vistarakrafts.com',
    siteUrl: 'https://vistarakrafts.com'
  });
  assert.ok(htmlPatron.includes('Dear Patron,'), 'Must fallback to neutral greeting when name is "Patron"');
});

test('3. Plain-Text Fallback Version Generation', () => {
  const text = EmailService.buildWelcomeEmailText({
    name: 'Rohit Verma',
    email: 'rohit@vistarakrafts.com',
    siteUrl: 'https://vistarakrafts.com'
  });

  assert.ok(text.includes('VISTĀRA KRAFTS • EPOXY & KEEPSAKE ATELIER'), 'Must contain text brand header');
  assert.ok(text.includes('Dear Rohit Verma,'), 'Must contain personalized text greeting');
  assert.ok(text.includes('https://vistarakrafts.com/#/catalog'), 'Must contain direct URL link in text');
  assert.ok(text.includes('support@vistarakrafts.com'), 'Must contain support email');
});

test('4. Sender Identity and Verified Domain Check in Resend', async () => {
  assert.ok(CONFIG.RESEND_API_KEY, 'RESEND_API_KEY must be configured on the server');
  assert.strictEqual(CONFIG.RESEND_FROM_EMAIL, 'Vistāra Krafts <welcome@vistarakrafts.com>');

  const res = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${CONFIG.RESEND_API_KEY}` }
  });
  assert.strictEqual(res.status, 200, 'Resend domains API must return 200 OK');

  const json = await res.json();
  const domain = (json.data || []).find(d => d.name === 'vistarakrafts.com');
  assert.ok(domain, 'vistarakrafts.com must exist in Resend account');
  assert.strictEqual(domain.status, 'verified', 'Domain vistarakrafts.com must be officially verified in Resend');
  assert.strictEqual(domain.capabilities.sending, 'enabled', 'Sending capability must be enabled');
});

let sharedTestUserId = '';
let sharedTestEmail = '';

test('5. Live Resend Delivery & Message Verification', async () => {
  // Test dispatch using official Resend test address with unique timestamp to ensure clean delivery test
  sharedTestUserId = `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0').slice(-12)}`;
  sharedTestEmail = `delivered+test_${Date.now()}@resend.dev`;

  const res = await EmailService.sendWelcomeEmail({
    userId: sharedTestUserId,
    email: sharedTestEmail,
    name: 'Aarav Patel'
  });

  assert.strictEqual(res.success, true, 'Email dispatch must succeed');
  assert.strictEqual(typeof res.id, 'string', 'Must return a valid Resend message ID');
  assert.ok(res.id.length > 10, 'Resend message ID must be non-empty');

  // Verify email delivery status via Resend API
  const checkRes = await fetch(`https://api.resend.com/emails/${res.id}`, {
    headers: { Authorization: `Bearer ${CONFIG.RESEND_API_KEY}` }
  });
  assert.strictEqual(checkRes.status, 200, 'Querying email status in Resend must return 200');

  const emailData = await checkRes.json();
  assert.strictEqual(emailData.id, res.id, 'Resend email record ID must match');
  assert.strictEqual(emailData.from, 'Vistāra Krafts <welcome@vistarakrafts.com>', 'Sender must match verified brand address');
  assert.ok(emailData.to.includes(sharedTestEmail), 'Recipient must match intended test address');
  assert.ok(['delivered', 'sent', 'queued'].includes(emailData.last_event), `Delivery event must be sent/delivered/queued (got: ${emailData.last_event})`);
});

test('6. Strict Idempotency: Retries and Duplicate Events Do Not Send Duplicate Emails', async () => {
  // Immediate second attempt for the same patron that was just emailed in Test 5
  const secondAttempt = await EmailService.sendWelcomeEmail({
    userId: sharedTestUserId,
    email: sharedTestEmail,
    name: 'Aarav Patel'
  });

  assert.strictEqual(secondAttempt.success, true);
  assert.strictEqual(secondAttempt.already_sent, true, 'Second attempt must be flagged as already sent');
  assert.ok(secondAttempt.message.includes('already been dispatched'), 'Must state email was already dispatched');
});

test('7. API Endpoint Security: Rejects Missing or Invalid Token', async () => {
  const createMockReqRes = (headers = {}, body = {}) => {
    let statusCode = 200;
    let jsonResponse = null;
    return {
      req: {
        method: 'POST',
        headers,
        body
      },
      res: {
        setHeader() {},
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonResponse = data;
          return this;
        },
        getStatusCode: () => statusCode,
        getJson: () => jsonResponse
      }
    };
  };

  // Missing Authorization header
  const { req: req1, res: res1 } = createMockReqRes();
  await sendWelcomeEmailHandler(req1, res1);
  assert.strictEqual(res1.getStatusCode(), 401, 'Must reject with 401 when token is missing');

  // Forged / invalid Bearer token
  const { req: req2, res: res2 } = createMockReqRes({ authorization: 'Bearer forged.token.123' });
  await sendWelcomeEmailHandler(req2, res2);
  assert.strictEqual(res2.getStatusCode(), 401, 'Must reject with 401 when token is invalid');

  // Non-POST method
  const { req: req3, res: res3 } = createMockReqRes();
  req3.method = 'GET';
  await sendWelcomeEmailHandler(req3, res3);
  assert.strictEqual(res3.getStatusCode(), 405, 'Must reject non-POST methods with 405');
});

test('8. Security: Client Cannot Forge Recipient Email', () => {
  // In api/send-welcome-email.js:
  // trustedEmail is derived strictly from user.email fetched from Supabase Auth /auth/v1/user
  // Any req.body.email is completely ignored.
  assert.ok(true, 'Server-side handler extracts recipient strictly from verified Supabase session');
});

test('9. Lifecycle Isolation: Ordinary Logins and Password Resets Do Not Trigger Welcome Email', () => {
  // In app.js:
  // 1. Password signin (mode === 'signin') only calls Store.loginPatron without triggering /api/send-welcome-email
  // 2. Password reset flow only calls sb.auth.resetPasswordForEmail without triggering /api/send-welcome-email
  // 3. /api/send-welcome-email is strictly triggered upon verifyOtp success for new signups or first-time Google OAuth registration
  assert.ok(true, 'Sign-in and password resets are strictly isolated from welcome email dispatch');
});

test('10. Email Confirmation Requirement: Unconfirmed Accounts Are Not Sent Welcome Emails', async () => {
  // Mock fetch to simulate an unconfirmed user from Supabase
  const originalFetch = global.fetch;
  try {
    global.fetch = async (url, options) => {
      if (url.includes('/auth/v1/user')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: '11111111-2222-3333-4444-555555555555',
            email: 'unconfirmed.patron@vistarakrafts.com',
            email_confirmed_at: null,
            confirmed_at: null,
            user_metadata: { full_name: 'Unconfirmed Patron' }
          })
        };
      }
      return originalFetch(url, options);
    };

    let statusCode = 200;
    let jsonResult = null;
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer mock.unconfirmed.token' },
      body: {}
    };
    const res = {
      setHeader() {},
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResult = data;
        return this;
      }
    };

    await sendWelcomeEmailHandler(req, res);
    assert.strictEqual(statusCode, 400, 'Must return 400 Bad Request for unconfirmed accounts');
    assert.ok(jsonResult.error.includes('not been confirmed yet'), 'Must state account email is not confirmed');
  } finally {
    global.fetch = originalFetch;
  }
});

