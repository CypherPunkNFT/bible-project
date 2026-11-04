import { bsbWords } from "@/lib/bsb-for-tests";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { bare, clusters, D, DEFAULT_FORM, DEFAULT_LAYER, DEFAULT_LENS, DEFAULT_LINE, DEFAULT_ROOT, featuredById, findForm, findLayer, findLens, findLine, findOpened, findRoot, H, inLens, peel, percent, readerHref, readingTag, rootPlaces, sourceById, syllable, verseByLabel } from "./model";

const cp = (...points: number[]) => String.fromCodePoint(...points);
const POINT_OR_ACCENT = new RegExp(`[${cp(0x591)}-${cp(0x5bd)}${cp(0x5c1)}${cp(0x5c2)}${cp(0x5c7)}]`);
const ACCENT = new RegExp(`[${cp(0x591)}-${cp(0x5af)}]`);
const BIDI = new RegExp(`[${cp(0x200e)}${cp(0x200f)}${cp(0x202a)}-${cp(0x202e)}${cp(0x2066)}-${cp(0x2069)}]`);
const FINALS: Record<string, string> = { [cp(0x5da)]: cp(0x5db), [cp(0x5dd)]: cp(0x5de), [cp(0x5df)]: cp(0x5e0), [cp(0x5e3)]: cp(0x5e4), [cp(0x5e5)]: cp(0x5e6) };
const EXTERNAL = /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\//i;
const IMAGE_BUDGET = 150_000;

describe("How Hebrew works study: its rules", () => {
  it("opens every verse in the Berean", () => {
    expect(readerHref("PSA", 119, 105)).toBe("/read/bsb/PSA/119?hl=105-105");
  });
  it("falls back when the address asks for something unknown", () => {
    for (const bad of ["__proto__", "constructor", "letter:__proto__", "word:nope", "cell:9-9", "", "<script>"]) {
      expect(findOpened(bad)).toBeNull();
      expect(findLine(bad).id).toBe(DEFAULT_LINE);
      expect(findLayer(bad)).toBe(DEFAULT_LAYER);
      expect(findLens(bad).id).toBe(DEFAULT_LENS);
      expect(findRoot(bad).id).toBe(DEFAULT_ROOT);
      expect(findForm(bad).id).toBe(DEFAULT_FORM);
    }
    expect(findOpened(null)).toBeNull();
  });
  it("opens each letter, word and cell by its own key", () => {
    for (const letter of D.letters) expect(findOpened(`letter:${letter.id}`)).toEqual({ type: "letter", letter });
    for (const item of D.featured) expect(findOpened(`word:${item.id}`)?.type).toBe("word");
    expect(findOpened("cell:3ms-p")?.type).toBe("cell");
    expect(findOpened("letter:davar")).toBeNull();
  });
  it("peels a real verse into layers without losing a letter, a space or the joining stroke", () => {
    const line = H.lines["gen1-3"].words.map((w) => w.he).join(" ");
    const points = peel(line, "points"), letters = peel(line, "letters");
    expect(peel(line, "accents")).toBe(line);
    expect(ACCENT.test(line)).toBe(true);
    expect(ACCENT.test(points)).toBe(false);
    expect(POINT_OR_ACCENT.test(points)).toBe(true);
    expect(POINT_OR_ACCENT.test(letters)).toBe(false);
    expect(clusters(letters)).toHaveLength(clusters(line).length);
    expect(letters).toContain(cp(0x5be));
    expect(letters.split(" ")).toHaveLength(line.split(" ").length);
  });
  it("says what was read of every status it uses", () => {
    expect(new Set(D.sources.map((s) => readingTag(s.status)))).toEqual(new Set(["read", "part read", "reported second-hand", "located, not read"]));
  });
  it("computes a share without dividing by nothing", () => {
    expect(percent(1, 4)).toBe(25);
    expect(percent(1, 0)).toBe(0);
  });
  it("sounds a letter and a point", () => {
    const lamed = D.carriers[0];
    expect(syllable(lamed, D.vowels.find((v) => v.id === "patach")!)).toBe("la");
    expect(syllable(lamed, D.vowels.find((v) => v.id === "sheva")!)).toBe("le, or l");
  });
  it("picks out the right letters under each lens", () => {
    expect(D.letters.filter((l) => inLens(l, "finals"))).toHaveLength(5);
    expect(D.letters.filter((l) => inLens(l, "dots")).map((l) => l.id)).toEqual(["bet", "kaf", "pe", "shin"]);
    expect(D.letters.filter((l) => inLens(l, "all"))).toHaveLength(22);
  });
});

