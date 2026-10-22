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
    // 1. Extract Bearer token from Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing patron session token.'
      });
    }

    // 2. Validate token and fetch verified user record directly from Supabase Auth
    const userRes = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`
      }
    });

    if (!userRes.ok) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or expired patron session.'
      });
    }

    const user = await userRes.json();
    if (!user || !user.id || !user.email) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Unable to verify patron identity.'
      });
    }

    // 3. Ensure email confirmation has occurred before sending welcome email
    // For email OTP signups, email_confirmed_at is set once verified.
    // For Google OAuth, email is verified by Google and confirmed immediately.
    const isConfirmed = Boolean(user.email_confirmed_at || user.confirmed_at || user.app_metadata?.provider === 'google');
    if (!isConfirmed) {
      return res.status(400).json({
        success: false,
        error: 'Account email has not been confirmed yet. Welcome email cannot be dispatched.'
      });
    }

    // 4. Resolve name from verified user metadata (never trust client payload)
    const trustedEmail = String(user.email).trim().toLowerCase();
    const trustedName = user.user_metadata?.full_name || user.user_metadata?.name || '';

    // 5. Dispatch welcome email via EmailService (strictly idempotent)
    const result = await EmailService.sendWelcomeEmail({
      userId: user.id,
      email: trustedEmail,
      name: trustedName
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('[API send-welcome-email Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to dispatch welcome email.'
    });
  }
}
