// Family charades: one round and a team game, as pure state (design §6). Times are milliseconds from
// performance.now(), passed in by the page, so the clock counts from an end time and never from ticks.
import { answerScene, deal, newDealer, type Dealer } from "./deck";

export type Mark = "correct" | "pass" | "unplayed";
export const ROUND_SECONDS = [30, 60, 90, 120] as const;
export type Seconds = (typeof ROUND_SECONDS)[number];

export interface Row { id: string; mark: Mark }

export type RoundPhase = "playing" | "paused" | "over";
export type EndReason = "time" | "deck" | "stopped";

export interface Round {
  phase: RoundPhase;
  dealer: Dealer;
  /** The scene on screen, or null during an answer's feedback and after the end. */
  current: string | null;
  /** One row per scene, in the order first played; a passed scene that comes back keeps its row. */
  rows: Row[];
  endsAt: number;
  /** While paused, and after the end: what was left on the clock. */
  leftMs: number;
  ended?: EndReason;
}

type StoryOf = (id: string) => string | undefined;

function withRow(rows: Row[], id: string, mark: Mark): Row[] {
  return rows.some((r) => r.id === id) ? rows.map((r) => (r.id === id ? { ...r, mark } : r)) : [...rows, { id, mark }];
}

function finish(round: Round, now: number, ended: EndReason): Round {
  const leftMs = round.phase === "paused" ? round.leftMs : Math.max(0, round.endsAt - now);
  const rows = round.current && !round.rows.some((r) => r.id === round.current) ? [...round.rows, { id: round.current, mark: "unplayed" as const }] : round.rows;
  return { ...round, phase: "over", current: null, rows, leftMs: ended === "time" ? 0 : leftMs, ended };
}

/** "Go!": the clock starts and the first scene is dealt. */
export function startRound(order: string[], seconds: number, now: number, storyOf: StoryOf): Round {
  const first = deal(newDealer(order), storyOf);
  const round: Round = { phase: "playing", dealer: first.dealer, current: first.id, rows: [], endsAt: now + seconds * 1000, leftMs: seconds * 1000 };
  return first.id ? round : finish(round, now, "deck");
}

/** The clock, checked: past the end time, the round is over and the scene on screen is not played (§6.1). */
export function tick(round: Round, now: number): Round {
  return round.phase === "playing" && now >= round.endsAt ? finish(round, now, "time") : round;
}

/** Got it or Pass on the scene on screen. The next scene comes with `advance`, after the feedback. */
export function answer(round: Round, mark: "correct" | "pass", now: number): Round {
  const timed = tick(round, now);
  if (timed.phase !== "playing" || !timed.current) return timed; // time's up wins; nothing on screen to answer
  return { ...timed, dealer: answerScene(timed.dealer, timed.current, mark), rows: withRow(timed.rows, timed.current, mark), current: null };
}

/** After the feedback: the next scene, or the end of the round if every dealable scene has been guessed. */
export function advance(round: Round, now: number, storyOf: StoryOf): Round {
  const timed = tick(round, now);
  if (timed.phase !== "playing" || timed.current) return timed;
  const next = deal(timed.dealer, storyOf);
  return next.id ? { ...timed, dealer: next.dealer, current: next.id } : finish({ ...timed, dealer: next.dealer }, now, "deck");
}

export function pause(round: Round, now: number): Round {
  const timed = tick(round, now);
  return timed.phase === "playing" ? { ...timed, phase: "paused", leftMs: Math.max(0, timed.endsAt - now) } : timed;
}

export function resume(round: Round, now: number): Round {
  return round.phase === "paused" ? { ...round, phase: "playing", endsAt: now + round.leftMs } : round;
}

/** "End round now" from the pause sheet: the recap with what was played. */
export const stopRound = (round: Round, now: number): Round => (round.phase === "over" ? round : finish(round, now, "stopped"));

export const leftMs = (round: Round, now: number) => (round.phase === "playing" ? Math.max(0, round.endsAt - now) : round.leftMs);

export const scoreOf = (rows: readonly Row[]) => rows.filter((r) => r.mark === "correct").length;
export const passesOf = (rows: readonly Row[]) => rows.filter((r) => r.mark === "pass").length;

/** Fixing a mis-tilt on the recap: ✓ and ↷ swap; a not-played scene can be marked ✓ (§6.3). */
export function fixMark(rows: readonly Row[], id: string): Row[] {
  return rows.map((r) => (r.id !== id ? r : { ...r, mark: r.mark === "correct" ? "pass" : "correct" }));
}

/** The scenes that count as seen: answered either way, never the one left on screen at the buzzer. */
export const playedIds = (rows: readonly Row[]) => rows.filter((r) => r.mark !== "unplayed").map((r) => r.id);

// --- Teams (§6.4) ---

export const MAX_TEAM_NAME = 16;
export const TEAM_COUNTS = [2, 3, 4] as const;
export const TURN_COUNTS = [1, 2, 3, 4, 5] as const;

export interface TeamGame {
  teams: string[];
  turnsEach: number;
  totals: number[];
  /** Turns finished so far; the team on turn is `turn % teams.length`. */
  turn: number;
  /** The last finished turn's score, so a fix on its recap can change the total. */
  lastScore: number;
}

export const defaultTeamNames = (count: number) => Array.from({ length: count }, (_, i) => `Team ${i + 1}`);

export function cleanTeamName(name: string, index: number): string {
  const clean = name.replace(/\s+/g, " ").trim().slice(0, MAX_TEAM_NAME);
  return clean || `Team ${index + 1}`;
}

export function newTeamGame(names: readonly string[], turnsEach: number): TeamGame {
  const teams = names.map(cleanTeamName);
  return { teams, turnsEach, totals: teams.map(() => 0), turn: 0, lastScore: 0 };
}

export const teamOnTurn = (game: TeamGame) => game.turn % game.teams.length;
export const gameOver = (game: TeamGame) => game.turn >= game.teams.length * game.turnsEach;

/** A round has ended: its score goes to the team that played it and the next team is on turn. */
export function recordTurn(game: TeamGame, score: number): TeamGame {
  const team = teamOnTurn(game);
  return { ...game, totals: game.totals.map((t, i) => (i === team ? t + score : t)), turn: game.turn + 1, lastScore: score };
}

/** A mark fixed on the last turn's recap: that team's total follows. */
export function refixLastTurn(game: TeamGame, score: number): TeamGame {
  const team = (game.turn - 1) % game.teams.length;
  if (game.turn === 0) return game;
  return { ...game, totals: game.totals.map((t, i) => (i === team ? t - game.lastScore + score : t)), lastScore: score };
}

/** Largest total first; equal totals share a place (no tie-break: it is a family game). */
export function standings(game: TeamGame): { name: string; total: number; place: number; index: number }[] {
  const sorted = game.teams.map((name, i) => ({ name, total: game.totals[i], index: i })).sort((a, b) => b.total - a.total || a.index - b.index);
  return sorted.map(({ name, total, index }) => ({ name, total, index, place: 1 + sorted.filter((other) => other.total > total).length }));
}
