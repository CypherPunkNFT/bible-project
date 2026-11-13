// Bible Wordle's start page, laid out like What came first?'s and the crossword's (owner, 2026-11-12: "make Wordle
// like What came first"): the game's drawing beside the title, one row of Normal and Hard with the gold button after
// them, and the player's figures under it. There is one word a day, so there are no category tiles. Nothing listens to
// the keyboard here: the puzzle's typing starts only once the board is open.
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDate, formatNumber } from "@/lib/site-format";
import { GAME_ART, GameArtImage } from "../art";
import type { Daily } from "./daily";
import { outcomeOf } from "./evaluate";
import { StatFigures } from "./Panels";
import { currentStreak, readRecord, setHard, startToday, writeRecord } from "./storage";

interface StartProps { n: number; answer: string; daily: Daily; onPlay: () => void }

export function Start({ n, answer, daily, onPlay }: StartProps) {
  const [saved, setSaved] = useState(() => { const read = readRecord(); return { ...read, record: startToday(read.record, n) }; });
  const { record } = saved;
  const guesses = record.today?.n === n ? record.today.guesses : [];
  const hard = record.today?.n === n ? record.today.hard : record.settings.hard;
  const outcome = outcomeOf(guesses, answer);
  const label = outcome !== "playing" ? "See today's result" : guesses.length > 0 ? "Carry on" : "Play";
  const chooseHard = (on: boolean) => {
    const fresh = readRecord();
    const next = setHard(startToday(fresh.available ? fresh.record : record, n), n, on);
    setSaved({ record: next, available: fresh.available && writeRecord(next) });
  };
  const percent = record.played ? Math.round((record.won / record.played) * 100) : 0;
  return <div className="bw-start">
    <Link className="bw-back" to="/games"><ArrowLeft size={18} aria-hidden="true" /><span className="bw-back-text">All games</span></Link>
    <div className="bw-start-head">
      <GameArtImage art={GAME_ART.wordle} className="bw-art" />
      <div>
        <h1>Bible Wordle</h1>
        <p className="bw-lede">Guess the day's five-letter Bible word in six tries. A new word every day.</p>
        <p className="bw-start-date">{`#${formatNumber(n)} · ${formatDate(daily.dateOf(n), { weekday: "long", day: "numeric", month: "long" })}`}</p>
      </div>
    </div>
    <div className="bw-start-row">
      <fieldset className="bw-chips">
        <legend>How hard</legend>
        <button type="button" aria-pressed={!hard} disabled={guesses.length > 0} onClick={() => chooseHard(false)}>Normal</button>
        <button type="button" aria-pressed={hard} disabled={guesses.length > 0} onClick={() => chooseHard(true)}>Hard</button>
      </fieldset>
      <button type="button" className="bw-button bw-primary bw-start-play" onClick={onPlay}>{label}</button>
    </div>
    <p className="bw-start-note">{guesses.length > 0
      ? "Hard mode can only be changed before today's first guess."
      : "Hard: letters you have found must be used in every later guess."}</p>
    {record.played > 0 && <StatFigures record={record} percent={percent} streak={currentStreak(record, n)} />}
  </div>;
}
