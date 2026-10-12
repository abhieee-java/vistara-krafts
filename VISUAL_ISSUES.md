# Vistāra Krafts × Resin Art Memories — Visual QA & Polish Audit Log

## Audit Summary
- **Audit Scope**: Full Storefront SPA (`index.html`, `app.js`, `styles.css`, `store-bridge.js`) across all 8 routes (`#/home`, `#/catalog`, `#/product/:id`, `#/social`, `#/custom-studio`, `#/wishlist`, `#/cart`, `#/account`), all 8 interactive modals/drawers, empty/populated states, and 11 standalone Stitch reference screens (`*/code.html`).
- **Viewports Verified**: `320px`, `375px`, `390px`, `414px`, `667×375` (landscape phone), `768px`, `820px`, `1024px`, `1280px`, `1366×768` (laptop), `1440px`, `1920px`, plus `100%`, `125%`, and `200%` browser zoom (`112` route/viewport combinations per pass).
- **Pass 1 (Initial Audit)**: `17` visual, responsive, typographic, contrast, and accessibility issues identified.
- **Pass 2 (Post-Fix Verification)**: Resolved remaining `1024px` desktop nav flex compression (`13px` overflow), solid dark `background-color` fallbacks on gradient cards, PDP/Catalogue breadcrumb button widths (`>=44px`), and `#/cart` `h1 -> h2` heading order.
- **Consecutive Clean Pass #1 & Pass #2**: `0` issues across all `112` route/viewport combinations (`0` horizontal overflow, `0` contrast failures, `0` sub-`44px` tap targets, `0` unlabeled controls, `0` heading skips, `0` broken images).

---

## Detailed Issue Log (`VIS-001` – `VIS-017`)

### `VIS-001` — Brand Header Lockup Redundant Logo Text & Mobile Wrapping
- **Page / Route**: All Routes (Global Sticky Header in `index.html`)
- **Viewport(s)**: `320px`, `375px`, `390px`, `1024px`, `1440px`
- **Severity**: High
- **Description**: The header brand lockup displayed a wide `16:9` raster graphic containing tiny embedded text ("Resin Art Memories × Vistāra Krafts") immediately next to the HTML text saying the exact same thing, and at `320px`–`375px` the brand title wrapped onto multiple lines while 5 right-side icon buttons crowded the header. At `1024px+`, `min-w-0` without `shrink-0` allowed the desktop nav to crush the brand title container.
- **Fix Applied**: Cropped the brand emblem container in `index.html` (`w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden shrink-0`) to frame the square `[VK]` monogram (`object-cover object-left`), added `shrink-0 whitespace-nowrap` to the brand lockup, made desktop nav labels responsive (`Catalogue`, `Custom Studio`, `Social Feed`, `Orders` at `lg:` expanding at `xl:`/`2xl:`), and hid redundant header icons on ultra-narrow viewports (`hidden min-[360px]:flex` for Search, `hidden min-[480px]:flex` for Account) since both are accessible in the mobile navigation drawer and bottom tab bar.
- **Status**: **Fixed & Verified**

---

### `VIS-002` — Horizontal Overflow (`320px`, `375px`, `390px`, `414px`, `1024px`, `200%` Zoom)
- **Page / Route**: All Routes (`#/home`, `#/catalog`, `#/product/vk-epx-301`, `#/social`, `#/custom-studio`, `#/wishlist`, `#/cart`, `#/account`)
- **Viewport(s)**: `320px` (`scrollWidth: 373px`), `375px`, `390px`, `414px`, `1024px` (`scrollWidth: 1037px`), `200%` zoom
- **Severity**: Critical
- **Description**: At `320px`, the 2-column product card grid, footer newsletter form, and header caused a `53px` horizontal overflow (`373px > 320px`). At `375px`–`414px`, uncontained Material Symbols ligature text widened the page before icon webfont glyph substitution. At `1024px`, the 5-item desktop navigation plus 4 action icons exceeded `1024px` by `13px`.
- **Fix Applied**: Changed product grids to `grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`, added `min-w-0` to flex children and newsletter inputs in `index.html`, compacted `lg:` desktop nav spacing, and constrained `.material-symbols-outlined` to `width: 1em; height: 1em; overflow: hidden` in `styles.css`.
- **Status**: **Fixed & Verified** (`docScrollWidth === innerWidth` across all 14 viewports and 8 routes)

---

