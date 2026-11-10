// Hot seat's session reducer and leaderboard (design §4–5, §11): marks and points, Undo, the buzzer's last question,
// the idle close, recap fixes, round order, skips, latecomers and leavers, ties, shout-outs, another round, new game.
import { cutName, estimateMinutes, isOver, newSession, nextUp, reduce, roundOrder, scoreOf, styleFor, suggestedReader, askedIds, missedTurns,
  DEFAULT_SETTINGS, type Action, type Mark, type Session } from "./game";
import { frozen } from "./hot-seat.test.fixture";
import { longestRun, mixedLengths, recordKey, shoutOuts, standings, unevenTurns } from "./leaderboard";

const roster = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, group: "adults" as const }));
const run = (s: Session, ...actions: Action[]) => actions.reduce(reduce, s);
/** Plays the next player's whole turn with these marks and saves it. */
function playTurn(s: Session, marks: Mark[]): Session {
  let next = reduce(s, { type: "start", first: frozen() });
  for (const mark of marks) next = reduce(next, { type: "mark", mark, next: frozen(), leftMs: 1000 });
  next = run(next, { type: "time-up" }, { type: "close" });
  return reduce(next, { type: "save" });
}

describe("hot seat session", () => {
  it("scores one point per right answer and shows the next question at once", () => {
    let s = run(newSession(roster(2), DEFAULT_SETTINGS, 1), { type: "start", first: frozen() });
    expect(s.current?.phase).toBe("live");
    s = run(s, { type: "mark", mark: "right", next: frozen(), leftMs: 50_000 }, { type: "mark", mark: "wrong", next: frozen(), leftMs: 40_000 },
      { type: "mark", mark: "pass", next: frozen(), leftMs: 30_000 }, { type: "mark", mark: "right", next: frozen(), leftMs: 20_000 });
    expect(scoreOf(s.current!.questions)).toBe(2);
    expect(s.current!.questions).toHaveLength(5);
    expect(s.current!.questions.at(-1)!.mark).toBeNull();
    expect(s.current!.leftMs).toBe(20_000);
  });

  it("undoes back to the first question, and an undone question counts as asked", () => {
    let s = run(newSession(roster(1), DEFAULT_SETTINGS, 1), { type: "start", first: frozen() });
    const first = s.current!.questions[0].q.id;
    s = run(s, { type: "mark", mark: "right", next: frozen(), leftMs: 9000 }, { type: "mark", mark: "wrong", next: frozen(), leftMs: 8000 });
    const shown = s.current!.questions[2].q.id;
    s = run(s, { type: "undo", leftMs: 7000 });
    expect(s.current!.questions.map((a) => a.mark)).toEqual(["right", null]);
    expect(s.current!.discarded).toEqual([shown]);
    s = run(s, { type: "undo", leftMs: 6000 }, { type: "undo", leftMs: 5000 });
    expect(s.current!.questions.map((a) => a.q.id)).toEqual([first]);
    expect(s.current!.questions[0].mark).toBeNull();
    expect(askedIds(s)).toContain(shown);
  });

  it("after the buzzer allows exactly one more mark, then no new question; or closes after the idle wait", () => {
    let s = run(newSession(roster(1), DEFAULT_SETTINGS, 1), { type: "start", first: frozen() }, { type: "mark", mark: "right", next: frozen(), leftMs: 100 }, { type: "time-up" });
    expect(s.current!.phase).toBe("overtime");
    s = run(s, { type: "undo", leftMs: 0 });
    expect(s.current!.questions).toHaveLength(2); // no undo after the buzzer
    s = run(s, { type: "mark", mark: "right", next: frozen(), leftMs: 0 });
    expect(s.current!.phase).toBe("recap");
    expect(s.current!.questions.map((a) => a.mark)).toEqual(["right", "right"]);
    expect(run(s, { type: "mark", mark: "wrong", next: frozen(), leftMs: 0 })).toBe(s);
    const idle = run(newSession(roster(1), DEFAULT_SETTINGS, 1), { type: "start", first: frozen() }, { type: "time-up" }, { type: "close" });
    expect(idle.current!.phase).toBe("recap");
    expect(idle.current!.questions[0].mark).toBeNull();
  });

  it("fixes recap marks before saving, never after", () => {
    let s = run(newSession(roster(2), DEFAULT_SETTINGS, 1), { type: "start", first: frozen() }, { type: "mark", mark: "wrong", next: frozen(), leftMs: 1 },
      { type: "time-up" }, { type: "close" });
    s = run(s, { type: "fix", index: 0 }, { type: "fix", index: 1 });
    expect(s.current!.questions.map((a) => a.mark)).toEqual(["pass", "right"]);
    s = run(s, { type: "fix", index: 0 });
    expect(scoreOf(s.current!.questions)).toBe(2);
    s = run(s, { type: "save" });
    expect(s.current).toBeNull();
    expect(standings(s)[0].total).toBe(2);
    expect(run(s, { type: "fix", index: 0 })).toBe(s);
  });

  it("turns the order by one each round", () => {
    const s = newSession(roster(3), DEFAULT_SETTINGS, 3);
    expect([1, 2, 3].map((r) => roundOrder(s, r).map((p) => p.name).join(""))).toEqual(["P1P2P3", "P2P3P1", "P3P1P2"]);
    let played = s;
    const order: string[] = [];
    while (!isOver(played)) { order.push(nextUp(played)!.player.name); played = playTurn(played, ["right"]); }
    expect(order.join(" ")).toBe("P1 P2 P3 P2 P3 P1 P3 P1 P2");
  });

  it("suggests whoever sat last as the reader", () => {
    let s = newSession(roster(2), DEFAULT_SETTINGS, 1);
    expect(suggestedReader(s)).toBeNull();
    s = playTurn(s, ["right"]);
    expect(suggestedReader(s)?.name).toBe("P1");
  });

  it("handles skips, latecomers and leavers: turns played, averages and who is next", () => {
    let s = newSession(roster(3), DEFAULT_SETTINGS, 2);
    s = playTurn(s, ["right", "right"]); // P1: 2
    s = reduce(s, { type: "skip" }); // P2 skipped
    s = reduce(s, { type: "add-player", name: "Late", group: "kids" });
    expect(s.players.at(-1)!.joinedRound).toBe(2);
    s = playTurn(s, ["right"]); // P3: 1
    expect(nextUp(s)!.round).toBe(2);
    s = reduce(s, { type: "remove-player", id: "p3" });
    expect(roundOrder(s, 2).some((p) => p.name === "P3")).toBe(false);
    expect(roundOrder(s, 2).some((p) => p.name === "Late")).toBe(true);
    const rows = standings(s);
    expect(unevenTurns(rows)).toBe(true);
    const p2 = rows.find((r) => r.player.name === "P2")!;
    expect(p2.played).toBe(0);
    expect(p2.average).toBeNull();
    expect(rows.find((r) => r.player.name === "P3")!.player.left).toBe(true);
    expect(rows.find((r) => r.player.name === "P1")!.average).toBe(2);
  });

  it("never removes the player in the seat, and ends when everyone has left", () => {
    let s = run(newSession(roster(2), DEFAULT_SETTINGS, 1), { type: "start", first: frozen() });
    expect(run(s, { type: "remove-player", id: "p1" })).toBe(s);
    s = run(s, { type: "end" });
    expect(s.current).toBeNull();
    expect(isOver(s)).toBe(true);
    expect(missedTurns(s).map((p) => p.name)).toEqual(["P1", "P2"]);
    const empty = run(newSession(roster(1), DEFAULT_SETTINGS, 1), { type: "remove-player", id: "p1" });
    expect(empty.ended).toBe(true);
  });

  it("shares places on equal totals and marks movement", () => {
    let s = newSession(roster(3), DEFAULT_SETTINGS, 1);
    s = playTurn(s, ["right", "right"]);
    s = playTurn(s, ["right", "right"]);
    s = playTurn(s, ["right", "right", "right"]);
    const rows = standings(s);
    expect(rows.map((r) => [r.player.name, r.place, r.moved])).toEqual([["P3", 1, 2], ["P1", 2, -1], ["P2", 2, -1]]);
  });

  it("finds the best single turn and the longest run, and keys records by group, length and style", () => {
    let s = newSession(roster(2), DEFAULT_SETTINGS, 1);
    s = playTurn(s, ["right", "right", "wrong", "right"]);
    s = playTurn(s, ["right", "right", "right", "pass"]);
    const shouts = shoutOuts(s);
    expect(shouts.bestTurn).toMatchObject({ value: 3 });
    expect(shouts.bestTurn!.who.map((w) => w.player.name)).toEqual(["P1", "P2"]);
    expect(shouts.longestRun!.value).toBe(3);
    expect(shouts.longestRun!.who.map((w) => w.player.name)).toEqual(["P2"]);
    expect(longestRun({ questions: [] })).toBe(0);
    expect(recordKey("little", 60, "two")).not.toBe(recordKey("little", 60, "open"));
    expect(mixedLengths(s)).toBe(false);
  });

  it("applies settings from the next turn, and two choices by group", () => {
    let s = run(newSession(roster(2), DEFAULT_SETTINGS, 1), { type: "start", first: frozen() }, { type: "settings", settings: { seconds: 30, testament: "NT" } });
    expect(s.current!.seconds).toBe(60);
    expect(s.current!.testament).toBe("");
    s = run(s, { type: "time-up" }, { type: "close" }, { type: "save" }, { type: "start", first: frozen() });
    expect(s.current!.seconds).toBe(30);
    expect(s.current!.testament).toBe("NT");
    expect(styleFor("little", "little")).toBe("two");
    expect(styleFor("kids", "little")).toBe("open");
    expect(styleFor("kids", "kids")).toBe("two");
    expect(styleFor("little", "nobody")).toBe("open");
    expect(styleFor("adults", "kids")).toBe("open");
  });

  it("plays another round keeping points, and a new game clears them and brings latecomers in from round 1", () => {
    let s = newSession(roster(2), DEFAULT_SETTINGS, 1);
    s = playTurn(s, ["right"]);
    s = reduce(s, { type: "add-player", name: "Late", group: "adults" });
    s = playTurn(s, ["right", "right"]);
    expect(isOver(s)).toBe(true);
    s = reduce(s, { type: "add-round" });
    expect(isOver(s)).toBe(false);
    expect(roundOrder(s, 2).map((p) => p.name)).toContain("Late");
    expect(standings(s).find((r) => r.player.name === "P2")!.total).toBe(2);
    s = reduce(s, { type: "remove-player", id: "p1" });
    s = reduce(s, { type: "new-game" });
    expect(s.turns).toEqual([]);
    expect(s.players.map((p) => [p.name, p.joinedRound])).toEqual([["P2", 1], ["Late", 1]]);
  });

  it("cleans and cuts names, and estimates the time", () => {
    expect(cutName("  Anna​   Lee ")).toBe("Anna Lee");
    expect(cutName("Bartholomew the Apostle")).toBe("Bartholomew the");
    expect(Array.from(cutName("😀".repeat(20)))).toHaveLength(16);
    expect(estimateMinutes(8, 2, 60)).toBe(27);
  });
});
