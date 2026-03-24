-- Migration pour améliorer la base de données Koach
-- Ce script respecte la structure existante et ajoute de nouvelles fonctionnalités

BEGIN;

-- 1. Ajouter des colonnes manquantes à la table books (en respectant les noms existants)
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS publication_year INTEGER;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS publisher TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS viewers INTEGER DEFAULT 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS downloads INTEGER DEFAULT 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 2. Ajouter des colonnes manquantes à la table users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS books_completed INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_pages_read INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_reading_time INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS favorite_genres TEXT[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reading_goal_books INTEGER DEFAULT 12;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reading_goal_pages INTEGER DEFAULT 5000;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Paris';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"achievements": true, "friends": true, "challenges": true}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"profile_public": true, "reading_stats_public": true}';

-- 3. Créer la table categories (pour remplacer le champ categories[] dans books)
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.1 Ajouter les colonnes manquantes à la table categories si elles n'existent pas
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon TEXT;

-- 3.2 Ajouter la contrainte unique sur name si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'categories_name_unique' 
    AND conrelid = 'public.categories'::regclass
  ) THEN
    ALTER TABLE public.categories ADD CONSTRAINT categories_name_unique UNIQUE (name);
  END IF;
END $$;

-- 4. Créer la table book_categories pour la liaison many-to-many
CREATE TABLE IF NOT EXISTS public.book_categories (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, category_id)
);

-- 5. Créer la table reading_sessions (pour tracker les sessions de lecture détaillées)
CREATE TABLE IF NOT EXISTS public.reading_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  start_page INTEGER,
  end_page INTEGER,
  pages_read INTEGER DEFAULT 0,
  minutes_spent INTEGER DEFAULT 0,
  session_start TIMESTAMP WITH TIME ZONE,
  session_end TIMESTAMP WITH TIME ZONE,
  device_type TEXT,
  notes TEXT,
  koach_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_page_order CHECK (end_page IS NULL OR start_page IS NULL OR end_page >= start_page)
);

