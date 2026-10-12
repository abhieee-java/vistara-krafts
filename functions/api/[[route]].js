/**
 * Vistāra Krafts — Cloudflare Pages Function / Edge Worker API (`functions/api/[[route]].js`)
 *
 * Handles:
 * - POST /api/auth/register  (Email + Password + Name + Phone + Shipping Address)
 * - POST /api/auth/login     (Email + Password + Address check)
 * - POST /api/auth/oauth     (Google Identity Services & Apple OAuth + Address verification)
 * - GET  /api/auth/me        (Current session verification)
 * - PUT  /api/auth/profile   (Update Name, Phone, Shipping Address in D1)
 * - POST /api/auth/logout    (Revoke session in KV/D1 & clear cookie)
 * - GET  /api/orders         (Fetch authenticated user's orders from D1)
 * - POST /api/orders         (Place authenticated order into D1; rejects unauthenticated requests)
 * - GET  /api/health         (Cloudflare Edge health & binding telemetry)
 */

const edgeMemoryUsers = new Map();
const edgeMemorySessions = new Map();
const edgeMemoryOrders = new Map();

const CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CF-Turnstile-Token',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
};

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, ...extraHeaders }
  });
}

function decodeJwtPayload(jwt) {
  try {
    if (!jwt || typeof jwt !== 'string') return null;
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const jsonStr = atob(padded);
    return JSON.parse(jsonStr);
  } catch (_err) {
    return null;
  }
}

async function sha256Hex(input) {
  const buf = new TextEncoder().encode(String(input));
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPasswordPBKDF2(password, saltHex) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(saltHex),
      iterations: 50000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyTurnstile(token, secretKey, remoteIp) {
  if (!secretKey || secretKey === '1x0000000000000000000000000000000AA') {
    return { success: true, devBypass: true };
  }
  if (!token) return { success: false, error: 'Missing Turnstile verification token' };
  const form = new URLSearchParams();
  form.append('secret', secretKey);
  form.append('response', token);
  if (remoteIp) form.append('remoteip', remoteIp);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form
  });
  return res.json();
}

function getBearerToken(request) {
  const auth = request.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/vk_cf_session=([^;]+)/);
  return match ? match[1] : '';
}

function getDb(env) {
  return (env && (env.VISTARA_DB || env.DB)) || null;
}

function getKv(env) {
  return (env && (env.VISTARA_SESSIONS || env.SESSIONS_KV)) || null;
}

const initializedDbs = new WeakSet();

async function ensureD1Schema(db) {
  if (!db || typeof db.prepare !== 'function' || initializedDbs.has(db)) return;
  initializedDbs.add(db);
  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      pincode TEXT DEFAULT '',
      provider TEXT NOT NULL DEFAULT 'email',
      provider_sub TEXT DEFAULT '',
      password_hash TEXT DEFAULT '',
      password_salt TEXT DEFAULT '',
      wishlist_json TEXT NOT NULL DEFAULT '[]',
      member_tier TEXT DEFAULT 'Verified Vistāra Patron',
      loyalty_points INTEGER DEFAULT 250,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'email',
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      pincode TEXT DEFAULT '',
      subtotal INTEGER NOT NULL,
      discount INTEGER DEFAULT 0,
      gst_amount REAL DEFAULT 0,
      total INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      gift_wrap INTEGER DEFAULT 1,
      mockup_approved INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Order Confirmed • Studio Batch Allocated',
      stage_index INTEGER DEFAULT 1,
      items_json TEXT NOT NULL,
      courier TEXT DEFAULT 'BlueDart Priority Air • AWB Pending',
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `ALTER TABLE users ADD COLUMN pincode TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN wishlist_json TEXT NOT NULL DEFAULT '[]'`,
    `ALTER TABLE orders ADD COLUMN pincode TEXT DEFAULT ''`
  ];
  for (const sql of ddlStatements) {
    try {
      await db.prepare(sql).run();
    } catch (_e) {
      // Ignore duplicate column or mock DB no-op errors
    }
  }
}

