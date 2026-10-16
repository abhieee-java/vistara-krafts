# KNOWN ISSUES & RUNTIME SAFEGUARDS — VISTĀRA KRAFTS

> **Document Status:** Active Engineering Invariant Ledger  
> **Last Audited:** October 2026  
> **Architecture Scope:** Client Storefront SPA (`index.html`, `app.js`, `styles.css`, `store-bridge.js`), Cloudflare D1/Pages Functions, and Automated Quality Gates  

---

## 1. Executive Summary & Severity Taxonomy

This document catalogs known edge cases, browser-specific nuances, CSS specificity traps, runtime environment variations, and deliberate architectural constraints across the **Vistāra Krafts** luxury e-commerce platform.

Each issue is classified under our four-tier severity standard:

| Severity | Definition | Operational Response |
| :--- | :--- | :--- |
| **P1 — Critical** | Blocks user transactions, authentication, or checkout pipeline. | Immediate hotfix; blocks CI/CD deployment. |
| **P2 — Major** | Degrades visual fidelity, accessibility, or core interactive features on specific platforms. | Mitigated via defensive code; scheduled for permanent fix. |
| **P3 — Minor** | Edge case affecting niche browser configurations or non-critical cosmetic transitions. | Hardened with fallbacks; monitored via synthetic logging. |
| **P4 — Architectural Invariant** | Deliberate design or business choices frequently mistaken for issues. | Documented as immutable business constraints. |

---

## 2. Active & Mitigated Issues Matrix

| Issue ID | Severity | Status | Component | Summary |
| :--- | :--- | :--- | :--- | :--- |
| `ISS-001` | **P2** | **Resolved** | `styles.css` | CSS Specificity Trap: `.hidden !important` suppressing `md:flex` desktop showcase. |
| `ISS-002` | **P2** | **Mitigated** | `store-bridge.js` | Safari Private Browsing & Sandboxed `<iframe>` `localStorage` SecurityError. |
| `ISS-003` | **P3** | **Mitigated** | `verify-storefront.mjs` | Headless Chrome CDP viewport dimension desynchronization (800×600 default). |
| `ISS-004` | **P3** | **Mitigated** | `app.js` / Auth API | In-App Social Browser (Instagram/FB WebView) OAuth popup suppression. |
| `ISS-005` | **P3** | **Mitigated** | `app.js` / Cloudflare D1 | Edge Network Cold-Start Query Latency vs Optimistic Local Mock Sync. |
| `ISS-006` | **P3** | **Mitigated** | `index.html` / `styles.css` | iOS Mobile Safari Dynamic Viewport Height (`100vh` bottom clipping). |
| `ISS-007` | **P2** | **Mitigated** | `store-bridge.js` | Web Crypto API (`crypto.subtle`) unavailability in non-secure HTTP origins. |
| `ISS-008` | **P4** | **By Design** | `index.html` / Auth Modal | Complete omission of "Universal" curation button from all UI views. |
| `ISS-009` | **P4** | **By Design** | Whole Codebase | Zero administrative panel or CMS UI presence in storefront repo. |
| `ISS-010` | **P4** | **By Design** | `index.html` / Auth Modal | Two-part authentication sequencing (Credentials in Stage 1; Gender in Stage 2). |

---

## 3. Deep Technical Post-Mortems & Hardened Mitigations

### ISS-001: CSS Specificity Trap — `.hidden { display: none !important; }` vs Tailwind Responsive `md:flex`

- **Affected Files:** [`styles.css`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/styles.css), [`index.html`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/index.html)
- **Severity:** P2 (Major)
- **Impact:** On desktop screens (`>= 768px`), the right-hand side 3D resin animation showcase (`#auth-modal-showcase`) remained completely invisible.
- **Root Cause Analysis:**
  To guarantee modal backdrop and alert suppression when toggling classes, `styles.css` defined:
  ```css
  .hidden {
    display: none !important;
  }
  ```
  In Tailwind CSS v4, responsive utility variants like `hidden md:flex` work by generating media queries without `!important`:
  ```css
  @media (min-width: 768px) {
    .md\:flex {
      display: flex;
    }
  }
  ```
  Because the utility class `.hidden` carried `!important`, CSS cascade rules dictated that `display: none !important` permanently overpowered `display: flex`, leaving the desktop showcase suppressed regardless of viewport width.
- **Permanent Solution:**
  1. Preserved `.hidden !important` for defensive utility isolation across the rest of the application.
  2. Created a dedicated CSS class `.auth-desktop-showcase` in [`styles.css`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/styles.css):
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
  3. Applied `.auth-desktop-showcase` to `#auth-modal-showcase` in [`index.html`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/index.html).
