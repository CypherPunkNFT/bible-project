// /games/twenty-questions: Bible twenty questions (docs/features/twenty-questions/design.md). Guess mode: the player
// thinks of a Bible person and the site asks yes/no questions until it guesses. Reverse mode: the site thinks of one
// and the player asks from a fixed list. The game file is built ahead of time (scripts/twenty-questions/) and loaded
// only on this page. Everything saved lives on this device (storage.ts); guess mode sends one anonymous report.
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatNumber } from "@/lib/site-format";
import { GAME_ART, GameArtImage } from "../art";
import { TURNS, pickSecret, prepare, type Engine, type TqData } from "./engine";
import { GuessMode } from "./GuessMode";
import { ReverseMode } from "./ReverseMode";
import { browserStore, readSaved, save, soften, type Game, type Level, type Saved } from "./storage";
import "../games.css";
import "./twenty-questions.css";

const loadData = () => import("@/data/twenty-questions/twenty-questions.json").then((m) => m.default as unknown as TqData);

export default function TwentyQuestionsGame() {
  useEffect(() => { document.title = "Bible twenty questions · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setFailed(false);
    loadData().then((data) => { if (live) setEngine(prepare(data)); }).catch((error: unknown) => {
      console.warn("Twenty questions: the game file did not load:", error);
      if (live) setFailed(true);
    });
    return () => { live = false; };
  }, [attempt]);
  return <div className="tq-page mx-auto max-w-3xl px-4 sm:px-6">
    <Link className="gm-back" to="/games"><ArrowLeft size={14} aria-hidden="true" />All games</Link>
    {failed ? <div className="tq-result" role="alert">
      <p className="tq-lede">The game couldn't load. Check your connection and try again.</p>
      <button type="button" className="tq-primary" onClick={() => setAttempt((n) => n + 1)}>Retry</button>
    </div> : engine ? <Play engine={engine} /> : <p className="tq-loading">Loading the people…</p>}
  </div>;
}

const newSeed = () => Math.floor(Math.random() * 2 ** 31);
type Record_ = Omit<Saved, "dropped">;

/** Counts a game once when it ends, and takes the count back if "Actually, that wasn't my person" reopens it. */
function retally(saved: Record_, before: Game | null, after: Game | null): Record_["totals"] {
  const t = { ...saved.totals };
  const site = (g: Game) => (g.mode === "guess") === (g.over === "won"); // guess-mode win or reverse-mode loss
  if (before && !before.over && after?.over) {
    t.played++;
    if (site(after)) t.siteWon++; else t.playerWon++;
  } else if (before?.over && after && !after.over && before.seed === after.seed) {
    t.played = Math.max(0, t.played - 1);
    if (site(before)) t.siteWon = Math.max(0, t.siteWon - 1); else t.playerWon = Math.max(0, t.playerWon - 1);
  }
  return t;
}

function Play({ engine }: { engine: Engine }) {
  const store = useMemo(() => browserStore(), []);
  const [initial] = useState(() => readSaved(store, engine));
  // An ended game is not reopened: its report already went when the page closed (GuessMode.tsx).
  const [saved, setSaved] = useState<Record_>(() => ({ ...initial, game: initial.game?.over ? null : initial.game }));
  const [playing, setPlaying] = useState(false);
  const softened = useMemo(() => new Set(saved.softened), [saved.softened]);

  const commit = useCallback((next: Record_) => { setSaved(next); save(store, engine, next); }, [store, engine]);
  const setGame = useCallback((game: Game | null) => {
    setSaved((current) => {
      const next = { ...current, game, totals: retally(current, current.game, game) };
      save(store, engine, next);
      return next;
    });
  }, [store, engine]);

  const startGuess = useCallback(() => { setGame({ mode: "guess", seed: newSeed(), turns: [], limit: TURNS, over: null }); setPlaying(true); }, [setGame]);
  const startReverse = useCallback((level: Level) => {
    const secret = pickSecret(engine, level, saved.recent, Math.random());
    commit({ ...saved, recent: [...saved.recent, engine.data.people[secret].id].slice(-30),
      game: { mode: "reverse", seed: newSeed(), level, secret, moves: [], over: null } });
    setPlaying(true);
  }, [engine, saved, commit]);
  const quit = useCallback(() => { setGame(null); setPlaying(false); }, [setGame]);

  const game = saved.game;
  if (!playing || !game) {
    return <Start engine={engine} saved={saved} dropped={initial.dropped} onGuess={startGuess} onReverse={startReverse}
      onResume={game ? () => setPlaying(true) : null} onReset={() => commit({ ...saved, softened: [] })} />;
  }
  if (game.mode === "guess") {
    return <GuessMode engine={engine} game={game} softened={softened} onUpdate={setGame} onQuit={quit} onPlayAgain={startGuess}
      onSwap={() => startReverse("easy")}
      onSoften={(person, tag) => setSaved((current) => { const next = { ...current, softened: soften(current.softened, person, tag) }; save(store, engine, next); return next; })} />;
  }
  return <ReverseMode engine={engine} game={game} onUpdate={setGame} onQuit={quit} onPlayAgain={() => startReverse(game.level)} onSwap={startGuess} />;
}

