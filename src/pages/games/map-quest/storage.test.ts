import { currentStreak, emptyStats, finishDaily, parseStats, readStats, recordPick, startDaily, writeStats, type Pick, type Stats } from "./storage";

const ids = ["a", "b", "c", "d", "e"];
const pick = (id: string, points = 800): Pick => ({ id, lon: 35, lat: 31, km: 20, points });
function played(stats: Stats, n: number, points = 800): Stats {
  let next = startDaily(stats, n, ids);
  for (const id of ids) next = recordPick(next, n, pick(id, points));
  return finishDaily(next, n);
}

describe("map quest saved record", () => {
  afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

  it("keeps working when the browser refuses storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(readStats()).toEqual(emptyStats());
    expect(() => writeStats(emptyStats())).not.toThrow();
  });

  it("rebuilds a damaged or hostile value field by field", () => {
    expect(parseStats("nonsense")).toEqual(emptyStats());
    expect(parseStats({ played: "x", history: "x", today: { n: 3, ids: "x" } })).toEqual(emptyStats());
    const hostile = JSON.parse('{"__proto__": {"polluted": true}, "played": 2, "history": [{"n": 1, "total": 10}, {"n": "bad"}]}');
    const parsed = parseStats(hostile);
    expect(parsed.played).toBe(2);
    expect(parsed.history).toEqual([{ n: 1, total: 10 }]);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(parseStats({ history: Array.from({ length: 50 }, (_, i) => ({ n: i + 1, total: 1 })) }).history).toHaveLength(30);
  });

  it("round-trips through localStorage", () => {
    const stats = played(emptyStats(), 4);
    writeStats(stats);
    expect(readStats()).toEqual(stats);
  });

  it("saves pins in order, refuses a repeated one, and counts a finished puzzle once", () => {
    let stats = startDaily(emptyStats(), 1, ids);
    stats = recordPick(stats, 1, pick("a"));
    expect(recordPick(stats, 1, pick("a"))).toBe(stats);
    expect(recordPick(stats, 2, pick("b"))).toBe(stats);
    for (const id of ids.slice(1)) stats = recordPick(stats, 1, pick(id));
    const finished = finishDaily(stats, 1);
    expect(finished.played).toBe(1);
    expect(finished.best).toBe(4000);
    expect(finishDaily(finished, 1)).toBe(finished);
  });

  it("resumes today's puzzle, and drops an unfinished one from an earlier day", () => {
    const started = recordPick(startDaily(emptyStats(), 5, ids), 5, pick("a"));
    expect(startDaily(started, 5, ids)).toBe(started);
    expect(startDaily(started, 6, ids).today).toEqual({ n: 6, ids, picks: [] });
  });

  it("counts a streak over consecutive puzzles; a missed day resets it, today does not break it until it is over", () => {
    let stats = played(played(played(emptyStats(), 1), 2), 3);
    expect(stats.streak).toBe(3);
    expect(currentStreak(stats, 3)).toBe(3);
    expect(currentStreak(stats, 4)).toBe(3);
    expect(currentStreak(stats, 5)).toBe(0);
    stats = played(stats, 5);
    expect(stats.streak).toBe(1);
    expect(stats.bestStreak).toBe(3);
  });
});
