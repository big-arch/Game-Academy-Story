import { C } from './chapter-one-copy.js';
import { chapterProgress, chapterGoal, hasChapterFact } from './chapter-one.js';
import { roomStage } from './workshop.js';
import { createRoomCollection } from './room-collection.js';
import { createCat } from './cat.js';

export const CHAPTER_ART = {
  parcel:[107,31,348,294], opened:[560,21,408,317], photo:[1075,27,423,299],
  reverse:[66,358,421,291], tape:[583,390,383,243], tea:[1119,376,346,273],
  guest:[72,650,412,352], radio:[573,697,422,286], postcard:[1134,701,348,286], window:[1380,90,95,130],
};
let artSerial=0;
export function art(name) {
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox',CHAPTER_ART[name].join(' '));svg.setAttribute('aria-hidden','true');svg.classList.add('chapter-art');svg.dataset.sprite=name;
  const defs=document.createElementNS(svg.namespaceURI,'defs'),clip=document.createElementNS(svg.namespaceURI,'clipPath'),rect=document.createElementNS(svg.namespaceURI,'rect');
  const id='chapter-art-'+(++artSerial);clip.setAttribute('id',id);clip.setAttribute('clipPathUnits','userSpaceOnUse');
  ['x','y','width','height'].forEach((attr,i)=>rect.setAttribute(attr,String(CHAPTER_ART[name][i])));clip.append(rect);defs.append(clip);
  const image=document.createElementNS(svg.namespaceURI,'image');image.setAttribute('href','assets/room/chapter-one-atlas-v1.png');image.setAttribute('width','1536');image.setAttribute('height','1024');image.setAttribute('clip-path',`url(#${id})`);svg.append(defs,image);return svg;
}
function button(label, run, className='') {
  const b=document.createElement('button');b.type='button';b.textContent=label;b.className=className;b.onclick=run;return b;
}
function paragraph(text, className='') { const p=document.createElement('p');p.textContent=text;p.className=className;return p; }

