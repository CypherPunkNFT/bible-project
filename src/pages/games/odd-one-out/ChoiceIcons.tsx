// Odd one out: a small line drawing for each choice card on the start screen (owner, 2026-11-12: the Bible crossword's
// start screen is the standard). Drawn on a 24-unit square in the game's colour with round ends, like the crossword's.
import type { ReactNode } from "react";
import type { Choice } from "./game";

const DRAWINGS: Record<Choice, ReactNode> = {
  // People: two figures.
  person: <><circle cx="8.5" cy="8" r="2.8" /><path d="M3 20a5.5 5.5 0 0 1 11 0" /><circle cx="16.5" cy="7" r="2.4" /><path d="M14.6 13.2A5 5 0 0 1 21.5 18" /></>,
  // Places: a pin standing on the land.
  place: <><path d="M12 18s-5.5-4.8-5.5-9.2a5.5 5.5 0 0 1 11 0C17.5 13.2 12 18 12 18z" /><circle cx="12" cy="8.8" r="2" /><path d="M5 18.5c-1.6.4-2.5 1-2.5 1.5 0 1.1 4.3 2 9.5 2s9.5-.9 9.5-2c0-.5-.9-1.1-2.5-1.5" /></>,
  // Books: a closed book with its ribbon.
  book: <><path d="M5 18.5V5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2 2 2 0 0 0 2 2h12" /><path d="M8.5 18h10.5" /><path d="M14 3v6.5l-1.75-1.3L10.5 9.5V3" /></>,
  // Mixed: three cards fanned out, one of each.
  mixed: <><path d="M3 9.5 8.4 8l2.3 8.7-5.4 1.4z" /><path d="M21 9.5 15.6 8l-2.3 8.7 5.4 1.4z" /><path d="M9 4h6v12H9z" /><path d="M12 8.2l1.5 1.8-1.5 1.8-1.5-1.8z" /></>,
};

export function ChoiceIcon({ choice }: { choice: Choice }) {
  return <svg className="oo-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{DRAWINGS[choice]}</svg>;
}
