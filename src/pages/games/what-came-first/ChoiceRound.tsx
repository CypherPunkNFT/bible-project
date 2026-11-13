// What came first?: a Bible Firsts round (design §6.3, §9.2): the question as the heading and three or four of the
// kit's answer cards in the game's look, two by two on a phone and one row on a desktop, shorter than the pair cards so
// the question, the answers and the pinned band fit one phone screen. No hourglass, nobody stays. One tap locks it.
import { Check, X } from "lucide-react";
import { forwardRef } from "react";
import { AnswerCard, Confetti, type AnswerState } from "../kit";
import { answersOf, type ChoiceRound, type Run } from "./game";
import type { FirstsQuestion } from "./pool";
import { RoundHeading, Scoreboard } from "./Round";

interface ChoiceProps {
  run: Run;
  round: ChoiceRound;
  question: FirstsQuestion;
  shownScore: number;
  lostNow: boolean;
  milestone?: string;
  onPick: (index: number) => void;
}

const stateOf = (round: ChoiceRound, index: number): AnswerState => {
  if (round.pick === null) return "idle";
  if (index === 0) return "right";
  return index === round.pick ? "wrong" : "faded";
};

export const ChoiceRoundView = forwardRef<HTMLButtonElement, ChoiceProps>(function ChoiceRoundView(props, ref) {
  const { run, round, question, shownScore, lostNow, milestone, onPick } = props;
  const answers = answersOf(question);
  const answered = round.pick !== null;
  return <div className="wo-round">
    <Scoreboard run={run} shownScore={shownScore} lostNow={lostNow} />
    <RoundHeading category="firsts" mixed={run.choice === "mixed"} question={question.question} />
    <div className={`wcf-answers${round.order.length === 3 ? " is-three" : ""}`} role="group" aria-label="The answers">
      {round.order.map((index, i) => <AnswerCard key={`${run.rounds.length}-${index}`} ref={i === 0 ? ref : undefined} index={i}
        state={stateOf(round, index)} className="wo-card wcf-answer" aria-disabled={answered} aria-keyshortcuts={String(i + 1)}
        aria-label={answers[index]} onClick={() => onPick(index)}
        rightMark={<><Check size={13} aria-hidden="true" />Right</>} wrongMark={<><X size={13} aria-hidden="true" />Wrong</>}>
        <span className="wo-card-key" aria-hidden="true">{i + 1}</span>
        <span className="wo-card-name">{answers[index]}</span>
      </AnswerCard>)}
      <Confetti when={!!milestone} count={28} reach={150} />
      {milestone && <p className="wo-milestone" role="status">{milestone}</p>}
    </div>
  </div>;
});
