import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { initialState, act } from './game.js';
import { CLIENTS } from './stories.js';
import { MEMORIES, SCREEN_LAYOUTS, memoryAvailable, memoryFor, memoryProgress } from './memories.js';
import { workshopProgress } from './workshop.js';
import { DEVICES } from './devices.js';

test('every client with a visible device screen has their own ending and valid glass bounds', () => {
  const titles = new Set();
  for (const [order, layout] of Object.entries(SCREEN_LAYOUTS)) {
    const [x,y,w,h] = layout.rect;
    assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x+w <= 100 && y+h <= 100);
    for (const client of CLIENTS[order]) {
      const memory = memoryFor({order, client:client.id});
      assert.ok(memory, `${order}:${client.id}`);
      for (const key of ['title','body','action','pending','result','response']) assert.ok(memory[key].length > 5);
      titles.add(memory.title);
    }
  }
  assert.equal(titles.size, Object.keys(MEMORIES).length);
  assert.equal(memoryFor({order:'vacuum',client:'galya'}), null);
});

test('screens cannot reveal a story before a successful closed-device test or after reopening', () => {
  let s = act(initialState(), 'dev-accept', {order:'pager',client:'sveta'}).state;
  assert.equal(memoryAvailable(s), false);
  assert.deepEqual(act(s,'memory-read').state.memories, []);
  s = act({...s,dev:{...s.dev,fixed:DEVICES.pager.fixes.map(f=>f.id)}},'dev-test').state;
  assert.equal(memoryAvailable(s), true);
  assert.equal(memoryAvailable(act(s,'dev-screw',0).state), false);
  assert.equal(memoryAvailable({...s,dev:{...s.dev,open:true}}), false);
  assert.equal(memoryAvailable({...s,dev:{...s.dev,screwMask:1}}), false);
  assert.equal(memoryAvailable({...s,dev:{...s.dev,assembling:true}}), false);
  assert.equal(memoryAvailable({...s,stage:'intro'}), false);
  const laptop = {...initialState(),order:'laptop',client:'vera',stage:'work',repaired:true};
  assert.equal(memoryAvailable(laptop), true);
  assert.equal(memoryAvailable({...laptop,poweredOff:true}), false);
  assert.equal(memoryAvailable({...laptop,screwMask:1}), false);
});

test('reading and responding preserve the album across orders without extra coins or duplicate entries', () => {
  let s = {...initialState(),order:'phone',client:'dima',stage:'work',coins:100,dev:{repaired:true}};
  assert.equal(act(s,'memory-action').state.memoryActionDone, false);
  s = act(s,'memory-read').state;
  s = act(s,'memory-read').state;
  assert.deepEqual(s.memories,['phone:dima']);
  s = act(s,'memory-action').state;
  s = act(s,'memory-action').state;
  assert.equal(s.coins,100);
  assert.deepEqual(s.memoryActions,['phone:dima']);
  const next = {...initialState(),...workshopProgress(JSON.parse(JSON.stringify(s)))};
  assert.deepEqual(next.memories,['phone:dima']);
  assert.deepEqual(next.memoryActions,['phone:dima']);
  assert.equal(next.memoryRead,false);
  assert.deepEqual(memoryProgress({memories:['bad','__proto__','phone:dima','phone:dima'],memoryActions:42}), {memories:['phone:dima'],memoryActions:[]});
});
