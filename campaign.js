import { t } from './i18n.js';
// Each contract introduces a small new demand before the next device appears.
export const CONTRACTS = [
  { order: 'pager', name: t('Пейджер'), level: 1, lesson: t('Контакты и установка батарейки') },
  { order: 'remote', name: t('Пульт'), level: 1, lesson: t('Разборка, плата и резиновая клавиатура') },
  { order: 'phone', name: t('Телефон'), level: 2, lesson: t('Разъём питания и аккумулятор') },
  { order: 'console', name: t('Приставка'), level: 2, lesson: t('Три зоны очистки, два инструмента') },
  { order: 'pda', name: t('КПК'), level: 3, lesson: t('Последовательность работы со шлейфом') },
  { order: 'cassette', name: t('Кассетный плеер'), level: 3, lesson: t('Лента, ремень и магнитная головка') },
  { order: 'boombox', name: t('Магнитофон'), level: 3, lesson: t('Механизм протяжки и ролик') },
  { order: 'vcr', name: t('Видеоплеер'), level: 4, lesson: t('Механизм загрузки кассеты') },
  { order: 'video-camera', name: t('Видеокамера'), level: 4, lesson: t('Шлейф и точная установка деталей') },
  { order: 'vacuum', name: t('Пылесос'), level: 4, lesson: t('Фильтр и мотор, несколько этапов очистки') },
  { order: 'laptop', name: t('Ноутбук'), level: 5, lesson: t('Питание, охлаждение, разъём и термопаста') },
  { order: 'television', name: t('Телевизор'), level: 5, lesson: t('Провод динамика и итоговая проверка') },
];
export function completedOrders(state) {
  return [...new Set((Array.isArray(state.completedOrders) ? state.completedOrders : []).filter(id => CONTRACTS.some(c => c.order === id)))];
}
export function nextContract(state) {
  const completed = completedOrders(state);
  return CONTRACTS.find(c => !completed.includes(c.order)) || CONTRACTS[campaignProgress(state).jobsCompleted % CONTRACTS.length];
}
export function campaignProgress(state) {
  return { completedOrders: completedOrders(state), jobsCompleted: Math.max(completedOrders(state).length, Number.isSafeInteger(state.jobsCompleted) && state.jobsCompleted >= 0 ? state.jobsCompleted : 0) };
}
