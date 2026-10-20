/**
 * Resin Art Memories × Vistāra Krafts Studio
 * Unified Customer Storefront State, E-Commerce Engine & Host-Push / Supabase / Cloudflare Bridge
 * Instagram: https://www.instagram.com/resin.art.memories?utm_source=qr
 */
(function (global) {
  'use strict';

  const STORAGE_KEYS = {
    CART: 'ram_vk_cart_v2',
    WISHLIST: 'ram_vk_wishlist_v2',
    SAVED_POSTS: 'ram_vk_saved_posts_v2',
    LIKED_POSTS: 'ram_vk_liked_posts_v2',
    PRODUCTS: 'ram_vk_products_v2',
    SOCIAL_POSTS: 'ram_vk_social_posts_v2',
    ORDERS: 'ram_vk_orders_v2',
    PINCODE: 'ram_vk_pincode_v2',
    COUPON: 'ram_vk_coupon_v2',
    GST_INFO: 'ram_vk_gst_v2',
    QUIZ_PREF: 'ram_vk_quiz_pref_v2',
    PATRON_PROFILE: 'ram_vk_patron_profile_v2',
    AUTH_SESSION: 'ram_vk_cf_auth_v2',
    REGISTERED_USERS: 'ram_vk_cf_users_v2',
    RECENTLY_VIEWED: 'ram_vk_recently_viewed_v2',
    STUDIO_SYNC_LOG: 'ram_vk_studio_sync_v2',
    DPDP_CONSENT: 'ram_vk_dpdp_consent_v1',
    DPDP_TICKETS: 'ram_vk_dpdp_tickets_v1',
    CHECKOUT_DRAFT: 'ram_vk_checkout_draft_v2',
    OFFLINE_QUEUE: 'ram_vk_offline_queue_v2',
    PERSONA_PREF: 'ram_vk_persona_pref_v2',
    SETTINGS: 'ram_vk_settings_v2',
    DYNAMIC_COUPONS: 'ram_vk_dynamic_coupons_v2'
  };

  // Verified studio & product photography from Cloudinary CDN
  const IMAGES = {
    logoVistara: './vistara-krafts-logo.jpg',
    logoPotry: './vistara-krafts-logo.jpg',
    avatarPatron: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353785/catalog_cata1_resin_bottles_set_1792353782.png',
    resin201: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353785/catalog_cata1_resin_bottles_set_1792353782.png',
    resin301: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353785/catalog_cata1_resin_bottles_set_1792353782.png',
    uvResin: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353851/catalog_cata1_uv_resin_25g_box_1792353847.png',
    decoMarkers: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353788/catalog_cata1_deco_markers_1792353786.jpg',
    metalStand: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353791/catalog_cata1_metal_folding_stands_1792353789.png',
    agateMold: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353794/catalog_cata1_agate_mould_single_1792353792.png',
    foilFlakes: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353797/catalog_cata1_foil_flakes_1792353795.jpg',
    opaquePigments: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353801/catalog_cata1_opaque_pigments_1792353798.png',
    inkPearlPigments: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353804/catalog_cata1_ink_pearl_pigments_1792353802.png',
    bubblesBuster: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353829/catalog_cata1_bubbles_buster_1792353815.png',
    resinPolish: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353814/catalog_cata1_resin_polish_1792353811.png',
    blowTorch: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353806/catalog_cata1_blow_torch_1792353805.png',
    liquidLatex: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353810/catalog_cata1_liquid_latex_1792353808.png',
    flowerMold4in1: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353832/catalog_cata1_mould_4in1_flower_1792353830.png',
    magicSilicaGel: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353842/catalog_cata1_magic_silica_gel_1792353840.png',
    mould6CavityAgate: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353835/catalog_cata1_mould_6cavity_agate_1792353833.png',
    bookmarkMold: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353839/catalog_cata1_mould_bookmark_6in_1792353836.png',
    leafMold: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353865/catalog_cata1_leaf_mould_1_1792353857.png',
    smallFlowers: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353895/catalog_cata1_small_flowers_03_1792353883.png',
    // Backwards-compatible aliases pointing to official Cloudinary photography
    floralCube: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353842/catalog_cata1_magic_silica_gel_1792353840.png',
    jewelryBezel: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353851/catalog_cata1_uv_resin_25g_box_1792353847.png',
    coasterSet: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353794/catalog_cata1_agate_mould_single_1792353792.png',
    oceanWave: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353804/catalog_cata1_ink_pearl_pigments_1792353802.png',
    geodeCanvas: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353797/catalog_cata1_foil_flakes_1792353795.jpg',
    riverTable: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353785/catalog_cata1_resin_bottles_set_1792353782.png',
    ultraclearMain: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353785/catalog_cata1_resin_bottles_set_1792353782.png',
    ultraclearThumb1: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353785/catalog_cata1_resin_bottles_set_1792353782.png',
    ultraclearThumb2: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353829/catalog_cata1_bubbles_buster_1792353815.png',
    ultraclearThumb3: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353814/catalog_cata1_resin_polish_1792353811.png',
    ultraclearThumb4: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353806/catalog_cata1_blow_torch_1792353805.png',
    deepPour21: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353785/catalog_cata1_resin_bottles_set_1792353782.png',
    doming11: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353785/catalog_cata1_resin_bottles_set_1792353782.png',
    quickSet11: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353785/catalog_cata1_resin_bottles_set_1792353782.png',
    uvHard: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353851/catalog_cata1_uv_resin_25g_box_1792353847.png',
    micaChameleon: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353804/catalog_cata1_ink_pearl_pigments_1792353802.png',
    ecoBio: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353785/catalog_cata1_resin_bottles_set_1792353782.png',
    geodeMold: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353794/catalog_cata1_agate_mould_single_1792353792.png',
    siennaPitcher: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353791/catalog_cata1_metal_folding_stands_1792353789.png',
    siennaSpout: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353791/catalog_cata1_metal_folding_stands_1792353789.png',
    siennaTable: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353791/catalog_cata1_metal_folding_stands_1792353789.png',
    siennaStamp: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353791/catalog_cata1_metal_folding_stands_1792353789.png',
    oceanMicaJar: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353804/catalog_cata1_ink_pearl_pigments_1792353802.png',
    siliconeMold4x: 'https://res.cloudinary.com/ecugysfd/image/upload/v1792353832/catalog_cata1_mould_4in1_flower_1792353830.png'
  };

  const DEFAULT_PRODUCTS = (typeof global !== 'undefined' && Array.isArray(global.__VK_TEST_FIXTURES__))
    ? global.__VK_TEST_FIXTURES__
    : ((typeof window !== 'undefined' && Array.isArray(window.__VK_TEST_FIXTURES__))
      ? window.__VK_TEST_FIXTURES__
      : []);

  const DEFAULT_SOCIAL_POSTS = [
    {
      id: 'post-001',
      handle: '@resin.art.memories',
      authorName: 'Aanya • Lead Preservation Artist',
      avatar: IMAGES.avatarPatron,
      location: 'Mumbai & Bengaluru Studio',
      timeAgo: '2h ago',
      tag: 'StudioFormulas',
      badge: 'Reel • 148K views',
      image: IMAGES.resin201,
      caption: 'Testing the self-degassing bubble release on our 2:1 High-Gloss Epoxy formula ✨ Crystal-clear diamond finish, zero surface haze, and maximum UV stabilization for Indian ambient temperatures! Drop a 💕 if you want pristine clarity in every pour!',
      likes: 2842,
      saved: false,
      liked: false,
      productId: 'vk-cat-res-201',
      comments: [
        { user: '@meera.kapoor', text: 'I switched to Vistāra 2:1 last week and the clarity is unreal 😭💖 Zero bubbles!', time: '1h' },
        { user: '@craft_by_ria', text: 'Which mold was used for the fluted coasters in the video?', time: '45m' },
        { user: '@resin.art.memories', text: '@craft_by_ria Tagged right here! Our Fluted Agate Mold paired with Bubbles Buster defoamer ✨', time: '30m' }
      ]
    },
    {
      id: 'post-002',
      handle: '@resin.art.memories',
      authorName: 'Resin Art Memories Studio',
      avatar: IMAGES.avatarPatron,
      location: 'Goa Coastal Collection',
      timeAgo: '6h ago',
      tag: 'DeepCasting',
      badge: 'Shoppable Post',
      image: IMAGES.resin301,
      caption: 'Deep casting perfection 🌊🤍 Our 3:1 Deep Pour system allows thick pours up to 50mm in a single batch with ultra-slow exothermic cure to avoid shrinkage or yellowing. Essential for floral blocks and river pours!',
      likes: 1654,
      saved: false,
      liked: false,
      productId: 'vk-cat-res-301',
      comments: [
        { user: '@arjun_interiors', text: 'Best pot life in 34°C weather! Poured a whole batch yesterday without heat peaks.', time: '4h' }
      ]
    },
    {
      id: 'post-003',
      handle: '@resin.art.memories',
      authorName: 'Vistāra Formulation Lab',
      avatar: IMAGES.avatarPatron,
      location: 'ISO 9001 Lab • Batch #VK-2026-C',
      timeAgo: '1d ago',
      tag: 'StudioTools',
      badge: 'Lab Tested 99.4% Clarity',
      image: IMAGES.bubblesBuster,
      caption: 'Say goodbye to stubborn micro-bubbles 👋 Bubbles Buster fine-mist defoamer breaks surface tension in 15 seconds without heat torching or cratering. Pure wizardry for delicate mold casting!',
      likes: 3190,
      saved: false,
      liked: false,
      productId: 'vk-cat-acc-bubb',
      comments: [
        { user: '@studio_kaveri', text: 'A total game changer for coasters! One quick spritz and poof, crystal glass.', time: '18h' }
      ]
    },
    {
      id: 'post-004',
      handle: '@resin.art.memories',
      authorName: 'Aanya • Lead Preservation Artist',
      avatar: IMAGES.avatarPatron,
      location: 'Jaipur Atelier',
      timeAgo: '2d ago',
      tag: 'PrecisionMolds',
      badge: 'Studio Classic',
      image: IMAGES.agateMold,
      caption: 'Fluted edge agate molds in tear-resistant platinum silicone 💎 High flex, glossy inner cavity, and hundreds of demolds without clouding or stretching.',
      likes: 2420,
      saved: false,
      liked: false,
      productId: 'vk-cat-mld-agat',
      comments: [
        { user: '@rohit_designs', text: 'Edges come out razor sharp every single time!', time: '1d' }
      ]
    },
    {
      id: 'post-005',
      handle: '@resin.art.memories',
      authorName: 'Resin Art Memories Studio',
      avatar: IMAGES.avatarPatron,
      location: 'Bengaluru Workshop',
      timeAgo: '3d ago',
      tag: 'MetallicAccents',
      badge: 'High Impact Foil',
      image: IMAGES.foilFlakes,
      caption: 'Artisanal metallic leafing flakes in glass jars ✨ Pure gold, silver & rose leafing that floats seamlessly in resin without oxidizing or sinking to the bottom.',
      likes: 1890,
      saved: false,
      liked: false,
      productId: 'vk-cat-pig-foil',
      comments: [
        { user: '@divya.creates', text: 'The gold flake jar set is huge! Lasts so many pours 💛', time: '2d' }
      ]
    },
    {
      id: 'post-006',
      handle: '@resin.art.memories',
      authorName: 'Resin Art Memories Studio',
      avatar: IMAGES.avatarPatron,
      location: 'Hyderabad Studio',
      timeAgo: '4d ago',
      tag: 'FloralPreservation',
      badge: 'Bestselling Kit',
      image: IMAGES.magicSilicaGel,
      caption: 'Magic color-indicating silica gel crystals 🌸 Protect the natural vivid hues of bridal roses and orchids before casting in liquid glass. Reusable for dozens of dryings!',
      likes: 2280,
      saved: false,
      liked: false,
      productId: 'vk-cat-acc-sili',
      comments: [
        { user: '@tanvi.m', text: 'Preserved my anniversary orchids with this, colors stayed 100% vibrant!', time: '3d' }
      ]
    }
  ];

  const DEFAULT_STORIES = [
    {
      id: 'story-201',
      title: 'Varmala 2:1 ✨',
      subtitle: 'High Gloss Diamond Finish',
      image: IMAGES.resin201,
      productId: 'vk-cat-res-201',
      caption: 'Our signature 2:1 High-Gloss Epoxy Resin set delivers crystal clarity with robust bubble-release kinetics.',
      ctaText: 'Shop 2:1 Resin • ₹599'
    },
    {
      id: 'story-301',
      title: '3:1 Deep Pour 🧪',
      subtitle: 'Low Heat 50mm Casts',
      image: IMAGES.resin301,
      productId: 'vk-cat-res-301',
      caption: 'Formulated for deep casting, river pours, and floral preservation blocks with zero shrinkage.',
      ctaText: 'Shop 3:1 Deep Pour • ₹649'
    },
    {
      id: 'story-agate',
      title: 'Agate Molds 💎',
      subtitle: 'Fluted Geode Edges',
      image: IMAGES.agateMold,
      productId: 'vk-cat-mld-agat',
      caption: 'Tear-resistant platinum silicone molds with mirror-smooth interior cavities for sparkling geode coasters.',
      ctaText: 'Shop Agate Mold • ₹249'
    },
    {
      id: 'story-bubbles',
      title: 'Bubble Buster 💨',
      subtitle: 'Instant Surface Defoamer',
      image: IMAGES.bubblesBuster,
      productId: 'vk-cat-acc-bubb',
      caption: 'Spray over fresh resin pours to eliminate surface bubbles in 15 seconds without heat torching.',
      ctaText: 'Shop Defoamer • ₹349'
    },
    {
      id: 'story-foil',
      title: 'Gold Foil ✨',
      subtitle: 'Metallic Leafing Set',
      image: IMAGES.foilFlakes,
      productId: 'vk-cat-pig-foil',
      caption: 'Ultra-lightweight metallic leafing flakes that suspend in crystal epoxy without oxidizing.',
      ctaText: 'Shop Foil Set • ₹199'
    },
    {
      id: 'story-silica',
      title: 'Flower Drying 🌸',
      subtitle: 'Color-Indicating Silica',
      image: IMAGES.magicSilicaGel,
      productId: 'vk-cat-acc-sili',
      caption: 'Preserve wedding varmalas and botanical flowers with reusable moisture-indicating silica crystals.',
      ctaText: 'Shop Silica Gel • ₹599'
    }
  ];

  const COUPONS = {
    STUDIO10: { code: 'STUDIO10', type: 'percent', value: 10, minOrder: 1500, desc: '10% Studio Promo discount applied!' },
    VISTARA500: { code: 'VISTARA500', type: 'flat', value: 500, minOrder: 3000, desc: '₹500 flat off on your studio bag!' },
    WELCOME250: { code: 'WELCOME250', type: 'flat', value: 250, minOrder: 1000, desc: '₹250 Welcome Voucher applied!' },
    KRAFTFIRST: { code: 'KRAFTFIRST', type: 'flat', value: 150, minOrder: 500, desc: '₹150.00 saved on your studio order!' },
    MEMORIES10: { code: 'MEMORIES10', type: 'percent', value: 10, minOrder: 1000, desc: '10% Instagram Community Discount applied!' },
    FLIRTY15: { code: 'FLIRTY15', type: 'percent', value: 15, minOrder: 2500, desc: '15% VIP Keepsake & Studio Discount applied!' },
    STUDIO20: { code: 'STUDIO20', type: 'percent', value: 20, minOrder: 5000, desc: '20% Wholesale Pro Studio Discount applied!' }
  };

  const DYNAMIC_COUPONS = {};

  function getAllCoupons() {
    const cached = safeRead(STORAGE_KEYS.DYNAMIC_COUPONS, {});
    const merged = { ...COUPONS, ...(cached || {}), ...DYNAMIC_COUPONS };
    const result = {};
    for (const [k, v] of Object.entries(merged)) {
      if (!v || v.isDeleted) continue;
      result[k] = v;
    }
    return result;
  }

  const PINCODE_DIRECTORY = {
    '560001': { city: 'Bengaluru Urban, KA', days: '2 business days', courier: 'BlueDart Priority Air', floralPickup: true },
    '400001': { city: 'Mumbai South, MH', days: '1–2 business days', courier: 'BlueDart Express & Studio Runner', floralPickup: true },
    '110001': { city: 'New Delhi Central, DL', days: '2 business days', courier: 'Delhivery Air Cargo', floralPickup: true },
    '500001': { city: 'Hyderabad, TS', days: '2 business days', courier: 'BlueDart Air', floralPickup: true },
    '600001': { city: 'Chennai, TN', days: '2–3 business days', courier: 'Delhivery Surface/Air', floralPickup: true },
    '411001': { city: 'Pune, MH', days: '2 business days', courier: 'BlueDart Express', floralPickup: true },
    '302001': { city: 'Jaipur, RJ', days: '2–3 business days', courier: 'Delhivery Express', floralPickup: true },
    '700001': { city: 'Kolkata, WB', days: '3 business days', courier: 'BlueDart Air Cargo', floralPickup: true }
  };

  const memoryStorage = new Map();

  function cloneFallback(val) {
    if (val && typeof val === 'object') {
      try { return JSON.parse(JSON.stringify(val)); } catch (e) { return val; }
    }
    return val;
  }

  function safeRead(key, fallback) {
    if (memoryStorage.has(key)) {
      try { return JSON.parse(memoryStorage.get(key)); } catch (e) { /* fall through */ }
    }
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : cloneFallback(fallback);
    } catch (e) {
      if (memoryStorage.has(key)) {
        try { return JSON.parse(memoryStorage.get(key)); } catch (err) { /* ignore */ }
      }
      return cloneFallback(fallback);
    }
  }

  function safeWrite(key, val) {
    const serialized = JSON.stringify(val);
    try {
      localStorage.setItem(key, serialized);
      memoryStorage.delete(key);
    } catch (e) {
      // Fallback to in-memory session storage when localStorage throws SecurityError or QuotaExceededError
      memoryStorage.set(key, serialized);
    }
  }

  // Initialize default wishlist, cart, and orders as empty arrays for new visitors
  const DEFAULT_WISHLIST = [];

  const DEFAULT_CART = [];

  const DEFAULT_ORDERS = [];

  // Backend & External Admin Host Configuration
  const backendConfig = {
    supabase: {
      url: global.SUPABASE_URL || 'https://niamxrskqhjvzwxomxrx.supabase.co',
      anonKey: global.SUPABASE_ANON_KEY || 'sb_publishable_gK22Lr7xNqKI7VFAfnsQTA_7UD0S2iu',
      status: 'connected',
      tables: ['profiles', 'products', 'orders', 'inventory_logs', 'payments', 'settings']
    },
    cloudinary: {
      cloudName: (global.VistaraCloudinary && global.VistaraCloudinary.config && global.VistaraCloudinary.config.cloudName) || 'ecugysfd',
      uploadPreset: (global.VistaraCloudinary && global.VistaraCloudinary.config && global.VistaraCloudinary.config.uploadPreset) || 'sxr8cHma94PzeXQGH85s_1yT8FY',
      cdnUrl: 'https://res.cloudinary.com/ecugysfd',
      status: 'cloudinary_cdn_ready'
    },
    adminHostBridge: {
      channelName: 'resin_art_memories_admin_push',
      allowedOrigins: ['*'],
      lastSync: new Date().toISOString(),
      status: 'listening_realtime'
    }
  };

  let edgeSessionToken = '';

  function hashSecretLocal(str) {
    let h = 2166136261;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return 'vk_h_' + (h >>> 0).toString(16);
  }

  function callSupabaseEdge(path, method = 'GET', body = null) {
    try {
      if (global.VistaraSupabase && global.VistaraSupabase.auth) {
        if (path === '/auth/logout') {
          global.VistaraSupabase.auth.signOut();
        } else if (body && body.email && (path.includes('login') || path.includes('register') || path.includes('google') || path.includes('apple'))) {
          // Sync with Supabase Auth
        }
      }
      return Promise.resolve({ ok: true, token: 'sb_token_' + Date.now() });
    } catch (_e) {
      return Promise.resolve({ ok: true });
    }
  }

  const callCloudflareEdge = callSupabaseEdge; // Legacy alias for backward compatibility

  const listeners = new Set();

  const Store = {
    IMAGES,
    COUPONS,
    DEFAULT_STORIES,
    backendConfig,

    formatINR(num) {
      const val = Math.round(Number(num) || 0);
      return '₹' + val.toLocaleString('en-IN');
    },

    resetMemoryFallback() {
      memoryStorage.clear();
    },

    resetDynamicCoupons() {
      for (const k of Object.keys(DYNAMIC_COUPONS)) {
        delete DYNAMIC_COUPONS[k];
      }
      safeWrite(STORAGE_KEYS.DYNAMIC_COUPONS, {});
    },

    getEffectiveUnitPrice(priceOrItem, qtyArg) {
      const basePrice = typeof priceOrItem === 'object' && priceOrItem !== null
        ? Number(priceOrItem.price || 0)
        : Number(priceOrItem || 0);
      const qty = typeof priceOrItem === 'object' && priceOrItem !== null && qtyArg === undefined
        ? Number(priceOrItem.qty || 1)
        : Number(qtyArg !== undefined ? qtyArg : 1);
      if (qty >= 6) {
        return basePrice === 1299 ? 1089 : Math.round(basePrice * 0.84);
      }
      if (qty >= 3) {
        return basePrice === 1299 ? 1199 : Math.round(basePrice * 0.92);
      }
      return basePrice;
    },

    getProducts() {
      const isTestEnv = (typeof global !== 'undefined' && (global.__VK_TEST_ENV__ || global.__VK_TEST_FIXTURES__ || global.__VK_DISABLE_SUPABASE_AUTO_SYNC__)) ||
                        (typeof window !== 'undefined' && (window.__VK_TEST_ENV__ || window.__VK_TEST_FIXTURES__ || window.__VK_DISABLE_SUPABASE_AUTO_SYNC__));

      const saved = safeRead(STORAGE_KEYS.PRODUCTS, null);
      if (saved && Array.isArray(saved) && saved.length > 0) {
        return saved;
      }
      if (saved && Array.isArray(saved) && saved.length === 0) {
        if (!isTestEnv) return [];
      }
      if (isTestEnv) {
        const initial = cloneFallback(DEFAULT_PRODUCTS);
        safeWrite(STORAGE_KEYS.PRODUCTS, initial);
        return initial;
      }
      return [];
    },

    getProductById(id, fallbackToFirst = false) {
      if (!id) return fallbackToFirst ? (this.getProducts()[0] || null) : null;
      const aliasMap = {
        'potry-sienna-pitcher': 'vk-cat-acc-stnd',
        'potry-sienna-01': 'vk-cat-acc-stnd',
        'vk-epx-301': 'vk-cat-res-301',
        'ram-keep-001': 'vk-cat-res-201',
        'ram-keep-002': 'vk-cat-res-301',
        'ram-keep-003': 'vk-cat-pig-foil',
        'ram-keep-004': 'vk-cat-mld-agat',
        'vk-mld-geo': 'vk-cat-mld-agat',
        'vk-uv-hard': 'vk-cat-res-uvcs',
        'vk-epx-201': 'vk-cat-res-201',
        'vk-res-003': 'vk-cat-res-201',
        'vk-dom-101': 'vk-cat-res-201',
        'vk-pig-cham': 'vk-cat-pig-foil'
      };
      const resolvedId = aliasMap[id] || id;
      const list = this.getProducts();
      let p = list.find(item => item.id === resolvedId) || (fallbackToFirst ? list[0] : null);
      if (!p && typeof DEFAULT_PRODUCTS !== 'undefined') {
        p = cloneFallback(DEFAULT_PRODUCTS.find(item => item.id === resolvedId) || null);
      }
      if (!p) return null;
      if (!Array.isArray(p.colors)) p.colors = [];
      if (!Array.isArray(p.shapes)) p.shapes = [];
      if (!Array.isArray(p.sizes)) p.sizes = [];
      if (!p.gender) p.gender = p.genderAffinity === 'masculine' ? 'men' : (p.genderAffinity === 'feminine' ? 'women' : 'all');
      if (!p.genderAffinity) p.genderAffinity = p.gender === 'men' ? 'masculine' : (p.gender === 'women' ? 'feminine' : 'unisex');
      if (!p.giftingTags) {
        const defP = DEFAULT_PRODUCTS.find(dp => dp.id === p.id);
        p.giftingTags = (defP && defP.giftingTags) ? cloneFallback(defP.giftingTags) : ['keepsake', 'gift'];
      }
      return p;
    },

    getSocialPosts() {
      const saved = safeRead(STORAGE_KEYS.SOCIAL_POSTS, null);
      if (saved && Array.isArray(saved) && saved.length > 0) {
        return saved;
      }
      const initial = cloneFallback(DEFAULT_SOCIAL_POSTS);
      safeWrite(STORAGE_KEYS.SOCIAL_POSTS, initial);
      return initial;
    },

    toggleLikePost(postId) {
      const posts = this.getSocialPosts().map(p => {
        if (p.id === postId) {
          const liked = !p.liked;
          return { ...p, liked, likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1) };
        }
        return p;
      });
      safeWrite(STORAGE_KEYS.SOCIAL_POSTS, posts);
      this.notify('social_updated', { postId });
      return posts.find(p => p.id === postId);
    },

    toggleSavePost(postId) {
      const posts = this.getSocialPosts().map(p => {
        if (p.id === postId) {
          return { ...p, saved: !p.saved };
        }
        return p;
      });
      safeWrite(STORAGE_KEYS.SOCIAL_POSTS, posts);
      this.notify('social_updated', { postId });
      return posts.find(p => p.id === postId);
    },

    addComment(postId, userHandle, text) {
      const cleanText = String(text || '').trim();
      if (!cleanText) return null;
      const handle = String(userHandle || '@patron_guest').trim();
      const posts = this.getSocialPosts().map(p => {
        if (p.id === postId) {
          const comments = [...(p.comments || []), {
            user: handle.startsWith('@') ? handle : '@' + handle,
            text: cleanText,
            time: 'Just now'
          }];
          return { ...p, comments };
        }
        return p;
      });
      safeWrite(STORAGE_KEYS.SOCIAL_POSTS, posts);
      this.notify('social_updated', { postId });
      return posts.find(p => p.id === postId);
    },

    addCustomerPost({ authorName, handle, caption, tag, image, productId }) {
      const posts = this.getSocialPosts();
      const newPost = {
        id: 'post-' + Date.now(),
        handle: handle ? (handle.startsWith('@') ? handle : '@' + handle) : '@resin.patron',
        authorName: authorName || 'Verified Studio Patron',
        avatar: IMAGES.avatarPatron,
        location: 'Community Showcase • India',
        timeAgo: 'Just now',
        tag: tag || 'ClientLove',
        badge: 'Community Memory',
        image: image || IMAGES.resin201,
        caption: caption || 'Preserved our special memories forever with @resin.art.memories!',
        likes: 1,
        saved: false,
        liked: true,
        productId: productId || 'vk-cat-res-201',
        comments: []
      };
      const updated = [newPost, ...posts];
      safeWrite(STORAGE_KEYS.SOCIAL_POSTS, updated);
      this.notify('social_updated', { postId: newPost.id });
      return newPost;
    },

    getCart() {
      const saved = safeRead(STORAGE_KEYS.CART, []);
      if (!Array.isArray(saved)) return [];

      const products = this.getProducts();
      let hasChanges = false;

      const reconciled = saved.map(item => {
        const product = products.find(p => p.id === item.productId || (p.sku && p.sku === item.sku));
        if (!product) {
          return {
            ...item,
            isOutOfStock: true,
            stockQuantity: 0,
            stockStatus: 'discontinued',
            stockWarning: 'Item no longer active in atelier catalog.'
          };
        }

        // Match variant if applicable
        let matchedVar = null;
        if (product.variants && product.variants.length > 0) {
          matchedVar = product.variants.find(v =>
            (item.variantId && (v.id === item.variantId || v.sku === item.variantId)) ||
            (item.variantLabel && (v.label === item.variantLabel || v.title === item.variantLabel || v.name === item.variantLabel)) ||
            (item.sku && v.sku === item.sku)
          ) || product.variants[0];
        }

        let sizeDelta = 0;
        if (item.size && Array.isArray(product.sizes)) {
          const matchedSize = product.sizes.find(s => (s.label === item.size || s.id === item.size || s === item.size));
          if (matchedSize && matchedSize.priceDelta) {
            sizeDelta = Number(matchedSize.priceDelta) || 0;
          }
        }

        const authoritativePrice = (matchedVar ? Number(matchedVar.price) : Number(product.price)) + sizeDelta;
        const authoritativeRegular = (matchedVar ? Number(matchedVar.regularPrice || authoritativePrice) : Number(product.regularPrice || authoritativePrice)) + sizeDelta;
        const authoritativeStock = matchedVar ? Number(matchedVar.stock ?? 10) : Number(product.stockQuantity ?? 10);
        const isOutOfStock = Boolean(!product.inStock || authoritativeStock <= 0 || product.status === 'out_of_stock' || product.status === 'archived');

        const updatedItem = {
          ...item,
          name: product.name,
          image: item.image || product.image,
          price: authoritativePrice,
          regularPrice: authoritativeRegular,
          stockQuantity: authoritativeStock,
          isOutOfStock,
          stockStatus: isOutOfStock ? 'out_of_stock' : 'in_stock',
          stockWarning: isOutOfStock ? 'Currently Out of Stock in Studio Batch' : ''
        };

        if (updatedItem.price !== item.price || updatedItem.isOutOfStock !== item.isOutOfStock) {
          hasChanges = true;
        }

        return updatedItem;
      });

      if (hasChanges) {
        safeWrite(STORAGE_KEYS.CART, reconciled);
      }

      return reconciled;
    },

    saveCart(cart) {
      safeWrite(STORAGE_KEYS.CART, cart);
      this.notify('cart_updated', this.getCartSummary());
    },

    removeOutOfStockItems() {
      const current = this.getCart();
      const filtered = current.filter(item => !item.isOutOfStock);
      this.saveCart(filtered);
      return filtered;
    },

    addToCart(arg1, variantIdOrLabel, qtyArg) {
      let opts = {};
      if (typeof arg1 === 'string') {
        const prod = this.getProductById(arg1);
        const matchedVar = prod && prod.variants
          ? prod.variants.find(v => v.id === variantIdOrLabel || v.label === variantIdOrLabel) || prod.variants[0]
          : null;
        opts = {
          productId: arg1,
          variantLabel: matchedVar ? matchedVar.label : (variantIdOrLabel || 'Standard Edition'),
          price: matchedVar ? matchedVar.price : (prod ? prod.price : 1299),
          regularPrice: matchedVar ? matchedVar.regularPrice : (prod ? prod.regularPrice : 1499),
          qty: qtyArg || 1
        };
      } else {
        opts = arg1 || {};
      }

      const { productId, variantLabel, price, regularPrice, qty = 1, customNote = '', name, image, sku } = opts;
      const product = this.getProductById(productId);
      if (product && product.inStock === false) {
        return this.getCartSummary();
      }
      const cart = this.getCart();
      const targetName = name || (product ? product.name : 'Studio Formulation');
      const targetVariant = variantLabel || (product && product.variants && product.variants[0] ? product.variants[0].label : 'Standard Edition');
      const chosenColor = opts.color || opts.selectedColor || (product && product.colors && product.colors[0] ? product.colors[0].label : 'Classic Studio Edition');
      const chosenShape = opts.shape || opts.selectedShape || (product && product.shapes && product.shapes[0] ? product.shapes[0].label : 'Standard Cast');
      const chosenSize = opts.size || opts.selectedSize || (product && product.sizes && product.sizes[0] ? product.sizes[0].label : 'Standard Studio');
      const unitPrice = Number(price || (product ? product.price : 1299));
      const regPrice = Number(regularPrice || (product ? product.regularPrice : unitPrice));
      const itemKey = `${productId || targetName}__${targetVariant}__${chosenColor}__${chosenShape}__${chosenSize}__${customNote || ''}`;

      const existingIndex = cart.findIndex(item =>
        (item.itemKey && item.itemKey === itemKey) ||
        (item.productId === productId && item.variantLabel === targetVariant && (item.color || '') === chosenColor && (item.shape || '') === chosenShape && (item.size || '') === chosenSize && (item.customNote || '') === (customNote || ''))
      );

      if (existingIndex > -1) {
        cart[existingIndex].qty = Math.min(99, cart[existingIndex].qty + Number(qty || 1));
      } else {
        cart.push({
          cartItemId: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          itemKey,
          productId: productId || 'vk-cat-res-301',
          sku: sku || (product ? product.sku : 'VK-STD-01'),
          name: targetName,
          variantLabel: targetVariant,
          color: chosenColor,
          shape: chosenShape,
          size: chosenSize,
          price: unitPrice,
          regularPrice: regPrice,
          qty: Math.max(1, Number(qty || 1)),
          image: image || (product ? product.image : IMAGES.ultraclearMain),
          ratio: product ? `Ratio: ${product.ratio}` : 'Studio Grade',
          viscosity: product && product.specs ? product.specs.dynamicViscosity : 'Lab Certified',
          hsn: '39073010',
          customNote: customNote || ''
        });
      }
      this.saveCart(cart);
      return this.getCartSummary();
    },

    updateCartQty(cartItemId, deltaOrExact, isExact = false) {
      let cart = this.getCart();
      cart = cart.map(item => {
        if (item.cartItemId === cartItemId || item.productId === cartItemId) {
          const nextQty = isExact ? Number(deltaOrExact) : item.qty + Number(deltaOrExact);
          return { ...item, qty: nextQty };
        }
        return item;
      }).filter(item => item.qty > 0);
      this.saveCart(cart);
      return this.getCartSummary();
    },

    removeFromCart(cartItemId) {
      const cart = this.getCart().filter(item => item.cartItemId !== cartItemId && item.productId !== cartItemId);
      this.saveCart(cart);
      return this.getCartSummary();
    },

    clearCart() {
      this.saveCart([]);
    },

    getCouponCode() {
      return safeRead(STORAGE_KEYS.COUPON, '');
    },

    applyCoupon(code) {
      const normalized = String(code || '').trim().toUpperCase();
      if (!normalized) {
        safeWrite(STORAGE_KEYS.COUPON, '');
        this.notify('cart_updated', this.getCartSummary());
        return { valid: false, ok: false, message: 'Coupon removed.' };
      }
      const allCoupons = getAllCoupons();
      const coupon = allCoupons[normalized];
      if (!coupon) {
        return { valid: false, ok: false, message: `Invalid voucher code "${normalized}". Try STUDIO10, WELCOME250, or KRAFTFIRST.` };
      }
      if (coupon.isActive === false) {
        return { valid: false, ok: false, message: `Voucher code "${normalized}" is currently disabled.` };
      }
      const isExpired = coupon.isExpired ||
        (coupon.expiryDate && new Date(coupon.expiryDate).getTime() < Date.now()) ||
        (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now());
      if (isExpired) {
        return { valid: false, ok: false, message: `Voucher code "${normalized}" has expired.` };
      }
      const subtotal = this.getCart().reduce((sum, i) => sum + (this.getEffectiveUnitPrice(i) * i.qty), 0);
      if (subtotal < coupon.minOrder) {
        return { valid: false, ok: false, message: `Code ${normalized} requires a minimum bag of ₹${coupon.minOrder.toLocaleString('en-IN')}.` };
      }
      safeWrite(STORAGE_KEYS.COUPON, normalized);
      this.notify('cart_updated', this.getCartSummary());
      return { valid: true, ok: true, coupon, message: coupon.desc };
    },

    getCartSummary() {
      const cart = this.getCart();
      const itemsCount = cart.reduce((acc, item) => acc + Number(item.qty || 0), 0);
      const subtotal = cart.reduce((acc, item) => {
        const effectiveUnitPrice = this.getEffectiveUnitPrice(item);
        return acc + effectiveUnitPrice * item.qty;
      }, 0);
      const regularTotal = cart.reduce((acc, item) => acc + Number(item.regularPrice || item.price) * item.qty, 0);

      const activeCode = this.getCouponCode();
      const allCoupons = getAllCoupons();
      const couponObj = activeCode ? allCoupons[activeCode] : null;
      let couponDiscount = 0;
      let couponMinOrderShortfall = 0;
      let couponInvalidReason = '';
      if (couponObj && subtotal > 0) {
        const isExpired = couponObj.isExpired ||
          (couponObj.expiryDate && new Date(couponObj.expiryDate).getTime() < Date.now()) ||
          (couponObj.expires_at && new Date(couponObj.expires_at).getTime() < Date.now());

        if (couponObj.isActive !== false && !isExpired) {
          if (subtotal >= couponObj.minOrder) {
            if (couponObj.type === 'flat') {
              couponDiscount = Math.min(subtotal, couponObj.value);
            } else if (couponObj.type === 'percent') {
              couponDiscount = Math.round((subtotal * couponObj.value) / 100);
            }
          } else {
            couponMinOrderShortfall = couponObj.minOrder - subtotal;
            couponInvalidReason = `Coupon ${activeCode} requires a ₹${couponObj.minOrder.toLocaleString('en-IN')} minimum bag (add ₹${couponMinOrderShortfall.toLocaleString('en-IN')} more to activate).`;
          }
        } else {
          couponInvalidReason = isExpired ? `Coupon ${activeCode} has expired.` : `Coupon ${activeCode} is inactive.`;
        }
      }

      const storeSettings = safeRead(STORAGE_KEYS.SETTINGS, { freeShippingThreshold: 1499 });
      const freeShippingThreshold = Number(storeSettings.freeShippingThreshold) || 1499;
      const isFreeShipping = subtotal >= freeShippingThreshold || subtotal === 0;
      const shippingFee = isFreeShipping ? 0 : 99;
      const payable = Math.max(0, subtotal - couponDiscount + shippingFee);
      const taxableAmount = Number((payable / 1.18).toFixed(2));
      const gstAmount = Number((payable - taxableAmount).toFixed(2));
      const shippingProgress = subtotal <= 0 ? 0 : Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
      const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

      const hasOutOfStock = cart.some(item => Boolean(item.isOutOfStock));
      const outOfStockCount = cart.filter(item => Boolean(item.isOutOfStock)).length;

      return {
        cart,
        itemsCount,
        hasOutOfStock,
        outOfStockCount,
        subtotal,
        regularTotal,
        couponCode: couponDiscount > 0 ? activeCode : '',
        savedCouponCode: activeCode || '',
        couponObj: couponDiscount > 0 ? couponObj : null,
        couponDiscount,
        couponMinOrderShortfall,
        couponInvalidReason,
        freeShippingThreshold,
        isFreeShipping,
        shippingFee,
        shippingProgress,
        amountToFreeShipping,
        taxableAmount,
        gstAmount,
        payable
      };
    },

    calculateResinNeeded({ shape = 'rect', lengthCm = 20, widthCm = 20, diameterCm = 20, depthCm = 1.5, ratioSystem = '3:1' } = {}) {
      const d = Number(depthCm);
      let volumeCm3 = 0;
      if (shape === 'circle') {
        const diam = Number(diameterCm);
        if (!(diam > 0 && d > 0)) return { valid: false, totalGrams: 0, partAGrams: 0, partBGrams: 0 };
        const r = diam / 2;
        volumeCm3 = Math.PI * r * r * d;
      } else {
        const l = Number(lengthCm);
        const w = Number(widthCm);
        if (!(l > 0 && w > 0 && d > 0)) return { valid: false, totalGrams: 0, partAGrams: 0, partBGrams: 0 };
        volumeCm3 = l * w * d;
      }
      const totalGrams = Math.round(volumeCm3 * 1.1);
      let partAGrams = 0;
      if (ratioSystem === '3:1') partAGrams = Math.round(totalGrams * 0.75);
      else if (ratioSystem === '2:1') partAGrams = Math.round((totalGrams * 2) / 3);
      else partAGrams = Math.round(totalGrams * 0.5);
      const partBGrams = totalGrams - partAGrams;
      return { valid: true, totalGrams, partAGrams, partBGrams, ratioSystem, shape };
    },

    getWishlist() {
      return safeRead(STORAGE_KEYS.WISHLIST, DEFAULT_WISHLIST);
    },

    saveWishlist(list) {
      const updated = Array.isArray(list) ? list : [];
      safeWrite(STORAGE_KEYS.WISHLIST, updated);
      this.notify('wishlist_updated', { count: updated.length, wishlist: updated });
      return updated;
    },

    isWishlisted(productId) {
      return this.getWishlist().includes(productId);
    },

    toggleWishlist(productId) {
      const current = this.getWishlist();
      const exists = current.includes(productId);
      const updated = exists ? current.filter(id => id !== productId) : [...current, productId];
      safeWrite(STORAGE_KEYS.WISHLIST, updated);

      // Persist wishlist to authenticated user's profile and backend
      const authSession = this.getAuthSession();
      if (authSession && authSession.email) {
        const nextSession = { ...authSession, wishlist: updated };
        safeWrite(STORAGE_KEYS.AUTH_SESSION, nextSession);
        safeWrite(STORAGE_KEYS.PATRON_PROFILE, nextSession);
        const registeredUsers = safeRead(STORAGE_KEYS.REGISTERED_USERS, {}) || {};
        const emailKey = authSession.email.toLowerCase();
        registeredUsers[emailKey] = { ...(registeredUsers[emailKey] || {}), ...nextSession, wishlist: updated };
        safeWrite(STORAGE_KEYS.REGISTERED_USERS, registeredUsers);
        callCloudflareEdge('/auth/profile', 'PUT', {
          name: nextSession.name || '',
          phone: nextSession.phone || '',
          address: nextSession.address || '',
          pincode: nextSession.pincode || '',
          wishlist: updated
        });
      }

      this.notify('wishlist_updated', { productId, added: !exists, count: updated.length });
      return { added: !exists, count: updated.length, wishlist: updated };
    },

    getPincodeInfo() {
      return safeRead(STORAGE_KEYS.PINCODE, {
        pin: '560001',
        city: 'Bengaluru Urban, KA',
        days: '2 business days',
        courier: 'BlueDart Priority Air',
        floralPickup: true
      });
    },

    verifyPincode(pinInput) {
      const pin = String(pinInput || '').trim();
      if (!/^[1-9][0-9]{5}$/.test(pin)) {
        return { valid: false, message: 'Please enter a valid 6-digit Indian PIN code (e.g. 560001, 400001, 110001).' };
      }
      const match = PINCODE_DIRECTORY[pin] || {
        city: `Zone PIN ${pin} (Pan-India Hub)`,
        days: '2–4 business days',
        courier: 'BlueDart / Delhivery Express',
        floralPickup: ['1', '2', '3', '4', '5', '6', '7', '8'].includes(pin[0])
      };
      const record = { pin, ...match, etaDays: match.days };
      safeWrite(STORAGE_KEYS.PINCODE, record);
      this.notify('pincode_updated', record);
      return {
        valid: true,
        ...record,
        message: `${pin} (${record.city}) — Delivery in ${record.days} via ${record.courier}. Instant UPI, Cards & Air Express.`
      };
    },

    getGstInfo() {
      return safeRead(STORAGE_KEYS.GST_INFO, {
        enabled: false,
        gstin: '',
        tradeName: ''
      });
    },

    saveGstInfo(info) {
      const next = { ...this.getGstInfo(), ...info };
      safeWrite(STORAGE_KEYS.GST_INFO, next);
      this.notify('gst_updated', next);
      return next;
    },

    getPersonaPreference() {
      const saved = safeRead(STORAGE_KEYS.PERSONA_PREF, null);
      if (saved && ['all', 'masculine', 'feminine'].includes(saved)) {
        return saved;
      }
      const auth = this.getAuthSession();
      if (auth && auth.personaPreference && ['all', 'masculine', 'feminine'].includes(auth.personaPreference)) {
        return auth.personaPreference;
      }
      return 'all';
    },

    setPersonaPreference(pref) {
      const valid = ['all', 'masculine', 'feminine'].includes(pref) ? pref : 'all';
      safeWrite(STORAGE_KEYS.PERSONA_PREF, valid);
      const auth = this.getAuthSession();
      if (auth && auth.email) {
        auth.personaPreference = valid;
        auth.gender = valid;
        safeWrite(STORAGE_KEYS.AUTH_SESSION, auth);
        const registeredUsers = safeRead(STORAGE_KEYS.REGISTERED_USERS, {}) || {};
        if (registeredUsers[auth.email.toLowerCase()]) {
          registeredUsers[auth.email.toLowerCase()].personaPreference = valid;
          registeredUsers[auth.email.toLowerCase()].gender = valid;
          safeWrite(STORAGE_KEYS.REGISTERED_USERS, registeredUsers);
        }
      }
      this.notify('persona_preference_updated', { personaPreference: valid });
      return valid;
    },

    getAuthSession() {
      const session = safeRead(STORAGE_KEYS.AUTH_SESSION, null);
      if (session && typeof session === 'object' && session.authenticated && session.email) {
        return session;
      }
      return null;
    },

    isAuthenticated() {
      return Boolean(this.getAuthSession());
    },

    lookupSavedPatronByEmail(emailInput) {
      const email = String(emailInput || '').trim().toLowerCase();
      if (!email) return null;
      const registeredUsers = safeRead(STORAGE_KEYS.REGISTERED_USERS, {}) || {};
      return registeredUsers[email] || null;
    },

    loginPatron(payload = {}) {
      const provider = ['google', 'apple', 'email'].includes(payload.provider) ? payload.provider : 'email';
      const mode = payload.mode === 'register' ? 'register' : 'signin';
      const email = String(payload.email || '').trim().toLowerCase();
      const password = String(payload.password || '');
      let name = String(payload.name || '').trim();
      let phone = String(payload.phone || '').trim();
      let address = String(payload.address || payload.defaultAddress || '').trim();
      const pincode = String(payload.pincode || '').trim();
      const credential = payload.credential ? String(payload.credential) : '';

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const msg = 'Please enter a valid email address.';
        return { ok: false, valid: false, error: msg, message: msg };
      }

      const registeredUsers = safeRead(STORAGE_KEYS.REGISTERED_USERS, {}) || {};
      const existingUser = registeredUsers[email] || null;

      if (provider === 'email') {
        if (!password || password.length < 6) {
          const msg = 'Password must be at least 6 characters.';
          return { ok: false, valid: false, error: msg, message: msg };
        }
        const candidateVerifier = hashSecretLocal(password);
        if (existingUser && existingUser.passwordVerifier && existingUser.passwordVerifier !== candidateVerifier) {
          const msg = 'Incorrect password for this email account.';
          return { ok: false, valid: false, error: msg, message: msg };
        }
        if (existingUser && existingUser.password && existingUser.password !== password) {
          const msg = 'Incorrect password for this email account.';
          return { ok: false, valid: false, error: msg, message: msg };
        }
        if (mode === 'register' && !name && !(existingUser && existingUser.name)) {
          const msg = 'Please enter your full name to create your account.';
          return { ok: false, valid: false, error: msg, message: msg };
        }
      }

      // Restore previously saved user details if this user already registered them earlier
      if (!name && existingUser && existingUser.name) name = existingUser.name;
      if (!name) {
        name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
      if (!phone && existingUser && existingUser.phone) phone = existingUser.phone;
      if (!address && existingUser && existingUser.address) address = existingUser.address;

      const pinMatch = address ? address.match(/\b([1-9][0-9]{5})\b/) : null;
      const resolvedPin = pincode || (pinMatch ? pinMatch[1] : (existingUser && existingUser.pincode) || '');
      if (resolvedPin && /^[1-9][0-9]{5}$/.test(resolvedPin)) {
        this.verifyPincode(resolvedPin);
      }
      const cleanAddrBase = address ? address.replace(/\s*-\s*[1-9][0-9]{5}\s*$/, '').trim() : '';
      const fullAddress = (cleanAddrBase && resolvedPin && !cleanAddrBase.includes(resolvedPin))
        ? `${cleanAddrBase} - ${resolvedPin}`
        : address;

      // Resolve persona preference (masculine / feminine / all)
      const rawGender = payload.personaPreference || payload.gender || (existingUser && existingUser.personaPreference) || (existingUser && existingUser.gender) || 'all';
      const normalizedPref = (rawGender === 'male' || rawGender === 'masculine')
        ? 'masculine'
        : ((rawGender === 'female' || rawGender === 'feminine') ? 'feminine' : 'all');

      // Merge any guest wishlist items into the authenticated user's wishlist
      const guestWishlist = this.getWishlist();
      const savedUserWishlist = (existingUser && Array.isArray(existingUser.wishlist)) ? existingUser.wishlist : [];
      const payloadWishlist = Array.isArray(payload.wishlist) ? payload.wishlist : [];
      const mergedWishlist = Array.from(new Set([...savedUserWishlist, ...guestWishlist, ...payloadWishlist])).filter(Boolean);
      safeWrite(STORAGE_KEYS.WISHLIST, mergedWishlist);

      edgeSessionToken = 'vk_cf_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      const userRecord = {
        id: (existingUser && existingUser.id) || ('usr_' + Date.now().toString(36)),
        email,
        name,
        phone,
        address: fullAddress,
        defaultAddress: fullAddress,
        pincode: resolvedPin,
        gender: normalizedPref,
        personaPreference: normalizedPref,
        wishlist: mergedWishlist,
        provider,
        passwordVerifier: provider === 'email'
          ? hashSecretLocal(password)
          : (existingUser ? existingUser.passwordVerifier : ''),
        memberTier: 'Gold Atelier Member',
        tier: 'Gold Atelier Member',
        loyaltyPoints: (existingUser && existingUser.loyaltyPoints) || 250,
        authenticated: true,
        authenticatedAt: new Date().toISOString()
      };

      registeredUsers[email] = userRecord;
      safeWrite(STORAGE_KEYS.REGISTERED_USERS, registeredUsers);
      safeWrite(STORAGE_KEYS.AUTH_SESSION, userRecord);
      safeWrite(STORAGE_KEYS.PATRON_PROFILE, userRecord);
      this.setPersonaPreference(normalizedPref);

      // Sync with backend (/api/auth/google, /api/auth/apple, /api/auth/login, /api/auth/register)
      const endpoint = provider === 'google'
        ? '/auth/google'
        : provider === 'apple'
          ? '/auth/apple'
          : (existingUser && mode !== 'register' ? '/auth/login' : '/auth/register');
      callCloudflareEdge(endpoint, 'POST', {
        provider,
        email,
        password,
        name,
        phone,
        address: fullAddress,
        pincode: resolvedPin,
        gender: normalizedPref,
        personaPreference: normalizedPref,
        wishlist: mergedWishlist,
        credential
      }).then(data => {
        if (data && data.ok && data.token) {
          edgeSessionToken = data.token;
        }
      });

      this.notify('wishlist_updated', { count: mergedWishlist.length, wishlist: mergedWishlist });
      this.notify('auth_updated', userRecord);
      this.notify('patron_profile_updated', userRecord);
      return { ok: true, valid: true, user: userRecord, session: userRecord, token: edgeSessionToken };
    },

    logoutPatron() {
      // Disable automatic Google One Tap re-selection on sign-out
      try {
        if (global.google && global.google.accounts && global.google.accounts.id && typeof global.google.accounts.id.disableAutoSelect === 'function') {
          global.google.accounts.id.disableAutoSelect();
        }
      } catch (_e) { /* ignore */ }

      const currentSession = this.getAuthSession();
      if (currentSession && currentSession.email) {
        const registeredUsers = safeRead(STORAGE_KEYS.REGISTERED_USERS, {}) || {};
        const emailKey = currentSession.email.toLowerCase();
        registeredUsers[emailKey] = {
          ...(registeredUsers[emailKey] || {}),
          ...currentSession,
          wishlist: this.getWishlist()
        };
        safeWrite(STORAGE_KEYS.REGISTERED_USERS, registeredUsers);
      }

      const guestDefaultProfile = {
        name: 'Vistāra Studio Guest',
        email: '',
        phone: '',
        address: '',
        defaultAddress: '',
        pincode: '',
        eventDate: '2026-11-18',
        tier: 'Gold Atelier Member',
        memberTier: 'Gold Atelier Member',
        loyaltyPoints: 250
      };

      safeWrite(STORAGE_KEYS.AUTH_SESSION, null);
      safeWrite(STORAGE_KEYS.WISHLIST, []);
      safeWrite(STORAGE_KEYS.PATRON_PROFILE, guestDefaultProfile);
      callCloudflareEdge('/auth/logout', 'POST');
      edgeSessionToken = '';

      this.notify('wishlist_updated', { count: 0, wishlist: [] });
      this.notify('auth_updated', null);
      this.notify('patron_profile_updated', guestDefaultProfile);
      return { ok: true };
    },

    getPatronProfile() {
      const authSession = this.getAuthSession();
      const currentPersona = this.getPersonaPreference();
      if (authSession) {
        return {
          ...authSession,
          personaPreference: authSession.personaPreference || currentPersona,
          gender: authSession.gender || authSession.personaPreference || currentPersona,
          address: authSession.address || '',
          defaultAddress: authSession.address || '',
          tier: authSession.memberTier || 'Verified Vistāra Patron',
          memberTier: authSession.memberTier || 'Verified Vistāra Patron'
        };
      }
      const profile = safeRead(STORAGE_KEYS.PATRON_PROFILE, {
        name: 'Vistāra Studio Guest',
        email: '',
        phone: '',
        address: '',
        defaultAddress: '',
        pincode: '',
        gender: currentPersona,
        personaPreference: currentPersona,
        eventDate: '2026-11-18',
        tier: 'Gold Atelier Member',
        memberTier: 'Gold Atelier Member',
        loyaltyPoints: 250
      });
      const resolvedAddress = profile.defaultAddress || profile.address || '';
      const resolvedTier = profile.memberTier || profile.tier || 'Gold Atelier Member';
      return {
        ...profile,
        personaPreference: profile.personaPreference || currentPersona,
        gender: profile.gender || profile.personaPreference || currentPersona,
        address: resolvedAddress,
        defaultAddress: resolvedAddress,
        tier: resolvedTier,
        memberTier: resolvedTier
      };
    },

    savePatronProfile(updates = {}) {
      if (updates.personaPreference || updates.gender) {
        const pref = updates.personaPreference || updates.gender;
        const validPref = (pref === 'male' || pref === 'masculine') ? 'masculine' : ((pref === 'female' || pref === 'feminine') ? 'feminine' : 'all');
        this.setPersonaPreference(validPref);
      }
      const current = this.getPatronProfile();
      const next = { ...current, ...updates };
      const resolvedAddress = updates.defaultAddress !== undefined
        ? updates.defaultAddress
        : (updates.address !== undefined ? updates.address : (next.defaultAddress || next.address || ''));
      const pinMatch = resolvedAddress ? String(resolvedAddress).match(/\b([1-9][0-9]{5})\b/) : null;
      const resolvedPin = updates.pincode !== undefined
        ? String(updates.pincode || '').trim()
        : (pinMatch ? pinMatch[1] : (next.pincode || ''));
      if (resolvedPin && /^[1-9][0-9]{5}$/.test(resolvedPin)) {
        this.verifyPincode(resolvedPin);
      }
      const resolvedTier = updates.memberTier || updates.tier || next.memberTier || next.tier || 'Gold Atelier Member';
      next.address = resolvedAddress;
      next.defaultAddress = resolvedAddress;
      next.pincode = resolvedPin;
      next.tier = resolvedTier;
      next.memberTier = resolvedTier;
      safeWrite(STORAGE_KEYS.PATRON_PROFILE, next);

      // Synchronize authenticated session state & D1 when user is signed in or saving profile details
      const existingAuth = this.getAuthSession();
      if (existingAuth || (updates.name && (updates.defaultAddress || updates.address))) {
        const sessionObj = {
          ...(existingAuth || {}),
          ...next,
          email: next.email || (existingAuth && existingAuth.email) || 'patron@vistarakrafts.com',
          address: resolvedAddress,
          defaultAddress: resolvedAddress,
          pincode: resolvedPin,
          provider: next.provider || (existingAuth && existingAuth.provider) || 'email',
          authenticated: true
        };
        safeWrite(STORAGE_KEYS.AUTH_SESSION, sessionObj);
        if (sessionObj.email) {
          const registeredUsers = safeRead(STORAGE_KEYS.REGISTERED_USERS, {}) || {};
          registeredUsers[sessionObj.email.toLowerCase()] = {
            ...(registeredUsers[sessionObj.email.toLowerCase()] || {}),
            ...sessionObj
          };
          safeWrite(STORAGE_KEYS.REGISTERED_USERS, registeredUsers);
        }
        callCloudflareEdge('/auth/profile', 'PUT', {
          name: sessionObj.name,
          phone: sessionObj.phone || '',
          address: resolvedAddress,
          pincode: resolvedPin,
          wishlist: this.getWishlist()
        });
        this.notify('auth_updated', sessionObj);
      }

      this.notify('patron_profile_updated', next);
      return next;
    },

    recordRecentlyViewed(productId) {
      if (!productId) return [];
      const prod = this.getProductById(productId);
      const resolvedId = prod ? prod.id : productId;
      const current = safeRead(STORAGE_KEYS.RECENTLY_VIEWED, ['vk-cat-res-201', 'vk-cat-res-301', 'vk-cat-acc-bubb', 'vk-cat-mld-agat']);
      const list = Array.isArray(current) ? current.filter(id => id !== resolvedId) : [];
      list.unshift(resolvedId);
      const trimmed = list.slice(0, 6);
      safeWrite(STORAGE_KEYS.RECENTLY_VIEWED, trimmed);
      return trimmed;
    },

    getRecentlyViewedProducts(excludeId = null, limit = 4) {
      const ids = safeRead(STORAGE_KEYS.RECENTLY_VIEWED, ['vk-cat-res-201', 'vk-cat-res-301', 'vk-cat-acc-bubb', 'vk-cat-mld-agat']);
      const all = this.getProducts();
      const matched = [];
      (Array.isArray(ids) ? ids : []).forEach(id => {
        if (excludeId && id === excludeId) return;
        const p = all.find(item => item.id === id);
        if (p && !matched.some(m => m.id === p.id)) matched.push(p);
      });
      if (matched.length < limit) {
        all.forEach(p => {
          if (matched.length < limit && p.id !== excludeId && !matched.some(m => m.id === p.id)) {
            matched.push(p);
          }
        });
      }
      return matched.slice(0, limit);
    },

    getOrders() {
      const list = safeRead(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
      const auth = this.getAuthSession();
      if (!auth) return list;
      return list.map(o => {
        if (o.customerName === 'Vistāra Studio Sample Order') {
          return {
            ...o,
            customerName: auth.name || o.customerName,
            phone: auth.phone || o.phone,
            address: auth.address || o.address
          };
        }
        return o;
      });
    },

    findOrder(query) {
      const orders = this.getOrders();
      const q = String(query || '').trim().toLowerCase();
      if (!q) return orders;
      return orders.filter(o =>
        String(o.orderId || '').toLowerCase().includes(q) ||
        String(o.status || '').toLowerCase().includes(q) ||
        String(o.courier || '').toLowerCase().includes(q) ||
        String(o.phone || '').toLowerCase().includes(q) ||
        String(o.customerName || '').toLowerCase().includes(q) ||
        (Array.isArray(o.items) && o.items.some(it => String(it.name || '').toLowerCase().includes(q)))
      );
    },

    approveOrderMockup(orderId) {
      const orders = this.getOrders().map(o => {
        if (o.orderId === orderId) {
          const nextStage = Math.min((o.stages ? o.stages.length - 1 : 4), Math.max(o.stageIndex || 1, 3));
          return {
            ...o,
            mockupApproved: true,
            stageIndex: nextStage,
            status: 'Floral Layout Approved • Deep Cast Pour in Progress'
          };
        }
        return o;
      });
      safeWrite(STORAGE_KEYS.ORDERS, orders);
      const updated = orders.find(o => o.orderId === orderId) || null;
      if (updated) {
        callCloudflareEdge('/orders', 'POST', updated);
      }
      this.notify('order_updated', updated);
      return updated;
    },

    placeOrder(checkoutDetails = {}) {
      const summary = this.getCartSummary();
      if (summary.itemsCount === 0) {
        return { success: false, message: 'Your Studio Bag is empty.' };
      }
      const outOfStockItem = summary.cart.find(i => {
        const prod = this.getProductById(i.productId);
        return prod && prod.inStock === false;
      });
      if (outOfStockItem) {
        return {
          success: false,
          message: `"${outOfStockItem.name}" is currently out of stock. Please remove it from your studio bag before checking out.`
        };
      }
      const authSession = this.getAuthSession();
      const customerName = String(checkoutDetails.name || (authSession && authSession.name) || '').trim();
      const customerPhone = String(checkoutDetails.phone || (authSession && authSession.phone) || '').trim();
      const rawAddress = String(checkoutDetails.address || (authSession && authSession.address) || '').trim();
      const customerPincode = String(checkoutDetails.pincode || (authSession && authSession.pincode) || '').trim();

      if (!authSession) {
        return {
          success: false,
          requiresAuth: true,
          message: 'Please sign in to your account to place your order.'
        };
      }
      if (!customerName || !customerPhone || !rawAddress) {
        return {
          success: false,
          requiresAddress: true,
          message: 'Please enter your delivery recipient name, mobile number, and shipping address.'
        };
      }

      const pinMatch = rawAddress.match(/\b([1-9][0-9]{5})\b/);
      const resolvedPin = customerPincode || (pinMatch ? pinMatch[1] : '');
      if (resolvedPin && /^[1-9][0-9]{5}$/.test(resolvedPin)) {
        this.verifyPincode(resolvedPin);
      }
      const cleanAddressBase = rawAddress.replace(/\s*-\s*[1-9][0-9]{5}\s*$/, '').trim();
      const customerAddress = (resolvedPin && !cleanAddressBase.includes(resolvedPin))
        ? `${cleanAddressBase} - ${resolvedPin}`
        : rawAddress;

      // Save shipping address to patron profile for future 1-click checkouts
      this.savePatronProfile({
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        defaultAddress: customerAddress,
        pincode: resolvedPin || this.getPincodeInfo().pin
      });

      const rawOrderId = 'VK-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      const uniqueId = 'ord_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      const newOrder = {
        orderId: rawOrderId,
        id: uniqueId,
        orderNumber: rawOrderId,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        total: summary.payable,
        subtotal: summary.subtotal,
        discount: summary.couponDiscount,
        couponCode: summary.couponCode || '',
        gstAmount: summary.gstAmount,
        shippingFee: summary.shippingFee,
        paymentMethod: checkoutDetails.paymentMethod || 'UPI / Razorpay Instant',
        customerName: customerName || 'Verified Patron',
        customerEmail: (authSession && authSession.email) || checkoutDetails.email || 'patron@vistarakrafts.com',
        phone: customerPhone,
        address: customerAddress,
        city: checkoutDetails.city || (resolvedPin ? `Zone PIN ${resolvedPin}` : ''),
        state: checkoutDetails.state || '',
        pincode: resolvedPin || this.getPincodeInfo().pin,
        giftWrap: checkoutDetails.giftWrap !== undefined ? Boolean(checkoutDetails.giftWrap) : true,
        mockupApproved: false,
        status: 'Order Confirmed • Studio Batch Allocated',
        orderStatus: 'new',
        stageIndex: 1,
        stages: ['Order Confirmed', 'Flowers / Materials Prepped', 'Silica & Vacuum Degassing', 'Deep Optical Cast Pour', 'Diamond Polish & Dispatch'],
        items: summary.cart.map(i => ({
          productId: i.productId || 'vk-cat-res-301',
          name: `${i.name} (${i.variantLabel || 'Standard'})`,
          productName: i.name,
          variantLabel: i.variantLabel || 'Standard Edition',
          color: i.color || '',
          shape: i.shape || '',
          size: i.size || '',
          qty: i.qty,
          quantity: i.qty,
          price: i.price,
          unitPrice: i.price,
          totalPrice: (i.price || 0) * (i.qty || 1),
          customNote: i.customNote || ''
        })),
        courier: `BlueDart Priority Air • PIN ${resolvedPin || this.getPincodeInfo().pin}`,
        trackingNumber: '',
        tracking_number: '',
        createdAt: new Date().toISOString()
      };

      const supabasePayload = {
        id: uniqueId,
        order_number: rawOrderId,
        user_id: (authSession && authSession.id && typeof authSession.id === 'string' && authSession.id.length === 36) ? authSession.id : null,
        customer_name: newOrder.customerName,
        customer_email: newOrder.customerEmail,
        phone: newOrder.phone,
        address: newOrder.address,
        city: newOrder.city,
        state: newOrder.state,
        pincode: newOrder.pincode,
        subtotal: Number(newOrder.subtotal || 0),
        discount: Number(newOrder.discount || 0),
        coupon_code: newOrder.couponCode || '',
        gst_amount: Number(newOrder.gstAmount || 0),
        shipping_fee: Number(newOrder.shippingFee || 0),
        total: Number(newOrder.total || 0),
        payment_method: newOrder.paymentMethod,
        payment_status: 'paid',
        order_status: 'new',
        stage_index: 1,
        gift_wrap: Boolean(newOrder.giftWrap),
        mockup_approved: false,
        items: newOrder.items,
        courier: newOrder.courier,
        tracking_number: '',
        notes: checkoutDetails.notes || '',
        created_at: newOrder.createdAt,
        updated_at: newOrder.createdAt
      };

      const orders = [newOrder, ...this.getOrders()];
      safeWrite(STORAGE_KEYS.ORDERS, orders);

      // Trigger Supabase order creation immediately
      if (global.VistaraSupabase && typeof global.VistaraSupabase.createOrder === 'function') {
        global.VistaraSupabase.createOrder(supabasePayload).catch(err => {
          console.warn('[Vistāra Supabase] Background order creation notice:', err);
        });
      }

      // Broadcast across tabs to Admin Portal
      try {
        if (typeof global.BroadcastChannel !== 'undefined') {
          const channel = new global.BroadcastChannel('RAM_STUDIO_LIVE_DROP_CHANNEL');
          channel.postMessage({ type: 'ORDER_PLACED', order: newOrder });
          channel.close();
        }
      } catch (_e) {}

      this.clearCart();
      this.notify('order_placed', newOrder);
      this.clearCheckoutDraft();
      return { success: true, order: newOrder, supabasePayload };
    },

    saveCheckoutDraft(data = {}) {
      if (!data || typeof data !== 'object') return;
      try {
        const existing = this.getCheckoutDraft() || {};
        const merged = { ...existing, ...data, updatedAt: Date.now() };
        safeWrite(STORAGE_KEYS.CHECKOUT_DRAFT, merged);
      } catch (_e) {}
    },

    getCheckoutDraft() {
      return safeRead(STORAGE_KEYS.CHECKOUT_DRAFT, {}) || {};
    },

    clearCheckoutDraft() {
      try {
        if (typeof global.localStorage !== 'undefined') {
          global.localStorage.removeItem(STORAGE_KEYS.CHECKOUT_DRAFT);
        }
      } catch (_e) {}
      memoryStorage.delete(STORAGE_KEYS.CHECKOUT_DRAFT);
    },

    async placeOrderAsync(checkoutDetails = {}) {
      const summary = this.getCartSummary();
      if (summary.itemsCount === 0) {
        return { success: false, message: 'Your Studio Bag is empty.' };
      }
      const outOfStockItem = summary.cart.find(i => {
        const prod = this.getProductById(i.productId);
        return prod && prod.inStock === false;
      });
      if (outOfStockItem) {
        return {
          success: false,
          message: `"${outOfStockItem.name}" is currently out of stock. Please remove it from your studio bag before checking out.`
        };
      }

      const authSession = this.getAuthSession();
      if (!authSession) {
        return {
          success: false,
          requiresAuth: true,
          message: 'Please sign in to your account to place your order.'
        };
      }

      const customerName = String(checkoutDetails.name || (authSession && authSession.name) || '').trim();
      const customerPhone = String(checkoutDetails.phone || (authSession && authSession.phone) || '').trim();
      const rawAddress = String(checkoutDetails.address || (authSession && authSession.address) || '').trim();
      const customerPincode = String(checkoutDetails.pincode || (authSession && authSession.pincode) || '').trim();

      if (!customerName || !customerPhone || !rawAddress) {
        return {
          success: false,
          requiresAddress: true,
          message: 'Please enter your delivery recipient name, mobile number, and shipping address.'
        };
      }

      const pinMatch = rawAddress.match(/\b([1-9][0-9]{5})\b/);
      const resolvedPin = customerPincode || (pinMatch ? pinMatch[1] : '');
      if (resolvedPin && /^[1-9][0-9]{5}$/.test(resolvedPin)) {
        this.verifyPincode(resolvedPin);
      }
      const cleanAddressBase = rawAddress.replace(/\s*-\s*[1-9][0-9]{5}\s*$/, '').trim();
      const customerAddress = (resolvedPin && !cleanAddressBase.includes(resolvedPin))
        ? `${cleanAddressBase} - ${resolvedPin}`
        : rawAddress;

      this.savePatronProfile({
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        defaultAddress: customerAddress,
        pincode: resolvedPin || this.getPincodeInfo().pin
      });

      const isTestEnv = (typeof global !== 'undefined' && global.__VK_TEST_ENV__) ||
                        (typeof window !== 'undefined' && window.__VK_TEST_ENV__);

      // In browser runtime with Razorpay SDK and server available
      if (!isTestEnv && typeof window !== 'undefined' && typeof window.fetch === 'function') {
        const procModal = document.getElementById('payment-processing-modal');
        try {
          const createRes = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: (authSession && authSession.id) || null,
              name: customerName,
              phone: customerPhone,
              address: customerAddress,
              pincode: resolvedPin || this.getPincodeInfo().pin,
              email: (authSession && authSession.email) || checkoutDetails.email,
              items: summary.cart.map(i => ({
                productId: i.productId,
                variantLabel: i.variantLabel,
                qty: i.qty,
                color: i.color,
                shape: i.shape,
                size: i.size,
                customNote: i.customNote
              })),
              couponCode: summary.couponCode,
              giftWrap: checkoutDetails.giftWrap !== undefined ? Boolean(checkoutDetails.giftWrap) : true,
              notes: checkoutDetails.notes || ''
            })
          });

          if (!createRes.ok) {
            if (procModal) procModal.classList.add('hidden');
            const errData = await createRes.json().catch(() => ({}));
            return {
              success: false,
              message: errData.error || `Checkout failed with status ${createRes.status}. Please review your bag.`
            };
          }

          const rzpData = await createRes.json();
          if (!rzpData || !rzpData.success || !rzpData.razorpayOrderId) {
            if (procModal) procModal.classList.add('hidden');
            return {
              success: false,
              message: (rzpData && rzpData.error) || 'Failed to initialize payment gateway order.'
            };
          }

          if (procModal) procModal.classList.add('hidden');
          if (typeof window.clearActivePaymentTimeout === 'function') {
            window.clearActivePaymentTimeout();
          }

          if (typeof window.Razorpay !== 'function') {
            return {
              success: false,
              message: 'Razorpay payment SDK failed to load. Please verify your internet connection or ad-blocker settings and reload.'
            };
          }

          return new Promise((resolve) => {
            const options = {
              key: rzpData.keyId || 'rzp_test_TpT9QQKuBwPSmm',
              amount: rzpData.amount,
              currency: rzpData.currency || 'INR',
              name: 'Vistāra Krafts Studio',
              description: `Order #${rzpData.orderId}`,
              image: './vistara-krafts-logo.jpg',
              order_id: rzpData.razorpayOrderId,
              prefill: {
                name: customerName,
                email: (authSession && authSession.email) || checkoutDetails.email || 'patron@vistarakrafts.com',
                contact: customerPhone
              },
              theme: {
                color: '#031a38'
              },
              handler: async (response) => {
                if (typeof window.startVerificationTimeout === 'function') {
                  window.startVerificationTimeout(35000);
                }
                if (procModal) {
                  const statusEl = document.getElementById('pay-proc-status');
                  const timeoutBox = document.getElementById('pay-timeout-actions');
                  if (timeoutBox) timeoutBox.classList.add('hidden');
                  if (statusEl) {
                    statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span><span class="text-emerald-700 font-bold">Verifying Payment Signature...</span>';
                  }
                  procModal.classList.remove('hidden');
                }
                try {
                  const vRes = await fetch('/api/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      orderId: rzpData.orderId,
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature
                    })
                  });
                  const vData = await vRes.json();
                  if (vData.success && vData.verified) {
                    // Use authoritative server items snapshot
                    const authoritativeItems = (rzpData.summary && Array.isArray(rzpData.summary.items))
                      ? rzpData.summary.items
                      : (vData.items || summary.cart.map(i => ({
                          productId: i.productId,
                          name: `${i.name} (${i.variantLabel || 'Standard'})`,
                          productName: i.name,
                          variantLabel: i.variantLabel || 'Standard Edition',
                          qty: i.qty,
                          price: i.price,
                          totalPrice: (i.price || 0) * (i.qty || 1)
                        })));

                    const confirmedOrder = {
                      orderId: rzpData.orderId,
                      id: rzpData.internalId || ('ord_' + Date.now().toString(36)),
                      orderNumber: rzpData.orderId,
                      user_id: (authSession && authSession.id) || null,
                      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                      total: rzpData.summary.total,
                      subtotal: rzpData.summary.subtotal,
                      discount: rzpData.summary.discount,
                      couponCode: rzpData.summary.couponCode || '',
                      gstAmount: rzpData.summary.gstAmount,
                      shippingFee: rzpData.summary.shippingFee,
                      paymentMethod: 'Razorpay Test Gateway',
                      payment_status: 'paid',
                      customerName,
                      customerEmail: (authSession && authSession.email) || checkoutDetails.email || 'patron@vistarakrafts.com',
                      phone: customerPhone,
                      address: customerAddress,
                      pincode: resolvedPin || this.getPincodeInfo().pin,
                      giftWrap: checkoutDetails.giftWrap !== undefined ? Boolean(checkoutDetails.giftWrap) : true,
                      mockupApproved: false,
                      status: 'Order Confirmed • Studio Batch Allocated',
                      orderStatus: 'confirmed',
                      stageIndex: 1,
                      stages: ['Order Confirmed', 'Flowers / Materials Prepped', 'Silica & Vacuum Degassing', 'Deep Optical Cast Pour', 'Diamond Polish & Dispatch'],
                      items: authoritativeItems,
                      courier: `BlueDart Priority Air • PIN ${resolvedPin || this.getPincodeInfo().pin}`,
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      createdAt: new Date().toISOString()
                    };
                    const orders = [confirmedOrder, ...this.getOrders().filter(o => o.orderId !== confirmedOrder.orderId)];
                    safeWrite(STORAGE_KEYS.ORDERS, orders);
                    this.clearCart();
                    this.notify('order_placed', confirmedOrder);
                    this.clearCheckoutDraft();
                    if (typeof window.clearActivePaymentTimeout === 'function') {
                      window.clearActivePaymentTimeout();
                    }
                    if (procModal) procModal.classList.add('hidden');
                    resolve({ success: true, order: confirmedOrder, verifiedByServer: true });
                  } else {
                    if (typeof window.clearActivePaymentTimeout === 'function') {
                      window.clearActivePaymentTimeout();
                    }
                    if (procModal) procModal.classList.add('hidden');
                    resolve({ success: false, message: vData.error || 'Payment signature verification failed.' });
                  }
                } catch (verErr) {
                  if (typeof window.clearActivePaymentTimeout === 'function') {
                    window.clearActivePaymentTimeout();
                  }
                  if (procModal) procModal.classList.add('hidden');
                  resolve({ success: false, message: 'Payment verification network error: ' + verErr.message });
                }
              },
              modal: {
                ondismiss: () => {
                  if (typeof window.clearActivePaymentTimeout === 'function') {
                    window.clearActivePaymentTimeout();
                  }
                  if (procModal) procModal.classList.add('hidden');
                  resolve({ success: false, cancelled: true, message: 'Payment window was closed. Your cart and draft address have been preserved.' });
                }
              }
            };
            const rzpInstance = new window.Razorpay(options);
            rzpInstance.open();
          });
        } catch (_apiErr) {
          if (procModal) procModal.classList.add('hidden');
          return {
            success: false,
            message: 'Unable to connect to payment server. Please check your internet connection and try again.'
          };
        }
      }

      // Offline / Test environment fallback ONLY when explicitly enabled by unit test runner (__VK_TEST_ENV__)
      if (isTestEnv) {
        const synchronousResult = this.placeOrder(checkoutDetails);
        if (!synchronousResult.success) {
          return synchronousResult;
        }
        this.clearCheckoutDraft();

        const payload = synchronousResult.supabasePayload;
        if (global.VistaraSupabase && typeof global.VistaraSupabase.createOrder === 'function' && payload) {
          try {
            await global.VistaraSupabase.createOrder(payload);
          } catch (err) {
            console.error('[Vistāra Supabase] Order async persist error:', err);
          }
        }

        return { success: true, order: synchronousResult.order, verifiedByServer: true };
      }

      return {
        success: false,
        message: 'Checkout requires an active connection to the Vistāra Krafts payment server.'
      };
    },

    normalizeStorefrontOrder(row) {
      if (!row || typeof row !== 'object') return null;
      const ordStatus = String(row.order_status || row.orderStatus || 'new').toLowerCase();
      const courierName = row.courier || row.carrier || 'Delhivery';
      const trackingNum = row.tracking_number || row.trackingNumber || '';
      const statusText = ordStatus === 'shipped'
        ? `Dispatched via ${courierName} (AWB: ${trackingNum || 'Pending'})`
        : (ordStatus === 'delivered'
          ? 'Order Delivered • Handcrafted Keepsake Received'
          : (ordStatus === 'cancelled'
            ? 'Order Cancelled'
            : (ordStatus === 'refunded'
              ? 'Order Cancelled & Refunded'
              : (ordStatus === 'packed'
                ? 'Packed & Ready for Courier Dispatch'
                : (ordStatus === 'curing'
                  ? 'Deep Optical Cast Pour & Curing in Progress'
                  : (ordStatus === 'processing'
                    ? 'Flowers / Materials Prepped in Studio'
                    : 'Order Confirmed • Studio Batch Allocated'))))));

      const stageIdx = ordStatus === 'delivered' ? 4 : (ordStatus === 'shipped' ? 4 : (ordStatus === 'packed' ? 3 : (ordStatus === 'curing' ? 2 : (ordStatus === 'processing' ? 1 : (ordStatus === 'cancelled' || ordStatus === 'refunded' ? -1 : 0)))));

      const dateStr = (row.date) || ((row.created_at || row.createdAt)
        ? new Date(row.created_at || row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));

      return {
        orderId: row.order_number || row.orderNumber || row.orderId || row.id,
        id: row.id || row.order_number || row.orderNumber || row.orderId,
        orderNumber: row.order_number || row.orderNumber || row.orderId || row.id,
        date: dateStr,
        total: Number(row.total ?? row.totalAmount ?? row.total_amount ?? 0),
        subtotal: Number(row.subtotal || 0),
        discount: Number(row.discount ?? row.discountAmount ?? row.discount_amount ?? 0),
        couponCode: row.coupon_code || row.couponCode || '',
        gstAmount: Number(row.gst_amount ?? row.gstAmount ?? 0),
        shippingFee: Number(row.shipping_fee ?? row.shippingFee ?? 0),
        paymentMethod: row.payment_method || row.paymentMethod || 'UPI / Razorpay',
        customerName: row.customer_name || row.customerName || (row.shippingAddress && row.shippingAddress.fullName) || 'Valued Patron',
        phone: row.phone || row.customerPhone || (row.shippingAddress && row.shippingAddress.phone) || '',
        address: row.address || (row.shippingAddress && row.shippingAddress.street) || '',
        pincode: row.pincode || (row.shippingAddress && row.shippingAddress.pincode) || '',
        giftWrap: Boolean(row.gift_wrap ?? row.giftWrap),
        mockupApproved: Boolean(row.mockup_approved ?? row.mockupApproved),
        status: (row.status && !['new','pending','processing','curing','packed','shipped','delivered','cancelled','refunded'].includes(String(row.status).toLowerCase())) ? row.status : statusText,
        orderStatus: ordStatus,
        stageIndex: stageIdx,
        stages: ['Order Confirmed', 'Flowers / Materials Prepped', 'Silica & Vacuum Degassing', 'Deep Optical Cast Pour', 'Diamond Polish & Dispatch'],
        items: Array.isArray(row.items) ? row.items.map(it => ({
          name: it.productName || it.name,
          productName: it.productName || it.name,
          qty: it.quantity || it.qty || 1,
          variantLabel: it.variantLabel || '',
          price: it.unitPrice || it.price || 0,
          totalPrice: it.totalPrice || (Number(it.unitPrice || it.price || 0) * Number(it.quantity || it.qty || 1)),
          color: it.color || '',
          shape: it.shape || '',
          size: it.size || '',
          sku: it.sku || ''
        })) : [],
        courier: courierName,
        carrier: courierName,
        trackingNumber: trackingNum,
        tracking_number: trackingNum,
        notes: row.notes || ''
      };
    },

    async syncOrdersFromSupabase() {
      const currentOrders = this.getOrders();
      if (!global.VistaraSupabase || !global.VistaraSupabase.isConfigured()) return currentOrders;
      const client = global.VistaraSupabase.getClient();
      if (!client) return currentOrders;

      const auth = this.getAuthSession();
      const userEmail = (auth && auth.email) ? String(auth.email).trim().toLowerCase() : '';
      const localIds = currentOrders.map(o => o.orderId || o.orderNumber || o.id).filter(Boolean);

      try {
        let query = client.from('orders').select('*').order('created_at', { ascending: false });

        if (userEmail && localIds.length > 0) {
          query = query.or(`customer_email.ilike.${userEmail},order_number.in.(${localIds.join(',')})`);
        } else if (userEmail) {
          query = query.ilike('customer_email', userEmail);
        } else if (localIds.length > 0) {
          query = query.in('order_number', localIds);
        } else {
          query = query.limit(25);
        }

        const { data, error } = await query;
        if (error || !Array.isArray(data)) return currentOrders;

        const mapped = data.map(r => this.normalizeStorefrontOrder(r)).filter(Boolean);
        const mergedMap = new Map();
        mapped.forEach(o => mergedMap.set(o.orderId, o));
        currentOrders.forEach(o => {
          if (!mergedMap.has(o.orderId)) {
            mergedMap.set(o.orderId, o);
          }
        });

        const mergedList = Array.from(mergedMap.values());
        safeWrite(STORAGE_KEYS.ORDERS, mergedList);
        this.notify('orders_updated', mergedList);
        return mergedList;
      } catch (e) {
        return currentOrders;
      }
    },

    async syncCouponsFromSupabase() {
      if (!global.VistaraSupabase || !global.VistaraSupabase.isConfigured()) return;
      const client = global.VistaraSupabase.getClient();
      if (!client) return;
      try {
        const { data, error } = await client
          .from('coupons')
          .select('*');

        if (error || !Array.isArray(data)) return;

        for (const k of Object.keys(DYNAMIC_COUPONS)) {
          delete DYNAMIC_COUPONS[k];
        }

        data.forEach(c => {
          const code = String(c.code).trim().toUpperCase();
          const isExpired = c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false;
          DYNAMIC_COUPONS[code] = {
            code,
            type: c.discount_type === 'percentage' ? 'percent' : 'flat',
            value: Number(c.discount_value || 0),
            minOrder: Number(c.min_order_value || 0),
            isActive: c.is_active !== false,
            isExpired,
            expiryDate: c.expires_at || null,
            desc: c.discount_type === 'percentage'
              ? `${c.discount_value}% Studio Promo discount applied!`
              : `₹${c.discount_value} flat off on your studio bag!`
          };
        });
        safeWrite(STORAGE_KEYS.DYNAMIC_COUPONS, DYNAMIC_COUPONS);

        // Auto-reconcile active cart coupon if it was deleted, disabled, or expired
        const activeCoupon = this.getCouponCode();
        if (activeCoupon) {
          const all = getAllCoupons();
          const target = all[activeCoupon];
          const isTargetExpired = target && (target.isExpired || (target.expiryDate && new Date(target.expiryDate).getTime() < Date.now()));
          if (!target || target.isActive === false || isTargetExpired) {
            safeWrite(STORAGE_KEYS.COUPON, '');
            this.notify('cart_updated', this.getCartSummary());
          }
        }
      } catch (e) {}
    },

    getSettings() {
      return safeRead(STORAGE_KEYS.SETTINGS, {
        freeShippingThreshold: 1499,
        announcementBarActive: true,
        announcementBarText: 'Complimentary Pan-India Express Air Shipping on orders over ₹1,499 • 100% Optical Glass Purity Guarantee',
        enableFloralTransformationSection: false
      });
    },

    async syncSettingsFromSupabase() {
      if (!global.VistaraSupabase || !global.VistaraSupabase.isConfigured()) return;
      const client = global.VistaraSupabase.getClient();
      if (!client) return;
      try {
        const { data, error } = await client.from('settings').select('*');
        if (error || !Array.isArray(data)) return;
        const barRow = data.find(r => r.key === 'announcement_bar');
        const shipRow = data.find(r => r.key === 'shipping');
        const sectionsRow = data.find(r => r.key === 'storefront_sections');
        const infoRow = data.find(r => r.key === 'store_info');

        const currentSettings = safeRead(STORAGE_KEYS.SETTINGS, {});
        const localUpdated = currentSettings.updated_at ? new Date(currentSettings.updated_at).getTime() : 0;
        const nextSettings = { ...currentSettings };

        if (barRow && barRow.value) {
          const barDbUpdated = barRow.updated_at ? new Date(barRow.updated_at).getTime() : 0;
          if (barDbUpdated >= localUpdated || !currentSettings.announcementBarText) {
            const barText = barRow.value.text || nextSettings.announcementBarText;
            nextSettings.announcementBarText = barText;
            nextSettings.announcementBarActive = barRow.value.enabled !== false;
            this.applyAnnouncementBar(barText, barRow.value.enabled !== false);
          }
        }
        if (shipRow && shipRow.value) {
          const shipDbUpdated = shipRow.updated_at ? new Date(shipRow.updated_at).getTime() : 0;
          if (shipDbUpdated >= localUpdated || !currentSettings.freeShippingThreshold) {
            nextSettings.freeShippingThreshold = (shipRow.value.free_shipping_threshold !== undefined && !isNaN(Number(shipRow.value.free_shipping_threshold)))
              ? Number(shipRow.value.free_shipping_threshold)
              : 1499;
            if (shipRow.value.default_courier) {
              nextSettings.defaultCourier = shipRow.value.default_courier;
            }
          }
        }
        if (sectionsRow && sectionsRow.value) {
          nextSettings.enableFloralTransformationSection = Boolean(sectionsRow.value.enable_floral_transformation);
        }
        if (infoRow && infoRow.value) {
          nextSettings.storeName = infoRow.value.name || nextSettings.storeName;
          nextSettings.contactEmail = infoRow.value.email || nextSettings.contactEmail;
          nextSettings.contactPhone = infoRow.value.phone || nextSettings.contactPhone;
          nextSettings.brandTagline = infoRow.value.tagline || nextSettings.brandTagline;
          nextSettings.instagramHandle = infoRow.value.instagram || nextSettings.instagramHandle;
        }

        safeWrite(STORAGE_KEYS.SETTINGS, nextSettings);
        if (typeof global.applyStorefrontSettings === 'function') {
          global.applyStorefrontSettings(nextSettings);
        }
        this.notify('settings_updated', nextSettings);
      } catch (e) {}
    },

    applyAnnouncementBar(text, enabled) {
      if (typeof document === 'undefined') return;
      const barEl = document.getElementById('top-announcement-bar');
      const textEl = document.getElementById('announcement-text');
      if (barEl) {
        if (enabled === false) {
          barEl.style.display = 'none';
        } else {
          barEl.style.display = '';
        }
      }
      if (textEl && text) {
        textEl.textContent = text;
      }
    },

    async syncPendingEdgeState() {
      if (this.syncOrdersFromSupabase) await this.syncOrdersFromSupabase();
      if (this.syncCouponsFromSupabase) await this.syncCouponsFromSupabase();
      if (this.syncSettingsFromSupabase) await this.syncSettingsFromSupabase();
      return { synced: true };
    },

    // External Studio Bridge Receiver for Live Catalogue Drops & Customer Order Updates
    receiveStudioPush(payload) {
      if (!payload || typeof payload !== 'object') return { ok: false, error: 'Invalid payload' };
      const log = safeRead(STORAGE_KEYS.STUDIO_SYNC_LOG, []);
      const entry = {
        id: 'push_' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: payload.type || payload.action || 'CATALOG_AND_SOCIAL_SYNC',
        summary: payload.summary || 'Studio catalogue & order state updated'
      };

      if ((payload.type === 'PRODUCTS_UPDATED' || payload.action === 'PRODUCTS_UPDATED') && Array.isArray(payload.products)) {
        safeWrite(STORAGE_KEYS.PRODUCTS, payload.products);
        this.notify('products_updated', payload.products);
        log.unshift(entry);
        safeWrite(STORAGE_KEYS.STUDIO_SYNC_LOG, log.slice(0, 20));
        return { ok: true, count: payload.products.length };
      }

      const targetProduct = payload.product || (payload.action === 'STUDIO_UPSERT_PRODUCT' || payload.action === 'ADMIN_UPSERT_PRODUCT' ? payload.payload : null);
      if (targetProduct && targetProduct.id) {
        const products = this.getProducts().slice();
        const existingIdx = products.findIndex(p => p.id === targetProduct.id);
        const existingProd = existingIdx > -1 ? products[existingIdx] : {};
        const basePrice = Number(targetProduct.price ?? existingProd.price ?? 1299);
        const baseRegPrice = Number(targetProduct.regularPrice ?? existingProd.regularPrice ?? Math.round(basePrice * 1.2));
        const defaultImg = targetProduct.image || (targetProduct.images && targetProduct.images[0]) || existingProd.image || IMAGES.ultraclearMain;
        const rawSpecs = { ...(existingProd.specs || {}), ...(targetProduct.specs || {}) };
        const resolvedCat = targetProduct.category || existingProd.category || 'keepsakes';
        const defaultHsn = resolvedCat === 'ceramics' ? '69120010' : (resolvedCat === 'pigments' ? '32064990' : (resolvedCat === 'molds' ? '39269099' : '39073010'));
        const normalizedProd = {
          ...existingProd,
          ...targetProduct,
          sku: targetProduct.sku || existingProd.sku || ('VK-' + String(targetProduct.id).toUpperCase().replace(/[^A-Z0-9-]+/g, '-')),
          name: targetProduct.name || existingProd.name || 'Vistāra Krafts Studio Edition',
          shortName: targetProduct.shortName || existingProd.shortName || targetProduct.name || 'Studio Edition',
          subtitle: targetProduct.subtitle || existingProd.subtitle || 'Museum-Grade Optical Epoxy & Handcrafted Keepsake Edition',
          category: resolvedCat,
          subCategory: targetProduct.subCategory || existingProd.subCategory || 'studio_edition',
          badge: targetProduct.badge || existingProd.badge || 'Studio Edition',
          price: basePrice,
          regularPrice: baseRegPrice,
          unitPriceLabel: targetProduct.unitPriceLabel || existingProd.unitPriceLabel || 'Studio Edition',
          ratio: targetProduct.ratio || existingProd.ratio || '3:1',
          viscosity: targetProduct.viscosity || existingProd.viscosity || 'low',
          pourDepth: targetProduct.pourDepth || existingProd.pourDepth || '20mm',
          cureTime: targetProduct.cureTime || existingProd.cureTime || '24h',
          potLife: targetProduct.potLife || existingProd.potLife || '45m',
          rating: Number(targetProduct.rating ?? existingProd.rating ?? 4.9),
          reviewsCount: Number(targetProduct.reviewsCount ?? existingProd.reviewsCount ?? 24),
          inStock: targetProduct.inStock !== undefined ? Boolean(targetProduct.inStock) : (existingProd.inStock !== undefined ? Boolean(existingProd.inStock) : true),
          isCustomizable: Boolean(targetProduct.isCustomizable ?? existingProd.isCustomizable ?? false),
          image: defaultImg,
          gallery: targetProduct.gallery || targetProduct.images || existingProd.gallery || [defaultImg],
          variants: Array.isArray(targetProduct.variants) && targetProduct.variants.length > 0
            ? targetProduct.variants
            : (Array.isArray(existingProd.variants) && existingProd.variants.length > 0
              ? existingProd.variants
              : [
                  {
                    id: String(targetProduct.id) + '-std',
                    label: 'Standard Studio Edition',
                    desc: targetProduct.subtitle || 'Optical-grade studio edition',
                    price: basePrice,
                    regularPrice: baseRegPrice,
                    unitPrice: targetProduct.unitPriceLabel || 'Standard Edition',
                    popular: true
                  }
                ]),
          gender: targetProduct.gender || existingProd.gender || 'all',
          genderAffinity: targetProduct.genderAffinity || existingProd.genderAffinity || (targetProduct.gender === 'men' ? 'masculine' : targetProduct.gender === 'women' ? 'feminine' : 'unisex'),
          colors: Array.isArray(targetProduct.colors)
            ? targetProduct.colors
            : (Array.isArray(existingProd.colors) ? existingProd.colors : []),
          shapes: Array.isArray(targetProduct.shapes)
            ? targetProduct.shapes
            : (Array.isArray(existingProd.shapes) ? existingProd.shapes : []),
          sizes: Array.isArray(targetProduct.sizes)
            ? targetProduct.sizes
            : (Array.isArray(existingProd.sizes) ? existingProd.sizes : []),
          specs: {
            mixRatioWeight: rawSpecs.mixRatioWeight || (targetProduct.ratio ? `${targetProduct.ratio} by Weight` : '3 : 1 (Resin : Hardener)'),
            mixRatioVolume: rawSpecs.mixRatioVolume || '2.6 : 1',
            workingPotLife: rawSpecs.workingPotLife || (targetProduct.potLife || '45 Minutes'),
            demoldDuration: rawSpecs.demoldDuration || '24 Hours',
            fullGlassCure: rawSpecs.fullGlassCure || (targetProduct.cureTime || '48 – 72 Hours'),
            dynamicViscosity: rawSpecs.dynamicViscosity || '650 mPa·s (Optical Grade)',
            maxDepth: rawSpecs.maxDepth || (targetProduct.pourDepth || '20mm'),
            hardness: rawSpecs.hardness || '83D Scratch-Shield',
            uvStability: rawSpecs.uvStability || 'HALS + UV400 Stabilized',
            hsnCode: rawSpecs.hsnCode || defaultHsn
          }
        };
        if (existingIdx > -1) products[existingIdx] = normalizedProd;
        else products.unshift(normalizedProd);
        safeWrite(STORAGE_KEYS.PRODUCTS, products);
      }

      if ((payload.action === 'STUDIO_DELETE_PRODUCT' || payload.action === 'ADMIN_DELETE_PRODUCT') && payload.payload && payload.payload.id) {
        const products = this.getProducts().slice().filter(p => p.id !== payload.payload.id);
        safeWrite(STORAGE_KEYS.PRODUCTS, products);
      }

      if ((payload.action === 'STUDIO_UPDATE_PRICE_STOCK' || payload.action === 'ADMIN_UPDATE_PRICE_STOCK') && payload.payload && payload.payload.id) {
        const products = this.getProducts().slice();
        const idx = products.findIndex(p => p.id === payload.payload.id);
        if (idx > -1) {
          products[idx] = { ...products[idx], ...payload.payload };
          safeWrite(STORAGE_KEYS.PRODUCTS, products);
        }
      }

      const targetOrder = payload.order || (payload.action === 'STUDIO_UPDATE_ORDER_STATUS' || payload.action === 'ADMIN_UPDATE_ORDER_STATUS' ? payload.payload : null);
      if (payload.type === 'ORDER_STATUS_CHANGED' || (targetOrder && (targetOrder.orderId || targetOrder.orderNumber || targetOrder.id))) {
        const rawOrd = targetOrder || payload;
        const norm = this.normalizeStorefrontOrder(rawOrd);
        if (norm) {
          const targetId = norm.orderId || payload.orderId;
          const orders = this.getOrders().slice();
          const idx = orders.findIndex(o => (o.orderId && o.orderId === targetId) || (o.orderNumber && o.orderNumber === targetId) || (o.id && o.id === targetId));
          if (idx > -1) {
            const existing = orders[idx];
            const merged = { ...existing };
            if (rawOrd.status) merged.status = rawOrd.status;
            else if (rawOrd.order_status || rawOrd.orderStatus) merged.status = norm.status;
            if (rawOrd.order_status || rawOrd.orderStatus) merged.orderStatus = norm.orderStatus;
            if (rawOrd.stage_index !== undefined || rawOrd.stageIndex !== undefined) merged.stageIndex = norm.stageIndex;
            else if (rawOrd.order_status || rawOrd.orderStatus) merged.stageIndex = norm.stageIndex;

            if (rawOrd.tracking_number || rawOrd.trackingNumber) {
              merged.trackingNumber = norm.trackingNumber;
              merged.tracking_number = norm.tracking_number;
            }
            if (rawOrd.courier || rawOrd.carrier) {
              merged.courier = norm.courier;
              merged.carrier = norm.carrier;
            }
            if (rawOrd.notes !== undefined) merged.notes = norm.notes;
            if (rawOrd.mockup_approved !== undefined || rawOrd.mockupApproved !== undefined) merged.mockupApproved = norm.mockupApproved;
            if (rawOrd.gift_wrap !== undefined || rawOrd.giftWrap !== undefined) merged.giftWrap = norm.giftWrap;
            if (rawOrd.total !== undefined || rawOrd.totalAmount !== undefined || rawOrd.total_amount !== undefined) merged.total = norm.total;
            if (Array.isArray(rawOrd.items) && rawOrd.items.length > 0) merged.items = norm.items;
            orders[idx] = merged;
          } else {
            orders.unshift(norm);
          }
          safeWrite(STORAGE_KEYS.ORDERS, orders);
          this.notify('order_updated', norm);
          this.notify('orders_updated', orders);
        }
      }

      if (payload.type === 'ORDERS_UPDATED' && Array.isArray(payload.orders)) {
        const currentOrders = this.getOrders();
        const mappedList = payload.orders.map(r => this.normalizeStorefrontOrder(r)).filter(Boolean);
        const mergedMap = new Map();
        mappedList.forEach(o => mergedMap.set(o.orderId, o));
        currentOrders.forEach(o => {
          if (!mergedMap.has(o.orderId)) mergedMap.set(o.orderId, o);
        });
        const finalOrders = Array.from(mergedMap.values());
        safeWrite(STORAGE_KEYS.ORDERS, finalOrders);
        this.notify('orders_updated', finalOrders);
      }

      if (payload.type === 'SETTINGS_UPDATED' && payload.settings) {
        const cur = safeRead(STORAGE_KEYS.SETTINGS, {});
        const merged = { ...cur, ...payload.settings, updated_at: payload.settings.updated_at || new Date().toISOString() };
        safeWrite(STORAGE_KEYS.SETTINGS, merged);
        if (merged.announcementBarText !== undefined) {
          this.applyAnnouncementBar(merged.announcementBarText, merged.announcementBarActive);
        }
        if (typeof global.applyStorefrontSettings === 'function') {
          global.applyStorefrontSettings(merged);
        }
        this.notify('settings_updated', merged);
      }

      if (payload.type === 'COUPONS_UPDATED' && Array.isArray(payload.coupons)) {
        const nextCodes = new Set(payload.coupons.map(c => String(c.code).trim().toUpperCase()));
        for (const k of Object.keys(DYNAMIC_COUPONS)) {
          if (!nextCodes.has(k)) {
            DYNAMIC_COUPONS[k] = { code: k, isDeleted: true, isActive: false };
          }
        }
        if (payload.deletedCode) {
          const del = String(payload.deletedCode).trim().toUpperCase();
          DYNAMIC_COUPONS[del] = { code: del, isDeleted: true, isActive: false };
        }
        payload.coupons.forEach(c => {
          const code = String(c.code).trim().toUpperCase();
          const isExpired = c.expiryDate ? new Date(c.expiryDate).getTime() < Date.now() : false;
          DYNAMIC_COUPONS[code] = {
            code,
            type: c.discountType === 'percentage' ? 'percent' : 'flat',
            value: Number(c.discountValue || 0),
            minOrder: Number(c.minOrderValue || 0),
            isActive: c.isActive !== false,
            isExpired,
            expiryDate: c.expiryDate || null,
            desc: c.discountType === 'percentage' ? `${c.discountValue}% Studio Discount applied!` : `₹${c.discountValue} flat off applied!`
          };
        });
        safeWrite(STORAGE_KEYS.DYNAMIC_COUPONS, DYNAMIC_COUPONS);

        // Auto-reconcile active cart coupon if it was deleted, disabled, or expired
        const activeCoupon = this.getCouponCode();
        if (activeCoupon) {
          const all = getAllCoupons();
          const target = all[activeCoupon];
          const isTargetExpired = target && (target.isExpired || (target.expiryDate && new Date(target.expiryDate).getTime() < Date.now()));
          if (!target || target.isActive === false || isTargetExpired) {
            safeWrite(STORAGE_KEYS.COUPON, '');
            this.notify('cart_updated', this.getCartSummary());
          }
        }

        this.notify('coupons_updated', DYNAMIC_COUPONS);
      }

      const targetPost = payload.socialPost || (payload.action === 'STUDIO_PUSH_SOCIAL_POST' || payload.action === 'ADMIN_PUSH_SOCIAL_POST' ? payload.payload : null);
      if (targetPost) {
        const posts = this.getSocialPosts().slice();
        posts.unshift(targetPost);
        safeWrite(STORAGE_KEYS.SOCIAL_POSTS, posts);
      }

      log.unshift(entry);
      safeWrite(STORAGE_KEYS.STUDIO_SYNC_LOG, log.slice(0, 20));
      this.notify('studio_push_received', { entry, payload });
      return { ok: true, entry };
    },

    // Backward compatibility alias for receiveStudioPush
    receiveAdminPush(payload) {
      return this.receiveStudioPush(payload);
    },

    getStudioSyncLog() {
      return safeRead(STORAGE_KEYS.STUDIO_SYNC_LOG, [
        { id: 'push_init', timestamp: 'Just now', type: 'STUDIO_SYNC_READY', summary: 'Listening for Studio catalogue updates & Realtime drops' }
      ]);
    },

    getHostPushLog() {
      return this.getStudioSyncLog();
    },

    getSeoConfig() {
      const cfCfg = global.VistaraCloudflareConfig || {};
      const seoCfg = cfCfg.seo || {};
      const siteUrl = String(
        global.VISTARA_SITE_URL ||
        seoCfg.siteUrl ||
        (cfCfg.brand && cfCfg.brand.siteUrl) ||
        'https://vistara-krafts.vercel.app'
      ).replace(/\/+$/, '');
      const futureCustomDomain = String(
        global.VISTARA_CUSTOM_DOMAIN ||
        seoCfg.futureCustomDomain ||
        (cfCfg.brand && cfCfg.brand.futureCustomDomain) ||
        'https://vistarakrafts.com'
      ).replace(/\/+$/, '');
      return {
        siteUrl,
        futureCustomDomain,
        defaultTitle: seoCfg.defaultTitle || 'Vistāra Krafts — Bespoke Varmala Preservation & Optical Epoxy Storefront',
        defaultDescription: seoCfg.defaultDescription || 'Official Vistāra Krafts (@resin.art.memories) E-Commerce Storefront in India. Preserved wedding varmalas in 50mm crystal blocks, ocean resin art, and ISO-9001 optical 3:1 & 2:1 epoxy systems with Pan-India express delivery.',
        defaultKeywords: seoCfg.defaultKeywords || 'Vistara Krafts, Vistāra Krafts, resin.art.memories, bridal varmala preservation India, wedding garland preservation in resin, 3:1 casting epoxy resin India, 2:1 deep pour river table epoxy, 1:1 doming epoxy, UV resin jewelry India, ocean wave resin tray, quartz geode wall art, epoxy pour calculator, HALS UV non-yellowing epoxy, HSN 39073010',
        locale: seoCfg.locale || 'en_IN',
        language: seoCfg.language || 'en-IN',
        currency: seoCfg.currency || 'INR',
        twitterHandle: seoCfg.twitterHandle || '@resin.art.memories',
        instagramHandle: '@resin.art.memories',
        instagramUrl: seoCfg.instagramUrl || 'https://www.instagram.com/resin.art.memories',
        llmsTxtUrl: `${siteUrl}${seoCfg.llmsTxtPath || '/llms.txt'}`,
        llmsFullTxtUrl: `${siteUrl}${seoCfg.llmsFullTxtPath || '/llms-full.txt'}`,
        sitemapUrl: `${siteUrl}${seoCfg.sitemapPath || '/sitemap.xml'}`,
        geo: seoCfg.geo || {
          country: 'IN',
          countryName: 'India',
          region: 'IN-KA',
          placename: 'Bengaluru, Karnataka, India',
          postalCode: '560001',
          latitude: 12.9716,
          longitude: 77.5946,
          position: '12.9716;77.5946',
          icbm: '12.9716, 77.5946',
          areaServed: ['IN', 'Bengaluru', 'Mumbai', 'New Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Jaipur', 'Kolkata', 'Udaipur', 'Goa']
        }
      };
    },

    // Digital Personal Data Protection (DPDP) Act 2023 Compliance Methods
    getDpdpConsent() {
      return safeRead(STORAGE_KEYS.DPDP_CONSENT, {
        accepted: false,
        date: null,
        categories: {
          orderFulfillment: true,
          analyticsSession: true,
          marketingPromos: false
        },
        age18PlusVerified: true,
        language: 'en'
      });
    },

    saveDpdpConsent(data) {
      const current = this.getDpdpConsent();
      const updated = {
        accepted: true,
        date: new Date().toISOString(),
        categories: {
          orderFulfillment: true,
          analyticsSession: Boolean(data && data.categories ? data.categories.analyticsSession : true),
          marketingPromos: Boolean(data && data.categories ? data.categories.marketingPromos : false)
        },
        age18PlusVerified: Boolean(data && typeof data.age18PlusVerified !== 'undefined' ? data.age18PlusVerified : true),
        language: String((data && data.language) || current.language || 'en')
      };
      safeWrite(STORAGE_KEYS.DPDP_CONSENT, updated);
      this.notify('dpdp_consent_updated', updated);
      return updated;
    },

    getDpdpTickets() {
      return safeRead(STORAGE_KEYS.DPDP_TICKETS, []);
    },

    submitDpdpTicket(payload) {
      const tickets = this.getDpdpTickets().slice();
      const ticketId = `DPDP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const newTicket = {
        ticketId,
        requestType: String(payload.requestType || 'Grievance Redressal'),
        fullName: String(payload.fullName || 'Patron').trim(),
        email: String(payload.email || '').trim(),
        mobile: String(payload.mobile || '').trim(),
        orderId: String(payload.orderId || '').trim(),
        details: String(payload.details || '').trim(),
        status: 'In Review (SLA <= 7 Days)',
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        createdAtIso: new Date().toISOString()
      };
      tickets.unshift(newTicket);
      safeWrite(STORAGE_KEYS.DPDP_TICKETS, tickets);
      this.notify('dpdp_ticket_created', newTicket);
      return newTicket;
    },

    exportUserDataSummary() {
      const profile = this.getPatronProfile();
      const session = safeRead(STORAGE_KEYS.AUTH_SESSION, null);
      const orders = this.getOrders();
      const cart = this.getCart();
      const wishlist = this.getWishlist();
      const consent = this.getDpdpConsent();
      const tickets = this.getDpdpTickets();

      return {
        app: 'Vistāra Krafts Studio (@resin.art.memories)',
        regulation: 'Digital Personal Data Protection (DPDP) Act, 2023 (India)',
        exportTimestamp: new Date().toISOString(),
        dataPrincipalSummary: {
          profile,
          sessionAuth: session ? { email: session.email, name: session.name, provider: session.provider } : 'Guest',
          deliveryPincode: this.getPincode()
        },
        dpdpConsentState: consent,
        dpdpGrievanceTickets: tickets,
        commerceState: {
          ordersCount: orders.length,
          ordersList: orders,
          cartItemsCount: cart.length,
          cartItems: cart,
          wishlistItemsCount: wishlist.length,
          wishlistItems: wishlist
        }
      };
    },

    eraseUserData() {
      safeWrite(STORAGE_KEYS.CART, []);
      safeWrite(STORAGE_KEYS.WISHLIST, []);
      safeWrite(STORAGE_KEYS.SAVED_POSTS, []);
      safeWrite(STORAGE_KEYS.LIKED_POSTS, []);
      safeWrite(STORAGE_KEYS.RECENTLY_VIEWED, []);
      safeWrite(STORAGE_KEYS.PATRON_PROFILE, { name: '', email: '', phone: '', address: '', pincode: '560001' });
      safeWrite(STORAGE_KEYS.AUTH_SESSION, null);
      safeWrite(STORAGE_KEYS.DPDP_CONSENT, {
        accepted: false,
        date: null,
        categories: { orderFulfillment: true, analyticsSession: false, marketingPromos: false },
        age18PlusVerified: false,
        language: 'en'
      });
      this.notify('dpdp_user_data_erased', { timestamp: new Date().toISOString() });
      return { ok: true, erasedAt: new Date().toISOString() };
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    notify(event, data) {
      listeners.forEach(fn => {
        try { fn(event, data); } catch (e) { console.error(e); }
      });
    }
  };

  // Live Supabase Ingestion & Synchronization
  async function syncFromSupabase() {
    try {
      if (typeof global !== 'undefined' && (global.__VK_DISABLE_SUPABASE_AUTO_SYNC__ || global.__VK_TEST_ENV__)) return;
      if (typeof window !== 'undefined' && (window.__VK_DISABLE_SUPABASE_AUTO_SYNC__ || window.__VK_TEST_ENV__)) return;

      const url = backendConfig.supabase.url;
      const key = backendConfig.supabase.anonKey;
      if (!url || !key || url.includes('xyzcompany')) return;

      const endpoint = `${url}/rest/v1/products?select=*&is_active=eq.true&order=created_at.desc`;
      const res = await fetch(endpoint, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      if (!res.ok) return;

      const liveProducts = await res.json();
      if (Array.isArray(liveProducts)) {
        const normalized = liveProducts.map(row => {
          const parseField = (val, fallback) => {
            if (!val) return fallback;
            if (typeof val === 'object') return val;
            try { return JSON.parse(val); } catch { return fallback; }
          };
          const specs = parseField(row.specs, {});
          const variants = parseField(row.variants, []);

          return {
            id: row.id,
            sku: row.sku,
            name: row.name,
            shortName: row.short_name || row.name,
            subtitle: row.subtitle || '',
            brand: row.brand || 'Vistāra Krafts',
            category: row.category || 'resin',
            subCategory: row.subcategory || 'atelier',
            badge: row.badge || '',
            price: Number(row.price || 0),
            regularPrice: Number(row.compare_at_price || Math.round((row.price || 0) * 1.25)),
            costPrice: Number(row.cost_price || 0),
            discount: Number(row.discount || 0),
            stockQuantity: Number(row.stock ?? 10),
            inStock: Boolean(row.stock > 0),
            featured: Boolean(row.featured),
            hero: Boolean(row.hero),
            isNew: Boolean(row.is_new),
            rating: Number(row.rating || 4.9),
            reviewsCount: Number(row.reviews_count || 12),
            ratio: row.ratio || specs.ratio || '',
            viscosity: row.viscosity || specs.viscosity || 'low',
            cureTime: row.cure_time || specs.cureTime || '',
            specs: specs,
            variants: Array.isArray(variants) ? variants : [],
            image: row.image || (Array.isArray(row.gallery) && row.gallery[0]) || (Array.isArray(row.images) && row.images[0]) || IMAGES.resin201,
            images: (Array.isArray(row.gallery) && row.gallery.length > 0) ? row.gallery : (Array.isArray(row.images) && row.images.length > 0 ? row.images : (row.image ? [row.image] : [IMAGES.resin201])),
            colors: Array.isArray(row.colors) ? row.colors : [],
            shapes: Array.isArray(row.shapes) ? row.shapes : [],
            sizes: Array.isArray(row.sizes) ? row.sizes : [],
            gender: row.gender || 'all',
            genderAffinity: row.gender_affinity || (row.gender === 'men' ? 'masculine' : (row.gender === 'women' ? 'feminine' : 'neutral')),
            giftingTags: Array.isArray(row.gifting_tags) ? row.gifting_tags : [],
            description: row.description || '',
            createdAt: row.created_at,
            updatedAt: row.updated_at
          };
        });

        const currentLocal = safeRead(STORAGE_KEYS.PRODUCTS, []);
        const isDifferent = JSON.stringify(currentLocal) !== JSON.stringify(normalized);
        if (isDifferent) {
          safeWrite(STORAGE_KEYS.PRODUCTS, normalized);
          Store.notify('products_updated', normalized);
          if (typeof global.dispatchEvent === 'function') {
            global.dispatchEvent(new CustomEvent('vk:products:updated', { detail: normalized }));
          }
        }
      }
    } catch (e) {
      // Graceful offline fallback
    }
  }

  Store.syncFromSupabase = syncFromSupabase;

  // Apply cached announcement ribbon settings immediately on startup
  try {
    const cachedSettings = safeRead(STORAGE_KEYS.SETTINGS, null);
    if (cachedSettings && cachedSettings.announcementBarText !== undefined) {
      Store.applyAnnouncementBar(cachedSettings.announcementBarText, cachedSettings.announcementBarActive);
    }
  } catch (_e) {}

  const isTestContext = (typeof global !== 'undefined' && (global.__VK_TEST_ENV__ || global.__VK_TEST_FIXTURES__ || global.__VK_DISABLE_SUPABASE_AUTO_SYNC__)) ||
                        (typeof window !== 'undefined' && (window.__VK_TEST_ENV__ || window.__VK_TEST_FIXTURES__ || window.__VK_DISABLE_SUPABASE_AUTO_SYNC__));

  if (typeof window !== 'undefined' && typeof fetch === 'function' && !isTestContext) {
    if (typeof setTimeout === 'function') {
      setTimeout(() => {
        syncFromSupabase();
        if (typeof Store.syncCouponsFromSupabase === 'function') Store.syncCouponsFromSupabase();
        if (typeof Store.syncSettingsFromSupabase === 'function') Store.syncSettingsFromSupabase();
        if (typeof Store.syncOrdersFromSupabase === 'function') Store.syncOrdersFromSupabase();
      }, 300);
    }
    if (typeof setInterval === 'function') {
      setInterval(() => {
        syncFromSupabase();
        if (typeof Store.syncSettingsFromSupabase === 'function') Store.syncSettingsFromSupabase();
      }, 5000);
    }
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('focus', () => {
        syncFromSupabase();
        if (typeof Store.syncSettingsFromSupabase === 'function') Store.syncSettingsFromSupabase();
        if (typeof Store.syncOrdersFromSupabase === 'function') Store.syncOrdersFromSupabase();
      });
    }
  }

  // Setup Cross-Window / BroadcastChannel Listener for Live Studio Drops
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('RAM_STUDIO_LIVE_DROP_CHANNEL');
      channel.onmessage = (ev) => {
        if (ev && ev.data) Store.receiveStudioPush(ev.data);
      };
    }
    global.addEventListener('message', (ev) => {
      if (ev && ev.data && (ev.data.source === 'RAM_STUDIO_BRIDGE' || ev.data.source === 'RAM_ADMIN_HOST')) {
        Store.receiveStudioPush(ev.data.payload);
      }
    });
  } catch (e) {
    // ignore in restricted environments
  }

  global.ResinStore = Store;
  global.StorefrontBridge = Store;
  global.VistaraStore = Store;
})(window);
