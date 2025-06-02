-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

-- Drop functions with CASCADE to remove dependent objects
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_user_delete() CASCADE;

-- Drop view
DROP VIEW IF EXISTS public.user_profiles;

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.friends CASCADE;
DROP TABLE IF EXISTS public.user_books CASCADE;
DROP TABLE IF EXISTS public.reading_plans CASCADE;
DROP TABLE IF EXISTS public.challenge_participants CASCADE;
DROP TABLE IF EXISTS public.challenges CASCADE;
DROP TABLE IF EXISTS public.books CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Clean auth.users table (but keep the table structure)
DELETE FROM auth.users;

-- Drop types
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS challenge_target_type CASCADE;
DROP TYPE IF EXISTS challenge_status CASCADE;
DROP TYPE IF EXISTS friend_status CASCADE;
DROP TYPE IF EXISTS reading_status CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE reading_status AS ENUM ('active', 'completed', 'abandoned');
CREATE TYPE friend_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE challenge_status AS ENUM ('active', 'completed', 'abandoned');
CREATE TYPE challenge_target_type AS ENUM ('koach', 'books', 'pages');
CREATE TYPE notification_type AS ENUM ('achievement', 'challenge', 'friend', 'reading', 'system', 'reminder');

-- Create all tables first
-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  is_premium BOOLEAN DEFAULT false NOT NULL,
  koach_points INTEGER DEFAULT 0 NOT NULL,
  reading_streak INTEGER DEFAULT 0 NOT NULL,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  avatar_url TEXT,
  has_completed_onboarding BOOLEAN DEFAULT false NOT NULL,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Books table
CREATE TABLE public.books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  isbn TEXT UNIQUE,
  publication_date DATE,
  language TEXT,
  categories TEXT[],
  cover_url TEXT,
  total_pages INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Reading plans table
CREATE TABLE public.reading_plans (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  current_page INTEGER DEFAULT 0 NOT NULL,
  daily_goal INTEGER NOT NULL,
  notes TEXT,
  last_read_date TIMESTAMP WITH TIME ZONE,
  status reading_status DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, book_id)
);

-- User_Books table
CREATE TABLE public.user_books (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  current_page INTEGER DEFAULT 0 NOT NULL,
  is_favorite BOOLEAN DEFAULT false NOT NULL,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  reading_time INTEGER DEFAULT 0,
  last_read_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, book_id)
);

-- Friends table
CREATE TABLE public.friends (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status friend_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, friend_id)
);

-- Notifications table
CREATE TABLE public.notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Challenges table
CREATE TABLE public.challenges (
  id SERIAL PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_type challenge_target_type NOT NULL,
  target_value INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status challenge_status DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Challenge participants table
CREATE TABLE public.challenge_participants (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0 NOT NULL,
  status challenge_status DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(challenge_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- Create the user profiles view
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  id,
  username,
  avatar_url,
  koach_points,
  reading_streak,
  is_premium
FROM public.users;

-- Security barrier ensures better security for the view
ALTER VIEW public.user_profiles SET (security_barrier = true);

-- No need for RLS policy on view, just make it accessible to all
GRANT SELECT ON public.user_profiles TO PUBLIC;

-- Create policies for all tables
-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for new users" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Books policies
CREATE POLICY "Books are viewable by everyone" ON public.books
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert books" ON public.books
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Reading plans policies
CREATE POLICY "Users can view own reading plans" ON public.reading_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading plans" ON public.reading_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading plans" ON public.reading_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading plans" ON public.reading_plans
  FOR DELETE USING (auth.uid() = user_id);

-- User_Books policies
CREATE POLICY "Users can view own book relationships" ON public.user_books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own book relationships" ON public.user_books
  FOR ALL USING (auth.uid() = user_id);

-- Friends policies
CREATE POLICY "Users can view own friendships" ON public.friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage own friendships" ON public.friends
  FOR ALL USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Challenge policies
CREATE POLICY "Users can view all challenges" ON public.challenges
  FOR SELECT USING (true);

CREATE POLICY "Users can create challenges" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their challenges" ON public.challenges
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their challenges" ON public.challenges
  FOR DELETE USING (auth.uid() = creator_id);

-- Challenge participants policies
CREATE POLICY "Users can view challenge participants" ON public.challenge_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join challenges" ON public.challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their challenge progress" ON public.challenge_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave challenges" ON public.challenge_participants
  FOR DELETE USING (auth.uid() = user_id);

-- Create functions for triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  username_from_meta text;
  existing_user_id uuid;
BEGIN
  -- Check if user already exists in public.users
  SELECT id INTO existing_user_id FROM public.users WHERE id = new.id;
  
  IF existing_user_id IS NOT NULL THEN
    -- User already exists, just return
    RETURN new;
  END IF;

  -- Get username from metadata with fallback
  username_from_meta := COALESCE(
    (new.raw_user_meta_data->>'username'),
    (new.raw_user_meta_data->>'preferred_username'),
    split_part(new.email, '@', 1)
  );

  -- Try to insert with the original username
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      username,
      avatar_url,
      is_premium,
      koach_points,
      reading_streak,
      preferences,
      has_completed_onboarding,
      is_admin
    ) VALUES (
      new.id,
      new.email,
      username_from_meta,
      new.raw_user_meta_data->>'avatar_url',
      false,
      0,
      0,
      '{}',
      false,
      false
    );
  EXCEPTION 
    WHEN unique_violation THEN
      -- If username is taken, try with a random suffix
      INSERT INTO public.users (
        id,
        email,
        username,
        avatar_url,
        is_premium,
        koach_points,
        reading_streak,
        preferences,
        has_completed_onboarding,
        is_admin
      ) VALUES (
        new.id,
        new.email,
        username_from_meta || '_' || floor(random() * 1000)::text,
        new.raw_user_meta_data->>'avatar_url',
        false,
        0,
        0,
        '{}',
        false,
        false
      );
    WHEN OTHERS THEN
      -- Log the error but don't fail
      RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
      RETURN null;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle user deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.users WHERE id = old.id;
  RETURN old;
END;
$$ LANGUAGE plpgsql;

-- Create all triggers last
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_plans_updated_at
    BEFORE UPDATE ON reading_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_books_updated_at
    BEFORE UPDATE ON user_books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friends_updated_at
    BEFORE UPDATE ON friends
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at
    BEFORE UPDATE ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenge_participants_updated_at
    BEFORE UPDATE ON challenge_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create auth triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_user_delete(); 