-- =============================================================================
-- Supabase security hardening (linter 0011 + 0024)
-- =============================================================================
-- Fixes:
--   1) function_search_path_mutable — SET search_path on public functions
--   2) rls_policy_always_true — replace WITH CHECK (true) / USING (true) on writes
--
-- Run in: Supabase Dashboard → SQL Editor
-- Safe to re-run: uses IF EXISTS / CREATE OR REPLACE where possible.
--
-- NOT covered here (Dashboard / platform):
--   - auth_leaked_password_protection → Auth → Providers → Email → enable HIBP
--   - vulnerable_postgres_version → Project Settings → Infrastructure → upgrade
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) search_path — dynamic ALTER for every overload of known function names
--    (covers update_author_books_count, duplicate add_koach_points signatures, etc.)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.proname IN (
        'update_user_stats',
        'update_book_rating',
        'add_koach_points',
        'increment_book_viewers',
        'handle_reading_session_update',
        'handle_review_update',
        'update_updated_at_column',
        'update_author_books_count',
        'update_updated_at',
        'update_modified_column',
        'handle_new_user',
        'handle_user_delete'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path TO public', r.sig);
    RAISE NOTICE 'SET search_path on %', r.sig;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Recreate core stats / trigger functions (bodies + search_path in definition)
--    Adjust column names if your schema differs (e.g. reading_plans vs user_books).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_user_stats(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users SET
    books_completed = (
      SELECT COUNT(*)::integer FROM public.reading_plans
      WHERE reading_plans.user_id = users.id AND status = 'completed'
    ),
    total_pages_read = (
      SELECT COALESCE(SUM(pages_read), 0)::integer FROM public.reading_sessions
      WHERE reading_sessions.user_id = users.id
    ),
    total_reading_time = (
      SELECT COALESCE(SUM(minutes_spent), 0)::integer FROM public.reading_sessions
      WHERE reading_sessions.user_id = users.id
    )
  WHERE id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_book_rating(book_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.books SET
    rating = (
      SELECT COALESCE(AVG(rating::real), 0)
      FROM public.book_reviews
      WHERE book_reviews.book_id = books.id
    ),
    rating_count = (
      SELECT COUNT(*)::integer
      FROM public.book_reviews
      WHERE book_reviews.book_id = books.id
    )
  WHERE id = book_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_koach_points(user_id uuid, points_to_add integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET koach_points = COALESCE(koach_points, 0) + points_to_add
  WHERE id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_book_viewers(book_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.books
  SET viewers = COALESCE(viewers, 0) + 1
  WHERE id = book_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_reading_session_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.update_user_stats(NEW.user_id);
  IF NEW.koach_earned IS NOT NULL AND NEW.koach_earned > 0 THEN
    PERFORM public.add_koach_points(NEW.user_id, NEW.koach_earned);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_review_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_book_rating(OLD.book_id);
  ELSE
    PERFORM public.update_book_rating(NEW.book_id);
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Optional: author book counts (create if you use this trigger; safe no-op until attached)
CREATE OR REPLACE FUNCTION public.update_author_books_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.author_id IS NOT NULL THEN
      UPDATE public.authors SET books_count = COALESCE(books_count, 0) + 1 WHERE id = NEW.author_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.author_id IS NOT NULL THEN
      UPDATE public.authors SET books_count = GREATEST(COALESCE(books_count, 0) - 1, 0) WHERE id = OLD.author_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.author_id IS DISTINCT FROM NEW.author_id THEN
      IF OLD.author_id IS NOT NULL THEN
        UPDATE public.authors SET books_count = GREATEST(COALESCE(books_count, 0) - 1, 0) WHERE id = OLD.author_id;
      END IF;
      IF NEW.author_id IS NOT NULL THEN
        UPDATE public.authors SET books_count = COALESCE(books_count, 0) + 1 WHERE id = NEW.author_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3) RLS — drop permissive write policies and replace with scoped checks
--    Admins (users.is_admin) may edit/delete catalogue categories.
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- authors (skip if table absent)
DO $$
BEGIN
  IF to_regclass('public.authors') IS NULL THEN
    RAISE NOTICE 'Skip authors policies: table public.authors not found';
  ELSE
    EXECUTE $p$
      DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.authors;
      DROP POLICY IF EXISTS "Signed-in users may insert authors" ON public.authors;
      CREATE POLICY "Signed-in users may insert authors" ON public.authors
        FOR INSERT TO authenticated
        WITH CHECK (auth.uid() IS NOT NULL);
    $p$;
  END IF;
END $$;

-- books
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.books;
DROP POLICY IF EXISTS "Authenticated users can insert books" ON public.books;
DROP POLICY IF EXISTS "Signed-in users may insert books" ON public.books;
CREATE POLICY "Signed-in users may insert books" ON public.books
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- categories: split ALL into insert (any signed-in) vs update/delete (admins)
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins delete categories" ON public.categories;

CREATE POLICY "Authenticated insert categories" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins update categories" ON public.categories
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true
    )
  );

CREATE POLICY "Admins delete categories" ON public.categories
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true
    )
  );

-- book_categories
DROP POLICY IF EXISTS "Authenticated users can manage book categories" ON public.book_categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.book_categories;
DROP POLICY IF EXISTS "Authenticated insert book_categories" ON public.book_categories;
DROP POLICY IF EXISTS "Authenticated update book_categories" ON public.book_categories;
DROP POLICY IF EXISTS "Authenticated delete book_categories" ON public.book_categories;

CREATE POLICY "Authenticated insert book_categories" ON public.book_categories
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.books b WHERE b.id = book_id)
    AND EXISTS (SELECT 1 FROM public.categories c WHERE c.id = category_id)
  );

CREATE POLICY "Authenticated update book_categories" ON public.book_categories
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.books b WHERE b.id = book_id)
    AND EXISTS (SELECT 1 FROM public.categories c WHERE c.id = category_id)
  );

CREATE POLICY "Authenticated delete book_categories" ON public.book_categories
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- user_achievements: remove wide open policy; triggers / service_role bypass RLS
DROP POLICY IF EXISTS "System can manage achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users insert own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users update own achievements" ON public.user_achievements;

CREATE POLICY "Users insert own achievements" ON public.user_achievements
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own achievements" ON public.user_achievements
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- End. Re-run Supabase Database Linter.
-- =============================================================================
