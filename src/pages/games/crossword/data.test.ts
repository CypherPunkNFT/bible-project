// Bible crossword's clue file (design §2, §8): every shipped clue keeps the rules, every verse blank matches the BSB on
// disk, and the file is what scripts/build-crossword.ts writes from today's data.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import clues from "@/data/crossword/clues.json";
import { gridLetters } from "@/lib/puzzles";
import type { CluesFile } from "./game";
import { MAX_CLUE, THEMES, clueProblem, isOffered } from "./themes";

const data = clues as unknown as CluesFile;
const bsb = new Map<string, Record<string, string>>();
const verse = (ref: number) => {
  const code = data.books[Math.floor(ref / 1_000_000) - 1][0];
  if (!bsb.has(code)) bsb.set(code, JSON.parse(readFileSync(`data/plain/bsb/${code}.json`, "utf8")));
  return bsb.get(code)![`${Math.floor(ref / 1000) % 1000}:${ref % 1000}`];
};

describe("the clue file", () => {
  it("holds clues of every kind, 66 books and a stamp", () => {
    expect(data.stamp).toMatch(/^[0-9a-f]{16}$/);
    expect(data.books).toHaveLength(66);
    for (const kind of ["person", "place", "verse", "quiz"]) expect(data.entries.filter((e) => e.k === kind).length, kind).toBeGreaterThan(150);
  });

  it("keeps every clue rule", () => {
    for (const e of data.entries) {
      expect(e.a, e.w).toBe(gridLetters(e.w));
      expect(e.a.length).toBeGreaterThanOrEqual(3);
      expect(e.a.length).toBeLessThanOrEqual(15);
      expect(e.c.length).toBeLessThanOrEqual(MAX_CLUE);
      expect(clueProblem(e.a, e.c), `${e.a}: ${e.c}`).toBeNull();
      expect([1, 2, 3]).toContain(e.t);
      expect(e.b.every((b) => Number.isInteger(b) && b >= 1 && b <= 66)).toBe(true);
      if (e.k !== "quiz") expect(e.b.length).toBeGreaterThan(0);
    }
  });

  it("quotes each verse clue exactly from the BSB, with the answer blanked", () => {
    for (const e of data.entries.filter((x) => x.k === "place" || x.k === "verse")) {
      const quoted = /^“(.*)” \((.+)\)$/.exec(e.c);
      expect(quoted, e.c).not.toBeNull();
      const text = verse(e.r!);
      const parts = quoted![1].replace(/^…/, "").replace(/…$/, "").split("____");
      expect(parts.length).toBeGreaterThan(1);
      // Each piece between blanks is in the verse, in order, and the blanks stood for the answer.
      const pattern = new RegExp(parts.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("([A-Za-z‑-]+)"));
      const match = pattern.exec(text.replace(/^[“"‘]+/, ""));
      expect(match, `${e.a}: ${e.c}`).not.toBeNull();
      for (const word of match!.slice(1)) expect(gridLetters(word)).toBe(e.a);
    }
  });

  it("offers every theme, and the whole Bible at every level and size", () => {
    for (const theme of THEMES) expect(isOffered(data.entries, { theme: theme.id }, "hard", "small"), theme.id).toBe(true);
  });

  it("is what the build script writes from today's data", () => {
    const run = spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "scripts/build-crossword.ts", "--check"], { encoding: "utf8" });
    expect(run.status, run.stderr + run.stdout).toBe(0);
  }, 60_000);
});
