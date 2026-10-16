# SYSTEM ARCHITECTURE — VISTĀRA KRAFTS

> **System Type:** Edge-First Full-Stack E-Commerce Storefront  
> **Client Framework:** Semantic HTML5 Shell + Vanilla ES Modules + Vite 5  
> **Edge Runtime:** Cloudflare Pages Functions (V8 Workers Runtime)  
> **Database:** Cloudflare D1 Serverless SQL (SQLite engine)  
> **Media & Storage:** Cloudflare R2 Object Storage (S3-compatible, $0 egress)  
> **Security & Bot Defense:** Cloudflare Turnstile + DPDP Act 2023 Consent Vault  

---

## 1. High-Level System Architecture Diagram

```mermaid
graph TD
    subgraph Client["Frontend Client (Browser / Mobile / Desktop)"]
        UI["index.html (Semantic Shell & Modals)"]
        Router["app.js (Hash-based SPA Router)"]
        Store["store-bridge.js (State Machine & Resilient Proxy)"]
        Tokens["tokens.css & styles.css (60/30/10 Gallery Design Tokens)"]
        UI <--> Router
        Router <--> Store
        UI --- Tokens
    end

    subgraph Edge["Cloudflare Edge Network (Global CDN & Workers)"]
        Pages["Cloudflare Pages (Static Global Edge CDN)"]
        Functions["functions/api/[[route]].js (Pages Function Edge API)"]
        Turnstile["Cloudflare Turnstile (Bot & Abuse Verification)"]
    end

    subgraph Storage["Cloudflare Edge Persistence ($0/mo Free Tier)"]
        D1[("Cloudflare D1 SQL Database<br/>users, sessions, orders")]
        KV[("Cloudflare KV Namespace<br/>Instant Token Revocation & Edge Sessions")]
        R2[("Cloudflare R2 Bucket<br/>Floral Photos & Product Media")]
    end

    subgraph External["External Services & Couriers"]
        GIS["Google Identity Services (OAuth 2.0)"]
        AppleAuth["Apple ID Sign In"]
        BlueDart["BlueDart / Delhivery (Express Shipping)"]
    end

    Client -->|"HTTPS / Fast Edge"| Pages
    Client -->|"REST API / Bearer Token"| Functions
    Client -->|"Bot Challenge Token"| Turnstile
    Functions -->|"SQL Queries / Prepared Statements"| D1
    Functions -->|"Session Lookups"| KV
    Functions -->|"Upload Floral Photos"| R2
    Client -.->|"1-Click Auth"| GIS
    Client -.->|"1-Click Auth"| AppleAuth
    Functions -.->|"Dispatch SLA Webhooks"| BlueDart
```

---

## 2. Core Architectural Subsystems

### A. Client-Side SPA Routing Engine (`app.js`)
The application operates on an ultra-lightweight, zero-framework hash router supporting 7 dedicated customer-facing routes:

```mermaid
stateDiagram-v2
    [*] --> Home: #/home or /
    Home --> Catalog: #/catalog
    Home --> PDP: #/product/:id
    Home --> CustomStudio: #/custom-studio
    Catalog --> PDP: Select SKU
    PDP --> Cart: Add to Bag (#/cart)
    CustomStudio --> Cart: Add Custom Pour to Bag
    Cart --> CheckoutModal: Proceed to Checkout
    CheckoutModal --> Account: Order Placed (#/account)
    Home --> Editorial: #/editorial (Brand Story)
    Home --> NotFound: Unknown route (#/404)
```

#### Route Definitions
1. `#/home` — Curated flagship hero, interactive specimen loupe, collection rails, and Feed Curation bar.
2. `#/catalog` — Full 12-item catalog with filtering by collection (Resin Keepsakes, Chemicals, Ceramics) and persona sorting (`gifts_him`, `gifts_her`, `gifting`, price).
3. `#/product/:id` — High-converting Product Detail Page (PDP) with multi-image gallery, volume tier pricing, stock levels, and resin technical specifications.
4. `#/custom-studio` — Interactive Resin Pour Calculator (Part B) and bespoke floral preservation quotation builder.
5. `#/cart` — Studio bag review, line-item quantity controls, coupon code validator (`KRAFTFIRST`), and volume discount breakdown.
6. `#/account` — Authenticated patron dashboard showing order tracking stages, GST invoice viewer, and DPDP personal data rights tools.
7. `#/editorial` — Chemical atelier heritage, HALS UV stabilization science, and POTRY ceramic craftsmanship story.

---

### B. Two-Part Authentication & Curation Flow

