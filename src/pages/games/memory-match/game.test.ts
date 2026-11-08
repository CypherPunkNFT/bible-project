// Memory card match: the rules (game.ts) and what the device keeps (storage.ts); design sections 7, 9 and 14.
import rawData from "@/data/memory-match/pairs.json";
import type { Card, PairsFile } from "./deal";
import { clockRead, clockStart, clockStop, flip, formatTime, isFinished, newGame, ranking, scores, stars, turnBack,
  winnerLine, type GameState } from "./game";
import { readBest, readGame, readSeen, readSettings, rememberSeen, saveBest, saveGame, takeOpener, type Store } from "./storage";

const data = rawData as unknown as PairsFile;
const [p1, p2, p3] = data.pairs.slice(0, 3).map((pair) => pair.id);
// Positions: 0 who1, 1 story2, 2 story1, 3 who2, 4 who3, 5 story3
const CARDS: Card[] = [
  { pair: p1, kind: "who" }, { pair: p2, kind: "story" }, { pair: p1, kind: "story" },
  { pair: p2, kind: "who" }, { pair: p3, kind: "who" }, { pair: p3, kind: "story" },
];
const solo = () => newGame(data.stamp, "mixed", "easy", 3, CARDS, [], false);
const party = () => newGame(data.stamp, "mixed", "easy", 3, CARDS, ["Ann", "Ben", "Cy"], false);

/** Taps in turn, letting any non-pair turn back before each tap; a non-pair made by the last tap stays showing. */
function play(state: GameState, ...taps: number[]): GameState {
  return taps.reduce((s, index) => flip(turnBack(s), index).state, state);
}

describe("turning cards", () => {
  it("counts two cards as one move, keeps a pair up and holds a non-pair until it turns back", () => {
    let state = solo();
    const first = flip(state, 0);
    expect(first.event).toEqual({ type: "first", card: 0 });
    expect(first.state.moves).toBe(0);
    const miss = flip(first.state, 1);
    expect(miss.event.type).toBe("miss");
    expect(miss.state.up).toEqual([0, 1]);
    expect(miss.state.moves).toBe(1);
    state = turnBack(miss.state);
    expect(state.up).toEqual([]);
    const pair = flip(flip(state, 0).state, 2);
    expect(pair.event).toEqual({ type: "pair", card: 2, pair: p1, finished: false });
    expect(pair.state.matched[0]).toBe(0);
    expect(pair.state.matched[2]).toBe(0);
    expect(pair.state.found).toEqual([p1]);
    expect(pair.state.moves).toBe(2);
  });

  it("a third tap during a non-pair turns it back and starts the next move", () => {
    const holding = play(solo(), 0, 1);
    const { state, event } = flip(holding, 4);
    expect(event).toEqual({ type: "first", card: 4 });
    expect(state.up).toEqual([4]);
    expect(state.moves).toBe(1);
  });

  it("ignores taps on face-up and matched cards, double taps and taps while studying", () => {
    const up = flip(solo(), 0).state;
    expect(flip(up, 0).event.type).toBe("ignored");
    const matched = play(solo(), 0, 2);
    expect(flip(matched, 0).event.type).toBe("ignored");
    expect(flip(matched, 2).state).toBe(matched);
    const holding = play(solo(), 0, 1);
    expect(flip(holding, 1).event.type).toBe("ignored");
    expect(flip({ ...solo(), studying: true }, 0).event.type).toBe("ignored");
  });

  it("does not match a pair's who card with another pair's story", () => {
    expect(flip(flip(solo(), 0).state, 1).event.type).toBe("miss");
  });

  it("finishes on the last pair", () => {
    const state = play(solo(), 0, 2, 1, 3, 4);
    const last = flip(state, 5);
    expect(last.event).toEqual({ type: "pair", card: 5, pair: p3, finished: true });
    expect(isFinished(last.state)).toBe(true);
    expect(last.state.moves).toBe(3);
    expect(flip(last.state, 0).event.type).toBe("ignored");
  });
});

