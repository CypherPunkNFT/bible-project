// The live quiz's messages (docs/features/live-quiz/design.md, 6.5): the shapes the room, the leader's page and the
// phones send each other over the socket, the limits on each, and a validator for everything that arrives. Shared by
// the browser bundle, the Pages Function build and the room bundle, so: relative imports only, no DOM, ES2020.

/** One question as the room keeps it: the leader's browser drew and shuffled it (pick.ts). */
export interface QuizQuestion {
  id: string;
  text: string;
  leadIn: { question: string; answer: string } | null;
  options: string[];
  /** Index of the right option, 0–3. Never sent to a phone before the reveal. */
  correct: number;
  reference: string | null;
  link: { book: string; chapter: number; verse: number | null } | null;
}

export const TIMERS = [10, 20, 30] as const;
export type Timer = (typeof TIMERS)[number];

export interface RoomSettings {
  timer: Timer;
  scoring: "speed" | "accuracy";
  names: "typed" | "picker";
  phoneText: boolean;
  autoAdvance: boolean;
}

export const DEFAULT_SETTINGS: RoomSettings = { timer: 20, scoring: "speed", names: "typed", phoneText: true, autoAdvance: false };

export type Phase = "lobby" | "read" | "answer" | "reveal" | "leaderboard" | "podium" | "ended";

export const LIMITS = { questions: 30, question: 300, option: 200, leadIn: 400, reference: 160, book: 8, id: 16, name: 16, token: 64 } as const;
export const MAX_PLAYERS = 100;
/** Bytes: any player message, any leader message, and the two that carry questions (create and "play again"). */
export const MAX_PLAYER_MESSAGE = 1024;
export const MAX_HOST_MESSAGE = 4096;
export const MAX_QUESTIONS_BODY = 64 * 1024;

/** Socket close codes. The first four are final: the phone does not try to reconnect after them. */
export const CLOSE = { kicked: 4001, replaced: 4002, ended: 4003, notFound: 4004, flood: 4005 } as const;
export const FINAL_CLOSES: readonly number[] = [CLOSE.kicked, CLOSE.replaced, CLOSE.ended, CLOSE.notFound];

export type ErrorCode =
  | "bad-message" | "not-found" | "locked" | "full" | "name-taken" | "name-invalid" | "name-blocked" | "name-picker"
  | "removed" | "auth" | "too-late" | "paused" | "not-allowed" | "too-many";

// ---- Client → server -----------------------------------------------------------------------------------------------

export type AuthMessage =
  | { t: "host"; token: string }
  | { t: "join"; name: string }
  | { t: "rejoin"; playerId: string; token: string };

/** `phase` and `index` name the screen a press was made on, so a double press never skips a question. */
export type HostAction =
  | { t: "start" }
  | { t: "next"; phase: Phase; index: number }
  | { t: "skip"; phase: Phase; index: number }
  | { t: "pause" }
  | { t: "resume" }
  | { t: "lock"; locked: boolean }
  | { t: "kick"; playerId: string }
  | { t: "settings"; settings: RoomSettings }
  | { t: "again"; questions: QuizQuestion[] }
  | { t: "end" };

/** `index` is the question number, so a late answer to an earlier question is recognised and ignored. */
export interface AnswerMessage { t: "answer"; index: number; choice: number }

export type Role = "none" | "host" | "player";
export type ClientMessage = AuthMessage | HostAction | AnswerMessage;

// ---- Server → client -----------------------------------------------------------------------------------------------

export interface Standing { id: string; name: string; score: number; streak: number; rank: number; tied: boolean }
export interface PlayerRow extends Standing { connected: boolean; answered: boolean; move: number | null }

interface ViewBase {
  t: "state";
  roomId: string;
  code: string;
  serverNow: number;
  phase: Phase;
  /** Current question, from 0; -1 in the lobby. */
  index: number;
  total: number;
  paused: boolean;
  opensAt: number | null;
  closesAt: number | null;
  /** Milliseconds left on the held clock while paused. */
  remaining: number | null;
  leaderOnline: boolean;
}

