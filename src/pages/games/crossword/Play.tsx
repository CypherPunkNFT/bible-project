// Bible crossword: one puzzle in play (design §1, §4, §8): the progress line, the grid, the clue bar, the keys, Check
// and Reveal, the clue lists, and the ending once it is solved. Every change is handed up to be saved in the browser.
// The redesign (docs/visual-audits/crossword-redesign.md): on a phone the grid sits at the top and the clue bar, the
// keys and the tools are pinned to the bottom with the lists in a sheet; the frame pans to the selected word and the
// page itself never scrolls; the clock runs while the tab is visible; menus and dialogs keep the grid's keys quiet.
import { Eraser, Eye, List, ListChecks, MoreHorizontal, RotateCcw, Shuffle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Direction } from "@/lib/puzzles";
import { plural } from "@/lib/site-format";
import { ConfirmDialog, ProgressTrail, useScrollTopOn, type TrailMark } from "../kit";
import { activeWord, applyLetters, clock, isFilled, isSolved, letterSquares, stepFrom, wordAt, wrongIn, type CluesFile, type Puzzle, type PuzzleWord } from "./game";
import { Board, Keyboard } from "./Board";
import { ClueBar, ClueLists, SolvedPanel } from "./Clues";
import { useDockHeight, useElapsed, useNarrow } from "./hooks";
import type { PlayState } from "./storage";
import { ClueSheet, ToolMenu } from "./Tools";

interface PlayProps {
  data: CluesFile;
  game: PlayState;
  puzzle: Puzzle;
  newBest: boolean;
  onChange: (game: PlayState) => void;
  onNew: () => void;
  onChoices: () => void;
}

type Confirm = "reveal" | null;

/** Keys typed into a form elsewhere on the page (the site's correction form) are not letters for the grid. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || !!target.closest("input, textarea, select"));

const other = (direction: Direction): Direction => (direction === "across" ? "down" : "across");
const wordKey = (word: PuzzleWord) => `${word.number}-${word.direction}`;

/** Scrolls the grid's frame, and only the frame, until the square is in view with a little room around it. */
function panTo(frame: HTMLElement | null, square: HTMLElement | null): void {
  if (!frame || !square) return;
  const room = 12;
  const left = square.offsetLeft, top = square.offsetTop, right = left + square.offsetWidth, bottom = top + square.offsetHeight;
  if (left - room < frame.scrollLeft) frame.scrollLeft = Math.max(0, left - room);
  else if (right + room > frame.scrollLeft + frame.clientWidth) frame.scrollLeft = right + room - frame.clientWidth;
  if (top - room < frame.scrollTop) frame.scrollTop = Math.max(0, top - room);
  else if (bottom + room > frame.scrollTop + frame.clientHeight) frame.scrollTop = bottom + room - frame.clientHeight;
}

