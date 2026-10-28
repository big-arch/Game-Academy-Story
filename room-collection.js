import { CONTRACTS, completedOrders } from './campaign.js';
import { DEVICES, viewSrc } from './devices.js';
import { SHELF, storyProgress } from './story.js';
import { memoryFor, memoryProgress } from './memories.js';

export const COLLECTION_SLOTS = 14;
export const CABINET_ART = { src: 'assets/room/collection-cabinet-v2.png', crop: [40,70,2094,529], size: [2172,724] };
function cabinetArt() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.classList.add('cabinet-art'); svg.setAttribute('viewBox',CABINET_ART.crop.join(' ')); svg.setAttribute('aria-hidden','true');
  const image = document.createElementNS('http://www.w3.org/2000/svg','image'); image.setAttribute('href',CABINET_ART.src); image.setAttribute('width',String(CABINET_ART.size[0])); image.setAttribute('height',String(CABINET_ART.size[1])); svg.append(image);
  return svg;
}
export function collectionItems(state) {
  const ids = new Set(completedOrders(state));
  const returned = storyProgress(state).shelfDone;
  for (const item of SHELF) if (returned.includes(item.id) && item.order) ids.add(item.order);
  return [...ids].map(order => ({
    order,
    name: CONTRACTS.find(c => c.order === order)?.name || DEVICES[order]?.title || order,
    src: order === 'laptop' ? 'assets/room/laptop.png' : order === 'cassette' ? 'assets/devices/cassette-player/parts/view-repaired.png' : order === 'remote' ? 'assets/devices/remote/parts/view-repaired.png' : viewSrc(order,'repaired'),
    crop: order === 'laptop' ? [88,433,753,961] : null,
  }));
}

function miniature(item) {
  if (item.crop) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('viewBox',item.crop.join(' '));
    const img = document.createElementNS('http://www.w3.org/2000/svg','image'); img.setAttribute('href',item.src); img.setAttribute('width','936'); img.setAttribute('height','1681');
    svg.append(img); svg.setAttribute('aria-hidden','true'); return svg;
  }
  const img = document.createElement('img'); img.src = item.src; img.alt = ''; img.draggable = false; return img;
}

export function createRoomCollection({ getState, beforeOpen = () => {} }) {
  const viewer = document.createElement('dialog'); viewer.className = 'collection-dialog'; viewer.setAttribute('aria-label','Стеллаж мастерской'); document.body.append(viewer);
  const shelves = new Set();
  function frame(title) {
    viewer.replaceChildren();
    const header = document.createElement('header'), h = document.createElement('h2'), close = document.createElement('button');
    h.textContent = title; close.textContent = '×'; close.setAttribute('aria-label','Закрыть стеллаж'); close.onclick = () => viewer.close();
    header.append(h,close); viewer.append(header);
  }
  function inspect(item) {
    frame(item.name);
    const figure = document.createElement('div'); figure.className = 'collection-figure'; figure.append(miniature(item)); viewer.append(figure);
    const state = getState(), progress = memoryProgress(state);
    const stories = progress.memories.filter(key => key.split(':')[0] === item.order);
    if (!stories.length) { const p = document.createElement('p'); p.textContent = 'Вещь починена и возвращена владельцу. Её место в истории мастерской осталось здесь.'; viewer.append(p); }
    for (const key of stories) {
      const [order,client] = key.split(':'), memory = memoryFor({order,client}); if (!memory) continue;
      const h = document.createElement('h3'); h.textContent = `${memory.client} · ${memory.title}`;
      const text = document.createElement('p'); text.textContent = progress.memoryActions.includes(key) ? `${memory.body}\n\n${memory.result}` : memory.body;
      viewer.append(h,text);
    }
    const back = document.createElement('button'); back.textContent = 'К стеллажу'; back.className = 'collection-back'; back.onclick = open; viewer.append(back);
    viewer.scrollTop = 0;
  }
  function open() {
    beforeOpen(); frame('Стеллаж мастерской');
    const items = collectionItems(getState());
    const note = document.createElement('p'); note.className = 'collection-note'; note.textContent = items.length ? 'Вещи, которым ты вернул жизнь. Выбери предмет.' : 'После первого ремонта здесь появится твоя первая вещь.'; viewer.append(note);
    const grid = document.createElement('div'); grid.className = 'collection-grid';
    for (const item of items) {
      const button = document.createElement('button'); button.setAttribute('aria-label',item.name); button.dataset.order = item.order;
      button.append(miniature(item)); const label = document.createElement('span'); label.textContent = item.name; button.append(label); button.onclick = () => inspect(item); grid.append(button);
    }
    viewer.append(grid); viewer.scrollTop = 0; if (!viewer.open) viewer.showModal();
  }
  return {
    bind(button, interactive = true) {
      shelves.add(button); button.classList.add('room-collection'); button.type = 'button'; button.onclick = open;
      if (!interactive) { button.inert = true; button.setAttribute('aria-hidden','true'); }
    },
    render() {
      const items = collectionItems(getState()), signature = items.map(item=>item.order).join(',');
      for (const shelf of shelves) {
        shelf.setAttribute('aria-label',`Стеллаж мастерской. Собрано: ${items.length}. Рассмотреть`);
        if (shelf.dataset.collection === signature && shelf.children.length) continue;
        shelf.dataset.collection = signature;
        const contents = document.createElement('span'); contents.className = 'cabinet-contents'; contents.setAttribute('aria-hidden','true');
        contents.append(...Array.from({length:Math.max(COLLECTION_SLOTS,items.length)},(_,i)=>{
          const slot = document.createElement('span'); slot.className = 'collection-slot'; slot.setAttribute('aria-hidden','true');
          if (items[i]) { slot.dataset.order = items[i].order; slot.append(miniature(items[i])); }
          return slot;
        }));
        shelf.replaceChildren(cabinetArt(),contents);
      }
    },
  };
}
