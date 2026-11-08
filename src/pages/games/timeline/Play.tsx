// Timeline sort's two ways to play (design §6, §7, §10.2–10.4). Daily: six events, four tries, ticks and joins between
// tries, then the reveal. Practice: one try, scored by pairs in order with stars, then the reveal and the next round.
// Every move and every Check is saved at once, so a reload can neither re-deal nor undo a try.
import { ArrowRight, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatNumber } from "@/lib/site-format";
import { mulberry32 } from "./daily-rules";
import { LEVELS, shuffleForDisplay } from "./deal";
import { ERAS, trueOrder } from "./order";
import { Reveal } from "./Reveal";
import { DailyDone } from "./Screens";
import { joins, pairsInOrder, shareRow, slotTicks, stars } from "./scoring";
import { DAILY_TRIES } from "./share";
import { move, sameOrder } from "./sortable";
import { SortList } from "./SortList";
import { isDone, recordPractice, recordTry, streakOn, type Round, type Saved } from "./storage";
import type { Loaded } from "./text";

const HINT = "Drag a card by its handle, or tap a card and then where it goes.";

interface DailyProps { loaded: Loaded; n: number; ids: readonly string[]; saved: Saved; onSave: (saved: Saved) => void; onPractice: () => void }

export function DailyPlay({ loaded, n, ids, saved, onSave, onPractice }: DailyProps) {
  const truth = useMemo(() => trueOrder(loaded.index, ids), [loaded, ids]);
  const result = saved.daily.results[n];
  const done = isDone(result);
  // The dealt order is the same for everyone that day, so a reload deals the same jumble (§11.1).
  const dealt = useMemo(() => shuffleForDisplay(truth, mulberry32(n)), [truth, n]);
  const [order, setOrder] = useState<string[]>(() => {
    const round = saved.round;
    if (round?.mode === "daily" && round.n === n && sameOrder([...round.order].sort(), [...truth].sort())) return round.order;
    return (result ? result.tries[result.tries.length - 1] : undefined) ?? dealt;
  });
  const heading = useRef<HTMLHeadingElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const [checkedNow, setCheckedNow] = useState(false);
  const labelOf = (id: string) => loaded.byId.get(id)!.label;
  const tries = result?.tries ?? [];
  const last = tries.length ? tries[tries.length - 1] : undefined;
  const marks = last && sameOrder(last, order) ? { ticks: slotTicks(order, truth), joins: joins(order, truth) } : null;
  const canCheck = !done && !sameOrder(order, dealt) && !tries.some((t) => sameOrder(t, order));

  useEffect(() => { if (checkedNow) (done ? heading : status).current?.focus(); }, [checkedNow, done, tries.length]);

  const onMove = (from: number, to: number) => {
    const next = move(order, from, to);
    setOrder(next);
    onSave({ ...saved, round: { mode: "daily", n, order: next } });
  };
  const check = () => {
    if (!canCheck) return;
    onSave({ ...recordTry(saved, n, order, truth), round: { mode: "daily", n, order } });
    setCheckedNow(true);
  };
  const ticks = marks ? marks.ticks.filter(Boolean).length : 0;
  const linked = marks ? marks.joins.filter(Boolean).length : 0;
  const left = DAILY_TRIES - tries.length;
  const line = marks ? `${ticks} in the right place, ${linked} ${linked === 1 ? "join" : "joins"}, ${left} ${left === 1 ? "try" : "tries"} left` : "";

  if (done) {
    return <Reveal ref={heading} loaded={loaded} truth={truth} order={last ?? order}
      banner={result!.solved ? `Solved in ${tries.length}!` : "Not this time"}>
      <DailyDone n={n} result={result!} truth={truth} saved={saved} streak={streakOn(saved, n)} onPractice={onPractice} />
    </Reveal>;
  }
  return <div className="tl-play">
    <header className="tl-head">
      <h1>Today's timeline <span>#{formatNumber(n)}</span></h1>
      <p className="tl-dots" aria-label={`Try ${tries.length + 1} of ${DAILY_TRIES}`}>
        {Array.from({ length: DAILY_TRIES }, (_, i) => <span key={i} className={i < tries.length ? "is-used" : undefined} />)}
      </p>
    </header>
    {!tries.length && <p className="tl-hint">{HINT}</p>}
    <SortList order={order} labelOf={labelOf} onMove={onMove} marks={marks} />
    <p ref={status} tabIndex={-1} className="tl-status" aria-live="polite">{line}</p>
    {tries.length > 0 && <ol className="tl-tries" aria-label="Your tries so far">
      {tries.map((t, i) => <li key={i} aria-label={`Try ${i + 1}: ${slotTicks(t, truth).filter(Boolean).length} in the right place`}>{shareRow(t, truth)}</li>)}
    </ol>}
    <div className="tl-check-bar">
      <button type="button" className="tl-primary tl-check" disabled={!canCheck} onClick={check}>Check</button>
    </div>
  </div>;
}

type PracticeRound = Extract<Round, { mode: "practice" }>;
interface PracticeProps { loaded: Loaded; round: PracticeRound; saved: Saved; onSave: (saved: Saved) => void; onNext: () => void }

export function PracticePlay({ loaded, round, saved, onSave, onNext }: PracticeProps) {
  const truth = useMemo(() => trueOrder(loaded.index, round.dealt), [loaded, round.dealt]);
  const heading = useRef<HTMLHeadingElement>(null);
  const labelOf = (id: string) => loaded.byId.get(id)!.label;
  const canCheck = !round.checked && !sameOrder(round.order, round.dealt);
  useEffect(() => { if (round.checked) heading.current?.focus(); }, [round.checked]);

  const onMove = (from: number, to: number) => onSave({ ...saved, round: { ...round, order: move(round.order, from, to) } });
  const check = () => {
    if (!canCheck) return;
    const perfect = sameOrder(round.order, truth);
    onSave({ ...recordPractice(saved, round.level, round.dealt, perfect), round: { ...round, checked: true } });
  };
  const era = ERAS.find((option) => option.key === round.era)?.title ?? "All of the Bible";

  if (round.checked) {
    const { right, total } = pairsInOrder(round.order, truth);
    const earned = stars(right, total);
    const streak = saved.practice.perfect[round.level];
    return <Reveal ref={heading} loaded={loaded} truth={truth} order={round.order}
      banner={<>{formatNumber(right)} of {formatNumber(total)} pairs in order
        <span className="tl-stars" aria-label={`${earned} of 3 stars`}>{[1, 2, 3].map((s) => <Star key={s} size={18} aria-hidden="true" className={s <= earned ? "is-on" : undefined} />)}</span></>}>
      {right === total && streak > 1 && <p className="tl-celebrate" role="status">{formatNumber(streak)} perfect rounds in a row!</p>}
      <button type="button" className="tl-primary tl-next" onClick={onNext}>Next round<ArrowRight size={15} aria-hidden="true" /></button>
    </Reveal>;
  }
  return <div className="tl-play">
    <header className="tl-head">
      <h1>Practice <span>{LEVELS[round.level].title} · {era}</span></h1>
    </header>
    {round.widened && <p className="tl-note">Not enough {LEVELS[round.level].title} events in this part of the story: showing some harder ones.</p>}
    <p className="tl-hint">{HINT}</p>
    <SortList order={round.order} labelOf={labelOf} onMove={onMove} />
    <div className="tl-check-bar">
      <button type="button" className="tl-primary tl-check" disabled={!canCheck} onClick={check}>Check</button>
    </div>
  </div>;
}
