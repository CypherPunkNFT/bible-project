// /games/odd-one-out: four Bible people, places or books; tap the one that doesn't belong and see why
// (docs/features/odd-one-out/design.md). The sets are built ahead of time (scripts/build-odd-one-out.py) and loaded
// only on this page. Rounds of ten, one tap answers, no timer; progress survives Back and reload in this tab.
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteLanguage } from "@/lib/language";
import { inSiteLanguage } from "../translated-data";
import { CHOICE_LABELS, buildRound, isAvailable, opensWithExample, seededRng, shownLabel, shuffle, type Choice,
  type Difficulty, type SetsFile } from "./game";
import { Reveal } from "./Reveal";
import { CantLoad, StartScreen, SummaryScreen } from "./Screens";
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

function Game({ data }: { data: SetsFile }) {
  const local = useMemo(() => browserStore("local"), []);
  const session = useMemo(() => browserStore("session"), []);
  const [round, setRound] = useState<RoundState | null>(() => readRound(session, data));
  const [choice, setChoice] = useState<Choice>(round?.choice ?? "person");
  const [difficulty, setDifficulty] = useState<Difficulty>(round?.difficulty ?? "easy");
  const [best, setBest] = useState(() => readBest(local));
  const update = useCallback((next: RoundState | null) => { setRound(next); saveRound(session, next); }, [session]);

  const start = useCallback((c: Choice, d: Difficulty) => {
    if (!isAvailable(data, c, d)) return;
    const seen = readSeen(local);
    const rng = seededRng(Date.now());
    const ids = buildRound(data, c, d, seen, rng, opensWithExample(data, c, d) && takeOpener(local));
    const byId = new Map(data.sets.map((set) => [set.id, set]));
    const orders = ids.map((id) => shuffle(byId.get(id)!.items, rng));
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
      saveBest(local, round.choice, round.difficulty, score);
      setBest(readBest(local));
    }
    update({ ...round, index });
  }, [round, data, local, update]);

  if (!round) {
    return <StartScreen data={data} choice={choice} difficulty={difficulty} best={best[bestKey(choice, difficulty)]}
      onChoice={(c) => { setChoice(c); if (!isAvailable(data, c, difficulty)) setDifficulty("easy"); }}
      onDifficulty={setDifficulty} onPlay={() => start(choice, difficulty)} />;
  }
  if (round.index >= round.ids.length) {
    return <SummaryScreen data={data} round={round} best={best[bestKey(round.choice, round.difficulty)] ?? 0}
      onAgain={() => start(round.choice, round.difficulty)}
      onChange={() => { setChoice(round.choice); setDifficulty(round.difficulty); update(null); }} />;
  }
  return <Puzzle data={data} round={round} onAnswer={answer} onNext={next} />;
}

/** Keys typed into a form elsewhere on the page (the site's correction form) are not answers. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || !!target.closest("input, textarea, select"));

interface PuzzleProps { data: SetsFile; round: RoundState; onAnswer: (id: string) => void; onNext: () => void }

function Puzzle({ data, round, onAnswer, onNext }: PuzzleProps) {
  const set = data.sets.find((s) => s.id === round.ids[round.index])!;
  const order = round.orders[round.index];
  const pick = round.picks[round.index];
  const answered = pick !== null;
  const score = round.ids.slice(0, round.index + (answered ? 1 : 0))
    .filter((id, n) => round.picks[n] === data.sets.find((s) => s.id === id)!.odd).length;
  const result = useRef<HTMLHeadingElement>(null);
  const first = useRef<HTMLButtonElement>(null);
  const last = round.index === round.ids.length - 1;

  useEffect(() => { if (answered) result.current?.focus(); }, [answered, round.index]);
  useEffect(() => { if (!answered) first.current?.focus({ preventScroll: true }); }, [round.index, answered]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return;
      const n = Number(event.key);
      if (!answered && n >= 1 && n <= 4) onAnswer(order[n - 1]);
      else if (answered && event.key === "Enter" && !(event.target instanceof HTMLAnchorElement)) { event.preventDefault(); onNext(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, order, onAnswer, onNext]);

  const announcement = !answered ? "" : pick === set.odd ? "Right!" : `Not quite: the odd one out was ${shownLabel(data, set, set.odd)}.`;
  return <div className="oo-puzzle">
    <div className="oo-progress">
      <span>{round.index + 1} of {round.ids.length}</span>
      <span className="oo-kind">{CHOICE_LABELS[set.kind]}</span>
      <span>Score {score}</span>
    </div>
    <h1 className="oo-prompt">Which one doesn't belong?</h1>
    <div className="oo-choices" role="group" aria-label="The four choices">
      {order.map((id, n) => {
        const state = !answered ? "" : id === set.odd ? " is-odd" : id === pick ? " is-wrong" : " is-dim";
        return <button key={id} ref={n === 0 ? first : undefined} type="button" className={`oo-choice${state}`}
          aria-disabled={answered} aria-keyshortcuts={String(n + 1)} onClick={() => onAnswer(id)}>
          <span className="oo-choice-key" aria-hidden="true">{n + 1}</span>
          <span className="oo-choice-name">{shownLabel(data, set, id)}</span>
          {answered && id === set.odd && <span className="oo-choice-mark">✓ Odd one out</span>}
          {answered && id === pick && id !== set.odd && <span className="oo-choice-mark">✗ Your answer</span>}
        </button>;
      })}
    </div>
    <p className="sr-only" aria-live="polite">{announcement}</p>
    {answered && <>
      <Reveal ref={result} data={data} set={set} order={order} pick={pick} />
      <button type="button" className="oo-primary oo-next" onClick={onNext}>
        {last ? "See results" : "Next"}<ArrowRight size={15} aria-hidden="true" />
      </button>
    </>}
  </div>;
}
