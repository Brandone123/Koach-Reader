-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.annotations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  book_id integer NOT NULL,
  page integer NOT NULL,
  text text,
  type text NOT NULL CHECK (type = ANY (ARRAY['highlight'::text, 'note'::text, 'bookmark'::text])),
  color text,
  position jsonb,
  content text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT annotations_pkey PRIMARY KEY (id),
  CONSTRAINT annotations_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id),
  CONSTRAINT annotations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.authors (
  id integer NOT NULL DEFAULT nextval('authors_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  description text,
  country text,
  language text,
  books_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  profile_image_url text,
  website text,
  CONSTRAINT authors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.badges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text NOT NULL,
  icon_url text,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT badges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.book_categories (
  book_id integer NOT NULL,
  category_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT book_categories_pkey PRIMARY KEY (book_id, category_id),
  CONSTRAINT book_categories_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id),
  CONSTRAINT book_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.book_list_items (
  id integer NOT NULL DEFAULT nextval('book_list_items_id_seq'::regclass),
  list_id integer NOT NULL,
  book_id integer NOT NULL,
  added_at timestamp with time zone DEFAULT now(),
  notes text,
  CONSTRAINT book_list_items_pkey PRIMARY KEY (id),
  CONSTRAINT book_list_items_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.user_book_lists(id),
  CONSTRAINT book_list_items_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id)
);
CREATE TABLE public.book_reviews (
  id integer NOT NULL DEFAULT nextval('book_reviews_id_seq'::regclass),
  user_id uuid NOT NULL,
  book_id integer NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  content text NOT NULL,
  is_spoiler boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT book_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT book_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT book_reviews_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id)
);
CREATE TABLE public.book_translation (
  id integer NOT NULL DEFAULT nextval('book_translation_id_seq'::regclass),
  book_id integer,
  lang text NOT NULL,
  title text NOT NULL,
  description text,
  author text,
  CONSTRAINT book_translation_pkey PRIMARY KEY (id),
  CONSTRAINT book_translation_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id)
);
CREATE TABLE public.books (
  id integer NOT NULL DEFAULT nextval('books_id_seq'::regclass),
  title text NOT NULL,
  description text,
  isbn text UNIQUE,
  publication_date date,
  language text,
  cover_url text,
  total_pages integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  rating real CHECK (rating >= 1::double precision AND rating <= 5::double precision),
  cover_image text,
  viewers integer DEFAULT 0,
  pdf_url text,
  is_free boolean NOT NULL DEFAULT false CHECK (is_free = ANY (ARRAY[true, false])),
  reading_time text,
  author_id bigint,
  publication_year integer,
  publisher text,
  rating_count integer DEFAULT 0,
  downloads integer DEFAULT 0,
  file_size bigint,
  is_featured boolean DEFAULT false,
  tags ARRAY,
  CONSTRAINT books_pkey PRIMARY KEY (id),
  CONSTRAINT fk_author FOREIGN KEY (author_id) REFERENCES public.authors(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  icon_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  color text DEFAULT '#3B82F6'::text,
  icon text,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.category_translation (
  id integer NOT NULL DEFAULT nextval('category_translation_id_seq'::regclass),
  category_id uuid,
  lang text NOT NULL,
  label text NOT NULL,
  description text,
  CONSTRAINT category_translation_pkey PRIMARY KEY (id),
  CONSTRAINT category_translation_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.challenge_participants (
  id integer NOT NULL DEFAULT nextval('challenge_participants_id_seq'::regclass),
  challenge_id integer NOT NULL,
  user_id uuid NOT NULL,
  current_progress integer NOT NULL DEFAULT 0,
  status USER-DEFINED NOT NULL DEFAULT 'active'::challenge_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT challenge_participants_pkey PRIMARY KEY (id),
  CONSTRAINT challenge_participants_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id),
  CONSTRAINT challenge_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.challenges (
  id integer NOT NULL DEFAULT nextval('challenges_id_seq'::regclass),
  creator_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  target_type USER-DEFINED NOT NULL,
  target_value integer NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'active'::challenge_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT challenges_pkey PRIMARY KEY (id),
  CONSTRAINT challenges_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  book_id uuid NOT NULL,
  content text NOT NULL,
  rating integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.communities (
  id integer NOT NULL DEFAULT nextval('communities_id_seq'::regclass),
  name text NOT NULL,
  description text,
  creator_id uuid NOT NULL,
  is_private boolean DEFAULT false,
  cover_image_url text,
  category text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT communities_pkey PRIMARY KEY (id),
  CONSTRAINT communities_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id)
);
CREATE TABLE public.community_members (
  id integer NOT NULL DEFAULT nextval('community_members_id_seq'::regclass),
  community_id integer NOT NULL,
  user_id uuid NOT NULL,
  role USER-DEFINED DEFAULT 'member'::member_role,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_members_pkey PRIMARY KEY (id),
  CONSTRAINT community_members_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id),
  CONSTRAINT community_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.community_messages (
  id integer NOT NULL DEFAULT nextval('community_messages_id_seq'::regclass),
  community_id integer NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  reply_to integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_messages_pkey PRIMARY KEY (id),
  CONSTRAINT community_messages_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id),
  CONSTRAINT community_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT community_messages_reply_to_fkey FOREIGN KEY (reply_to) REFERENCES public.community_messages(id)
);
CREATE TABLE public.community_reading_group_members (
  id integer NOT NULL DEFAULT nextval('community_reading_group_members_id_seq'::regclass),
  community_reading_group_id integer NOT NULL,
  user_id uuid NOT NULL,
  role USER-DEFINED DEFAULT 'member'::member_role,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_reading_group_members_pkey PRIMARY KEY (id),
  CONSTRAINT community_reading_group_members_community_reading_group_id_fkey FOREIGN KEY (community_reading_group_id) REFERENCES public.community_reading_groups(id),
  CONSTRAINT community_reading_group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.community_reading_group_messages (
  id integer NOT NULL DEFAULT nextval('community_reading_group_messages_id_seq'::regclass),
  community_reading_group_id integer NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  reply_to integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_reading_group_messages_pkey PRIMARY KEY (id),
  CONSTRAINT community_reading_group_message_community_reading_group_id_fkey FOREIGN KEY (community_reading_group_id) REFERENCES public.community_reading_groups(id),
  CONSTRAINT community_reading_group_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT community_reading_group_messages_reply_to_fkey FOREIGN KEY (reply_to) REFERENCES public.community_reading_group_messages(id)
);
CREATE TABLE public.community_reading_group_plans (
  id integer NOT NULL DEFAULT nextval('community_reading_group_plans_id_seq'::regclass),
  community_reading_group_id integer NOT NULL,
  book_id integer NOT NULL,
  title text NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  pages_per_session integer NOT NULL,
  frequency USER-DEFINED DEFAULT 'daily'::reading_frequency,
  created_by uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_reading_group_plans_pkey PRIMARY KEY (id),
  CONSTRAINT community_reading_group_plans_community_reading_group_id_fkey FOREIGN KEY (community_reading_group_id) REFERENCES public.community_reading_groups(id),
  CONSTRAINT community_reading_group_plans_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id),
  CONSTRAINT community_reading_group_plans_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.community_reading_group_progress (
  id integer NOT NULL DEFAULT nextval('community_reading_group_progress_id_seq'::regclass),
  community_reading_group_plan_id integer NOT NULL,
  user_id uuid NOT NULL,
  current_page integer DEFAULT 0,
  last_read_date timestamp with time zone,
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_reading_group_progress_pkey PRIMARY KEY (id),
  CONSTRAINT community_reading_group_progr_community_reading_group_plan_fkey FOREIGN KEY (community_reading_group_plan_id) REFERENCES public.community_reading_group_plans(id),
  CONSTRAINT community_reading_group_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.community_reading_groups (
  id integer NOT NULL DEFAULT nextval('community_reading_groups_id_seq'::regclass),
  community_id integer NOT NULL,
  name text NOT NULL,
  description text,
  creator_id uuid NOT NULL,
  is_private boolean DEFAULT false,
  cover_image_url text,
  current_book_id integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_reading_groups_pkey PRIMARY KEY (id),
  CONSTRAINT community_reading_groups_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id),
  CONSTRAINT community_reading_groups_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id),
  CONSTRAINT community_reading_groups_current_book_id_fkey FOREIGN KEY (current_book_id) REFERENCES public.books(id)
);
CREATE TABLE public.device_tokens (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  device_info jsonb DEFAULT '{}'::jsonb,
  last_used timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT device_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT device_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.friends (
  id integer NOT NULL DEFAULT nextval('friends_id_seq'::regclass),
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::friend_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT friends_pkey PRIMARY KEY (id),
  CONSTRAINT friends_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES public.users(id),
  CONSTRAINT friends_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.notifications (
  id integer NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  user_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  expires_at timestamp with time zone,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.profiles (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  email text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.reading_goals (
  id integer NOT NULL DEFAULT nextval('reading_goals_id_seq'::regclass),
  user_id uuid NOT NULL,
  year integer NOT NULL,
  target_books integer,
  target_pages integer,
  target_minutes integer,
  current_books integer DEFAULT 0,
  current_pages integer DEFAULT 0,
  current_minutes integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reading_goals_pkey PRIMARY KEY (id),
  CONSTRAINT reading_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.reading_group_members (
  id integer NOT NULL DEFAULT nextval('reading_group_members_id_seq'::regclass),
  reading_group_id integer NOT NULL,
  user_id uuid NOT NULL,
  role USER-DEFINED DEFAULT 'member'::member_role,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reading_group_members_pkey PRIMARY KEY (id),
  CONSTRAINT reading_group_members_reading_group_id_fkey FOREIGN KEY (reading_group_id) REFERENCES public.reading_groups(id),
  CONSTRAINT reading_group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.reading_group_messages (
  id integer NOT NULL DEFAULT nextval('reading_group_messages_id_seq'::regclass),
  reading_group_id integer NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  reply_to integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reading_group_messages_pkey PRIMARY KEY (id),
  CONSTRAINT reading_group_messages_reading_group_id_fkey FOREIGN KEY (reading_group_id) REFERENCES public.reading_groups(id),
  CONSTRAINT reading_group_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT reading_group_messages_reply_to_fkey FOREIGN KEY (reply_to) REFERENCES public.reading_group_messages(id)
);
CREATE TABLE public.reading_group_plans (
  id integer NOT NULL DEFAULT nextval('reading_group_plans_id_seq'::regclass),
  reading_group_id integer NOT NULL,
  book_id integer NOT NULL,
  title text NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  pages_per_session integer NOT NULL,
  frequency USER-DEFINED DEFAULT 'daily'::reading_frequency,
  created_by uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reading_group_plans_pkey PRIMARY KEY (id),
  CONSTRAINT reading_group_plans_reading_group_id_fkey FOREIGN KEY (reading_group_id) REFERENCES public.reading_groups(id),
  CONSTRAINT reading_group_plans_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id),
  CONSTRAINT reading_group_plans_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.reading_group_progress (
  id integer NOT NULL DEFAULT nextval('reading_group_progress_id_seq'::regclass),
  reading_group_plan_id integer NOT NULL,
  user_id uuid NOT NULL,
  current_page integer DEFAULT 0,
  last_read_date timestamp with time zone,
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reading_group_progress_pkey PRIMARY KEY (id),
  CONSTRAINT reading_group_progress_reading_group_plan_id_fkey FOREIGN KEY (reading_group_plan_id) REFERENCES public.reading_group_plans(id),
  CONSTRAINT reading_group_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.reading_groups (
  id integer NOT NULL DEFAULT nextval('reading_groups_id_seq'::regclass),
  name text NOT NULL,
  description text,
  creator_id uuid NOT NULL,
  is_private boolean DEFAULT false,
  cover_image_url text,
  current_book_id integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reading_groups_pkey PRIMARY KEY (id),
  CONSTRAINT reading_groups_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id),
  CONSTRAINT reading_groups_current_book_id_fkey FOREIGN KEY (current_book_id) REFERENCES public.books(id)
);
CREATE TABLE public.reading_plans (
  id integer NOT NULL DEFAULT nextval('reading_plans_id_seq'::regclass),
  user_id uuid NOT NULL,
  book_id integer NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  current_page integer NOT NULL DEFAULT 0,
  daily_goal integer NOT NULL,
  notes text,
  last_read_date timestamp with time zone,
  status USER-DEFINED NOT NULL DEFAULT 'active'::reading_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  title text,
  frequency text NOT NULL DEFAULT 'Daily'::text,
  CONSTRAINT reading_plans_pkey PRIMARY KEY (id),
  CONSTRAINT reading_plans_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id),
  CONSTRAINT reading_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.reading_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  book_id integer NOT NULL,
  reading_plan_id integer,
  pages_read integer NOT NULL,
  minutes_spent integer,
  koach_earned integer NOT NULL,
  session_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reading_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT reading_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT reading_sessions_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id)
);
CREATE TABLE public.review_votes (
  id integer NOT NULL DEFAULT nextval('review_votes_id_seq'::regclass),
  user_id uuid NOT NULL,
  review_id integer NOT NULL,
  is_helpful boolean NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT review_votes_pkey PRIMARY KEY (id),
  CONSTRAINT review_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT review_votes_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.book_reviews(id)
);
CREATE TABLE public.user_achievements (
  id integer NOT NULL DEFAULT nextval('user_achievements_id_seq'::regclass),
  user_id uuid NOT NULL,
  achievement_type text NOT NULL,
  achievement_name text NOT NULL,
  description text,
  points_earned integer DEFAULT 0,
  progress_current integer DEFAULT 0,
  progress_target integer NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT user_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_badges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL,
  awarded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_badges_pkey PRIMARY KEY (id),
  CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id),
  CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_book_lists (
  id integer NOT NULL DEFAULT nextval('user_book_lists_id_seq'::regclass),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_book_lists_pkey PRIMARY KEY (id),
  CONSTRAINT user_book_lists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_books (
  id integer NOT NULL DEFAULT nextval('user_books_id_seq'::regclass),
  user_id uuid NOT NULL,
  book_id integer NOT NULL,
  current_page integer NOT NULL DEFAULT 0,
  is_favorite boolean NOT NULL DEFAULT false,
  is_completed boolean NOT NULL DEFAULT false,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review text,
  reading_time integer DEFAULT 0,
  last_read_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_books_pkey PRIMARY KEY (id),
  CONSTRAINT user_books_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id),
  CONSTRAINT user_books_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  is_premium boolean NOT NULL DEFAULT false,
  koach_points integer NOT NULL DEFAULT 0,
  reading_streak integer NOT NULL DEFAULT 0,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_login timestamp with time zone NOT NULL DEFAULT now(),
  avatar_url text,
  has_completed_onboarding boolean NOT NULL DEFAULT false,
  is_admin boolean NOT NULL DEFAULT false,
  books_completed integer DEFAULT 0,
  total_pages_read integer DEFAULT 0,
  total_reading_time integer DEFAULT 0,
  favorite_genres ARRAY,
  reading_goal_books integer DEFAULT 12,
  reading_goal_pages integer DEFAULT 5000,
  timezone text DEFAULT 'Europe/Paris'::text,
  notification_settings jsonb DEFAULT '{"friends": true, "challenges": true, "achievements": true}'::jsonb,
  privacy_settings jsonb DEFAULT '{"profile_public": true, "reading_stats_public": true}'::jsonb,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);