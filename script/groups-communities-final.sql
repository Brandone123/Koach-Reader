-- Créer les types ENUM nécessaires
DO $$ BEGIN
  CREATE TYPE member_role AS ENUM ('creator', 'admin', 'moderator', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE reading_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. GROUPES DE LECTURE INDÉPENDANTS (standalone)
CREATE TABLE IF NOT EXISTS public.reading_groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES public.users(id),
  is_private BOOLEAN DEFAULT false,
  cover_image_url TEXT,
  current_book_id INTEGER REFERENCES public.books(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. COMMUNAUTÉS (indépendantes)
CREATE TABLE IF NOT EXISTS public.communities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES public.users(id),
  is_private BOOLEAN DEFAULT false,
  cover_image_url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. GROUPES DE LECTURE DANS LES COMMUNAUTÉS (sous-groupes)
CREATE TABLE IF NOT EXISTS public.community_reading_groups (
  id SERIAL PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES public.users(id),
  is_private BOOLEAN DEFAULT false,
  cover_image_url TEXT,
  current_book_id INTEGER REFERENCES public.books(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. MEMBRES DES GROUPES INDÉPENDANTS
CREATE TABLE IF NOT EXISTS public.reading_group_members (
  id SERIAL PRIMARY KEY,
  reading_group_id INTEGER NOT NULL REFERENCES public.reading_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role member_role DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reading_group_id, user_id)
);

-- 5. MEMBRES DES COMMUNAUTÉS
CREATE TABLE IF NOT EXISTS public.community_members (
  id SERIAL PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role member_role DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- 6. MEMBRES DES GROUPES DE COMMUNAUTÉ
CREATE TABLE IF NOT EXISTS public.community_reading_group_members (
  id SERIAL PRIMARY KEY,
  community_reading_group_id INTEGER NOT NULL REFERENCES public.community_reading_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role member_role DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_reading_group_id, user_id)
);

-- 7. PLANS DE LECTURE POUR GROUPES INDÉPENDANTS
CREATE TABLE IF NOT EXISTS public.reading_group_plans (
  id SERIAL PRIMARY KEY,
  reading_group_id INTEGER NOT NULL REFERENCES public.reading_groups(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  pages_per_session INTEGER NOT NULL,
  frequency reading_frequency DEFAULT 'daily',
  created_by UUID NOT NULL REFERENCES public.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. PLANS DE LECTURE POUR GROUPES DE COMMUNAUTÉ
CREATE TABLE IF NOT EXISTS public.community_reading_group_plans (
  id SERIAL PRIMARY KEY,
  community_reading_group_id INTEGER NOT NULL REFERENCES public.community_reading_groups(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  pages_per_session INTEGER NOT NULL,
  frequency reading_frequency DEFAULT 'daily',
  created_by UUID NOT NULL REFERENCES public.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. PROGRESSION DANS LES GROUPES INDÉPENDANTS
CREATE TABLE IF NOT EXISTS public.reading_group_progress (
  id SERIAL PRIMARY KEY,
  reading_group_plan_id INTEGER NOT NULL REFERENCES public.reading_group_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_page INTEGER DEFAULT 0,
  last_read_date TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reading_group_plan_id, user_id)
);

-- 10. PROGRESSION DANS LES GROUPES DE COMMUNAUTÉ
CREATE TABLE IF NOT EXISTS public.community_reading_group_progress (
  id SERIAL PRIMARY KEY,
  community_reading_group_plan_id INTEGER NOT NULL REFERENCES public.community_reading_group_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_page INTEGER DEFAULT 0,
  last_read_date TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_reading_group_plan_id, user_id)
);

-- 11. MESSAGES GROUPES INDÉPENDANTS
CREATE TABLE IF NOT EXISTS public.reading_group_messages (
  id SERIAL PRIMARY KEY,
  reading_group_id INTEGER NOT NULL REFERENCES public.reading_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reply_to INTEGER REFERENCES public.reading_group_messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. MESSAGES COMMUNAUTÉS
CREATE TABLE IF NOT EXISTS public.community_messages (
  id SERIAL PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reply_to INTEGER REFERENCES public.community_messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. MESSAGES GROUPES DE COMMUNAUTÉ
CREATE TABLE IF NOT EXISTS public.community_reading_group_messages (
  id SERIAL PRIMARY KEY,
  community_reading_group_id INTEGER NOT NULL REFERENCES public.community_reading_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reply_to INTEGER REFERENCES public.community_reading_group_messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ACTIVER RLS SUR TOUTES LES TABLES
ALTER TABLE public.reading_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reading_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reading_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_group_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reading_group_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_group_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reading_group_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reading_group_messages ENABLE ROW LEVEL SECURITY;

-- POLITIQUES RLS POUR GROUPES DE LECTURE INDÉPENDANTS
CREATE POLICY "Anyone can view public reading groups" ON public.reading_groups
  FOR SELECT USING (is_private = false OR auth.uid() = creator_id OR 
    EXISTS (SELECT 1 FROM public.reading_group_members WHERE reading_group_id = id AND user_id = auth.uid()));

CREATE POLICY "Authenticated users can create reading groups" ON public.reading_groups
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators and admins can update reading groups" ON public.reading_groups
  FOR UPDATE USING (auth.uid() = creator_id OR 
    EXISTS (SELECT 1 FROM public.reading_group_members WHERE reading_group_id = id AND user_id = auth.uid() AND role IN ('admin', 'moderator')));

CREATE POLICY "Creators can delete reading groups" ON public.reading_groups
  FOR DELETE USING (auth.uid() = creator_id);

-- POLITIQUES RLS POUR COMMUNAUTÉS
CREATE POLICY "Anyone can view public communities" ON public.communities
  FOR SELECT USING (is_private = false OR auth.uid() = creator_id OR 
    EXISTS (SELECT 1 FROM public.community_members WHERE community_id = id AND user_id = auth.uid()));

CREATE POLICY "Authenticated users can create communities" ON public.communities
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators and admins can update communities" ON public.communities
  FOR UPDATE USING (auth.uid() = creator_id OR 
    EXISTS (SELECT 1 FROM public.community_members WHERE community_id = id AND user_id = auth.uid() AND role IN ('admin', 'moderator')));

CREATE POLICY "Creators can delete communities" ON public.communities
  FOR DELETE USING (auth.uid() = creator_id);

-- POLITIQUES RLS POUR MEMBRES
CREATE POLICY "Members can view group membership" ON public.reading_group_members
  FOR SELECT USING (user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.reading_group_members WHERE reading_group_id = reading_group_members.reading_group_id AND user_id = auth.uid()));

CREATE POLICY "Users can join groups" ON public.reading_group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups or admins can remove" ON public.reading_group_members
  FOR DELETE USING (user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.reading_group_members WHERE reading_group_id = reading_group_members.reading_group_id AND user_id = auth.uid() AND role IN ('creator', 'admin')));

-- POLITIQUES SIMILAIRES POUR LES AUTRES TABLES...
-- (Messages, plans, progression, etc.)

-- TRIGGERS POUR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reading_groups_updated_at
    BEFORE UPDATE ON public.reading_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communities_updated_at
    BEFORE UPDATE ON public.communities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- INDEX POUR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_reading_group_members_user ON public.reading_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_group_members_group ON public.reading_group_members(reading_group_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community ON public.community_members(community_id);
