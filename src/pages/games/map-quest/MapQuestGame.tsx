// /games/map-quest: Map quest (BibleProject/APPROVED-IDEAS.md entry 17; design: docs/features/map-quest/design.md).
// A Bible place is named, the player drops a pin on a blank map, and the closer the pin the more points. Every screen is
// state inside this one page (the hub gives a game one address); the chosen mode is mirrored in ?play= so a refresh or
// a shared link reopens it. The Daily Five is saved in this browser as it is played.
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DAILY } from "./data";
import { dailyGame, disputedGame, pickFromResult, playParams, practiceGame, readPlay, resultsFromPicks, type Game, type Mode, type Result } from "./game";
import { Home } from "./Home";
import { useNow } from "./use-now";
import { Play } from "./Play";
import type { Era, Level } from "./pools";
import { finishDaily, readStats, recordPick, startDaily, writeStats, type Stats } from "./storage";
import "../games.css";
import "./map-quest.css";

interface Session { game: Game; resume: Result[]; round: number }

export default function MapQuestGame() {
  useEffect(() => { document.title = "Map quest · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const [params, setParams] = useSearchParams();
  const [stats, setStats] = useState<Stats>(readStats);
  const [session, setSession] = useState<Session | null>(null);
  const now = useNow();

  // Every change re-reads what is stored first, so a second tab's pins are never overwritten.
  const update = (change: (fresh: Stats) => Stats) => {
    const next = change(readStats());
    writeStats(next);
    setStats(next);
    return next;
  };

  const start = (mode: Mode, level: Level, era: Era) => {
    setParams(playParams(mode, level, era), { replace: true });
    if (mode === "practice") return setSession((s) => ({ game: practiceGame(level, era), resume: [], round: (s?.round ?? 0) + 1 }));
    if (mode === "disputed") return setSession((s) => ({ game: disputedGame(), resume: [], round: (s?.round ?? 0) + 1 }));
    const n = DAILY.numberOn(new Date()); // fixed for this game: one started before midnight finishes as that day's
    const game = dailyGame(n);
    if (!game) return home();
    const saved = update((fresh) => startDaily(fresh, n, game.questions.map((q) => q.id)));
    setSession((s) => ({ game, resume: resultsFromPicks(game, saved.today?.picks ?? []), round: (s?.round ?? 0) + 1 }));
  };

  const home = () => {
    setParams({}, { replace: true });
    setSession(null);
  };

  // A refresh or a shared link with ?play= reopens that mode, once, when the page opens.
  const [opened] = useState(() => readPlay(params));
  const startRef = useRef(start);
  startRef.current = start;
  useEffect(() => { if (opened) startRef.current(opened.mode, opened.level, opened.era); }, [opened]);

  const onConfirm = (result: Result) => {
    const game = session?.game;
    if (game?.mode === "daily" && game.n) update((fresh) => recordPick(fresh, game.n!, pickFromResult(result)));
  };
  const onFinish = () => {
    const game = session?.game;
    if (game?.mode === "daily" && game.n) update((fresh) => finishDaily(fresh, game.n!));
  };

  return <div className="mq-page mx-auto max-w-5xl px-4 sm:px-6">
    <Link className="gm-back" to="/games"><ArrowLeft size={14} aria-hidden="true" />All games</Link>
    <header className="mq-head">
      <h1>Map quest</h1>
      {session && <button type="button" className="mq-link" onClick={home}>Game home</button>}
    </header>
    {session
      ? <Play key={session.round} game={session.game} resume={session.resume} stats={stats} now={now} onConfirm={onConfirm} onFinish={onFinish}
          onAgain={() => start(session.game.mode, session.game.level, session.game.era)} onHome={home} />
      : <Home stats={stats} now={now} onDaily={() => start("daily", "expert", "all")} onPractice={(level, era) => start("practice", level, era)}
          onDisputed={() => start("disputed", "expert", "all")} />}
    <footer className="mq-credits">
      <p>Place locations: OpenBible.info (CC BY 4.0). Map: © OpenStreetMap contributors, Protomaps.</p>
    </footer>
  </div>;
}
