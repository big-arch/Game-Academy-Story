import { hasChapterFact } from './chapter-one.js';
import { C2 } from './chapter-two-copy.js';

export const CHAPTER_TWO_REWARD = 120;
export const EQUIPMENT = {tv:45, vcr:25, lamp:15};
export const FILM_ORDER = ['fold','sail','wave'];
export function chapterTwoProgress(state) {
  const p=state.chapterTwo||{};
  return {chapterTwo:{
    read:p.read===true, powered:p.powered===true, edited:p.edited===true,
    focused:p.focused===true, secret:p.secret===true,
    choice:['boat','people'].includes(p.choice)?p.choice:null,
    equipment:[...new Set((Array.isArray(p.equipment)?p.equipment:[]).filter(id=>Object.hasOwn(EQUIPMENT,id)))],
    scenes:[...new Set((Array.isArray(p.scenes)?p.scenes:[]).filter(id=>FILM_ORDER.includes(id)))],
    focus:Number.isInteger(p.focus)&&p.focus>=0&&p.focus<=100?p.focus:20,
  }};
}
export function chapterTwoAvailable(state){return hasChapterFact(state,'delivered');}
export function chapterTwoGoal(state){
  const p=chapterTwoProgress(state).chapterTwo;
  if(p.choice)return C2.done;
  return !p.read?C2.goalRead:!p.powered?C2.goalPower:!p.edited?C2.goalCut:!p.focused?C2.goalFocus:C2.goalShow;
}
export function actChapterTwo(state,action,target){
  const p=chapterTwoProgress(state).chapterTwo;
  const unchanged=message=>({state,message});
  const update=(next,message='',extra={})=>({state:{...state,chapterTwo:{...p,...next},...extra},message});
  if(!chapterTwoAvailable(state))return unchanged(C2.needFirst);
  if(action==='secret'&&p.powered&&p.edited&&p.focused)return update({secret:true},C2.secret);
  if(p.choice)return unchanged(p.choice==='boat'?C2.endingBoat:C2.endingPeople);
  if(action==='read')return update({read:true},C2.readDone);
  if(!p.read)return unchanged(C2.needInvite);
  if(action==='equipment'&&Object.hasOwn(EQUIPMENT,target)){
    const equipment=p.equipment.includes(target)?p.equipment.filter(id=>id!==target):[...p.equipment,target];
    return update({equipment,powered:false,focused:false},C2.powerHelp);
  }
  if(action==='power'){
    if(p.equipment.reduce((sum,id)=>sum+EQUIPMENT[id],0)>80)return unchanged(C2.overload);
    if(!['tv','vcr'].every(id=>p.equipment.includes(id)))return unchanged(C2.missingPower);
    return update({powered:true},C2.powered);
  }
  if(action==='scene'&&FILM_ORDER.includes(target)&&!p.scenes.includes(target))return update({scenes:[...p.scenes,target],edited:false,focused:false});
  if(action==='undo')return update({scenes:p.scenes.slice(0,-1),edited:false,focused:false});
  if(action==='edit'){
    if(p.scenes.join(',')!==FILM_ORDER.join(','))return unchanged(C2.badCut);
    return update({edited:true},C2.cutDone);
  }
  if(action==='focus'&&Number.isInteger(target)&&target>=0&&target<=100)return update({focus:target,focused:false});
  if(!p.powered)return unchanged(C2.needPower);
  if(!p.edited)return unchanged(C2.needCut);
  if(action==='check-focus')return Math.abs(p.focus-62)<=3?update({focused:true},C2.focused):unchanged(C2.blurred);
  if(!p.focused)return unchanged(C2.needFocus);
  if(action==='secret')return update({secret:true},C2.secret);
  if(action==='show'&&['boat','people'].includes(target))return update({choice:target},target==='boat'?C2.endingBoat:C2.endingPeople,{coins:(Number.isSafeInteger(state.coins)&&state.coins>=0?state.coins:0)+CHAPTER_TWO_REWARD});
  return unchanged(chapterTwoGoal(state));
}
