-- ============================================================
-- BookWorm — Supabase Row Level Security (RLS) Baseline
-- ============================================================
-- Run this entire script in your Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Paste → Run
--
-- Tables covered: users, books, orders, order_items, reviews
--
-- Role model:
--   anon   → public read of books/reviews only
--   user   → authenticated, role = 'user' in public.users
--   admin  → authenticated, role = 'admin' in public.users
-- ============================================================


-- ── STEP 1: Enable RLS on all tables ──────────────────────
-- This is the master switch. Without this, ALL data is public.

ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews     ENABLE ROW LEVEL SECURITY;


-- ── STEP 2: Helper function — is current user an admin? ───
-- Reads the role column from public.users for the current JWT.
-- SECURITY DEFINER so it runs as postgres (bypasses RLS on itself).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;


-- ============================================================
-- TABLE: public.users
-- ============================================================

-- Users can only read their own profile row.
-- Admins can read all users.
DROP POLICY IF EXISTS "users: own profile read"  ON public.users;
DROP POLICY IF EXISTS "users: admin read all"    ON public.users;
DROP POLICY IF EXISTS "users: own profile update" ON public.users;

CREATE POLICY "users: own profile read"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users: admin read all"
  ON public.users
  FOR SELECT
  USING (public.is_admin());

-- Users can update only their own profile (name, avatar, etc).
-- They CANNOT change their own `role` column — that's admin-only.
CREATE POLICY "users: own profile update"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

-- Insert is handled by the Supabase Auth trigger (handle_new_user).
-- Do NOT add an open INSERT policy here.


-- ============================================================
-- TABLE: public.books
-- ============================================================

-- Anyone (including anonymous visitors) can browse books.
DROP POLICY IF EXISTS "books: public read"          ON public.books;
DROP POLICY IF EXISTS "books: seller insert own"    ON public.books;
DROP POLICY IF EXISTS "books: seller update own"    ON public.books;
DROP POLICY IF EXISTS "books: admin full access"    ON public.books;

CREATE POLICY "books: public read"
  ON public.books
  FOR SELECT
  USING (true);

-- Authenticated sellers can list their own books.
CREATE POLICY "books: seller insert own"
  ON public.books
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = seller_id
  );

-- Sellers can update only books they own.
-- They cannot reassign seller_id to someone else.
CREATE POLICY "books: seller update own"
  ON public.books
  FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Admins have full INSERT / UPDATE / DELETE.
CREATE POLICY "books: admin full access"
  ON public.books
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- TABLE: public.orders
-- ============================================================

-- Users see only their own orders. Admins see all.
DROP POLICY IF EXISTS "orders: own read"         ON public.orders;
DROP POLICY IF EXISTS "orders: admin read all"   ON public.orders;
DROP POLICY IF EXISTS "orders: own insert"       ON public.orders;
DROP POLICY IF EXISTS "orders: admin update"     ON public.orders;

CREATE POLICY "orders: own read"
  ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "orders: admin read all"
  ON public.orders
  FOR SELECT
  USING (public.is_admin());

-- Authenticated users can create orders for themselves only.
CREATE POLICY "orders: own insert"
  ON public.orders
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
  );

-- Only admins can change order status (pending → shipped → delivered).
-- Users cannot self-update order status.
CREATE POLICY "orders: admin update"
  ON public.orders
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- TABLE: public.order_items
-- ============================================================

-- Users can read line items only for orders they own.
DROP POLICY IF EXISTS "order_items: own read"       ON public.order_items;
DROP POLICY IF EXISTS "order_items: admin read all" ON public.order_items;
DROP POLICY IF EXISTS "order_items: own insert"     ON public.order_items;

CREATE POLICY "order_items: own read"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items: admin read all"
  ON public.order_items
  FOR SELECT
  USING (public.is_admin());

-- Line items are inserted as part of order creation.
-- User must own the parent order.
CREATE POLICY "order_items: own insert"
  ON public.order_items
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- No direct UPDATE or DELETE on order_items for anyone.
-- Cancellation is handled via the orders status column only.


-- ============================================================
-- TABLE: public.reviews
-- ============================================================

-- Anyone can read reviews.
DROP POLICY IF EXISTS "reviews: public read"     ON public.reviews;
DROP POLICY IF EXISTS "reviews: own insert"      ON public.reviews;
DROP POLICY IF EXISTS "reviews: own update"      ON public.reviews;
DROP POLICY IF EXISTS "reviews: own delete"      ON public.reviews;
DROP POLICY IF EXISTS "reviews: admin full"      ON public.reviews;

CREATE POLICY "reviews: public read"
  ON public.reviews
  FOR SELECT
  USING (true);

-- Authenticated users can insert a review for themselves only.
CREATE POLICY "reviews: own insert"
  ON public.reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
  );

-- Users can edit only their own reviews.
CREATE POLICY "reviews: own update"
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own reviews.
CREATE POLICY "reviews: own delete"
  ON public.reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can delete any review (moderation).
CREATE POLICY "reviews: admin full"
  ON public.reviews
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- STEP 3: Storage — book-covers bucket policies
-- ============================================================
-- Run this ONLY if you use Supabase Storage for book cover images.
-- Requires the bucket `book-covers` to already exist.

-- Anyone can read cover images (public catalog).
DROP POLICY IF EXISTS "covers: public read"     ON storage.objects;
DROP POLICY IF EXISTS "covers: auth upload"     ON storage.objects;
DROP POLICY IF EXISTS "covers: owner delete"    ON storage.objects;

CREATE POLICY "covers: public read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'book-covers');

-- Authenticated users can upload cover images.
CREATE POLICY "covers: auth upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'book-covers'
    AND auth.uid() IS NOT NULL
  );

-- Users can delete only images they uploaded; admins can delete any.
CREATE POLICY "covers: owner delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'book-covers'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin()
    )
  );


-- ============================================================
-- STEP 4: Verification — confirm RLS is active
-- ============================================================
-- Run this query after the above to confirm every table has RLS on.
-- Expected: all rows show rowsecurity = true

SELECT
  schemaname,
  tablename,
  rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'books', 'orders', 'order_items', 'reviews')
ORDER BY tablename;
