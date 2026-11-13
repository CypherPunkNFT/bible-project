// What came first?: the generated files (design §10, §12). Each must match its stamp and sources, keep the rules of its
// category, and hold enough pairs. The pool checks here are written apart from orderOf, so a mistake there cannot hide
// itself; the named pairs are the ones the design says must never be asked, or must be.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import builtFile from "@/data/what-came-first/built.json";
import diedFile from "@/data/what-came-first/died.json";
import eventsFile from "@/data/what-came-first/events.json";
import firstsFile from "@/data/what-came-first/firsts.json";
import journeysFile from "@/data/what-came-first/journeys.json";
import ruledFile from "@/data/what-came-first/ruled.json";
import booksFile from "@/data/what-came-first/books.json";
import whosOlder from "@/data/whos-older/whos-older.json";
import { bsbWords } from "@/lib/bsb-for-tests";
import type { WhosOlderData } from "../whos-older/game";
import * as whosOlderPairing from "../whos-older/pairing";
import { BANDS, bandOf } from "./bands";
import { livedItems } from "./categories/lived";
import { expandBeforeSaul, type BeforeSaul } from "./categories/ruled";
import { RULES, allOrders, buildIndex, orderOf, pairKey, type Fact, type Item, type PairCategory, type Span } from "./order";

interface PairFile { about: string; stamp: string; sources?: string; books?: Record<string, [string, string]>; items: Item[]; facts?: Fact[];
  blocked?: [string, string][]; beforeSaul?: BeforeSaul }
const sha = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 12);
const source = (name: string) => readFileSync(`src/data/what-came-first/${name}`, "utf8");
const catalog = new Map((JSON.parse(readFileSync("data/catalog.json", "utf8")).books as { num: number; code: string }[]).map((b) => [b.num, b.code]));

const events = eventsFile as unknown as PairFile;
const ruled = ruledFile as unknown as PairFile;
const built = builtFile as unknown as PairFile;
const journeys = journeysFile as unknown as PairFile;
const died = diedFile as unknown as PairFile;
// books.json keeps only id, label, position, testament and section: every book is famous and has no years.
const books: PairFile = { ...(booksFile as unknown as PairFile),
  items: (booksFile as unknown as PairFile).items.map((book) => ({ ...book, tier: 1, lo: null, hi: null, shown: true })) };

/** The facts a game would use: the file's own, plus the judges' "before Saul" facts for Who ruled first. */
const factsOf = (file: PairFile) => [...(file.facts ?? []), ...(file.beforeSaul ? expandBeforeSaul(file.items, file.facts ?? [], file.beforeSaul) : [])];

const POOLS: { name: string; category: PairCategory; file: PairFile; minPartners: number; minPerBand: number }[] = [
  { name: "events", category: "happened", file: events, minPartners: 8, minPerBand: 300 },
  { name: "ruled", category: "ruled", file: ruled, minPartners: 8, minPerBand: 200 },
  { name: "built", category: "built", file: built, minPartners: 6, minPerBand: 50 },
  { name: "journeys", category: "went", file: journeys, minPartners: 2, minPerBand: 50 },
  { name: "died", category: "died", file: died, minPartners: 6, minPerBand: 100 },
  { name: "books", category: "books", file: books, minPartners: 65, minPerBand: 300 },
];
const ordersOf = (category: PairCategory, file: PairFile) => allOrders(file.items, buildIndex(factsOf(file), file.blocked ?? []), RULES[category]);
const byId = (file: PairFile) => new Map(file.items.map((i) => [i.id, i]));

describe("the generated files", () => {
  it.each([...POOLS.map((p) => [p.name, p.name === "books" ? booksFile : p.file] as const), ["firsts", firstsFile] as const])("%s matches its stamp, so it has not been edited by hand", (_, file) => {
    const { stamp, ...body } = file as unknown as { stamp: string };
    expect(sha(JSON.stringify(body))).toBe(stamp);
  });

  it("records the hash of the source files each was built from", () => {
    expect(built.sources).toBe(sha(source("built.source.json")));
    expect(died.sources).toBe(sha(source("died.source.json")));
    expect(journeys.sources).toBe(sha(source("journeys.source.json")));
    expect((firstsFile as { sources: string }).sources).toBe(sha(source("firsts.source.json")));
    const timeline = JSON.parse(readFileSync("src/data/timeline/timeline.json", "utf8")) as { stamp: string };
    expect(events.sources).toBe(sha([timeline.stamp, source("events.source.json")].join("\u0000")));
  });
});

