// Supabase client integration for "Мастерская историй"
// Для подключения замените PROJECT_URL и ANON_KEY на ваши значения из Supabase Dashboard

const SUPABASE_URL = 'YOUR_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

let client = null;

try {
  // Используем динамический импорт Supabase
  import('https://esm.sh/@supabase/supabase-js')
    .then(({ createClient }) => {
      client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    })
    .catch(err => {
      console.warn('[Supabase] Не удалось инициализировать клиент:', err);
    });
} catch (err) {
  console.warn('[Supabase] Supabase недоступен:', err);
}

export async function saveProgress(gameState) {
  if (!client) {
    console.log('[Supabase] Клиент не инициализирован, сохранение пропущено.');
    return false;
  }
  try {
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      console.log('[Supabase] Пользователь не авторизован.');
      return false;
    }
    const { error } = await client
      .from('saves')
      .upsert({
        user_id: user.id,
        data: gameState,
        version: 'v1'
      }, { onConflict: 'user_id,version' });
    if (error) {
      console.error('[Supabase] Ошибка сохранения:', error);
      return false;
    }
    console.log('[Supabase] Сохранение отправлено.');
    return true;
  } catch (err) {
    console.error('[Supabase] Исключение при сохранении:', err);
    return false;
  }
}

export async function loadProgress() {
  if (!client) {
    console.log('[Supabase] Клиент не инициализирован.');
    return null;
  }
  try {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return null;
    const { data, error } = await client
      .from('saves')
      .select('data, updated_at')
      .eq('user_id', user.id)
      .eq('version', 'v1')
      .single();
    if (error || !data) {
      console.log('[Supabase] Сохранений не найдено.');
      return null;
    }
    console.log('[Supabase] Загружено из облака. Обновлено:', data.updated_at);
    return data.data;
  } catch (err) {
    console.error('[Supabase] Исключение при загрузке:', err);
    return null;
  }
}

export async function saveSettings(settings) {
  if (!client) return false;
  try {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return false;
    const { error } = await client
      .from('player_settings')
      .upsert({
        user_id: user.id,
        ...settings
      }, { onConflict: 'user_id' });
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
  if (!client) return null;
  try {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return null;
    const { data, error } = await client
      .from('player_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (error || !data) return null;
    return data;
  } catch (err) {
    console.error('[Supabase] Исключение при загрузке настроек:', err);
    return null;
  }
}

export async function trackEvent(eventType, eventData = {}) {
  if (!client) return false;
  try {
    const { data: { user } } = await client.auth.getUser();
    const { error } = await client.from('game_events').insert({
      user_id: user?.id,
      event_type: eventType,
      data: eventData
    });
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
  if (!client) return;
  await client.auth.signOut();
}

export { client, SUPABASE_URL, SUPABASE_ANON_KEY };
