// Bible Wordle's start page, laid out like What came first?'s and the crossword's (owner, 2026-11-12): the game's
// drawing beside the title; the kinds of word as cards like Memory card match's (owner, 2026-11-13), Mixed being the
// day's word for everyone; one row of Normal and Hard with the gold button after them; the chosen kind's figures under
// it. Nothing listens to the keyboard here: typing starts only once the board is open.
import { ArrowLeft } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { GAME_ART, GameArtImage } from "../art";
import { outcomeOf } from "./evaluate";
import { KindArt } from "./KindArt";
import { KINDS, kindInfo, type Kind } from "./kinds";
import { StatFigures } from "./Panels";
import { currentStreak, readRecord, setHard, startToday, writeRecord, type WordleRecord } from "./storage";

interface StartProps {
  kind: Kind;
  onKind: (kind: Kind) => void;
  /** The chosen kind's record (storage.ts). */
  storageKey: string;
  /** "#7 · Friday, 13 November": today's puzzle, shown for Mixed. */
  dayLine: string;
  /** The puzzle number the chosen kind is on, from its record. */
  numberFor: (record: WordleRecord) => number;
  wordAt: (n: number) => string;
  onPlay: (n: number) => void;
}

export function Start({ kind, onKind, storageKey, dayLine, numberFor, wordAt, onPlay }: StartProps) {
  const [, setChanged] = useState(0); // bumped after Hard is chosen, so the page draws again from the saved record
  const record = readRecord(storageKey).record;
  const n = numberFor(record);
  const today = record.today?.n === n ? record.today : null;
  const guesses = today?.guesses ?? [];
  const hard = today?.hard ?? record.settings.hard;
  const done = guesses.length > 0 && outcomeOf(guesses, wordAt(n)) !== "playing";
  const label = done ? "See today's result" : guesses.length > 0 ? "Carry on" : "Play";
  const chooseHard = (on: boolean) => {
    const fresh = readRecord(storageKey);
    writeRecord(setHard(startToday(fresh.record, n), n, on), storageKey);
    setChanged((count) => count + 1);
  };
  const percent = record.played ? Math.round((record.won / record.played) * 100) : 0;
  return <div className="bw-start">
    <Link className="bw-back" to="/games"><ArrowLeft size={18} aria-hidden="true" /><span className="bw-back-text">All games</span></Link>
    <div className="bw-start-head">
      <GameArtImage art={GAME_ART.wordle} className="bw-art" />
      <div>
        <h1>Bible Wordle</h1>
        <p className="bw-lede">Guess the five-letter Bible word in six tries.</p>
        <p className="bw-start-date">{kind === "mixed" ? dayLine : `${kindInfo(kind).label} · ${n}`}</p>
      </div>
    </div>
    <div className="bw-kinds" role="group" aria-label="What to play">
      {KINDS.map((item) => <button key={item.key} type="button" className="bw-kind" aria-pressed={item.key === kind}
        style={{ "--bw-tone": `var(--${item.tone})` } as CSSProperties} onClick={() => onKind(item.key)}>
        <KindArt kind={item.key} />
        <span className="bw-kind-name">{item.label}</span>
        <span className="bw-kind-note" aria-hidden="true">{item.note}</span>
      </button>)}
    </div>
    <div className="bw-start-row">
      <fieldset className="bw-chips">
        <legend>How hard</legend>
        <button type="button" aria-pressed={!hard} disabled={guesses.length > 0} onClick={() => chooseHard(false)}>Normal</button>
        <button type="button" aria-pressed={hard} disabled={guesses.length > 0} onClick={() => chooseHard(true)}>Hard</button>
      </fieldset>
      <button type="button" className="bw-button bw-primary bw-start-play" onClick={() => onPlay(n)}>{label}</button>
    </div>
    <p className="bw-start-note">{guesses.length > 0 && !done
      ? "Hard mode can only be changed before this word's first guess."
      : "Hard: letters you have found must be used in every later guess."}</p>
    {record.played > 0 && <StatFigures record={record} percent={percent} streak={currentStreak(record, n)} />}
  </div>;
}
