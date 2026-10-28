import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { initialState, act } from './game.js';
import { DECORATIONS, ownedDecorations, workshopProgress } from './workshop.js';

test('room purchases cannot overspend or charge twice', () => {
  const poor = initialState();
  assert.equal(act(poor, 'buy-decoration', 'bed').state, poor);
  assert.equal(act(poor, 'buy-decoration', 'missing').state, poor);
  const funded = { ...initialState(), coins: 300 };
  const bed = act(funded, 'buy-decoration', 'bed').state;
  assert.equal(bed.coins, 220);
  assert.deepEqual(bed.furniture, ['bed']);
  assert.deepEqual(funded.furniture, []);
  assert.equal(act(bed, 'buy-decoration', 'bed').state, bed);
  const legacyLamp = { ...initialState(), coins: 150, upgrade: true };
  assert.equal(act(legacyLamp, 'buy-decoration', 'lamp').state, legacyLamp);
  assert.deepEqual(ownedDecorations(legacyLamp), ['lamp']);
});

test('room purchases and coins survive order changes and JSON saves', () => {
  let state = { ...initialState(), coins: 400 };
  for (const item of DECORATIONS) state = act(state, 'buy-decoration', item.id).state;
  assert.equal(state.coins, 100);
  const restored = { ...initialState(), ...workshopProgress(JSON.parse(JSON.stringify(state))) };
  const next = act(restored, 'dev-accept', { order: 'phone' }).state;
  assert.equal(next.coins, 100);
  assert.equal(next.upgrade, true);
  assert.deepEqual(ownedDecorations(next), ['bed', 'garland', 'lamp']);
  assert.equal(next.dev.open, false);
  assert.deepEqual(next.clues, []);
});
