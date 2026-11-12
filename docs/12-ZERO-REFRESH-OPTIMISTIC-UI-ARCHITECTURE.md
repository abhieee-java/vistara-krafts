# Architecture Specification: Zero-Refresh Optimistic UI & Micro-Reconciliation

**Doc ID:** `docs/12-ZERO-REFRESH-OPTIMISTIC-UI-ARCHITECTURE.md`  
**Author:** Chief AI Engineering Coordinator & Senior Frontend Architect  
**Status:** APPROVED & IN PROGRESS  
**Target Architecture:** Vistāra Krafts E-Commerce Storefront (`stitch_potry_e_commerce_storefront`)  
**Parent Task:** Zero-Refresh UI Architecture (`/goal`)

---

## 1. Executive Summary & Root Cause Analysis

### 1.1 The Visual Flash Problem
Prior to this architecture, user interactions on critical e-commerce surfaces—specifically **Cart Item Removal** (`handleCartRemove`) and **Wishlist Toggling** (`handleWishlistToggle`)—invoked `renderActiveView()`.

`renderActiveView()` executes:
```javascript
root.innerHTML = renderCartView();
```
This brute-force DOM replacement has three severe UX flaws:
1. **DOM Tree Annihilation:** The entire DOM subtree is discarded, losing focus, scroll positions, and mid-flight CSS animations.
2. **Animation Triggering:** Re-injecting the container re-triggers:
   ```css
   .cart-scroll-content {
     animation: fadeInOnly 0.24s ease-out forwards !important;
   }
   ```
   This manifests to the customer as a jarring 240ms blank opacity flash.
3. **Perceived Latency & Jitter:** Unlike tier-1 e-commerce storefronts (Apple, Amazon, Vistāra Atelier, Flipkart), the user experiences a perceived page reload rather than a buttery-smooth in-place mutation.

---

## 2. Architectural Blueprint: The Zero-Refresh Paradigm

### 2.1 Three-Pillar Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                   USER ACTION (Click / Tap)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
 ┌──────────────────────┐             ┌──────────────────────┐
 │   1. OPTIMISTIC UI   │             │ 2. LOCAL STATE SYNC  │
 │  Surgical DOM & CSS  │             │   Synchronous Store  │
 │  Height/Opacity (GPU)│             │     Update (RAM)     │
 └──────────┬───────────┘             └──────────┬───────────┘
            │                                     │
            └──────────────────┬──────────────────┘
                               ▼
            ┌─────────────────────────────────────┐
            │       3. MICRO-RECONCILIATION       │
            │   In-place element.textContent      │
            │    updates via precise DOM IDs      │
            └──────────────────┬──────────────────┘
                               ▼
            ┌─────────────────────────────────────┐
            │     4. SILENT ASYNC PERSISTENCE     │
            │      Background Supabase Query      │
            │   with Defensive Rollback on Error  │
            └─────────────────────────────────────┘
```

---

## 3. Specification of Tasks

### Task 1: Cart Item Removal (`window.handleCartRemove`)
- **Halt Full Re-render:** Zero calls to `renderActiveView()` and zero `innerHTML` rewrites while items remain in the cart.
- **Optimistic UI (Visuals First):**
  - Target: `document.querySelector('[data-cart-item-id="${cartItemId}"]')`
  - Record initial height (`card.offsetHeight`).
  - Apply physical spring exit transition:
    - `maxHeight: 0px`
    - `opacity: 0`
    - `transform: translateX(24px) scale(0.97)`
    - `padding: 0px`, `margin: 0px`, `borderWidth: 0px`
    - Transition duration: `220ms cubic-bezier(0.16, 1, 0.3, 1)`
  - After 220ms, cleanly execute `card.remove()`.
- **Micro-Reconciliation (In-Place DOM Numbers):**
  - Header count: `#cart-header-count` -> `(${summary.itemsCount})`
  - Invoice Subtotal: `#cart-subtotal` -> `₹X,XXX`
  - Subtotal label: `#cart-subtotal-items-label` -> `Cart Subtotal (X items)`
  - Express Shipping: `#cart-shipping-fee-val` -> `FREE` or `₹99`
  - Free Shipping Progress Bar: `#cart-free-shipping-bar` -> `style="width: X%;"`
  - Free Shipping Message: `#cart-free-shipping-message` -> Unlocked / Shortfall
  - Free Shipping Fraction: `#cart-free-shipping-subtotal-fraction` -> `₹X / ₹2,000`
  - GST 18% inclusive text: `#cart-gst` -> `Includes ₹X.XX GST (18%)`
  - Invoice Total Payable: `#total-payable` -> `₹X,XXX`
  - Mobile Sticky Bar Total: `#cart-sticky-total-payable` -> `₹X,XXX`
  - Mobile Sticky Bar Shipping Notice: `#cart-sticky-shipping-notice` -> `Free Express Shipping` / `Tax Inclusive (18% GST)`
  - Desktop Checkout CTA: `#cart-desktop-checkout-btn-text` -> `Proceed to Secure Checkout • ₹X,XXX`
  - Global Badges: `updateGlobalBadges()` (updates `.js-cart-badge` with spring bounce).
- **Empty Cart Handling:** If `summary.cart.length === 0`, smoothly fade out `#cart-view-container` and render the empty state without flashing.
- **Silent Background Sync & Defensive Rollback:**
  - Execute `client.from('cart').delete().eq('cart_item_id', cartItemId)` asynchronously.
  - On network failure, re-insert item into `Store`, revert summary numbers, and trigger toast: `"Could not remove item. Please check your connection."`.

### Task 2: Wishlist Toggle (`window.handleWishlistToggle`)
- **Halt Full Re-render:** Zero calls to `renderActiveView()` or route refreshes.
- **Surgical DOM Mutation:**
  - Target all instances of `[data-wishlist-btn="${productId}"]` in the DOM.
  - Toggled ON:
    - Button class: remove `text-primary`, add `text-[#9e3322]`
    - SVG class: remove `fill-none`, add `fill-[#9e3322] stroke-[#9e3322]`
    - Trigger kinetic `sotdHeartBurst(btnTarget)`
  - Toggled OFF:
    - Button class: remove `text-[#9e3322]`, add `text-primary` (or `text-white` on media overlays)
    - SVG class: remove `fill-[#9e3322] stroke-[#9e3322]`, add `fill-none`
  - Special Case (`#/wishlist` route): If toggled OFF while on the wishlist page, collapse `article[data-product-id="${productId}"]` to `0px` height and remove over 220ms. If wishlist is now empty, render empty state.
- **Badge Update:** Direct mutation via `updateGlobalBadges()` (spring pop on `.js-wishlist-badge`).
- **Silent Background Sync & Defensive Rollback:**
  - Execute Supabase insertion/deletion asynchronously.
  - On failure, catch error, revert toggle state and heart SVG, revert badge, and show toast: `"Could not update wishlist. Please check your connection."`.

---

## 4. Architectural Guarantees & Constraints
- **Zero Hallucination:** Strict Vanilla JS DOM APIs (`querySelector`, `classList`, `textContent`, CSS transitions).
- **Security Invariance:** Zero changes to Supabase PostgreSQL RLS, Razorpay payment verification, or backend security.
- **Database Integrity:** Local state updates synchronously before background sync; network failures defensively roll back with user notification.
