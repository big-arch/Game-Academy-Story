import { initialState, act } from './game.js?v=4';
import { startAmbience } from './ambience.js?v=1';
import { createMusicPlayer } from './music-player.js?v=2';
import { createSoundEffects } from './sound-effects.js?v=2';
const $ = s => document.querySelector(s);
const KEY = 'workshop-stories-v1';
let state = initialState();
try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved && ['intro','work','ending'].includes(saved.stage)) state = { ...state, ...saved }; } catch {}
// Earlier versions stored only counts; keep those repairs playable after upgrading.
if (state.open && state.screws === 0) state.screws = 4;
if (state.dustCleaned && state.dust === 0) state.dust = 3;
if (state.screws > 0 && !state.screwMask) state.screwMask = (1 << state.screws) - 1;
if (state.dust > 0 && !state.dustMask) state.dustMask = (1 << state.dust) - 1;
let tool = 'inspect', menuOpen = true, catEntryPending = false;
const effects = createSoundEffects();
// Полноэкранный режим
$('#menu-fullscreen').onclick = () => {
  effects.play('click');
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => document.body.classList.add('fullscreen'));
  } else {
    document.exitFullscreen().then(() => document.body.classList.remove('fullscreen'));
  }
};
// Выбор заказа
$('#menu-new-order').onclick = () => { effects.play('click'); $('#order-select').hidden = false; };
$('#order-back-btn').onclick = () => { effects.play('click'); $('#order-select').hidden = true; };
document.querySelectorAll('.order-btn').forEach(btn => {
  btn.onclick = () => {
    effects.play('click');
    $('#order-select').hidden = true;
    menuOpen = false;
    const order = btn.dataset.order;
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
$('#belt').onclick = () => { effects.play(); dispatch('cassette-belt'); };
$('#head').onclick = () => { effects.play('tool'); dispatch('cassette-head'); };
// Пет Cat
for (const cat of [$('#cat'), $('#bench-cat'), $('#bench-cat-cassette')]) {
  cat.onclick = () => {
    effects.play('purr');
    note('Мурзик доволен и мурчит рядом.');
    cat.classList.remove('walking', 'washing');
    void cat.offsetWidth;
    cat.classList.add('petted');
    setTimeout(() => cat.classList.remove('petted'), 1200);
  };
}
const storyToggle = document.createElement('button');
storyToggle.type = 'button'; storyToggle.className = 'story-toggle'; storyToggle.textContent = 'История'; storyToggle.setAttribute('aria-expanded', 'false'); storyToggle.setAttribute('aria-controls', 'story');
storyToggle.onclick = () => { const open = $('.panel').classList.toggle('story-open'); storyToggle.setAttribute('aria-expanded', String(open)); };
$('.panel-top').append(storyToggle);
const backMenu = document.createElement('button'); backMenu.type='button'; backMenu.className='back-menu'; backMenu.textContent='☰'; backMenu.setAttribute('aria-label','Главное меню'); backMenu.title='Главное меню';
backMenu.onclick=()=>{effects.play();menuOpen=true;render();};
$('.panel .bottom').prepend(backMenu);
let soundOn = false;
const music = createMusicPlayer(()=>{ soundOn=false;updateSoundButton();note('Не удалось воспроизвести музыку. Попробуй включить её ещё раз.'); });
function render() {
  const s = state; $('#base').classList.toggle('open', s.open); $('#fan').classList.toggle('clean', s.dustCleaned); $('#connector').classList.toggle('connected', s.fanConnected);
  music.setMode(!menuOpen && s.stage === 'work' ? 'game' : 'menu');
  effects.setWorkshop(!menuOpen && s.stage === 'work');
  $('#main-menu').hidden = !menuOpen;
  $('#menu-continue').textContent = s.stage === 'intro' ? 'Начать историю' : 'Продолжить';
  $('.panel').hidden = menuOpen;
  $('#bench-laptop').hidden = menuOpen || s.stage !== 'work' || s.order !== 'laptop';
  $('#bench-cassette').hidden = menuOpen || s.stage !== 'work' || s.order !== 'cassette';
  if (s.order === 'laptop') { $('#device').classList.toggle('is-open', s.open); }
  if (s.order === 'cassette') { $('#cassette-device').classList.toggle('is-open', s.cassetteOpen); }
  $('.scene').hidden = menuOpen || s.stage === 'work';
  if(!menuOpen && s.stage === 'work' && !catEntryPending){catEntryPending=true;const c=s.order==='cassette'?$('#bench-cat-cassette'):$('#bench-cat');setTimeout(()=>c.classList.add('walking'),3000);setTimeout(()=>c.classList.remove('walking'),5500);}
  if (s.stage === 'work') $('.panel').hidden = true;
  storyToggle.hidden = s.stage !== 'work';
  backMenu.hidden = menuOpen;
  document.querySelectorAll('#bench-laptop [data-screw]').forEach(b => { b.classList.toggle('removed', Boolean(s.screwMask & (1 << Number(b.dataset.screw)))); b.setAttribute('aria-label', `Винт ${Number(b.dataset.screw)+1}${s.screwMask & (1 << Number(b.dataset.screw)) ? ', снят' : ''}`); });
  document.querySelectorAll('#bench-laptop [data-dust]').forEach(b => { const removed=Boolean(s.dustMask & (1 << Number(b.dataset.dust)));b.classList.toggle('removed',removed);b.disabled=removed; });
  $('#wire').classList.toggle('connected', s.fanConnected); $('#radiator').classList.toggle('fixed', s.paste); $('.fan-art').classList.toggle('clean', s.dustCleaned);
  $('#display').textContent = s.repaired ? 'ПРОВЕРКА ПРОЙДЕНА' : s.poweredOff ? 'ПИТАНИЕ ОТКЛЮЧЕНО' : s.tested ? 'ТЕМПЕРАТУРА: ВЫСОКАЯ' : 'ОЖИДАНИЕ';
  $('#heading').textContent = s.stage === 'ending' ? 'История продолжается' : 'Письма из прошлого';
  $('#story').textContent = s.stage === 'ending' ? '«Он снова работает… Смотрите, это дедушкины фотографии с моря! Я думала, что больше никогда их не увижу. Спасибо вам.»' : '«Это ноутбук моего дедушки. Он включается, но быстро выключается. Там наши семейные фотографии… Пожалуйста, помогите их сохранить.»';
  $('#status').textContent = s.stage === 'ending' ? '● ЗАКАЗ ВЫПОЛНЕН · + 120 МОНЕТ' : s.repaired ? '● УСТРОЙСТВО ИСПРАВНО' : s.stage === 'work' ? '● ЗАКАЗ В РАБОТЕ' : '● НОВЫЙ ЗАКАЗ';
  const actions = s.stage === 'intro' ? [['accept','Принять заказ']] : s.stage === 'ending' ? [...(s.upgrade ? [] : [['upgrade','Купить лампу · 120']]), ['replay','Сыграть обновлённый заказ']] : [['inspect','Осмотр'],['test','Диагностика'],['power',s.poweredOff?'Включить питание':'Выключить питание'], ...(s.open ? [['cover','Закрыть крышку']] : []), ...(s.repaired ? [['finish','Вернуть клиенту']] : [])];
  $('#actions').replaceChildren(...actions.map(([id,label],i) => { const b=document.createElement('button');b.textContent=label;if(i===0||id==='finish')b.className='primary';b.onclick=()=>{effects.play('click');dispatch(id);};return b; }));
  $('.lamp').style.color = s.upgrade ? '#ffd883' : '#d4a06a';
}
function dispatch(action, target) { if(action==='replay'){ const upgrade=state.upgrade; state={...initialState(),upgrade,stage:'work'}; note('Заказ начат заново. Улучшения мастерской сохранены.'); } else { const result=act(state,action,target);state=result.state;note(result.message); } try{localStorage.setItem(KEY,JSON.stringify(state));}catch{} render(); }
function note(text){$('#message').textContent=text;$('#bench-message').textContent=text;}
document.querySelectorAll('[data-tool]').forEach(b => b.onclick=()=>{ effects.play('tool');tool=b.dataset.tool; document.querySelectorAll('[data-tool]').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); $('#tool-name').textContent=`Выбран: ${b.querySelector('span').textContent.toLowerCase()}`; });
document.querySelectorAll('[data-screw]').forEach(b=>b.onclick=()=>{ if(tool==='screw'){effects.play('repair');dispatch('screw',Number(b.dataset.screw));} else note('Для винта нужна отвёртка.'); });
document.querySelectorAll('[data-dust]').forEach(b=>b.onclick=()=>{ if(tool==='brush'){effects.play('tool');dispatch('clean',Number(b.dataset.dust));} else note('Пыль можно удалить кистью.'); });
$('#lid-open').onclick=()=>{effects.play();dispatch('cover');};
$('#wire').onclick=()=>{ if(state.fanConnected)note('Разъём вентилятора подключён.'); else {effects.play();dispatch('connect');} };
$('#radiator').onclick=()=>{effects.play();if(tool==='inspect')dispatch('thermal');else if(tool==='paste')dispatch('paste');else note('Осмотри радиатор или выбери термопасту.');};
$('#fan').onclick=()=>note('Для ремонта используй рабочий стол ниже.'); $('#connector').onclick=()=>note('Для ремонта используй рабочий стол ниже.');
let catWashTimer;
for (const cat of [$('#cat'), $('#bench-cat')]) cat.onclick=()=>{ effects.play();note('Мурзик довольно жмурится и умывается рядом с тобой.'); cat.classList.remove('walking','washing'); void cat.offsetWidth; cat.classList.add('washing'); clearTimeout(catWashTimer);catWashTimer=setTimeout(()=>cat.classList.remove('washing'),2400); };
$('#reset').onclick=()=>{if(confirm('Начать историю заново? Сохранённый прогресс будет удалён.')){state=initialState();try{localStorage.removeItem(KEY);}catch{}$('#message').textContent='На улице дождь. В мастерской ждёт первый заказ.';render();}};
function updateSoundButton(){const b=$('#sound');b.textContent=soundOn?'♪ ЗВУК ВКЛ.':'♪ ЗВУК ВЫКЛ.';b.setAttribute('aria-label',soundOn?'Выключить музыку':'Включить музыку');b.setAttribute('aria-pressed',String(soundOn));b.title=soundOn?'Выключить музыку':'Включить музыку';const m=$('#menu-music');m.textContent=soundOn?'♪ Музыка: вкл.':'♪ Музыка: выкл.';m.setAttribute('aria-pressed',String(soundOn));}
async function toggleMusic(){if(soundOn){music.disable();soundOn=false;}else soundOn=await music.enable();updateSoundButton();}
$('#sound').onclick=toggleMusic;$('#menu-music').onclick=toggleMusic;
$('#menu-effects').onclick=()=>{effects.setEnabled(!effects.enabled);const b=$('#menu-effects');b.textContent=effects.enabled?'◉ Звуки: вкл.':'◉ Звуки: выкл.';b.setAttribute('aria-pressed',String(effects.enabled));effects.play();};
$('#menu-continue').onclick=()=>{effects.play();menuOpen=false;render();};
updateSoundButton();
render();
startAmbience($('.mat'));
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
  document.body.className = dayCycles[dayPhase] + (document.body.classList.contains('fullscreen') ? ' fullscreen' : '');
}, 60000);
