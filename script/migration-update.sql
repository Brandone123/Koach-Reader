-- Migration pour améliorer la base de données Koach
-- Ce script ajoute de nouvelles fonctionnalités sans supprimer les données existantes

BEGIN;

-- 1. Ajouter des colonnes manquantes à la table books
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS isbn TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'fr';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS genre TEXT;
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

-- 3. Créer la table categories si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Créer la table book_categories pour la liaison many-to-many
CREATE TABLE IF NOT EXISTS public.book_categories (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, category_id)
);

-- 5. Créer la table reading_sessions si elle n'existe pas
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

-- 6. Créer la table user_achievements
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

-- 7. Créer la table book_reviews
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

-- 8. Créer la table review_votes
CREATE TABLE IF NOT EXISTS public.review_votes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_id INTEGER NOT NULL REFERENCES public.book_reviews(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, review_id)
);

-- 9. Créer la table user_book_lists pour les listes personnalisées
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

-- 11. Créer la table reading_goals
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
CREATE INDEX IF NOT EXISTS idx_books_genre ON public.books(genre);
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
INSERT INTO public.categories (name, description, color, icon) VALUES
  ('Fiction', 'Romans et nouvelles de fiction', '#8B5CF6', '📚'),
  ('Science-Fiction', 'Littérature de science-fiction', '#06B6D4', '🚀'),
  ('Développement Personnel', 'Livres de croissance personnelle', '#10B981', '🌱'),
  ('Business', 'Livres sur les affaires et l''entrepreneuriat', '#F59E0B', '💼'),
  ('Histoire', 'Livres d''histoire et biographies', '#EF4444', '📜'),
  ('Science', 'Livres scientifiques et techniques', '#3B82F6', '🔬'),
  ('Philosophie', 'Livres de philosophie', '#6366F1', '🤔'),
  ('Romance', 'Romans d''amour', '#EC4899', '💕'),
  ('Thriller', 'Livres de suspense et thriller', '#1F2937', '🔍'),
  ('Fantasy', 'Littérature fantastique', '#7C3AED', '🧙‍♂️')
ON CONFLICT (name) DO NOTHING;

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

-- 15. Créer les politiques RLS pour categories
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 16. Créer les politiques RLS pour book_categories
CREATE POLICY "Anyone can view book categories" ON public.book_categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage book categories" ON public.book_categories
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 17. Créer les politiques RLS pour reading_sessions
CREATE POLICY "Users can view own reading sessions" ON public.reading_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading sessions" ON public.reading_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading sessions" ON public.reading_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading sessions" ON public.reading_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 18. Créer les politiques RLS pour user_achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage achievements" ON public.user_achievements
  FOR ALL USING (true)
  WITH CHECK (true);

-- 19. Créer les politiques RLS pour book_reviews
CREATE POLICY "Anyone can view reviews" ON public.book_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own reviews" ON public.book_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.book_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.book_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- 20. Créer les politiques RLS pour review_votes
CREATE POLICY "Users can view all votes" ON public.review_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own votes" ON public.review_votes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 21. Créer les politiques RLS pour user_book_lists
CREATE POLICY "Users can view own lists and public lists" ON public.user_book_lists
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can manage own lists" ON public.user_book_lists
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 22. Créer les politiques RLS pour book_list_items
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

