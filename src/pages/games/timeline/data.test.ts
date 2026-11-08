// The generated pool (src/data/timeline/timeline.json) against the build's checks (design §4.6), plus an independent
// second check of dealt rounds that does not use order.ts's explain, so a bug there cannot hide itself.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import timelineFile from "@/data/timeline/timeline.json";
import { mulberry32 } from "./daily-rules";
import { LEVEL_KEYS, deal, type EraChoice } from "./deal";
import { ERA_KEYS, explain, trueOrder, type TimelineEvent } from "./order";
import { prepare, type TimelineData } from "./text";

const data = timelineFile as unknown as TimelineData;
const { index } = prepare(data);
const events = data.events;
const byId = new Map(events.map((event) => [event.id, event]));
const SOURCES = ["events.source.json", "facts.source.json", "contested.source.json"];

describe("timeline sort data", () => {
  it("holds a pool of about 220 events across all eight eras", () => {
    expect(events.length).toBeGreaterThanOrEqual(150);
    for (const era of ERA_KEYS) expect(events.filter((event) => event.era === era).length, era).toBeGreaterThanOrEqual(10);
  });

  it("has unique ids and labels of at most 48 characters", () => {
    expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
    expect(new Set(events.map((e) => e.label.toLowerCase())).size).toBe(events.length);
    for (const event of events) expect(event.label.length, event.label).toBeLessThanOrEqual(48);
  });

  it("has valid windows with no year 0, early Genesis wholly before Abram's call", () => {
    const abram = byId.get("abram-called")!;
    for (const event of events) {
      expect(event.lo === 0 || event.hi === 0, event.id).toBe(false);
      if (event.lo !== null && event.hi !== null) expect(event.lo, event.id).toBeLessThan(event.hi);
      if (!event.shown) expect(event.hi!, event.id).toBeLessThan(abram.lo!);
    }
  });

  it("has facts that agree with the windows and with the order", () => {
    for (const fact of data.facts) {
      const [a, b] = [byId.get(fact.first)!, byId.get(fact.second)!];
      if (a.lo !== null && b.hi !== null) expect(a.lo, `${a.id} > ${b.id}`).toBeLessThanOrEqual(b.hi);
      expect(a.rank, `${a.id} > ${b.id}`).toBeLessThan(b.rank);
      expect(fact.why.trim()).not.toBe("");
    }
  });

  it("has an order with no loop: every certain pair runs the way the ranks do", () => {
    for (const a of events) for (const b of events) {
      if (a.hi !== null && b.lo !== null && a.hi < b.lo && (a.shown || b.shown)) expect(a.rank, `${a.id} before ${b.id}`).toBeLessThan(b.rank);
    }
  });

  it("never orders a contested pair", () => {
    expect(data.contested.length).toBeGreaterThan(0);
    for (const [a, b] of data.contested) {
      expect(explain(index, byId.get(a)!, byId.get(b)!)).toBeNull();
      expect(explain(index, byId.get(b)!, byId.get(a)!)).toBeNull();
    }
  });

  it("stores valid short BSB references, with no embedded verse wording", () => {
    const books = new Map<string, Record<string, string>>();
    for (const event of events) {
      expect(event, event.id).not.toHaveProperty("quote");
      const [from, to] = event.refs[0];
      expect(Math.floor(from / 1000), event.id).toBe(Math.floor(to / 1000));
      expect(to - from, event.id).toBeLessThan(3);
      const [code] = data.books[String(Math.floor(from / 1_000_000))];
      if (!books.has(code)) books.set(code, JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../../../data/plain/bsb/${code}.json`), "utf8")));
      for (let id = from; id <= to; id++) {
        expect(books.get(code)![`${Math.floor(id / 1000) % 1000}:${id % 1000}`]?.trim(), event.id).toBeTruthy();
      }
    }
  });

  it("matches the stamp of its source files", () => {
    const folder = path.resolve(__dirname, "../../../data/timeline");
    const text = SOURCES.map((name) => fs.readFileSync(path.join(folder, name), "utf8"));
    expect(data.stamp).toBe(crypto.createHash("sha256").update(text.join("\u0000")).digest("hex").slice(0, 12));
  });

  it("can deal plenty of different rounds at every level and era", () => {
    for (const level of LEVEL_KEYS) {
      for (const era of ["all", ...ERA_KEYS] as EraChoice[]) {
        const random = mulberry32(11);
        const seen = new Set<string>();
        for (let i = 0; i < 400 && seen.size < 100; i++) seen.add([...deal(index, level, era, random)!.dealt].sort().join("|"));
        expect(seen.size, `${level} / ${era}`).toBeGreaterThanOrEqual(100);
      }
    }
  }, 60_000);
});

// ---- The independent second check (§13): written without order.ts's link or explain ----
const factPairs = new Set(data.facts.map((fact) => `${fact.first}>${fact.second}`));
const contested = new Set(data.contested.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
function directlyBefore(a: TimelineEvent, b: TimelineEvent): boolean {
  if (contested.has(`${a.id}|${b.id}`)) return false;
  if (factPairs.has(`${a.id}>${b.id}`)) return true;
  if (!a.shown && !b.shown) return false;
  return a.hi !== null && b.lo !== null && a.hi < b.lo;
}
const dealable = events.filter((event) => !event.retired);
const chained = (a: TimelineEvent, b: TimelineEvent) => directlyBefore(a, b) || dealable.some((m) => m.id !== a.id && m.id !== b.id && directlyBefore(a, m) && directlyBefore(m, b));

describe("an independent check of 2,000 dealt rounds", () => {
  it("joins every card to the next by at most two direct links, and never deals a contested pair", () => {
    const random = mulberry32(2026);
    for (let round = 0; round < 2000; round++) {
      const level = LEVEL_KEYS[round % 3];
      const era = round % 4 === 0 ? ERA_KEYS[(round / 4) % ERA_KEYS.length] : "all";
      const ids = trueOrder(index, deal(index, level, era, random)!.dealt);
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) expect(contested.has(`${ids[i]}|${ids[j]}`)).toBe(false);
      for (let i = 1; i < ids.length; i++) expect(chained(byId.get(ids[i - 1])!, byId.get(ids[i])!), `${ids[i - 1]} -> ${ids[i]}`).toBe(true);
    }
  }, 120_000);
});