export function Play({ data, game, puzzle, newBest, onChange, onNew, onChoices }: PlayProps) {
  const [selected, setSelected] = useState(() => puzzle.words[0].cells[0]);
  const [direction, setDirection] = useState<Direction>(() => puzzle.words[0].direction);
  const [pulse, setPulse] = useState("");
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [sheet, setSheet] = useState(false);
  const [menus, setMenus] = useState(0);
  const [peek, setPeek] = useState<PuzzleWord | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  const latest = useRef(game);
  latest.current = game;
  const narrow = useNarrow();
  const word = activeWord(puzzle, selected, direction);
  const revealed = useMemo(() => new Set(game.revealed), [game.revealed]);
  const wrong = useMemo(() => new Set(game.wrong), [game.wrong]);
  const right = useMemo(() => new Set(game.right), [game.right]);
  const solved = isSolved(puzzle, game.letters);
  const timed = game.seconds !== null; // a save from before the clock existed is never timed
  const { seconds, read } = useElapsed(game.seconds ?? 0, timed && !solved);
  const quiet = confirm !== null || sheet || menus > 0;
  useDockHeight(root, dock, narrow && !solved);
  useScrollTopOn(solved); // the moment it is solved the page shows the wave from the top

  /** Every change carries the clock with it, so a reload mid-puzzle keeps the time. */
  const change = useCallback((next: PlayState) => onChange(timed ? { ...next, seconds: read() } : next), [onChange, timed, read]);

  // Leaving the page (or hiding the tab) saves the time spent so far; nothing else about the game changes.
  useEffect(() => {
    if (!timed || solved) return;
    const flush = () => onChange({ ...latest.current, seconds: read() });
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => { window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", onHide); };
  }, [timed, solved, onChange, read]);

  const select = useCallback((cell: number, wanted: Direction) => {
    moved.current = true;
    setSelected(cell);
    setDirection(wordAt(puzzle, cell, wanted) ? wanted : other(wanted));
  }, [puzzle]);

  // On opening, pan the frame to the first word (a wide grid may start off to the right); no focus, so the page stays put.
  useEffect(() => {
    panTo(grid.current?.parentElement ?? null, grid.current?.querySelector<HTMLButtonElement>(".cw-square.is-selected") ?? null);
  }, []);

  // Keep the selected square focused and in view after a move, panning the frame and never the page.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const square = grid.current?.querySelector<HTMLButtonElement>(`[data-cell="${selected}"]`) ?? null;
    panTo(grid.current?.parentElement ?? null, square);
    square?.focus({ preventScroll: true });
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
    if (key === "Backspace") {
      let cell = selected;
      if (letters[cell] === "" || revealed.has(cell)) cell = word.cells[Math.max(0, at - 1)];
      if (!revealed.has(cell)) letters[cell] = "";
      change(applyLetters(game, letters));
      select(cell, word.direction);
      return;
    }
    if (!revealed.has(selected)) letters[selected] = key;
    if (!isFilled(word, game.letters) && isFilled(word, letters)) setPulse((was) => `${wordKey(word)}:${was.endsWith(":1") ? 0 : 1}`);
    change(applyLetters(game, letters));
    select(word.cells[Math.min(word.cells.length - 1, at + 1)], word.direction);
  }, [solved, word, selected, game, revealed, change, select]);

  const nextWord = useCallback((back: boolean): boolean => {
    const at = word ? puzzle.words.indexOf(word) : -1;
    const target = puzzle.words[at + (back ? -1 : 1)];
    if (!target) return false;
    goToWord(target);
    return true;
  }, [word, puzzle, goToWord]);

  const stepWord = useCallback((back: boolean) => {
    if (nextWord(back)) return;
    goToWord(puzzle.words[back ? puzzle.words.length - 1 : 0]); // the arrows wrap round
  }, [nextWord, goToWord, puzzle]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (quiet || solved || event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return;
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
  }, [quiet, solved, typeKey, direction, puzzle, selected, select, tapSquare, nextWord]);

  const all = letterSquares(puzzle);
  const check = (squares: number[]) => {
    const bad = wrongIn(puzzle, game.letters, squares);
    const good = squares.filter((cell) => game.letters[cell] !== "" && !bad.includes(cell));
    change({ ...game, wrong: [...new Set([...game.wrong, ...bad])], right: [...new Set([...game.right, ...good])], checks: game.checks + 1 });
  };
  const reveal = (squares: number[]) => {
    const letters = [...game.letters];
    const shown = squares.filter((cell) => letters[cell] !== puzzle.cells[cell]);
    for (const cell of shown) letters[cell] = puzzle.cells[cell]!;
    change({ ...applyLetters(game, letters), revealed: [...new Set([...game.revealed, ...shown])], wrong: game.wrong.filter((cell) => !squares.includes(cell)) });
  };
  const clear = () => change(applyLetters(game, game.letters.map((l, cell) => (revealed.has(cell) ? l : ""))));
  // Leaving loses nothing: an unfinished puzzle is put aside under "Carry on" (CrosswordGame.tsx), so no question first.
  const leave = (what: "new" | "change") => (what === "new" ? onNew() : onChoices());
  const pickFromSheet = (target: PuzzleWord) => { setSheet(false); goToWord(target); };
  const closeConfirm = () => { setConfirm(null); moved.current = true; setSelected((cell) => cell); };
  const onConfirm = () => {
    const what = confirm;
    setConfirm(null);
    if (what === "reveal") reveal(all);
  };
  const menuChange = (open: boolean) => setMenus((n) => Math.max(0, n + (open ? 1 : -1)));

  const filled = puzzle.words.filter((w) => isFilled(w, game.letters)).length;
  const marks: TrailMark[] = puzzle.words.map((w) => (isFilled(w, game.letters) ? "right" : w === word && !solved ? "current" : "empty"));
  const tones = puzzle.words.map(() => "var(--cw-color)");

  const checkMenu = <ToolMenu name="Check" icon={<ListChecks size={14} aria-hidden="true" />} onOpenChange={menuChange}
    items={[{ label: "Letter", onPick: () => check([selected]) }, { label: "Word", onPick: () => word && check(word.cells) }, { label: "Puzzle", onPick: () => check(all) }]} />;
  const revealMenu = <ToolMenu name="Reveal" icon={<Eye size={14} aria-hidden="true" />} onOpenChange={menuChange}
    items={[{ label: "Letter", onPick: () => reveal([selected]) }, { label: "Word", onPick: () => word && reveal(word.cells) }, { label: "Puzzle", onPick: () => setConfirm("reveal"), danger: true }]} />;
  const restItems = [
    { label: <><Eraser size={14} aria-hidden="true" />Clear</>, onPick: clear },
    { label: <><Shuffle size={14} aria-hidden="true" />New puzzle</>, onPick: () => leave("new") },
    { label: <><RotateCcw size={14} aria-hidden="true" />Change puzzle</>, onPick: () => leave("change") },
  ];
  const bar = <ClueBar word={word} letters={game.letters} selected={selected} onStep={stepWord} />;
  const lists = <ClueLists puzzle={puzzle} letters={game.letters} right={right} revealed={revealed} word={word} onPick={narrow ? pickFromSheet : goToWord} />;

  return <div ref={root} className={`cw-play${narrow ? " is-narrow" : ""}${solved ? " is-solved" : ""}`}>
    <div className="cw-board-side">
      <div className="cw-topline">
        <ProgressTrail marks={marks} tones={tones} shape="dots" size=".55rem" label={plural(filled, "{n} word filled", "{n} words filled")} />
        <span className="cw-count" aria-hidden="true">{`${filled} / ${puzzle.words.length}`}</span>
        {timed && !solved && <span className="cw-clock" translate="no" aria-label={plural(seconds, "{n} second", "{n} seconds")}>{clock(seconds)}</span>}
      </div>
      {!solved && !narrow && bar}
      <Board ref={grid} puzzle={puzzle} letters={game.letters} revealed={revealed} wrong={wrong} right={right} selected={selected} direction={direction}
        word={solved ? peek : word} pulse={pulse} solved={solved} onSelect={tapSquare} />
      {!solved && !narrow && <>
        <div className="cw-tools">
          {checkMenu}{revealMenu}
          <button type="button" className="cw-tool" onClick={clear}><Eraser size={14} aria-hidden="true" />Clear</button>
          <button type="button" className="cw-tool" onClick={() => leave("new")}><Shuffle size={14} aria-hidden="true" />New puzzle</button>
          <button type="button" className="cw-tool" onClick={() => leave("change")}><RotateCcw size={14} aria-hidden="true" />Change puzzle</button>
        </div>
        <Keyboard onKey={typeKey} />
      </>}
      {!solved && narrow && <div ref={dock} className="cw-dock">
        {bar}
        <Keyboard onKey={typeKey} />
        <div className="cw-tools">
          <button type="button" className="cw-tool" onClick={() => setSheet(true)}><List size={14} aria-hidden="true" />Clues</button>
          {checkMenu}{revealMenu}
          <ToolMenu name="More" icon={<MoreHorizontal size={14} aria-hidden="true" />} onOpenChange={menuChange} items={restItems} className="cw-menu-more" />
        </div>
      </div>}
    </div>
    <div className="cw-clue-side">
      {solved
        ? <SolvedPanel data={data} puzzle={puzzle} game={game} newBest={newBest} onNew={onNew} onChoices={onChoices} onPeek={setPeek} />
        : !narrow && lists}
    </div>
    {narrow && !solved && <ClueSheet open={sheet} title="Clues" onClose={() => setSheet(false)}>{lists}</ClueSheet>}
    <ConfirmDialog open={confirm !== null} danger onCancel={closeConfirm} onConfirm={onConfirm}
      title="Reveal the whole puzzle?" confirmLabel="Yes, reveal all">
      <p className="cw-dialog-note">Every answer will be filled in and the puzzle counts as revealed.</p>
    </ConfirmDialog>
    <p className="sr-only" aria-live="polite">{solved ? "Solved! Every answer is right." : ""}</p>
  </div>;
}
