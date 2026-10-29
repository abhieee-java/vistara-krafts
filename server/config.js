import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load local .env if present without requiring dotenv dependency
function loadEnvFile() {
  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '.env')
  ];

  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
        break;
      } catch (_e) {}
    }
  }
}

loadEnvFile();

export const CONFIG = {
  // Razorpay Test Mode Credentials
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TpT9QQKuBwPSmm',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '',

  // Supabase Database & Auth
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://niamxrskqhjvzwxomxrx.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_gK22Lr7xNqKI7VFAfnsQTA_7UD0S2iu',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '',

  // Business Rules
  FREE_SHIPPING_THRESHOLD: Number(process.env.FREE_SHIPPING_THRESHOLD || 999),
  STANDARD_SHIPPING_FEE: Number(process.env.STANDARD_SHIPPING_FEE || 99),
  GST_RATE_PERCENT: 18,
  CURRENCY: 'INR',

  // Canonical Site URL
  SITE_URL: process.env.SITE_URL || 'https://vistarakrafts.com',

  // Resend Transactional Email
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'Vistāra Krafts <welcome@vistarakrafts.com>',
  RESEND_OTP_FROM_EMAIL: process.env.RESEND_OTP_FROM_EMAIL || 'Vistāra Krafts <team@vistarakrafts.com>'
};
