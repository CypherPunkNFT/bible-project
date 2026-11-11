// The share text, unchanged since the first build: the score, the ten squares, the address. Sharing itself (the share
// sheet, the clipboard, the copy box) is the kit's ShareButton.
import { correct, score } from './game';
import type { Deck, Run } from './types';
export function shareText(deck: Deck, run: Run): string {
  return `Two truths and a lie — ${score(deck,run)}/10\n${run.rounds.map(r=>correct(deck,r)?'🟩':'🟥').join('')}\nbibleguide.io/games/two-truths`;
}
