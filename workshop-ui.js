import { DECORATIONS, ownedDecorations } from './workshop.js';

function createDecor(surface) {
  const layer = document.createElement('div');
  layer.className = 'room-decor'; layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = '<div class="room-garland">' + '<i></i>'.repeat(7) + '</div><div class="room-bed"></div><div class="room-lamp"></div>';
  const cat = surface.querySelector('.bench-cat');
  layer.style.setProperty('--bed-x', `${cat?.dataset.min || 27}%`);
  layer.style.setProperty('--bed-floor', `${cat?.dataset.floor || 47}%`);
  layer.style.setProperty('--bed-size', `${cat?.dataset.size || 30}%`);
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
    const state = getState(), owned = ownedDecorations(state), item = DECORATIONS.find(item => item.id === selected);
    balance.textContent = `${state.coins} монет`;
    shop.querySelector('#shop-description').textContent = item.description;
    choices.forEach((b, i) => {
      const entry = DECORATIONS[i]; b.setAttribute('aria-pressed', String(entry.id === selected));
      b.lastChild.textContent = owned.includes(entry.id) ? 'Установлено' : `${entry.price} монет`;
    });
    const installed = owned.includes(selected), missing = Math.max(0, item.price - state.coins);
    buy.disabled = installed || missing > 0;
    buy.textContent = installed ? 'Установлено' : missing ? `Не хватает ${missing} монет` : `Купить · ${item.price} монет`;
    previewDecor.dataset.items = [...new Set([...owned, selected])].join(' ');
    roomDecor.forEach(layer => { layer.dataset.items = owned.join(' '); });
  }
  return { render, focus() { notice.textContent = 'Выбери предмет и посмотри, как изменится комната.'; back.focus(); } };
}
