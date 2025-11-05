-- Supabase schema for badminton tournament tool
-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- tournament configuration per user
create table if not exists public.tournament_configs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    team_count integer not null,
    team_capacity integer not null,
    formations text[] not null,
    court_count integer not null,
    match_duration integer not null,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists tournament_configs_user_id_key on public.tournament_configs(user_id);

create table if not exists public.time_slots (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    slot_index integer not null,
    label text not null,
    starts_at timestamptz,
    ends_at timestamptz,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now()),
    unique(user_id, slot_index)
);

create table if not exists public.players (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    code text not null,
    name text,
    team_code text not null,
    player_number integer not null,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now()),
    unique(user_id, code)
);

create table if not exists public.formations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    team_code text not null,
    match_type text not null,
    players text[] not null,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now()),
    unique(user_id, team_code, match_type)
);

create table if not exists public.matches (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    match_number text,
    round integer not null,
    time_slot_index integer not null,
    court integer not null,
    match_type text not null,
    team_a_id text not null,
    team_b_id text not null,
    team_a_name text,
    team_b_name text,
    team_a_players text[] not null,
    team_b_players text[] not null,
    team_a_player_names text[],
    team_b_player_names text[],
    status text not null default 'pending',
    scores jsonb not null default '[]'::jsonb,
    winner_team_id text,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now()),
    constraint matches_status_check check (status in ('pending', 'ongoing', 'finished'))
);

create table if not exists public.schedules (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    time_slot_index integer not null,
    court integer not null,
    team_a text not null,
    team_b text not null,
    formation text not null,
    team_a_players text[] not null,
    team_b_players text[] not null,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.default_import_state (
    user_id uuid primary key references auth.users(id) on delete cascade,
    seed_version text,
    imported_at timestamptz not null default timezone('utc'::text, now()),
    last_error text
);

-- Trigger to keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

create trigger trigger_tournament_configs_touch
before update on public.tournament_configs
for each row execute procedure public.touch_updated_at();

create trigger trigger_time_slots_touch
before update on public.time_slots
for each row execute procedure public.touch_updated_at();

create trigger trigger_players_touch
before update on public.players
for each row execute procedure public.touch_updated_at();

create trigger trigger_formations_touch
before update on public.formations
for each row execute procedure public.touch_updated_at();

create trigger trigger_matches_touch
before update on public.matches
for each row execute procedure public.touch_updated_at();

create trigger trigger_schedules_touch
before update on public.schedules
for each row execute procedure public.touch_updated_at();

-- Enable row level security
alter table public.tournament_configs enable row level security;
alter table public.time_slots enable row level security;
alter table public.players enable row level security;
alter table public.formations enable row level security;
alter table public.matches enable row level security;
alter table public.schedules enable row level security;
alter table public.default_import_state enable row level security;

-- Policies
create policy "Users can manage own tournament config"
on public.tournament_configs
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own time slots"
on public.time_slots
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own players"
on public.players
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own formations"
on public.formations
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own matches"
on public.matches
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own schedules"
on public.schedules
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own default import state"
on public.default_import_state
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
