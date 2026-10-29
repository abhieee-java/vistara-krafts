import { CONFIG } from './config.js';

/**
 * Enterprise Email Service for Vistāra Krafts using Resend
 * Strictly server-side: handles welcome emails, templates, and idempotency.
 */
export class EmailService {
  /**
   * Returns a sanitized, RFC-compliant sender address for Resend API.
   * Strips any leading/trailing quotes and normalizes format to Name <email@domain>.
   */
  static getSenderAddress() {
    let raw = (CONFIG.RESEND_FROM_EMAIL || 'Vistāra Krafts <welcome@vistarakrafts.com>').trim();
    raw = raw.replace(/^['"]+|['"]+$/g, '').trim();

    const angleMatch = raw.match(/<([^>]+)>/);
    if (angleMatch) {
      const email = angleMatch[1].trim();
      let name = raw.replace(/<[^>]+>/, '').replace(/['"]/g, '').trim();
      return name ? `${name} <${email}>` : email;
    }

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      return `Vistāra Krafts <${raw}>`;
    }

    return 'Vistāra Krafts <welcome@vistarakrafts.com>';
  }

  /**
   * Builds the responsive, premium HTML welcome email for Vistāra Krafts.
   */
  static buildWelcomeEmailHtml({ name, email, siteUrl = 'https://vistarakrafts.com' }) {
    const greetingName = (name && String(name).trim().length > 0 && String(name).trim().toLowerCase() !== 'patron')
      ? String(name).trim()
      : '';
    const greeting = greetingName ? `Dear ${greetingName},` : 'Dear Patron,';
    const catalogUrl = `${siteUrl.replace(/\/$/, '')}/#/catalog`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Vistāra Krafts Atelier</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f7f6f2;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1e;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-spacing: 0;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f7f6f2;
      padding-top: 40px;
      padding-bottom: 40px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #e7e5df;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }
    .header-bar {
      background-color: #121217;
      padding: 36px 32px 30px;
      text-align: center;
    }
    .brand-title {
      color: #ffffff;
      font-size: 24px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 600;
      margin: 0;
      font-family: 'Playfair Display', Georgia, serif;
    }
    .brand-tagline {
      color: #c4a482;
      font-size: 11px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      margin-top: 8px;
      margin-bottom: 0;
      font-weight: 500;
    }
    .content {
      padding: 40px 36px 36px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #121217;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .body-p {
      font-size: 15px;
      line-height: 1.65;
      color: #4a4a52;
      margin-top: 0;
      margin-bottom: 18px;
    }
    .card-box {
      background-color: #faf9f6;
      border: 1px solid #ebe8e1;
      border-radius: 12px;
      padding: 22px 24px;
      margin: 24px 0;
    }
    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #121217;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 0;
      margin-bottom: 14px;
    }
    .feature-item {
      font-size: 13.5px;
      line-height: 1.55;
      color: #555560;
      margin-bottom: 10px;
      padding-left: 18px;
      position: relative;
    }
    .feature-item:last-child {
      margin-bottom: 0;
    }
    .cta-container {
      text-align: center;
      padding: 24px 0 12px;
    }
    .cta-button {
      display: inline-block;
      background-color: #121217;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 15px 36px;
      border-radius: 9999px;
      border: 1px solid #121217;
    }
    .footer-bar {
      background-color: #faf9f6;
      border-top: 1px solid #ebe8e1;
      padding: 28px 36px;
      text-align: center;
    }
    .footer-text {
      font-size: 12px;
      line-height: 1.6;
      color: #8c8c96;
      margin: 0 0 8px;
    }
    .footer-link {
      color: #8c8c96;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation" width="100%">
      <tr>
        <td align="center">
          <div class="container">
            <!-- Header -->
            <div class="header-bar">
              <h1 class="brand-title">Vistāra Krafts</h1>
              <p class="brand-tagline">Epoxy &amp; Keepsake Atelier</p>
            </div>

            <!-- Content -->
            <div class="content">
              <p class="greeting">${greeting}</p>
              
              <p class="body-p">
                We are delighted to welcome you to the Vistāra Krafts Atelier. Your patron account has been successfully created and verified.
              </p>

              <p class="body-p">
                At Vistāra Krafts, we celebrate the delicate alchemy of chemistry and handcrafted precision. From ultra-clear 2:1 and 3:1 cast resin formulations to bespoke floral preservation keepsakes and artisanal studio decor, every piece is curated for lasting beauty.
              </p>

              <!-- Highlights Box -->
              <div class="card-box">
                <div class="card-title">What You Can Expect at Our Atelier</div>
                <div class="feature-item">
                  <strong>• Artisanal Craftsmanship:</strong> Hand-cast, cured, and diamond-polished finishes crafted with care.
                </div>
                <div class="feature-item">
                  <strong>• Live Order Tracking:</strong> Real-time production milestones from formulation to courier pickup directly in your account.
                </div>
                <div class="feature-item">
                  <strong>• Pan-India Safe Delivery:</strong> Multi-layer shockproof packaging delivered securely to your doorstep.
                </div>
              </div>

              <!-- Call to Action -->
              <div class="cta-container">
                <a href="${catalogUrl}" class="cta-button" target="_blank" rel="noopener noreferrer">
                  Explore Store
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer-bar">
              <p class="footer-text">
                <strong>Vistāra Krafts Studio</strong> • Handcrafted Keepsakes &amp; Epoxy Formulations
              </p>
              <p class="footer-text">
                Questions or custom keepsake inquiries? Contact our studio concierge at 
                <a href="mailto:support@vistarakrafts.com" class="footer-link">support@vistarakrafts.com</a>
              </p>
              <p class="footer-text" style="margin-top: 14px; font-size: 11px;">
                You received this email because you created an account on <a href="${siteUrl}" class="footer-link">${siteUrl.replace(/^https?:\/\//, '')}</a>.
              </p>
              <p class="footer-text" style="font-size: 11px; margin-bottom: 0;">
                © 2026 Vistāra Krafts. All rights reserved.
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  }

  /**
   * Builds the plain-text fallback version of the welcome email.
   */
  static buildWelcomeEmailText({ name, email, siteUrl = 'https://vistarakrafts.com' }) {
    const greetingName = (name && String(name).trim().length > 0 && String(name).trim().toLowerCase() !== 'patron')
      ? String(name).trim()
      : '';
    const greeting = greetingName ? `Dear ${greetingName},` : 'Dear Patron,';
    const catalogUrl = `${siteUrl.replace(/\/$/, '')}/#/catalog`;

    return `VISTĀRA KRAFTS • EPOXY & KEEPSAKE ATELIER
==================================================

${greeting}

We are delighted to welcome you to the Vistāra Krafts Atelier. Your patron account has been successfully created and verified.

At Vistāra Krafts, we celebrate the delicate alchemy of chemistry and handcrafted precision. From ultra-clear 2:1 and 3:1 cast resin formulations to bespoke floral preservation keepsakes and artisanal studio decor, every piece is curated for lasting beauty.

WHAT YOU CAN EXPECT AT OUR ATELIER:
• Artisanal Craftsmanship: Hand-cast, cured, and diamond-polished finishes crafted with care.
• Live Order Tracking: Real-time production milestones from formulation to courier pickup directly in your account.
• Pan-India Safe Delivery: Multi-layer shockproof packaging delivered securely to your doorstep.

EXPLORE THE ATELIER:
Visit our storefront to discover our latest collections:
${catalogUrl}

==================================================
Vistāra Krafts Studio • Handcrafted Keepsakes & Epoxy Formulations
Support: support@vistarakrafts.com
Website: ${siteUrl}

You received this email because you created an account on vistarakrafts.com.
© 2026 Vistāra Krafts. All rights reserved.
`;
  }

  /**
   * Checks whether a welcome email has already been sent to this user.
   */
  static async hasWelcomeEmailBeenSent(userId, email) {
    if (!userId && !email) return false;
    try {
      const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/check_and_record_welcome_email`, {
        method: 'POST',
        headers: {
          'apikey': CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_user_id: userId,
          p_email: email ? email.toLowerCase() : '',
          p_resend_id: null
        })
      });

      if (!res.ok) {
        console.warn('[EmailService] RPC check_and_record_welcome_email status:', res.status);
        return false;
      }

      const canSend = await res.json();
      // If canSend is false, it means it was ALREADY sent
      return canSend === false;
    } catch (err) {
      console.warn('[EmailService] Error checking welcome email status:', err.message);
      return false;
    }
  }

  /**
   * Records that a welcome email has been sent.
   */
  static async recordWelcomeEmailSent(userId, email, resendId) {
    if (!userId || !email) return;
    try {
      await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/check_and_record_welcome_email`, {
        method: 'POST',
        headers: {
          'apikey': CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_user_id: userId,
          p_email: email.toLowerCase(),
          p_resend_id: resendId || 'sent_via_resend'
        })
      });
    } catch (err) {
      console.warn('[EmailService] Error recording welcome email:', err.message);
    }
  }

  /**
   * Sends the official Vistāra Krafts welcome email via Resend API.
   * Strictly enforces idempotency: will never send more than once per user.
   */
  static async sendWelcomeEmail({ userId, email, name }) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('A valid recipient email address is required.');
    }

    if (!CONFIG.RESEND_API_KEY) {
      throw new Error('Resend API key is not configured on the server.');
    }

    // 1. Strict Idempotency Check
    const alreadySent = await this.hasWelcomeEmailBeenSent(userId, email);
    if (alreadySent) {
      console.log(`[EmailService] Welcome email already delivered for ${email} (${userId}). Skipping duplicate.`);
      return {
        success: true,
        already_sent: true,
        message: 'Welcome email has already been dispatched for this patron.'
      };
    }

    // 2. Build email templates
    const htmlContent = this.buildWelcomeEmailHtml({
      name,
      email,
      siteUrl: CONFIG.SITE_URL || 'https://vistarakrafts.com'
    });
    const textContent = this.buildWelcomeEmailText({
      name,
      email,
      siteUrl: CONFIG.SITE_URL || 'https://vistarakrafts.com'
    });

    const subject = 'Welcome to Vistāra Krafts • Epoxy & Keepsake Atelier';

    // 3. Dispatch via Resend REST API
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: this.getSenderAddress(),
        to: [email],
        subject,
        html: htmlContent,
        text: textContent
      })
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok || resendData.error) {
      const errorMsg = resendData.error?.message || resendData.message || 'Resend API dispatch failed';
      console.error('[EmailService] Resend API Error:', errorMsg);
      throw new Error(`Failed to deliver welcome email via Resend: ${errorMsg}`);
    }

    const resendId = resendData.id;
    console.log(`[EmailService] Welcome email successfully dispatched via Resend to ${email} (ID: ${resendId})`);

    // 4. Record sent status in database for future idempotency
    await this.recordWelcomeEmailSent(userId, email, resendId);

    return {
      success: true,
      already_sent: false,
      id: resendId,
      to: email
    };
  }

  /**
   * Builds the responsive, premium HTML email containing the 6-digit OTP code.
   */
  static buildOtpEmailHtml({ name, code, siteUrl = 'https://vistarakrafts.com' }) {
    const greetingName = (name && String(name).trim().length > 0 && String(name).trim().toLowerCase() !== 'patron')
      ? String(name).trim()
      : '';
    const greeting = greetingName ? `Dear ${greetingName},` : 'Dear Patron,';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vistāra Krafts Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f7f6f2;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1e;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f7f6f2;
      padding-top: 40px;
      padding-bottom: 40px;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #e7e5df;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }
    .header-bar {
      background-color: #121217;
      padding: 32px 28px 26px;
      text-align: center;
    }
    .brand-title {
      color: #ffffff;
      font-size: 22px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 600;
      margin: 0;
      font-family: 'Playfair Display', Georgia, serif;
    }
    .brand-tagline {
      color: #c4a482;
      font-size: 11px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      margin-top: 6px;
      margin-bottom: 0;
      font-weight: 500;
    }
    .content {
      padding: 36px 32px 30px;
    }
    .greeting {
      font-size: 17px;
      font-weight: 600;
      color: #121217;
      margin-top: 0;
      margin-bottom: 14px;
    }
    .body-p {
      font-size: 14px;
      line-height: 1.6;
      color: #4a4a52;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .otp-card {
      background-color: #faf8f5;
      border: 2px dashed #d4af37;
      border-radius: 12px;
      padding: 24px 20px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #725a19;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .otp-code {
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #121217;
      font-family: 'Space Grotesk', -apple-system, monospace;
      margin: 6px 0;
    }
    .otp-expiry {
      font-size: 12px;
      color: #76757f;
      margin-top: 6px;
    }
    .footer-bar {
      background-color: #f7f6f2;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #ebe8e1;
      font-size: 12px;
      color: #76757f;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="container" width="100%" cellpadding="0" cellspacing="0" align="center">
      <tr>
        <td class="header-bar">
          <div class="brand-title">Vistāra Krafts</div>
          <div class="brand-tagline">Epoxy &amp; Keepsake Atelier</div>
        </td>
      </tr>
      <tr>
        <td class="content">
          <div class="greeting">${greeting}</div>
          <p class="body-p">
            Thank you for registering with Vistāra Krafts. To verify your email address and securely activate your account, please enter the following 6-digit verification code:
          </p>
          <div class="otp-card">
            <div class="otp-label">Your Verification Code</div>
            <div class="otp-code">${code}</div>
            <div class="otp-expiry">Valid for 15 minutes • Do not share this code with anyone</div>
          </div>
          <p class="body-p">
            Please enter this code on the website screen to complete your registration. If you did not create a Vistāra Krafts account, you can safely ignore this email.
          </p>
        </td>
      </tr>
      <tr>
        <td class="footer-bar">
          <div>© 2026 Vistāra Krafts (@resin.art.memories). All rights reserved.</div>
          <div style="margin-top: 4px;">Guwahati, Assam, India • ISO 9001:2015 Certified Atelier</div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  }

  /**
   * Builds the plain-text fallback version of the OTP email.
   */
  static buildOtpEmailText({ name, code }) {
    const greetingName = (name && String(name).trim().length > 0 && String(name).trim().toLowerCase() !== 'patron')
      ? String(name).trim()
      : '';
    const greeting = greetingName ? `Dear ${greetingName},` : 'Dear Patron,';

    return `${greeting}

Thank you for registering with Vistāra Krafts.

Your 6-digit verification code is: ${code}

This code is valid for 15 minutes. Enter this code on the website screen to complete your registration.

If you did not request this verification code, please ignore this email.

Warm regards,
The Vistāra Krafts Atelier Team
© 2026 Vistāra Krafts (@resin.art.memories)
Guwahati, Assam, India
`;
  }

  /**
   * Sends the 6-digit verification OTP email via Resend API.
   */
  static async sendVerificationOtpEmail({ email, name, code }) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('A valid recipient email address is required.');
    }
    if (!code || String(code).trim().length !== 6) {
      throw new Error('A valid 6-digit verification code is required.');
    }
    if (!CONFIG.RESEND_API_KEY) {
      throw new Error('Resend API key is not configured on the server.');
    }

    const htmlContent = this.buildOtpEmailHtml({ name, code, siteUrl: CONFIG.SITE_URL });
    const textContent = this.buildOtpEmailText({ name, code });
    const subject = `Your Vistāra Krafts Verification Code: ${code}`;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: this.getSenderAddress(),
        to: [email],
        subject,
        html: htmlContent,
        text: textContent
      })
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok || resendData.error) {
      const errorMsg = resendData.error?.message || resendData.message || 'Resend API dispatch failed';
      console.error('[EmailService] Resend OTP Error:', errorMsg);
      throw new Error(`Failed to deliver OTP email via Resend: ${errorMsg}`);
    }

    console.log(`[EmailService] OTP email successfully dispatched via Resend to ${email} (ID: ${resendData.id})`);
    return {
      success: true,
      id: resendData.id,
      to: email
    };
  }
}
