// The built baby-name data (data/baby-names/, scripts/bible/build_baby_names.py) against the rules visitors depend on
// (design 7.2): one slug rule shared by the build and the site, every link landing on a real page, meanings that never
// say "Jehovah" or come uncited from a hand override, and the cases the design works through by name.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { babyNamePaths, LIST_PAGES, nameLinkFor, nameSlug, RESERVED_SLUGS, type NameDocument, type NamesIndex } from "@/data/baby-names";

const readJson = <T,>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;
const index = readJson<NamesIndex>("data/baby-names/index.json");
const slugs = new Set(index.names.map((row) => row.s));
const nameFile = (slug: string) => readJson<NameDocument>(`data/baby-names/names/${slug}.json`);

describe("baby names: the slug rule", () => {
  it("lower-cases, keeps hyphens and drops accents and other characters", () => {
    expect(nameSlug("Hannah")).toBe("hannah");
    expect(nameSlug("Maher-shalal-hash-baz")).toBe("maher-shalal-hash-baz");
    expect(nameSlug("Mary Magdalene")).toBe("mary-magdalene");
    expect(nameSlug("Jesús")).toBe("jesus");
    expect(nameSlug("  Abed--nego ")).toBe("abed-nego");
  });

  it("is the rule the Python build used for every name in the index", () => {
    const disagree = index.names.filter((row) => nameSlug(row.n) !== row.s).map((row) => `${row.n} -> ${row.s}`);
    expect(disagree).toEqual([]);
  });

  it("gives every name its own slug, none of them a reserved word", () => {
    expect(slugs.size).toBe(index.names.length);
    expect(index.names.filter((row) => RESERVED_SLUGS.has(row.s))).toEqual([]);
  });

  it("has a page file for every name in the index", () => {
    expect(index.names.filter((row) => !existsSync(`data/baby-names/names/${row.s}.json`)).map((row) => row.s)).toEqual([]);
  });

  it("sends every other spelling to a page that exists, and never shadows a real page", () => {
    const broken = Object.entries(index.aliases).filter(([alias, [target]]) => !slugs.has(target) || slugs.has(alias));
    expect(broken).toEqual([]);
    expect(index.aliases.elias?.[0]).toBe("elijah");
  });
});

describe("baby names: the sitemap inventory", () => {
  it("lists the three list pages and exactly the full name pages", () => {
    const paths = babyNamePaths(index.names);
    const full = index.names.filter((row) => row.f === 1);
    expect(paths.slice(0, 3)).toEqual([...LIST_PAGES]);
    expect(paths.slice(3)).toEqual(full.map((row) => `/baby-names/${row.s}`));
    expect(new Set(paths).size).toBe(paths.length);
    expect(full.length).toBeGreaterThan(400);
    expect(babyNamePaths([{ s: "a", f: 1 }, { s: "b", f: 0 }])).toEqual([...LIST_PAGES, "/baby-names/a"]);
  });
});

describe("baby names: links from person pages", () => {
  const people = readJson<{ id: string; n: string }[]>("data/study/people.json");

  it("links every person either nowhere or to a name page that exists", () => {
    const broken = people.flatMap((person) => {
      const link = nameLinkFor(person);
      return link && !slugs.has(link.path.slice("/baby-names/".length)) ? [`${person.id} -> ${link.path}`] : [];
    });
    expect(broken).toEqual([]);
  });

  it("links the people the design names to the right pages", () => {
    const linkOf = (id: string) => nameLinkFor(people.find((person) => person.id === id)!);
    expect(linkOf("hannah-1sa-1-2")).toEqual({ path: "/baby-names/hannah", name: "Hannah" });
    expect(linkOf("aaron-exo-4-14")?.path).toBe("/baby-names/aaron");
    const magdalene = people.find((person) => person.n === "Mary Magdalene");
    if (magdalene) expect(nameLinkFor(magdalene)?.path).toBe("/baby-names/mary");
  });
});

