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
  static getSenderAddress(override) {
    let raw = (override || CONFIG.RESEND_FROM_EMAIL || 'Vistāra Krafts <welcome@vistarakrafts.com>').trim();
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

    return override || 'Vistāra Krafts <welcome@vistarakrafts.com>';
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
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    body {
      margin: 0;
      padding: 0;
      background-color: #f6f5f0;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1e;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    table {
      border-spacing: 0;
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f6f5f0;
      padding-top: 48px;
      padding-bottom: 48px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      border: 1px solid #e5e1d5;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(18, 18, 23, 0.06);
    }
    .gold-accent-bar {
      height: 4px;
      background: linear-gradient(90deg, #aa771c 0%, #f3e5ab 50%, #d4af37 100%);
      width: 100%;
    }
    .header-bar {
      background-color: #0d0d12;
      padding: 40px 32px 34px;
      text-align: center;
      background-image: radial-gradient(circle at 50% 0%, #1e1e28 0%, #0d0d12 80%);
    }
    .brand-emblem {
      display: inline-block;
      margin-bottom: 14px;
    }
    .brand-title {
      color: #ffffff;
      font-size: 26px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 700;
      margin: 0;
      font-family: 'Playfair Display', Georgia, serif;
    }
    .brand-tagline {
      color: #d4af37;
      font-size: 11.5px;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      margin-top: 8px;
      margin-bottom: 0;
      font-weight: 600;
    }
    .content {
      padding: 44px 38px 40px;
    }
    .greeting {
      font-size: 19px;
      font-weight: 700;
      color: #121217;
      margin-top: 0;
      margin-bottom: 18px;
      font-family: 'Playfair Display', Georgia, serif;
    }
    .body-p {
      font-size: 15px;
      line-height: 1.7;
      color: #4a4a54;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .privilege-card {
      background: #faf8f5;
      border: 1.5px dashed #d4af37;
      border-radius: 14px;
      padding: 22px 24px;
      margin: 28px 0;
      text-align: center;
    }
    .privilege-badge {
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      font-weight: 700;
      color: #9e3322;
      margin-bottom: 8px;
    }
    .privilege-title {
      font-size: 16px;
      font-weight: 700;
      color: #121217;
      margin: 0 0 10px;
      font-family: 'Playfair Display', Georgia, serif;
    }
    .coupon-code {
      display: inline-block;
      font-family: 'Courier New', Courier, monospace;
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 0.14em;
      color: #121217;
      background-color: #ffffff;
      border: 1px solid #e6e2d8;
      border-radius: 8px;
      padding: 7px 18px;
      margin: 4px 0 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }
    .privilege-sub {
      font-size: 12px;
      color: #6b6b75;
      margin: 0;
    }
    .card-box {
      background-color: #faf9f6;
      border: 1px solid #ebe8e1;
      border-radius: 14px;
      padding: 24px 26px;
      margin: 26px 0;
    }
    .card-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #121217;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 0;
      margin-bottom: 16px;
      border-bottom: 1px solid #ede9e1;
      padding-bottom: 10px;
    }
    .feature-item {
      font-size: 13.5px;
      line-height: 1.6;
      color: #4a4a54;
      margin-bottom: 12px;
      padding-left: 20px;
      position: relative;
    }
    .feature-item:last-child {
      margin-bottom: 0;
    }
    .feature-item::before {
      content: '•';
      position: absolute;
      left: 4px;
      color: #d4af37;
      font-weight: bold;
      font-size: 16px;
      line-height: 1;
    }
    .cta-container {
      text-align: center;
      padding: 28px 0 12px;
    }
    .cta-button {
      display: inline-block;
      background-color: #121217;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 16px 42px;
      border-radius: 9999px;
      border: 1px solid #121217;
      box-shadow: 0 4px 16px rgba(18, 18, 23, 0.16);
      transition: all 0.2s ease-in-out;
    }
    .footer-bar {
      background-color: #fbfaf7;
      border-top: 1px solid #ebe8e1;
      padding: 32px 36px;
      text-align: center;
    }
    .footer-text {
      font-size: 12px;
      line-height: 1.65;
      color: #8c8c96;
      margin: 0 0 8px;
    }
    .footer-link {
      color: #6b6b75;
      text-decoration: underline;
    }
    .footer-trust {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 9999px;
      background: #f1eee6;
      font-size: 11px;
      font-weight: 600;
      color: #4a4a52;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation" width="100%">
      <tr>
        <td align="center">
          <div class="container">
            <!-- Luxury Gold Gradient Accent Bar -->
            <div class="gold-accent-bar"></div>

            <!-- Header -->
            <div class="header-bar">
              <div class="brand-emblem">
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="22" cy="22" r="21" stroke="#d4af37" stroke-width="1.2" stroke-dasharray="3 3"/>
                  <rect x="10" y="10" width="24" height="24" rx="4" stroke="#d4af37" stroke-width="1.2" fill="#121217"/>
                  <path d="M16 16L22 28L28 16" stroke="#f3e5ab" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h1 class="brand-title">Vistāra Krafts</h1>
              <p class="brand-tagline">Epoxy &amp; Keepsake Atelier</p>
            </div>

            <!-- Content -->
            <div class="content">
              <p class="greeting">${greeting}</p>
              
              <p class="body-p">
                We are delighted to welcome you to the <strong>Vistāra Krafts Atelier</strong>. Your patron account has been officially registered and verified.
              </p>

              <p class="body-p">
                At our studio in Guwahati, Assam, we dedicate ourselves to the art of bespoke botanical preservation and precision optical resin chemistry. Whether you are preserving sacred wedding varmalas into diamond-polished keepsake blocks or crafting heirloom resin masterpieces with our 3:1 and 2:1 crystal formulations, each batch is engineered for timeless permanence.
              </p>

              <!-- Patron Welcome Privilege Box -->
              <div class="privilege-card">
                <div class="privilege-badge">Patron Welcome Privilege</div>
                <h3 class="privilege-title">Enjoy 10% Off Your First Atelier Order</h3>
                <div>
                  <span class="coupon-code">KRAFTFIRST</span>
                </div>
                <p class="privilege-sub">Enter code during checkout on preserved keepsake blocks, ocean serving boards, or optical resin formulations.</p>
              </div>

              <!-- Atelier Standards -->
              <div class="card-box">
                <div class="card-title">The Vistāra Atelier Guarantee</div>
                <div class="feature-item">
                  <strong>Museum-Grade Preservation:</strong> Custom 5-stage silica dehydration ensuring vibrant petals and crystal-clear 50mm resin casting without yellowing.
                </div>
                <div class="feature-item">
                  <strong>Authoritative Live Tracking:</strong> Transparent production timelines tracking silica curing, casting, diamond-edge polishing, and dispatch.
                </div>
                <div class="feature-item">
                  <strong>Air Express Pan-India:</strong> Solvent-safe, multi-layered shockproof packaging with guaranteed BlueDart air transit and 18% GST tax invoices.
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
              <div class="footer-trust">
                ✦ 100% Verified Atelier • BlueDart Air Logistics • 18% GST ITC Invoicing
              </div>
              <p class="footer-text">
                <strong>Vistāra Krafts Studio</strong> • Guwahati Atelier, Assam 781001, India
              </p>
              <p class="footer-text">
                Concierge inquiries &amp; custom varmala bookings: 
                <a href="mailto:support@vistarakrafts.com" class="footer-link">support@vistarakrafts.com</a>
              </p>
              <p class="footer-text" style="margin-top: 14px; font-size: 11px;">
                You received this verification because an account was registered on <a href="${siteUrl}" class="footer-link">${siteUrl.replace(/^https?:\/\//, '')}</a>.
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

At our studio in Guwahati, Assam, we dedicate ourselves to the art of bespoke botanical preservation and precision optical resin chemistry. Whether you are preserving sacred wedding varmalas into diamond-polished keepsake blocks or crafting heirloom resin masterpieces with our 3:1 and 2:1 crystal formulations, each batch is engineered for timeless permanence.

PATRON WELCOME PRIVILEGE:
Use promo code: KRAFTFIRST
Enjoy 10% off your first handcrafted keepsake, ocean serving board, or optical resin formulation during checkout.

THE VISTĀRA ATELIER GUARANTEE:
• Museum-Grade Preservation: Custom 5-stage silica dehydration ensuring vibrant petals and crystal-clear 50mm resin casting without yellowing.
• Authoritative Live Tracking: Transparent production timelines tracking silica curing, casting, diamond-edge polishing, and dispatch.
• Air Express Pan-India: Solvent-safe, multi-layered shockproof packaging with guaranteed BlueDart air transit and 18% GST tax invoices.

EXPLORE THE STORE:
Visit our storefront to discover our collections:
${catalogUrl}

==================================================
Vistāra Krafts Studio • Guwahati Atelier, Assam 781001, India
Support Concierge: support@vistarakrafts.com
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
        from: this.getSenderAddress(CONFIG.RESEND_FROM_EMAIL || 'Vistāra Krafts <welcome@vistarakrafts.com>'),
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
        from: this.getSenderAddress(CONFIG.RESEND_OTP_FROM_EMAIL || 'Vistāra Krafts <team@vistarakrafts.com>'),
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
