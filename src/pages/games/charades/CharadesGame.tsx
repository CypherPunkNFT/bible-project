// /games/charades: Family charades (docs/features/family-charades/design.md). One phone, one room: the phone shows a
// Bible scene, the guesser holds it to their forehead, everyone else acts, and a tilt or a tap records the answer.
// The scene list is hand-kept (src/data/charades/scenes.json) and checked against the BSB by scenes.test.ts.
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { addRecent, cryptoRandom, dealOrder, deckOffered, poolFor, type Scene, type ScenesFile } from "./deck";
import { fixMark, gameOver, newTeamGame, playedIds, recordTurn, refixLastTurn, scoreOf, teamOnTurn, type EndReason, type Round, type Row,
  type Seconds, type TeamGame, defaultTeamNames } from "./game";
import { Recap } from "./Recap";
import { RoundLayer } from "./Round";
import { startTap, tiltKnown, waitForReading } from "./sensors";
import { Setup, type TeamSetup } from "./Setup";
import { bestFor, browserStore, canSave, readSaved, readTeamGame, saveTeamGame, writeSaved, type Saved, type Settings } from "./storage";
import { FinalStandings, HandOver } from "./Teams";
import "../games.css";
import "./charades.css";

const loadScenes = () => import("@/data/charades/scenes.json").then((module) => module.default as unknown as ScenesFile);

export const TILT_DENIED = "Tilt is off because motion access was not allowed. You can play with the buttons, or reload the page and allow it.";
export const TILT_SILENT = "This device isn't sending tilt here, so use the buttons.";

export default function CharadesGame() {
  useEffect(() => { document.title = "Family charades · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const [file, setFile] = useState<ScenesFile | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setFailed(false);
    loadScenes().then((f) => { if (live) setFile(f); }).catch((error) => {
      console.warn("Family charades: the scenes did not load:", error);
      if (live) setFailed(true);
    });
    return () => { live = false; };
  }, [attempt]);
  return <div className="ch-page mx-auto max-w-3xl px-4 sm:px-6">
    <Link className="gm-back" to="/games"><ArrowLeft size={14} aria-hidden="true" />All games</Link>
    {failed ? <div className="ch-cant-load" role="alert">
      <p>The scenes could not be loaded. Check your connection and try again.</p>
      <button type="button" className="ch-primary" onClick={() => setAttempt((n) => n + 1)}>Try again</button>
    </div> : file ? <Game file={file} /> : <p className="ch-loading">Loading the scenes…</p>}
  </div>;
}

type Screen = "setup" | "handover" | "recap" | "final";
interface RoundSetup { key: number; order: string[]; seconds: Seconds; tilt: boolean; notice: string | null; settings: Settings; teamName: string | null }
interface RecapState { rows: Row[]; ended: EndReason; leftMs: number; bestBefore: number; seconds: Seconds; teamName: string | null }

/** Saved settings, with a deck that has become too small falling back to Everything and a failed tilt check starting on buttons. */
function initialSaved(saved: Saved, scenes: readonly Scene[]): Saved {
  const s = saved.settings;
  const deck = deckOffered(scenes, s.ageGroup, s.deck) ? s.deck : "everything";
  const controls = saved.tiltFailed ? { ...s.controls, guess: "buttons" as const } : s.controls;
  return { ...saved, settings: { ...s, deck, controls } };
}

