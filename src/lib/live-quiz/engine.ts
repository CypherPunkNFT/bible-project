// The live quiz's rules (design.md sections 3, 4 and 7), with no I/O: what each leader press, each answer, each
// deadline and each join does to a room. room-core.ts stores the result and tells the screens; views.ts decides what
// each screen may see. Every function here changes the room it is given and says what changed.
import { checkName, sameName } from "./names";
import { MAX_PLAYERS, type ErrorCode, type HostAction, type Phase, type QuizQuestion, type RoomSettings, type Standing } from "./protocol";

export interface PlayerAnswer { index: number; choice: number; ms: number }

export interface PlayerRecord {
  id: string;
  name: string;
  tokenHash: string;
  joinedAt: number;
  score: number;
  streak: number;
  /** Total answer time on right answers: breaks ties for the order shown (never the rank itself). */
  rightTime: number;
  answer: PlayerAnswer | null;
  /** Rank before the latest reveal's points, for the leaderboard's arrows. */
  rankBefore: number | null;
  /** The latest reveal's result for this player, or null if they had not answered. */
  last: { index: number; right: boolean; points: number } | null;
}

export interface RoomRecord {
  roomId: string;
  code: string;
  createdAt: number;
  hostTokenHash: string;
  settings: RoomSettings;
  questions: QuizQuestion[];
  /** Ids of every question this room has played or drawn, so "play again" never repeats one. */
  usedIds: string[];
  phase: Phase;
  index: number;
  opensAt: number | null;
  closesAt: number | null;
  autoAt: number | null;
  paused: { remaining: number | null; elapsed: number | null } | null;
  locked: boolean;
  removed: string[];
  endedAt: number | null;
  /** When the last leader socket closed; set at creation, null while a leader is connected. */
  hostLeftAt: number | null;
  counts: number[] | null;
}

export interface Room { room: RoomRecord; players: Record<string, PlayerRecord> }

/** What a change touched: room-core writes these to storage and sends what the screens need. */
export interface Effects {
  /** The room record changed (written through). */
  room: boolean;
  /** Player records changed or added (written through). */
  players: string[];
  /** Player records removed. */
  removed: string[];
  /** The phase or something every screen shows changed: send everyone a fresh snapshot. */
  broadcast: boolean;
  /** Only the leader's player list or answered count changed. */
  host: boolean;
}

export const GRACE_MS = 250;
export const REVEAL_AUTO_MS = 8000;
export const LEADERBOARD_AUTO_MS = 6000;
const HOUR = 3600_000;
export const CLEANUP = { afterEnd: HOUR, withoutLeader: 2 * HOUR, afterCreate: 6 * HOUR };

const effects = (patch: Partial<Effects> = {}): Effects => ({ room: false, players: [], removed: [], broadcast: false, host: false, ...patch });
const merge = (a: Effects, b: Effects): Effects => ({
  room: a.room || b.room, players: [...a.players, ...b.players.filter((id) => !a.players.includes(id))],
  removed: [...a.removed, ...b.removed], broadcast: a.broadcast || b.broadcast, host: a.host || b.host,
});

export type Result = { ok: true; effects: Effects } | { ok: false; error: ErrorCode };
const fail = (error: ErrorCode): Result => ({ ok: false, error });
const done = (e: Effects): Result => ({ ok: true, effects: e });

// ---- Scoring and ranking -------------------------------------------------------------------------------------------

/** Kahoot's Classic formula: 500–1000 for a right answer, by how much of the timer was left; under half a second is
 * 1000. `ms` is server time from the options opening to the answer arriving, paused time excluded. */
export function score(ms: number, timerMs: number, scoring: RoomSettings["scoring"]): number {
  if (scoring === "accuracy") return 1000;
  const t = Math.min(Math.max(ms, 0), timerMs);
  if (t < 500) return 1000;
  return Math.round(1000 * (1 - t / timerMs / 2));
}

