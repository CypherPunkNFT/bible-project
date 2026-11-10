// Bible Jeopardy's Daily Double card (design 6.3, 9.6): the choosing team bets from 0 up to its score or 500, whichever
// is larger, with Half, All and 500 as quick buttons, then sees the clue. The box refuses anything outside the range.
import { useState } from "react";
import { formatNumber } from "@/lib/site-format";
import { TOP_VALUE } from "./model";
import { dailyDoubleMax, halfBet } from "./rules";
import { Score } from "./Scoreboard";

interface Props { team: string; teamIndex: number; score: number; onBet: (amount: number) => void; onBack: () => void }

export function DailyDouble({ team, teamIndex, score, onBet, onBack }: Props) {
  const max = dailyDoubleMax(score);
  const [text, setText] = useState("");
  const amount = Number(text);
  const valid = text.trim() !== "" && Number.isInteger(amount) && amount >= 0 && amount <= max;
  return <div className={`jp-daily-double jp-tone-${teamIndex}`}>
    <h2>Daily Double</h2>
    <p className="jp-dd-team">{team} <span>(<Score value={score} />)</span></p>
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
