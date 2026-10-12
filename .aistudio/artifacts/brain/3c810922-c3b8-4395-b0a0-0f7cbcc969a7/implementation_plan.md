# Comprehensive Mobile Viewport & Responsive Layout Optimization Plan

A production-grade architectural blueprint to eliminate horizontal scrolling, clipped elements, and overflowing text across the entire Resin Art Memories × Vistāra Krafts Studio storefront on all mobile devices (from 320px ultra-compact phones to tablets).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Decisions from Phase 1 Interactive Clarification:**
> - **Scope**: Comprehensive fix applied across **all 8 screens and routes** (`#/home`, `#/catalog`, `#/product/:id`, `#/social`, `#/custom-studio`, `#/wishlist`, `#/cart`, `#/account`), plus all 8 modals/drawers and persistent navigation bars.
> - **Target Viewports**: 100% zero-overflow guarantee across all mobile devices and tablets, strictly certified down to **320px** (iPhone SE 1st Gen) and through modern 360px, 375px, 390px, 414px, 430px, and 768px viewports.
> - **Layout Strategy**: Multi-column grids and horizontal ribbons will gracefully adapt into **full vertical stacks with fluid wrapping** on mobile screens, preserving content integrity without awkward horizontal cuts or squished inputs.

---

## 1. Overview & Core Concept

- **What It Does**: Hardens every component, template, and utility against viewport boundary violations. Ensures all text, calculation tables, order steppers, product spec grids, and modal forms wrap naturally within screen bounds without causing `scrollWidth > innerWidth` or clipping off-screen.
- **Target Audience / Devices**: Mobile shoppers, brides on WhatsApp/Instagram links, and studio resin artists accessing the storefront on smartphones and tablets.
- **Key Value**: Provides an effortless, tactile, Apple-grade e-commerce experience where every button is easily tap-friendly ($\ge 44\text{px}$), all text is readable without horizontal panning, and sticky navigation bars never crowd the viewport.

---

## 2. User Experience & Visual Design

### Key User Flows & Screen Adaptations

1. **Header & Announcement Ribbon**:
   - Announcement ticker: Constrained to fluid marquee or graceful horizontal overflow handling with hidden scrollbars, ensuring zero parent canvas expansion.
   - Sticky Top Header: The brand emblem and title lockup flexes and truncates gracefully (`min-w-0 truncate`), leaving full breathing room for the hamburger toggle and right-hand action icons (`Wishlist`, `Bag`).
2. **Hero & Discovery (`#/home`)**:
   - Hero split: 12-column grid transforms into a clean single-column stack on screens `< 1024px`.
   - Action buttons: Convert to full-width touch targets with fluid wrapping and zero line-clipping.
   - Trust highlights & metric pills: Wrap onto responsive single/dual-column cards with `min-w-0`.
3. **Catalogue Grid & Filters (`#/catalog`)**:
   - Product Grid: Formatted as `grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.
   - Technical Spec Pills: Ratio chips and price badges wrap cleanly with `flex-wrap` and word-break safeguards.
4. **Product Detail Page (`#/product/:id`)**:
   - Technical Data Table & Mix Ratio Matrix: Wrap tabular rows into fluid card stacks or auto-contained scroll containers so metrics never push the layout sideways.
   - Sticky Bottom Purchase Bar: Cleanly docked above the mobile bottom tab bar (`bottom-16 lg:bottom-0`) with safe-area insets (`pb-safe`) and responsive price/CTA hierarchy.
5. **Custom Studio & Pour Calculator (`#/custom-studio`)**:
   - Multi-step configurator: Steps 1 through 4 stack vertically with fluid input fields.
   - Resin Calculator: Numeric input groups adapt from cramped horizontal rows into responsive vertical stacks on mobile.
6. **Cart & Razorpay Checkout (`#/cart`)**:
   - Itemized bag cards: Flex layout stacks product thumbnail, title, stepper, and price without sub-element horizontal overflow.
   - Coupon & GST tax input forms: Single-column on mobile with touch-friendly 48px submission buttons.
7. **Patron Account & 5-Stage Tracker (`#/account`)**:
   - 5-stage progress indicator: Switches from cramped 5-column grid into an intuitive vertical progress timeline or wrapped responsive tiles on mobile.
8. **Modals & Drawers (All 8 Dialogs)**:
   - Width capped at `max-w-[calc(100vw-24px)]` and `max-h-[90dvh]` with scroll containment, preventing modals from expanding outside narrow screens.

### Visual Identity & Theme Alignment
- **Palette**: Preserves the 60/30/10 High-RT palette (Canvas: `#faf8f5`, Ink: `#031a38`, Accent: `#9e3322` & Antique Brass `#b08d57`).
- **Typography**: Fluid typography via `clamp()` and `text-wrap: balance` on headings; `break-words` and `overflow-wrap: anywhere` on dynamic user strings.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full Vertical Stack vs. Horizontal Rails on Mobile**
  - *Chosen Approach*: Multi-column grids and interactive forms stack vertically on screens $< 640\text{px}$, while editorial image showcases (e.g. Stories) retain explicit, touch-friendly horizontal swipe rails with `no-scrollbar` and `overscroll-behavior-x: contain`.
  - *Why*: Form inputs, order steppers, and pricing breakdowns require vertical comprehension; forced multi-column layouts on 320px–375px screens crush text and cause illegible input squishing.
- **Decision 2: Defensive Global Overflow Containment**
  - *Chosen Approach*: Apply `overflow-x: clip` and `max-w-full` at `html`, `body`, and `#app-view-root` levels, combined with `min-w-0` on all flex children and `break-words` on all dynamic headings and user notes.
  - *Why*: Eliminates the root cause of horizontal screen jittering and right-side white space leaks on mobile webkit/safari browsers.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VIEWPORT CONTAINER ROOT                         │
│       html / body (overflow-x: clip; max-w-full; min-h-dvh)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    ▼                                                               ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│     GLOBAL APP SHELL            │   │      DYNAMIC ROUTE MOUNT        │
│ • Announcement Ribbon           │   │      #app-view-root             │
│ • Responsive Header (shrink-0)  │   │  (w-full; max-w-7xl; min-w-0)   │
│ • Fixed Bottom Tabs (h-16)      │   └──────────────┬──────────────────┘
└─────────────────────────────────┘                  │
                                                     ▼
                  ┌─────────────────────────────────────────────────────┐
                  │ ROUTE-SPECIFIC ADAPTIVE LAYOUTS                     │
                  │ • #/home: 12-col -> single-col hero stack           │
                  │ • #/catalog: 1-col (<360px) -> 2-col -> 4-col grid  │
                  │ • #/product: stacked purchase module + specs table  │
                  │ • #/custom-studio: fluid 1-col configurator & calc  │
                  │ • #/cart: flex-col line items + full-width checkout │
                  │ • #/account: vertical order progress stepper        │
                  │ • Modals (8x): max-w-[calc(100vw-24px)] + trap      │
                  └─────────────────────────────────────────────────────┘
```

### Verification & Compliance Gates
- Verified across viewport sizes: `320px`, `360px`, `375px`, `390px`, `414px`, `768px`, and `1024px`.
- Strict gate: `document.documentElement.scrollWidth === window.innerWidth` (Zero horizontal overflow).
- Tap target compliance: Every interactive control $\ge 44\times 44\text{px}$.
- Build verification: Clean execution of `compile_applet`.
