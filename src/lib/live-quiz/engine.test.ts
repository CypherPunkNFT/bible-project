import {
  applyAnswer, applyHostAction, canRejoin, cleanupAt, CLEANUP, closeIfEveryoneAnswered, GRACE_MS, join, nextWakeAt, onDeadline,
  rank, readTime, REVEAL_AUTO_MS, score, setLeaderOnline, type PlayerRecord, type Room,
} from "./engine";
import { MAX_PLAYERS } from "./protocol";
import { makeRoom, question } from "./live-quiz.test.fixtures";
import { playerView } from "./views";

const T0 = 1_000_000;
const none = new Set<string>();

function withPlayers(r: Room, names: string[]): string[] {
  return names.map((name, i) => {
    const id = `p${i + 1}`;
    const result = join(r, { playerId: id, name, tokenHash: `hash-${id}`, now: T0 });
    if (!result.ok) throw new Error(`join ${name} failed: ${result.error}`);
    return id;
  });
}

/** Starts the game and opens the first question's options at `opens`. */
function openFirst(r: Room, opens = T0 + 10_000) {
  expect(applyHostAction(r, { t: "start" }, T0, none).ok).toBe(true);
  onDeadline(r, opens, true);
  expect(r.room.phase).toBe("answer");
  return opens;
}

describe("scoring", () => {
  it("follows Kahoot's formula: 1000 instant, 750 at half time, 500 at the buzzer", () => {
    expect(score(0, 20_000, "speed")).toBe(1000);
    expect(score(499, 20_000, "speed")).toBe(1000);
    expect(score(10_000, 20_000, "speed")).toBe(750);
    expect(score(20_000, 20_000, "speed")).toBe(500);
    expect(score(25_000, 20_000, "speed")).toBe(500);
    expect(score(5_000, 20_000, "speed")).toBe(875);
  });

  it("gives 1000 for every right answer in accuracy mode", () => {
    expect(score(19_000, 20_000, "accuracy")).toBe(1000);
  });

  it("does not count paused time", () => {
    const r = makeRoom();
    const [a] = withPlayers(r, ["Sam", "Ann"]);
    const opens = openFirst(r);
    applyHostAction(r, { t: "pause" }, opens + 4_000, none);
    applyHostAction(r, { t: "resume" }, opens + 64_000, none);
    applyAnswer(r, a, 0, r.room.questions[0].correct, opens + 70_000, none);
    expect(r.players[a].answer?.ms).toBe(10_000);
  });
});

describe("ranking", () => {
  const p = (id: string, score: number, rightTime: number): PlayerRecord =>
    ({ id, name: id, tokenHash: "", joinedAt: 0, score, streak: 0, rightTime, answer: null, rankBefore: null, last: null });

  it("shares a rank between equal scores, ordered by less answer time then name", () => {
    const standings = rank([p("Cy", 900, 5), p("Al", 1500, 9), p("Bo", 900, 3), p("Di", 900, 3), p("Ed", 0, 0)]);
    expect(standings.map((s) => [s.id, s.rank, s.tied])).toEqual([["Al", 1, false], ["Bo", 2, true], ["Di", 2, true], ["Cy", 2, true], ["Ed", 5, false]]);
  });
});

describe("read time", () => {
  it("is 2 s plus 40 ms a character, held to 3–7 s, or up to 12 s with a lead-in", () => {
    expect(readTime(question(1, { text: "Who?" }))).toBe(3000);
    expect(readTime(question(1, { text: "x".repeat(50) }))).toBe(4000);
    expect(readTime(question(1, { text: "x".repeat(200) }))).toBe(7000);
    expect(readTime(question(1, { text: "x".repeat(100), leadIn: { question: "y".repeat(100), answer: "z".repeat(50) } }))).toBe(12000);
  });
});

