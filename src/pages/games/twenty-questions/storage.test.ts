// Bible twenty questions: browser storage (design §12) and the anonymous report's payload (§10.3, §15 "Learning").
import { prepare, type TqData, type Turn } from "./engine";
import { buildReport, sendReport, REPORT_URL } from "./report";
import { readSaved, save, soften, type Store } from "./storage";

const tag = (id: string) => ({ id, q: `Is your person ${id}?`, g: "who", l: 0 });
const person = (id: string, v: string, t = 1) => ({ id, label: id, also: [], t, f: 0, slug: "", b: "", s: "", v });
const file: TqData = { version: "tq-0000000001", tags: [tag("a"), tag("b")], people: [person("p0", "yn"), person("p1", "ny"), person("p2", "yy", 2)] };
const engine = prepare(file);

function memory(initial: Record<string, string> = {}): Store & { data: Record<string, string> } {
  const data = { ...initial };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
}
const totals = { played: 3, siteWon: 2, playerWon: 1 };
const turns: Turn[] = [{ kind: "q", tag: 0, answer: "y" }, { kind: "g", person: 1, right: false }, { kind: "q", tag: 1, answer: "d" }];

describe("saving on this device", () => {
  it("resumes a guess-mode game and a reverse-mode game exactly, by ids", () => {
    const store = memory();
    save(store, engine, { game: { mode: "guess", seed: 7, turns, limit: 25, over: null }, recent: ["p1"], softened: [], totals });
    expect(store.data["bp-twenty-questions"]).toContain('"person":"p1"');
    const back = readSaved(store, engine);
    expect(back.game).toEqual({ mode: "guess", seed: 7, turns, limit: 25, over: null });
    expect(back.totals).toEqual(totals);
    expect(back.recent).toEqual(["p1"]);
    const moves = [{ kind: "q", tag: 1 }, { kind: "g", person: 0 }] as const;
    save(store, engine, { game: { mode: "reverse", seed: 2, level: "hard", secret: 2, moves: [...moves], over: null }, recent: [], softened: [], totals });
    expect(readSaved(store, engine).game).toEqual({ mode: "reverse", seed: 2, level: "hard", secret: 2, moves: [...moves], over: null });
  });

  it("drops a game from another game-file version, or naming an id that no longer exists, with a note", () => {
    const store = memory();
    save(store, engine, { game: { mode: "guess", seed: 1, turns, limit: 20, over: null }, recent: [], softened: [], totals });
    const newer = prepare({ ...file, version: "tq-0000000002" });
    expect(readSaved(store, newer)).toMatchObject({ game: null, dropped: true, totals });
    const renamed = prepare({ ...file, people: [person("p0", "yn"), person("q1", "ny"), person("p2", "yy", 2)] });
    expect(readSaved(store, renamed)).toMatchObject({ game: null, dropped: true });
  });

  it("treats damaged, missing or refusing storage as nothing saved, and never throws", () => {
    expect(readSaved(memory({ "bp-twenty-questions": "{not json" }), engine)).toMatchObject({ game: null, dropped: false, recent: [], softened: [] });
    expect(readSaved(memory({ "bp-twenty-questions": JSON.stringify({ game: { mode: "guess", version: file.version, seed: 1, turns: "x" }, totals: { played: -4 } }) }), engine))
      .toMatchObject({ game: null, totals: { played: 0, siteWon: 0, playerWon: 0 } });
    expect(readSaved(null, engine).game).toBeNull();
    const full: Store = { getItem: () => null, setItem: () => { throw new Error("quota"); } };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => save(full, engine, { game: null, recent: [], softened: [], totals })).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("keys softened values by version, person and tag, and drops them when the version changes", () => {
    const store = memory();
    const softened = soften(soften([], "p0", "a"), "p0", "a");
    expect(softened).toEqual(["p0|a"]);
    save(store, engine, { game: null, recent: [], softened, totals });
    expect(readSaved(store, engine).softened).toEqual(["p0|a"]);
    expect(readSaved(store, prepare({ ...file, version: "tq-0000000002" })).softened).toEqual([]);
    save(store, engine, { game: null, recent: [], softened: [], totals }); // "Reset what the game learned"
    expect(readSaved(store, engine).softened).toEqual([]);
  });

  it("keeps only the last 30 reverse-mode secrets", () => {
    const store = memory();
    save(store, engine, { game: null, recent: Array.from({ length: 40 }, (_, i) => `s${i}`), softened: [], totals });
    const recent = readSaved(store, engine).recent;
    expect(recent).toHaveLength(30);
    expect(recent[0]).toBe("s10");
  });
});

describe("the anonymous report", () => {
  it("carries only ids, answer letters, the version and the result", () => {
    const report = buildReport(engine, turns, "p2", true, ["a", "a"], "lost");
    expect(report).toEqual({ v: "tq-0000000001", who: "p2", inPool: true, answers: [["a", "y"], ["b", "d"]], guesses: ["p1"], disputed: ["a"], result: "lost" });
    expect(Object.keys(report).sort()).toEqual(["answers", "disputed", "guesses", "inPool", "result", "v", "who"]);
  });

  it("posts with keepalive and never lets a failed send reach the game", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const send = vi.fn(async () => { throw new Error("offline"); });
    expect(() => sendReport(buildReport(engine, turns, "p0", true, [], "won"), send as unknown as typeof fetch)).not.toThrow();
    expect(send).toHaveBeenCalledWith(REPORT_URL, expect.objectContaining({ method: "POST", keepalive: true }));
    await Promise.resolve();
    const throwing = (() => { throw new Error("blocked"); }) as unknown as typeof fetch;
    expect(() => sendReport(buildReport(engine, turns, "p0", true, [], "won"), throwing)).not.toThrow();
    warn.mockRestore();
  });
});
