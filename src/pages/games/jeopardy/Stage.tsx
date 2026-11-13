// Bible Jeopardy's stage (design 5, 9.3–9.7, 9.10): the part that goes full screen — the board, clue, answer, Daily
// Double, Final and results — with the scoreboard along the bottom, the game menu, the keys, and one polite live
// region that announces each change of score. Every change goes through the reducer (rules.ts) by `dispatch`.
// The redesign (docs/visual-audits/jeopardy-redesign.md) adds the moments around it: the clue grows out of the tile
// that was chosen and shrinks back into it, a mark lands on the scoreboard with a count and a chime, the Daily Double
// has its splash, the timer is thick and coloured, and the results are a podium. Every one of them is decoration:
// the state changes at once and nothing waits for an animation (src/index.css cuts them to 0.01 ms under reduced motion).
import { Menu } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { formatNumber } from "@/lib/site-format";
import { motionMs, useScrollTopOn } from "../kit";
import { AnswerScreen } from "./AnswerScreen";
import { Board } from "./Board";
import { ClueScreen } from "./ClueScreen";
import { DailyDouble } from "./DailyDouble";
import { FinalRound } from "./FinalRound";
import { keyCommand, moved } from "./keys";
import type { Spot } from "./model";
import { Results } from "./Results";
import { canMark, isDailyDouble, tileAt, type Action, type Game } from "./rules";
import { Scoreboard, type Pulse } from "./Scoreboard";
import { loadSoundsOn, play as playSound, saveSoundsOn, unlockSound, type Cue } from "./sound";

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
  /** Where the sound switch is remembered; null plays on without remembering. */
  store?: Storage | null;
  /** Panels drawn over the stage (How to play, the other-tab notice): inside it, so they show in full screen too. */
  children?: ReactNode;
}

const isTyping = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
const isControl = (target: EventTarget | null) => target instanceof HTMLElement && target.closest("button, a, summary") !== null && target.closest("[data-spot]") === null;

/** The spoken line for the change that just landed; nothing after Undo, so an older change is never read as new. */
function announcement(game: Game, last: Pulse | null): string {
  if (!last || last.delta === 0) return "";
  const team = game.play.teams[last.team];
  const score = team.score < 0 ? `minus ${formatNumber(-team.score)}` : formatNumber(team.score);
  return last.delta > 0 ? `${team.name}, plus ${formatNumber(last.delta)}, now ${score}` : `${team.name}, minus ${formatNumber(-last.delta)}, now ${score}`;
}

/** Where the chosen tile sits inside the stage's main area, as the clue's starting transform. */
interface Origin { x: number; y: number; sx: number; sy: number }
const OPEN_MS = 380;
const CLOSE_MS = 420;

function originOf(main: HTMLElement | null, spot: Spot): Origin | null {
  const tile = main?.querySelector<HTMLElement>(`[data-spot="${spot.col}-${spot.row}"]`);
  if (!main || !tile) return null;
  const from = tile.getBoundingClientRect();
  const to = main.getBoundingClientRect();
  if (to.width === 0 || to.height === 0) return null;
  return { x: from.left - to.left, y: from.top - to.top, sx: from.width / to.width, sy: from.height / to.height };
}

type Confirm = "print" | "end" | null;

function GameMenu({ onClose, items }: { onClose: () => void; items: { label: string; run: () => void }[] }) {
  return <div className="jp-menu" role="menu" aria-label="Game menu">
    {items.map((item) => <button key={item.label} type="button" role="menuitem" onClick={() => { onClose(); item.run(); }}>{item.label}</button>)}
  </div>;
}

/** The site's theme as the page shows it now (dark unless this browser chose light). */
const siteTheme = (): "light" | "dark" => (typeof document !== "undefined" && document.documentElement.dataset.theme === "light" ? "light" : "dark");