The sign-in experience is engineered into two discrete, uncrowded stages to maximize conversion and respect user context:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer
    participant Modal as #cloudflare-auth-modal
    participant App as app.js
    participant Edge as functions/api/[[route]].js
    participant D1 as Cloudflare D1

    Customer->>Modal: Clicks "Sign In" / "Create Account"
    Note over Modal: Part 1: Credentials Only (No gender questions)
    Customer->>Modal: Submits Email/Password or 1-Click Google/Apple
    Modal->>Edge: POST /api/auth/login or /api/auth/oauth
    Edge->>D1: Query / Insert into users table
    D1-->>Edge: Returns user record & session token
    Edge-->>App: HTTP 200 { valid: true, session, token }

    alt If triggered during checkout (pendingCheckoutAfterAuth = true)
        App->>Modal: Close modal immediately
        App->>Customer: Automatically opens Step 2 (#checkout-modal)
    else Standard login/registration
        App->>Modal: window.showAuthStep('curation')
        Note over Modal: Part 2: Curate Your Studio Feed
        Customer->>Modal: Selects "👔 Male" or "🌸 Female" (or clicks "✕" / "Skip")
        alt User selects Male
            Modal->>App: window.selectPersonaAndFinish('masculine')
            App->>App: Store.setPersonaPreference('masculine')
            App->>Customer: Toasts "Curated for Him 👔" & updates feed
        else User selects Female
            Modal->>App: window.selectPersonaAndFinish('feminine')
            App->>App: Store.setPersonaPreference('feminine')
            App->>Customer: Toasts "Curated for Her 🌸" & updates feed
        else User closes or skips
            Modal->>App: window.skipPersonaAndFinish()
            App->>App: Store.setPersonaPreference('all')
            App->>Customer: Closes modal with silent universal fallback
        end
    end
```

---

### C. Desktop Two-Stage Modal Architecture

On desktop screens (`>= 768px`), `#cloudflare-auth-modal` expands into an atelier two-stage layout:

```
+---------------------------------------------------------------------------------------+
|  #cloudflare-auth-modal inner card (max-w-4xl, rounded-3xl, warm alabaster border)     |
+---------------------------------------------------+-----------------------------------+
|  LEFT STAGE (md:w-7/12, order-1, bg-white)        |  RIGHT STAGE (.auth-desktop-showcase, |
|                                                   |  md:w-5/12, order-2, deep navy)   |
|  [Back Arrow]    [VK Crest]         [Close ✕]     |                                   |
|                                                   |  [VK Monogram] VISTĀRA KRAFTS     |
|  Part 1: Credentials                              |  Artisan Resin Studio             |
|  • "Welcome Back!" / "Create Account"             |                                   |
|  • Tabs: Sign In | Create Account                 |       ( ( (  3D ORB  ) ) )        |
|  • Email Address *                                |     140px Floating Specimen       |
|  • Password * [Visibility Icon]                   |     with Concentric Brass Rings   |
|  • Remember Me | Forgot Password?                 |                                   |
|  • [Primary CTA: Sign In]                         |  "Preserved Memories in Glass"    |
|  • -- Or continue with --                         |  Handcrafted luxury resin art.    |
|  • [Google] [Apple]                               |                                   |
|  • 🛡️ 100% Secure Sign-In • Private & Protected   |  • 👔 / 🌸 Curated Collections     |
|                                                   |  • 🛡️ 100% Secure Sign-In         |
|  Part 2: Curation (Swapped after login)           |  • 📦 Track Pours Across India    |
|  • "Curate Your Studio Feed"                      |                                   |
|  • [ 👔 Male: Curated for Him ]                   |                                   |
|  • [ 🌸 Female: Curated for Her ]                 |                                   |
|  • [ Skip for Now & Continue ]                    |                                   |
+---------------------------------------------------+-----------------------------------+
```

---

## 3. Database Schema (Cloudflare D1 / SQLite)

The schema in [`cloudflare/schema.sql`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/cloudflare/schema.sql) enforces strict relational integrity:

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : "creates"
    USERS ||--o{ ORDERS : "places"

    USERS {
        text id PK
        text email UK
        text name
        text phone
        text address
        text pincode
        text provider
        text provider_sub
        text password_hash
        text password_salt
        text wishlist_json
        text member_tier
        integer loyalty_points
        text created_at
        text updated_at
    }

    SESSIONS {
        text token_hash PK
        text user_id FK
        text provider
        text expires_at
        text created_at
    }

    ORDERS {
        text order_id PK
        text user_id FK
        text customer_name
        text customer_email
        text phone
        text address
        text pincode
        integer subtotal
        integer discount
        real gst_amount
        integer total
        text payment_method
        integer gift_wrap
        integer mockup_approved
        text status
        integer stage_index
        text items_json
        text courier
        text created_at
    }
```

---

## 4. Design System & CSS Token Architecture

All styling is anchored to W3C Design Tokens defined in [`tokens.css`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/tokens.css):

```css
:root {
  /* 60% Canvas & Cards */
  --surface-60-canvas: #faf8f5;
  --surface-60-card: #ffffff;
  --surface-60-mist: #f3f1ec;

  /* 30% Structure & Authority */
  --structure-30-navy: #031a38;
  --structure-30-border: #e4e0d8;
  --structure-30-ink: #1e293b;

  /* 10% Artisan Accents */
  --accent-10-brass: #b08d57;
  --accent-10-gold: #ffd79b;
  --accent-10-vermilion: #9e3322;

  /* Typography */
  --font-editorial: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;

  /* Minimum Accessible Touch Target */
  --touch-target-min: 44px;
}
```
