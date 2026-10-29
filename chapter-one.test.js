import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {initialState,act} from './game.js';
import {chapterProgress,hasChapterFact,chapterGoal} from './chapter-one.js';
import {C} from './chapter-one-copy.js';
import {workshopProgress} from './workshop.js';
import {CHAPTER_REWARD} from './chapter-one-rules.js';
const step=(s,action,target)=>act(s,'chapter-'+action,target).state;
const repair=s=>{s=step(s,'tighten','clockwise');for(let i=0;i<3;i++)s=step(s,'route',i);return step(s,'play');};
const guest=s=>step(step(step(s,'invite'),'tea','lemon'),'show-photo');
const radio=s=>step(step(s,'frequency',917),'listen');
test('chapter can finish in different investigation orders without replacing the current repair',()=>{
 for(const order of [[repair,guest,radio],[radio,repair,guest],[guest,radio,repair]]){
  let s={...initialState(),stage:'work',order:'phone',client:'dima',coins:210,dev:{open:true,fixed:['port']},furniture:['bed']};
  const old=structuredClone(s);s=step(step(step(s,'open'),'photo'),'flip');
  for(const task of order)s=task(s);
  s=step(step(s,'identify','anna'),'return');
  assert.ok(hasChapterFact(s,'delivered'));assert.equal(s.coins,210+CHAPTER_REWARD);
  assert.equal(s.order,old.order);assert.equal(s.client,old.client);assert.deepEqual(s.dev,old.dev);assert.deepEqual(s.furniture,old.furniture);assert.equal(s.stage,'work');
  assert.equal(s.jobsCompleted,undefined);assert.deepEqual(old.dev,{open:true,fixed:['port']});
 }
});
test('guesses, wrong frequency, wrong tea and incorrect tape route never advance the chapter',()=>{
 let s=initialState();assert.equal(step(s,'identify','anna'),s);
 s=step(s,'open');s=step(s,'photo');s=step(s,'listen');assert.equal(hasChapterFact(s,'radio'),false);
 assert.equal(step(s,'frequency',917.5),s);assert.equal(step(s,'frequency',1200),s);
 s=step(s,'invite');assert.equal(step(s,'tea','sugar'),s);
 assert.equal(step(s,'route',0),s);assert.equal(step(s,'tighten','counter'),s);
 s=step(s,'tighten','clockwise');assert.equal(step(s,'route',2),s);s=step(s,'route',0);assert.equal(step(s,'route',0),s);
 s=step(s,'route',1);s=step(s,'route',2);s=step(s,'play');s=radio(s);s=step(s,'tea','lemon');s=step(s,'show-photo');
 assert.equal(step(s,'identify','pavel'),s);assert.equal(step(s,'return'),s);
});
test('chapter award is one-time and survives JSON and ordinary order transitions',()=>{
 let s=step(step(initialState(),'open'),'photo');s=radio(guest(repair(s)));s=step(s,'identify','anna');s=step(s,'return');
 assert.equal(s.coins,CHAPTER_REWARD);const restored={...initialState(),...workshopProgress(JSON.parse(JSON.stringify(s)))};
 const next=act(restored,'dev-accept',{order:'pager',client:'sveta'}).state;
 assert.ok(hasChapterFact(next,'delivered'));assert.equal(step(next,'return').coins,CHAPTER_REWARD);
});
test('save and resume halfway through tape routing retains progress and supports old saves',()=>{
 assert.deepEqual(chapterProgress({}),{chapterOne:{facts:[],frequency:880,tapeRoute:0,tapeTight:false}});
 let s=step(step(step(initialState(),'open'),'tighten','clockwise'),'route',0);
 s={...initialState(),...workshopProgress(JSON.parse(JSON.stringify(s)))};
 assert.equal(chapterProgress(s).chapterOne.tapeRoute,1);s=step(step(s,'route',1),'route',2);assert.ok(hasChapterFact(s,'tape'));
 assert.deepEqual(chapterProgress({chapterOne:{facts:['bad','parcel','parcel'],frequency:NaN,tapeRoute:-2}}).chapterOne,{facts:['parcel'],frequency:880,tapeRoute:0,tapeTight:false});
});
test('finding the station by exploration instead of flipping the photograph does not leave a stale goal',()=>{
 let s=step(step(initialState(),'open'),'photo');s=guest(radio(repair(s)));s=step(s,'identify','anna');
 assert.equal(chapterGoal(s),C.goalReturn);s=step(s,'return');assert.equal(chapterGoal(s),C.endingShort);
});
