-- ============================================================================
-- VISTĀRA KRAFTS — PRODUCTION SECURITY & RLS HARDENING PATCH
-- Apply in Supabase SQL Editor: https://supabase.com/dashboard/project/niamxrskqhjvzwxomxrx/sql
-- ============================================================================

-- 1. Helper function to verify service_role, owner, or admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(auth.jwt()->>'role', '') = 'service_role' OR
    coalesce(auth.jwt()->'app_metadata'->>'role', '') IN ('admin', 'owner') OR
    coalesce(auth.jwt()->'user_metadata'->>'is_admin', 'false') = 'true'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Products Table Hardening
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Public read active products" ON public.products
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin write products" ON public.products;
CREATE POLICY "Admin write products" ON public.products
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Categories Table Hardening
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin write categories" ON public.categories;
CREATE POLICY "Admin write categories" ON public.categories
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Orders Table Hardening
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers can ONLY read their own orders; Admins can read all
DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
CREATE POLICY "Users read own orders" ON public.orders
  FOR SELECT USING ((auth.uid() IS NOT NULL AND auth.uid() = user_id) OR public.is_admin());

-- Customers can only insert orders with payment_status = 'pending'
DROP POLICY IF EXISTS "Users insert orders" ON public.orders;
CREATE POLICY "Users insert orders" ON public.orders
  FOR INSERT WITH CHECK (
    (payment_status = 'pending' AND (user_id IS NULL OR user_id = auth.uid()))
    OR public.is_admin()
  );

-- Customers CANNOT update orders, tamper with totals, or mark orders paid
DROP POLICY IF EXISTS "Admin update orders" ON public.orders;
CREATE POLICY "Admin update orders" ON public.orders
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin delete orders" ON public.orders;
CREATE POLICY "Admin delete orders" ON public.orders
  FOR DELETE USING (public.is_admin());

-- 5. Payments Table Hardening
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin view payments" ON public.payments;
CREATE POLICY "Admin view payments" ON public.payments
  FOR SELECT USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "System insert payments" ON public.payments;
CREATE POLICY "System insert payments" ON public.payments
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. Coupons Table Hardening
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view coupons" ON public.coupons;
CREATE POLICY "Public view coupons" ON public.coupons
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage coupons" ON public.coupons;
CREATE POLICY "Admin manage coupons" ON public.coupons
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Settings Table Hardening
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view settings" ON public.settings;
CREATE POLICY "Public view settings" ON public.settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage settings" ON public.settings;
CREATE POLICY "Admin manage settings" ON public.settings
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Inventory Logs Hardening
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin view inventory logs" ON public.inventory_logs;
CREATE POLICY "Admin view inventory logs" ON public.inventory_logs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin write inventory logs" ON public.inventory_logs;
CREATE POLICY "Admin write inventory logs" ON public.inventory_logs
  FOR INSERT WITH CHECK (public.is_admin());
