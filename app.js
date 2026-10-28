import { initialState, act } from './game.js?v=13';
import { workshopProgress, ownedDecorations } from './workshop.js';
import { createWorkshopUI } from './workshop-ui.js';
import { clientFor, pickClient } from './stories.js?v=4';
import { DEVICES, viewSrc } from './devices.js?v=3';
import { startAmbience } from './ambience.js?v=3';
import { startCityLife } from './city-life.js?v=1';
import { createMusicPlayer } from './music-player.js?v=2';
import { createSoundEffects } from './sound-effects.js?v=4';
import { createCat } from './cat.js?v=2';
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
// Выбор заказа. Устройства из devices.js добавляют свои кнопки сами.
for (const [id, cfg] of Object.entries(DEVICES)) {
  const b = document.createElement('button'); b.className = 'order-btn'; b.dataset.order = id;
  b.innerHTML = `<span class="order-icon">${cfg.icon}</span><span class="order-title">${cfg.title}</span><span class="order-desc">${cfg.desc} · ${cfg.reward} монет</span>`;
  $('.order-options').append(b);
}
$('#menu-new-order').onclick = () => { effects.play('click'); $('#order-select').hidden = false; };
$('#order-back-btn').onclick = () => { effects.play('click'); $('#order-select').hidden = true; };
document.querySelectorAll('.order-btn').forEach(btn => {
  btn.onclick = () => {
    effects.play('click');
    const order = btn.dataset.order;
    if (state.stage === 'work' && !confirm('Начать новый заказ? Текущий незавершённый ремонт будет сброшен.')) return;
    const progress = workshopProgress(state), previous = state.order === order ? state.client : null;
    state = { ...initialState(), ...progress };
    tool = 'inspect';
    document.querySelectorAll('[data-tool]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.tool === 'inspect')));
    $('#order-select').hidden = true;
    menuOpen = false;
    if (DEVICES[order]) dispatch('dev-accept', { order, client: pickClient(order, previous) });
    else dispatch(ORDER_ACCEPT[order], pickClient(order, previous));
  };
});
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
  $(device).addEventListener('click', e => { if (tool !== 'inspect' || e.target.closest('#tape-clip, .story-mark, #dev-open')) return; e.stopPropagation(); effects.play('tool'); dispatch(action); }, true);
}
const ORDER_ACCEPT = { laptop: 'accept', cassette: 'cassette-accept', remote: 'remote-accept' };
const ACCEPT_ORDER = Object.fromEntries(Object.entries(ORDER_ACCEPT).map(([order, action]) => [action, order]));
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
const TOOL_LABELS = { inspect: 'Осмотр', screw: 'Отвёртка', clean: 'Спирт', hand: 'Руки', brush: 'Кисть', paste: 'Термопаста', belt: 'Ремень' };
const MAT_RATIO = 1681 / 936; // высота коврика к ширине
let devBuilt = '';
function buildDevice(order) {
  const cfg = DEVICES[order], [w, h] = cfg.size, box = $('#dev-device'), body = $('#dev-body');
  devBuilt = order;
  Object.assign(box.style, { height: `${cfg.height}%`, width: `${cfg.height * MAT_RATIO * w / h}%`, top: `${cfg.top}%` });
  $('#dev-inside').style.backgroundImage = `url('${viewSrc(order, 'open')}')`;
  for (const view of ['open', 'repaired']) new Image().src = viewSrc(order, view);
  body.querySelectorAll('.screw').forEach(b => b.remove());
  cfg.screws.forEach(([x, y], i) => {
    const b = document.createElement('button'); b.className = 'screw'; b.dataset.screw = i; b.textContent = '✚'; b.setAttribute('aria-label', `Винт корпуса ${i + 1}`);
    Object.assign(b.style, { left: `calc(${x}% - 22px)`, top: `calc(${y}% - 22px)` });
    b.onclick = () => { if (tool === 'screw') { effects.play('repair'); dispatch('dev-screw', i); } else note('Для винтов нужна отвёртка.'); };
    body.prepend(b);
  });
  $('#dev-inside').replaceChildren(...cfg.fixes.map(f => {
    const b = document.createElement('button'); b.className = 'dev-fix'; b.dataset.fix = f.id; b.title = f.label; b.setAttribute('aria-label', f.label);
    Object.assign(b.style, { left: `${f.x}%`, top: `${f.y}%` });
    b.onclick = () => { if (tool !== f.tool) { note(`${f.label}: здесь нужен инструмент «${TOOL_LABELS[f.tool]}».`); return; } effects.play('tool'); dispatch('dev-fix', f.id); };
    return b;
  }));
  tool = 'inspect';
  $('#dev-tools').replaceChildren(...cfg.tools.map(t => {
    const b = document.createElement('button'); b.dataset.tool = t; b.setAttribute('aria-pressed', String(t === 'inspect'));
    b.innerHTML = `<img class="tool-icon" src="assets/ui/tools/${t}.svg" alt=""><span>${TOOL_LABELS[t]}</span>`;
    b.onclick = () => { effects.play('tool'); tool = t; $('#dev-tools').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); };
    return b;
  }));
}
function renderDevice(s) {
  if (!DEVICES[s.order] || !s.dev) return;
  if (devBuilt !== s.order) buildDevice(s.order);
  const cfg = DEVICES[s.order], d = s.dev, box = $('#dev-device');
  box.classList.toggle('is-open', d.open); box.classList.toggle('diagnosed', d.diagnosed);
  $('#dev-body').style.backgroundImage = `url('${viewSrc(s.order, d.repaired ? 'repaired' : 'closed')}')`;
  $('#dev-open').hidden = d.open || d.assembling || d.screwMask !== (1 << cfg.screws.length) - 1;
  $('#dev-body').querySelectorAll('.screw').forEach(b => { const removed = Boolean(d.screwMask & (1 << Number(b.dataset.screw))); b.classList.toggle('removed', removed); b.setAttribute('aria-label', `Винт корпуса ${Number(b.dataset.screw) + 1}${removed ? ', снят' : ', установлен'}`); });
  $('#dev-inside').querySelectorAll('.dev-fix').forEach(b => { const done = d.fixed.includes(b.dataset.fix); b.classList.toggle('done', done); b.disabled = done; });
}
$('#dev-open').onclick = () => { effects.play(); dispatch('dev-cover'); };
const storyToggle = document.createElement('button');
storyToggle.type = 'button'; storyToggle.className = 'story-toggle'; storyToggle.textContent = 'История'; storyToggle.setAttribute('aria-expanded', 'false'); storyToggle.setAttribute('aria-controls', 'story');
storyToggle.onclick = () => { const open = $('.panel').classList.toggle('story-open'); storyToggle.setAttribute('aria-expanded', String(open)); };
const coinCounter = document.createElement('span'); coinCounter.className = 'coin-counter'; coinCounter.setAttribute('aria-label', 'Монеты');
coinCounter.innerHTML = '<img src="assets/ui/coin.svg" alt=""><b>0</b>';
$('.panel-top').append(coinCounter, storyToggle);
const backMenu = document.createElement('button'); backMenu.type='button'; backMenu.className='back-menu'; backMenu.textContent='☰'; backMenu.setAttribute('aria-label','Главное меню'); backMenu.title='Главное меню';
backMenu.onclick=()=>{effects.play();menuOpen=true;render();};
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
  shopOpener = document.activeElement; shopReturnMenu = menuOpen; menuOpen = true; shopOpen = true;
  render(); workshopUI.focus();
}
function closeWorkshop() {
  shopOpen = false; menuOpen = shopReturnMenu; render();
  (shopOpener?.isConnected ? shopOpener : menuOpen ? $('#menu-shop') : backMenu).focus();
}
$('#menu-shop').onclick = () => { effects.play('click'); openWorkshop(); };

