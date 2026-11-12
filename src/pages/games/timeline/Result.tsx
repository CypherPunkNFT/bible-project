// Timeline sort's endings (design §10.5, §7.2; redesigned from docs/visual-audits/timeline.md, items 3 and 6): the
// result comes first and the reading second. A Daily ends on a compact panel: the cheer or a gentle "Not this time",
// the score once, the grid of squares that will be shared, Share, the streak with its flame and the countdown, all on
// one phone screen; the true order sits below as a timeline of rows that open. Practice ends on its pairs and stars,
// the stars filling one by one, with Next round on that first screen. On a loss or a round with no star, one
// encouraging line names the cards that were in the right place (names in their own element).
import { ArrowRight, Star } from "lucide-react";
import { forwardRef, type CSSProperties } from "react";
import { formatList, formatNumber, plural } from "@/lib/site-format";
import { Confetti, ProgressTrail, ResultPanel, ShareButton, StreakFlame, type TrailMark } from "../kit";
import { useNow } from "../map-quest/use-now";
import { msUntilMidnight } from "./daily";
import { Reveal } from "./Reveal";
import { pairsInOrder, slotTicks, stars } from "./scoring";
import { DAILY_TRIES, shareText } from "./share";
import { distribution, type DailyResult as DailyRecord, type Round, type Saved } from "./storage";
import type { Loaded } from "./text";

const clock = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60].map((part) => String(part).padStart(2, "0")).join(":");
};

/** One try as trail marks: a green square for a card in its right place, an empty one otherwise (the share grid's row). */
const rowMarks = (order: readonly string[], truth: readonly string[]): TrailMark[] => slotTicks(order, truth).map((tick) => (tick ? "right" : "empty"));

/** The cards the player's last order had in the right slot, by name, for the encouraging line. */
function rightNames(loaded: Loaded, order: readonly string[], truth: readonly string[]): string[] {
  return order.filter((id, i) => truth[i] === id).map((id) => loaded.byId.get(id)!.label);
}

function CloseLine({ names }: { names: string[] }) {
  if (!names.length) return <p className="tl-close">Every round teaches the order. Try again tomorrow, or practise now.</p>;
  return <p className="tl-close"><span>Close. You had these in the right place:</span> <strong>{formatList(names)}</strong></p>;
}

interface DailyProps { loaded: Loaded; n: number; result: DailyRecord; truth: readonly string[]; saved: Saved; streak: number; onPractice: () => void }

export const DailyResult = forwardRef<HTMLHeadingElement, DailyProps>(function DailyResult({ loaded, n, result, truth, saved, streak, onPractice }, heading) {
  const now = useNow();
  const text = shareText(n, result.tries, truth, result.solved);
  const last = result.tries[result.tries.length - 1];
  const { solvedIn, missed } = distribution(saved);
  const most = Math.max(1, ...solvedIn, missed);
  return <ResultPanel className="tl-result" reading={<>
    <Reveal loaded={loaded} truth={truth} order={last} celebrate={result.solved} />
    <details className="tl-spread-fold">
      <summary>Your results so far</summary>
      <ul className="tl-spread" aria-label="Your results so far">
        {[...solvedIn.map((count, i) => ({ key: String(i + 1), count })), { key: "X", count: missed }].map(({ key, count }) =>
          <li key={key}><span>{key}</span><span className="tl-spread-bar" style={{ width: `${Math.max(6, (count / most) * 100)}%` }}>{formatNumber(count)}</span></li>)}
      </ul>
    </details>
  </>} trail={<div className="tl-grid" role="img" aria-label={plural(result.tries.length, "{n} try", "{n} tries")}>
    {result.tries.map((order, i) => <ProgressTrail key={i} marks={rowMarks(order, truth)} size="1.1rem"
      label={`Try ${formatNumber(i + 1)}: ${formatNumber(slotTicks(order, truth).filter(Boolean).length)} in the right place`} />)}
  </div>} actions={<>
    <ShareButton text={text} preview={false} game="Timeline sort" className="tl-share" />
    <button type="button" className="tl-secondary" onClick={onPractice}>Practice now</button>
  </>}>
    <div className="tl-result-head">
      <Confetti when={result.solved} count={28} reach={140} />
      <h2 ref={heading} tabIndex={-1} className={`tl-banner${result.solved ? " is-won" : ""}`}>{result.solved ? "Solved it!" : "Not this time"}</h2>
      <p className="tl-score" aria-label={result.solved ? plural(result.tries.length, "Solved in {n} try of 4", "Solved in {n} tries of 4") : "Not solved in 4 tries"}>
        <span aria-hidden="true">{result.solved ? `${formatNumber(result.tries.length)}/${formatNumber(DAILY_TRIES)}` : `X/${formatNumber(DAILY_TRIES)}`}</span>
      </p>
      {!result.solved && <CloseLine names={rightNames(loaded, last, truth)} />}
    </div>
    <dl className="tl-stats">
      <div><dt>Streak</dt><dd><StreakFlame count={streak} label={plural(streak, "{n} day in a row", "{n} days in a row")} /></dd></div>
      <div><dt>Best streak</dt><dd>{formatNumber(saved.daily.best)}</dd></div>
      <div><dt>Next puzzle in</dt><dd>{clock(msUntilMidnight(now))}</dd></div>
    </dl>
  </ResultPanel>;
});

type PracticeRound = Extract<Round, { mode: "practice" }>;
interface PracticeProps { loaded: Loaded; round: PracticeRound; truth: readonly string[]; perfectStreak: number; onNext: () => void }

export const PracticeResult = forwardRef<HTMLHeadingElement, PracticeProps>(function PracticeResult({ loaded, round, truth, perfectStreak, onNext }, heading) {
  const { right, total } = pairsInOrder(round.order, truth);
  const earned = stars(right, total);
  const perfect = right === total;
  return <ResultPanel className="tl-result" reading={<Reveal loaded={loaded} truth={truth} order={round.order} celebrate={perfect} />}
    actions={<button type="button" className="tl-primary tl-next" onClick={onNext}>Next round<ArrowRight size={15} aria-hidden="true" /></button>}>
    <div className="tl-result-head">
      <Confetti when={perfect} count={perfect && perfectStreak > 1 ? 36 : 20} reach={130} />
      <h2 ref={heading} tabIndex={-1} className={`tl-banner${perfect ? " is-won" : ""}`}>{`${formatNumber(right)} of ${formatNumber(total)} pairs in order`}</h2>
      <p className="tl-stars" role="img" aria-label={plural(earned, "{n} star of 3", "{n} stars of 3")}>
        {[1, 2, 3].map((s) => <Star key={s} size={26} aria-hidden="true" className={s <= earned ? "is-on" : undefined} style={{ "--kit-i": s - 1 } as CSSProperties} />)}
      </p>
      {perfect && perfectStreak > 1 && <p className="tl-celebrate" role="status">{`${formatNumber(perfectStreak)} perfect rounds in a row!`}</p>}
      {earned === 0 && <CloseLine names={rightNames(loaded, round.order, truth)} />}
    </div>
  </ResultPanel>;
});
