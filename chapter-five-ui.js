import { C5 } from './chapter-five-copy.js';
import { chapterFiveProgress, chapterFiveAvailable, chapterFiveGoal, BULBS } from './chapter-five.js';
import { roomStage } from './workshop.js';
import { createCat } from './cat.js';

const ART = {lamp:[12,8,496,554],open:[514,96,568,416],plug:[1116,64,420,452],bulbs:[22,578,540,396],tag:[574,592,510,392],sign:[1094,612,440,396]};
let artId=0;
function art(name) {
  const ns='http://www.w3.org/2000/svg',image=document.createElementNS(ns,'svg');
  image.setAttribute('viewBox',ART[name].join(' '));image.setAttribute('aria-hidden','true');image.setAttribute('preserveAspectRatio','xMidYMax meet');image.classList.add('chapter-five-art');image.dataset.sprite=name;
  const defs=document.createElementNS(ns,'defs'),clip=document.createElementNS(ns,'clipPath'),rect=document.createElementNS(ns,'rect'),bitmap=document.createElementNS(ns,'image'),id='lamp-art-'+(++artId);
  clip.id=id;clip.setAttribute('clipPathUnits','userSpaceOnUse');['x','y','width','height'].forEach((key,i)=>rect.setAttribute(key,ART[name][i]));clip.append(rect);defs.append(clip);bitmap.setAttribute('href','assets/room/chapter-five/props-v2.png');bitmap.setAttribute('width','1536');bitmap.setAttribute('height','1024');bitmap.setAttribute('clip-path',`url(#${id})`);image.append(defs,bitmap);return image;
}
function button(label, run) { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.onclick = run; return b; }
function text(value, className = '') { const p = document.createElement('p'); p.textContent = value; p.className = className; return p; }

