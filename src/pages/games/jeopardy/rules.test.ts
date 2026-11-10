// Bible Jeopardy's rules (design 5.5, 6, 13): every row of the turn table and every scoring rule, on a hand-made board.
import { handBoard, settings } from "./bank.test.fixture";
import type { Settings } from "./model";
import { canMark, dailyDoubleMax, finalMax, halfBet, newGame, ranking, reduce, seenIds, tiedForFirst, type Action, type Game } from "./rules";

const start = (over: Partial<Settings> = {}, board = handBoard()) => newGame("g1", settings(over), board);
const run = (game: Game, ...actions: Action[]) => actions.reduce(reduce, game);
const scores = (game: Game) => game.play.teams.map((team) => team.score);
const open = (col: number, row: number): Action => ({ type: "open", spot: { col, row } });
const right = (team: number): Action => ({ type: "mark", team, right: true });
const wrong = (team: number): Action => ({ type: "mark", team, right: false });
const back: Action = { type: "back" };

describe("tiles", () => {
  it("a right answer adds the value and shows the answer; the next team chooses in Take turns", () => {
    const game = run(start(), open(0, 2), right(0));
    expect(scores(game)).toEqual([300, 0, 0]);
    expect(game.play.screen).toBe("answer");
    const after = reduce(game, back);
    expect(after.play.screen).toBe("board");
    expect(after.play.chooser).toBe(1);
    expect(after.play.played[0][2]).toBe(true);
  });

  it("a wrong answer costs nothing by default, the team cannot answer again, and a steal scores full value", () => {
    let game = run(start(), open(0, 1), wrong(0));
    expect(scores(game)).toEqual([0, 0, 0]);
    expect(game.play.screen).toBe("clue");
    expect(canMark(game, 0)).toBe(false);
    expect(reduce(game, right(0))).toBe(game);
    game = reduce(game, right(2));
    expect(scores(game)).toEqual([0, 0, 200]);
    expect(canMark(game, 1)).toBe(false);
    expect(reduce(reduce(game, back), { type: "undo" }).play.screen).toBe("answer");
  });

  it("with penalties on, every wrong mark loses the value, a steal included", () => {
    const game = run(start({ penalty: true }), open(0, 0), wrong(0), wrong(1), right(2));
    expect(scores(game)).toEqual([-100, -100, 100]);
  });

  it("marks are allowed after Show answer for teams not yet marked, until a team is right", () => {
    let game = run(start(), open(2, 4), { type: "reveal" });
    expect(game.play.screen).toBe("answer");
    game = run(game, wrong(1), right(2));
    expect(scores(game)).toEqual([0, 0, 500]);
    expect(reduce(game, right(0))).toBe(game);
  });

  it("shows the answer by itself once every team has been marked wrong", () => {
    const game = run(start(), open(0, 0), wrong(0), wrong(1), wrong(2));
    expect(game.play.screen).toBe("answer");
    expect(reduce(game, back).play.chooser).toBe(1);
  });

  it("Back before anyone is marked returns the tile unplayed; after a mark it plays it", () => {
    const cancelled = run(start(), open(0, 0), back);
    expect(cancelled.play.played[0][0]).toBe(false);
    expect(cancelled.play.chooser).toBe(0);
    const played = run(start(), open(0, 0), wrong(0), back);
    expect(played.play.played[0][0]).toBe(true);
  });

  it("a played tile cannot be opened again, but can be replayed from the menu", () => {
    const game = run(start(), open(0, 0), right(0), back);
    expect(reduce(game, open(0, 0))).toBe(game);
    const replayed = reduce(game, { type: "replay", spot: { col: 0, row: 0 } });
    expect(replayed.play.played[0][0]).toBe(false);
  });
});

describe("who chooses next", () => {
  it("Take turns goes round in order whatever happened", () => {
    const game = run(start(), open(0, 0), right(2), back, open(0, 1), { type: "reveal" }, back);
    expect(game.play.chooser).toBe(2);
  });

  it("Buzz in gives the board to the team that was right, else the same team chooses again", () => {
    let game = run(start({ answering: "buzz" }), open(0, 0), wrong(0), right(2), back);
    expect(game.play.chooser).toBe(2);
    game = run(game, open(0, 1), { type: "reveal" }, back);
    expect(game.play.chooser).toBe(2);
  });

  it("the host can make another team choose", () => {
    const game = reduce(start(), { type: "choose", team: 2 });
    expect(game.play.chooser).toBe(2);
    expect(reduce(game, back)).toBe(game);
  });
});

describe("Daily Double", () => {
  const dd = handBoard(3, { col: 1, row: 3 });
  it("asks for a bet from 0 up to the score or 500, whichever is larger", () => {
    expect(dailyDoubleMax(200)).toBe(500);
    expect(dailyDoubleMax(1200)).toBe(1200);
    expect(halfBet(500)).toBe(250);
    expect(halfBet(1150)).toBe(550);
    const game = run(start({}, dd), open(1, 3));
    expect(game.play.screen).toBe("daily-double");
    expect(reduce(game, { type: "bet", amount: 501 })).toBe(game);
    expect(reduce(game, { type: "bet", amount: -1 })).toBe(game);
    expect(reduce(game, { type: "bet", amount: 2.5 })).toBe(game);
    expect(reduce(game, { type: "bet", amount: 0 }).play.screen).toBe("clue");
    expect(reduce(game, { type: "bet", amount: 500 }).play.bet).toBe(500);
  });

  it("only the choosing team answers; right adds the bet, wrong takes it off even with penalties off, no steals", () => {
    let game = run(start({}, dd), open(1, 3), { type: "bet", amount: 300 });
    expect(canMark(game, 1)).toBe(false);
    game = reduce(game, wrong(0));
    expect(scores(game)).toEqual([-300, 0, 0]);
    expect(game.play.screen).toBe("answer");
    expect(canMark(game, 1)).toBe(false);
    const won = run(start({}, dd), open(1, 3), { type: "bet", amount: 400 }, right(0));
    expect(scores(won)).toEqual([400, 0, 0]);
    expect(reduce(won, back).play.chooser).toBe(1);
  });
});