export interface HostView extends ViewBase {
  role: "host";
  settings: RoomSettings;
  locked: boolean;
  question: Omit<QuizQuestion, "correct"> | null;
  correct: number | null;
  players: PlayerRow[];
  answered: { count: number; of: number };
  counts: number[] | null;
  autoAt: number | null;
  usedIds: string[];
}

export interface PhoneQuestion { text: string | null; leadIn: { question: string; answer: string } | null; options: string[] | null }

export interface PlayerSelf {
  id: string;
  name: string;
  score: number;
  streak: number;
  rank: number;
  tied: boolean;
  /** The option this phone chose for the current question, or null. */
  choice: number | null;
  /** From the reveal on: whether that was right and what it scored. */
  result: { right: boolean; points: number } | null;
  gapAbove: number | null;
  aboveName: string | null;
}

export interface PlayerView extends ViewBase {
  role: "player";
  settings: { timer: Timer; phoneText: boolean };
  question: PhoneQuestion | null;
  correct: number | null;
  you: PlayerSelf;
  /** On the podium only: each question's reference and link, to read the verses afterwards. */
  verses: { reference: string | null; link: QuizQuestion["link"] }[] | null;
}

export type ServerMessage =
  | HostView
  | PlayerView
  | { t: "joined"; playerId: string; token: string; name: string }
  | { t: "players"; players: PlayerRow[] }
  | { t: "answered"; count: number; of: number }
  | { t: "error"; code: ErrorCode; message: string };

export interface RoomInfo { exists: boolean; roomId: string | null; locked: boolean; full: boolean; names: RoomSettings["names"] }

// ---- Validation ----------------------------------------------------------------------------------------------------

type Json = Record<string, unknown>;
const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);
const isText = (value: unknown, max: number, min = 1): value is string => typeof value === "string" && value.length >= min && value.length <= max;
const isWhole = (value: unknown, min: number, max: number): value is number => typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
const PHASES: readonly string[] = ["lobby", "read", "answer", "reveal", "leaderboard", "podium", "ended"];
const ID = /^[A-Za-z0-9_-]{1,32}$/;

/** Byte length of a string as UTF-8, without TextEncoder's copy for the common short case. */
export function byteLength(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff) { bytes += 4; i++; }
    else bytes += 3;
  }
  return bytes;
}

export function isQuestion(value: unknown): value is QuizQuestion {
  if (!isObject(value)) return false;
  const { id, text, leadIn, options, correct, reference, link } = value;
  if (!isText(id, LIMITS.id) || !isText(text, LIMITS.question) || !isWhole(correct, 0, 3)) return false;
  if (!Array.isArray(options) || options.length !== 4 || !options.every((option) => isText(option, LIMITS.option))) return false;
  if (leadIn !== null && !(isObject(leadIn) && typeof leadIn.question === "string" && typeof leadIn.answer === "string"
    && leadIn.question.length + leadIn.answer.length <= LIMITS.leadIn)) return false;
  if (reference !== null && !isText(reference, LIMITS.reference)) return false;
  if (link !== null && !(isObject(link) && isText(link.book, LIMITS.book) && isWhole(link.chapter, 1, 999)
    && (link.verse === null || isWhole(link.verse, 1, 999)))) return false;
  return true;
}

/** A question list a room accepts: 1–30 well-formed questions with distinct ids. */
export function isQuestionList(value: unknown): value is QuizQuestion[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > LIMITS.questions || !value.every(isQuestion)) return false;
  return new Set(value.map((q: QuizQuestion) => q.id)).size === value.length;
}

export function isSettings(value: unknown): value is RoomSettings {
  if (!isObject(value)) return false;
  return (TIMERS as readonly unknown[]).includes(value.timer) && (value.scoring === "speed" || value.scoring === "accuracy")
    && (value.names === "typed" || value.names === "picker") && typeof value.phoneText === "boolean" && typeof value.autoAdvance === "boolean";
}

