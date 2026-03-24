-- =============================================================================
-- 1) Compteur « viewers » : +1 seulement par couple (user authentifié, livre)
-- 2) Notifications automatiques demandes d’amis (acceptation / refus)
-- Exécuter après les migrations de base (tables users, books, friends, notifications)
-- =============================================================================

-- Table des vues uniques (clé user + livre)
CREATE TABLE IF NOT EXISTS public.book_unique_views (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id integer NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, book_id)
);

ALTER TABLE public.book_unique_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "buv_select_own" ON public.book_unique_views;
DROP POLICY IF EXISTS "buv_insert_own" ON public.book_unique_views;
CREATE POLICY "buv_select_own" ON public.book_unique_views
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "buv_insert_own" ON public.book_unique_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RPC : première visite compte +1 sur books.viewers ; suivantes ignorées
CREATE OR REPLACE FUNCTION public.register_book_view(p_book_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted int;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.book_unique_views (user_id, book_id)
  VALUES (auth.uid(), p_book_id)
  ON CONFLICT (user_id, book_id) DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;

  IF inserted > 0 THEN
    UPDATE public.books
    SET viewers = COALESCE(viewers, 0) + 1
    WHERE id = p_book_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.register_book_view(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_book_view(integer) TO authenticated;

-- ---------------------------------------------------------------------------
-- Amis : notifier le destinataire à la création d’une demande « pending »
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_friend_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  from_name text;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    SELECT username INTO from_name FROM public.users WHERE id = NEW.user_id;
    -- RLS sur notifications n’a pas de politique INSERT : sans ceci l’INSERT peut être bloqué
    PERFORM set_config('row_security', 'off', true);
    INSERT INTO public.notifications (user_id, type, title, message, action_url)
    VALUES (
      NEW.friend_id,
      'friend',
      'Nouvelle demande d''ami',
      COALESCE(from_name, 'Un lecteur') || ' souhaite vous ajouter en ami.',
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_friend_request ON public.friends;
CREATE TRIGGER trg_notify_friend_request
  AFTER INSERT ON public.friends
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_on_friend_request();

-- Notifier l’émetteur quand la demande est acceptée ou refusée
CREATE OR REPLACE FUNCTION public.notify_on_friend_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_name text;
BEGIN
  IF TG_OP <> 'UPDATE' OR OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;
  IF OLD.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT username INTO actor_name FROM public.users WHERE id = NEW.friend_id;

  PERFORM set_config('row_security', 'off', true);

  IF NEW.status = 'accepted' THEN
    INSERT INTO public.notifications (user_id, type, title, message, action_url)
    VALUES (
      NEW.user_id,
      'friend',
      'Demande acceptée',
      COALESCE(actor_name, 'Votre contact') || ' a accepté votre demande d''ami.',
      NULL
    );
  ELSIF NEW.status = 'declined' THEN
    INSERT INTO public.notifications (user_id, type, title, message, action_url)
    VALUES (
      NEW.user_id,
      'friend',
      'Demande refusée',
      COALESCE(actor_name, 'Un lecteur') || ' a décliné votre demande d''ami.',
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_friend_status ON public.friends;
CREATE TRIGGER trg_notify_friend_status
  AFTER UPDATE ON public.friends
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_on_friend_status_change();

-- ---------------------------------------------------------------------------
-- RLS amis : seul l'émetteur peut INSERT (user_id = auth.uid()) ; les deux
-- parties peuvent SELECT / UPDATE / DELETE sur leurs lignes.
-- Remplace les politiques trop larges du script init si elles existent.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own friendships" ON public.friends;
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friends;
DROP POLICY IF EXISTS "friends_select_own" ON public.friends;
DROP POLICY IF EXISTS "friends_insert_request" ON public.friends;
DROP POLICY IF EXISTS "friends_update_parties" ON public.friends;
DROP POLICY IF EXISTS "friends_delete_own" ON public.friends;

CREATE POLICY "friends_select_own" ON public.friends
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "friends_insert_request" ON public.friends
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND user_id IS DISTINCT FROM friend_id
  );

CREATE POLICY "friends_update_parties" ON public.friends
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "friends_delete_own" ON public.friends
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);
