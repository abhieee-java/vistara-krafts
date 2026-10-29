import { CONFIG } from '../server/config.js';
import { extractClientIp, evaluateRateLimit, commitRateLimitEntry } from './send-verification-otp.js';

const verifyIpHistory = new Map();
const MAX_VERIFY_ATTEMPTS = 15;
const VERIFY_WINDOW_MS = 15 * 60 * 1000;

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Forwarded-For');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. Use POST.'
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (_e) {
        body = {};
      }
    }
    body = body || {};

    const email = (body.email || '').trim().toLowerCase();
    const code = (body.code || body.token || '').trim();
    const password = body.password || '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'A valid email address is required.'
      });
    }

    if (!code || code.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Please enter the 6-digit verification code.'
      });
    }

    // IP-based Rate Limiting to prevent brute-force guessing of OTP codes
    const clientIp = extractClientIp(req);
    const ipCheck = evaluateRateLimit(clientIp, verifyIpHistory, MAX_VERIFY_ATTEMPTS, VERIFY_WINDOW_MS);
    if (!ipCheck.allowed) {
      res.setHeader('Retry-After', String(ipCheck.retryAfter));
      return res.status(429).json({
        success: false,
        rateLimited: true,
        error: 'Too many verification attempts from this network. For security, please wait a few minutes before trying again.',
        retryAfter: ipCheck.retryAfter
      });
    }
    commitRateLimitEntry(clientIp, verifyIpHistory, VERIFY_WINDOW_MS);

    // 1. Verify code and confirm user in Supabase auth.users table
    const rpcRes = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/verify_email_code_and_confirm_user`, {
      method: 'POST',
      headers: {
        'apikey': CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_email: email,
        p_code: code
      })
    });

    if (!rpcRes.ok) {
      const errText = await rpcRes.text();
      return res.status(500).json({
        success: false,
        error: `Database verification failed: ${errText}`
      });
    }

    const rpcData = await rpcRes.json();
    if (!rpcData || !rpcData.success) {
      return res.status(400).json({
        success: false,
        error: rpcData?.error || 'Invalid or expired 6-digit verification code. Please try again.'
      });
    }

    // 2. User is now confirmed in Supabase Auth. If password provided, sign in directly to return session
    let session = null;
    if (password) {
      try {
        const tokenRes = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'apikey': CONFIG.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password
          })
        });

        if (tokenRes.ok) {
          session = await tokenRes.json();
        }
      } catch (tokenErr) {
        console.warn('[Vistāra OTP API] Token sign-in warning:', tokenErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      verified: true,
      user_id: rpcData.user_id,
      session
    });
  } catch (err) {
    console.error('[Vistāra OTP API] Verification error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Verification failed. Please retry.'
    });
  }
}