describe.each(POOLS)("the $name pool", ({ category, file, minPartners, minPerBand }) => {
  const orders = ordersOf(category, file);
  const items = byId(file);

  it("has unique ids and labels, valid tiers and windows with no year 0", () => {
    expect(items.size).toBe(file.items.length);
    expect(new Set(file.items.map((i) => `${i.group ?? ""}|${i.label.toLowerCase()}`)).size).toBe(file.items.length);
    for (const i of file.items) {
      expect([1, 2, 3], i.id).toContain(i.tier);
      expect(i.lo !== 0 && i.hi !== 0, i.id).toBe(true);
      if (i.lo !== null && i.hi !== null) expect(i.lo, i.id).toBeLessThanOrEqual(i.hi);
    }
  });

  it("asks a pair only on a fact, strict windows or positions in one group, and never a blocked pair", () => {
    const facts = new Map(factsOf(file).map((f) => [pairKey(f.first, f.second), f]));
    const blocked = new Set((file.blocked ?? []).map(([a, b]) => pairKey(a, b)));
    for (const { first, second } of orders) {
      const key = pairKey(first.id, second.id);
      expect(blocked.has(key), `blocked pair asked: ${key}`).toBe(false);
      const byFact = facts.get(key)?.first === first.id;
      // Two early-Genesis windows (shown: false) prove nothing here; only Who lived first orders them, and it is not in this list.
      const byWindows = (first.shown || second.shown) && first.hi !== null && second.lo !== null && first.hi < second.lo;
      const byPosition = first.position !== undefined && first.group === second.group && first.position < second.position!;
      expect(byFact || byWindows || byPosition, `${first.id} before ${second.id} rests on nothing`).toBe(true);
    }
  });

  it("has facts that point at real items, never both ways, never against the windows, each with words to show", () => {
    const seen = new Set<string>();
    for (const f of file.facts ?? []) {
      const [a, b] = [items.get(f.first), items.get(f.second)];
      expect(a && b, `${f.first} / ${f.second}`).toBeTruthy();
      if (a!.lo !== null && b!.hi !== null) expect(b!.hi < a!.lo, `${f.first} before ${f.second} is against the windows`).toBe(false);
      expect(seen.has(`${f.second}>${f.first}`), `${f.first} / ${f.second} point both ways`).toBe(false);
      seen.add(`${f.first}>${f.second}`);
      expect(f.why.trim()).not.toBe("");
      if (!f.derived) expectWords(f.refs[0], `${f.first} / ${f.second}`);
    }
  });

  it("blocks only pairs of two real items, and deals no excluded person", () => {
    for (const [a, b] of file.blocked ?? []) expect(items.has(a) && items.has(b), `${a} / ${b}`).toBe(true);
    for (const id of RULES[category].excluded) expect(items.has(id), id).toBe(false);
  });

  it(`gives every item at least ${minPartners} partners and every band at least ${minPerBand} pairs`, () => {
    const partners = new Map<string, number>();
    for (const o of orders) for (const id of [o.first.id, o.second.id]) partners.set(id, (partners.get(id) ?? 0) + 1);
    for (const i of file.items) expect(partners.get(i.id) ?? 0, i.id).toBeGreaterThanOrEqual(minPartners);
    for (const band of BANDS) expect(orders.filter((o) => bandOf(category, o) === band).length, band).toBeGreaterThanOrEqual(minPerBand);
  });
});

/** The Berean holds words for every verse of a span (the reveal quotes it in the reader's Bible). */
function expectWords([start, end]: Span, what: string) {
  const code = catalog.get(Math.floor(start / 1_000_000))!;
  for (let id = start; id <= end; id++) {
    expect(bsbWords({ code, chapter: Math.floor(id / 1000) % 1000, verse: id % 1000 }).trim(), `${what}: ${id}`).not.toBe("");
  }
}

describe("Who lived first", () => {
  it("orders every pair of Who's older?'s people exactly as Who's older? does", () => {
    const data = whosOlder as unknown as WhosOlderData;
    const people = livedItems(data);
    const ours = buildIndex(data.facts as unknown as Fact[], data.blocked);
    const theirs = whosOlderPairing.buildIndex(data.facts, data.blocked);
    let pairs = 0;
    for (let i = 0; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) {
        const mine = orderOf(people[i], people[j], ours, RULES.lived);
        const original = whosOlderPairing.orderOf(data.characters[i], data.characters[j], theirs);
        expect(mine?.first.id, `${people[i].id} / ${people[j].id}`).toBe(original?.first.id);
        expect(mine?.reason.kind).toBe(original?.reason.kind);
        if (mine) pairs++;
      }
    }
    expect(pairs).toBeGreaterThan(10_000);
  });
});

