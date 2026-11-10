// Bible Jeopardy's stage (design 5, 9.3–9.7, 9.10): the part that goes full screen — the board, clue, answer, Daily
// Double, Final and results — with the scoreboard along the bottom, the game menu, the keys, and one polite live
// region that announces each change of score. Every change goes through the reducer (rules.ts) by `dispatch`.
import { Menu } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { formatNumber } from "@/lib/site-format";
import { AnswerScreen } from "./AnswerScreen";
import { Board } from "./Board";
import { ClueScreen } from "./ClueScreen";
import { markOrder } from "./display";
import { DailyDouble } from "./DailyDouble";
import { FinalRound } from "./FinalRound";
import { keyCommand, moved } from "./keys";
import type { Spot } from "./model";
import { Results } from "./Results";
import { canMark, isDailyDouble, tileAt, type Action, type Game } from "./rules";
import { Scoreboard } from "./Scoreboard";

export interface StageProps {
  game: Game;
  dispatch: (action: Action) => void;
  /** Go full screen when the stage first shows (Start game; not when carrying on after a reload). */
  autoFullscreen: boolean;
  /** Keys are ignored while a panel over the stage (How to play) is open. */
  keysPaused: boolean;
  canTieBreak: boolean;
  onTieBreak: () => void;
  onPlayAgain: () => void;
  onNewGame: () => void;
  onPrintSheet: () => void;
  onHelp: () => void;
  /** Panels drawn over the stage (How to play, the other-tab notice): inside it, so they show in full screen too. */
  children?: ReactNode;
}

const isTyping = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
const isControl = (target: EventTarget | null) => target instanceof HTMLElement && target.closest("button, a, summary") !== null && target.closest("[data-spot]") === null;

function announcement(game: Game): string {
  const last = game.play.last;
  if (!last || last.delta === 0) return "";
  const team = game.play.teams[last.team];
  const score = team.score < 0 ? `minus ${formatNumber(-team.score)}` : formatNumber(team.score);
  return last.delta > 0 ? `${team.name}, plus ${formatNumber(last.delta)}, now ${score}` : `${team.name}, minus ${formatNumber(-last.delta)}, now ${score}`;
}

type Confirm = "print" | "end" | null;

function GameMenu({ onClose, items }: { onClose: () => void; items: { label: string; run: () => void }[] }) {
  return <div className="jp-menu" role="menu" aria-label="Game menu">
    {items.map((item) => <button key={item.label} type="button" role="menuitem" onClick={() => { onClose(); item.run(); }}>{item.label}</button>)}
  </div>;
}

