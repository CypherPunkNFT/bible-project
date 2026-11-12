// /games/timeline: drag Bible events into the order they happened, earliest at the top
// (docs/features/timeline-sort/design.md). The events, their year windows and the order facts are built ahead of time
// (scripts/build-timeline.ts) and loaded only on this page. A set is only dealt when its order is certain.
// ?play=daily|practice reopens a mode, as in Map quest.
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createDaily, type Daily } from "./daily";
import type { TimelineSchedule } from "./daily-rules";
import { deal, type EraChoice, type Level } from "./deal";
import { DailyPlay, PracticePlay } from "./Play";
import { CantLoad, StartScreen } from "./Screens";
import { browserStore, canSave, isDone, readSaved, streakOn, writeSaved, type Saved } from "./storage";
import { prepare, type Loaded, type TimelineData } from "./text";
import "../games.css";
import "../kit";
import "./timeline.css";

const loadAll = () => Promise.all([
  import("@/data/timeline/timeline.json").then((module) => module.default as unknown as TimelineData),
  import("@/data/timeline/daily.json").then((module) => module.default as unknown as TimelineSchedule),
]);

export default function TimelineGame() {
  useEffect(() => { document.title = "Timeline sort · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const [ready, setReady] = useState<{ loaded: Loaded; daily: Daily } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setFailed(false);
    loadAll().then(([data, schedule]) => {
      if (!live) return;
      const loaded = prepare(data);
      setReady({ loaded, daily: createDaily(schedule, loaded.index) });
    }).catch((error) => {
      console.warn("Timeline sort: the game data did not load:", error);
      if (live) setFailed(true);
    });
    return () => { live = false; };
  }, [attempt]);
  return <div className="tl-page mx-auto max-w-3xl px-4 sm:px-6">
    {failed ? <><TopNav /><CantLoad onRetry={() => setAttempt((n) => n + 1)} /></>
      : ready ? <Game loaded={ready.loaded} daily={ready.daily} /> : <><TopNav /><p className="tl-loading">Loading the events…</p></>}
  </div>;
}

type Screen = "start" | "daily" | "practice";

/** The links above the game, in one row with room between them (the audit found "All games" and "Game home" run together). */
function TopNav({ onHome }: { onHome?: () => void }) {
  return <nav className="tl-nav" aria-label="Game">
    <Link className="gm-back" to="/games"><ArrowLeft size={14} aria-hidden="true" />All games</Link>
    {onHome && <button type="button" className="tl-link" onClick={onHome}>Game home</button>}
  </nav>;
}

function Game({ loaded, daily }: { loaded: Loaded; daily: Daily }) {
  const store = useMemo(() => browserStore(), []);
  const saving = useMemo(() => canSave(store), [store]);
  const [saved, setSaved] = useState<Saved>(() => readSaved(store, loaded.index, loaded.data.stamp));
  const [params, setParams] = useSearchParams();
  // Fixed while the page is open: a Daily started before midnight stays that day's puzzle until reloaded (§11.1).
  const [n] = useState(() => daily.numberOn(new Date()));
  const ids = useMemo(() => daily.eventsFor(n), [daily, n]);
  const [screen, setScreen] = useState<Screen>("start");
  const [notice, setNotice] = useState("");

  const save = useCallback((next: Saved) => { setSaved(next); writeSaved(store, next); }, [store]);
  const go = useCallback((next: Screen) => {
    setScreen(next);
    setParams(next === "start" ? {} : { play: next }, { replace: true });
    window.scrollTo?.({ top: 0 });
  }, [setParams]);

  /** A new Practice round, saved the moment it is dealt so a reload cannot re-deal it. */
  const startPractice = useCallback((level: Level, era: EraChoice, from: Saved) => {
    const dealt = deal(loaded.index, level, era, Math.random, from.practice.recent);
    if (!dealt) { setNotice("No round could be dealt for that choice. Try another level or part of the story."); return; }
    setNotice("");
    save({ ...from, practice: { ...from.practice, level, era },
      round: { mode: "practice", level, era, dealt: dealt.dealt, order: dealt.dealt, checked: false, widened: dealt.widened } });
    go("practice");
  }, [go, loaded.index, save]);

  const openPractice = useCallback((from: Saved) => {
    const round = from.round;
    if (round?.mode === "practice" && !round.checked) go("practice");
    else startPractice(from.practice.level, from.practice.era, from);
  }, [go, startPractice]);

  // A refresh or a shared link with ?play= reopens that mode, once, when the page opens.
  const [opened] = useState(() => params.get("play"));
  useEffect(() => {
    if (opened === "daily" && ids) go("daily");
    else if (opened === "practice") openPractice(saved);
  }, [opened]); // eslint-disable-line react-hooks/exhaustive-deps -- only when the page opens

  const resume = saved.round?.mode === "practice" && !saved.round.checked ? saved.round
    : saved.round?.mode === "daily" && saved.round.n === n && ids && !isDone(saved.daily.results[n]) ? saved.round : null;
  const home = <TopNav onHome={() => go("start")} />;

  if (screen === "daily" && ids) {
    return <>{home}<DailyPlay key={n} loaded={loaded} n={n} ids={ids} saved={saved} onSave={save} onPractice={() => openPractice(saved)} /></>;
  }
  if (screen === "practice" && saved.round?.mode === "practice") {
    const round = saved.round;
    return <>{home}<PracticePlay key={round.dealt.join("|")} loaded={loaded} round={round} saved={saved} onSave={save}
      onNext={() => startPractice(round.level, round.era, saved)} /></>;
  }
  return <>
    <TopNav />
    {notice && <p className="tl-note" role="alert">{notice}</p>}
    <StartScreen dailyNumber={ids ? n : null} dailyDone={isDone(saved.daily.results[n])} streak={streakOn(saved, n)} saved={saved} saving={saving}
      resume={resume} onDaily={() => go("daily")} onPractice={(level, era) => startPractice(level, era, saved)}
      onResume={() => go(resume?.mode === "daily" ? "daily" : "practice")} />
  </>;
}