describe("Final question", () => {
  const playAll = (game: Game) => {
    let next = game;
    for (let col = 0; col < next.board.columns.length; col++) for (let row = 0; row < 5; row++) next = run(next, open(col, row), { type: "reveal" }, back);
    return next;
  };

  it("follows the board, takes bets of 0 up to each score, lowest score first, then Results", () => {
    let game = run(start({}, handBoard(3, null)), { type: "set-score", team: 0, score: 800 }, { type: "set-score", team: 1, score: 300 }, { type: "set-score", team: 2, score: -100 });
    game = playAll(game);
    expect(game.play.screen).toBe("final-category");
    game = run(game, { type: "final-clue" }, { type: "final-reveal" });
    expect(game.play.finalOrder).toEqual([2, 1, 0]);
    expect(finalMax(-100)).toBe(0);
    expect(reduce(game, { type: "final-mark", team: 2, bet: 50, right: true })).toBe(game);
    expect(reduce(game, { type: "final-mark", team: 0, bet: 0, right: true })).toBe(game);
    game = run(game, { type: "final-mark", team: 2, bet: 0, right: true });
    expect(reduce(game, { type: "final-mark", team: 1, bet: 301, right: true })).toBe(game);
    game = run(game, { type: "final-mark", team: 1, bet: 300, right: true }, { type: "final-mark", team: 0, bet: 500, right: false });
    expect(scores(game)).toEqual([300, 600, -100]);
    expect(game.play.screen).toBe("results");
    expect(ranking(game.play).map((place) => [place.place, place.teams])).toEqual([[1, [1]], [2, [0]], [3, [2]]]);
    expect(seenIds(game)).toHaveLength(16);
  });

  it("End game goes to the Final, or to Results when it is off", () => {
    expect(reduce(start(), { type: "end" }).play.screen).toBe("final-category");
    expect(reduce(start({ final: false }), { type: "end" }).play.screen).toBe("results");
  });
});

describe("ties", () => {
  it("equal scores share a place, and a tie-breaker settles first place", () => {
    let game = run(start({ final: false }), { type: "set-score", team: 0, score: 500 }, { type: "set-score", team: 2, score: 500 }, { type: "end" });
    expect(ranking(game.play).map((place) => [place.place, place.teams])).toEqual([[1, [0, 2]], [3, [1]]]);
    expect(tiedForFirst(game.play)).toEqual([0, 2]);
    game = reduce(game, { type: "tie-break", clue: handBoard().final! });
    expect(game.play.screen).toBe("tie-clue");
    expect(canMark(game, 1)).toBe(false);
    game = run(game, wrong(0), right(2));
    expect(game.play.screen).toBe("tie-answer");
    game = reduce(game, back);
    expect(ranking(game.play).map((place) => [place.place, place.teams])).toEqual([[1, [2]], [2, [0]], [3, [1]]]);
    expect(tiedForFirst(game.play)).toEqual([]);
  });
});

describe("undo and adjustments", () => {
  it("undoes every kind of action, one at a time, back to the start", () => {
    const first = start({}, handBoard(3, { col: 0, row: 4 }));
    const actions: Action[] = [open(1, 0), wrong(0), right(1), back, { type: "adjust", team: 2, delta: 100 }, open(0, 4), { type: "bet", amount: 200 }, right(1), back, { type: "rename", team: 0, name: "Lions" }];
    const states = [first];
    for (const action of actions) states.push(reduce(states[states.length - 1], action));
    let game = states[states.length - 1];
    expect(game.history).toHaveLength(actions.length);
    for (let i = states.length - 2; i >= 0; i--) {
      game = reduce(game, { type: "undo" });
      expect(game.play).toEqual(states[i].play);
    }
    expect(reduce(game, { type: "undo" })).toBe(game);
  });

  it("adjusts and sets scores, refusing nonsense", () => {
    let game = run(start(), { type: "adjust", team: 1, delta: -100 }, { type: "set-score", team: 0, score: 1250 });
    expect(scores(game)).toEqual([1250, -100, 0]);
    expect(game.play.last).toEqual({ team: 0, delta: 1250 });
    game = run(game, { type: "adjust", team: 7, delta: 100 }, { type: "set-score", team: 0, score: 1.5 }, { type: "adjust", team: 0, delta: 0 });
    expect(scores(game)).toEqual([1250, -100, 0]);
  });

  it("a random start picks a starting team from the random function", () => {
    expect(newGame("g", settings({ randomStart: true }), handBoard(), () => 0.99).play.chooser).toBe(2);
    expect(newGame("g", settings({ randomStart: false }), handBoard(), () => 0.99).play.chooser).toBe(0);
  });
});
