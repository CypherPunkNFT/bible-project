// Who's older?: one round (design §8.2): the score line, the question and two large cards, side by side on wide
// screens and stacked on phones (top = left). The whole card is the button; the first tap locks both.
import { Check, Heart, X } from "lucide-react";
import { forwardRef } from "react";
import { HEARTS, type Character, type Round as RoundState, type Run } from "./game";

interface RoundProps {
  run: Run;
  round: RoundState;
  left: Character;
  right: Character;
  answerId: string;
  shownScore: number;
  onPick: (id: string) => void;
}

export const RoundView = forwardRef<HTMLButtonElement, RoundProps>(function RoundView({ run, round, left, right, answerId, shownScore, onPick }, ref) {
  const answered = round.pick !== null;
  return <div className="wo-round">
    <div className="wo-status">
      <span>{run.mode === "streak" ? "Streak" : "Relaxed"}</span>
      {run.mode === "streak" ? <span>Streak {shownScore}</span> : <>
        <span>Score {shownScore}</span>
        <span className="wo-hearts" aria-label={`${run.hearts} of ${HEARTS} hearts left`}>
          {Array.from({ length: HEARTS }, (_, n) => <Heart key={n} size={15} aria-hidden="true" className={n < run.hearts ? "is-full" : "is-empty"} />)}
        </span>
      </>}
    </div>
    <h1 className="wo-question">Who lived first?</h1>
    <p className="wo-hint">The one who came into the world first.</p>
    <div className="wo-cards" role="group" aria-label="The two people">
      {[left, right].map((person, n) => {
        const state = !answered ? "" : person.id === answerId ? " is-answer" : person.id === round.pick ? " is-wrong" : " is-dim";
        const chosen = round.pick === person.id;
        return <button key={person.id} ref={n === 0 ? ref : undefined} type="button" className={`wo-card${state}${chosen ? " is-chosen" : ""}`}
          aria-disabled={answered} aria-keyshortcuts={n === 0 ? "1 ArrowLeft" : "2 ArrowRight"} aria-label={`${person.label}, ${person.tag.toLowerCase()}`}
          onClick={() => onPick(person.id)}>
          <span className="wo-card-key" aria-hidden="true">{n + 1}</span>
          <span className="wo-card-name">{person.label}</span>
          <span className="wo-card-tag">{person.tag}</span>
          {answered && person.id === answerId && <span className="wo-card-mark"><Check size={14} aria-hidden="true" />Came first</span>}
          {answered && chosen && person.id !== answerId && <span className="wo-card-mark"><X size={14} aria-hidden="true" />Wrong</span>}
          {answered && chosen && person.id === answerId && <span className="wo-card-mark wo-card-mine">Right — your answer</span>}
        </button>;
      })}
    </div>
  </div>;
});