describe("baby names: meanings", () => {
  it("preserves Reuben's combined meaning and wordplay note in the built page", () => {
    const meaning = nameFile("reuben").originals[0].meaning;
    expect(meaning.bibleNote?.verse).toBe(1029032);
    expect(meaning.wordplay?.verse).toBe(1029032);
    expect(meaning.wordplay?.text).toMatch(/also sounds like/);
  });

  it("files beloved names under love rather than joy", () => {
    expect(index.names.find((row) => row.s === "david")?.th).toEqual(["love"]);
  });

  it("never says 'Jehovah' in a headline or the opening paragraph", () => {
    expect(index.names.filter((row) => /jehovah/i.test(row.m)).map((row) => row.n)).toEqual([]);
    for (const slug of ["elijah", "joshua", "jesus", "john", "zechariah"]) expect(nameFile(slug).opening).not.toMatch(/jehovah/i);
  });

  it("cites a source for every hand-checked meaning", () => {
    const { overrides } = readJson<{ overrides: Record<string, { headline: string; cite?: string }> }>("scripts/bible/baby-names/meaning-overrides.json");
    const uncited = Object.entries(overrides).filter(([, entry]) => !entry.cite?.trim()).map(([name]) => name);
    expect(uncited).toEqual([]);
    expect(Object.keys(overrides).length).toBeGreaterThan(10);
  });

  it("never takes a headline from Hitchcock's 1869 dictionary", () => {
    const hannah = nameFile("hannah").originals[0];
    expect(hannah.meaning.headline).toBe("favored");
    expect(hannah.meaning.source).not.toBe("hitchcock");
    for (const row of index.names.slice(0, 200)) {
      for (const original of nameFile(row.s).originals) expect(["override", "bible", "strongs", "none"]).toContain(original.meaning.source);
    }
  });

  it("gives Noah two meaning blocks, one for each original word", () => {
    const noah = nameFile("noah");
    expect(noah.originals).toHaveLength(2);
    expect(noah.gender).toBe("both");
    expect(noah.bearers).toHaveLength(2);
  });

  it("shows Mary's meaning as uncertain", () => {
    const mary = nameFile("mary");
    expect(mary.originals[0].meaning.label).toBe("uncertain");
    expect(mary.bearers.length).toBe(6);
  });

  it("gives an uncertain meaning no themes", () => {
    for (const row of index.names) {
      if (row.m === "Meaning uncertain") {
        expect(row.l, row.n).toBe("uncertain");
        expect(row.th, row.n).toEqual([]);
      }
    }
  });

  it("shows the hand-checked meanings the design works through, with their sources", () => {
    const esther = nameFile("esther").originals[0].meaning;
    expect([esther.headline, esther.label, esther.source]).toEqual(["star", "probable", "override"]);
    expect(esther.cite).toMatch(/Easton's Bible Dictionary \(1897\)/);
    for (const [slug, headline] of [["deborah", "bee"], ["jonah", "dove"], ["tamar", "palm tree"]]) {
      const row = index.names.find((item) => item.s === slug)!;
      expect([row.m, row.th], slug).toEqual([headline, ["nature"]]);
    }
    expect(nameFile("matthew").originals[0].meaning.headline).toBe("gift of the LORD");
  });

  it("keeps every headline short and well formed", () => {
    const broken = index.names.filter((row) => row.m.length > 40 || row.m.split("(").length !== row.m.split(")").length
      || /from |same as| , /.test(row.m));
    expect(broken.map((row) => `${row.n}: ${row.m}`)).toEqual([]);
  });
});

describe("baby names: who gets a page", () => {
  it("counts Jesus as a New Testament name", () => {
    expect(index.names.find((row) => row.s === "jesus")?.t).toBe("nt");
    expect(nameFile("jesus").testament).toBe("nt");
  });

  it("gives no excluded name a page", () => {
    const { names } = readJson<{ names: { name: string }[] }>("scripts/bible/baby-names/excluded.json");
    expect(names.filter((entry) => slugs.has(nameSlug(entry.name))).map((entry) => entry.name)).toEqual([]);
    expect(slugs.has("christ")).toBe(false);
    expect(slugs.has("jew")).toBe(false);
    expect(slugs.has("zealot")).toBe(false);
  });

  it("gives the three people missing from the names index their own bearers", () => {
    expect(nameFile("sargon").bearers.map((bearer) => bearer.id)).toEqual(["sargon-isa-20-1"]);
    expect(nameFile("candace").bearers.map((bearer) => bearer.id)).toEqual(["candace-act-8-27"]);
    expect(nameFile("xerxes").bearers.map((bearer) => bearer.id).sort()).toEqual(["ahasuerus-dan-9-1", "ahasuerus-ezr-4-6"]);
    expect(slugs.has("tartan") || slugs.has("rabshakeh")).toBe(false);
  });

  it("quotes at least one verse on every full page", () => {
    const empty = index.names.filter((row) => row.f === 1 && !nameFile(row.s).verses.length).map((row) => row.s);
    expect(empty).toEqual([]);
  });

  it("marks the full pages in each name file the same as in the index", () => {
    for (const slug of ["hannah", "abagtha", "david", "mary"]) {
      const row = index.names.find((item) => item.s === slug)!;
      expect(nameFile(slug).full, slug).toBe(row.f === 1);
    }
  });
});
