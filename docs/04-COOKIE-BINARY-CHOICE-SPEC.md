# VISTĀRA KRAFTS — BINARY COOKIE & PRIVACY CONSENT ARCHITECTURE

**Document Version:** 2.0.0  
**Effective Date:** November 6, 2026  
**Architect:** Human Chief Architect / CTO & Chief AI Engineering Coordinator  
**Production Domain:** [https://www.vistarakrafts.com](https://www.vistarakrafts.com)  

---

## 1. EXECUTIVE SUMMARY & OBJECTIVE

In accordance with global privacy best practices, the Digital Personal Data Protection (DPDP) Act 2023, and high-conversion e-commerce UX standards, Vistāra Krafts implements an explicit **Binary Choice Cookie Consent Architecture**:

- **Binary Choice Modal / Bar:**
  - **Option 1: [Accept All]** (Primary navy pill) — Enables Google Analytics 4 (GA4), Microsoft Clarity, and Meta Pixel (Facebook & Instagram Ads).
  - **Option 2: [Essential Only]** (Subtle outline / ghost button) — Strictly disables all advertising and analytics trackers while guaranteeing uninterrupted operation of essential e-commerce services (Cart, Wishlist, Supabase Auth, and Razorpay Order Processing).
  - **[Privacy Policy] Link:** Authoritative direct navigation to comprehensive statutory disclosures in `privacy.html`.

### Authoritative UX Copy
> *"We use cookies to personalize your atelier experience and analyze traffic. You can choose to accept all or keep only essential cookies. [Privacy Policy]"*

---

## 2. SYSTEM ARCHITECTURE & TRACKER GATING

```
                                 [First-Time Visitor]
                                           │
                                           ▼
                     ┌──────────────────────────────────────────┐
                     │   Cookie & Privacy Bar Displayed         │
                     │   (#dpdp-consent-banner, frosted-glass)  │
                     └─────────────────────┬────────────────────┘
                                           │
                      ┌────────────────────┴────────────────────┐
                      ▼                                         ▼
            [Accept All]                             [Essential Only]
         (Primary Navy Pill)                     (Subtle Outline Button)
                  │                                         │
                  ▼                                         ▼
  ┌───────────────────────────────┐         ┌───────────────────────────────┐
  │ - localStorage: choice='all'  │         │ - localStorage: 'essential'   │
  │ - GA4: Consent Granted        │         │ - GA4: ga-disable=true        │
  │ - Meta Pixel: fbq('grant')    │         │ - GA4: consent denied         │
  │ - Clarity: clarity(true)      │         │ - Meta Pixel: fbq('revoke')   │
  │ - VistaraAnalytics Active     │         │ - Clarity: clarity(false)     │
  └───────────────┬───────────────┘         │ - VistaraAnalytics Gated      │
                  │                         └───────────────┬───────────────┘
                  │                                         │
                  └─────────────────┬───────────────────────┘
                                    │
                                    ▼
                 ┌─────────────────────────────────────┐
                 │  Essential Atelier Services Active: │
                 │  - Local Cart & Volume Discounts    │
                 │  - Customer Wishlist                │
                 │  - Supabase Auth & JWT Sessions     │
                 │  - Razorpay Order Checkout          │
                 └─────────────────────────────────────┘
```

---

## 3. TECHNICAL SPECIFICATIONS PER TRACKER

### 3.1 Google Analytics 4 (GA4 — ID: `G-QVM9JT6BW3`)
- **Google Consent Mode v2:** Default mode set early in `<head>`:
  ```javascript
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied'
  });
  ```
- **When [Accept All] is clicked:**
  - `window['ga-disable-G-QVM9JT6BW3'] = false;`
  - `gtag('consent', 'update', { 'analytics_storage': 'granted', 'ad_storage': 'granted', 'ad_user_data': 'granted', 'ad_personalization': 'granted' });`
- **When [Essential Only] is clicked:**
  - `window['ga-disable-G-QVM9JT6BW3'] = true;`
  - `gtag('consent', 'update', { 'analytics_storage': 'denied', 'ad_storage': 'denied', 'ad_user_data': 'denied', 'ad_personalization': 'denied' });`

### 3.2 Meta Pixel (ID: `1183595563273188`)
- **When [Accept All] is clicked:**
  - `fbq('consent', 'grant');`
  - Standard funnel events (`PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`) dispatched.
- **When [Essential Only] is clicked:**
  - `fbq('consent', 'revoke');`
  - All subsequent tracking calls strictly suppressed inside `VistaraAnalytics`.

### 3.3 Microsoft Clarity (Tag: `z6d831rvdh`)
- **When [Accept All] is clicked:**
  - `if (typeof window.clarity === 'function') window.clarity('consent', true);`
- **When [Essential Only] is clicked:**
  - `if (typeof window.clarity === 'function') window.clarity('consent', false);`

---

## 4. ESSENTIAL SERVICES PRESERVATION GUARANTEE

Regardless of whether the customer chooses `[Accept All]` or `[Essential Only]`, the following essential features remain 100% operational:
1. **Studio Bag / Cart:** `Store.getCart()`, volume tier discount calculations, studio coupon codes (`STUDIO10`, `RESINART5`).
2. **Keepsake Wishlist:** `Store.getWishlist()`, cross-device syncing.
3. **Supabase Authentication:** Patron signup, password login, Google/Apple OAuth account chooser, Resend OTP email verification, and session persistence.
4. **Order Processing & Razorpay Gateway:** Order creation, server-authoritative amount validation, signature verification, and delivery invoice generation.
5. **Local State Machine:** PIN code verification, pour calculator, and client-side moderation filters.

---

## 5. UI/UX DESIGN SPECIFICATION ("APPLE, ELEVATED")

### 5.1 Banner Surface & Layout
- **Container Element:** `<aside id="dpdp-consent-banner" role="region" aria-label="Cookie and Privacy Choice">`
- **Desktop Positioning:** `fixed bottom-4 inset-x-6 max-w-2xl mx-auto z-40`
- **Mobile Positioning (Thumb-Zone Priority):** `fixed bottom-20 inset-x-3 z-40` (Docked cleanly above the 64px mobile navigation bar with zero element collision).
- **Styling:**
  - Surface: `bg-white/95 backdrop-blur-md text-primary rounded-2xl border border-[#e4e0d8] shadow-lg p-3.5 sm:py-3 sm:px-4.5`
  - Icon: `material-symbols-outlined text-secondary text-xl shrink-0 mt-0.5`
  - Text: `text-xs text-on-surface-variant leading-relaxed`

### 5.2 Micro-Interactions & Buttons
- **[Essential Only] Button:**
  - Classes: `min-h-[36px] px-3.5 py-1.5 rounded-xl border border-primary/25 hover:border-primary text-primary hover:bg-primary/5 text-xs font-semibold cursor-pointer active:scale-95 transition-all`
  - Handler: `window.acceptEssentialCookies()`
- **[Accept All] Button:**
  - Classes: `min-h-[36px] px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-semibold cursor-pointer shadow-2xs active:scale-95 transition-all`
  - Handler: `window.acceptAllCookies()`
- **Feedback Toasts:**
  - Accept All: *"Preferences Saved — All cookies accepted. Full atelier experience and analytics enabled."*
  - Essential Only: *"Essential Cookies Only — Advertising & analytics disabled. Cart, wishlist & auth remain active."*

---

## 6. STORAGE SCHEMA

Consent choices are persisted in `localStorage`:
```json
{
  "accepted": true,
  "choice": "all", // or "essential"
  "date": "2026-11-06T01:50:00.000Z",
  "categories": {
    "orderFulfillment": true,
    "analyticsSession": true, // false for "essential"
    "marketingPromos": true   // false for "essential"
  },
  "age18PlusVerified": true,
  "language": "en"
}
```
Mirrored to:
- `ram_vk_dpdp_consent_v1` (Storefront state machine)
- `vk_cookie_consent` (Cookie consent engine)
- `vk_dpdp_consent` (Legacy verification backwards-compatibility)
