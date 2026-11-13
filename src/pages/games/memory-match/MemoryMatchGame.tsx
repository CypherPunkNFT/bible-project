// /games/memory-match: flip text cards to make pairs, in three versions (versions.ts): a Bible character and their
// story, like Daniel and the lions' den (docs/features/memory-match/design.md); a place and what happened there; and the
// two halves of a well-known verse. The cards are checked and built ahead of time (scripts/build-memory-match.py) and
// loaded only on this page, one version at a time; a verse board's words are fetched from the BSB when it is dealt.
// Solo play counts moves; two to four people can take turns on one phone. The board in progress survives Back and
// reload in this tab.
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { useSiteLanguage } from "@/lib/language";
import { useScrollTopOn } from "../kit";
import { inSiteLanguage } from "../translated-data";
import { Board } from "./Board";
import { columnsFor, dealCards, drawPairs, isOffered, opensWithSpecPair, seededRng, shuffle, type PairsFile } from "./deal";
import { newGame, pairCount, stars, type GameState } from "./game";
import { CantLoad, StartScreen, StudyScreen, type Choice } from "./Screens";
import { Summary, type RecordNews } from "./Summary";
import { bestKey, browserStore, readBest, readGame, readSeen, readSettings, readVersion, rememberSeen, saveBest, saveGame,
  savedGameVersion, saveSettings, saveVersion, takeOpener, type Settings, type Store } from "./storage";
import { versesAsPairs, withVerseText, type VersesFile } from "./verse-cards";
import { recordDeck, versionOf, type Version, type VersionKey } from "./versions";
import "../games.css";
import "./memory-match.css";

const LOADERS: Record<VersionKey, () => Promise<PairsFile>> = {
  people: () => import("@/data/memory-match/pairs.json")
    .then((module) => inSiteLanguage("memory-match/pairs.json", module.default as unknown as PairsFile)),
  places: () => import("@/data/memory-match/places.json")
    .then((module) => inSiteLanguage("memory-match/places.json", module.default as unknown as PairsFile)),
  // The verses are the BSB's own words, looked up per board (verse-cards.ts): nothing to translate here.
  verses: () => import("@/data/memory-match/verses.json").then((module) => versesAsPairs(module.default as unknown as VersesFile)),
};

const FIRST_CHOICE: Choice = { deck: "mixed", difficulty: "easy", players: 1, names: [] };

/** Narrow screens get fewer columns; decided once, when the cards are dealt (design 8). */
const isNarrow = () => typeof window !== "undefined" && !!window.matchMedia?.("(max-width: 639px)").matches;

interface Loaded { version: VersionKey; data: PairsFile }

