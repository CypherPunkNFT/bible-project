// Bible Jeopardy's clue screen (design 5.2, 9.4): category and value, the clue in very large type sized by its length,
// a two-part question's lead-in above it, the four choices when shown, the optional timer bar, and along the bottom
// each team's ✓ Right and ✗ Wrong (the choosing team first in Take turns) and Show answer.
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import type { QuizQuestion } from "@/lib/live-quiz/protocol";
import { LETTERS, clueSize } from "./display";
import type { Team } from "./model";
import type { Mark } from "./rules";


/** A bar that drains over `seconds`, pausing while the window is hidden or `paused` is set; then it says Time (6.5). */
export function TimerBar({ seconds, paused = false }: { seconds: number; paused?: boolean }) {
  const [left, setLeft] = useState(seconds * 1000);
  const done = left <= 0;
  useEffect(() => {
    if (paused || done) return;
    let before = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const step = document.hidden ? 0 : now - before;
      before = now;
      setLeft((value) => Math.max(0, value - step));
    }, 200);
    return () => window.clearInterval(id);
  }, [paused, done]);
  const share = left / (seconds * 1000);
  return <div className={`jp-timer${done ? " is-done" : ""}`} role="timer" aria-label={done ? "Time" : plural(Math.ceil(left / 1000), "{n} second left", "{n} seconds left")}>
    <span style={{ transform: `scaleX(${share})` }} />
    {done && <strong>Time</strong>}
  </div>;
}

interface MarksProps {
  teams: Team[];
  marks: Mark[];
  order: number[];
  canMark: (team: number) => boolean;
  onMark: (team: number, right: boolean) => void;
}

/** Each team's Right and Wrong buttons; a marked team shows its mark instead. */
export function TeamMarks({ teams, marks, order, canMark, onMark }: MarksProps) {
  return <ol className="jp-marks" aria-label="Mark a team">
    {order.map((index) => {
      const team = teams[index];
      const mark = marks[index];
      const allowed = canMark(index);
      return <li key={index} className={`jp-tone-${index}`}>
        <span className="jp-team-number" aria-hidden>{formatNumber(index + 1)}</span>
        <span className="jp-team-label" title={team.name}>{team.name}</span>
        {mark === "right" ? <span className="jp-mark is-right"><Check size={18} aria-hidden />Right</span>
          : mark === "wrong" ? <span className="jp-mark is-wrong"><X size={18} aria-hidden />Wrong</span>
          : <span className="jp-mark-buttons">
            <button type="button" className="jp-right" disabled={!allowed} onClick={() => onMark(index, true)} aria-label={`${team.name}: right`}><Check size={18} aria-hidden />Right</button>
            <button type="button" className="jp-wrong" disabled={!allowed} onClick={() => onMark(index, false)} aria-label={`${team.name}: wrong`}><X size={18} aria-hidden />Wrong</button>
          </span>}
      </li>;
    })}
  </ol>;
}


interface ClueProps {
  category: string;
  value: number;
  q: QuizQuestion;
  choices: boolean;
  timer: number;
  /** The Daily Double's bet, shown in place of the value. */
  bet: number | null;
  marks: MarksProps;
  onReveal: () => void;
}

export function Choices({ q, reveal = false }: { q: QuizQuestion; reveal?: boolean }) {
  return <ol className="jp-choices">
    {q.options.map((option, i) => <li key={option} className={reveal && i === q.correct ? "is-right" : ""}><span>{LETTERS[i]}</span>{option}</li>)}
  </ol>;
}

export function ClueScreen({ category, value, q, choices, timer, bet, marks, onReveal }: ClueProps) {
  return <div className="jp-clue">
    <p className="jp-clue-head"><span>{category}</span><span>{bet !== null ? `Daily Double · ${formatNumber(bet)}` : formatNumber(value)}</span></p>
    {timer > 0 && <TimerBar key={q.id} seconds={timer} />}
    <div className="jp-clue-body">
      {q.leadIn && <p className="jp-lead-in">{q.leadIn.question} <strong>{q.leadIn.answer}</strong></p>}
      <h2 className={`jp-clue-text ${clueSize(q.text)}`}>{q.text}</h2>
      {choices && <Choices q={q} />}
    </div>
    <div className="jp-clue-foot">
      <TeamMarks {...marks} />
      <button type="button" className="jp-primary" onClick={onReveal}>Show answer</button>
    </div>
  </div>;
}
