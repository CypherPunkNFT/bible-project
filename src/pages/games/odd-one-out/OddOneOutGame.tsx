// /games/odd-one-out: four Bible people, places or books; tap the one that doesn't belong and see why
// (docs/features/odd-one-out/design.md). The sets are built ahead of time (scripts/build-odd-one-out.py) and loaded
// only on this page. Rounds of ten, one tap answers, no timer; progress survives Back and reload in this tab.
// The look is the redesign from its visual audit (docs/visual-audits/odd-one-out-redesign.md): the kit's cards that
// deal in, press and settle, the odd one edged green with its stamp, a trail of ten squares, and the verdict in the kit's band
// with Next inside it, pinned to the bottom of a phone screen. Every state changes at once; the motion only decorates.
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteLanguage } from "@/lib/language";
import { formatNumber, plural } from "@/lib/site-format";
import { AnswerCard, ConfirmDialog, FeedbackBand, ProgressTrail, StreakFlame, trailMarks, useGrew, useScrollTopOn,
  type AnswerState } from "../kit";
import { inSiteLanguage } from "../translated-data";
import { CHOICE_LABELS, DIFFICULTY_LABELS, buildRound, isAvailable, opensWithExample, seededRng, shownLabel, shuffle,
  type Choice, type Difficulty, type SetsFile } from "./game";
import { Reading, Verdict } from "./Reveal";
import { CantLoad, StartScreen, SummaryScreen, type Ending } from "./Screens";
import { bestKey, browserStore, readBest, readRound, readSeen, rememberSeen, saveBest, saveRound, takeOpener,
  type RoundState } from "./storage";
import "../games.css";
import "./odd-one-out.css";

const loadSets = () => import("@/data/odd-one-out/sets.json")
  .then((module) => inSiteLanguage("odd-one-out/sets.json", module.default as unknown as SetsFile));