function Game({ file }: { file: ScenesFile }) {
  const scenes = useMemo(() => new Map(file.scenes.map((s) => [s.id, s])), [file]);
  const local = useMemo(() => browserStore("local"), []);
  const session = useMemo(() => browserStore("session"), []);
  const saving = useMemo(() => canSave(local), [local]);
  const [saved, setSavedState] = useState(() => initialSaved(readSaved(local), file.scenes));
  const savedRef = useRef(saved);
  const setSaved = useCallback((next: Saved) => { savedRef.current = next; setSavedState(next); writeSaved(local, next); }, [local]);
  const [teamGame, setTeamGameState] = useState<TeamGame | null>(() => readTeamGame(session));
  const setTeamGame = useCallback((next: TeamGame | null) => { setTeamGameState(next); saveTeamGame(session, next); }, [session]);
  const [teams, setTeams] = useState<TeamSetup>(() => teamGame ? { on: true, names: teamGame.teams, turnsEach: teamGame.turnsEach }
    : { on: false, names: defaultTeamNames(2), turnsEach: 3 });
  // A reload during a team game comes back to the hand-over: the interrupted round's turn starts again (§6.5).
  const [screen, setScreen] = useState<Screen>(teamGame ? (gameOver(teamGame) ? "final" : "handover") : "setup");
  const [round, setRound] = useState<RoundSetup | null>(null);
  const [recap, setRecap] = useState<RecapState | null>(null);
  const [starting, setStarting] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);
  const settings = saved.settings;

  const changeSettings = (change: Partial<Settings>) => setSaved({ ...savedRef.current, settings: { ...savedRef.current.settings, ...change } });

  /** The Start tap (§5.4): everything that needs the tap is started first, synchronously; only then is anything awaited. */
  const begin = (game: TeamGame | null) => {
    if (starting) return;
    const s = savedRef.current.settings;
    const wantTilt = tiltKnown() && s.controls[s.mode] === "tilt";
    const tap = startTap({ sound: s.sound, wantTilt, guessMode: s.mode === "guess" });
    setStarting(true);
    void (async () => {
      let tilt = false;
      let notice: string | null = null;
      if (tap.permission) {
        const permission = await tap.permission;
        if (permission === "denied") notice = TILT_DENIED;
        else {
          tilt = await waitForReading();
          if (!tilt) notice = TILT_SILENT;
          if (savedRef.current.tiltFailed === tilt) setSaved({ ...savedRef.current, tiltFailed: !tilt });
        }
      }
      if (!mounted.current) return;
      setStarting(false);
      const seconds = s.seconds[s.ageGroup];
      const order = dealOrder(poolFor(file.scenes, s), savedRef.current.recent, cryptoRandom);
      setRound({ key: Date.now(), order, seconds, tilt, notice, settings: s, teamName: game ? game.teams[teamOnTurn(game)] : null });
    })();
  };

  const startFromSetup = () => {
    const game = teams.on ? newTeamGame(teams.names, teams.turnsEach) : null;
    setTeamGame(game);
    begin(game);
  };

  const endRound = useCallback((finished: Round) => {
    if (!round) return;
    const rows = finished.rows;
    const score = scoreOf(rows);
    const current = savedRef.current;
    const bestBefore = bestFor(current, round.seconds);
    setSaved({ ...current, recent: addRecent(current.recent, playedIds(rows)), best: { ...current.best, [`${round.seconds}`]: Math.max(bestBefore, score) } });
    if (teamGame) setTeamGame(recordTurn(teamGame, score));
    setRecap({ rows, ended: finished.ended ?? "time", leftMs: finished.leftMs, bestBefore, seconds: round.seconds, teamName: round.teamName });
    setRound(null);
    setScreen("recap");
  }, [round, teamGame, setSaved, setTeamGame]);

  const fix = (id: string) => {
    if (!recap) return;
    const rows = fixMark(recap.rows, id);
    const score = scoreOf(rows);
    setRecap({ ...recap, rows });
    const current = savedRef.current;
    setSaved({ ...current, best: { ...current.best, [`${recap.seconds}`]: Math.max(recap.bestBefore, score) } });
    if (teamGame) setTeamGame(refixLastTurn(teamGame, score));
  };

  const changeDeck = () => {
    if (teamGame && !gameOver(teamGame) && !window.confirm("End this team game and change the deck?")) return;
    setTeamGame(null);
    setScreen("setup");
  };

  const next = () => {
    if (!teamGame) { begin(null); return; }
    setScreen(gameOver(teamGame) ? "final" : "handover");
  };

  const newGame = () => {
    if (!teamGame) return;
    const game = newTeamGame(teamGame.teams, teamGame.turnsEach);
    setTeamGame(game);
    setScreen("handover");
  };

  const pool = poolFor(file.scenes, settings);
  return <>
    {screen === "setup" && <Setup file={file} settings={settings} teams={teams} tiltKnown={tiltKnown()} best={bestFor(saved, settings.seconds[settings.ageGroup])}
      saving={saving} notice={pool.length ? null : "This deck has no scenes."} starting={starting}
      onSettings={changeSettings} onTeams={setTeams} onStart={startFromSetup} />}
    {screen === "handover" && teamGame && <HandOver game={teamGame} starting={starting} onReady={() => begin(teamGame)} onChangeDeck={changeDeck} />}
    {screen === "final" && teamGame && <FinalStandings game={teamGame} onNewGame={newGame} onChangeDeck={changeDeck} />}
    {screen === "recap" && recap && <Recap scenes={scenes} rows={recap.rows} ended={recap.ended} leftMs={recap.leftMs}
      newBest={scoreOf(recap.rows) > recap.bestBefore} teamName={recap.teamName}
      nextLabel={teamGame ? (gameOver(teamGame) ? "Final standings" : "Next team") : null}
      onFix={fix} onNext={next} onChangeDeck={changeDeck} />}
    {round && <RoundLayer key={round.key} scenes={scenes} order={round.order} seconds={round.seconds} mode={round.settings.mode} tilt={round.tilt}
      pictures={round.settings.pictures[round.settings.ageGroup]} sound={settings.sound} littleOnes={round.settings.ageGroup === "little"}
      teamName={round.teamName} notice={round.notice} onSound={(on) => changeSettings({ sound: on })} onEnd={endRound} />}
  </>;
}
