// The six rows of five tiles (design §9.1), every tile a kit flip card with a stable key: a row being typed shows its
// letters on the front, and the moment a guess is saved the row turns over, one tile after another, with the colour
// appearing only at the half-turn (the audit's first fault). A refused row shakes; the winning row hops once the turn
// is over. Each tile tells a screen reader its letter and state from its root, so the faces stay decorative.
import { memo, type CSSProperties } from "react";
import { FlipCard, HopWave } from "../kit";
import { evaluate, MAX_TRIES, WORD_LENGTH, type Mark } from "./evaluate";
import { markLabel } from "./text";

/** Each tile turns this much later than the one before it. */
export const FLIP_STAGGER_MS = 250;
/** One tile's turn (the kit's flip transition). */
export const FLIP_MS = 600;
/** The whole row, from Enter to the last tile settled. */
export const REVEAL_MS = (WORD_LENGTH - 1) * FLIP_STAGGER_MS + FLIP_MS;

interface BoardProps {
  guesses: readonly string[];
  answer: string;
  typed: string;
  /** Changes on every refusal, so the typed row shakes again. */
  shake: number;
  /** The row that should hop (the winning row, once its turn is over), or null. */
  hopping: number | null;
}

export const Board = memo(function Board({ guesses, answer, typed, shake, hopping }: BoardProps) {
  const over = guesses.length >= MAX_TRIES || guesses.includes(answer);
  return <div className="bw-board" role="group" aria-label="Your guesses" style={{ "--kit-flip-stagger": `${FLIP_STAGGER_MS}ms` } as CSSProperties}>
    {Array.from({ length: MAX_TRIES }, (_, row) => {
      const played = row < guesses.length;
      const current = !played && row === guesses.length && !over;
      const marks: Mark[] | null = played ? evaluate(guesses[row], answer) : null;
      const shaking = current && shake > 0 ? ` bw-shake-${shake % 2 ? "a" : "b"}` : "";
      return <HopWave key={row} when={hopping === row} className={`bw-row${shaking}`} role="group" aria-label={`Row ${row + 1}`}>
        {Array.from({ length: WORD_LENGTH }, (_, i) => {
          const letter = played ? guesses[row][i] : current ? typed[i] : undefined;
          const mark = marks?.[i] ?? null;
          return <FlipCard key={i} index={i} axis="x" flipped={played} className={`bw-tile${letter ? " bw-filled" : ""}`}
            role="img" aria-label={mark && letter ? markLabel(letter, mark) : letter ? letter.toUpperCase() : "Empty"}
            front={<span key={letter ?? ""} className={letter ? "bw-letter bw-pop" : "bw-letter"}>{letter?.toUpperCase()}</span>}
            back={<span className={`bw-letter bw-face bw-${mark ?? "absent"}`}>{letter?.toUpperCase()}</span>} />;
        })}
      </HopWave>;
    })}
  </div>;
});
