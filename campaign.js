// Each contract introduces a small new demand before the next device appears.
export const CONTRACTS = [
  { order: 'pager', name: 'Пейджер', level: 1, lesson: 'Контакты и установка батарейки' },
  { order: 'remote', name: 'Пульт', level: 1, lesson: 'Разборка, плата и резиновая клавиатура' },
  { order: 'phone', name: 'Телефон', level: 2, lesson: 'Разъём питания и аккумулятор' },
  { order: 'console', name: 'Приставка', level: 2, lesson: 'Три зоны очистки, два инструмента' },
  { order: 'pda', name: 'КПК', level: 3, lesson: 'Последовательность работы со шлейфом' },
  { order: 'cassette', name: 'Кассетный плеер', level: 3, lesson: 'Лента, ремень и магнитная головка' },
  { order: 'boombox', name: 'Магнитофон', level: 3, lesson: 'Механизм протяжки и ролик' },
  { order: 'vcr', name: 'Видеоплеер', level: 4, lesson: 'Механизм загрузки кассеты' },
  { order: 'video-camera', name: 'Видеокамера', level: 4, lesson: 'Шлейф и точная установка деталей' },
  { order: 'vacuum', name: 'Пылесос', level: 4, lesson: 'Фильтр и мотор, несколько этапов очистки' },
  { order: 'laptop', name: 'Ноутбук', level: 5, lesson: 'Питание, охлаждение, разъём и термопаста' },
  { order: 'television', name: 'Телевизор', level: 5, lesson: 'Провод динамика и итоговая проверка' },
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
