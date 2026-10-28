import { DECORATIONS, ownedDecorations, placedDecorations } from './workshop.js';
import { ROOM_ITEMS } from './room-layout.js';
import { DEVICES } from './devices.js';
import { CONTRACTS, completedOrders } from './campaign.js';

function createDecor(surface) {
  const layer = document.createElement('div');
  layer.className = 'room-decor'; layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = '<div class="room-garland">' + '<i></i>'.repeat(7) + '</div><div class="room-bed"></div><div class="room-lamp"></div><div class="room-album"></div>';
  // Купленные предметы — спрайты во весь кадр комнаты (совпадают с фоном пиксель в пиксель); видимость задаёт data-items.
  for (const id of [...ROOM_ITEMS].sort((a, b) => b.startsWith('mat-') - a.startsWith('mat-'))) {  // коврик — под остальными
    const sprite = document.createElement('i'); sprite.className = 'room-item'; sprite.dataset.item = id;
    sprite.style.backgroundImage = `url('assets/room/${id}.png')`;
    layer.querySelector('.room-album').before(sprite);
  }
  // Ноутбук первого заказа стоит поверх коврика на его рабочем столе (точки ремонта привязаны к этому кадру).
  if (surface.closest('#bench-laptop')) { const laptop = document.createElement('i'); laptop.className = 'room-laptop'; layer.querySelector('.room-album').before(laptop); }
  const cat = surface.querySelector('.bench-cat');
  layer.style.setProperty('--bed-x', `${cat?.dataset.min || 36}%`);
  layer.style.setProperty('--bed-floor', `${cat?.dataset.floor || 43}%`);
  layer.style.setProperty('--bed-size', `${'22'}%`);
  if (surface.id === 'main-menu') { layer.style.setProperty('--bed-x', '58%'); layer.style.setProperty('--bed-floor', '24.5%'); layer.style.setProperty('--bed-size', '20%'); }
  surface.prepend(layer);
  return layer;
}

export function createWorkshopUI({ getState, purchase, close }) {
  const shop = document.querySelector('#workshop-shop');
  const preview = shop.querySelector('.shop-preview');
  const previewDecor = createDecor(preview);
  const roomDecor = [...document.querySelectorAll('.mat, #main-menu')].map(createDecor);
  const balance = shop.querySelector('#shop-balance');
  const notice = shop.querySelector('#shop-notice');
  const buy = shop.querySelector('#shop-buy');
  const back = shop.querySelector('#shop-back');
  let selected = DECORATIONS[0].id;
  const choices = DECORATIONS.map(item => {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.decoration = item.id;
    const title = document.createElement('span'); title.textContent = item.name;
    const price = document.createElement('span'); price.textContent = `${item.price} монет`;
    b.append(title, price);
    b.onclick = () => { selected = item.id; notice.textContent = 'Предпросмотр — монеты пока не потрачены.'; render(); };
    return b;
  });
  shop.querySelector('#shop-catalog').replaceChildren(...choices);
  back.onclick = close;
  buy.onclick = () => {
    const result = purchase(selected);
    notice.textContent = result.message;
    render();
  };
  shop.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); close(); } });
  function render() {
    const state = getState(), owned = ownedDecorations(state), placed = placedDecorations(state), item = DECORATIONS.find(item => item.id === selected);
    balance.textContent = `${state.coins} монет`;
    shop.querySelector('#shop-description').textContent = item.description;
    choices.forEach((b, i) => {
      const entry = DECORATIONS[i]; b.setAttribute('aria-pressed', String(entry.id === selected));
      b.lastChild.textContent = placed.includes(entry.id) ? 'Стоит ✓' : owned.includes(entry.id) ? 'Куплено' : `${entry.price} монет`;
      b.classList.toggle('owned', owned.includes(entry.id));
    });
    const standing = placed.includes(selected), bought = owned.includes(selected), missing = bought ? 0 : Math.max(0, item.price - state.coins);
    buy.disabled = standing || missing > 0;
    buy.textContent = standing ? 'Стоит в мастерской' : bought ? 'Поставить' : missing ? `Не хватает ${missing} монет` : `Купить · ${item.price} монет`;
    // Предпросмотр: выбранный вариант встаёт вместо купленного из той же группы.
    previewDecor.dataset.items = [...placed.filter(id => !item.slot || DECORATIONS.find(d => d.id === id).slot !== item.slot), selected].join(' ');
    roomDecor.forEach(layer => { layer.dataset.items = placed.join(' '); });
    for (const layer of [...roomDecor, previewDecor]) { const album = layer.querySelector('.room-album'); album.replaceChildren(...completedOrders(state).map(id => { const i = document.createElement('i'); i.textContent = DEVICES[id]?.icon || ({remote:'📺',cassette:'📼',laptop:'💻'})[id]; i.title = CONTRACTS.find(c => c.order === id).name; return i; })); }
    shop.querySelector('h2').textContent = `Мастерская · истории ${completedOrders(state).length}/${CONTRACTS.length}`;
  }
  return { render, focus() { notice.textContent = 'Выбери предмет и посмотри, как изменится комната.'; back.focus(); } };
}
