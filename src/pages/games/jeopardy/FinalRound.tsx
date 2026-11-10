// Bible Jeopardy's Final question (design 6.4, 9.6): the category, with every team writing its bet on paper (the
// projector cannot hide one); the clue with a 30-second timer the host can pause; then the answer and, one team at a
// time from the lowest score, the host types the team's bet and marks it right or wrong.
import { Check, Pause, Play, X } from "lucide-react";
import { useState } from "react";
import { formatNumber } from "@/lib/site-format";
import { Choices, TimerBar } from "./ClueScreen";
import { clueSize } from "./display";
import { FINAL_SECONDS, type FinalClue, type Team } from "./model";
import { finalMax, type FinalMark } from "./rules";
import { Score } from "./Scoreboard";
import { Verse } from "./Verse";

interface Props {
  screen: "final-category" | "final-clue" | "final-answer";
  final: FinalClue;
  choices: boolean;
  teams: Team[];
  order: number[];
  marks: (FinalMark | null)[];
  onClue: () => void;
  onReveal: () => void;
  onMark: (team: number, bet: number, right: boolean) => void;
}

function MarkRow({ team, index, onMark }: { team: Team; index: number; onMark: Props["onMark"] }) {
  const max = finalMax(team.score);
  const [text, setText] = useState(max === 0 ? "0" : "");
  const bet = Number(text);
  const valid = text.trim() !== "" && Number.isInteger(bet) && bet >= 0 && bet <= max;
  return <li className={`jp-final-row is-current jp-tone-${index}`}>
    <span className="jp-team-number" aria-hidden>{formatNumber(index + 1)}</span>
    <span className="jp-team-label">{team.name}</span>
    <span className="jp-final-score"><Score value={team.score} /></span>
    <label>
      <span className="sr-only">{`Bet of ${team.name}`}</span>
      <input type="number" inputMode="numeric" min={0} max={max} value={text} aria-invalid={text !== "" && !valid} onChange={(event) => setText(event.target.value)} />
    </label>
    <button type="button" className="jp-right" disabled={!valid} onClick={() => onMark(index, bet, true)}><Check size={18} aria-hidden />Right</button>
    <button type="button" className="jp-wrong" disabled={!valid} onClick={() => onMark(index, bet, false)}><X size={18} aria-hidden />Wrong</button>
    {text !== "" && !valid && <p className="jp-error" role="alert">{`A bet is a whole number from 0 to ${formatNumber(max)}.`}</p>}
  </li>;
}

export function FinalRound({ screen, final, choices, teams, order, marks, onClue, onReveal, onMark }: Props) {
  const [paused, setPaused] = useState(false);
  if (screen === "final-category") {
    return <div className="jp-final">
      <p className="jp-clue-head"><span>Final question</span></p>
      <h2 className="jp-final-category">{final.title}</h2>
      <p className="jp-final-line">{final.line}</p>
      <p className="jp-final-note">Every team writes its bet on paper: from 0 up to its score. Teams at zero or below write 0 and still play.</p>
      <button type="button" className="jp-primary" onClick={onClue}>Show the clue</button>
    </div>;
  }
  if (screen === "final-clue") {
    return <div className="jp-clue">
      <p className="jp-clue-head"><span>{`Final question · ${final.title}`}</span></p>
      <TimerBar key={final.q.id} seconds={FINAL_SECONDS} paused={paused} />
      <div className="jp-clue-body">
        {final.q.leadIn && <p className="jp-lead-in">{final.q.leadIn.question} <strong>{final.q.leadIn.answer}</strong></p>}
        <h2 className={`jp-clue-text ${clueSize(final.q.text)}`}>{final.q.text}</h2>
        {choices && <Choices q={final.q} />}
      </div>
      <div className="jp-clue-foot">
        <button type="button" className="jp-quiet" onClick={() => setPaused(!paused)}>
          {paused ? <><Play size={16} aria-hidden />Resume the timer</> : <><Pause size={16} aria-hidden />Pause the timer</>}
        </button>
        <button type="button" className="jp-primary" onClick={onReveal}>Show answer</button>
      </div>
    </div>;
  }
  const current = order.find((index) => marks[index] === null);
  return <div className="jp-answer">
    <p className="jp-clue-head"><span>{`Final question · ${final.title}`}</span></p>
    <p className="jp-answer-question">{final.q.text}</p>
    <h2 className="jp-answer-text">{final.q.options[final.q.correct]}</h2>
    <Verse q={final.q} />
    <ol className="jp-final-marks" aria-label="Bets, lowest score first">
      {order.map((index) => {
        const mark = marks[index];
        if (index === current) return <MarkRow key={index} team={teams[index]} index={index} onMark={onMark} />;
        if (!mark) return null;
        return <li key={index} className={`jp-final-row jp-tone-${index}`}>
          <span className="jp-team-number" aria-hidden>{formatNumber(index + 1)}</span>
          <span className="jp-team-label">{teams[index].name}</span>
          <span className="jp-final-score"><Score value={teams[index].score} /></span>
          <span className={`jp-mark ${mark.right ? "is-right" : "is-wrong"}`}>
            {mark.right ? <Check size={18} aria-hidden /> : <X size={18} aria-hidden />}
            {mark.right ? `Right, +${formatNumber(mark.bet)}` : `Wrong, −${formatNumber(mark.bet)}`}
          </span>
        </li>;
      })}
    </ol>
  </div>;
}
