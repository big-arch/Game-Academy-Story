import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { initialState, act } from './game.js';
test('repair requires safe disassembly and fixing all three cooling faults', () => {
  let s = initialState(); const run = (a,t) => { s = act(s, a,t).state; };
  run('accept'); run('cover'); assert.equal(s.open, false);
  run('power'); run('cover'); assert.equal(s.open, false);
  run('screw',0); run('screw',0); assert.equal(s.screws, 1);
  for (let i = 1; i < 4; i++) run('screw',i);
  run('cover'); run('paste'); assert.equal(s.paste, false);
  run('clean',0); run('clean',0); assert.equal(s.dust, 1);
  for (let i = 1; i < 3; i++) run('clean',i);
  run('connect'); run('cover'); run('power'); assert.equal(s.poweredOff, true);
  for (let i = 0; i < 4; i++) run('screw',i);
  run('power'); run('test'); assert.equal(s.repaired, false);
  run('power'); for (let i = 0; i < 4; i++) run('screw',i);
  run('cover'); run('thermal'); run('paste'); run('cover');
  for (let i = 0; i < 4; i++) run('screw',i);
  run('power'); run('test'); assert.equal(s.repaired, true);
  run('finish'); assert.equal(s.stage, 'ending');
});

test('new laptop order selects laptop', () => {
  assert.equal(act(initialState(), 'accept').state.order, 'laptop');
});

test('cassette must be opened, repaired and closed before it passes the test', () => {
  let s=initialState(); const run=(a,t)=>{s=act(s,a,t).state;};
  run('cassette-accept'); run('cassette-cover'); assert.equal(s.cassetteOpen,false);
  run('cassette-head'); assert.equal(s.headCleaned,false);
  run('cassette-inspect'); run('cassette-diagnose','belt'); assert.equal(s.cassetteDiagnosed,false);
  for(let i=0;i<3;i++)run('cassette-screw',i);
  run('cassette-cover'); assert.equal(s.cassetteOpen,true);
  run('cassette-belt'); assert.equal(s.beltReplaced,false);
  run('cassette-inspect'); run('cassette-diagnose','battery'); assert.equal(s.cassetteDiagnosed,false);
  run('cassette-diagnose','belt'); assert.equal(s.cassetteDiagnosed,true);
  run('cassette-tape');run('cassette-belt');run('cassette-head');
  run('cassette-test');assert.equal(s.cassetteRepaired,false);
  run('cassette-cover');run('cassette-test');assert.equal(s.cassetteRepaired,false);
  for(let i=0;i<3;i++)run('cassette-screw',i);
  run('cassette-test');assert.equal(s.cassetteRepaired,true);
  run('cassette-finish');assert.equal(s.stage,'ending');
});


test('rewards are awarded once and lamp costs saved coins', () => {
  let s = { ...initialState(), stage: 'work', order: 'cassette', cassetteRepaired: true };
  s = act(s, 'cassette-finish').state;
  assert.equal(s.coins, 120);
  s = act(s, 'cassette-finish').state;
  assert.equal(s.coins, 120);
  s = act(s, 'upgrade').state;
  assert.equal(s.coins, 0);
  assert.equal(s.upgrade, true);
  s = act(s, 'upgrade').state;
  assert.equal(s.coins, 0);
  const broke = act(initialState(), 'upgrade').state;
  assert.equal(broke.upgrade, false);
  assert.equal(broke.coins, 0);
});

test('remote needs diagnosis, cleaning and reassembly before it passes the test', () => {
  let s=initialState(); const run=(a,t)=>{s=act(s,a,t).state;};
  run('remote-accept'); assert.equal(s.order,'remote');
  run('remote-cover'); assert.equal(s.rOpen,false);
  for(let i=0;i<3;i++)run('remote-screw',i);
  run('remote-cover'); assert.equal(s.rOpen,true);
  run('remote-clean',0); assert.equal(s.rGrimeMask,0);
  run('remote-diagnose','contacts'); assert.equal(s.rDiagnosed,false);
  run('remote-inspect'); run('remote-diagnose','battery'); assert.equal(s.rDiagnosed,false);
  run('remote-diagnose','contacts'); assert.equal(s.rDiagnosed,true);
  for(let i=0;i<3;i++)run('remote-clean',i);
  run('remote-cover'); run('remote-test'); assert.equal(s.rRepaired,false);
  for(let i=0;i<3;i++)run('remote-screw',i);
  run('remote-test'); assert.equal(s.rRepaired,false);
  run('remote-cover'); assert.equal(s.rOpen,false);
  for(let i=0;i<3;i++)run('remote-screw',i);
  run('remote-cover'); run('remote-keypad'); run('remote-cover');
  for(let i=0;i<3;i++)run('remote-screw',i);
  run('remote-test'); assert.equal(s.rRepaired,true);
  run('remote-finish'); assert.equal(s.stage,'ending'); assert.equal(s.coins,80);
  run('remote-finish'); assert.equal(s.coins,80);
});

