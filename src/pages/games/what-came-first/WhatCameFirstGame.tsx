// /games/what-came-first: two things from the Bible, tap the one that came first, in eight kinds of round or all mixed
// (docs/features/what-came-first/design.md). It grew out of Who's older?, whose old address forwards here with Who lived
// first chosen. The data is built ahead of time (scripts/build-what-came-first.ts) and loaded only on this page. A pair
// is only ever asked when its order is certain. Streak ends at the first miss; Relaxed has three hearts. The look is
// Who's older?'s approved redesign (docs/visual-audits/whos-older-redesign.md): the kit's cards and feedback band in the
// game's gold, the hourglass between the cards, a scoreboard, a result card; each kind of round adds one accent.
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSiteLanguage } from "@/lib/language";
import { plural } from "@/lib/site-format";
import { FeedbackBand, useScrollTopOn } from "../kit";
import { DEFAULT_CHOICE, isChoice, type Choice } from "./categories";
import { ChoiceRoundView } from "./ChoiceRound";
import { MILESTONES, answer, answersOf, askedAll, current, endsRun, isPairRound, newRun, next, pairOf, questionOf, score, streakNow, type Difficulty,
  type Mode, type PairRound, type Run } from "./game";
import { loadPools } from "./load";
import type { Pools } from "./pool";
import { ChoiceReading, Reading, Verdict } from "./Reveal";
import { RoundView } from "./Round";
import { CantLoad, RunOver, StartScreen } from "./Screens";
import { bestOf, browserStore, canSave, readSaved, runFits, saveBest, saveChoice, saveRun, type Bests, type Store } from "./storage";
import { stayedFrom } from "./view";
import "../games.css";
import "./what-came-first.css";

