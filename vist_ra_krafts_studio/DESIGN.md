---
name: Vistāra Krafts Studio
colors:
  surface: '#faf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#faf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeeb'
  surface-container-high: '#e9e8e5'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1a'
  on-surface-variant: '#44474e'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f1f1ee'
  outline: '#74777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#4c5f81'
  primary: '#031a38'
  on-primary: '#ffffff'
  primary-container: '#1b2f4e'
  on-primary-container: '#8497bc'
  inverse-primary: '#b4c7ee'
  secondary: '#775928'
  on-secondary: '#ffffff'
  secondary-container: '#ffd79b'
  on-secondary-container: '#7a5c2b'
  tertiary: '#0d1a30'
  on-tertiary: '#ffffff'
  tertiary-container: '#232f46'
  on-tertiary-container: '#8a97b2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b4c7ee'
  on-primary-fixed: '#041b3a'
  on-primary-fixed-variant: '#344767'
  secondary-fixed: '#ffdeae'
  secondary-fixed-dim: '#e8c086'
  on-secondary-fixed: '#281800'
  on-secondary-fixed-variant: '#5d4213'
  tertiary-fixed: '#d7e3ff'
  tertiary-fixed-dim: '#bac7e4'
  on-tertiary-fixed: '#0e1b31'
  on-tertiary-fixed-variant: '#3b475f'
  background: '#faf9f6'
  on-background: '#1a1c1a'
  surface-variant: '#e3e2e0'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  spec-numeral:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system embodies the disciplined elegance of an archival apothecary combined with the technical authority of an industrial chemical supplier. Serving discerning resin artists, boutique furniture crafters, and architectural artisans across India, the interface prioritizes clarity, tactile materiality, and structural reliability. 

The aesthetic is Modern Editorial Craftsmanship: quiet luxury expressed through generous breathing room, precise editorial typography, and disciplined Art Deco geometric line motifs (hairline brass accents, segmented metadata grids, and diamond framing glyphs). Visual density balances high-speed technical utility—such as batch numbers, mix ratios, and viscosity charts—with aspirational finished-work photography. Interactions must feel intentional, smooth, and grounded, evoking the measured precision of a clean, bubble-free chemical pour.

## Colors

The palette establishes high-contrast legibility against warm, mineral-tinted neutrals, completely avoiding cold clinical whites.

- **Primary (`#1B2F4E`)**: Deep Naval Slate. Used for core structural boundaries, primary buttons, major headings, and primary interactive states.
- **Deep Navy Accent (`#101D33`)**: Used for high-contrast hero modules, deep backdrop cards, and technical header toolbars.
- **Secondary (`#B08D57`)**: Antique Brass. Reserved strictly as a high-value accent: thin editorial hairline rules, pill status outlines, quality-mark badges, and deliberate hover indicators. It must never appear as a broad background flood.
- **Ivory Base (`#FBFAF7`)**: Canvas background. A warm, non-glare surface that softens visual fatigue during prolonged catalogue browsing.
- **Mist Surface (`#F1F3F5`)**: Used for product cards, tabular spec sheets, filter surfaces, and container layering.
- **Soft Navy (`#E8ECF2`)**: Applied to selected states, active chip fills, and subtle focus rings.
- **Typography**: Primary text renders at `#18212E` (exceeding WCAG AAA contrast against Ivory); supporting technical text and labels use `#667180`.
- **System States**: Success utilizes `#2E7D5B` (cured/in-stock), Warning utilizes `#B7791F` (short pot-life/low stock), and Error uses `#C0392B` (invalid ratio/out of stock). Hairline borders use `#E1E5EA`.

## Typography

Typography pairs the historic distinction of `Playfair Display` with the rigorous, clean utility of `Inter`. No other font families are permitted.

- **Headlines & Editorial Titles**: Rendered exclusively in `Playfair Display` (weights 600 and 700). Employ tight, deliberate tracking on larger display instances to emphasize refined precision.
- **Body & Interface Controls**: Governed by `Inter` across weights 400 (reading), 500 (interactive UI), and 600 (metadata titles and emphasis).
- **Tabular Figures for Pricing & Formulation Metrics**: All commercial prices (prefixed by Indian Rupee symbol: ₹) and resin metric tables (mix ratio, pot life, cure time, viscosity, pour depth) must declare CSS `font-variant-numeric: tabular-nums;`. This enforces rigid column alignment throughout inventory sheets and cart checkouts.
- **Labels & Micro-Accents**: Category badges and technical metadata keys use `Inter` 600, sized at 12px with uppercase transformation and a subtle `+0.04em` letter spacing.

## Layout & Spacing

The layout is constructed on an 8pt architectural rhythm, nested inside a responsive 12-column grid system designed for rapid scanning of catalogue density.

- **Grid Architecture**: 
  - **Desktop (≥1200px)**: 12-column fixed-max container (`1280px` maximum viewport width), `2rem` (32px) margins, and `1.5rem` (24px) gutters.
  - **Tablet (768px - 1199px)**: 8-column fluid grid, `1.5rem` (24px) gutters, and `1.5rem` margins.
  - **Mobile (<768px)**: 4-column fluid grid, `1rem` (16px) gutters, and `1rem` margins.
