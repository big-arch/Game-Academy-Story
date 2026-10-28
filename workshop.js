export const DECORATIONS = [
  { id: 'bed', name: 'Лежанка Мурзика', price: 80, description: 'Мягкое место для сна. Мурзик устраивается на нём, когда устаёт.' },
  { id: 'garland', name: 'Огоньки у окна', price: 100, description: 'Тёплая гирлянда над дождливым городом.' },
  { id: 'lamp', name: 'Тёплый свет', price: 120, description: 'Больше мягкого света от настольной лампы.' },
];

export function ownedDecorations(state) {
  const owned = Array.isArray(state.furniture) ? state.furniture.filter(id => DECORATIONS.some(item => item.id === id)) : [];
  return [...new Set([...owned, ...(state.upgrade ? ['lamp'] : [])])];
}

// Room purchases belong to the workshop, not to the currently repaired device.
export function workshopProgress(state) {
  return { coins: state.coins, upgrade: Boolean(state.upgrade), furniture: ownedDecorations(state) };
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
