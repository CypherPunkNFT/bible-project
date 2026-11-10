// /games/hot-seat: Hot seat (docs/features/hot-seat/design.md). One phone, one room: a player sits in the hot seat and
// answers rapid-fire questions from the question bank for 60 seconds while someone else reads them off this phone and
// taps Right, Wrong or Pass. Turns rotate round the room; the session leaderboard is kept on the phone. Everything runs
// in this browser: no server, no accounts, no AI, nothing generated.
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Link } from "react-router-dom";
import { loadQuestionBank, type QuestionBank } from "@/lib/data";
import { useSiteLanguage } from "@/lib/language";
import { releaseWakeLock, requestWakeLock } from "../charades/sensors";
import { unlockSound } from "../charades/sound";
import { Countdown } from "./Countdown";
import { addSeen, drawNext, type FrozenQuestion } from "./deal";
import { Final } from "./Final";
import { askedIds, cutName, isOver, newSession, nextUp, reduce, roundOrder, scoreOf, styleFor, suggestedReader, type Action, type Asked, type Mark,
  type Session, type Settings, type Turn } from "./game";
import { Handover } from "./Handover";
import { HowToPlay } from "./HowToPlay";
import { MenuSheet } from "./MenuSheet";
import { poolFor, poolSizes, poolsOf, type Group, type Pools } from "./pool";
import { Recap } from "./Recap";
import { Setup, type ResumeOffer, type RosterRow } from "./Setup";
import { BetweenTurns } from "./Standings";
import { recordKey, standings } from "./leaderboard";
import { browserStore, canSave, readPrefs, readSeen, readSession, writePrefs, writeSeen, writeSession, type Prefs, type SavedSession } from "./storage";
import { TurnScreen } from "./Turn";
import "../games.css";
import "./hot-seat.css";

// Written again from Bible Jeopardy's useBank (JeopardyGame.tsx, not exported): re-runs on a change of site language
// and on Try again; loadQuestionBank forgets a failed load, so a retry fetches again. A loaded bank is kept while a
// language change reloads it.
function useBank() {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const language = useSiteLanguage();
  useEffect(() => {
    let live = true;
    setFailed(false);
    loadQuestionBank().then((value) => { if (live) setBank(value); }).catch((error) => {
      console.warn("Hot seat: the question bank did not load:", error);
      if (live) setFailed(true);
    });
    return () => { live = false; };
  }, [attempt, language]);
  return { bank, failed, retry: () => setAttempt((n) => n + 1) };
}

