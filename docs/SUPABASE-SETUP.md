# Настройка Supabase для "Мастерская историй"

## 1. Создание проекта

1. Перейдите на [dashboard.supabase.com](https://supabase.com/dashboard)
2. Нажмите **"New project"**
3. Выберите или создайте организацию
4. Укажите название: `Game Academy Story` (или любое другое)
5. Выберите регион (ближайший к вам)
6. Установите пароль для базы данных (запишите его)
7. Нажмите **"Create new project"** — ожидание ~2 минуты

## 2. Развёртывание схемы БД

После создания проекта:

1. Откройте **SQL Editor** в боковом меню
2. Создайте новый запрос (New SQL file)
3. Скопируйте содержимое файла `docs/supabase-schema.sql`
4. Нажмите **"Run"** (или Ctrl+Enter)
5. Убедитесь, что все таблицы созданы без ошибок

Созданные таблицы:
- `profiles` — профили игроков
- `saves` — игровые сохранения (один слот на аккаунт)
- `player_settings` — настройки (музыка, звуки)
- `game_events` — события статистики

## 3. Получение данных для подключения

1. Откройте **Settings → API** (шестерёнка в боковом меню)
2. Запишите два значения:
   - **Project URL** (например: `https://xxxxxxxxxxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (длинная строка, начинается с `eyJ...`)
3. **Никогда не публикуйте** `service_role` key!

## 4. Подключение в игру

1. Откройте файл `supabase-client.js`
2. Замените значения:
   ```javascript
   const SUPABASE_URL = 'https://ВАШ_URL.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJ...';
   ```
3. Сохраните файл

## 5. Авторизация в игре (опционально)

В файле `supabase-client.js` добавлена поддержка авторизации через Supabase Auth.

Для включения входа в игру:
1. Откройте **Authentication → Providers** в Dashboard
2. Включите нужные провайдеры (Email, Google, и т.д.)
3. Настройте redirect URLs (например: `http://localhost:5173`)
4. Обновите `app.js` для вызова `client.auth.signInWith...`

## 6. Проверка

1. Запустите игру локально
2. Откройте консоль браузера (F12)
3. Должно быть: `[Supabase] Клиент инициализирован.`
4. При завершении заказа появится: `[Supabase] Сохранение отправлено.`

## Безопасность

- **never** include `service_role` key in client code
- Row Level Security (RLS) включён для всех таблиц
- Каждый пользователь видит только свои данные
- Анонимные пользователи могут добавлять события статистики, но не читают чужие данные

## Полезные ссылки

- [Supabase Docs](https://supabase.com/docs)
- [Auth Guide](https://supabase.com/docs/guides/auth)
- [Database Guide](https://supabase.com/docs/guides/database)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
