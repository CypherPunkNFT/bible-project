// Memory card match: the rules as a pure state machine (docs/features/memory-match/design.md sections 7 and 9).
// Turning cards, matching, moves, turns in pass and play, stars and the timer's sums. Nothing here waits for an
// animation: the page runs timers whose lengths match the CSS, so the rules are the same with reduced motion, in tests
// and in background tabs (design 11).
import type { Card, Difficulty, PairsFile } from "./deal";

export interface GameState {
  /** The pairs file this board was dealt from; a saved board from another build is not resumed. */
  stamp: string;
  deck: string;
  difficulty: Difficulty;
  columns: number;
  cards: Card[];
  /** Cards face up and not matched: none, the first of a move, or a non-pair still showing. */
  up: number[];
  /** For each card, the player who matched it (0 in solo play), or null while it is unmatched. */
  matched: (number | null)[];
  /** Pair ids in the order they were found. */
  found: string[];
  moves: number;
  /** One name in solo play; two to four in pass and play. */
  players: string[];
  turn: number;
  /** Time on the clock when last saved; the page adds the running stretch (design 7.1). */
  elapsedMs: number;
  /** Showing "See the pairs first": the board is dealt but play has not started. */
  studying: boolean;
}

export type FlipEvent =
  | { type: "ignored" }
  | { type: "first"; card: number }
  | { type: "pair"; card: number; pair: string; finished: boolean }
  | { type: "miss"; card: number };

export const isSolo = (state: GameState) => state.players.length < 2;
export const pairCount = (state: GameState) => state.cards.length / 2;
export const foundCount = (state: GameState) => state.found.length;
export const isFinished = (state: GameState) => state.cards.length > 0 && state.matched.every((m) => m !== null);
/** A non-pair is face up and waiting to turn back. */
export const isHolding = (state: GameState) => state.up.length === 2;
export const hasStarted = (state: GameState) => state.moves > 0 || state.up.length > 0;

export function newGame(stamp: string, deck: string, difficulty: Difficulty, columns: number, cards: Card[],
  players: string[], studying: boolean): GameState {
  return { stamp, deck, difficulty, columns, cards, up: [], matched: cards.map(() => null), found: [], moves: 0,
    players: players.length ? players : ["You"], turn: 0, elapsedMs: 0, studying };
}

/** Turns a non-pair back over. A no-op unless one is showing. */
export function turnBack(state: GameState): GameState {
  return isHolding(state) ? { ...state, up: [] } : state;
}

/**
 * One tap on card `index`. Taps on a face-up or matched card, or before play starts, do nothing. A tap while a
 * non-pair is showing turns it back at once and starts the next move with the tapped card (design 7.1).
 */
export function flip(state: GameState, index: number): { state: GameState; event: FlipEvent } {
  const ignored = { state, event: { type: "ignored" } as FlipEvent };
  if (state.studying || isFinished(state) || index < 0 || index >= state.cards.length) return ignored;
  if (state.matched[index] !== null || state.up.includes(index)) return ignored;
  const base = turnBack(state);
  if (base.up.length === 0) return { state: { ...base, up: [index] }, event: { type: "first", card: index } };
  const [first] = base.up;
  const a = base.cards[first];
  const b = base.cards[index];
  const moves = base.moves + 1;
  if (a.pair === b.pair && a.kind !== b.kind) {
    const matched = base.matched.map((m, n) => (n === first || n === index ? base.turn : m));
    const next = { ...base, up: [], matched, found: [...base.found, a.pair], moves };
    return { state: next, event: { type: "pair", card: index, pair: a.pair, finished: isFinished(next) } };
  }
  // A non-pair passes the turn in pass and play (the published family rule, design 7.2).
  const turn = isSolo(base) ? base.turn : (base.turn + 1) % base.players.length;
  return { state: { ...base, up: [first, index], moves, turn }, event: { type: "miss", card: index } };
}

/** Pairs found by each player. */
export function scores(state: GameState): number[] {
  const out = state.players.map(() => 0);
  state.matched.forEach((player, n) => { if (player !== null && state.cards[n].kind === "who") out[player] += 1; });
  return out;
}

export interface Standing { name: string; pairs: number; place: number }

/** Players best first; equal scores share a place (design 7.2). */
export function ranking(state: GameState): Standing[] {
  const totals = scores(state);
  const sorted = state.players.map((name, n) => ({ name, pairs: totals[n], order: n }))
    .sort((a, b) => b.pairs - a.pairs || a.order - b.order);
  return sorted.map(({ name, pairs }) => ({ name, pairs, place: 1 + sorted.filter((other) => other.pairs > pairs).length }));
}

/** "Player 1 wins with 5 pairs" or "Player 1 and Player 3 share the win, with 4 pairs each". */
export function winnerLine(standings: readonly Standing[]): string {
  const winners = standings.filter((s) => s.place === 1);
  const pairs = winners[0]?.pairs ?? 0;
  const unit = pairs === 1 ? "pair" : "pairs";
  if (winners.length === 1) return `${winners[0].name} wins with ${pairs} ${unit}`;
  const names = `${winners.slice(0, -1).map((w) => w.name).join(", ")} and ${winners[winners.length - 1].name}`;
  return `${names} share the win, with ${pairs} ${unit} each`;
}

/** Moves for three and two stars: ceil(1.75 × pairs) and ceil(2.5 × pairs) (design 9). */
export const starThresholds = (pairs: number) => ({ three: Math.ceil(1.75 * pairs), two: Math.ceil(2.5 * pairs) });

export function stars(moves: number, pairs: number): 1 | 2 | 3 {
  const { three, two } = starThresholds(pairs);
  return moves <= three ? 3 : moves <= two ? 2 : 1;
}

/** m:ss, and "60:00+" from an hour on (design 9). */
export function formatTime(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  if (seconds >= 3600) return "60:00+";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** The running clock: time banked so far plus the stretch since it last started, if it is running. */
export interface Clock { bankedMs: number; since: number | null }

export const clockStart = (clock: Clock, now: number): Clock => (clock.since === null ? { ...clock, since: now } : clock);
export const clockStop = (clock: Clock, now: number): Clock =>
  clock.since === null ? clock : { bankedMs: clock.bankedMs + Math.max(0, now - clock.since), since: null };
export const clockRead = (clock: Clock, now: number) => clock.bankedMs + (clock.since === null ? 0 : Math.max(0, now - clock.since));

/** What a card says, soft hyphens and all; for names read aloud, see `spoken`. */
export function cardText(data: PairsFile, card: Card): string {
  const pair = data.pairs.find((p) => p.id === card.pair)!;
  return card.kind === "who" ? data.characters[pair.who].label : pair.story;
}

/** Text for screen readers: no soft hyphens, no curly quotation marks. */
/** The soft hyphen long names carry so they break cleanly in narrow cards (design 4.1). */
export const SOFT_HYPHEN = String.fromCharCode(0xad);

export const spoken = (text: string) => text.split(SOFT_HYPHEN).join("").replace(/[“”]/g, "");

export const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
