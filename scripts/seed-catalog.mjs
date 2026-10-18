import { TEST_PRODUCTS } from '../test-fixtures.js';
import { CONFIG } from '../server/config.js';

const SUPABASE_URL = CONFIG.SUPABASE_URL;
const SUPABASE_KEY = CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY;

async function seed() {
  console.log(`Seeding ${TEST_PRODUCTS.length} authoritative products to Supabase...`);
  for (const p of TEST_PRODUCTS) {
    const row = {
      id: p.id,
      sku: p.sku,
      name: p.name,
      short_name: p.shortName || '',
      subtitle: p.subtitle || '',
      brand: p.brand || 'Vistāra Krafts',
      category: p.category || 'general',
      subcategory: p.subCategory || '',
      badge: p.badge || '',
      price: Number(p.price || 0),
      compare_at_price: Number(p.regularPrice || p.compareAtPrice || 0),
      stock: p.inStock ? 50 : 0,
      in_stock: Boolean(p.inStock),
      is_active: true,
      status: 'active',
      rating: Number(p.rating || 5.0),
      reviews_count: Number(p.reviewsCount || 0),
      image: p.image || '',
      gallery: p.gallery || [],
      variants: p.variants || [],
      specs: p.specs || {},
      colors: p.colors || [],
      shapes: p.shapes || [],
      sizes: p.sizes || [],
      gender: p.gender || (p.genderAffinity === 'masculine' ? 'men' : (p.genderAffinity === 'feminine' ? 'women' : 'all')),
      gender_affinity: p.genderAffinity || 'neutral',
      gifting_tags: p.giftingTags || [],
      description: p.description || p.subtitle || ''
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?on_conflict=id`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(row)
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`❌ Failed ${p.id}: HTTP ${res.status} - ${err}`);
    } else {
      console.log(`✅ Synced ${p.id} (${p.sku}) @ ₹${p.price}`);
    }
  }
}

seed().catch(console.error);