export default function WhatCameFirstGame() {
  useEffect(() => { document.title = "What came first? · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const [pools, setPools] = useState<Pools | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const language = useSiteLanguage(); // another language reads its copy; the run in play keeps its ids
  useEffect(() => {
    let live = true;
    setFailed(false);
    loadPools().then((p) => { if (live) setPools(p); }).catch((error) => {
      console.warn("What came first: the game data did not load:", error);
      if (live) setFailed(true);
    });
    return () => { live = false; };
  }, [attempt, language]);
  return <div className="wo-page mx-auto max-w-3xl px-4 sm:px-6">
    <Link className="gm-back" to="/games"><ArrowLeft size={14} aria-hidden="true" />All games</Link>
    {failed ? <CantLoad onRetry={() => setAttempt((n) => n + 1)} />
      : pools ? <Game pools={pools} /> : <p className="wo-loading">Loading the game…</p>}
  </div>;
}

const newSeed = () => Math.floor(Math.random() * 2 ** 31);

/** The pill to open on: the address's ?c=, else the last one chosen, else Mixed (owner, 2026-11-12). */
function openingChoice(asked: string | null, saved: Choice | undefined): Choice {
  return isChoice(asked) ? asked : saved ?? DEFAULT_CHOICE;
}

function Game({ pools }: { pools: Pools }) {
  const store = useMemo<Store | null>(() => browserStore(), []);
  const saving = useMemo(() => canSave(store), [store]);
  const [params, setParams] = useSearchParams();
  const [initial] = useState(() => {
    const saved = readSaved(store);
    const run = saved.run && runFits(saved.run, pools) ? saved.run : undefined;
    if (saved.run && !run) saveRun(store, null); // made from older data: dropped, the bests stay
    return { ...saved, run };
  });
  const [choice, setChoice] = useState<Choice>(() => openingChoice(params.get("c"), initial.choice));
  const [run, setRun] = useState<Run | null>(initial.run ?? null);
  const [playing, setPlaying] = useState(initial.run?.over === true); // an ended run reopens on its run-over screen
  const [bests, setBests] = useState<Bests>(initial.best);
  // A restored run's best was saved as it was played, so a reload never says "New best!" again.
  const [bestBefore, setBestBefore] = useState(() => (initial.run ? bestOf(initial.best, initial.run.choice)[initial.run.mode] : 0));

  const choose = useCallback((next: Choice) => {
    setChoice(next);
    saveChoice(store, next);
    setParams((p) => { const q = new URLSearchParams(p); q.set("c", next); return q; }, { replace: true });
  }, [store, setParams]);

  const update = useCallback((next: Run | null) => { setRun(next); saveRun(store, next); }, [store]);

  const start = useCallback((on: Choice, mode: Mode, difficulty: Difficulty) => {
    const fresh = newRun(pools, on, mode, difficulty, newSeed());
    if (!fresh) return;
    setBestBefore(bestOf(bests, on)[mode]);
    update(fresh);
    setPlaying(true);
  }, [bests, pools, update]);

  const pick = useCallback((value: string | number) => {
    if (!run) return;
    const answered = answer(pools, run, value);
    if (answered === run) return; // the first tap locks the answer
    setBests(saveBest(store, run.choice, run.mode, score(pools, answered)));
    update(answered);
  }, [run, pools, store, update]);

  const advance = useCallback(() => { if (run) update(next(pools, run)); }, [run, pools, update]);

  if (!run || !playing) {
    return <StartScreen choice={choice} onChoose={choose} best={bestOf(bests, choice)} saving={saving}
      resume={run && !run.over ? run : null} resumeScore={run ? score(pools, run) : 0}
      onPlay={(mode, difficulty) => start(choice, mode, difficulty)}
      onResume={() => { setBestBefore(bestOf(bests, run!.choice)[run!.mode]); setPlaying(true); }} />;
  }
  if (run.over) {
    return <RunOver pools={pools} run={run} best={bestOf(bests, run.choice)} newBest={score(pools, run) > bestBefore}
      onAgain={() => start(run.choice, run.mode, run.difficulty)} onStart={() => { update(null); setPlaying(false); }} />;
  }
  return <Play pools={pools} run={run} onPick={pick} onNext={advance} />;
}

/** Keys typed into a form elsewhere on the page are not answers; Enter or Space on a button or link is its own click. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || !!target.closest("input, textarea, select"));
const isControl = (target: EventTarget | null) => target instanceof HTMLElement && !!target.closest("button, a, summary");

/** The answer a key stands for in this round, or null: 1/← and 2/→ for two cards, 1–4 for Bible Firsts. */
function keyPick(run: Run, key: string): string | number | null {
  const round = current(run);
  if (isPairRound(round)) return key === "1" || key === "ArrowLeft" ? round.left : key === "2" || key === "ArrowRight" ? round.right : null;
  const n = Number(key);
  return Number.isInteger(n) && n >= 1 && n <= round.order.length ? round.order[n - 1] : null;
}

function Play({ pools, run, onPick, onNext }: { pools: Pools; run: Run; onPick: (value: string | number) => void; onNext: () => void }) {
  const round = current(run);
  const pair = pairOf(pools, round);
  const question = questionOf(pools, round);
  const answered = round.pick !== null;
  const correct = answered && (pair ? round.pick === pair.first.id : round.pick === 0);
  const ended = endsRun(pools, run);
  const board = useRef<HTMLDivElement>(null);
  const firstCard = useRef<HTMLButtonElement>(null);
  const answeredHere = useRef(false); // a run restored mid-reveal does not move focus on reload
  const n = run.rounds.length;

  useScrollTopOn(n);
  useEffect(() => { if (!answered) board.current?.focus({ preventScroll: true }); }, [answered, n]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return;
      const value = answered ? null : keyPick(run, event.key);
      if (value !== null) { answeredHere.current = true; onPick(value); }
      else if (answered && (event.key === "Enter" || event.key === " ") && !isControl(event.target)) { event.preventDefault(); onNext(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, run, onPick, onNext]);

  const pickHere = useCallback((value: string | number) => { answeredHere.current = true; onPick(value); }, [onPick]);
  // After a miss the scoreboard keeps the streak reached, so it never reads 0 under "streak of 6".
  const shownScore = run.mode === "streak" ? (ended ? score(pools, run) : streakNow(pools, run)) : score(pools, run);
  const status = !answered ? undefined
    : run.mode === "streak" ? (ended ? `Run over — streak of ${score(pools, run)}` : plural(shownScore, "{n} in a row", "{n} in a row"))
    : plural(run.hearts, "{n} heart left", "{n} hearts left");
  const milestone = answered && correct ? MILESTONES[streakNow(pools, run)] : undefined;
  const lostNow = answered && !correct && run.mode === "relaxed";
  const pairRounds = run.rounds.filter((r): r is PairRound => isPairRound(r));
  const sameKindBefore = run.choice !== "mixed" && run.rounds.length >= 2; // Mixed deals a fresh pair every round
  const last = ended || askedAll(pools, run);

  if (!pair && !question) return null; // never happens: a saved run is checked against the data before it is shown
  return <div className={`wo-play${answered ? " is-answered" : ""}`} ref={board} tabIndex={-1}>
    {pair && isPairRound(round)
      ? <RoundView ref={firstCard} pool={pools[round.category]!} run={run} round={round} answerId={pair.first.id} shownScore={shownScore}
        stayedFrom={sameKindBefore ? stayedFrom(pairRounds) : null} lostNow={lostNow} milestone={milestone} onPick={pickHere} />
      : <ChoiceRoundView ref={firstCard} run={run} round={round as Extract<typeof round, { category: "firsts" }>} question={question!}
        shownScore={shownScore} lostNow={lostNow} milestone={milestone} onPick={pickHere} />}
    <FeedbackBand className="wo-band" open={answered} tone={answered ? (correct ? "right" : "wrong") : null} focusAction={answeredHere.current}
      verdict={answered ? <Verdict right={correct} label={pair ? pair.first.label : answersOf(question!)[0]} status={status} choice={!pair} /> : null}
      action={<button type="button" className="wo-primary wo-next" onClick={onNext}>
        {last ? "See your result" : "Next"}<ArrowRight size={15} aria-hidden="true" />
      </button>}>
      {answered && (pair && isPairRound(round) ? <Reading pool={pools[round.category]!} pair={pair} />
        : <ChoiceReading books={pools.firsts!.books} question={question!} />)}
    </FeedbackBand>
  </div>;
}
