import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { EN } from './locale-en.js';
import { t, setLanguage, getLanguage, readLanguage, LANGUAGE_KEY } from './i18n.js';
import { GAME_SAVE_KEY, resetSavedGame } from './save-reset.js';
import { initialState } from './game.js';

test('new players default to English and only supported saved languages are accepted', () => {
  assert.equal(readLanguage({getItem: () => null}), 'en');
  assert.equal(readLanguage({getItem: () => 'ru'}), 'ru');
  assert.equal(readLanguage({getItem: () => 'en'}), 'en');
  assert.equal(readLanguage({getItem: () => 'unknown'}), 'en');
  assert.equal(readLanguage({getItem() { throw Error('storage blocked'); }}), 'en');
});
test('tagged text translates with its values intact and switching back restores Russian', () => {
  try {
    assert.equal(setLanguage('en'), true);
    assert.equal(t('Начать сначала'), 'Start over');
    assert.equal(t`Купить · ${120} монет`, 'Buy · 120 coins');
    assert.equal(t`Ожило · ${'{{0}}'}`, "It's alive · {{0}}");
    assert.equal(setLanguage('xx'), false);
    assert.equal(getLanguage(), 'en');
    setLanguage('ru');
    assert.equal(t('Начать сначала'), 'Начать сначала');
    assert.equal(t`Купить · ${120} монет`, 'Купить · 120 монет');
  } finally { setLanguage('ru'); }
});
test('English catalogue covers runtime and HTML source strings with matching placeholders', () => {
  const result = execFileSync(process.execPath, ['scripts/audit-locales.mjs'], {cwd:import.meta.dirname,encoding:'utf8'});
  assert.match(result, /placeholders valid/);
  assert.ok(Object.keys(EN).length > 1200);
});
test('English data retains stable identifiers and contains no Russian client or repair copy', () => {
  const code = `import {CLIENTS} from './stories.js';import {DEVICES} from './devices.js';import {MEMORIES,FOLLOWUPS} from './memories.js';import {DIAGNOSTICS} from './diagnostics.js';import {SHELF,LETTER} from './story.js';import {DECORATIONS} from './workshop.js';import {initialState,act} from './game.js';const text=JSON.stringify([CLIENTS,DEVICES,MEMORIES,FOLLOWUPS,DIAGNOSTICS,SHELF,LETTER,DECORATIONS]);if(/[А-Яа-яЁё]/.test(text))throw Error('Untranslated data');if(CLIENTS.phone[1].id!=='dima')throw Error('Changed ID');const r=act(initialState(),'dev-accept',{order:'pager',client:'sveta'});if(!r.message.startsWith('Order accepted:'))throw Error(r.message);console.log('English data valid');`;
  const result=execFileSync(process.execPath,['--input-type=module','-e',code],{cwd:import.meta.dirname,env:{...process.env,WORKSHOP_LANGUAGE:'en'},encoding:'utf8'});
  assert.match(result,/English data valid/);
});
test('starting over resets all progress while preserving language, sign-in and unrelated storage', () => {
  const values=new Map([[GAME_SAVE_KEY,JSON.stringify({...initialState(),coins:900,furniture:['bed'],completedOrders:['phone'],memories:['phone:dima'],discoveries:['phone:dima'],letterRead:true})],[LANGUAGE_KEY,'ru'],['auth-test','session'],['other-app','keep']]);
  const fresh=resetSavedGame({setItem:(key,value)=>values.set(key,value)});
  assert.deepEqual(fresh,initialState());
  assert.deepEqual(JSON.parse(values.get(GAME_SAVE_KEY)),initialState());
  assert.equal(values.get(LANGUAGE_KEY),'ru');
  assert.equal(values.get('auth-test'),'session');
  assert.equal(values.get('other-app'),'keep');
});
test('a failed reset write reports failure instead of replacing the active game', () => {
  assert.throws(()=>resetSavedGame({setItem(){throw Error('blocked');}}),/blocked/);
});
