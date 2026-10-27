// Supabase client integration for "Мастерская историй"
// Проект big-arch's Project, таблицы игры с префиксом ws_ (см. docs/supabase-schema.sql).
// Publishable key публичный по назначению: доступ ограничен политиками RLS.

const SUPABASE_URL = 'https://renbakjudvdnkjvjujti.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tJ2cQXwiFEv-1r6wHRwndg_5hEN-h4C';
const SAVE_VERSION = 'v1';

let client = null;
let signInFailed = false;

const ready = import('https://esm.sh/@supabase/supabase-js@2.45.4')
  .then(({ createClient }) => {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return client;
  })
  .catch(err => {
    console.warn('[Supabase] Не удалось инициализировать клиент:', err);
    return null;
  });

// Текущий игрок. Если входа нет, пробуем анонимный вход
// (включается в Dashboard → Authentication → Sign In / Providers → Anonymous sign-ins).
async function currentUser() {
  if (!(await ready)) return null;
  const { data: { session } } = await client.auth.getSession();
  if (session?.user) return session.user;
  if (signInFailed) return null;
  const { data, error } = await client.auth.signInAnonymously();
  if (error) {
    signInFailed = true;
    console.log('[Supabase] Вход не выполнен, облачное сохранение пропущено:', error.message);
    return null;
  }
  return data.user;
}

export async function saveProgress(gameState) {
  try {
    const user = await currentUser();
    if (!user) return false;
    const { error } = await client
      .from('ws_saves')
      .upsert({ user_id: user.id, data: gameState, version: SAVE_VERSION }, { onConflict: 'user_id,version' });
    if (error) {
      console.error('[Supabase] Ошибка сохранения:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Исключение при сохранении:', err);
    return false;
  }
}

export async function loadProgress() {
  try {
    const user = await currentUser();
    if (!user) return null;
    const { data, error } = await client
      .from('ws_saves')
      .select('data, updated_at')
      .eq('user_id', user.id)
      .eq('version', SAVE_VERSION)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  } catch (err) {
    console.error('[Supabase] Исключение при загрузке:', err);
    return null;
  }
}

export async function saveSettings(settings) {
  try {
    const user = await currentUser();
    if (!user) return false;
    const { error } = await client
      .from('ws_player_settings')
      .upsert({ user_id: user.id, ...settings }, { onConflict: 'user_id' });
    if (error) {
      console.error('[Supabase] Ошибка сохранения настроек:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Исключение при сохранении настроек:', err);
    return false;
  }
}

export async function loadSettings() {
  try {
    const user = await currentUser();
    if (!user) return null;
    const { data, error } = await client
      .from('ws_player_settings')
      .select('music_enabled, effects_enabled, fullscreen')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  } catch (err) {
    console.error('[Supabase] Исключение при загрузке настроек:', err);
    return null;
  }
}

export async function trackEvent(eventType, eventData = {}) {
  try {
    const user = await currentUser();
    if (!user) return false;
    const { error } = await client.from('ws_game_events').insert({ user_id: user.id, event_type: eventType, data: eventData });
    if (error) {
      console.error('[Supabase] Ошибка события:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Исключение события:', err);
    return false;
  }
}

export async function signOut() {
  if (!(await ready)) return;
  await client.auth.signOut();
}

export { SUPABASE_URL };
