// Bible crossword: the clue bar above the keys, the Across and Down lists, and the ending once solved (design §1, §4).
// Clues and answers are English in every language (design §4): they come from clues.json, not the page code.
// The redesign (docs/visual-audits/crossword-redesign.md): the bar carries ‹ › arrows and the word's letters so far,
// a filled word gets a mark in the list and a confirmed one a gold tick, and the ending is the kit's result panel
// with the time, the word count, a star for a clean solve and one confetti burst.
import { Award, Check, ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { formatNumber, plural } from "@/lib/site-format";
import { Confetti, ResultPanel } from "../kit";
import { clock, isConfirmed, isFilled, personHref, verseHref, verseLabel, type CluesFile, type Puzzle, type PuzzleWord } from "./game";
import type { PlayState } from "./storage";

const clueName = (word: PuzzleWord) => (word.direction === "across" ? `${word.number} Across` : `${word.number} Down`);

interface BarProps { word: PuzzleWord | null; letters: readonly string[]; selected: number; onStep: (back: boolean) => void }

/** The current clue with its number, length, the letters typed so far, and arrows to the previous and next clue. */
export function ClueBar({ word, letters, selected, onStep }: BarProps) {
  if (!word) return null;
  return <div className="cw-bar">
    <button type="button" className="cw-bar-step" onClick={() => onStep(true)} aria-label="Previous clue"><ChevronLeft size={20} aria-hidden="true" /></button>
    <p className="cw-bar-body" aria-live="polite">
      <span className="cw-bar-name">{clueName(word)}</span>
      <span className="cw-bar-clue" translate="no">{word.entry.c}</span>
      <span className="cw-bar-length">{`(${word.cells.length})`}</span>
      <span className="cw-bar-strip" aria-hidden="true" translate="no">
        {word.cells.map((cell) => <span key={cell} className={cell === selected ? "is-at" : undefined}>{letters[cell] || "·"}</span>)}
      </span>
    </p>
    <button type="button" className="cw-bar-step" onClick={() => onStep(false)} aria-label="Next clue"><ChevronRight size={20} aria-hidden="true" /></button>
  </div>;
}

interface ListsProps {
  puzzle: Puzzle; letters: readonly string[]; right: ReadonlySet<number>; revealed: ReadonlySet<number>;
  word: PuzzleWord | null; onPick: (word: PuzzleWord) => void;
}

function ClueList({ words, letters, right, revealed, word, onPick }: Omit<ListsProps, "puzzle"> & { words: PuzzleWord[] }) {
  return <ol className="cw-list">
    {words.map((w) => {
      const done = isFilled(w, letters);
      const confirmed = done && isConfirmed(w, right, revealed);
      const crossing = word && w !== word && w.cells.some((cell) => word.cells.includes(cell));
      const classes = [w === word ? "is-current" : "", crossing ? "is-crossing" : "", done ? "is-done" : "", confirmed ? "is-confirmed" : ""].filter(Boolean).join(" ");
      return <li key={`${w.number}-${w.direction}`}>
        <button type="button" className={classes || undefined} aria-current={w === word ? "true" : undefined} onClick={() => onPick(w)}>
          <span className="cw-list-number">{w.number}</span>
          <span className="cw-list-clue"><span translate="no">{w.entry.c}</span> <span className="cw-list-length">{`(${w.cells.length})`}</span></span>
          <span className="cw-list-mark" aria-hidden="true">{confirmed && <Check size={14} />}</span>
          {confirmed && <span className="sr-only">Confirmed</span>}
        </button>
      </li>;
    })}
  </ol>;
}

export function ClueLists(props: ListsProps) {
  const { puzzle } = props;
  return <div className="cw-lists">
    <section aria-labelledby="cw-across">
      <h2 id="cw-across">Across</h2>
      <ClueList {...props} words={puzzle.words.filter((w) => w.direction === "across")} />
    </section>
    <section aria-labelledby="cw-down">
      <h2 id="cw-down">Down</h2>
      <ClueList {...props} words={puzzle.words.filter((w) => w.direction === "down")} />
    </section>
  </div>;
}

interface SolvedProps {
  data: CluesFile; puzzle: Puzzle; game: PlayState; newBest: boolean;
  onNew: () => void; onChoices: () => void; onPeek: (word: PuzzleWord | null) => void;
}

/** Where a clue came from: the verse in the reader, or the person's page. */
function Source({ data, word }: { data: CluesFile; word: PuzzleWord }) {
  const { entry } = word;
  return <span className="cw-source">
    {entry.r !== null && <Link to={verseHref(data, entry.r)}>{verseLabel(data, entry.r)}</Link>}
    {entry.p && <Link to={personHref(entry.p)}>Person page</Link>}
  </span>;
}

export function SolvedPanel({ data, puzzle, game, newBest, onNew, onChoices, onPeek }: SolvedProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const help = game.revealed.length + game.checks;
  const clean = help === 0;
  const stats = clean
    ? <span>Every letter yours, with no checks and nothing revealed.</span>
    : <><span>{plural(game.revealed.length, "{n} letter revealed.", "{n} letters revealed.")}</span>{" "}<span>{plural(game.checks, "{n} check used.", "{n} checks used.")}</span></>;
  return <ResultPanel className="cw-solved"
    actions={<>
      <button type="button" className="cw-primary" onClick={onNew}><Shuffle size={15} aria-hidden="true" />New puzzle</button>
      <button type="button" className="cw-secondary" onClick={onChoices}><RotateCcw size={15} aria-hidden="true" />Change puzzle</button>
    </>}
    reading={<>
      <h3>The answers</h3>
      <ol className="cw-answers">
        {puzzle.words.map((word) => <li key={`${word.number}-${word.direction}`} onMouseEnter={() => onPeek(word)} onMouseLeave={() => onPeek(null)}
          onFocus={() => onPeek(word)} onBlur={() => onPeek(null)}>
          <span className="cw-answer-name">{clueName(word)}</span>
          <strong translate="no">{word.entry.w}</strong>
          <span className="cw-answer-clue" translate="no">{word.entry.c}</span>
          <Source data={data} word={word} />
        </li>)}
      </ol>
    </>}>
    <div className="cw-solved-head">
      <Confetti when count={28} reach={140} />
      {clean && <Award className="cw-solved-star" size={34} aria-hidden="true" />}
      <h2 id="cw-solved-heading" ref={heading} tabIndex={-1}>Solved!</h2>
    </div>
    <dl className="cw-solved-figures">
      {game.seconds !== null && <div><dt>Time</dt><dd translate="no">{clock(game.seconds)}</dd></div>}
      <div><dt>Words</dt><dd>{formatNumber(puzzle.words.length)}</dd></div>
      {newBest && <div className="is-best"><dt>Best time</dt><dd>New best</dd></div>}
    </dl>
    <p className="cw-solved-stats">{stats}</p>
  </ResultPanel>;
}
