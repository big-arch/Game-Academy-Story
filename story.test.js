import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { initialState, act } from './game.js';
import { SHELF, shelfStatus, shelfLockReason } from './story.js';
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
