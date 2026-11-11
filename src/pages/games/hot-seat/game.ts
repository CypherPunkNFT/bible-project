// Hot seat: the session as one reducer (design §4–5). Players, rounds, the turn in progress and every saved turn; the
// only place points change. Pure: drawing a question needs the bank and a random function, so the page draws and the
// actions carry the question it drew. Standings and shout-outs are worked out from this state in leaderboard.ts.
import { NAME_MAX, normaliseName } from "@/lib/live-quiz/names";
import type { FrozenQuestion } from "./deal";
import type { Group, Testament } from "./pool";

export type Mark = "right" | "wrong" | "pass";
export type Style = "open" | "two";
export type TwoChoicesFor = "little" | "kids" | "nobody";

export const SECONDS = [30, 45, 60, 90] as const;
export type Seconds = (typeof SECONDS)[number];
export const ROUND_COUNTS = [1, 2, 3, 4, 5] as const;
export const MAX_PLAYERS = 12;
/** After the buzzer, the open question is left unmarked if the reader does nothing for this long (§4.3). */
export const IDLE_CLOSE_MS = 15_000;

export interface Settings { seconds: Seconds; testament: Testament; twoChoices: TwoChoicesFor; sound: boolean }
export const DEFAULT_SETTINGS: Settings = { seconds: 60, testament: "", twoChoices: "little", sound: true };

export interface Player { id: string; name: string; group: Group; joinedRound: number; left: boolean }
export interface Asked { q: FrozenQuestion; mark: Mark | null }

interface TurnBase { round: number; playerId: string; group: Group; seconds: Seconds; style: Style; questions: Asked[] }
/** The turn in progress. Its group, length, style and testament are fixed when it starts (§4.3: changes apply from the next turn). */
export interface Turn extends TurnBase {
  testament: Testament;
  /** Questions shown and then undone: they count as asked, so they do not come straight back. */
  discarded: string[];
  phase: "live" | "overtime" | "recap";
  leftMs: number;
}
export interface SavedTurn extends TurnBase { skipped: boolean }

export interface Session {
  version: 1;
  settings: Settings;
  players: Player[];
  rounds: number;
  turns: SavedTurn[];
  current: Turn | null;
  ended: boolean;
  nextId: number;
}

/** A typed name made ready: cleaned as the live quiz cleans names, then cut to 16 characters without splitting an emoji (§4.1). */
export const cutName = (raw: string) => Array.from(normaliseName(raw)).slice(0, NAME_MAX).join("").trim();

/** The time a game takes: players × rounds × (turn + about 40 seconds for the hand-over and recap), in minutes (§4.4). */
export const estimateMinutes = (players: number, rounds: number, seconds: number) => Math.max(1, Math.ceil((players * rounds * (seconds + 40)) / 60));

export const scoreOf = (questions: readonly Asked[]) => questions.filter((a) => a.mark === "right").length;

/** Right answers in a row at the end of the marked questions (the open one does not count): the turn's flame. */
export function currentRun(questions: readonly Asked[]): number {
  let run = 0;
  for (let i = questions.length - 1; i >= 0; i--) {
    const mark = questions[i].mark;
    if (mark === null) continue;
    if (mark !== "right") break;
    run++;
  }
  return run;
}

/** Who answers with two choices (§3.1): Little ones by default, Little ones and kids, or nobody. */
export function styleFor(group: Group, twoChoices: TwoChoicesFor): Style {
  if (group === "little") return twoChoices === "nobody" ? "open" : "two";
  return group === "kids" && twoChoices === "kids" ? "two" : "open";
}

export function newSession(roster: readonly { name: string; group: Group }[], settings: Settings, rounds: number): Session {
  const players = roster.map((p, i) => ({ id: `p${i + 1}`, name: p.name, group: p.group, joinedRound: 1, left: false }));
  return { version: 1, settings, players, rounds, turns: [], current: null, ended: false, nextId: players.length + 1 };
}

const activeIn = (s: Session, round: number) => s.players.filter((p) => !p.left && p.joinedRound <= round);
const hasTurn = (s: Session, round: number, playerId: string) => s.turns.some((t) => t.round === round && t.playerId === playerId);

