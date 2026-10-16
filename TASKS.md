# TASKS.md — WORK BREAKDOWN STRUCTURE & ROADMAP

> **Project Ecosystem:** Vistāra Krafts & POTRY Ceramics E-Commerce Platform  
> **Customer Storefront:** `https://vistara-krafts.vercel.app` (Custom domain: `https://vistarakrafts.com`)  
> **Owner Admin Portal:** `https://vistara-krafts-admin.vercel.app`  
> **Last Updated:** October 2026  

---

## 1. Project Task Board & Status Matrix

| Sprint | Objective / Domain | Storefront | Admin Portal | Database / Storage | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Sprint 1** | Brand System, Visual Tokens & Responsive Storefront Foundation | ✅ Done | — | — | **Completed** |
| **Sprint 2** | Interactive Pour Calculator, DPDP Compliance & Cart Volume Pricing | ✅ Done | — | — | **Completed** |
| **Sprint 3** | Pure Customer-Facing Architecture, In-Memory Fallbacks & Local Emulation | ✅ Done | — | ✅ Done | **Completed** |
| **Sprint 4** | Owner Admin Portal (Dashboard, Products, Inventory, Orders, CRM, Invoices) | — | ✅ Done | — | **Completed** |
| **Sprint 5** | Supplementary Varieties (Colors/Shapes/Sizes) & Gender Targeting Engine | ✅ Done | ✅ Done | ✅ Done | **Completed** |
| **Sprint 6** | Awwwards SOTD Polish, Zero-Leakage Audit, 25/25 Tests & Vercel Deployments | ✅ Done | ✅ Done | — | **Completed** |
| **Sprint 7** | Complete Migration to Supabase (PostgreSQL 15+ & Auth) and Cloudinary Storage | ✅ Done | ✅ Done | ✅ Done | **Completed** |
| **Sprint 8** | WhatsApp Notifications, BlueDart AWB Logistics API & B2B Wholesale | ⚪ Backlog | ⚪ Backlog | ⚪ Backlog | **Backlog** |

---

## 2. Completed Milestones (Compilation of Delivered Work)

### 1. Customer Storefront (`stitch_potry_e_commerce_storefront`)
- [x] **Brand Token System:** Engineered 60/30/10 warm alabaster palette (`#faf8f5`, `#031a38`, `#b08d57`) across `tokens.css` and `styles.css`.
- [x] **12 Flagship Products:** Structured complete specifications for 12 master items across Resin Art Memories, Vistāra Krafts, and POTRY.
- [x] **Epoxy Pour Calculator:** Developed real-time volume math for 3:1 casting, 2:1 deep pour, 1:1 topcoat, and UV fast cure resin.
- [x] **DPDP Act 2023 Consent Banner:** Implemented explicit privacy compliance banner with session memory and transparent policy links.
- [x] **Indian PIN Code Validation:** Added 6-digit PIN validation regex (`^[1-9][0-9]{5}$`) across checkout and delivery estimators.
- [x] **Two-Part Authentication & Curation Flow:**
  - Part 1: Email/Password, 1-Click Google OAuth, Apple ID.
  - Part 2: Feed Personalization with `👔 Male` and `🌸 Female` options.
  - Zero "Universal" button rule strictly enforced; dismissing defaults silently to universal.
- [x] **3D Liquid Resin Animation Showcase:**
  - Desktop: Split two-column modal with interactive 140px liquid resin sphere and concentric golden orbit rings.
  - Mobile: Clean vertical stack hiding heavy desktop shaders.
- [x] **Cart & Volume Pricing Engine:** Real-time volume tier discounts (3+ units: 5%, 5+ units: 10%, 10+ units: 15%), GST calculation, and coupon validation.
- [x] **Awwwards SOTD Kinetic Micro-Interactions:** Magnetic hover cursor, 3D card tilt, specimen loupe, before/after slider, and zero audio e-commerce interactions.
- [x] **Automated 25-Suite Test Runner:** `verify-storefront.mjs` verifying 100% empty state, router safety, volume pricing, and responsive viewports (320px–1920px).
- [x] **Live Vercel Production Deployment:** Successfully deployed and verified at `https://vistara-krafts.vercel.app`.

---

### 2. Owner Admin Portal (`vistara_krafts_admin_portal`)
- [x] **Executive Dashboard:** Real-time revenue metrics (today, weekly, monthly), order breakdown badges, inventory health alerts, customer growth charts, and recent activity feed.
- [x] **Comprehensive Product Management (CRUD):**
  - Add, edit, duplicate, search, and filter catalog items.
  - Support for images, category, subcategory, brand, SKU, prices, compare-at prices, discount, and status.
- [x] **Supplementary Product Varieties (Colors, Shapes, Sizes):**
  - Optional inputs for Colors, Shapes, and Sizes.
  - **Blank = None:** If left blank, product stays intact with no forced variety selectors on the storefront.
  - Comma-separated input parser translating text to structured options.
