// The deck in the real game (owner, 2026-11-12: "approved, place it in for real"): while a round is played, each answer
// drops that puzzle's odd one onto a stack beside the puzzle (PlayStack.tsx) and keeps it in the player's deck. The
// start screen is unchanged. Odd one out reads these through OddExtrasContext (../extras.ts), whose default they are.
import type { OddExtras } from "../extras";
import { PlayStack } from "./PlayStack";
import { keep } from "./deck";
import "./odd-deck.css";

export const DECK_EXTRAS: OddExtras = {
  playAside: (data, round) => <PlayStack data={data} round={round} />,
  onReveal: (data, set, right) => { keep(data, set, right); },
};
