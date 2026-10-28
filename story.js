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
  { id: 'pager-143', chapter: 2, unlock: 5, order: 'pager', client: 'mihalych-lev', name: 'Пейджер', tag: '«143»',
    after: 'В памяти пейджера нашлось ещё одно сообщение, принятое уже после отъезда Н.: «Плёнка 1996-го у тебя в камере. Там всё, что я не смогла сказать. Н.» Камера с биркой «Мастерская, 1996» ждёт на полке.' },
  { id: 'camera-1996', chapter: 3, unlock: 8, order: 'video-camera', client: 'mihalych-camera', name: 'Видеокамера', tag: '«Мастерская, 1996»',
    after: 'Михалыч понёс камеру Зое: они посмотрят запись вместе. На полке остался телефон с биркой «От Н. — не читать». Теперь у этой бирки есть голос.' },
  { id: 'phone-n', chapter: 4, unlock: 11, order: 'phone', client: 'zoya-phone', name: 'Телефон', tag: '«От Н. — не читать»',
    after: 'В черновиках телефона — неотправленный ответ Лёвы: «Надя. Шкатулку твою починил. Приходи за ней сама — я не умею говорить в трубку». На полке осталась одна шкатулка с буквой «Н.».' },
  { id: 'music-box', chapter: 5, unlock: 14, order: 'music-box', client: 'nadya', name: 'Шкатулка', tag: '«Н.»',
    after: 'Надя ушла, прижимая шкатулку к груди. На полке «НЕ ГОТОВО» больше ничего нет — только пыльный след и бирка Лёвы: «Готово».' },
];

export const CHAPTERS = [
  { id: 1, title: 'Глава 1. Первые клиенты', from: 0 },
  { id: 2, title: 'Глава 2. Голоса', from: 5 },
  { id: 3, title: 'Глава 3. Свет', from: 8 },
  { id: 4, title: 'Глава 4. Связь', from: 11 },
  { id: 5, title: 'Глава 5. Дом', from: 14 },
];

// Финал сезона: все предметы полки вернулись к хозяевам.
export const FINALE = {
  title: 'Стена мастерской',
  text: 'Ты снимаешь со стены старый календарь Лёвы — под ним пустое место. Утром Зоя Михайловна приносит пирожки и рамку, Михалыч — молоток, а Надя — фотографию: все они у мастерской, Мурзик на пороге.\n\nТеперь на стене висят те, кому ты вернул вещи и голоса. Полка «НЕ ГОТОВО» пуста. Мастерская — твоя.',
  button: 'Открыть мастерскую завтра',
};
export const seasonDone = state => SHELF.every(item => storyProgress(state).shelfDone.includes(item.id));

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
  const previous = SHELF.filter(entry => entry.chapter < item.chapter);
  if (previous.some(entry => !storyProgress(state).shelfDone.includes(entry.id))) return 'locked';
  return 'ready';
}

export function shelfLockReason(state, item) {
  if (!item.order) return 'Продолжение истории';
  if (campaignProgress(state).jobsCompleted < item.unlock) return `После ${item.unlock} заказов`;
  const previous = SHELF.find(entry => entry.chapter < item.chapter && !storyProgress(state).shelfDone.includes(entry.id));
  return previous ? `Сначала вернуть: ${previous.name.toLowerCase()}` : '';
}