describe("phases", () => {
  it("runs lobby → read → answer → reveal → leaderboard → … → podium", () => {
    const r = makeRoom(2);
    const [a, b] = withPlayers(r, ["Sam", "Ann"]);
    expect(applyHostAction(r, { t: "start" }, T0, none).ok).toBe(true);
    expect(r.room).toMatchObject({ phase: "read", index: 0 });
    onDeadline(r, r.room.closesAt!, true);
    expect(r.room.phase).toBe("answer");
    const q = r.room.questions[0];
    applyAnswer(r, a, 0, q.correct, r.room.opensAt! + 1000, none);
    applyAnswer(r, b, 0, (q.correct + 1) % 4, r.room.opensAt! + 1000, none);
    onDeadline(r, r.room.closesAt! + GRACE_MS, true);
    expect(r.room.phase).toBe("reveal");
    expect(r.players[a]).toMatchObject({ score: 975, streak: 1 });
    expect(r.players[b]).toMatchObject({ score: 0, streak: 0 });
    expect(r.room.counts?.reduce((x, y) => x + y)).toBe(2);
    applyHostAction(r, { t: "next", phase: "reveal", index: 0 }, T0 + 40_000, none);
    expect(r.room.phase).toBe("leaderboard");
    applyHostAction(r, { t: "next", phase: "leaderboard", index: 0 }, T0 + 41_000, none);
    expect(r.room).toMatchObject({ phase: "read", index: 1 });
    applyHostAction(r, { t: "skip", phase: "read", index: 1 }, T0 + 42_000, none);
    applyHostAction(r, { t: "skip", phase: "answer", index: 1 }, T0 + 43_000, none);
    expect(r.room.phase).toBe("reveal");
    applyHostAction(r, { t: "next", phase: "reveal", index: 1 }, T0 + 44_000, none);
    expect(r.room.phase).toBe("podium"); // no leaderboard after the last question
    expect(r.room.endedAt).toBe(T0 + 44_000);
  });

  it("needs a player to start", () => {
    const r = makeRoom();
    expect(applyHostAction(r, { t: "start" }, T0, none)).toEqual({ ok: false, error: "not-allowed" });
  });

  it("ignores a stale or double Next, so it never skips a question", () => {
    const r = makeRoom(3);
    withPlayers(r, ["Sam"]);
    applyHostAction(r, { t: "start" }, T0, none);
    applyHostAction(r, { t: "next", phase: "read", index: 0 }, T0 + 1, none);
    applyHostAction(r, { t: "next", phase: "read", index: 0 }, T0 + 2, none); // the second press of a double press
    expect(r.room).toMatchObject({ phase: "answer", index: 0 });
  });

  it("does nothing on an alarm left over from before a Skip", () => {
    const r = makeRoom(3);
    withPlayers(r, ["Sam"]);
    const opens = openFirst(r);
    const oldDeadline = r.room.closesAt! + GRACE_MS;
    applyHostAction(r, { t: "skip", phase: "answer", index: 0 }, opens + 1000, none);
    expect(r.room.phase).toBe("reveal");
    const changed = onDeadline(r, oldDeadline, true);
    expect(changed.broadcast).toBe(false);
    expect(r.room.phase).toBe("reveal");
  });

  it("auto-advances only with a leader connected, and never past a reveal without one", () => {
    const r = makeRoom(3, { autoAdvance: true });
    withPlayers(r, ["Sam"]);
    const opens = openFirst(r);
    applyHostAction(r, { t: "skip", phase: "answer", index: 0 }, opens, none);
    expect(r.room.autoAt).toBe(opens + REVEAL_AUTO_MS);
    onDeadline(r, opens + REVEAL_AUTO_MS, false);
    expect(r.room.phase).toBe("reveal");
    onDeadline(r, opens + REVEAL_AUTO_MS, true);
    expect(r.room.phase).toBe("leaderboard");
  });

  it("holds the clock while paused and refuses answers", () => {
    const r = makeRoom();
    const [a] = withPlayers(r, ["Sam"]);
    const opens = openFirst(r);
    applyHostAction(r, { t: "pause" }, opens + 5_000, none);
    expect(applyAnswer(r, a, 0, 0, opens + 6_000, none)).toEqual({ ok: false, error: "paused" });
    expect(nextWakeAt(r.room, true)).toBe(cleanupAt(r.room));
    onDeadline(r, opens + 100_000, true);
    expect(r.room.phase).toBe("answer");
    applyHostAction(r, { t: "resume" }, opens + 100_000, none);
    expect(r.room.closesAt).toBe(opens + 100_000 + 15_000);
  });

  it("starts play again in the lobby with scores reset and no repeated question", () => {
    const r = makeRoom(1);
    const [a] = withPlayers(r, ["Sam"]);
    const opens = openFirst(r);
    applyAnswer(r, a, 0, r.room.questions[0].correct, opens, new Set([a]));
    applyHostAction(r, { t: "next", phase: "reveal", index: 0 }, opens + 1, none);
    expect(r.room.phase).toBe("podium");
    expect(applyHostAction(r, { t: "again", questions: [question(1)] }, opens + 2, none)).toEqual({ ok: false, error: "bad-message" });
    expect(applyHostAction(r, { t: "again", questions: [question(7)] }, opens + 2, none).ok).toBe(true);
    expect(r.room).toMatchObject({ phase: "lobby", index: -1, endedAt: null, usedIds: ["q1", "q7"] });
    expect(r.players[a]).toMatchObject({ score: 0, streak: 0 });
  });
});

