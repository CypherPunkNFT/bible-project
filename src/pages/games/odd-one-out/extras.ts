// Optional extras a page can plug into Odd one out without copying it: the local deck mock-ups
// (/games/odd-one-out_mockup..4, owner 2026-11-12) put their own start-screen graphic in place of the sample deal and
// hear each answer. The real page provides none, so it behaves exactly as before.
import { createContext, type ReactNode } from "react";
import type { SetEntry, SetsFile } from "./game";

export interface OddExtras {
  /** Drawn on the start screen in place of the four sample cards. */
  startArt?: (data: SetsFile) => ReactNode;
  /** Called once when a puzzle is answered: the set, and whether the pick was the odd one. */
  onReveal?: (data: SetsFile, set: SetEntry, right: boolean) => void;
}

export const OddExtrasContext = createContext<OddExtras>({});
