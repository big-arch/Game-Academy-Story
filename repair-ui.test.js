import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { DEVICES } from './devices.js';
import { deviceActions, targetState, diagnosisChoices } from './repair-ui.js';

test('an open console always exposes assembly, including before diagnosis', () => {
  const cfg = DEVICES.console;
  const diagnosing = { open: true, inside: true, diagnosed: false, fixed: [], repaired: false };
  const actions = deviceActions(cfg, diagnosing);
  assert.equal(actions[0][0], 'dev-cover');
  assert.equal(actions.length, 2);
  assert.ok(diagnosisChoices('console', cfg).some(([id]) => id === 'ddiag-slot'));
  assert.ok(diagnosisChoices('remote').some(([id]) => id === 'rdiag-contacts'));
  assert.ok(diagnosisChoices('cassette').some(([id]) => id === 'diagnose-belt'));
  assert.equal(deviceActions(cfg, { ...diagnosing, diagnosed: true })[0][0], 'dev-cover');
  assert.equal(deviceActions(cfg, { ...diagnosing, inside: false })[0][0], 'dev-cover');
  assert.ok(!deviceActions(cfg, { ...diagnosing, open: false }).some(([id]) => id === 'dev-cover'));
});

test('repair highlights reflect inspection, dependencies, selected tool and completion', () => {
  const fix = DEVICES.pager.fixes.find(f => f.id === 'cell');
  const repair = { diagnosed: false, fixed: [] };
  assert.equal(targetState(repair, fix, 'inspect'), 'inspect');
  assert.equal(targetState({ ...repair, diagnosed: true }, fix, 'hand'), 'inspect');
  assert.equal(targetState({ diagnosed: true, fixed: ['contacts'] }, fix, 'brush'), 'available');
  assert.equal(targetState({ diagnosed: true, fixed: ['contacts'] }, fix, 'hand'), 'ready');
  assert.equal(targetState({ diagnosed: true, fixed: ['contacts', 'cell'] }, fix, 'hand'), 'done');
});
