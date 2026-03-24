-- ============================================================
-- Cohérence lecture : user_books, reading_sessions, users
-- Exécuter dans Supabase SQL Editor après un seed leaderboard
-- ============================================================

-- 1) Ne jamais dépasser total_pages (corrige 420/397)
UPDATE public.user_books ub
SET
  current_page = LEAST(ub.current_page, GREATEST(b.total_pages, 1)),
  is_completed = CASE
    WHEN ub.current_page >= b.total_pages THEN true
    ELSE ub.is_completed
  END,
  updated_at = now()
FROM public.books b
WHERE ub.book_id = b.id
  AND b.total_pages IS NOT NULL
  AND b.total_pages > 0;

-- 2) Recaler is_completed si current_page = total_pages
UPDATE public.user_books ub
SET is_completed = true, updated_at = now()
FROM public.books b
WHERE ub.book_id = b.id
  AND ub.current_page >= b.total_pages
  AND b.total_pages > 0;

-- 3) Supprimer les sessions synthétiques précédentes (optionnel, si tu relances le script)
-- DELETE FROM public.reading_sessions WHERE notes = 'seed_coherence';

-- 4) Une session agrégée par (user_id, book_id) si aucune session n’existe encore
INSERT INTO public.reading_sessions (
  user_id,
  book_id,
  reading_plan_id,
  pages_read,
  minutes_spent,
  koach_earned,
  session_date
)
SELECT
  ub.user_id,
  ub.book_id,
  NULL,
  LEAST(ub.current_page, GREATEST(b.total_pages, 1)),
  GREATEST(5, LEAST(ub.current_page, GREATEST(b.total_pages, 1)) * 2),
  GREATEST(1, LEAST(ub.current_page, GREATEST(b.total_pages, 1))),
  COALESCE(ub.last_read_date, ub.updated_at, now())
FROM public.user_books ub
JOIN public.books b ON b.id = ub.book_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.reading_sessions rs
  WHERE rs.user_id = ub.user_id AND rs.book_id = ub.book_id
);

-- 5) Recalcul agrégé users (pages / temps / koach depuis sessions)
UPDATE public.users u
SET
  total_pages_read = COALESCE(s.pages_sum, 0),
  total_reading_time = COALESCE(s.mins_sum, 0),
  koach_points = GREATEST(u.koach_points, COALESCE(s.koach_sum, 0)),
  updated_at = now()
FROM (
  SELECT
    user_id,
    SUM(pages_read)::int AS pages_sum,
    SUM(COALESCE(minutes_spent, 0))::int AS mins_sum,
    SUM(koach_earned)::int AS koach_sum
  FROM public.reading_sessions
  GROUP BY user_id
) s
WHERE u.id = s.user_id;