/** Keeps only the fields of a question the room stores, so nothing extra rides along into storage or onto screens. */
export const cleanQuestion = (q: QuizQuestion): QuizQuestion => ({
  id: q.id, text: q.text, leadIn: q.leadIn ? { question: q.leadIn.question, answer: q.leadIn.answer } : null,
  options: [...q.options], correct: q.correct, reference: q.reference,
  link: q.link ? { book: q.link.book, chapter: q.link.chapter, verse: q.link.verse } : null,
});

export const cleanSettings = (s: RoomSettings): RoomSettings =>
  ({ timer: s.timer, scoring: s.scoring, names: s.names, phoneText: s.phoneText, autoAdvance: s.autoAdvance });

export type Parsed = { ok: true; message: ClientMessage } | { ok: false; error: string };

const limitFor = (role: Role, type: unknown) =>
  role === "host" ? (type === "again" ? MAX_QUESTIONS_BODY : MAX_HOST_MESSAGE) : MAX_PLAYER_MESSAGE;

/** Checks one incoming socket message for the socket's role: its size first, then its shape. A socket that has not
 * signed in may send only `host`, `join` or `rejoin`; a leader only leader actions; a phone only answers. */
export function parseClientMessage(raw: string, role: Role): Parsed {
  if (raw.length > MAX_QUESTIONS_BODY || byteLength(raw) > MAX_QUESTIONS_BODY) return { ok: false, error: "Message too large." };
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Message is not JSON." };
  }
  if (!isObject(value) || typeof value.t !== "string") return { ok: false, error: "Message has no type." };
  if (byteLength(raw) > limitFor(role, value.t)) return { ok: false, error: "Message too large." };
  const message = shapeOf(value, role);
  return message ? { ok: true, message } : { ok: false, error: `Unexpected message "${value.t.slice(0, 20)}" for this connection.` };
}

function shapeOf(m: Json, role: Role): ClientMessage | null {
  if (role === "none") {
    if (m.t === "host" && isText(m.token, LIMITS.token)) return { t: "host", token: m.token };
    if (m.t === "join" && isText(m.name, 64)) return { t: "join", name: m.name };
    if (m.t === "rejoin" && typeof m.playerId === "string" && ID.test(m.playerId) && isText(m.token, LIMITS.token)) return { t: "rejoin", playerId: m.playerId, token: m.token };
    return null;
  }
  if (role === "player") return m.t === "answer" && isWhole(m.index, 0, LIMITS.questions - 1) && isWhole(m.choice, 0, 3) ? { t: "answer", index: m.index, choice: m.choice } : null;
  switch (m.t) {
    case "start": case "pause": case "resume": case "end": return { t: m.t };
    case "next": case "skip":
      return typeof m.phase === "string" && PHASES.includes(m.phase) && isWhole(m.index, -1, LIMITS.questions) ? { t: m.t, phase: m.phase as Phase, index: m.index } : null;
    case "lock": return typeof m.locked === "boolean" ? { t: "lock", locked: m.locked } : null;
    case "kick": return typeof m.playerId === "string" && ID.test(m.playerId) ? { t: "kick", playerId: m.playerId } : null;
    case "settings": return isSettings(m.settings) ? { t: "settings", settings: cleanSettings(m.settings) } : null;
    case "again": return isQuestionList(m.questions) ? { t: "again", questions: m.questions.map(cleanQuestion) } : null;
    default: return null;
  }
}

/** The body of a create request: the questions and the settings. */
export function parseCreateBody(raw: string): { questions: QuizQuestion[]; settings: RoomSettings } | null {
  if (byteLength(raw) > MAX_QUESTIONS_BODY) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(value) || !isQuestionList(value.questions) || !isSettings(value.settings)) return null;
  return { questions: value.questions.map(cleanQuestion), settings: cleanSettings(value.settings) };
}

export const isRoomCode = (code: string) => /^[1-9]\d{5}$/.test(code);
