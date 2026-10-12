# Vistāra Krafts — Cloudflare Architecture & Credential Handover Guide

## 1. Do You Need to Buy Cloudflare Pro / Premium?
**No — you do NOT need to pay for Cloudflare Pro or Premium.**
Every single Cloudflare product used by **Vistāra Krafts** runs on the **100% Free Plan ($0/month)**, even when you buy your custom domain later and launch in production:

| Cloudflare Service | Purpose in Vistāra Krafts | Free Plan Allowance ($0/mo) | Paid Plan Needed? |
| :--- | :--- | :--- | :--- |
| **Cloudflare Pages** | Global CDN hosting + automatic GitHub deploys + Free SSL | **Unlimited** static requests & bandwidth | **No (Free)** |
| **Cloudflare Pages Functions / Workers** | `/api/auth/*` (Google, Apple, Email/Password + Address) & `/api/orders` | **100,000 requests / day** free | **No (Free)** |
| **Cloudflare D1** | Serverless SQL database for Users, Shipping Addresses, Sessions & Orders | **5 GB storage**, **5M reads/day**, **100K writes/day** | **No (Free)** |
| **Cloudflare KV** | Fast edge session token lookups & instant sign-out revocation | **100,000 reads/day**, **1,000 writes/day** | **No (Free)** |
| **Cloudflare R2** | Product images & customer varmala flower photo uploads | **10 GB/month** storage, **10M reads/mo**, **$0 egress** | **No (Free)** |
| **Cloudflare Turnstile** | Bot protection on Login & Order Checkout (CAPTCHA replacement) | **Unlimited** widgets & site verifications | **No (Free)** |

---

## 2. How Development vs. Client Production Credentials Work

Right now, the project is configured in **Development Mode** (`ACTIVE_ENV = 'development'` in [`cloudflare-config.js`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/cloudflare-config.js)):
- Uses Cloudflare Turnstile's official always-pass test key (`1x00000000000000000000AA`) so you can test locally on `localhost` without domain restrictions.
- Supports **Google**, **Apple**, and **Email + Password + Shipping Address** login out-of-the-box with automatic local + edge sync.
- Enforces **Guest Browsing + Login Gate on Ordering**: Visitors can browse the entire catalogue, use the Pour Calculator, view social reels, and add items to their Studio Bag without logging in. Only when they click **Proceed to Secure Checkout** or **Buy Now** does the app require them to sign in and provide their real shipping address (nothing is assumed or pre-filled with fake defaults).

### Swapping to Client Credentials When Shipping Later
When you are ready to hand over / ship with the client's account and custom domain:
1. Open [`cloudflare-config.js`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/cloudflare-config.js) and [`wrangler.toml`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/wrangler.toml).
2. Replace the placeholder values in the `production` block with the client's keys:
   - `CF_ACCOUNT_ID`: Client's Cloudflare Account ID
   - `CF_TURNSTILE_SITE_KEY`: Client's Turnstile Widget Site Key
   - `CF_GOOGLE_CLIENT_ID`: Client's Google Cloud OAuth 2.0 Web Client ID
   - `CF_APPLE_CLIENT_ID`: Client's Apple Developer Services ID
3. Initialize the client's Cloudflare D1 database:
   ```bash
   npx wrangler d1 create vistara_krafts_db
   npx wrangler d1 execute vistara_krafts_db --remote --file=./cloudflare/schema.sql
   ```
4. Set `ACTIVE_ENV = 'production'` in `cloudflare-config.js` and deploy via Cloudflare Pages or `npx wrangler pages deploy .`.
