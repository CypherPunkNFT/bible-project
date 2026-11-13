// The laptop's side of team play (docs/features/team-play/design.md, section 3): creating a room, signing in as its
// big screen, the teams and whether each has a phone, sending views and hearing inputs. The latest views are kept here
// and sent again every time the big screen signs back in (Review 4), so a reconnect never leaves a phone on an old screen.
import { useCallback, useRef, useState } from "react";
import type { TeamGame, TeamStatus, ServerMessage } from "@/lib/team-room/protocol";
import { useTeamRoom, type TeamSocket } from "./useTeamRoom";

/** What the laptop keeps (in sessionStorage, with its game) to sign back in after a reload. */
export interface HostRoom { code: string; token: string; teams: TeamStatus[] }

export const joinAddress = () => `${window.location.host}/team`;
export const joinUrl = (code: string) => `${window.location.origin}/team/${code}`;

/** Asks for a room; throws an Error with a sentence fit to show the leader. */
export async function createTeamRoom(game: TeamGame, teams: string[]): Promise<HostRoom> {
  let response: Response;
  try {
    response = await fetch("/api/team-room/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ game, teams }) });
  } catch (error) {
    console.warn("team-play: the room could not be reached", error);
    throw new Error("The team-game server could not be reached. Check the internet connection, or play on this screen only.");
  }
  const body = (await response.json().catch(() => ({}))) as { code?: string; token?: string; error?: string };
  if (!response.ok || !body.code || !body.token) {
    throw new Error(body.error ?? `The team game could not be started (the server answered ${response.status}).`);
  }
  return { code: body.code, token: body.token, teams: teams.map((name, n) => ({ id: `t${n + 1}`, name, state: "open" })) };
}

export interface TeamHost {
  socket: TeamSocket;
  teams: TeamStatus[];
  /** The room has gone (ended, wiped, or this screen was replaced by another). */
  gone: boolean;
  sendView: (team: string, view: unknown) => void;
  free: (team: string) => void;
  end: () => void;
}

export function useTeamHost(room: HostRoom | null, onInput: (team: string, data: unknown) => void): TeamHost {
  const [teams, setTeams] = useState<TeamStatus[]>(room?.teams ?? []);
  const views = useRef(new Map<string, unknown>());
  const resend = useRef(false);
  const inputRef = useRef(onInput);
  inputRef.current = onInput;
  const sendRef = useRef<TeamSocket["send"]>(() => {});

  const hello = useCallback(() => {
    resend.current = true;
    return room ? { t: "host" as const, token: room.token } : null;
  }, [room]);

  const onMessage = useCallback((message: ServerMessage) => {
    if (message.t === "teams") {
      setTeams(message.teams);
      if (resend.current) {
        resend.current = false;
        for (const [team, view] of views.current) sendRef.current({ t: "view", team, view });
      }
    } else if (message.t === "input") {
      inputRef.current(message.team, message.data);
    } else if (message.t === "error") {
      console.warn(`team-play: the room refused a message from the big screen (${message.code}): ${message.message}`);
    }
  }, []);

  const socket = useTeamRoom(room?.code ?? null, hello, onMessage);
  const { send } = socket;
  sendRef.current = send;

  const sendView = useCallback((team: string, view: unknown) => {
    if (team === "*") views.current.clear();
    views.current.set(team, view);
    send({ t: "view", team, view });
  }, [send]);
  const free = useCallback((team: string) => send({ t: "free", team }), [send]);
  const end = useCallback(() => send({ t: "end" }), [send]);

  return { socket, teams, gone: socket.status === "closed", sendView, free, end };
}
