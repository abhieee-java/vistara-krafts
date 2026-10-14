# Vistāra Krafts (VK) Animated Luxury Splash Screen Integration

An architectural blueprint for adding a high-precision, theme-integrated animated vector splash screen to the **@resin.art.memories × Vistāra Krafts Studio** storefront.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design decisions were confirmed by the user in Phase 1:

- **Confirmed Transition**: Automatic 3-second vector drawing & velvet fill sequence followed by a smooth 600ms fade-out transition into the storefront.
- **Confirmed Refresh Policy**: Triggers gracefully on every page load / refresh to present the brand sequence, with an instant bypass click option for fast navigation.
- **Confirmed Aesthetic Backdrop**: Centered alignment over a luxury glassmorphic translucent overlay (`backdrop-blur-2xl bg-surface/90`) matching the studio's optical resin aesthetic.
- **Code Optimization**: Includes bug fixes and keyframe alignment for SVG stroke animations, font preloading (`Cinzel`), and high-DPI scaling.

---

## 1. Overview & Core Concept

### What It Does
When a patron loads or refreshes the storefront, a full-viewport translucent overlay appears. The **Vistāra Krafts (VK)** vector emblem renders dynamically via CSS keyframe line-drawing animations:
1. **0.0s – 2.0s**: Upright square and 45° rotated interlock diamond stroke frames draw in smooth bezier curves.
2. **0.6s – 2.0s**: Architectural inner vertical and diagonal alignment lines draw across the emblem.
3. **1.1s – 2.0s**: All 10 precision geometric triangles and central serif monogram ("VK") fade in with a deep navy velvet radial sheen.
4. **2.0s – 2.8s**: The golden/navy "Vistāra Krafts" brand wordmark illuminates with subtle letter-spacing tracking.
5. **3.0s – 3.6s**: The splash container smoothly dissolves (`opacity: 0`, `pointer-events: none`), seamlessly revealing the active storefront hero and header without layout shifts.

### Target Audience & Persona
Bespoke bridal patrons, interior designers, and optical resin enthusiasts expecting a premium, Apple-grade atelier experience.

---

## 2. User Experience & Visual Design

### Key User Flow
```
┌─────────────────────────────────────────────────────────────┐
│ 1. Patron visits / refreshes page                             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Translucent Glassmorphic Overlay appears                 │
│    - Backdrop: backdrop-blur-2xl bg-[#faf8f5]/92 dark:bg-[#031a38]/95 │
│    - Focus: Centered 360px VK Vector Emblem                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Precision Vector Line-Drawing Sequence (3s total)        │
│    - Outer frames & inner stroke lines animate (vkDraw)     │
│    - Monogram & 10 filled triangles illuminate (vkFadeIn)  │
│    - "VISTĀRA KRAFTS" typography rules expand softly        │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Automatic after 3s OR click to skip)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Smooth Fade-Out & Full Interactive Storefront Unlocked  │
│    - Transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) │
│    - Main application interactive state fully operational   │
└─────────────────────────────────────────────────────────────┘
```

### Visual Identity & Token Alignment
- **Canvas Backdrop**: High-RT translucent surface using `--color-surface` with backdrop blur (`backdrop-blur-2xl bg-surface/92`).
- **Gradient Palette**: Metallic navy gradient (`#0d233a` → `#183757` → `#0a1c30`) paired with a subtle velvet radial fill (`#183757` → `#0d233a`).
- **Typography**: `Cinzel` serif display face preloaded via Google Fonts (`weights 600, 700`) with letter spacing `0.28em`.
- **Accessibility**: Includes `aria-hidden="true"` during animation, keyboard `Escape` bypass key, and `prefers-reduced-motion` fallbacks.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Pure SVG Keyframe Vector Drawing
- **Chosen Approach**: Native SVG gradients (`linearGradient` + `radialGradient`) paired with CSS keyframes (`stroke-dasharray` & `stroke-dashoffset`).
- **Why**: Zero external Lottie or video dependencies, ultra-lightweight (~3KB footprint), perfectly crisp on Retina 4K displays, and 60fps hardware accelerated.
- **Alternatives Considered**: Canvas or GIF animations (rejected due to blurriness and lack of crisp vector rendering).

### Decision 2: Non-Blocking Overlay & Fast Bypass
- **Chosen Approach**: Splash overlay is rendered as a fixed overlay (`fixed inset-0 z-50`). Clicking anywhere or hitting `Escape` instantly finishes the animation and hides the overlay.
- **Why**: Guarantees zero friction for repeat visitors or patrons in a hurry while keeping the elegant motion intact.

---

## 4. Technical Architecture & Data Strategy

### System Architecture & Layer Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              index.html                                 │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Google Fonts: Cinzel (700) + Playfair Display + Inter            │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ #vkSplashContainer (Fixed z-50, backdrop-blur-2xl, flex center)   │  │
│  │   ├── #vkLogoRoot (.vk-emblem-container.is-animated)              │  │
│  │   │     ├── <svg #vkSvgElement viewBox="0 0 600 600">             │  │
│  │   │     │     ├── <defs> Gradients (#vkNavyGradient, #vkNavyVelvet)│  │
│  │   │     │     ├── <g .vk-square-group>                            │  │
│  │   │     │     ├── <g .vk-diamond-group>                           │  │
│  │   │     │     ├── <g .vk-triangles-layer>                         │  │
│  │   │     │     └── <g .vk-monogram-group>                          │  │
│  │   │     └── #vkBrandTitleBlock ("VISTĀRA KRAFTS")                │  │
│  │   └── <button .vk-skip-btn> "Skip Intro →"                        │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              styles.css                                 │
│  ├── Splash container overlay styles & z-index management               │
│  ├── Cinzel font declarations & responsive SVG container sizing          │
│  ├── Keyframes: vkDraw (stroke-dashoffset), vkFadeIn (opacity)          │
│  └── Dark mode & prefers-reduced-motion CSS overrides                   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                app.js                                   │
│  ├── window.initVkSplashScreen() lifecycle controller                   │
│  ├── Auto-dismiss timer (3000ms duration)                               │
│  ├── Manual click & Escape key dismiss handlers                         │
│  └── Header logo click replay handler                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component & DOM Integration Plan
1. **`index.html`**:
   - Add `<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&display=swap" rel="stylesheet">` to head.
   - Insert `#vkSplashContainer` wrapper directly inside `<body>` before header.
   - Clean up SVG attributes, ensure exact path geometry, gradient IDs, and semantic ARIA attributes.
2. **`styles.css`**:
   - Define `.vk-emblem-container`, `.vk-svg-canvas`, stroke keyframes, and smooth transition utilities.
   - Handle mobile scaling down to 320px with `max-w-[85vw]`.
3. **`app.js`**:
   - Add `initVkSplashScreen()` function to handle auto-fade out after 3.0 seconds, body scroll lock, and skip handlers.
   - Add a subtle replay trigger on the header brand logo if patrons wish to re-watch the emblem animation.

---

## Verification & QA Strategy

1. **Compilation Check**: Run `compile_applet` to confirm no build issues.
2. **Automated Verification**: Update `verify-storefront.mjs` with a dedicated splash screen test to verify DOM presence, CSS keyframes, and auto-dismiss behavior.
3. **Visual Verification**: Confirm exact alignment of all 10 triangles, central monogram, stroke animations, and smooth fade-out.