- **Visual Cadence**: Technical specifications and specification comparison tables collapse from horizontal multi-column cells into split paired rows on viewports under 768px, ensuring key properties remain side-by-side without horizontal scrolling.
- **Art Deco Grid Division**: Sections are divided by hairline `1px` borders using `#E1E5EA`, accented at quadrant intersections or title centers with subtle 4px diamond/rhombus brass markers (`#B08D57`).

## Elevation & Depth

Depth is established primarily through crisp chromatic layering, structural outlines, and restrained, ambient warm shadows rather than heavy blur techniques.

- **Base Elevation (Flat/Ground)**: The Ivory canvas (`#FBFAF7`) hosts surfaces layered with Mist (`#F1F3F5`) with a 1px border of `#E1E5EA`.
- **Card & Component Rest**: Surfaces use a subtle shadow: `0 1px 3px rgba(24, 33, 46, 0.04), 0 1px 2px rgba(24, 33, 46, 0.02)`.
- **Hover & Active States**: On interaction, cards elevate smoothly with an expanded ambient drop: `0 8px 24px -4px rgba(27, 47, 78, 0.08), 0 2px 6px -1px rgba(27, 47, 78, 0.04)`, alongside an intentional border transition from `#E1E5EA` to `#B08D57`.
- **Overlays & Modals**: Drawers, chemical safety spec sheets, and filter dialogs use Deep Navy backing scrims (`rgba(16, 29, 51, 0.6)`) paired with high-elevation dialog shadows: `0 20px 40px -8px rgba(16, 29, 51, 0.24)`.

## Shapes

The shape geometry maintains a structured, architectural baseline with selective radiuses applied to soften functional components.

- **Primary Containers & Cards**: Set to a standard `12px` corner radius, creating a modern, tailored silhouette that frames product renders and resin clarity swatches cleanly.
- **Buttons & Input Controls**: Standardized at an `8px` corner radius (`rounded-lg`), delivering a solid, dependable target for high-frequency purchasing.
- **Chips, Badges & Micro-Pills**: Set to full pill shape (`999px`) to immediately differentiate taxonomy, product tags, stock states, and ratio indicators from actionable structural cards.
- **Architectural Motif**: Geometric brass embellishments use 45-degree rotated squares (diamonds) to enforce the subtle Art Deco lineage.

## Components

### Buttons
- **Primary**: Solid Navy (`#1B2F4E`) fill, text in Ivory (`#FBFAF7`), 8px border-radius, minimum 44px tap target height. Hover shifts to Deep Navy (`#101D33`) with a crisp `0 2px 8px rgba(27, 47, 78, 0.2)` shadow. Focus rings are 2px solid Navy Soft (`#E8ECF2`) offset by 2px.
- **Secondary / Outlined**: 1px solid Navy (`#1B2F4E`), transparent fill, Navy text. Hover activates Navy Soft (`#E8ECF2`) background.
- **Accent Action**: Used sparingly for high-tier checkout or sample kit discovery. 1px solid Antique Brass (`#B08D57`) with Ivory fill, transitions to `#B08D57` fill with Ivory text on hover.

### Chips & Badges
- **Specification Pills**: Fully rounded (`999px`), padding `4px 12px`. Neutral state uses `#E8ECF2` with `#1B2F4E` text. 
- **Quality Badges**: Pill-shaped with a 1px border of Antique Brass (`#B08D57`), Ivory background, and 11px uppercase Inter typography.
- **Live Stock Alerts**: Pill-shaped using `#2E7D5B` background at 10% opacity, paired with a solid `#2E7D5B` status dot and text.

### Cards
- **Product Card**: Background in Mist (`#F1F3F5`), 12px border radius, encased in a 1px `#E1E5EA` border. Image container preserves a consistent 1:1 or 4:5 ratio on pure Ivory backgrounds. Price figures appear in `Inter` semi-bold tabular numerals (e.g., `₹2,450.00`).
- **Resin Specification Grid**: Nested within cards or product pages; an alternating two-tone tabular block detailing:
  - Mix Ratio (by weight/volume)
  - Pot Life (minutes @ 25°C)
  - Cure Time (demold vs. full cure)
  - Viscosity (cps)
  - Maximum Cast Depth (mm/inches)
  Data columns are separated by hairlines (`#E1E5EA`) and highlighted with tabular digits.

### Form Inputs & Selectors
- **Input Fields**: 8px radius, Mist (`#F1F3F5`) interior fill, 1px border (`#E1E5EA`). Active focus transitions the border to Navy (`#1B2F4E`) with a 0 0 0 1px Navy ring. Text at 15px `Inter`.
- **Checkboxes & Radios**: 4px radius for checkboxes, full circle for radios. Unchecked border in `#667180`. Checked state fills with Navy (`#1B2F4E`) and displays a clean white indicator.

### Pan-India Logistics Banner
- Dedicated utility bar anchored above headers or integrated in footers, utilizing Deep Navy (`#101D33`) with subtle brass rules (`#B08D57`) to communicate pin-code serviceability, safe solvent transport credentials, and real-time transit dispatch tracking.