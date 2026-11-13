// Team play's connection to its room (docs/features/team-play/design.md, sections 3 and Review 5), for the laptop and
// the phones: connects, signs in with `hello` on every (re)connect, reconnects after a drop with backoff (0.5, 1, 2, 4,
// then every 8 s) and at once when the tab returns or the network comes back. A heartbeat catches a socket that still
// reads as open but is dead (a phone back from a locked screen): `ping()` sends PING and, with no PONG within 3 s,
// drops that socket and connects afresh. A close the room means as final (ended, replaced, team taken) stops it.
// Adapted from the live quiz's useRoomSocket (src/pages/games/live-quiz/useRoomSocket.ts).
import { useCallback, useEffect, useRef, useState } from "react";
import { FINAL_CLOSES, PING, PONG, type ClientMessage, type ServerMessage } from "@/lib/team-room/protocol";

export type SocketStatus = "connecting" | "open" | "reconnecting" | "closed" | "unsupported";

export interface TeamSocket {
  status: SocketStatus;
  /** The final close's code and reason, once the room has ended this device's part. */
  closed: { code: number; reason: string } | null;
  send: (message: ClientMessage) => void;
  /** Checks the line is alive (see above). */
  ping: () => void;
}

const BACKOFF = [500, 1000, 2000, 4000, 8000];
const PONG_TIMEOUT_MS = 3000;

export const teamSocketUrl = (code: string) => `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/api/team-room/rooms/${code}/socket`;

export function useTeamRoom(code: string | null, hello: () => ClientMessage | null, onMessage: (message: ServerMessage) => void): TeamSocket {
  const [status, setStatus] = useState<SocketStatus>(() => (typeof WebSocket === "undefined" ? "unsupported" : "connecting"));
  const [closed, setClosed] = useState<TeamSocket["closed"]>(null);
  const socket = useRef<WebSocket | null>(null);
  const restartRef = useRef<() => void>(() => {});
  const pongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlers = useRef({ hello, onMessage });
  handlers.current = { hello, onMessage };

  useEffect(() => {
    if (!code || typeof WebSocket === "undefined") return;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let final = false;
    let disposed = false;
    setClosed(null);
    setStatus("connecting");

    const later = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(connect, BACKOFF[Math.min(attempt, BACKOFF.length - 1)]);
      attempt += 1;
    };

    function connect() {
      if (disposed || final) return;
      if (timer) { clearTimeout(timer); timer = null; }
      const ws = new WebSocket(teamSocketUrl(code!));
      socket.current = ws;
      ws.onopen = () => {
        attempt = 0;
        setStatus("open");
        const first = handlers.current.hello();
        if (first) ws.send(JSON.stringify(first));
      };
      ws.onmessage = (event) => {
        const text = String(event.data);
        if (text === PONG) {
          if (pongTimer.current) { clearTimeout(pongTimer.current); pongTimer.current = null; }
          return;
        }
        let message: ServerMessage;
        try {
          message = JSON.parse(text) as ServerMessage;
        } catch (error) {
          console.warn("team-play: a message from the room could not be read", error);
          return;
        }
        handlers.current.onMessage(message);
      };
      ws.onclose = (event) => {
        if (socket.current !== ws) return; // a socket already replaced by restart()
        socket.current = null;
        if (disposed || final) return;
        if (FINAL_CLOSES.includes(event.code)) {
          final = true;
          setClosed({ code: event.code, reason: event.reason });
          setStatus("closed");
          return;
        }
        setStatus("reconnecting");
        later();
      };
    }

    /** Drops the current socket without waiting for its close (a dead one may take minutes) and connects afresh. */
    restartRef.current = () => {
      if (disposed || final) return;
      const dead = socket.current;
      socket.current = null;
      if (dead) {
        dead.onclose = null;
        dead.onmessage = null;
        try { dead.close(1000, "No heartbeat"); } catch (error) { console.warn("team-play: closing a dead socket failed", error); }
      }
      setStatus("reconnecting");
      connect();
    };

    const retryNow = () => {
      if (document.visibilityState !== "visible" || final) return;
      if (!socket.current) connect();
    };
    connect();
    document.addEventListener("visibilitychange", retryNow);
    window.addEventListener("online", retryNow);
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      if (pongTimer.current) { clearTimeout(pongTimer.current); pongTimer.current = null; }
      document.removeEventListener("visibilitychange", retryNow);
      window.removeEventListener("online", retryNow);
      socket.current?.close(1000, "Left the page");
      socket.current = null;
    };
  }, [code]);

  const send = useCallback((message: ClientMessage) => {
    const ws = socket.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  }, []);

  const ping = useCallback(() => {
    const ws = socket.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || pongTimer.current) return;
    ws.send(PING);
    pongTimer.current = setTimeout(() => { pongTimer.current = null; restartRef.current(); }, PONG_TIMEOUT_MS);
  }, []);

  return { status, closed, send, ping };
}
