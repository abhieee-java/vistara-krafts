# VISTĀRA KRAFTS — AUTH MODAL MOBILE OPTIMIZATION & COPY SIMPLIFICATION SPECIFICATION

**Document Version:** 1.0.0  
**Date:** November 6, 2026  
**Status:** APPROVED & VERIFIED  
**Author:** Chief AI Engineering Coordinator  
**Target:** Vistāra Krafts Storefront (`stitch_potry_e_commerce_storefront`)

---

## 1. Executive Summary & Objective

This release delivers three key improvements aligned with the "Apple, Elevated" engineering standard and human-centric design:
1. **Removal of the Mobile Glowing Orb:** Removed the non-functional decorative orb above "Welcome Back!" on mobile in `#cloudflare-auth-modal` so customers reach authentication credentials immediately without vertical scroll friction.
2. **Compact Desktop Showcase Orb:** Preserved the atmospheric glowing orb inside the desktop showcase stage while scaling it down to harmonious, balanced dimensions (`w-24 h-24`).
3. **Comprehensive Copy Simplification:** Audited customer-facing text across the storefront, eliminating technical and archaic jargon (e.g., "atelier", "bespoke", "patron", "specimen", "optical curing calibration") and replacing them with clear, warm, conversational English.
4. **Invariant Storefront-Admin Panel Synchronization:** Fully preserved all shared contracts, postMessage bridges, Supabase realtime channels, announcement bar sync, order isolation, and settings storage keys.

---

## 2. Technical Modifications

### A. Auth Modal (`index.html`)
- **Mobile Viewport (`< 768px`):**
  - Deleted the decorative mobile container `<div class="md:hidden flex items-center justify-center my-3 relative">...</div>` located directly above `<h3 id="cloudflare-auth-modal-title">Welcome Back!</h3>`.
  - The modal header now leads directly with the logo, title, and descriptive subtitle, placing input fields within the immediate mobile thumb zone.
- **Desktop Viewport (`>= 768px`):**
  - Resized the right-hand showcase stage orb container from `w-36 h-36 mb-5` to `w-24 h-24 mb-3`, inner ring from `w-32 h-32` to `w-20 h-20`, and central sphere from `w-24 h-24` to `w-16 h-16`.
  - Scaled showcase vertical padding from `py-6` to `py-4`, achieving balanced visual harmony alongside the sign-in form.

### B. User-Facing Copy Simplification
| Area | Before (Archaic / Jargon) | After (Plain, Conversational English) |
| :--- | :--- | :--- |
| **Auth Subtitle (Sign In)** | *"Access your bespoke reservations, specimen orders, and personalized atelier feed."* | *"Sign in to view your orders, saved items, and personalized picks."* |
| **Auth Subtitle (Sign Up)** | *"Join the Vistāra Krafts atelier to preserve personal flora, curate bespoke commissions, and access patron privileges."* | *"Join Vistara Krafts to save favorites, track orders, and get custom picks."* |
| **Auth Name Validation** | *"Please enter your complete patron name."* | *"Please enter your full name."* |
| **Curation Selection** | *"Masculine Aesthetic: Modern resin desk specimen, geometric resin clocks, obsidian obsidian deskware"* / *"Feminine Aesthetic: Preservation flora, botanic bridal specimens, keepsake resin jewelry"* | *"For Men • Custom resin clocks, desk decor & geometric art"* / *"For Women • Wedding flower preservation, jewelry & floral art"* |
| **Curation Helper** | *"Your atelier curator adapts selections dynamically. You may change affinity anytime in the catalog."* | *"You can change your preferences anytime in the catalog."* |
| **Hero & PDP Resin Description** | *"Bubble-free ASTM D-4236 optical polymer curing with active HALS UV stabilization"* | *"Bubble-free, crystal-clear resin with UV protection to prevent yellowing over time"* |
| **System Error State** | *"Temporary Atelier System Calibration: The atelier connection is recalibrating. Your bespoke cart state is safely preserved."* | *"Temporary Connection Issue: We're having trouble connecting to the server. Your cart and items are completely safe. Please check your connection or refresh the page."* |
| **User Profile Toast** | *"Patron Profile Saved"* | *"Profile Saved!"* |
| **Footer & Nav Links** | *"Atelier Notes"* / *"Atelier Wishlist"* | *"Studio Updates"* / *"Wishlist"* |

*Note: The Cookie Consent text required by statutory compliance tests was strictly preserved as mandated.*

### C. Admin Panel Synchronization Invariants Preserved
- **PostMessage Listeners:** `RAM_STUDIO_BRIDGE`, `RAM_ADMIN_HOST`, and `PARENT_FRAME` communication channels remain 100% untouched.
- **Supabase Realtime Sync:** `public:store_published_version:realtime` channel and event broadcasting remain fully operational.
- **Settings & Announcement Keys:** `ram_vk_settings_v2`, `vk_settings_v1`, `#top-announcement-bar`, `#announcement-text`, and `.js-announcement-headline` DOM selectors remain intact.
- **Order Isolation & Payment:** Authorization headers, Supabase RLS security, and Razorpay HMAC-SHA256 signature verifications remain active.

---

## 3. Verification & Evidence

### A. Automated Test Suite (100% Pass)
Command: `npm test`
- **Storefront Comprehensive Suite:** 27 / 27 PASS
- **Content Moderation & Security Shield:** 7 / 7 PASS
- **Payment Security & Price Integrity:** 15 / 15 PASS
- **Settings Sync E2E:** 6 / 6 PASS
- **Announcement Delivery Sync:** 4 / 4 PASS
- **Supabase Auth & Session Production:** 15 / 15 PASS
- **Order Isolation & Tenant Security:** 14 / 14 PASS
- **Welcome Email via Resend:** 5 / 5 PASS
- **Email OTP Verification:** 11 / 11 PASS
- **Account Suspension Security:** 3 / 3 PASS
- **E-Commerce Analytics & Conversion Pixels:** 8 / 8 PASS
- **Binary Cookie & Privacy Choice Suite:** 5 / 5 PASS
**Total:** 110 tests across 12 suites, 0 failures.

### B. Visual Layout Inspection (Chrome DevTools MCP)
- **Mobile (390 x 844):** Verified via `evaluate_script` and `take_screenshot`. Zero glowing orb above "Welcome Back!". Top bar is followed directly by title, description, and form.
- **Desktop (1280 x 800):** Verified via `resize_page` and `take_screenshot`. Compact `w-24 h-24` glowing orb neatly centered in the navy showcase column.

---

## 4. Release Status
Ready for deployment and Git synchronization.
