# Mobile Cart Spacing Architecture & Footer Overlap Elimination

**Project:** Vistāra Krafts — Handcrafted Resin Art & Keepsakes  
**Component:** Shopping Bag (`#/cart`), Mobile Sticky Checkout Bar & Global Editorial Footer  
**Target:** Elimination of Dead White Space, Zero Overlap on Footer Elements & Enhanced Cart Micro-Typography  
**Date:** November 6, 2026  
**Status:** Approved & Verified (All 12 Test Suites Passing, Live Chrome DevTools MCP Verified)  

---

## 1. Executive Summary & Defect Analysis

### 1.1 The Reported Defect
Customers on mobile viewports on the `#/cart` page observed two critical UI/UX anomalies:
1. **Unnecessary 320px Blank Void:** A massive empty white gap appeared between the bottom of the `Invoice Summary` card and the top of the footer.
2. **Footer Text Overlap by Sticky Checkout Bar:** When scrolled to the bottom of the page, the fixed mobile sticky checkout bar (`"TOTAL PAYABLE ₹398 [Checkout ->]"`) floated directly over the footer content, obscuring brand descriptions, copyright notices, and statutory DPDP compliance badges.
3. **Typography & Badge Anomalies:** On narrow viewports (< 360px), the free shipping progress message truncated prematurely, and cart item line-headers displayed a dangling bullet point (`•`) when the SKU pill wrapped to a second line.

---

## 2. Root Cause & Architectural Resolution

| Area | Root Cause | Architectural Solution |
| :--- | :--- | :--- |
| **320px Blank Void** | Compound bottom padding: `.cart-scroll-content` had `padding-bottom: 13rem` (208px), and `<main id="app-view-root">` had `pb-28` (112px) before the footer began. | Reduced `.cart-scroll-content` padding to a clean `1.5rem` (24px). Set `body.route-cart main#app-view-root` to `padding-bottom: 0 !important;` on mobile. The gap between the Invoice card and the footer is now an exact, elegant **24px**. |
| **Footer Overlap** | Fixed bottom elements (Sticky bar 83px + Bottom Nav 64px = 148px) exceeded the footer's default mobile padding (`pb-32` = 128px) by 20px–30px. | Styled `body.route-cart footer` with `padding-bottom: calc(12rem + env(safe-area-inset-bottom, 0px)) !important;` (192px). The footer's bottom content now clears the sticky checkout bar with **45.25px of clean breathing room**. |
| **Progress Strip Truncation** | `truncate` class on the free shipping banner forced single-line clipping on narrow devices. | Replaced `truncate` with `break-words leading-tight`, allowing natural, legible wrapping. |
| **Dangling Bullet** | Isolated `<span class="text-outline">•</span>` lingered at the end of the variant line when the SKU badge wrapped. | Omitted the standalone bullet; the flex container's `gap-1.5` cleanly separates items without punctuation stranding. |
| **Desktop Isolation** | Responsive design requirement to keep desktop view unchanged. | All mobile adjustments are scoped via media queries (`< 1024px`) and route scoping (`body.route-cart`). Desktop retains its standard layout, in-card checkout button, and 80px footer padding. |

---

## 3. Mathematical Spacing Architecture

```
+-----------------------------------------------------------+
|                   Cart Scrollable Content                 |
|   - Bag Items (with clean SKU wrapping)                   |
|   - Pincode Delivery Card & GST B2B Box                   |
|   - Studio Voucher Input & Chips                          |
|   - Invoice Summary Card                                  |
|   - 🔒 256-Bit Encrypted via Razorpay Payment Gateway      |
+-----------------------------------------------------------+
|   CLEAN SECTION GAP: Exactly 24.0px                       |
+-----------------------------------------------------------+
|   GLOBAL EDITORIAL FOOTER                                 |
|   - [VK] Vistāra Krafts & Studio Information              |
|   - Shop & Studio / Social & Privacy Links                |
|   - Atelier Newsletter Subscription Form                  |
|   - © 2026 Vistāra Krafts & Statutory Disclosures         |
|   - 🛡️ DPDP Act 2023 Compliant Badge                      |
|                                                           |
|   [ Clean Clearance: +45.25px Breathing Room ]            |
+-----------------------------------------------------------+
|   MOBILE STICKY CHECKOUT BAR (z-40, h ~ 83px)             |  y = Viewport - (64px + 83px)
|   - Total Payable: ₹298 (Tax Inclusive)                   |
|   - Primary CTA: [ Checkout -> ]                          |
+-----------------------------------------------------------+  y = Viewport - 64px
|   MOBILE BOTTOM NAVIGATION (z-50, h = 64px / 4rem)        |
|   - Home | Catalogue | Orders | Bag (1)                   |
+-----------------------------------------------------------+  y = Viewport
```

---

## 4. Multi-Level Testing & Verification Evidence

### 4.1 Chrome DevTools MCP Live Measurement (360px Android Viewport)
- `gapBetweenInvoiceAndFooter = 24.0px` (Reduced from 320px)
- `clearanceAboveStickyBar = 45.25px` (Zero overlap on copyright / DPDP badge)
- `hasHorizontalScroll = false` across all tested viewports (320px, 360px, 390px, 768px, 1280px)
- `desktopBtnDisplay = 'flex'`, `stickyDisplay = 'none'` on desktop (1280px)

### 4.2 Automated Test Suite Verification (`npm test`)
All 12 test suites executed and passed 100% with 0 regressions:
1. `verify-storefront.mjs` (27/27)
2. `content-moderation-security.test.mjs` (7/7)
3. `payment-security.test.mjs` (15/15)
4. `settings-sync-e2e.test.mjs` (6/6)
5. `test-announcement-delivery-sync.mjs` (4/4)
6. `auth-production-verification.test.mjs` (15/15)
7. `order-isolation-security.test.mjs` (14/14)
8. `welcome-email-resend.test.mjs` (5/5)
9. `email-verification-otp.test.mjs` (11/11)
10. `account-suspension-security.test.mjs` (3/3)
11. `analytics-ecommerce-events.test.mjs` (8/8)
12. `cookie-binary-choice.test.mjs` (5/5)
