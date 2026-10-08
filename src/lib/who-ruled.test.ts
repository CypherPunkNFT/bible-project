import { readFileSync } from "node:fs";
import path from "node:path";
import { chapterWho, eraOf, isEmpty, reignWords, verseRuns, type WhoRuledBook } from "./who-ruled";

/** The generated files (scripts/build-reader-rulers.py), read as the reader loads them. */
const book = (code: string): WhoRuledBook => JSON.parse(readFileSync(path.resolve(__dirname, `../data/who-ruled/${code}.json`), "utf-8"));
const who = (code: string, chapter: number) => chapterWho(book(code), chapter);
const names = (items: { name: string }[]) => items.map((i) => i.name);
const reasonsOf = (items: { name: string; reasons: { kind: string }[] }[], name: string) => items.find((i) => i.name === name)?.reasons.map((r) => r.kind);

describe("who ruled when, per chapter", () => {
  it("2 Kings 18: Hezekiah and Sennacherib are named; Isaiah is not named until chapter 19", () => {
    const w = who("2KI", 18);
    expect(names(w.rulers).slice(0, 4)).toEqual(["Hezekiah", "Hoshea", "Shalmaneser", "Sennacherib"]);
    expect(reasonsOf(w.rulers, "Hezekiah")).toEqual(["named"]);
    expect(w.rulers.find((r) => r.name === "Hezekiah")!.reasons[0]).toMatchObject({ verses: expect.arrayContaining([1, 9, 10, 13, 14]) });
    expect(reasonsOf(w.rulers, "Sennacherib")).toEqual(["named"]);
    expect(w.rulers.find((r) => r.name === "Hezekiah")!.href).toBe("/people/hezekiah-2ki-16-20/rule");
    expect(names(w.prophets)).not.toContain("Isaiah");
    expect(names(who("2KI", 19).prophets)).toContain("Isaiah");
    expect(w.era).toBe("Two kingdoms");
  });

  it("Jeremiah 25: Jehoiakim and Nebuchadnezzar dated by 25:1, Nebuchadnezzar also named", () => {
    const w = who("JER", 25);
    expect(names(w.rulers).slice(0, 2)).toEqual(["Jehoiakim", "Nebuchadnezzar"]);
    expect(reasonsOf(w.rulers, "Jehoiakim")).toEqual(["dated", "named", "heading"]);
    expect(reasonsOf(w.rulers, "Nebuchadnezzar")).toEqual(["dated", "named"]);
    expect(w.rulers[0].reasons[0]).toMatchObject({ kind: "dated", span: [24025001, 24025001] });
    expect(names(w.prophets)).toEqual(["Jeremiah"]);
  });

  it("Isaiah 40: no ruler named, only the book's heading (Isaiah 1:1)", () => {
    const w = who("ISA", 40);
    expect(w.rulers.every((r) => r.reasons.length === 1 && r.reasons[0].kind === "heading")).toBe(true);
    expect(names(w.rulers)).toEqual(["Uzziah", "Jotham", "Ahaz", "Hezekiah"]);
    expect(w.headings[0].span).toEqual([23001001, 23001001]);
    expect(names(w.prophets)).toEqual(["Isaiah"]);
    expect(w.prophets[0].reasons).toEqual([{ kind: "heading", span: [23001001, 23001001] }]);
  });

  it("Luke 3: Tiberius, Pilate, Herod, Philip and Lysanias named and dated by Luke 3:1", () => {
    const w = who("LUK", 3);
    expect(names(w.rulers).slice(0, 5)).toEqual(["Tiberius", "Pontius Pilate", "Herod Antipas", "Philip the tetrarch", "Lysanias"]);
    for (const r of w.rulers.slice(0, 5)) {
      expect(r.reasons.map((x) => x.kind)).toEqual(["dated", "named"]);
      expect(r.reasons[0]).toMatchObject({ span: [42003001, 42003002] });
    }
    expect(w.era).toBe("New Testament");
  });

  it("Genesis 1: nothing", () => {
    expect(isEmpty(who("GEN", 1))).toBe(true);
  });

  it("Judges 4: Deborah, named and within her own account", () => {
    const w = who("JDG", 4);
    expect(names(w.rulers)[0]).toBe("Deborah");
    expect(reasonsOf(w.rulers, "Deborah")).toEqual(["named"]);
    expect(w.rulers[0].inTime).toBe(true);
    expect(reignWords(w.rulers[0].ruler)).toBe("her time as judge");
  });

  it("Psalm 51: David by the psalm's title, and Nathan, nothing more", () => {
    const w = who("PSA", 51);
    expect(names(w.rulers)).toEqual(["David"]);
    expect(reasonsOf(w.rulers, "David")).toEqual(["title", "named"]);
    expect(names(w.prophets)).toEqual(["Nathan"]);
  });

  it("a dating statement that names no king is kept without a ruler (Ezekiel 8)", () => {
    const w = who("EZK", 8);
    expect(w.statements.length).toBeGreaterThan(0);
    expect(w.statements.every((s) => s.quote)).toBe(true);
  });

  it("one person with two records shows once (Shallum = Jehoahaz in 1 Chronicles 3:15)", () => {
    const ids = who("1CH", 3).rulers.map((r) => r.id);
    expect(ids.filter((id) => id.startsWith("jehoahaz-2ki-23-30") || id.startsWith("shallum-1ch-3-15"))).toEqual(["jehoahaz-2ki-23-30"]);
  });

  it("a ruler without a page links to the person page (Lemuel, Proverbs 31)", () => {
    const w = who("PRO", 31);
    const lemuel = w.rulers.find((r) => r.name === "Lemuel")!;
    expect(lemuel.href).toBe("/people/lemuel-pro-31-1");
    expect(lemuel.ruler).toBeUndefined();
  });

  it("never lists a person twice in a chapter", () => {
    for (const code of ["2KI", "2CH", "1KI", "JER", "LUK", "MAT", "ACT"]) {
      const b = book(code);
      for (const chapter of Object.keys(b.chapters)) {
        const w = chapterWho(b, Number(chapter));
        const ids = [...w.rulers, ...w.prophets].map((r) => r.id);
        expect(new Set(ids).size, `${code} ${chapter}`).toBe(ids.length);
      }
    }
  });
});

describe("helpers", () => {
  it("joins runs of verses", () => {
    expect(verseRuns([14, 1, 13, 15, 15, 20])).toEqual([[1, 1], [13, 15], [20, 20]]);
  });
  it("places a reign in its era by its middle year", () => {
    expect(eraOf({ name: "x", title: "", kind: "king", realm: "judah", dates: { from: 729, to: 687, label: "" } })).toBe("Two kingdoms");
    expect(eraOf({ name: "x", title: "", kind: "roman", realm: "rome", dates: { from: -14, to: -37, label: "" } })).toBe("New Testament");
    expect(eraOf({ name: "x", title: "", kind: "judge", realm: "tribes" })).toBeUndefined();
  });
});
