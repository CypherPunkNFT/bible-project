import { correct, score } from './game';
import type { Deck, Run } from './types';
export function shareText(deck: Deck, run: Run): string {
  return `Two truths and a lie — ${score(deck,run)}/10\n${run.rounds.map(r=>correct(deck,r)?'🟩':'🟥').join('')}\nbibleguide.io/games/two-truths`;
}

/** shared / copied: done. cancelled: the player closed the share sheet. manual: show the text to select and copy. */
export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'manual';

/** The phone's share sheet where there is one, else the clipboard, else the caller shows a select-and-copy box. */
export async function shareResult(text: string): Promise<ShareOutcome> {
  if (typeof navigator.share === 'function' && (navigator.canShare?.({text}) ?? true)) {
    try {
      await navigator.share({text});
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      console.warn('Two truths: sharing failed, copying instead:', error);
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch (error) {
    console.warn('Two truths: the clipboard is blocked, showing the text to copy:', error);
    return 'manual';
  }
}
