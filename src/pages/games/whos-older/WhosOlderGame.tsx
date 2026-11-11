// /games/whos-older: two Bible people, tap the one who lived first (docs/features/whos-older/design.md). The pool, the
// birth windows and the facts are built ahead of time (scripts/build-whos-older.ts) and loaded only on this page.
// A pair is only ever asked when its order is certain. Streak ends at the first miss; Relaxed has three hearts.
// The look is the redesign from its visual audit (docs/visual-audits/whos-older-redesign.md): the kit's cards and
// feedback band in the game's gold, the hourglass between the cards, a scoreboard, a result card.
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteLanguage } from "@/lib/language";
import { plural } from "@/lib/site-format";
import { FeedbackBand, useScrollTopOn } from "../kit";
import { MILESTONES, answer, buildPool, current, endsRun, newRun, next, pairOf, score, streakNow, type Difficulty, type Mode, type Pool,
  type Run, type WhosOlderData } from "./game";
import { Reading, Verdict } from "./Reveal";
import { RoundView } from "./Round";
import { CantLoad, RunOver, StartScreen } from "./Screens";
import { withEnglishLabels } from "./pairing";
import { samplePair, stayedFrom } from "./view";
import { browserStore, canSave, readSaved, saveBest, saveRun, type Best } from "./storage";
import { inSiteLanguage } from "../translated-data";
import "../games.css";
import "./whos-older.css";

const loadData = () => import("@/data/whos-older/whos-older.json").then(async (module) => {
  const english = module.default as unknown as WhosOlderData;
  return withEnglishLabels(await inSiteLanguage("whos-older/whos-older.json", english), english);
});

export default function WhosOlderGame() {
  useEffect(() => { document.title = "Who's older? · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const [data, setData] = useState<WhosOlderData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const language = useSiteLanguage(); // another language reads its copy; the run in play keeps its ids
  useEffect(() => {
    let live = true;
    setFailed(false);
    loadData().then((d) => { if (live) setData(d); }).catch((error) => {
      console.warn("Who's older: the game data did not load:", error);
      if (live) setFailed(true);
    });
    return () => { live = false; };
  }, [attempt, language]);
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
  // A restored run's best was saved as it was played, so a reload never says "New best!" again.
  const [bestBefore, setBestBefore] = useState(() => (initial.run ? initial.best[initial.run.mode] : 0));
  const sample = useMemo(() => samplePair(pool), [pool]);

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
    return <StartScreen best={best} saving={saving} resume={run && !run.over ? run : null} resumeScore={run ? score(pool, run) : 0} sample={sample}
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
  const board = useRef<HTMLDivElement>(null);
  const firstCard = useRef<HTMLButtonElement>(null);
  const answeredHere = useRef(false); // a run restored mid-reveal does not move focus on reload
  const n = run.rounds.length;

  useScrollTopOn(n);
  useEffect(() => { if (!answered) board.current?.focus({ preventScroll: true }); }, [answered, n]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return;
      if (!answered && (event.key === "1" || event.key === "ArrowLeft")) { answeredHere.current = true; onPick(round.left); }
      else if (!answered && (event.key === "2" || event.key === "ArrowRight")) { answeredHere.current = true; onPick(round.right); }
      else if (answered && (event.key === "Enter" || event.key === " ") && !isControl(event.target)) { event.preventDefault(); onNext(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, round.left, round.right, onPick, onNext]);

  const pickHere = useCallback((id: string) => { answeredHere.current = true; onPick(id); }, [onPick]);
  // After a miss the scoreboard keeps the streak reached, so it never reads 0 under "streak of 6".
  const shownScore = run.mode === "streak" ? (ended ? score(pool, run) : streakNow(pool, run)) : score(pool, run);
  const status = !answered ? undefined
    : run.mode === "streak" ? (ended ? `Run over — streak of ${score(pool, run)}` : plural(shownScore, "{n} in a row", "{n} in a row"))
    : plural(run.hearts, "{n} heart left", "{n} hearts left");
  const milestone = answered && correct ? MILESTONES[streakNow(pool, run)] : undefined;

  return <div className={`wo-play${answered ? " is-answered" : ""}`} ref={board} tabIndex={-1}>
    <RoundView ref={firstCard} run={run} round={round} left={left} right={right} answerId={pair.first.id} shownScore={shownScore}
      stayedFrom={stayedFrom(run.rounds)} lostNow={answered && !correct && run.mode === "relaxed"} milestone={milestone} onPick={pickHere} />
    <FeedbackBand className="wo-band" open={answered} tone={answered ? (correct ? "right" : "wrong") : null} focusAction={answeredHere.current}
      verdict={answered ? <Verdict pair={pair} pick={round.pick} status={status} /> : null}
      action={<button type="button" className="wo-primary wo-next" onClick={onNext}>
        {ended ? "See your result" : "Next"}<ArrowRight size={15} aria-hidden="true" />
      </button>}>
      {answered && <Reading data={pool.data} pair={pair} />}
    </FeedbackBand>
  </div>;
}
