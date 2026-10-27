import { initialState, act } from './game.js?v=7';
import { startAmbience } from './ambience.js?v=3';
import { createMusicPlayer } from './music-player.js?v=2';
import { createSoundEffects } from './sound-effects.js?v=3';
import { createCat } from './cat.js?v=1';
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
let tool = 'inspect', menuOpen = true;
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
// Выбор заказа
$('#menu-new-order').onclick = () => { effects.play('click'); $('#order-select').hidden = false; };
$('#order-back-btn').onclick = () => { effects.play('click'); $('#order-select').hidden = true; };
document.querySelectorAll('.order-btn').forEach(btn => {
  btn.onclick = () => {
    effects.play('click');
    const order = btn.dataset.order;
    if (state.stage === 'work' && !confirm('Начать новый заказ? Текущий незавершённый ремонт будет сброшен.')) return;
    const { upgrade, coins } = state;
    state = { ...initialState(), upgrade, coins };
    tool = 'inspect';
    document.querySelectorAll('[data-tool]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.tool === 'inspect')));
    $('#order-select').hidden = true;
    menuOpen = false;
    if (order === 'laptop') { dispatch('accept'); }
    else if (order === 'cassette') { dispatch('cassette-accept'); }
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
const storyToggle = document.createElement('button');
storyToggle.type = 'button'; storyToggle.className = 'story-toggle'; storyToggle.textContent = 'История'; storyToggle.setAttribute('aria-expanded', 'false'); storyToggle.setAttribute('aria-controls', 'story');
storyToggle.onclick = () => { const open = $('.panel').classList.toggle('story-open'); storyToggle.setAttribute('aria-expanded', String(open)); };
$('.panel-top').append(storyToggle);
const backMenu = document.createElement('button'); backMenu.type='button'; backMenu.className='back-menu'; backMenu.textContent='☰'; backMenu.setAttribute('aria-label','Главное меню'); backMenu.title='Главное меню';
backMenu.onclick=()=>{effects.play();menuOpen=true;render();};
$('.panel .bottom').prepend(backMenu);
const benchCats = { 'bench-cat': createCat($('#bench-cat')), 'bench-cat-cassette': createCat($('#bench-cat-cassette')) };
// Only the cat on the visible bench runs its animation loop.
function syncCats() { const work = !menuOpen && state.stage === 'work' && !document.hidden; benchCats['bench-cat'].setActive(work && state.order === 'laptop'); benchCats['bench-cat-cassette'].setActive(work && state.order === 'cassette'); }
let soundOn = false;
const music = createMusicPlayer(()=>{ soundOn=false;updateSoundButton();note('Не удалось воспроизвести музыку. Попробуй включить её ещё раз.'); });
function render() {
  const s = state; $('#base').classList.toggle('open', s.open); $('#fan').classList.toggle('clean', s.dustCleaned); $('#connector').classList.toggle('connected', s.fanConnected);
  music.setMode(!menuOpen && s.stage === 'work' ? 'game' : 'menu');
  effects.setWorkshop(!menuOpen && s.stage === 'work');
  $('#main-menu').hidden = !menuOpen;
  $('#menu-balance').textContent = `◈ ${s.coins} монет`;
  document.body.classList.toggle('lamp-upgraded', s.upgrade);
  $('#menu-continue').textContent = s.stage === 'intro' ? 'Начать историю' : 'Продолжить';
  $('.panel').hidden = menuOpen;
  $('#bench-laptop').hidden = menuOpen || s.stage !== 'work' || s.order !== 'laptop';
  $('#bench-cassette').hidden = menuOpen || s.stage !== 'work' || s.order !== 'cassette';
  if (s.order === 'laptop') { $('#device').classList.toggle('is-open', s.open); }
  if (s.order === 'cassette') { $('#cassette-device').classList.toggle('is-open', s.cassetteOpen); }
  $('.scene').hidden = menuOpen || s.stage === 'work';
  if (s.stage === 'work') {
    const bench = s.order === 'cassette' ? $('#bench-cassette') : $('#bench-laptop');
    bench.insertBefore($('.panel'), bench.querySelector('.mat'));
  } else $('.app').insertBefore($('.panel'), $('footer'));
  storyToggle.hidden = s.stage !== 'work';
  backMenu.hidden = menuOpen;
  document.querySelectorAll('#bench-laptop [data-screw]').forEach(b => { b.classList.toggle('removed', Boolean(s.screwMask & (1 << Number(b.dataset.screw)))); b.setAttribute('aria-label', `Винт ${Number(b.dataset.screw)+1}${s.screwMask & (1 << Number(b.dataset.screw)) ? ', снят' : ''}`); });
  document.querySelectorAll('#bench-laptop [data-dust]').forEach(b => { const removed=Boolean(s.dustMask & (1 << Number(b.dataset.dust)));b.classList.toggle('removed',removed);b.disabled=removed; });
  document.querySelectorAll('#bench-cassette [data-screw]').forEach(b=>{const removed=Boolean(s.cScrewMask & (1 << Number(b.dataset.screw)));b.classList.toggle('removed',removed);b.setAttribute('aria-label',`Винт корпуса ${Number(b.dataset.screw)+1}${removed?', снят':''}`);});
  $('#belt').classList.toggle('connected',s.beltReplaced);$('#head').classList.toggle('connected',s.headCleaned);$('#tape-clip').classList.toggle('connected',s.tapeClipFixed);
  $('#wire').classList.toggle('connected', s.fanConnected); $('#radiator').classList.toggle('fixed', s.paste); $('.fan-art').classList.toggle('clean', s.dustCleaned);
  $('#display').textContent = s.repaired ? 'ПРОВЕРКА ПРОЙДЕНА' : s.poweredOff ? 'ПИТАНИЕ ОТКЛЮЧЕНО' : s.tested ? 'ТЕМПЕРАТУРА: ВЫСОКАЯ' : 'ОЖИДАНИЕ';
  $('#heading').textContent = s.stage === 'ending' ? 'История продолжается' : s.order === 'cassette' ? 'Музыка на плёнке' : 'Письма из прошлого';
  $('#story').textContent = s.order === 'cassette' ? (s.stage === 'ending' ? '«Плеер снова работает. Теперь я смогу послушать старую запись. Спасибо!»' : '«Этот плеер не протягивает ленту. На кассете важная для меня запись. Поможете?»') : (s.stage === 'ending' ? '«Он снова работает… Смотрите, это дедушкины фотографии с моря! Я думала, что больше никогда их не увижу. Спасибо вам.»' : '«Это ноутбук моего дедушки. Он включается, но быстро выключается. Там наши семейные фотографии… Пожалуйста, помогите их сохранить.»');
  $('#status').textContent = s.stage === 'ending' ? `● БАЛАНС: ${s.coins} МОНЕТ` : s.repaired ? '● УСТРОЙСТВО ИСПРАВНО' : s.stage === 'work' ? '● ЗАКАЗ В РАБОТЕ' : '● НОВЫЙ ЗАКАЗ';
  const actions = s.stage === 'intro' ? [['accept','Принять заказ']] : s.stage === 'ending' ? [['next-order','Следующий заказ'], ...(s.upgrade ? [] : [['upgrade','Улучшить лампу · 120 монет']]), ['replay','Повторить заказ']] : s.order === 'cassette' ? [['cassette-inspect','Осмотр'],['cassette-test','Проверить'], ...(s.cassetteOpen && s.cassetteInteriorInspected && !s.cassetteDiagnosed ? [['diagnose-battery','Причина: батарея'],['diagnose-head','Причина: головка'],['diagnose-belt','Причина: ремень']] : []), ...(s.cassetteOpen ? [['cassette-cover','Закрыть крышку']] : []), ...(s.cassetteRepaired ? [['cassette-finish','Вернуть клиенту']] : [])] : [['inspect','Осмотр'],['test','Диагностика'],['power',s.poweredOff?'Включить питание':'Выключить питание'], ...(s.open ? [['cover','Закрыть крышку']] : []), ...(s.repaired ? [['finish','Вернуть клиенту']] : [])];
  $('#actions').replaceChildren(...actions.map(([id,label],i) => { const b=document.createElement('button');b.textContent=label;if(i===0||id==='finish')b.className='primary';b.onclick=()=>{effects.play('click');dispatch(id);};return b; }));
  $('.lamp').style.color = s.upgrade ? '#ffd883' : '#d4a06a';
  syncCats();
}
function dispatch(action, target) { if(action.startsWith('diagnose-')) { target=action.slice('diagnose-'.length); action='cassette-diagnose'; } if(action==='next-order'){ menuOpen=true; render(); $('#order-select').hidden=false; return; } if(action==='replay'){ const {upgrade,coins}=state, order=state.order || 'laptop'; state={...initialState(),upgrade,coins}; const result=act(state,order==='cassette'?'cassette-accept':'accept');state=result.state;note('Заказ начат заново. Улучшения мастерской сохранены.'); } else { const result=act(state,action,target);state=result.state;note(result.message); } try{localStorage.setItem(KEY,JSON.stringify(state));}catch{} saveToCloud(state); render(); }
function note(text){$('#message').textContent=text;$('#bench-message').textContent=text;$('#cassette-message').textContent=text;}
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
document.querySelectorAll('.mat').forEach(mat => startAmbience(mat, () => effects.playThunder()));
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