interface StartProps {
  engine: Engine;
  saved: Record_;
  dropped: boolean;
  onGuess: () => void;
  onReverse: (level: Level) => void;
  onResume: (() => void) | null;
  onReset: () => void;
}

function Start({ engine, saved, dropped, onGuess, onReverse, onResume, onReset }: StartProps) {
  const [level, setLevel] = useState<Level>("easy");
  const [reset, setReset] = useState(false);
  const { totals } = saved;
  const tier1 = engine.data.people.filter((p) => p.t === 1).length;
  return <div className="tq-start">
    <GameArtImage art={GAME_ART.twentyQuestions} className="tq-art" />
    <h1>Bible twenty questions</h1>
    <p className="tq-lede">Think of a person from the Bible. Don't tell anyone. I'll try to guess who it is in 20 questions.</p>
    <p className="tq-small">Real people from the Bible, from Adam to the early church. Not angels.</p>
    {dropped && <p className="tq-small" role="status">Your unfinished game was from an older version of the game, so it was set aside.</p>}
    {onResume && <button type="button" className="tq-primary tq-continue" onClick={onResume}>Continue your game</button>}
    <div className="tq-modes">
      <div className="tq-mode">
        <button type="button" className={onResume ? "tq-secondary" : "tq-primary"} onClick={onGuess}>I think, you guess</button>
        <p>You think of someone; the site asks yes or no questions.</p>
      </div>
      <div className="tq-mode">
        <button type="button" className="tq-secondary" onClick={() => onReverse(level)}>You ask the questions</button>
        <p>The site thinks of someone; you have 20 turns to find out who.</p>
        <fieldset className="tq-level">
          <legend>How hard</legend>
          {(["easy", "hard"] as const).map((l) => <label key={l}>
            <input type="radio" name="tq-level" value={l} checked={level === l} onChange={() => setLevel(l)} />
            {l === "easy" ? `Easy (${tier1} well-known people)` : `Hard (all ${engine.data.people.length})`}
          </label>)}
        </fieldset>
      </div>
    </div>
    {totals.played > 0 && <p className="tq-small">{`Played ${formatNumber(totals.played)} · the site guessed ${formatNumber(totals.siteWon)} · you won ${formatNumber(totals.playerWon)}`}</p>}
    <details className="tq-how">
      <summary>How does it guess?</summary>
      <p>Every person in this game has a list of facts from the Bible, each checked against a verse. Before each question I count
        how many of the people still possible would answer yes, and I ask the question that splits them closest to half and half.
        Twenty perfect questions could tell a million people apart. "Don't know" is always fine: it never rules anyone out. If you
        make one mistake I can usually still find your person. When I lose, you can tell me who it was, and that helps the game get better.</p>
      <p>At the end of a game where you thought of someone, the site sends one anonymous note: who it was and your answers. No
        name, no account, nothing you typed. It helps the questions get better. When you ask the questions, nothing is sent.</p>
      {saved.softened.length > 0 && !reset && <button type="button" className="tq-quiet" onClick={() => { onReset(); setReset(true); }}>
        Reset what the game learned on this device</button>}
      {reset && <p className="tq-small" role="status">Done: this device uses the game's own notes again.</p>}
    </details>
  </div>;
}
