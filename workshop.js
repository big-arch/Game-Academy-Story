import { campaignProgress } from './campaign.js';
import { memoryProgress } from './memories.js';
import { storyProgress } from './story.js';
export const DECORATIONS = [
  { id: 'bed', name: 'Лежанка Мурзика', price: 80, description: 'Своя зона отдыха вдали от техники. Мурзик устраивается здесь вместо прогулок над ремонтом.' },
  { id: 'garland', name: 'Огоньки у окна', price: 100, description: 'Тёплая гирлянда над дождливым городом.' },
  { id: 'lamp', name: 'Лампа с лупой', price: 120, description: 'Открывает увеличение детали ×1.4 при ремонте. Мелкие контакты становятся крупнее, а комната светлее.' },
];

export function ownedDecorations(state) {
  const owned = Array.isArray(state.furniture) ? state.furniture.filter(id => DECORATIONS.some(item => item.id === id)) : [];
  return [...new Set([...owned, ...(state.upgrade ? ['lamp'] : [])])];
}

// Room purchases belong to the workshop, not to the currently repaired device.
export function workshopProgress(state) {
  return { coins: state.coins, upgrade: Boolean(state.upgrade), furniture: ownedDecorations(state), ...campaignProgress(state), ...memoryProgress(state), ...storyProgress(state) };
}

export function purchaseDecoration(state, id) {
  const item = DECORATIONS.find(item => item.id === id);
  if (!item) return { state, message: 'Такого предмета нет в каталоге.' };
  const owned = ownedDecorations(state);
  if (owned.includes(id)) return { state, message: 'Этот предмет уже установлен в мастерской.' };
  if (!Number.isSafeInteger(state.coins) || state.coins < item.price) {
    return { state, message: `Не хватает монет: нужно ${item.price}.` };
  }
  return {
    state: { ...state, coins: state.coins - item.price, furniture: [...owned, id], upgrade: state.upgrade || id === 'lamp' },
    message: `${item.name} — теперь в твоей мастерской.`,
  };
}
