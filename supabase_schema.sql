-- ============================================================================
-- VISTĀRA KRAFTS × RESIN ART MEMORIES — FULL-FLEDGED SUPABASE DATABASE SCHEMA
-- Canonical PostgreSQL Schema for Customer Storefront & Admin Portal
-- Compatible with: https://github.com/abhieee-java/vistara-krafts
--                  https://github.com/abhieee-java/vistara-krafts-admin
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom Types
DO $$ BEGIN
  CREATE TYPE product_category_enum AS ENUM ('keepsakes', 'casting', 'deep_pour', 'pigments', 'molds', 'accessories');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE product_gender_enum AS ENUM ('all', 'men', 'women');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE gender_affinity_enum AS ENUM ('neutral', 'masculine', 'feminine');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status_enum AS ENUM ('new', 'pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE courier_enum AS ENUM ('Delhivery', 'BlueDart', 'DTDC');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 3. PROFILES TABLE (Linked with Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  gender_preference TEXT DEFAULT 'universal' CHECK (gender_preference IN ('masculine', 'feminine', 'universal')),
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'artisan')),
  shipping_address JSONB DEFAULT '{}'::jsonb,
  wishlist_json JSONB DEFAULT '[]'::jsonb,
  member_tier TEXT DEFAULT 'Verified Vistāra Patron',
  loyalty_points INTEGER DEFAULT 250,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender_preference);

