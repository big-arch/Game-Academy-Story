-- Supabase Schema для "Мастерская историй"
-- Применено миграцией workshop_stories_init в проекте big-arch's Project (renbakjudvdnkjvjujti).
-- Проект общий с другими приложениями, поэтому таблицы игры имеют префикс ws_.
-- Игрок входит анонимно (Authentication → Anonymous sign-ins) или через привязанный способ входа.

create table public.ws_saves (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  version text not null default 'v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ws_saves_user_version_unique unique (user_id, version),
  constraint ws_saves_data_size check (pg_column_size(data) < 65536)
);

create table public.ws_player_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  music_enabled boolean not null default true,
  effects_enabled boolean not null default true,
  fullscreen boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ws_game_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 1 and 64),
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 4096),
  created_at timestamptz not null default now()
);

create index ws_game_events_user_id_idx on public.ws_game_events(user_id);
create index ws_game_events_type_created_idx on public.ws_game_events(event_type, created_at);

alter table public.ws_saves enable row level security;
alter table public.ws_player_settings enable row level security;
alter table public.ws_game_events enable row level security;

create policy "ws_saves own select" on public.ws_saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "ws_saves own insert" on public.ws_saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ws_saves own update" on public.ws_saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "ws_saves own delete" on public.ws_saves for delete to authenticated using ((select auth.uid()) = user_id);

create policy "ws_settings own select" on public.ws_player_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy "ws_settings own insert" on public.ws_player_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ws_settings own update" on public.ws_player_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- События: игрок только добавляет свои; читать сырые события может только сервер (service_role)
create policy "ws_events own insert" on public.ws_game_events for insert to authenticated with check ((select auth.uid()) = user_id);

create or replace function public.ws_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ws_saves_updated_at before update on public.ws_saves for each row execute function public.ws_touch_updated_at();
create trigger ws_player_settings_updated_at before update on public.ws_player_settings for each row execute function public.ws_touch_updated_at();
