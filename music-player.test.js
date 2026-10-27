import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createShuffleBag } from './music-player.js';
test('playlist uses every track before repeating and avoids a repeat across rounds',()=>{
  const tracks=['a','b','c'];const next=createShuffleBag(tracks,()=>0);
  const a=[next(),next(),next()], b=[next(),next(),next()];
  assert.deepEqual(new Set(a),new Set(tracks));assert.deepEqual(new Set(b),new Set(tracks));assert.notEqual(a[2],b[0]);
});
