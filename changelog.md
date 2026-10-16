# CHANGELOG — VISTĀRA KRAFTS

All notable changes to the **Vistāra Krafts** (`@resin.art.memories`) e-commerce storefront are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-15

### Added
- **Two-Part Authentication & Curation Flow:** Split customer login into two distinct, unhurried stages:
  - **Part 1 (`#cf-auth-step-credentials`):** Pure credentials input (Email & Password, 1-Click Google Account Chooser, or Apple ID).
  - **Part 2 (`#cf-auth-step-curation`):** Post-login feed personalization modal presenting strictly `👔 Male` and `🌸 Female` curation cards.
- **Desktop (PC) Two-Stage Layout:** Re-architected `#cloudflare-auth-modal` on desktop viewports:
  - **Left Side (`order-1`, `md:w-7/12`):** Primary authentication and curation forms on warm alabaster.
  - **Right Side (`order-2`, `.auth-desktop-showcase`, `md:w-5/12`):** Interactive **Vistāra Krafts 3D Liquid Resin Animation Showcase** with 140px specimen sphere, concentric rotating brass orbital rings, studio crest, and value badges.
- **Dedicated Responsive Display Rules:** Added `.auth-desktop-showcase` in `styles.css` with `@media (min-width: 768px) { display: flex !important; }` to overcome `.hidden { display: none !important; }` specificity collisions.
- **Curation Handlers:** Added `window.showAuthStep`, `window.selectPersonaAndFinish`, and `window.skipPersonaAndFinish` to `app.js`.

### Changed
- **Persona Curation Position:** Removed the male/female selector block from inside the initial login credentials form.
- **Clean Dismissal:** When closing Part 2 without choosing, the app defaults silently to universal curation (`all`) without exposing the word "Universal" anywhere in the UI.

### Verified
- Executed `node verify-storefront.mjs`: All 25 test suites passed cleanly (`25 passed, 0 failed`).
- **Commit:** `e8882f5`

---

## [0.9.5] - 2026-10-15

### Added
- **60/30/10 Warm Gallery Brand Palette Harmonization:** Completely overhauled `#cloudflare-auth-modal` colors to match Vistāra Krafts' atelier theme:
  - Canvas & Cards (60%): `#ffffff` and `#faf8f5` framed with `#e4e0d8` hairline stone borders.
  - Authority (30%): Deep naval sapphire (`#031a38`) for buttons, active tabs, and primary headings.
  - Artisan Accents (10%): Warm antique brass (`#b08d57`) and gold flecks (`#ffd79b`) illuminating orbital rings.

### Fixed
- Replaced dark obsidian sci-fi styling (`#080e1b`, `#121c2e`) with warm alabaster, eliminating the palette clash reported by the user.

### Verified
- Captured high-resolution Chrome verification screenshots (`auth-modal-mobile-matched.png` and `auth-modal-desktop-matched.png`).
- **Commit:** `6be8255`

---

## [0.9.0] - 2026-10-15

### Added
- **Mobile-First Layout Replication:** Replicated user's reference layout (`media_1792059901850_8595c2a5.png`):
  - Top action bar with circular back button (`←`), centered studio crest, and close button (`✕`).
  - Centered floating 3D Liquid Resin Specimen Sphere with amber core and rotating orbital rings.
  - Serif headline "Welcome Back!" and friendly subtext.
  - 1-Click Google and Apple button row with official SVGs.
- **Framer Motion Spring Physics:** Calibrated transitions to `cubic-bezier(0.16, 1, 0.3, 1)` and `translateY` spring physics.

### Verified
- Automated test run passed cleanly across 320px, 375px, and 1280px viewports.
- **Commit:** `0061473`

---

## [0.8.5] - 2026-10-14

### Changed
- **Simplified Copy:** Replaced technical jargon with simple, warm words throughout the authentication flow.
- **Unstacked Layout:** Eliminated vertical crowding on mobile screens by organizing form inputs into distinct logical sections.
- **OAuth Chooser:** Implemented interactive Google and Apple 1-click account chooser sheet (`#cf-oauth-chooser-sheet`).

### Verified
- **Commit:** `eda5c05`

---

## [0.8.0] - 2026-10-14

### Added
- **Strict Gender Personalization:** Replaced generic curation pills with strictly `👔 Male` and `🌸 Female` options.
- **WCAG 2.2 AA Touch Targets:** Guaranteed minimum 44px height across every visible interactive element on mobile and desktop.

### Verified
- **Commit:** `db091cd`

---

## [0.7.5] - 2026-10-14

### Removed
- **Universal Option Button:** Completely eliminated the "Universal" button option from the login modal and feed curation bar.
- Removed verbose paragraph explainer banner from the authentication dialog.

### Changed
- Moved the feed curation explainer exclusively to the home feed header.
- Implemented silent fallback: choosing neither male nor female leaves the customer in balanced universal curation without labeling it as such.

### Verified
- **Commit:** `91cb408`

---

## [0.7.0] - 2026-10-13

### Added
- **Automated Verification Test Suite (`verify-storefront.mjs`):** Built standalone 25-suite verification framework covering:
  - Core Storefront Bridge initialization and empty initial state.
  - 12-item curated product catalog parity.
  - 3:1, 2:1, and 1:1 Resin Pour Calculator mathematical accuracy.
  - 6-digit Indian PIN code validation.
  - DPDP Act 2023 compliance suites (Sections 6, 9, 11, 12, 13).
  - Volume tier discounts and GST calculations.
  - Real SQLite/D1 database foreign key integrity and Edge API emulation.
  - Headless Chrome CDP tests for 44px targets and 320px zero-overflow.

### Verified
- All 25 suites passed cleanly (`25 passed, 0 failed`).
- **Commit:** `6f69d06`

---

## [0.6.0] - 2026-10-12

### Added
- **Offline Atelier Banner (`#offline-atelier-banner`):** Real-time online/offline event listener providing graceful degradation when user network drops.
- **Custom 500 Error Page (`500.html`) and 404 Page (`404.html`):** Styled in Vistāra Krafts warm alabaster theme.
- **Awwwards SOTD Interactions:** Dynamic custom cursor, 3D tilt, loupe inspection, and before/after slider for varmala blocks.

### Verified
- **Commit:** `3e2c8a9`

---

## [0.5.0] - 2026-10-12

### Added
- **Animated Vector Splash Screen (`#vkSplashContainer`):** Pure SVG animated crest and monogram with smooth dismiss animation.
- **W3C Design Tokens (`tokens.css`):** Consolidated color tokens, typography scales, and shadows.

### Verified
- **Commit:** `a32878c`

---

## [0.1.0] - 2026-10-10

### Added
- Initial project scaffolding: Single-Page Storefront with 7 routes.
- Product catalog featuring Vistāra Krafts resin keepsakes, optical chemicals, and POTRY ceramics.
- In-memory cart and transactional state bridge in `store-bridge.js`.
