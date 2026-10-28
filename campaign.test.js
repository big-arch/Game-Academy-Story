import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { CONTRACTS, completedOrders, nextContract, campaignProgress } from './campaign.js';
import { initialState, act } from './game.js';
import { workshopProgress } from './workshop.js';
import { coverageCell, partFits } from './repair-interaction.js';

test('contracts progress from easy to complex and skip completed stories', () => {
  let state = initialState(), last = 0;
  for (const contract of CONTRACTS) {
    assert.equal(nextContract(state), contract);
    assert.ok(contract.level >= last); last = contract.level;
    state = { ...state, completedOrders: [...completedOrders(state), contract.order] };
    state = { ...initialState(), ...workshopProgress(JSON.parse(JSON.stringify(state))) };
  }
  assert.equal(completedOrders(state).length, 12);
  assert.ok(nextContract(state));
});

test('payment advances the album once, and starting another order keeps it and furniture', () => {
  const repaired = { ...initialState(), order: 'pager', stage: 'work', dev: { repaired: true }, furniture: ['bed'], coins: 80 };
  const paid = act(repaired, 'dev-finish').state;
  assert.equal(paid.coins, 170);
  assert.deepEqual(paid.completedOrders, ['pager']);
  assert.equal(paid.jobsCompleted, 1);
  assert.equal(act(paid, 'dev-finish').state.jobsCompleted, 1);
  const next = act({ ...initialState(), ...workshopProgress(paid) }, 'remote-accept').state;
  assert.deepEqual(next.completedOrders, ['pager']);
  assert.deepEqual(next.furniture, ['bed']);
  assert.equal(nextContract(next).order, 'remote');
  assert.deepEqual(campaignProgress({ completedOrders: ['pager','pager','unknown'] }).completedOrders, ['pager']);
});

test('cleaning measures distinct surface areas, not pointer event count or movement outside', () => {
  const rect = { left: 10, top: 20, right: 100, bottom: 110, width: 90, height: 90 };
  assert.equal(coverageCell(9, 30, rect), -1);
  assert.equal(coverageCell(50, 111, rect), -1);
  const repeated = new Set(Array.from({ length: 100 }, () => coverageCell(20, 30, rect)));
  assert.equal(repeated.size, 1);
  const covered = new Set();
  for (const x of [25,55,85]) for (const y of [35,65,95]) covered.add(coverageCell(x,y,rect));
  assert.equal(covered.size, 9);
  assert.equal(coverageCell(100,110,rect), 8);
});

test('a part only fits the socket with matching orientation, even if dropped inside', () => {
  assert.equal(partFits(270,4), false);
  assert.equal(partFits(90,4), false);
  assert.equal(partFits(0,-1), false);
  assert.equal(partFits(360,4), true);
  assert.equal(partFits(0,4), true);
});
