// What each screen may see of a room (design.md 6.5). Phone snapshots are built field by field from an allowlist, so
// the right answer, other players' tokens and anything added to the room later never reach a phone by accident; the
// right option goes to phones only from the reveal on.
import { playerList, rank, type Room } from "./engine";
import type { HostView, PlayerRow, PlayerView, QuizQuestion } from "./protocol";

const REVEALED: readonly string[] = ["reveal", "leaderboard", "podium"];

function base(r: Room, now: number, hostConnected: boolean) {
  const { room } = r;
  return {
    t: "state" as const, roomId: room.roomId, code: room.code, serverNow: now, phase: room.phase, index: room.index,
    total: room.questions.length, paused: room.paused !== null, opensAt: room.opensAt, closesAt: room.closesAt,
    remaining: room.paused ? room.paused.remaining : null, leaderOnline: hostConnected,
  };
}

const withoutAnswer = (q: QuizQuestion): Omit<QuizQuestion, "correct"> =>
  ({ id: q.id, text: q.text, leadIn: q.leadIn, options: q.options, reference: q.reference, link: q.link });

export function playerRows(r: Room, connected: ReadonlySet<string>): PlayerRow[] {
  const { room } = r;
  return rank(playerList(r)).map((s) => {
    const p = r.players[s.id];
    return { ...s, connected: connected.has(s.id), answered: p.answer?.index === room.index && room.index >= 0,
      move: p.rankBefore === null ? null : p.rankBefore - s.rank };
  });
}

export function answeredCount(r: Room): { count: number; of: number } {
  const players = playerList(r);
  return { count: players.filter((p) => p.answer?.index === r.room.index).length, of: players.length };
}

export function hostView(r: Room, now: number, connected: ReadonlySet<string>): HostView {
  const { room } = r;
  const q = room.questions[room.index];
  return {
    ...base(r, now, true), role: "host", settings: room.settings, locked: room.locked,
    question: q ? withoutAnswer(q) : null, correct: q && REVEALED.includes(room.phase) ? q.correct : null,
    players: playerRows(r, connected), answered: answeredCount(r), counts: REVEALED.includes(room.phase) ? room.counts : null,
    autoAt: room.autoAt, usedIds: room.usedIds,
  };
}

export function playerView(r: Room, playerId: string, now: number, hostConnected: boolean): PlayerView | null {
  const { room } = r;
  const me = r.players[playerId];
  if (!me) return null;
  const q = room.questions[room.index];
  const revealed = REVEALED.includes(room.phase);
  const standings = rank(playerList(r));
  const mine = standings.find((s) => s.id === playerId)!;
  const above = standings.filter((s) => s.score > mine.score).pop() ?? null;
  const showOptions = q && (room.phase === "answer" || revealed);
  const question = q && (room.settings.phoneText || showOptions) && room.phase !== "lobby" && room.phase !== "ended"
    ? { text: room.settings.phoneText ? q.text : null, leadIn: room.settings.phoneText ? q.leadIn : null, options: showOptions ? q.options : null }
    : null;
  const last = me.last && me.last.index === room.index && revealed ? { right: me.last.right, points: me.last.points } : null;
  return {
    ...base(r, now, hostConnected), role: "player", settings: { timer: room.settings.timer, phoneText: room.settings.phoneText },
    question, correct: q && revealed ? q.correct : null,
    you: {
      id: me.id, name: me.name, score: me.score, streak: me.streak, rank: mine.rank, tied: mine.tied,
      choice: me.answer && me.answer.index === room.index ? me.answer.choice : null, result: last,
      gapAbove: above ? above.score - mine.score : null, aboveName: above ? above.name : null,
    },
    verses: room.phase === "podium" ? room.questions.map((question) => ({ reference: question.reference, link: question.link })) : null,
  };
}
