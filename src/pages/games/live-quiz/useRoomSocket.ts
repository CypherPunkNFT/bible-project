// The live quiz's connection to its room (design.md 6.5, 7.1), for the leader's page and the phones: connects, signs
// in with `hello` on every (re)connect, reconnects after a drop with backoff (0.5, 1, 2, 4, then every 8 s) and at once
// when the tab returns or the network comes back, and keeps the offset between this device's clock and the server's
// so countdowns agree. A close that ends the game for this device (removed, replaced, ended, not found) is final, and
// so is a reconnect the server turns away when the room has gone (the game ended while this device was away).
import { useCallback, useEffect, useRef, useState } from "react";
import { CLOSE, FINAL_CLOSES, type ClientMessage, type ServerMessage } from "@/lib/live-quiz/protocol";

export type SocketStatus = "connecting" | "open" | "reconnecting" | "closed" | "unsupported";
export interface RoomSocket { status: SocketStatus; closeCode: number | null; send: (message: ClientMessage) => void; offset: number }

const BACKOFF = [500, 1000, 2000, 4000, 8000];
const PROBE_TIMEOUT_MS = 5000;

export const socketUrl = (code: string) => `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/api/live-quiz/rooms/${code}/socket`;

export function useRoomSocket(code: string | null, hello: () => ClientMessage | null, onMessage: (message: ServerMessage) => void): RoomSocket {
  const [status, setStatus] = useState<SocketStatus>(() => (typeof WebSocket === "undefined" ? "unsupported" : "connecting"));
  const [closeCode, setCloseCode] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const socket = useRef<WebSocket | null>(null);
  const handlers = useRef({ hello, onMessage });
  handlers.current = { hello, onMessage };

  useEffect(() => {
    if (!code || typeof WebSocket === "undefined") return;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let final = false;
    let disposed = false;
    let probed = false;
    let probe: AbortController | null = null;
    setCloseCode(null);

    const end = (closeWith: number) => {
      final = true;
      setCloseCode(closeWith);
      setStatus("closed");
    };

    // Asked once per outage, when a reconnect is refused before it opens: has the room gone? The backoff timer keeps
    // running meanwhile; the answer only stops it, and is ignored if a newer socket has opened since.
    const checkRoomGone = async () => {
      probed = true;
      const controller = new AbortController();
      probe = controller;
      const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
      try {
        const response = await fetch(`/api/live-quiz/rooms/${code}`, { cache: "no-store", signal: controller.signal });
        const info = response.ok ? ((await response.json()) as { exists?: unknown }) : null;
        if (disposed || final || info?.exists !== false || socket.current?.readyState === WebSocket.OPEN) return;
        if (timer) { clearTimeout(timer); timer = null; }
        socket.current?.close(1000, "The game has ended");
        socket.current = null;
        end(CLOSE.notFound);
      } catch (error) {
        if (!disposed) console.warn(`live-quiz: could not check whether room ${code} still exists`, error);
      } finally {
        clearTimeout(timeout);
      }
    };

    const connect = () => {
      if (disposed || final) return;
      if (timer) { clearTimeout(timer); timer = null; }
      const ws = new WebSocket(socketUrl(code));
      let opened = false;
      socket.current = ws;
      ws.onopen = () => {
        opened = true;
        const first = handlers.current.hello();
        if (first) ws.send(JSON.stringify(first));
      };
      ws.onmessage = (event) => {
        let message: ServerMessage;
        try {
          message = JSON.parse(String(event.data)) as ServerMessage;
        } catch (error) {
          console.warn("live-quiz: a message from the room could not be read", error);
          return;
        }
        if (message.t === "state") { attempt = 0; probed = false; setOffset(message.serverNow - Date.now()); setStatus("open"); }
        handlers.current.onMessage(message);
      };
      ws.onclose = (event) => {
        if (socket.current === ws) socket.current = null;
        if (disposed || final) return;
        if (FINAL_CLOSES.includes(event.code)) return end(event.code);
        setStatus("reconnecting");
        if (timer) clearTimeout(timer);
        timer = setTimeout(connect, BACKOFF[Math.min(attempt, BACKOFF.length - 1)]);
        attempt += 1;
        if (!opened && !probed) void checkRoomGone();
      };
    };

    // Back from a locked screen or a dropped network: try now rather than waiting out the backoff.
    const retryNow = () => {
      if (document.visibilityState === "visible" && !socket.current && !final) connect();
    };
    connect();
    document.addEventListener("visibilitychange", retryNow);
    window.addEventListener("online", retryNow);
    return () => {
      disposed = true;
      probe?.abort();
      if (timer) clearTimeout(timer);
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

  return { status, closeCode, send, offset };
}

/** Milliseconds left until a server timestamp, by this device's clock corrected with the offset; ticks every 200 ms. */
export function useCountdown(until: number | null, offset: number, held: number | null = null): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (until === null || held !== null) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [until, held]);
  if (held !== null) return held;
  return until === null ? null : Math.max(0, until - (now + offset));
}

/** Whole seconds left, rounded up, for a countdown's figure. */
export const seconds = (ms: number | null) => (ms === null ? 0 : Math.ceil(ms / 1000));
