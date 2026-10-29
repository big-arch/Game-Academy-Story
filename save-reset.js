import { initialState } from './game.js';
export const GAME_SAVE_KEY = 'workshop-stories-v1';
// Replace only the game's progress. Language, sign-in and unrelated storage stay intact.
// A failed write must leave the current in-memory game available to the player.
export function resetSavedGame(storage) {
  const fresh = initialState();
  storage.setItem(GAME_SAVE_KEY, JSON.stringify(fresh));
  return fresh;
}
