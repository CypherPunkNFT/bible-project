// What came first?: one round (design §9.2): the scoreboard, the category's question and two tall cards side by side
// with the hourglass between them, at every width. The whole card is the button; the first tap locks both. The cards
// are the kit's answer cards: they deal in, lift, press and settle right (tint and a stamp), wrong (dashed, a shake) or
// faded. On Next the one who stays slides into the left slot and the challenger arrives from the right, so the "one
// stays" rule is seen, not just dealt. In Mixed a small chip in the category's tone names the kind of round. A milestone
// bursts once over the cards. Every state is there at once; motion decorates.
import { Check, Heart, Landmark, MapPin, ScrollText, X } from "lucide-react";
import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import { AnswerCard, Confetti, StreakFlame, type AnswerState } from "../kit";
import { shortName } from "../whos-older/explain";
import { categoryInfo } from "./categories";
import { HEARTS, type PairRound, type Run } from "./game";
import type { CategoryKey, PairCategory } from "./order";
import type { Journey, PairPool, ShownItem } from "./pool";
import { cardTag, qualifier } from "./view";
import { Hourglass } from "./Hourglass";

/** The medallion: an initial for people, rulers and deaths, a book's code, or a small glyph where an initial means nothing. */
export function Medallion({ category, item }: { category: PairCategory; item: ShownItem }) {
  let inside: ReactNode;
  if (category === "books") inside = <span className="wcf-code">{item.id}</span>;
  else if (category === "happened") inside = <ScrollText size={18} aria-hidden="true" />;
  else if (category === "built") inside = <Landmark size={18} aria-hidden="true" />;
  else if (category === "went") inside = <MapPin size={18} aria-hidden="true" />;
  else inside = shortName(item.label).slice(0, 1);
  return <span className="wo-medallion" aria-hidden="true">{inside}</span>;
}

/** The round's heading: the category's question (Journeys names the traveller in its own element, and Bible Firsts
 *  asks its own question) with its line, and in Mixed a chip in the category's tone. */
export function RoundHeading({ category, mixed, journey, question }: { category: CategoryKey; mixed: boolean; journey?: Journey; question?: string }) {
  const info = categoryInfo(category);
  return <div className="wcf-heading" style={{ "--wcf-tone": `var(--${info.tone})` } as CSSProperties}>
    {mixed && <span className="wcf-chip">{info.label}</span>}
    {question ? <h1 className="wo-question wcf-asked">{question}</h1>
      : journey ? <h1 className="wo-question">Where did <span className="wcf-name">{journey.traveller}</span> go first?</h1>
      : <h1 className="wo-question">{info.heading}</h1>}
    {!question && (journey ? <p className="wo-hint"><span className="wcf-name">{journey.title}</span></p> : <p className="wo-hint">{info.subtitle}</p>)}
  </div>;
}

interface RoundProps {
  pool: PairPool;
  run: Run;
  round: PairRound;
  answerId: string;
  shownScore: number;
  /** Who the left card was last round: the right-hand item slid over, the left one held on, or nobody (a fresh pair). */
  stayedFrom: "right" | "left" | null;
  /** A heart went in this round (Relaxed), so that heart breaks. */
  lostNow: boolean;
  milestone?: string;
  onPick: (id: string) => void;
}

const cardState = (round: PairRound, id: string, answerId: string): AnswerState => {
  if (round.pick === null) return "idle";
  if (id === answerId) return "right";
  return id === round.pick ? "wrong" : "faded";
};

export const RoundView = forwardRef<HTMLButtonElement, RoundProps>(function RoundView(props, ref) {
  const { pool, run, round, answerId, shownScore, stayedFrom, lostNow, milestone, onPick } = props;
  const answered = round.pick !== null;
  const n = run.rounds.length;
  const items = [pool.byId.get(round.left)!, pool.byId.get(round.right)!];
  return <div className="wo-round">
    <Scoreboard run={run} shownScore={shownScore} lostNow={lostNow} />
    <RoundHeading category={pool.key} mixed={run.choice === "mixed"} journey={pool.journeys.get(items[0].group ?? "")} />
    <div className="wo-cards" role="group" aria-label="The two cards">
      {items.map((item, i) => {
        const moved = i === 0 && stayedFrom === "right" ? " is-slid" : i === 0 && stayedFrom === "left" ? " is-held" : i === 1 && stayedFrom ? " is-arrived" : "";
        const tag = cardTag(pool.key, item);
        return <AnswerCard key={`${n}-${item.id}`} ref={i === 0 ? ref : undefined} index={i} state={cardState(round, item.id, answerId)}
          className={`wo-card${pool.key === "happened" ? " wcf-phrase" : ""}${moved}`} aria-disabled={answered} aria-keyshortcuts={i === 0 ? "1 ArrowLeft" : "2 ArrowRight"}
          aria-label={tag ? `${item.label}, ${tag.toLowerCase()}` : item.label} onClick={() => onPick(item.id)}
          rightMark={<><Check size={13} aria-hidden="true" />Came first</>} wrongMark={<><X size={13} aria-hidden="true" />Wrong</>}>
          <span className="wo-card-key" aria-hidden="true">{i + 1}</span>
          <Medallion category={pool.key} item={item} />
          <span className="wo-card-name">{pool.key === "happened" ? item.label : shortName(item.label)}</span>
          {pool.key !== "happened" && qualifier(item.label) && <span className="wo-card-qualifier">{qualifier(item.label)}</span>}
          {tag && <span className="wo-card-tag">{tag}</span>}
        </AnswerCard>;
      })}
      <Hourglass turn={n} className="wo-cards-glass" />
      <Confetti when={!!milestone} count={28} reach={150} />
      {milestone && <p className="wo-milestone" role="status">{milestone}</p>}
    </div>
  </div>;
});

export function Scoreboard({ run, shownScore, lostNow }: { run: Run; shownScore: number; lostNow: boolean }) {
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
