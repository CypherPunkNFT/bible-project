// /games/crossword: a crossword made from a passage or theme, with clues from the site's own people, places, verses
// and quiz questions (docs/features/bible-crossword/design.md). The clues are built ahead of time
// (scripts/build-crossword.ts) and loaded only on this page; the grid is laid out in the browser by the shared
// generator in src/lib/puzzles. No model runs while people play, and progress stays in this browser.
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteLanguage } from "@/lib/language";
import { useScrollTopOn } from "../kit";
import { emptyLetters, fitSpec, freshSeed, isSolved, makeLayout, toPuzzle, type CluesFile, type Layout, type Spec } from "./game";
import { Play } from "./Play";
import { CantLoad, StartScreen } from "./Screens";
import { browserStore, readSaved, writeSaved, type PlayState, type Saved } from "./storage";
import "../games.css";
import "./crossword.css";

const loadClues = () => import("@/data/crossword/clues.json").then((module) => module.default as unknown as CluesFile);

export default function CrosswordGame() {
  useEffect(() => { document.title = "Bible crossword · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const [data, setData] = useState<CluesFile | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setFailed(false);
    loadClues().then((clues) => { if (live) setData(clues); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [attempt]);
  return <div className="cw-page mx-auto max-w-6xl px-4 sm:px-6">
    <Link className="gm-back" to="/games"><ArrowLeft size={14} aria-hidden="true" />All games</Link>
    {failed ? <CantLoad onRetry={() => setAttempt((n) => n + 1)} />
      : data ? <Game data={data} /> : <p className="cw-loading">Loading the clues…</p>}
  </div>;
}

/** A clean solve (nothing revealed) with a known time beats the size's best when it is quicker. */
const beatsBest = (saved: Saved, game: PlayState): boolean =>
  game.revealed.length === 0 && game.seconds !== null && game.seconds > 0 && (saved.best[game.spec.size] ?? Infinity) > game.seconds;

function Game({ data }: { data: CluesFile }) {
  const store = useMemo(() => browserStore(), []);
  const puzzleOf = useCallback((layout: Layout) => toPuzzle(data, layout), [data]);
  const [saved, setSaved] = useState<Saved>(() => {
    const read = readSaved(store, data, puzzleOf);
    return { ...read, spec: fitSpec(data, read.spec) };
  });
  const [playing, setPlaying] = useState(saved.game !== null);
  const [noPuzzle, setNoPuzzle] = useState(false);
  const [bestAtStart, setBestAtStart] = useState(saved.best); // the ribbon shows when a solve beats this
  const english = useSiteLanguage() === "en";
  const puzzle = useMemo(() => (saved.game ? puzzleOf(saved.game.layout) : null), [saved.game, puzzleOf]);
  // A new screen opens at the top of the page (the audit's "landing in the wrong place" on a phone).
  useScrollTopOn(playing && saved.game ? saved.game.layout : "start");

  const save = useCallback((next: Saved) => { setSaved(next); writeSaved(store, next); }, [store]);

  const start = useCallback((spec: Spec, prepared?: Layout | null) => {
    const layout = prepared ?? makeLayout(data, spec, freshSeed());
    const made = layout && toPuzzle(data, layout);
    if (!layout || !made) { setNoPuzzle(true); setPlaying(false); return; }
    setNoPuzzle(false);
    setBestAtStart(saved.best);
    save({ ...saved, spec, game: { stamp: data.stamp, spec, layout, letters: emptyLetters(made), revealed: [], wrong: [], checks: 0, right: [], seconds: 0 } });
    setPlaying(true);
  }, [data, saved, save]);

  // Changes go through the latest saved state, so a late write (the clock on leaving the page) can never put back
  // letters that were typed over or a puzzle that was dropped in the meantime.
  const change = useCallback((game: PlayState) => {
    setSaved((prev) => {
      if (!prev.game || prev.game.layout !== game.layout) return prev;
      const made = puzzleOf(game.layout);
      const solvedBefore = made !== null && isSolved(made, prev.game.letters);
      const solvedNow = made !== null && isSolved(made, game.letters);
      const first = solvedNow && !solvedBefore;
      const best = first && beatsBest(prev, game) ? { ...prev.best, [game.spec.size]: game.seconds! } : prev.best;
      const next = { ...prev, game, solved: prev.solved + (first ? 1 : 0), best };
      writeSaved(store, next);
      return next;
    });
  }, [puzzleOf, store]);

  const newBest = saved.game !== null && saved.best[saved.game.spec.size] !== bestAtStart[saved.game.spec.size];

  if (!playing || !saved.game || !puzzle) {
    return <StartScreen data={data} spec={saved.spec} solved={saved.solved} best={saved.best} englishNote={!english} failed={noPuzzle}
      onSpec={(spec) => { setNoPuzzle(false); save({ ...saved, spec }); }} onPlay={(layout) => start(saved.spec, layout)} />;
  }
  return <Play key={JSON.stringify(saved.game.layout)} data={data} game={saved.game} puzzle={puzzle} newBest={newBest} onChange={change}
    onNew={() => start(saved.game!.spec)} onChoices={() => { save({ ...saved, game: null }); setPlaying(false); }} />;
}
