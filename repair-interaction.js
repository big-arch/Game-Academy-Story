import { t } from './i18n.js';
export function coverageCell(x, y, rect) {
  if (x < rect.left || y < rect.top || x > rect.right || y > rect.bottom) return -1;
  return Math.min(2, Math.floor((y - rect.top) / rect.height * 3)) * 3 + Math.min(2, Math.floor((x - rect.left) / rect.width * 3));
}
export function partFits(rotation, cell) { return cell >= 0 && (rotation % 360 + 360) % 360 === 0; }

// One interaction at a time, anchored to the part rather than to a distant toolbar.
export function createRepairInteraction({ selectTool, sound }) {
  let cleanup = () => {};
  let activeElement = null;
  function close() { cleanup(); cleanup = () => {}; activeElement = null; }
  function open({ element, label, tools = [], required, complete, blocked, magnify, zoom, choices = [], alignment = false }) {
    close();
    activeElement = element;
    const panel = document.createElement('section'); panel.className = 'part-context'; panel.setAttribute('aria-label', label);
    const title = document.createElement('strong'); title.textContent = label;
    const dismiss = document.createElement('button'); dismiss.className = 'part-dismiss'; dismiss.textContent = '×'; dismiss.setAttribute('aria-label', t('Закрыть инструменты детали'));
    const hint = document.createElement('p'); hint.setAttribute('role', 'status');
    const row = document.createElement('div'); row.className = 'part-tool-row';
    panel.append(title, dismiss, hint, row); document.body.append(panel);
    const listeners = new AbortController(), { signal } = listeners;
    let overlay, timer = 0, dragging = false, ghost;
    const place = () => {
      const r = element.getBoundingClientRect(), p = panel.getBoundingClientRect();
      panel.style.left = `${Math.max(8, Math.min(innerWidth - p.width - 8, r.left + r.width / 2 - p.width / 2))}px`;
      panel.style.top = `${Math.max(8, Math.min(innerHeight - p.height - 8, r.top - p.height - 10))}px`;
    };
    cleanup = () => { listeners.abort(); clearTimeout(timer); panel.remove(); overlay?.remove(); ghost?.remove(); element.classList.remove('part-selected'); };
    element.classList.add('part-selected');
    dismiss.onclick = close;
    const done = () => { sound(); close(); complete(); };
    window.addEventListener('resize', close, { signal });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); }, { signal });
    document.addEventListener('pointerdown', e => { if (!panel.contains(e.target) && !element.contains(e.target) && !ghost?.contains(e.target)) close(); }, { signal });
    hint.textContent = blocked || t('Выбери инструмент здесь, у детали.');
    for (const choice of choices) { const b = document.createElement('button'); b.textContent = choice.label; b.onclick = () => { close(); choice.run(); }; row.append(b); }
    if (choices.length) row.classList.add('part-causes');
    if (!blocked) {
      const labels = { screw: t('Отвёртка'), brush: t('Кисть'), clean: t('Спирт'), hand: t('Деталь'), paste: t('Термопаста'), belt: t('Ремень'), meter: t('Мультиметр'), solder: t('Паяльник') };
      for (const tool of tools) {
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', labels[tool]);
        const img = document.createElement('img'); img.src = `assets/ui/tools/${tool}.svg`; img.alt = '';
        const text = document.createElement('span'); text.textContent = labels[tool]; b.append(img, text); row.append(b);
        b.onclick = () => {
          selectTool(tool); row.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          if (tool !== required) { hint.textContent = t('Этот инструмент здесь не поможет. Посмотри на поверхность детали.'); place(); return; }
          row.replaceChildren();
          if (required === 'clean' || required === 'brush' || required === 'paste') {
            hint.textContent = t('Зажми и проведи по всей выделенной зоне. 0%');
            overlay = document.createElement('span'); overlay.className = 'repair-wipe'; overlay.setAttribute('aria-hidden', 'true');
            overlay.append(...Array.from({ length: 9 }, () => document.createElement('i'))); element.append(overlay);
            const visited = new Set();
            const wipe = e => {
              const cell = coverageCell(e.clientX, e.clientY, element.getBoundingClientRect());
              if (cell < 0) return;
              visited.add(cell); overlay.children[cell].classList.add('wiped');
              hint.textContent = t`Обработано ${Math.round(visited.size / 9 * 100)}%. Продолжай движение.`;
              if (visited.size >= 7) done();
            };
            element.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); dragging = true; element.setPointerCapture(e.pointerId); wipe(e); }, { signal });
            element.addEventListener('pointermove', e => { if (dragging) wipe(e); }, { signal });
            element.addEventListener('pointerup', () => { dragging = false; }, { signal });
            element.addEventListener('pointercancel', () => { dragging = false; }, { signal });
          } else if (required === 'screw') {
            hint.textContent = t('Удерживай отвёртку, пока винт не повернётся.');
            const hold = document.createElement('button'); hold.textContent = t('Удерживать отвёртку'); hold.className = 'part-gesture'; row.append(hold);
            hold.onpointerdown = e => { e.preventDefault(); hold.setPointerCapture(e.pointerId); hold.classList.add('holding'); timer = setTimeout(done, 700); };
            const cancel = () => { clearTimeout(timer); hold.classList.remove('holding'); };
            hold.onpointerup = cancel; hold.onpointercancel = cancel;
            hold.onclick = e => { if (e.detail === 0) done(); };
          } else if (['hand','belt'].includes(required) && /шлейф|провод|ремень|пассик|пружин|ribbon|wire|belt|spring/i.test(label)) {
            const spring = /пружин|spring/i.test(label);
            hint.textContent = spring ? t('Заведи пружину на три деления. После каждого поворота отпускай ключ.') : t('Проложи деталь по трём точкам слева направо. Зажми первую и проведи через остальные.');
            const track=document.createElement('div');track.className='repair-route';row.append(track);
            let reached=0;
            const nodes=Array.from({length:3},(_,i)=>{const node=document.createElement('button');node.type='button';node.textContent=spring?'↻':String(i+1);node.setAttribute('aria-label',spring?t`Повернуть ключ: деление ${i+1}`:t`Закрепить участок ${i+1}`);track.append(node);return node;});
            const advance=i=>{if(i!==reached)return;nodes[i].dataset.done='true';reached++;hint.textContent=`${spring?t('Поворотов'):t('Участков')}: ${reached}/3`;if(reached===3)done();};
            nodes.forEach((node,i)=>node.onclick=()=>advance(i));
            track.onpointerdown=e=>{if(spring)return;e.preventDefault();dragging=true;track.setPointerCapture(e.pointerId);nodes.forEach((node,i)=>{const r=node.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)advance(i);});};
            track.onpointermove=e=>{if(!dragging)return;nodes.forEach((node,i)=>{const r=node.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)advance(i);});};
            track.onpointerup=()=>{dragging=false;};track.onpointercancel=()=>{dragging=false;};
          } else {
            hint.textContent = alignment ? t('Сначала поверни деталь кнопкой «Повернуть ↻», пока метка ▲ не смотрит вверх. Потом зажми её и перетащи на подсвеченное место.') : t('Новая деталь — в этой карточке. Зажми «▣ Установить деталь» и перетащи на подсвеченное место устройства, затем отпусти.');
            ghost = document.createElement('button'); ghost.className = 'part-gesture'; ghost.textContent = t('▣ Установить деталь'); ghost.setAttribute('aria-label', t('Установить деталь')); row.append(ghost);
            let rotation = alignment ? 270 : 0;
            if (alignment) {
              ghost.textContent = '▲ ▣'; ghost.style.flex = '0 0 44px'; ghost.style.rotate = `${rotation}deg`;
              overlay = document.createElement('span'); overlay.className = 'socket-marker'; overlay.textContent = '▲'; overlay.setAttribute('aria-hidden', 'true'); element.append(overlay);
              const rotate = document.createElement('button'); rotate.textContent = t('Повернуть ↻'); rotate.onclick = () => { rotation = (rotation + 90) % 360; ghost.style.rotate = `${rotation}deg`; }; row.append(rotate);
            }
            let startX = 0, startY = 0;
            ghost.onpointerdown = e => { e.preventDefault(); startX = e.clientX; startY = e.clientY; ghost.setPointerCapture(e.pointerId); dragging = true; };
            ghost.onpointermove = e => { if (dragging) ghost.style.transform = `translate(${e.clientX - startX}px, ${e.clientY - startY}px)`; };
            ghost.onpointerup = e => { if (!dragging) return; dragging = false; if (partFits(rotation, coverageCell(e.clientX, e.clientY, element.getBoundingClientRect()))) done(); else { ghost.style.transform = ''; hint.textContent = rotation ? t('Метки не совпадают. Поверни деталь перед установкой.') : t('Совмести деталь с подсвеченным гнездом.'); } };
            ghost.onpointercancel = () => { dragging = false; ghost.style.transform = ''; };
            ghost.onclick = e => { if (e.detail === 0) { if (partFits(rotation, 0)) done(); else hint.textContent = t('Сначала поверни деталь меткой вверх.'); } };
          }
          if ((!alignment || required !== 'hand') && !(['hand','belt'].includes(required) && /шлейф|провод|ремень|пассик|пружин|ribbon|wire|belt|spring/i.test(label))) { const accessible = document.createElement('button'); accessible.className = 'keyboard-repair'; accessible.textContent = t('Выполнить с клавиатуры'); accessible.onclick = done; row.append(accessible); }
          place();
        };
      }
      if (magnify && zoom) { const b = document.createElement('button'); b.textContent = element.closest('.repair-magnified') ? t('Убрать лупу') : t('Лупа ×1.4'); b.onclick = () => { close(); zoom(); }; row.append(b); }
    }
    if (!blocked && tools.length === 1) row.firstElementChild?.click();
    place(); dismiss.focus({ preventScroll: true });
  }
  return { open, close, owns(element) { return element === activeElement; } };
}