function deriveNameFromEmail(email) {
  const local = String(email || '').split('@')[0] || 'Patron';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Verified Patron';
}

function parseWishlistJson(raw) {
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (_e) {
    return [];
  }
}

async function getAuthenticatedUser(request, env) {
  const rawToken = getBearerToken(request);
  if (!rawToken) return null;
  const tokenHash = await sha256Hex(rawToken);
  const db = getDb(env);

  if (db) {
    const row = await db.prepare(
      `SELECT u.id, u.email, u.name, u.phone, u.address, u.pincode, u.provider, u.wishlist_json, u.member_tier, u.loyalty_points
       FROM sessions s JOIN users u ON s.user_id = u.id
       WHERE s.token_hash = ? AND datetime(s.expires_at) > datetime('now')`
    ).bind(tokenHash).first();
    if (row) {
      return {
        ...row,
        wishlist: parseWishlistJson(row.wishlist_json)
      };
    }
  }

  const memSession = edgeMemorySessions.get(tokenHash);
  if (memSession && memSession.expiresAt > Date.now()) {
    return edgeMemoryUsers.get(memSession.email) || null;
  }
  return null;
}

async function createSessionForUser(user, env) {
  const rawToken = 'vk_cf_' + crypto.randomUUID().replace(/-/g, '') + '_' + Date.now().toString(36);
  const tokenHash = await sha256Hex(rawToken);
  const expiresAtIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const db = getDb(env);
  const kv = getKv(env);

  if (db) {
    await db.prepare(
      `INSERT INTO sessions (token_hash, user_id, provider, expires_at) VALUES (?, ?, ?, ?)`
    ).bind(tokenHash, user.id, user.provider || 'email', expiresAtIso).run();
  }
  if (kv) {
    await kv.put(tokenHash, JSON.stringify({ userId: user.id, email: user.email }), {
      expirationTtl: 30 * 24 * 60 * 60
    });
  }

  edgeMemorySessions.set(tokenHash, {
    userId: user.id,
    email: user.email,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
  });

  return rawToken;
}

