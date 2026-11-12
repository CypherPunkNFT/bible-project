// /play and /play/:code: the phone's page of the live quiz (docs/features/live-quiz/design.md 5.2). A short address
// outside /games so it can be read off a projector and typed with one thumb. It loads no question bank: the questions
// arrive over the socket. Steps: code, name, then the game's screens (PlayerScreens.tsx).
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { prefersReducedMotion } from "../kit";
import { useNavigate, useParams } from "react-router-dom";
import { friendlyName } from "@/lib/live-quiz/names";
import { CLOSE, isRoomCode, type ClientMessage, type PlayerView, type RoomInfo, type ServerMessage } from "@/lib/live-quiz/protocol";
import { PlayerLayer } from "./PlayerScreens";
import { Badge } from "./parts";
import { isRemoved, markRemoved, savedPlayer, savePlayer } from "./saved";
import { useRoomSocket } from "./useRoomSocket";
import "./live-quiz.css";

type Step =
  | { at: "code"; error?: string }
  | { at: "checking"; code: string }
  | { at: "name"; code: string; info: RoomInfo; error?: string }
  | { at: "game"; code: string; roomId: string; info: RoomInfo };

const PICKER_SPINS = 3;

async function lookUp(code: string): Promise<RoomInfo | null> {
  const response = await fetch(`/api/live-quiz/rooms/${code}`, { cache: "no-store" });
  if (!response.ok) return null;
  return await response.json() as RoomInfo;
}

/** Keeps the screen awake during a game where the browser allows it, asking again when the tab comes back. */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      if (document.visibilityState !== "visible") return;
      navigator.wakeLock.request("screen").then((l) => { lock = l; }, (error: unknown) => console.warn("live-quiz: the screen could not be kept awake", error));
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => { document.removeEventListener("visibilitychange", request); void lock?.release(); };
  }, [active]);
}

function CodeStep({ error, onCode }: { error?: string; onCode: (code: string) => void }) {
  const [code, setCode] = useState("");
  const submit = (event: FormEvent) => { event.preventDefault(); onCode(code.replace(/\D/g, "")); };
  return <form onSubmit={submit}>
    <h1>Join a live quiz</h1>
    <label htmlFor="lq-code" className="lq-note">Game code from the screen</label>
    <input id="lq-code" className="lq-input lq-code-input" inputMode="numeric" autoComplete="off" pattern="[0-9 ]*" maxLength={7} value={code}
      onChange={(e) => setCode(e.target.value)} placeholder="123 456" />
    {error && <p className="lq-error" role="alert">{error}</p>}
    <button type="submit" className="lq-button" disabled={code.replace(/\D/g, "").length !== 6}>Join</button>
  </form>;
}

const SPIN_MS = 550;
const SPIN_STEP_MS = 70;

/** "Spin again" spins the words like a slot machine: the real name is chosen at once; the cycling words over it are
 * decoration, hidden from readers, and skipped when the reader asked for less motion. */
function useSpin(picked: string): string | null {
  const [shown, setShown] = useState<string | null>(null);
  const spins = useRef(0);
  useEffect(() => {
    if (spins.current++ === 0 || prefersReducedMotion()) return;
    const tick = setInterval(() => setShown(friendlyName()), SPIN_STEP_MS);
    const stop = setTimeout(() => { clearInterval(tick); setShown(null); }, SPIN_MS);
    return () => { clearInterval(tick); clearTimeout(stop); };
  }, [picked]);
  return shown;
}

function NameStep({ info, error, busy, onName }: { info: RoomInfo; error?: string; busy: boolean; onName: (name: string) => void }) {
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState(() => friendlyName());
  const [spins, setSpins] = useState(0);
  const spinning = useSpin(picked);
  if (info.names === "picker") {
    return <div className="lq-picker">
      <h1>Your name for this game</h1>
      <p className="lq-big lq-picked" data-spinning={spinning ? "true" : undefined}>
        <Badge name={picked} size={34} />
        <span className="lq-name"><span className={spinning ? "sr-only" : undefined}>{picked}</span>{spinning && <span aria-hidden="true">{spinning}</span>}</span>
      </p>
      <button type="button" className="lq-button lq-quiet" disabled={spins >= PICKER_SPINS} onClick={() => { setPicked(friendlyName()); setSpins((n) => n + 1); }}>
        {`Spin again (${PICKER_SPINS - spins} left)`}
      </button>
      {error && <p className="lq-error" role="alert">{error}</p>}
      <button type="button" className="lq-button" disabled={busy} onClick={() => onName(picked)}>This is me</button>
    </div>;
  }
  return <form onSubmit={(event) => { event.preventDefault(); onName(typed); }}>
    <h1>Your name</h1>
    <label htmlFor="lq-name" className="lq-note">Shown on the big screen</label>
    <input id="lq-name" className="lq-input lq-name-input" maxLength={16} autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
    {error && <p className="lq-error" role="alert">{error}</p>}
    <button type="submit" className="lq-button" disabled={busy || !typed.trim()}>Join the game</button>
  </form>;
}

const ENDINGS: Record<number, string> = {
  [CLOSE.kicked]: "The leader removed you from this game.",
  [CLOSE.replaced]: "This game was opened on another tab.",
  [CLOSE.ended]: "This game has ended.",
  [CLOSE.notFound]: "No game with that code — check the screen.",
};

