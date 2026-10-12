-- ============================================================================
-- Vistāra Krafts — Cloudflare D1 Serverless SQL Schema (cloudflare/schema.sql)
-- Run locally:   npx wrangler d1 execute vistara_krafts_db --local --file=./cloudflare/schema.sql
-- Run in prod:   npx wrangler d1 execute vistara_krafts_db --remote --file=./cloudflare/schema.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  pincode TEXT DEFAULT '',
  provider TEXT NOT NULL DEFAULT 'email', -- 'email' | 'google' | 'apple'
  provider_sub TEXT DEFAULT '',
  password_hash TEXT DEFAULT '',
  password_salt TEXT DEFAULT '',
  member_tier TEXT DEFAULT 'Verified Vistāra Patron',
  loyalty_points INTEGER DEFAULT 250,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS orders (
  order_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  pincode TEXT DEFAULT '',
  subtotal INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  gst_amount REAL NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  gift_wrap INTEGER NOT NULL DEFAULT 1,
  mockup_approved INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  stage_index INTEGER NOT NULL DEFAULT 1,
  items_json TEXT NOT NULL,
  courier TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