-- ============================================================================
-- 4. PRODUCTS TABLE (12 Curated Items + Custom Variations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  category product_category_enum NOT NULL DEFAULT 'casting',
  sub_category TEXT DEFAULT '',
  badge TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL,
  regular_price NUMERIC(10,2) NOT NULL,
  ratio TEXT DEFAULT '',
  viscosity TEXT DEFAULT 'medium' CHECK (viscosity IN ('low', 'medium', 'high')),
  cure_time TEXT DEFAULT '',
  rating NUMERIC(2,1) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER DEFAULT 10,
  low_stock_threshold INTEGER DEFAULT 3,
  is_customizable BOOLEAN DEFAULT FALSE,
  image TEXT NOT NULL, -- Cloudinary secure CDN URL
  gallery JSONB DEFAULT '[]'::jsonb, -- Array of Cloudinary URLs
  variants JSONB DEFAULT '[]'::jsonb, -- Array of ProductVariant objects
  colors JSONB DEFAULT '[]'::jsonb,
  shapes JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb,
  gender product_gender_enum DEFAULT 'all',
  gender_affinity gender_affinity_enum DEFAULT 'neutral',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_affinity ON public.products(gender_affinity);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- ============================================================================
-- 5. ORDERS TABLE (Unified Storefront & Admin Fulfillment)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  coupon_code TEXT DEFAULT '',
  shipping_fee NUMERIC(10,2) DEFAULT 0,
  gst_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  order_status order_status_enum NOT NULL DEFAULT 'new',
  payment_status payment_status_enum NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'razorpay' CHECK (payment_method IN ('razorpay', 'cod', 'upi')),
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  carrier courier_enum DEFAULT 'BlueDart',
  tracking_number TEXT DEFAULT '',
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

-- ============================================================================
-- 6. INVENTORY MOVEMENTS TABLE (Admin Audit Ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  change_amount INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('Manual Restock', 'Order Deduction', 'Damaged / Spoilage', 'Correction', 'Return Restock')),
  performed_by TEXT DEFAULT 'System',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory_movements(product_id);

-- ============================================================================
-- 7. COUPONS TABLE (Promotions Engine)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  expiry_date TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  usage_limit INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- ============================================================================
-- 8. CUSTOM MOCKUPS & BRIDAL INQUIRIES (Cloudinary Storage Pipeline)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.custom_mockups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  flower_type TEXT DEFAULT '',
  resin_shape TEXT DEFAULT 'cube',
  dimensions JSONB DEFAULT '{}'::jsonb,
  volume_ml INTEGER DEFAULT 0,
  cloudinary_photo_urls JSONB DEFAULT '[]'::jsonb, -- Array of Cloudinary uploaded URLs
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'design_preview_ready', 'approved', 'casting', 'polishing', 'shipped')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 9. DPDP CONSENTS TABLE (Indian DPDP Act 2023 Statutory Compliance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dpdp_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  ip_address TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 10. STORE SETTINGS TABLE (Global Singleton Configuration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name TEXT DEFAULT 'Vistāra Krafts',
  brand_tagline TEXT DEFAULT 'Artisanal Resin & Ceramic Atelier',
  instagram_handle TEXT DEFAULT '@resin.art.memories',
  contact_email TEXT DEFAULT 'care@vistarakrafts.com',
  contact_phone TEXT DEFAULT '+91 98765 43210',
  currency TEXT DEFAULT 'INR',
  free_shipping_threshold NUMERIC(10,2) DEFAULT 999.00,
  default_courier courier_enum DEFAULT 'BlueDart',
  announcement_bar_text TEXT DEFAULT 'Complimentary Pan-India Express Shipping on Orders Above ₹999',
  announcement_bar_active BOOLEAN DEFAULT TRUE,
  low_stock_alert_threshold INTEGER DEFAULT 5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 11. AUTOMATIC UPDATED_AT TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_mockups_updated_at ON public.custom_mockups;
CREATE TRIGGER trigger_mockups_updated_at BEFORE UPDATE ON public.custom_mockups FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_settings_updated_at ON public.store_settings;
CREATE TRIGGER trigger_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 12. AUTOMATIC PROFILE CREATION TRIGGER (On auth.users Signup)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, gender_preference, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'gender_preference', 'universal'),
    'customer'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN public.profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_mockups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpdp_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read active products; Admins can do anything
CREATE POLICY "Public products viewable by everyone" ON public.products FOR SELECT USING (is_active = TRUE OR auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins have full product management" ON public.products FOR ALL USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Profiles: Users manage their own; Admins view all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR auth.role() = 'service_role');
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Orders: Users view own orders; Anyone can create orders (for guest checkouts); Admins manage all
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins can update orders" ON public.orders FOR ALL USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Coupons: Public read for validation; Admins manage
CREATE POLICY "Anyone can check active coupons" ON public.coupons FOR SELECT USING (is_active = TRUE OR auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Store Settings: Public read; Admins update
CREATE POLICY "Public can view store settings" ON public.store_settings FOR SELECT USING (TRUE);
CREATE POLICY "Admins can update store settings" ON public.store_settings FOR ALL USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Custom Mockups: Users read own; anyone can submit inquiry; admins manage all
CREATE POLICY "Users view own mockups" ON public.custom_mockups FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Anyone can submit inquiry" ON public.custom_mockups FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins manage mockups" ON public.custom_mockups FOR ALL USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- DPDP Consents: Users insert and view own
CREATE POLICY "Users view own consents" ON public.dpdp_consents FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Anyone can record consent" ON public.dpdp_consents FOR INSERT WITH CHECK (TRUE);

-- Inventory Movements: Admin only
CREATE POLICY "Admins view inventory movements" ON public.inventory_movements FOR ALL USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================================
-- 14. SEED DATA (Store Settings, Initial Coupons & 12 Flagship Products)
-- ============================================================================
INSERT INTO public.store_settings (id, store_name, brand_tagline, instagram_handle, contact_email, contact_phone, currency, free_shipping_threshold, default_courier, announcement_bar_text, announcement_bar_active, low_stock_alert_threshold)
VALUES (
  1,
  'Vistāra Krafts',
  'Artisanal Resin & Ceramic Atelier',
  '@resin.art.memories',
  'care@vistarakrafts.com',
  '+91 98765 43210',
  'INR',
  999.00,
  'BlueDart',
  'Complimentary Pan-India Express Shipping on Orders Above ₹999',
  TRUE,
  5
)
ON CONFLICT (id) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  brand_tagline = EXCLUDED.brand_tagline;

INSERT INTO public.coupons (code, discount_type, discount_value, min_order_value, usage_limit, is_active)
VALUES 
  ('KRAFTFIRST', 'percentage', 10.00, 999.00, 500, TRUE),
  ('STUDIO15', 'percentage', 15.00, 2499.00, 200, TRUE),
  ('FLORAL500', 'fixed', 500.00, 3999.00, 100, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Seed the 12 Flagship Products
INSERT INTO public.products (id, sku, name, short_name, subtitle, category, sub_category, badge, price, regular_price, ratio, viscosity, cure_time, rating, reviews_count, in_stock, stock_quantity, low_stock_threshold, is_customizable, image, gallery, variants, colors, shapes, sizes, gender, gender_affinity, is_active)
VALUES
(
  'ram-keep-001',
  'RAM-VRM-BLK-12',
  'Eternal Varmala & Bridal Bouquet Time-Capsule Block',
  'Eternal Varmala Block',
  'Museum-Grade 50mm Deep Optical Cast with 24K Gold Leaf & Custom Brass Calligraphy',
  'keepsakes',
  'floral_preservation',
  'IG Viral Keepsake',
  4499.00,
  5499.00,
  '2:1',
  'low',
  '72h',
  5.0,
  418,
  TRUE,
  18,
  5,
  TRUE,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBXW-CtxPaQNBpLYiDkZiAh_3HctPzR3wSCDa6iBBPevbe8OYTRQh3MBrygeRClgewcRXZmXbGFcwCAJ8voXhr1Gis32c3Xd7f9MpmY8HuxABgInUPnavbPeSPIZtwzwMcmwPtXzx7Z63sTUGuH0-iZ0MPSphmGmleYJW3_njEtUfcbKOPB1icNTEcuIPrr9seRXtiWbBpXV0TUCSnKGRmIqqDcgv5vapJcyIzP8GkKndOeGidcCWTJWg',
  '["https://lh3.googleusercontent.com/aida-public/AB6AXuBXW-CtxPaQNBpLYiDkZiAh_3HctPzR3wSCDa6iBBPevbe8OYTRQh3MBrygeRClgewcRXZmXbGFcwCAJ8voXhr1Gis32c3Xd7f9MpmY8HuxABgInUPnavbPeSPIZtwzwMcmwPtXzx7Z63sTUGuH0-iZ0MPSphmGmleYJW3_njEtUfcbKOPB1icNTEcuIPrr9seRXtiWbBpXV0TUCSnKGRmIqqDcgv5vapJcyIzP8GkKndOeGidcCWTJWg"]'::jsonb,
  '[{"id": "vrm-8in", "label": "8\" Romantic Cube (Bridal Mini)", "price": 2999, "regularPrice": 3699, "stock": 8, "sku": "RAM-VRM-8IN"}, {"id": "vrm-12in", "label": "12\" Royal Heirloom Block", "price": 4499, "regularPrice": 5499, "stock": 7, "sku": "RAM-VRM-12IN"}, {"id": "vrm-16in", "label": "16\" Gallery Mantel Frame", "price": 6999, "regularPrice": 8499, "stock": 3, "sku": "RAM-VRM-16IN"}]'::jsonb,
  '[]'::jsonb,
  '[{"id": "shape-cube", "label": "Classic Cube", "popular": true}, {"id": "shape-hex", "label": "Geometric Hexagon"}, {"id": "shape-arch", "label": "Cathedral Arch"}]'::jsonb,
  '[{"id": "size-8", "label": "8 inch Mini"}, {"id": "size-12", "label": "12 inch Heirloom", "popular": true}, {"id": "size-16", "label": "16 inch Grand"}]'::jsonb,
  'women',
  'feminine',
  TRUE
),
(
  'vk-epx-301',
  'VK-EPX-301-12K',
  'UltraClear 3:1 Casting Resin Kit',
  'UltraClear 3:1 Epoxy',
  'Diamond Clarity Bubble-Release Formula for Jewelry, Coasters, and Thin Casts up to 15mm',
  'casting',
  'optical_epoxy',
  'Formula Bestseller',
  1299.00,
  1599.00,
  '3:1',
  'low',
  '24h',
  4.9,
  684,
  TRUE,
  54,
  10,
  FALSE,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAQWPIc9RjjOm562dw3ddz6mENg7B79L8sE2vd8DXSPWjCkWBCtZKyexl_l-8s30_zToPodAS1phxSqY0nnzQm46KbX4zIIlWVcqAMUZUxTu8aXo6wvOhzgnrtxzNhJ4p8IcsNDvujKOfqx2bD5zxFyCTJsxlJllbFak3BCMsI5-K6pHgOq8f1YZRylmTnljwQMFSsYaT7CYTXj6yxL5v6Vo4kMOGvNksBROF_YEXqD2-Fp9Y88Nea_xg',
  '["https://lh3.googleusercontent.com/aida-public/AB6AXuAQWPIc9RjjOm562dw3ddz6mENg7B79L8sE2vd8DXSPWjCkWBCtZKyexl_l-8s30_zToPodAS1phxSqY0nnzQm46KbX4zIIlWVcqAMUZUxTu8aXo6wvOhzgnrtxzNhJ4p8IcsNDvujKOfqx2bD5zxFyCTJsxlJllbFak3BCMsI5-K6pHgOq8f1YZRylmTnljwQMFSsYaT7CYTXj6yxL5v6Vo4kMOGvNksBROF_YEXqD2-Fp9Y88Nea_xg"]'::jsonb,
  '[{"id": "epx-1kg", "label": "1.2kg Studio Pack (900g A + 300g B)", "price": 1299, "regularPrice": 1599, "stock": 32, "sku": "VK-EPX-301-12K"}, {"id": "epx-4kg", "label": "4kg Workshop Bucket (3kg A + 1kg B)", "price": 3899, "regularPrice": 4799, "stock": 14, "sku": "VK-EPX-301-4K"}, {"id": "epx-12kg", "label": "12kg Bulk Atelier Tub (9kg A + 3kg B)", "price": 10499, "regularPrice": 12999, "stock": 8, "sku": "VK-EPX-301-12K-BULK"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"id": "vol-1_2kg", "label": "1.2 kg Kit"}, {"id": "vol-4kg", "label": "4 kg Workshop", "popular": true}, {"id": "vol-12kg", "label": "12 kg Atelier"}]'::jsonb,
  'all',
  'neutral',
  TRUE
),
(
  'vk-epx-201',
  'VK-EPX-201-3K',
  'Deep Pour 2:1 River Table Epoxy System',
  'Deep Pour 2:1 Epoxy',
  'Low-Exotherm 50mm Single-Pour Formulation Engineered for Live-Edge Wood Slabs',
  'deep_pour',
  'optical_epoxy',
  'Woodworker Choice',
  2899.00,
  3499.00,
  '2:1',
  'low',
  '72h',
  4.9,
  312,
  TRUE,
  28,
  6,
  FALSE,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ52p3q4gL9T_8a3h6t-j7iL_zFm3n3n4gQ7wY5v6xZ0aB8c7dE1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e3f4',
  '[]'::jsonb,
  '[{"id": "dp-3kg", "label": "3kg Kit (2kg A + 1kg B)", "price": 2899, "regularPrice": 3499, "stock": 18, "sku": "VK-EPX-201-3K"}, {"id": "dp-7_5kg", "label": "7.5kg Slab Kit (5kg A + 2.5kg B)", "price": 6499, "regularPrice": 7899, "stock": 10, "sku": "VK-EPX-201-75K"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  'men',
  'masculine',
  TRUE
),
(
  'vk-epx-101',
  'VK-EPX-101-1K',
  'High-Gloss 1:1 Doming & Topcoat Resin',
  '1:1 Doming Topcoat',
  'Self-Leveling Scratch-Resistant Surface Shield with High Surface Tension for Coasters and Art Panels',
  'casting',
  'topcoat',
  'Ultra-Gloss 90 Shore D',
  1099.00,
  1399.00,
  '1:1',
  'high',
  '18h',
  4.8,
  194,
  TRUE,
  42,
  8,
  FALSE,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAQWPIc9RjjOm562dw3ddz6mENg7B79L8sE2vd8DXSPWjCkWBCtZKyexl_l-8s30_zToPodAS1phxSqY0nnzQm46KbX4zIIlWVcqAMUZUxTu8aXo6wvOhzgnrtxzNhJ4p8IcsNDvujKOfqx2bD5zxFyCTJsxlJllbFak3BCMsI5-K6pHgOq8f1YZRylmTnljwQMFSsYaT7CYTXj6yxL5v6Vo4kMOGvNksBROF_YEXqD2-Fp9Y88Nea_xg',
  '[]'::jsonb,
  '[{"id": "dm-1kg", "label": "1kg Kit (500g A + 500g B)", "price": 1099, "regularPrice": 1399, "stock": 42, "sku": "VK-EPX-101-1K"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  'all',
  'neutral',
  TRUE
),
(
  'vk-epx-uv01',
  'VK-EPX-UV-250',
  'Instant Solar Fast-Cure UV Resin',
  'Fast-Cure UV Resin (250g)',
  'Zero-Mixing Instant UV Photopolymer Curing in 90 Seconds Under 365nm UV LED for Bezels & Charms',
  'accessories',
  'uv_resin',
  'Instant 90s Cure',
  649.00,
  849.00,
  '1-Part',
  'medium',
  '90s UV',
  4.9,
  528,
  TRUE,
  65,
  15,
  FALSE,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAQWPIc9RjjOm562dw3ddz6mENg7B79L8sE2vd8DXSPWjCkWBCtZKyexl_l-8s30_zToPodAS1phxSqY0nnzQm46KbX4zIIlWVcqAMUZUxTu8aXo6wvOhzgnrtxzNhJ4p8IcsNDvujKOfqx2bD5zxFyCTJsxlJllbFak3BCMsI5-K6pHgOq8f1YZRylmTnljwQMFSsYaT7CYTXj6yxL5v6Vo4kMOGvNksBROF_YEXqD2-Fp9Y88Nea_xg',
  '[]'::jsonb,
  '[{"id": "uv-100g", "label": "100g Squeeze Bottle", "price": 349, "regularPrice": 449, "stock": 35, "sku": "VK-EPX-UV-100"}, {"id": "uv-250g", "label": "250g Pro Studio Bottle", "price": 649, "regularPrice": 849, "stock": 30, "sku": "VK-EPX-UV-250"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  'all',
  'neutral',
  TRUE
),
(
  'ram-varmala-002',
  'RAM-ROSE-TR-01',
  'Bridal Rose Quartz Floral Preservation Tray',
  'Rose Quartz Floral Tray',
  'Genuine Rose Quartz Chips, Gold Leaf Handles & Preserved Wedding Petals Encased in 18mm Teak Border',
  'keepsakes',
  'floral_preservation',
  'Bespoke Bridal Gift',
  5999.00,
  7499.00,
  '2:1',
  'low',
  '72h',
  5.0,
  216,
  TRUE,
  12,
  4,
  TRUE,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBXW-CtxPaQNBpLYiDkZiAh_3HctPzR3wSCDa6iBBPevbe8OYTRQh3MBrygeRClgewcRXZmXbGFcwCAJ8voXhr1Gis32c3Xd7f9MpmY8HuxABgInUPnavbPeSPIZtwzwMcmwPtXzx7Z63sTUGuH0-iZ0MPSphmGmleYJW3_njEtUfcbKOPB1icNTEcuIPrr9seRXtiWbBpXV0TUCSnKGRmIqqDcgv5vapJcyIzP8GkKndOeGidcCWTJWg',
  '[]'::jsonb,
  '[{"id": "tr-standard", "label": "14\" Oval Bridal Tray", "price": 5999, "regularPrice": 7499, "stock": 8, "sku": "RAM-ROSE-TR-14"}, {"id": "tr-deluxe", "label": "18\" Deluxe Royal Platter", "price": 8499, "regularPrice": 10499, "stock": 4, "sku": "RAM-ROSE-TR-18"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  'women',
  'feminine',
  TRUE
),
(
  'vk-geode-001',
  'VK-GEODE-AMTH-24',
  'Amethyst & Crushed Quartz Resin Geode Wall Art',
  'Amethyst Geode Canvas (24")',
  'Hand-Crushed Brazilian Amethyst Crystals, Metallic Mica Veins & 3-Layer 3D Optical Luster on Wood',
  'keepsakes',
  'art_decor',
  'Masterpiece Statement',
  8499.00,
  10999.00,
  '1:1',
  'medium',
  '48h',
  4.9,
  87,
  TRUE,
  6,
  2,
  TRUE,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ52p3q4gL9T_8a3h6t-j7iL_zFm3n3n4gQ7wY5v6xZ0aB8c7dE1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e3f4',
  '[]'::jsonb,
  '[{"id": "gd-24in", "label": "24\" Statement Round", "price": 8499, "regularPrice": 10999, "stock": 4, "sku": "VK-GEODE-24"}, {"id": "gd-36in", "label": "36\" Grand Foyer Statement", "price": 14999, "regularPrice": 18999, "stock": 2, "sku": "VK-GEODE-36"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  'women',
  'feminine',
  TRUE
),
(
  'vk-ocean-001',
  'VK-OCN-TEAK-18',
  'Pacific Teakwood Ocean Wave Resin Serving Board',
  'Teak Ocean Wave Platter',
  'Food-Safe Certified Multi-Layered Frothing Ocean Wave Cell Structure on Seasoned Karnataka Teakwood',
  'accessories',
  'homeware',
  'Charcuterie Essential',
  2499.00,
  3199.00,
  '1:1',
  'medium',
  '24h',
  4.9,
  342,
  TRUE,
  24,
  5,
  FALSE,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBXW-CtxPaQNBpLYiDkZiAh_3HctPzR3wSCDa6iBBPevbe8OYTRQh3MBrygeRClgewcRXZmXbGFcwCAJ8voXhr1Gis32c3Xd7f9MpmY8HuxABgInUPnavbPeSPIZtwzwMcmwPtXzx7Z63sTUGuH0-iZ0MPSphmGmleYJW3_njEtUfcbKOPB1icNTEcuIPrr9seRXtiWbBpXV0TUCSnKGRmIqqDcgv5vapJcyIzP8GkKndOeGidcCWTJWg',
  '[]'::jsonb,
  '[{"id": "oc-med", "label": "15\" x 8\" Serving Board", "price": 2499, "regularPrice": 3199, "stock": 16, "sku": "VK-OCN-15"}, {"id": "oc-large", "label": "20\" x 10\" Grand Charcuterie Board", "price": 3499, "regularPrice": 4299, "stock": 8, "sku": "VK-OCN-20"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  'all',
  'neutral',
  TRUE
),
(
  'potry-ceramic-001',
  'POTRY-PITCH-01',
  'Sienna Ridged Artisan Ceramic Pitcher',
  'POTRY Sienna Ceramic Pitcher',
  'Hand-Thrown Stoneware with Terracotta Wash & Matte Unglazed Exterior from the POTRY Studio',
  'accessories',
  'ceramics',
  'POTRY Atelier Drop',
  1899.00,
  2499.00,
  '',
  'high',
  'Kiln Fired',
  4.9,
  146,
  TRUE,
  15,
  4,
  FALSE,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAQWPIc9RjjOm562dw3ddz6mENg7B79L8sE2vd8DXSPWjCkWBCtZKyexl_l-8s30_zToPodAS1phxSqY0nnzQm46KbX4zIIlWVcqAMUZUxTu8aXo6wvOhzgnrtxzNhJ4p8IcsNDvujKOfqx2bD5zxFyCTJsxlJllbFak3BCMsI5-K6pHgOq8f1YZRylmTnljwQMFSsYaT7CYTXj6yxL5v6Vo4kMOGvNksBROF_YEXqD2-Fp9Y88Nea_xg',
  '[]'::jsonb,
  '[{"id": "potry-pitch-1l", "label": "1.2 Litre Stoneware Pitcher", "price": 1899, "regularPrice": 2499, "stock": 15, "sku": "POTRY-PITCH-1L"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  'women',
  'feminine',
  TRUE
),
(
  'potry-ceramic-002',
  'POTRY-PLNT-02',
  'Wabi-Sabi Matte Charcoal Ceramic Planter',
  'POTRY Charcoal Planter',
  'Textured Coarse Clay Stoneware with Natural Drainage Tray Engineered for Succulents and Bonsai',
  'accessories',
  'ceramics',
  'Minimalist Luxury',
  1499.00,
  1899.00,
  '',
  'high',
  'Kiln Fired',
  4.8,
  182,
  TRUE,
  22,
  5,
  FALSE,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ52p3q4gL9T_8a3h6t-j7iL_zFm3n3n4gQ7wY5v6xZ0aB8c7dE1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e3f4',
  '[]'::jsonb,
  '[{"id": "potry-plnt-6in", "label": "6\" Tabletop Planter", "price": 1499, "regularPrice": 1899, "stock": 14, "sku": "POTRY-PLNT-6"}, {"id": "potry-plnt-9in", "label": "9\" Living Room Floor Planter", "price": 2299, "regularPrice": 2899, "stock": 8, "sku": "POTRY-PLNT-9"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  'men',
  'masculine',
  TRUE
),
(
  'potry-ceramic-003',
  'POTRY-INCS-03',
  'Terracotta Sunburst Ceramic Incense Plate',
  'POTRY Terracotta Incense Dish',
  'Sunburst Fluted Stoneware with Solid Brass Incense Rod Holder Handcrafted in Bengaluru',
  'accessories',
  'ceramics',
  'Studio Ritual',
  799.00,
  999.00,
  '',
  'medium',
  'Kiln Fired',
  4.9,
  284,
  TRUE,
  45,
  10,
  FALSE,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAQWPIc9RjjOm562dw3ddz6mENg7B79L8sE2vd8DXSPWjCkWBCtZKyexl_l-8s30_zToPodAS1phxSqY0nnzQm46KbX4zIIlWVcqAMUZUxTu8aXo6wvOhzgnrtxzNhJ4p8IcsNDvujKOfqx2bD5zxFyCTJsxlJllbFak3BCMsI5-K6pHgOq8f1YZRylmTnljwQMFSsYaT7CYTXj6yxL5v6Vo4kMOGvNksBROF_YEXqD2-Fp9Y88Nea_xg',
  '[]'::jsonb,
  '[{"id": "potry-incs-single", "label": "Single 5\" Incense Plate + Brass Peg", "price": 799, "regularPrice": 999, "stock": 45, "sku": "POTRY-INCS-SGL"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  'all',
  'neutral',
  TRUE
),
(
  'potry-varmala-cube',
  'POTRY-VK-CUBE-01',
  'Heritage Brass & Ceramic Flower Specimen Cube',
  'Heritage Ceramic Flower Cube',
  'Collaboration: POTRY Hand-Formed Ceramic Pedestal Encasing a High-Clarity Resin Preservation Specimen',
  'keepsakes',
  'hybrid_art',
  'Limited Studio Drop',
  3299.00,
  4199.00,
  '2:1',
  'low',
  '72h',
  5.0,
  93,
  TRUE,
  9,
  3,
  TRUE,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBXW-CtxPaQNBpLYiDkZiAh_3HctPzR3wSCDa6iBBPevbe8OYTRQh3MBrygeRClgewcRXZmXbGFcwCAJ8voXhr1Gis32c3Xd7f9MpmY8HuxABgInUPnavbPeSPIZtwzwMcmwPtXzx7Z63sTUGuH0-iZ0MPSphmGmleYJW3_njEtUfcbKOPB1icNTEcuIPrr9seRXtiWbBpXV0TUCSnKGRmIqqDcgv5vapJcyIzP8GkKndOeGidcCWTJWg',
  '[]'::jsonb,
  '[{"id": "cube-brass-4in", "label": "4\" Brass Inset Pedestal Cube", "price": 3299, "regularPrice": 4199, "stock": 9, "sku": "POTRY-VK-4IN"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  'men',
  'masculine',
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  regular_price = EXCLUDED.regular_price,
  in_stock = EXCLUDED.in_stock,
  stock_quantity = EXCLUDED.stock_quantity;