describe("pass and play", () => {
  it("a pair keeps the turn, a non-pair passes it", () => {
    let state = play(party(), 0, 2);
    expect(state.turn).toBe(0);
    state = play(state, 1, 4);
    expect(state.turn).toBe(1);
    state = play(state, 1, 3);
    expect(state.turn).toBe(1);
    expect(scores(state)).toEqual([1, 1, 0]);
    state = play(state, 4, 0);
    expect(state.turn).toBe(1); // a tap on a matched card is ignored, so the move is still open
  });

  it("ranks the players and shares a tie", () => {
    const state = play(party(), 0, 2, 1, 4, 1, 3);
    expect(ranking(state).map((s) => [s.name, s.pairs, s.place])).toEqual([["Ann", 1, 1], ["Ben", 1, 1], ["Cy", 0, 3]]);
    expect(winnerLine(ranking(state))).toBe("Ann and Ben share the win, with 1 pair each");
    const won = play(state, 4, 5);
    expect(winnerLine(ranking(won))).toBe("Ben wins with 2 pairs");
  });
});

describe("scoring and time", () => {
  it("gives stars at the threshold edges", () => {
    expect([stars(6, 6), stars(11, 6), stars(12, 6), stars(15, 6), stars(16, 6)]).toEqual([3, 3, 2, 2, 1]);
    expect([stars(16, 9), stars(17, 9), stars(23, 9), stars(24, 9)]).toEqual([3, 2, 2, 1]);
    expect([stars(21, 12), stars(22, 12), stars(30, 12), stars(31, 12)]).toEqual([3, 2, 2, 1]);
  });

  it("runs the clock only while started, and leaves out stopped stretches", () => {
    let clock = clockStart({ bankedMs: 0, since: null }, 1_000);
    expect(clockRead(clock, 4_000)).toBe(3_000);
    clock = clockStop(clock, 5_000); // page hidden
    expect(clockRead(clock, 60_000)).toBe(4_000);
    clock = clockStart(clock, 60_000);
    expect(clockRead(clock, 62_500)).toBe(6_500);
    expect(clockStart(clock, 99_000)).toBe(clock);
  });

  it("shows time as m:ss, capped at an hour", () => {
    expect([formatTime(0), formatTime(92_400), formatTime(3_599_999), formatTime(3_600_000)]).toEqual(["0:00", "1:32", "59:59", "60:00+"]);
  });
});

function memoryStore(): Store & { data: Map<string, string> } {
  const map = new Map<string, string>();
  return { data: map, getItem: (key) => map.get(key) ?? null, setItem: (key, value) => { map.set(key, value); } };
}

describe("what the device keeps", () => {
  it("ignores a corrupt saved game and a board from another build", () => {
    const store = memoryStore();
    store.setItem("bp-memory-match-game", "{not json");
    expect(readGame(store, data)).toBeNull();
    const game = play(solo(), 0, 2);
    saveGame(store, game);
    expect(readGame(store, data)).toEqual(game);
    saveGame(store, { ...game, stamp: "old" });
    expect(readGame(store, data)).toBeNull();
    saveGame(store, { ...game, cards: game.cards.slice(1) });
    expect(readGame(store, data)).toBeNull();
    saveGame(store, { ...game, up: [0] });
    expect(readGame(store, data)).toBeNull(); // card 0 is matched, so it can't be face up
  });

  it("ignores corrupt records and keeps the best of each", () => {
    const store = memoryStore();
    store.setItem("bp-memory-match-best", JSON.stringify({ "mixed:easy": { moves: "x" }, "mixed:hard": { moves: 20, timeMs: 1, stars: 9 } }));
    expect(readBest(store)).toEqual({});
    expect(saveBest(store, "mixed", "easy", { moves: 14, timeMs: 90_000, stars: 2 }).first).toBe(true);
    const second = saveBest(store, "mixed", "easy", { moves: 11, timeMs: 95_000, stars: 3 });
    expect(second).toMatchObject({ newMoves: true, newTime: false, best: { moves: 11, timeMs: 90_000, stars: 3 } });
  });

  it("remembers seen pairs oldest first, settings, and the opening board once", () => {
    const store = memoryStore();
    rememberSeen(store, ["a", "b"]);
    rememberSeen(store, ["a", "c"]);
    expect(readSeen(store)).toEqual(["b", "a", "c"]);
    store.setItem("bp-memory-match-settings", '{"turnBack":"sideways","timerHidden":"yes"}');
    expect(readSettings(store)).toEqual({ timerHidden: false, turnBack: "auto" });
    expect(takeOpener(store)).toBe(true);
    expect(takeOpener(store)).toBe(false);
    expect(takeOpener(null)).toBe(false);
  });
});
