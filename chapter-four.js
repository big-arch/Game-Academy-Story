import { chapterThreeProgress } from './chapter-three.js';
import { C4 } from './chapter-four-copy.js';

export const CHAPTER_FOUR_REWARD = 150;
export const OILS = ['sewing','sunflower','water'];
export const READERS = ['mirror','magnifier','lamp'];
export const TIMES = ['0640','1640','1410'];
export function chapterFourProgress(state) {
  const p=state.chapterFour||{};
  return {chapterFour:{
    asked:p.asked===true, oiled:p.oiled===true, mirrored:p.mirrored===true, typed:p.typed===true,
    ending:['zoya','shelf'].includes(p.ending)?p.ending:null,
  }};
}
export function chapterFourAvailable(state){return !!chapterThreeProgress(state).chapterThree.call;}
export function chapterFourGoal(state){
  const p=chapterFourProgress(state).chapterFour;
  return p.ending?C4.done:!p.asked?C4.goalAsk:!p.oiled?C4.goalOil:!p.mirrored?C4.goalRibbon:!p.typed?C4.goalType:C4.goalChoose;
}
// Цепочка как в жизни: каретка держит катушку ленты, лента показывает, где оборвалось письмо,
// билет из-под каретки подсказывает время. Разговор с Зоей можно пропустить — масло подбирается и без подсказки.
export function actChapterFour(state,action,target){
  const p=chapterFourProgress(state).chapterFour;
  const unchanged=message=>({state,message});
  const update=(next,message='',extra={})=>({state:{...state,chapterFour:{...p,...next},...extra},message});
  if(!chapterFourAvailable(state))return unchanged(C4.needFirst);
  if(p.ending)return unchanged(p.ending==='zoya'?C4.endingZoya:C4.endingShelf);
  if(action==='ask')return update({asked:true},p.asked?C4.zoyaAfter:C4.zoyaStory);
  if(action==='oil'&&OILS.includes(target)){
    if(p.oiled)return unchanged(C4.oiled);
    if(target==='sunflower')return unchanged(C4.wrongSunflower);
    if(target==='water')return unchanged(C4.wrongWater);
    return update({oiled:true},C4.oiled);
  }
  if(action==='read'&&READERS.includes(target)){
    if(!p.oiled)return unchanged(C4.ribbonLocked);
    if(target==='magnifier')return unchanged(C4.wrongMagnifier);
    if(target==='lamp')return unchanged(C4.wrongLamp);
    return update({mirrored:true},C4.mirrored);
  }
  if(action==='type'&&TIMES.includes(target)){
    if(!p.oiled)return unchanged(C4.needOil);
    if(!p.mirrored)return unchanged(C4.needMirror);
    if(target==='1640')return unchanged(C4.wrongTime);
    if(target==='1410')return unchanged(C4.wrongDate);
    return update({typed:true},C4.typed);
  }
  if(action==='end'&&['zoya','shelf'].includes(target)){
    if(!p.typed)return unchanged(C4.needTyped);
    return update({ending:target},target==='zoya'?C4.endingZoya:C4.endingShelf,{coins:(Number.isSafeInteger(state.coins)&&state.coins>=0?state.coins:0)+CHAPTER_FOUR_REWARD});
  }
  return unchanged(chapterFourGoal(state));
}