-- 6. Créer la table user_achievements (système d'achievements détaillé)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  points_earned INTEGER DEFAULT 0,
  progress_current INTEGER DEFAULT 0,
  progress_target INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- 7. Créer la table book_reviews (système d'avis complet)
CREATE TABLE IF NOT EXISTS public.book_reviews (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  is_spoiler BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- 8. Créer la table review_votes (votes d'utilité des avis)
CREATE TABLE IF NOT EXISTS public.review_votes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_id INTEGER NOT NULL REFERENCES public.book_reviews(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, review_id)
);

-- 9. Créer la table user_book_lists (listes personnalisées)
CREATE TABLE IF NOT EXISTS public.user_book_lists (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Créer la table book_list_items
CREATE TABLE IF NOT EXISTS public.book_list_items (
  id SERIAL PRIMARY KEY,
  list_id INTEGER NOT NULL REFERENCES public.user_book_lists(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(list_id, book_id)
);

-- 11. Créer la table reading_goals (objectifs de lecture)
CREATE TABLE IF NOT EXISTS public.reading_goals (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  target_books INTEGER,
  target_pages INTEGER,
  target_minutes INTEGER,
  current_books INTEGER DEFAULT 0,
  current_pages INTEGER DEFAULT 0,
  current_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year)
);

-- 12. Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_books_rating ON public.books(rating DESC);
CREATE INDEX IF NOT EXISTS idx_books_featured ON public.books(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_books_tags ON public.books USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_book_categories_book ON public.book_categories(book_id);
CREATE INDEX IF NOT EXISTS idx_book_categories_category ON public.book_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user ON public.reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book ON public.reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_date ON public.reading_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON public.user_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_book_reviews_book ON public.book_reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_book_reviews_user ON public.book_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_book_reviews_rating ON public.book_reviews(rating);

-- 13. Insérer des catégories de base
INSERT INTO public.categories (name, description) VALUES
  ('Fiction', 'Romans et nouvelles de fiction'),
  ('Science-Fiction', 'Littérature de science-fiction'),
  ('Développement Personnel', 'Livres de croissance personnelle'),
  ('Business', 'Livres sur les affaires et l''entrepreneuriat'),
  ('Histoire', 'Livres d''histoire et biographies'),
  ('Science', 'Livres scientifiques et techniques'),
  ('Philosophie', 'Livres de philosophie'),
  ('Romance', 'Romans d''amour'),
  ('Thriller', 'Livres de suspense et thriller'),
  ('Fantasy', 'Littérature fantastique')
ON CONFLICT (name) DO NOTHING;

-- 13.1 Mettre à jour les colonnes color et icon après insertion
UPDATE public.categories SET 
  color = CASE name
    WHEN 'Fiction' THEN '#8B5CF6'
    WHEN 'Science-Fiction' THEN '#06B6D4'
    WHEN 'Développement Personnel' THEN '#10B981'
    WHEN 'Business' THEN '#F59E0B'
    WHEN 'Histoire' THEN '#EF4444'
    WHEN 'Science' THEN '#3B82F6'
    WHEN 'Philosophie' THEN '#6366F1'
    WHEN 'Romance' THEN '#EC4899'
    WHEN 'Thriller' THEN '#1F2937'
    WHEN 'Fantasy' THEN '#7C3AED'
    ELSE '#3B82F6'
  END,
  icon = CASE name
    WHEN 'Fiction' THEN '📚'
    WHEN 'Science-Fiction' THEN '🚀'
    WHEN 'Développement Personnel' THEN '🌱'
    WHEN 'Business' THEN '💼'
    WHEN 'Histoire' THEN '📜'
    WHEN 'Science' THEN '🔬'
    WHEN 'Philosophie' THEN '🤔'
    WHEN 'Romance' THEN '💕'
    WHEN 'Thriller' THEN '🔍'
    WHEN 'Fantasy' THEN '🧙‍♂️'
    ELSE '📖'
  END
WHERE color IS NULL OR icon IS NULL;

-- 14. Activer RLS sur les nouvelles tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_book_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;

-- 15. Politiques RLS pour categories
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

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

-- 16. Politiques RLS pour book_categories
CREATE POLICY "Anyone can view book categories" ON public.book_categories
  FOR SELECT USING (true);

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

-- 17. Politiques RLS pour reading_sessions
CREATE POLICY "Users can view own reading sessions" ON public.reading_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading sessions" ON public.reading_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading sessions" ON public.reading_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading sessions" ON public.reading_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 18. Politiques RLS pour user_achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own achievements" ON public.user_achievements
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own achievements" ON public.user_achievements
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 19. Politiques RLS pour book_reviews
CREATE POLICY "Anyone can view reviews" ON public.book_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own reviews" ON public.book_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.book_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.book_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- 20. Politiques RLS pour review_votes
CREATE POLICY "Users can view all votes" ON public.review_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own votes" ON public.review_votes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 21. Politiques RLS pour user_book_lists
CREATE POLICY "Users can view own lists and public lists" ON public.user_book_lists
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can manage own lists" ON public.user_book_lists
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 22. Politiques RLS pour book_list_items
CREATE POLICY "Users can view items from accessible lists" ON public.book_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_book_lists 
      WHERE id = list_id 
      AND (user_id = auth.uid() OR is_public = true)
    )
  );

CREATE POLICY "Users can manage items in own lists" ON public.book_list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_book_lists 
      WHERE id = list_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_book_lists 
      WHERE id = list_id AND user_id = auth.uid()
    )
  );

-- 23. Politiques RLS pour reading_goals
CREATE POLICY "Users can view own reading goals" ON public.reading_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reading goals" ON public.reading_goals
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 24. Mettre à jour les fonctions existantes et en ajouter de nouvelles
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

-- 25. Fonction pour calculer la note moyenne d'un livre
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

-- 26. Améliorer la fonction add_koach_points existante
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

-- 27. Améliorer la fonction increment_book_viewers existante
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

-- 28. Ajouter des triggers pour les nouvelles tables
CREATE TRIGGER update_book_reviews_updated_at
  BEFORE UPDATE ON public.book_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_book_lists_updated_at
  BEFORE UPDATE ON public.user_book_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_goals_updated_at
  BEFORE UPDATE ON public.reading_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 29. Trigger pour mettre à jour les stats après une session de lecture
CREATE OR REPLACE FUNCTION public.handle_reading_session_update()
RETURNS TRIGGER
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

DROP TRIGGER IF EXISTS on_reading_session_insert ON public.reading_sessions;
CREATE TRIGGER on_reading_session_insert
  AFTER INSERT ON public.reading_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_reading_session_update();

-- 30. Trigger pour mettre à jour la note des livres après un avis
CREATE OR REPLACE FUNCTION public.handle_review_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_book_rating(OLD.book_id);
    RETURN OLD;
  END IF;
  PERFORM public.update_book_rating(NEW.book_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_review_insert ON public.book_reviews;
DROP TRIGGER IF EXISTS on_review_update ON public.book_reviews;
DROP TRIGGER IF EXISTS on_review_delete ON public.book_reviews;

CREATE TRIGGER on_review_insert
  AFTER INSERT ON public.book_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_review_update();

CREATE TRIGGER on_review_update
  AFTER UPDATE ON public.book_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_review_update();

CREATE TRIGGER on_review_delete
  AFTER DELETE ON public.book_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_review_update();

COMMIT;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration terminée avec succès !';
  RAISE NOTICE 'Nouvelles fonctionnalités ajoutées en respectant votre structure existante.';
END $$;

