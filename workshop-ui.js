import { t } from './i18n.js';
import { DECORATIONS, ownedDecorations, roomStage } from './workshop.js';
import { createRoomCollection } from './room-collection.js';
import { CONTRACTS, completedOrders } from './campaign.js';

function createDecor(surface) {
  const layer = document.createElement('div');
  layer.className = 'room-decor';
  // Стол — целиком нарисованная картинка этапа (assets/room/stage-N.png); лежанка и огоньки — поверх.
  layer.innerHTML = '<i class="room-stage"></i><div class="room-garland">' + '<i></i>'.repeat(7) + '</div><div class="room-bed"></div><button class="room-collection" type="button"></button>';
  // Ноутбук первого заказа стоит на столе поверх картинки этапа (точки ремонта привязаны к этому кадру).
  if (surface.closest('#bench-laptop')) { const laptop = document.createElement('i'); laptop.className = 'room-laptop'; layer.querySelector('.room-stage').after(laptop); }
  layer.querySelectorAll('.room-stage,.room-garland,.room-bed,.room-laptop').forEach(node=>node.setAttribute('aria-hidden','true'));
  const cat = surface.querySelector('.bench-cat');
  layer.style.setProperty('--bed-x', `${cat?.dataset.min || 36}%`);
  layer.style.setProperty('--bed-floor', `${cat?.dataset.floor || 43}%`);
  layer.style.setProperty('--bed-size', `${'22'}%`);
  if (surface.id === 'main-menu') { layer.style.setProperty('--bed-x', '58%'); layer.style.setProperty('--bed-floor', '24.5%'); layer.style.setProperty('--bed-size', '20%'); }
  surface.prepend(layer);
  return layer;
}

export function createWorkshopUI({ getState, purchase, close, beforeCollection = () => {} }) {
  const shop = document.querySelector('#workshop-shop');
  const preview = shop.querySelector('.shop-preview');
  const previewDecor = createDecor(preview);
  const roomDecor = [...document.querySelectorAll('.mat, #main-menu')].map(createDecor);
  const collection = createRoomCollection({getState,beforeOpen:beforeCollection});
  for (const layer of [...roomDecor,previewDecor]) collection.bind(layer.querySelector('.room-collection'),layer.parentElement.id !== 'main-menu');
  const balance = shop.querySelector('#shop-balance');
  const notice = shop.querySelector('#shop-notice');
  const buy = shop.querySelector('#shop-buy');
  const back = shop.querySelector('#shop-back');
  let selected = DECORATIONS[0].id;
  const choices = DECORATIONS.map(item => {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.decoration = item.id;
    const title = document.createElement('span'); title.textContent = item.name;
    const price = document.createElement('span'); price.textContent = t`${item.price} монет`;
    b.append(title, price);
    b.onclick = () => { selected = item.id; notice.textContent = t('Предпросмотр — монеты пока не потрачены.'); render(); };
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
  const show = (layer, stage, items) => { layer.dataset.items = items.join(' '); layer.dataset.stage = String(stage); layer.querySelector('.room-stage').style.backgroundImage = `url('assets/room/stage-${stage}.png')`; };
  function render() {
    const state = getState(), owned = ownedDecorations(state), stage = roomStage(state), item = DECORATIONS.find(item => item.id === selected);
    balance.textContent = t`${state.coins} монет`;
    const locked = entry => entry.stage && !owned.includes(entry.id) && stage < entry.stage - 1;
    const next = DECORATIONS.find(entry => entry.stage === stage + 1);
    shop.querySelector('#shop-description').textContent = item.description + (locked(item) ? t` Сначала купи «${next.name}». Улучшения стола устанавливаются по порядку.` : '');
    choices.forEach((b, i) => {
      const entry = DECORATIONS[i]; b.setAttribute('aria-pressed', String(entry.id === selected));
      const prerequisite = DECORATIONS.find(d => d.stage === entry.stage - 1);
      b.lastChild.textContent = owned.includes(entry.id) ? t('Есть ✓') : locked(entry) ? t`${entry.price} монет · после «${prerequisite.name}»` : t`${entry.price} монет`;
      b.classList.toggle('owned', owned.includes(entry.id)); b.classList.toggle('locked', locked(entry));
    });
    const bought = owned.includes(selected), missing = bought ? 0 : Math.max(0, item.price - state.coins);
    buy.disabled = bought || locked(item) || missing > 0;
    buy.textContent = bought ? t('Уже в мастерской') : locked(item) ? t`Сначала: ${DECORATIONS.find(d => d.stage === stage + 1).name.toLowerCase()}` : missing ? t`Не хватает ${missing} монет` : t`Купить · ${item.price} монет`;
    // Предпросмотр: выбранный этап стола (или текущий, если выбрана вещь поверх него).
    show(previewDecor, item.stage ? Math.max(stage, item.stage) : stage, [...new Set([...owned, selected])]);
    roomDecor.forEach(layer => show(layer, stage, owned));
    collection.render();
    shop.querySelector('h2').textContent = t`Мастерская · истории ${completedOrders(state).length}/${CONTRACTS.length}`;
  }
  return { render, focus() { notice.textContent = t('Улучшения стола покупаются по порядку. Лежанку и огоньки можно купить отдельно.'); back.focus(); } };
}
