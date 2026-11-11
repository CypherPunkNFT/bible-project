// Odd one out: checks on the shipped sets (design section 12), including the independent second solver (6.7). The
// solver is written from the design's text, not ported from scripts/odd-one-out/ooo_check.py, and it never reads a
// set's rule, polarity or "also" fields: from the fact table alone it finds every item some property singles out.
import { bsbWords } from "@/lib/bsb-for-tests";
import factsTable from "@/data/odd-one-out/facts-table.json";
import setsJson from "@/data/odd-one-out/sets.json";
import { CHOICES, DIFFICULTIES, isAvailable, shownLabel, type SetEntry, type SetsFile } from "./game";

interface TableProp { id: string; anchor?: string }
interface TableItem { name: string; t: number[]; u: number[] }
interface FactTable { bookWords: string[]; kinds: Record<string, { props: TableProp[]; items: Record<string, TableItem> }> }

const data = setsJson as unknown as SetsFile;
const table = factsTable as unknown as FactTable;
type Value = boolean | null;

/** Design 6.2: the singled-out item's own value must be known; an unknown elsewhere counts as the opposite. */
function picksOut(values: Value[], at: number, lacksOnly = false): boolean {
  const mine = values[at];
  if (mine === null || (lacksOnly && mine)) return false;
  return values.every((theirs, n) => n === at || theirs === null || theirs !== mine);
}

const firstLetter = (label: string) => (label.match(/[A-Za-z]/)?.[0] ?? "").toUpperCase();

/** Design 5.2 and 6.4: surface properties of the labels shown. [values, lacksOnly] */
function labelProperties(set: SetEntry, shown: string[], names: string[]): [boolean[], boolean][] {
  const out: [boolean[], boolean][] = [];
  for (const letter of new Set(shown.map(firstLetter))) out.push([shown.map((l) => firstLetter(l) === letter), true]);
  out.push([shown.map((l, n) => l !== names[n]), false]);
  if (set.kind === "person") out.push([shown.map((l) => table.bookWords.includes(l.split(/[ ,]/)[0])), false]);
  if (set.kind === "place") {
    for (const word of ["mount", "sea", "river", "valley", "wilderness"]) {
      out.push([shown.map((l) => (l.toLowerCase().match(/[a-z]+/g) ?? ([] as string[])).includes(word)), false]);
    }
  }
  if (set.kind === "book") out.push([shown.map((l) => /^\d/.test(l)), false]);
  return out;
}

/** Every item of the set that some property singles out. */
function solve(set: SetEntry): Set<string> {
  const kind = table.kinds[set.kind];
  const facts = set.items.map((id) => kind.items[id]);
  const found = new Set<string>();
  kind.props.forEach((prop, index) => {
    if (prop.anchor && set.items.includes(prop.anchor)) return; // design 6.1 step 5
    const values: Value[] = facts.map((f) => (f.t.includes(index) ? true : f.u.includes(index) ? null : false));
    values.forEach((_, at) => { if (picksOut(values, at)) found.add(set.items[at]); });
  });
  const shown = set.items.map((id) => shownLabel(data, set, id));
  for (const [values, lacksOnly] of labelProperties(set, shown, facts.map((f) => f.name))) {
    values.forEach((_, at) => { if (picksOut(values, at, lacksOnly)) found.add(set.items[at]); });
  }
  return found;
}

const validVerse = (ref: number) => {
  const book = Math.floor(ref / 1_000_000);
  return Number.isInteger(ref) && book >= 1 && book <= 66 && Math.floor(ref / 1000) % 1000 >= 1 && ref % 1000 >= 1;
};

