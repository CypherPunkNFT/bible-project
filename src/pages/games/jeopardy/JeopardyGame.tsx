// /games/jeopardy: Bible Jeopardy for church nights (docs/features/bible-jeopardy/design.md). The host names the teams,
// deals a board from the question bank (or opens a board link), previews and swaps it, then plays it on one projected
// screen. Everything runs in this browser: no server, no accounts, no AI, nothing generated.
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { loadQuestionBank, type QuestionBank } from "@/lib/data";
import { checkName } from "@/lib/live-quiz/names";
import { useSiteLanguage } from "@/lib/language";
import { formatDate, formatNumber, plural } from "@/lib/site-format";
import type { TestQuestion } from "../../questions/test/engine";
import { THEME_CATEGORIES, bookCategories } from "./categories";
import { buildBoard, drawTieBreaker, makeDeck, redrawColumn, swapColumn, swapFinal } from "./generate";
import { HostSheet } from "./HostSheet";
import { HowToPlay, Rules } from "./HowToPlay";
import { boardFromLink, decodeBoard, encodeBoard } from "./link";
import type { Board, BoardSettings, Settings } from "./model";
import { Preview } from "./Preview";
import { newGame as newGameState, tiedForFirst } from "./rules";
import { teamNameProblem } from "./display";
import { Setup } from "./Setup";
import { Stage } from "./Stage";
import { browserStore, clearSeen, loadGame, loadSeen, loadSettings, saveSettings, tabId, type SavedGame } from "./storage";
import { useGame } from "./useGame";
import { useScrollTopOn } from "../kit";
import "../games.css";
import "./jeopardy.css";

type Phase = "resume" | "setup" | "preview" | "stage";
const newGameFor = (settings: Settings, board: Board) => newGameState(`game-${Date.now().toString(36)}`, settings, board);
const boardPart = (s: Settings): BoardSettings => ({ columns: s.columns, difficulty: s.difficulty, choices: s.choices, children: s.children, catechism: s.catechism, testament: s.testament, dailyDouble: s.dailyDouble, final: s.final });

function useBank() {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const language = useSiteLanguage();
  useEffect(() => {
    let live = true;
    setFailed(false);
    loadQuestionBank().then((value) => { if (live) setBank(value); }).catch((error) => {
      console.warn("Bible Jeopardy: the question bank did not load:", error);
      if (live) setFailed(true);
    });
    return () => { live = false; };
  }, [attempt, language]);
  return { bank, failed, retry: () => setAttempt((n) => n + 1) };
}

