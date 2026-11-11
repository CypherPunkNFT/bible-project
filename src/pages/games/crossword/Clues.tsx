// Bible crossword: the clue above the grid, the Across and Down lists, and the answers once solved (design §1, §4).
// Clues and answers are English in every language (design §4): they come from clues.json, not the page code.
import { RotateCcw, Shuffle } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { plural } from "@/lib/site-format";
import { personHref, verseHref, verseLabel, type CluesFile, type Puzzle, type PuzzleWord } from "./game";
import type { PlayState } from "./storage";

const clueName = (word: PuzzleWord) => (word.direction === "across" ? `${word.number} Across` : `${word.number} Down`);

export function ClueBar({ word }: { word: PuzzleWord | null }) {
  if (!word) return null;
  return <p className="cw-bar" aria-live="polite">
    <span className="cw-bar-name">{clueName(word)}</span>
    <span className="cw-bar-clue" translate="no">{word.entry.c}</span>
    <span className="cw-bar-length">{`(${word.cells.length})`}</span>
  </p>;
}

interface ListsProps { puzzle: Puzzle; letters: readonly string[]; word: PuzzleWord | null; onPick: (word: PuzzleWord) => void }

function ClueList({ words, letters, word, onPick }: Omit<ListsProps, "puzzle"> & { words: PuzzleWord[] }) {
  return <ol className="cw-list">
    {words.map((w) => {
      const done = w.cells.every((cell) => letters[cell] !== "");
      const crossing = word && w !== word && w.cells.some((cell) => word.cells.includes(cell));
      return <li key={`${w.number}-${w.direction}`}>
        <button type="button" className={[w === word ? "is-current" : "", crossing ? "is-crossing" : "", done ? "is-done" : ""].filter(Boolean).join(" ") || undefined}
          aria-current={w === word ? "true" : undefined} onClick={() => onPick(w)}>
          <span className="cw-list-number">{w.number}</span>
          <span className="cw-list-clue"><span translate="no">{w.entry.c}</span> <span className="cw-list-length">{`(${w.cells.length})`}</span></span>
        </button>
      </li>;
    })}
  </ol>;
}

export function ClueLists({ puzzle, letters, word, onPick }: ListsProps) {
  return <div className="cw-lists">
    <section aria-labelledby="cw-across">
      <h2 id="cw-across">Across</h2>
      <ClueList words={puzzle.words.filter((w) => w.direction === "across")} letters={letters} word={word} onPick={onPick} />
    </section>
    <section aria-labelledby="cw-down">
      <h2 id="cw-down">Down</h2>
      <ClueList words={puzzle.words.filter((w) => w.direction === "down")} letters={letters} word={word} onPick={onPick} />
    </section>
  </div>;
}

interface SolvedProps { data: CluesFile; puzzle: Puzzle; game: PlayState; onNew: () => void; onChoices: () => void }

/** Where a clue came from: the verse in the reader, or the person's page. */
function Source({ data, word }: { data: CluesFile; word: PuzzleWord }) {
  const { entry } = word;
  return <span className="cw-source">
    {entry.r !== null && <Link to={verseHref(data, entry.r)}>{verseLabel(data, entry.r)}</Link>}
    {entry.p && <Link to={personHref(entry.p)}>Person page</Link>}
  </span>;
}

export function SolvedPanel({ data, puzzle, game, onNew, onChoices }: SolvedProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const help = game.revealed.length + game.checks;
  return <section className="cw-solved" aria-labelledby="cw-solved-heading">
    <h2 id="cw-solved-heading" ref={heading} tabIndex={-1}>Solved!</h2>
    <p className="cw-solved-stats">
      {help === 0 ? <span>Every letter yours, with no checks and nothing revealed.</span> : <>
        <span>{plural(game.revealed.length, "{n} letter revealed.", "{n} letters revealed.")}</span>{" "}
        <span>{plural(game.checks, "{n} check used.", "{n} checks used.")}</span>
      </>}
    </p>
    <div className="cw-solved-actions">
      <button type="button" className="cw-primary" onClick={onNew}><Shuffle size={15} aria-hidden="true" />New puzzle</button>
      <button type="button" className="cw-secondary" onClick={onChoices}><RotateCcw size={15} aria-hidden="true" />Change puzzle</button>
    </div>
    <h3>The answers</h3>
    <ol className="cw-answers">
      {puzzle.words.map((word) => <li key={`${word.number}-${word.direction}`}>
        <span className="cw-answer-name">{clueName(word)}</span>
        <strong translate="no">{word.entry.w}</strong>
        <span className="cw-answer-clue" translate="no">{word.entry.c}</span>
        <Source data={data} word={word} />
      </li>)}
    </ol>
  </section>;
}
