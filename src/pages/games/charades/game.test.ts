// Family charades: a round's clock, answers and recap fixes, and team games (design §6, §11).
import { advance, answer, fixMark, gameOver, leftMs, newTeamGame, pause, passesOf, playedIds, recordTurn, refixLastTurn, resume, scoreOf,
  standings, startRound, stopRound, teamOnTurn, tick, cleanTeamName, type Round } from "./game";

const stories: Record<string, string> = { b1: "b", b2: "b" };
const storyOf = (id: string) => stories[id];
const ORDER = ["a", "b1", "c", "b2", "d"];
const start = (order = ORDER, seconds = 60) => startRound(order, seconds, 1000, storyOf);
/** Answer the scene on screen at `t`, then deal the next one after the feedback. */
const step = (round: Round, mark: "correct" | "pass", t: number) => advance(answer(round, mark, t), t + 700, storyOf);

describe("a round", () => {
  it("starts the clock and deals the first scene", () => {
    const round = start();
    expect(round.current).toBe("a");
    expect(leftMs(round, 1000)).toBe(60_000);
    expect(leftMs(round, 31_000)).toBe(30_000);
  });

  it("answers the scene on screen once, then deals the next, skipping a second scene of the same story", () => {
    let round = start();
    round = answer(round, "correct", 2000);
    expect(round.current).toBeNull();
    expect(answer(round, "pass", 2100)).toBe(round); // nothing on screen: a second answer does nothing
    round = advance(round, 2700, storyOf);
    expect(round.current).toBe("b1");
    round = step(round, "pass", 3000);
    expect(round.current).toBe("c");
    round = step(round, "pass", 4000);
    expect(round.current).toBe("d"); // b2 is skipped: b1 was dealt this round
    round = step(round, "pass", 5000);
    expect(round.current).toBe("b1"); // the passes come back, earliest first
    round = step(round, "correct", 6000);
    expect(round.current).toBe("c");
    expect(round.rows).toEqual([{ id: "a", mark: "correct" }, { id: "b1", mark: "correct" }, { id: "c", mark: "pass" }, { id: "d", mark: "pass" }]);
  });

  it("leaves the scene on screen not played when time is up, and time's up wins over an answer at the same instant", () => {
    let round = start(ORDER, 30);
    round = step(round, "correct", 2000);
    const late = answer(round, "correct", 31_000);
    expect(late.phase).toBe("over");
    expect(late.ended).toBe("time");
    expect(late.rows).toEqual([{ id: "a", mark: "correct" }, { id: "b1", mark: "unplayed" }]);
    expect(playedIds(late.rows)).toEqual(["a"]);
    expect(tick(round, 30_999).phase).toBe("playing");
    expect(tick(round, 31_000).phase).toBe("over");
  });

  it("ends early with the time left when every dealable scene is guessed", () => {
    let round = start(["a", "b1", "b2"]);
    round = step(round, "correct", 2000);
    round = step(round, "correct", 3000);
    expect(round.phase).toBe("over");
    expect(round.ended).toBe("deck");
    expect(round.leftMs).toBe(60_000 - 2700);
    expect(scoreOf(round.rows)).toBe(2);
  });

  it("stops the clock while paused", () => {
    let round = start();
    round = pause(round, 11_000);
    expect(round.phase).toBe("paused");
    expect(leftMs(round, 500_000)).toBe(50_000);
    expect(tick(round, 500_000).phase).toBe("paused");
    round = resume(round, 500_000);
    expect(leftMs(round, 510_000)).toBe(40_000);
    expect(tick(round, 550_000).ended).toBe("time");
  });

  it("can be ended from the pause sheet with what was played", () => {
    let round = step(start(), "pass", 2000);
    round = stopRound(pause(round, 3000), 3000);
    expect(round.ended).toBe("stopped");
    expect(round.rows).toEqual([{ id: "a", mark: "pass" }, { id: "b1", mark: "unplayed" }]);
    expect(passesOf(round.rows)).toBe(1);
  });
});

describe("fixing a mark on the recap", () => {
  it("swaps correct and pass, and turns a not-played scene into correct", () => {
    const rows = [{ id: "a", mark: "correct" as const }, { id: "b", mark: "pass" as const }, { id: "c", mark: "unplayed" as const }];
    expect(scoreOf(fixMark(rows, "a"))).toBe(0);
    expect(scoreOf(fixMark(rows, "b"))).toBe(2);
    expect(fixMark(rows, "c")[2].mark).toBe("correct");
    expect(fixMark(fixMark(rows, "c"), "c")[2].mark).toBe("pass");
  });
});

describe("teams", () => {
  it("rotates turns between teams and keeps running totals", () => {
    let game = newTeamGame(["Lions", "Eagles", "  "], 2);
    expect(game.teams).toEqual(["Lions", "Eagles", "Team 3"]);
    expect(teamOnTurn(game)).toBe(0);
    game = recordTurn(game, 5);
    expect(teamOnTurn(game)).toBe(1);
    game = recordTurn(game, 3);
    game = recordTurn(game, 4);
    expect(teamOnTurn(game)).toBe(0);
    expect(game.totals).toEqual([5, 3, 4]);
    game = refixLastTurn(game, 6); // a fix on Team 3's recap
    expect(game.totals).toEqual([5, 3, 6]);
    for (let i = 0; i < 3; i++) game = recordTurn(game, 1);
    expect(gameOver(game)).toBe(true);
  });

  it("shows ties as ties, largest first", () => {
    const game = { ...newTeamGame(["A", "B", "C", "D"], 1), totals: [4, 7, 7, 2], turn: 4 };
    expect(standings(game).map((r) => [r.name, r.place])).toEqual([["B", 1], ["C", 1], ["A", 3], ["D", 4]]);
  });

  it("cleans team names to 16 characters", () => {
    expect(cleanTeamName("  The   Mighty Prophets of Old ", 0)).toBe("The Mighty Proph");
    expect(cleanTeamName("", 2)).toBe("Team 3");
  });
});
