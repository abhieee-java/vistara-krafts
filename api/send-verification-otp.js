import { CONFIG } from '../server/config.js';
import { EmailService } from '../server/email-service.js';

// Sliding-window in-memory stores for zero-latency bot rejection and burst throttling
const ipRequestHistory = new Map();
const emailRequestHistory = new Map();

export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15-minute sliding window (900 seconds)
export const MAX_REQUESTS_PER_WINDOW = 5; // Exactly 5 verification attempts allowed per window
export const MIN_COOLDOWN_MS = 10 * 1000; // 10-second spam throttle between instant programmatic clicks

/**
 * Extracts normalized client IP address from proxy headers across Vercel, Cloudflare, and local servers.
 */
export function extractClientIp(req) {
  if (!req || !req.headers) return '127.0.0.1';
  const forwarded = req.headers['x-forwarded-for'] || req.headers['x-vercel-forwarded-for'];
  if (forwarded) {
    const list = String(forwarded).split(',');
    const candidate = list[0]?.trim();
    if (candidate) return candidate;
  }
  return req.headers['x-real-ip'] || 
         req.headers['cf-connecting-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         '127.0.0.1';
}

/**
 * Evaluates sliding window rate limits for an identifier (IP address or email).
 */
export function evaluateRateLimit(key, historyMap, maxRequests = MAX_REQUESTS_PER_WINDOW, windowMs = RATE_LIMIT_WINDOW_MS) {
  if (!key) return { allowed: true, remaining: maxRequests };
  const now = Date.now();
  const entry = historyMap.get(key) || { timestamps: [], lastRequest: 0 };
  
  // Filter active timestamps within the sliding window
  const activeTimestamps = entry.timestamps.filter(ts => (now - ts) < windowMs);

  // Rapid programmatic burst spam check (< 10 seconds between requests)
  if (entry.lastRequest && (now - entry.lastRequest) < MIN_COOLDOWN_MS) {
    const waitSec = Math.ceil((MIN_COOLDOWN_MS - (now - entry.lastRequest)) / 1000);
    return {
      allowed: false,
      reason: 'COOLDOWN',
      retryAfter: Math.max(1, waitSec),
      error: `Please wait ${waitSec}s before requesting another verification code.`
    };
  }

  // Sliding window limit check (max 5 requests)
  if (activeTimestamps.length >= maxRequests) {
    const oldestTimestamp = activeTimestamps[0];
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldestTimestamp)) / 1000));
    return {
      allowed: false,
      reason: 'LIMIT_EXCEEDED',
      retryAfter: retryAfterSec,
      error: 'You have reached the limit of 5 verification requests. For security and to protect against abuse, please wait before requesting another code.'
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - activeTimestamps.length - 1)
  };
}

/**
 * Commits a request timestamp to the in-memory rate limiter history.
 */
export function commitRateLimitEntry(key, historyMap, windowMs = RATE_LIMIT_WINDOW_MS) {
  if (!key) return;
  const now = Date.now();
  const entry = historyMap.get(key) || { timestamps: [], lastRequest: 0 };
  entry.timestamps = entry.timestamps.filter(ts => (now - ts) < windowMs);
  entry.timestamps.push(now);
  entry.lastRequest = now;
  historyMap.set(key, entry);
}

/**
 * Helper to reset in-memory history (used by automated tests)
 */
export function _resetRateLimitHistory() {
  ipRequestHistory.clear();
  emailRequestHistory.clear();
}

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
    const name = (body.name || '').trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'A valid email address is required.'
      });
    }

    // 1. Extract and sanitize client IP address
    const clientIp = extractClientIp(req);

    // 2. High-Speed In-Memory Rate Limiting (Sub-millisecond anti-bot rejection before hitting DB or Resend)
    const ipCheck = evaluateRateLimit(clientIp, ipRequestHistory);
    if (!ipCheck.allowed) {
      res.setHeader('Retry-After', String(ipCheck.retryAfter));
      res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
      res.setHeader('X-RateLimit-Remaining', '0');
      return res.status(429).json({
        success: false,
        rateLimited: true,
        reason: ipCheck.reason,
        error: ipCheck.error,
        retryAfter: ipCheck.retryAfter
      });
    }

    const emailCheck = evaluateRateLimit(email, emailRequestHistory);
    if (!emailCheck.allowed) {
      res.setHeader('Retry-After', String(emailCheck.retryAfter));
      res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
      res.setHeader('X-RateLimit-Remaining', '0');
      return res.status(429).json({
        success: false,
        rateLimited: true,
        reason: emailCheck.reason,
        error: emailCheck.error,
        retryAfter: emailCheck.retryAfter
      });
    }

    // 3. Generate 6-digit numeric OTP code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // 4. Authoritative Database Rate Limiting & Persistence in Supabase (persists across serverless cold starts)
    const rpcRes = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/create_email_verification_code`, {
      method: 'POST',
      headers: {
        'apikey': CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_email: email,
        p_code: code,
        p_ip_address: clientIp
      })
    });

    if (!rpcRes.ok) {
      const rpcErr = await rpcRes.text();
      console.error('[Vistāra OTP API] Database create code error:', rpcErr);
      throw new Error('Failed to record verification code in database.');
    }

    const rpcData = await rpcRes.json();
    if (rpcData && (rpcData.rateLimited || !rpcData.success)) {
      res.setHeader('Retry-After', '900');
      res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
      res.setHeader('X-RateLimit-Remaining', '0');
      return res.status(429).json({
        success: false,
        rateLimited: true,
        code: rpcData.code,
        error: rpcData.error || 'Verification request limit reached (maximum 5 attempts per 15 minutes). Please try again later.',
        retryAfter: 900
      });
    }

    // 5. Commit request timestamp to in-memory sliding window history
    commitRateLimitEntry(clientIp, ipRequestHistory);
    commitRateLimitEntry(email, emailRequestHistory);

    // 6. Dispatch the branded 6-digit OTP code email via Resend
    const emailResult = await EmailService.sendVerificationOtpEmail({
      email,
      name,
      code
    });

    const remainingQuota = Math.max(0, Math.min(ipCheck.remaining, emailCheck.remaining));
    res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
    res.setHeader('X-RateLimit-Remaining', String(remainingQuota));

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${email}`,
      id: emailResult.id,
      remaining: remainingQuota
    });
  } catch (err) {
    console.error('[Vistāra OTP API] Dispatch error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to dispatch verification email. Please try again.'
    });
  }
}
