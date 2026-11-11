// One printable sheet (design §1, §5 and §6): the puzzle or its answer key, drawn the same on screen and in the print
// portal. The puzzle's own words, clues and the title stay English (translate="no"): they are the English Bible's words
// in an English grid. The sheet's labels (Name, Across, Word bank, …) translate with the page.
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { CrossClue, Sheet } from "./make";
import type { Size } from "./settings";

interface SheetProps {
  sheet: Sheet;
  title: string;
  size: Size;
  /** Draw the answer key instead of the puzzle. */
  answers: boolean;
  /** On screen a clue's verse links to the reader; on paper it is plain text. */
  links: boolean;
  className?: string;
}

const byLetters = (a: string, b: string) => (a.toUpperCase() < b.toUpperCase() ? -1 : a.toUpperCase() > b.toUpperCase() ? 1 : 0);

export function PuzzleSheet({ sheet, title, size, answers, links, className = "" }: SheetProps) {
  const style = { "--pm-cols": sheet.width } as CSSProperties;
  return (
    <article className={`pm-sheet pm-${sheet.kind} pm-size-${size} ${answers ? "pm-answers" : ""} ${className}`} style={style}>
      <header className="pm-sheet-head">
        <p className="pm-sheet-kind">
          {sheet.kind === "search" ? (answers ? "Word search: answer key" : "Word search") : (answers ? "Crossword: answer key" : "Crossword")}
        </p>
        <h2 className="pm-sheet-title" translate="no">{title}</h2>
        {!answers && <p className="pm-fill"><span>Name</span><span className="pm-line" /><span>Date</span><span className="pm-line pm-line-short" /></p>}
      </header>
      {sheet.kind === "search" ? <SearchBody sheet={sheet} answers={answers} /> : <CrossBody sheet={sheet} answers={answers} links={links} />}
      <footer className="pm-sheet-foot">
        <span className="pm-site">Bible Guide</span>
        <span className="pm-site" translate="no">bibleguide.io</span>
        <span>Scripture quotations are from the Berean Standard Bible (public domain).</span>
      </footer>
    </article>
  );
}

function SearchBody({ sheet, answers }: { sheet: Extract<Sheet, { kind: "search" }>; answers: boolean }) {
  const hits = new Set(answers ? sheet.words.flatMap((word) => word.cells) : []);
  const rows = Array.from({ length: sheet.height }, (_, row) => sheet.grid.slice(row * sheet.width, (row + 1) * sheet.width));
  const words = sheet.words.map((word) => word.written).sort(byLetters);
  return <>
    <div className="pm-grid" role="table" aria-label="Word search grid" translate="no">
      {rows.map((letters, row) => (
        <div key={row} role="row" className="pm-grid-row">
          {letters.map((letter, col) => <span key={col} role="cell" className={hits.has(row * sheet.width + col) ? "pm-sq pm-hit" : "pm-sq"}>{letter}</span>)}
        </div>
      ))}
    </div>
    <section className="pm-list" aria-label="Words to find">
      <h3>Find these words</h3>
      <ul className="pm-words" translate="no">{words.map((word) => <li key={word}>{word}</li>)}</ul>
    </section>
  </>;
}

function CrossBody({ sheet, answers, links }: { sheet: Extract<Sheet, { kind: "cross" }>; answers: boolean; links: boolean }) {
  const rows = Array.from({ length: sheet.height }, (_, row) => row);
  const cols = Array.from({ length: sheet.width }, (_, col) => col);
  return <>
    <div className="pm-grid" role="table" aria-label="Crossword grid" translate="no">
      {rows.map((row) => (
        <div key={row} role="row" className="pm-grid-row">
          {cols.map((col) => {
            const i = row * sheet.width + col;
            const letter = sheet.cells[i];
            if (letter === null) return <span key={col} role="cell" className="pm-sq pm-void" />;
            return <span key={col} role="cell" className="pm-sq pm-box">
              {sheet.numbers[i] > 0 && <span className="pm-n">{sheet.numbers[i]}</span>}
              {answers && <span className="pm-letter">{letter}</span>}
            </span>;
          })}
        </div>
      ))}
    </div>
    <div className="pm-clues">
      <ClueList heading="Across" clues={sheet.clues.filter((clue) => clue.direction === "across")} answers={answers} links={links} />
      <ClueList heading="Down" clues={sheet.clues.filter((clue) => clue.direction === "down")} answers={answers} links={links} />
    </div>
    {sheet.bank.length > 0 && !answers && <section className="pm-bank" aria-label="Word bank">
      <h3>Word bank</h3>
      <ul className="pm-words" translate="no">{sheet.bank.map((word) => <li key={word}>{word}</li>)}</ul>
    </section>}
  </>;
}

function ClueList({ heading, clues, answers, links }: { heading: string; clues: CrossClue[]; answers: boolean; links: boolean }) {
  if (clues.length === 0) return null;
  return (
    <section className="pm-clue-list">
      <h3>{heading}</h3>
      <ol>
        {clues.map((clue) => (
          <li key={clue.number}>
            <span className="pm-clue-n">{clue.number}</span>
            <span className="pm-clue" translate="no">
              {clue.clue}{clue.enumeration && <> {clue.enumeration}</>}
              {answers && <> <b className="pm-answer">{clue.written}</b></>}
              {answers && links && clue.verse && <> <Link to={clue.verse.href} className="pm-verse">{clue.verse.label}</Link></>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
