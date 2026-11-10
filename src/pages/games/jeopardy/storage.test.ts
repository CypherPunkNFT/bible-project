// Bible Jeopardy's saving (design 7.1, 8, 13): damaged records are dropped, settings and the seen list round-trip,
// and storage that throws leaves the game playable.
import { handBoard, settings } from "./bank.test.fixture";
import { DEFAULT_SETTINGS } from "./model";
import { newGame, reduce } from "./rules";
import {
  GAME_KEY, SEEN_KEY, SEEN_LIMIT, SETTINGS_KEY, addSeen, browserStore, loadGame, loadSeen, loadSettings, readGame, readSettings, saveGame, saveSettings, withSeen,
} from "./storage";

const game = () => reduce(reduce(newGame("g1", settings(), handBoard()), { type: "open", spot: { col: 0, row: 0 } }), { type: "mark", team: 1, right: true });
const hex = (n: number) => n.toString(16).padStart(16, "0");

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("the saved game", () => {
  it("round-trips, undo history included", () => {
    const store = browserStore();
    const saved = game();
    expect(saveGame(store, saved, "tab-a", 1234)).toBe(1234);
    const loaded = loadGame(store)!;
    expect(loaded.tab).toBe("tab-a");
    expect(loaded.savedAt).toBe(1234);
    expect(loaded.game).toEqual(saved);
    expect(loaded.game.history).toHaveLength(2);
  });

  it("keeps a team name with emoji, counted as checkName counts it (an emoji is one character)", () => {
    const store = browserStore();
    const name = "Brave Lions \u{1F981}\u{1F981}\u{1F981}";
    expect(name.length).toBe(18);
    const saved = newGame("g2", settings({ teamNames: [name, "Team 2"] }), handBoard());
    expect(saveGame(store, saved, "tab-a", 1)).toBe(1);
    expect(loadGame(store)!.game.play.teams[0].name).toBe(name);
    expect(readSettings({ teamNames: [name, "Team 2"] }).teamNames[0]).toBe(name);
  });

  it("drops and removes a damaged, partial, wrong-typed or foreign record", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = browserStore();
    const good = { game: game(), savedAt: 1, tab: "t" };
    const broken = [
      "{not json", JSON.stringify({ hello: "world" }), JSON.stringify([1, 2]),
      JSON.stringify({ ...good, game: { ...good.game, v: 2 } }),
      JSON.stringify({ ...good, game: { ...good.game, play: { ...good.game.play, chooser: 9 } } }),
      JSON.stringify({ ...good, game: { ...good.game, play: { ...good.game.play, teams: [{ name: "A", score: "lots" }, { name: "B", score: 0 }] } } }),
      JSON.stringify({ ...good, game: { ...good.game, board: { ...good.game.board, columns: [] } } }),
      JSON.stringify({ ...good, game: { ...good.game, history: [{ screen: "nowhere" }] } }),
      JSON.stringify({ ...good, game: { ...good.game, settings: { ...good.game.settings, columns: 9 } } }),
    ];
    for (const text of broken) {
      localStorage.setItem(GAME_KEY, text);
      expect(loadGame(store)).toBeNull();
      expect(localStorage.getItem(GAME_KEY)).toBeNull();
    }
    expect(readGame(JSON.parse(JSON.stringify(good)))).not.toBeNull();
  });
});

describe("settings", () => {
  it("round-trip, and anything odd falls back to the default", () => {
    const store = browserStore();
    const mine = settings({ columns: 4, difficulty: "challenging", teamNames: ["Lions", "Doves"], timer: 20, answering: "buzz" });
    saveSettings(store, mine);
    expect(loadSettings(store)).toEqual(mine);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ columns: 12, difficulty: "impossible", teamNames: ["x".repeat(40)], timer: 7 }));
    const read = loadSettings(store);
    expect(read.columns).toBe(DEFAULT_SETTINGS.columns);
    expect(read.difficulty).toBe("standard");
    expect(read.timer).toBe(0);
    expect(read.teamNames).toEqual(["Team 1", "Team 2"]);
    expect(readSettings(null)).toEqual(DEFAULT_SETTINGS);
  });
});

describe("the seen list", () => {
  it("round-trips, newest last, and keeps the newest 1,500", () => {
    const store = browserStore();
    addSeen(store, [hex(1), hex(2)]);
    addSeen(store, [hex(1), hex(3)]);
    expect(loadSeen(store)).toEqual([hex(2), hex(1), hex(3)]);
    const many = Array.from({ length: SEEN_LIMIT + 20 }, (_, i) => hex(i + 10));
    const kept = withSeen([], many);
    expect(kept).toHaveLength(SEEN_LIMIT);
    expect(kept[kept.length - 1]).toBe(many[many.length - 1]);
    expect(kept[0]).toBe(many[20]);
    localStorage.setItem(SEEN_KEY, JSON.stringify(["nope", 5, hex(4)]));
    expect(loadSeen(store)).toEqual([hex(4)]);
  });
});

describe("storage that throws", () => {
  it("leaves the game playable, only unsaved", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
    expect(browserStore()).toBeNull();
    expect(saveGame(null, game(), "t")).toBeNull();
    expect(loadGame(null)).toBeNull();
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(addSeen(null, [hex(1)])).toEqual([hex(1)]);
    const store = window.localStorage;
    expect(saveGame(store, game(), "t")).toBeNull();
  });
});
