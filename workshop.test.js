import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { initialState, act } from './game.js';
import { DECORATIONS, ROOM_STAGES, ownedDecorations, roomStage, workshopProgress } from './workshop.js';

test('the desk starts bare and its stages are bought in order without overspending', () => {
  const poor = initialState();
  assert.equal(roomStage(poor), 0);
  assert.equal(act(poor, 'buy-decoration', 'desk-mat').state, poor);
  const funded = { ...initialState(), coins: 300 };
  assert.equal(act(funded, 'buy-decoration', 'desk-lamp').state, funded);
  const mat = act(funded, 'buy-decoration', 'desk-mat').state;
  assert.equal(mat.coins, 240); assert.equal(roomStage(mat), 1);
  assert.equal(act(mat, 'buy-decoration', 'desk-mat').state, mat);
  const lamp = act(mat, 'buy-decoration', 'desk-lamp').state;
  assert.equal(roomStage(lamp), 2); assert.equal(lamp.upgrade, true);
  const bed = act(funded, 'buy-decoration', 'bed').state;
  assert.equal(bed.coins, 220); assert.equal(roomStage(bed), 0);
});

test('old saves map their items onto desk stages', () => {
  const legacy = { ...initialState(), upgrade: true, furniture: ['lamp', 'mat-blue', 'mug-red', 'garland'] };
  assert.deepEqual(ownedDecorations(legacy).sort(), ['desk-lamp', 'desk-mat', 'desk-tea', 'garland']);
  assert.equal(roomStage(legacy), 3);
});

test('room purchases and coins survive order changes and JSON saves', () => {
  let state = { ...initialState(), coins: 2000 };
  for (const item of DECORATIONS) state = act(state, 'buy-decoration', item.id).state;
  const spent = DECORATIONS.reduce((sum, item) => sum + item.price, 0);
  const restored = { ...initialState(), ...workshopProgress(JSON.parse(JSON.stringify(state))) };
  const next = act(restored, 'dev-accept', { order: 'phone' }).state;
  assert.equal(next.coins, 2000 - spent);
  assert.equal(roomStage(next), ROOM_STAGES - 1);
  assert.equal(next.upgrade, true);
  assert.deepEqual(next.clues, []);
});
