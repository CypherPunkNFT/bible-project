// /games/memory-match: flip text cards to pair each Bible character with their story, like Daniel and the lions' den
// (docs/features/memory-match/design.md). The pairs are checked and built ahead of time (scripts/build-memory-match.py)
// and loaded only on this page. Solo play counts moves; two to four people can take turns on one phone. The board in
// progress survives Back and reload in this tab.
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteLanguage } from "@/lib/language";
import { useScrollTopOn } from "../kit";
import { inSiteLanguage } from "../translated-data";
import { Board } from "./Board";
import { columnsFor, dealCards, drawPairs, isOffered, opensWithSpecPair, seededRng, shuffle, type PairsFile } from "./deal";
import { newGame, pairCount, stars, type GameState } from "./game";
import { CantLoad, StartScreen, StudyScreen, type Choice } from "./Screens";
import { Summary, type RecordNews } from "./Summary";
import { bestKey, browserStore, readBest, readGame, readSeen, readSettings, rememberSeen, saveBest, saveGame,
  saveSettings, takeOpener, type Settings } from "./storage";
import "../games.css";
import "./memory-match.css";

const loadPairs = () => import("@/data/memory-match/pairs.json")
  .then((module) => inSiteLanguage("memory-match/pairs.json", module.default as unknown as PairsFile));

/** Narrow screens get fewer columns; decided once, when the cards are dealt (design 8). */
const isNarrow = () => typeof window !== "undefined" && !!window.matchMedia?.("(max-width: 639px)").matches;

export default function MemoryMatchGame() {
  useEffect(() => { document.title = "Memory card match · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const [data, setData] = useState<PairsFile | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const language = useSiteLanguage(); // another language reads its copy; the board in play keeps its pair ids
  useEffect(() => {
    let live = true;
    setFailed(false);
    loadPairs().then((pairs) => { if (live) setData(pairs); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [attempt, language]);
  return <div className="mm-page mx-auto max-w-4xl px-3 sm:px-6">
    <Link className="gm-back" to="/games"><ArrowLeft size={14} aria-hidden="true" />All games</Link>
    {failed ? <CantLoad onRetry={() => setAttempt((n) => n + 1)} />
      : data ? <Game data={data} /> : <p className="mm-loading">Loading the cards…</p>}
  </div>;
}

interface Finished { game: GameState; news: RecordNews | null }

function Game({ data }: { data: PairsFile }) {
  const local = useMemo(() => browserStore("local"), []);
  const session = useMemo(() => browserStore("session"), []);
  const [game, setGame] = useState<GameState | null>(() => readGame(session, data));
  const [finished, setFinished] = useState<Finished | null>(null);
  const [choice, setChoice] = useState<Choice>(() => ({
    deck: game?.deck ?? "mixed", difficulty: game?.difficulty ?? "easy", players: game?.players.length ?? 1, names: [],
  }));
  const [settings, setSettings] = useState<Settings>(() => readSettings(local));
  const [best, setBest] = useState(() => readBest(local));
  const [studyOrder, setStudyOrder] = useState<string[]>([]);
  const [round, setRound] = useState(0);

  const update = useCallback((next: GameState | null) => { setGame(next); saveGame(session, next); }, [session]);
  const changeSettings = useCallback((next: Settings) => { setSettings(next); saveSettings(local, next); }, [local]);

  const deal = useCallback((c: Choice, study: boolean) => {
    if (!isOffered(data, c.deck, c.difficulty)) return;
    const rng = seededRng(Date.now());
    const opener = opensWithSpecPair(data, c.deck, c.difficulty) && takeOpener(local);
    const ids = drawPairs(data, c.deck, c.difficulty, readSeen(local), rng, opener);
    rememberSeen(local, ids);
    const players = c.players > 1
      ? Array.from({ length: c.players }, (_, n) => c.names[n]?.trim() || `Player ${n + 1}`) : ["You"];
    const columns = columnsFor(c.difficulty, isNarrow());
    setFinished(null);
    setRound((n) => n + 1);
    setStudyOrder(shuffle(ids, rng));
    update(newGame(data.stamp, c.deck, c.difficulty, columns, dealCards(ids, c.difficulty, rng), players, study));
  }, [data, local, update]);

  const finish = useCallback((done: GameState) => {
    let news: RecordNews | null = null;
    if (done.players.length < 2) {
      const result = saveBest(local, done.deck, done.difficulty,
        { moves: done.moves, timeMs: done.elapsedMs, stars: stars(done.moves, pairCount(done)) });
      news = { newMoves: result.newMoves, newTime: result.newTime };
      setBest(readBest(local));
    }
    setFinished({ game: done, news });
    update(null);
  }, [local, update]);

  /** Same deck, difficulty and players, new cards. */
  const again = useCallback((from: GameState) => deal({ deck: from.deck, difficulty: from.difficulty,
    players: from.players.length, names: from.players.length > 1 ? from.players : [] }, false), [deal]);

  const backToStart = useCallback((from: GameState) => {
    setChoice((c) => ({ ...c, deck: from.deck, difficulty: from.difficulty, players: from.players.length }));
    setFinished(null);
    update(null);
  }, [update]);

  // Every new screen (a board, the summary, the start) opens at the top of the page (the audit's item 1).
  useScrollTopOn(finished ? `summary-${round}` : !game ? "start" : game.studying ? `study-${round}` : `board-${round}`);

  if (finished) {
    return <Summary data={data} game={finished.game} news={finished.news}
      onAgain={() => again(finished.game)}
      onChange={() => backToStart(finished.game)} />;
  }
  if (!game) {
    return <StartScreen data={data} choice={choice} best={best[bestKey(choice.deck, choice.difficulty)]} settings={settings}
      onChoice={setChoice} onSettings={changeSettings} onDeal={(study) => deal(choice, study)} />;
  }
  if (game.studying) {
    const ids = studyOrder.length ? studyOrder : [...new Set(game.cards.map((card) => card.pair))];
    return <StudyScreen data={data} pairIds={ids} onStart={() => update({ ...game, studying: false })} />;
  }
  return <Board key={round} data={data} game={game} settings={settings} onChange={update} onSettings={changeSettings} onFinish={finish}
    onRestart={() => again(game)}
    onQuit={() => backToStart(game)} />;
}