### `VIS-003` — PDP Sticky Bottom Conversion Bar Collides with Mobile Bottom Navigation Bar
- **Page / Route**: `#/product/:id` (`renderPdpView()` in `app.js`)
- **Viewport(s)**: `320px`, `375px`, `390px`, `414px`, `768px`, `820px` (all viewports `< 1024px`)
- **Severity**: Critical
- **Description**: Both the mobile bottom navigation bar (`index.html`) and the PDP sticky conversion bar (`app.js`) were positioned at `fixed bottom-0 inset-x-0 z-40`, causing the PDP sticky bar to completely cover the mobile navigation bar on tablets and phones.
- **Fix Applied**: Updated the PDP sticky conversion bar in `app.js` to `fixed bottom-16 lg:bottom-0 inset-x-0 z-30` and increased PDP container bottom padding to `pb-36 lg:pb-24` so it docks cleanly above the `64px` (`h-16`) mobile bottom tab bar on `< 1024px` viewports and at `bottom-0` on desktop (`>= 1024px`).
- **Status**: **Fixed & Verified**

---

### `VIS-004` — WCAG AA Color Contrast Failures on Accent Pills, Buttons, Muted Labels & Gradient Cards
- **Page / Route**: All Routes (`styles.css`, `index.html`, `app.js`)
- **Viewport(s)**: All Viewports
- **Severity**: High
- **Description**:
  1. `#c85a48` (rose terracotta) with white text had a `3.95:1` contrast ratio (below the WCAG AA `4.5:1` requirement for normal text) and `3.31:1` on `#ffe4de` blush pills.
  2. `outline` (`#74777e`) on `#f4f2ed` and `#e8e4dc` surface containers had `3.56:1`–`3.95:1` contrast on strike-through prices and muted labels.
  3. Unselected volume tier sublabels (`text-secondary-fixed` `#ffd79b`) on light `#f4f2ed` backgrounds had `1.32:1` contrast.
  4. Cart coupon warning text (`#b57c1e` on `#fff5e0`) had `3.2:1` contrast.
  5. Dark gradient cards (`#/social` header, `#/custom-studio` preview card, and product card bottom spec bars) lacked a solid dark `background-color` fallback.
- **Fix Applied**:
  1. Darkened `--accent-10-flirty` to `#9e3322` (`7.12:1` contrast with `#ffffff` and `5.90:1` on `#ffe4de`).
  2. Darkened `outline` token in `tailwind.config` to `#59606d` (`> 5.1:1` contrast across all light surfaces).
  3. Updated unselected volume tier label in `renderPdpView()` to `text-secondary` (`#77574d`, `5.8:1` contrast) and only used `text-secondary-fixed` when selected (`bg-primary`).
  4. Updated cart coupon warning text to `#704600` on `#fff5e0` (`> 7.5:1` contrast).
  5. Added `!bg-[#031a38]`, `!bg-primary`, and `bg-primary/90` solid fallbacks to dark gradient containers.
- **Status**: **Fixed & Verified** (`0` contrast issues across all 112 viewport/route pairs)

---

### `VIS-005` — Material Symbols Outlined Ligature Overflow & Missing `aria-hidden="true"`
- **Page / Route**: All Routes (`styles.css`, `index.html`, `app.js`)
- **Viewport(s)**: All Viewports
- **Severity**: Medium
- **Description**: `.material-symbols-outlined` spans had no width/overflow containment, allowing raw ligature strings (`shopping_bag`, `verified_user`, `local_shipping`) to expand layout boxes before font load and pollute assistive technology announcements on buttons.
- **Fix Applied**: Added `.material-symbols-outlined { width: 1em; height: 1em; overflow: hidden; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }` in `styles.css` and `aria-hidden="true"` on decorative icons.
- **Status**: **Fixed & Verified**

---

### `VIS-006` — Font Family Sprawl (3 Font Families Loaded Instead of Maximum 2)
- **Page / Route**: Global (`index.html`, `styles.css`)
- **Viewport(s)**: All Viewports
- **Severity**: Medium
- **Description**: `index.html` loaded `Plus Jakarta Sans`, `Playfair Display`, and `Inter`, violating the strict 2-font-family rule (`DESIGN.md` specifies `Playfair Display` for display/editorial headings and `Inter` for UI/body/technical specs).
- **Fix Applied**: Removed `Plus Jakarta Sans` from Google Fonts `<link>` and unified `tailwind.config` and `styles.css` to use only `'Playfair Display'` (serif) and `'Inter'` (sans/numeral).
- **Status**: **Fixed & Verified**

---

