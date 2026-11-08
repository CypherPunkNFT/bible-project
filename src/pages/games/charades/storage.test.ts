// Family charades: what is kept on the device (design §6.5, §11). Round trips, broken storage that never throws, and
// an old version that is dropped.
import { newTeamGame, recordTurn } from "./game";
import { GAME_KEY, KEY, bestFor, canSave, defaultSettings, emptySaved, readSaved, readTeamGame, saveTeamGame, writeSaved, type Store } from "./storage";

const memory = (): Store & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); }, removeItem: (k) => { data.delete(k); } };
};
const broken: Store = {
  getItem: () => { throw new Error("blocked"); },
  setItem: () => { throw new Error("full"); },
  removeItem: () => { throw new Error("blocked"); },
};

describe("local storage", () => {
  it("round-trips settings, tiltFailed, best scores and recent scenes", () => {
    const store = memory();
    const saved = { ...emptySaved(), tiltFailed: true, best: { "60": 11, "90": 4 }, recent: ["jonah-fish", "david-goliath"],
      settings: { ...defaultSettings(), mode: "act" as const, ageGroup: "little" as const, deck: "jesus" as const, sound: false } };
    writeSaved(store, saved);
    expect(readSaved(store)).toEqual(saved);
    expect(bestFor(readSaved(store), 60)).toBe(11);
    expect(bestFor(readSaved(store), 30)).toBe(0);
  });

  it("starts from the defaults: Guess it, Kids, Everything, Medium, 90 s for Little ones, tilt for Guess it and buttons for Act it", () => {
    const saved = readSaved(memory());
    expect(saved.settings).toMatchObject({ mode: "guess", ageGroup: "kids", deck: "everything", difficulty: "medium",
      seconds: { little: 90, kids: 60, adults: 60 }, controls: { guess: "tilt", act: "buttons" }, pictures: { little: true, kids: false } });
    expect(saved.tiltFailed).toBe(false);
  });

  it("drops an old version and anything doubtful, keeping the rest", () => {
    const store = memory();
    store.setItem(KEY, JSON.stringify({ version: 0, best: { "60": 9 } }));
    expect(readSaved(store)).toEqual(emptySaved());
    store.setItem(KEY, JSON.stringify({ version: 1, settings: { mode: "dance", seconds: { kids: 45, adults: 30 } }, best: { "60": -2, "90": 3.5, "120": 7 }, recent: ["a", 4, "b"] }));
    const saved = readSaved(store);
    expect(saved.settings.mode).toBe("guess");
    expect(saved.settings.seconds).toEqual({ little: 90, kids: 60, adults: 30 });
    expect(saved.best).toEqual({ "120": 7 });
    expect(saved.recent).toEqual(["a", "b"]);
  });

  it("never throws on missing, broken or corrupt storage", () => {
    expect(readSaved(null)).toEqual(emptySaved());
    expect(readSaved(broken)).toEqual(emptySaved());
    expect(() => writeSaved(broken, emptySaved())).not.toThrow();
    expect(canSave(broken)).toBe(false);
    expect(canSave(null)).toBe(false);
    expect(canSave(memory())).toBe(true);
    const store = memory();
    store.setItem(KEY, "{not json");
    expect(readSaved(store)).toEqual(emptySaved());
  });
});

describe("session storage: a team game in progress", () => {
  it("round-trips, and clears", () => {
    const store = memory();
    const game = recordTurn(newTeamGame(["Lions", "Eagles"], 3), 4);
    saveTeamGame(store, game);
    expect(readTeamGame(store)).toEqual(game);
    saveTeamGame(store, null);
    expect(store.data.has(GAME_KEY)).toBe(false);
  });

  it("drops a game that does not add up", () => {
    const store = memory();
    for (const bad of [{ version: 1, teams: ["A"], turnsEach: 3, totals: [0], turn: 0 }, { version: 1, teams: ["A", "B"], turnsEach: 3, totals: [1], turn: 0 },
      { version: 1, teams: ["A", "B"], turnsEach: 9, totals: [0, 0], turn: 0 }, { version: 2, teams: ["A", "B"], turnsEach: 3, totals: [0, 0], turn: 0 }]) {
      store.setItem(GAME_KEY, JSON.stringify(bad));
      expect(readTeamGame(store)).toBeNull();
    }
    expect(readTeamGame(broken)).toBeNull();
    expect(() => saveTeamGame(broken, newTeamGame(["A", "B"], 1))).not.toThrow();
    expect(() => saveTeamGame(broken, null)).not.toThrow();
  });
});