function render() {
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
  $('#menu-continue').textContent = s.stage === 'intro' ? 'Начать историю' : 'Продолжить';
  $('.panel').hidden = menuOpen;
  $('#bench-laptop').hidden = menuOpen || s.stage !== 'work' || s.order !== 'laptop';
  $('#bench-cassette').hidden = menuOpen || s.stage !== 'work' || s.order !== 'cassette';
  $('#bench-remote').hidden = menuOpen || s.stage !== 'work' || s.order !== 'remote';
  $('#bench-device').hidden = menuOpen || s.stage !== 'work' || !DEVICES[s.order];
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
  $('.scene').hidden = menuOpen || s.stage === 'work';
  if (s.stage === 'work') {
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
  $('#story').textContent = client ? [s.stage === 'ending' ? client.ending : client.intro, ...client.marks.filter(m => s.clues.includes(m.id)).map(m => `• ${m.text}`), ...(s.stage === 'work' && s.clues.length < client.marks.length ? [`Следов на корпусе ещё не найдено: ${client.marks.length - s.clues.length}.`] : [])].join('\n') : s.order === 'remote' ? (s.stage === 'ending' ? '«Работает! Дедушка снова сам переключает свои передачи и больше не зовёт меня каждые пять минут. Спасибо!»' : '«Дедушка пролил чай на пульт, и теперь половина кнопок не нажимается. Он без него как без рук — посмотрите, пожалуйста?»') : s.order === 'cassette' ? (s.stage === 'ending' ? '«Плеер снова работает. Теперь я смогу послушать старую запись. Спасибо!»' : '«Этот плеер не протягивает ленту. На кассете важная для меня запись. Поможете?»') : (s.stage === 'ending' ? '«Он снова работает… Смотрите, это дедушкины фотографии с моря! Я думала, что больше никогда их не увижу. Спасибо вам.»' : '«Это ноутбук моего дедушки. Он включается, но быстро выключается. Там наши семейные фотографии… Пожалуйста, помогите их сохранить.»');
  $('#status').textContent = s.stage === 'ending' ? `● БАЛАНС: ${s.coins} МОНЕТ` : s.repaired ? '● УСТРОЙСТВО ИСПРАВНО' : s.stage === 'work' ? '● ЗАКАЗ В РАБОТЕ' : '● НОВЫЙ ЗАКАЗ';
  const actions = s.stage === 'intro' ? [['accept','Принять заказ']] : s.stage === 'ending' ? [['next-order','Следующий заказ'], ['shop','Обустройство'], ['replay','Повторить заказ']] : DEVICES[s.order] && s.dev ? [['dev-inspect','Осмотр'],['dev-test','Проверить'], ...(s.dev.open && s.dev.inside && !s.dev.diagnosed ? DEVICES[s.order].causes.map(c => ['ddiag-' + c.id, 'Причина: ' + c.label]) : []), ...(s.dev.open ? [['dev-cover','Закрыть крышку']] : []), ...(s.dev.repaired ? [['dev-finish','Вернуть клиенту']] : [])] : s.order === 'remote' ? [['remote-inspect','Осмотр'],['remote-test','Проверить'], ...(s.rOpen && s.rInspectedInside && !s.rDiagnosed ? [['rdiag-battery','Причина: батарейки'],['rdiag-led','Причина: светодиод'],['rdiag-contacts','Причина: контакты']] : []), ...(s.rOpen ? [['remote-cover','Закрыть корпус']] : []), ...(s.rRepaired ? [['remote-finish','Вернуть клиенту']] : [])] : s.order === 'cassette' ? [['cassette-inspect','Осмотр'],['cassette-test','Проверить'], ...(s.cassetteOpen && s.cassetteInteriorInspected && !s.cassetteDiagnosed ? [['diagnose-battery','Причина: батарея'],['diagnose-head','Причина: головка'],['diagnose-belt','Причина: ремень']] : []), ...(s.cassetteOpen ? [['cassette-cover','Закрыть крышку']] : []), ...(s.cassetteRepaired ? [['cassette-finish','Вернуть клиенту']] : [])] : [['inspect','Осмотр'],['test','Диагностика'],['power',s.poweredOff?'Включить питание':'Выключить питание'], ...(s.open ? [['cover','Закрыть крышку']] : []), ...(s.repaired ? [['finish','Вернуть клиенту']] : [])];
  $('#actions').replaceChildren(...actions.map(([id,label],i) => { const b=document.createElement('button');b.textContent=label;if(i===0||id.endsWith('finish'))b.className='primary';b.onclick=()=>{effects.play('click');dispatch(id);};return b; }));
  $('.lamp').style.color = s.upgrade ? '#ffd883' : '#d4a06a';
  renderMarks(s); renderTrays(s);
  syncCats();
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  saveToCloud(state);
}
function dispatch(action, target) {
  const coinsBefore = state.coins;
  for (const [prefix, name] of [['diagnose-', 'cassette-diagnose'], ['rdiag-', 'remote-diagnose'], ['ddiag-', 'dev-diagnose']]) {
    if (action.startsWith(prefix)) { target = action.slice(prefix.length); action = name; break; }
  }
  if (action === 'shop') { openWorkshop(); return; }
  if (action === 'next-order') { menuOpen = true; render(); $('#order-select').hidden = false; return; }
  if (ACCEPT_ORDER[action] && target === undefined) target = pickClient(ACCEPT_ORDER[action], state.client);
  let result;
  if (action === 'replay') {
    const progress = workshopProgress(state), { client } = state, order = state.order || 'laptop';
    state = { ...initialState(), ...progress };
    result = DEVICES[order] ? act(state, 'dev-accept', { order, client }) : act(state, ORDER_ACCEPT[order], client);
    state = result.state; note('Заказ начат заново. Покупки и монеты сохранены.');
  } else { result = act(state, action, target); state = result.state; note(result.message); }
  persist();
  const source = rewardSource(), gained = state.coins - coinsBefore;
  if (gained > 0) coinFlight++;
  render();
  if (gained > 0) flyCoins(gained, source);
  if (action === 'buy-decoration' && state.coins < coinsBefore) effects.play('coin');
  if (ACCEPT_ORDER[action] || action === 'dev-accept') showDialog('hello');
  else if (action.endsWith('finish') && state.stage === 'ending') setTimeout(() => showDialog('bye'), 1300);
  return result;
}
function note(text){$('#message').textContent=text;$('#bench-message').textContent=text;$('#cassette-message').textContent=text;$('#remote-message').textContent=text;$('#device-message').textContent=text;}
// Диалог с клиентом: приходит с историей (можно расспросить), а при возврате реагирует на найденные следы.
let typing = 0;
function showDialog(kind) {
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
    list.push([kind === 'hello' ? 'Беру в работу' : 'До встречи!', () => { clearInterval(typing); box.hidden = true; }]);
    choices.replaceChildren(...list.map(([label, fn], i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; if (i === list.length - 1) b.className = 'primary'; b.onclick = () => { effects.play('click'); fn(); }; return b; }));
  };
  if (kind === 'hello') say(client.intro);
  else {
    const found = client.marks.filter(m => state.clues.includes(m.id)).length;
    const thanks = found && found === client.marks.length ? '«Вы даже это заметили? Спасибо, что отнеслись к вещи так бережно.»' : found ? '«Вы заметили, да? Это наша маленькая история.»' : '';
    say([client.ending, thanks].filter(Boolean).join('\n\n'));
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
$('#menu-continue').onclick=()=>{effects.play();menuOpen=false;render();};
updateSoundButton();
render();
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
