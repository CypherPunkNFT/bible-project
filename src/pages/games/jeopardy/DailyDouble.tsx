// Bible Jeopardy's Daily Double (design 6.3, 9.6): first the moment (the audit's item 3), the stage flooded in the
// team's colour with "Daily Double!" zooming in, held for a second or until the host presses a key or taps; then the
// bet. The choosing team bets from 0 up to its score or 500, whichever is larger, with Half, All and 500 as quick
// buttons, then sees the clue. The box refuses anything outside the range. The bet form is in the page from the first
// render, under the splash, so nothing waits for the animation; the splash is only drawn over it.
import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/site-format";
import { motionMs } from "../kit";
import { TOP_VALUE } from "./model";
import { dailyDoubleMax, halfBet } from "./rules";
import { Score } from "./Scoreboard";

interface Props { team: string; teamIndex: number; score: number; onBet: (amount: number) => void; onBack: () => void }

/** How long the splash is held before the bet form shows on its own. */
export const SPLASH_MS = 1600;

export function DailyDouble({ team, teamIndex, score, onBet, onBack }: Props) {
  const max = dailyDoubleMax(score);
  const [text, setText] = useState("");
  const [splash, setSplash] = useState(() => motionMs(SPLASH_MS) > 0);
  useEffect(() => {
    if (!splash) return;
    const timer = window.setTimeout(() => setSplash(false), motionMs(SPLASH_MS));
    const onKey = () => setSplash(false);
    window.addEventListener("keydown", onKey);
    return () => { window.clearTimeout(timer); window.removeEventListener("keydown", onKey); };
  }, [splash]);
  const amount = Number(text);
  const valid = text.trim() !== "" && Number.isInteger(amount) && amount >= 0 && amount <= max;
  return <div className={`jp-daily-double jp-tone-${teamIndex}${splash ? " is-splash" : ""}`}>
    {splash && <div className="jp-dd-splash" aria-hidden onClick={() => setSplash(false)}>
      <span className="jp-dd-splash-word">Daily Double!</span>
      <span className="jp-dd-splash-team">{team}</span>
    </div>}
    <h2>Daily Double</h2>
    <p className="jp-dd-team"><span className="jp-dd-name">{team}</span> <span>(<Score value={score} />)</span></p>
    <form onSubmit={(event) => { event.preventDefault(); if (valid) onBet(amount); }}>
      <label htmlFor="jp-bet">{`Bet from 0 to ${formatNumber(max)}`}</label>
      <div className="jp-bet-row">
        <input id="jp-bet" type="number" inputMode="numeric" min={0} max={max} step={50} value={text} aria-invalid={text !== "" && !valid} onChange={(event) => setText(event.target.value)} />
        <button type="button" onClick={() => setText(String(halfBet(max)))}>Half</button>
        <button type="button" onClick={() => setText(String(max))}>All</button>
        <button type="button" onClick={() => setText(String(TOP_VALUE))}>500</button>
      </div>
      {text !== "" && !valid && <p className="jp-error" role="alert">{`A bet is a whole number from 0 to ${formatNumber(max)}.`}</p>}
      <div className="jp-dd-actions">
        <button type="button" className="jp-quiet" onClick={onBack}>Back to board</button>
        <button type="submit" className="jp-primary" disabled={!valid}>Show clue</button>
      </div>
    </form>
  </div>;
}
