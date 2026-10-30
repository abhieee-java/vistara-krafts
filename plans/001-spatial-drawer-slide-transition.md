# 001 — Spatial Slide Transitions for Filter Drawer & Mobile Navigation

- **Status**: DONE
- **Commit**: 7d2f547
- **Severity**: MEDIUM
- **Category**: Missed opportunities & spatial consistency
- **Estimated scope**: 1 file (`styles.css`), ~50 lines of CSS

## Problem

Opening the mobile hamburger navigation drawer (`#mobile-menu-drawer`) or catalog sort & filter drawer (`#global-filter-drawer`) currently toggles Tailwind's `.hidden` class abruptly. The drawer panel teleports onto the screen with zero spatial context, making the surface feel disconnected from its entry origin.

```html
<!-- index.html:3016 — current mobile navigation drawer -->
<div id="mobile-menu-drawer" role="dialog" aria-modal="true" aria-label="Navigation and Account Bar Drawer" class="fixed inset-0 z-50 bg-primary/50 backdrop-blur-xs hidden flex" onclick="window.closeModalById('mobile-menu-drawer')">
  <div class="w-80 max-w-[86vw] h-full max-h-[100dvh] bg-surface p-4 sm:p-5 flex flex-col justify-between overflow-y-auto shadow-2xl" onclick="event.stopPropagation()">
```

```html
<!-- index.html:3125 — current catalog filter drawer -->
<div id="global-filter-drawer" role="dialog" aria-modal="true" aria-labelledby="filter-drawer-title" class="fixed inset-0 z-50 bg-primary/60 backdrop-blur-xs hidden flex items-end sm:items-center justify-center p-0 sm:p-4" onclick="window.toggleCatalogFilterDrawer(false)">
  <div class="w-full max-w-lg bg-surface rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] border-t sm:border border-[#e4e0d8]" onclick="event.stopPropagation()">
```

## Target

Hardware-accelerated CSS keyframe slide transitions bound to `:not(.hidden) > div`, preserving all existing `.hidden` toggling contracts:

```css
/* target in styles.css */
@keyframes drawerBackdropFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes drawerSlideLeft {
  0% {
    opacity: 0.4;
    transform: translateX(-100%);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes drawerSlideBottom {
  0% {
    opacity: 0.6;
    transform: translateY(100%);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes drawerScaleDesktop {
  0% {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

#mobile-menu-drawer:not(.hidden),
#global-filter-drawer:not(.hidden) {
  animation: drawerBackdropFade 0.2s ease-out forwards;
}

#mobile-menu-drawer:not(.hidden) > div {
  animation: drawerSlideLeft 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  will-change: transform, opacity;
}

#global-filter-drawer:not(.hidden) > div {
  animation: drawerSlideBottom 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards;
  will-change: transform, opacity;
}

@media (min-width: 640px) {
  #global-filter-drawer:not(.hidden) > div {
    animation: drawerScaleDesktop 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
}
```

## Repo conventions to follow

- Easing curves: `--ease-standard: cubic-bezier(0.2, 0, 0, 1)`, `--ease-emphasized: cubic-bezier(0.22, 1, 0.36, 1)`, `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` defined in `tokens.css`.
- Exemplar: `#cloudflare-auth-modal:not(.hidden) > div` at `styles.css:1069` which uses `animation: authModalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;`.
- Reduced-motion: `styles.css:710` sets `animation-duration: 0.01ms !important;` for `prefers-reduced-motion: reduce`.

## Steps

1. Open `styles.css`.
2. Locate the section after `#cloudflare-auth-modal` modal styling (approx line 1072).
3. Add `@keyframes drawerBackdropFade`, `@keyframes drawerSlideLeft`, `@keyframes drawerSlideBottom`, and `@keyframes drawerScaleDesktop`.
4. Add selectors `#mobile-menu-drawer:not(.hidden)` and `#global-filter-drawer:not(.hidden)` with backdrop fade.
5. Add child selectors `#mobile-menu-drawer:not(.hidden) > div` and `#global-filter-drawer:not(.hidden) > div` with slide keyframes.
6. Run `npm test` and `npm run build` to verify zero regression.

## Boundaries

- Do NOT remove or modify `.hidden` class logic in `app.js` or `index.html`.
- Do NOT touch existing event handlers (`window.openModalById`, `window.closeModalById`, `window.toggleCatalogFilterDrawer`).
- Do NOT modify database schemas, API routes, or payment flows.
- Animate `transform` and `opacity` only; no animating `top`, `bottom`, `width`, or `height`.

## Verification

- **Mechanical**:
  - `npm test` (all 27 verification suites pass).
  - `npm run build` (Tailwind & Vite production build succeeds).
- **Feel check**:
  - Open mobile navigation: drawer glides smoothly from left edge (`translateX(-100%) → 0`).
  - Open filter drawer on mobile: drawer glides smoothly from bottom edge (`translateY(100%) → 0`).
  - Open filter drawer on desktop: drawer scales smoothly from center-bottom (`scale(0.96) → scale(1)`).
  - Rapidly tapping close/open preserves clean state without flickering.
  - With `prefers-reduced-motion: reduce`, animations instantly resolve without motion.
- **Done when**: Drawers enter with physical momentum, tests remain 100% green, and build completes cleanly.