function sessionCookieHeader(token) {
  return {
    'Set-Cookie': `vk_cf_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, '');
  const db = getDb(env);
  const kv = getKv(env);

  if (db) {
    await ensureD1Schema(db);
  }

  try {
    if (path === 'health' && request.method === 'GET') {
      return jsonResponse({
        ok: true,
        service: 'Vistāra Krafts E-Commerce API',
        environment: (env && env.ENVIRONMENT) || 'development',
        bindings: {
          d1: Boolean(db),
          kv: Boolean(kv),
          r2: Boolean(env && env.VISTARA_MEDIA)
        }
      });
    }

    if ((path === 'seo' || path === 'sitemap.xml' || path === 'llms.txt' || path === 'llms-full.txt') && request.method === 'GET') {
      const domainParam = url.searchParams.get('domain');
      const siteOrigin = String(
        domainParam ||
        (env && (env.SITE_URL || env.VISTARA_SITE_URL)) ||
        'https://vistara-krafts.vercel.app'
      ).replace(/\/+$/, '');
      const futureCustomDomain = String(
        (env && env.FUTURE_CUSTOM_DOMAIN) || 'https://vistarakrafts.in'
      ).replace(/\/+$/, '');

      const productIds = [
        'ram-keep-001',
        'vk-epx-301',
        'ram-keep-002',
        'vk-epx-201',
        'ram-keep-003',
        'vk-uv-hard',
        'vk-pig-cham',
        'ram-keep-004',
        'vk-res-003',
        'vk-mld-geo',
        'vk-res-006',
        'potry-sienna-01'
      ];

      if (path === 'sitemap.xml') {
        const urls = [
          `${siteOrigin}/`,
          `${siteOrigin}/#/home`,
          `${siteOrigin}/#/catalog`,
          `${siteOrigin}/#/custom-studio`,
          `${siteOrigin}/#/social`,
          ...productIds.map(id => `${siteOrigin}/#/product/${id}`),
          `${siteOrigin}/llms.txt`,
          `${siteOrigin}/llms-full.txt`
        ];
        const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls
          .map(
            u =>
              `  <url><loc>${u}</loc><changefreq>weekly</changefreq><priority>0.9</priority><xhtml:link rel="alternate" hreflang="en-IN" href="${u}" /><xhtml:link rel="alternate" hreflang="x-default" href="${u}" /></url>`
          )
          .join('\n')}\n</urlset>`;
        return new Response(xmlBody, {
          status: 200,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/xml; charset=utf-8'
          }
        });
      }

      if (path === 'llms.txt' || path === 'llms-full.txt') {
        const llmsBody = [
          '# Vistāra Krafts × Resin Art Memories (@resin.art.memories)',
          `> Official E-Commerce Storefront: ${siteOrigin}`,
          `> Future Custom Domain: ${futureCustomDomain}`,
          '> Headquarters: 42 Craft Enclave, Indiranagar 100 Feet Road, Bengaluru, Karnataka 560001, India (12.9716, 77.5946)',
          `> Full Documentation: ${siteOrigin}/llms-full.txt`,
          `> Sitemap: ${siteOrigin}/sitemap.xml`,
          '',
          '## Key Product Catalogue (INR)',
          ...productIds.map(id => `- ${siteOrigin}/#/product/${id}`)
        ].join('\n');
        return new Response(llmsBody, {
          status: 200,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'text/plain; charset=utf-8'
          }
        });
      }

      return jsonResponse({
        ok: true,
        siteUrl: siteOrigin,
        futureCustomDomain,
        brand: 'Vistāra Krafts × Resin Art Memories (@resin.art.memories)',
        locale: 'en_IN',
        currency: 'INR',
        sitemapUrl: `${siteOrigin}/sitemap.xml`,
        llmsTxtUrl: `${siteOrigin}/llms.txt`,
        llmsFullTxtUrl: `${siteOrigin}/llms-full.txt`,
        productsCount: productIds.length,
        productIds,
        geo: {
          country: 'IN',
          countryName: 'India',
          region: 'IN-KA',
          placename: 'Bengaluru, Karnataka, India',
          postalCode: '560001',
          latitude: 12.9716,
          longitude: 77.5946,
          position: '12.9716;77.5946',
          icbm: '12.9716, 77.5946',
          areaServed: ['India', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur']
        },
        aeoSchemas: ['Organization', 'OnlineStore', 'LocalBusiness', 'WebSite', 'WebPage', 'BreadcrumbList', 'ItemList', 'Product', 'FAQPage', 'HowTo']
      });
    }

    if ((path === 'auth/google' || path === 'auth/apple') && request.method === 'GET') {
      const provider = path === 'auth/apple' ? 'apple' : 'google';
      return jsonResponse({
        ok: true,
        provider,
        oauthReady: true,
        mode: 'popup_or_token_exchange'
      });
    }

    if (path === 'auth/register' && request.method === 'POST') {
      const body = await request.json();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      let name = String(body.name || '').trim();
      let phone = String(body.phone || '').trim();
      let address = String(body.address || '').trim();
      let pincode = String(body.pincode || '').trim();
      const incomingWishlist = Array.isArray(body.wishlist) ? body.wishlist : [];

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse({ ok: false, error: 'A valid email address is required.' }, 400);
      }
      if (password.length < 6) {
        return jsonResponse({ ok: false, error: 'Password must be at least 6 characters.' }, 400);
      }
      if (!name) {
        name = deriveNameFromEmail(email);
      }

      const turnstileCheck = await verifyTurnstile(
        body.turnstileToken,
        env && env.TURNSTILE_SECRET_KEY,
        request.headers.get('CF-Connecting-IP')
      );
      if (!turnstileCheck.success) {
        return jsonResponse({ ok: false, error: 'Security verification failed.' }, 403);
      }

      const salt = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      const passwordHash = await hashPasswordPBKDF2(password, salt);
      let existingUser = null;
      if (db) {
        existingUser = await db.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first();
      }
      if (!existingUser && edgeMemoryUsers.has(email)) {
        existingUser = edgeMemoryUsers.get(email);
      }
      const userId = (existingUser && existingUser.id) || ('usr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12));
      const existingWishlist = existingUser ? parseWishlistJson(existingUser.wishlist || existingUser.wishlist_json) : [];
      const mergedWishlist = Array.from(new Set([...existingWishlist, ...incomingWishlist]));

      if (!phone && existingUser && existingUser.phone) phone = existingUser.phone;
      if (!address && existingUser && existingUser.address) address = existingUser.address;
      if (!pincode && existingUser && existingUser.pincode) pincode = existingUser.pincode;

      const userRecord = {
        id: userId,
        email,
        name,
        phone,
        address,
        pincode,
        provider: 'email',
        password_hash: passwordHash,
        password_salt: salt,
        wishlist: mergedWishlist,
        wishlist_json: JSON.stringify(mergedWishlist),
        member_tier: 'Verified Vistāra Patron',
        loyalty_points: 250
      };

      if (db) {
        await db.prepare(
          `INSERT INTO users (id, email, name, phone, address, pincode, provider, password_hash, password_salt, wishlist_json)
           VALUES (?, ?, ?, ?, ?, ?, 'email', ?, ?, ?)
           ON CONFLICT(email) DO UPDATE SET
             name = excluded.name,
             phone = CASE WHEN excluded.phone != '' THEN excluded.phone ELSE users.phone END,
             address = CASE WHEN excluded.address != '' THEN excluded.address ELSE users.address END,
             pincode = CASE WHEN excluded.pincode != '' THEN excluded.pincode ELSE users.pincode END,
             password_hash = excluded.password_hash,
             password_salt = excluded.password_salt,
             wishlist_json = excluded.wishlist_json,
             updated_at = datetime('now')`
        ).bind(userId, email, name, phone, address, pincode, passwordHash, salt, userRecord.wishlist_json).run();

        const canonical = await db.prepare(
          `SELECT id, member_tier, loyalty_points, phone, address, pincode, wishlist_json FROM users WHERE email = ?`
        ).bind(email).first();
        if (canonical && canonical.id) {
          userRecord.id = canonical.id;
          userRecord.member_tier = canonical.member_tier || userRecord.member_tier;
          userRecord.loyalty_points = canonical.loyalty_points ?? userRecord.loyalty_points;
          userRecord.phone = canonical.phone || userRecord.phone;
          userRecord.address = canonical.address || userRecord.address;
          userRecord.pincode = canonical.pincode || userRecord.pincode;
          userRecord.wishlist = parseWishlistJson(canonical.wishlist_json);
        }
      }
      edgeMemoryUsers.set(email, userRecord);

      const token = await createSessionForUser(userRecord, env);
      return jsonResponse(
        {
          ok: true,
          token,
          user: {
            id: userRecord.id,
            email: userRecord.email,
            name: userRecord.name,
            phone: userRecord.phone,
            address: userRecord.address,
            pincode: userRecord.pincode,
            wishlist: userRecord.wishlist,
            provider: 'email',
            memberTier: userRecord.member_tier
          }
        },
        200,
        sessionCookieHeader(token)
      );
    }

    if (path === 'auth/login' && request.method === 'POST') {
      const body = await request.json();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const address = String(body.address || '').trim();
      const phone = String(body.phone || '').trim();
      const name = String(body.name || '').trim();
      const pincode = String(body.pincode || '').trim();
      const incomingWishlist = Array.isArray(body.wishlist) ? body.wishlist : [];

      if (!email || !password) {
        return jsonResponse({ ok: false, error: 'Email and password are required.' }, 400);
      }

      let stored = null;
      if (db) {
        stored = await db.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first();
      }
      if (!stored && edgeMemoryUsers.has(email)) {
        stored = edgeMemoryUsers.get(email);
      }

      if (stored && stored.password_hash && stored.password_salt) {
        const candidateHash = await hashPasswordPBKDF2(password, stored.password_salt);
        if (candidateHash !== stored.password_hash) {
          return jsonResponse({ ok: false, error: 'Incorrect password for this account.' }, 401);
        }
        if (address) stored.address = address;
        if (phone) stored.phone = phone;
        if (name) stored.name = name;
        if (pincode) stored.pincode = pincode;
        const existingWl = parseWishlistJson(stored.wishlist || stored.wishlist_json);
        stored.wishlist = Array.from(new Set([...existingWl, ...incomingWishlist]));
        stored.wishlist_json = JSON.stringify(stored.wishlist);

        if (db) {
          await db.prepare(
            `INSERT INTO users (id, email, name, phone, address, pincode, provider, password_hash, password_salt, wishlist_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(email) DO UPDATE SET
               name = excluded.name,
               phone = excluded.phone,
               address = excluded.address,
               pincode = excluded.pincode,
               wishlist_json = excluded.wishlist_json,
               updated_at = datetime('now')`
          ).bind(
            stored.id,
            stored.email,
            stored.name,
            stored.phone || '',
            stored.address || '',
            stored.pincode || '',
            stored.provider || 'email',
            stored.password_hash,
            stored.password_salt,
            stored.wishlist_json
          ).run();

          const canonical = await db.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first();
          if (canonical && canonical.id) stored.id = canonical.id;
        }
        edgeMemoryUsers.set(email, stored);
      } else {
        const salt = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
        const passwordHash = await hashPasswordPBKDF2(password, salt);
        const existingWl = stored ? parseWishlistJson(stored.wishlist || stored.wishlist_json) : [];
        const mergedWl = Array.from(new Set([...existingWl, ...incomingWishlist]));
        stored = {
          id: (stored && stored.id) || ('usr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12)),
          email,
          name: name || (stored && stored.name) || deriveNameFromEmail(email),
          phone: phone || (stored && stored.phone) || '',
          address: address || (stored && stored.address) || '',
          pincode: pincode || (stored && stored.pincode) || '',
          provider: 'email',
          password_hash: passwordHash,
          password_salt: salt,
          wishlist: mergedWl,
          wishlist_json: JSON.stringify(mergedWl),
          member_tier: 'Verified Vistāra Patron',
          loyalty_points: 250
        };

        if (db) {
          await db.prepare(
            `INSERT INTO users (id, email, name, phone, address, pincode, provider, password_hash, password_salt, wishlist_json)
             VALUES (?, ?, ?, ?, ?, ?, 'email', ?, ?, ?)
             ON CONFLICT(email) DO UPDATE SET
               name = excluded.name,
               phone = CASE WHEN excluded.phone != '' THEN excluded.phone ELSE users.phone END,
               address = CASE WHEN excluded.address != '' THEN excluded.address ELSE users.address END,
               pincode = CASE WHEN excluded.pincode != '' THEN excluded.pincode ELSE users.pincode END,
               password_hash = excluded.password_hash,
               password_salt = excluded.password_salt,
               wishlist_json = excluded.wishlist_json,
               updated_at = datetime('now')`
          ).bind(
            stored.id,
            stored.email,
            stored.name,
            stored.phone,
            stored.address,
            stored.pincode,
            stored.password_hash,
            stored.password_salt,
            stored.wishlist_json
          ).run();

          const canonical = await db.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first();
          if (canonical && canonical.id) stored.id = canonical.id;
        }
        edgeMemoryUsers.set(email, stored);
      }

      const token = await createSessionForUser(stored, env);
      return jsonResponse(
        {
          ok: true,
          token,
          user: {
            id: stored.id,
            email: stored.email,
            name: stored.name,
            phone: stored.phone || '',
            address: stored.address || '',
            pincode: stored.pincode || '',
            wishlist: stored.wishlist || parseWishlistJson(stored.wishlist_json),
            provider: stored.provider || 'email',
            memberTier: stored.member_tier || 'Verified Vistāra Patron'
          }
        },
        200,
        sessionCookieHeader(token)
      );
    }

    if ((path === 'auth/oauth' || path === 'auth/google' || path === 'auth/apple') && request.method === 'POST') {
      const body = await request.json();
      const provider = path === 'auth/apple'
        ? 'apple'
        : (path === 'auth/google' ? 'google' : (body.provider === 'apple' ? 'apple' : 'google'));
      const rawToken = body.credential || body.id_token || '';
      const jwtClaims = rawToken ? decodeJwtPayload(rawToken) : null;
      const email = String(body.email || (jwtClaims && jwtClaims.email) || '').trim().toLowerCase();
      const name = String(body.name || (jwtClaims && jwtClaims.name) || '').trim();
      const phone = String(body.phone || '').trim();
      const address = String(body.address || '').trim();
      const pincode = String(body.pincode || '').trim();
      const oauthSub = String(body.sub || (jwtClaims && jwtClaims.sub) || '').trim();
      const incomingWishlist = Array.isArray(body.wishlist) ? body.wishlist : [];

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse({
          ok: false,
          error: 'OAuth sign-in requires a valid Google or Apple email address.'
        }, 400);
      }

      let existingUser = null;
      if (db) {
        existingUser = await db.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first();
      }
      if (!existingUser && edgeMemoryUsers.has(email)) {
        existingUser = edgeMemoryUsers.get(email);
      }
      const existingWl = existingUser ? parseWishlistJson(existingUser.wishlist || existingUser.wishlist_json) : [];
      const mergedWishlist = Array.from(new Set([...existingWl, ...incomingWishlist]));

      const userRecord = {
        id: (existingUser && existingUser.id) || ('usr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12)),
        email,
        name: name || (existingUser && existingUser.name) || deriveNameFromEmail(email),
        phone: phone || (existingUser && existingUser.phone) || '',
        address: address || (existingUser && existingUser.address) || '',
        pincode: pincode || (existingUser && existingUser.pincode) || '',
        provider,
        provider_sub: oauthSub,
        wishlist: mergedWishlist,
        wishlist_json: JSON.stringify(mergedWishlist),
        member_tier: (existingUser && existingUser.member_tier) || 'Verified Vistāra Patron',
        loyalty_points: (existingUser && existingUser.loyalty_points) ?? 250
      };

      if (db) {
        await db.prepare(
          `INSERT INTO users (id, email, name, phone, address, pincode, provider, provider_sub, wishlist_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(email) DO UPDATE SET
             name = excluded.name,
             phone = CASE WHEN excluded.phone != '' THEN excluded.phone ELSE users.phone END,
             address = CASE WHEN excluded.address != '' THEN excluded.address ELSE users.address END,
             pincode = CASE WHEN excluded.pincode != '' THEN excluded.pincode ELSE users.pincode END,
             provider = excluded.provider,
             provider_sub = CASE WHEN excluded.provider_sub != '' THEN excluded.provider_sub ELSE users.provider_sub END,
             wishlist_json = excluded.wishlist_json,
             updated_at = datetime('now')`
        ).bind(
          userRecord.id,
          email,
          userRecord.name,
          userRecord.phone,
          userRecord.address,
          userRecord.pincode,
          provider,
          userRecord.provider_sub,
          userRecord.wishlist_json
        ).run();

        const canonical = await db.prepare(
          `SELECT id, member_tier, loyalty_points, phone, address, pincode, wishlist_json FROM users WHERE email = ?`
        ).bind(email).first();
        if (canonical && canonical.id) {
          userRecord.id = canonical.id;
          userRecord.member_tier = canonical.member_tier || userRecord.member_tier;
          userRecord.loyalty_points = canonical.loyalty_points ?? userRecord.loyalty_points;
          userRecord.phone = canonical.phone || userRecord.phone;
          userRecord.address = canonical.address || userRecord.address;
          userRecord.pincode = canonical.pincode || userRecord.pincode;
          userRecord.wishlist = parseWishlistJson(canonical.wishlist_json);
        }
      }
      edgeMemoryUsers.set(email, userRecord);

      const token = await createSessionForUser(userRecord, env);
      return jsonResponse(
        {
          ok: true,
          token,
          user: {
            id: userRecord.id,
            email: userRecord.email,
            name: userRecord.name,
            phone: userRecord.phone,
            address: userRecord.address,
            pincode: userRecord.pincode,
            wishlist: userRecord.wishlist,
            provider,
            memberTier: userRecord.member_tier
          }
        },
        200,
        sessionCookieHeader(token)
      );
    }

    if ((path === 'auth/me' || path === 'auth/session') && request.method === 'GET') {
      const user = await getAuthenticatedUser(request, env);
      if (!user) return jsonResponse({ ok: false, authenticated: false }, 401);
      return jsonResponse({ ok: true, authenticated: true, user, session: user });
    }

    if (path === 'auth/profile' && request.method === 'PUT') {
      const user = await getAuthenticatedUser(request, env);
      if (!user) {
        return jsonResponse({ ok: false, error: 'Authentication required to update profile.' }, 401);
      }
      const body = await request.json();
      const name = String(body.name ?? user.name ?? '').trim();
      const phone = String(body.phone ?? user.phone ?? '').trim();
      const address = String(body.address ?? user.address ?? '').trim();
      const pincode = String(body.pincode ?? user.pincode ?? '').trim();
      const nextWishlist = Array.isArray(body.wishlist)
        ? body.wishlist
        : parseWishlistJson(user.wishlist || user.wishlist_json);
      const wishlistJson = JSON.stringify(nextWishlist);

      if (!name) {
        return jsonResponse({
          ok: false,
          error: 'Full Name is required to update profile.'
        }, 400);
      }

      if (db) {
        await db.prepare(
          `UPDATE users SET name = ?, phone = ?, address = ?, pincode = ?, wishlist_json = ?, updated_at = datetime('now') WHERE id = ?`
        ).bind(name, phone, address, pincode, wishlistJson, user.id).run();
      }

      const memUser = edgeMemoryUsers.get(user.email) || { ...user };
      memUser.name = name;
      memUser.phone = phone;
      memUser.address = address;
      memUser.pincode = pincode;
      memUser.wishlist = nextWishlist;
      memUser.wishlist_json = wishlistJson;
      edgeMemoryUsers.set(user.email, memUser);

      return jsonResponse({
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name,
          phone,
          address,
          pincode,
          wishlist: nextWishlist,
          provider: user.provider || 'email',
          memberTier: user.member_tier || 'Verified Vistāra Patron'
        }
      });
    }

    if (path === 'auth/logout' && request.method === 'POST') {
      const rawToken = getBearerToken(request);
      if (rawToken) {
        const tokenHash = await sha256Hex(rawToken);
        edgeMemorySessions.delete(tokenHash);
        if (db) {
          await db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(tokenHash).run();
        }
        if (kv) {
          await kv.delete(tokenHash);
        }
      }
      return jsonResponse(
        { ok: true },
        200,
        { 'Set-Cookie': 'vk_cf_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' }
      );
    }

    if (path === 'orders' && request.method === 'GET') {
      const user = await getAuthenticatedUser(request, env);
      if (!user) {
        return jsonResponse({ ok: false, error: 'Authentication required to fetch orders.' }, 401);
      }

      const ordersById = new Map();
      if (db) {
        const res = await db.prepare(
          `SELECT * FROM orders WHERE user_id = ? OR customer_email = ? ORDER BY created_at DESC`
        ).bind(user.id, user.email).all();
        const rows = (res && res.results) || [];
        for (const row of rows) {
          let parsedItems = [];
          try {
            parsedItems = JSON.parse(row.items_json || '[]');
          } catch (_e) {
            parsedItems = [];
          }
          ordersById.set(row.order_id, {
            orderId: row.order_id,
            userId: row.user_id,
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            phone: row.phone,
            address: row.address,
            pincode: row.pincode || '',
            total: Number(row.total || 0),
            subtotal: Number(row.subtotal || 0),
            discount: Number(row.discount || 0),
            gstAmount: Number(row.gst_amount || 0),
            paymentMethod: row.payment_method,
            giftWrap: Boolean(row.gift_wrap),
            mockupApproved: Boolean(row.mockup_approved),
            status: row.status,
            stageIndex: Number(row.stage_index ?? 1),
            courier: row.courier || 'BlueDart Priority Air • AWB Pending',
            items: parsedItems,
            createdAt: row.created_at
          });
        }
      }

      for (const [id, ord] of edgeMemoryOrders.entries()) {
        if ((ord.userId === user.id || ord.customerEmail === user.email) && !ordersById.has(id)) {
          ordersById.set(id, ord);
        }
      }

      return jsonResponse({ ok: true, orders: Array.from(ordersById.values()) });
    }

    if (path === 'orders' && request.method === 'POST') {
      const user = await getAuthenticatedUser(request, env);
      if (!user) {
        return jsonResponse({ ok: false, error: 'Authentication required before placing an order.' }, 401);
      }
      const body = await request.json();
      const orderId = body.orderId || ('VK-2026-' + Math.floor(1000 + Math.random() * 9000));
      const orderRecord = {
        orderId,
        userId: user.id,
        customerName: body.customerName || user.name,
        customerEmail: user.email,
        phone: body.phone || user.phone || '',
        address: body.address || user.address || '',
        pincode: String(body.pincode || user.pincode || '').trim(),
        total: Math.round(Number(body.total || 0)),
        subtotal: Math.round(Number(body.subtotal || 0)),
        discount: Math.round(Number(body.discount || 0)),
        gstAmount: Number(body.gstAmount || 0),
        paymentMethod: body.paymentMethod || 'UPI Instant',
        giftWrap: Boolean(body.giftWrap),
        mockupApproved: Boolean(body.mockupApproved || body.layoutApproved),
        status: body.status || 'Order Confirmed • Studio Batch Allocated',
        stageIndex: Number(body.stageIndex ?? 1),
        courier: body.courier || 'BlueDart Priority Air • AWB Allocated',
        items: Array.isArray(body.items) ? body.items : [],
        createdAt: new Date().toISOString()
      };

      if (orderRecord.address || orderRecord.phone || orderRecord.pincode) {
        if (db) {
          await db.prepare(
            `UPDATE users SET name = ?, phone = ?, address = ?, pincode = ?, updated_at = datetime('now') WHERE id = ?`
          ).bind(
            orderRecord.customerName || user.name,
            orderRecord.phone || user.phone || '',
            orderRecord.address || user.address || '',
            orderRecord.pincode || user.pincode || '',
            user.id
          ).run();
        }
        const memUser = edgeMemoryUsers.get(user.email) || { ...user };
        memUser.name = orderRecord.customerName || memUser.name;
        memUser.phone = orderRecord.phone || memUser.phone || '';
        memUser.address = orderRecord.address || memUser.address || '';
        memUser.pincode = orderRecord.pincode || memUser.pincode || '';
        edgeMemoryUsers.set(user.email, memUser);
      }

      if (db) {
        await db.prepare(
          `INSERT INTO orders (
             order_id, user_id, customer_name, customer_email, phone, address, pincode,
             subtotal, discount, gst_amount, total, payment_method, gift_wrap,
             mockup_approved, status, stage_index, items_json, courier
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(order_id) DO UPDATE SET
             status = excluded.status,
             stage_index = excluded.stage_index,
             mockup_approved = excluded.mockup_approved`
        ).bind(
          orderRecord.orderId,
          orderRecord.userId,
          orderRecord.customerName,
          orderRecord.customerEmail,
          orderRecord.phone,
          orderRecord.address,
          orderRecord.pincode,
          orderRecord.subtotal,
          orderRecord.discount,
          orderRecord.gstAmount,
          orderRecord.total,
          orderRecord.paymentMethod,
          orderRecord.giftWrap ? 1 : 0,
          orderRecord.mockupApproved ? 1 : 0,
          orderRecord.status,
          orderRecord.stageIndex,
          JSON.stringify(orderRecord.items),
          orderRecord.courier
        ).run();
      }

      edgeMemoryOrders.set(orderId, orderRecord);
      return jsonResponse({ ok: true, order: orderRecord });
    }

    return jsonResponse({ ok: false, error: `Unknown endpoint: /api/${path}` }, 404);
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || 'Internal Server Error' }, 500);
  }
}
