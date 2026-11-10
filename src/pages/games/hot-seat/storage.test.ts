// Hot seat's storage (design §7, §11): all three keys round-trip; damaged, older or tampered values are ignored, never
// thrown; a session older than 12 hours (or from the future) is not offered; the seen list stays at 2,000; a store that
// throws on write leaves the game playable and says it is not saving.
import { SEEN_MAX } from "./deal";
import { DEFAULT_SETTINGS, newSession, reduce, type Session } from "./game";
import { frozen } from "./hot-seat.test.fixture";
import { GAME_KEY, KEY, SEEN_KEY, SESSION_TTL_MS, canSave, defaultPrefs, readPrefs, readSeen, readSession, writePrefs, writeSeen, writeSession,
  type Store } from "./storage";

const NOW = Date.UTC(2026, 10, 10, 19, 0);

function memoryStore(): Store & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); }, removeItem: (k) => { data.delete(k); } };
}
const throwingStore: Store = {
  getItem: () => { throw new Error("blocked"); },
  setItem: () => { throw new Error("QuotaExceededError"); },
  removeItem: () => { throw new Error("blocked"); },
};

function midTurnSession(): Session {
  let s = newSession([{ name: "Anna", group: "little" }, { name: "Ben", group: "experts" }], DEFAULT_SETTINGS, 2);
  s = reduce(s, { type: "start", first: frozen({ choices: ["Answer", "Other"] }) });
  return reduce(s, { type: "mark", mark: "right", next: frozen(), leftMs: 41_234 });
}

describe("hot seat storage", () => {
  it("round-trips settings, roster and records", () => {
    const store = memoryStore();
    const prefs = { ...defaultPrefs(), rounds: 4, settings: { ...DEFAULT_SETTINGS, seconds: 45 as const, testament: "NT" as const, sound: false },
      roster: [{ name: "Anna", group: "little" as const }, { name: "", group: "adults" as const }], records: { "little|60|two": 9 } };
    expect(writePrefs(store, prefs)).toBe(true);
    expect(readPrefs(store)).toEqual(prefs);
  });

  it("round-trips a session mid-turn, with the time left", () => {
    const store = memoryStore();
    const s = midTurnSession();
    writeSession(store, s, NOW);
    const back = readSession(store, NOW + 60_000);
    expect(back?.session).toEqual(s);
    expect(back?.session.current?.leftMs).toBe(41_234);
    expect(back?.savedAt).toBe(NOW);
    writeSession(store, null);
    expect(store.data.has(GAME_KEY)).toBe(false);
  });

  it("round-trips the seen list and keeps it at 2,000", () => {
    const store = memoryStore();
    writeSeen(store, Array.from({ length: SEEN_MAX + 50 }, (_, i) => `id${i}`));
    const seen = readSeen(store);
    expect(seen).toHaveLength(SEEN_MAX);
    expect(seen[0]).toBe("id50");
  });

  it("does not offer a session older than 12 hours, or one saved in the future", () => {
    const store = memoryStore();
    writeSession(store, midTurnSession(), NOW);
    expect(readSession(store, NOW + SESSION_TTL_MS - 1)).not.toBeNull();
    expect(readSession(store, NOW + SESSION_TTL_MS + 1)).toBeNull();
    expect(readSession(store, NOW - 10 * 60_000)).toBeNull();
  });

  it("ignores damaged, older-version or tampered values instead of throwing", () => {
    const store = memoryStore();
    for (const raw of ["{not json", "[]", JSON.stringify({ version: 2 }), "null"]) {
      store.data.set(KEY, raw); store.data.set(GAME_KEY, raw); store.data.set(SEEN_KEY, raw);
      expect(readPrefs(store)).toEqual(defaultPrefs());
      expect(readSession(store, NOW)).toBeNull();
      expect(readSeen(store)).toEqual([]);
    }
    const tamper = (change: (s: Record<string, unknown>) => void) => {
      const s = JSON.parse(JSON.stringify(midTurnSession())) as Record<string, unknown>;
      change(s);
      store.data.set(GAME_KEY, JSON.stringify({ version: 1, savedAt: NOW, session: s }));
      return readSession(store, NOW);
    };
    expect(tamper(() => {})).not.toBeNull();
    expect(tamper((s) => { (s.current as { playerId: string }).playerId = "p99"; })).toBeNull();
    expect(tamper((s) => { (s.players as { name: string }[])[0].name = "x".repeat(40); })).toBeNull();
    expect(tamper((s) => { ((s.current as { questions: { q: { link: unknown } }[] }).questions[0].q.link) = { book: "../../x", chapter: 1, verse: null }; })).toBeNull();
    expect(tamper((s) => { (s.current as { phase: string }).phase = "dancing"; })).toBeNull();
    expect(tamper((s) => { (s.current as { leftMs: number }).leftMs = 9_999_999; })?.session.current?.leftMs).toBe(60_000);
    expect(tamper((s) => { (s.settings as { seconds: number }).seconds = 7; })?.session.settings.seconds).toBe(60);
  });

  it("keeps the game playable when the store throws, and says it is not saving", () => {
    expect(canSave(throwingStore)).toBe(false);
    expect(canSave(null)).toBe(false);
    expect(canSave(memoryStore())).toBe(true);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(writePrefs(throwingStore, defaultPrefs())).toBe(false);
    expect(writeSession(throwingStore, midTurnSession())).toBe(false);
    expect(writeSeen(throwingStore, ["a"])).toBe(false);
    expect(readPrefs(throwingStore)).toEqual(defaultPrefs());
    expect(readSession(throwingStore)).toBeNull();
    expect(readSeen(throwingStore)).toEqual([]);
    vi.restoreAllMocks();
  });
});
