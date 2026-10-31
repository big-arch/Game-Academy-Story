import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { initialState, act } from './game.js';
import { chapterFiveAvailable, chapterFiveProgress, CHAPTER_FIVE_REWARD } from './chapter-five.js';
import { workshopProgress } from './workshop.js';

const step = (state, action, target) => act(state, 'chapter-five-' + action, target).state;
const ready = () => ({ ...initialState(), stage: 'work', order: 'phone', client: 'dima', dev: { open: true, fixed: ['port'] }, coins: 300, chapterOne: { facts: ['delivered'] }, chapterTwo: { choice: 'boat' }, chapterThree: { call: 'anna' }, chapterFour: { ending: 'zoya' } });
const repaired = state => {
  for (const [action, target] of [['unplug'], ['open'], ['inspect'], ['diagnose', 'wire'], ['solder', .7], ['bulb', '40'], ['close'], ['test']]) state = step(state, action, target);
  return state;
};

test('chapter five is locked until the letter is finished', () => {
  const state = { ...ready(), chapterFour: {} };
  assert.equal(chapterFiveAvailable(state), false);
  assert.equal(step(state, 'unplug'), state);
  assert.equal(chapterFiveAvailable(ready()), true);
});

test('the lamp cannot be opened, diagnosed or soldered out of sequence', () => {
  let state = ready();
  assert.equal(step(state, 'open'), state);
  state = step(state, 'unplug');
  assert.equal(step(state, 'inspect'), state);
  state = step(state, 'open');
  assert.equal(step(state, 'diagnose', 'wire'), state);
  state = step(state, 'inspect');
  assert.equal(step(state, 'solder'), state);
  assert.equal(step(state, 'diagnose', 'bulb'), state);
  assert.equal(step(state, 'diagnose', 'switch'), state);
  state = step(state, 'diagnose', 'wire');
  assert.equal(state.chapterFive.diagnosed, true);
  assert.equal(step(state, 'bulb', '40'), state);
  state = step(state, 'solder', .7);
  assert.equal(state.chapterFive.soldered, true);
});

test('bulbs within the rating are accepted and over-rated bulbs never advance', () => {
  let state = repaired(ready());
  assert.equal(state.chapterFive.bulb, '40');
  assert.equal(step(state, 'end', 'desk').chapterFive.ending, 'desk');
  state = ready();
  for (const [action, target] of [['unplug'], ['open'], ['inspect'], ['diagnose', 'wire'], ['solder', .7]]) state = step(state, action, target);
  assert.equal(step(state, 'bulb', '25').chapterFive.bulb, '25');
  assert.equal(step(state, 'bulb', '100'), state);
  assert.equal(step(state, 'end', 'desk'), state);
});

test('both lamp placements finish once and preserve the current repair and earlier chapters', () => {
  for (const ending of ['desk', 'window']) {
    let state = ready();
    const before = structuredClone(state);
    state = step(repaired(state), 'end', ending);
    assert.equal(state.chapterFive.ending, ending);
    assert.equal(state.coins, 300 + CHAPTER_FIVE_REWARD);
    assert.equal(step(state, 'end', 'desk'), state);
    for (const key of ['dev', 'order', 'client', 'chapterOne', 'chapterTwo', 'chapterThree', 'chapterFour', 'stage']) assert.deepEqual(state[key], before[key]);
  }
});

test('progress survives JSON and malformed saves are normalized', () => {
  const state = step(step(step(ready(), 'unplug'), 'open'), 'inspect');
  const restored = { ...initialState(), ...workshopProgress(JSON.parse(JSON.stringify(state))) };
  assert.deepEqual(restored.chapterFive, state.chapterFive);
  const progress = chapterFiveProgress({ chapterFive: { unplugged: 'yes', opened: true, bulb: '100', ending: 'unknown' } }).chapterFive;
  assert.deepEqual(progress, { unplugged: false, opened: true, inspected: false, diagnosed: false, soldered: false, bulb: null, closed: false, tested: false, ending: null });
});
test('solder requires a valid heat band; early, overheated and forged inputs are retryable',()=>{
 let state=ready();for(const[a,v]of [['unplug'],['open'],['inspect'],['diagnose','wire']])state=step(state,a,v);
 for(const heat of [undefined,NaN,Infinity,'0.7',.2,.99])assert.equal(step(state,'solder',heat),state);
 assert.equal(step(state,'solder',.55).chapterFive.soldered,true);assert.equal(step(state,'solder',.82).chapterFive.soldered,true);
});
test('the lamp must be assembled and tested, and changing its bulb invalidates the test',()=>{
 let state=ready();assert.equal(step(state,'test'),state);assert.equal(step(state,'close'),state);
 for(const[a,v]of [['unplug'],['open'],['inspect'],['diagnose','wire'],['solder',.7],['bulb','25']])state=step(state,a,v);
 assert.equal(step(state,'end','window'),state);assert.equal(step(state,'test'),state);state=step(state,'close');assert.equal(step(state,'end','window'),state);state=step(state,'test');assert.equal(state.chapterFive.tested,true);
 state=step(state,'bulb','40');assert.equal(state.chapterFive.closed,false);assert.equal(state.chapterFive.tested,false);
 state=step(step(state,'close'),'test');state=step(state,'end','window');assert.equal(state.coins,480);
});
test('existing completed KIMI saves remain complete without receiving another award',()=>{
 const state={...ready(),chapterFive:{unplugged:true,opened:true,inspected:true,diagnosed:true,soldered:true,bulb:'40',ending:'desk'}};
 assert.equal(chapterFiveProgress(state).chapterFive.tested,true);assert.equal(chapterFiveProgress(state).chapterFive.closed,true);assert.equal(step(state,'end','window'),state);assert.equal(state.coins,300);
});
