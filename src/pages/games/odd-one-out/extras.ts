// Extras plugged into Odd one out without copying it. The default is the deck (deck/DeckExtras.tsx): the stack of
// odd ones beside the puzzle while a round is played and the cards kept in this browser, tried as the mock-up
// /games/odd-one-out_mockup and put in the game on the owner's approval (2026-11-12). A page or test can provide
// other extras, or {} for the game alone.
import { createContext, type ReactNode } from "react";
import { DECK_EXTRAS } from "./deck/DeckExtras";
import type { SetEntry, SetsFile } from "./game";
import type { RoundState } from "./storage";

export interface OddExtras {
  /** Drawn on the start screen in place of the four sample cards. */
  startArt?: (data: SetsFile) => ReactNode;
  /** Drawn beside the puzzle while a round is played (below it on a phone). */
  playAside?: (data: SetsFile, round: RoundState) => ReactNode;
  /** Called once when a puzzle is answered: the set, and whether the pick was the odd one. */
  onReveal?: (data: SetsFile, set: SetEntry, right: boolean) => void;
}

export const OddExtrasContext = createContext<OddExtras>(DECK_EXTRAS);
