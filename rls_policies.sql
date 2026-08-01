-- ============================================================
-- BookWorm — Supabase Row Level Security (RLS) Baseline
-- ============================================================
-- Run this entire script in your Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Paste → Run
--
-- This script is IDEMPOTENT — safe to re-run at any time.
-- It creates missing tables, then enables RLS, then sets policies.
--
-- Tables covered: users, books, orders, order_items, reviews
--
-- Role model:
--   anon   → public read of books/reviews only
--   user   → authenticated, role = 'user' in public.users
--   admin  → authenticated, role = 'admin' in public.users
-- ============================================================


-- ── STEP 1: Create any missing tables ─────────────────────
-- These are CREATE TABLE IF NOT EXISTS statements.
-- If the table already exists, this is a no-op.

-- public.users (mirrors auth.users via trigger)
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT,
  email      TEXT,
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'seller')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- public.books
CREATE TABLE IF NOT EXISTS public.books (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  author         TEXT,
  isbn           TEXT,
  genre          TEXT,
  condition      TEXT CHECK (condition IN ('Like New', 'Good', 'Fair', 'Worn')),
  student_price  NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  quantity       INTEGER NOT NULL DEFAULT 1,
  description    TEXT,
  image_url      TEXT,
  seller_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  listed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- public.orders
CREATE TABLE IF NOT EXISTS public.orders (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  fulfillment_type   TEXT CHECK (fulfillment_type IN ('delivery', 'pickup')),
  total_amount       NUMERIC(10,2) NOT NULL,
  shipping_name      TEXT,
  shipping_address   TEXT,
  shipping_city      TEXT,
  shipping_zip       TEXT,
  shipping_phone     TEXT,
  collect_date       DATE,
  collect_time_slot  TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- public.order_items
CREATE TABLE IF NOT EXISTS public.order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  book_id           UUID NOT NULL REFERENCES public.books(id) ON DELETE RESTRICT,
  quantity          INTEGER NOT NULL DEFAULT 1,
  price_at_purchase NUMERIC(10,2) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- public.reviews  ← this was the missing table causing your error
CREATE TABLE IF NOT EXISTS public.reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id    UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One review per user per book
  UNIQUE (book_id, user_id)
);


-- ── STEP 2: Enable RLS on all tables ──────────────────────
-- The master switch. Without this, ALL data is world-readable.

ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews     ENABLE ROW LEVEL SECURITY;


-- ── STEP 3: Helper function — is current user an admin? ───
-- Reads the role column from public.users for the current JWT.
-- SECURITY DEFINER so it bypasses RLS when checking its own table.

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


-- ── STEP 4: Auth trigger — auto-create profile on signup ──
-- When a user signs up via Supabase Auth, automatically insert
-- a matching row in public.users so our app can read it.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Attach trigger (drop first to make this idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- POLICIES: public.users
-- ============================================================

DROP POLICY IF EXISTS "users: own profile read"   ON public.users;
DROP POLICY IF EXISTS "users: admin read all"      ON public.users;
DROP POLICY IF EXISTS "users: own profile update"  ON public.users;

-- Users read their own profile row only.
CREATE POLICY "users: own profile read"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all user profiles.
CREATE POLICY "users: admin read all"
  ON public.users FOR SELECT
  USING (public.is_admin());

-- Users can update their own profile, but CANNOT escalate their own role.
CREATE POLICY "users: own profile update"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );


-- ============================================================
-- POLICIES: public.books
-- ============================================================

DROP POLICY IF EXISTS "books: public read"        ON public.books;
DROP POLICY IF EXISTS "books: seller insert own"  ON public.books;
DROP POLICY IF EXISTS "books: seller update own"  ON public.books;
DROP POLICY IF EXISTS "books: admin full access"  ON public.books;

-- Anyone (anon included) can browse the catalog.
CREATE POLICY "books: public read"
  ON public.books FOR SELECT
  USING (true);

-- Sellers can list books under their own seller_id.
CREATE POLICY "books: seller insert own"
  ON public.books FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = seller_id
  );

