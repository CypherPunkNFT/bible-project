// Memory card match with team phones (docs/features/team-play/design.md, section 4 and Review 9-12): what each phone is
// shown, what a phone may send, and the laptop's saved room. The laptop stays the referee: a phone's tap is applied by
// the board itself, through the same handler as a click, only if it is that team's turn.
import type { HostRoom } from "../team-play/host";
import { cardText, isFinished, ranking, scores, winnerLine, type GameState } from "./game";
import { typedBacks, type Card, type Difficulty, type PairsFile } from "./deal";
import type { Store } from "./storage";
import type { VersionKey } from "./versions";

/** d: face down (k only where its back shows the kind anyway: Easy and Medium); u: face up; f: found, with the words of
 *  both halves (the big screen's shelf shows them) and the team that found it. Never a pair id or pair colour: the
 *  board numbers colours by first appearance, so a colour would point at a card's partner (design 10.5). */
export interface PhoneCard { s: "d" | "u" | "f"; k?: Card["kind"]; text?: string; partner?: string; by?: number }

export type MemoryPhase = "lobby" | "study" | "play" | "done";

/** One view for every team (sent to "*"): each phone knows its own team. */
export interface MemoryView {
  game: "memory-match";
  phase: MemoryPhase;
  /** The board's number this session; a tap echoes it, and a tap from an older board is ignored (Review 3). */
  round: number;
  /** The version played (its card designs) and the level (its text sizes and whether backs name their kind). */
  version: VersionKey;
  difficulty: Difficulty;
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

function phoneCards(game: GameState, data: PairsFile): PhoneCard[] {
  const typed = typedBacks(game.difficulty);
  return game.cards.map((card, index): PhoneCard => {
    const by = game.matched[index];
    if (by !== null) {
      const other = game.cards.find((c, n) => n !== index && c.pair === card.pair);
      return { s: "f", k: card.kind, text: cardText(data, card), partner: other ? cardText(data, other) : undefined, by };
    }
    if (game.up.includes(index)) return { s: "u", k: card.kind, text: cardText(data, card) };
    return typed ? { s: "d", k: card.kind } : { s: "d" };
  });
}

export function phoneView(game: GameState | null, data: PairsFile, phase: MemoryPhase, round: number): MemoryView {
  if (!game) {
    return { game: "memory-match", phase, round, version: "people", difficulty: "easy", columns: 0, cards: [], turn: null, names: [], scores: [], result: null };
  }
  const done = phase === "done" || isFinished(game);
  return {
    game: "memory-match", phase: done ? "done" : phase, round, version: game.version ?? "people", difficulty: game.difficulty,
    columns: game.columns, cards: phoneCards(game, data),
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
