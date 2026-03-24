-- ============================================================
-- Seed leaderboard / user_books / badges (Supabase SQL Editor)
-- Prérequis : public.users rempli (même id que auth.users),
--             au moins un livre dans public.books.
-- ============================================================

-- 1) Variation de stats pour chaque utilisateur (classement général)
UPDATE public.users
SET
  koach_points = GREATEST(10, (abs(hashtext(id::text)) % 4800) + (random() * 200)::int),
  books_completed = GREATEST(0, (abs(hashtext(coalesce(username, '') || id::text)) % 12)),
  updated_at = now();

-- 2) Badges de démo (3 lignes si la table est presque vide)
INSERT INTO public.badges (name, description, requirement_type, requirement_value)
SELECT 'Premiers pas', 'Commencer à lire', 'pages', 50
WHERE (SELECT COUNT(*) FROM public.badges) < 1;

INSERT INTO public.badges (name, description, requirement_type, requirement_value)
SELECT 'Marathon', 'Lire régulièrement', 'streak', 7
WHERE (SELECT COUNT(*) FROM public.badges) < 2;

INSERT INTO public.badges (name, description, requirement_type, requirement_value)
SELECT 'Bibliothèque', 'Plusieurs livres', 'books', 3
WHERE (SELECT COUNT(*) FROM public.badges) < 3;

-- 3) Associer chaque user à 1 ou 2 badges (sans doublon)
INSERT INTO public.user_badges (user_id, badge_id)
SELECT u.id, b.id
FROM public.users u
CROSS JOIN LATERAL (
  SELECT id FROM public.badges ORDER BY random() LIMIT 1 + (hashtext(u.id::text) % 2)
) b
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_badges ub
  WHERE ub.user_id = u.id AND ub.badge_id = b.id
);

-- 4) user_books : progression pour les 8 premiers users × 5 premiers livres
INSERT INTO public.user_books (user_id, book_id, current_page, is_completed, last_read_date, updated_at)
SELECT
  u.id,
  b.id,
  LEAST(
    GREATEST(1, (abs(hashtext(u.id::text || b.id::text)) % GREATEST(b.total_pages, 1)) + 1),
    GREATEST(b.total_pages, 1)
  ),
  (hashtext(u.id::text || b.id::text || 'x') % 4) = 0,
  now() - (interval '1 day' * (abs(hashtext(u.id::text)) % 25)),
  now()
FROM (SELECT id FROM public.users ORDER BY created_at NULLS LAST, id LIMIT 8) u
CROSS JOIN (
  SELECT id, GREATEST(COALESCE(total_pages, 1), 1) AS total_pages
  FROM public.books
  ORDER BY id
  LIMIT 5
) b
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_books ub
  WHERE ub.user_id = u.id AND ub.book_id = b.id
);

-- Vérifier :
-- SELECT username, koach_points, books_completed FROM public.users;
-- SELECT COUNT(*) AS user_books_rows FROM public.user_books;