export default function JeopardyGame() {
  useEffect(() => { document.title = "Bible Jeopardy · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const store = useMemo(() => browserStore(), []);
  const tab = useMemo(() => tabId(), []);
  const language = useSiteLanguage();
  const { bank, failed, retry } = useBank();
  const [params, setParams] = useSearchParams();
  const [settings, setSettingsState] = useState(() => loadSettings(store));
  const [seen, setSeen] = useState(() => loadSeen(store));
  const [saved] = useState<SavedGame | null>(() => { const found = loadGame(store); return found && found.game.play.screen !== "results" ? found : null; });
  const [phase, setPhase] = useState<Phase>(saved ? "resume" : "setup");
  const [chosen, setChosen] = useState<string[] | null>(null);
  const [link, setLink] = useState(() => { const text = params.get("board"); return text ? decodeBoard(text) : null; });
  const [linkNotice] = useState(() => (params.get("board") && !link ? "That board link could not be read, so a new board is set up instead." : ""));
  const [board, setBoard] = useState<Board | null>(null);
  const [status, setStatus] = useState("");
  const [help, setHelp] = useState(false);
  const [printing, setPrinting] = useState<"sheet" | "rules" | null>(null);
  const [startedHere, setStartedHere] = useState(false);
  // Play again deals from the finished game's board settings until the host goes back to setup.
  const [again, setAgain] = useState<BoardSettings | null>(null);
  const { game, start, dispatch, conflict, takeOver, leave } = useGame(store, tab, setSeen);
  // A new screen opens at the top (the audit: after Build board the page landed on the footer).
  useScrollTopOn(phase);

  const setSettings = (next: Settings) => { setSettingsState(next); saveSettings(store, next); setAgain(null); };
  const categories = useMemo(() => [...THEME_CATEGORIES, ...bookCategories(bank?.books ?? [])], [bank]);
  const deckSettings = link ? link.settings : again ?? boardPart(settings);
  const deckKey = JSON.stringify(deckSettings);
  const deck = useMemo(() => (bank ? makeDeck(bank.questions as TestQuestion[], categories, JSON.parse(deckKey) as BoardSettings, link ? [] : seen) : null), [bank, categories, deckKey, link, seen]);
  const counts = useMemo(() => (deck ? new Map([...deck.candidates].map(([id, list]) => [id, list.length])) : null), [deck]);
  const shown = useMemo(() => categories.filter((category) => deck?.byId.has(category.id) ?? true), [categories, deck]);

  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(null);
    window.addEventListener("afterprint", done);
    window.print?.();
    const timer = window.setTimeout(done, 1000);
    return () => { window.removeEventListener("afterprint", done); window.clearTimeout(timer); };
  }, [printing]);

  const themesOffered = deck ? deck.offered.filter((category) => category.kind === "theme").length : 0;
  const chosenOffered = deck && chosen ? deck.offered.filter((category) => chosen.includes(category.id)).length : 0;
  const badName = settings.teamNames.some((_, index) => teamNameProblem(settings.teamNames, index) !== null);
  const blocked = !bank ? "Loading the questions…" : badName ? "Fix the team names first." : !link && themesOffered < 3 && chosenOffered < 3
    ? "Fewer than 3 categories have enough questions with these settings. Try both testaments, catechism questions, or turning For children off." : null;

  const build = () => {
    if (!deck) return;
    const next = link ? boardFromLink(deck, link, language, Math.random) : buildBoard(deck, chosen ?? [], Math.random);
    if (next.columns.length < 3) { setStatus("Fewer than 3 categories have enough questions with these settings."); return; }
    setStatus("");
    setBoard(next);
    setPhase("preview");
  };
  const discardLink = () => {
    setLink(null);
    if (!params.has("board")) return;
    const next = new URLSearchParams(params);
    next.delete("board");
    setParams(next, { replace: true });
  };
  const copyLink = () => {
    if (!board) return;
    const url = `${window.location.origin}/games/jeopardy?board=${encodeBoard(board, language)}`;
    const showLink = () => setStatus(`Copy this link: ${url}`);
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(() => setStatus("Board link copied."), showLink);
    else showLink();
  };
  const begin = () => {
    if (!board) return;
    const teamNames = settings.teamNames.map((name) => { const check = checkName(name, "typed"); return check.ok ? check.name : name; });
    start(newGameFor({ ...settings, ...board.settings, teamNames }, board));
    setStartedHere(true);
    setPhase("stage");
  };
  const deckFor = useCallback((s: BoardSettings) => (bank ? makeDeck(bank.questions as TestQuestion[], categories, s, seen) : null), [bank, categories, seen]);
  const tieBreak = () => {
    if (!game) return;
    const tieDeck = deckFor(game.board.settings);
    const clue = tieDeck && drawTieBreaker(tieDeck, game.board, Math.random, game.play.tie?.clue ?? null);
    if (clue) dispatch({ type: "tie-break", clue });
  };
  const playAgain = () => {
    if (!game) return;
    leave();
    discardLink();
    setStatus("");
    setAgain(game.board.settings);
    const nextDeck = deckFor(game.board.settings);
    if (nextDeck) { setBoard(buildBoard(nextDeck, [], Math.random)); setPhase("preview"); } else setPhase("setup");
  };
  const newGame = () => { leave(); discardLink(); setAgain(null); setBoard(null); setPhase("setup"); };

  const helpPanel = <HowToPlay settings={game?.settings ?? settings} onClose={() => setHelp(false)} onPrint={() => setPrinting("rules")} />;
  let body;
  if (phase === "resume" && saved) {
    const s = saved.game;
    const left = s.play.played.flat().filter((done) => !done).length;
    body = <div className="jp-resume">
      <h1>Bible Jeopardy</h1>
      <p>{`A game saved on ${formatDate(saved.savedAt, { dateStyle: "medium" })} is waiting.`}</p>
      <p>{plural(left, "{n} tile left", "{n} tiles left")}</p>
      <ul>{s.play.teams.map((team, index) => <li key={index}>{`${team.name}: ${formatNumber(team.score)}`}</li>)}</ul>
      <button type="button" className="jp-primary" onClick={() => { start(s); setPhase("stage"); }}>Carry on</button>
      <button type="button" className="jp-quiet" onClick={() => { start(s); newGame(); }}>New game</button>
    </div>;
  } else if (phase === "stage" && game) {
    body = <Stage game={game} dispatch={dispatch} autoFullscreen={startedHere} keysPaused={help || conflict} canTieBreak={Boolean(bank) && tiedForFirst(game.play).length > 1} store={store}
      onTieBreak={tieBreak} onPlayAgain={playAgain} onNewGame={newGame} onPrintSheet={() => setPrinting("sheet")} onHelp={() => setHelp(true)}>
      {conflict && <div className="jp-confirm" role="alertdialog" aria-label="Open in another tab"><p>This game is open in another tab.</p>
        <button type="button" className="jp-primary" onClick={takeOver}>Use this tab</button></div>}
      {help && helpPanel}
    </Stage>;
  } else if (phase === "preview" && board && deck) {
    body = <Preview board={board} offered={deck.offered} status={status} onBack={() => { setAgain(null); setPhase("setup"); }} onStart={begin} onPrint={() => setPrinting("sheet")} onCopyLink={copyLink}
      onNewBoard={() => { setStatus(""); setBoard(link ? boardFromLink(deck, link, language, Math.random) : buildBoard(deck, chosen ?? [], Math.random)); }}
      onSwap={(index, id) => setBoard(swapColumn(deck, board, index, id, Math.random))} onRedraw={(index) => setBoard(redrawColumn(deck, board, index, Math.random))}
      onSwapFinal={() => setBoard(swapFinal(deck, board, Math.random))} />;
  } else if (failed && !bank) {
    body = <div className="jp-setup"><p className="jp-note" role="alert">The questions could not be loaded.</p><button type="button" className="jp-primary" onClick={retry}>Try again</button></div>;
  } else {
    const fromLink = link ? plural(link.columns.length, "Board from a link: {n} category", "Board from a link: {n} categories") : null;
    body = <>
      {linkNotice && <p className="jp-note" role="status">{linkNotice}</p>}
      {status && <p className="jp-note" role="status">{status}</p>}
      <Setup settings={settings} onSettings={setSettings} categories={shown} counts={counts} chosen={chosen} onChosen={setChosen} fromLink={fromLink}
        onDiscardLink={discardLink} saving={store !== null} seenCount={seen.length} onForgetSeen={() => { clearSeen(store); setSeen([]); }}
        blocked={blocked} onBuild={build} onHelp={() => setHelp(true)} />
    </>;
  }

  const printed = printing === "sheet" ? (game?.board ?? board) : null;
  return <div className={`jp-page${phase === "stage" ? " is-playing" : ""} mx-auto px-4 sm:px-6`}>
    <Link className="gm-back" to="/games"><ArrowLeft size={14} aria-hidden="true" />All games</Link>
    {body}
    {help && !(phase === "stage" && game) && helpPanel}
    {printing && createPortal(<div className="jp-print">{printed ? <HostSheet board={printed} /> : <Rules settings={game?.settings ?? settings} />}</div>, document.body)}
  </div>;
}
