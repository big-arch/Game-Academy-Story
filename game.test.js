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
  run('connect'); run('cover'); run('power'); run('test'); assert.equal(s.repaired, false);
  run('power'); run('cover'); run('thermal'); run('paste'); run('cover'); run('power'); run('test'); assert.equal(s.repaired, true);
  run('finish'); assert.equal(s.stage, 'ending');
});