export default function OddOneOutGame() {
  useEffect(() => { document.title = "Odd one out · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const [data, setData] = useState<SetsFile | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const language = useSiteLanguage(); // another language reads its copy; the round in play keeps its ids
  useEffect(() => {
    let live = true;
    setFailed(false);
    loadSets().then((sets) => { if (live) setData(sets); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [attempt, language]);
  return <div className="oo-page mx-auto max-w-3xl px-4 sm:px-6">
    <Link className="gm-back" to="/games"><ArrowLeft size={14} aria-hidden="true" />All games</Link>
    {failed ? <CantLoad onRetry={() => setAttempt((n) => n + 1)} />
      : data ? <Game data={data} /> : <p className="oo-loading">Loading the puzzles…</p>}
  </div>;
}

/** Which screen is up, for scrolling back to the top whenever it changes (never on the first draw, so a restore stays put). */
const screenKey = (round: RoundState | null) =>
  !round ? "start" : round.index >= round.ids.length ? "end" : `${round.ids[0]}:${round.index}`;

function Game({ data }: { data: SetsFile }) {
  const local = useMemo(() => browserStore("local"), []);
  const session = useMemo(() => browserStore("session"), []);
  const [round, setRound] = useState<RoundState | null>(() => readRound(session, data));
  const [choice, setChoice] = useState<Choice>(round?.choice ?? "person");
  const [difficulty, setDifficulty] = useState<Difficulty>(round?.difficulty ?? "easy");
  const [best, setBest] = useState(() => readBest(local));
  const [ending, setEnding] = useState<Ending | null>(null); // set only when a round ends here: a restored summary does not celebrate twice
  const [leaving, setLeaving] = useState(false);
  const [returned, setReturned] = useState(false); // back at the start by choice: the title takes focus
  // The puzzle a reload or Back brought back already answered: its band must not move focus or scroll.
  const restored = useRef(round && round.index < round.ids.length && round.picks[round.index] !== null ? round.ids[round.index] : null);
  const update = useCallback((next: RoundState | null) => { setRound(next); saveRound(session, next); }, [session]);
  useScrollTopOn(screenKey(round));

  const start = useCallback((c: Choice, d: Difficulty) => {
    if (!isAvailable(data, c, d)) return;
    const seen = readSeen(local);
    const rng = seededRng(Date.now());
    const ids = buildRound(data, c, d, seen, rng, opensWithExample(data, c, d) && takeOpener(local));
    const byId = new Map(data.sets.map((set) => [set.id, set]));
    const orders = ids.map((id) => shuffle(byId.get(id)!.items, rng));
    setEnding(null);
    update({ stamp: data.stamp, choice: c, difficulty: d, ids, orders, picks: ids.map(() => null), index: 0 });
  }, [data, local, update]);

  const answer = useCallback((pick: string) => {
    if (!round || round.picks[round.index] !== null) return; // the first tap locks the answer (design 14)
    const picks = round.picks.map((p, n) => (n === round.index ? pick : p));
    rememberSeen(local, [round.ids[round.index]]);
    update({ ...round, picks });
  }, [round, local, update]);

  const next = useCallback(() => {
    if (!round || round.picks[round.index] === null) return;
    const index = round.index + 1;
    if (index >= round.ids.length) {
      const byId = new Map(data.sets.map((set) => [set.id, set]));
      const score = round.ids.filter((id, n) => round.picks[n] === byId.get(id)!.odd).length;
      const bestBefore = readBest(local)[bestKey(round.choice, round.difficulty)];
      saveBest(local, round.choice, round.difficulty, score);
      setBest(readBest(local));
      setEnding({ score, bestBefore });
    }
    update({ ...round, index });
  }, [round, data, local, update]);

  const backToStart = useCallback(() => {
    if (!round) return;
    setLeaving(false);
    setChoice(round.choice);
    setDifficulty(round.difficulty);
    setReturned(true);
    update(null);
  }, [round, update]);

  if (!round) {
    return <StartScreen data={data} choice={choice} difficulty={difficulty} best={best[bestKey(choice, difficulty)]} focusTitle={returned}
      onChoice={(c) => { setChoice(c); if (!isAvailable(data, c, difficulty)) setDifficulty("easy"); }}
      onDifficulty={setDifficulty} onPlay={() => start(choice, difficulty)} />;
  }
  if (round.index >= round.ids.length) {
    return <SummaryScreen data={data} round={round} best={best[bestKey(round.choice, round.difficulty)] ?? 0} ending={ending}
      onAgain={() => start(round.choice, round.difficulty)} onChange={backToStart} />;
  }
  return <>
    <Puzzle data={data} round={round} restored={restored.current === round.ids[round.index]} dialogOpen={leaving}
      onAnswer={answer} onNext={next} onLeave={() => setLeaving(true)} />
    <ConfirmDialog open={leaving} title="Leave this round?" confirmLabel="Leave round" cancelLabel="Keep playing" danger
      onConfirm={backToStart} onCancel={() => setLeaving(false)}>
      <p className="oo-dialog-note">Your answers so far will not be kept.</p>
    </ConfirmDialog>
  </>;
}

/** Keys typed into a form elsewhere on the page (the site's correction form) are not answers. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || !!target.closest("input, textarea, select"));
/** A button, link or fold summary handles its own Enter and Space. */
const isControl = (target: EventTarget | null) => target instanceof HTMLElement && !!target.closest("button, a, summary");

interface PuzzleProps {
  data: SetsFile;
  round: RoundState;
  /** True for a puzzle a reload brought back already answered. */
  restored: boolean;
  dialogOpen: boolean;
  onAnswer: (id: string) => void;
  onNext: () => void;
  onLeave: () => void;
}

function Puzzle({ data, round, restored, dialogOpen, onAnswer, onNext, onLeave }: PuzzleProps) {
  const byId = useMemo(() => new Map(data.sets.map((set) => [set.id, set])), [data]);
  const set = byId.get(round.ids[round.index])!;
  const order = round.orders[round.index];
  const pick = round.picks[round.index];
  const answered = pick !== null;
  const right = answered && pick === set.odd;
  const results = round.ids.slice(0, round.index + (answered ? 1 : 0))
    .map((id, n) => (round.picks[n] === byId.get(id)!.odd ? "right" : "wrong") as "right" | "wrong");
  const score = results.filter((r) => r === "right").length;
  let streak = 0;
  for (let n = results.length - 1; n >= 0 && results[n] === "right"; n -= 1) streak += 1;
  const board = useRef<HTMLDivElement>(null);
  const last = round.index === round.ids.length - 1;

  useEffect(() => { if (!answered) board.current?.focus({ preventScroll: true }); }, [round.index, answered]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || dialogOpen || isTyping(event.target)) return;
      const n = Number(event.key);
      if (!answered && n >= 1 && n <= 4) onAnswer(order[n - 1]);
      else if (answered && (event.key === "Enter" || event.key === " ") && !isControl(event.target)) { event.preventDefault(); onNext(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, dialogOpen, order, onAnswer, onNext]);

  return <div ref={board} tabIndex={-1} className="oo-play">
    <div className="oo-track">
      <ProgressTrail className="oo-trail" marks={trailMarks(results, round.ids.length)} size=".85rem"
        label={plural(results.length, "{n} of 10 answered", "{n} of 10 answered")} />
      <span className="oo-count">{`${round.index + 1} of ${round.ids.length}`}</span>
      {round.choice === "mixed"
        ? <span key={set.kind} className="oo-kind">{CHOICE_LABELS[set.kind]}</span>
        : <span className="oo-kind-label"><span>{CHOICE_LABELS[round.choice]}</span><span> · </span><span>{DIFFICULTY_LABELS[round.difficulty]}</span></span>}
      <Score score={score} />
      <StreakFlame className="oo-streak" count={streak} litFrom={2} label={plural(streak, "{n} in a row", "{n} in a row")} />
      <button type="button" className="oo-leave" onClick={onLeave}>Leave round</button>
    </div>
    <h1 className="oo-prompt">Which one doesn't belong?</h1>
    <div className="oo-choices" role="group" aria-label="The four choices">
      {order.map((id, n) => {
        const state: AnswerState = !answered ? "idle" : id === set.odd ? "right" : id === pick ? "wrong" : "faded";
        return <AnswerCard key={`${round.index}-${id}`} index={n} state={state} rightMark={null} wrongMark={null}
          className={`oo-choice${state === "right" && !right ? " is-late" : ""}`}
          aria-disabled={answered} aria-keyshortcuts={String(n + 1)} onClick={() => onAnswer(id)}>
          <span className="oo-choice-key" aria-hidden="true">{n + 1}</span>
          <span className="oo-choice-name">{shownLabel(data, set, id)}</span>
          {state === "right" && <>
            <span className="oo-stamp is-right" aria-hidden="true"><Check size={13} />Odd one out</span>
            <span className="sr-only">Odd one out</span>
          </>}
          {state === "wrong" && <>
            <span className="oo-stamp is-wrong" aria-hidden="true"><X size={13} />Your pick</span>
            <span className="sr-only">Your pick</span>
          </>}
        </AnswerCard>;
      })}
    </div>
    <FeedbackBand className="oo-band" open={answered} tone={answered ? (right ? "right" : "wrong") : null} pinned="always" focusAction={!restored}
      verdict={answered ? <Verdict right={right} oddLabel={shownLabel(data, set, set.odd)} /> : null}
      action={<button type="button" className="oo-primary oo-next" onClick={onNext}>
        {last ? "See results" : "Next"}<ArrowRight size={15} aria-hidden="true" />
      </button>}>
      {answered && <Reading data={data} set={set} order={order} />}
    </FeedbackBand>
  </div>;
}

/** The score so far; the number pops each time it grows. */
function Score({ score }: { score: number }) {
  const pulse = useGrew(score);
  return <span className="oo-score" role="img" aria-label={plural(score, "{n} right", "{n} right")} data-value={score}>
    <span className="oo-score-label" aria-hidden="true">Score</span>
    <span key={pulse} className="oo-score-n" aria-hidden="true">{formatNumber(score)}</span>
  </span>;
}
