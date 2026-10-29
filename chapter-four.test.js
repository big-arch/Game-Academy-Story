import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {initialState,act} from './game.js';
import {chapterFourAvailable,chapterFourProgress,CHAPTER_FOUR_REWARD} from './chapter-four.js';
import {workshopProgress} from './workshop.js';
const step=(s,a,v)=>act(s,'chapter-four-'+a,v).state;
const ready=()=>({...initialState(),stage:'work',order:'phone',client:'dima',dev:{open:true,fixed:['port']},coins:300,chapterOne:{facts:['delivered']},chapterTwo:{choice:'boat'},chapterThree:{call:'anna'}});
const full=s=>step(step(step(step(s,'ask'),'oil','sewing'),'read','mirror'),'type','0640');

test('chapter four is locked until the radio broadcast',()=>{
 const s={...ready(),chapterThree:{}};assert.equal(chapterFourAvailable(s),false);assert.equal(step(s,'ask'),s);assert.equal(chapterFourAvailable(ready()),true);
});
test('both endings award once and keep the repair and earlier chapters',()=>{
 for(const end of ['zoya','shelf']){let s=ready(),old=structuredClone(s);s=step(full(s),'end',end);assert.equal(s.chapterFour.ending,end);assert.equal(s.coins,300+CHAPTER_FOUR_REWARD);assert.equal(step(s,'end','zoya'),s);for(const key of ['dev','order','client','chapterOne','chapterTwo','chapterThree','stage'])assert.deepEqual(s[key],old[key]);}
});
test('wrong oil, wrong reader and wrong time never advance',()=>{
 let s=step(ready(),'ask');assert.equal(step(s,'read','mirror'),s);assert.equal(step(s,'type','0640'),s);
 assert.equal(step(s,'oil','sunflower'),s);assert.equal(step(s,'oil','water'),s);s=step(s,'oil','sewing');assert.equal(s.chapterFour.oiled,true);
 assert.equal(step(s,'type','0640'),s);assert.equal(step(s,'read','magnifier'),s);assert.equal(step(s,'read','lamp'),s);s=step(s,'read','mirror');
 assert.equal(step(s,'end','zoya'),s);assert.equal(step(s,'type','1640'),s);assert.equal(step(s,'type','1410'),s);s=step(s,'type','0640');assert.equal(s.chapterFour.typed,true);
});
test('talking to Zoya is helpful but not required',()=>{
 let s=step(step(step(ready(),'oil','sewing'),'read','mirror'),'type','0640');s=step(s,'end','shelf');assert.equal(s.chapterFour.ending,'shelf');
});
test('progress survives JSON saves and malformed data',()=>{
 let s=step(step(ready(),'ask'),'oil','sewing');const next={...initialState(),...workshopProgress(JSON.parse(JSON.stringify(s)))};assert.deepEqual(next.chapterFour,s.chapterFour);
 assert.deepEqual(chapterFourProgress({chapterFour:{asked:'yes',ending:'x'}}).chapterFour,{asked:false,oiled:false,mirrored:false,typed:false,ending:null});
});