/** Round `round`'s order: the players in it, in setup order, turned by one each round so nobody always goes first (§4.2). */
export function roundOrder(s: Session, round: number): Player[] {
  const players = activeIn(s, round);
  if (players.length === 0) return [];
  const shift = (round - 1) % players.length;
  return [...players.slice(shift), ...players.slice(0, shift)];
}

/** The round being played: the first with a player still to have a turn; null when every round is done. */
export function currentRound(s: Session): number | null {
  for (let r = 1; r <= s.rounds; r++) if (roundOrder(s, r).some((p) => !hasTurn(s, r, p.id))) return r;
  return null;
}

/** Who sits next, and in which round; null when the game is over. */
export function nextUp(s: Session): { round: number; player: Player } | null {
  if (s.ended) return null;
  const round = currentRound(s);
  if (round === null) return null;
  const player = roundOrder(s, round).find((p) => !hasTurn(s, round, p.id));
  return player ? { round, player } : null;
}

export const isOver = (s: Session) => s.current === null && nextUp(s) === null;

/** The suggested reader: whoever sat last, unless that is the next player too (§4.2). */
export function suggestedReader(s: Session): Player | null {
  const last = [...s.turns].reverse().find((t) => !t.skipped);
  const next = nextUp(s)?.player;
  const player = last ? s.players.find((p) => p.id === last.playerId) : undefined;
  return player && player.id !== next?.id ? player : null;
}

/** Players still to sit in the round that was being played when the game was ended (§4.4). */
export function missedTurns(s: Session): Player[] {
  const round = currentRound(s);
  return round === null ? [] : roundOrder(s, round).filter((p) => !hasTurn(s, round, p.id));
}

export type Action =
  | { type: "start"; first: FrozenQuestion | null }
  | { type: "mark"; mark: Mark; next: FrozenQuestion | null; leftMs: number }
  | { type: "undo"; leftMs: number }
  | { type: "time"; leftMs: number }
  | { type: "time-up" }
  | { type: "close" }
  | { type: "fix"; index: number }
  | { type: "save" }
  | { type: "skip" }
  | { type: "add-player"; name: string; group: Group }
  | { type: "remove-player"; id: string }
  | { type: "set-group"; id: string; group: Group }
  | { type: "settings"; settings: Partial<Settings> }
  | { type: "add-round" }
  | { type: "new-game" }
  | { type: "end" };

const NEXT_MARK: Record<Mark, Mark> = { right: "wrong", wrong: "pass", pass: "right" };
const clampLeft = (ms: number, seconds: number) => Math.max(0, Math.min(seconds * 1000, Math.round(ms)));

function startTurn(s: Session, first: FrozenQuestion | null): Session {
  const up = nextUp(s);
  if (!up || s.current) return s;
  const { round, player } = up;
  const { seconds, testament, twoChoices } = s.settings;
  const questions = first ? [{ q: first, mark: null }] : [];
  const turn: Turn = { round, playerId: player.id, group: player.group, seconds, style: styleFor(player.group, twoChoices), testament,
    questions, discarded: [], phase: first ? "live" : "recap", leftMs: seconds * 1000 };
  return { ...s, current: turn };
}

function markTurn(turn: Turn, mark: Mark, next: FrozenQuestion | null, leftMs: number): Turn {
  const last = turn.questions.at(-1);
  if (turn.phase === "recap" || !last || last.mark !== null) return turn;
  const questions = [...turn.questions.slice(0, -1), { ...last, mark }];
  if (turn.phase === "overtime") return { ...turn, questions, phase: "recap", leftMs: 0 };
  // The question already on screen when time ran out is finished (§4.3); otherwise the next one shows at once.
  if (!next) return { ...turn, questions, phase: "recap", leftMs: clampLeft(leftMs, turn.seconds) };
  return { ...turn, questions: [...questions, { q: next, mark: null }], leftMs: clampLeft(leftMs, turn.seconds) };
}

function undoTurn(turn: Turn, leftMs: number): Turn {
  if (turn.phase !== "live") return turn;
  let lastMarked = turn.questions.length - 1;
  while (lastMarked >= 0 && turn.questions[lastMarked].mark === null) lastMarked--;
  if (lastMarked < 0) return turn;
  const dropped = turn.questions.slice(lastMarked + 1).map((a) => a.q.id);
  const questions = [...turn.questions.slice(0, lastMarked), { ...turn.questions[lastMarked], mark: null }];
  return { ...turn, questions, discarded: [...turn.discarded, ...dropped], leftMs: clampLeft(leftMs, turn.seconds) };
}

