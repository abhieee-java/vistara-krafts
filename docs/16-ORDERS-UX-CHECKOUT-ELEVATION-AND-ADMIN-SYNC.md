# Architecture & Discovery Specification: Orders UX Elevation, Post-Payment Reassurance & Admin Portal Live Sync

## Executive Summary & Mission Charter
- **Charter:** Elevate the customer Orders experience to "Apple, Elevated" standards, eliminate confusing post-payment redirects in Razorpay checkout, make the checkout interface genuinely luxurious, and restore live customer order and user account streaming to the Admin Portal.
- **Authority:** Human Chief Architect / CTO
- **Scope:** 
  1. **Storefront Orders Page (`app.js`):** Redesign `renderOrdersView` to eliminate techno-babble ("Oracle Batch Allocated", raw internal Razorpay IDs as tracking numbers, consumer-facing SKUs, redundant badge chips), enforce crystal-clear typographic hierarchy, compact progress stages, and elegant status visualization.
  2. **Storefront Checkout & Post-Payment Flow (`app.js`, `store-bridge.js`):** Make the checkout modal sleek, luxurious, and friction-free. Ensure that upon Razorpay payment capture, the checkout modal is permanently closed, cart is cleared, and the customer is immediately and reassuringly transitioned to `#/orders` with their new order highlighted. Use background asynchronous processing for Supabase synchronization and edge payment verification so customers never experience payment fear or loop back to checkout.
  3. **Admin Portal Synchronization (`vistara-krafts-admin` & Supabase):** Resolve the session token expiration in `public.admin_auth`, extend session validity from 24h to 30 days, ensure `get_admin_orders` and `get_customer_directory` auto-extend active tokens, provide graceful re-authentication handling, and verify customer orders and accounts stream live into the Admin dashboard.

---

## 1. Deep Root Cause Analysis

### Problem 1: Orders Page Visual Clutter & Broken Hierarchy
- **Observed Symptoms:**
  - Order card displays technical artifacts such as `"Order Confirmed • Studio Batch Allocated"` (misread by users as "Oracle Batch Allocated").
  - Order card shows `"Shipped via BlueDart Priority Air • Tracking ID: order_01JtbQubclaePz"` immediately after payment, using internal Razorpay Order IDs as "tracking numbers" before physical dispatch.
  - Line items display repetitive and redundant metadata chips: raw developer SKUs (`SKU: VK-ACC-SML-FLWR-03`), duplicated color/shape tags, and cluttered packaging labels.
  - Awkward vertical spacing where secondary technical badges overpower order totals and delivery dates.
- **Root Cause:**
  - `store-bridge.js` automatically set `status` to `'Order Confirmed • Studio Batch Allocated'` and assigned `tracking_number = rzpOrder.id` (or `order.id`).
  - `app.js`'s `renderOrdersView` rendered the tracking banner whenever `ord.trackingNumber` existed, regardless of whether the order was actually shipped.
  - Tag chips for color, shape, and size were rendered in addition to the variant label, producing three rows of redundant pills.

### Problem 2: Post-Payment Loop Back to Checkout Modal
- **Observed Symptoms:**
  - User completes payment in Razorpay test mode (e.g., NetBanking or UPI). After the payment is captured, the site re-displays the checkout modal as if payment had failed or was incomplete.
- **Root Cause:**
  - In `store-bridge.js` (`placeOrderAsync`), when Razorpay modal completes via bank redirect or standard dismissal, `options.modal.ondismiss` can trigger in tandem with modal closing.
  - If `options.handler` takes time to perform synchronous `/api/verify-payment` over mobile networks or if `ondismiss` fires first, the promise resolves `{ success: false, cancelled: true }`.
  - In `app.js` (`submitCheckoutOrder`), any non-success result executes:
    ```javascript
    if (modal) modal.classList.remove('hidden');
    syncBodyModalLock();
    window.showToast('Payment Processing Notice', res.message);
    ```
    This forcibly re-opens the checkout modal on a customer who just parted with money!
  - Furthermore, for NetBanking or external UPI app redirects, the page undergoes full navigation without a designated `callback_url` or client redirect reconciliation handler, causing the browser to boot back into an unfinalized cart state.

### Problem 3: Admin Portal Not Showing Customer Orders or Accounts
- **Observed Symptoms:**
  - The Admin Portal displays `0 Orders` and `0 Customers`, despite 251 orders existing in Supabase PostgreSQL.
