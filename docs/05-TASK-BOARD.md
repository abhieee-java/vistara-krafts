# Implementation Task Board: Orders UX Elevation, Post-Payment Reassurance & Admin Live Sync

| Task ID | Title | Component | Dependencies | Status | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-101** | Fix Supabase Admin Auth Expiry & Auto-Extension | Supabase Database | None | **COMPLETED** | Session tokens valid for 30 days; `get_admin_orders` & `get_customer_directory` auto-extend active tokens. |
| **TSK-102** | Admin Portal Auth & Live Data Sync Repair | `vistara-krafts-admin` | TSK-101 | **READY** | Orders and Customers stream live from Supabase into Admin Dashboard with zero silent failures. |
| **TSK-103** | Fail-Safe Razorpay Post-Payment Reassurance Engine | `store-bridge.js` & `app.js` | None | **READY** | Immediate cart clear and direct navigation to `#/orders` upon payment; zero re-opening of checkout modal; background verification. |
| **TSK-104** | Apple-Elevated Orders Page UX & Hierarchy Redesign | `app.js` (`renderOrdersView`) | None | **READY** | Clean visual hierarchy; zero techno-babble ("Oracle/Studio Batch"); clean status pills; elegant 4-stage stepper; zero raw SKUs or fake tracking IDs. |
| **TSK-105** | Luxury Checkout Interface Elevation | `index.html` & `app.js` | None | **READY** | High-craft glassmorphic modal; 256-bit SSL trust badges; frictionless address entry; magnetic Pay CTA. |
| **TSK-106** | End-to-End Localhost Testing & Visual Verification | Storefront & Admin | TSK-101..105 | **READY** | Verified on localhost via Chrome DevTools MCP & full test suite with zero regressions. |
