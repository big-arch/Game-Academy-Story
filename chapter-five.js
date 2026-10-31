import { chapterFourProgress } from './chapter-four.js';
import { C5 } from './chapter-five-copy.js';

export const CHAPTER_FIVE_REWARD = 180;
export const BULBS = ['25', '40', '100'];
export function chapterFiveProgress(state) {
  const p = state.chapterFive || {};
  return { chapterFive: {
    unplugged: p.unplugged === true,
    opened: p.opened === true,
    inspected: p.inspected === true,
    diagnosed: p.diagnosed === true,
    soldered: p.soldered === true,
    bulb: ['25', '40'].includes(p.bulb) ? p.bulb : null,
    closed: p.closed === true || ['desk', 'window'].includes(p.ending),
    tested: p.tested === true || ['desk', 'window'].includes(p.ending),
    ending: ['desk', 'window'].includes(p.ending) ? p.ending : null,
  } };
}
export function chapterFiveAvailable(state) { return !!chapterFourProgress(state).chapterFour.ending; }
export function chapterFiveGoal(state) {
  const p = chapterFiveProgress(state).chapterFive;
  if (p.ending) return p.ending === 'desk' ? C5.doneDesk : C5.doneWindow;
  return !p.unplugged ? C5.goalUnplug : !p.opened ? C5.goalOpen : !p.inspected ? C5.goalInspect : !p.diagnosed ? C5.goalDiagnose : !p.soldered ? C5.goalSolder : !p.bulb ? C5.goalBulb : !p.closed ? C5.goalClose : !p.tested ? C5.goalTest : C5.goalEnd;
}
export function actChapterFive(state, action, target) {
  const p = chapterFiveProgress(state).chapterFive;
  const unchanged = message => ({ state, message });
  const update = (next, message = '', extra = {}) => ({ state: { ...state, chapterFive: { ...p, ...next }, ...extra }, message });
  if (!chapterFiveAvailable(state)) return unchanged(C5.needFirst);
  if (p.ending) return unchanged(p.ending === 'desk' ? C5.endingDesk : C5.endingWindow);
  if (action === 'tag') return unchanged(C5.tagText);
  if (action === 'unplug') return update({ unplugged: true }, C5.unplugged);
  if (action === 'open') {
    if (!p.unplugged) return unchanged(C5.needUnplug);
    return update({ opened: true }, C5.opened);
  }
  if (action === 'inspect') {
    if (!p.opened) return unchanged(C5.needOpen);
    return update({ inspected: true }, C5.inspected);
  }
  if (action === 'diagnose') {
    if (!p.inspected) return unchanged(C5.needOpen);
    if (target === 'bulb') return unchanged(C5.wrongBulbFault);
    if (target === 'switch') return unchanged(C5.wrongSwitchFault);
    if (target !== 'wire') return unchanged(C5.diagnose);
    return update({ diagnosed: true }, C5.diagnosed);
  }
  if (action === 'solder') {
    if (!p.diagnosed) return unchanged(C5.needDiagnose);
    if (!Number.isFinite(target) || target < .55 || target > .82) return unchanged(C5.solderRetry);
    return update({ soldered: true }, C5.soldered);
  }
  if (action === 'bulb' && BULBS.includes(target)) {
    if (!p.soldered) return unchanged(C5.needDiagnose);
    if (target === '100') return unchanged(C5.wrong100);
    return update({ bulb: target, closed: false, tested: false }, target === '25' ? C5.bulb25Done : C5.bulbDone);
  }
  if (action === 'close') {
    if (!p.bulb) return unchanged(C5.goalBulb);
    return update({ closed: true }, C5.closed);
  }
  if (action === 'test') {
    if (!p.closed) return unchanged(C5.goalClose);
    return update({ tested: true }, C5.tested);
  }
  if (action === 'end' && ['desk', 'window'].includes(target)) {
    if (!p.bulb || !p.closed || !p.tested) return unchanged(chapterFiveGoal(state));
    return update({ ending: target }, target === 'desk' ? C5.endingDesk : C5.endingWindow, { coins: (Number.isSafeInteger(state.coins) && state.coins >= 0 ? state.coins : 0) + CHAPTER_FIVE_REWARD });
  }
  return unchanged(chapterFiveGoal(state));
}
