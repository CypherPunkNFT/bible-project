// Family charades: every rule of the hand-kept scene list (design §4.1, §4.2), against the site's own BSB text in
// data/plain/bsb/. A check word must occur as whole words in its passage, so "ten" can never pass on "often".
import { readFileSync } from "node:fs";
import file from "@/data/charades/scenes.json";
import type { Catalog } from "@/lib/types";
import { DIFFICULTIES, MIN_DECK, parseRef, poolFor, type Scene, type ScenesFile } from "./deck";

const data = file as unknown as ScenesFile;
const scenes: Scene[] = data.scenes;
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
const numOf = (code: string) => catalog.books.find((b) => b.code === code)?.num;
const books = new Map<string, Record<string, string>>();
const bookText = (code: string) => {
  if (!books.has(code)) books.set(code, JSON.parse(readFileSync(`data/plain/bsb/${code}.json`, "utf8")) as Record<string, string>);
  return books.get(code)!;
};

/** The countdowns data test's cleaning, plus case and punctuation ignored, so words can be matched whole. */
const normalise = (text: string) => ` ${text.replace(/^¶\s*/, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim()} `;

/** The BSB verses of one passage, in order: [chapter:verse key, text]. Labels like "12a" count for verse 12. */
function passageVerses(code: string, start: number, end: number): [string, string][] {
  const position = (chapter: number, verse: number) => chapter * 1000 + verse;
  const from = start % 1_000_000;
  const to = end % 1_000_000;
  return Object.entries(bookText(code)).filter(([key]) => {
    const match = /^(\d+):(\d+)/.exec(key);
    return !!match && position(Number(match[1]), Number(match[2])) >= from && position(Number(match[1]), Number(match[2])) <= to;
  });
}

const hasVerse = (code: string, id: number) => {
  const chapter = Math.floor(id / 1000) % 1000;
  const verse = id % 1000;
  return Object.keys(bookText(code)).some((key) => new RegExp(`^${chapter}:${verse}(?![0-9])`).test(key));
};

// Every emoji Appendix A uses: all from Unicode Emoji 13.0 (2020) or older, so older phones do not show boxes.
const ALLOWED_PICTURES = new Set(["🌍", "🦒", "🐍", "🚢", "🐘", "🕊️", "🌈", "🧱", "✨", "😂", "🧂", "🍲", "🪜", "🤼", "🧥", "💰", "🐄", "🤗", "🧺",
  "🔥", "🐸", "🌊", "🪘", "🍞", "🪨", "🙌", "📜", "🐂", "🍇", "🐴", "🧶", "🎺", "🐑", "🏺", "🦁", "🏛️", "🌾", "🙏", "🛏️", "🫒", "🎶", "✂️", "🕺", "⚖️",
  "🏗️", "👑", "🐦", "🐎", "🛁", "🪓", "😔", "🦴", "✋", "⛈️", "🐋", "🌿", "👼", "🏠", "⭐", "🌙", "👶", "📖", "🦗", "🍷", "🎣", "🐟", "👀", "🔟",
  "🧒", "🪦", "🌳", "🍽️", "🪣", "🪙", "☀️", "🦶", "🐓", "☁️", "🩹", "🐖", "🪔", "🌱", "🪵", "🦪", "🦵", "💡", "🧵", "🐾", "⛓️", "🚪", "🪟", "💸"]);

describe("the scene list", () => {
  it("has the starter list's 129 scenes and the seven themes", () => {
    expect(scenes.length).toBe(129);
    expect(data.themes.map((t) => t.key)).toEqual(["beginnings", "kings", "jesus", "miracles", "parables", "church", "seasons"]);
  });

  it("keeps every field rule: unique ids, known themes, tier 1–3, age 4/8/12, titles of at most 36 characters", () => {
    const themes = new Set(data.themes.map((t) => t.key));
    expect(new Set(scenes.map((s) => s.id)).size).toBe(scenes.length);
    for (const s of scenes) {
      expect(s.id, s.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(s.title.length, s.title).toBeLessThanOrEqual(36);
      expect(s.title, s.id).toMatch(/^[A-Z]/);
      expect(s.title.endsWith("."), s.id).toBe(false);
      expect([1, 2, 3], s.id).toContain(s.tier);
      expect([4, 8, 12], s.id).toContain(s.age);
      expect(s.themes.length, s.id).toBeGreaterThan(0);
      for (const t of s.themes) expect(themes.has(t), `${s.id}: ${t}`).toBe(true);
    }
  });

  it("points every reference at verses that exist in the BSB", () => {
    for (const s of scenes) {
      for (const p of parseRef(s.ref, numOf)) {
        expect(hasVerse(p.code, p.start), `${s.id}: start of ${s.ref}`).toBe(true);
        expect(hasVerse(p.code, p.end), `${s.id}: end of ${s.ref}`).toBe(true);
      }
    }
  });

  it("finds every check word, as whole words, in the BSB text of its passage", () => {
    for (const s of scenes) {
      const text = normalise(parseRef(s.ref, numOf).flatMap((p) => passageVerses(p.code, p.start, p.end).map(([, words]) => words)).join(" "));
      expect(text.includes(normalise(s.check)), `${s.id}: "${s.check}" in ${s.ref}`).toBe(true);
    }
  });

  it("matches whole words only", () => {
    expect(normalise("He often went").includes(normalise("ten"))).toBe(false);
    expect(normalise("¶ A great windstorm arose").includes(normalise("storm"))).toBe(false);
    expect(normalise("“Lazarus, come out!”").includes(normalise("Lazarus, come out"))).toBe(true);
  });

  it("uses only allowed pictures", () => {
    for (const s of scenes) if (s.picture) expect(ALLOWED_PICTURES.has(s.picture), `${s.id}: ${s.picture}`).toBe(true);
  });

  it("uses every story key on at least two scenes (one alone is a typo)", () => {
    const counts = new Map<string, number>();
    for (const s of scenes) if (s.story) counts.set(s.story, (counts.get(s.story) ?? 0) + 1);
    for (const [story, n] of counts) expect(n, story).toBeGreaterThanOrEqual(2);
    expect([...counts.keys()].sort()).toEqual(["first-disciples", "jonah-1", "joseph-37", "noah", "peter-prison"]);
  });

  it("has both of the spec's examples, easiest tier, for every age", () => {
    for (const id of ["jonah-fish", "david-goliath"]) {
      const s = scenes.find((x) => x.id === id);
      expect(s, id).toBeDefined();
      expect([s?.tier, s?.age], id).toEqual([1, 4]);
    }
    expect(scenes.find((s) => s.id === "jonah-fish")?.title).toBe("Jonah and the great fish"); // the BSB's words, not "whale"
  });

  it("keeps the Everything deck at 12 scenes or more at every age and difficulty", () => {
    for (const ageGroup of ["little", "kids", "adults"] as const) {
      for (const { key } of DIFFICULTIES) {
        expect(poolFor(scenes, { ageGroup, deck: "everything", difficulty: key }).length, `${ageGroup} ${key}`).toBeGreaterThanOrEqual(MIN_DECK);
      }
    }
  });
});
