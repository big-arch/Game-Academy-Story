import { C2 } from './chapter-two-copy.js';
import { chapterTwoProgress,chapterTwoAvailable,chapterTwoGoal,EQUIPMENT,FILM_ORDER } from './chapter-two.js';
import { art } from './chapter-one-ui.js';
import { roomStage } from './workshop.js';
import { createCat } from './cat.js';

function button(label,run){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=run;return b;}
function text(value,className=''){const p=document.createElement('p');p.textContent=value;p.className=className;return p;}
export function createChapterTwoUI({getState,dispatch,sound,beforeOpen,onClose}){
  const root=document.createElement('section');root.className='room-chapter chapter-two';root.id='chapter-two';root.hidden=true;root.setAttribute('aria-label',C2.title);
  const frame=document.createElement('div');frame.className='chapter-frame';
  const world=document.createElement('div');world.className='chapter-world';
  const props=document.createElement('div');props.className='chapter-hotspots';world.append(props);
  const catHost=button(' ',()=>sound('purr'));catHost.className='bench-cat chapter-cat';catHost.dataset.min='68';catHost.dataset.max='78';catHost.dataset.floor='40';catHost.dataset.size='17';catHost.setAttribute('aria-label','Murzik');world.append(catHost);const cat=createCat(catHost);
  const header=document.createElement('header');header.className='chapter-header';const title=document.createElement('div');title.append(text(C2.subtitle),text(C2.title,'chapter-title'));const exit=button(C2.back,close);const journal=button('☷',()=>focus('journal'));journal.setAttribute('aria-label',C2.journal);journal.title=C2.journal;header.append(exit,title,journal);
  const panel=document.createElement('div');panel.className='chapter-two-panel';
  const dock=document.createElement('section');dock.className='chapter-dock';const goal=text('','chapter-goal'),narrative=text('','chapter-narrative'),actions=document.createElement('div');actions.className='chapter-actions';goal.setAttribute('role','status');narrative.setAttribute('aria-live','polite');dock.append(goal,narrative,actions,button(C2.hint,()=>{notice=chapterTwoGoal(getState());render();}));dock.lastChild.className='chapter-hint';
  frame.append(world,panel,header,dock);root.append(frame);document.body.append(root);
  const menu=button(C2.locked,open);menu.id='menu-chapter-two';menu.className='secondary';document.querySelector('.menu-play-row').after(menu);
  let mode='room',notice='',opener,timer=0,filmIndex=0;
  function focus(next){mode=next;notice='';render();}
  function doAction(action,target){const result=dispatch('chapter-two-'+action,target);notice=result?.message||'';sound(action==='show'?'object-tape':action==='check-focus'?'object-radio':'tool');render();}
  function close(){root.hidden=true;clearInterval(timer);cat.setActive(false);onClose();opener?.focus({preventScroll:true});}
  function open(){if(!chapterTwoAvailable(getState()))return;opener=document.activeElement;beforeOpen();mode='room';notice='';root.hidden=false;render();exit.focus();timer=setInterval(()=>{filmIndex=(filmIndex+1)%3;root.querySelectorAll('.chapter-two-film[data-running=true]').forEach(el=>{el.style.backgroundPosition=(filmIndex*50)+'% center';el.setAttribute('aria-label',[C2.fold,C2.sail,C2.wave][filmIndex]);});},2600);}
  function prop(label,name,position,run){const b=button('',run);b.className='chapter-prop';b.setAttribute('aria-label',label);b.title=label;Object.assign(b.style,{left:position[0]+'%',top:position[1]+'%',width:position[2]+'%',height:position[3]+'%'});b.append(art(name));props.append(b);}
  function film(index=0,running=false){const image=document.createElement('div');image.className='chapter-two-film';image.style.backgroundPosition=(index*50)+'% center';image.dataset.running=String(running&&!matchMedia('(prefers-reduced-motion: reduce)').matches);image.setAttribute('role','img');image.setAttribute('aria-label',[C2.fold,C2.sail,C2.wave][index]);return image;}
  function television(p){const tv=document.createElement('div');tv.className='chapter-two-tv';const shell=document.createElement('img');shell.src='assets/devices/television/parts/view-repaired.png';shell.alt='';tv.append(shell);if(p.powered){const image=film(p.choice==='people'?2:p.edited?1:0,!!p.choice);image.classList.add('chapter-two-picture');image.style.filter=p.focused?'none':`blur(${Math.abs(p.focus-62)/14}px)`;tv.append(image);}return tv;}
  function render(){
    const state=getState(),p=chapterTwoProgress(state).chapterTwo,available=chapterTwoAvailable(state);
    menu.disabled=!available;menu.textContent=available?C2.menu+(p.choice?' ✓':''):C2.locked;
    if(root.hidden)return;
    frame.dataset.mode=mode;frame.dataset.screening=String(!!p.choice);world.style.backgroundImage=`url('assets/room/stage-${roomStage(state)}.png')`;
    props.replaceChildren();panel.replaceChildren();actions.replaceChildren();panel.hidden=mode==='room';catHost.hidden=mode!=='room';cat.setActive(mode==='room');props.inert=mode!=='room';
    if(p.choice){const still=button('',()=>focus('souvenir'));still.className='chapter-prop chapter-two-souvenir';still.setAttribute('aria-label',C2.souvenir);still.append(film(p.choice==='people'?2:1));props.append(still);const tv=television(p);tv.classList.add('chapter-two-tv-room');props.append(tv);}
    else{prop(C2.invite,'reverse',[9,31,24,13],()=>{doAction('read');focus('invite');});prop(C2.montage,'tape',[74,57,21,10],()=>focus('montage'));const tvButton=button('',()=>focus(p.edited?'focus':'power'));tvButton.className='chapter-prop chapter-two-tv-button';tvButton.setAttribute('aria-label',C2.power);tvButton.append(television(p));props.append(tvButton);}
    goal.textContent=chapterTwoGoal(state);narrative.textContent=notice||({room:p.choice?C2.done:C2.intro,invite:C2.readDone,power:p.powered?C2.powered:C2.powerHelp,montage:p.edited?C2.cutDone:C2.montageHelp,focus:p.focused?C2.focused:C2.focusHelp,show:C2.choose,souvenir:p.choice==='boat'?C2.endingBoat:C2.endingPeople,journal:p.secret?C2.secret:chapterTwoGoal(state)})[mode];
    if(mode!=='room')actions.append(button(C2.room,()=>focus('room')));
    if(mode==='room'){
      if(!p.read)actions.append(button(C2.read,()=>{doAction('read');focus('invite');}));
      else if(p.choice)actions.append(button(C2.souvenir,()=>focus('souvenir')),button(C2.back,close));
      else actions.append(button(!p.powered?C2.power:!p.edited?C2.montage:!p.focused?C2.focus:C2.screening,()=>focus(!p.powered?'power':!p.edited?'montage':!p.focused?'focus':'show')),button(C2.journal,()=>focus('journal')));
    }
    if(mode==='invite'){panel.append(art('reverse'),text(C2.readDone,'chapter-two-note'));actions.append(button(C2.power,()=>focus('power')),button(C2.montage,()=>focus('montage')));}
    if(mode==='power'){
      panel.append(text('80 W','chapter-two-limit'));
      const load=text(C2.watts+' '+p.equipment.reduce((sum,id)=>sum+EQUIPMENT[id],0)+' / 80 W','chapter-two-load');load.dataset.over=String(p.equipment.reduce((sum,id)=>sum+EQUIPMENT[id],0)>80);panel.append(load);
      for(const id of Object.keys(EQUIPMENT)){const b=button(C2[id],()=>doAction('equipment',id));b.className='chapter-two-equipment';b.setAttribute('aria-pressed',String(p.equipment.includes(id)));panel.append(b);}
      actions.append(button(C2.testPower,()=>doAction('power')));if(p.powered)actions.append(button(C2.montage,()=>focus('montage')));
    }
    if(mode==='montage'){
      const order=text(C2.sequence+' '+(p.scenes.map(id=>String(FILM_ORDER.indexOf(id)+1)).join(' → ')||C2.empty));panel.append(order);
      const grid=document.createElement('div');grid.className='chapter-two-frames';for(const id of ['wave','fold','sail']){const b=button('',()=>doAction('scene',id));b.append(film(FILM_ORDER.indexOf(id)),text(C2[id]));b.disabled=p.scenes.includes(id);b.setAttribute('aria-label',C2[id]);grid.append(b);}panel.append(grid);
      actions.append(button(C2.undo,()=>doAction('undo')),button(C2.checkCut,()=>doAction('edit')));if(p.edited)actions.append(button(p.powered?C2.focus:C2.power,()=>focus(p.powered?'focus':'power')));
    }
    if(mode==='focus'){
      panel.append(television(p));const marks=document.createElement('div');marks.className='chapter-two-marks';const target=document.createElement('i'),moving=document.createElement('i');target.style.left='62%';moving.style.left=p.focus+'%';marks.append(target,moving);panel.append(marks);
      const range=document.createElement('input');range.type='range';range.min='0';range.max='100';range.value=p.focus;range.setAttribute('aria-label',C2.focus);range.oninput=()=>{moving.style.left=range.value+'%';const picture=panel.querySelector('.chapter-two-picture');if(picture)picture.style.filter=`blur(${Math.abs(Number(range.value)-62)/14}px)`;};range.onchange=()=>doAction('focus',Number(range.value));panel.append(range);
      actions.append(button(C2.checkFocus,()=>{doAction('focus',Number(range.value));doAction('check-focus');}));if(p.focused)actions.append(button(C2.inspect,()=>doAction('secret')),button(C2.screening,()=>focus('show')));
    }
    if(mode==='journal'){
      const sheet=document.createElement('div');sheet.className='chapter-evidence';for(const[key,label]of [['read',C2.clueRead],['powered',C2.cluePower],['edited',C2.clueCut],['focused',C2.clueFocus],['secret',C2.clueSecret]])sheet.append(text((p[key]?'✓ ':'□ ')+label));panel.append(sheet);
      if(!p.choice)actions.append(button(C2.read,()=>{doAction('read');focus('invite');}),button(C2.power,()=>focus('power')),button(C2.montage,()=>focus('montage')),button(C2.focus,()=>focus('focus')));
    }
    if(mode==='show'){panel.append(television(p));actions.append(button(C2.boatChoice,()=>{doAction('show','boat');if(chapterTwoProgress(getState()).chapterTwo.choice)focus('souvenir');}),button(C2.peopleChoice,()=>{doAction('show','people');if(chapterTwoProgress(getState()).chapterTwo.choice)focus('souvenir');}));}
    if(mode==='souvenir'){panel.append(film(p.choice==='people'?2:1),text(p.choice==='boat'?C2.sail:C2.wave));if(!p.secret)actions.append(button(C2.inspect,()=>doAction('secret')));}
  }
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){if(mode==='room')close();else focus('room');}});
  return {render,open,close};
}
