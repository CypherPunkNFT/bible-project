// Memory card match's team phones, on the laptop (docs/features/team-play/design.md, section 4 and Review 9-12): the
// room, saved with the board in this tab; the lobby before the first board; a view to every phone after each change;
// and each phone's tap handed to the board. If the room ends or cannot be reached, the game simply carries on as a
// one-screen game.
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { createTeamRoom, useTeamHost, type HostRoom, type TeamHost } from "../team-play/host";
import type { RemoteFlip } from "./Board";
import type { PairsFile } from "./deal";
import type { GameState } from "./game";
import type { Store } from "./storage";
import { phoneView, playerOf, readInput, readTeamRoom, saveTeamRoom, type MemoryPhase } from "./team";

/** A tap that was queued is answered with a fresh view this long after, whether or not the board applied it. */
const ANSWER_AFTER_MS = 1500;

/** Team names the room accepts: distinct, so a repeated name gets a number. */
export function distinctNames(names: readonly string[]): string[] {
  const seen = new Set<string>();
  return names.map((raw, n) => {
    let name = raw.trim().slice(0, 20) || `Team ${n + 1}`;
    for (let k = 2; seen.has(name.toLowerCase()); k++) name = `${raw.trim().slice(0, 17) || "Team"} ${k}`;
    seen.add(name.toLowerCase());
    return name;
  });
}

interface Shown { game: GameState | null; board: PairsFile | null; phase: MemoryPhase; round: number }

export interface MemoryTeams {
  room: HostRoom | null;
  host: TeamHost;
  lobby: boolean;
  startPlay: () => void;
  error: string | null;
  /** Opens a room for these players (or keeps the open one if it already has them). Resolves false if it could not. */
  open: (players: string[]) => Promise<boolean>;
  close: () => void;
  remote: MutableRefObject<RemoteFlip | null>;
}

export function useMemoryTeams(session: Store | null, hasGame: boolean, shown: Omit<Shown, "phase"> & { finished: boolean }): MemoryTeams {
  const [room, setRoom] = useState<HostRoom | null>(() => (hasGame ? readTeamRoom(session) : null));
  const [lobby, setLobby] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remote = useRef<RemoteFlip | null>(null);
  const phase: MemoryPhase = lobby || !shown.game ? "lobby" : shown.finished ? "done" : shown.game.studying ? "study" : "play";
  const current = useRef<Shown>({ ...shown, phase });
  current.current = { ...shown, phase };
  const pushRef = useRef<() => void>(() => {});

  const onInput = useCallback((team: string, data: unknown) => {
    const input = readInput(data);
    if (input && input.round === current.current.round && current.current.phase === "play" && remote.current) {
      remote.current(playerOf(team), input.flip);
      window.setTimeout(() => pushRef.current(), ANSWER_AFTER_MS);
    } else {
      pushRef.current(); // a stale or refused tap: the phone gets the board as it is now
    }
  }, []);

  const host = useTeamHost(room, onInput);
  const { sendView } = host;
  pushRef.current = () => {
    const { game, board, phase: now, round } = current.current;
    if (room && board) sendView("*", phoneView(game, board, now, round));
  };
  useEffect(() => { pushRef.current(); }, [room, shown.game, shown.board, shown.finished, shown.round, lobby, sendView]);

  const forget = useCallback(() => { setRoom(null); setLobby(false); saveTeamRoom(session, null); }, [session]);
  // The room ended or this screen was replaced: carry on as a one-screen game.
  useEffect(() => { if (host.gone) forget(); }, [host.gone, forget]);

  const open = useCallback(async (players: string[]) => {
    const names = distinctNames(players);
    if (room && room.teams.length === names.length && room.teams.every((team, n) => team.name === names[n])) return true;
    if (room) host.end();
    setError(null);
    try {
      const made = await createTeamRoom("memory-match", names);
      setRoom(made);
      saveTeamRoom(session, made);
      setLobby(true);
      return true;
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
      return false;
    }
  }, [room, host, session]);

  const close = useCallback(() => { if (room) host.end(); forget(); }, [room, host, forget]);

  return { room, host, lobby, startPlay: () => setLobby(false), error, open, close, remote };
}
