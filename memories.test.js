import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { initialState, act } from './game.js';
import { CLIENTS } from './stories.js';
import { MEMORIES, SCREEN_LAYOUTS, memoryAvailable, memoryFor, memoryProgress, memoryLayout, memoryExtras, followupReady, FOLLOWUPS } from './memories.js';
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
  assert.equal(titles.size, Object.keys(SCREEN_LAYOUTS).reduce((n,order)=>n+CLIENTS[order].length,0));
  for (const [order, clients] of Object.entries(CLIENTS)) for (const client of clients) assert.ok(memoryFor({order,client:client.id}), `${order}:${client.id}`);
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

test('all thirteen object types have reachable live scenes and special repairs respect their own assembly state', () => {
 for(const [order,clients] of Object.entries(CLIENTS)) {
  const s={...initialState(),order,client:clients[0].id,stage:'work',repaired:true,cassetteRepaired:true,rRepaired:true,dev:{repaired:true}};
  assert.ok(memoryAvailable(s),order);assert.ok(memoryLayout(order).host);
  assert.equal(memoryAvailable({...s,repaired:false,cassetteRepaired:false,rRepaired:false,dev:{repaired:false}}),false,order);
 }
 const tape={...initialState(),order:'cassette',client:'artem',stage:'work',cassetteRepaired:true};
 assert.equal(memoryAvailable({...tape,cassetteOpen:true}),false);
 assert.equal(memoryAvailable({...tape,cScrewMask:1}),false);
 const remote={...initialState(),order:'remote',client:'grandpa',stage:'work',rRepaired:true};
 assert.equal(memoryAvailable({...remote,rOpen:true}),false);
 assert.equal(memoryAvailable({...remote,rAssembling:true}),false);
});
test('optional recovery needs the archive deck and a finished live test, is saved once and never pays twice', () => {
 let s={...initialState(),order:'console',client:'brothers',stage:'work',coins:250,dev:{repaired:true}};
 assert.equal(act(s,'memory-discover').state.discoveries,undefined);
 s=act(s,'memory-read').state;s=act(s,'memory-action').state;
 assert.equal(act(s,'memory-discover').state.discoveries,undefined);
 s={...s,furniture:['archive-deck']};s=act(s,'memory-discover').state;s=act(s,'memory-discover').state;
 assert.deepEqual(s.discoveries,['console:brothers']);assert.equal(s.coins,250);
 assert.deepEqual(workshopProgress(s).discoveries,s.discoveries);
 assert.deepEqual(memoryExtras({discoveries:['bad','console:brothers','console:brothers'],memoryMilestones:{bad:2}}),{discoveries:['console:brothers'],memoryMilestones:{}});
});
test('client follow-up arrives after another returned job and survives order changes',()=>{
 let s={...initialState(),order:'console',client:'brothers',stage:'work',jobsCompleted:4,dev:{repaired:true}};
 s=act(s,'memory-read').state;s=act(s,'memory-action').state;
 assert.equal(followupReady({...s,jobsCompleted:5},'console:brothers'),false);
 assert.equal(followupReady({...s,jobsCompleted:6},'console:brothers'),true);
 const next={...initialState(),...workshopProgress({...s,jobsCompleted:6})};
 assert.equal(followupReady(next,'console:brothers'),true);
});

test('every client has a distinct later letter, separate from the immediate repair response',()=>{for(const key of Object.keys(MEMORIES)){assert.ok(FOLLOWUPS[key]?.length>25,key);assert.notEqual(FOLLOWUPS[key],MEMORIES[key].response);}});
