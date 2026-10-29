import { CONFIG } from '../server/config.js';
import { EmailService } from '../server/email-service.js';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

    // 1. Generate 6-digit numeric OTP code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // 2. Persist OTP in Supabase database with 15-minute expiration
    const rpcRes = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/create_email_verification_code`, {
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
      const rpcErr = await rpcRes.text();
      console.error('[Vistāra OTP API] Database create code error:', rpcErr);
      throw new Error('Failed to record verification code in database.');
    }

    // 3. Dispatch the branded 6-digit OTP code email via Resend
    const emailResult = await EmailService.sendVerificationOtpEmail({
      email,
      name,
      code
    });

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${email}`,
      id: emailResult.id
    });
  } catch (err) {
    console.error('[Vistāra OTP API] Dispatch error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to dispatch verification email. Please try again.'
    });
  }
}
