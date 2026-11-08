// Who's older?: the generated file (design §10). It must match its inputs, keep every rule of §4.6, and hold enough
// pairs for long streaks. The last check is written apart from orderOf, so a mistake there cannot hide itself.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import data from "@/data/whos-older/whos-older.json";
import { buildPool, random, type WhosOlderData } from "./game";
import { EXCLUDED_IDS, buildIndex, orderOf, pairKey } from "./pairing";

const file = data as unknown as WhosOlderData & { about: string };
const pool = buildPool(file);
const sha = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 12);
const people = new Map((JSON.parse(readFileSync("data/study/people.json", "utf8")) as { id: string; g?: number | null }[]).map((row) => [row.id, row]));
const ABRAHAM = "abraham-gen-11-26";

describe("the generated file", () => {
  it("matches its stamp and its source files, so it has not been edited by hand", () => {
    const { about, sources, books, characters, facts, blocked } = file;
    expect(sha(JSON.stringify({ about, sources, books, characters, facts, blocked }))).toBe(file.stamp);
    const names = ["characters.source.json", "order-facts.source.json", "blocked-pairs.source.json"];
    expect(sha(names.map((name) => readFileSync(`src/data/whos-older/${name}`, "utf8")).join("\u0000"))).toBe(file.sources);
  });

  it("uses real people from the site, never a group or an excluded person, each with a unique label", () => {
    for (const c of file.characters) {
      expect(people.has(c.id), c.id).toBe(true);
      expect(people.get(c.id)?.g ?? 0, `${c.id} is a group`).toBeFalsy();
      expect(EXCLUDED_IDS).not.toContain(c.id);
    }
    expect(new Set(file.characters.map((c) => c.label.toLowerCase())).size).toBe(file.characters.length);
    expect(new Set(file.characters.map((c) => c.id)).size).toBe(file.characters.length);
  });

  it("has valid windows with no year 0, and early-Genesis windows that end before Abraham's earliest year", () => {
    const abraham = pool.byId.get(ABRAHAM)!;
    for (const c of file.characters) {
      expect(c.lo !== 0 && c.hi !== 0, c.id).toBe(true);
      expect(c.hi, `${c.id} needs a latest year`).not.toBeNull();
      if (c.lo !== null) expect(c.lo, c.id).toBeLessThanOrEqual(c.hi!);
      if (!c.shown) expect(c.hi!, c.id).toBeLessThan(abraham.lo!);
    }
  });

  it("has facts that agree with the windows, never point both ways and make no loop", () => {
    const seen = new Set<string>();
    const after = new Map<string, string[]>();
    for (const f of file.facts) {
      const a = pool.byId.get(f.first)!;
      const b = pool.byId.get(f.second)!;
      expect(a && b, `${f.first} / ${f.second}`).toBeTruthy();
      if (a.lo !== null && b.hi !== null) expect(a.lo, `${f.first} before ${f.second} disagrees with the windows`).toBeLessThanOrEqual(b.hi);
      expect(seen.has(`${f.second}>${f.first}`), `${f.first} / ${f.second} point both ways`).toBe(false);
      seen.add(`${f.first}>${f.second}`);
      after.set(f.first, [...(after.get(f.first) ?? []), f.second]);
      if (f.quote !== undefined) expect(f.quote.trim(), `${f.first} / ${f.second} quote`).not.toBe("");
      expect(f.why.trim()).not.toBe("");
    }
    const state = new Map<string, "open" | "done">();
    const visit = (id: string): boolean => {
      if (state.get(id) === "open") return false;
      if (state.get(id) === "done") return true;
      state.set(id, "open");
      const ok = (after.get(id) ?? []).every(visit);
      state.set(id, "done");
      return ok;
    };
    for (const id of after.keys()) expect(visit(id), `a loop through ${id}`).toBe(true);
  });

  it("gives every person at least 8 partners and every band at least 300 pairs", () => {
    for (const [id, bands] of pool.partners) expect(bands.easy.length + bands.medium.length + bands.hard.length, id).toBeGreaterThanOrEqual(8);
    expect(pool.byBand.easy.length).toBeGreaterThanOrEqual(300);
    expect(pool.byBand.medium.length).toBeGreaterThanOrEqual(300);
    expect(pool.byBand.hard.length).toBeGreaterThanOrEqual(300);
  });

  it("orders a pair only when a fact exists or the windows are disjoint (an independent check of orderOf)", () => {
    const index = buildIndex(file.facts, file.blocked);
    const factKeys = new Set(file.facts.map((f) => [f.first, f.second].sort().join("|")));
    const cs = file.characters;
    let seed = 20261107;
    let ordered = 0;
    for (let n = 0; n < 2000; n++) {
      let roll: number;
      [roll, seed] = random(seed);
      const a = cs[Math.floor(roll * cs.length)];
      [roll, seed] = random(seed);
      const b = cs[Math.floor(roll * cs.length)];
      const order = orderOf(a, b, index);
      if (!order) continue;
      ordered++;
      const hasFact = factKeys.has([a.id, b.id].sort().join("|"));
      const disjoint = (a.hi !== null && b.lo !== null && a.hi < b.lo) || (b.hi !== null && a.lo !== null && b.hi < a.lo);
      expect(hasFact || disjoint, `${a.id} / ${b.id} was ordered with no fact and overlapping windows`).toBe(true);
      expect(pool.byKey.has(pairKey(a.id, b.id))).toBe(true);
    }
    expect(ordered).toBeGreaterThan(500);
  });
});
