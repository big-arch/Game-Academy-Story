-- Supabase Schema для "Мастерская историй"
-- Выполните этот SQL в SQL Editor Supabase Dashboard

-- Таблица профилей игроков
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nickname text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Таблица игровых сохранений (один слот на аккаунт)
create table saves (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  data jsonb not null default '{}'::jsonb,
  version text not null default 'v1',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint saves_user_id_version_unique unique (user_id, version)
);

-- Таблица настроек игрока
create table player_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  music_enabled boolean not null default true,
  effects_enabled boolean not null default true,
  fullscreen boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint player_settings_user_id_unique unique (user_id)
);

-- Таблица статистики (события)
create table game_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Row Level Security policies
alter table profiles enable row level security;
alter table saves enable row level security;
alter table player_settings enable row level security;
alter table game_events enable row level security;

-- Policies для profiles
create policy "Пользователь видит свой профиль"
  on profiles for select using (auth.uid() = id);

create policy "Пользователь обновляет свой профиль"
  on profiles for update using (auth.uid() = id);

create policy "Пользователь создаёт свой профиль"
  on profiles for insert with check (auth.uid() = id);

-- Policies для saves
create policy "Пользователь видит свои сохранения"
  on saves for select using (auth.uid() = user_id);

create policy "Пользователь создаёт сохранение"
  on saves for insert with check (auth.uid() = user_id);

create policy "Пользователь обновляет своё сохранение"
  on saves for update using (auth.uid() = user_id);

create policy "Пользователь удаляет своё сохранение"
  on saves for delete using (auth.uid() = user_id);

-- Policies для player_settings
create policy "Пользователь видит свои настройки"
  on player_settings for select using (auth.uid() = user_id);

create policy "Пользователь создаёт настройки"
  on player_settings for insert with check (auth.uid() = user_id);

create policy "Пользователь обновляет свои настройки"
  on player_settings for update using (auth.uid() = user_id);

-- Policies для game_events
create policy "Видеть события своего пользователя"
  on game_events for select using (auth.uid() = user_id or auth.uid() is null);

create policy "Добавлять события"
  on game_events for insert with check (true);

-- Триггеры для updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();

create trigger saves_updated_at before update on saves
  for each row execute function update_updated_at();

create trigger player_settings_updated_at before update on player_settings
  for each row execute function update_updated_at();

-- Индексы для производительности
create index idx_saves_user_id on saves(user_id);
create index idx_player_settings_user_id on player_settings(user_id);
create index idx_game_events_user_id on game_events(user_id);
create index idx_game_events_type on game_events(event_type);
create index idx_game_events_created on game_events(created_at);
