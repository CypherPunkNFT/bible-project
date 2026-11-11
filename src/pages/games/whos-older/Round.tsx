// Who's older?: one round (design §8.2): the scoreboard, the question and two tall cards side by side with the
// hourglass between them, at every width. The whole card is the button; the first tap locks both. The cards are the
// kit's answer cards: they deal in, lift, press and settle right (tint and a stamp), wrong (dashed, a shake) or faded.
// On Next the one who stays slides into the left slot and the challenger arrives from the right, so the "one stays"
// rule is seen, not just dealt. A milestone bursts once over the cards. Every state is there at once; motion decorates.
import { Check, Heart, X } from "lucide-react";
import { forwardRef } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import { AnswerCard, Confetti, StreakFlame, type AnswerState } from "../kit";
import { HEARTS, type Character, type Round as RoundState, type Run } from "./game";
import { shortName } from "./explain";
import { qualifier } from "./view";
import { Hourglass } from "./Hourglass";

interface RoundProps {
  run: Run;
  round: RoundState;
  left: Character;
  right: Character;
  answerId: string;
  shownScore: number;
  /** Who the left card was last round: the right-hand person slid over, the left one held on, or nobody (a fresh pair). */
  stayedFrom: "right" | "left" | null;
  /** A heart went in this round (Relaxed), so that heart breaks. */
  lostNow: boolean;
  milestone?: string;
  onPick: (id: string) => void;
}

const cardState = (round: RoundState, person: Character, answerId: string): AnswerState => {
  if (round.pick === null) return "idle";
  if (person.id === answerId) return "right";
  return person.id === round.pick ? "wrong" : "faded";
};

export const RoundView = forwardRef<HTMLButtonElement, RoundProps>(function RoundView(props, ref) {
  const { run, round, left, right, answerId, shownScore, stayedFrom, lostNow, milestone, onPick } = props;
  const answered = round.pick !== null;
  const n = run.rounds.length;
  return <div className="wo-round">
    <Scoreboard run={run} shownScore={shownScore} lostNow={lostNow} />
    <h1 className="wo-question">Who lived first?</h1>
    <p className="wo-hint">The one who came into the world first.</p>
    <div className="wo-cards" role="group" aria-label="The two people">
      {[left, right].map((person, i) => {
        const moved = i === 0 && stayedFrom === "right" ? " is-slid" : i === 0 && stayedFrom === "left" ? " is-held" : i === 1 && stayedFrom ? " is-arrived" : "";
        return <AnswerCard key={`${n}-${person.id}`} ref={i === 0 ? ref : undefined} index={i} state={cardState(round, person, answerId)}
          className={`wo-card${moved}`} aria-disabled={answered} aria-keyshortcuts={i === 0 ? "1 ArrowLeft" : "2 ArrowRight"}
          aria-label={`${person.label}, ${person.tag.toLowerCase()}`} onClick={() => onPick(person.id)}
          rightMark={<><Check size={13} aria-hidden="true" />Came first</>} wrongMark={<><X size={13} aria-hidden="true" />Wrong</>}>
          <span className="wo-card-key" aria-hidden="true">{i + 1}</span>
          <span className="wo-medallion" aria-hidden="true">{shortName(person.label).slice(0, 1)}</span>
          <span className="wo-card-name">{shortName(person.label)}</span>
          {qualifier(person.label) && <span className="wo-card-qualifier">{qualifier(person.label)}</span>}
          <span className="wo-card-tag">{person.tag}</span>
        </AnswerCard>;
      })}
      <Hourglass turn={n} className="wo-cards-glass" />
      <Confetti when={!!milestone} count={28} reach={150} />
      {milestone && <p className="wo-milestone" role="status">{milestone}</p>}
    </div>
  </div>;
});

function Scoreboard({ run, shownScore, lostNow }: { run: Run; shownScore: number; lostNow: boolean }) {
  if (run.mode === "streak") {
    return <div className="wo-score">
      <span className="wo-score-mode">Streak</span>
      <StreakFlame className="wo-streak" count={shownScore} litFrom={2} label={plural(shownScore, "{n} in a row", "{n} in a row")} />
    </div>;
  }
  return <div className="wo-score">
    <span className="wo-score-mode">Relaxed</span>
    <span className="wo-points" role="img" aria-label={plural(shownScore, "{n} right", "{n} right")}>
      <span className="wo-points-label" aria-hidden="true">Score</span>
      <span className="wo-points-n" aria-hidden="true">{formatNumber(shownScore)}</span>
    </span>
    <span className="wo-hearts" role="img" aria-label={plural(run.hearts, "{n} heart left", "{n} hearts left")}>
      {Array.from({ length: HEARTS }, (_, i) => {
        const lost = i >= run.hearts;
        const breaking = lostNow && i === run.hearts;
        return <Heart key={i} size={22} aria-hidden="true" className={`${lost ? "is-lost" : "is-full"}${breaking ? " is-breaking" : ""}`} />;
      })}
    </span>
  </div>;
}

