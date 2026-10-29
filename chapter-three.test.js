import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {initialState,act} from './game.js';
import {chapterThreeAvailable,chapterThreeProgress,CALLSIGNS,CHANNEL,CHAPTER_THREE_REWARD} from './chapter-three.js';
import {workshopProgress} from './workshop.js';
const step=(s,a,v)=>act(s,'chapter-three-'+a,v).state;
const ready=()=>({...initialState(),stage:'work',order:'phone',client:'dima',dev:{open:true,fixed:['port']},coins:300,chapterOne:{facts:['delivered'],frequency:880,tapeRoute:0,tapeTight:false},chapterTwo:{read:true,powered:true,edited:true,focused:true,choice:'boat'}});
const power=s=>step(step(step(s,'battery','aa1'),'battery','aa2'),'power');
const map=s=>{for(const [sign,person] of Object.entries(CALLSIGNS))s=step(s,'assign',{sign,person});return step(s,'check-map');};
const tune=s=>step(step(s,'dial',CHANNEL),'listen');

test('chapter three is locked until the screening is finished',()=>{
 const s={...ready(),chapterTwo:{}};assert.equal(chapterThreeAvailable(s),false);assert.equal(step(s,'tag'),s);assert.equal(chapterThreeAvailable(ready()),true);
});
test('both calls finish the chapter once and keep the current repair',()=>{
 for(const call of ['anna','mikhalych']){let s=ready(),old=structuredClone(s);s=tune(map(power(step(s,'tag'))));s=step(s,'call',call);assert.equal(s.chapterThree.call,call);assert.equal(s.coins,300+CHAPTER_THREE_REWARD);assert.equal(step(s,'call','anna'),s);for(const key of ['dev','order','client','chapterOne','chapterTwo','stage'])assert.deepEqual(s[key],old[key]);}
});
test('the 9 V battery and wrong counts never power the radio',()=>{
 let s=step(ready(),'tag');assert.equal(step(s,'power'),s);s=step(s,'battery','aa1');assert.equal(step(s,'power'),s);s=step(s,'battery','block');assert.equal(step(s,'power'),s);s=step(step(s,'battery','block'),'battery','aa2');s=step(s,'power');assert.equal(s.chapterThree.powered,true);s=step(s,'battery','aa2');assert.equal(s.chapterThree.powered,false);
});
test('wrong callsigns and wrong channel do not advance; order of puzzles is free',()=>{
 let s=ready();s=step(s,'assign',{sign:'kettle',person:'anna'});assert.equal(step(s,'check-map'),s);s=map(s);assert.equal(s.chapterThree.mapped,true);
 assert.equal(step(s,'listen'),s);s=step(s,'tag');assert.equal(step(s,'listen'),s);s=power(s);s=step(s,'dial',36);assert.equal(step(s,'listen'),s);assert.equal(step(s,'call','anna'),s);s=tune(s);s=step(s,'call','anna');assert.equal(s.chapterThree.call,'anna');
});
test('progress survives JSON saves and normalizes malformed data',()=>{
 let s=map(power(step(ready(),'tag')));const next={...initialState(),...workshopProgress(JSON.parse(JSON.stringify(s)))};assert.deepEqual(next.chapterThree,s.chapterThree);
 const p=chapterThreeProgress({chapterThree:{batteries:['aa1','aa1','x'],map:{kettle:'nobody',note:'anna'},dial:500,call:'x'}}).chapterThree;assert.deepEqual(p.batteries,['aa1']);assert.deepEqual(p.map,{note:'anna'});assert.equal(p.dial,12);assert.equal(p.call,null);
});