export default function PlayPage() {
  useEffect(() => { document.title = "Join a live quiz · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const { code: fromLink } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(() => (fromLink && isRoomCode(fromLink) ? { at: "checking", code: fromLink } : { at: "code" }));
  const [view, setView] = useState<PlayerView | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const pendingName = useRef<string | null>(null);

  const checkingCode = step.at === "checking" ? step.code : null;
  useEffect(() => {
    if (!checkingCode) return;
    let active = true;
    lookUp(checkingCode).then((info) => {
      if (!active) return;
      if (!info?.exists || !info.roomId) return setStep({ at: "code", error: ENDINGS[CLOSE.notFound] });
      if (isRemoved(checkingCode, info.roomId)) return setStep({ at: "code", error: ENDINGS[CLOSE.kicked] });
      const saved = savedPlayer(checkingCode);
      if (saved && saved.roomId === info.roomId) return setStep({ at: "game", code: checkingCode, roomId: info.roomId, info });
      if (info.locked) return setStep({ at: "code", error: "This game is locked. Ask the leader to unlock it." });
      if (info.full) return setStep({ at: "code", error: "This game is full." });
      setStep({ at: "name", code: checkingCode, info });
    }, (error: unknown) => {
      console.warn("live-quiz: looking up the game failed", error);
      if (active) setStep({ at: "code", error: "The game could not be reached. Check the connection and try again." });
    });
    return () => { active = false; };
  }, [checkingCode]);

  const game = step.at === "game" ? step : null;
  const hello = useCallback((): ClientMessage | null => {
    if (!game) return null;
    const saved = savedPlayer(game.code);
    if (saved && saved.roomId === game.roomId) return { t: "rejoin", playerId: saved.playerId, token: saved.token };
    return pendingName.current ? { t: "join", name: pendingName.current } : null;
  }, [game]);

  const onMessage = useCallback((message: ServerMessage) => {
    if (!game) return;
    if (message.t === "joined") {
      savePlayer(game.code, { code: game.code, roomId: game.roomId, playerId: message.playerId, token: message.token, savedAt: Date.now() });
    } else if (message.t === "state" && message.role === "player") {
      setView(message);
      setPending(null);
      setNotice(null);
    } else if (message.t === "error") {
      if (message.code === "removed") markRemoved(game.code, game.roomId);
      if (message.code.startsWith("name") || message.code === "locked" || message.code === "full") setNameError(message.message);
      else setNotice(message.message);
      if (message.code === "too-late") setPending(null);
    }
  }, [game]);

  const socket = useRoomSocket(game ? game.code : null, hello, onMessage);
  useWakeLock(Boolean(game && view));

  useEffect(() => {
    if (!game || socket.status !== "closed") return;
    if (socket.closeCode === CLOSE.kicked) markRemoved(game.code, game.roomId);
    if (socket.closeCode === CLOSE.notFound || socket.closeCode === CLOSE.ended) savePlayer(game.code, null);
  }, [game, socket.status, socket.closeCode]);

  const chooseName = (name: string) => {
    if (step.at !== "name") return;
    pendingName.current = name;
    setNameError(undefined);
    setStep({ at: "game", code: step.code, roomId: step.info.roomId!, info: step.info });
  };
  // A refused name on an open socket: try again on the same connection.
  const retryName = (name: string) => { pendingName.current = name; setNameError(undefined); socket.send({ t: "join", name }); };

  const answer = (choice: number) => {
    if (!view) return;
    setPending(choice);
    socket.send({ t: "answer", index: view.index, choice });
  };

  const banners = <>
    {game && view && socket.status === "reconnecting" && <p className="lq-warn">Reconnecting…</p>}
    {notice && <p className="lq-warn" role="status">{notice}</p>}
  </>;

  const body = (() => {
    if (socket.status === "unsupported") return <p className="lq-big">This browser can't join live games.</p>;
    if (step.at === "code") return <CodeStep error={step.error} onCode={(code) => { navigate(`/play/${code}`, { replace: true }); setStep({ at: "checking", code }); }} />;
    if (step.at === "checking") return <p className="lq-big">Finding the game…</p>;
    if (step.at === "name") return <NameStep info={step.info} busy={false} onName={chooseName} />;
    if (socket.status === "closed") {
      return <div><p className="lq-big">{ENDINGS[socket.closeCode ?? CLOSE.ended] ?? ENDINGS[CLOSE.ended]}</p>
        <button type="button" className="lq-button lq-quiet" onClick={() => { setView(null); setStep({ at: "code" }); navigate("/play", { replace: true }); }}>Join another game</button></div>;
    }
    if (!view) {
      if (nameError) return <NameStep info={step.info} error={nameError} busy={false} onName={retryName} />;
      return <p className="lq-big">{socket.status === "reconnecting" ? "Reconnecting…" : "Joining…"}</p>;
    }
    // The game itself plays in a fixed layer over the page, so the site's header and floating button are out of reach.
    return <PlayerLayer view={view} offset={socket.offset} pending={pending} onAnswer={answer}>{banners}</PlayerLayer>;
  })();

  return <div className="lq-page">
    <div className="lq-phone">
      {!view && banners}
      {body}
    </div>
  </div>;
}
