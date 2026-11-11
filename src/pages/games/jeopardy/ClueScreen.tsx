// Bible Jeopardy's clue screen (design 5.2, 9.4): category and value, the clue in very large type sized by its length,
// a two-part question's lead-in above it, the four choices when shown (dealt-in cards; the right one ticks on the
// answer), the optional timer (thick, amber then red with the seconds, "Time!" stamped over the clue when it ends; the
// audit's item 4), and along the bottom each team's Right and Wrong (the choosing team first in Take turns) and Show
// answer. A mark lands: the team's row flashes and the others are invited to steal (the audit's item 2).
import { Check, X } from "lucide-react";
import { formatNumber, plural } from "@/lib/site-format";
import type { QuizQuestion } from "@/lib/live-quiz/protocol";
import { AnswerCard, TimerBar as KitTimerBar } from "../kit";
import { useClock } from "./clock";
import { LETTERS, clueSize } from "./display";
import type { Team } from "./model";
import type { Mark } from "./rules";

/** The clue's timer: drains over `seconds`, pausing while the window is hidden or `paused` is set; then "Time!" (6.5). */
export function TimerBar({ seconds, paused = false, onDone }: { seconds: number; paused?: boolean; onDone?: () => void }) {
  const { secondsLeft, done } = useClock(seconds, paused, onDone);
  const whole = Math.ceil(secondsLeft);
  return <KitTimerBar className="jp-timer" secondsLeft={secondsLeft} total={seconds} label={done ? "Time" : plural(whole, "{n} second left", "{n} seconds left")} stamp={<span>Time!</span>} />;
}

interface MarksProps {
  teams: Team[];
  marks: Mark[];
  order: number[];
  canMark: (team: number) => boolean;
  onMark: (team: number, right: boolean) => void;
}

/** Each team's Right and Wrong buttons; a marked team shows its mark instead. After a wrong answer the teams that may
 * still answer are invited to steal. */
export function TeamMarks({ teams, marks, order, canMark, onMark }: MarksProps) {
  const stealing = marks.includes("wrong") && !marks.includes("right");
  return <ol className="jp-marks" aria-label="Mark a team">
    {order.map((index) => {
      const team = teams[index];
      const mark = marks[index];
      const allowed = canMark(index);
      const state = mark === "right" ? " is-right" : mark === "wrong" ? " is-wrong" : allowed && stealing ? " is-steal" : "";
      return <li key={index} className={`jp-tone-${index}${state}`}>
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
  /** The timer ran out (the stage plays its buzz). */
  onTimeUp?: () => void;
}

/** The four choices as still cards; on the answer the right one is tinted and ticked, the others fade. */
export function Choices({ q, reveal = false }: { q: QuizQuestion; reveal?: boolean }) {
  return <ol className="jp-choices">
    {q.options.map((option, i) => <li key={option}>
      <AnswerCard interactive={false} index={i} state={!reveal ? "idle" : i === q.correct ? "right" : "faded"} className="jp-choice-card">
        <span className="jp-choice-letter">{LETTERS[i]}</span>{option}
      </AnswerCard>
    </li>)}
  </ol>;
}

export function ClueScreen({ category, value, q, choices, timer, bet, marks, onReveal, onTimeUp }: ClueProps) {
  return <div className="jp-clue">
    <p className="jp-clue-head"><span>{category}</span><span>{bet !== null ? `Daily Double · ${formatNumber(bet)}` : formatNumber(value)}</span></p>
    {timer > 0 && <TimerBar key={q.id} seconds={timer} onDone={onTimeUp} />}
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