describe("odd one out sets", () => {
  it("holds four distinct items of one kind in every set, with its answer and rule", () => {
    for (const set of data.sets) {
      expect(new Set(set.items).size).toBe(4);
      for (const id of set.items) expect(data.items[id]?.kind).toBe(set.kind);
      expect(set.items).toContain(set.odd);
      expect(data.rules[set.rule]?.kind).toBe(set.kind);
    }
  });

  it("repeats no set id and no group of four", () => {
    expect(new Set(data.sets.map((s) => s.id)).size).toBe(data.sets.length);
    expect(new Set(data.sets.map((s) => [...s.items].sort().join())).size).toBe(data.sets.length);
  });

  it("never shows two items with the same name in one set", () => {
    const bare = (name: string) => name.toLowerCase().replace(/^mount (of )?/, "");
    for (const set of data.sets) {
      expect(new Set(set.items.map((id) => shownLabel(data, set, id).toLowerCase())).size).toBe(4);
      expect(new Set(set.items.map((id) => bare(table.kinds[set.kind].items[id].name))).size).toBe(4);
    }
  });

  it("points every fact and key verse at a real verse", () => {
    for (const item of Object.values(data.items)) expect(validVerse(item.ref)).toBe(true);
    for (const set of data.sets) for (const ref of Object.values(set.facts ?? {})) expect(validVerse(ref)).toBe(true);
    for (const rule of Object.values(data.rules)) {
      if (!rule.keyRef) continue;
      expect(rule.keyRef.every(validVerse)).toBe(true);
      // The words come from the reader's Bible at play time; the Berean must hold every key verse.
      for (let ref = rule.keyRef[0]; ref <= rule.keyRef[1]; ref++) {
        const verse = { code: data.books[Math.floor(ref / 1_000_000) - 1][0], chapter: Math.floor(ref / 1000) % 1000, verse: ref % 1000 };
        expect(bsbWords(verse).length, String(ref)).toBeGreaterThan(10);
      }
    }
  });

  it("offers a kind and difficulty only with enough sets for two rounds", () => {
    expect(data.minSets).toBe(20);
    for (const choice of CHOICES.filter((c) => c !== "mixed")) {
      for (const difficulty of DIFFICULTIES) {
        const count = data.sets.filter((s) => s.kind === choice && s.difficulty === difficulty).length;
        expect(isAvailable(data, choice, difficulty)).toBe(count >= data.minSets);
      }
    }
    expect(isAvailable(data, "person", "easy")).toBe(true);
  });

  it("finds exactly one answer in every set with the second solver, and it is the shipped answer", () => {
    const wrong = data.sets.filter((set) => { const found = solve(set); return found.size !== 1 || !found.has(set.odd); })
      .map((set) => `${set.id}: ${[...solve(set)].join(", ")}`);
    expect(wrong).toEqual([]);
  });

  it("splits every set three and one by its shipped rule, as the reason shown says", () => {
    const wrong = data.sets.filter((set) => {
      const kind = table.kinds[set.kind];
      const index = kind.props.findIndex((prop) => prop.id === set.rule);
      if (index < 0 || (kind.props[index].anchor && set.items.includes(kind.props[index].anchor!))) return true;
      const share = set.polarity === "members-share";
      return set.items.some((id) => {
        const item = kind.items[id];
        const has = item.t.includes(index);
        return item.u.includes(index) || has !== (id === set.odd ? !share : share);
      });
    }).map((set) => set.id);
    expect(wrong).toEqual([]);
  });

  it("ships the owner's example first: Peter, John, Paul, James, and the answer is Paul", () => {
    const first = data.sets.find((s) => s.id === data.first)!;
    expect(first.kind).toBe("person");
    expect(first.difficulty).toBe("easy");
    expect(first.items.map((id) => shownLabel(data, first, id)).sort()).toEqual(["James", "John", "Paul", "Peter"]);
    expect(shownLabel(data, first, first.odd)).toBe("Paul");
  });

  it("counts only Matthew, Mark, Luke and John as Gospels", () => {
    const gospels = new Set(["mat", "mrk", "luk", "jhn"]);
    for (const set of data.sets.filter((s) => s.rule === "gospel")) {
      const members = set.polarity === "members-share" ? set.items.filter((id) => id !== set.odd) : [set.odd];
      for (const id of members) expect(gospels.has(id)).toBe(true);
      expect(members).not.toContain("act");
    }
  });
});