-- 23. Créer les politiques RLS pour reading_goals
CREATE POLICY "Users can view own reading goals" ON public.reading_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reading goals" ON public.reading_goals
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 24. Créer des fonctions utilitaires
CREATE OR REPLACE FUNCTION public.update_user_stats(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET
    books_completed = (
      SELECT COUNT(*) FROM public.reading_plans 
      WHERE reading_plans.user_id = users.id AND status = 'completed'
    ),
    total_pages_read = (
      SELECT COALESCE(SUM(pages_read), 0) FROM public.reading_sessions 
      WHERE reading_sessions.user_id = users.id
    ),
    total_reading_time = (
      SELECT COALESCE(SUM(minutes_spent), 0) FROM public.reading_sessions 
      WHERE reading_sessions.user_id = users.id
    )
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 25. Fonction pour calculer la note moyenne d'un livre
CREATE OR REPLACE FUNCTION public.update_book_rating(book_id integer)
RETURNS void AS $$
BEGIN
  UPDATE public.books SET
    rating = (
      SELECT COALESCE(AVG(rating::decimal), 0) 
      FROM public.book_reviews 
      WHERE book_reviews.book_id = books.id
    ),
    rating_count = (
      SELECT COUNT(*) 
      FROM public.book_reviews 
      WHERE book_reviews.book_id = books.id
    )
  WHERE id = book_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 26. Fonction pour ajouter des points Koach
CREATE OR REPLACE FUNCTION public.add_koach_points(user_id uuid, points integer)
RETURNS void AS $$
BEGIN
  UPDATE public.users 
  SET koach_points = koach_points + points
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 27. Fonction pour mettre à jour les objectifs de lecture
CREATE OR REPLACE FUNCTION public.update_reading_goals(user_id uuid)
RETURNS void AS $$
DECLARE
  current_year integer := EXTRACT(year FROM NOW());
BEGIN
  INSERT INTO public.reading_goals (user_id, year, current_books, current_pages, current_minutes)
  VALUES (
    user_id,
    current_year,
    (SELECT COUNT(*) FROM public.reading_plans WHERE reading_plans.user_id = update_reading_goals.user_id AND status = 'completed' AND EXTRACT(year FROM updated_at) = current_year),
    (SELECT COALESCE(SUM(pages_read), 0) FROM public.reading_sessions WHERE reading_sessions.user_id = update_reading_goals.user_id AND EXTRACT(year FROM created_at) = current_year),
    (SELECT COALESCE(SUM(minutes_spent), 0) FROM public.reading_sessions WHERE reading_sessions.user_id = update_reading_goals.user_id AND EXTRACT(year FROM created_at) = current_year)
  )
  ON CONFLICT (user_id, year) DO UPDATE SET
    current_books = EXCLUDED.current_books,
    current_pages = EXCLUDED.current_pages,
    current_minutes = EXCLUDED.current_minutes,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 28. Créer des triggers pour automatiser les mises à jour
CREATE OR REPLACE FUNCTION public.handle_reading_session_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les stats utilisateur
  PERFORM public.update_user_stats(NEW.user_id);
  
  -- Mettre à jour les objectifs de lecture
  PERFORM public.update_reading_goals(NEW.user_id);
  
  -- Ajouter des points Koach
  PERFORM public.add_koach_points(NEW.user_id, NEW.koach_earned);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_reading_session_insert ON public.reading_sessions;

CREATE TRIGGER on_reading_session_insert
  AFTER INSERT ON public.reading_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_reading_session_update();

-- 29. Trigger pour mettre à jour la note des livres après un avis
CREATE OR REPLACE FUNCTION public.handle_review_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_book_rating(NEW.book_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
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

-- 30. Ajouter des triggers updated_at pour les nouvelles tables
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

-- 31. Créer une vue pour les statistiques utilisateur
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
  u.id,
  u.username,
  u.koach_points,
  u.reading_streak,
  u.books_completed,
  u.total_pages_read,
  u.total_reading_time,
  COUNT(DISTINCT ub.book_id) as books_in_library,
  COUNT(DISTINCT f.friend_id) as friends_count,
  COUNT(DISTINCT cp.challenge_id) as challenges_joined,
  AVG(br.rating) as average_rating_given
FROM public.users u
LEFT JOIN public.user_books ub ON u.id = ub.user_id
LEFT JOIN public.friends f ON u.id = f.user_id AND f.status = 'accepted'
LEFT JOIN public.challenge_participants cp ON u.id = cp.user_id
LEFT JOIN public.book_reviews br ON u.id = br.user_id
GROUP BY u.id, u.username, u.koach_points, u.reading_streak, u.books_completed, u.total_pages_read, u.total_reading_time;

-- Activer RLS sur la vue
ALTER VIEW public.user_stats SET (security_barrier = true);

-- Politique pour la vue user_stats
CREATE POLICY "Users can view own stats and public stats" ON public.user_stats
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = user_stats.id 
      AND (privacy_settings->>'profile_public')::boolean = true
    )
  );

COMMIT;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration terminée avec succès ! Nouvelles fonctionnalités ajoutées :';
  RAISE NOTICE '- Système de catégories pour les livres';
  RAISE NOTICE '- Sessions de lecture détaillées';
  RAISE NOTICE '- Système d''achievements avancé';
  RAISE NOTICE '- Avis et notes sur les livres';
  RAISE NOTICE '- Listes personnalisées de livres';
  RAISE NOTICE '- Objectifs de lecture annuels';
  RAISE NOTICE '- Statistiques utilisateur enrichies';
  RAISE NOTICE '- Fonctions automatisées et triggers';
END $$;