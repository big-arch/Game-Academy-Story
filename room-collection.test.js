import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { existsSync } from 'node:fs';
import { collectionItems, COLLECTION_SLOTS } from './room-collection.js';
import { CONTRACTS } from './campaign.js';
import { SHELF } from './story.js';

test('the rack contains only returned devices, with one physical miniature per type', () => {
  assert.deepEqual(collectionItems({}),[]);
  assert.deepEqual(collectionItems({shelfDone:{}}),[]);
  assert.deepEqual(collectionItems({order:'console',stage:'work'}),[]);
  const state = {completedOrders:['phone','console','phone','unknown'],shelfDone:['pager-143']};
  assert.deepEqual(collectionItems(state).map(item=>item.order),['phone','console','pager']);
  assert.deepEqual(state.completedOrders,['phone','console','phone','unknown']);
});

test('all completed jobs and story objects fit the cabinet and use existing game artwork', () => {
  const items = collectionItems({completedOrders:CONTRACTS.map(c=>c.order),shelfDone:SHELF.map(s=>s.id)});
  assert.ok(items.some(item=>item.order==='music-box'));
  assert.ok(items.length<=COLLECTION_SLOTS);
  assert.equal(new Set(items.map(item=>item.order)).size,items.length);
  for (const item of items) {
    assert.ok(item.name.length>1);
    assert.ok(existsSync(new URL(item.src,import.meta.url)),`${item.order}: thumbnail source`);
  }
  assert.deepEqual(items.find(item=>item.order==='laptop').crop,[88,433,753,961]);
});
