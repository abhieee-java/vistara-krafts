# VISTĀRA KRAFTS — COOKIE & PRIVACY BAR SPECIFICATION

**Document Version:** 1.0.0  
**Effective Date:** November 6, 2026  
**Architect & Lead Engineer:** Abhijit  
**Production Domain:** [https://www.vistarakrafts.com](https://www.vistarakrafts.com)  

---

## 1. EXECUTIVE SUMMARY & DESIGN PHILOSOPHY

Previously, first-time visitors were presented with an aggressive, legalistic DPDP Act compliance banner featuring a gavel icon, statutory references, and multiple configuration buttons. While legally sound, this disrupted user onboarding and introduced visual friction uncharacteristic of a luxury bridal preservation and curated resin art atelier.

### Core Architecture Transformation
The privacy architecture was restructured into a **three-tier professional standard**:
1. **Tier 1 (Storefront Entrance):** A single, subtle, floating **Cookie & Privacy Bar** that informs customers with Apple-grade restraint and a single "Got it" acknowledgement.
2. **Tier 2 (Comprehensive Statutory Notice):** Permanent, easily accessible links in the site footer leading to `privacy.html`, which houses complete Section 5/6 disclosures under the Digital Personal Data Protection (DPDP) Act 2023, Data Fiduciary identity, and Grievance Officer contact.
3. **Tier 3 (Transactional Checkout Consent):** A concise, non-distracting checkbox directly above the primary order placement action.

---

## 2. COMPONENT SPECIFICATION: COOKIE & PRIVACY BAR

### 2.1 Visual & Responsive Architecture
- **HTML Container:** `<aside id="dpdp-consent-banner" role="region" aria-label="Cookie and Privacy Notice">`
- **Surface Styling:** Frosted alabaster glassmorphism (`bg-white/95 backdrop-blur-md`), 1px subtle sand border (`border-[#e4e0d8]`), 16px corner radius (`rounded-2xl`), and gentle elevation shadow (`shadow-lg`).
- **Desktop Positioning:** `fixed bottom-4 inset-x-6 max-w-2xl mx-auto z-40`. Centered at viewport bottom with generous negative space.
- **Mobile Positioning (Thumb-Zone Priority):** `fixed bottom-20 inset-x-3 z-40`. Docked cleanly above the mobile bottom tab navigation bar (`h-16`) to guarantee zero element overlap and uninterrupted navigation.
- **Iconography:** Subtle `cookie` icon in secondary brand accent (`#c59b27`), replacing the earlier gavel symbol.

### 2.2 Editorial Copy
> *"We use cookies and similar technologies to improve your experience. By browsing our site, you agree to our [Privacy Policy](./privacy.html)."*

### 2.3 Interactive Micro-Interaction
- **Primary CTA Button:** `<button type="button" onclick="window.acceptDpdpBanner()">Got it</button>`
- **Button Styling:** Solid brand navy pill (`bg-primary text-white`), min-height 36px, spring press compression (`active:scale-95`).
- **State Persistence:**
  - Persists consent state in `localStorage` under `vk_dpdp_consent`.
  - Hides the banner immediately (`classList.add('hidden')`).
  - Displays a brief, refined confirmation toast: *"Preferences Saved — Your privacy preferences have been updated."*
  - Subsequent visits detect the saved consent and remain 100% clean without re-displaying the bar.

```html
<!-- Single Subtle Cookie & Privacy Bar Markup -->
<aside id="dpdp-consent-banner" role="region" aria-label="Cookie and Privacy Notice" class="fixed bottom-20 lg:bottom-4 inset-x-3 sm:inset-x-6 max-w-2xl mx-auto z-40 bg-white/95 backdrop-blur-md text-primary rounded-2xl border border-[#e4e0d8] shadow-lg p-3 sm:py-2.5 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all duration-300 hidden">
  <div class="flex items-center gap-2.5 min-w-0">
    <span class="material-symbols-outlined text-secondary text-lg shrink-0" aria-hidden="true">cookie</span>
    <p class="text-xs text-on-surface-variant leading-snug">
      We use cookies and similar technologies to improve your experience. By browsing our site, you agree to our <a href="./privacy.html" class="text-primary font-semibold underline hover:text-secondary transition-colors">Privacy Policy</a>.
    </p>
  </div>
  <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
    <button type="button" onclick="window.acceptDpdpBanner()" class="min-h-[36px] px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-semibold cursor-pointer shadow-2xs active:scale-95 transition-all">
      Got it
    </button>
  </div>
</aside>
```

---

## 3. TIER 2: STATUTORY PRIVACY POLICY (FOOTER INTEGRATION)

All comprehensive Indian regulatory and statutory declarations reside authoritatively in `privacy.html`, linked permanently in both the primary footer navigation and copyright sub-bar:

- **Data Fiduciary Identity:** Vistāra Krafts Studio (@resin.art.memories).
- **Data Protection & Grievance Officer:** Abhijit Kalita (`grievance@vistarakrafts.com` / `ad4064773@gmail.com`).
- **Statutory Notice:** Compliant with Section 5 of the Digital Personal Data Protection Act, 2023.
- **Data Retention & Purpose Limitation:** Customer contact and delivery addresses are utilized strictly for BlueDart insured transit, GST tax invoicing, and artisan batch provenance.
- **Statutory Rights:** Right to access, right to correction, right to erasure, and right of grievance redressal with a guaranteed 7-day resolution SLA.

---

## 4. TIER 3: STREAMLINED CHECKOUT CONSENT

In accordance with conversion psychology and UX best practices, the checkout modal checkbox was revised to eliminate bulky legalistic prefixes while preserving full statutory consent for logistics processing:

```html
<!-- Streamlined Checkout Modal Consent Line -->
<div class="shrink-0 py-1.5 px-2.5 rounded-lg bg-surface-container-low border border-[#e4e0d8] flex items-center gap-2">
  <input id="chk-dpdp-consent" type="checkbox" checked required class="w-3.5 h-3.5 accent-primary cursor-pointer shrink-0" aria-label="Consent to processing contact and address for delivery">
  <label for="chk-dpdp-consent" class="text-[9.5px] text-on-surface-variant font-medium leading-tight cursor-pointer">
    I consent to processing contact &amp; address for BlueDart delivery &amp; GST invoicing.
  </label>
</div>
```

---

## 5. AD TRACKING & ANALYTICS INTERACTION

The Cookie & Privacy Bar operates in complete synergy with the storefront's ad tracking engine (`analytics.js`):
1. **Google Analytics 4 (GA4):** Measurement ID `G-QVM9JT6BW3`.
2. **Meta Pixel (Facebook/Instagram Ads):** Pixel ID `1183595563273188`.
3. **Telemetry Triggers:**
   - SPA route transitions trigger `page_view` / `PageView`.
   - PDP navigation triggers `view_item` / `ViewContent`.
   - Adding products triggers `add_to_cart` / `AddToCart`.
   - Opening checkout modal triggers `begin_checkout` / `InitiateCheckout`.
   - Payment capture triggers `purchase` / `Purchase` with transaction ID, tax, shipping, and deduplication.
4. **Ad-Blocker Resilience:** All analytics operations are defensively wrapped in `try/catch`. If a customer runs uBlock Origin or Brave Shields, the Cookie Bar and checkout operate flawlessly with zero exceptions.

---

## 6. VERIFICATION EVIDENCE

| Verification Gate | Result | Evidence / Details |
| :--- | :---: | :--- |
| **Live Cookie Bar HTTP Verification** | **PASSED** | Live at `https://www.vistarakrafts.com/` (HTTP 200). Contains `"We use cookies and similar technologies..."`. |
| **Gavel Banner Removal** | **PASSED** | Confirmed zero instances of old legalistic banner on live site. |
| **Checkout Consent Line** | **PASSED** | Live at `https://www.vistarakrafts.com/` (`"I consent to processing contact & address for BlueDart delivery & GST invoicing."`). |
| **Automated Analytics Test Suite** | **PASSED (8/8)** | Verified via `node test/analytics-ecommerce-events.test.mjs`. |
| **Vite Bundle Compilation** | **PASSED** | Clean bundle output with zero parser errors; `dist/analytics.js` verified. |