test('story clues are counted once and paid as tips on return', () => {
  let s = act(initialState(), 'remote-accept', 'zoya').state;
  assert.equal(s.client, 'zoya');
  s = act(s, 'clue', 'heart').state; s = act(s, 'clue', 'heart').state; s = act(s, 'clue', 'tape').state;
  assert.deepEqual(s.clues, ['heart', 'tape']);
  const done = act({ ...s, rRepaired: true }, 'remote-finish');
  assert.equal(done.state.coins, 80 + 20);
  assert.match(done.message, /20 чаевых/);
});

test('data-driven devices follow screws, diagnosis, ordered fixes and reassembly', () => {
  let s = initialState(); const run = (a, t) => { s = act(s, a, t).state; };
  run('dev-accept', { order: 'pager', client: 'sveta' }); assert.equal(s.order, 'pager'); assert.equal(s.client, 'sveta');
  run('dev-cover'); assert.equal(s.dev.open, false);
  run('dev-screw', 0); run('dev-screw', 1); run('dev-cover'); assert.equal(s.dev.open, true);
  run('dev-fix', 'contacts'); assert.deepEqual(s.dev.fixed, []);
  run('dev-inspect'); run('dev-diagnose', 'screen'); assert.equal(s.dev.diagnosed, false);
  run('dev-diagnose', 'cell'); assert.equal(s.dev.diagnosed, true);
  run('dev-fix', 'cell'); assert.deepEqual(s.dev.fixed, []);
  run('dev-fix', 'contacts'); run('dev-fix', 'cell'); assert.deepEqual(s.dev.fixed, ['contacts', 'cell']);
  run('dev-test'); assert.equal(s.dev.repaired, false);
  run('dev-cover'); run('dev-test'); assert.equal(s.dev.repaired, false);
  run('dev-screw', 0); run('dev-screw', 1); run('dev-test'); assert.equal(s.dev.repaired, true);
  run('dev-finish'); assert.equal(s.stage, 'ending'); assert.equal(s.coins, 90);
});

test('hidden second fault appears on the first passing test and must be fixed after reopening', () => {
  let s = initialState(); const run = (a, t) => { s = act(s, a, t).state; };
  run('dev-accept', { order: 'phone', client: 'dima' });
  for (let i = 0; i < 4; i++) run('dev-screw', i);
  run('dev-cover'); run('dev-inspect'); run('dev-diagnose', 'battery'); run('dev-fix', 'port'); run('dev-fix', 'battery');
  run('dev-cover'); for (let i = 0; i < 4; i++) run('dev-screw', i);
  run('dev-test'); assert.equal(s.dev.hiddenFound, true); assert.equal(s.dev.repaired, false);
  run('dev-test'); assert.equal(s.dev.repaired, false);
  for (let i = 0; i < 4; i++) run('dev-screw', i);
  run('dev-cover'); run('dev-fix', 'antenna'); run('dev-cover'); for (let i = 0; i < 4; i++) run('dev-screw', i);
  run('dev-test'); assert.equal(s.dev.repaired, true);
});

test('careful repairs earn a bonus and sloppy ones lose part of the tip', () => {
  const finish = slips => act({ ...initialState(), stage: 'work', order: 'pager', clues: ['find'], dev: { repaired: true, slips } }, 'dev-finish').state.coins;
  assert.equal(finish(0), 90 + 10 + 15);
  assert.equal(finish(1), 90 + 10);
  assert.equal(finish(3), 90 + 0);
});
