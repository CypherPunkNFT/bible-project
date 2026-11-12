// Timeline sort's two ways to play (design §6, §7, §10.2–10.4). Daily: six events, four tries, ticks and joins between
// tries, then the result and the reveal. Practice: one try, scored by pairs in order with stars, then the result, the
// reveal and the next round. Every move and every Check is saved at once, so a reload can neither re-deal nor undo a
// try. The tries left are four small card backs in the header; one turns over with each Check and shows how many cards
// that try had in the right place.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import { FlipCard } from "../kit";
import { mulberry32 } from "./daily-rules";
import { LEVELS, shuffleForDisplay } from "./deal";
import { ERAS, trueOrder } from "./order";
import { DailyResult, PracticeResult } from "./Result";
import { slotTicks, joins } from "./scoring";
import { DAILY_TRIES } from "./share";
import { move, sameOrder } from "./sortable";
import { SortList } from "./SortList";
import { isDone, recordPractice, recordTry, streakOn, type Round, type Saved } from "./storage";
import { cardOf, type Loaded } from "./text";

const HINT = "Drag a card by its handle, or tap a card and then where it goes.";

/** While a board is on screen the page carries a class, so the site's floating pencil steps aside on a phone. */
function usePlayingClass() {
  useEffect(() => {
    document.body.classList.add("tl-playing");
    return () => document.body.classList.remove("tl-playing");
  }, []);
}

/** The four tries as small card backs; a used one is turned over and shows that try's count of right places. */
function TryCards({ tries, truth }: { tries: readonly (readonly string[])[]; truth: readonly string[] }) {
  return <p className="tl-tries" role="img" aria-label={`Try ${formatNumber(Math.min(tries.length + 1, DAILY_TRIES))} of ${formatNumber(DAILY_TRIES)}`}>
    {Array.from({ length: DAILY_TRIES }, (_, i) => <FlipCard key={i} axis="y" index={i} flipped={i < tries.length} className="tl-try"
      front={<span className="tl-try-face" />}
      back={<span className="tl-try-face">{tries[i] ? formatNumber(slotTicks(tries[i], truth).filter(Boolean).length) : ""}</span>} />)}
  </p>;
}

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
  const face = (id: string) => cardOf(loaded, id);
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
  const line = marks ? <>
    <span>{`${formatNumber(ticks)} in the right place.`}</span>{" "}
    <span>{plural(linked, "{n} join.", "{n} joins.")}</span>{" "}
    <span>{plural(left, "{n} try left.", "{n} tries left.")}</span>
  </> : null;

  if (done) {
    return <DailyResult ref={heading} loaded={loaded} n={n} result={result!} truth={truth} saved={saved} streak={streakOn(saved, n)} onPractice={onPractice} />;
  }
  return <DailyBoard n={n} tries={tries} truth={truth} hint={sameOrder(order, dealt) && !tries.length}>
    <SortList order={order} cardOf={face} onMove={onMove} marks={marks} tryKey={tries.length} />
    <p ref={status} tabIndex={-1} className="tl-status" aria-live="polite">{line}</p>
    <div className="tl-check-bar">
      <button type="button" className="tl-primary tl-check" disabled={!canCheck} onClick={check}>Check</button>
    </div>
  </DailyBoard>;
}

function DailyBoard({ n, tries, truth, hint, children }: { n: number; tries: readonly (readonly string[])[]; truth: readonly string[]; hint: boolean; children: ReactNode }) {
  usePlayingClass();
  return <div className="tl-play">
    <header className="tl-head">
      <h1>Today's timeline <span>#{formatNumber(n)}</span></h1>
      <TryCards tries={tries} truth={truth} />
    </header>
    {hint && <p className="tl-hint">{HINT}</p>}
    {children}
  </div>;
}

type PracticeRound = Extract<Round, { mode: "practice" }>;
interface PracticeProps { loaded: Loaded; round: PracticeRound; saved: Saved; onSave: (saved: Saved) => void; onNext: () => void }

export function PracticePlay({ loaded, round, saved, onSave, onNext }: PracticeProps) {
  const truth = useMemo(() => trueOrder(loaded.index, round.dealt), [loaded, round.dealt]);
  const heading = useRef<HTMLHeadingElement>(null);
  const face = (id: string) => cardOf(loaded, id);
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
    return <PracticeResult ref={heading} loaded={loaded} round={round} truth={truth} perfectStreak={saved.practice.perfect[round.level]} onNext={onNext} />;
  }
  return <PracticeBoard title={LEVELS[round.level].title} era={era} widened={round.widened} hint={sameOrder(round.order, round.dealt)}>
    <SortList order={round.order} cardOf={face} onMove={onMove} />
    <div className="tl-check-bar">
      <button type="button" className="tl-primary tl-check" disabled={!canCheck} onClick={check}>Check</button>
    </div>
  </PracticeBoard>;
}

function PracticeBoard({ title, era, widened, hint, children }: { title: string; era: string; widened: boolean; hint: boolean; children: ReactNode }) {
  usePlayingClass();
  return <div className="tl-play">
    <header className="tl-head">
      <h1>Practice <span>{title} · {era}</span></h1>
    </header>
    {widened && <p className="tl-note">Not enough events at this level in this part of the story: showing some harder ones.</p>}
    {hint && <p className="tl-hint">{HINT}</p>}
    {children}
  </div>;
}
