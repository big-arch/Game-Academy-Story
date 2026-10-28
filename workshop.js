import { campaignProgress } from './campaign.js';
import { memoryProgress } from './memories.js';
import { storyProgress } from './story.js';
// Мастерская начинается почти пустой: голый стол, окно и полка Лёвы. Всё остальное покупается за монеты.
// Предметы одной группы (slot) взаимозаменяемы: на столе стоит один коврик, одна лампа, одна кружка;
// купленные варианты остаются у игрока и переставляются бесплатно. Спрайты — assets/room (scripts/build-room.py).
export const DECORATIONS = [
  { id: 'mat-green', slot: 'mat', name: 'Коврик · зелёный', price: 60, description: 'Резиновый коврик с сеткой: винты не укатываются, а на клетках удобно раскладывать детали.' },
  { id: 'mat-blue', slot: 'mat', name: 'Коврик · синий', price: 80, description: 'Синий коврик — на нём лучше видно рыжие провода и медные контакты.' },
  { id: 'mat-leather', slot: 'mat', name: 'Коврик · кожаный', price: 120, description: 'Мягкая кожа, как у часовщиков. Деталям не страшно упасть.' },
  { id: 'lamp-orange', slot: 'lamp', name: 'Лампа · оранжевая', price: 120, description: 'Настольная лампа с лупой: открывает увеличение детали ×1.4 при ремонте и согревает комнату.' },
  { id: 'lamp-green', slot: 'lamp', name: 'Лампа · зелёная', price: 140, description: 'Библиотечный зелёный абажур. Тоже с лупой ×1.4.' },
  { id: 'lamp-blue', slot: 'lamp', name: 'Лампа · синяя', price: 140, description: 'Синяя, как вечер за окном. С лупой ×1.4.' },
  { id: 'mug-trees', slot: 'mug', name: 'Кружка · ёлки', price: 30, description: 'Кружка с ёлками. Чай остывает, пока ты паяешь, — это традиция.' },
  { id: 'mug-red', slot: 'mug', name: 'Кружка · красная', price: 40, description: 'Красная кружка, чтобы не перепутать с банкой для винтов.' },
  { id: 'mug-blue', slot: 'mug', name: 'Кружка · синяя', price: 40, description: 'Синяя кружка, в ней чай кажется крепче.' },
  { id: 'plant-sill', name: 'Цветок на подоконник', price: 50, description: 'Плющ в глиняном горшке на подоконнике. Дождь за окном ему нравится.' },
  { id: 'plant-desk', name: 'Цветок на стол', price: 60, description: 'Маленький горшок в углу стола — будет на что смотреть, пока ждёшь клиента.' },
  { id: 'brushes', name: 'Стакан с кистями', price: 40, description: 'Кисти для пыли под рукой, у стены.' },
  { id: 'tools', name: 'Органайзер и отвёртка', price: 70, description: 'Коробочка с винтами и любимая красная отвёртка — у правого края стола.' },
  { id: 'radio', name: 'Радиоприёмник', price: 150, description: 'Старый приёмник Лёвы. Тихо шипит между станциями.' },
  { id: 'bed', name: 'Лежанка Мурзика', price: 80, description: 'Своя зона отдыха вдали от техники. Мурзик устраивается здесь вместо прогулок над ремонтом.' },
  { id: 'garland', name: 'Огоньки у окна', price: 100, description: 'Тёплая гирлянда над дождливым городом.' },
];
const LEGACY = { lamp: 'lamp-orange' };
const find = id => DECORATIONS.find(item => item.id === (LEGACY[id] || id));

export function ownedDecorations(state) {
  const owned = Array.isArray(state.furniture) ? state.furniture.map(id => LEGACY[id] || id).filter(id => find(id)) : [];
  return [...new Set([...owned, ...(state.upgrade ? ['lamp-orange'] : [])])];
}

// Что сейчас стоит в комнате: все предметы без группы + по одному выбранному в каждой группе.
export function placedDecorations(state) {
  const owned = ownedDecorations(state), placed = state.placed && typeof state.placed === 'object' ? state.placed : {};
  return owned.filter(id => {
    const { slot } = find(id); if (!slot) return true;
    const choice = owned.includes(placed[slot]) ? placed[slot] : owned.find(other => find(other).slot === slot);
    return choice === id;
  });
}

// Room purchases belong to the workshop, not to the currently repaired device.
export function workshopProgress(state) {
  return { coins: state.coins, upgrade: Boolean(state.upgrade), furniture: ownedDecorations(state), placed: { ...(state.placed || {}) }, ...campaignProgress(state), ...memoryProgress(state), ...storyProgress(state) };
}

export function purchaseDecoration(state, id) {
  const item = find(id);
  if (!item) return { state, message: 'Такого предмета нет в каталоге.' };
  const owned = ownedDecorations(state);
  if (owned.includes(item.id)) return placeDecoration(state, item.id);
  if (!Number.isSafeInteger(state.coins) || state.coins < item.price) {
    return { state, message: `Не хватает монет: нужно ${item.price}.` };
  }
  return {
    state: { ...state, coins: state.coins - item.price, furniture: [...owned, item.id], placed: item.slot ? { ...(state.placed || {}), [item.slot]: item.id } : { ...(state.placed || {}) }, upgrade: state.upgrade || item.slot === 'lamp' },
    message: `${item.name} — теперь в твоей мастерской.`,
  };
}

export function placeDecoration(state, id) {
  const item = find(id);
  if (!item || !ownedDecorations(state).includes(item.id)) return { state, message: 'Сначала купи этот предмет.' };
  if (!item.slot || placedDecorations(state).includes(item.id)) return { state, message: 'Этот предмет уже стоит в мастерской.' };
  return { state: { ...state, placed: { ...(state.placed || {}), [item.slot]: item.id } }, message: `${item.name} — на месте.` };
}
