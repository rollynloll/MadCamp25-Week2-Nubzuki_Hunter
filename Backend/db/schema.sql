-- Supabase public schema tables for Nupzuki Hunter (v2)
-- auth.users is managed by Supabase; this script assumes it exists.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    nickname text NOT NULL,
    avatar_url text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NULL,
    status text NOT NULL CHECK (status IN ('lobby', 'playing', 'finished', 'expired')),
    owner_id uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    starts_at timestamptz NULL,
    ends_at timestamptz NULL,
    expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS public.groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    code text NOT NULL UNIQUE,
    name text NULL,
    owner_id uuid REFERENCES auth.users(id),
    max_members int NOT NULL DEFAULT 6,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_members (
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    role text NOT NULL DEFAULT 'member',
    joined_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.eyeball_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    event_key text NOT NULL UNIQUE,
    base_points int NOT NULL DEFAULT 0,
    description text NULL
);

CREATE TABLE IF NOT EXISTS public.eyeballs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    type_id uuid NOT NULL REFERENCES public.eyeball_types(id),
    qr_code text NOT NULL UNIQUE,
    title text NULL,
    location_name text NULL,
    lat double precision NULL,
    lng double precision NULL,
    hint text NULL,
    points_override int NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.eyeball_events (
    type_id uuid NOT NULL REFERENCES public.eyeball_types(id),
    event_type text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (type_id)
);

CREATE TABLE IF NOT EXISTS public.captures (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    eyeball_id uuid NOT NULL REFERENCES public.eyeballs(id),
    captured_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (game_id, eyeball_id)
);

CREATE TABLE IF NOT EXISTS public.group_scores (
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    score int NOT NULL DEFAULT 0,
    captures_count int NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.personal_scores (
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    score int NOT NULL DEFAULT 0,
    captures_count int NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (game_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.capture_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    capture_id uuid NOT NULL REFERENCES public.captures(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_games_expires_at ON public.games (expires_at);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games (status);
CREATE INDEX IF NOT EXISTS idx_eyeballs_game_id ON public.eyeballs (game_id);
CREATE INDEX IF NOT EXISTS idx_captures_game_captured_at ON public.captures (game_id, captured_at);
CREATE INDEX IF NOT EXISTS idx_captures_group_captured_at ON public.captures (group_id, captured_at);
CREATE INDEX IF NOT EXISTS idx_group_scores_score ON public.group_scores (group_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_personal_scores_score ON public.personal_scores (game_id, score DESC);