export default function MemoryMatchGame() {
  useEffect(() => { document.title = "Memory card match · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const local = useMemo(() => browserStore("local"), []);
  const session = useMemo(() => browserStore("session"), []);
  const [version, setVersion] = useState<VersionKey>(() => savedGameVersion(session) ?? readVersion(local));
  const [choice, setChoice] = useState<Choice>(FIRST_CHOICE);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const language = useSiteLanguage(); // another language reads its copy; the board in play keeps its pair ids
  useEffect(() => {
    let live = true;
    setFailed(false);
    LOADERS[version]().then((data) => { if (live) setLoaded({ version, data }); })
      .catch((error) => { console.warn(`Memory match: the ${version} cards did not load:`, error); if (live) setFailed(true); });
    return () => { live = false; };
  }, [attempt, language, version]);

  const chooseVersion = useCallback((next: VersionKey) => {
    setVersion(next);
    saveVersion(local, next);
    setChoice((c) => ({ ...c, deck: "mixed" })); // every version's decks start with Mixed
  }, [local]);

  const ready = loaded?.version === version ? loaded.data : null;
  return <div className="mm-page mx-auto max-w-4xl px-3 sm:px-6">
    <Link className="gm-back" to="/games"><ArrowLeft size={14} aria-hidden="true" />All games</Link>
    {failed ? <CantLoad onRetry={() => setAttempt((n) => n + 1)} />
      : ready ? <Game key={version} data={ready} version={versionOf(version)} onVersion={chooseVersion} choice={choice}
        onChoice={setChoice} local={local} session={session} />
        : <p className="mm-loading">Loading the cards…</p>}
  </div>;
}

interface Finished { game: GameState; news: RecordNews | null }

interface GameProps {
  data: PairsFile;
  version: Version;
  onVersion: (version: VersionKey) => void;
  choice: Choice;
  onChoice: (choice: Choice) => void;
  local: Store | null;
  session: Store | null;
}

function Game({ data, version, onVersion, choice, onChoice, local, session }: GameProps) {
  const catalog = useCatalog();
  /** Only the verses version has to fetch its board's words; the others have them already and deal at once. */
  const fetches = version.key === "verses";
  const prepare = useCallback((ids: readonly string[]): Promise<PairsFile> => withVerseText(catalog, data, ids), [catalog, data]);
  const [game, setGame] = useState<GameState | null>(() => readGame(session, data));
  const [board, setBoard] = useState<PairsFile | null>(() => (fetches ? null : data));
  const [finished, setFinished] = useState<Finished | null>(null);
  const [settings, setSettings] = useState<Settings>(() => readSettings(local));
  const [best, setBest] = useState(() => readBest(local));
  const [studyOrder, setStudyOrder] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const [dealing, setDealing] = useState(false);
  const [dealFailed, setDealFailed] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const update = useCallback((next: GameState | null) => { setGame(next); saveGame(session, next); }, [session]);
  const changeSettings = useCallback((next: Settings) => { setSettings(next); saveSettings(local, next); }, [local]);

  // A verse board restored after Back or a reload fetches its words before it shows; if they cannot be had, it is
  // dropped and the start screen offers a new deal.
  useEffect(() => {
    if (board || !game) return;
    prepare([...new Set(game.cards.map((card) => card.pair))]).then((filled) => { if (alive.current) setBoard(filled); })
      .catch((error) => { console.warn("Memory match: the saved board's verses did not load:", error); if (alive.current) update(null); });
  }, [board, game, prepare, update]);

  /** Lays out a drawn board whose words are in hand. */
  const start = useCallback((c: Choice, study: boolean, ids: string[], filled: PairsFile, rng: () => number) => {
    rememberSeen(local, ids);
    const players = c.players > 1
      ? Array.from({ length: c.players }, (_, n) => c.names[n]?.trim() || `Player ${n + 1}`) : ["You"];
    const columns = columnsFor(c.difficulty, isNarrow());
    setBoard(filled);
    setFinished(null);
    setRound((n) => n + 1);
    setStudyOrder(shuffle(ids, rng));
    update(newGame(data.stamp, c.deck, c.difficulty, columns, dealCards(ids, c.difficulty, rng), players, study, version.key));
  }, [data.stamp, local, update, version.key]);

  const deal = useCallback(async (c: Choice, study: boolean) => {
    if (!isOffered(data, c.deck, c.difficulty) || dealing) return;
    const rng = seededRng(Date.now());
    const opener = opensWithSpecPair(data, c.deck, c.difficulty) && takeOpener(local);
    const ids = drawPairs(data, c.deck, c.difficulty, readSeen(local), rng, opener);
    if (!fetches) { start(c, study, ids, data, rng); return; }
    setDealing(true);
    setDealFailed(false);
    let filled: PairsFile;
    try {
      filled = await prepare(ids);
    } catch (error) {
      console.warn("Memory match: the board's verses did not load:", error);
      if (alive.current) { setDealing(false); setDealFailed(true); }
      return;
    }
    if (!alive.current) return;
    setDealing(false);
    start(c, study, ids, filled, rng);
  }, [data, dealing, fetches, local, prepare, start]);

  const finish = useCallback((done: GameState) => {
    let news: RecordNews | null = null;
    if (done.players.length < 2) {
      const result = saveBest(local, recordDeck(version.key, done.deck), done.difficulty,
        { moves: done.moves, timeMs: done.elapsedMs, stars: stars(done.moves, pairCount(done)) });
      news = { newMoves: result.newMoves, newTime: result.newTime };
      setBest(readBest(local));
    }
    setFinished({ game: done, news });
    update(null);
  }, [local, update, version.key]);

  /** Same deck, difficulty and players, new cards. */
  const again = useCallback((from: GameState) => deal({ deck: from.deck, difficulty: from.difficulty,
    players: from.players.length, names: from.players.length > 1 ? from.players : [] }, false), [deal]);

  const backToStart = useCallback((from: GameState) => {
    onChoice({ ...choice, deck: from.deck, difficulty: from.difficulty, players: from.players.length });
    setFinished(null);
    update(null);
  }, [choice, onChoice, update]);

  // Every new screen (a board, the summary, the start) opens at the top of the page (the audit's item 1).
  useScrollTopOn(finished ? `summary-${round}` : !game ? "start" : game.studying ? `study-${round}` : `board-${round}`);

  const shown = board ?? data;
  if (finished) {
    return <Summary data={shown} version={version} game={finished.game} news={finished.news}
      onAgain={() => void again(finished.game)}
      onChange={() => backToStart(finished.game)} />;
  }
  if (!game) {
    return <StartScreen data={data} version={version} onVersion={onVersion} choice={choice}
      best={best[bestKey(recordDeck(version.key, choice.deck), choice.difficulty)]} settings={settings}
      onChoice={onChoice} onSettings={changeSettings} onDeal={(study) => void deal(choice, study)}
      dealing={dealing} dealFailed={dealFailed} />;
  }
  if (!board) return <p className="mm-loading">Loading the cards…</p>;
  if (game.studying) {
    const ids = studyOrder.length ? studyOrder : [...new Set(game.cards.map((card) => card.pair))];
    return <StudyScreen data={board} pairIds={ids} onStart={() => update({ ...game, studying: false })} />;
  }
  return <Board key={round} data={board} version={version} game={game} settings={settings} onChange={update}
    onSettings={changeSettings} onFinish={finish}
    onRestart={() => void again(game)}
    onQuit={() => backToStart(game)} />;
}
