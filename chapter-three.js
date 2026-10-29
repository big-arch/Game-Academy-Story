import { chapterTwoProgress } from './chapter-two.js';
import { C3 } from './chapter-three-copy.js';

export const CHAPTER_THREE_REWARD = 120;
export const BATTERIES = {aa1:1.5, aa2:1.5, block:9};
export const CALLSIGNS = {kettle:'mikhalych', note:'anna', window:'zoya'};
export const CHANNEL = 37;
const PEOPLE = Object.values(CALLSIGNS);
export function chapterThreeProgress(state) {
  const p=state.chapterThree||{};
  const map={};for(const [sign,person] of Object.entries(p.map&&typeof p.map==='object'?p.map:{}))if(Object.hasOwn(CALLSIGNS,sign)&&PEOPLE.includes(person))map[sign]=person;
  return {chapterThree:{
    tag:p.tag===true, powered:p.powered===true, mapped:p.mapped===true, tuned:p.tuned===true,
    batteries:[...new Set((Array.isArray(p.batteries)?p.batteries:[]).filter(id=>Object.hasOwn(BATTERIES,id)))],
    map, dial:Number.isInteger(p.dial)&&p.dial>=0&&p.dial<=99?p.dial:12,
    call:['anna','mikhalych'].includes(p.call)?p.call:null,
  }};
}
export function chapterThreeAvailable(state){return !!chapterTwoProgress(state).chapterTwo.choice;}
export function chapterThreeGoal(state){
  const p=chapterThreeProgress(state).chapterThree;
  return p.call?C3.done:!p.tag?C3.goalTag:!p.powered?C3.goalPower:!p.mapped?C3.goalMap:!p.tuned?C3.goalDial:C3.goalCall;
}
// Шаги «питание» и «позывные» идут в любом порядке; канал ищется после бирки и питания.
export function actChapterThree(state,action,target){
  const p=chapterThreeProgress(state).chapterThree;
  const unchanged=message=>({state,message});
  const update=(next,message='',extra={})=>({state:{...state,chapterThree:{...p,...next},...extra},message});
  if(!chapterThreeAvailable(state))return unchanged(C3.needFirst);
  if(p.call)return unchanged(p.call==='anna'?C3.endingAnna:C3.endingMikhalych);
  if(action==='tag')return update({tag:true},C3.tagDone);
  if(action==='battery'&&Object.hasOwn(BATTERIES,target)){
    const batteries=p.batteries.includes(target)?p.batteries.filter(id=>id!==target):[...p.batteries,target];
    return update({batteries,powered:false,tuned:false});
  }
  if(action==='power'){
    if(p.batteries.includes('block'))return unchanged(C3.wrongBattery);
    if(p.batteries.length!==2)return unchanged(C3.needTwo);
    return update({powered:true},C3.powered);
  }
  if(action==='assign'&&target&&Object.hasOwn(CALLSIGNS,target.sign)&&PEOPLE.includes(target.person))return update({map:{...p.map,[target.sign]:target.person},mapped:false});
  if(action==='check-map'){
    if(!Object.entries(CALLSIGNS).every(([sign,person])=>p.map[sign]===person))return unchanged(C3.badMap);
    return update({mapped:true},C3.mapDone);
  }
  if(action==='dial'&&Number.isInteger(target)&&target>=0&&target<=99)return update({dial:target,tuned:false});
  if(action==='listen'){
    if(!p.tag)return unchanged(C3.needTag);
    if(!p.powered)return unchanged(C3.needPower);
    return p.dial===CHANNEL?update({tuned:true},C3.tuned):unchanged(C3.noise);
  }
  if(action==='call'&&['anna','mikhalych'].includes(target)){
    if(!p.powered||!p.mapped||!p.tuned)return unchanged(C3.needAll);
    return update({call:target},target==='anna'?C3.endingAnna:C3.endingMikhalych,{coins:(Number.isSafeInteger(state.coins)&&state.coins>=0?state.coins:0)+CHAPTER_THREE_REWARD});
  }
  return unchanged(chapterThreeGoal(state));
}
