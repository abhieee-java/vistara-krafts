/**
 * Vistāra Krafts — End-to-End Storefront & Admin Portal Synchronization Verification
 */

import http from 'http';
import https from 'https';

const STOREFRONT_URL = 'http://localhost:3000';
const ADMIN_URL = 'http://localhost:3001';
const SUPABASE_URL = 'https://niamxrskqhjvzwxomxrx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_gK22Lr7xNqKI7VFAfnsQTA_7UD0S2iu';
const CLOUDINARY_CLOUD_NAME = 'ecugysfd';
const CLOUDINARY_PRESET = 'sxr8cHma94PzeXQGH85s_1yT8FY';

function fetchHttp(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

function fetchHttps(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function run() {
  console.log('--- STARTING SYNC & LOCAL RUN AUDIT ---');

  // 1. Verify Storefront is running locally on port 3000
  const sfRes = await fetchHttp(STOREFRONT_URL);
  console.log(`[Storefront] Local port 3000 status: ${sfRes.status} (Length: ${sfRes.data.length} bytes)`);
  if (sfRes.status !== 200) throw new Error('Storefront not accessible on port 3000');

  // 2. Verify Admin Portal is running locally on port 3001
  const adminRes = await fetchHttp(ADMIN_URL);
  console.log(`[Admin Portal] Local port 3001 status: ${adminRes.status} (Length: ${adminRes.data.length} bytes)`);
  if (adminRes.status !== 200) throw new Error('Admin Portal not accessible on port 3001');

  // 3. Verify Cloudinary Configuration
  const sampleRes = await fetchHttps(`https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/sample.jpg`);
  console.log(`[Cloudinary CDN] Sample image delivery for cloud '${CLOUDINARY_CLOUD_NAME}': HTTP ${sampleRes.status}`);
  if (sampleRes.status !== 200) throw new Error(`Cloudinary cloud '${CLOUDINARY_CLOUD_NAME}' not reachable`);

  // 4. Verify Live Supabase Connection
  const initialProducts = await fetchHttps(`${SUPABASE_URL}/rest/v1/products?select=id,sku,name,is_active`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  console.log(`[Supabase DB] Query products status: ${initialProducts.status}`);
  if (initialProducts.status !== 200) throw new Error('Supabase query failed');

  // 5. Test Product Upsert Sync via Stored Procedure
  const testSku = 'VK-SYNC-LIVE-001';
  const testProduct = {
    id: 'prod_sync_test_' + Date.now().toString(36),
    sku: testSku,
    name: 'Artisan Emerald Geode Tea Light',
    short_name: 'Emerald Tea Light',
    subtitle: 'Hand-poured with gold leaf and resin',
    brand: 'Vistāra Krafts',
    category: 'resin',
    subcategory: 'decor',
    price: 1899,
    compare_at_price: 2499,
    stock: 15,
    is_active: true,
    featured: true,
    rating: 4.9,
    reviews_count: 8,
    colors: ['Emerald Green', 'Gold Leaf'],
    shapes: ['Circular'],
    sizes: ['Medium'],
    description: 'Sync verification product handcrafted in our studio.'
  };

  console.log('[Sync Engine] Ingesting test product into Supabase via import_catalog_batch...');
  const upsertRes = await fetchHttps(`${SUPABASE_URL}/rest/v1/rpc/import_catalog_batch`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_products: [testProduct] })
  });

  console.log(`[Sync Engine] Upsert result: HTTP ${upsertRes.status} -> ${upsertRes.data}`);
  const upsertJson = JSON.parse(upsertRes.data);
  if (!upsertJson.success) throw new Error('Product upsert failed');

  // 6. Verify Storefront Database Fetch receives the upserted item
  const verifyDb = await fetchHttps(`${SUPABASE_URL}/rest/v1/products?sku=eq.${testSku}&select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const savedItems = JSON.parse(verifyDb.data);
  if (!savedItems || savedItems.length === 0) throw new Error('Product not found in Supabase after sync');
  console.log(`[Sync Engine] Confirmed product persisted: "${savedItems[0].name}" (Price: ₹${savedItems[0].price}, Stock: ${savedItems[0].stock})`);

  // 7. Test Deactivation / Soft Delete Sync
  console.log('[Sync Engine] Testing deactivation / deletion sync...');
  const deactivateRes = await fetchHttps(`${SUPABASE_URL}/rest/v1/rpc/import_catalog_batch`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_products: [{
        sku: testSku,
        is_active: false
      }]
    })
  });
  console.log(`[Sync Engine] Deactivation response: HTTP ${deactivateRes.status}`);

  // Confirm excluded from public active catalog
  const publicActive = await fetchHttps(`${SUPABASE_URL}/rest/v1/products?sku=eq.${testSku}&is_active=eq.true&select=id`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const activeItems = JSON.parse(publicActive.data);
  console.log(`[Sync Engine] Active public count for deactivated product: ${activeItems.length} (Expected 0)`);
  if (activeItems.length !== 0) throw new Error('Deactivated product still appears in active catalog');

  console.log('--- ALL SYNC CHECKS PASSED PERFECTLY! ---');
}

run().catch(err => {
  console.error('SYNC CHECK FAILED:', err);
  process.exit(1);
});