export function Stage(props: StageProps) {
  const { game, dispatch } = props;
  const { play, board, settings } = game;
  const stage = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState<Spot>({ col: 0, row: 0 });
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [replaying, setReplaying] = useState(false);
  const [adjusting, setAdjusting] = useState<number | null>(null);
  const [theme, setTheme] = useState<"site" | "light" | "dark">("site");
  const [notice, setNotice] = useState("");
  const [, setFullscreenTick] = useState(0);
  const [soundsOn, setSoundsOn] = useState(() => loadSoundsOn(props.store ?? null));
  const [dealt, setDealt] = useState(false);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [opening, setOpening] = useState(false);
  const [closing, setClosing] = useState<Spot | null>(null);
  const [pulse, setPulse] = useState<Pulse | null>(null);

  useScrollTopOn(play.screen);

  useEffect(() => {
    const onChange = () => setFullscreenTick((n) => n + 1);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const autoFullscreen = props.autoFullscreen;
  useEffect(() => {
    if (autoFullscreen) stage.current?.requestFullscreen?.()?.catch(() => setNotice("Use your browser's full-screen key (F11)."));
  }, [autoFullscreen]);

  // The opening and closing decorations are taken down on a clock; the screens underneath changed at once.
  useEffect(() => {
    if (!opening) return;
    const timer = window.setTimeout(() => setOpening(false), motionMs(OPEN_MS));
    return () => window.clearTimeout(timer);
  }, [opening]);
  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => setClosing(null), motionMs(CLOSE_MS));
    return () => window.clearTimeout(timer);
  }, [closing]);

  // A new change of score (not one restored by Undo) lands on the strip: a flash, a count and a floating delta.
  const historyLength = game.history.length;
  const seenLength = useRef(historyLength);
  const lastChange = play.last;
  const seenChange = useRef(lastChange);
  useEffect(() => {
    const grew = historyLength > seenLength.current;
    const fresh = lastChange !== seenChange.current;
    seenLength.current = historyLength;
    seenChange.current = lastChange;
    if (grew && fresh && lastChange && lastChange.delta !== 0) setPulse((old) => ({ team: lastChange.team, delta: lastChange.delta, n: (old?.n ?? 0) + 1 }));
    else if (!grew) setPulse(null);
  }, [historyLength, lastChange]);
  // The scoreboard is hidden on the results; clear the last flash so it does not replay when it comes back (Undo, a
  // tie-breaker).
  const onResults = play.screen === "results";
  useEffect(() => { if (onResults) setPulse(null); }, [onResults]);

  const cue = (kind: Cue) => { if (soundsOn) playSound(kind); };
  const toggleSounds = () => { const next = !soundsOn; setSoundsOn(next); saveSoundsOn(props.store ?? null, next); if (next) { unlockSound(); playSound("tick"); } };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) { void document.exitFullscreen?.(); return; }
    const request = stage.current?.requestFullscreen?.();
    if (!request) { setNotice("Use your browser's full-screen key (F11)."); return; }
    request.catch(() => setNotice("Use your browser's full-screen key (F11)."));
  };

  const openTile = (spot: Spot) => {
    unlockSound();
    if (replaying) {
      if (!play.played[spot.col]?.[spot.row]) return;
      dispatch({ type: "replay", spot });
      setReplaying(false);
      return;
    }
    setFocus(spot);
    setDealt(true);
    const from = originOf(main.current, spot);
    setOrigin(from);
    setOpening(from !== null);
    if (isDailyDouble(board, spot)) cue("sting");
    dispatch({ type: "open", spot });
  };
  const back = () => {
    if (play.open && (play.screen === "clue" || play.screen === "answer" || play.screen === "daily-double")) setClosing(play.open);
    dispatch({ type: "back" });
  };
  const mark = (team: number, right: boolean) => {
    if (canMark(game, team)) cue(right ? "chime" : "buzz");
    dispatch({ type: "mark", team, right });
  };
  const finalMark = (team: number, bet: number, right: boolean) => {
    cue(right ? "chime" : "buzz");
    dispatch({ type: "final-mark", team, bet, right });
  };
  const timeUp = () => cue("time");
  const tieBreak = () => { unlockSound(); cue("drum"); props.onTieBreak(); };

  const replayingRef = useRef(replaying);
  replayingRef.current = replaying;
  const overlay = menu || confirm !== null || adjusting !== null;
  const closeOverlays = () => { setMenu(false); setConfirm(null); setAdjusting(null); };
  const latest = useRef({ props, focus, openTile, toggleFullscreen, back, mark, overlay, closeOverlays });
  latest.current = { props, focus, openTile, toggleFullscreen, back, mark, overlay, closeOverlays };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const { props: current, focus: spot, openTile: open, toggleFullscreen: fullscreen, back: goBack, mark: markTeam } = latest.current;
      if (current.keysPaused || event.repeat) return;
      // While the menu, a confirm box or a score panel is open, the game's keys wait; Esc closes it.
      if (latest.current.overlay) {
        if (event.key === "Escape") { event.preventDefault(); latest.current.closeOverlays(); }
        return;
      }
      if ((event.key === "Enter" || event.key === " ") && isControl(event.target)) return;
      const screen = current.game.play.screen;
      const command = keyCommand(event, { screen, fullscreen: Boolean(document.fullscreenElement), typing: isTyping(event.target) });
      if (!command) return;
      event.preventDefault();
      const columns = current.game.board.columns.length;
      if (command.type === "move") setFocus(moved(spot, command.dx, command.dy, columns, 5));
      else if (command.type === "open") { if (!current.game.play.played[spot.col]?.[spot.row] || replayingRef.current) open(spot); }
      else if (command.type === "mark") { unlockSound(); markTeam(command.team, command.right); }
      else if (command.type === "fullscreen") fullscreen();
      else if (command.type === "back") goBack();
      else current.dispatch({ type: command.type });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const tile = play.open ? tileAt(board, play.open) : null;
  const column = play.open ? board.columns[play.open.col] : null;
  const dailyDouble = isDailyDouble(board, play.open);
  // Right and Wrong stay in team order, the same as the scores below (owner, 2026-11-13: moving the choosing team to the
  // front made a host mark the wrong row).
  const order = dailyDouble ? [play.chooser] : play.teams.map((_, index) => index);
  const may = (team: number) => canMark(game, team);
  const first = settings.answering === "turns" && !dailyDouble ? play.chooser : null;

  let screen;
  if (play.screen === "board") {
    screen = <Board board={board} played={play.played} focus={focus} onFocus={setFocus} onOpen={openTile} replaying={replaying} deal={!dealt} closing={closing} dailyDouble={board.dailyDouble} />;
  } else if (play.screen === "daily-double") {
    const team = play.teams[play.chooser];
    screen = <DailyDouble key={`${play.open?.col}-${play.open?.row}`} team={team.name} teamIndex={play.chooser} score={team.score} onBet={(amount) => dispatch({ type: "bet", amount })} onBack={back} />;
  } else if (play.screen === "clue" && tile && column) {
    screen = <ClueScreen category={column.title} value={tile.value} q={tile.q} choices={settings.choices} timer={settings.timer} bet={dailyDouble ? play.bet : null}
      marks={{ teams: play.teams, marks: play.marks, order, first, canMark: may, onMark: mark }} onReveal={() => dispatch({ type: "reveal" })} onTimeUp={timeUp} />;
  } else if (play.screen === "answer" && tile && column) {
    screen = <AnswerScreen category={column.title} q={tile.q} choices={settings.choices} teams={play.teams} marks={play.marks}
      stake={dailyDouble ? play.bet ?? 0 : tile.value} order={order} first={first} canMark={may} onMark={mark} onBack={back} />;
  } else if ((play.screen === "final-category" || play.screen === "final-clue" || play.screen === "final-answer") && board.final) {
    screen = <FinalRound screen={play.screen} final={board.final} choices={settings.choices} teams={play.teams} order={play.finalOrder} marks={play.finalMarks}
      onClue={() => dispatch({ type: "final-clue" })} onReveal={() => dispatch({ type: "final-reveal" })} onMark={finalMark} onTimeUp={timeUp} />;
  } else if (play.screen === "tie-clue" && play.tie) {
    screen = <ClueScreen category={`Tie-breaker · ${play.tie.clue.title}`} value={0} q={play.tie.clue.q} choices={settings.choices} timer={settings.timer} bet={null}
      marks={{ teams: play.teams, marks: play.tie.marks, order: play.tie.teams, canMark: may, onMark: mark }} onReveal={() => dispatch({ type: "reveal" })} onTimeUp={timeUp} />;
  } else if (play.screen === "tie-answer" && play.tie) {
    screen = <AnswerScreen category={`Tie-breaker · ${play.tie.clue.title}`} q={play.tie.clue.q} choices={settings.choices} teams={play.teams} marks={play.tie.marks}
      stake={null} order={play.tie.teams} canMark={may} onMark={mark} onBack={back} backLabel="Back to results" />;
  } else {
    screen = <Results play={play} teams={play.teams} canTieBreak={props.canTieBreak} onTieBreak={tieBreak} onPlayAgain={props.onPlayAgain} onNewGame={props.onNewGame} />;
  }

  const results = play.screen === "results";
  const canEnd = !(results || play.screen.startsWith("final") || play.screen.startsWith("tie"));
  const shownTheme = theme === "site" ? siteTheme() : theme;
  const items = [
    { label: "Undo", run: () => dispatch({ type: "undo" }) },
    { label: "Print host sheet", run: () => setConfirm("print") },
    ...(play.screen === "board" ? [{ label: "Replay a tile", run: () => setReplaying(true) }] : []),
    ...(results ? [] : [{ label: "Adjust scores", run: () => setAdjusting(0) }]),
    { label: "Full screen", run: toggleFullscreen },
    { label: shownTheme === "dark" ? "Stage: light" : "Stage: dark", run: () => setTheme(shownTheme === "dark" ? "light" : "dark") },
    { label: soundsOn ? "Sounds: off" : "Sounds: on", run: toggleSounds },
    { label: "How to play", run: props.onHelp },
    ...(canEnd ? [{ label: "End game", run: () => setConfirm("end") }] : []),
  ];

  const originVars = origin ? ({ "--jp-x": `${origin.x}px`, "--jp-y": `${origin.y}px`, "--jp-sx": origin.sx, "--jp-sy": origin.sy } as CSSProperties) : undefined;
  return <div ref={stage} className={`jp-stage${theme === "site" ? "" : ` jp-stage-${theme}`}${results ? " is-results" : ""}`}>
    <p className="jp-small-screen">Best on a laptop or TV.</p>
    <div ref={main} className="jp-stage-main" style={originVars}>
      <div className={`jp-screen${opening && origin ? " is-opening" : ""}`} key={play.screen === "board" ? "board" : play.open ? `tile-${play.open.col}-${play.open.row}` : play.screen}>{screen}</div>
      {closing && origin && <div className="jp-ghost" aria-hidden />}
    </div>
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
      {!results && <Scoreboard teams={play.teams} chooser={play.chooser} choosing={play.screen === "board"} pulse={pulse} adjusting={adjusting} setAdjusting={setAdjusting}
        onChoose={(team) => dispatch({ type: "choose", team })} onAdjust={(team, delta) => dispatch({ type: "adjust", team, delta })}
        onSetScore={(team, score) => dispatch({ type: "set-score", team, score })} />}
      <div className="jp-menu-wrap">
        <button type="button" className="jp-icon" aria-haspopup="menu" aria-expanded={menu} aria-label="Game menu" onClick={() => setMenu(!menu)}><Menu size={22} aria-hidden /></button>
        {menu && <GameMenu items={items} onClose={() => setMenu(false)} />}
      </div>
    </div>
    <p className="sr-only" aria-live="polite">{announcement(game, pulse)}</p>
    {props.children}
  </div>;
}
