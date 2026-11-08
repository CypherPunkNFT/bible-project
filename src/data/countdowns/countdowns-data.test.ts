// The occasions as data (design 6.5, 7.7, 8.3 "Data", "Sitemap inventory"): permanent keys, links to real topics and
// hymns, introductions within their limits, and the addresses for the sitemap.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COUNTDOWNS_INTRO, countdownPaths, HYMN_TITLES, KEPT_KEYS, KEY_ALIASES, OCCASIONS } from ".";

const topics = (JSON.parse(readFileSync("data/topics/index.json", "utf8")) as { topics: Record<string, { title: string }> }).topics;
const hymnIds = new Set((JSON.parse(readFileSync("data/hymns/collection.json", "utf8")) as { hymns: { id: string }[] }).hymns.map((hymn) => hymn.id));
const words = (text: string) => text.trim().split(/\s+/).length;
const own = OCCASIONS.filter((occasion) => Array.isArray(occasion.days));

describe("countdowns: the occasions", () => {
  it("launches Advent, Lent and Holy Week in that order, Holy Week borrowing Lent's days", () => {
    expect(OCCASIONS.map((occasion) => occasion.slug)).toEqual(["advent", "lent", "holy-week"]);
    expect(OCCASIONS[2].days).toEqual({ borrow: "lent", fromKey: "sunday-6" });
  });

  it("gives every day a unique, URL-safe key that is in the kept list", () => {
    for (const occasion of own) {
      const keys = (occasion.days as { key: string }[]).map((day) => day.key);
      expect(new Set(keys).size, occasion.slug).toBe(keys.length);
      for (const key of keys) expect(key, occasion.slug).toMatch(/^[a-z0-9-]{1,20}$/);
      expect([...keys].sort(), occasion.slug).toEqual([...(KEPT_KEYS[occasion.slug] ?? [])].sort());
    }
  });

  it("still resolves every kept key, directly or through an alias", () => {
    for (const [slug, kept] of Object.entries(KEPT_KEYS)) {
      const occasion = OCCASIONS.find((item) => item.slug === slug)!;
      const keys = new Set((occasion.days as { key: string }[]).map((day) => day.key));
      for (const key of kept) expect(keys.has(key) || keys.has(KEY_ALIASES[slug]?.[key] ?? ""), `${slug}/${key}`).toBe(true);
    }
  });

  it("links only real topic pages and hymns, each hymn with a title", () => {
    for (const occasion of OCCASIONS) {
      for (const topic of occasion.topics) expect(topics[topic.slug]?.title, `${occasion.slug} ${topic.slug}`).toBe(topic.title);
      for (const id of occasion.hymns ?? []) expect(HYMN_TITLES[id], id).toBeTruthy();
      for (const panel of occasion.panels ?? []) if (panel.hymn) expect(HYMN_TITLES[panel.hymn], panel.hymn).toBeTruthy();
      if (Array.isArray(occasion.days)) for (const day of occasion.days) if (day.hymn) expect(HYMN_TITLES[day.hymn], `${day.key} ${day.hymn}`).toBeTruthy();
    }
    for (const id of Object.keys(HYMN_TITLES)) expect(hymnIds.has(id), id).toBe(true);
  });

  it("keeps every introduction to 60–160 words, with no year and no exclamation mark", () => {
    for (const intro of [COUNTDOWNS_INTRO, ...OCCASIONS.map((occasion) => occasion.intro)]) {
      expect(words(intro)).toBeGreaterThanOrEqual(60);
      expect(words(intro)).toBeLessThanOrEqual(160);
      expect(/\b(19|20|21)\d\d\b/.test(intro), intro).toBe(false);
      expect(intro.includes("!")).toBe(false);
    }
    for (const occasion of OCCASIONS) expect(/\b(19|20|21)\d\d\b/.test(occasion.heading), occasion.heading).toBe(false);
  });

  it("lists 80 addresses for the sitemap, none with a ?date=", () => {
    const paths = countdownPaths();
    expect(paths).toHaveLength(80);
    expect(new Set(paths).size).toBe(80);
    expect(paths.some((path) => path.includes("?"))).toBe(false);
    expect(paths).toContain("/countdowns/holy-week");
    expect(paths.some((path) => path.startsWith("/countdowns/holy-week/"))).toBe(false);
    expect(paths).toContain("/countdowns/lent/easter");
  });
});
