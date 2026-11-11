// /games/crossword: a crossword made from a passage or theme, with clues from the site's own people, places, verses
// and quiz questions (docs/features/bible-crossword/design.md). The clues are built ahead of time
// (scripts/build-crossword.ts) and loaded only on this page; the grid is laid out in the browser by the shared
// generator in src/lib/puzzles. No model runs while people play, and progress stays in this browser.
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteLanguage } from "@/lib/language";
import { emptyLetters, fitSpec, freshSeed, makeLayout, toPuzzle, type CluesFile, type Layout, type Spec } from "./game";
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

function Game({ data }: { data: CluesFile }) {
  const store = useMemo(() => browserStore(), []);
  const puzzleOf = useCallback((layout: Layout) => toPuzzle(data, layout), [data]);
  const [saved, setSaved] = useState<Saved>(() => {
    const read = readSaved(store, data, puzzleOf);
    return { ...read, spec: fitSpec(data, read.spec) };
  });
  const [playing, setPlaying] = useState(saved.game !== null);
  const [noPuzzle, setNoPuzzle] = useState(false);
  const english = useSiteLanguage() === "en";
  const puzzle = useMemo(() => (saved.game ? puzzleOf(saved.game.layout) : null), [saved.game, puzzleOf]);

  const save = useCallback((next: Saved) => { setSaved(next); writeSaved(store, next); }, [store]);

  const start = useCallback((spec: Spec) => {
    const layout = makeLayout(data, spec, freshSeed());
    const made = layout && toPuzzle(data, layout);
    if (!layout || !made) { setNoPuzzle(true); setPlaying(false); return; }
    setNoPuzzle(false);
    save({ ...saved, spec, game: { stamp: data.stamp, spec, layout, letters: emptyLetters(made), revealed: [], wrong: [], checks: 0 } });
    setPlaying(true);
  }, [data, saved, save]);

  const change = useCallback((game: PlayState) => {
    const solvedBefore = puzzle !== null && saved.game !== null && puzzle.cells.every((a, i) => a === null || saved.game!.letters[i] === a);
    const solvedNow = puzzle !== null && puzzle.cells.every((a, i) => a === null || game.letters[i] === a);
    save({ ...saved, game, solved: saved.solved + (solvedNow && !solvedBefore ? 1 : 0) });
  }, [puzzle, saved, save]);

  if (!playing || !saved.game || !puzzle) {
    return <StartScreen data={data} spec={saved.spec} solved={saved.solved} englishNote={!english} failed={noPuzzle}
      onSpec={(spec) => { setNoPuzzle(false); save({ ...saved, spec }); }} onPlay={() => start(saved.spec)} />;
  }
  return <Play key={JSON.stringify(saved.game.layout)} data={data} game={saved.game} puzzle={puzzle} onChange={change}
    onNew={() => start(saved.game!.spec)} onChoices={() => { save({ ...saved, game: null }); setPlaying(false); }} />;
}
