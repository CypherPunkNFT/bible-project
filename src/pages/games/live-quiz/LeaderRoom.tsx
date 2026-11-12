// The leader's live room (design.md 3.2, 5.1, 7.1): connects with the leader token, shows the screen for the room's
// phase, and holds the controls: Start, Next (Space, → or Page Down, which presentation clickers send), Skip, Pause,
// Lock, remove a player, settings in the lobby, Fullscreen, Sound, Play again and End. A reload finds the room again
// from this browser's storage and carries on where it was. The controls, the settings and the player list sit inside
// the stage, so they stay with the leader in full-screen mode (the audit's accessibility note).
import { Expand, Lock, LockOpen, Pause, Play, Settings, Shrink, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { QuestionBank } from "@/lib/data";
import { drawGame, freshCount, MIN_GAME } from "@/lib/live-quiz/pick";
import { CLOSE, type HostView, type PlayerRow, type ServerMessage } from "@/lib/live-quiz/protocol";
import { ConfirmDialog } from "../kit";
import { joinOrder } from "./display";
import { AnswerScreen, LeaderboardScreen, Lobby, PodiumScreen, ReadScreen, RevealScreen } from "./LeaderScreens";
import type { SavedHost } from "./saved";
import { poolFor } from "./leader";
import { Badge } from "./parts";
import { SettingsFields } from "./Setup";
import { play, unlockSound } from "./sound";
import { useRoomSocket } from "./useRoomSocket";

const NEXT_KEYS = [" ", "ArrowRight", "PageDown"];

/** True while this document is in full-screen mode; follows the browser's own events. */
function useFullscreen(): boolean {
  const [on, setOn] = useState(() => Boolean(document.fullscreenElement));
  useEffect(() => {
    const update = () => setOn(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  return on;
}

/** The order players joined in, for the lobby, and a chime for each arrival after the first snapshot. */
function useArrivals(players: PlayerRow[] | undefined, sound: boolean): Map<string, number> {
  const seen = useRef(new Map<string, number>());
  const primed = useRef(false);
  useEffect(() => {
    if (!players) return;
    const before = seen.current.size;
    joinOrder(seen.current, players.map((p) => p.id));
    if (primed.current && sound && seen.current.size > before) play("join");
    primed.current = true;
  }, [players, sound]);
  return seen.current;
}

/** Each player's score as it stood at the last leaderboard, so the bars grow from there; cleared in the lobby. */
function useLastScores(view: HostView | null): Map<string, number> {
  const kept = useRef(new Map<string, number>());
  const lastPhase = useRef<string | undefined>(undefined);
  const [from, setFrom] = useState(new Map<string, number>());
  const phase = view?.phase;
  const players = view?.players;
  useEffect(() => {
    const entered = phase !== lastPhase.current;
    lastPhase.current = phase;
    if (phase === "lobby") { kept.current = new Map(); setFrom(new Map()); return; }
    // Only on arriving at the leaderboard: a later player update must not restart the bars from their new scores.
    if (phase !== "leaderboard" || !players || !entered) return;
    setFrom(new Map(kept.current));
    kept.current = new Map(players.map((p) => [p.id, p.score]));
  }, [phase, players]);
  return from;
}

export function LeaderRoom({ host, bank, onLeave }: { host: SavedHost; bank: QuestionBank | null; onLeave: () => void }) {
  const [view, setView] = useState<HostView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sound, setSound] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [ask, setAsk] = useState<{ kind: "kick"; player: PlayerRow } | { kind: "end" } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen();

  const onMessage = useCallback((message: ServerMessage) => {
    if (message.t === "state" && message.role === "host") { setView(message); setNotice(null); }
    else if (message.t === "players") setView((v) => v && { ...v, players: message.players });
    else if (message.t === "answered") setView((v) => v && { ...v, answered: { count: message.count, of: message.of } });
    else if (message.t === "error") setNotice(message.message);
  }, []);
  const socket = useRoomSocket(host.code, () => ({ t: "host", token: host.token }), onMessage);
  const { send } = socket;
  const seen = useArrivals(view?.players, sound);
  const fromScores = useLastScores(view);

  const next = useCallback(() => {
    if (!view) return;
    if (view.phase === "lobby") { if (view.players.length) send({ t: "start" }); }
    else send({ t: "next", phase: view.phase, index: view.index });
  }, [view, send]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(target.tagName)) return;
      if (!NEXT_KEYS.includes(event.key)) return;
      event.preventDefault();
      next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next]);

  const phase = view?.phase;
  useEffect(() => {
    if (sound && (phase === "answer" || phase === "reveal")) play(phase === "reveal" ? "reveal" : "open");
  }, [phase, sound]);

  // The ended message is far shorter than the stage it replaces, so bring the page back to the top to show it.
  const closed = socket.status === "closed";
  useEffect(() => { if (closed) window.scrollTo({ top: 0 }); }, [closed]);

  const playAgain = () => {
    if (!view || !bank) return;
    const pool = poolFor(bank, host.filters, host.theme);
    const fresh = freshCount(pool, view.usedIds);
    if (fresh < MIN_GAME) { setNotice("No unused questions are left with these choices. Set up a new game with wider choices."); return; }
    send({ t: "again", questions: drawGame(pool, Math.min(host.count, fresh), host.filters, view.usedIds) });
  };

  const canFullscreen = typeof document.fullscreenEnabled === "boolean" ? document.fullscreenEnabled : Boolean(stage.current?.requestFullscreen);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stage.current?.requestFullscreen?.();
  };
  const toggleSound = () => { unlockSound(); setSound((s) => !s); };

  if (socket.status === "closed") {
    const replaced = socket.closeCode === CLOSE.replaced;
    return <div className="lq-stage"><div className="lq-message">
      <p>{replaced ? "This game was opened on another screen." : "This game has ended."}</p>
      <button type="button" className="lq-button" onClick={onLeave}>Set up a new game</button>
    </div></div>;
  }
  if (!view) {
    return <div className="lq-stage"><p className="lq-message">{socket.status === "reconnecting" ? "Reconnecting to the game…" : "Opening the game…"}</p></div>;
  }

  const bookNames = Object.fromEntries((bank?.books ?? []).map((b) => [b.code, b.name]));
  const canPause = ["read", "answer", "reveal", "leaderboard"].includes(view.phase);
  const kick = (player: PlayerRow) => setAsk({ kind: "kick", player });
  return <div className="lq-stage" ref={stage} data-phase={view.phase} data-fullscreen={fullscreen ? "true" : undefined}>
    <div className="lq-screen">
      {socket.status === "reconnecting" && <p className="lq-warn">Reconnecting…</p>}
      {view.phase === "lobby" && <Lobby view={view} onKick={kick} seen={seen} onProjector={canFullscreen && !fullscreen ? toggleFullscreen : undefined} />}
      {view.phase === "read" && <ReadScreen view={view} offset={socket.offset} />}
      {view.phase === "answer" && <AnswerScreen view={view} offset={socket.offset} sound={sound} />}
      {view.phase === "reveal" && <RevealScreen view={view} bookNames={bookNames} />}
      {view.phase === "leaderboard" && <LeaderboardScreen view={view} fromScores={fromScores} />}
      {view.phase === "podium" && <PodiumScreen view={view} />}
      {view.phase === "ended" && <div className="lq-message"><p>This game has ended.</p></div>}
    </div>
    {notice && <p className="lq-warn" role="status">{notice}</p>}
    <div className="lq-bar">
      {view.phase === "lobby" && <button type="button" className="lq-button" disabled={!view.players.length} onClick={next}><Play size={16} aria-hidden="true" />Start</button>}
      {["read", "answer", "reveal", "leaderboard"].includes(view.phase) && <button type="button" className="lq-button" disabled={view.paused} onClick={next}><SkipForward size={16} aria-hidden="true" />Next</button>}
      {(view.phase === "read" || view.phase === "answer") && <button type="button" className="lq-button lq-quiet" disabled={view.paused} onClick={() => send({ t: "skip", phase: view.phase, index: view.index })}>Skip</button>}
      {canPause && <button type="button" className="lq-button lq-quiet" onClick={() => send({ t: view.paused ? "resume" : "pause" })}>
        {view.paused ? <><Play size={16} aria-hidden="true" />Resume</> : <><Pause size={16} aria-hidden="true" />Pause</>}
      </button>}
      {view.phase === "podium" && <button type="button" className="lq-button" disabled={!bank} onClick={playAgain}>Play again</button>}
      <span className="lq-spacer" />
      <button type="button" className="lq-button lq-quiet" onClick={() => send({ t: "lock", locked: !view.locked })}>
        {view.locked ? <><LockOpen size={16} aria-hidden="true" />Unlock joining</> : <><Lock size={16} aria-hidden="true" />Lock joining</>}
      </button>
      {view.phase === "lobby" && <button type="button" className="lq-button lq-quiet" aria-expanded={showSettings} onClick={() => setShowSettings((s) => !s)}><Settings size={16} aria-hidden="true" />Settings</button>}
      <button type="button" className="lq-button lq-quiet" onClick={toggleSound} aria-pressed={sound}>
        {sound ? <><Volume2 size={16} aria-hidden="true" />Sound on</> : <><VolumeX size={16} aria-hidden="true" />Sound off</>}
      </button>
      {canFullscreen && <button type="button" className="lq-button lq-quiet" onClick={toggleFullscreen}>
        {fullscreen ? <><Shrink size={16} aria-hidden="true" />Leave fullscreen</> : <><Expand size={16} aria-hidden="true" />Fullscreen</>}
      </button>}
      <button type="button" className="lq-button lq-quiet" onClick={() => setAsk({ kind: "end" })}>End game</button>
    </div>
    {showSettings && view.phase === "lobby" && <div className="lq-fields lq-wrap"><SettingsFields settings={view.settings} onChange={(settings) => send({ t: "settings", settings })} /></div>}
    {view.phase !== "lobby" && view.players.length > 0 && <details className="lq-note lq-players">
      <summary>Players</summary>
      <ul className="lq-tiles" aria-label="Players">
        {view.players.map((p) => <li key={p.id}><button type="button" className="lq-tile" data-offline={!p.connected} onClick={() => kick(p)} title={`Remove ${p.name}`}><Badge name={p.name} /><span dir="auto">{p.name}</span></button></li>)}
      </ul>
    </details>}
    <ConfirmDialog open={ask?.kind === "kick"} title="Remove this player?" confirmLabel="Remove" danger
      onCancel={() => setAsk(null)} onConfirm={() => { if (ask?.kind === "kick") send({ t: "kick", playerId: ask.player.id }); setAsk(null); }}>
      {ask?.kind === "kick" && <p className="lq-me"><Badge name={ask.player.name} /><span className="lq-name" dir="auto">{ask.player.name}</span></p>}
    </ConfirmDialog>
    <ConfirmDialog open={ask?.kind === "end"} title="End this game for everyone?" confirmLabel="End game" danger
      onCancel={() => setAsk(null)} onConfirm={() => { send({ t: "end" }); setAsk(null); }} />
  </div>;
}