export function createChapterOneUI({getState,dispatch,sound,beforeOpen,onClose}) {
  const root=document.createElement('section');root.id='room-chapter';root.className='room-chapter';root.hidden=true;root.setAttribute('aria-label',C.title);
  const frame=document.createElement('div');frame.className='chapter-frame';
  const world=document.createElement('div');world.className='chapter-world';
  const decor=document.createElement('div');decor.className='room-decor';
  const cabinet=button('',()=>{});cabinet.className='room-collection';decor.append(cabinet);world.append(decor);
  const visitorPaint=document.createElement('i');visitorPaint.className='chapter-visitor-paint';visitorPaint.setAttribute('aria-hidden','true');world.append(visitorPaint);
  const warmWindow=document.createElement('i');warmWindow.className='chapter-lit-window';warmWindow.append(art('window'));world.append(warmWindow);
  const hotspots=document.createElement('div');hotspots.className='chapter-hotspots';world.append(hotspots);
  const rain=document.createElement('canvas');rain.className='chapter-rain';rain.setAttribute('aria-hidden','true');world.append(rain);
  const catHost=button('',()=>sound('purr'),'bench-cat chapter-cat');catHost.dataset.min='65';catHost.dataset.max='73';catHost.dataset.floor='44';catHost.dataset.size='18';catHost.setAttribute('aria-label','Murzik');world.append(catHost);
  const cat=createCat(catHost);
  const header=document.createElement('header');header.className='chapter-header';
  const exit=button(C.back,close);const heading=document.createElement('div');heading.append(paragraph(C.subtitle),paragraph(C.title,'chapter-title'));
  const clues=button(C.journal,()=>focus('journal'));header.append(exit,heading,clues);
  const focusArea=document.createElement('div');focusArea.className='chapter-focus';
  const dock=document.createElement('section');dock.className='chapter-dock';dock.setAttribute('aria-label',C.focus);
  const objective=paragraph('','chapter-goal');objective.setAttribute('role','status');
  const narrative=paragraph('','chapter-narrative');narrative.setAttribute('aria-live','polite');
  const actions=document.createElement('div');actions.className='chapter-actions';
  const hint=button(C.hint,()=>{notice=chapterGoal(getState());render();});hint.className='chapter-hint';
  dock.append(objective,narrative,actions,hint);frame.append(world,focusArea,header,dock);root.append(frame);document.body.append(root);
  const collection=createRoomCollection({getState});collection.bind(cabinet,true);
  let mode='room', reversed=false, notice='', opener, animation=0, previous=0, drops=[];
  let dragPointer=null, tracing=false;
  function doAction(action,target) {
    const result=dispatch('chapter-'+action,target);notice=result?.message || '';
    sound(action==='listen'?(hasChapterFact(getState(),'radio')?'object-radio':'radio-static'):action==='play'||action==='return'?'object-tape':'tool');render();
  }
  function focus(next) { mode=next;notice='';render(); }
  function close() { root.hidden=true;cancelAnimationFrame(animation);cat.setActive(false);onClose();opener?.focus({preventScroll:true}); }
  function addHotspot(name,label,position,run) {
    const b=button('',run,'chapter-prop chapter-prop-'+name);b.setAttribute('aria-label',label);b.title=label;
    const [x,y,w,h]=position;Object.assign(b.style,{left:x+'%',top:y+'%',width:w+'%',height:h+'%'});
    if(CHAPTER_ART[name] && !['radio','guest'].includes(name))b.append(art(name));
    hotspots.append(b);return b;
  }
  function showArt(name) {focusArea.append(art(name));}
  function render() {
    const state=getState(), p=chapterProgress(state).chapterOne, has=fact=>hasChapterFact(state,fact);
    // Все улики собраны — Михалыч и комната сами ведут к записной книжке, а не молчат.
    const evidenceReady=()=>['radio','testimony','recording'].every(has);
    document.querySelector('#menu-chapter').textContent=has('delivered')?C.menuDone:C.menu;
    if(root.hidden || tracing)return;
    const visitor=has('guest')&&!has('delivered');
    frame.dataset.mode=mode;frame.dataset.visitor=String(visitor);frame.dataset.complete=String(has('delivered'));frame.dataset.stage=String(roomStage(state));decor.dataset.stage=String(roomStage(state));
    world.style.backgroundImage=`url('assets/room/stage-${roomStage(state)}.png')`;visitorPaint.hidden=!visitor;collection.render();cabinet.hidden=visitor;
    hotspots.replaceChildren();
    if(!has('delivered'))addHotspot(has('parcel')?'opened':'parcel',C.parcel,[35,51,30,17],()=>{if(!has('parcel'))doAction('open');else focus('parcel');});
    if(has('parcel')&&!has('delivered')){
      addHotspot('photo',C.photo,[13,45,21,10],()=>{doAction('photo');focus('photo');});
      addHotspot('tape',C.tape,[74,57,18,8],()=>focus('tape'));
    }
    addHotspot('radio',C.radio,[85,26.5,15,13.5],()=>focus('radio'));
    if(visitor) {
      addHotspot('guest',C.guest,[8,15,59,29],()=>focus('guest'));
      if(has('tea')){const cup=addHotspot('tea',C.tea,[68,35,12,9],()=>focus('guest'));cup.classList.add('chapter-hot-tea');}
    }
    if(has('delivered'))addHotspot('postcard',C.postcard,[39,55,28,14],()=>focus('postcard'));
    warmWindow.hidden=!has('delivered');
    hotspots.inert=mode!=='room';catHost.hidden=mode!=='room';cat.setActive(mode==='room'&&!visitor);cabinet.inert=mode!=='room';
    focusArea.replaceChildren();actions.replaceChildren();focusArea.hidden=mode==='room'||mode==='guest';focusArea.dataset.playing=String(mode==='tape'&&has('recording'));
    objective.textContent=chapterGoal(state);
    narrative.textContent=notice || ({room:has('delivered')?C.endingShort:has('parcel')?C.opened:C.intro,parcel:C.opened,photo:reversed?C.reverse:C.front,radio:has('radio')?C.broadcast:C.static,guest:has('testimony')?(evidenceReady()?C.ready:C.testimony):has('tea')?C.teaDone:C.welcome,tape:has('recording')?C.recording:has('tape')?C.repaired:C.tapeHelp,journal:C.evidenceHelp,postcard:C.ending})[mode];
    if(mode!=='room')actions.append(button(C.room,()=>focus('room')));
    if(mode==='room'){
      if(has('delivered'))actions.append(button(C.postcard,()=>focus('postcard')),button(C.back,close));
      else if(!has('parcel'))actions.append(button(C.open,()=>doAction('open')));
      else actions.append(button(C.photo,()=>{doAction('photo');focus('photo');}),button(C.radio,()=>focus('radio')));
      if(has('parcel')&&!has('guest'))actions.append(button(C.invite,()=>{doAction('invite');focus('guest');}));
      if(evidenceReady()&&!has('owner'))actions.prepend(button(C.evidence,()=>focus('journal')));
      if(has('owner')&&!has('delivered'))actions.prepend(button(C.deliver,()=>{doAction('return');mode='room';render();}));
    }
    if(mode==='parcel'){
      showArt('opened');actions.append(button(C.photo,()=>{doAction('photo');focus('photo');}),button(C.tape,()=>focus('tape')));
    }
    if(mode==='photo'){
      showArt(reversed?'reverse':'photo');
      if(reversed){const inscription=paragraph('91.7 · 1996','chapter-inscription');focusArea.append(inscription);}
      actions.append(button(reversed?C.unflip:C.flip,()=>{reversed=!reversed;if(reversed)doAction('flip');render();}));
    }
    if(mode==='radio'){
      showArt('radio');
      const label=document.createElement('label');label.textContent=C.tune;
      const range=document.createElement('input');range.type='range';range.min='880';range.max='1080';range.step='1';range.value=p.frequency;range.setAttribute('aria-label',C.tune);
      const value=document.createElement('output');value.textContent=(p.frequency/10).toFixed(1)+' FM';
      range.oninput=()=>{value.textContent=(Number(range.value)/10).toFixed(1)+' FM';};
      range.onchange=()=>doAction('frequency',Number(range.value));label.append(range,value);focusArea.append(label);
      actions.append(button(C.listen,()=>{doAction('frequency',Number(range.value));doAction('listen');}));
    }
    if(mode==='guest'){
      if(!has('guest'))actions.append(button(C.invite,()=>doAction('invite')));
      else if(!has('tea'))actions.append(...[['lemon',C.lemon],['sugar',C.sugar],['jam',C.jam]].map(([id,label])=>button(label,()=>doAction('tea',id))));
      else if(!has('testimony'))actions.append(button(C.showPhoto,()=>{if(!has('photo')){notice=C.teaFirst;render();}else doAction('show-photo');}));
      if(has('testimony')&&!has('owner'))actions.append(button(C.evidence,()=>focus('journal')));
    }
    if(mode==='tape'){
      showArt('tape');focusArea.dataset.playing=String(has('recording'));
      if(!has('tape')){
        actions.append(button(C.clockwise,()=>doAction('tighten','clockwise')),button(C.counter,()=>doAction('tighten','counter')));
        const route=document.createElement('div');route.className='chapter-tape-route';
        for(let i=0;i<3;i++){
          const point=button(String(i+1),()=>doAction('route',i));point.setAttribute('aria-label',C.route+' '+(i+1));point.dataset.done=String(i<p.tapeRoute);route.append(point);
        }
        // Pointer users can trace the tape path; individual taps/keyboard are equivalent.
        const trace=e=>{for(let i=0;i<route.children.length;i++){const r=route.children[i].getBoundingClientRect();const current=chapterProgress(getState()).chapterOne;if(i===current.tapeRoute&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){doAction('route',i);route.children[i].dataset.done=String(chapterProgress(getState()).chapterOne.tapeRoute>i);break;}}};
        route.onpointerdown=e=>{e.preventDefault();tracing=true;dragPointer=e.pointerId;route.setPointerCapture(e.pointerId);trace(e);};
        route.onpointermove=e=>{if(dragPointer===e.pointerId)trace(e);};
        const endTrace=()=>{dragPointer=null;tracing=false;render();};route.onpointerup=endTrace;route.onpointercancel=endTrace;focusArea.append(route);
      }else actions.append(button(C.play,()=>doAction('play')));
    }
    if(mode==='journal'){
      const sheet=document.createElement('div');sheet.className='chapter-evidence';
      for(const [fact,text]of [['photo',C.cluePhoto],['radio',C.clueRadio],['testimony',C.clueGuest],['recording',C.clueTape]])sheet.append(paragraph((has(fact)?'✓ ':'□ ')+(has(fact)?text:C.noClue)));
      focusArea.append(sheet);narrative.textContent=notice||C.evidenceHelp;
      if(!has('owner'))for(const [id,label]of [['anna',C.anna],['nina',C.nina],['pavel',C.pavel]])actions.append(button(label,()=>doAction('identify',id)));
      else if(!has('delivered'))actions.append(button(C.deliver,()=>{doAction('return');mode='room';render();}));
    }
    if(mode==='postcard')showArt('postcard');
  }
  function animate(time) {
    if(root.hidden)return;
    const dt=Math.min(40,time-(previous||time));previous=time;
    const ctx=rain.getContext('2d');rain.width=210;rain.height=170;
    if(Math.random()<.7)drops.push({x:Math.random()*230,y:-10,speed:2+Math.random()*3});
    ctx.strokeStyle='#a4c3db99';ctx.lineWidth=1;
    drops=drops.filter(drop=>drop.y<190);for(const drop of drops){drop.y+=drop.speed*dt/16;drop.x-=dt*.03;ctx.beginPath();ctx.moveTo(drop.x,drop.y);ctx.lineTo(drop.x-2,drop.y+9);ctx.stroke();}
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)animation=requestAnimationFrame(animate);
  }
  root.addEventListener('keydown',event=>{if(event.key==='Escape'){if(mode!=='room')focus('room');else close();}});
  return {render,open(){opener=document.activeElement;beforeOpen();root.hidden=false;mode='room';notice='';render();previous=0;animation=requestAnimationFrame(animate);exit.focus();},close};
}
