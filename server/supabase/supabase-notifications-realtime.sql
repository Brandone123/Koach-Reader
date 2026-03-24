-- =============================================================================
-- Notifications : temps réel Supabase (postgres_changes côté client)
-- À exécuter une fois dans le SQL Editor du projet Supabase.
-- Sans cela, le canal Realtime ne reçoit aucun événement sur cette table.
-- =============================================================================

DO $body$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END
$body$;

-- Optionnel : événements UPDATE (ex. is_read) — utile si vous écoutez aussi UPDATE
-- ALTER TABLE public.notifications REPLICA IDENTITY FULL;
