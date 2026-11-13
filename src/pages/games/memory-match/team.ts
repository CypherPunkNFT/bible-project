// Memory card match with team phones (docs/features/team-play/design.md, section 4 and Review 9-12): what each phone is
// shown, what a phone may send, and the laptop's saved room. The laptop stays the referee: a phone's tap is applied by
// the board itself, through the same handler as a click, only if it is that team's turn.
import type { HostRoom } from "../team-play/host";
import { cardText, isFinished, ranking, scores, winnerLine, type GameState } from "./game";
import type { PairsFile } from "./deal";
import type { Store } from "./storage";

/** d: face down; u: face up; f: found (by: the team that found it). */
export interface PhoneCard { s: "d" | "u" | "f"; text?: string; by?: number }

export type MemoryPhase = "lobby" | "study" | "play" | "done";

/** One view for every team (sent to "*"): each phone knows its own team. */
export interface MemoryView {
  game: "memory-match";
  phase: MemoryPhase;
  /** The board's number this session; a tap echoes it, and a tap from an older board is ignored (Review 3). */
  round: number;
  columns: number;
  cards: PhoneCard[];
  /** Whose turn: a team id ("t1"…), or null between games. */
  turn: string | null;
  names: string[];
  scores: number[];
  /** The summary's line, once every pair is found. */
  result: string | null;
}

export interface MemoryInput { flip: number; round: number }

export const teamId = (player: number) => `t${player + 1}`;
export const playerOf = (team: string) => Number(team.slice(1)) - 1;

export function phoneView(game: GameState | null, data: PairsFile, phase: MemoryPhase, round: number): MemoryView {
  if (!game) return { game: "memory-match", phase, round, columns: 0, cards: [], turn: null, names: [], scores: [], result: null };
  const cards = game.cards.map((card, index): PhoneCard => {
    const by = game.matched[index];
    if (by !== null) return { s: "f", text: cardText(data, card), by };
    return game.up.includes(index) ? { s: "u", text: cardText(data, card) } : { s: "d" };
  });
  const done = phase === "done" || isFinished(game);
  return {
    game: "memory-match", phase: done ? "done" : phase, round, columns: game.columns, cards,
    turn: done || phase !== "play" ? null : teamId(game.turn), names: game.players, scores: scores(game),
    result: done ? winnerLine(ranking(game)) : null,
  };
}

/** A phone's tap, if it is one: a card number and the board it was made on. */
export function readInput(data: unknown): MemoryInput | null {
  if (typeof data !== "object" || data === null) return null;
  const { flip, round } = data as Record<string, unknown>;
  return Number.isInteger(flip) && Number.isInteger(round) && (flip as number) >= 0 ? { flip: flip as number, round: round as number } : null;
}

// ---- The laptop's room, saved with the board in this tab (Review 12) ---------------------------------------------

const ROOM_KEY = "memory-match:team-room";

export function readTeamRoom(store: Store | null): HostRoom | null {
  try {
    const raw = store?.getItem(ROOM_KEY);
    const room = raw ? (JSON.parse(raw) as Partial<HostRoom>) : null;
    return room && typeof room.code === "string" && typeof room.token === "string" && Array.isArray(room.teams) ? (room as HostRoom) : null;
  } catch (error) {
    console.warn("Memory match: the saved team room could not be read", error);
    return null;
  }
}

export function saveTeamRoom(store: Store | null, room: HostRoom | null): void {
  try {
    store?.setItem(ROOM_KEY, room ? JSON.stringify(room) : ""); // the site's Store has no removeItem; "" reads as none
  } catch (error) {
    console.warn("Memory match: the team room could not be saved", error);
  }
}
