// Bible crossword: the grid and the on-screen keyboard (design §4, §8). Squares are buttons with one tab stop (the
// selected square); letters come from a computer's keyboard or the A–Z keys below the grid, never from text boxes,
// whose phone keyboards send no key codes, swipe whole words and zoom the page.
import { Delete } from "lucide-react";
import { forwardRef, type MouseEvent } from "react";
import type { Puzzle, PuzzleWord } from "./game";

interface BoardProps {
  puzzle: Puzzle;
  letters: readonly string[];
  revealed: ReadonlySet<number>;
  wrong: ReadonlySet<number>;
  selected: number;
  word: PuzzleWord | null;
  solved: boolean;
  onSelect: (cell: number) => void;
}

/** The words a screen reader hears for a square: its clue, and where in the answer it is. */
function squareName(puzzle: Puzzle, cell: number, word: PuzzleWord | null): string {
  const own = word?.cells.includes(cell) ? word : puzzle.words.find((w) => w.cells.includes(cell))!;
  const at = own.cells.indexOf(cell) + 1;
  return own.direction === "across" ? `${own.number} Across, letter ${at} of ${own.cells.length}` : `${own.number} Down, letter ${at} of ${own.cells.length}`;
}

export const Board = forwardRef<HTMLDivElement, BoardProps>(function Board({ puzzle, letters, revealed, wrong, selected, word, solved, onSelect }, ref) {
  const inWord = new Set(word?.cells ?? []);
  return <div className="cw-frame">
    <div ref={ref} className={solved ? "cw-grid is-solved" : "cw-grid"} role="group" aria-label="Crossword grid"
      style={{ gridTemplateColumns: `repeat(${puzzle.width}, var(--cw-square))` }}>
      {puzzle.cells.map((answer, cell) => {
        if (answer === null) return <span key={cell} className="cw-block" aria-hidden="true" />;
        const states = [cell === selected ? "is-selected" : "", inWord.has(cell) ? "is-word" : "", wrong.has(cell) ? "is-wrong" : "",
          revealed.has(cell) ? "is-revealed" : ""].filter(Boolean).join(" ");
        return <button key={cell} type="button" data-cell={cell} className={`cw-square ${states}`} tabIndex={cell === selected ? 0 : -1}
          aria-describedby={[wrong.has(cell) ? "cw-wrong-note" : "", revealed.has(cell) ? "cw-revealed-note" : ""].filter(Boolean).join(" ") || undefined}
          onClick={() => onSelect(cell)}>
          {puzzle.numbers[cell] > 0 && <span className="cw-number" aria-hidden="true">{puzzle.numbers[cell]}</span>}
          <span className="cw-letter" translate="no">{letters[cell]}</span>
          <span className="sr-only">{squareName(puzzle, cell, word)}</span>
        </button>;
      })}
    </div>
    <span id="cw-wrong-note" hidden>Marked wrong</span>
    <span id="cw-revealed-note" hidden>Revealed</span>
  </div>;
});

const ROWS: readonly (readonly string[])[] = [[..."QWERTYUIOP"], [..."ASDFGHJKL"], [..."ZXCVBNM", "back"]];

/** The A–Z keys. A pressed key keeps the focus where it was (on the grid), so a computer's keys still work after. */
export function Keyboard({ onKey }: { onKey: (key: string) => void }) {
  const keep = (event: MouseEvent) => event.preventDefault();
  return <div className="cw-keyboard" role="group" aria-label="Keyboard">
    {ROWS.map((row, r) => <div key={r} className="cw-keys">
      {row.map((key) => key === "back"
        ? <button key={key} type="button" className="cw-key cw-key-wide" onMouseDown={keep} onClick={() => onKey("Backspace")} aria-label="Backspace">
          <Delete size={18} aria-hidden="true" />
        </button>
        : <button key={key} type="button" className="cw-key" onMouseDown={keep} onClick={() => onKey(key)}>{key}</button>)}
    </div>)}
  </div>;
}
