// The six rows of five tiles (design §9.1): played rows coloured, the row being typed, then empty rows. A newly played
// row turns its tiles one after another; a refused row shakes. Each tile tells a screen reader its letter and state.
import { evaluate, MAX_TRIES, WORD_LENGTH, type Mark } from "./evaluate";
import { markLabel } from "./text";

interface BoardProps {
  guesses: readonly string[];
  answer: string;
  typed: string;
  /** The row turning over now (no animation when null). */
  revealing: number | null;
  /** Changes on every refusal, so the typed row shakes again. */
  shake: number;
}

export function Board({ guesses, answer, typed, revealing, shake }: BoardProps) {
  return <div className="bw-board" role="group" aria-label="Your guesses">
    {Array.from({ length: MAX_TRIES }, (_, row) => {
      if (row < guesses.length) return <PlayedRow key={row} row={row} guess={guesses[row]} marks={evaluate(guesses[row], answer)} turning={row === revealing} />;
      const current = row === guesses.length && guesses.length < MAX_TRIES && !guesses.includes(answer);
      return <div key={current ? `typing-${shake}` : row} className={`bw-row${current && shake ? " bw-shake" : ""}`} role="group" aria-label={`Row ${row + 1}`}>
        {Array.from({ length: WORD_LENGTH }, (_, i) => {
          const letter = current ? typed[i] : undefined;
          return <span key={i} className={`bw-tile${letter ? " bw-filled" : ""}`} role="img" aria-label={letter ? letter.toUpperCase() : "Empty"}>{letter?.toUpperCase()}</span>;
        })}
      </div>;
    })}
  </div>;
}

function PlayedRow({ row, guess, marks, turning }: { row: number; guess: string; marks: Mark[]; turning: boolean }) {
  return <div className="bw-row" role="group" aria-label={`Row ${row + 1}`}>
    {marks.map((mark, i) => <span key={i} className={`bw-tile bw-${mark}${turning ? " bw-turn" : ""}`} style={turning ? { animationDelay: `${i * 250}ms` } : undefined}
      role="img" aria-label={markLabel(guess[i], mark)}>{guess[i].toUpperCase()}</span>)}
  </div>;
}