-- Sellers can update only their own listings; cannot transfer ownership.
CREATE POLICY "books: seller update own"
  ON public.books FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Admins have full INSERT / UPDATE / DELETE.
CREATE POLICY "books: admin full access"
  ON public.books FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- POLICIES: public.orders
-- ============================================================

DROP POLICY IF EXISTS "orders: own read"       ON public.orders;
DROP POLICY IF EXISTS "orders: admin read all" ON public.orders;
DROP POLICY IF EXISTS "orders: own insert"     ON public.orders;
DROP POLICY IF EXISTS "orders: admin update"   ON public.orders;

-- Users see only their own orders.
CREATE POLICY "orders: own read"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Admins see all orders.
CREATE POLICY "orders: admin read all"
  ON public.orders FOR SELECT
  USING (public.is_admin());

-- Authenticated users can place orders for themselves only.
CREATE POLICY "orders: own insert"
  ON public.orders FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
  );

-- Only admins can update order status (pending → shipped → delivered).
-- Users cannot self-approve or self-cancel orders.
CREATE POLICY "orders: admin update"
  ON public.orders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- POLICIES: public.order_items
-- ============================================================

DROP POLICY IF EXISTS "order_items: own read"       ON public.order_items;
DROP POLICY IF EXISTS "order_items: admin read all" ON public.order_items;
DROP POLICY IF EXISTS "order_items: own insert"     ON public.order_items;

-- Users can read line items only if they own the parent order.
CREATE POLICY "order_items: own read"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Admins can read all order line items.
CREATE POLICY "order_items: admin read all"
  ON public.order_items FOR SELECT
  USING (public.is_admin());

-- Users can insert line items only into orders they own.
CREATE POLICY "order_items: own insert"
  ON public.order_items FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- No direct UPDATE or DELETE on order_items by anyone.
-- Cancellation flows through the orders.status column only.


-- ============================================================
-- POLICIES: public.reviews
-- ============================================================

DROP POLICY IF EXISTS "reviews: public read"  ON public.reviews;
DROP POLICY IF EXISTS "reviews: own insert"   ON public.reviews;
DROP POLICY IF EXISTS "reviews: own update"   ON public.reviews;
DROP POLICY IF EXISTS "reviews: own delete"   ON public.reviews;
DROP POLICY IF EXISTS "reviews: admin full"   ON public.reviews;

-- Anyone can read reviews (public catalog feature).
CREATE POLICY "reviews: public read"
  ON public.reviews FOR SELECT
  USING (true);

-- Authenticated users can submit one review per book (enforced by UNIQUE constraint).
CREATE POLICY "reviews: own insert"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
  );

-- Users can edit only their own reviews.
CREATE POLICY "reviews: own update"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews.
CREATE POLICY "reviews: own delete"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can moderate (delete) any review.
CREATE POLICY "reviews: admin full"
  ON public.reviews FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- STORAGE: book-covers bucket policies
-- ============================================================
-- Run this block only if you have uploaded at least one file
-- to the book-covers bucket (the bucket must exist first).

DROP POLICY IF EXISTS "covers: public read"  ON storage.objects;
DROP POLICY IF EXISTS "covers: auth upload"  ON storage.objects;
DROP POLICY IF EXISTS "covers: owner delete" ON storage.objects;

-- Anyone can view cover images (catalog is public).
CREATE POLICY "covers: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-covers');

-- Authenticated users can upload cover images.
CREATE POLICY "covers: auth upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'book-covers'
    AND auth.uid() IS NOT NULL
  );

-- Uploader or admin can delete a cover image.
CREATE POLICY "covers: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'book-covers'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_admin()
    )
  );


-- ============================================================
-- VERIFICATION — run this after everything above succeeds
-- ============================================================
-- Expected result: all 5 rows show RLS Enabled = true

SELECT
  schemaname,
  tablename,
  rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'books', 'orders', 'order_items', 'reviews')
ORDER BY tablename;
