import { t } from './i18n.js';
import { ownedDecorations } from './workshop.js';
import { createObjectScene } from './object-scene.js';
import { MEMORIES, memoryAvailable, memoryFor, memoryProgress, memoryLayout, memoryExtras, EXTRA_RECORDS, followupReady } from './memories.js';

export function createMemoryUI({ getState, dispatch, sound, afterRead = () => {} }) {
  const screen = document.createElement('button'); screen.className = 'device-memory-screen';
  const invitation = document.createElement('button'); invitation.className='memory-invitation'; invitation.onclick=()=>screen.onclick();
  const reader = document.createElement('dialog'); reader.className = 'memory-reader'; reader.setAttribute('aria-label', t('История предмета'));
  document.body.append(reader);
  let key = '', bootTimer = 0, actionTimer = 0, opener, showingArchive = false;
  const album = document.querySelector('#menu-album');
  function close() { clearTimeout(actionTimer); reader.close(); if (opener?.isConnected) opener.focus({ preventScroll: true }); }
  reader.addEventListener('close', () => { clearTimeout(actionTimer); updateScreen(getState()); if (!showingArchive) afterRead(); });
  function updateScreen(state) {
    const memory = memoryFor(state), title = screen.querySelector('span'), icon = screen.querySelector('b');
    if (!memory || !title || !icon) return;
    const completed = state.memoryActionDone;
    title.textContent = completed && memory.key === 'phone:dima' ? t('МАМА') : completed && state.order === 'laptop' ? t('ГОТОВО') : memory.mini;
    icon.textContent = completed && memory.key === 'phone:dima' ? '☎' : state.order === 'phone' ? '✉' : ['television','video-camera'].includes(state.order) ? '▶' : state.order === 'laptop' ? '▣' : '▤';
  }
  function frame(title) {
    reader.replaceChildren();
    const h = document.createElement('h2'); h.textContent = title;
    const x = document.createElement('button'); x.className = 'memory-close'; x.textContent = '×'; x.setAttribute('aria-label', t('Закрыть историю')); x.onclick = close;
    reader.append(h,x);
  }
  function show(memory, archive = false) {
    clearTimeout(actionTimer); showingArchive = archive; opener = document.activeElement;
    if (!archive) dispatch('memory-read');
    frame(memory.title); reader.dataset.kind = memoryLayout(memory.order).kind;
    const subtitle = document.createElement('small'); subtitle.textContent = `${memory.client} · ${archive ? t('Из альбома мастерской') : t('Устройство снова работает')}`;
    const body = document.createElement('p'); body.className = 'memory-body';
    const performed = memoryProgress(getState()).memoryActions.includes(memory.key);
    body.textContent = performed ? memory.result : memory.body;
    const extra = document.createElement('button'); extra.className='memory-extra';
    function renderExtra() {
      const found=memoryExtras(getState()).discoveries.includes(memory.key);
      extra.textContent=found?t('Находка: ')+EXTRA_RECORDS[memory.order]:ownedDecorations(getState()).includes('archive-deck')?t('Необязательно: поискать скрытую запись'):t('Дополнительный поиск откроет архивный стенд');
      extra.disabled=archive||found||!ownedDecorations(getState()).includes('archive-deck')||!memoryProgress(getState()).memoryActions.includes(memory.key);
    }
    extra.onclick=()=>{dispatch('memory-discover');renderExtra();sound('memory');};
    renderExtra();
    const scene = createObjectScene(memory.order, sound, memory.key);
    if (performed) scene.complete();
    const progress = document.createElement('div'); progress.className = 'memory-progress'; progress.hidden = true;
    const button = document.createElement('button'); button.className = 'memory-action'; button.textContent = performed ? t('Сохранено в альбоме') : memory.action;
    button.disabled = performed || archive;
    button.onclick = () => {
      button.disabled = true; button.hidden = true; body.textContent = memory.pending; progress.hidden = false;
      if (screen.querySelector('span')) screen.querySelector('span').textContent = '…';
      sound('tool');
      scene.start(() => {
        if (!reader.open || memoryFor(getState())?.key !== memory.key || !memoryAvailable(getState())) return;
        dispatch('memory-action'); body.textContent = memory.result; progress.hidden = true; button.textContent = t('Сохранено в альбоме'); renderExtra(); sound('memory');

      });
    };
    const note = document.createElement('small'); note.className = 'memory-saved'; note.textContent = archive ? t('Можно вернуться к другим историям.') : t('История сохранена. Можно вернуться к ремонту и отдать вещь клиенту.');
    reader.append(subtitle,button,scene.element,body,progress,extra,note);
    if (archive) { const back = document.createElement('button'); back.textContent = t('К альбому'); back.onclick = showAlbum; reader.append(back); }
    if (!reader.open) reader.showModal();
  }
  function showAlbum() {
    showingArchive = true; opener = album; frame(t('Альбом мастерской')); reader.dataset.kind = 'album';
    const list = document.createElement('div'); list.className = 'memory-list';
    for (const id of memoryProgress(getState()).memories) {
      const [order,client] = id.split(':'); const memory = memoryFor({ order,client });
      if (followupReady(getState(),id)) {const letter=document.createElement('button');letter.textContent=t`✉ Письмо · ${memory.client}`;letter.onclick=()=>{frame(t`Письмо · ${memory.client}`);const text=document.createElement('p');text.className='memory-body';text.textContent=memory.followup || memory.response;const back=document.createElement('button');back.textContent=t('К альбому');back.onclick=showAlbum;reader.append(text,back);};list.append(letter);}
      const b = document.createElement('button'); b.textContent = `${memory.client} · ${memory.title}`; b.onclick = () => show(memory,true); list.append(b);
    }
    reader.append(list); if (!reader.open) reader.showModal();
  }
  album.onclick = showAlbum;
  screen.onclick = () => { const memory = memoryFor(getState()); if (memoryAvailable(getState()) && memory) { sound('memory'); show(memory); } };
  function render(visible) {
    const state = getState(), count = memoryProgress(state).memories.length;
    album.hidden = count === 0; const letters=Object.keys(MEMORIES).filter(id=>followupReady(state,id)).length;
    album.textContent = t`Альбом историй · ${count}/${Object.keys(MEMORIES).length}${letters?t` · Писем: ${letters}`:''}`;
    if (!visible || !memoryAvailable(state)) {
      clearTimeout(bootTimer); screen.remove(); invitation.remove(); key = '';
      if (reader.open && !showingArchive) close();
      return;
    }
    const memory = memoryFor(state), layout = memoryLayout(state.order);
    if (key === memory.key) { updateScreen(state); return; }
    invitation.textContent = t`Ожило · ${memory.action}`; document.querySelector(layout.host).closest('.mat').append(invitation);
    key = memory.key; screen.dataset.kind = layout.kind; screen.dataset.scene = memory.key.replace(':','-'); screen.dataset.boot = 'true'; screen.disabled = true;
    const [x,y,w,h] = layout.rect;
    Object.assign(screen.style, { left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` });

    const loading = document.createElement('span'); loading.textContent = layout.kind === 'object' ? t('ПРОВЕРКА') : state.order === 'laptop' ? t('ЗАГРУЗКА') : 'BOOT';
    const loader = document.createElement('i'); loader.className = 'screen-loader';
    screen.replaceChildren(loading,loader); screen.setAttribute('aria-label', t('Экран устройства запускается'));
    document.querySelector(layout.host).append(screen);
    clearTimeout(bootTimer);
    bootTimer = setTimeout(() => {
      screen.disabled = false; screen.dataset.boot = 'false'; screen.replaceChildren();
      const icon = document.createElement('b'); icon.textContent = state.order === 'phone' ? '✉' : ['television','video-camera'].includes(state.order) ? '▶' : state.order === 'laptop' ? '▣' : '▤';
      const title = document.createElement('span'); title.textContent = layout.kind === 'object' ? memory.action : memory.mini;
      screen.append(icon,title); updateScreen(getState()); screen.setAttribute('aria-label', t`Открыть: ${memory.title}`);
      sound('memory');
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1200);
  }
  return { render, close };
}