export function Stage(props: StageProps) {
  const { game, dispatch } = props;
  const { play, board, settings } = game;
  const stage = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState<Spot>({ col: 0, row: 0 });
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [replaying, setReplaying] = useState(false);
  const [adjusting, setAdjusting] = useState<number | null>(null);
  const [theme, setTheme] = useState<"site" | "light" | "dark">("site");
  const [notice, setNotice] = useState("");
  const [, setFullscreenTick] = useState(0);

  useEffect(() => {
    const onChange = () => setFullscreenTick((n) => n + 1);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const autoFullscreen = props.autoFullscreen;
  useEffect(() => {
    if (autoFullscreen) stage.current?.requestFullscreen?.()?.catch(() => setNotice("Use your browser's full-screen key (F11)."));
  }, [autoFullscreen]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) { void document.exitFullscreen?.(); return; }
    const request = stage.current?.requestFullscreen?.();
    if (!request) { setNotice("Use your browser's full-screen key (F11)."); return; }
    request.catch(() => setNotice("Use your browser's full-screen key (F11)."));
  };

  const openTile = (spot: Spot) => {
    if (replaying) {
      if (!play.played[spot.col]?.[spot.row]) return;
      dispatch({ type: "replay", spot });
      setReplaying(false);
      return;
    }
    setFocus(spot);
    dispatch({ type: "open", spot });
  };

  const replayingRef = useRef(replaying);
  replayingRef.current = replaying;
  const latest = useRef({ props, focus, openTile, toggleFullscreen });
  latest.current = { props, focus, openTile, toggleFullscreen };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const { props: current, focus: spot, openTile: open, toggleFullscreen: fullscreen } = latest.current;
      if (current.keysPaused || event.repeat) return;
      if ((event.key === "Enter" || event.key === " ") && isControl(event.target)) return;
      const screen = current.game.play.screen;
      const command = keyCommand(event, { screen, fullscreen: Boolean(document.fullscreenElement), typing: isTyping(event.target) });
      if (!command) return;
      event.preventDefault();
      const columns = current.game.board.columns.length;
      if (command.type === "move") setFocus(moved(spot, command.dx, command.dy, columns, 5));
      else if (command.type === "open") { if (!current.game.play.played[spot.col]?.[spot.row] || replayingRef.current) open(spot); }
      else if (command.type === "mark") current.dispatch({ type: "mark", team: command.team, right: command.right });
      else if (command.type === "fullscreen") fullscreen();
      else current.dispatch({ type: command.type });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const tile = play.open ? tileAt(board, play.open) : null;
  const column = play.open ? board.columns[play.open.col] : null;
  const dailyDouble = isDailyDouble(board, play.open);
  const order = dailyDouble ? [play.chooser] : markOrder(play.teams.length, settings.answering === "turns" ? play.chooser : null);
  const may = (team: number) => canMark(game, team);
  const mark = (team: number, right: boolean) => dispatch({ type: "mark", team, right });
  const back = () => dispatch({ type: "back" });

  let screen;
  if (play.screen === "board") {
    screen = <Board board={board} played={play.played} focus={focus} onFocus={setFocus} onOpen={openTile} replaying={replaying} />;
  } else if (play.screen === "daily-double") {
    const team = play.teams[play.chooser];
    screen = <DailyDouble team={team.name} teamIndex={play.chooser} score={team.score} onBet={(amount) => dispatch({ type: "bet", amount })} onBack={back} />;
  } else if (play.screen === "clue" && tile && column) {
    screen = <ClueScreen category={column.title} value={tile.value} q={tile.q} choices={settings.choices} timer={settings.timer} bet={dailyDouble ? play.bet : null}
      marks={{ teams: play.teams, marks: play.marks, order, canMark: may, onMark: mark }} onReveal={() => dispatch({ type: "reveal" })} />;
  } else if (play.screen === "answer" && tile && column) {
    screen = <AnswerScreen category={column.title} q={tile.q} choices={settings.choices} teams={play.teams} marks={play.marks}
      stake={dailyDouble ? play.bet ?? 0 : tile.value} order={order} canMark={may} onMark={mark} onBack={back} />;
  } else if ((play.screen === "final-category" || play.screen === "final-clue" || play.screen === "final-answer") && board.final) {
    screen = <FinalRound screen={play.screen} final={board.final} choices={settings.choices} teams={play.teams} order={play.finalOrder} marks={play.finalMarks}
      onClue={() => dispatch({ type: "final-clue" })} onReveal={() => dispatch({ type: "final-reveal" })}
      onMark={(team, bet, right) => dispatch({ type: "final-mark", team, bet, right })} />;
  } else if (play.screen === "tie-clue" && play.tie) {
    screen = <ClueScreen category={`Tie-breaker · ${play.tie.clue.title}`} value={0} q={play.tie.clue.q} choices={settings.choices} timer={settings.timer} bet={null}
      marks={{ teams: play.teams, marks: play.tie.marks, order: play.tie.teams, canMark: may, onMark: mark }} onReveal={() => dispatch({ type: "reveal" })} />;
  } else if (play.screen === "tie-answer" && play.tie) {
    screen = <AnswerScreen category={`Tie-breaker · ${play.tie.clue.title}`} q={play.tie.clue.q} choices={settings.choices} teams={play.teams} marks={play.tie.marks}
      stake={null} order={play.tie.teams} canMark={may} onMark={mark} onBack={back} backLabel="Back to results" />;
  } else {
    screen = <Results play={play} teams={play.teams} canTieBreak={props.canTieBreak} onTieBreak={props.onTieBreak} onPlayAgain={props.onPlayAgain} onNewGame={props.onNewGame} />;
  }

  const canEnd = !(play.screen === "results" || play.screen.startsWith("final") || play.screen.startsWith("tie"));
  const items = [
    { label: "Undo", run: () => dispatch({ type: "undo" }) },
    { label: "Print host sheet", run: () => setConfirm("print") },
    ...(play.screen === "board" ? [{ label: "Replay a tile", run: () => setReplaying(true) }] : []),
    { label: "Adjust scores", run: () => setAdjusting(0) },
    { label: "Full screen", run: toggleFullscreen },
    { label: theme === "dark" ? "Stage: light" : "Stage: dark", run: () => setTheme(theme === "dark" ? "light" : "dark") },
    { label: "How to play", run: props.onHelp },
    ...(canEnd ? [{ label: "End game", run: () => setConfirm("end") }] : []),
  ];

  return <div ref={stage} className={`jp-stage${theme === "site" ? "" : ` jp-stage-${theme}`}`}>
    <p className="jp-small-screen">Best on a laptop or TV.</p>
    <div className="jp-stage-main">{screen}</div>
    {replaying && <p className="jp-stage-note" role="status">Choose a played tile to reopen it. <button type="button" className="jp-quiet" onClick={() => setReplaying(false)}>Cancel</button></p>}
    {notice && <p className="jp-stage-note" role="status">{notice} <button type="button" className="jp-quiet" onClick={() => setNotice("")}>OK</button></p>}
    {confirm && <div className="jp-confirm" role="alertdialog" aria-label={confirm === "print" ? "Print host sheet" : "End game"}>
      <p>{confirm === "print" ? "The print preview will show every answer on this screen. Is the projector off or covered?" : "End the game now? Tiles not yet played are left out."}</p>
      <button type="button" className="jp-quiet" onClick={() => setConfirm(null)}>Cancel</button>
      <button type="button" className="jp-primary" onClick={() => { setConfirm(null); if (confirm === "print") props.onPrintSheet(); else dispatch({ type: "end" }); }}>
        {confirm === "print" ? "Print" : "End game"}
      </button>
    </div>}
    <div className="jp-stage-foot">
      <Scoreboard teams={play.teams} chooser={play.chooser} choosing={play.screen === "board"} last={play.last} adjusting={adjusting} setAdjusting={setAdjusting}
        onChoose={(team) => dispatch({ type: "choose", team })} onAdjust={(team, delta) => dispatch({ type: "adjust", team, delta })}
        onSetScore={(team, score) => dispatch({ type: "set-score", team, score })} />
      <div className="jp-menu-wrap">
        <button type="button" className="jp-icon" aria-haspopup="menu" aria-expanded={menu} aria-label="Game menu" onClick={() => setMenu(!menu)}><Menu size={22} aria-hidden /></button>
        {menu && <GameMenu items={items} onClose={() => setMenu(false)} />}
      </div>
    </div>
    <p className="sr-only" aria-live="polite">{announcement(game)}</p>
    {props.children}
  </div>;
}
