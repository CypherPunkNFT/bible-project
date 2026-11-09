// The browse list's filters, search and sort (design 5.2), on a small hand-made list so each rule is visible.
import { describe, expect, it } from "vitest";
import type { NameRow } from "@/data/baby-names";
import { applyFilters, defaultFilters, hasPopularity, lettersWithNames, matchesQuery, readFilters, writeFilters, type Filters } from "./name-filter";

const row = (s: string, n: string, extra: Partial<NameRow> = {}): NameRow =>
  ({ s, n, g: "boy", t: "ot", m: "meaning", l: "probable", th: [], w: "someone", c: 1, f: 1, a: [], ...extra });

const ROWS: NameRow[] = [
  row("eli", "Eli", { c: 33 }),
  row("eliab", "Eliab", { c: 20, f: 0 }),
  row("elijah", "Elijah", { c: 100, a: ["Elias"], t: "both", th: ["god"], rb: 40 }),
  row("elizabeth", "Elizabeth", { g: "girl", t: "nt", c: 10, rg: 15 }),
  row("noah", "Noah", { g: "both", c: 51, th: ["peace"], rb: 2, rg: 900 }),
  row("mary", "Mary", { g: "girl", t: "nt", c: 46, l: "uncertain", m: "Meaning uncertain" }),
  row("ozem", "Ozem", { g: "unknown", c: 2, f: 0 }),
  row("eden", "Éden", { g: "girl", c: 3 }),
];
const names = (filters: Filters) => applyFilters(ROWS, filters).map((item) => item.s);
const hub = (changes: Partial<Filters> = {}) => ({ ...defaultFilters("all", true), ...changes });

describe("baby names list: where each page starts", () => {
  it("sorts the hub A to Z and the boy and girl pages by popularity, or by mentions without popularity data", () => {
    expect(defaultFilters("all", true)).toMatchObject({ gender: "all", sort: "az", showAll: false });
    expect(defaultFilters("boy", true)).toMatchObject({ gender: "boy", sort: "popular" });
    expect(defaultFilters("girl", false)).toMatchObject({ gender: "girl", sort: "mentions" });
  });
});

describe("baby names list: filters", () => {
  it("shows only the well-known (full-page) names until 'all names' is chosen", () => {
    expect(names(hub())).toEqual(["eden", "eli", "elijah", "elizabeth", "mary", "noah"]);
    expect(names(hub({ showAll: true }))).toContain("eliab");
    expect(names(hub({ showAll: true }))).toContain("ozem");
  });

  it("counts a name borne by men and women under Boy, Girl and Both, and an unstated one only under All", () => {
    expect(names(hub({ gender: "boy", showAll: true }))).toEqual(["eli", "eliab", "elijah", "noah"]);
    expect(names(hub({ gender: "girl" }))).toEqual(["eden", "elizabeth", "mary", "noah"]);
    expect(names(hub({ gender: "both" }))).toEqual(["noah"]);
    expect(names(hub({ gender: "boy", showAll: true }))).not.toContain("ozem");
  });

  it("puts a name from both Testaments under either Testament", () => {
    expect(names(hub({ testament: "nt" }))).toEqual(["elijah", "elizabeth", "mary"]);
    expect(names(hub({ testament: "ot" }))).toEqual(["eden", "eli", "elijah", "noah"]);
  });

  it("filters by first letter, ignoring accents, and by meaning theme", () => {
    expect(names(hub({ letter: "e" }))).toEqual(["eden", "eli", "elijah", "elizabeth"]);
    expect(names(hub({ theme: "peace" }))).toEqual(["noah"]);
  });

  it("combines filters", () => {
    expect(names(hub({ gender: "girl", testament: "nt", letter: "m" }))).toEqual(["mary"]);
    expect(names(hub({ gender: "boy", testament: "nt", letter: "m" }))).toEqual([]);
  });

  it("disables letters with no names under the other filters", () => {
    expect([...lettersWithNames(ROWS, hub({ gender: "girl" }))].sort()).toEqual(["e", "m", "n"]);
    expect(lettersWithNames(ROWS, hub({ gender: "girl", letter: "e" })).has("m")).toBe(true);
  });
});

describe("baby names list: search", () => {
  it("matches the start of the name or of another spelling, without case or accents", () => {
    expect(names(hub({ query: "eli" }))).toEqual(["eli", "eliab", "elijah", "elizabeth"]);
    expect(names(hub({ query: "ELIAS" }))).toEqual(["elijah"]);
    expect(names(hub({ query: "ede" }))).toEqual(["eden"]);
    expect(matchesQuery(ROWS[0], "li")).toBe(false);
  });

  it("looks through every name, short pages too, while searching", () => {
    expect(names(hub({ query: "oz" }))).toEqual(["ozem"]);
  });
});

describe("baby names list: sort", () => {
  it("sorts by the Bible's mentions, then A to Z", () => {
    expect(names(hub({ sort: "mentions" }))).toEqual(["elijah", "noah", "mary", "eli", "elizabeth", "eden"]);
  });

  it("sorts by US popularity for the chosen gender, unranked names last", () => {
    expect(names(hub({ sort: "popular", gender: "boy" }))).toEqual(["noah", "elijah", "eli"]);
    expect(names(hub({ sort: "popular", gender: "girl" }))).toEqual(["elizabeth", "noah", "eden", "mary"]);
    expect(names(hub({ sort: "popular" })).slice(0, 3)).toEqual(["noah", "elizabeth", "elijah"]);
  });

  it("knows whether any popularity data is present", () => {
    expect(hasPopularity(ROWS)).toBe(true);
    expect(hasPopularity(ROWS.map((item) => ({ ...item, rb: undefined, rg: undefined })))).toBe(false);
  });
});

describe("baby names list: the address", () => {
  const themes = ["god", "peace", "light"];

  it("reads filters from the address and ignores values it does not know", () => {
    const filters = readFilters(new URLSearchParams("g=girl&t=nt&l=M&m=light&show=all&sort=mentions&q=eli"), "all", true, themes);
    expect(filters).toEqual({ gender: "girl", testament: "nt", letter: "m", theme: "light", showAll: true, sort: "mentions", query: "eli" });
    const junk = readFilters(new URLSearchParams("g=cat&t=x&l=ab&m=zzz&show=1&sort=best"), "boy", true, themes);
    expect(junk).toEqual(defaultFilters("boy", true));
  });

  it("falls back from Popular when there is no popularity data", () => {
    expect(readFilters(new URLSearchParams("sort=popular"), "girl", false, themes).sort).toBe("mentions");
  });

  it("writes only what differs from the page's starting point, and reads back the same", () => {
    expect(writeFilters(defaultFilters("boy", true), "boy", true).toString()).toBe("");
    const filters: Filters = { ...defaultFilters("all", true), gender: "girl", testament: "nt", letter: "m", theme: "light", sort: "popular", query: "mar" };
    const params = writeFilters(filters, "all", true);
    expect(params.toString()).toBe("g=girl&t=nt&l=m&m=light&sort=popular&q=mar");
    expect(readFilters(params, "all", true, themes)).toEqual(filters);
  });

  it("keeps a space typed between words in the search", () => {
    expect(writeFilters(hub({ query: "maher " }), "all", true).get("q")).toBe("maher ");
    expect(writeFilters(hub({ query: "   " }), "all", true).has("q")).toBe(false);
  });
});
