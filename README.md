# Vistāra Krafts (@resin.art.memories) — Bespoke E-Commerce Storefront

[![Site Status](https://img.shields.io/badge/status-production--ready-emerald?style=for-the-badge)](https://vistara-krafts.vercel.app/)
[![Verification Suite](https://img.shields.io/badge/tests-25%2F25%20passing-brightgreen?style=for-the-badge)](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/verify-storefront.mjs)
[![Database](https://img.shields.io/badge/database-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Storage](https://img.shields.io/badge/storage-Cloudinary%20CDN-3448C5?style=for-the-badge&logo=cloudinary)](https://cloudinary.com/)
[![DPDP Act 2023](https://img.shields.io/badge/compliance-DPDP%20Act%202023%20Verified-blue?style=for-the-badge)](#digital-personal-data-protection-dpdp-act-2023)

> **Official E-Commerce Storefront for Vistāra Krafts Studio & Chemical Atelier (`@resin.art.memories`) and POTRY Contemporary Ceramics.**  
> Handcrafted bridal varmala preservation blocks, optical UV-stabilized casting resins (3:1, 2:1, 1:1), and bespoke ceramic homeware with Pan-India express delivery.

---

## 🏛️ Executive Summary & Core Philosophy

Vistāra Krafts is engineered to an **"Apple, Elevated"** aesthetic standard:
- **Classic Architectural Restraint:** Deep visual hierarchy, mathematical spacing, editorial typography (Playfair Display paired with Inter), and warm glassmorphic depth (`#faf8f5` warm alabaster canvas, `#031a38` naval authority, and `#b08d57` antique brass accents).
- **Kinetic Discipline (60fps–120fps):** Interactive 3D floating liquid resin specimen orb with concentric rotating orbital rings, spring-physics modals (`cubic-bezier(0.16, 1, 0.3, 1)`), and zero layout thrashing on low-end devices.
- **Zero Admin UI Leakage:** This repository is 100% dedicated to customer shopping, product exploration, bespoke calculators, and secure ordering. The administrative inventory panel is completely decoupled and pushes changes directly to the shared Supabase PostgreSQL database.

---

## ⚡ Key Highlights & Core Features

### 1. Two-Part Authentication & Curation Flow
- **Part 1 (Credentials Only):** Seamless login and registration via Supabase Auth (Email & Password, 1-Click Google OAuth account chooser, or Apple ID). No disruptive gender questions in the first part.
- **Part 2 (Curation Step):** Once authenticated, the user is presented with **"Curate Your Studio Feed"**:
  - `👔 Male`: Curated for Him (Executive desk keepsakes, geometric blocks, watches & masculine gifts).
  - `🌸 Female`: Curated for Her (Bridal varmala floral blocks, botanical trays, and rose quartz geode wall art).
  - **No "Universal" Button:** The word "Universal" is never displayed as an option. If dismissed or closed (`✕` or "Skip for Now"), the feed silently defaults to balanced universal curation.

### 2. Desktop (PC) & Mobile Viewport Choreography
- **Desktop (>= 768px):** 
  - **Left Side:** The clean, warm alabaster login and curation form (`order-1`, `md:w-7/12`).
  - **Right Side:** The interactive **Vistāra Krafts 3D Liquid Resin Animation Showcase** (`order-2`, `md:w-5/12`) featuring the 140px liquid resin sphere, counter-rotating brass orbital rings, atelier tagline, and Pan-India tracking badges.
- **Mobile (< 768px):** Single-column layout with the centered glowing specimen orb at the top, followed by the credentials form and curation step.

### 3. Interactive Resin Pour Calculator
- Accurately computes exact resin and hardener mixing requirements by weight (grams) and volume (ml) for **3:1 Casting Epoxy**, **2:1 Deep Pour River Epoxy**, and **1:1 Doming & Coating Epoxy**.
- Computes rectangular, cylindrical, and custom mould volumes with real-time wastage allowance.

### 4. 2-Step Checkout & Address Persistence
- **Step 1:** Customer signs in (or creates an account).
- **Step 2:** Fast shipping address entry with 6-digit Indian PIN code delivery verification via BlueDart/Delhivery.
- Automatically merges guest wishlists and bag items into the authenticated customer account upon login.

### 5. Digital Personal Data Protection (DPDP) Act 2023 Compliance
- Built-in consent banner, granular consent preference manager, statutory rights portal (Section 11 instant JSON data export, Section 12 instant erasure, Section 13 7-day grievance resolution SLA), and Section 9 age declaration verification.

### 6. Full SEO, GEO & AEO Discovery Engine
- Rich Schema.org JSON-LD `@graph` (`OnlineStore`, `LocalBusiness`, `Product`, `BreadcrumbList`).
- Verified geo-targeting for Bengaluru studio and Pan-India delivery.
- AI discovery files [`llms.txt`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/llms.txt) and [`llms-full.txt`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/llms-full.txt) for LLM search indexing.

---

## 🛠️ Tech Stack & Ecosystem

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | HTML5 Semantic Shell, Vanilla ES Modules, Vite 5 |
| **Styling Engine** | Tailwind CSS CDN + W3C Design Tokens ([`tokens.css`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/tokens.css), [`styles.css`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/styles.css)) |
| **Typography** | Playfair Display (Headlines/Editorial) + Inter (Body/Data) + Material Symbols Outlined |
| **State & Storage Bridge** | [`store-bridge.js`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/store-bridge.js) with resilient In-Memory proxy + LocalStorage fallbacks |
| **Database & Auth** | Supabase (PostgreSQL 15+ with Row-Level Security & Supabase Auth) |
| **Media Storage & CDN** | Cloudinary (Responsive image delivery, `f_auto,q_auto,w_800` transforms & unsigned upload) |
| **Testing Suite** | Automated verification runner ([`verify-storefront.mjs`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/verify-storefront.mjs)) with 25 test suites |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js `v20+` or `v22+`
- Google Chrome (installed at default path for headless test execution)

### 1. Clone & Install
```bash
git clone https://github.com/abhieee-java/vistara-krafts.git
cd vistara-krafts
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
# Server will start on http://localhost:3000
```

### 3. Run Automated Verification Test Suite
```bash
npm test
# Executes all 25 test suites in verify-storefront.mjs
```

---

## ⚡ Supabase & Cloudinary Production Setup

The platform uses **Supabase** for its PostgreSQL database and authentication, and **Cloudinary** for image storage and CDN delivery.

### 1. Supabase PostgreSQL Schema & Auth Setup
1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase Dashboard, navigate to **SQL Editor**.
3. Open [`supabase/schema.sql`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/supabase/schema.sql) and run the script. This creates:
   - `public.profiles` with `gender_preference` ('masculine' | 'feminine' | 'universal')
   - `public.products` (seeded with all 12 flagship SKUs)
   - `public.orders`, `public.inventory_logs`, `public.payments`, `public.settings`, `public.coupons`, `public.custom_mockups`, `public.dpdp_consents`
   - Row Level Security (RLS) policies and triggers (`on_auth_user_created`, `handle_updated_at`)
   - Realtime publication `supabase_realtime`
4. Copy your project URL (`https://xyz.supabase.co`) and Anon Key from **Project Settings > API**.
5. Configure [`supabase-config.js`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/supabase-config.js):
   ```javascript
   window.SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
   window.SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```

### 2. Cloudinary Media Storage Setup
1. Create an account at [cloudinary.com](https://cloudinary.com).
2. Create an **unsigned upload preset** named `vistara_products` (or your choice) under **Settings > Upload > Upload Presets**.
3. In [`cloudinary-config.js`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/cloudinary-config.js), set:
   ```javascript
   window.CLOUDINARY_CLOUD_NAME = 'your-cloud-name';
   window.CLOUDINARY_UPLOAD_PRESET = 'vistara_products';
   ```
4. All product images utilize automatic format (`f_auto`), quality compression (`q_auto`), and responsive width scaling (`w_800`).

For step-by-step handover instructions and credential replacement, see [`handoff.md`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/handoff.md).

---

## 📚 Complete Project Documentation Suite

- [`AGENTS.md`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/AGENTS.md) — Directives, constraints, and operating instructions for AI assistants.
- [`project_context.md`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/project_context.md) — In-depth brand identity, catalogue domain, and revenue model.
- [`architecture.md`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/architecture.md) — Complete system architecture, data flows, and state machines.
- [`decisions.md`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/decisions.md) — Architectural Decision Records (ADRs) explaining all design choices.
- [`roadmap.md`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/roadmap.md) — Strategic phases, past milestones, and future deliverables.
- [`tasks.md`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/tasks.md) — Detailed task execution breakdown and status ledger.
- [`changelog.md`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/changelog.md) — Chronological history of releases, features, and fixes.
- [`testing.md`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/testing.md) — Detailed guide to the 25 automated test suites in `verify-storefront.mjs`.
- [`security.md`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/security.md) — Security specifications, DPDP compliance, and encryption standards.
- [`known_issues.md`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/known_issues.md) — Edge cases, browser behaviors, and performance watch-points.
- [`handoff.md`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/handoff.md) — Complete client & developer handoff runbook.

---

## 📄 License & Intellectual Property

Copyright © 2026 **Vistāra Krafts Studio & Chemical Atelier** (`@resin.art.memories`).  
All rights reserved. Designed and developed by Antigravity.
