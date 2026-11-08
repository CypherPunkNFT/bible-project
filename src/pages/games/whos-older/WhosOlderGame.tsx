// /games/whos-older: two Bible people, tap the one who lived first (docs/features/whos-older/design.md). The pool, the
// birth windows and the facts are built ahead of time (scripts/build-whos-older.ts) and loaded only on this page.
// A pair is only ever asked when its order is certain. Streak ends at the first miss; Relaxed has three hearts.
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { explain } from "./explain";
import { MILESTONES, answer, buildPool, current, endsRun, newRun, next, pairOf, score, streakNow, type Difficulty, type Mode,
  type Pool, type Run, type WhosOlderData } from "./game";
import { Reveal } from "./Reveal";
import { RoundView } from "./Round";
import { CantLoad, RunOver, StartScreen } from "./Screens";
import { browserStore, canSave, readSaved, saveBest, saveRun, type Best } from "./storage";
import "../games.css";
import "./whos-older.css";

const loadData = () => import("@/data/whos-older/whos-older.json").then((module) => module.default as unknown as WhosOlderData);

export default function WhosOlderGame() {
  useEffect(() => { document.title = "Who's older? · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const [data, setData] = useState<WhosOlderData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setFailed(false);
    loadData().then((d) => { if (live) setData(d); }).catch((error) => {
      console.warn("Who's older: the game data did not load:", error);
      if (live) setFailed(true);
    });
    return () => { live = false; };
  }, [attempt]);
  return <div className="wo-page mx-auto max-w-3xl px-4 sm:px-6">
    <Link className="gm-back" to="/games"><ArrowLeft size={14} aria-hidden="true" />All games</Link>
    {failed ? <CantLoad onRetry={() => setAttempt((n) => n + 1)} />
      : data ? <Game data={data} /> : <p className="wo-loading">Loading the people…</p>}
  </div>;
}

const newSeed = () => Math.floor(Math.random() * 2 ** 31);

function Game({ data }: { data: WhosOlderData }) {
  const pool = useMemo(() => buildPool(data), [data]);
  const store = useMemo(() => browserStore(), []);
  const saving = useMemo(() => canSave(store), [store]);
  const [initial] = useState(() => readSaved(store, pool));
  const [run, setRun] = useState<Run | null>(initial.run ?? null);
  const [playing, setPlaying] = useState(initial.run?.over === true); // an ended run reopens on its run-over screen
  const [best, setBest] = useState<Best>(initial.best);
  const [bestBefore, setBestBefore] = useState(0);

  const update = useCallback((next: Run | null) => { setRun(next); saveRun(store, pool, next); }, [store, pool]);

  const start = useCallback((mode: Mode, difficulty: Difficulty) => {
    setBestBefore(best[mode]);
    update(newRun(pool, mode, difficulty, newSeed()));
    setPlaying(true);
  }, [best, pool, update]);

  const pick = useCallback((id: string) => {
    if (!run) return;
    const answered = answer(pool, run, id);
    if (answered === run) return; // the first tap locks the answer
    setBest(saveBest(store, pool, run.mode, score(pool, answered)));
    update(answered);
  }, [run, pool, store, update]);

  const advance = useCallback(() => { if (run) update(next(pool, run)); }, [run, pool, update]);

  if (!run || !playing) {
    return <StartScreen best={best} saving={saving} resume={run && !run.over ? run : null} resumeScore={run ? score(pool, run) : 0}
      onPlay={start} onResume={() => { setBestBefore(best[run!.mode]); setPlaying(true); }} />;
  }
  if (run.over) {
    return <RunOver pool={pool} run={run} best={best} newBest={score(pool, run) > bestBefore}
      onAgain={() => start(run.mode, run.difficulty)} onStart={() => { update(null); setPlaying(false); }} />;
  }
  return <Play pool={pool} run={run} onPick={pick} onNext={advance} />;
}

/** Keys typed into a form elsewhere on the page are not answers; Enter or Space on a button or link is its own click. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || !!target.closest("input, textarea, select"));
const isControl = (target: EventTarget | null) => target instanceof HTMLElement && !!target.closest("button, a, summary");

function Play({ pool, run, onPick, onNext }: { pool: Pool; run: Run; onPick: (id: string) => void; onNext: () => void }) {
  const round = current(run);
  const pair = pairOf(pool, round)!;
  const left = pool.byId.get(round.left)!;
  const right = pool.byId.get(round.right)!;
  const answered = round.pick !== null;
  const correct = round.pick === pair.first.id;
  const ended = endsRun(pool, run);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstCard = useRef<HTMLButtonElement>(null);
  const n = run.rounds.length;

  useEffect(() => { if (answered) heading.current?.focus(); }, [answered, n]);
  useEffect(() => { if (!answered) firstCard.current?.focus({ preventScroll: true }); }, [answered, n]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return;
      if (!answered && (event.key === "1" || event.key === "ArrowLeft")) onPick(round.left);
      else if (!answered && (event.key === "2" || event.key === "ArrowRight")) onPick(round.right);
      else if (answered && (event.key === "Enter" || event.key === " ") && !isControl(event.target)) { event.preventDefault(); onNext(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, round.left, round.right, onPick, onNext]);

  const shownScore = run.mode === "streak" ? streakNow(pool, run) : score(pool, run);
  const status = !answered ? undefined
    : run.mode === "streak" ? (ended ? `Run over — streak of ${score(pool, run)}` : `Streak ${shownScore}`)
    : `${run.hearts} ${run.hearts === 1 ? "heart" : "hearts"} left`;
  const milestone = answered && correct ? MILESTONES[streakNow(pool, run)] : undefined;
  const announcement = !answered ? "" : `${correct ? "Right!" : "Not this time."} ${explain(pair).text}`;

  return <div className="wo-play">
    <RoundView ref={firstCard} run={run} round={round} left={left} right={right} answerId={pair.first.id} shownScore={shownScore} onPick={onPick} />
    <p className="sr-only" aria-live="polite">{announcement}</p>
    {answered && <div className="wo-sheet">
      <Reveal ref={heading} data={pool.data} pair={pair} pick={round.pick} status={status} milestone={milestone} />
      <button type="button" className="wo-primary wo-next" onClick={onNext}>
        {ended ? "See your result" : "Next"}<ArrowRight size={15} aria-hidden="true" />
      </button>
    </div>}
  </div>;
}