describe("What happened first", () => {
  it("never pairs two of Jesus's miracles, two plagues or two days of Creation", () => {
    const groups = (JSON.parse(source("events.source.json")) as { blockedGroups: { name: string; ids: string[] }[] }).blockedGroups;
    const index = buildIndex(events.facts ?? [], events.blocked ?? []);
    const items = byId(events);
    for (const group of groups) {
      const present = group.ids.filter((id) => items.has(id));
      for (const a of present) for (const b of present) if (a < b) expect(orderOf(items.get(a)!, items.get(b)!, index, RULES.happened), `${group.name}: ${a} / ${b}`).toBeNull();
    }
  });

  it("never asks the two single blocked pairs (Hezekiah's temple and Samaria's fall; the anointing and the entry)", () => {
    const index = buildIndex(events.facts ?? [], events.blocked ?? []);
    const items = byId(events);
    for (const [a, b] of [["hezekiah-reopens-temple", "samaria-falls"], ["anointing-bethany", "entry-jerusalem"]]) {
      expect(items.has(a) && items.has(b), `${a} / ${b} are both in the pool`).toBe(true);
      expect(orderOf(items.get(a)!, items.get(b)!, index, RULES.happened)).toBeNull();
    }
  });
});

describe("Where did they go first", () => {
  it("never makes a journey's starting place one of its stops", () => {
    const { journeys: list } = journeysFile as unknown as { journeys: { id: string; origin: string }[] };
    for (const j of list) {
      const stops = journeys.items.filter((i) => i.group === j.id);
      expect(stops.length, j.id).toBeGreaterThanOrEqual(3);
      expect(stops.map((i) => i.label.toLowerCase()), j.id).not.toContain(j.origin.toLowerCase());
    }
  });
});

describe("Which comes first in your Bible", () => {
  it("holds the 66 books in order, named as the catalogue names them, and asks all 2,145 pairs", () => {
    const names = new Map((JSON.parse(readFileSync("data/catalog.json", "utf8")).books as { code: string; name: string }[]).map((b) => [b.code, b.name]));
    for (const b of books.items) expect(b.label, b.id).toBe(names.get(b.id));
    expect(books.items.map((b) => b.position)).toEqual(Array.from({ length: 66 }, (_, n) => n + 1));
    expect(books.items.filter((b) => b.testament === "old")).toHaveLength(39);
    expect(ordersOf("books", books)).toHaveLength(2145);
  });
});

describe("Bible Firsts", () => {
  const { questions } = firstsFile as unknown as { questions: { id: string; question: string; answer: string; options: string[]; refs: Span[]; never?: unknown }[] };
  const sourceQuestions = new Map((JSON.parse(source("firsts.source.json")) as { questions: { id: string; never?: string[] }[] }).questions.map((q) => [q.id, q]));
  const norm = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  it("asks at least 15 questions, each with a distinct answer and 2 or 3 wrong options", () => {
    expect(questions.length).toBeGreaterThanOrEqual(15);
    for (const q of questions) {
      expect(q.question.trim().endsWith("?"), q.id).toBe(true);
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(2);
      expect(q.options.length, q.id).toBeLessThanOrEqual(3);
      expect(new Set([q.answer, ...q.options].map(norm)).size, q.id).toBe(q.options.length + 1);
      expectWords(q.refs[0], q.id);
    }
  });

  it("holds the owner's 36 added questions (firsts-additions.md) and calls Stephen the first Christian martyr", () => {
    const added = ["first-words-bible", "first-son-adam-eve", "first-son-abraham", "first-judah-firstborn", "first-twin-perez", "first-joseph-firstborn",
      "first-aaron-firstborn", "first-jesse-firstborn", "first-mary-firstborn", "first-levites-firstborn", "first-question-bible", "first-question-adam",
      "first-ate-fruit", "first-jacob-wife", "first-sign-moses", "first-month", "first-camp-canaan", "first-city-conquered", "first-fleece",
      "first-temptation", "first-words-jesus", "first-followers-andrew", "first-into-tomb", "first-day-week", "first-seek-kingdom", "first-beam-eye",
      "first-reconciled", "first-loved-us", "first-to-jew", "first-dead-rise", "first-firstfruits", "first-and-last", "first-love-ephesus",
      "first-beatitude", "first-fruit-spirit", "first-church-addressed"];
    const ids = new Set(questions.map((q) => q.id));
    expect(added.filter((id) => !ids.has(id))).toEqual([]);
    expect(new Set(added).size).toBe(36);
    expect(questions.find((q) => q.id === "first-killed-acts")?.question).toBe("Who was the first Christian martyr?");
  });

  it("never offers a defensible answer as a wrong option, and ships no never list", () => {
    for (const q of questions) {
      expect(q.never, q.id).toBeUndefined();
      const never = new Set((sourceQuestions.get(q.id)?.never ?? []).map(norm));
      for (const option of q.options) expect(never.has(norm(option)), `${q.id}: ${option}`).toBe(false);
    }
  });

  it("leaves out the days of Creation, the plagues, which book was written first and which miracle came first", () => {
    for (const q of questions) expect(q.question, q.id).not.toMatch(/\b(plague|days? of creation|written first|first written|miracle)\b/i);
  });
});