- **Root Cause:**
  - The PostgreSQL RPC functions `get_admin_orders` and `get_customer_directory` enforce:
    ```sql
    IF NOT public.is_admin() AND NOT EXISTS (
      SELECT 1 FROM public.admin_auth 
      WHERE username = 'owner' 
        AND session_token IS NOT NULL 
        AND session_token = p_token 
        AND (session_expires_at IS NULL OR session_expires_at > now())
    ) THEN
      RAISE EXCEPTION 'Access Denied: Valid administrator token required.';
    END IF;
    ```
  - The owner's session token was set to expire in 24 hours (`now() + interval '24 hours'`), and expired on `2026-11-16 14:24:01+00`.
  - Once expired, both RPCs threw `P0001: Access Denied: Valid administrator token required.`
  - The fallback queries (`supabase.from('orders').select('*')` and `supabase.from('profiles').select('*')`) execute with the public anon key. Because Row Level Security (RLS) restricts access to `is_admin()`, Supabase returns an empty set `[]`.
  - In the admin frontend, `authService.getStoredSession()` did not check expiration, leaving the interface in a zombie authenticated state where all database requests silently fail.

---

## 2. Engineering Architecture & Solutions

### A. Apple-Elevated Orders View Architecture
- **Visual Rhythm:** 24px rhythm matching the rest of the application.
- **Order Header:**
  - Order Number: `#VK-2026-5460` in clear monospace/tabular numerals.
  - Order Date: e.g., `17 Nov 2026`.
  - Status Pill: Clean semantic color coding:
    - `Confirmed & Prepping` (Emerald/Amber clean pill, zero techno-babble).
    - `In Studio Production` (Refined bronze/gold pill).
    - `Dispatched` (Clean royal sapphire pill).
    - `Delivered` (Crisp forest emerald pill).
  - Prominent Total: Clear font-serif display numeral (`₹298`).
- **Compact Progress Stepper:**
  - 4 clean dots/bars: `Order Placed` → `Crafting` → `Dispatched` → `Delivered`.
  - Subtle 2px connecting bar with active progress indicator.
- **Clean Item Row:**
  - High-res square product thumbnail (`w-14 h-14 rounded-xl border border-[#e4e0d8]`).
  - Clear Product Name (`font-bold text-primary text-sm`).
  - Single consolidated metadata line: e.g. `Qty: 1 • Soft Lilac • Pack of 50`.
  - Item Price (`₹298`).
  - No developer SKUs, no triple-redundant tag pills.
- **Card Footer:**
  - Left: Clean payment badge (`Paid via UPI/NetBanking • 18% GST Invoice`).
  - Right: Actions: `View Invoice` (receipt modal) and `Buy Again` (re-adds to cart).
  - Only show shipping tracking when `orderStatus === 'shipped'` or `'delivered'` with a validated courier AWB!

### B. Fail-Safe Background Post-Payment & Reassurance Engine
- **Atomic State Protection in `store-bridge.js`:**
  - Set `paymentConfirmed = true` as soon as Razorpay's `handler(response)` receives `response.razorpay_payment_id`.
  - Guard `modal.ondismiss`: If `paymentConfirmed` is true, ignore dismissal and proceed with order finalization.
  - **Immediate Local State Commitment:** Instantly record the order in local Store with `payment_status: 'paid'`, `order_status: 'confirmed'`, and `paymentMethod: 'Razorpay Instant'`.
  - **Immediate Cart Clearance:** Call `Store.clearCart()` and `Store.clearCheckoutDraft()` immediately.
  - **Immediate UI Transition:** Close `checkout-modal` permanently (`window.closeModalById('checkout-modal')`), dismiss `payment-processing-modal`, and call `window.navigateTo('orders')` with toast reassurance (`Order Confirmed!`).
  - **Background Edge Reconciliation:** Fire `/api/verify-payment` and Supabase order update in the background with automatic retries. If the client network drops, the customer is already safely viewing their order in "My Orders", and the server-side webhook/background worker reconciles Supabase automatically.

### C. Luxurious Checkout Interface Redesign
- Elevate `checkout-modal`:
  - Glassmorphic backdrop (`backdrop-blur-2xl bg-black/40`).
  - Clear 2-column desktop / stacked mobile hierarchy.
  - Order Summary card on top with clear item thumbnails, subtotal, discount, 18% GST breakdown, and total.
  - Clean delivery address input cards with auto-capitalized names and Indian PIN code validation.
  - Razorpay 256-Bit SSL trust badge with instant payment method icons (UPI, GPay, PhonePe, Paytm, Cards, NetBanking).
  - Tactile Primary Action button: `Pay ₹Total Securely` with spring press physics and specular shimmer.

### D. Admin Portal Authentication & Database Synchronization
- **Database RPC Update:**
  - Extend session validity in `verify_admin_login` to **30 days** (`now() + interval '30 days'`).
  - Update `get_admin_orders` and `get_customer_directory` to auto-extend session expiration whenever called with a valid owner token:
    ```sql
    UPDATE public.admin_auth 
    SET session_expires_at = now() + interval '30 days'
    WHERE username = 'owner' AND session_token = p_token;
    ```
- **Admin Frontend Resilience (`vistara-krafts-admin`):**
  - Update `authService.ts`: Detect expired session tokens; redirect to `/login` with friendly prompt if session is invalidated.
  - Update `orderService.ts` & `customerService.ts`: Pass stored session token reliably; remove over-filtering that hides real orders; format customer metrics accurately.
