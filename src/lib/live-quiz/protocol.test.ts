import { DEFAULT_SETTINGS, LIMITS, MAX_HOST_MESSAGE, MAX_PLAYER_MESSAGE, parseClientMessage, parseCreateBody, type QuizQuestion } from "./protocol";
import { question } from "./live-quiz.test.fixtures";

/** A question at every length limit: the worst case the room must accept (design.md 6.1: about 1.7 KB each). */
const longest = (n: number): QuizQuestion => question(n, {
  id: `${"x".repeat(LIMITS.id - String(n).length)}${n}`, text: "a".repeat(LIMITS.question), options: Array.from({ length: 4 }, () => "o".repeat(LIMITS.option)),
  leadIn: { question: "q".repeat(300), answer: "a".repeat(100) }, reference: "r".repeat(LIMITS.reference), link: { book: "12345678", chapter: 150, verse: 176 },
});

describe("protocol", () => {
  it("accepts a 30-question worst-case play again from the leader", () => {
    const raw = JSON.stringify({ t: "again", questions: Array.from({ length: 30 }, (_, i) => longest(i)) });
    const parsed = parseClientMessage(raw, "host");
    expect(parsed.ok).toBe(true);
  });

  it("limits each kind of message: 1 KB a phone, 4 KB a leader action", () => {
    expect(parseClientMessage(JSON.stringify({ t: "answer", index: 0, choice: 1, pad: "x".repeat(MAX_PLAYER_MESSAGE) }), "player")).toMatchObject({ ok: false });
    expect(parseClientMessage(JSON.stringify({ t: "lock", locked: true, pad: "x".repeat(MAX_HOST_MESSAGE) }), "host")).toMatchObject({ ok: false });
    expect(parseClientMessage(JSON.stringify({ t: "join", name: "Sam", pad: "x".repeat(MAX_PLAYER_MESSAGE) }), "none")).toMatchObject({ ok: false });
  });

  it("accepts only sign-in messages before sign-in, only answers from phones, only actions from the leader", () => {
    expect(parseClientMessage(JSON.stringify({ t: "answer", index: 0, choice: 0 }), "none").ok).toBe(false);
    expect(parseClientMessage(JSON.stringify({ t: "start" }), "player").ok).toBe(false);
    expect(parseClientMessage(JSON.stringify({ t: "host", token: "abc" }), "host").ok).toBe(false);
    expect(parseClientMessage(JSON.stringify({ t: "join", name: "Sam" }), "none").ok).toBe(true);
    expect(parseClientMessage(JSON.stringify({ t: "answer", index: 0, choice: 3 }), "player").ok).toBe(true);
  });

  it("rejects malformed messages", () => {
    for (const raw of ["not json", "[]", "{}", JSON.stringify({ t: "answer", index: 0, choice: 4 }), JSON.stringify({ t: "answer", index: -1, choice: 0 }), JSON.stringify({ t: "answer", index: "0", choice: 0 })]) {
      expect(parseClientMessage(raw, "player").ok).toBe(false);
    }
    expect(parseClientMessage(JSON.stringify({ t: "next", phase: "nowhere", index: 0 }), "host").ok).toBe(false);
    expect(parseClientMessage(JSON.stringify({ t: "kick", playerId: "../x" }), "host").ok).toBe(false);
    expect(parseClientMessage(JSON.stringify({ t: "settings", settings: { ...DEFAULT_SETTINGS, timer: 45 } }), "host").ok).toBe(false);
  });

  it("checks every question field and strips anything extra", () => {
    const good = question(1);
    expect(parseCreateBody(JSON.stringify({ questions: [{ ...good, secret: "x" }], settings: DEFAULT_SETTINGS }))?.questions[0]).toEqual(good);
    const bad: Partial<QuizQuestion>[] = [
      { options: ["a", "b", "c"] }, { correct: 4 }, { text: "x".repeat(LIMITS.question + 1) }, { options: ["a", "b", "c", "d".repeat(201)] },
      { reference: "r".repeat(LIMITS.reference + 1) }, { leadIn: { question: "q".repeat(301), answer: "a".repeat(100) } },
      { link: { book: "123456789", chapter: 1, verse: 1 } }, { link: { book: "GEN", chapter: 1.5, verse: 1 } }, { id: "x".repeat(17) },
    ];
    for (const patch of bad) expect(parseCreateBody(JSON.stringify({ questions: [{ ...good, ...patch }], settings: DEFAULT_SETTINGS }))).toBeNull();
    expect(parseCreateBody(JSON.stringify({ questions: [good, good], settings: DEFAULT_SETTINGS }))).toBeNull(); // repeated id
    expect(parseCreateBody(JSON.stringify({ questions: Array.from({ length: 31 }, (_, i) => question(i)), settings: DEFAULT_SETTINGS }))).toBeNull();
  });

  it("refuses a create body over 64 KB", () => {
    const raw = JSON.stringify({ questions: [question(1)], settings: DEFAULT_SETTINGS, pad: "x".repeat(64 * 1024) });
    expect(parseCreateBody(raw)).toBeNull();
  });
});
