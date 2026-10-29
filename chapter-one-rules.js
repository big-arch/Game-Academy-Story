// Stable facts shared by JavaScript gameplay and the C# reachability auditor.
export const CHAPTER_RULES = [
  { id: 'open', needs: [], gives: 'parcel' },
  { id: 'photo', needs: ['parcel'], gives: 'photo' },
  { id: 'flip', needs: ['photo'], gives: 'frequency' },
  { id: 'listen', needs: ['parcel'], gives: 'radio' },
  { id: 'invite', needs: ['parcel'], gives: 'guest' },
  { id: 'tea', needs: ['guest'], gives: 'tea' },
  { id: 'show-photo', needs: ['guest', 'tea', 'photo'], gives: 'testimony' },
  { id: 'repair-tape', needs: ['parcel'], gives: 'tape' },
  { id: 'play', needs: ['tape'], gives: 'recording' },
  { id: 'identify', needs: ['radio', 'testimony', 'recording'], gives: 'owner' },
  { id: 'return', needs: ['owner'], gives: 'delivered' },
];
export const CHAPTER_FACTS = CHAPTER_RULES.map(rule => rule.gives);
export const CHAPTER_REWARD = 90;