### `VIS-007` — Top Announcement Bar Visible Scrollbar & Clipped Left Text on Mobile
- **Page / Route**: Global Top Bar (`index.html`)
- **Viewport(s)**: `320px`, `375px`, `390px`, `414px`, `768px`
- **Severity**: Medium
- **Description**: The top `<aside>` announcement bar used `justify-center overflow-x-auto` without `no-scrollbar`, causing a horizontal scrollbar to render inside the `28px` banner and clipping the left side of the text on narrow screens.
- **Fix Applied**: Updated `<aside>` in `index.html` to `justify-start sm:justify-center overflow-x-auto no-scrollbar`.
- **Status**: **Fixed & Verified**

---

### `VIS-008` — Interactive Tap Targets Smaller Than `44×44px` Minimum
- **Page / Route**: All Routes (`index.html`, `app.js`)
- **Viewport(s)**: All Viewports
- **Severity**: High
- **Description**: Multiple interactive buttons and links were smaller than `44×44px`, including header icon buttons (`36×36px`), product card wishlist buttons (`32×32px`), PDP/Cart quantity stepper buttons (`32×32px`), modal close buttons (`32×32px`), breadcrumb buttons (`34×44px`), and footer links (`20px` height).
- **Fix Applied**: Enforced `w-11 h-11` (`44×44px`) on all icon buttons, steppers, and modal close buttons, and `min-h-[44px] min-w-[44px]` on all pill buttons, breadcrumb links, and footer links across `index.html` and `app.js`.
- **Status**: **Fixed & Verified** (`0` small targets across all 112 viewport/route pairs)

---

### `VIS-009` — Sticky Catalogue Filter Bar & Toast Offset Clash with Sticky Header
- **Page / Route**: `#/catalog` (`app.js`), Global Toast (`index.html`)
- **Viewport(s)**: All Viewports
- **Severity**: Medium
- **Description**: The global sticky header (`<aside>` `28px` + `<div class="h-16">` `64px`) is `92px` tall, but the `#/catalog` sticky filter bar used `top-[88px]` (overlapping the header bottom border by `4px`) and `#global-toast` used `top-20` (`80px`, overlapping the header by `12px`).
- **Fix Applied**: Updated the `#/catalog` sticky bar to `top-[92px]` in `app.js` and `#global-toast` to `top-24` (`96px`) in `index.html`.
- **Status**: **Fixed & Verified**

---

### `VIS-010` — awkward Badge & Pill Wrapping on Narrow Mobile Viewports
- **Page / Route**: `#/home`, `#/custom-studio`, `#/social` (`app.js`)
- **Viewport(s)**: `320px`, `375px`, `390px`
- **Severity**: Low
- **Description**: The `Doorstep Flower Pickup` badge on `#/custom-studio` wrapped mid-word across two lines on `320px`–`375px`, and `#/social` filter pills wrapped unevenly instead of scrolling cleanly in a horizontal rail.
- **Fix Applied**: Added `whitespace-nowrap self-start shrink-0` to badges and placed `#/social` filter pills in an `overflow-x-auto no-scrollbar` rail.
- **Status**: **Fixed & Verified**

---

### `VIS-011` — Missing `:focus-visible` Keyboard Focus Rings
- **Page / Route**: Global (`styles.css`)
- **Viewport(s)**: All Viewports
- **Severity**: High
- **Description**: Interactive buttons, links, and form inputs lacked a consistent high-contrast `:focus-visible` ring for keyboard navigation.
- **Fix Applied**: Added global `:focus-visible` rule in `styles.css` (`outline: 2px solid var(--accent-10-brass) !important; outline-offset: 2px !important;`).
- **Status**: **Fixed & Verified**

---

### `VIS-012` — Form Input Height Standardization (`48px`), Missing Labels & iOS Auto-Zoom Prevention (`>=16px`)
- **Page / Route**: All Routes & Modals (`index.html`, `app.js`, `styles.css`)
- **Viewport(s)**: Mobile (`320px`–`414px`) & Desktop
- **Severity**: High
- **Description**: Form inputs and selects varied in height (`36px`, `40px`, `44px`), several inputs (`#catalog-search-input`, `#pdp-pincode-input`, `#cart-gstin-input`, `#cart-tradename-input`, social comment input, footer email input, modal inputs) lacked explicit `<label for>` or `aria-label` associations, and `text-xs` (`12px`) font sizes on mobile inputs triggered iOS Safari auto-zoom.
- **Fix Applied**: Standardized all text/number/email/tel/search inputs and selects to `h-12` (`48px`), associated every input with an explicit `<label for>` and/or `aria-label`, and enforced `font-size: 16px !important` on `< 640px` viewports in `styles.css`.
- **Status**: **Fixed & Verified** (`0` missing labels and `0` mobile input font issues across all routes)

