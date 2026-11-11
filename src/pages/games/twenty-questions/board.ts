// Bible twenty questions, reverse mode: the suspect board's arithmetic (the audit's item 3), kept pure so it is tested
// without a page. The board draws the first few people still possible as cards; when an answer rules some out, their
// cards stay in their places, turned face down, until the game drops them after the motion, and the next people still
// possible fill the empty places at the end.

/** How many suspect cards the board draws; the rest are a count. Fewer on a phone, so the question list stays near. */
export const BOARD_CARDS = 40;
export const PHONE_CARDS = 18;

export interface BoardCard { person: number; out: boolean }

/** The cards after the people still possible change: those still possible keep their places, those ruled out are
 *  marked `out` in place (unless `keepOut` is false, when they are dropped at once), and people not yet drawn fill the
 *  board back up to `size` in the order given. */
export function boardCards(cards: readonly BoardCard[], possible: readonly number[], keepOut = true, size = BOARD_CARDS): BoardCard[] {
  const stillIn = new Set(possible);
  const kept = cards.flatMap((card) => (stillIn.has(card.person) ? [{ person: card.person, out: false }] : keepOut ? [{ person: card.person, out: true }] : []));
  const drawn = new Set(kept.map((card) => card.person));
  const room = Math.max(0, size - kept.filter((card) => !card.out).length);
  const fill = possible.filter((person) => !drawn.has(person)).slice(0, room).map((person) => ({ person, out: false }));
  return [...kept, ...fill];
}

/** The same board with the ruled-out cards dropped, once their motion is over; the same array when none was out. */
export const dropOut = (cards: BoardCard[]): BoardCard[] => (cards.some((card) => card.out) ? cards.filter((card) => !card.out) : cards);