/** Highest score first; equal scores share a rank ("=3rd"), shown in order of less time on right answers, then name. */
export function rank(players: PlayerRecord[]): Standing[] {
  const ordered = [...players].sort((a, b) => b.score - a.score || a.rightTime - b.rightTime || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return ordered.map((p) => {
    const higher = ordered.filter((other) => other.score > p.score).length;
    const same = ordered.filter((other) => other.score === p.score).length;
    return { id: p.id, name: p.name, score: p.score, streak: p.streak, rank: higher + 1, tied: same > 1 };
  });
}

/** How long a question shows before its options open: 2 s plus 40 ms a character, lead-in included, held to 3–7 s
 * (3–12 s with a lead-in). */
export function readTime(q: QuizQuestion): number {
  const chars = q.text.length + (q.leadIn ? q.leadIn.question.length + q.leadIn.answer.length : 0);
  return Math.min(Math.max(2000 + 40 * chars, 3000), q.leadIn ? 12000 : 7000);
}

// ---- Creating and joining ------------------------------------------------------------------------------------------

export interface NewRoom { roomId: string; code: string; now: number; hostTokenHash: string; settings: RoomSettings; questions: QuizQuestion[] }

export function createRoom({ roomId, code, now, hostTokenHash, settings, questions }: NewRoom): Room {
  return {
    room: {
      roomId, code, createdAt: now, hostTokenHash, settings, questions, usedIds: questions.map((q) => q.id), phase: "lobby",
      index: -1, opensAt: null, closesAt: null, autoAt: null, paused: null, locked: false, removed: [], endedAt: null,
      hostLeftAt: now, counts: null,
    },
    players: {},
  };
}

export const playerList = (r: Room) => Object.values(r.players);

/** A new phone joins: allowed in any phase but the end (late joiners start at 0 from the next question). */
export function join(r: Room, { playerId, name, tokenHash, now }: { playerId: string; name: string; tokenHash: string; now: number }): Result & { name?: string } {
  if (r.room.phase === "ended") return fail("not-found");
  if (r.room.locked) return fail("locked");
  if (playerList(r).length >= MAX_PLAYERS) return fail("full");
  const checked = checkName(name, r.room.settings.names);
  if (!checked.ok) return fail(checked.error);
  if (playerList(r).some((p) => sameName(p.name, checked.name))) return fail("name-taken");
  r.players[playerId] = { id: playerId, name: checked.name, tokenHash, joinedAt: now, score: 0, streak: 0, rightTime: 0, answer: null, rankBefore: null, last: null };
  return { ok: true, effects: effects({ players: [playerId], host: true }), name: checked.name };
}

/** Whether a returning phone may take its place again. */
export function canRejoin(r: Room, playerId: string, tokenHash: string): ErrorCode | null {
  if (r.room.removed.includes(playerId)) return "removed";
  if (r.room.phase === "ended") return "not-found";
  const player = r.players[playerId];
  return player && player.tokenHash === tokenHash ? null : "auth";
}

// ---- Phase changes -------------------------------------------------------------------------------------------------

const current = (r: Room) => r.room.questions[r.room.index];
const isLast = (r: Room) => r.room.index >= r.room.questions.length - 1;

function startQuestion(r: Room, index: number, now: number): Effects {
  Object.assign(r.room, { phase: "read", index, opensAt: null, closesAt: now + readTime(r.room.questions[index]), autoAt: null, paused: null, counts: null });
  return effects({ room: true, broadcast: true });
}

function openAnswers(r: Room, now: number): Effects {
  Object.assign(r.room, { phase: "answer", opensAt: now, closesAt: now + r.room.settings.timer * 1000, paused: null });
  return effects({ room: true, broadcast: true });
}

function reveal(r: Room, now: number): Effects {
  const { room } = r;
  const q = current(r);
  const before = new Map(rank(playerList(r)).map((s) => [s.id, s.rank]));
  const counts = [0, 0, 0, 0];
  for (const p of playerList(r)) {
    const answer = p.answer && p.answer.index === room.index ? p.answer : null;
    const right = answer !== null && answer.choice === q.correct;
    const points = right ? score(answer.ms, room.settings.timer * 1000, room.settings.scoring) : 0;
    if (answer) counts[answer.choice] += 1;
    p.rankBefore = before.get(p.id) ?? null;
    p.score += points;
    p.streak = right ? p.streak + 1 : 0;
    if (right) p.rightTime += answer.ms;
    p.last = answer ? { index: room.index, right, points } : null;
  }
  Object.assign(room, { phase: "reveal", closesAt: null, paused: null, counts, autoAt: room.settings.autoAdvance ? now + REVEAL_AUTO_MS : null });
  return effects({ room: true, players: Object.keys(r.players), broadcast: true });
}

function podium(r: Room, now: number): Effects {
  Object.assign(r.room, { phase: "podium", endedAt: now, autoAt: null, paused: null, closesAt: null });
  return effects({ room: true, broadcast: true });
}

function afterReveal(r: Room, now: number): Effects {
  if (isLast(r)) return podium(r, now);
  Object.assign(r.room, { phase: "leaderboard", paused: null, autoAt: r.room.settings.autoAdvance ? now + LEADERBOARD_AUTO_MS : null });
  return effects({ room: true, broadcast: true });
}

/** What Next does on each screen: Read skips to the options, Answer closes them (as Skip), Reveal shows the leaderboard
 * (or the podium after the last question), Leaderboard goes on to the next question. */
function advance(r: Room, now: number): Effects | null {
  switch (r.room.phase) {
    case "read": return openAnswers(r, now);
    case "answer": return reveal(r, now);
    case "reveal": return afterReveal(r, now);
    case "leaderboard": return startQuestion(r, r.room.index + 1, now);
    default: return null;
  }
}

/** Every connected player has answered the open question: close it now. Never with nobody connected, so a Wi-Fi blip
 * as the options open does not end the question. */
export function everyoneAnswered(r: Room, connected: ReadonlySet<string>): boolean {
  if (r.room.phase !== "answer" || r.room.paused) return false;
  const online = playerList(r).filter((p) => connected.has(p.id));
  return online.length > 0 && online.every((p) => p.answer?.index === r.room.index);
}

/** A phone dropped or was removed: if everyone still connected has answered, the question closes now. */
export function closeIfEveryoneAnswered(r: Room, now: number, connected: ReadonlySet<string>): Effects {
  return everyoneAnswered(r, connected) ? reveal(r, now) : effects();
}

// ---- Leader actions ------------------------------------------------------------------------------------------------

export function applyHostAction(r: Room, action: HostAction, now: number, connected: ReadonlySet<string>): Result {
  const { room } = r;
  switch (action.t) {
    case "start":
      if (room.phase !== "lobby") return fail("not-allowed");
      if (!playerList(r).length) return fail("not-allowed");
      return done(startQuestion(r, 0, now));
    case "next": case "skip": {
      // A press made on an earlier screen (a double press, a slow network) is dropped.
      if (action.phase !== room.phase || action.index !== room.index || room.paused) return done(effects());
      if (action.t === "skip" && room.phase !== "answer" && room.phase !== "read") return done(effects());
      const changed = advance(r, now);
      return changed ? done(changed) : fail("not-allowed");
    }
    case "pause": return done(pause(r, now));
    case "resume": return done(resume(r, now, connected));
    case "lock":
      room.locked = action.locked;
      return done(effects({ room: true, broadcast: true }));
    case "kick": return kick(r, action.playerId, now, connected);
    case "settings":
      if (room.phase !== "lobby") return fail("not-allowed");
      room.settings = action.settings;
      return done(effects({ room: true, broadcast: true }));
    case "again": return playAgain(r, action.questions);
    case "end":
      Object.assign(room, { phase: "ended", endedAt: now, autoAt: null, closesAt: null, paused: null });
      return done(effects({ room: true, broadcast: true }));
  }
}

/** Pause holds the clock: in Read and Answer the time left (and, once the options are open, the time used), in Reveal
 * and Leaderboard the auto-advance. Answers are refused while paused. */
function pause(r: Room, now: number): Effects {
  const { room } = r;
  if (room.paused) return effects();
  if (room.phase === "read" || room.phase === "answer") {
    room.paused = { remaining: Math.max(0, (room.closesAt ?? now) - now), elapsed: room.opensAt === null ? null : now - room.opensAt };
  } else if (room.phase === "reveal" || room.phase === "leaderboard") {
    room.paused = { remaining: room.autoAt === null ? null : Math.max(0, room.autoAt - now), elapsed: null };
    room.autoAt = null;
  } else return effects();
  return effects({ room: true, broadcast: true });
}

function resume(r: Room, now: number, connected: ReadonlySet<string>): Effects {
  const { room } = r;
  const held = room.paused;
  if (!held) return effects();
  room.paused = null;
  if (room.phase === "read" || room.phase === "answer") {
    room.closesAt = now + (held.remaining ?? 0);
    if (held.elapsed !== null) room.opensAt = now - held.elapsed;
  } else room.autoAt = held.remaining === null ? null : now + held.remaining;
  const e = effects({ room: true, broadcast: true });
  return everyoneAnswered(r, connected) ? merge(e, reveal(r, now)) : e;
}

function kick(r: Room, playerId: string, now: number, connected: ReadonlySet<string>): Result {
  if (!r.players[playerId]) return done(effects());
  delete r.players[playerId];
  r.room.removed.push(playerId);
  const e = effects({ room: true, removed: [playerId], host: true });
  return done(everyoneAnswered(r, connected) ? merge(e, reveal(r, now)) : e);
}

function playAgain(r: Room, questions: QuizQuestion[]): Result {
  const { room } = r;
  if (room.phase !== "podium") return fail("not-allowed");
  if (questions.some((q) => room.usedIds.includes(q.id))) return fail("bad-message");
  Object.assign(room, { questions, usedIds: [...room.usedIds, ...questions.map((q) => q.id)], phase: "lobby", index: -1,
    opensAt: null, closesAt: null, autoAt: null, paused: null, endedAt: null, counts: null });
  for (const p of playerList(r)) Object.assign(p, { score: 0, streak: 0, rightTime: 0, answer: null, rankBefore: null, last: null });
  return done(effects({ room: true, players: Object.keys(r.players), broadcast: true }));
}

// ---- Answers -------------------------------------------------------------------------------------------------------

/** A phone's answer: once per question, while the options are open (plus a quarter-second for the network). */
export function applyAnswer(r: Room, playerId: string, index: number, choice: number, now: number, connected: ReadonlySet<string>): Result {
  const { room } = r;
  const player = r.players[playerId];
  if (!player) return fail("auth");
  if (index !== room.index) return done(effects()); // an answer to an earlier question, arriving late
  if (room.phase !== "answer" || room.opensAt === null || room.closesAt === null) return fail("too-late");
  if (room.paused) return fail("paused");
  if (now > room.closesAt + GRACE_MS) return fail("too-late");
  if (player.answer?.index === index) return done(effects()); // the first tap stands
  const timer = room.settings.timer * 1000;
  player.answer = { index, choice, ms: Math.min(Math.max(now - room.opensAt, 0), timer) };
  const e = effects({ players: [playerId], host: true });
  return done(everyoneAnswered(r, connected) ? merge(e, reveal(r, now)) : e);
}

// ---- Time ----------------------------------------------------------------------------------------------------------

/** When the room is wiped: an hour after its podium or end, two hours without a leader, six hours after creation. */
export function cleanupAt(room: RoomRecord): number {
  return Math.min(room.createdAt + CLEANUP.afterCreate,
    room.endedAt === null ? Infinity : room.endedAt + CLEANUP.afterEnd,
    room.hostLeftAt === null ? Infinity : room.hostLeftAt + CLEANUP.withoutLeader);
}

/** The phase's own deadline, if its clock is running: the end of Read, the end of Answer plus the grace, or the
 * auto-advance moment (only with a leader connected: the game never moves past a reveal without one). */
function deadline(room: RoomRecord, hostConnected: boolean): number | null {
  if (room.paused) return null;
  if (room.phase === "read") return room.closesAt;
  if (room.phase === "answer") return room.closesAt === null ? null : room.closesAt + GRACE_MS;
  if ((room.phase === "reveal" || room.phase === "leaderboard") && hostConnected) return room.autoAt;
  return null;
}

/** The one alarm the room keeps: its next deadline or its clean-up, whichever comes first. */
export function nextWakeAt(room: RoomRecord, hostConnected: boolean): number {
  return Math.min(deadline(room, hostConnected) ?? Infinity, cleanupAt(room));
}

/** The alarm went off (or a message arrived late): act only on a deadline that has really passed, so an alarm left
 * over from before a Skip, or retried after an error, does nothing. */
export function onDeadline(r: Room, now: number, hostConnected: boolean): Effects {
  const due = deadline(r.room, hostConnected);
  if (due === null || now < due) return effects();
  return advance(r, now) ?? effects();
}

/** A leader socket opened or closed: record it for the two-hour clean-up and tell the phones. */
export function setLeaderOnline(r: Room, online: boolean, now: number): Effects {
  const wasOnline = r.room.hostLeftAt === null;
  if (online === wasOnline) return effects();
  r.room.hostLeftAt = online ? null : now;
  return effects({ room: true, broadcast: true });
}