- **Verification Rule:** `Suite 18` in `verify-storefront.mjs` verifies `getComputedStyle(showcase).display === 'flex'` at `1440×900` and `none` at `390×844`.

---

### ISS-002: Sandboxed Iframe & Safari Private Browsing `localStorage` Access Denial

- **Affected Files:** [`store-bridge.js`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/store-bridge.js)
- **Severity:** P2 (Major)
- **Impact:** In Safari Private Browsing, iOS WebViews with restrictive storage policies, or cross-origin `<iframe>` embeds, reading or writing to `window.localStorage` throws a fatal `SecurityError: The operation is insecure` or `QuotaExceededError`, crashing vanilla JavaScript SPAs.
- **Root Cause Analysis:**
  Modern privacy-centric browsers disallow access to persistent client storage rather than returning `null`. Direct calls such as `localStorage.setItem('vk_cart', ...)` result in unhandled exceptions that halt script execution.
- **Hardened Mitigation:**
  `store-bridge.js` implements a resilient `SafeStorage` wrapper that intercepts all persistent storage operations:
  ```javascript
  const SafeStorage = (function() {
    let memoryStore = {};
    let isStorageAvailable = false;

    try {
      const testKey = '__vk_storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      isStorageAvailable = true;
    } catch (e) {
      console.warn('[Vistāra SafeStorage] Persistent localStorage unavailable. Falling back to in-memory proxy.', e);
      isStorageAvailable = false;
    }

    return {
      getItem(key) {
        if (isStorageAvailable) {
          try { return window.localStorage.getItem(key); } catch (e) {}
        }
        return memoryStore.hasOwnProperty(key) ? memoryStore[key] : null;
      },
      setItem(key, value) {
        const valStr = String(value);
        if (isStorageAvailable) {
          try {
            window.localStorage.setItem(key, valStr);
            return;
          } catch (e) {
            console.warn('[Vistāra SafeStorage] Write failed, falling back to memoryStore.', e);
          }
        }
        memoryStore[key] = valStr;
      },
      removeItem(key) {
        if (isStorageAvailable) {
          try { window.localStorage.removeItem(key); } catch (e) {}
        }
        delete memoryStore[key];
      }
    };
  })();
  ```
- **Verification Rule:** Verified in automated testing by mocking `window.localStorage` throwing `SecurityError` during cart and authentication updates.

---

### ISS-003: Headless Chrome CDP Viewport Dimension Desynchronization

- **Affected Files:** [`verify-storefront.mjs`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/verify-storefront.mjs)
- **Severity:** P3 (Minor / Testing Nuance)
- **Impact:** During automated headless Chrome testing via Chrome DevTools Protocol (CDP), media query assertions (e.g. testing desktop login split layout) failed because headless Chrome defaulted to `800×600` instead of a modern desktop viewport.
- **Root Cause Analysis:**
  Headless Chromium launched via CLI (`chrome --headless=new --remote-debugging-port=9222`) defaults to an arbitrary window dimension unless explicitly configured with `--window-size` and CDP `Emulation.setDeviceMetricsOverride`.
- **Hardened Mitigation:**
  In `verify-storefront.mjs`, all viewport-dependent test suites invoke an explicit CDP viewport setup helper before asserting layout geometry:
  ```javascript
  async function setViewport(client, width, height, isMobile = false) {
    await client.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile,
      fitWindow: false
    });
    await new Promise(r => setTimeout(r, 150)); // Allow layout reflow
  }
  ```
  - Mobile tests execute under `390×844` (`mobile: true`).
  - Desktop tests execute under `1440×900` (`mobile: false`).

---

### ISS-004: In-App Social Browser (Instagram/FB WebView) OAuth Popup Suppression

- **Affected Files:** [`index.html`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/index.html), [`app.js`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/app.js)
- **Severity:** P3 (Minor)
- **Impact:** Customers clicking Instagram bio links (`@resin.art.memories`) who click "Continue with Google" or "Sign in with Apple" may experience silent failures because in-app WebViews aggressively block `window.open()` popups.
- **Root Cause Analysis:**
  Social apps sandbox their internal WebViews (`FBAN`, `FBAV`, `Instagram`) to prevent external link hijacking, blocking popup windows or dropping cross-origin communication (`postMessage`).
- **Hardened Mitigation:**
  1. `app.js` inspects `navigator.userAgent` for `Instagram`, `FBAN`, or `FBAV`.
  2. If detected, OAuth buttons bypass popup-based authentication and execute a full-page top-level navigation redirect:
     ```javascript
     window.location.href = `/api/auth/oauth-redirect?provider=${provider}&return_url=${encodeURIComponent(window.location.href)}`;
     ```
  3. A helpful notification banner is rendered advising customers: *"For the best experience with Apple/Google login, tap ⋮ and choose 'Open in Chrome/Safari'"*.

