import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { initialState, act } from './game.js';
import { DECORATIONS, ownedDecorations, placedDecorations, workshopProgress } from './workshop.js';

test('the workshop starts empty and purchases cannot overspend or charge twice', () => {
  const poor = initialState();
  assert.deepEqual(placedDecorations(poor), []);
  assert.equal(act(poor, 'buy-decoration', 'bed').state, poor);
  assert.equal(act(poor, 'buy-decoration', 'missing').state, poor);
  const funded = { ...initialState(), coins: 300 };
  const bed = act(funded, 'buy-decoration', 'bed').state;
  assert.equal(bed.coins, 220);
  assert.deepEqual(bed.furniture, ['bed']);
  assert.deepEqual(funded.furniture, []);
  assert.equal(act(bed, 'buy-decoration', 'bed').state, bed);
  const legacyLamp = { ...initialState(), coins: 150, upgrade: true, furniture: ['lamp'] };
  assert.equal(act(legacyLamp, 'buy-decoration', 'lamp-orange').state, legacyLamp);
  assert.deepEqual(ownedDecorations(legacyLamp), ['lamp-orange']);
});

test('one variant per slot stands in the room; owned variants swap for free', () => {
  let state = { ...initialState(), coins: 300 };
  state = act(state, 'buy-decoration', 'mat-green').state;
  state = act(state, 'buy-decoration', 'mat-blue').state;
  assert.equal(state.coins, 160);
  assert.deepEqual(placedDecorations(state), ['mat-blue']);
  const swapped = act(state, 'buy-decoration', 'mat-green').state;
  assert.equal(swapped.coins, 160);
  assert.deepEqual(placedDecorations(swapped), ['mat-green']);
  const lamp = act(swapped, 'buy-decoration', 'lamp-blue').state;
  assert.equal(lamp.upgrade, true);
});

test('room purchases and coins survive order changes and JSON saves', () => {
  let state = { ...initialState(), coins: 2000 };
  for (const item of DECORATIONS) state = act(state, 'buy-decoration', item.id).state;
  const spent = DECORATIONS.reduce((sum, item) => sum + item.price, 0);
  assert.equal(state.coins, 2000 - spent);
  const restored = { ...initialState(), ...workshopProgress(JSON.parse(JSON.stringify(state))) };
  const next = act(restored, 'dev-accept', { order: 'phone' }).state;
  assert.equal(next.coins, 2000 - spent);
  assert.equal(next.upgrade, true);
  assert.equal(ownedDecorations(next).length, DECORATIONS.length);
  assert.deepEqual(placedDecorations(next).filter(id => id.startsWith('mug-')), ['mug-blue']);
  assert.equal(next.dev.open, false);
  assert.deepEqual(next.clues, []);
});
