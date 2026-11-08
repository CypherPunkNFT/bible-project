// The leader's live room (design.md 3.2, 5.1, 7.1): connects with the leader token, shows the screen for the room's
// phase, and holds the controls: Start, Next (Space, → or Page Down, which presentation clickers send), Skip, Pause,
// Lock, remove a player, settings in the lobby, Fullscreen, Sound, Play again and End. A reload finds the room again
// from this browser's storage and carries on where it was.
import { Expand, Lock, LockOpen, Pause, Play, Settings, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { QuestionBank } from "@/lib/data";
import { drawGame, freshCount, MIN_GAME } from "@/lib/live-quiz/pick";
import { CLOSE, type HostView, type PlayerRow, type ServerMessage } from "@/lib/live-quiz/protocol";
import { AnswerScreen, LeaderboardScreen, Lobby, PodiumScreen, ReadScreen, RevealScreen } from "./LeaderScreens";
import type { SavedHost } from "./saved";
import { poolFor } from "./leader";
import { SettingsFields } from "./Setup";
import { useRoomSocket } from "./useRoomSocket";

const NEXT_KEYS = [" ", "ArrowRight", "PageDown"];

/** A short generated chime: the only sound the game makes. */
function chime(high: boolean) {
  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) return;
  const audio = new AudioContextClass();
  const tone = audio.createOscillator();
  const gain = audio.createGain();
  tone.frequency.value = high ? 880 : 587;
  gain.gain.setValueAtTime(0.15, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.5);
  tone.connect(gain).connect(audio.destination);
  tone.start();
  tone.stop(audio.currentTime + 0.5);
  tone.onended = () => void audio.close();
}

export function LeaderRoom({ host, bank, onLeave }: { host: SavedHost; bank: QuestionBank | null; onLeave: () => void }) {
  const [view, setView] = useState<HostView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sound, setSound] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const stage = useRef<HTMLDivElement>(null);

  const onMessage = useCallback((message: ServerMessage) => {
    if (message.t === "state" && message.role === "host") { setView(message); setNotice(null); }
    else if (message.t === "players") setView((v) => v && { ...v, players: message.players });
    else if (message.t === "answered") setView((v) => v && { ...v, answered: { count: message.count, of: message.of } });
    else if (message.t === "error") setNotice(message.message);
  }, []);
  const socket = useRoomSocket(host.code, () => ({ t: "host", token: host.token }), onMessage);
  const { send } = socket;

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
    if (sound && (phase === "answer" || phase === "reveal")) chime(phase === "reveal");
  }, [phase, sound]);

  const kick = (player: PlayerRow) => {
    if (window.confirm(`Remove ${player.name} from the game?`)) send({ t: "kick", playerId: player.id });
  };

  const playAgain = () => {
    if (!view || !bank) return;
    const pool = poolFor(bank, host.filters, host.theme);
    const fresh = freshCount(pool, view.usedIds);
    if (fresh < MIN_GAME) { setNotice("No unused questions are left with these choices. Set up a new game with wider choices."); return; }
    send({ t: "again", questions: drawGame(pool, Math.min(host.count, fresh), host.filters, view.usedIds) });
  };

  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stage.current?.requestFullscreen?.();
  };

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
  return <>
    <div className="lq-stage" ref={stage}>
      {socket.status === "reconnecting" && <p className="lq-warn">Reconnecting…</p>}
      {view.phase === "lobby" && <Lobby view={view} onKick={kick} />}
      {view.phase === "read" && <ReadScreen view={view} offset={socket.offset} />}
      {view.phase === "answer" && <AnswerScreen view={view} offset={socket.offset} />}
      {view.phase === "reveal" && <RevealScreen view={view} bookNames={bookNames} />}
      {view.phase === "leaderboard" && <LeaderboardScreen view={view} />}
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
      <button type="button" className="lq-button lq-quiet" onClick={() => setSound((s) => !s)} aria-pressed={sound}>
        {sound ? <><Volume2 size={16} aria-hidden="true" />Sound on</> : <><VolumeX size={16} aria-hidden="true" />Sound off</>}
      </button>
      <button type="button" className="lq-button lq-quiet" onClick={fullscreen}><Expand size={16} aria-hidden="true" />Fullscreen</button>
      <button type="button" className="lq-button lq-quiet" onClick={() => { if (window.confirm("End this game for everyone?")) send({ t: "end" }); }}>End game</button>
    </div>
    {showSettings && view.phase === "lobby" && <div className="lq-fields lq-wrap"><SettingsFields settings={view.settings} onChange={(settings) => send({ t: "settings", settings })} /></div>}
    {view.phase !== "lobby" && view.players.length > 0 && <details className="lq-note">
      <summary>Players</summary>
      <ul className="lq-tiles" aria-label="Players">
        {view.players.map((p) => <li key={p.id}><button type="button" className="lq-tile" data-offline={!p.connected} onClick={() => kick(p)} title={`Remove ${p.name}`}>{p.name}</button></li>)}
      </ul>
    </details>}
  </>;
}
