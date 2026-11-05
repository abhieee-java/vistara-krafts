# ADR 0012: Binary Choice Cookie & Tracker Consent Model

## Status
Accepted (November 6, 2026)

## Context
Vistāra Krafts is a luxury epoxy resin and keepsake art atelier operating in India under the Digital Personal Data Protection (DPDP) Act 2023, while serving international patrons. The storefront utilizes:
1. Google Analytics 4 (`G-QVM9JT6BW3`) for measuring e-commerce funnels.
2. Meta Pixel (`1183595563273188`) for Facebook and Instagram conversion optimization.
3. Microsoft Clarity (`z6d831rvdh`) for session heatmaps and UX friction audits.
4. Essential functional cookies / local storage for Cart, Wishlist, Supabase Auth tokens, and payment processing.

Previously, a single acknowledgement button ("Got it") was presented. To achieve complete regulatory compliance, patron trust, and adherence to Apple-grade transparency, a clear binary choice ("Accept All" vs. "Essential Only") was requested.

## Decision
We implement a **Binary Choice Cookie Consent Architecture**:
1. **[Accept All] (Primary Navy Pill):**
   - Grants consent for Google Analytics 4, Meta Pixel, and Microsoft Clarity.
   - Sets Google Consent Mode v2 to `granted`.
   - Signals `fbq('consent', 'grant')` and `clarity('consent', true)`.
2. **[Essential Only] (Subtle Outline / Ghost Button):**
   - Restricts operations strictly to necessary services: Cart, Wishlist, Supabase Auth, and Razorpay Order Processing.
   - Sets `window['ga-disable-G-QVM9JT6BW3'] = true` and Google Consent Mode v2 to `denied`.
   - Signals `fbq('consent', 'revoke')` and `clarity('consent', false)`.
   - In `analytics.js`, suppresses all e-commerce event dispatches.
3. **[Privacy Policy] Link:**
   - Navigates patrons to `./privacy.html` for full itemized legal disclosures.
4. **Copy Standard:**
   - *"We use cookies to personalize your atelier experience and analyze traffic. You can choose to accept all or keep only essential cookies."*

## Consequences
- **Positive:** Full compliance with DPDP Act 2023, GDPR, and ePrivacy standards without disrupting conversion rates.
- **Positive:** Patrons have explicit control over telemetry without sacrificing cart or checkout functionality.
- **Positive:** Zero console errors or runtime crashes when essential mode or ad blockers are active.
- **Backward Compatibility:** All existing tests and legacy methods (`acceptDpdpBanner`) continue to function cleanly.
