import { initialState, act, allFixes } from './game.js';
import { createMemoryUI } from './memory-ui.js';
import { memoryFor, memoryAvailable } from './memories.js';
import { CONTRACTS, completedOrders, nextContract, campaignProgress } from './campaign.js';
import { LETTER, SHELF, FINALE, seasonDone, currentChapter, shelfStatus, shelfLockReason } from './story.js';
import { createPartNavigator } from './repair-focus.js';
import { createRepairInteraction } from './repair-interaction.js';
import { workshopProgress, ownedDecorations, placedDecorations } from './workshop.js';
import { createWorkshopUI } from './workshop-ui.js';
import { clientFor, pickClient } from './stories.js';
import { DEVICES, viewSrc } from './devices.js';
import { deviceActions, targetState, diagnosisChoices } from './repair-ui.js';
import { startAmbience } from './ambience.js';
import { startCityLife } from './city-life.js';
import { createMusicPlayer } from './music-player.js';
import { createSoundEffects } from './sound-effects.js';
import { createCat } from './cat.js';
const $ = s => document.querySelector(s);
const KEY = 'workshop-stories-v1';
// Cloud copy is best-effort: the local save stays the source of truth and the game works offline.
let cloudTimer;
function saveToCloud(snapshot) { clearTimeout(cloudTimer); cloudTimer = setTimeout(() => { import('./supabase-client.js?v=2').then(m => m.saveProgress(snapshot)).catch(() => {}); }, 1500); }
let state = initialState();
try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved && ['intro','work','ending'].includes(saved.stage)) { state = { ...state, ...saved }; if (!Number.isSafeInteger(saved.coins) || saved.coins < 0) state.coins = saved.stage === 'ending' && !saved.upgrade ? 120 : 0; if (saved.cassetteDiagnosed === undefined && saved.order === 'cassette' && (saved.tapeClipFixed || saved.beltReplaced || saved.headCleaned)) state.cassetteDiagnosed = true; } } catch {}
// Earlier versions stored only counts; keep those repairs playable after upgrading.
if (state.open && state.screws === 0) state.screws = 4;
if (state.dustCleaned && state.dust === 0) state.dust = 3;
if (state.screws > 0 && !state.screwMask) state.screwMask = (1 << state.screws) - 1;
if (state.dust > 0 && !state.dustMask) state.dustMask = (1 << state.dust) - 1;
if (!state.order && state.stage !== 'intro') state.order = 'laptop';
if (state.stage === 'ending' && state.order && !completedOrders(state).includes(state.order)) { state.completedOrders = [...completedOrders(state), state.order]; state.jobsCompleted = Math.max(state.completedOrders.length, state.jobsCompleted || 0); }
let tool = 'inspect', menuOpen = true, shopOpen = false, shopReturnMenu = true, shopOpener;
const effects = createSoundEffects();
// Полноэкранный режим
$('#menu-fullscreen').onclick = async () => {
  effects.play('click');
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else note('Полноэкранный режим недоступен в этом браузере.');
  } catch { note('Не удалось включить полноэкранный режим.'); }
};
document.addEventListener('fullscreenchange',()=>document.body.classList.toggle('fullscreen',Boolean(document.fullscreenElement)));
// Contracts follow a curriculum; the player accepts the next one, not a catalogue entry.
function acceptNextContract() {
  if (state.stage === 'work') { menuOpen = false; render(); return; }
  const contract = nextContract(state), previous = state.order === contract.order ? state.client : null;
  state = { ...initialState(), ...workshopProgress(state) };
  document.querySelectorAll('.repair-magnified').forEach(el => el.classList.remove('repair-magnified'));
  tool = 'inspect'; menuOpen = false;
  $('#order-select').hidden = true;
  dispatch(DEVICES[contract.order] ? 'dev-accept' : ORDER_ACCEPT[contract.order], DEVICES[contract.order] ? { order: contract.order, client: pickClient(contract.order, previous) } : pickClient(contract.order, previous));
}
$('#menu-new-order').onclick = acceptNextContract;
$('#order-back-btn').onclick = () => { $('#order-select').hidden = true; };
// Выбор инструмента кассетного плеера
document.querySelectorAll('#bench-cassette [data-tool]').forEach(b => {
  b.onclick = () => {
    effects.play('tool');
    tool = b.dataset.tool;
    document.querySelectorAll('#bench-cassette [data-tool]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('#cassette-tool-name').textContent = `Выбран: ${b.querySelector('span').textContent.toLowerCase()}`;
  };
});
// Винты кассетного плеера
document.querySelectorAll('#bench-cassette [data-screw]').forEach(b => {
  b.onclick = () => {
    if (tool === 'screw') { effects.play('repair'); dispatch('cassette-screw', Number(b.dataset.screw)); }
    else note('Для винтов нужна отвёртка.');
  };
});
$('#cassette-load').onclick = () => { if (state.cScrews >= 3) { effects.play(); dispatch('cassette-cover'); } else note('Сначала открути все винты.'); };
$('#tape-clip').onclick = () => { effects.play('tool'); dispatch('cassette-tape'); };
$('#belt').onclick = () => { if(tool !== 'belt') { note('Выбери новый ремень среди инструментов.'); return; } effects.play(); dispatch('cassette-belt'); };
$('#head').onclick = () => { if(tool !== 'clean') { note('Для очистки головки выбери спирт.'); return; } effects.play('tool'); dispatch('cassette-head'); };
// Пульт
document.querySelectorAll('#bench-remote [data-tool]').forEach(b => {
  b.onclick = () => {
    effects.play('tool');
    tool = b.dataset.tool;
    document.querySelectorAll('#bench-remote [data-tool]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('#remote-tool-name').textContent = `Выбран: ${b.querySelector('span').textContent.toLowerCase()}`;
  };
});
document.querySelectorAll('#bench-remote [data-screw]').forEach(b => { b.onclick = () => { if (tool === 'screw') { effects.play('repair'); dispatch('remote-screw', Number(b.dataset.screw)); } else note('Для винтов нужна отвёртка.'); }; });
$('#remote-open').onclick = () => { if (tool === 'hand') { effects.play(); dispatch('remote-cover'); } else note('Панель снимается руками — выбери «Руки».'); };
document.querySelectorAll('#bench-remote [data-grime]').forEach(b => { b.onclick = () => { if (tool === 'clean') { effects.play('tool'); dispatch('remote-clean', Number(b.dataset.grime)); } else note('Липкий налёт снимается спиртом.'); }; });
$('#remote-keypad').onclick = () => { if (tool === 'clean') { effects.play('tool'); dispatch('remote-keypad'); } else note('Клавиатуру нужно протереть спиртом.'); };
// Preload the remote's states so swapping open/repaired views never flashes an empty mat.
for (const part of ['view-open', 'view-repaired', 'front-shell', 'keypad']) new Image().src = `assets/devices/remote/parts/${part}.png`;
// С инструментом «Осмотр» касание устройства осматривает его — так же, как кнопка «Осмотр» вверху.
// Перехват на стадии захвата, чтобы обработчики отдельных деталей не отвечали «нужна отвёртка».
for (const [device, action] of [['#cassette-device', 'cassette-inspect'], ['#remote-device', 'remote-inspect'], ['#dev-device', 'dev-inspect']]) {
  $(device).addEventListener('click', e => { if (tool !== 'inspect' || e.target.closest('button')) return; e.stopPropagation(); effects.play('tool'); dispatch(action); }, true);
}
const partInteraction = createRepairInteraction({ selectTool(value) { tool = value; document.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === value))); renderDevice(state); }, sound() { effects.play('repair'); } });
const ORDER_ACCEPT = { laptop: 'accept', cassette: 'cassette-accept', remote: 'remote-accept' };
const ACCEPT_ORDER = Object.fromEntries(Object.entries(ORDER_ACCEPT).map(([order, action]) => [action, order]));
// A part opens its own tool choices. The dock remains for global actions only.
function inspectAtPart(element, action, explanation) {
  closeRepairInstrument();
  dispatch(action);
  const choices = diagnosisChoices(state.order, DEVICES[state.order]).map(([id,label]) => ({ label, run: () => { const result = dispatch(id); const diagnosed = DEVICES[state.order] ? state.dev.diagnosed : state.order === 'remote' ? state.rDiagnosed : state.cassetteDiagnosed; if (!diagnosed) partInteraction.open({ element, label: 'Проверь другую причину', blocked: result.message, choices }); } }));
  partInteraction.open({ element, label: 'Что мешает устройству работать?', blocked: explanation || $('#message').textContent, choices });
}
document.addEventListener('click', e => {
  const element = e.target.closest('.bench:not([hidden]) .mat button');
  if (!element || state.stage !== 'work' || element.classList.contains('bench-cat') || element.classList.contains('story-mark') || element.classList.contains('device-memory-screen')) return;
  if (partInteraction.owns(element)) { e.preventDefault(); e.stopImmediatePropagation(); return; }
  // Откручивание — удержанием прямо на винте (см. startUnscrew); клавиатура (detail 0) откручивает сразу.
  if (element.matches('.screw') && !element.classList.contains('removed') && !screwState(state).assembling) { e.preventDefault(); e.stopImmediatePropagation(); if (e.detail === 0) unscrewNow(element); return; }
  let action, target, required, label = element.getAttribute('aria-label') || element.textContent;
  const cfg = DEVICES[state.order], d = state.dev;
  if (cfg) {
    if (element.matches('.screw')) {
      target = Number(element.dataset.screw); action = 'dev-screw'; required = 'screw';
      if (!d.assembling && (d.screwMask & (1 << target))) return;
      if (d.assembling && (d.screwMask & (1 << target))) { e.preventDefault(); e.stopImmediatePropagation(); screwHint(element); return; }
    } else if (element.matches('.dev-fix')) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (!d.diagnosed) { inspectAtPart(element, 'dev-inspect', cfg.inside); return; }
      const fix = allFixes(cfg, state.dev).find(f => f.id === element.dataset.fix);
      if (d.fixed.includes(fix.id)) return;
      action = 'dev-fix'; target = fix.id; required = fix.tool; label = fix.label;
      if (fix.after?.some(id => !d.fixed.includes(id))) { partInteraction.open({ element, label, blocked: fix.notReady || 'Сначала подготовь контакт.' }); return; }
    } else return;
  } else if (element.matches('[data-screw]')) {
    target = Number(element.dataset.screw); required = 'screw';
    if (screwState(state).assembling && element.classList.contains('removed')) { e.preventDefault(); e.stopImmediatePropagation(); screwHint(element); return; }
    action = state.order === 'laptop' ? 'screw' : state.order === 'cassette' ? 'cassette-screw' : 'remote-screw';
  } else if (state.order === 'remote' && element.matches('[data-grime],#remote-keypad')) {
    if (!state.rDiagnosed) { e.preventDefault(); e.stopImmediatePropagation(); inspectAtPart(element, 'remote-inspect'); return; }
    action = element.id === 'remote-keypad' ? 'remote-keypad' : 'remote-clean'; target = Number(element.dataset.grime); required = 'clean';
  } else if (state.order === 'cassette' && element.matches('#head,#belt,#tape-clip')) {
    if (!state.cassetteDiagnosed) { e.preventDefault(); e.stopImmediatePropagation(); inspectAtPart(element, 'cassette-inspect'); return; }
    action = element.id === 'head' ? 'cassette-head' : element.id === 'belt' ? 'cassette-belt' : 'cassette-tape';
    required = element.id === 'head' ? 'clean' : element.id === 'belt' ? 'belt' : 'hand';
  } else if (state.order === 'laptop' && element.matches('[data-dust],#wire,#radiator')) {
    action = element.matches('[data-dust]') ? 'clean' : element.id === 'wire' ? 'connect' : 'paste'; target = Number(element.dataset.dust); required = action === 'clean' ? 'brush' : action === 'paste' ? 'paste' : 'hand';
    if (action === 'paste' && !state.thermalChecked) dispatch('thermal');
  } else if (element.id === 'remote-open') { e.preventDefault(); e.stopImmediatePropagation(); tool = 'hand'; dispatch('remote-cover'); return; }
  else return;
  e.preventDefault(); e.stopImmediatePropagation();
  closeRepairInstrument();
  if (required === 'meter') { const fix = allFixes(cfg, state.dev).find(f => f.id === target); startMeter(element, label, fix, () => { effects.play('repair'); dispatch(action, target); }); return; }
  if (required === 'solder') { startSolder(element, label, () => { effects.play('repair'); dispatch(action, target); }); return; }
  const availableTools = cfg?.tools || [...$(benchFor(state.order)).querySelectorAll('[data-tool]')].map(b => b.dataset.tool);
  const tools = required === 'screw' ? ['screw'] : [...new Set([...availableTools, required])].filter(t => !['inspect','screw','meter','solder'].includes(t));
  partInteraction.open({ element, label, tools, required, alignment: required === 'hand' && (CONTRACTS.find(c => c.order === state.order)?.level || 1) >= 3, complete: () => dispatch(action, target), magnify: Boolean(state.upgrade), zoom: () => (cfg ? $('#dev-device') : $(state.order === 'laptop' ? '#device' : state.order === 'cassette' ? '#cassette-device' : '#remote-device')).classList.toggle('repair-magnified') });
}, true);
// Отвёртка: зажать винт — появляется отвёртка и кольцо прогресса, винт вращается; отпустил раньше — сброс.
const UNSCREW_MS = 900;
function unscrewNow(screw) { const { action } = screwState(state); if (!action) return; effects.play('repair'); dispatch(action === 'dev-screw' ? 'dev-screw' : action, Number(screw.dataset.screw)); }
function startUnscrew(screw, pointerId) {
  const r = screw.getBoundingClientRect(), driver = document.createElement('div');
  driver.className = 'driver'; driver.setAttribute('aria-hidden', 'true');
  driver.innerHTML = '<svg viewBox="0 0 48 48"><circle class="driver-track" cx="24" cy="24" r="20"/><circle class="driver-fill" cx="24" cy="24" r="20" pathLength="100"/></svg><img src="assets/ui/tools/screw.svg" alt="">';
  Object.assign(driver.style, { left: `${r.left + r.width / 2}px`, top: `${r.top + r.height / 2}px` });
  document.body.append(driver); effects.play('tool');
  const fill = driver.querySelector('.driver-fill'), started = performance.now();
  let frame = 0, done = false;
  const stop = () => { cancelAnimationFrame(frame); screw.style.rotate = ''; driver.classList.add('fade'); setTimeout(() => driver.remove(), 200); removeEventListener('pointerup', release, true); removeEventListener('pointercancel', release, true); };
  const release = () => { if (!done) { note('Отпустил слишком рано — держи, пока кольцо не заполнится.'); stop(); } };
  const tick = now => {
    const p = Math.min(1, (now - started) / UNSCREW_MS);
    fill.style.strokeDashoffset = String(100 - p * 100); screw.style.rotate = `${-p * 540}deg`; driver.style.rotate = `${-p * 540}deg`;
    if (p < 1) { frame = requestAnimationFrame(tick); return; }
    done = true; stop(); unscrewNow(screw);
  };
  addEventListener('pointerup', release, true); addEventListener('pointercancel', release, true);
  frame = requestAnimationFrame(tick);
}
document.addEventListener('pointerdown', e => {
  const screw = e.target.closest('.bench:not([hidden]) .mat .screw:not(.removed)');
  if (!screw || state.stage !== 'work' || screwState(state).assembling || e.button > 0) return;
  e.preventDefault(); e.stopPropagation(); startUnscrew(screw, e.pointerId);
}, true);
// Осмотр находки: вещь вылетает из устройства в центр экрана; её крутят пальцем/мышкой,
// переворачивают и читают надпись на обороте. Закрыли — вещь возвращается на место, история засчитана.
const FIND_NAMES = { note: 'Записка', photo: 'Фотография', ticket: 'Билет', coin: 'Монета', key: 'Ключик', flower: 'Засушенный цветок', drawing: 'Детский рисунок', ring: 'Колечко', button: 'Пуговица', letter: 'Письмо' };
function openFind(find, from) {
  closeRepairInstrument(); partInteraction.close();
  document.querySelector('.find-viewer')?.remove();
  const viewer = document.createElement('div'); viewer.className = 'find-viewer'; viewer.setAttribute('role', 'dialog'); viewer.setAttribute('aria-label', FIND_NAMES[find.kind] || 'Находка');
  viewer.innerHTML = `<p class="find-title">${FIND_NAMES[find.kind] || 'Находка'}</p><div class="find-stage"><div class="find-card"><div class="find-face find-front"><img src="assets/ui/finds/${find.kind}.svg" alt=""></div><div class="find-face find-back"><p></p></div></div></div><p class="find-hint">Потяни, чтобы повернуть · коснись, чтобы перевернуть</p><div class="find-buttons"><button type="button" class="find-flip">Перевернуть</button><button type="button" class="primary find-close">Положить обратно</button></div>`;
  viewer.querySelector('.find-back p').textContent = find.text;
  document.body.append(viewer);
  const card = viewer.querySelector('.find-card'), stage = viewer.querySelector('.find-stage');
  const fr = from.getBoundingClientRect(), cr = card.getBoundingClientRect();
  const fly = `translate(${fr.left + fr.width / 2 - (cr.left + cr.width / 2)}px, ${fr.top + fr.height / 2 - (cr.top + cr.height / 2)}px) scale(${fr.width / cr.width})`;
  let rx = -8, ry = 12, drag = null, moved = false;
  const pose = () => { card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`; };
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) card.animate([{ transform: fly, opacity: .6 }, { transform: `rotateX(${rx}deg) rotateY(${ry}deg)`, opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
  pose();
  stage.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY, rx, ry }; moved = false; try { stage.setPointerCapture(e.pointerId); } catch {} };
  stage.onpointermove = e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 4) moved = true; ry = drag.ry + dx * 0.7; rx = Math.max(-60, Math.min(60, drag.rx - dy * 0.4)); card.style.transition = 'none'; pose(); };
  stage.onpointerup = () => { if (drag && !moved) flip(); drag = null; card.style.transition = ''; };
  const flip = () => { effects.play('tool'); ry = Math.round((ry + 180) / 180) * 180; rx = 0; pose(); };
  viewer.querySelector('.find-flip').onclick = flip;
  viewer.querySelector('.find-close').onclick = () => {
    effects.play('click');
    const done = () => { viewer.remove(); dispatch('clue', 'find'); note(find.text); };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { done(); return; }
    viewer.classList.add('closing'); card.animate([{ transform: card.style.transform, opacity: 1 }, { transform: fly, opacity: .3 }], { duration: 380, easing: 'ease-in' }).onfinish = done;
  };
  viewer.querySelector('.find-close').focus({ preventScroll: true });
}
// Instruments own their listeners and animation frame until closed or the scene changes.
let closeInstrument = () => {};
function closeRepairInstrument() { closeInstrument(); closeInstrument = () => {}; }
function positionInstrument(panel, element) {
  panel.style.maxHeight = 'calc(100dvh - 16px)'; panel.style.overflowY = 'auto';
  const r = element.getBoundingClientRect(), p = panel.getBoundingClientRect();
  Object.assign(panel.style, { left: `${Math.max(8, Math.min(innerWidth - p.width - 8, r.left + r.width / 2 - p.width / 2))}px`, top: `${Math.max(8, Math.min(innerHeight - p.height - 8, r.top - p.height - 10))}px` });
}
function ownInstrument(close) {
  const escape = e => { if (e.key === 'Escape') closeRepairInstrument(); };
  closeInstrument = () => { window.removeEventListener('resize', closeRepairInstrument); document.removeEventListener('keydown', escape); close(); };
  window.addEventListener('resize', closeRepairInstrument); document.addEventListener('keydown', escape);
}
// Мультиметр: коснись дорожки щупами — целая показывает «0.0 Ω» и пищит, оборванная — «OL». Отметь обрыв.
function startMeter(element, label, fix, complete) {
  closeRepairInstrument(); partInteraction.close();
  const panel = document.createElement('section'); panel.className = 'part-context meter-panel'; panel.setAttribute('aria-label', label);
  const traces = Array.from({ length: fix.traces }, (_, i) => `<button type="button" class="meter-trace" data-i="${i}"><i></i><span>${i + 1}</span></button>`).join('');
  panel.innerHTML = `<strong>${label}: прозвонка</strong><button class="part-dismiss" aria-label="Закрыть">×</button><p role="status">Коснись дорожки щупами. Целая звенит и показывает ноль, оборванная — «OL».</p><div class="meter-row"><div class="meter-board">${traces}</div><div class="meter-device"><b class="meter-screen">— — —</b><img src="assets/ui/tools/meter.svg" alt=""></div></div><button type="button" class="part-gesture meter-mark" disabled>Отметить обрыв</button>`;
  document.body.append(panel);
  positionInstrument(panel, element);
  element.classList.add('part-selected');
  const hint = panel.querySelector('p'), screen = panel.querySelector('.meter-screen'), mark = panel.querySelector('.meter-mark');
  let picked = null;
  const close = () => { panel.remove(); element.classList.remove('part-selected'); };
  ownInstrument(close);
  panel.querySelector('.part-dismiss').onclick = closeRepairInstrument;
  panel.querySelectorAll('.meter-trace').forEach(b => b.onclick = () => {
    picked = Number(b.dataset.i); const open = picked === fix.broken;
    panel.querySelectorAll('.meter-trace').forEach(x => x.classList.toggle('probed', x === b));
    b.classList.add(open ? 'measured-open' : 'measured-ok');
    screen.textContent = open ? 'OL' : '0.0 Ω'; screen.classList.toggle('open', open);
    effects.play(open ? 'click' : 'tool');
    mark.disabled = false; mark.textContent = `Отметить обрыв на дорожке ${picked + 1}`;
  });
  mark.onclick = () => {
    if (picked === fix.broken) { closeRepairInstrument(); complete(); return; }
    dispatch('dev-slip', `Дорожка ${picked + 1} целая — прибор показывал ноль. Ищи ту, где «OL».`);
    hint.textContent = 'Эта дорожка звонится. Обрыв там, где прибор показывает «OL».';
  };
}
// Пайка: держишь паяльник — температура растёт; отпусти в зелёной зоне. Рано — припой не взялся, перегрел — промах.
const SOLDER = { heatMs: 1700, cool: 0.0012, zone: [0.62, 0.82] };
function startSolder(element, label, complete) {
  closeRepairInstrument(); partInteraction.close();
  const panel = document.createElement('section'); panel.className = 'part-context solder-panel'; panel.setAttribute('aria-label', label);
  panel.innerHTML = `<strong>${label}: пайка</strong><button class="part-dismiss" aria-label="Закрыть">×</button><p role="status">Зажми паяльник и отпусти, когда стрелка в зелёной зоне.</p><div class="solder-row"><div class="solder-gauge"><i class="solder-zone"></i><i class="solder-level"></i></div><button class="part-gesture solder-hold"><img src="assets/ui/tools/solder.svg" alt="">Держать паяльник</button></div>`;
  document.body.append(panel);
  positionInstrument(panel, element);
  element.classList.add('part-selected');
  const hint = panel.querySelector('p'), level = panel.querySelector('.solder-level'), hold = panel.querySelector('.solder-hold');
  let heat = 0, holding = false, last = performance.now(), frame = 0;
  const close = () => { cancelAnimationFrame(frame); panel.remove(); element.classList.remove('part-selected'); };
  ownInstrument(close);
  panel.querySelector('.part-dismiss').onclick = closeRepairInstrument;
  const tick = now => {
    const dt = now - last; last = now;
    heat = holding ? heat + dt / SOLDER.heatMs : Math.max(0, heat - dt * SOLDER.cool);
    if (heat >= 1) { holding = false; heat = 0.35; hold.classList.remove('holding'); effects.play('click'); dispatch('dev-slip', 'Перегрел — плата потемнела у контакта. Дай остыть и попробуй ещё раз.'); hint.textContent = 'Перегрев! Отпускай раньше — в зелёной зоне.'; }
    level.style.height = `${Math.min(1, heat) * 100}%`; level.classList.toggle('hot', heat > SOLDER.zone[1]); level.classList.toggle('ok', heat >= SOLDER.zone[0] && heat <= SOLDER.zone[1]);
    frame = requestAnimationFrame(tick);
  };
  hold.onpointerdown = e => { e.preventDefault(); try { hold.setPointerCapture(e.pointerId); } catch {} holding = true; hold.classList.add('holding'); };
  hold.onpointerup = () => {
    if (!holding) return; holding = false; hold.classList.remove('holding');
    if (heat >= SOLDER.zone[0] && heat <= SOLDER.zone[1]) { closeRepairInstrument(); complete(); }
    else hint.textContent = 'Припой ещё не расплавился — держи дольше.';
  };
  hold.onpointercancel = () => { holding = false; hold.classList.remove('holding'); };
  hold.onclick = e => { if (e.detail === 0) { closeRepairInstrument(); complete(); } }; // клавиатура: без мини-игры
  frame = requestAnimationFrame(tick);
}
function screwHint(element) {
  note('Зажми винт на столе и перетащи его в это отверстие.');
  partInteraction.open({ element, label: 'Отверстие ждёт винт', blocked: 'Винт лежит на столе рядом с техникой. Зажми его мышкой или пальцем и перетащи сюда — он закрутится.' + (DEVICES[state.order]?.screws.some(x => x[2]) ? ' Винты разной длины: подбери подходящий.' : '') });
}
// Следы истории рисуются на закрытом корпусе; при открытии корпуса они скрываются вместе с ним.
const MARK_HOSTS = { laptop: '#lid', cassette: '#cassette-body', remote: '#remote-body' };
let marksKey = '';
function renderMarks(s) {
  const client = s.stage === 'work' ? clientFor(s.order, s.client) : null, key = client ? `${s.order}:${client.id}` : '';
  if (key !== marksKey) {
    marksKey = key;
    document.querySelectorAll('.story-mark').forEach(m => m.remove());
    for (const mark of client?.marks || []) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'story-mark'; b.dataset.clue = mark.id;
      b.setAttribute('aria-label', 'След на корпусе — рассмотреть');
      Object.assign(b.style, { left: `${mark.x}%`, top: `${mark.y}%`, width: `${mark.size}%` });
      b.innerHTML = `<img src="assets/ui/marks/${mark.kind}.svg" alt="">`;
      b.onclick = e => {
        e.stopPropagation();
        if (tool !== 'inspect') { note('Присмотрись к этому следу — выбери «Осмотр».'); return; }
        effects.play('tool'); dispatch('clue', mark.id); note(mark.text);
      };
      $(MARK_HOSTS[s.order] || '#dev-body').append(b);
    }
  }
  document.querySelectorAll('.story-mark').forEach(b => b.classList.toggle('found', s.clues.includes(b.dataset.clue)));
}
// Снятые винты лежат в лотке на коврике: видно, сколько снято и что их нужно вернуть.
const TRAYS = { laptop: ['#bench-laptop', 4, 'screwMask'], cassette: ['#bench-cassette', 3, 'cScrewMask'], remote: ['#bench-remote', 3, 'rScrewMask'] };
for (const [order, [bench, count]] of Object.entries(TRAYS)) {
  const tray = document.createElement('div'); tray.className = `screw-tray tray-${order}`; tray.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < count; i++) tray.append(document.createElement('i'));
  $(`${bench} .mat`).append(tray);
}
const devTray = document.createElement('div'); devTray.className = 'screw-tray tray-device'; devTray.setAttribute('aria-hidden', 'true'); $('#bench-device .mat').append(devTray);
// Открученный винт ложится на коврик рядом со своим отверстием (всегда в видимой части стола),
// при закручивании улетает обратно в отверстие, а когда заказ сдан — убирается со стола.
const looseScrews = new Map();
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function renderLooseScrews(s) {
  const bench = !menuOpen && s.stage === 'work' ? $(benchFor(s.order)) : null, mat = bench?.querySelector('.mat');
  const live = new Set();
  if (mat) {
    const m = mat.getBoundingClientRect(), device = mat.querySelector('[id$="device"]')?.getBoundingClientRect();
    const pct = (x, y) => [(x - m.left) / m.width * 100, (y - m.top) / m.height * 100];
    mat.querySelectorAll('.screw').forEach(btn => {
      const key = `${s.order}:${btn.closest('[id]').id}:${btn.dataset.screw}`, r = btn.getBoundingClientRect(), shown = r.width > 0;
      let item = looseScrews.get(key);
      if (btn.classList.contains('removed')) {
        live.add(key);
        if (item || !shown) return;
        const [hx, hy] = pct(r.left + r.width / 2, r.top + r.height / 2);
        const [cx, cy] = device ? pct(device.left + device.width / 2, device.top + device.height / 2) : [50, 60];
        const len = Math.hypot(hx - cx, hy - cy) || 1;
        // Отлетает наружу от центра устройства на ~8% коврика, но не за край видимой части стола.
        let rx = hx + (hx - cx) / len * 8, ry = clamp(hy + (hy - cy) / len * 4, 40, 84);
        // Винт должен лечь рядом с корпусом, а не на нём: выносим за ближайший боковой край устройства.
        if (device) { const [dl] = pct(device.left, 0), [dr] = pct(device.right, 0); if (rx > dl - 3 && rx < dr + 3) rx = hx < cx ? dl - 4 - Math.random() * 3 : dr + 4 + Math.random() * 3; }
        rx = clamp(rx, 5, 95);
        item = document.createElement('i'); item.className = 'loose-screw';
        Object.assign(item.style, { left: `${rx}%`, top: `${ry}%`, '--from-x': `${(hx - rx) / 100 * m.width}px`, '--from-y': `${(hy - ry) / 100 * m.height}px`, '--turn': `${Math.round(Math.random() * 120 - 60)}deg` });
        // Размер винта (devices.js): длинные и короткие видно на столе, при сборке их берут в руку.
        const size = btn.closest('#dev-body') && DEVICES[s.order]?.screws[Number(btn.dataset.screw)]?.[2];
        if (size) { item.dataset.size = size; item.classList.add(`size-${size}`); }
        item.setAttribute('role', 'button'); item.setAttribute('aria-label', size ? (size === 'long' ? 'Длинный винт' : 'Короткий винт') : 'Винт');
        item.addEventListener('keydown', event => {
          if (!['Enter',' '].includes(event.key) || !item.classList.contains('pickable')) return;
          event.preventDefault();
          const hole = [...mat.querySelectorAll('.screw.removed')].find(h => !size || DEVICES[state.order]?.screws[Number(h.dataset.screw)]?.[2] === size);
          if (!hole) return;
          const { action } = screwState(state);
          if (size) dispatch('dev-pick', size);
          effects.play('repair'); dispatch(action, Number(hole.dataset.screw));
        });
        makeDraggable(item, mat);
        mat.append(item); looseScrews.set(key, item);
      } else if (item && shown) {
        // Закрутили: винт летит обратно в своё отверстие.
        const hr = item.getBoundingClientRect();
        item.style.setProperty('--back-x', `${r.left + r.width / 2 - (hr.left + hr.width / 2)}px`);
        item.style.setProperty('--back-y', `${r.top + r.height / 2 - (hr.top + hr.height / 2)}px`);
        item.classList.remove('pickable'); item.classList.add('returning'); item.setAttribute('aria-hidden', 'true'); item.tabIndex = -1; looseScrews.delete(key); setTimeout(() => item.remove(), 400);
      } else if (item) live.add(key);
    });
  }
  for (const [key, item] of looseScrews) if (!live.has(key)) { item.remove(); looseScrews.delete(key); }
  // Пока корпус собирают, винты на столе можно перетаскивать, а снятые отверстия ждут винт.
  const { assembling } = screwState(s);
  for (const item of looseScrews.values()) { item.classList.toggle('pickable', assembling); item.classList.remove('held'); item.tabIndex = assembling ? 0 : -1; item.setAttribute('aria-disabled', String(!assembling)); }
  bench?.querySelectorAll('.mat .screw').forEach(b => b.classList.toggle('awaiting', assembling && b.classList.contains('removed')));
}
// Состояние винтов текущего заказа: идёт ли сборка и какое действие закручивает винт.
function screwState(s) {
  if (DEVICES[s.order] && s.dev) return { assembling: s.dev.assembling, action: 'dev-screw' };
  if (s.order === 'laptop') return { assembling: s.assembling, action: 'screw' };
  if (s.order === 'cassette') return { assembling: s.cassetteAssembling, action: 'cassette-screw' };
  if (s.order === 'remote') return { assembling: s.rAssembling, action: 'remote-screw' };
  return { assembling: false };
}
// Перетаскивание: зажать винт мышкой или пальцем, отнести к отверстию, отпустить — винт закручивается.
function makeDraggable(item, mat) {
  let start = null, target = null;
  const holeAt = (x, y) => [...mat.querySelectorAll('.screw.removed')].find(h => { const r = h.getBoundingClientRect(); return r.width && x > r.left - 14 && x < r.right + 14 && y > r.top - 14 && y < r.bottom + 14; });
  const reset = () => { item.classList.remove('dragging'); item.style.translate = ''; target?.classList.remove('drop-target'); target = null; start = null; };
  item.addEventListener('pointerdown', e => {
    if (!item.classList.contains('pickable')) { note('Винт понадобится, когда закроешь корпус.'); return; }
    e.preventDefault(); e.stopPropagation(); try { item.setPointerCapture(e.pointerId); } catch {}
    start = { x: e.clientX, y: e.clientY }; item.classList.add('dragging'); effects.play('tool');
  });
  item.addEventListener('pointermove', e => {
    if (!start) return;
    item.style.translate = `${e.clientX - start.x}px ${e.clientY - start.y}px`;
    const hole = holeAt(e.clientX, e.clientY);
    if (hole !== target) { target?.classList.remove('drop-target'); target = hole; target?.classList.add('drop-target'); }
  });
  item.addEventListener('pointerup', e => {
    if (!start) return;
    const hole = holeAt(e.clientX, e.clientY), { action } = screwState(state);
    if (!hole || !action) { const distance = Math.hypot(e.clientX - start.x, e.clientY - start.y); reset(); if (distance < 6) note('Зажми винт и перетащи его к подсвеченному отверстию.'); return; }
    const holeKey = `${state.order}:${hole.closest('[id]').id}:${hole.dataset.screw}`, myKey = [...looseScrews].find(([, v]) => v === item)?.[0];
    // Винт попал не в «своё» отверстие: меняем привязку, чтобы на столе остался винт для другого отверстия.
    if (myKey && myKey !== holeKey && looseScrews.has(holeKey)) { const other = looseScrews.get(holeKey); looseScrews.set(holeKey, item); looseScrews.set(myKey, other); }
    target?.classList.remove('drop-target'); target = null; start = null; item.classList.remove('dragging');
    const index = Number(hole.dataset.screw), maskBefore = JSON.stringify(state.dev?.screwMask ?? state.screwMask ?? state.cScrewMask ?? state.rScrewMask);
    effects.play('repair');
    if (action === 'dev-screw' && item.dataset.size) dispatch('dev-pick', item.dataset.size);
    dispatch(action, index);
    // Не подошёл (не тот размер): винт возвращается на стол.
    if (JSON.stringify(state.dev?.screwMask ?? state.screwMask ?? state.cScrewMask ?? state.rScrewMask) === maskBefore) item.style.translate = '';
  });
  item.addEventListener('pointercancel', reset);
}
function renderTrays(s) {
  if (DEVICES[s.order] && s.dev) {
    const count = DEVICES[s.order].screws.length;
    if (devTray.children.length !== count) devTray.replaceChildren(...Array.from({ length: count }, () => document.createElement('i')));
    devTray.querySelectorAll('i').forEach((slot, i) => slot.classList.toggle('on', Boolean(s.dev.screwMask & (1 << i))));
  }
  for (const [order, [bench, , maskKey]] of Object.entries(TRAYS)) $(`${bench} .screw-tray`).querySelectorAll('i').forEach((slot, i) => slot.classList.toggle('on', Boolean(s[maskKey] & (1 << i))));
}
const BENCHES = { laptop: '#bench-laptop', cassette: '#bench-cassette', remote: '#bench-remote' };
const benchFor = order => BENCHES[order] || (DEVICES[order] ? '#bench-device' : BENCHES.laptop);
const TOOL_LABELS = { meter: 'Мультиметр', solder: 'Паяльник', inspect: 'Осмотр', screw: 'Отвёртка', clean: 'Спирт', hand: 'Руки', brush: 'Кисть', paste: 'Термопаста', belt: 'Ремень' };
const MAT_RATIO = 1681 / 936; // высота коврика к ширине
let devBuilt = '';
// Точка ремонта; для скрытой поломки добавляется, когда её обнаружила проверка.
function fixButton(f) {
    const b = document.createElement('button'); b.className = 'dev-fix'; b.dataset.fix = f.id; b.title = f.label; b.setAttribute('aria-label', f.label);
    Object.assign(b.style, { left: `${f.x}%`, top: `${f.y}%`, width: `max(44px, ${f.width || 18}%)`, height: `max(44px, ${f.height || 18}%)` });
    b.onclick = () => { if (!state.dev.diagnosed) { dispatch('dev-fix', f.id); return; } if (tool !== f.tool) { note(`${f.label}: здесь нужен инструмент «${TOOL_LABELS[f.tool]}».`); return; } effects.play('tool'); dispatch('dev-fix', f.id); };
  return b;
}
function buildDevice(order) {
  const cfg = DEVICES[order], [w, h] = cfg.size, box = $('#dev-device'), body = $('#dev-body');
  devBuilt = order;
  Object.assign(box.style, { height: `${cfg.height}%`, width: `${cfg.height * MAT_RATIO * w / h}%`, top: `${cfg.top}%` });
  box.classList.remove('is-magnified');
  $('#dev-inside').style.backgroundImage = `url('${viewSrc(order, 'open')}')`;
  for (const view of ['open', 'repaired']) new Image().src = viewSrc(order, view);
  body.querySelectorAll('.screw').forEach(b => b.remove());
  cfg.screws.forEach(([x, y], i) => {
    const b = document.createElement('button'); b.className = 'screw'; b.dataset.screw = i; b.textContent = '✚'; b.setAttribute('aria-label', `Винт корпуса ${i + 1}`);
    Object.assign(b.style, { left: `calc(${x}% - 22px)`, top: `calc(${y}% - 22px)` });
    b.onclick = () => { if (tool === 'screw') { effects.play('repair'); dispatch('dev-screw', i); } else note('Для винтов нужна отвёртка.'); };
    body.prepend(b);
  });
  $('#dev-inside').replaceChildren(...cfg.fixes.map(fixButton));
  tool = 'inspect';
  $('#dev-tools').replaceChildren(...cfg.tools.map(t => {
    const b = document.createElement('button'); b.dataset.tool = t; b.setAttribute('aria-pressed', String(t === 'inspect'));
    b.innerHTML = `<img class="tool-icon" src="assets/ui/tools/${t}.svg" alt=""><span>${TOOL_LABELS[t]}</span>`;
    b.onclick = () => { effects.play('tool'); tool = t; $('#dev-tools').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderDevice(state); };
    return b;
  }));
}
function renderDevice(s) {
  if (!DEVICES[s.order] || !s.dev) return;
  if (devBuilt !== s.order) buildDevice(s.order);
  const cfg = DEVICES[s.order], d = s.dev, box = $('#dev-device');
  // Finds belong to their own tray, never to the repair hit area.
  const mat = $('#bench-device .mat'), find = clientFor(s.order, s.client)?.find;
  let tray = mat.querySelector('.find-tray');
  if (!tray) { tray = document.createElement('div'); tray.className = 'find-tray'; tray.innerHTML = '<small>НАХОДКА</small>'; mat.append(tray); }
  let found = tray.querySelector('.inside-find');
  if (found?.dataset.client !== s.client) { found?.remove(); found = null; }
  if (find && !found) {
    found = document.createElement('button'); found.type = 'button'; found.className = `inside-find find-${find.kind}`;
    const icon = document.createElement('img'); icon.src = `assets/ui/finds/${find.kind}.svg`; icon.alt = ''; found.append(icon);
    found.dataset.client = s.client; found.setAttribute('aria-label','Находка на коврике: осмотреть');
    found.onclick = event => { event.stopPropagation(); effects.play('tool'); openFind(find,found); }; tray.append(found);
  }
  tray.hidden = !find || s.stage !== 'work' || (!d.open && !s.clues.includes('find'));
  if (found) found.classList.toggle('found',s.clues.includes('find'));
  $('#dev-tools').hidden = d.open && d.inside && !d.diagnosed;
  box.classList.toggle('is-open', d.open); box.classList.toggle('diagnosed', d.diagnosed); box.classList.toggle('assembling', d.assembling);
  $('#dev-body').style.backgroundImage = `url('${viewSrc(s.order, d.repaired ? 'repaired' : 'closed')}')`;
  $('#dev-open').hidden = d.open || d.assembling || d.screwMask !== (1 << cfg.screws.length) - 1;
  $('#dev-body').querySelectorAll('.screw').forEach(b => { const removed = Boolean(d.screwMask & (1 << Number(b.dataset.screw))); b.classList.toggle('removed', removed); b.setAttribute('aria-label', `Винт корпуса ${Number(b.dataset.screw) + 1}${removed ? ', снят' : ', установлен'}`); });
  if (cfg.hidden && d.hiddenFound && !$(`#dev-inside [data-fix="${cfg.hidden.fix.id}"]`)) $('#dev-inside').append(fixButton(cfg.hidden.fix));
  const selected = partNavigator.render(s, allFixes(cfg,d), d.open && s.stage === 'work' && !$('#bench-device').hidden);
  $('#dev-inside').querySelectorAll('.dev-fix').forEach(b => { b.hidden = b.dataset.fix !== selected; const fix = allFixes(cfg, d).find(f => f.id === b.dataset.fix), status = targetState(d, fix, tool); b.dataset.state = status; b.dataset.label = fix.label; b.classList.toggle('done', status === 'done'); b.disabled = status === 'done'; b.setAttribute('aria-label', `${fix.label}${status === 'done' ? ', готово' : status === 'ready' ? ', можно выполнить' : ''}`); });
}
const partNavigator = createPartNavigator($('#bench-device'), {
  change() { closeRepairInstrument(); partInteraction.close(); render(); },
  open(id) { $(`#dev-inside [data-fix="${id}"]`)?.click(); },
  assemble() { dispatch('dev-cover'); },
});
$('#dev-open').onclick = () => { effects.play(); dispatch('dev-cover'); };
function fitDeviceAboveDock() {
  if (!DEVICES[state.order] || $('#bench-device').hidden) return;
  const cfg = DEVICES[state.order], mat = $('#bench-device .mat').getBoundingClientRect();
  if (!mat.height) return;
  const bottom = ($('#bench-device .dock').getBoundingClientRect().top - mat.top) / mat.height * 100 - 2;
  const focused = state.dev?.open;
  const deviceTop = Math.max(focused ? 52 : 47, cfg.top);
  const desired = focused ? Math.max(cfg.height,32) : cfg.height;
  const aspect = MAT_RATIO * cfg.size[0] / cfg.size[1];
  const height = Math.min(desired, 64 / aspect, Math.max(14, bottom - deviceTop));
  const top = Math.min(deviceTop, bottom - height);
  Object.assign($('#dev-device').style, { top: `${top}%`, height: `${height}%`, width: `${height * aspect}%` });
  partNavigator.position($('#dev-device'));
  const tray = $('#bench-device .find-tray'), device = $('#dev-device').getBoundingClientRect();
  if (tray && !tray.hidden) Object.assign(tray.style,{left:`${Math.max(4,device.left-mat.left-60)}px`,top:`${Math.max(40,device.top-mat.top-8)}px`});
}
new ResizeObserver(fitDeviceAboveDock).observe($('#bench-device'));

const campaignNote = document.createElement('p'); campaignNote.className = 'campaign-note'; $('.panel').append(campaignNote);
const storyToggle = document.createElement('button');
storyToggle.type = 'button'; storyToggle.className = 'story-toggle'; storyToggle.textContent = 'История'; storyToggle.setAttribute('aria-expanded', 'false'); storyToggle.setAttribute('aria-controls', 'story');
storyToggle.onclick = () => { const open = $('.panel').classList.toggle('story-open'); storyToggle.setAttribute('aria-expanded', String(open)); };
const coinCounter = document.createElement('span'); coinCounter.className = 'coin-counter'; coinCounter.setAttribute('aria-label', 'Монеты');
coinCounter.innerHTML = '<img src="assets/ui/coin.svg" alt=""><b>0</b>';
$('.panel-top').append(coinCounter, storyToggle);
const backMenu = document.createElement('button'); backMenu.type='button'; backMenu.className='back-menu'; backMenu.textContent='☰'; backMenu.setAttribute('aria-label','Главное меню'); backMenu.title='Главное меню';
backMenu.onclick=()=>{partInteraction.close();effects.play();menuOpen=true;render();};
$('.panel .bottom').prepend(backMenu);
// Всё управление — в нижней панели, чтобы окно и комната сверху были открыты.
for (const bench of document.querySelectorAll('.bench')) { const dock = document.createElement('div'); dock.className = 'dock'; dock.append(bench.querySelector('.bench-message'), bench.querySelector('.tools')); bench.append(dock); }
const benchCats = { 'bench-cat': createCat($('#bench-cat')), 'bench-cat-cassette': createCat($('#bench-cat-cassette')), 'bench-cat-remote': createCat($('#bench-cat-remote')) };
const CAT_BY_ORDER = { laptop: 'bench-cat', cassette: 'bench-cat-cassette', remote: 'bench-cat-remote' };
benchCats['bench-cat-device'] = createCat($('#bench-cat-device'));
// Only the cat on the visible bench runs its animation loop.
function syncCats() { const work = !menuOpen && state.stage === 'work' && !document.hidden; for (const [order, id] of Object.entries(CAT_BY_ORDER)) benchCats[id].setActive(work && state.order === order); benchCats['bench-cat-device'].setActive(work && Boolean(DEVICES[state.order])); }
let soundOn = false;
const music = createMusicPlayer(()=>{ soundOn=false;updateSoundButton();note('Не удалось воспроизвести музыку. Попробуй включить её ещё раз.'); });
const workshopUI = createWorkshopUI({ getState: () => state, purchase: id => dispatch('buy-decoration', id), close: closeWorkshop });
function openWorkshop() {
  partInteraction.close();
  shopOpener = document.activeElement; shopReturnMenu = menuOpen; menuOpen = true; shopOpen = true;
  render(); workshopUI.focus();
}
function closeWorkshop() {
  shopOpen = false; menuOpen = shopReturnMenu; render();
  (shopOpener?.isConnected ? shopOpener : menuOpen ? $('#menu-shop') : backMenu).focus();
}
$('#menu-shop').onclick = () => { effects.play('click'); openWorkshop(); };

const memoryUI = createMemoryUI({ getState: () => state, dispatch, sound: name => effects.play(name), afterRead() { if (state.stage === 'ending' && !menuOpen) showEndingDialogue(); } });
function render() {
  if (menuOpen) { closeRepairInstrument(); partInteraction.close(); $('#dialog').hidden = true; }
  const s = state; $('#base').classList.toggle('open', s.open); $('#fan').classList.toggle('clean', s.dustCleaned); $('#connector').classList.toggle('connected', s.fanConnected);
  music.setMode(!menuOpen && s.stage === 'work' ? 'game' : 'menu');
  effects.setWorkshop(!menuOpen && s.stage === 'work');
  $('#main-menu').hidden = !menuOpen || shopOpen;
  $('#workshop-shop').hidden = !shopOpen;
  workshopUI.render();
  const hasBed = ownedDecorations(s).includes('bed');
  Object.values(benchCats).forEach(cat => cat.setBed(hasBed));
  $('#menu-balance').innerHTML = `<img src="assets/ui/coin.svg" alt="">${s.coins} монет`;
  if (!coinFlight) coinCounter.querySelector('b').textContent = s.coins;
  document.body.classList.toggle('lamp-upgraded', s.upgrade);
  document.body.dataset.room = placedDecorations(s).join(' ');  // пар над кружкой и свет лампы — только когда они куплены
  $('#menu-continue').textContent = s.stage === 'work' ? 'Продолжить ремонт' : 'Принять заказ';
  $('#menu-new-order').hidden = true;
  const current = s.stage === 'work' && CONTRACTS.find(c => c.order === s.order), next = current || nextContract(s), done = completedOrders(s).length;
  // Заказ с полки «НЕ ГОТОВО» не входит в кампанию — в меню пишем его, а не следующий обычный заказ.
  const shelfItem = s.stage === 'work' && s.shelf && SHELF.find(i => i.id === s.shelf);
  campaignNote.textContent = shelfItem ? `Истории: ${done}/${CONTRACTS.length} · В работе: ${shelfItem.name.toLowerCase()} с полки «НЕ ГОТОВО» ${shelfItem.tag}` : `Истории: ${done}/${CONTRACTS.length} · ${current ? 'В работе' : 'Далее'}: ${next.name} · Сложность ${next.level}/5. ${next.lesson}`;
  $('#menu-campaign').textContent = campaignNote.textContent;
  $('.panel').hidden = menuOpen;
  $('#bench-laptop').hidden = menuOpen || !['work','ending'].includes(s.stage) || s.order !== 'laptop';
  $('#bench-cassette').hidden = menuOpen || !['work','ending'].includes(s.stage) || s.order !== 'cassette';
  $('#bench-remote').hidden = menuOpen || !['work','ending'].includes(s.stage) || s.order !== 'remote';
  $('#bench-device').hidden = menuOpen || !['work','ending'].includes(s.stage) || !DEVICES[s.order];
  renderDevice(s);
  if (s.order === 'laptop') { $('#device').classList.toggle('is-open', s.open); }
  if (s.order === 'cassette') { $('#cassette-device').classList.toggle('is-open', s.cassetteOpen); }
  if (s.order === 'remote') {
    $('#remote-device').classList.toggle('is-open', s.rOpen); $('#remote-device').classList.toggle('repaired', s.rRepaired); $('.mat-remote').classList.toggle('open', s.rOpen);
    $('#remote-open').hidden = s.rOpen || s.rAssembling || s.rScrewMask !== 7;
    document.querySelectorAll('#bench-remote [data-screw]').forEach(b => { const removed = Boolean(s.rScrewMask & (1 << Number(b.dataset.screw))); b.classList.toggle('removed', removed); b.setAttribute('aria-label', `Винт корпуса ${Number(b.dataset.screw)+1}${removed ? ', снят' : ''}`); });
    document.querySelectorAll('#bench-remote [data-grime]').forEach(b => { const removed = Boolean(s.rGrimeMask & (1 << Number(b.dataset.grime))); b.classList.toggle('removed', removed); b.disabled = removed; });
    $('#remote-keypad').classList.toggle('clean', s.rKeypadClean);
  }
  $('.scene').hidden = menuOpen || ['work','ending'].includes(s.stage);
  document.querySelectorAll('.bench').forEach(bench => { bench.dataset.complete = String(s.stage === 'ending'); bench.querySelector('.mat').inert = false; bench.querySelectorAll('.mat button:not(.device-memory-screen)').forEach(button => { button.inert = s.stage === 'ending'; }); });
  if (['work','ending'].includes(s.stage)) {
    const bench = $(benchFor(s.order));
    bench.querySelector('.dock').prepend($('.panel'));
  } else $('.app').insertBefore($('.panel'), $('footer'));
  storyToggle.hidden = s.stage !== 'work';
  backMenu.hidden = menuOpen;
  document.querySelectorAll('#bench-laptop [data-screw]').forEach(b => { b.classList.toggle('removed', Boolean(s.screwMask & (1 << Number(b.dataset.screw)))); b.setAttribute('aria-label', `Винт ${Number(b.dataset.screw)+1}${s.screwMask & (1 << Number(b.dataset.screw)) ? ', снят' : ''}`); });
  document.querySelectorAll('#bench-laptop [data-dust]').forEach(b => { const removed=Boolean(s.dustMask & (1 << Number(b.dataset.dust)));b.classList.toggle('removed',removed);b.disabled=removed; });
  document.querySelectorAll('#bench-cassette [data-screw]').forEach(b=>{const removed=Boolean(s.cScrewMask & (1 << Number(b.dataset.screw)));b.classList.toggle('removed',removed);b.setAttribute('aria-label',`Винт корпуса ${Number(b.dataset.screw)+1}${removed?', снят':''}`);});
  $('#belt').classList.toggle('connected',s.beltReplaced);$('#head').classList.toggle('connected',s.headCleaned);$('#tape-clip').classList.toggle('connected',s.tapeClipFixed);
  $('#wire').classList.toggle('connected', s.fanConnected); $('#radiator').classList.toggle('fixed', s.paste); $('.fan-art').classList.toggle('clean', s.dustCleaned);
  $('#display').textContent = s.repaired ? 'ПРОВЕРКА ПРОЙДЕНА' : s.poweredOff ? 'ПИТАНИЕ ОТКЛЮЧЕНО' : s.tested ? 'ТЕМПЕРАТУРА: ВЫСОКАЯ' : 'ОЖИДАНИЕ';
  const client = clientFor(s.order, s.client);
  $('#heading').textContent = client ? `${client.name} · ${client.title}` : s.stage === 'ending' ? 'История продолжается' : s.order === 'cassette' ? 'Музыка на плёнке' : s.order === 'remote' ? 'Вечер у телевизора' : 'Письма из прошлого';
  $('#story').textContent = client ? [s.stage === 'ending' ? client.ending : client.intro, ...[...client.marks, ...(client.find ? [client.find] : [])].filter(m => s.clues.includes(m.id)).map(m => `• ${m.text}`), ...(s.stage === 'work' && s.clues.length < client.marks.length ? [`Следов на корпусе ещё не найдено: ${client.marks.length - s.clues.length}.`] : [])].join('\n') : s.order === 'remote' ? (s.stage === 'ending' ? '«Работает! Дедушка снова сам переключает свои передачи и больше не зовёт меня каждые пять минут. Спасибо!»' : '«Дедушка пролил чай на пульт, и теперь половина кнопок не нажимается. Он без него как без рук — посмотрите, пожалуйста?»') : s.order === 'cassette' ? (s.stage === 'ending' ? '«Плеер снова работает. Теперь я смогу послушать старую запись. Спасибо!»' : '«Этот плеер не протягивает ленту. На кассете важная для меня запись. Поможете?»') : (s.stage === 'ending' ? '«Он снова работает… Смотрите, это дедушкины фотографии с моря! Я думала, что больше никогда их не увижу. Спасибо вам.»' : '«Это ноутбук моего дедушки. Он включается, но быстро выключается. Там наши семейные фотографии… Пожалуйста, помогите их сохранить.»');
  $('#status').textContent = s.stage === 'ending' ? `● БАЛАНС: ${s.coins} МОНЕТ` : s.repaired ? '● УСТРОЙСТВО ИСПРАВНО' : s.stage === 'work' ? '● ЗАКАЗ В РАБОТЕ' : '● НОВЫЙ ЗАКАЗ';
  const actions = s.stage === 'intro' ? [['next-order','Принять заказ']] : s.stage === 'ending' ? [['next-order','Принять заказ'], ['shop','Мастерская']] : DEVICES[s.order] && s.dev ? deviceActions(DEVICES[s.order], s.dev) : s.order === 'remote' ? [['remote-inspect','Осмотр'],['remote-test','Проверить'], ...(s.rOpen ? [['remote-cover','Закрыть корпус']] : []), ...(s.rRepaired ? [['remote-finish','Вернуть клиенту']] : [])] : s.order === 'cassette' ? [['cassette-inspect','Осмотр'],['cassette-test','Проверить'], ...(s.cassetteOpen ? [['cassette-cover','Закрыть крышку']] : []), ...(s.cassetteRepaired ? [['cassette-finish','Вернуть клиенту']] : [])] : [['inspect','Осмотр'],['test','Диагностика'],['power',s.poweredOff?'Включить питание':'Выключить питание'], ...(s.open ? [['cover','Закрыть крышку']] : []), ...(s.repaired ? [['finish','Вернуть клиенту']] : [])];
  $('#actions').replaceChildren(...actions.map(([id,label],i) => { const b=document.createElement('button');b.textContent=label;b.dataset.action=id;if(i===0||id.endsWith('finish'))b.className='primary';b.onclick=()=>{effects.play('click');const open = DEVICES[state.order] ? state.dev?.open : state.order === 'remote' ? state.rOpen : state.cassetteOpen; const diagnosed = DEVICES[state.order] ? state.dev?.diagnosed : state.order === 'remote' ? state.rDiagnosed : state.cassetteDiagnosed; if (id.endsWith('-inspect') && open && !diagnosed) { const target = $(benchFor(state.order)).querySelector('.dev-fix,[data-grime],#head'); if (target) { inspectAtPart(target,id); return; } } dispatch(id);};return b; }));
  $('.lamp').style.color = s.upgrade ? '#ffd883' : '#d4a06a';
  renderMarks(s); renderLooseScrews(s);
  fitDeviceAboveDock();
  memoryUI.render(!menuOpen);
  syncCats();
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  saveToCloud(state);
}
const shownShelfNotes = new Set();
function showEndingDialogue() {
  const item = SHELF.find(i => i.order === state.order && i.client === state.client && state.shelfDone?.includes(i.id));
  showDialog('bye', item && !shownShelfNotes.has(item.id) ? () => { shownShelfNotes.add(item.id); showLetter('Бирка внутри', item.after, 'Положить к письму Лёвы', seasonDone(state) ? () => showLetter(FINALE.title, FINALE.text, FINALE.button) : null); } : null);
}
function dispatch(action, target) {
  const coinsBefore = state.coins;
  for (const [prefix, name] of [['diagnose-', 'cassette-diagnose'], ['rdiag-', 'remote-diagnose'], ['ddiag-', 'dev-diagnose']]) {
    if (action.startsWith(prefix)) { target = action.slice(prefix.length); action = name; break; }
  }
  if (action === 'shop') { openWorkshop(); return; }
  if (action === 'next-order') { partInteraction.close(); acceptNextContract(); return; }
  if (ACCEPT_ORDER[action] && target === undefined) target = pickClient(ACCEPT_ORDER[action], state.client);
  let result;
  if (action === 'replay') {
    const progress = workshopProgress(state), { client } = state, order = state.order || 'laptop';
    state = { ...initialState(), ...progress };
    result = DEVICES[order] ? act(state, 'dev-accept', { order, client }) : act(state, ORDER_ACCEPT[order], client);
    state = result.state; note('Заказ начат заново. Покупки и монеты сохранены.');
  } else { result = act(state, action, target); state = result.state; note(result.message); }
  if (['dev-test','test'].includes(action) && memoryAvailable(state)) note(`${result.message} Экран оживает. Коснись его: там сохранилась история владельца.`);
  persist();
  const source = rewardSource(), gained = state.coins - coinsBefore;
  if (gained > 0) coinFlight++;
  render();
  if (gained > 0) flyCoins(gained, source);
  if (action === 'buy-decoration' && state.coins < coinsBefore) effects.play('coin');
  if (ACCEPT_ORDER[action] || action === 'dev-accept' || action === 'shelf-take') showDialog('hello');
  else if (action.endsWith('finish') && state.stage === 'ending') {
    const finished = state;
    setTimeout(() => { if (state === finished && !menuOpen) showEndingDialogue(); }, 1300);
  }
  return result;
}
function note(text){$('#message').textContent=text;$('#bench-message').textContent=text;$('#cassette-message').textContent=text;$('#remote-message').textContent=text;$('#device-message').textContent=text;}
// Диалог с клиентом: приходит с историей (можно расспросить), а при возврате реагирует на найденные следы.
let typing = 0;
function showDialog(kind, onClose = null) {
  const client = clientFor(state.order, state.client); if (!client) return;
  const box = $('#dialog'), text = $('#dialog-text'), choices = $('#dialog-choices'), asked = new Set();
  $('#dialog-name').textContent = `${client.name} · ${client.title}`;
  const say = line => {
    clearInterval(typing); text.textContent = line;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let shown = 0; text.textContent = '';
    typing = setInterval(() => { shown += 2; text.textContent = line.slice(0, shown); if (shown >= line.length) clearInterval(typing); }, 22);
    text.onclick = () => { clearInterval(typing); text.textContent = line; };
  };
  const options = () => {
    const list = kind === 'hello' ? client.questions.filter(q => !asked.has(q)).map(q => [q.q, () => { asked.add(q); say(q.a); options(); }]) : [];
    list.push([kind === 'hello' ? 'Беру в работу' : 'До встречи!', () => { clearInterval(typing); box.hidden = true; onClose?.(); }]);
    choices.replaceChildren(...list.map(([label, fn], i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; if (i === list.length - 1) b.className = 'primary'; b.onclick = () => { effects.play('click'); fn(); }; return b; }));
  };
  if (kind === 'hello') say(client.intro);
  else {
    const found = client.marks.filter(m => state.clues.includes(m.id)).length + (client.find && state.clues.includes('find') ? 1 : 0);
    const thanks = found && found === client.marks.length ? '«Вы даже это заметили? Спасибо, что отнеслись к вещи так бережно.»' : found ? '«Вы заметили, да? Это наша маленькая история.»' : '';
    const response = state.memoryActionDone ? memoryFor(state)?.response : '';
    // Реакция на экран после ремонта не заменяет прощание клиента: сначала она, потом его последние слова.
    say([response, client.ending, response ? '' : thanks].filter(Boolean).join('\n\n'));
  }
  options(); box.hidden = false;
}
// Награда: монеты вылетают из устройства и по одной долетают до счётчика, число растёт вместе с ними.
let coinFlight = 0;
function rewardSource() { const device = document.querySelector('.bench:not([hidden]) .mat > [id$="device"]'); const r = device?.getBoundingClientRect(); return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: innerWidth / 2, y: innerHeight * .55 }; }
function flyCoins(amount, from) {
  const label = coinCounter.querySelector('b'), icon = coinCounter.querySelector('img').getBoundingClientRect();
  const to = { x: icon.left + icon.width / 2, y: icon.top + icon.height / 2 };
  const gain = document.createElement('div'); gain.className = 'coin-gain'; gain.textContent = `+${amount}`; gain.style.left = `${from.x}px`; gain.style.top = `${from.y - 20}px`; document.body.append(gain); setTimeout(() => gain.remove(), 1500);
  const count = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.min(10, Math.max(4, Math.round(amount / 12)));
  // dispatch() already counted this flight so render() left the old number on the counter.
  if (!count) { coinFlight--; label.textContent = state.coins; return; }
  const start = state.coins - amount, end = state.coins;
  for (let i = 0; i < count; i++) {
    const coin = document.createElement('img'); coin.src = 'assets/ui/coin.svg'; coin.alt = ''; coin.className = 'flying-coin'; document.body.append(coin);
    const sx = from.x + (Math.random() - .5) * 60, sy = from.y + (Math.random() - .5) * 40, peak = Math.min(sy, to.y) - 60 - Math.random() * 50;
    const anim = coin.animate([
      { transform: `translate(${sx - 14}px, ${sy - 14}px) scale(.4)`, opacity: 0 },
      { transform: `translate(${sx - 14 + (Math.random() - .5) * 40}px, ${peak}px) scale(1.1)`, opacity: 1, offset: .35 },
      { transform: `translate(${to.x - 14}px, ${to.y - 14}px) scale(.7)`, opacity: 1 },
    ], { duration: 750 + Math.random() * 150, delay: 120 + i * 110, easing: 'cubic-bezier(.45,0,.3,1)', fill: 'both' });
    anim.onfinish = () => {
      coin.remove(); effects.play('coin');
      label.textContent = i === count - 1 ? end : Math.round(start + amount * (i + 1) / count);
      coinCounter.classList.remove('bump'); void coinCounter.offsetWidth; coinCounter.classList.add('bump');
      if (i === count - 1) { coinFlight--; if (!coinFlight) label.textContent = state.coins; }
    };
  }
}
document.querySelectorAll('#bench-laptop [data-tool]').forEach(b => b.onclick=()=>{ effects.play('tool');tool=b.dataset.tool; document.querySelectorAll('#bench-laptop [data-tool]').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); $('#tool-name').textContent=`Выбран: ${b.querySelector('span').textContent.toLowerCase()}`; });
document.querySelectorAll('#bench-laptop [data-screw]').forEach(b=>b.onclick=()=>{ if(tool==='screw'){effects.play('repair');dispatch('screw',Number(b.dataset.screw));} else note('Для винта нужна отвёртка.'); });
document.querySelectorAll('#bench-laptop [data-dust]').forEach(b=>b.onclick=()=>{ if(tool==='brush'){effects.play('tool');dispatch('clean',Number(b.dataset.dust));} else note('Пыль можно удалить кистью.'); });
$('#lid-open').onclick=()=>{effects.play();dispatch('cover');};
$('#wire').onclick=()=>{ if(state.fanConnected)note('Разъём вентилятора подключён.'); else {effects.play();dispatch('connect');} };
$('#radiator').onclick=()=>{effects.play();if(tool==='inspect')dispatch('thermal');else if(tool==='paste')dispatch('paste');else note('Осмотри радиатор или выбери термопасту.');};
$('#fan').onclick=()=>note('Для ремонта используй рабочий стол ниже.'); $('#connector').onclick=()=>note('Для ремонта используй рабочий стол ниже.');
$('#cat').onclick=()=>{ effects.play('purr');note('Мурзик довольно жмурится рядом с тобой.'); };
for (const [id,cat] of Object.entries(benchCats)) $('#'+id).onclick=()=>{ effects.play('purr'); note(cat.pet()==='wake'?'Мурзик просыпается и сладко потягивается.':'Мурзик довольно жмурится и умывается рядом с тобой.'); };
$('#reset').onclick=()=>{if(confirm('Начать историю заново? Сохранённый прогресс будет удалён.')){state=initialState();try{localStorage.removeItem(KEY);}catch{}$('#message').textContent='На улице дождь. В мастерской ждёт первый заказ.';render();}};
function updateSoundButton(){const b=$('#sound');b.textContent=soundOn?'♪ ЗВУК ВКЛ.':'♪ ЗВУК ВЫКЛ.';b.setAttribute('aria-label',soundOn?'Выключить музыку':'Включить музыку');b.setAttribute('aria-pressed',String(soundOn));b.title=soundOn?'Выключить музыку':'Включить музыку';const m=$('#menu-music');m.textContent=soundOn?'♪ Музыка: вкл.':'♪ Музыка: выкл.';m.setAttribute('aria-pressed',String(soundOn));}
async function toggleMusic(){if(soundOn){music.disable();soundOn=false;}else soundOn=await music.enable();updateSoundButton();}
$('#sound').onclick=toggleMusic;$('#menu-music').onclick=toggleMusic;
$('#menu-effects').onclick=()=>{effects.setEnabled(!effects.enabled);const b=$('#menu-effects');b.textContent=effects.enabled?'◉ Звуки: вкл.':'◉ Звуки: выкл.';b.setAttribute('aria-pressed',String(effects.enabled));effects.play();};
$('#menu-continue').onclick=()=>{effects.play();if(state.stage !== 'work') acceptNextContract();else {menuOpen=false;render();}};
// Письмо Лёвы и бирки с полки — в том же окне диалога, без вариантов ответа.
function showLetter(title, text, button, onClose = null) {
  const box = $('#dialog');
  $('#dialog-name').textContent = title; $('#dialog-text').textContent = text; $('#dialog-text').onclick = null;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'primary'; b.textContent = button;
  b.onclick = () => { effects.play('click'); box.hidden = true; onClose?.(); };
  $('#dialog-choices').replaceChildren(b); box.classList.add('letter'); box.hidden = false;
  const off = new MutationObserver(() => { if (box.hidden) { box.classList.remove('letter'); off.disconnect(); } }); off.observe(box, { attributes: true, attributeFilter: ['hidden'] });
}
// Полка «НЕ ГОТОВО»: бирки Лёвы; открытый предмет берётся в работу как особый заказ.
const shelfButton = document.createElement('button'); shelfButton.id = 'menu-shelf'; shelfButton.className = 'secondary'; shelfButton.textContent = 'Полка «НЕ ГОТОВО»';
$('#menu-shop').after(shelfButton);
const chapterLabel = document.createElement('p'); chapterLabel.className = 'menu-chapter'; $('#menu-campaign').before(chapterLabel);
const shelfPanel = document.createElement('div'); shelfPanel.className = 'dialog shelf-panel'; shelfPanel.hidden = true; shelfPanel.setAttribute('role', 'dialog'); shelfPanel.setAttribute('aria-label', 'Полка «НЕ ГОТОВО»');
document.body.append(shelfPanel);
function openShelf() {
  const card = document.createElement('div'); card.className = 'dialog-card shelf-card';
  card.innerHTML = '<div class="dialog-name">Полка «НЕ ГОТОВО»</div><p class="dialog-text">Вещи, которые Лёва не успел вернуть. На каждой — бирка.</p>';
  const list = document.createElement('div'); list.className = 'shelf-items';
  for (const item of SHELF) {
    const status = shelfStatus(state, item), row = document.createElement('div'); row.className = `shelf-item ${status}`;
    row.innerHTML = `<span class="shelf-tag">${item.tag}</span><b>${status === 'locked' ? 'Глава ' + item.chapter : item.name}</b>`;
    const b = document.createElement('button'); b.type = 'button';
    if (status === 'ready') { b.textContent = state.stage === 'work' ? 'После текущего заказа' : 'Взять в работу'; b.disabled = state.stage === 'work'; b.onclick = () => { effects.play('click'); shelfPanel.hidden = true; state = { ...initialState(), ...workshopProgress(state) }; menuOpen = false; tool = 'inspect'; dispatch('shelf-take', item.id); }; }
    else { b.textContent = status === 'done' ? 'Возвращено ✓' : shelfLockReason(state, item); b.disabled = true; }
    row.append(b); list.append(row);
  }
  const close = document.createElement('button'); close.type = 'button'; close.className = 'primary'; close.textContent = 'Закрыть'; close.onclick = () => { shelfPanel.hidden = true; };
  card.append(list, close); shelfPanel.replaceChildren(card); shelfPanel.hidden = false;
}
shelfButton.onclick = () => { effects.play('click'); openShelf(); };
function renderStory() {
  chapterLabel.textContent = currentChapter(state).title;
  shelfButton.classList.toggle('has-ready', SHELF.some(i => shelfStatus(state, i) === 'ready'));
}
setInterval(renderStory, 1000);
updateSoundButton();
render();
renderStory();
if (!state.letterRead) showLetter(LETTER.title, LETTER.text, LETTER.button, () => { state = act(state, 'letter-read').state; persist(); });
document.querySelectorAll('.mat').forEach(mat => { startAmbience(mat, () => effects.playThunder()); startCityLife(mat.querySelector('.ambience'), { isMusicOn: () => soundOn }); });
document.addEventListener('visibilitychange',syncCats);
// Частицы: пыль
function spawnDust() {
  const p = document.createElement('div');
  p.className = 'particle dust';
  p.style.left = (20 + Math.random() * 60) + '%';
  p.style.top = (30 + Math.random() * 40) + '%';
  p.style.animationDelay = (Math.random() * 5) + 's';
  $('#particles').appendChild(p);
  setTimeout(() => p.remove(), 10000);
}
// Частицы: искры
function spawnSparks(x, y, count = 5) {
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'particle spark';
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.setProperty('--sx', (Math.random() * 40 - 20) + 'px');
    s.style.setProperty('--sy', (Math.random() * -40 - 10) + 'px');
    $('#particles').appendChild(s);
    setTimeout(() => s.remove(), 1000);
  }
}
setInterval(spawnDust, 2000);
// День/ночь
const dayCycles = ['day-night-dawn', 'day-night-day', 'day-night-dusk', 'day-night-night'];
let dayPhase = 0;
setInterval(() => {
  dayPhase = (dayPhase + 1) % dayCycles.length;
  document.body.classList.remove(...dayCycles); document.body.classList.add(dayCycles[dayPhase]);
}, 60000);
