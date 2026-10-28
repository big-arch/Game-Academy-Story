import { campaignProgress } from './campaign.js';
import { memoryProgress } from './memories.js';
import { storyProgress } from './story.js';
// Мастерская начинается с голого стола. Покупки стола идут по порядку (stage): каждая открывает следующую
// целиком нарисованную картинку assets/room/stage-N.png (ТЗ — docs/ROOM-ART-BRIEF.md).
// Лежанка и гирлянда — отдельные вещи поверх любой картинки.
export const DECORATIONS = [
  { id: 'desk-mat', stage: 1, name: 'Рабочий коврик', price: 60, description: 'Резиновый коврик с сеткой: винты не укатываются, а на клетках удобно раскладывать детали.' },
  { id: 'desk-lamp', stage: 2, name: 'Лампа на приёмнике', price: 120, description: 'Старая латунная лампа Лёвы на радиоприёмнике. Лупа ×1.4 при ремонте и тёплый свет на весь стол.' },
  { id: 'desk-tea', stage: 3, name: 'Чайный уголок', price: 60, description: 'Кружка с ёлками, стакан с карандашами и новая оранжевая лампа вместо латунной. Чай остывает, пока ты паяешь, — это традиция.' },
  { id: 'desk-tools', stage: 4, name: 'Порядок в инструментах', price: 90, description: 'Коробочка с винтами, любимая красная отвёртка, катушка припоя и ящичек с деталями.' },
  { id: 'desk-plants', stage: 5, name: 'Зелень', price: 70, description: 'Плющ на подоконнике, горшочек на углу стола и стакан с кистями.' },
  { id: 'bed', name: 'Лежанка Мурзика', price: 80, description: 'Своя зона отдыха вдали от техники. Мурзик устраивается здесь вместо прогулок над ремонтом.' },
  { id: 'garland', name: 'Огоньки у окна', price: 100, description: 'Тёплая гирлянда над дождливым городом.' },
];
export const ROOM_STAGES = 1 + Math.max(...DECORATIONS.map(item => item.stage || 0));
// Старые сохранения: лампа-улучшение и предметы прошлого каталога переводятся в этапы.
const LEGACY = { lamp: 'desk-lamp', radio: 'desk-lamp', brushes: 'desk-plants', tools: 'desk-tools' };
const legacy = id => LEGACY[id] || (/^mat-/.test(id) ? 'desk-mat' : /^lamp-/.test(id) ? 'desk-lamp' : /^mug-/.test(id) ? 'desk-tea' : /^plant-/.test(id) ? 'desk-plants' : id);
const find = id => DECORATIONS.find(item => item.id === legacy(id));

export function ownedDecorations(state) {
  const owned = Array.isArray(state.furniture) ? state.furniture.map(legacy).filter(id => find(id)) : [];
  return [...new Set([...owned, ...(state.upgrade ? ['desk-lamp'] : [])])];
}

// Этап стола — сколько покупок стола сделано подряд с первой (старые сохранения могли пропустить ступень).
export function roomStage(state) {
  const owned = ownedDecorations(state);
  let stage = 0;
  while (DECORATIONS.some(item => item.stage === stage + 1 && owned.includes(item.id))) stage++;
  return stage;
}

// Room purchases belong to the workshop, not to the currently repaired device.
export function workshopProgress(state) {
  return { coins: state.coins, upgrade: Boolean(state.upgrade), furniture: ownedDecorations(state), ...campaignProgress(state), ...memoryProgress(state), ...storyProgress(state) };
}

export function purchaseDecoration(state, id) {
  const item = find(id);
  if (!item) return { state, message: 'Такого предмета нет в каталоге.' };
  const owned = ownedDecorations(state);
  if (owned.includes(item.id)) return { state, message: 'Это уже есть в мастерской.' };
  if (item.stage && roomStage(state) < item.stage - 1) return { state, message: `Сначала: ${DECORATIONS.find(d => d.stage === item.stage - 1).name.toLowerCase()}.` };
  if (!Number.isSafeInteger(state.coins) || state.coins < item.price) {
    return { state, message: `Не хватает монет: нужно ${item.price}.` };
  }
  return {
    state: { ...state, coins: state.coins - item.price, furniture: [...owned, item.id], upgrade: state.upgrade || item.id === 'desk-lamp' },
    message: `${item.name} — теперь в твоей мастерской.`,
  };
}