export default function HotSeatGame() {
  useEffect(() => { document.title = "Hot seat · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const { bank, failed, retry } = useBank();
  const pools = useMemo(() => (bank ? poolsOf(bank.questions) : null), [bank]);
  return <div className="hs-page mx-auto max-w-3xl px-4 sm:px-6">
    <Link className="gm-back" to="/games"><ArrowLeft size={14} aria-hidden="true" />All games</Link>
    <Game pools={pools} status={pools ? "ready" : failed ? "failed" : "loading"} retry={retry} />
  </div>;
}

const blankRoster = (): RosterRow[] => [{ name: "", group: "adults" }, { name: "", group: "adults" }];
const nameOf = (s: Session, id: string) => s.players.find((p) => p.id === id)?.name ?? "";

function resumeOffer(saved: SavedSession | null): ResumeOffer | null {
  if (!saved) return null;
  const s = saved.session;
  const leaders = standings(s).filter((r) => r.place === 1 && r.total > 0).map((r) => r.player.name);
  const up = nextUp(s);
  return { round: s.current?.round ?? up?.round ?? s.rounds, rounds: s.rounds, leaders };
}

interface GameProps { pools: Pools | null; status: "loading" | "failed" | "ready"; retry: () => void }

function Game({ pools, status, retry }: GameProps) {
  const store = useMemo(() => browserStore(), []);
  const [saving, setSaving] = useState(() => canSave(store));
  const [prefs, setPrefsState] = useState<Prefs>(() => readPrefs(store));
  const setPrefs = (next: Prefs) => { setPrefsState(next); if (!writePrefs(store, next)) setSaving(false); };
  const [seen, setSeen] = useState(() => readSeen(store));
  const [offer, setOffer] = useState(() => readSession(store));
  const [session, setSessionState] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const [roster, setRoster] = useState<RosterRow[]>(() => (prefs.roster.length ? prefs.roster : blankRoster()));
  const [countdown, setCountdown] = useState(false);
  const [between, setBetween] = useState(false);
  const [paused, setPaused] = useState(false);
  const [menu, setMenu] = useState(false);
  const [help, setHelp] = useState(false);

  const commit = useCallback((next: Session | null) => {
    sessionRef.current = next;
    setSessionState(next);
    if (!writeSession(store, next)) setSaving(false);
  }, [store]);
  const dispatch = (action: Action) => {
    const current = sessionRef.current;
    if (!current) return;
    const next = reduce(current, action);
    if (next !== current) commit(next);
  };

  const active = !!session && !isOver(session);
  // The screen is kept awake while a game is on; the browser drops the lock whenever the page is hidden, so it is asked for again.
  useEffect(() => {
    if (!active) return;
    const onVisibility = () => { if (document.visibilityState === "visible") void requestWakeLock(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { document.removeEventListener("visibilitychange", onVisibility); releaseWakeLock(); };
  }, [active]);

  const draw = (s: Session, turn: Pick<Turn, "group" | "testament" | "style"> & { questions: readonly Asked[] }): FrozenQuestion | null => {
    if (!pools) return null;
    return drawNext({ pool: poolFor(pools, turn.group, turn.testament), asked: askedIds(s), seen, turn: turn.questions.map((a) => a.q),
      warmUp: turn.group === "adults" && turn.questions.length < 2, twoChoices: turn.style === "two", random: Math.random });
  };

  const startGame = () => {
    const players = roster.map((r, i) => ({ name: cutName(r.name) || `Player ${i + 1}`, group: r.group }));
    setPrefs({ ...prefs, roster: roster.map((r) => ({ name: cutName(r.name), group: r.group })) });
    commit(newSession(players, prefs.settings, prefs.rounds));
    setOffer(null);
    setBetween(false);
    setPaused(false);
    void requestWakeLock();
  };

  /** The Start tap: sound and the wake lock are started inside the tap, as iPhones require. */
  const startTurn = () => {
    const s = sessionRef.current;
    if (!s || !pools || countdown) return;
    if (s.settings.sound) unlockSound();
    void requestWakeLock();
    setCountdown(true);
  };

  const countdownDone = () => {
    setCountdown(false);
    const s = sessionRef.current;
    const up = s && nextUp(s);
    if (!s || !up) return;
    const turn = { group: up.player.group, testament: s.settings.testament, style: styleFor(up.player.group, s.settings.twoChoices), questions: [] };
    dispatch({ type: "start", first: draw(s, turn) });
  };

  const mark = (value: Mark, leftMs: number) => {
    const s = sessionRef.current;
    const turn = s?.current;
    if (!s || !turn) return;
    // Only a live turn draws: the question on screen at the buzzer is the last one (§4.3).
    const questions = turn.questions.map((a, i) => (i === turn.questions.length - 1 ? { ...a, mark: value } : a));
    const next = turn.phase === "live" ? draw(s, { ...turn, questions }) : null;
    dispatch({ type: "mark", mark: value, next, leftMs });
  };

  const saveTurn = () => {
    const s = sessionRef.current;
    const turn = s?.current;
    if (!s || !turn || turn.phase !== "recap") return;
    const key = recordKey(turn.group, turn.seconds, turn.style);
    const score = scoreOf(turn.questions);
    if (score > (prefs.records[key] ?? 0)) setPrefs({ ...prefs, records: { ...prefs.records, [key]: score } });
    const ids = [...turn.discarded, ...turn.questions.map((a) => a.q.id)];
    const nextSeen = addSeen(seen, ids);
    writeSeen(store, nextSeen);
    setSeen(nextSeen);
    dispatch({ type: "save" });
    setBetween(true);
  };

  const pause = (leftMs: number) => { dispatch({ type: "time", leftMs }); setPaused(true); };
  const resume = () => {
    if (sessionRef.current?.settings.sound) unlockSound();
    void requestWakeLock();
    setPaused(false);
  };

  const carryOn = () => {
    if (!offer) return;
    const s = offer.session;
    commit(s);
    setOffer(null);
    setBetween(false);
    // A reloaded turn comes back paused, question hidden; the Resume tap also wakes the sound again.
    setPaused(!!s.current && s.current.phase !== "recap");
    void requestWakeLock();
  };
  const startFresh = () => { writeSession(store, null); setOffer(null); };

  const changeSettings = (change: Partial<Settings>) => setPrefs({ ...prefs, settings: { ...prefs.settings, ...change } });
  const endGame = () => { dispatch({ type: "end" }); setMenu(false); setPaused(false); setCountdown(false); setBetween(false); };
  const changePlayers = () => {
    const s = sessionRef.current;
    if (s) setRoster(s.players.filter((p) => !p.left).map((p) => ({ name: p.name, group: p.group })));
    commit(null);
    setBetween(false);
  };

  const sizes = useMemo(() => (pools ? poolSizes(pools, prefs.settings.testament) : null), [pools, prefs.settings.testament]);
  const waiting: ReactNode = status === "failed" ? <div className="hs-cant-load" role="alert">
    <p>The questions could not be loaded.</p>
    <button type="button" className="hs-secondary" onClick={retry}>Try again</button>
  </div> : <p className="hs-note" role="status">Loading questions…</p>;
  const sheets = <>
    {menu && session && <MenuSheet session={session} onClose={() => setMenu(false)}
      onAddPlayer={(name: string, group: Group) => dispatch({ type: "add-player", name: cutName(name) || `Player ${session.players.length + 1}`, group })}
      onRemovePlayer={(id) => dispatch({ type: "remove-player", id })} onSetGroup={(id, group) => dispatch({ type: "set-group", id, group })}
      onSettings={(change) => { dispatch({ type: "settings", settings: change }); changeSettings(change); }} onHow={() => setHelp(true)} onEnd={endGame} />}
    {help && <HowToPlay onClose={() => setHelp(false)} />}
  </>;

  if (!session) {
    return <>
      <Setup roster={roster} settings={prefs.settings} rounds={prefs.rounds} sizes={sizes} status={status} saving={saving} resume={resumeOffer(offer)}
        onRoster={setRoster} onSettings={changeSettings} onRounds={(rounds) => setPrefs({ ...prefs, rounds })} onRetry={retry}
        onCarryOn={carryOn} onStartFresh={startFresh} onStart={startGame} onHow={() => setHelp(true)} />
      {sheets}
    </>;
  }

  const up = nextUp(session);
  const over = isOver(session);
  let layer: ReactNode = null;
  const turn = session.current;
  if (turn && turn.phase === "recap") {
    layer = <Recap turn={turn} playerName={nameOf(session, turn.playerId)} recordBefore={prefs.records[recordKey(turn.group, turn.seconds, turn.style)] ?? 0}
      onFix={(index) => dispatch({ type: "fix", index })} onSave={saveTurn} />;
  } else if (turn) {
    layer = <TurnScreen turn={turn} playerName={nameOf(session, turn.playerId)} paused={paused} sound={session.settings.sound} canResume={!!pools} waiting={waiting}
      onMark={mark} onUndo={(leftMs) => dispatch({ type: "undo", leftMs })} onTime={(leftMs) => dispatch({ type: "time", leftMs })}
      onTimeUp={() => dispatch({ type: "time-up" })} onClose={() => dispatch({ type: "close" })} onPause={pause} onResume={resume} onMenu={() => setMenu(true)} />;
  } else if (countdown && up) {
    layer = <Countdown sound={session.settings.sound} onDone={countdownDone} />;
  } else if (between) {
    layer = <BetweenTurns session={session} rows={standings(session)} nextName={over || !up ? null : up.player.name} onNext={() => setBetween(false)} />;
  } else if (up) {
    const order = roundOrder(session, up.round);
    layer = <Handover round={up.round} rounds={session.rounds} position={order.findIndex((p) => p.id === up.player.id) + 1} ofTurns={order.length}
      player={up.player} reader={suggestedReader(session)} seconds={session.settings.seconds} ready={!!pools} waiting={waiting}
      onStart={startTurn} onSkip={() => dispatch({ type: "skip" })} onStandings={() => setBetween(true)} onMenu={() => setMenu(true)} />;
  }
  return <>
    {over && !layer && <Final session={session} onAnotherRound={() => dispatch({ type: "add-round" })} onNewGame={() => dispatch({ type: "new-game" })}
      onChangePlayers={changePlayers} />}
    {layer && <Layer>{layer}</Layer>}
    {sheets}
  </>;
}

/** The fixed full-screen layer over the page (§6): it takes focus and stops the page behind it scrolling. */
function Layer({ children }: { children: ReactNode }) {
  const layer = useRef<HTMLDivElement>(null);
  useLayerFocus(layer);
  return <div ref={layer} className="hs-layer" role="dialog" aria-modal="true" aria-label="Hot seat game" tabIndex={-1}>
    <div className="hs-layer-inner">{children}</div>
  </div>;
}

function useLayerFocus(layer: RefObject<HTMLDivElement>) {
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    layer.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [layer]);
}
