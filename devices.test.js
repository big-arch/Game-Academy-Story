import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { existsSync } from 'node:fs';
import { initialState, act } from './game.js';
import { DEVICES, viewSrc } from './devices.js';

for (const [order, cfg] of Object.entries(DEVICES)) {
  test(`${order}: assets, ordered repairs, reassembly, retest and single payout`, () => {
    for (const view of ['closed', 'open', 'repaired']) assert.ok(existsSync(new URL(viewSrc(order, view), import.meta.url)), `${order}: ${view}`);
    let s = initialState();
    const run = (a, target) => { s = act(s, a, target).state; };
    run('dev-accept', { order });
    run('dev-test'); run('dev-finish'); assert.equal(s.coins, 0);
    for (let i = 0; i < cfg.screws.length; i++) run('dev-screw', i);
    run('dev-cover'); run('dev-inspect');
    run('dev-diagnose', cfg.causes.find(c => c.correct).id);
    const pending = [...cfg.fixes];
    while (pending.length) {
      const index = pending.findIndex(f => (f.after || []).every(id => s.dev.fixed.includes(id)));
      assert.notEqual(index, -1, `${order}: cyclic repair dependencies`);
      run('dev-fix', pending.splice(index, 1)[0].id);
    }
    run('dev-test'); assert.equal(s.dev.repaired, false);
    run('dev-cover'); run('dev-test'); assert.equal(s.dev.repaired, false);
    for (let i = 0; i < cfg.screws.length; i++) run('dev-screw', i);
    run('dev-test'); assert.equal(s.dev.repaired, true);
    run('dev-screw', 0); assert.equal(s.dev.repaired, false);
    run('dev-test'); assert.equal(s.dev.repaired, false);
    run('dev-finish'); assert.equal(s.stage, 'work');
    run('dev-screw', 0); assert.equal(s.dev.repaired, false);
    // The remaining screws must be removed before the next assembly cycle.
    for (let i = 1; i < cfg.screws.length; i++) run('dev-screw', i);
    run('dev-cover'); run('dev-cover');
    for (let i = 0; i < cfg.screws.length; i++) run('dev-screw', i);
    run('dev-test'); run('dev-finish');
    assert.equal(s.stage, 'ending'); assert.equal(s.coins, cfg.reward);
    run('dev-finish'); assert.equal(s.coins, cfg.reward);
  });
}

test('opening an already tested laptop, cassette or remote invalidates its test', () => {
  const laptop = act({ ...initialState(), stage: 'work', order: 'laptop', repaired: true, poweredOff: true, screws: 4, screwMask: 15 }, 'cover').state;
  assert.equal(laptop.repaired, false);
  const cassette = act({ ...initialState(), stage: 'work', order: 'cassette', cassetteRepaired: true, cScrews: 3, cScrewMask: 7 }, 'cassette-cover').state;
  assert.equal(cassette.cassetteRepaired, false);
  const remote = act({ ...initialState(), stage: 'work', order: 'remote', rRepaired: true, rScrewMask: 7 }, 'remote-cover').state;
  assert.equal(remote.rRepaired, false);
});


test('loose screws block cassette and remote tests even before opening their covers', () => {
  const cassette = act({ ...initialState(), stage: 'work', order: 'cassette', cScrewMask: 1, cScrews: 1, beltReplaced: true, headCleaned: true, tapeClipFixed: true }, 'cassette-test').state;
  assert.equal(cassette.cassetteRepaired, false);
  const remote = act({ ...initialState(), stage: 'work', order: 'remote', rScrewMask: 1, rGrimeMask: 7, rKeypadClean: true }, 'remote-test').state;
  assert.equal(remote.rRepaired, false);
});
