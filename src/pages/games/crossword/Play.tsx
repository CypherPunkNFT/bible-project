// Bible crossword: one puzzle in play (design §1, §4, §8): the current clue, the grid, the keys, Check and Reveal, the
// clue lists, and the answers once it is solved. Every change is handed up to be saved in the browser.
import { Eye, ListChecks, RotateCcw, Shuffle, Eraser } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Direction } from "@/lib/puzzles";
import { activeWord, isSolved, letterSquares, stepFrom, wordAt, wrongIn, type CluesFile, type Puzzle, type PuzzleWord } from "./game";
import { Board, Keyboard } from "./Board";
import { ClueBar, ClueLists, SolvedPanel } from "./Clues";
import type { PlayState } from "./storage";

interface PlayProps {
  data: CluesFile;
  game: PlayState;
  puzzle: Puzzle;
  onChange: (game: PlayState) => void;
  onNew: () => void;
  onChoices: () => void;
}

/** Keys typed into a form elsewhere on the page (the site's correction form) are not letters for the grid. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || !!target.closest("input, textarea, select"));

const other = (direction: Direction): Direction => (direction === "across" ? "down" : "across");

export function Play({ data, game, puzzle, onChange, onNew, onChoices }: PlayProps) {
  const [selected, setSelected] = useState(() => puzzle.words[0].cells[0]);
  const [direction, setDirection] = useState<Direction>(() => puzzle.words[0].direction);
  const [confirmReveal, setConfirmReveal] = useState(false);
  const grid = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  const word = activeWord(puzzle, selected, direction);
  const revealed = useMemo(() => new Set(game.revealed), [game.revealed]);
  const wrong = useMemo(() => new Set(game.wrong), [game.wrong]);
  const solved = isSolved(puzzle, game.letters);

  const select = useCallback((cell: number, wanted: Direction) => {
    moved.current = true;
    setSelected(cell);
    setDirection(wordAt(puzzle, cell, wanted) ? wanted : other(wanted));
  }, [puzzle]);

  // Keep the selected square focused and in view after a move (not on first opening, which would scroll the page).
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const square = grid.current?.querySelector<HTMLButtonElement>(`[data-cell="${selected}"]`);
    square?.focus({ preventScroll: true });
    square?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [selected, direction]);

  const goToWord = useCallback((target: PuzzleWord) => {
    select(target.cells.find((cell) => game.letters[cell] === "") ?? target.cells[0], target.direction);
  }, [game.letters, select]);

  const tapSquare = useCallback((cell: number) => {
    if (cell === selected && wordAt(puzzle, cell, other(direction))) select(cell, other(direction));
    else select(cell, direction);
  }, [selected, direction, puzzle, select]);

  const typeKey = useCallback((key: string) => {
    if (solved || !word) return;
    const at = word.cells.indexOf(selected);
    const letters = [...game.letters];
    const without = (list: number[], cell: number) => list.filter((n) => n !== cell);
    if (key === "Backspace") {
      let cell = selected;
      if (letters[cell] === "" || revealed.has(cell)) cell = word.cells[Math.max(0, at - 1)];
      if (!revealed.has(cell)) letters[cell] = "";
      onChange({ ...game, letters, wrong: without(game.wrong, cell) });
      select(cell, word.direction);
      return;
    }
    if (!revealed.has(selected)) letters[selected] = key;
    onChange({ ...game, letters, wrong: without(game.wrong, selected) });
    select(word.cells[Math.min(word.cells.length - 1, at + 1)], word.direction);
  }, [solved, word, selected, game, revealed, onChange, select]);

  const nextWord = useCallback((back: boolean): boolean => {
    const at = word ? puzzle.words.indexOf(word) : -1;
    const target = puzzle.words[at + (back ? -1 : 1)];
    if (!target) return false;
    goToWord(target);
    return true;
  }, [word, puzzle, goToWord]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return;
      const inGrid = event.target instanceof Node && !!grid.current?.contains(event.target);
      if (/^[a-z]$/i.test(event.key) || (event.key === "Backspace" && inGrid)) {
        event.preventDefault();
        typeKey(event.key === "Backspace" ? "Backspace" : event.key.toUpperCase());
        return;
      }
      if (!inGrid) return;
      const arrows: Record<string, [number, number, Direction]> = {
        ArrowLeft: [0, -1, "across"], ArrowRight: [0, 1, "across"], ArrowUp: [-1, 0, "down"], ArrowDown: [1, 0, "down"],
      };
      if (event.key in arrows) {
        event.preventDefault();
        const [dRow, dCol, along] = arrows[event.key];
        if (along !== direction && wordAt(puzzle, selected, along)) select(selected, along);
        else select(stepFrom(puzzle, selected, dRow, dCol), direction);
      } else if (event.key === " ") {
        event.preventDefault();
        tapSquare(selected);
      } else if (event.key === "Tab" || event.key === "Enter") {
        if (nextWord(event.shiftKey)) event.preventDefault(); // Tab past the last clue leaves the grid
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [typeKey, direction, puzzle, selected, select, tapSquare, nextWord]);

  const check = (squares: number[]) => {
    onChange({ ...game, wrong: [...new Set([...game.wrong, ...wrongIn(puzzle, game.letters, squares)])], checks: game.checks + 1 });
  };
  const reveal = (squares: number[]) => {
    const letters = [...game.letters];
    const shown = squares.filter((cell) => letters[cell] !== puzzle.cells[cell]);
    for (const cell of shown) letters[cell] = puzzle.cells[cell]!;
    onChange({ ...game, letters, revealed: [...new Set([...game.revealed, ...shown])], wrong: game.wrong.filter((cell) => !squares.includes(cell)) });
    setConfirmReveal(false);
  };
  const clear = () => onChange({ ...game, letters: game.letters.map((l, cell) => (revealed.has(cell) ? l : "")), wrong: [] });
  const all = letterSquares(puzzle);

  return <div className="cw-play">
    <div className="cw-board-side">
      {!solved && <ClueBar word={word} />}
      <Board ref={grid} puzzle={puzzle} letters={game.letters} revealed={revealed} wrong={wrong} selected={selected}
        word={solved ? null : word} solved={solved} onSelect={tapSquare} />
      {!solved && <>
        <Keyboard onKey={typeKey} />
        <div className="cw-tools">
          <fieldset className="cw-tool-group">
            <legend><ListChecks size={14} aria-hidden="true" />Check</legend>
            <button type="button" onClick={() => check([selected])}>Letter</button>
            <button type="button" onClick={() => word && check(word.cells)}>Word</button>
            <button type="button" onClick={() => check(all)}>Puzzle</button>
          </fieldset>
          <fieldset className="cw-tool-group">
            <legend><Eye size={14} aria-hidden="true" />Reveal</legend>
            <button type="button" onClick={() => reveal([selected])}>Letter</button>
            <button type="button" onClick={() => word && reveal(word.cells)}>Word</button>
            {confirmReveal
              ? <button type="button" className="is-confirm" onClick={() => reveal(all)}>Yes, reveal all</button>
              : <button type="button" onClick={() => setConfirmReveal(true)}>Puzzle</button>}
          </fieldset>
          <div className="cw-tool-row">
            <button type="button" onClick={clear}><Eraser size={14} aria-hidden="true" />Clear</button>
            <button type="button" onClick={onNew}><Shuffle size={14} aria-hidden="true" />New puzzle</button>
            <button type="button" onClick={onChoices}><RotateCcw size={14} aria-hidden="true" />Change puzzle</button>
          </div>
        </div>
      </>}
    </div>
    <div className="cw-clue-side">
      {solved
        ? <SolvedPanel data={data} puzzle={puzzle} game={game} onNew={onNew} onChoices={onChoices} />
        : <ClueLists puzzle={puzzle} letters={game.letters} word={word} onPick={goToWord} />}
    </div>
    <p className="sr-only" aria-live="polite">{solved ? "Solved! Every answer is right." : ""}</p>
  </div>;
}
