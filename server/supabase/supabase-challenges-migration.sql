-- ============================================================
-- Challenges : colonnes manquantes + enum minutes + RLS lecture
-- Exécuter dans Supabase SQL Editor (une fois)
-- ============================================================

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS book_id integer REFERENCES public.books(id);

-- Enum : minutes (ignorer l’erreur si la valeur existe déjà)
ALTER TYPE challenge_target_type ADD VALUE IF NOT EXISTS 'minutes';

-- Policies (adapter si tu as déjà des policies nommées différemment)
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "challenges_select_authenticated" ON public.challenges;
CREATE POLICY "challenges_select_authenticated" ON public.challenges
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "challenges_insert_authenticated" ON public.challenges;
CREATE POLICY "challenges_insert_authenticated" ON public.challenges
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "challenges_update_creator" ON public.challenges;
CREATE POLICY "challenges_update_creator" ON public.challenges
  FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "challenge_participants_select" ON public.challenge_participants;
CREATE POLICY "challenge_participants_select" ON public.challenge_participants
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "challenge_participants_insert_self" ON public.challenge_participants;
CREATE POLICY "challenge_participants_insert_self" ON public.challenge_participants
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "challenge_participants_update_self" ON public.challenge_participants;
CREATE POLICY "challenge_participants_update_self" ON public.challenge_participants
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
