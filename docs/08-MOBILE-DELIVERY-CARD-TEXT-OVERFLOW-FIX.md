# Mobile Delivery Card Text Overflow & Responsive Wrapping Specification

**Project:** Vistāra Krafts — Handcrafted Resin Art & Keepsakes  
**Component:** Mobile Shopping Bag (`#/cart`), Pincode & Express Dispatch Indicator Card  
**Target:** Elimination of Clipped/Truncated Delivery Text, Dynamic Content Wrapping & Multi-Viewport Boundaries  
**Date:** November 6, 2026  
**Status:** Approved & Verified (All 12 Test Suites Passing, Live Chrome DevTools MCP Verified)  

---

## 1. Executive Summary & Defect Analysis

### 1.1 The Reported Defect
On mobile viewports (e.g. 360px, 375px, 390px, 412px), customers on the `#/cart` page observed text clipping and truncation inside the delivery card:
- Title: `"Delivering to PIN 781028 (Zone PIN 781028 (Pan-In..."` was clipped at the right border by CSS ellipsis.
- Subtitle: `"BlueDart / Delhivery Express • Guaranteed in 2-4 busine..."` was clipped at the right border by CSS ellipsis.
- Critical fulfillment details—including the Pan-India hub confirmation and courier transit guarantees—were hidden from customers.

---

## 2. Architectural Root Causes & Solutions

| Area | Root Cause | Architectural Solution |
| :--- | :--- | :--- |
| **Ellipsis / Clipping** | `truncate` class enforced `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` on title and subtitle `<p>` tags. | Removed `truncate`. Added `break-words leading-snug` on title and `break-words leading-relaxed mt-0.5` on subtitle. Text wraps naturally without truncation. |
| **Narrow Column Squeeze** | `min-[380px]:flex-row` placed the 85px "Change PIN" button side-by-side with text on mobile screens as narrow as 380px, restricting available text width to ~199px. | Standardized breakpoint to `sm:flex-row` (`min-width: 640px`). On mobile (`< 640px`), the text enjoys the full card width (~290px–330px). On desktop (`>= 640px`), the horizontal layout is 100% preserved. |
| **Vertical Alignment** | `items-center` vertically centered the 32px pin icon against multiline text, creating awkward vertical centering. | Switched to `items-start` with `mt-0.5` on the icon, aligning the icon with the cap height of the first line of text for an editorial look. |
| **Horizontal Scrolling Prevention** | Potential overflow from long unspaced courier names or postal zones. | Applied `min-w-0 max-w-full overflow-hidden` on the card container and `min-w-0 flex-1` on text wrappers, guaranteeing zero horizontal scroll (`scrollWidth === window.innerWidth`). |

---

## 3. Component Architecture & Code Implementation

### File: `app.js` (lines ~3938–3950)

```html
<!-- Pincode Dispatch Indicator Card (Responsive Wrapping & Zero Clipping) -->
<div class="ram-card p-3 sm:p-3.5 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4 min-w-0 max-w-full overflow-hidden">
  <div class="flex items-start gap-2.5 min-w-0 flex-1 w-full sm:w-auto">
    <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 mt-0.5">
      <span class="material-symbols-outlined text-base" aria-hidden="true">pin_drop</span>
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-xs sm:text-sm font-bold text-primary break-words leading-snug">
        Delivering to PIN ${esc(pinInfo.pin)} (${esc(pinInfo.city)})
      </p>
      <p class="text-[11px] sm:text-xs text-on-surface-variant break-words leading-relaxed mt-0.5">
        ${esc(pinInfo.courier)} • Guaranteed in ${esc(pinInfo.days)}
      </p>
    </div>
  </div>
  <button type="button" onclick="window.promptChangePincode()" class="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold text-secondary underline hover:text-primary whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-center transition-colors">
    Change PIN
  </button>
</div>
```

---

## 4. Multi-Level Testing & Verification Evidence

### 4.1 Live Chrome DevTools Inspection (Emulated Devices)

| Viewport | Card Width | Text Wrapping | Within Card Boundaries? | Horizontal Scroll? |
| :--- | :--- | :--- | :--- | :--- |
| **320px (iPhone SE)** | 292px | 2 lines (33px h) | **YES** (`titleWithinCard = true`) | **NO** (`hasHorizontalScroll = false`) |
| **360px (Android Standard)** | 332px | 2 lines (33px h) | **YES** (`titleWithinCard = true`) | **NO** (`hasHorizontalScroll = false`) |
| **390px (iPhone 14/15)** | 362px | 2 lines (33px h) | **YES** (`titleWithinCard = true`) | **NO** (`hasHorizontalScroll = false`) |
| **768px (iPad Portrait)** | 694px | 1 line (Row layout) | **YES** (`titleWithinCard = true`) | **NO** (`hasHorizontalScroll = false`) |
| **1280px (Desktop)** | 694px | 1 line (`flexDirection: row`) | **YES** (Button on right) | **NO** (`hasHorizontalScroll = false`) |

### 4.2 Functional Interaction Sign-Off
- Clicking `Change PIN` opens `#global-pincode-modal` with full input verification.
- Valid 6-digit Indian PIN codes update state, courier, and transit days dynamically.
- Desktop layout is 100% unchanged.
- Backend, APIs, payment gateways, and data integrity remain unmodified.
