// Bible crossword: the grid and the on-screen keyboard (design §4, §8). Squares are buttons with one tab stop (the
// selected square); letters come from a computer's keyboard or the A–Z keys below the grid, never from text boxes,
// whose phone keyboards send no key codes, swipe whole words and zoom the page. The redesign (docs/visual-audits/
// crossword-redesign.md) draws solid blocks, a ring and a direction arrow on the selected square, a pop for each typed
// letter, a pulse when a word fills, a tick for a confirmed word and a gold wave across the grid when it is solved.
import { Delete } from "lucide-react";
import { forwardRef, useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import type { Direction } from "@/lib/puzzles";
import type { Puzzle, PuzzleWord } from "./game";

interface BoardProps {
  puzzle: Puzzle;
  letters: readonly string[];
  revealed: ReadonlySet<number>;
  wrong: ReadonlySet<number>;
  /** Squares a check confirmed right. */
  right: ReadonlySet<number>;
  selected: number;
  direction: Direction;
  word: PuzzleWord | null;
  /** The word that just filled, with a count so the same word can pulse again: "3-across:2". */
  pulse: string;
  solved: boolean;
  onSelect: (cell: number) => void;
}

/** The words a screen reader hears for a square: its clue, and where in the answer it is. */
function squareName(puzzle: Puzzle, cell: number, word: PuzzleWord | null): string {
  const own = word?.cells.includes(cell) ? word : puzzle.words.find((w) => w.cells.includes(cell))!;
  const at = own.cells.indexOf(cell) + 1;
  return own.direction === "across" ? `${own.number} Across, letter ${at} of ${own.cells.length}` : `${own.number} Down, letter ${at} of ${own.cells.length}`;
}

const pulsedCells = (puzzle: Puzzle, pulse: string): Set<number> => {
  const [key] = pulse.split(":");
  const word = puzzle.words.find((w) => `${w.number}-${w.direction}` === key);
  return new Set(word?.cells ?? []);
};

export const Board = forwardRef<HTMLDivElement, BoardProps>(function Board(props, ref) {
  const { puzzle, letters, revealed, wrong, right, selected, direction, word, pulse, solved, onSelect } = props;
  const inWord = new Set(word?.cells ?? []);
  const pulsing = pulsedCells(puzzle, pulse);
  // Letters pop only once the grid is on screen: a resumed game or Reveal all does not pop every square at once.
  const [live, setLive] = useState(false);
  useEffect(() => { setLive(true); }, []);
  const classes = ["cw-grid", solved ? "is-solved" : "", live ? "is-live" : ""].filter(Boolean).join(" ");
  return <div className="cw-frame" style={{ "--cw-w": puzzle.width, "--cw-h": puzzle.height } as CSSProperties}>
    <div ref={ref} className={classes} role="group" aria-label="Crossword grid" data-pulse-parity={pulse.endsWith(":1") ? 1 : 0}
      style={{ gridTemplateColumns: `repeat(${puzzle.width}, var(--cw-square))` }}>
      {puzzle.cells.map((answer, cell) => {
        const row = Math.floor(cell / puzzle.width), col = cell % puzzle.width;
        if (answer === null) return <span key={cell} className="cw-block" aria-hidden="true" />;
        const states = [cell === selected ? "is-selected" : "", inWord.has(cell) ? "is-word" : "", wrong.has(cell) ? "is-wrong" : "",
          revealed.has(cell) ? "is-revealed" : "", right.has(cell) ? "is-right" : "", pulsing.has(cell) ? "is-pulse" : ""].filter(Boolean).join(" ");
        return <button key={cell} type="button" data-cell={cell} className={`cw-square ${states}`} tabIndex={cell === selected ? 0 : -1}
          data-direction={cell === selected && !solved ? direction : undefined} style={{ "--cw-i": row + col } as CSSProperties}
          aria-describedby={[wrong.has(cell) ? "cw-wrong-note" : "", revealed.has(cell) ? "cw-revealed-note" : ""].filter(Boolean).join(" ") || undefined}
          onClick={() => onSelect(cell)}>
          {puzzle.numbers[cell] > 0 && <span className="cw-number" aria-hidden="true">{puzzle.numbers[cell]}</span>}
          <span key={letters[cell]} className="cw-letter" translate="no">{letters[cell]}</span>
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
