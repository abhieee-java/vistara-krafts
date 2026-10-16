# TESTING & QUALITY ASSURANCE MANUAL — VISTĀRA KRAFTS

> **Verification Suite:** [`verify-storefront.mjs`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/verify-storefront.mjs)  
> **Total Test Suites:** 25 Suites (Over 140 Individual Assertions)  
> **Status:** 100% Passing (`25 passed, 0 failed`)  
> **Execution Runtime:** ~12–15 seconds via Node.js + Headless Chrome CDP  

---

## 1. Quality Assurance Philosophy & Guardrails

Testing in Vistāra Krafts operates on three foundational principles:
1. **Zero Flakiness:** All tests execute with deterministic mock clocks, synchronous state assertions, and reliable headless browser automation via Chrome DevTools Protocol (CDP).
2. **Real Rendering Verification:** Rather than testing virtual DOM simulations only, our suite boots a real headless Google Chrome instance to measure actual CSS computed bounding boxes, touch target heights (>= 44px), and viewport overflows at 320px.
3. **Database & Edge Emulation:** The suite includes real SQLite database assertions to ensure Cloudflare D1 SQL schema queries, foreign keys, and indexes match production expectations.

---

## 2. Comprehensive Test Suite Matrix (Suites 1 to 25)

| Suite # | Suite Name | Scope & Assertions |
| :---: | :--- | :--- |
| **1** | **Storefront Bridge Global Initialization** | Verifies `window.ResinStore` and `window.StorefrontBridge` initialize globally with all required query, cart, and auth APIs. |
| **2** | **100% Empty Initial State on Fresh Load** | Verifies zero pre-filled carts, zero wishlists, zero fake orders, disabled GST toggle, and hidden badge counts on first visit. |
| **3** | **Curated Catalog Integrity (12 Items)** | Validates 12 curated products across Resin Art Memories, Vistāra Krafts, and POTRY with valid prices, affinities, and images. |
| **4** | **Pour Calculator Math & Bounds** | Tests 3:1, 2:1, and 1:1 resin-to-hardener mathematical formulas; verifies division-by-zero protection and negative input handling. |
| **5** | **PIN Code Delivery Verifier** | Tests 6-digit Indian PIN codes; validates delivery serviceability for metro/non-metro codes and rejects invalid inputs. |
| **6** | **Animated Vector Splash Screen Modal** | Tests `#vkSplashContainer` DOM presence, CSS keyframes, auto-dismiss timeout, and dismiss button controller. |
| **7** | **DPDP Act 2023 Compliance Suite** | Validates presence of Section 6 notice, Section 9 age verification, Section 11 data export, Section 12 data erasure, and Section 13 grievance ticketing. |
| **8** | **Cart Engine, Volume Discounts & GST** | Verifies tiered discounts (3+ items: 5%, 5+ items: 10%, 10+ items: 15%), `KRAFTFIRST` coupon code application, and 18% GST (HSN 39073010) precision. |
| **9** | **Social Feed Engine** | Validates like count toggling, verified badge rendering, user comment submission, and empty comment rejection. |
| **10** | **SPA Router & Zero Owner UI Leakage** | Tests hash router navigation across all 7 customer routes; asserts 0% owner/admin mutation UI presence. |
| **11** | **Resilient Storage Proxy Fallback** | Verifies that `store-bridge.js` safely catches `SecurityError` or `QuotaExceededError` on `localStorage` and falls back to in-memory state. |
| **12** | **Interactive Pour Calculator on Custom Studio** | Validates calculator form inputs on `#/custom-studio` and `#/home`, checking dimensional changes update weight estimates in real-time. |
| **13** | **Volume Tier Pricing Parity Across Varieties** | Verifies line-item discount display parity across all size/shape variations in the cart. |
| **14** | **Syntax, Balanced Tags & Placeholder Audit** | Scans HTML/JS files for unclosed tags, syntax errors, raw `lorem ipsum` stubs, or broken asset paths. |
| **15** | **Visual QA & Accessibility (WCAG 2.2 AA)** | Verifies 2-font limit (Playfair Display + Inter), contrast ratios >= 4.5:1, and 44px minimum target sizes. |
| **16** | **Customer E-Commerce Domain Features** | Verifies order tracking stages (Stage 1 to 6), custom mockup layout approval, and GST tax invoice generation. |
| **17** | **Mobile Viewport Zero-Overflow Audit** | Verifies layout geometry at 320px, 375px, 414px, and 768px, ensuring no horizontal scrollbars occur. |
| **18** | **2-Step Auth, 1-Click OAuth & Wishlist Merge** | Tests guest checkout flow: guest adds items -> prompted for Step 1 auth -> guest wishlist automatically merges -> advances to Step 2 shipping address. |
| **19** | **SEO, GEO & AEO Production Readiness** | Audits `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, and Schema.org JSON-LD `@graph`. |
| **20** | **Awwwards SOTD Interactions** | Validates dynamic cursor follower, 3D card tilt, specimen loupe inspection, and before/after floral slider. |
| **21** | **QA Audit & Accessible Navigation** | Verifies subpage back navigation (`←`), custom 404 route handling, and empty state CTA actions. |
| **22** | **Cloudflare Pages Function & SQLite/D1 Emulation** | Simulates edge environment: executes SQL queries against SQLite, tests password hashing (PBKDF2), and tests JWT creation. |
| **23** | **Real Headless Chrome E2E Multi-Viewport Audit** | Launches headless Chrome at 320px, 375px, and 1280px; measures physical bounding rects of modal buttons and inputs (`h >= 44px`, `right <= 320px`). |
| **24** | **Resilience, Offline Banner & 500 Page** | Tests offline state banner visibility on window offline event, and verifies `500.html` and `404.html` integrity. |
| **25** | **Persona Preference, Feed Curation & Varieties** | Validates persona selection (`masculine`, `feminine`, `all`), ensures no "Universal" button exists, verifies feed re-sorting, and tests color/shape swatches. |

---

## 3. How to Execute Tests Locally

### Quick Run
```bash
npm test
# Or directly:
node verify-storefront.mjs
```

### Expected Output
```text
========================================
Verification Summary: 25 passed, 0 failed
========================================
```

---

## 4. Headless Chrome CDP Invariant Rules (Suite 23)

Suite 23 boots Google Chrome via CDP (`--headless=new`, `--window-size=1280,800`) and evaluates live elements:

```javascript
// Test Invariant: Minimum 44px height for touch accessibility
for (const item of [...modalRects320.authBtns, ...modalRects320.barBtns]) {
  assert.ok(item.h >= 44, `Control "${item.id}" must have height >= 44px (got ${item.h}px)`);
  assert.ok(item.right <= 320, `Control "${item.id}" must not overflow 320px (right=${item.right}px)`);
}
```

If you modify any button or input inside `#cloudflare-auth-modal`, `#checkout-modal`, or `#account-bar-modal`, you **must** ensure it maintains `min-height: 44px` and does not expand beyond `320px` width on small mobile screens.