function fixMark(turn: Turn, index: number): Turn {
  const asked = turn.questions[index];
  if (turn.phase !== "recap" || !asked) return turn;
  const mark: Mark = asked.mark === null ? "right" : NEXT_MARK[asked.mark];
  return { ...turn, questions: turn.questions.map((a, i) => (i === index ? { ...a, mark } : a)) };
}

function saveTurn(s: Session): Session {
  const turn = s.current;
  if (!turn || turn.phase !== "recap") return s;
  const saved: SavedTurn = { round: turn.round, playerId: turn.playerId, group: turn.group, seconds: turn.seconds, style: turn.style,
    questions: turn.questions, skipped: false };
  return { ...s, turns: [...s.turns, saved], current: null };
}

function skipTurn(s: Session): Session {
  const up = nextUp(s);
  if (!up || s.current) return s;
  const skipped: SavedTurn = { round: up.round, playerId: up.player.id, group: up.player.group, seconds: s.settings.seconds,
    style: styleFor(up.player.group, s.settings.twoChoices), questions: [], skipped: true };
  return { ...s, turns: [...s.turns, skipped] };
}

/** A latecomer starts from the next round with 0 points (§6.8); before anyone has sat, from round 1. */
function addPlayer(s: Session, name: string, group: Group): Session {
  if (s.players.filter((p) => !p.left).length >= MAX_PLAYERS) return s;
  const round = currentRound(s);
  const joinedRound = s.turns.length === 0 && !s.current ? 1 : round === null ? s.rounds + 1 : round + 1;
  const player: Player = { id: `p${s.nextId}`, name, group, joinedRound, left: false };
  return { ...s, players: [...s.players, player], nextId: s.nextId + 1 };
}

/** A player who leaves keeps their points, marked "left"; the one in the seat cannot be removed mid-turn. */
function removePlayer(s: Session, id: string): Session {
  if (s.current?.playerId === id) return s;
  const players = s.players.map((p) => (p.id === id ? { ...p, left: true } : p));
  return { ...s, players, ended: s.ended || players.every((p) => p.left) };
}

function onTurn(s: Session, change: (turn: Turn) => Turn): Session {
  if (!s.current) return s;
  const current = change(s.current);
  return current === s.current ? s : { ...s, current };
}

export function reduce(s: Session, action: Action): Session {
  switch (action.type) {
    case "start": return startTurn(s, action.first);
    case "mark": return onTurn(s, (t) => markTurn(t, action.mark, action.next, action.leftMs));
    case "undo": return onTurn(s, (t) => undoTurn(t, action.leftMs));
    case "time": return onTurn(s, (t) => (t.phase === "live" ? { ...t, leftMs: clampLeft(action.leftMs, t.seconds) } : t));
    case "time-up": return onTurn(s, (t) => (t.phase === "live" ? { ...t, phase: "overtime", leftMs: 0 } : t));
    case "close": return onTurn(s, (t) => (t.phase === "overtime" ? { ...t, phase: "recap" } : t));
    case "fix": return onTurn(s, (t) => fixMark(t, action.index));
    case "save": return saveTurn(s);
    case "skip": return skipTurn(s);
    case "add-player": return addPlayer(s, action.name, action.group);
    case "remove-player": return removePlayer(s, action.id);
    case "set-group": return { ...s, players: s.players.map((p) => (p.id === action.id ? { ...p, group: action.group } : p)) };
    case "settings": return { ...s, settings: { ...s.settings, ...action.settings } };
    case "add-round": return { ...s, rounds: s.rounds + 1, ended: s.players.every((p) => p.left) };
    case "new-game": return { ...s, players: s.players.filter((p) => !p.left).map((p) => ({ ...p, joinedRound: 1 })), turns: [], current: null, ended: false };
    case "end": return { ...s, current: null, ended: true };
  }
}

/** Every question id asked this session, oldest first, including the turn in progress and undone questions. */
export function askedIds(s: Session): string[] {
  const ids = s.turns.flatMap((t) => t.questions.map((a) => a.q.id));
  if (s.current) ids.push(...s.current.discarded, ...s.current.questions.map((a) => a.q.id));
  return ids;
}
