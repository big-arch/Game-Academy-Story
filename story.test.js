import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { initialState, act } from './game.js';
import { SHELF, shelfStatus, shelfLockReason, seasonDone } from './story.js';
import { DEVICES } from './devices.js';
import { clientFor, pickClient } from './stories.js';
import { memoryAvailable, memoryFor } from './memories.js';
import { workshopProgress } from './workshop.js';

const camera = SHELF.find(item => item.id === 'camera-1996');
const ready = () => ({...initialState(),jobsCompleted:8,letterRead:true,shelfDone:['zoya-remote','pager-143']});

test('the third shelf chapter needs the previous returns and cannot replace a current job', () => {
  assert.equal(shelfStatus({...initialState(),jobsCompleted:8},camera),'locked');
  assert.match(shelfLockReason({...initialState(),jobsCompleted:8},camera),/пульт/);
  assert.equal(shelfStatus({...ready(),jobsCompleted:7},camera),'locked');
  assert.equal(shelfStatus(ready(),camera),'ready');
  const current = {...ready(),stage:'work',order:'phone'};
  assert.equal(act(current,'shelf-take',camera.id).state,current);
  const client = clientFor(camera.order,camera.client);
  assert.ok(client.shelf);
  assert.ok(client.intro.length <= 220 && client.ending.length <= 200);
  assert.ok(client.questions.every(q=>q.a.length<=180));
  assert.equal(client.find.kind,'ticket');
  for (let i=0;i<20;i++) assert.notEqual(pickClient('video-camera'),camera.client);
});

test('the chapter camera needs diagnosis AND soldering before its recording can play and the shelf can advance', () => {
  let state = act(ready(),'shelf-take',camera.id).state;
  const run = (action,target) => { state = act(state,action,target).state; };
  const screws = () => DEVICES['video-camera'].screws.forEach((_,i)=>run('dev-screw',i));
  assert.equal(state.client,'mihalych-camera');
  screws(); run('dev-cover'); run('dev-inspect'); run('dev-diagnose','ribbon');
  run('dev-fix','power-joint'); assert.ok(!state.dev.fixed.includes('power-joint'));
  run('dev-fix','ribbon'); run('dev-fix','mech'); run('dev-fix','power-trace');
  run('dev-cover'); screws(); run('dev-test');
  assert.equal(memoryAvailable(state),false);
  screws(); run('dev-cover'); run('dev-fix','power-joint'); run('dev-cover'); screws(); run('dev-test');
  assert.equal(memoryAvailable(state),true);
  assert.equal(memoryFor(state).key,'video-camera:mihalych-camera');
  run('memory-read'); run('memory-action'); run('dev-finish');
  assert.equal(state.stage,'ending');
  assert.equal(state.jobsCompleted,9);
  assert.ok(state.shelfDone.includes(camera.id));
  assert.equal(shelfStatus(state,camera),'done');
  const coins = state.coins; run('dev-finish'); assert.equal(state.coins,coins);
  const restored = {...initialState(),...workshopProgress(JSON.parse(JSON.stringify(state)))};
  assert.ok(restored.shelfDone.includes(camera.id));
  assert.ok(restored.memoryActions.includes('video-camera:mihalych-camera'));
});

test('chapter five: Nadya brings the music box herself, and returning it empties the shelf', () => {
  const box = SHELF.find(item => item.id === 'music-box');
  const before = {...initialState(),jobsCompleted:14,letterRead:true,shelfDone:['zoya-remote','pager-143','camera-1996']};
  assert.equal(shelfStatus(before,box),'locked');
  assert.equal(seasonDone(before),false);
  let state = act({...before,shelfDone:[...before.shelfDone,'phone-n']},'shelf-take',box.id).state;
  assert.equal(state.client,'nadya');
  assert.ok(clientFor('music-box','nadya').shelf);
  const run = (action,target) => { state = act(state,action,target).state; };
  const screws = () => DEVICES['music-box'].screws.forEach((s,i)=>{ if (state.dev.assembling && s[2]) run('dev-pick',s[2]); run('dev-screw',i); });
  screws(); run('dev-cover'); run('dev-inspect'); run('dev-diagnose','spring');
  run('dev-fix','spring'); assert.ok(!state.dev.fixed.includes('spring'));
  run('dev-fix','drum'); run('dev-fix','spring'); run('dev-cover'); screws(); run('dev-test');
  assert.equal(state.dev.hiddenFound,true);
  screws(); run('dev-cover'); run('dev-fix','tooth'); run('dev-cover'); screws(); run('dev-test');
  assert.equal(memoryFor(state).key,'music-box:nadya');
  run('memory-read'); run('memory-action'); run('dev-finish');
  assert.equal(state.stage,'ending');
  assert.equal(seasonDone(state),true);
  assert.ok(SHELF.every(item => shelfStatus(state,item)==='done'));
});