describe("How Hebrew works study: its data", () => {
  it("holds no bidi controls and stays within its budget", () => {
    const text = JSON.stringify(H);
    expect(BIDI.test(text)).toBe(false);
    expect(new TextEncoder().encode(text).length).toBeLessThanOrEqual(60_000);
  });
  it("has twenty-two stanzas, each opening on its letter", () => {
    D.letters.forEach((letter, i) => {
      const stanza = H.psalm[letter.id];
      expect(stanza.verse).toBe(i * 8 + 1);
      expect(stanza.first[0]).toBe(letter.glyph);
    });
  });
  it("gives every guided word one step per letter, and the steps spell its sound", () => {
    for (const line of D.lines.filter((l) => l.guided)) {
      H.lines[line.id].words.forEach((word, w) => {
        const steps = line.words[w].steps!;
        expect(steps, word.he).toHaveLength(clusters(bare(word.he)).length);
        expect(steps.map((s) => s[0]).join("")).toBe(line.words[w].sound.replace(/-/g, "").toLowerCase());
        for (const [, rule] of steps) expect(D.rules.some((r) => r.id === rule), rule).toBe(true);
      });
    }
  });
  it("runs a root's threads through the root's own letters", () => {
    for (const item of D.featured.filter((f) => f.root)) {
      const places = rootPlaces(H.featured[item.id].he, item.root!);
      const root = D.roots.find((r) => r.id === item.group)?.letters;
      if (root) expect([places[1], places[3], places[5]].map((p) => clusters(p)[0][0]).map((l) => FINALS[l] ?? l).join(""), item.id).toBe([...root].map((l) => FINALS[l] ?? l).join(""));
      expect(places.join(""), item.id).toBe(H.featured[item.id].he);
    }
  });
  it("gives each root at least four words and has a verse for each", () => {
    for (const root of D.roots) expect(D.featured.filter((f) => f.group === root.id).length, root.id).toBeGreaterThanOrEqual(4);
    for (const id of featuredById.keys()) expect(bsbWords(verseByLabel.get(H.featured[id].label)!).length, id).toBeGreaterThan(10);
  });
  it("draws every featured word from Genesis or the Psalms", () => {
    for (const item of D.featured) expect(["Genesis", "Psalm"].some((name) => H.featured[item.id].label.startsWith(name)), item.id).toBe(true);
  });
  it("keeps the counts the page leans on", () => {
    expect(H.counts.hebrewWords).toBeGreaterThan(300_000);
    expect(H.counts.aramaicWords).toBeGreaterThan(4_000);
    expect(H.counts.books).toHaveLength(39);
    expect(H.counts.forms.w).toBeGreaterThan(H.counts.forms.p);
    expect(percent(H.counts.books[0].w as number, H.counts.books[0].total)).toBe(42);
    expect(percent(H.counts.books[18].w as number, H.counts.books[18].total)).toBe(6);
    expect(H.counts.setAside).toBeLessThan(500);
  });
});

describe("How Hebrew works study: its research record", () => {
  it("gives each test exactly one right answer", () => {
    for (const test of [...D.tests, D.claims.vowels.test, D.claims.time.test]) expect(test.options.filter((o) => o.right)).toHaveLength(1);
  });
  it("cites only sources it lists, each saying what was read", () => {
    for (const s of D.sources) expect(s.read.length, s.id).toBeGreaterThan(10);
    for (const view of D.views) expect(sourceById.has(view.source), view.who).toBe(true);
  });
  it("links outside the site only by https, and inside only to a local path", () => {
    for (const s of D.sources) expect(s.url.startsWith("/") ? /^\/(?!\/)/.test(s.url) : EXTERNAL.test(s.url), s.id).toBe(true);
    for (const p of D.pictures) expect(EXTERNAL.test(p.href), p.id).toBe(true);
  });
  it("keeps unread works marked as unread", () => {
    expect(sourceById.get("waltke")?.status).toBe("second-hand");
    expect(sourceById.get("cook")?.status).toBe("located");
    expect(sourceById.get("joosten")?.status).toBe("second-hand");
  });
});

describe("How Hebrew works study: its pictures", () => {
  it("credits each one, and each file is here, small and sized as recorded", () => {
    for (const p of D.pictures) {
      for (const field of [p.credit, p.licence, p.href, p.retrieved, p.alt, p.caption]) expect(field.length, p.id).toBeGreaterThan(2);
      expect(p.width, p.id).toBeGreaterThan(100);
      expect(p.height, p.id).toBeGreaterThan(100);
      const path = resolve(process.cwd(), "public", p.src.replace(/^\//, ""));
      expect(existsSync(path), p.src).toBe(true);
      expect(statSync(path).size, p.src).toBeLessThanOrEqual(IMAGE_BUDGET);
    }
  });
});
