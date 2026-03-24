-- ============================================================
-- Script Supabase : tables nécessaires au Leaderboard
-- À exécuter dans SQL Editor (Supabase Dashboard)
-- ============================================================
-- Si les tables existent déjà, tu peux ignorer les erreurs "already exists"
-- ============================================================

-- 1. Table users (si elle n'existe pas)
-- Elle doit avoir la FK vers auth.users pour que Supabase Auth fonctionne
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  is_premium boolean NOT NULL DEFAULT false,
  koach_points integer NOT NULL DEFAULT 0,
  reading_streak integer NOT NULL DEFAULT 0,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz NOT NULL DEFAULT now(),
  avatar_url text,
  has_completed_onboarding boolean NOT NULL DEFAULT false,
  is_admin boolean NOT NULL DEFAULT false,
  books_completed integer DEFAULT 0,
  total_pages_read integer DEFAULT 0,
  total_reading_time integer DEFAULT 0,
  reading_goal_books integer DEFAULT 12,
  reading_goal_pages integer DEFAULT 5000,
  timezone text DEFAULT 'Europe/Paris',
  notification_settings jsonb DEFAULT '{"friends": true, "challenges": true, "achievements": true}',
  privacy_settings jsonb DEFAULT '{"profile_public": true, "reading_stats_public": true}'
);

-- 2. Table badges (pour user_badges)
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon_url text,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Table user_badges (classement général - comptage badges)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- 4. Table books (ignorée si elle existe déjà)
CREATE TABLE IF NOT EXISTS public.books (
  id serial PRIMARY KEY,
  title text NOT NULL,
  total_pages integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Table user_books (classement PAR LIVRE)
CREATE TABLE IF NOT EXISTS public.user_books (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id integer NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  current_page integer NOT NULL DEFAULT 0,
  is_favorite boolean NOT NULL DEFAULT false,
  is_completed boolean NOT NULL DEFAULT false,
  rating integer CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  review text,
  reading_time integer DEFAULT 0,
  last_read_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- 6. Trigger : créer une ligne dans public.users à chaque inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. RLS (Row Level Security) - autoriser la lecture pour les utilisateurs connectés
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policy : tout le monde peut lire users (pour le leaderboard)
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
CREATE POLICY "Users are viewable by everyone" ON public.users
  FOR SELECT USING (true);

-- Policy : les users peuvent lire leur propre user_books
DROP POLICY IF EXISTS "Users can view own user_books" ON public.user_books;
CREATE POLICY "Users can view own user_books" ON public.user_books
  FOR SELECT USING (auth.uid() = user_id);

-- Policy : tout le monde peut lire user_books (pour le leaderboard par livre)
DROP POLICY IF EXISTS "User books viewable for leaderboard" ON public.user_books;
CREATE POLICY "User books viewable for leaderboard" ON public.user_books
  FOR SELECT USING (true);

-- Policy : user_badges lisibles par tous
DROP POLICY IF EXISTS "User badges viewable by everyone" ON public.user_badges;
CREATE POLICY "User badges viewable by everyone" ON public.user_badges
  FOR SELECT USING (true);

-- 8. Service role bypass (le backend utilise SUPABASE_SERVICE_ROLE_KEY)
-- Le service role ignore RLS, donc pas de policy supplémentaire nécessaire
