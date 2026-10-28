// Сюжет сезона (docs/SCENARIO.md): мастерская досталась от Лёвы-мастера вместе с полкой «НЕ ГОТОВО» —
// вещами, которые он не успел вернуть. Главы открываются по числу выполненных заказов,
// предметы с полки становятся особыми заказами и двигают главную загадку: кто такая «Н.».
import { campaignProgress } from './campaign.js';

export const LETTER = {
  title: 'Письмо на верстаке',
  text: '«Если ты читаешь это — мастерская теперь твоя. Кот Мурзик прилагается, спорить с ним бесполезно.\n\nНа полке «НЕ ГОТОВО» — вещи, которые я не успел вернуть. На каждой бирка. Верни их людям, когда будешь готов. Не торопись: вещи умеют ждать, люди — не всегда.\n\nЛампа иногда мигает. Это не поломка, это характер.\n\nТвой дядя Лёва»',
  button: 'Открыть мастерскую',
};

// unlock — сколько заказов нужно выполнить, чтобы предмет можно было взять с полки.
export const SHELF = [
  { id: 'zoya-remote', chapter: 1, unlock: 2, order: 'remote', client: 'zoya-lev', name: 'Пульт', tag: '«Зоя М. — вернуть лично»',
    after: 'Под крышкой пульта нашлась вторая бирка, почерк Лёвы: «Пейджер — 143. Спросить Н.» Полка ждёт следующую главу.' },
  { id: 'pager-143', chapter: 2, unlock: 5, name: 'Пейджер', tag: '«143»' },
  { id: 'camera-1996', chapter: 3, unlock: 8, name: 'Видеокамера', tag: '«Мастерская, 1996»' },
  { id: 'phone-n', chapter: 4, unlock: 11, name: 'Телефон', tag: '«От Н. — не читать»' },
  { id: 'music-box', chapter: 5, unlock: 14, name: 'Шкатулка', tag: '«Н.»' },
];

export const CHAPTERS = [
  { id: 1, title: 'Глава 1. Первые клиенты', from: 0 },
  { id: 2, title: 'Глава 2. Голоса', from: 5 },
  { id: 3, title: 'Глава 3. Свет', from: 8 },
  { id: 4, title: 'Глава 4. Связь', from: 11 },
  { id: 5, title: 'Глава 5. Дом', from: 14 },
];

export function storyProgress(state) {
  return {
    letterRead: Boolean(state.letterRead),
    shelfDone: Array.isArray(state.shelfDone) ? state.shelfDone.filter(id => SHELF.some(s => s.id === id)) : [],
  };
}
export function currentChapter(state) {
  const jobs = campaignProgress(state).jobsCompleted;
  return [...CHAPTERS].reverse().find(c => jobs >= c.from);
}
// Предмет доступен, если у него есть заказ, открыт по числу работ и ещё не возвращён.
export function shelfStatus(state, item) {
  if (storyProgress(state).shelfDone.includes(item.id)) return 'done';
  if (!item.order || campaignProgress(state).jobsCompleted < item.unlock) return 'locked';
  return 'ready';
}
