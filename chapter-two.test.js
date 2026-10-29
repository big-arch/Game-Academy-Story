import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {initialState,act} from './game.js';
import {chapterTwoAvailable,chapterTwoProgress,FILM_ORDER,CHAPTER_TWO_REWARD} from './chapter-two.js';
import {workshopProgress} from './workshop.js';
const step=(s,a,v)=>act(s,'chapter-two-'+a,v).state;
const ready=()=>({...initialState(),stage:'work',order:'phone',client:'dima',dev:{open:true,fixed:['port']},coins:300,chapterOne:{facts:['delivered'],frequency:880,tapeRoute:0,tapeTight:false},furniture:['desk-mat']});
const read=s=>step(s,'read');
const power=s=>step(step(step(s,'equipment','tv'),'equipment','vcr'),'power');
const cut=s=>{for(const id of FILM_ORDER)s=step(s,'scene',id);return step(s,'edit');};
const focus=s=>step(step(s,'focus',62),'check-focus');

test('chapter two is locked until the first room story is delivered',()=>{
 const s=initialState();assert.equal(chapterTwoAvailable(s),false);assert.equal(step(s,'read'),s);assert.equal(chapterTwoAvailable(ready()),true);
});
test('both film choices award once and preserve the current repair and first chapter',()=>{
 for(const choice of ['boat','people']){let s=ready(),old=structuredClone(s);s=focus(cut(power(read(s))));s=step(s,'show',choice);assert.equal(s.coins,300+CHAPTER_TWO_REWARD);assert.equal(s.chapterTwo.choice,choice);assert.equal(step(s,'show','people'),s);for(const key of ['dev','order','client','furniture','chapterOne','stage'])assert.deepEqual(s[key],old[key]);assert.equal(s.jobsCompleted,undefined);}
});
test('power overload, missing equipment and invalid selections never mark power ready',()=>{
 let s=read(ready());assert.equal(step(s,'equipment','unknown'),s);assert.equal(step(s,'power'),s);s=step(s,'equipment','tv');assert.equal(step(s,'power'),s);s=step(step(s,'equipment','vcr'),'equipment','lamp');assert.equal(step(s,'power'),s);s=step(s,'equipment','lamp');s=step(s,'power');assert.equal(s.chapterTwo.powered,true);s=step(s,'equipment','vcr');assert.equal(s.chapterTwo.powered,false);
});
test('wrong montage can be undone and solved before power, without a dead end',()=>{
 let s=read(ready());for(const id of ['wave','fold','sail'])s=step(s,'scene',id);assert.equal(step(s,'edit'),s);assert.equal(step(s,'scene','wave'),s);for(let i=0;i<3;i++)s=step(s,'undo');s=cut(s);assert.equal(s.chapterTwo.edited,true);s=focus(power(s));assert.equal(s.chapterTwo.focused,true);s=step(s,'show','boat');assert.equal(s.chapterTwo.choice,'boat');
});
test('screening requires power, montage and confirmed focus; note is optional',()=>{
 let s=read(ready());assert.equal(step(s,'show','boat'),s);s=power(s);assert.equal(step(s,'show','boat'),s);s=cut(s);s=step(s,'focus',30);assert.equal(step(s,'check-focus'),s);assert.equal(step(s,'secret'),s);assert.equal(step(s,'focus',Infinity),s);assert.equal(step(s,'focus',62.5),s);s=focus(s);s=step(s,'secret');assert.equal(s.chapterTwo.secret,true);s=step(s,'focus',40);assert.equal(s.chapterTwo.focused,false);assert.equal(step(s,'show','boat'),s);
});
test('mid-chapter JSON saves and normal order transitions preserve all chapter progress',()=>{
 let s=cut(power(read(ready())));s=step(s,'focus',58);const restored=JSON.parse(JSON.stringify(s));assert.deepEqual(chapterTwoProgress(restored),chapterTwoProgress(s));const next={...initialState(),...workshopProgress(restored)};assert.deepEqual(next.chapterTwo,s.chapterTwo);assert.deepEqual(next.chapterOne,s.chapterOne);s=step(focus(next),'show','people');assert.equal(s.coins,420);
});
test('old and malformed progress is normalized without crashing',()=>{
 assert.equal(chapterTwoProgress(initialState()).chapterTwo.choice,null);const p=chapterTwoProgress({chapterTwo:{equipment:['tv','tv','bad'],scenes:['wave','bad','wave'],focus:-1,choice:'bad'}}).chapterTwo;assert.deepEqual(p.equipment,['tv']);assert.deepEqual(p.scenes,['wave']);assert.equal(p.focus,20);assert.equal(p.choice,null);
});
test('optional note remains discoverable after the ending without another payment',()=>{
 let s=step(focus(cut(power(read(ready())))),'show','boat');assert.equal(s.chapterTwo.secret,false);s=step(s,'secret');assert.equal(s.chapterTwo.secret,true);assert.equal(s.chapterTwo.choice,'boat');assert.equal(s.coins,420);assert.equal(step(s,'show','people'),s);
});