describe("answers", () => {
  it("closes the question when every connected player has answered, ignoring disconnected ones", () => {
    const r = makeRoom();
    const [a, b] = withPlayers(r, ["Sam", "Ann"]);
    const opens = openFirst(r);
    applyAnswer(r, a, 0, 1, opens + 500, new Set([a]));
    expect(r.room.phase).toBe("reveal");
    expect(r.players[b].last).toBeNull();
  });

  it("does not close with nobody connected", () => {
    const r = makeRoom();
    withPlayers(r, ["Sam"]);
    openFirst(r);
    expect(closeIfEveryoneAnswered(r, T0 + 20_000, none).broadcast).toBe(false);
    expect(r.room.phase).toBe("answer");
  });

  it("accepts an answer up to 250 ms after the deadline, not later", () => {
    const r = makeRoom();
    const [a, b] = withPlayers(r, ["Sam", "Ann"]);
    openFirst(r);
    const end = r.room.closesAt!;
    expect(applyAnswer(r, a, 0, 0, end + GRACE_MS, none).ok).toBe(true);
    expect(applyAnswer(r, b, 0, 0, end + GRACE_MS + 1, none)).toEqual({ ok: false, error: "too-late" });
    expect(nextWakeAt(r.room, true)).toBe(end + GRACE_MS);
  });

  it("keeps the first answer and ignores answers to an earlier question", () => {
    const r = makeRoom();
    const [a] = withPlayers(r, ["Sam", "Ann"]);
    const opens = openFirst(r);
    applyAnswer(r, a, 0, 2, opens + 100, none);
    applyAnswer(r, a, 0, 3, opens + 200, none);
    expect(r.players[a].answer?.choice).toBe(2);
    const late = applyAnswer(r, a, 5, 1, opens + 300, none);
    expect(late.ok && late.effects.players).toEqual([]);
  });

  it("never shows a phone the right answer before the reveal", () => {
    const r = makeRoom(1, { phoneText: true });
    const [a, b] = withPlayers(r, ["Sam", "Ann"]);
    const opens = openFirst(r);
    const before = playerView(r, a, opens, true)!;
    expect(before.correct).toBeNull();
    expect(JSON.stringify(before)).not.toMatch(/correct":\d|tokenHash|hash-/);
    applyAnswer(r, a, 0, 0, opens, new Set([a, b]));
    expect(JSON.stringify(playerView(r, b, opens, true))).not.toMatch(/correct":\d/);
    applyHostAction(r, { t: "skip", phase: "answer", index: 0 }, opens + 1, none);
    expect(playerView(r, b, opens + 1, true)!.correct).toBe(r.room.questions[0].correct);
  });
});

describe("joining", () => {
  it("refuses duplicate names without regard to case", () => {
    const r = makeRoom();
    withPlayers(r, ["Sam"]);
    expect(join(r, { playerId: "x", name: "  sAM ", tokenHash: "h", now: T0 })).toEqual({ ok: false, error: "name-taken" });
  });

  it("refuses when locked, full or ended", () => {
    const r = makeRoom();
    applyHostAction(r, { t: "lock", locked: true }, T0, none);
    expect(join(r, { playerId: "x", name: "Sam", tokenHash: "h", now: T0 })).toEqual({ ok: false, error: "locked" });
    applyHostAction(r, { t: "lock", locked: false }, T0, none);
    withPlayers(r, Array.from({ length: MAX_PLAYERS }, (_, i) => `Player ${i}`));
    expect(join(r, { playerId: "x", name: "Sam", tokenHash: "h", now: T0 })).toEqual({ ok: false, error: "full" });
    const ended = makeRoom();
    applyHostAction(ended, { t: "end" }, T0, none);
    expect(join(ended, { playerId: "x", name: "Sam", tokenHash: "h", now: T0 })).toEqual({ ok: false, error: "not-found" });
  });

  it("accepts only picker names in a name-picker room", () => {
    const r = makeRoom(3, { names: "picker" });
    expect(join(r, { playerId: "x", name: "Sam", tokenHash: "h", now: T0 })).toEqual({ ok: false, error: "name-picker" });
    expect(join(r, { playerId: "x", name: "Gentle Dove", tokenHash: "h", now: T0 }).ok).toBe(true);
  });

  it("lets a late joiner in with 0 points from the next question", () => {
    const r = makeRoom();
    withPlayers(r, ["Sam"]);
    openFirst(r);
    expect(join(r, { playerId: "late", name: "Ann", tokenHash: "h", now: T0 + 20_000 }).ok).toBe(true);
    expect(r.players.late.score).toBe(0);
  });

  it("refuses a removed player's token and a wrong token", () => {
    const r = makeRoom();
    const [a, b] = withPlayers(r, ["Sam", "Ann"]);
    applyHostAction(r, { t: "kick", playerId: a }, T0, none);
    expect(r.players[a]).toBeUndefined();
    expect(canRejoin(r, a, `hash-${a}`)).toBe("removed");
    expect(canRejoin(r, b, "wrong")).toBe("auth");
    expect(canRejoin(r, b, `hash-${b}`)).toBeNull();
  });
});

describe("clean-up", () => {
  it("wipes an hour after the end, two hours without a leader, or six hours after creation", () => {
    const r = makeRoom();
    expect(cleanupAt(r.room)).toBe(T0 + CLEANUP.withoutLeader); // no leader has connected yet
    setLeaderOnline(r, true, T0 + 1);
    expect(cleanupAt(r.room)).toBe(T0 + CLEANUP.afterCreate);
    applyHostAction(r, { t: "end" }, T0 + 1000, none);
    expect(cleanupAt(r.room)).toBe(T0 + 1000 + CLEANUP.afterEnd);
    expect(nextWakeAt(r.room, true)).toBe(T0 + 1000 + CLEANUP.afterEnd);
  });
});
