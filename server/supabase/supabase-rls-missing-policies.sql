-- =============================================================================
-- RLS: tables avec RLS activé mais sans politiques (linter INFO 0008)
-- Exécuter dans Supabase → SQL Editor
-- Idempotent: DROP POLICY IF EXISTS puis CREATE
-- =============================================================================

-- ---------------------------------------------------------------------------
-- badges — catalogue en lecture ; écriture réservée aux admins
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "badges_select_authenticated" ON public.badges;
DROP POLICY IF EXISTS "badges_admin_write" ON public.badges;
CREATE POLICY "badges_select_authenticated" ON public.badges
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "badges_admin_write" ON public.badges
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false))
  );

-- ---------------------------------------------------------------------------
-- comments (book_id uuid dans certains schémas)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "comments_select_auth" ON public.comments;
DROP POLICY IF EXISTS "comments_insert_own" ON public.comments;
DROP POLICY IF EXISTS "comments_update_own" ON public.comments;
DROP POLICY IF EXISTS "comments_delete_own" ON public.comments;
CREATE POLICY "comments_select_auth" ON public.comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert_own" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update_own" ON public.comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own" ON public.comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- community_members
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "cm_select" ON public.community_members;
DROP POLICY IF EXISTS "cm_insert_self" ON public.community_members;
DROP POLICY IF EXISTS "cm_delete_self_or_admin" ON public.community_members;
CREATE POLICY "cm_select" ON public.community_members
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.community_members x WHERE x.community_id = community_members.community_id AND x.user_id = auth.uid())
  );
CREATE POLICY "cm_insert_self" ON public.community_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "cm_delete_self_or_admin" ON public.community_members
  FOR DELETE TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.community_members x
      WHERE x.community_id = community_members.community_id
        AND x.user_id = auth.uid()
        AND x.role IN ('creator', 'admin', 'moderator')
    )
  );

-- ---------------------------------------------------------------------------
-- community_messages — visible si membre de la communauté
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "cmsg_select" ON public.community_messages;
DROP POLICY IF EXISTS "cmsg_insert" ON public.community_messages;
DROP POLICY IF EXISTS "cmsg_update_own" ON public.community_messages;
DROP POLICY IF EXISTS "cmsg_delete_own" ON public.community_messages;
CREATE POLICY "cmsg_select" ON public.community_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.community_members m
      WHERE m.community_id = community_messages.community_id AND m.user_id = auth.uid()
    )
  );
CREATE POLICY "cmsg_insert" ON public.community_messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.community_members m
      WHERE m.community_id = community_messages.community_id AND m.user_id = auth.uid()
    )
  );
CREATE POLICY "cmsg_update_own" ON public.community_messages
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cmsg_delete_own" ON public.community_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- community_reading_groups
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "crg_select" ON public.community_reading_groups;
DROP POLICY IF EXISTS "crg_insert" ON public.community_reading_groups;
DROP POLICY IF EXISTS "crg_update" ON public.community_reading_groups;
DROP POLICY IF EXISTS "crg_delete_creator" ON public.community_reading_groups;
CREATE POLICY "crg_select" ON public.community_reading_groups
  FOR SELECT TO authenticated USING (
    is_private = false
    OR creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.community_reading_group_members m
      WHERE m.community_reading_group_id = community_reading_groups.id AND m.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_reading_groups.community_id AND cm.user_id = auth.uid()
    )
  );
CREATE POLICY "crg_insert" ON public.community_reading_groups
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = creator_id
    AND EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_reading_groups.community_id AND cm.user_id = auth.uid()
    )
  );
CREATE POLICY "crg_update" ON public.community_reading_groups
  FOR UPDATE TO authenticated USING (
    creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.community_reading_group_members m
      WHERE m.community_reading_group_id = id AND m.user_id = auth.uid() AND m.role IN ('creator', 'admin', 'moderator')
    )
  );
CREATE POLICY "crg_delete_creator" ON public.community_reading_groups
  FOR DELETE TO authenticated USING (creator_id = auth.uid());

-- ---------------------------------------------------------------------------
-- community_reading_group_members
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "crgm_select" ON public.community_reading_group_members;
DROP POLICY IF EXISTS "crgm_insert" ON public.community_reading_group_members;
DROP POLICY IF EXISTS "crgm_delete" ON public.community_reading_group_members;
CREATE POLICY "crgm_select" ON public.community_reading_group_members
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.community_reading_group_members x
      WHERE x.community_reading_group_id = community_reading_group_members.community_reading_group_id
        AND x.user_id = auth.uid()
    )
  );
CREATE POLICY "crgm_insert" ON public.community_reading_group_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "crgm_delete" ON public.community_reading_group_members
  FOR DELETE TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.community_reading_group_members x
      WHERE x.community_reading_group_id = community_reading_group_members.community_reading_group_id
        AND x.user_id = auth.uid()
        AND x.role IN ('creator', 'admin', 'moderator')
    )
  );

