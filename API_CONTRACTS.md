# API CONTRACTS — SUPABASE POSTGRESQL & CLOUDINARY CLIENT SPECIFICATION

> **Backend Services:** Supabase JavaScript SDK & PostgREST API / Cloudinary Media API  
> **Database Engine:** Supabase PostgreSQL 15+  
> **Auth Engine:** Supabase Auth (GoTrue)  
> **Storefront Bridge:** [`supabase-client.js`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/supabase-client.js), [`supabase-config.js`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/supabase-config.js)  
> **Media CDN Adapter:** [`cloudinary-config.js`](file:///C:/Users/Dell/.gemini/antigravity/scratch/stitch_potry_e_commerce_storefront/cloudinary-config.js)  
> **Last Updated:** October 2026  

---

## 1. Global Standards & Authentication Protocol

The platform communicates with Supabase using standard PostgreSQL PostgREST query patterns and the `@supabase/supabase-js` client SDK:

### Common Headers
| Header | Value | Description |
| :--- | :--- | :--- |
| `apikey` | `VISTARA_SUPABASE_CONFIG.anonKey` | Public anon key for Row-Level Security evaluation. |
| `Authorization` | `Bearer <access_token>` | Authenticated patron JWT issued by Supabase Auth. |
| `Content-Type` | `application/json` | JSON payload format. |

---

## 2. Authentication Contracts (`VistaraSupabase.auth`)

### 1. `signUp(email, password, options)`
Registers a new customer patron account.
```javascript
const { data, error } = await VistaraSupabase.auth.signUp({
  email: 'ananya.sharma@example.com',
  password: 'Password#123',
  options: {
    data: {
      full_name: 'Ananya Sharma',
      gender_preference: 'universal'
    }
  }
});
```

### 2. `signInWithPassword({ email, password })`
Authenticates an existing patron.
```javascript
const { data, error } = await VistaraSupabase.auth.signInWithPassword({
  email: 'ananya.sharma@example.com',
  password: 'Password#123'
});
```

### 3. `signInWithOAuth({ provider, options })`
1-Click OAuth authentication via Google or Apple.
```javascript
const { data, error } = await VistaraSupabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin
  }
});
```

### 4. `signOut()`
Revokes current patron session tokens.
```javascript
const { error } = await VistaraSupabase.auth.signOut();
```

---

## 3. Patron Persona Curation Contract

### `updatePersonaPreference(userId, genderPreference)`
Updates patron feed customization preference (`'masculine'` | `'feminine'` | `'universal'`).
```javascript
const { data, error } = await VistaraSupabase
  .from('profiles')
  .update({ gender_preference: 'masculine', updated_at: new Date().toISOString() })
  .eq('id', userId);
```

---

## 4. Product Catalog Contracts

### `fetchProducts()`
Queries active catalog SKUs sorted by rating/popularity.
```javascript
const { data: products, error } = await VistaraSupabase
  .from('products')
  .select('*')
  .eq('is_active', true)
  .order('price', { ascending: true });
```

---

## 5. Orders & Transactions Contracts

### `createOrder(orderPayload)`
Inserts an authenticated or guest customer order into `public.orders`.
```javascript
const { data: order, error } = await VistaraSupabase
  .from('orders')
  .insert([{
    id: 'VK-2026-9021',
    user_id: user.id,
    customer_name: 'Ananya Sharma',
    customer_email: 'ananya.sharma@example.com',
    phone: '+91 9988776655',
    address: 'Flat 402, Lotus Orchid, Indiranagar, Bengaluru',
    pincode: '560038',
    subtotal: 1149,
    discount: 0,
    gst_amount: 206.82,
    total: 1149,
    payment_method: 'UPI Instant (GPay / PhonePe)',
    gift_wrap: true,
    mockup_approved: false,
    status: 'placed',
    stage_index: 1,
    items: [/* array of cart line items */],
    courier: 'BlueDart Air Express'
  }])
  .select();
```

---

## 6. Cloudinary Media Storage Contracts

### 1. Dynamic Transformation URL Generator
Generates responsive, optimized URLs (`f_auto,q_auto,w_800`):
```javascript
const optimizedUrl = VistaraCloudinary.optimize(
  'https://res.cloudinary.com/vistara-krafts/image/upload/v1/products/varmala.jpg',
  { width: 800, quality: 'auto', format: 'auto' }
);
// Output: 'https://res.cloudinary.com/vistara-krafts/image/upload/f_auto,q_auto,w_800/v1/products/varmala.jpg'
```

### 2. Direct Unsigned Image Upload
Uploads customer floral photos or admin product images directly to Cloudinary:
```javascript
const result = await VistaraCloudinary.uploadImage(file, {
  folder: 'custom_mockups',
  tags: ['varmala', 'inquiry']
});
// Returns: { public_id, secure_url, format, bytes, width, height }
```