- [x] **Gender Targeting Selector:**
  - `✨ Universal (Men & Women)` (Default)
  - `🌸 Mainly for Female / Women`
  - `👔 Mainly for Male / Men`
  - Subtle visual badges rendered in product list table and mobile cards.
- [x] **Inventory Control & Movement Ledger:**
  - Current, available, and reserved stock tracking.
  - Stock adjustment modal (+/-) requiring mandatory reason codes (`RESTOCK`, `DAMAGED`, `AUDIT`, `RETURN`, `SALE`) and operator notes.
  - Audit trail logging every movement with timestamp and admin attribution.
- [x] **Order Fulfillment Pipeline & GST Invoices:**
  - Stage-based pipeline: `1: Studio Batch Allocated` → `2: Casting & Curing` → `3: Quality Inspection` → `4: Hand-Packed & Sealed` → `5: In Transit` → `6: Delivered`.
  - Slide-over order detail drawer with complete customer info, items list, and tracking updates.
  - GST-compliant invoice generation modal with printable layout and tax split (CGST + SGST / IGST).
- [x] **Customer Relationship Management (CRM):** Customer directory with total spent, order history, contact details, and VIP patron loyalty tiers.
- [x] **Cloudflare R2 Media Upload Simulator:** Drag-and-drop image uploader with MIME validation (`image/jpeg`, `image/png`, `image/webp`) and file size limits (5MB max).
- [x] **Razorpay Payment Ledger:** Transaction log tracking payment IDs, order IDs, capture statuses, and simulated refund workflows.
- [x] **System Health Telemetry Screen:** Edge latency monitor, D1 binding status, KV cache hits, and sync status.
- [x] **Real-Time Studio Drop Sync:** Integrates browser `BroadcastChannel('RAM_STUDIO_LIVE_DROP_CHANNEL')` to publish live drops to open customer tabs.
- [x] **Live Vercel Production Deployment:** Successfully deployed and verified at `https://vistara-krafts-admin.vercel.app`.

---

## 3. Delivered Migration: Supabase & Cloudinary (Sprint 7)

```markdown
### Phase 1: Supabase PostgreSQL 15+ Schema & Security
- [x] Task 7.1: Authored production-ready PostgreSQL schema in `supabase/schema.sql` spanning 8 tables:
  - `public.profiles`, `public.products`, `public.orders`, `public.inventory_logs`, `public.payments`, `public.settings`, `public.coupons`, `public.custom_mockups`, `public.dpdp_consents`.
- [x] Task 7.2: Configured Row Level Security (RLS) policies on all tables.
- [x] Task 7.3: Added `on_auth_user_created` trigger for automated patron profile provisioning.
- [x] Task 7.4: Enabled `supabase_realtime` publication for live inventory and drop updates.
- [x] Task 7.5: Seeded 12 flagship catalog products with complete specs, variants, and pricing parity.

### Phase 2: Supabase Client & Auth Integration
- [x] Task 7.6: Created `supabase-config.js` and `supabase-client.js` with client bridging, password sign-up/sign-in, 1-click OAuth, and persona curation updates.
- [x] Task 7.7: Ensured Two-Part Auth sequence (Credentials in Part 1; Male/Female curation in Part 2; Universal silent default) is preserved.

### Phase 3: Cloudinary Media Storage
- [x] Task 7.8: Created `cloudinary-config.js` with responsive URL optimization (`f_auto,q_auto,w_800`).
- [x] Task 7.9: Added client-side unsigned upload adapter for product images and bespoke bridal floral photos.

### Phase 4: Complete Cloudflare Purge
- [x] Task 7.10: Deleted remote Cloudflare Pages projects `vistara-krafts` and `vistara-krafts-admin`.
- [x] Task 7.11: Deleted remote Cloudflare D1 databases `vistara_krafts_db` and `vistara_kraft_db`.
- [x] Task 7.12: Purged local `wrangler.toml`, `cloudflare-config.js`, `CLOUDFLARE_SETUP.md`, `cloudflare/`, and `functions/`.

### Phase 5: Verification & Testing
- [x] Task 7.13: Updated automated test suite in `verify-storefront.mjs` to test Supabase PostgreSQL schema, Auth, and Cloudinary media adapter.
- [x] Task 7.14: Achieved 100% pass rate: 25 passed, 0 failed.
```

---

## 4. Backlog & Post-Launch Tasks (Sprint 8)

```markdown
- [ ] Task 8.1: Real-time WhatsApp order tracking updates via Gupshup / Twilio API.
- [ ] Task 8.2: Automated BlueDart / Delhivery AWB label printing API integration.
- [ ] Task 8.3: Multi-currency currency converter (USD, GBP, AED) for international NRI bridal clientele.
- [ ] Task 8.4: B2B Wholesale inquiry portal and tiered pricing for professional resin artists.
- [ ] Task 8.5: Automated abandoned cart recovery emails.
```