-- ---------------------------------------------------------------------------
-- community_reading_group_plans
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "crgp_select" ON public.community_reading_group_plans;
DROP POLICY IF EXISTS "crgp_insert" ON public.community_reading_group_plans;
DROP POLICY IF EXISTS "crgp_update" ON public.community_reading_group_plans;
CREATE POLICY "crgp_select" ON public.community_reading_group_plans
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.community_reading_group_members m
      WHERE m.community_reading_group_id = community_reading_group_plans.community_reading_group_id
        AND m.user_id = auth.uid()
    )
  );
CREATE POLICY "crgp_insert" ON public.community_reading_group_plans
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.community_reading_group_members m
      WHERE m.community_reading_group_id = community_reading_group_plans.community_reading_group_id
        AND m.user_id = auth.uid()
    )
  );
CREATE POLICY "crgp_update" ON public.community_reading_group_plans
  FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- community_reading_group_progress
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "crgpr_select" ON public.community_reading_group_progress;
DROP POLICY IF EXISTS "crgpr_write" ON public.community_reading_group_progress;
CREATE POLICY "crgpr_select" ON public.community_reading_group_progress
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.community_reading_group_plans p
      JOIN public.community_reading_group_members m ON m.community_reading_group_id = p.community_reading_group_id
      WHERE p.id = community_reading_group_progress.community_reading_group_plan_id AND m.user_id = auth.uid()
    )
  );
CREATE POLICY "crgpr_write" ON public.community_reading_group_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- community_reading_group_messages
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "crgmsg_select" ON public.community_reading_group_messages;
DROP POLICY IF EXISTS "crgmsg_insert" ON public.community_reading_group_messages;
DROP POLICY IF EXISTS "crgmsg_update_own" ON public.community_reading_group_messages;
DROP POLICY IF EXISTS "crgmsg_delete_own" ON public.community_reading_group_messages;
CREATE POLICY "crgmsg_select" ON public.community_reading_group_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.community_reading_group_members m
      WHERE m.community_reading_group_id = community_reading_group_messages.community_reading_group_id
        AND m.user_id = auth.uid()
    )
  );
CREATE POLICY "crgmsg_insert" ON public.community_reading_group_messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.community_reading_group_members m
      WHERE m.community_reading_group_id = community_reading_group_messages.community_reading_group_id
        AND m.user_id = auth.uid()
    )
  );
CREATE POLICY "crgmsg_update_own" ON public.community_reading_group_messages
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "crgmsg_delete_own" ON public.community_reading_group_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- device_tokens — uniquement le propriétaire
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "dt_select" ON public.device_tokens;
DROP POLICY IF EXISTS "dt_insert" ON public.device_tokens;
DROP POLICY IF EXISTS "dt_update" ON public.device_tokens;
DROP POLICY IF EXISTS "dt_delete" ON public.device_tokens;
CREATE POLICY "dt_select" ON public.device_tokens
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "dt_insert" ON public.device_tokens
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dt_update" ON public.device_tokens
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dt_delete" ON public.device_tokens
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- reading_group_messages / plans / progress (groupes indépendants)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "rgmsg_select" ON public.reading_group_messages;
DROP POLICY IF EXISTS "rgmsg_insert" ON public.reading_group_messages;
DROP POLICY IF EXISTS "rgmsg_update_own" ON public.reading_group_messages;
DROP POLICY IF EXISTS "rgmsg_delete_own" ON public.reading_group_messages;
CREATE POLICY "rgmsg_select" ON public.reading_group_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.reading_group_members m
      WHERE m.reading_group_id = reading_group_messages.reading_group_id AND m.user_id = auth.uid()
    )
  );
CREATE POLICY "rgmsg_insert" ON public.reading_group_messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.reading_group_members m
      WHERE m.reading_group_id = reading_group_messages.reading_group_id AND m.user_id = auth.uid()
    )
  );
CREATE POLICY "rgmsg_update_own" ON public.reading_group_messages
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rgmsg_delete_own" ON public.reading_group_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "rgp_select" ON public.reading_group_plans;
DROP POLICY IF EXISTS "rgp_insert" ON public.reading_group_plans;
DROP POLICY IF EXISTS "rgp_update" ON public.reading_group_plans;
CREATE POLICY "rgp_select" ON public.reading_group_plans
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.reading_group_members m
      WHERE m.reading_group_id = reading_group_plans.reading_group_id AND m.user_id = auth.uid()
    )
  );
CREATE POLICY "rgp_insert" ON public.reading_group_plans
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.reading_group_members m
      WHERE m.reading_group_id = reading_group_plans.reading_group_id AND m.user_id = auth.uid()
    )
  );
CREATE POLICY "rgp_update" ON public.reading_group_plans
  FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "rgpr_select" ON public.reading_group_progress;
DROP POLICY IF EXISTS "rgpr_write" ON public.reading_group_progress;
CREATE POLICY "rgpr_select" ON public.reading_group_progress
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.reading_group_plans p
      JOIN public.reading_group_members m ON m.reading_group_id = p.reading_group_id
      WHERE p.id = reading_group_progress.reading_group_plan_id AND m.user_id = auth.uid()
    )
  );
CREATE POLICY "rgpr_write" ON public.reading_group_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- Si is_admin manque sur users (déjà dans supabase-security-hardening.sql)
-- =============================================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
