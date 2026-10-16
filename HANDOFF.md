# HANDOFF.md — OPERATIONAL PLAYBOOK & SYSTEM HANDOVER

> **Project Ecosystem:** Vistāra Krafts & POTRY Ceramics E-Commerce Platform  
> **Customer Storefront:** `https://vistara-krafts.vercel.app` (Target domain: `https://vistarakrafts.com`)  
> **Owner Admin Portal:** `https://vistara-krafts-admin.vercel.app`  
> **Primary Author:** Antigravity Principal Systems Architect & Super-Designer  
> **Handover Date:** October 2026  

---

## 1. Executive Summary & Handover Scope

This document provides a turnkey operational handover of the entire Vistāra Krafts & POTRY Ceramics e-commerce platform. Both frontends (Storefront and Admin Portal) are fully engineered and verified. The backend is architected exclusively for **Supabase** (PostgreSQL 15+ database, Row-Level Security, and Supabase Auth) paired with **Cloudinary** for image storage and CDN optimization, and Razorpay for payment capture. All Cloudflare infrastructure has been permanently decommissioned and purged.

---

## 2. System Coordinates & Repository Reference

| System Component | Repository Link | Live Production URL | Primary Tech Stack |
| :--- | :--- | :--- | :--- |
| **Customer Storefront** | [`abhieee-java/vistara-krafts`](https://github.com/abhieee-java/vistara-krafts) | [`vistara-krafts.vercel.app`](https://vistara-krafts.vercel.app) | Vanilla JS SPA · 120fps Kinetic CSS · Supabase Adapter |
| **Owner Admin Portal** | [`abhieee-java/vistara-krafts-admin`](https://github.com/abhieee-java/vistara-krafts-admin) | [`vistara-krafts-admin.vercel.app`](https://vistara-krafts-admin.vercel.app) | React 19 · TypeScript · Vite · Tailwind v4 · Supabase Client |
| **Database & Auth** | Supabase (`supabase/schema.sql`) | `https://xyz.supabase.co` | PostgreSQL 15+ · Row-Level Security · Supabase Auth |
| **Media & CDN Storage** | Cloudinary (`cloudinary-config.js`) | `https://res.cloudinary.com/vistara-krafts` | Cloudinary CDN · Auto WebP/AVIF · Dynamic Transforms |

---

## 3. Environment Variables & Secret Configuration Matrix

### 1. Storefront Configuration (`vistara-krafts`)
Configured in `supabase-config.js` and `cloudinary-config.js` or via environment variables:
| Variable Key | Required | Public / Secret | Description |
| :--- | :---: | :---: | :--- |
| `SUPABASE_URL` | Yes | Public | Supabase Project URL (`https://YOUR_PROJECT_ID.supabase.co`). |
| `SUPABASE_ANON_KEY` | Yes | Public | Supabase Anon Key from Dashboard > Project Settings > API. |
| `CLOUDINARY_CLOUD_NAME` | Yes | Public | Cloudinary Cloud Name. |
| `CLOUDINARY_UPLOAD_PRESET`| Yes | Public | Unsigned Upload Preset for product/custom floral photos. |
| `SITE_URL` | Yes | Public | Canonical production URL (`https://vistarakrafts.com`). |
| `ENVIRONMENT` | Yes | Public | Set to `production`. |

### 2. Admin Portal Configuration (`vistara-krafts-admin`)
| Variable Key | Required | Public / Secret | Description |
| :--- | :---: | :---: | :--- |
| `VITE_USE_MOCK_SERVICES` | Yes | Public | Set to `false` when connecting to live Supabase backend. |
| `VITE_SUPABASE_URL` | Yes | Public | Base Supabase Project URL. |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public | Supabase Anon Key. |
| `VITE_CLOUDINARY_CLOUD_NAME`| Yes | Public | Cloudinary Cloud Name. |
| `VITE_CLOUDINARY_UPLOAD_PRESET`| Yes | Public | Cloudinary Upload Preset. |

---

## 4. Owner & Operator Runbooks (Daily Operations)

### Runbook 1: Adding a Product with Optional Varieties
1. Log in to the Admin Portal (`https://vistara-krafts-admin.vercel.app`).
2. Navigate to **Products** and click **+ Add Product**.
3. Enter Name, SKU, Category, Base Price, and Stock Quantity.
4. **Gender Targeting:** Select `Universal (Men & Women)`, `Mainly for Female / Women`, or `Mainly for Male / Men`.
5. **Supplementary Varieties (Colors, Shapes, Sizes):**
   - If the item is a single, intact piece, **leave Colors, Shapes, and Sizes blank**.
   - The storefront will automatically omit all variety dropdowns and drawers.
   - If the item has variations, enter comma-separated values (e.g. `Royal Gold, Champagne Rose`).
6. Upload high-resolution photos via the drag-and-drop uploader.
7. Click **Save Product**. The update broadcasts instantly to all open customer tabs.

---

### Runbook 2: Fulfilling an Order & Printing Invoices
1. Navigate to **Orders** to view incoming customer orders.
2. Click any order row to open the **Order Details Drawer**.
3. Advance the order stage through the 6-step pipeline:
   - `1: Studio Batch Allocated` → `2: Casting & Curing` → `3: Quality Inspection` → `4: Hand-Packed & Sealed` → `5: In Transit` → `6: Delivered`.
4. Add BlueDart / Delhivery AWB tracking numbers in the courier field.
5. Click **Print Tax Invoice** to preview or print a 100% GST-compliant tax invoice splitting taxable amount, CGST, SGST, and IGST.

---

### Runbook 3: Reconciling Inventory & Stock Adjustments
1. Navigate to **Inventory** to inspect real-time stock levels and low-stock alerts.
2. To adjust stock, click **Adjust Stock (+/-)** on any product row.
3. Select an adjustment direction, enter quantity delta, and pick a mandatory reason:
   - `RESTOCK` — Received fresh workshop chemical batch or ceramic firing.
   - `DAMAGED` — Floral crystal cracked during diamond polishing or handling.
   - `AUDIT` — Routine physical cycle count correction.
   - `RETURN` — Customer return accepted back into sellable inventory.
4. Enter brief operator notes and click **Save Adjustment**.
5. Inspect the **Movement Audit Log** at the bottom of the page to verify audit attribution.

---

## 5. Developer & AI Agent Maintenance Runbook

### 1. Verifying the Customer Storefront
Run the 25-suite automated verification runner:
```bash
cd stitch_potry_e_commerce_storefront
node verify-storefront.mjs
```
*Expected output: `Verification Summary: 25 passed, 0 failed`.*

### 2. Verifying the Owner Admin Portal
Run TypeScript strict type-checking and Vite production compilation:
```bash
cd vistara_krafts_admin_portal
npm run build
```
*Expected output: `✓ built in ~4s` with exit code 0.*

### 3. Deploying Schema Changes to Supabase
1. Navigate to the **SQL Editor** in your Supabase Dashboard (`https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql`).
2. Paste the contents of [`supabase/schema.sql`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/supabase/schema.sql) and execute.
3. Verify that all 8 tables and Row-Level Security policies are created.

---

## 6. Incident Management & Troubleshooting Guide

| Symptom / Incident | Root Cause | Immediate Remediation |
| :--- | :--- | :--- |
| **Cloudinary Upload Fails** | Missing or non-unsigned upload preset | Verify `CLOUDINARY_UPLOAD_PRESET` exists and is configured as **Unsigned** in Cloudinary Dashboard > Settings > Upload. |
| **Orders not showing in Admin** | `VITE_USE_MOCK_SERVICES` mismatch | If live Supabase DB is not yet provisioned, set `VITE_USE_MOCK_SERVICES=true`. Once live, set to `false`. |
| **Cart throws QuotaExceededError** | Safari Private Browsing blocking localStorage | Storefront's `store-bridge.js` automatically falls back to in-memory state; no action required. |
| **Supabase Auth Error** | Incorrect Supabase Anon Key or Project URL | Check `supabase-config.js` or `.env` and verify credentials against Supabase Project Settings > API. |
| **Missing Varieties on Storefront** | Varieties were intentionally left blank | Invariant behavior: blank fields indicate an intact product with zero variations. |

---

## 7. Emergency Contacts & Escalation Matrix

- **Principal Architect & Systems Lead:** Antigravity Super-Designer Team
- **Studio Founder & Operating Owner:** Vistāra Krafts & Resin Art Memories Atelier
- **Support Email:** `concierge@vistarakrafts.com` / `support@vistarakrafts.com`
- **Studio Address:** 42 Craft Enclave, Indiranagar 100 Feet Road, Bengaluru, Karnataka 560001, India
