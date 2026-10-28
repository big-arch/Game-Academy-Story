import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { focusedFix, cycleFix } from './repair-focus.js';
import { DEVICES } from './devices.js';

test('one focused part advances to a workable unfinished step without repeating completed parts', () => {
  const fixes = DEVICES['video-camera'].fixes;
  let repair = {fixed:[]};
  assert.equal(focusedFix(fixes,repair,null).id,'ribbon');
  repair.fixed = ['ribbon'];
  assert.equal(focusedFix(fixes,repair,'ribbon').id,'power-trace');
  assert.equal(focusedFix(fixes,repair,'mech').id,'mech');
  assert.equal(cycleFix(fixes,repair,'power-trace',-1).id,'mech');
  repair.fixed = ['ribbon','power-trace'];
  assert.equal(focusedFix(fixes,repair,null).id,'power-joint');
  repair.fixed = fixes.map(f=>f.id);
  assert.equal(focusedFix(fixes,repair,null),null);
  assert.equal(cycleFix(fixes,repair,null,1),null);
});
