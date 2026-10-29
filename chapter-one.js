import { CHAPTER_RULES, CHAPTER_FACTS, CHAPTER_REWARD } from './chapter-one-rules.js';
import { C } from './chapter-one-copy.js';
export function chapterProgress(state) {
  const raw = state.chapterOne || {};
  return { chapterOne: {
    facts: [...new Set((Array.isArray(raw.facts) ? raw.facts : []).filter(fact => CHAPTER_FACTS.includes(fact)))],
    frequency: Number.isInteger(raw.frequency) && raw.frequency >= 880 && raw.frequency <= 1080 ? raw.frequency : 880,
    tapeRoute: Number.isInteger(raw.tapeRoute) ? Math.max(0, Math.min(3, raw.tapeRoute)) : 0,
    tapeTight: raw.tapeTight === true,
  } };
}
export function hasChapterFact(state, fact) { return chapterProgress(state).chapterOne.facts.includes(fact); }
export function chapterGoal(state) {
  if (hasChapterFact(state,'delivered')) return C.endingShort;
  if (hasChapterFact(state,'owner')) return C.goalReturn;
  const goals = [['parcel', C.goalParcel], ['photo', C.goalPhoto], ...(!hasChapterFact(state,'radio') ? [['frequency',C.goalPhoto]] : []), ['radio', C.goalRadio], ['guest', C.goalGuest], ['tea', C.goalTea], ['testimony', C.goalTestimony], ['tape', C.goalTape], ['recording', C.goalRecording], ['owner', C.goalOwner]];
  return goals.find(([fact]) => !hasChapterFact(state, fact))?.[1] || C.endingShort;
}
export function actChapter(state, action, target) {
  const progress = chapterProgress(state).chapterOne;
  const facts = progress.facts;
  const update = (message, next = progress, extra = {}) => ({state: {...state, chapterOne: next, ...extra}, message});
  if (action === 'frequency') {
    if (!Number.isInteger(target) || target < 880 || target > 1080) return {state, message: C.static};
    return update('', {...progress, frequency: target});
  }
  if (action === 'tighten') {
    if (!facts.includes('parcel')) return {state, message: C.locked};
    if (target !== 'clockwise') return {state, message: C.wrongDirection};
    return update(C.tapeHelp, {...progress, tapeTight: true});
  }
  if (action === 'route') {
    if (!facts.includes('parcel') || !progress.tapeTight) return {state, message: C.directionFirst};
    if (facts.includes('tape')) return {state, message: C.repaired};
    if (target !== progress.tapeRoute) return {state, message: C.routeOrder};
    const tapeRoute = progress.tapeRoute + 1;
    return update(tapeRoute === 3 ? C.repaired : C.routeOrder, {...progress, tapeRoute, facts: tapeRoute === 3 ? [...facts, 'tape'] : facts});
  }
  const rule = CHAPTER_RULES.find(entry => entry.id === action);
  if (!rule || action === 'repair-tape') return {state, message: C.locked};
  if (facts.includes(rule.gives)) return {state, message: action === 'return' ? C.endingShort : ''};
  if (!rule.needs.every(fact => facts.includes(fact))) return {state, message: action === 'identify' ? C.needEvidence : action === 'show-photo' ? C.teaFirst : C.locked};
  if (action === 'listen' && progress.frequency !== 917) return {state, message: C.static};
  if (action === 'tea' && target !== 'lemon') return {state, message: C.wrongTea};
  if (action === 'identify' && target !== 'anna') return {state, message: C.wrongOwner};
  const messages = {open:C.opened, photo:C.front, flip:C.reverse, listen:C.broadcast, invite:C.welcome, tea:C.teaDone, 'show-photo':C.testimony, play:C.recording, identify:C.identified, return:C.ending};
  return update(messages[action] || '', {...progress, facts:[...facts, rule.gives]}, action === 'return' ? {coins:(Number.isSafeInteger(state.coins) && state.coins >= 0 ? state.coins : 0) + CHAPTER_REWARD} : {});
}
