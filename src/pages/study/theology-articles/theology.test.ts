// What this section promises a reader, checked mechanically: the Berean wording is the Berean
// wording, every quotation names a source we hold, nothing still in copyright is reproduced, every
// analogy carries the disclaimer its author wrote, and every link lands on a route this app declares.
import { existsSync, readFileSync } from "node:fs";
import { parseHighlight } from "@/lib/refs";
import { ARTICLES, SECTION_BASE, SOURCES, articleHref, findArticle, findSource, readerHref, sectionFigures, type Body } from "./model";

const sections = ARTICLES.flatMap((article) => article.sections);
const blocks = sections.flatMap((section) => section.body);
const quoted = blocks.filter((block): block is Extract<Body, { kind: "quote" }> => block.kind === "quote");
const summarised = blocks.filter((block): block is Extract<Body, { kind: "summary" }> => block.kind === "summary");
const scriptures = blocks.filter((block): block is Extract<Body, { kind: "scripture" }> => block.kind === "scripture");

const part = (id: string) => {
  const found = sections.find((section) => section.id === id);
  if (!found) throw new Error(`theology: no part "${id}" in the articles — this test needs updating`);
  return found;
};

// Every route this app declares, so a link in an article can be checked against the real router
// rather than against a guess about the shape of an address.
const ROUTES = [...readFileSync("src/App.tsx", "utf8").matchAll(/path="([^"]+)"/g)].map((match) => match[1]);
function isDeclaredRoute(href: string): boolean {
  const parts = href.split(/[?#]/)[0].split("/").filter(Boolean);
  return ROUTES.some((route) => {
    const expected = route.split("/").filter(Boolean);
    if (expected.at(-1) === "*") return expected.slice(0, -1).every((segment, i) => segment === parts[i]);
    if (expected.length !== parts.length) return false;
    return expected.every((segment, i) => segment.startsWith(":") || segment === parts[i]);
  });
}

describe("the section's addresses", () => {
  it("routes its own landing and every article", () => {
    expect(isDeclaredRoute(SECTION_BASE)).toBe(true);
    for (const article of ARTICLES) expect(isDeclaredRoute(articleHref(article.id)), article.id).toBe(true);
  });

  it("gives every article a distinct, address-safe id", () => {
    expect(new Set(ARTICLES.map((a) => a.id)).size).toBe(ARTICLES.length);
    for (const article of ARTICLES) expect(article.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("finds an article by its id, and nothing by a name borrowed from Object", () => {
    for (const article of ARTICLES) expect(findArticle(article.id)).toBe(article);
    for (const id of ["constructor", "__proto__", "toString", "valueOf", ""]) expect(findArticle(id), id).toBeUndefined();
  });

  it("gives every part of an article a distinct id to be linked at", () => {
    for (const article of ARTICLES) {
      const ids = article.sections.map((section) => section.id);
      expect(new Set(ids).size, article.id).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("points every “read next” link at a declared route, once", () => {
    for (const article of ARTICLES) {
      const targets = article.related.map((item) => item.to);
      expect(new Set(targets).size, article.id).toBe(targets.length);
      for (const item of article.related) {
        expect(isDeclaredRoute(item.to), item.to).toBe(true);
        expect(item.label.length, item.to).toBeGreaterThan(0);
        expect(item.note.length, item.to).toBeGreaterThan(0);
      }
    }
  });
});

describe("the sources", () => {
  it("records an edition, a licence and an address for each one, once", () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
    for (const source of SOURCES) {
      expect(source.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      for (const field of [source.work, source.author, source.edition, source.licence]) expect(field.trim().length, source.id).toBeGreaterThan(0);
      expect(source.url, source.id).toMatch(/^https:\/\//);
      if (source.onSite) expect(isDeclaredRoute(source.onSite), source.onSite).toBe(true);
    }
  });

  it("resolves every source an article lists, and lists every source it uses", () => {
    for (const article of ARTICLES) {
      expect(new Set(article.sourceIds).size, article.id).toBe(article.sourceIds.length);
      for (const id of article.sourceIds) expect(findSource(id), id).toBeDefined();
      const used = new Set(article.sections.flatMap((section) => section.body).flatMap((block) =>
        block.kind === "quote" || block.kind === "summary" ? [block.source] : block.kind === "scripture" ? ["bsb"] : []));
      for (const id of used) expect(article.sourceIds, `${article.id} uses ${id}`).toContain(id);
      for (const id of article.sourceIds) expect([...used], `${article.id} lists ${id}`).toContain(id);
    }
  });

  it("gives every quotation and summary a source and a place to find it", () => {
    for (const block of [...quoted, ...summarised]) {
      expect(findSource(block.source), block.source).toBeDefined();
      expect(block.locator.trim().length, block.source).toBeGreaterThan(0);
      expect(block.text.trim().length, block.source).toBeGreaterThan(0);
    }
  });

  // The site reproduces public-domain text only. A work still in copyright is described in our own
  // words through a `summary` block and never quoted, so this is the rule that has to hold.
  it("never quotes a work it may not reproduce", () => {
    for (const block of quoted) expect(findSource(block.source)?.checked, block.source).not.toBe("none");
    for (const source of SOURCES.filter((s) => s.checked === "none")) {
      expect(quoted.some((block) => block.source === source.id), source.id).toBe(false);
      expect(summarised.some((block) => block.source === source.id), source.id).toBe(true);
    }
  });
});

describe("the Scripture quotations", () => {
  it("names consecutive verses of one chapter and links to them", () => {
    for (const block of scriptures) {
      expect(block.book, block.reference).toMatch(/^[A-Z0-9]{3}$/);
      expect(block.chapter, block.reference).toBeGreaterThan(0);
      expect(block.verses.length, block.reference).toBeGreaterThan(0);
      block.verses.forEach((verse, i) => { if (i > 0) expect(verse, block.reference).toBe(block.verses[i - 1] + 1); });
      const href = readerHref(block.book, block.chapter, block.verses);
      expect(href).toBe(`/read/bsb/${block.book}/${block.chapter}?hl=${block.verses[0]}${block.verses.length > 1 ? `-${block.verses.at(-1)}` : ""}`);
      expect(isDeclaredRoute(href), href).toBe(true);
      expect(parseHighlight(new URL(href, "http://localhost").searchParams.get("hl")), href)
        .toEqual([block.verses[0], block.verses.at(-1)]);
      expect(block.reference.trim().length, block.book).toBeGreaterThan(0);
    }
  });

  // The owner's brief: modern English, not the King James. A quotation that drifted back to an older
  // version would also fail the wording check below, but only where the Bible data has been built.
  it("uses no archaic forms", () => {
    for (const block of scriptures) expect(block.text, block.reference).not.toMatch(/\b(thou|thee|thy|thine|ye|unto|saith|hath|doth|shalt|cometh|believeth)\b/i);
  });
});

// The Bible text is built by `npm run data` into the git-ignored data/ folder, like all this site's
// data, so the wording check is skipped where it is absent (the same gate as hymns.test.ts).
const bsbBuilt = existsSync("data/plain/bsb/JHN.json");
describe.runIf(bsbBuilt)("the Berean wording", () => {
  const chapter = (book: string) => JSON.parse(readFileSync(`data/plain/bsb/${book}.json`, "utf8")) as Record<string, string>;
  it("matches this site's own copy of the Berean Standard Bible, verse for verse", () => {
    for (const block of scriptures) {
      const verses = chapter(block.book);
      const expected = block.verses.map((verse) => {
        const text = verses[`${block.chapter}:${verse}`];
        expect(text, `${block.book} ${block.chapter}:${verse} is not in the Berean data`).toBeDefined();
        return text;
      }).join(" ");
      expect(block.text, block.reference).toBe(expected);
    }
  });
});

describe("the disclaimers", () => {
  it("marks where each popular picture breaks", () => {
    const titles = part("why-analogies-fail").body.filter((block) => block.kind === "caution").map((block) => block.title);
    expect(titles.some((title) => /water picture/i.test(title))).toBe(true);
    expect(titles.some((title) => /three-roles picture/i.test(title))).toBe(true);
  });

  // The owner's brief: every theologian's analogy carries its own disclaimer. So each of these
  // cautions must exist, and must come after a quotation or summary from that same theologian.
  it.each([
    ["augustine-trinity", /Augustine’s own disclaimer/],
    ["aquinas-summa", /Aquinas’s own disclaimer/],
    ["nyssa-ablabius", /Gregory of Nyssa’s own disclaimer/],
    ["nazianzus-oration-31", /Gregory of Nazianzus’s own disclaimer/],
    ["lewis-mere-christianity", /Lewis’s own disclaimer/],
  ])("keeps the analogy from %s beside the limit its author set", (sourceId, title) => {
    const body = part("the-theologians").body;
    const caution = body.findIndex((block) => block.kind === "caution" && title.test(block.title));
    expect(caution, String(title)).toBeGreaterThan(-1);
    const cited = body.findIndex((block) => (block.kind === "quote" || block.kind === "summary") && block.source === sourceId);
    expect(cited, sourceId).toBeGreaterThan(-1);
    expect(cited, `${sourceId} is cited before its disclaimer`).toBeLessThan(caution);
  });

  it("gives every caution a title and a body", () => {
    const cautions = blocks.filter((block) => block.kind === "caution");
    expect(cautions.length).toBeGreaterThanOrEqual(7);
    for (const block of cautions) {
      expect(block.title.trim().length).toBeGreaterThan(0);
      expect(block.text.trim().length).toBeGreaterThan(20);
    }
  });
});

describe("the prose itself", () => {
  it("leaves nothing blank", () => {
    for (const section of sections) {
      for (const field of [section.id, section.kicker, section.title, section.lede]) expect(field.trim().length, section.id).toBeGreaterThan(0);
      expect(section.body.length, section.id).toBeGreaterThan(0);
    }
    for (const block of blocks) {
      if (block.kind === "list") {
        expect(block.label.trim().length).toBeGreaterThan(0);
        expect(block.items.length).toBeGreaterThan(1);
        for (const item of block.items) {
          expect(item.term.trim().length, block.label).toBeGreaterThan(0);
          expect(item.text.trim().length, item.term).toBeGreaterThan(0);
        }
      } else if (block.kind !== "caution") {
        expect(block.text.trim().length, block.kind).toBeGreaterThan(0);
      }
    }
  });

  it("gives each article front matter a reader can act on", () => {
    for (const article of ARTICLES) {
      for (const field of [article.title, article.kicker, article.question, article.summary]) expect(field.trim().length, article.id).toBeGreaterThan(0);
      expect(article.question, article.id).toMatch(/\?$/);
      expect(article.sections.length, article.id).toBeGreaterThan(0);
      expect(article.related.length, article.id).toBeGreaterThan(0);
    }
  });

  // The reading time is written by hand in the article, so it has to be checked against the words
  // actually there — between a slow 160 and a fast 300 words a minute.
  it("states a reading time the article's own length supports", () => {
    for (const article of ARTICLES) {
      const words = article.sections.flatMap((section) => [section.lede, ...section.body.flatMap((block) =>
        block.kind === "list" ? block.items.flatMap((item) => [item.term, item.text]) : block.kind === "caution" ? [block.title, block.text] : [block.text])])
        .join(" ").split(/\s+/).filter(Boolean).length;
      expect(article.minutes, `${article.id}: ${words} words`).toBeGreaterThanOrEqual(Math.floor(words / 300));
      expect(article.minutes, `${article.id}: ${words} words`).toBeLessThanOrEqual(Math.ceil(words / 160));
    }
  });
});

describe("the landing's figures", () => {
  it("counts what is actually in the section", () => {
    const figures = sectionFigures(ARTICLES);
    expect(figures.articles).toBe(ARTICLES.length);
    expect(figures.parts).toBe(sections.length);
    expect(figures.scripture).toBe(scriptures.length);
    expect(figures.sources).toBe(new Set(ARTICLES.flatMap((article) => article.sourceIds)).size);
    expect(figures.minutes).toBe(ARTICLES.reduce((total, article) => total + article.minutes, 0));
  });
});
