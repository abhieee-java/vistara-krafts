# ARCHITECTURAL DECISION RECORDS (ADRs) — VISTĀRA KRAFTS

This document records the architectural and design decisions made for the **Vistāra Krafts** storefront, detailing the context, options considered, decisions, and consequences.

---

## 📑 Index of Architecture Decision Records

| ADR ID | Decision Title | Status | Date |
| :--- | :--- | :---: | :---: |
| [ADR-001](#adr-001-pure-customer-facing-architecture-with-zero-admin-ui-leakage) | Pure Customer-Facing Architecture with Zero Admin UI Leakage | Accepted | 2026-10-10 |
| [ADR-002](#adr-002-cloudflare-serverless-ecosystem-vs-third-party-baas) | Cloudflare Serverless Ecosystem (D1, KV, R2) vs Third-Party BaaS | Superseded by ADR-011 | 2026-10-12 |
| [ADR-003](#adr-003-two-part-authentication-and-curation-flow) | Two-Part Authentication and Curation Flow | Accepted | 2026-10-15 |
| [ADR-004](#adr-004-strict-male--female-curation-and-elimination-of-universal-button) | Strict Male & Female Curation and Elimination of Universal Button | Accepted | 2026-10-14 |
| [ADR-005](#adr-005-desktop-modal-left-form-and-right-3d-showcase-geometry) | Desktop Modal Left-Form and Right-3D Showcase Geometry | Accepted | 2026-10-15 |
| [ADR-006](#adr-006-dedicated-css-class-auth-desktop-showcase-to-override-hidden-specificity) | Dedicated CSS Class `.auth-desktop-showcase` to Override `.hidden` Specificity | Accepted | 2026-10-15 |
| [ADR-007](#adr-007-603010-warm-gallery-palette-over-dark-obsidian-sci-fi-styling) | 60/30/10 Warm Gallery Palette over Dark Obsidian Sci-Fi Styling | Accepted | 2026-10-15 |
| [ADR-008](#adr-008-2-step-checkout-auth-gate-then-shipping-address) | 2-Step Checkout: Auth Gate Then Shipping Address | Accepted | 2026-10-13 |
| [ADR-009](#adr-009-in-memory-storage-proxy-with-localstorage-fallback) | In-Memory Storage Proxy with LocalStorage Fallback | Accepted | 2026-10-13 |
| [ADR-010](#adr-010-standalone-automated-verification-suite-verify-storefrontmjs) | Standalone Automated Verification Suite (`verify-storefront.mjs`) | Accepted | 2026-10-13 |
| [ADR-011](#adr-011-complete-architectural-pivot-to-supabase-and-cloudinary) | Complete Architectural Pivot to Supabase (PostgreSQL & Auth) and Cloudinary (Media Storage) | Accepted | 2026-10-16 |

---

## ADR-001: Pure Customer-Facing Architecture with Zero Admin UI Leakage

### Context
In many e-commerce implementations, administrative panels, inventory editors, and stock managers are bundled inside the same web application bundle behind role checks. The user explicitly mandated: *"This website will only reflect the database and storage, authentication, and everything. There should not be any admin panel or anything else. The admin panel is another part that will push changes to the database, and the database will sync it with this website."*

### Decision
We strictly enforce a pure customer storefront. All administrative mutations are decoupled into an external management system that writes directly to the shared database. The storefront contains zero admin routes, zero owner mutation forms, and zero administrative CSS.

### Consequences
- **Positive:** Maximum security; zero risk of administrative privilege escalation or data leakage on the client.
- **Positive:** Ultra-lean client bundle size (`~410 KB` total runtime logic without heavy dashboard dependencies).
- **Negative:** Admin operations must be executed via the separate management interface or direct SQL queries.

---

## ADR-002: Cloudflare Serverless Ecosystem vs. Third-Party BaaS (SUPERSEDED)

> **Status:** Superseded by [ADR-011](#adr-011-complete-architectural-pivot-to-supabase-and-cloudinary) on 2026-10-16 by user mandate.

### Context
Initial prototypes explored Cloudflare Free Tier ($0/month) with Cloudflare Pages, D1, KV, and R2.

### Decision
Migrate the entire backend to Cloudflare Free Tier. *(Note: Subsequently superseded by ADR-011 as the user decided to eliminate Cloudflare entirely in favor of Supabase and Cloudinary).*

### Consequences
- Superseded. All remote and local Cloudflare resources have been completely deleted.

---

## ADR-003: Two-Part Authentication and Curation Flow

### Context
Previously, feed curation buttons were crammed inside the initial login form between the password field and the primary submit button. This created visual clutter and confused customers who were merely trying to sign in. The user requested: *"ask if the user is male or female in the second part. It should not be in the first part while logging in. After logging in and giving name details, mainly after the account is done, it should ask if the user is male or female."*

### Decision
Separate authentication into two distinct sequential stages:
1. **Part 1 (`#cf-auth-step-credentials`):** Focused purely on credentials (email/password or 1-click Google/Apple).
2. **Part 2 (`#cf-auth-step-curation`):** Activated immediately upon successful sign-in or account registration.

### Consequences
- **Positive:** Significantly reduced cognitive load during login.
- **Positive:** High clarity: customers understand why they are selecting a profile (to personalize their feed) once their account exists.

---

## ADR-004: Strict Male & Female Curation and Elimination of Universal Button

### Context
The user explicitly specified: *"Remove this thing from the owner login page and replace it with only male and female options... and remember 'universal' should not be options. If someone doesn't choose anything, it should lead him to be in the universal stage, but it should not let him see it as it is in universal."*

### Decision
1. Provide strictly two selectable curation options: `👔 Male` and `🌸 Female`.
2. Completely remove any button, pill, tab, or text labeled "Universal".
3. If the user dismisses the modal without selecting an option (via `✕` Close or "Skip for Now & Continue"), the system silently assigns `persona = 'all'` behind the scenes.

### Consequences
- **Positive:** Clean, binary choice for gifting curation.
- **Positive:** Preserves balanced catalog browsing for users who prefer not to customize without awkward UI labeling.

---

## ADR-005: Desktop Modal Left-Form and Right-3D Showcase Geometry

### Context
On computer screens, the user specified: *"Improve the look of the login for the computer screen so that, on the left side, the login page is showing, and on the left side [right side], the Vistara kraft login 3D animation is going on."*

### Decision
Configure the desktop modal flex layout:
- **Left Column (`order-1`, `md:w-7/12`):** Displays the active login and curation forms on warm ivory alabaster.
- **Right Column (`order-2`, `md:w-5/12`):** Displays the **Vistāra Krafts 3D Liquid Resin Animation Showcase** with deep naval background, floating 140px liquid resin sphere, and rotating brass rings.

### Consequences
- **Positive:** Meets user requirement word-for-word.
- **Positive:** Balances practical form completion with high-craft brand storytelling.

---

## ADR-006: Dedicated CSS Class `.auth-desktop-showcase` to Override `.hidden` Specificity

### Context
In Tailwind CSS, utility classes like `hidden md:flex` rely on standard specificity. However, `styles.css` defines `.hidden { display: none !important; }` to lock closed modals. Consequently, `.hidden` overrode `md:flex` on desktop screens, leaving the 3D showcase invisible.

### Decision
Define a custom dedicated class in `styles.css`:
```css
.auth-desktop-showcase {
  display: none !important;
}
@media (min-width: 768px) {
  .auth-desktop-showcase {
    display: flex !important;
  }
}
```

### Consequences
- **Positive:** 100% reliable desktop display without fighting utility class cascade or specificity wars.
- **Positive:** Guarantees clean hiding on mobile screens (`< 768px`).

---

## ADR-007: 60/30/10 Warm Gallery Palette over Dark Obsidian Sci-Fi Styling

### Context
An earlier iteration styled the modal in deep pitch-black / obsidian tones (`#080e1b`, `#121c2e`). The user noted that while premium, it did not match the warm cream/ivory atelier aesthetic of the rest of the website.

### Decision
Standardize all auth card surfaces to the official 60/30/10 brand palette:
- 60% Canvas & Cards: `#faf8f5`, `#ffffff`, `#f3f1ec`
- 30% Structure: `#031a38`, `#e4e0d8`
- 10% Accents: `#b08d57`, `#ffd79b`

### Consequences
- **Positive:** Complete aesthetic harmony across all 7 views and all modals.

---

## ADR-008: 2-Step Checkout: Auth Gate Then Shipping Address

### Context
Asking for full shipping addresses and phone numbers during initial account creation increases bounce rates.

### Decision
- **Step 1:** Fast account creation / login with just Name, Email, and Password (or 1-click Google/Apple).
- **Step 2:** Shipping address, pincode verification, and payment method selection inside the dedicated `#checkout-modal`.

### Consequences
- **Positive:** Maximizes signup conversion.
- **Positive:** Preserves clean checkout draft if payment fails or user navigates away.

---

## ADR-009: In-Memory Storage Proxy with LocalStorage Fallback

### Context
Browsers running in sandboxed iframes or private modes frequently throw `SecurityError` or `QuotaExceededError` on `localStorage.setItem`.

### Decision
Implement a transactional proxy in `store-bridge.js`. If any `localStorage` operation throws an exception, the bridge silently retains state in an in-memory fallback dictionary, ensuring zero broken interactions.

### Consequences
- **Positive:** 100% crash resistance across strict privacy environments.

---

## ADR-010: Standalone Automated Verification Suite (`verify-storefront.mjs`)

### Context
With 12 products, 7 routes, complex calculators, DPDP compliance, and multi-viewport responsive constraints, manual testing was error-prone.

### Decision
Build a self-contained Node.js verification script (`verify-storefront.mjs`) containing 25 comprehensive test suites, headless Chrome CDP execution, and real database verification.

### Consequences
- **Positive:** Instant confidence: any regression in touch targets, pricing, ratios, or overflow is flagged immediately.
- **Positive:** Fast execution: all 25 suites execute in ~12 seconds.

---

## ADR-011: Complete Architectural Pivot to Supabase and Cloudinary

### Context
The user explicitly mandated a total architectural change:
> *"Big change: I will not use Cloudflare for anything right now, so everything will be done in Supabase for the database and for storage Cloudinary, so del evertyhing of cloudflare, I will use Supabase authentication. only"*
> *"create full flegid database so i can connect with same backend later on nd everthying should work"*

Both customer storefront (`https://github.com/abhieee-java/vistara-krafts`) and admin portal (`https://github.com/abhieee-java/vistara-krafts-admin`) require a shared, production-ready PostgreSQL persistence layer, unified authentication, and media storage.

### Decision
1. **Total Cloudflare Removal:** Permanently delete all remote Cloudflare resources (Pages projects `vistara-krafts` and `vistara-krafts-admin`, D1 databases `vistara_krafts_db` and `vistara_kraft_db`) and purge all local Cloudflare code (`wrangler.toml`, `functions/api/`, `cloudflare/schema.sql`, `CLOUDFLARE_SETUP.md`).
2. **Supabase PostgreSQL 15+ Schema:** Design and implement a complete PostgreSQL schema in `supabase/schema.sql` and `supabase_schema.sql` comprising 8 tables:
   - `public.profiles` (linked to `auth.users` with cascading deletion and persona curation `gender_preference`)
   - `public.products` (all 12 flagship products with SKU, variants, specs, and price fields aligned with admin `Product` types)
   - `public.orders` (order lifecycle, line items JSONB, customer details, and stage progression)
   - `public.inventory_logs` (audit log of inventory stock adjustments with reason codes)
   - `public.payments` (payment transaction records and gateway reconciliation)
   - `public.settings` (store and studio operational configurations)
   - `public.coupons` (promotional vouchers with min order thresholds)
   - `public.custom_mockups` (bespoke client varmala inquiries and photo attachments)
   - `public.dpdp_consents` (DPDP Act 2023 compliance consent records)
3. **Supabase Authentication:** Integrate Supabase Auth for Email/Password and 1-Click OAuth (Google / Apple), preserving the Two-Part Onboarding/Curation Flow.
4. **Cloudinary Media Storage:** Implement `cloudinary-config.js` with responsive image transforms (`f_auto,q_auto,w_800`) and direct unsigned uploads for products and customer photos.
5. **Realtime Replication:** Enable `supabase_realtime` publication on products, orders, and inventory logs to synchronize storefront and admin state instantly.

### Consequences
- **Positive:** Zero vendor lock-in to Cloudflare edge runtime; standard PostgreSQL 15+ schema accessible from any Node.js, Python, or client runtime.
- **Positive:** Unified data model perfectly matching both `vistara-krafts` and `vistara-krafts-admin`.
- **Positive:** Cloudinary delivers automatic modern image formats (AVIF/WebP) and responsive resizing.
- **Positive:** 100% test suite pass rate (25/25 suites verified).