---

### `VIS-013` — Modal Background Scroll Bleed, Missing Escape Key Dismissal & Short-Screen Overflow
- **Page / Route**: All 8 Modals/Drawers (`index.html`, `app.js`, `styles.css`)
- **Viewport(s)**: All Viewports (especially `667×375` landscape phone & `1366×768` laptop)
- **Severity**: Medium
- **Description**: Opening a modal or drawer did not lock `document.body` scroll, pressing `Escape` did not close open modals, and modal cards lacked `max-h-[90dvh] overflow-y-auto` for short landscape screens.
- **Fix Applied**: Added `body.modal-open { overflow: hidden !important; }` in `styles.css`, `syncBodyModalLock()` in `app.js` across all modal open/close paths, a global `Escape` `keydown` listener, and `max-h-[90dvh] overflow-y-auto` + `role="dialog" aria-modal="true"` on all modals in `index.html`.
- **Status**: **Fixed & Verified**

---

### `VIS-014` — Unconstrained Paragraph Line Width (`> 75ch`) on Ultra-Wide Viewports (`1920px`)
- **Page / Route**: All Routes (`styles.css`)
- **Viewport(s)**: `1440px`, `1920px`
- **Severity**: Low
- **Description**: Body paragraphs inside full-width cards could stretch beyond `75ch` on `1920px` monitors.
- **Fix Applied**: Added `p { max-width: 68ch; }` and `h1, h2, h3 { text-wrap: balance; }` in `styles.css`.
- **Status**: **Fixed & Verified**

---

### `VIS-015` — Heading Level Hierarchy Skips (`h1` -> `h4` in Footer, `h1` -> `h3` in Cart & Home)
- **Page / Route**: `index.html` Footer, `#/home`, `#/catalog`, `#/cart` (`app.js`)
- **Viewport(s)**: All Viewports
- **Severity**: Medium
- **Description**: Footer column headings used `<h4>` directly after section `<h2>`s (or after `<h1>` on sparse routes), product card titles used `<h3>` directly after `<h1>` on `#/catalog`, and cart item titles used `<h3>` directly after `<h1>` on `#/cart`.
- **Fix Applied**: Updated footer headings in `index.html` to `<h2>`, product card titles in `renderProductCard()` to `<h2>`, and cart line item titles in `renderCartView()` to `<h2>`.
- **Status**: **Fixed & Verified** (`0` heading skips across all 8 routes)

---

### `VIS-016` — Standalone Stitch Screens (`*/code.html`) Accessibility Gaps
- **Page / Route**: All 11 `*/code.html` Stitch reference files
- **Viewport(s)**: All Viewports
- **Severity**: Medium
- **Description**: The 11 standalone Stitch reference HTML files included `maximum-scale=1.0, user-scalable=no` in `<meta name="viewport">`, 5 files lacked a `<title>`, and several `<img>` tags used `data-alt` without a standard `alt` attribute.
- **Fix Applied**: Removed `maximum-scale=1.0, user-scalable=no` from all 11 `code.html` files, added descriptive `<title>` elements where missing, and populated `alt` attributes from `data-alt` on all `<img>` elements.
- **Status**: **Fixed & Verified**

---

### `VIS-017` — Custom Studio `1:1` Doming Resin Calculator Link Used Unaliased ID `'vk-dom-101'`
- **Page / Route**: `#/custom-studio` (`app.js`, `store-bridge.js`)
- **Viewport(s)**: All Viewports
- **Severity**: Medium
- **Description**: Selecting the `1:1 Art / Doming Coat` system in the `#/custom-studio` calculator referenced product ID `'vk-dom-101'`, whereas the 1:1 Doming Resin product in `DEFAULT_PRODUCTS` had ID `'vk-res-003'`, causing `Store.getProductById('vk-dom-101')` to fall back to the first product in the array.
- **Fix Applied**: Updated `renderCustomStudioView()` and `window.addRecommendedCalcKitToCart()` in `app.js` to use `'vk-res-003'`, and added `'vk-dom-101': 'vk-res-003'` to `aliasMap` in `Store.getProductById()` in `store-bridge.js`.
- **Status**: **Fixed & Verified**
