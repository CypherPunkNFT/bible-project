// A team phone's side of team play (docs/features/team-play/design.md, section 3 and Review 2, 5): takes a team, or
// takes it back after a drop or reload with the token kept in this tab, shows the latest view the big screen sent, and
// sends inputs. Every input and every return to the tab checks the line with a heartbeat.
import { useCallback, useEffect, useRef, useState } from "react";
import { CLOSE, type ErrorCode, type ServerMessage } from "@/lib/team-room/protocol";
import { useTeamRoom, type SocketStatus } from "./useTeamRoom";

export interface PhoneSeat { team: string; name: string; token: string }

const seatKey = (code: string) => `team-play:seat:${code}`;

export function readSeat(code: string): PhoneSeat | null {
  try {
    const raw = window.sessionStorage.getItem(seatKey(code));
    const seat = raw ? (JSON.parse(raw) as Partial<PhoneSeat>) : null;
    return seat && typeof seat.team === "string" && typeof seat.token === "string" && typeof seat.name === "string" ? (seat as PhoneSeat) : null;
  } catch (error) {
    console.warn("team-play: this tab's team could not be read", error);
    return null;
  }
}

function writeSeat(code: string, seat: PhoneSeat | null): void {
  try {
    if (seat) window.sessionStorage.setItem(seatKey(code), JSON.stringify(seat));
    else window.sessionStorage.removeItem(seatKey(code));
  } catch (error) {
    console.warn("team-play: this tab's team could not be saved", error);
  }
}

export interface TeamPhone {
  status: SocketStatus;
  seat: PhoneSeat | null;
  view: unknown;
  hostOnline: boolean;
  /** Why the phone has no team: a refused claim, or its team taken or freed. */
  problem: { code: ErrorCode | "ended"; message: string } | null;
  sendInput: (data: unknown) => void;
  /** Back to choosing a team (after a refusal or a take-over). */
  reset: () => void;
}

/** `wanted`: the team this phone asked for, until the room confirms; ignored once the tab holds a seat. */
export function useTeamPhone(code: string, wanted: string | null, onReset: () => void): TeamPhone {
  const [seat, setSeat] = useState<PhoneSeat | null>(() => readSeat(code));
  const [view, setView] = useState<unknown>(null);
  const [hostOnline, setHostOnline] = useState(true);
  const [problem, setProblem] = useState<TeamPhone["problem"]>(null);
  const seatRef = useRef(seat);
  seatRef.current = seat;
  // No socket while choosing a team: the room accepts one sign-in per socket, so each choice opens a fresh one.
  const active = Boolean(seat || wanted) && !problem;

  const hello = useCallback(() => {
    const held = seatRef.current;
    if (held) return { t: "rejoin" as const, team: held.team, token: held.token };
    return wanted ? { t: "claim" as const, team: wanted } : null;
  }, [wanted]);

  const onMessage = useCallback((message: ServerMessage) => {
    if (message.t === "claimed") {
      const next = { team: message.team, name: message.name, token: message.token };
      writeSeat(code, next);
      setSeat(next);
    } else if (message.t === "view") {
      setView(message.view);
    } else if (message.t === "host") {
      setHostOnline(message.online);
    } else if (message.t === "error" && (message.code === "team-held" || message.code === "team-taken" || message.code === "unknown-team")) {
      writeSeat(code, null);
      setSeat(null);
      setView(null);
      setProblem({ code: message.code, message: message.message });
    }
  }, [code]);

  const socket = useTeamRoom(active ? code : null, hello, onMessage);
  const { ping, send } = socket;

  useEffect(() => {
    if (!socket.closed) return;
    if (socket.closed.code === CLOSE.teamTaken) {
      writeSeat(code, null);
      setSeat(null);
      setProblem((current) => current ?? { code: "team-taken", message: socket.closed!.reason || "Another phone has this team now." });
    } else if (socket.closed.code !== CLOSE.replaced) {
      writeSeat(code, null);
      setProblem({ code: "ended", message: "This game has ended." });
    }
  }, [socket.closed, code]);

  // Back from a locked screen: make sure the line is alive.
  useEffect(() => {
    const check = () => { if (document.visibilityState === "visible") ping(); };
    document.addEventListener("visibilitychange", check);
    return () => document.removeEventListener("visibilitychange", check);
  }, [ping]);

  const sendInput = useCallback((data: unknown) => {
    send({ t: "input", data });
    ping();
  }, [send, ping]);

  const reset = useCallback(() => {
    setProblem(null);
    setView(null);
    onReset();
  }, [onReset]);

  return { status: socket.status, seat, view, hostOnline, problem, sendInput, reset };
}