export function createChapterFiveUI({ getState, dispatch, sound, beforeOpen, onClose }) {
  const root = document.createElement('section'); root.className = 'room-chapter chapter-two chapter-three chapter-five'; root.id = 'chapter-five'; root.hidden = true; root.setAttribute('aria-label', C5.title);
  const frame = document.createElement('div'); frame.className = 'chapter-frame';
  const world = document.createElement('div'); world.className = 'chapter-world';
  const glow = document.createElement('i'); glow.className = 'chapter-five-glow'; glow.setAttribute('aria-hidden', 'true'); world.append(glow);
  const props = document.createElement('div'); props.className = 'chapter-hotspots'; world.append(props);
  const catHost = button(' ', () => sound('purr')); catHost.className = 'bench-cat chapter-cat'; catHost.dataset.min = '68'; catHost.dataset.max = '78'; catHost.dataset.floor = '40'; catHost.dataset.size = '17'; catHost.setAttribute('aria-label', 'Murzik'); world.append(catHost); const cat = createCat(catHost);
  const header = document.createElement('header'); header.className = 'chapter-header';
  const title = document.createElement('div'); title.append(text(C5.subtitle), text(C5.title, 'chapter-title'));
  const exit = button(C5.back, close); const journal = button('☷', () => focus('journal')); journal.setAttribute('aria-label', C5.journal); journal.title = C5.journal; header.append(exit, title, journal);
  const panel = document.createElement('div'); panel.className = 'chapter-two-panel';
  const dock = document.createElement('section'); dock.className = 'chapter-dock';
  const goal = text('', 'chapter-goal'), narrative = text('', 'chapter-narrative'), actions = document.createElement('div'); actions.className = 'chapter-actions'; goal.setAttribute('role', 'status'); narrative.setAttribute('aria-live', 'polite');
  dock.append(goal, narrative, actions, button(C5.hint, () => { notice = chapterFiveGoal(getState()); render(); })); dock.lastChild.className = 'chapter-hint';
  frame.append(world, panel, header, dock); root.append(frame); document.body.append(root);
  const menu = button(C5.locked, open); menu.id = 'menu-chapter-five'; menu.className = 'secondary'; (document.querySelector('#menu-chapter-four') || document.querySelector('.menu-play-row')).after(menu);
  let mode = 'room', notice = '', opener, heatFrame=0, heatStart=0, heat=0;
  function cancelHeat(){cancelAnimationFrame(heatFrame);heatFrame=0;heatStart=0;heat=0;const gauge=panel.querySelector('.chapter-five-heat');if(gauge){gauge.setAttribute('aria-valuenow','0');gauge.querySelector('b').style.left='0';}}
  function focus(next) { cancelHeat();mode = next; notice = ''; render(); }
  function doAction(action, target) { const result = dispatch('chapter-five-' + action, target); notice = result?.message || ''; sound(action === 'solder' ? 'repair' : action === 'end' ? 'object-radio' : 'tool'); render(); }
  function close() { cancelHeat();root.hidden = true; cat.setActive(false); onClose(); opener?.focus({ preventScroll: true }); }
  function open() { if (!chapterFiveAvailable(getState())) return; opener = document.activeElement; beforeOpen(); mode = 'room'; notice = ''; root.hidden = false; render(); exit.focus(); }
  function prop(label, name, position, run, className = '') {
    const b = button('', run); b.className = `chapter-prop ${className}`; b.setAttribute('aria-label', label); b.title = label;
    Object.assign(b.style, { left: position[0] + '%', top: position[1] + '%', width: position[2] + '%', height: position[3] + '%' }); b.append(art(name));
    if(name==='sign'){const label=document.createElement('span');label.className='chapter-five-sign-text';label.textContent=(chapterFiveProgress(getState()).chapterFive.ending==='window'?C5.lightForOurs:C5.safety).replace(' ','\n');b.append(label);}
    props.append(b); return b;
  }
  function nextMode(p) { return !p.unplugged ? 'safety' : !p.opened ? 'open' : !p.inspected || !p.diagnosed ? 'inspect' : !p.soldered ? 'repair' : !p.bulb ? 'bulb' : !p.closed ? 'close' : !p.tested ? 'test' : 'end'; }
  function nextLabel(p){return !p.unplugged?C5.unplug:!p.opened?C5.open:!p.inspected?C5.inspect:!p.diagnosed?C5.diagnose:!p.soldered?C5.solder:!p.bulb?C5.bulb:!p.closed?C5.close:!p.tested?C5.test:C5.end;}
  function lampDetail(name,p){const holder=document.createElement('div');holder.className='chapter-five-detail';holder.dataset.repaired=String(p.soldered);holder.dataset.lit=String(p.tested);holder.append(art(name));if(name==='open'){const joint=document.createElement('i');joint.className='chapter-five-joint';joint.setAttribute('aria-hidden','true');holder.append(joint);if(mode==='inspect'&&p.inspected&&!p.diagnosed){const wire=button('',()=>doAction('diagnose','wire'));wire.className='chapter-five-wire';wire.setAttribute('aria-label',C5.wire);wire.title=C5.wire;holder.append(wire);}}return holder;}
  function solderControl(){
    const gauge=document.createElement('div');gauge.className='chapter-five-heat';gauge.setAttribute('role','meter');gauge.setAttribute('aria-label',C5.heat);gauge.setAttribute('aria-valuemin','0');gauge.setAttribute('aria-valuemax','100');gauge.setAttribute('aria-valuenow','0');const zone=document.createElement('i'),cursor=document.createElement('b');gauge.append(zone,cursor);panel.append(gauge,text(C5.solderHelp,'chapter-five-gesture-help'));
    const hold=button(C5.solderHold,()=>{});hold.className='chapter-five-hold';
    const tick=now=>{heat=Math.min(1,(now-heatStart)/1600);cursor.style.left=(heat*100)+'%';gauge.setAttribute('aria-valuenow',Math.round(heat*100));if(heatStart)heatFrame=requestAnimationFrame(tick);};
    const start=()=>{if(heatStart)return;heatStart=performance.now();heatFrame=requestAnimationFrame(tick);};
    const finish=()=>{if(!heatStart)return;const value=Math.min(1,(performance.now()-heatStart)/1600);cancelHeat();doAction('solder',value);};
    hold.onpointerdown=e=>{e.preventDefault();hold.setPointerCapture(e.pointerId);start();};hold.onpointerup=finish;hold.onpointercancel=cancelHeat;
    hold.onkeydown=e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)start();}};hold.onkeyup=e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();finish();}};hold.onblur=cancelHeat;actions.append(hold);
  }
  function render() {
    const state = getState(), p = chapterFiveProgress(state).chapterFive, available = chapterFiveAvailable(state);
    menu.disabled = !available; menu.textContent = available ? C5.menu + (p.ending ? ' ✓' : '') : C5.locked;
    if (root.hidden) return;
    frame.dataset.mode = mode; frame.dataset.placement = p.ending || ''; frame.dataset.complete = String(!!p.ending);frame.dataset.bulb=p.bulb||'';
    world.style.backgroundImage = `url('assets/room/stage-${roomStage(state)}.png')`;
    props.replaceChildren(); panel.replaceChildren(); actions.replaceChildren(); panel.hidden = mode === 'room'; catHost.hidden = mode !== 'room'; cat.setActive(mode === 'room'); props.inert = mode !== 'room';
    glow.hidden = !p.ending;
    if (p.ending) {
      prop(C5.lamp, 'lamp', p.ending === 'desk' ? [42, 39, 25, 27] : [48, 8, 18, 16.5], () => focus('souvenir'), 'chapter-five-lit');
      prop(C5.souvenir, 'sign', p.ending === 'desk' ? [15, 54, 22, 12] : [31, 18, 16, 6.5], () => focus('souvenir'), 'chapter-five-sign');
    } else {
      prop(C5.lamp, 'lamp', [37, 37, 30, 30], () => focus(nextMode(p)),p.tested?'chapter-five-lit':'');
      prop(C5.tag, 'tag', [10, 54, 19, 16], () => focus('tag'));
      if (!p.unplugged) prop(C5.plug, 'plug', [76, 55, 14, 10], () => focus('safety'));
      if (p.soldered) prop(C5.bulb, 'bulbs', [70, 57, 25, 15], () => focus('bulb'));
    }
    goal.textContent = chapterFiveGoal(state);
    narrative.textContent = notice || ({ room: p.ending ? chapterFiveGoal(state) : C5.intro, tag: C5.tagText, safety: p.unplugged ? C5.unplugged : C5.needUnplug, open: p.opened ? C5.opened : C5.goalOpen, inspect: p.diagnosed ? C5.diagnosed : p.inspected ? C5.inspected : C5.goalInspect, repair: p.soldered ? C5.soldered : C5.solderHelp, bulb: p.bulb ? (p.bulb==='25'?C5.bulb25Done:C5.bulbDone) : C5.bulbHelp, close:p.closed?C5.closed:C5.goalClose,test:p.tested?C5.tested:C5.goalTest,end: C5.endHelp, souvenir: p.ending === 'desk' ? C5.endingDesk : C5.endingWindow, journal: chapterFiveGoal(state) })[mode];
    if (mode !== 'room') actions.append(button(C5.room, () => focus('room')));
    if (mode === 'room') {
      if (p.ending) actions.append(button(C5.souvenir, () => focus('souvenir')), button(C5.back, close));
      else {
        actions.append(button(C5.tag, () => focus('tag')));
        actions.append(button(nextLabel(p), () => focus(nextMode(p))));
      }
    }
    if (mode === 'tag') { const tag=document.createElement('div');tag.className='chapter-five-tag';tag.append(art('tag'),text('≤ 40 W','chapter-five-rating'));panel.append(tag);if (!p.unplugged) actions.append(button(C5.unplug, () => focus('safety')));else actions.append(button(nextLabel(p),()=>focus(nextMode(p)))); }
    if (mode === 'safety') { panel.append(art('plug')); if (!p.unplugged) actions.append(button(C5.unplug, () => doAction('unplug'))); else actions.append(button(C5.open, () => focus('open'))); }
    if (mode === 'open') { panel.append(lampDetail(p.opened?'open':'lamp',p)); if (!p.opened) actions.append(button(C5.open, () => doAction('open'))); else actions.append(button(C5.inspect, () => focus('inspect'))); }
    if (mode === 'inspect') {
      panel.append(lampDetail('open',p));
      if (!p.inspected) actions.append(button(C5.inspect, () => doAction('inspect')));
      else if (!p.diagnosed) {
        actions.append(button(C5.wire, () => doAction('diagnose', 'wire')), button(C5.bulbFault, () => doAction('diagnose', 'bulb')), button(C5.switchFault, () => doAction('diagnose', 'switch')));
      } else actions.append(button(C5.solder, () => focus('repair')));
    }
    if (mode === 'repair') { panel.append(lampDetail('open',p));if(!p.soldered)solderControl();else actions.append(button(C5.bulb,()=>focus('bulb'))); }
    if (mode === 'bulb') {
      panel.append(art('bulbs'),text('≤ 40 W','chapter-five-bulb-limit'));
      if (!p.bulb) for (const id of BULBS) actions.append(button(C5['bulb' + id], () => doAction('bulb', id)));
      else actions.append(button(C5.close, () => focus('close')));
    }
    if(mode==='close'){panel.append(lampDetail(p.closed?'lamp':'open',p));actions.append(button(p.closed?C5.test:C5.close,()=>p.closed?focus('test'):doAction('close')));}
    if(mode==='test'){panel.append(lampDetail('lamp',p));actions.append(button(p.tested?C5.end:C5.test,()=>p.tested?focus('end'):doAction('test')));}
    if (mode === 'end') {
      panel.append(art('lamp'));
      actions.append(button(C5.desk, () => { doAction('end', 'desk'); if (chapterFiveProgress(getState()).chapterFive.ending) focus('souvenir'); }), button(C5.window, () => { doAction('end', 'window'); if (chapterFiveProgress(getState()).chapterFive.ending) focus('souvenir'); }));
    }
    if (mode === 'souvenir') { panel.append(lampDetail('lamp',p));const sign=document.createElement('div');sign.className='chapter-five-souvenir-sign';sign.append(art('sign'),text((p.ending==='desk'?C5.safety:C5.lightForOurs).replace(' ','\n'),'chapter-five-sign-text'));panel.append(sign); }
    if (mode === 'journal') {
      const sheet = document.createElement('div'); sheet.className = 'chapter-evidence';
      for (const [key, label] of [['unplugged', C5.clueUnplug], ['opened', C5.clueOpen], ['diagnosed', C5.clueDiagnose], ['soldered', C5.clueSolder], ['bulb', C5.bulbInstalled],['tested',C5.clueTest]]) sheet.append(text((p[key] ? '✓ ' : '□ ') + label));
      panel.append(sheet);
      if (!p.ending) actions.append(button(nextLabel(p), () => focus(nextMode(p))));
    }
  }
  root.addEventListener('keydown', event => { if (event.key === 'Escape') { if (mode === 'room') close(); else focus('room'); } });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelHeat();});
  return { render, open, close };
}