---

### ISS-005: Cloudflare D1 Cold-Start Query Latency vs Optimistic Local Mock Sync

- **Affected Files:** [`store-bridge.js`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/store-bridge.js), [`app.js`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/app.js)
- **Severity:** P3 (Minor)
- **Impact:** In local mock mode, auth and cart updates take `< 2ms`. Over the Cloudflare Edge network, initial cold-start queries to D1 can take 35–65ms. If a user double-clicks the "Sign In" button, duplicate requests could be dispatched.
- **Hardened Mitigation:**
  All form buttons implement atomic single-flight locking:
  1. Upon click, the submit button is immediately assigned `disabled = true` and `aria-busy = "true"`.
  2. The button label is replaced with an inline animated SVG spinner.
  3. Debounce timeout (400ms) prevents rapid multi-taps.
  4. The lock is released only in the `finally {}` block of the API promise.

---

### ISS-006: iOS Mobile Safari Dynamic Viewport Height (`100vh` Bottom Clipping)

- **Affected Files:** [`styles.css`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/styles.css), [`index.html`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/index.html)
- **Severity:** P3 (Minor)
- **Impact:** On iOS Mobile Safari, when the bottom URL bar expands or contracts, modals styled with `height: 100vh` have their bottom action buttons clipped under the browser navigation bar.
- **Root Cause Analysis:**
  CSS standard `100vh` represents the maximum viewport height assuming address bars are hidden. When address bars appear, the visible area is smaller than `100vh`.
- **Hardened Mitigation:**
  1. Modal containers use dynamic viewport units: `h-[100dvh]` with fallback to `100vh`.
  2. Inner modal content is constrained to `max-h-[85dvh]` with `overflow-y: auto` and `-webkit-overflow-scrolling: touch;`.
  3. Added `overscroll-behavior-y: contain;` to prevent rubber-band background scrolling while inside modals.

---

### ISS-007: Web Crypto API (`crypto.subtle`) Unavailability in Non-Secure HTTP Origins

- **Affected Files:** [`store-bridge.js`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/store-bridge.js)
- **Severity:** P2 (Major)
- **Impact:** Client-side PBKDF2 password derivation (50,000 iterations) relies on `window.crypto.subtle`. Browsers strictly disable `crypto.subtle` in insecure contexts (`http://`), except on `localhost`.
- **Hardened Mitigation:**
  1. Production domain [`https://vistarakrafts.com`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/index.html) enforces HTTP-to-HTTPS redirect at Cloudflare Edge with HSTS preloaded (`max-age=63072000; includeSubDomains; preload`).
  2. In local test environments running over raw IP addresses (`http://192.168.x.x`), `store-bridge.js` detects `!window.crypto?.subtle` and falls back to a clean deterministic SHA-256 fallback with console security warning for developer visibility.

---

## 4. Architectural Invariants (Deliberate Client Mandates)

These items represent explicit design decisions commanded by the product owner. Under no circumstances should they be "fixed" or altered:

### ISS-008: Complete Omission of "Universal" from the User Interface
- **Mandate:** The user must NEVER see a button, radio option, pill, or text labeled "Universal".
- **Implementation:** The Stage 2 Personalization modal presents strictly two choices: **Curated for Him** and **Curated for Her**.
- **Behavior:** If a user dismisses the modal or closes the window without making a selection, the system silently sets the persona profile to `universal` in the database. The feed reflects universal collections without advertising the label.

### ISS-009: Zero Administrative Panel or CMS UI in This Codebase
- **Mandate:** This repository is strictly a customer-facing luxury storefront. No `/admin` route, admin login, CMS forms, or product creation tools may exist here.
- **Implementation:** Admin operations are completely decoupled into an external management repository. That external service writes to the shared Cloudflare D1 database and R2 media bucket. The storefront operates purely as a high-speed reflection of that data.

### ISS-010: Two-Part Authentication Sequencing
- **Mandate:** Gender/curation preference must never be asked during initial sign-in.
- **Implementation:**
  - **Part 1:** Credentials only (Email, Password, Name, or Social OAuth).
  - **Part 2:** Only appears AFTER successful account creation. Collects "For Him" or "For Her" feed preference. Includes a clean Skip / Close trigger.

---

## 5. Engineering Triage & Reporting Runbook

When a new anomaly is discovered:
1. **Reproduce & Isolate:** Test across desktop (`1440px`) and mobile (`390px`) viewports.
2. **Check Invariant List:** Ensure the observed behavior is not governed by `ISS-008`, `ISS-009`, or `ISS-010`.
3. **Execute Verification Suite:** Run `node verify-storefront.mjs` to check if an existing assertion catches it.
4. **Log with Invariant Number:** Follow the `ISS-XXX` taxonomy in this document.
