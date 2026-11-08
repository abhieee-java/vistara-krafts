# Milestone 13: Zero-Refresh Cart Quantity Reconciliation & "Apple, Elevated" Wishlist Architecture

**Doc ID:** `docs/13-ZERO-REFRESH-CART-QUANTITY-AND-LUXURY-WISHLIST-ARCHITECTURE.md`  
**Date:** November 8, 2026  
**Scope:** Storefront E-Commerce Experience  
**Status:** IMPLEMENTATION IN PROGRESS  
**Target Architecture:** Vistāra Krafts E-Commerce Storefront (`stitch_potry_e_commerce_storefront`)  
**Parent Task:** Launch-Day Polish & Zero-Refresh Optimization (`/goal`)

---

## 1. Executive Summary & Root Cause Analysis

### 1.1 The Cart Quantity "Jump" Bug
- **Symptom:** When a customer clicks `+` or `-` on any item in the Cart view (`#/cart`), the page flashes white/blank for ~240ms, drops the user's scroll position, and re-renders the entire screen with a noticeable jump.
- **Root Cause:** While `window.handleCartRemove` was refactored in Milestone 12 to use optimistic DOM deletion, `window.handleCartQty` was still invoking `renderActiveView()`. `renderActiveView()` wipes `root.innerHTML` and re-injects the container, triggering the CSS rule `.cart-scroll-content { animation: fadeInOnly 0.24s ease-out forwards !important; }`.
- **Architectural Solution:**
  1. Remove `renderActiveView()` from `window.handleCartQty`.
  2. Implement in-place surgical quantity updates:
     - When `delta > 0` or `newQty > 0`: update the card's stepper count (`.js-cart-item-qty`), the item line total (`[data-line-total]`, `.js-cart-item-total`), the unit price display, and the volume tier badge in-place.
     - Call `reconcileCartInvoiceDom(newSummary)` to update all summary numbers, free shipping thresholds, GST, and checkout CTAs without wiping any DOM elements.
     - When `newQty <= 0`: delegate directly to `window.handleCartRemove` for an optimistic 220ms GPU height-and-opacity collapse.

### 1.2 "Volume Tier Applied" Layout Disfigurement
- **Symptom:** On mobile viewports (360px–412px), the badge `Volume Tier Applied` was crammed into a horizontal flex container alongside the line price (`₹549`) and unit price (`(₹183/unit)`). The text broke across 3 lines (`Volume \n Tier \n Applied`), turning the rounded pill into an unsightly tall peach egg that inflated the card height.
- **Root Cause:** Lack of `whitespace-nowrap` and missing vertical separation between the primary price numerals and secondary promotion tags.
- **Architectural Solution:**
  1. Restructure the bottom row into a dedicated two-level vertical stack on the left:
     - Level 1: Primary price numerals (`₹549`) and unit price (`(₹183/unit)`).
     - Level 2: A clean, quiet, single-line indicator with `whitespace-nowrap`:
       `<span class="js-cart-item-tier-badge text-[9.5px] font-semibold text-emerald-800 flex items-center gap-1 whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span><span>Volume tier applied</span></span>`
  2. Eliminates word wrapping, preserves horizontal breathing room for the stepper, and aligns with Apple/Linear receipt item design.

### 1.3 Redundant Pincode Zone Subtitle
- **Symptom:** The delivery card displayed `Delivering to PIN 781028 (Zone PIN 781028 (Pan-India Hub))`, repeating "PIN 781028" twice.
- **Fix:** Sanitize the zone fallback string to display: `Delivering to PIN 781028 (Pan-India Express Hub)`.

### 1.4 Redesign of the Wishlist View ("Apple, Elevated" & Impeccable)
- **Symptom:** The wishlist page (`renderWishlistView`) previously dumped the raw catalog product cards (`${products.map(p => renderProductCard(p, false)).join('')}`) in a generic grid, wasting vertical space and looking like a redundant duplicate of the catalogue.
- **Architectural Solution:**
  1. **Atelier Header:**
     - Restrained editorial hierarchy (`PERSONAL ATELIER`, `Saved Formulations & Keepsakes (${products.length})`).
     - Global Action: `[ Add All to Bag • ₹X,XXX ]` primary button.
  2. **Bespoke Luxury Wishlist Cards:**
     - High-craft compact card layout with refined 4:3 / 1:1 image frame.
     - Quiet category & formula tag (`Optical Casting System • 3:1 Deep Pour`).
     - Editorial title and price with unit savings.
     - In-stock availability indicator: `● In Stock • Ready for Studio Dispatch`.
     - Direct 1-Click `Add to Bag` button on every card.
     - Unobtrusive heart toggle with spring feedback.
  3. **Zero-Refresh Optimistic Removal:**
     - Toggling an item OFF smoothly collapses its card (`max-height: 0px`, `opacity: 0` over 220ms) and reconciles the header count.
     - If all items are removed, crossfades smoothly to the bespoke empty-state illustration.
  4. **Strict Visual Cohesion:**
     - Uses standard Vistāra Krafts palette (Obsidian `#1c1b18`, Alabaster `#faf8f5`, Gold `#cda851`, Crimson `#9e3322`, Slate `#e6e2d8`).

---

## 2. Technical Contracts & Implementation Plan

### Phase A: Surgical DOM Reconciliation for Cart Stepper (`app.js`)
- Update `summary.cart.map(...)` markup with semantic classes:
  - `.js-cart-item-qty` on the quantity numeral span.
  - `.js-cart-item-total` and `[data-line-total]` on the line total span.
  - `.js-cart-item-unit` on the unit price span.
  - `.js-cart-item-tier-badge` on the volume tier indicator.
- Refactor `window.handleCartQty(cartItemId, delta)`:
  - Zero calls to `renderActiveView()`.
  - Calculate `nextQty`.
  - If `nextQty <= 0`: trigger `window.handleCartRemove(cartItemId)`.
  - If `nextQty > 0`: update item in `Store`, update DOM nodes directly, call `reconcileCartInvoiceDom(Store.getCartSummary())`, and call `updateGlobalBadges()`.

### Phase B: Luxury Wishlist Transformation (`app.js`)
- Replace generic `renderProductCard` call in `renderWishlistView` with `renderWishlistItemCard(product)`.
- Wire `window.addWishlistItemToCart(productId)` for instant 1-click addition to cart with visual confirmation.
- Connect `window.handleWishlistToggle` so that on `#/wishlist`, removing an item triggers smooth card removal and header count reconciliation without route reload.

### Phase C: Verification & Testing
- Automated unit and integration test suite in `test/cart-qty-zero-refresh.test.mjs`.
- Chrome DevTools MCP live verification:
  - Take before/after screenshots of mobile cart stepper and volume tier badge.
  - Take screenshots of the redesigned wishlist page on mobile (390x844) and desktop (1280x800).
  - Verify zero-refresh behavior: no DOM flash, no scroll loss, smooth transitions.
