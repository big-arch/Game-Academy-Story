import { C4 } from './chapter-four-copy.js';
import { chapterFourProgress,chapterFourAvailable,chapterFourGoal,OILS,READERS,TIMES } from './chapter-four.js';
import { roomStage } from './workshop.js';
import { createCat } from './cat.js';

// Предметы главы 4 — отдельные спрайты на прозрачном фоне: assets/room/chapter-four/<name>.png.
function art(name,className='chapter-three-art'){const el=document.createElement('img');el.src=`assets/room/chapter-four/${name}.png`;el.alt='';el.className=className;el.dataset.sprite=name;return el;}
function button(label,run){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=run;return b;}
function text(value,className=''){const p=document.createElement('p');p.textContent=value;p.className=className;return p;}
export function createChapterFourUI({getState,dispatch,sound,beforeOpen,onClose}){
  const root=document.createElement('section');root.className='room-chapter chapter-two chapter-three chapter-four';root.id='chapter-four';root.hidden=true;root.setAttribute('aria-label',C4.title);
  const frame=document.createElement('div');frame.className='chapter-frame';
  const world=document.createElement('div');world.className='chapter-world';
  const props=document.createElement('div');props.className='chapter-hotspots';world.append(props);
  const catHost=button(' ',()=>sound('purr'));catHost.className='bench-cat chapter-cat';catHost.dataset.min='68';catHost.dataset.max='78';catHost.dataset.floor='40';catHost.dataset.size='17';catHost.setAttribute('aria-label','Murzik');world.append(catHost);const cat=createCat(catHost);
  const header=document.createElement('header');header.className='chapter-header';const title=document.createElement('div');title.append(text(C4.subtitle),text(C4.title,'chapter-title'));const exit=button(C4.back,close);const journal=button('☷',()=>focus('journal'));journal.setAttribute('aria-label',C4.journal);journal.title=C4.journal;header.append(exit,title,journal);
  const panel=document.createElement('div');panel.className='chapter-two-panel';
  const dock=document.createElement('section');dock.className='chapter-dock';const goal=text('','chapter-goal'),narrative=text('','chapter-narrative'),actions=document.createElement('div');actions.className='chapter-actions';goal.setAttribute('role','status');narrative.setAttribute('aria-live','polite');dock.append(goal,narrative,actions,button(C4.hint,()=>{notice=chapterFourGoal(getState());render();}));dock.lastChild.className='chapter-hint';
  frame.append(world,panel,header,dock);root.append(frame);document.body.append(root);
  const menu=button(C4.locked,open);menu.id='menu-chapter-four';menu.className='secondary';(document.querySelector('#menu-chapter-three')||document.querySelector('.menu-play-row')).after(menu);
  let mode='room',notice='',opener;
  function focus(next){mode=next;notice='';render();}
  function askZoya(){mode='zoya';doAction('ask');notice=C4.zoyaStory;render();}
  function doAction(action,target){const result=dispatch('chapter-four-'+action,target);notice=result?.message||'';sound(action==='type'||action==='end'?'object-tape':'tool');render();}
  function close(){root.hidden=true;cat.setActive(false);onClose();opener?.focus({preventScroll:true});}
  function open(){if(!chapterFourAvailable(getState()))return;opener=document.activeElement;beforeOpen();mode='room';notice='';root.hidden=false;render();exit.focus();}
  function prop(label,name,position,run){const b=button('',run);b.className='chapter-prop';b.setAttribute('aria-label',label);b.title=label;Object.assign(b.style,{left:position[0]+'%',top:position[1]+'%',width:position[2]+'%',height:position[3]+'%'});b.append(art(name));props.append(b);return b;}
  // Письмо на ленте: до зеркала строки перевёрнуты, после — читаются; в конце допечатанное время.
  function letter(p,reversed){const sheet=text(C4.letterText+(p.typed?' 06:40'+C4.letterEnd:'…'),'chapter-four-letter');sheet.dataset.reversed=String(reversed);return sheet;}
  function choices(list,labels,action){const row=document.createElement('div');row.className='chapter-four-choices';for(const id of list){const b=button('',()=>doAction(action,id));b.append(art(id),text(labels[id]));b.setAttribute('aria-label',labels[id]);row.append(b);}return row;}
  function render(){
    const state=getState(),p=chapterFourProgress(state).chapterFour,available=chapterFourAvailable(state);
    menu.disabled=!available;menu.textContent=available?C4.menu+(p.ending?' ✓':''):C4.locked;
    if(root.hidden)return;
    frame.dataset.mode=mode;world.style.backgroundImage=`url('assets/room/stage-${roomStage(state)}.png')`;
    props.replaceChildren();panel.replaceChildren();actions.replaceChildren();panel.hidden=mode==='room';catHost.hidden=mode!=='room';cat.setActive(mode==='room');props.inert=mode!=='room';
    prop(C4.typewriter,'typewriter',[32,41,36,22],()=>focus(!p.oiled?'carriage':!p.mirrored?'ribbon':'letter'));
    if(!p.ending){
      if(!p.oiled)prop(C4.sewing,'sewing',[6,50,17,14],()=>focus('carriage'));
      else prop(C4.ticket,'ticket',[6,60,22,9],()=>focus('ticket'));
      prop(C4.mirror,'mirror',[74,45,18,14],()=>focus('ribbon'));
    }
    if(p.typed&&!p.ending||p.ending==='shelf')prop(C4.letter,'envelope',[70,62,22,10],()=>focus(p.ending?'souvenir':'end'));
    goal.textContent=chapterFourGoal(state);
    narrative.textContent=notice||({room:p.ending?C4.done:C4.intro,zoya:C4.zoyaStory,carriage:p.oiled?C4.oiled:C4.carriageHelp,ticket:C4.ticketText,ribbon:p.mirrored?C4.mirrored:p.oiled?C4.ribbonHelp:C4.ribbonLocked,letter:p.typed?C4.typed:C4.finishHelp,end:C4.choose,souvenir:p.ending==='zoya'?C4.endingZoya:C4.endingShelf,journal:chapterFourGoal(state)})[mode];
    if(mode!=='room')actions.append(button(C4.room,()=>focus('room')));
    if(mode==='room'){
      if(p.ending)actions.append(button(C4.souvenir,()=>focus('souvenir')),button(C4.back,close));
      else{
        if(!p.asked)actions.append(button(C4.ask,askZoya));
        actions.append(button(!p.oiled?C4.carriage:!p.mirrored?C4.ribbon:!p.typed?C4.finish:C4.letter,()=>focus(!p.oiled?'carriage':!p.mirrored?'ribbon':!p.typed?'letter':'end')));
        if(p.asked)actions.append(button(C4.zoya,askZoya));
      }
    }
    if(mode==='carriage'){panel.append(art('typewriter'));if(!p.oiled)panel.append(choices(OILS,{sewing:C4.sewing,sunflower:C4.sunflower,water:C4.water},'oil'));else actions.append(button(C4.ticket,()=>focus('ticket')),button(C4.ribbon,()=>focus('ribbon')));}
    if(mode==='ticket'){panel.append(art('ticket'),text(C4.ticketText,'chapter-two-note'));}
    if(mode==='ribbon'){
      if(p.oiled)panel.append(letter(p,!p.mirrored));
      if(!p.oiled)actions.append(button(C4.carriage,()=>focus('carriage')));
      else if(!p.mirrored)panel.append(choices(READERS,{mirror:C4.mirror,magnifier:C4.magnifier,lamp:C4.lamp},'read'));
      else actions.append(button(C4.finish,()=>focus('letter')));
    }
    if(mode==='letter'){
      if(!p.mirrored){notice=notice||(p.oiled?C4.needMirror:C4.needOil);narrative.textContent=notice;actions.append(button(p.oiled?C4.ribbon:C4.carriage,()=>focus(p.oiled?'ribbon':'carriage')));}
      else{panel.append(letter(p,false));if(!p.typed){const row=document.createElement('div');row.className='chapter-four-times';for(const id of TIMES)row.append(button(C4['time'+id],()=>doAction('type',id)));panel.append(row);if(p.oiled)actions.append(button(C4.ticket,()=>focus('ticket')));}else actions.append(button(C4.letter,()=>focus('end')));}
    }
    if(mode==='end'){panel.append(art('envelope'));if(!p.ending)actions.append(button(C4.giveZoya,()=>{doAction('end','zoya');if(chapterFourProgress(getState()).chapterFour.ending)focus('souvenir');}),button(C4.keepShelf,()=>{doAction('end','shelf');if(chapterFourProgress(getState()).chapterFour.ending)focus('souvenir');}));}
    if(mode==='souvenir')panel.append(letter(p,false));
    if(mode==='journal'){
      const sheet=document.createElement('div');sheet.className='chapter-evidence';for(const[key,label]of [['asked',C4.clueAsk],['oiled',C4.clueOil],['mirrored',C4.clueRibbon],['typed',C4.clueType]])sheet.append(text((p[key]?'✓ ':'□ ')+label));panel.append(sheet);
      if(p.asked)panel.append(text(C4.zoyaStory,'chapter-two-note'));
      if(p.oiled)panel.append(text(C4.ticketText,'chapter-two-note'));
      if(!p.ending)actions.append(button(C4.zoya,askZoya),button(C4.carriage,()=>focus('carriage')),button(C4.ribbon,()=>focus('ribbon')));
    }
  }
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){if(mode==='room')close();else focus('room');}});
  return {render,open,close};
}
