import { C3 } from './chapter-three-copy.js';
import { chapterThreeProgress,chapterThreeAvailable,chapterThreeGoal,BATTERIES,CALLSIGNS } from './chapter-three.js';
import { roomStage } from './workshop.js';
import { createCat } from './cat.js';

// Предметы главы 3 — отдельные спрайты на прозрачном фоне: assets/room/chapter-three/<name>.png.
function art(name){const el=document.createElement('img');el.src=`assets/room/chapter-three/${name}.png`;el.alt='';el.className='chapter-three-art';el.dataset.sprite=name;return el;}
function button(label,run){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=run;return b;}
function text(value,className=''){const p=document.createElement('p');p.textContent=value;p.className=className;return p;}
export function createChapterThreeUI({getState,dispatch,sound,beforeOpen,onClose}){
  const root=document.createElement('section');root.className='room-chapter chapter-two chapter-three';root.id='chapter-three';root.hidden=true;root.setAttribute('aria-label',C3.title);
  const frame=document.createElement('div');frame.className='chapter-frame';
  const world=document.createElement('div');world.className='chapter-world';
  const props=document.createElement('div');props.className='chapter-hotspots';world.append(props);
  const catHost=button(' ',()=>sound('purr'));catHost.className='bench-cat chapter-cat';catHost.dataset.min='68';catHost.dataset.max='78';catHost.dataset.floor='40';catHost.dataset.size='17';catHost.setAttribute('aria-label','Murzik');world.append(catHost);const cat=createCat(catHost);
  const header=document.createElement('header');header.className='chapter-header';const title=document.createElement('div');title.append(text(C3.subtitle),text(C3.title,'chapter-title'));const exit=button(C3.back,close);const journal=button('☷',()=>focus('journal'));journal.setAttribute('aria-label',C3.journal);journal.title=C3.journal;header.append(exit,title,journal);
  const panel=document.createElement('div');panel.className='chapter-two-panel';
  const dock=document.createElement('section');dock.className='chapter-dock';const goal=text('','chapter-goal'),narrative=text('','chapter-narrative'),actions=document.createElement('div');actions.className='chapter-actions';goal.setAttribute('role','status');narrative.setAttribute('aria-live','polite');dock.append(goal,narrative,actions,button(C3.hint,()=>{notice=chapterThreeGoal(getState());render();}));dock.lastChild.className='chapter-hint';
  frame.append(world,panel,header,dock);root.append(frame);document.body.append(root);
  const menu=button(C3.locked,open);menu.id='menu-chapter-three';menu.className='secondary';(document.querySelector('#menu-chapter-two')||document.querySelector('.menu-play-row')).after(menu);
  let mode='room',notice='',opener;
  function focus(next){mode=next;notice='';render();}
  function doAction(action,target){const result=dispatch('chapter-three-'+action,target);notice=result?.message||'';sound(action==='listen'?(chapterThreeProgress(getState()).chapterThree.tuned?'object-radio':'radio-static'):action==='call'?'object-radio':'tool');render();}
  function close(){root.hidden=true;cat.setActive(false);onClose();opener?.focus({preventScroll:true});}
  function open(){if(!chapterThreeAvailable(getState()))return;opener=document.activeElement;beforeOpen();mode='room';notice='';root.hidden=false;render();exit.focus();}
  function prop(label,name,position,run){const b=button('',run);b.className='chapter-prop';b.setAttribute('aria-label',label);b.title=label;Object.assign(b.style,{left:position[0]+'%',top:position[1]+'%',width:position[2]+'%',height:position[3]+'%'});b.append(art(name));props.append(b);return b;}
  function render(){
    const state=getState(),p=chapterThreeProgress(state).chapterThree,available=chapterThreeAvailable(state);
    menu.disabled=!available;menu.textContent=available?C3.menu+(p.call?' ✓':''):C3.locked;
    if(root.hidden)return;
    frame.dataset.mode=mode;world.style.backgroundImage=`url('assets/room/stage-${roomStage(state)}.png')`;
    props.replaceChildren();panel.replaceChildren();actions.replaceChildren();panel.hidden=mode==='room';catHost.hidden=mode!=='room';cat.setActive(mode==='room');props.inert=mode!=='room';
    if(p.call)prop(C3.drawing,'drawing',[30,40,40,24],()=>focus('drawing')).classList.add('chapter-three-pinned');
    else{prop(C3.radio,!p.tag||p.powered?'radio':'open',[36,40,28,24],()=>{if(!p.tag){doAction('tag');focus('tag');}else focus(p.powered?'dial':'batteries');});prop(C3.batteries,'batteries',[5,60,26,10],()=>focus('batteries'));prop(C3.map,'map',[69,57,26,14],()=>focus('map'));}
    goal.textContent=chapterThreeGoal(state);
    narrative.textContent=notice||({room:p.call?C3.done:C3.intro,tag:C3.tagDone,batteries:p.powered?C3.powered:C3.batteryHelp,map:p.mapped?C3.mapDone:C3.mapHelp,dial:p.tuned?C3.tuned:C3.dialHelp,call:C3.callHelp,drawing:p.call==='anna'?C3.endingAnna:C3.endingMikhalych,journal:chapterThreeGoal(state)})[mode];
    if(mode!=='room')actions.append(button(C3.room,()=>focus('room')));
    if(mode==='room'){
      if(p.call)actions.append(button(C3.drawing,()=>focus('drawing')),button(C3.back,close));
      else if(!p.tag)actions.append(button(C3.tag,()=>{doAction('tag');focus('tag');}));
      else actions.append(button(!p.powered?C3.batteries:!p.mapped?C3.map:!p.tuned?C3.dial:C3.call,()=>focus(!p.powered?'batteries':!p.mapped?'map':!p.tuned?'dial':'call')),button(C3.journal,()=>focus('journal')));
    }
    if(mode==='tag'){panel.append(art('radio'),text(C3.tagDone,'chapter-two-note'));actions.append(button(C3.batteries,()=>focus('batteries')),button(C3.map,()=>focus('map')));}
    if(mode==='batteries'){
      panel.append(art(p.powered?'radio':'open'),art('batteries'));
      const volts=p.batteries.reduce((sum,id)=>sum+BATTERIES[id],0);const load=text(volts.toLocaleString()+' / 3 V','chapter-two-load');load.dataset.over=String(volts>3);panel.append(load);
      for(const id of Object.keys(BATTERIES)){const b=button(id==='block'?C3.block:C3.aa1,()=>doAction('battery',id));b.className='chapter-two-equipment';b.setAttribute('aria-pressed',String(p.batteries.includes(id)));panel.append(b);}
      actions.append(button(C3.insert,()=>doAction('power')));if(p.powered)actions.append(button(C3.dial,()=>focus('dial')));
    }
    if(mode==='map'){
      panel.append(art('map'));
      for(const sign of Object.keys(CALLSIGNS)){
        const row=document.createElement('label');row.className='chapter-three-sign';row.append(text(C3[sign]));
        const select=document.createElement('select');select.setAttribute('aria-label',C3[sign]);select.append(new Option(C3.chooseFor,''));
        for(const person of Object.values(CALLSIGNS))select.append(new Option(C3[person],person,false,p.map[sign]===person));
        select.onchange=()=>doAction('assign',{sign,person:select.value});row.append(select);panel.append(row);
      }
      actions.append(button(C3.checkMap,()=>doAction('check-map')));
    }
    if(mode==='dial'){
      panel.append(art('dial'));panel.append(text(p.tag?C3.tagDone:C3.tagUnread,'chapter-two-note'));const value=text(C3.channel+' '+p.dial,'chapter-two-limit');panel.append(value);
      const range=document.createElement('input');range.type='range';range.min='0';range.max='99';range.value=p.dial;range.setAttribute('aria-label',C3.dial);
      range.oninput=()=>{value.textContent=C3.channel+' '+range.value;};range.onchange=()=>doAction('dial',Number(range.value));panel.append(range);
      if(!p.tag)actions.append(button(C3.tag,()=>{doAction('tag');focus('dial');}));
      actions.append(button(C3.listen,()=>{doAction('dial',Number(range.value));doAction('listen');}));if(p.tuned&&p.mapped)actions.append(button(C3.call,()=>focus('call')));else if(p.tuned)actions.append(button(C3.map,()=>focus('map')));
    }
    if(mode==='call'){panel.append(art('radio'));actions.append(button(C3.callAnna,()=>{doAction('call','anna');if(chapterThreeProgress(getState()).chapterThree.call)focus('drawing');}),button(C3.callMikhalych,()=>{doAction('call','mikhalych');if(chapterThreeProgress(getState()).chapterThree.call)focus('drawing');}));}
    if(mode==='drawing')panel.append(art('drawing'));
    if(mode==='journal'){
      const sheet=document.createElement('div');sheet.className='chapter-evidence';if(p.tag)sheet.append(text(C3.tagDone,'chapter-two-note'));for(const[key,label]of [['tag',C3.clueTag],['powered',C3.cluePower],['mapped',C3.clueMap],['tuned',C3.clueDial]])sheet.append(text((p[key]?'✓ ':'□ ')+label));panel.append(sheet);
      if(!p.call)actions.append(button(C3.batteries,()=>focus('batteries')),button(C3.map,()=>focus('map')),button(C3.dial,()=>focus('dial')));
    }
  }
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){if(mode==='room')close();else focus('room');}});
  return {render,open,close};
}
