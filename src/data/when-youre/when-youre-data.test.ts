// The "when you're..." pages against the site's own Berean files, topic index, people pages and help directory
// (design 9.4: passage data, words, links, help and the sitemap inventory).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assemblePassage, CARD_MAX, DISPLAY_MAX, partLetter, passageReference, passageVerseIds } from "@/pages/life-events/passage";
import { occasionPrayerPaths } from "../occasion-prayers";
import { passageKey, sympathyPaths } from "../sympathy";
import { CONTEXT } from "./context";
import { COUNSELLING, URGENT_HELP } from "./help";
import { GROUPS, HUB_ORDER, redirectFor, RETIRED, topicBySlug, WHEN_TOPICS, WHEN_YOURE_PATH, whenYourePaths, type WhenTopic } from ".";

interface CatalogBook { num: number; code: string; name: string }
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as { books: CatalogBook[] };
const books = new Map(catalog.books.map((book) => [book.num, book]));
const siteTopics = (JSON.parse(readFileSync("data/topics/index.json", "utf8")) as { topics: Record<string, { title: string; refs: number }> }).topics;
const life = JSON.parse(readFileSync("src/data/resources/life.json", "utf8")) as { groups: { entries: { id: string; contact: { value: string }[] }[] }[] };
const helpIds = new Set(life.groups.flatMap((group) => group.entries.map((entry) => entry.id)));

const held = new Map<string, Record<string, string>>();
/** A verse's Berean words as the site shows them, or null. */
function berean(id: number): string | null {
  const code = books.get(Math.floor(id / 1_000_000))!.code;
  if (!held.has(code)) held.set(code, JSON.parse(readFileSync(`data/plain/bsb/${code}.json`, "utf8")) as Record<string, string>);
  const text = held.get(code)![`${Math.floor(id / 1000) % 1000}:${id % 1000}`];
  return text === undefined ? null : text.replace(/^¶\s*/, "").replace(/\s+/g, " ").trim();
}
const bookName = (num: number) => books.get(num)!.name;
const all = WHEN_TOPICS.flatMap((topic) => topic.passages.map((passage) => ({ topic, passage, where: `${topic.slug} ${passageReference(passage, bookName)}` })));
const roleCount = (topic: WhenTopic, role: string) => topic.passages.filter((passage) => passage.role === role).length;
const bySlug = (slug: string) => topicBySlug(slug)!;

describe("when you're: the pages", () => {
  it("has the 33 planned pages in hub order: 18 in the heart, 5 in the body, 10 in life", () => {
    expect(WHEN_TOPICS.map((topic) => topic.slug)).toEqual(HUB_ORDER);
    expect(WHEN_TOPICS).toHaveLength(33);
    const counts = Object.fromEntries(GROUPS.map((group) => [group.id, WHEN_TOPICS.filter((topic) => topic.group === group.id).length]));
    expect(counts).toEqual({ heart: 18, body: 5, life: 10 });
  });

  it("lists the hub and the 33 topic addresses in the sitemap inventory, and nothing else", () => {
    const paths = whenYourePaths();
    expect(paths).toHaveLength(34);
    expect(new Set(paths).size).toBe(34);
    expect(paths[0]).toBe(WHEN_YOURE_PATH);
    for (const path of paths.slice(1)) expect(path).toMatch(/^\/when-youre\/[a-z]+(?:-[a-z]+)*$/);
  });

  it("redirects a retired page only to a real page it names, never through a cycle", () => {
    for (const [from, to] of Object.entries(RETIRED)) {
      expect(topicBySlug(from), `${from} is retired, so it must not also be a live page`).toBeUndefined();
      expect(redirectFor(from), `${from} -> ${to}`).toBeDefined();
    }
    expect(redirectFor("old-anxiety", { "old-anxiety": "anxious" })).toBe("anxious");
    expect(redirectFor("a", { a: "b", b: "anxious" })).toBe("anxious");
    expect(redirectFor("a", { a: "b", b: "a" })).toBeUndefined();
    expect(redirectFor("a", { a: "no-such-page" })).toBeUndefined();
    expect(redirectFor("anxious")).toBeUndefined();
  });
});

describe("when you're: the passages", () => {
  it("uses only verses the Berean has, in ranges that run forward inside one chapter", () => {
    expect(all).toHaveLength(346);
    for (const { passage, where } of all) {
      if (passage.to !== undefined) expect(passage.to, where).toBeGreaterThan(passage.from);
      for (const id of passageVerseIds(passage)) expect(berean(id), `${where} verse ${id}`).toBeTruthy();
    }
  });

  it("stores every excerpt exactly, on the last verse, marked a or b by where it sits", () => {
    const partial = all.filter(({ passage }) => passage.part);
    expect(partial.length).toBeGreaterThanOrEqual(7);
    for (const { passage, where } of partial) {
      expect(passage.part!.verse, where).toBe(passage.to ?? passage.from);
      const verse = berean(passage.part!.verse)!;
      expect(verse.includes(passage.part!.text), where).toBe(true);
      expect(partLetter(passage, verse), where).toBe(passage.part!.mark);
    }
  });

  it("assembles every passage with paired double quotation marks and a proper sentence end", () => {
    for (const { passage, where } of all) {
      const text = assemblePassage(passage, berean);
      expect(text.split("“").length, `${where}: ${text}`).toBe(text.split("”").length);
      expect(text.replace(/[”’"']+$/, ""), where).toMatch(/[.!?…]$/);
    }
  });

  it("gives every page 6–8 verses to hold, 1–3 to read and one to pray, within the length limits", () => {
    for (const topic of WHEN_TOPICS) {
      expect(roleCount(topic, "card"), topic.slug).toBeGreaterThanOrEqual(6);
      expect(roleCount(topic, "card"), topic.slug).toBeLessThanOrEqual(8);
      expect(roleCount(topic, "reading"), topic.slug).toBeGreaterThanOrEqual(1);
      expect(roleCount(topic, "reading"), topic.slug).toBeLessThanOrEqual(3);
      expect(roleCount(topic, "blessing"), topic.slug).toBe(1);
      expect(topic.passages[0].role, `${topic.slug}: the featured verse comes first`).toBe("card");
      expect(topic.passages[0].believer, `${topic.slug}: the featured verse carries no label`).toBeUndefined();
    }
    for (const { passage, where } of all) {
      const length = assemblePassage(passage, berean).length;
      if (passage.role === "card") expect(length, where).toBeLessThanOrEqual(CARD_MAX);
      if (passage.role === "blessing") expect(length, where).toBeLessThanOrEqual(DISPLAY_MAX);
      expect(passage.note.length, `${where}: one line`).toBeLessThanOrEqual(110);
    }
  });

  it("keeps pages distinct: no two share more than three verses to hold or read", () => {
    const keys = (topic: WhenTopic) => new Set(topic.passages.filter((passage) => passage.role !== "blessing").map(passageKey));
    for (const [index, first] of WHEN_TOPICS.entries()) {
      for (const second of WHEN_TOPICS.slice(index + 1)) {
        const shared = [...keys(first)].filter((key) => keys(second).has(key));
        expect(shared.length, `${first.slug} and ${second.slug} share ${shared.join(", ")}`).toBeLessThanOrEqual(3);
      }
    }
  });

  it("never holds out Romans 8:28, Jeremiah 29:11, Malachi 2:16 or Proverbs 22:6, and keeps 1 Corinthians 10:13 to temptation", () => {
    const forbidden = ["romans-8-28", "jeremiah-29-11", "proverbs-22-6"];
    for (const { passage, where } of all) {
      const key = passageKey(passage);
      if (passage.role === "card") expect(forbidden, where).not.toContain(key);
      expect(key.startsWith("malachi-2-16"), where).toBe(false);
    }
    const tenThirteen = all.filter(({ passage }) => passageKey(passage) === "1-corinthians-10-13").map(({ topic }) => topic.slug);
    expect(tenThirteen.sort()).toEqual(["addiction", "tempted"]);
    expect(all.filter(({ passage }) => passageKey(passage) === "proverbs-22-6").map(({ topic, passage }) => `${topic.slug} ${passage.role}`)).toEqual(["worried-about-child reading"]);
  });

  it("labels the believer's hope only where it belongs, and offers the gospel beside it", () => {
    const labelled = all.filter(({ passage }) => passage.believer).map(({ topic }) => topic.slug);
    expect(new Set(labelled)).toEqual(new Set(["dying"]));
    const dying = bySlug("dying").passages.map(passageKey);
    expect(dying).toEqual(expect.arrayContaining(["john-3-16", "romans-10-9-13"]));
  });

  it("gives each Psalm 91 and context-sensitive passage its context note", () => {
    for (const { passage, where } of all) {
      const key = passageKey(passage);
      if (key.startsWith("psalm-91-") || ["1-corinthians-10-13", "proverbs-22-6", "philippians-4-19"].includes(key)) {
        expect(passage.context, where).toBeTruthy();
      }
    }
  });
});

/** Every string the site writes in its own voice on these pages (Scripture is never stored here). */
function siteWords(): { text: string; where: string }[] {
  const words: { text: string; where: string }[] = [];
  for (const topic of WHEN_TOPICS) {
    const where = topic.slug;
    words.push({ text: topic.heading, where }, { text: topic.searchTitle, where }, { text: topic.intro, where }, { text: topic.note, where }, { text: topic.label, where });
    if (topic.person) words.push({ text: topic.person.line, where });
    for (const passage of topic.passages) {
      words.push({ text: passage.note, where });
      if (passage.context) words.push({ text: passage.context, where: `${where} context` });
    }
    for (const extra of topic.help.extra ?? []) words.push({ text: extra.label, where });
    for (const link of topic.elsewhere ?? []) words.push({ text: link.title, where });
  }
  return words;
}

const wordCount = (text: string) => text.trim().split(/\s+/).length;

describe("when you're: the words", () => {
  it("has unique, address-safe slugs and unique headings that answer the search", () => {
    expect(new Set(WHEN_TOPICS.map((topic) => topic.slug)).size).toBe(33);
    expect(new Set(WHEN_TOPICS.map((topic) => topic.heading)).size).toBe(33);
    for (const topic of WHEN_TOPICS) {
      expect(topic.slug).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
      expect(topic.heading, topic.slug).toMatch(/^What the Bible Says When /);
      expect(topic.searchTitle.length, topic.slug).toBeLessThanOrEqual(50);
      expect(topic.words.length, topic.slug).toBeGreaterThanOrEqual(3);
      for (const word of topic.words) expect(word, topic.slug).toBe(word.toLowerCase());
    }
  });

  it("gives every page a 40–110 word introduction whose first sentence can stand as the description", () => {
    for (const topic of WHEN_TOPICS) {
      expect(wordCount(topic.intro), topic.slug).toBeGreaterThanOrEqual(40);
      expect(wordCount(topic.intro), topic.slug).toBeLessThanOrEqual(110);
      expect(topic.intro.split(/(?<=\.)\s/)[0].length, topic.slug).toBeGreaterThanOrEqual(60);
      expect(topic.intro, topic.slug).toMatch(/^(When|If) /);
    }
  });

  it("gives every page a 120–250 word pastoral note", () => {
    for (const topic of WHEN_TOPICS) {
      expect(wordCount(topic.note), topic.slug).toBeGreaterThanOrEqual(120);
      expect(wordCount(topic.note), topic.slug).toBeLessThanOrEqual(250);
    }
  });

  it("keeps the tone rules in every word the site writes", () => {
    const words = siteWords();
    expect(words.length).toBeGreaterThan(450);
    for (const { text, where } of words) {
      expect(text, where).not.toMatch(/committed suicide|commit suicide/i);
      expect(text, where).not.toContain("!");
      expect(text, where).not.toMatch(/\bat least\b|just pray|lack of faith|everything happens for a reason|God will heal you|\bRemember\b|You should|in this season/i);
      expect(text, where).not.toMatch(/if you (really|truly) trust|enough faith|God will give you a child|marriage will be restored|child will come back/i);
      // The one reviewed exception: the context note that corrects the misuse of 1 Corinthians 10:13.
      if (text !== CONTEXT.wayOut) expect(text, where).not.toMatch(/more than you can handle/i);
    }
  });

  it("keeps the gospel off the two urgent pages and on the pages where it belongs", () => {
    for (const slug of ["thinking-of-suicide", "abused"]) {
      expect(bySlug(slug).elsewhere, slug).toBeUndefined();
      expect(bySlug(slug).note, slug).not.toMatch(/good news|saved|sin\b/i);
    }
    for (const slug of ["guilty", "far-from-god", "doubting", "dying"]) {
      expect(bySlug(slug).elsewhere?.map((link) => link.href), slug).toContain("/study/the-good-news");
    }
  });

  it("holds no telephone number or text code: every contact comes from the help directory", () => {
    const contactValues = life.groups.flatMap((group) => group.entries.flatMap((entry) => entry.contact.map((contact) => contact.value)))
      .filter((value) => /^[\d\s()+-]{3,}$/.test(value));
    expect(contactValues).toContain("988");
    const sources = [
      ...siteWords().map(({ text, where }) => ({ text, where })),
      ...readdirSync("src/pages/when-youre").filter((name) => /\.tsx?$/.test(name) && !name.includes(".test."))
        .map((name) => ({ text: readFileSync(`src/pages/when-youre/${name}`, "utf8"), where: name })),
      ...readdirSync("src/data/when-youre").filter((name) => name.endsWith(".ts") && !name.includes(".test."))
        .map((name) => ({ text: readFileSync(`src/data/when-youre/${name}`, "utf8"), where: name })),
    ];
    for (const { text, where } of sources) {
      // Verse references ("Psalm 34:18", "2:4–5") and years are allowed; a telephone-shaped run of digits is not.
      expect(text, where).not.toMatch(/\d{3}[\s.-]\d{3}[\s.-]?\d{3,4}|\b\d{5,}\b/);
      for (const value of contactValues) {
        const pattern = new RegExp(`(?<![\\d:–-])${value.replace(/[^\d]/g, "")}(?![\\d:–-])`);
        expect(text.replace(/\d+:\d+(?:[–-]\d+)?/g, ""), `${where} holds the contact ${value}`).not.toMatch(pattern);
      }
    }
  });
});

describe("when you're: the links", () => {
  it("links real site topics with references, never the suicide or desired-death topics", () => {
    for (const topic of WHEN_TOPICS) {
      expect(topic.topics.length, topic.slug).toBeGreaterThanOrEqual(2);
      expect(topic.topics.length, topic.slug).toBeLessThanOrEqual(4);
      for (const link of topic.topics) {
        expect(["suicide", "desired-death"], topic.slug).not.toContain(link.slug);
        expect(siteTopics[link.slug]?.title, `${topic.slug} -> ${link.slug}`).toBe(link.title);
        expect(siteTopics[link.slug].refs, link.slug).toBeGreaterThan(0);
      }
    }
  });

  it("names real people, real sibling pages and real addresses elsewhere on the site", () => {
    const routes = new Set([...sympathyPaths(), "/study/the-good-news", "/apologetics", ...whenYourePaths(), ...occasionPrayerPaths()]);
    for (const topic of WHEN_TOPICS) {
      if (topic.person) expect(existsSync(`data/study/people/${topic.person.id}.json`), `${topic.slug}: ${topic.person.id}`).toBe(true);
      expect(topic.related.length, topic.slug).toBeGreaterThanOrEqual(2);
      expect(topic.related.length, topic.slug).toBeLessThanOrEqual(4);
      for (const slug of topic.related) {
        expect(topicBySlug(slug), `${topic.slug} -> ${slug}`).toBeDefined();
        expect(slug).not.toBe(topic.slug);
      }
      for (const link of [...(topic.elsewhere ?? []), ...(topic.help.extra ?? [])]) expect(routes.has(link.href), `${topic.slug} -> ${link.href}`).toBe(true);
    }
    expect(WHEN_TOPICS.filter((topic) => topic.person).length).toBe(28);
  });

  it("links every page that can shade into danger to the matching urgent page, and keeps the urgent pages apart", () => {
    for (const slug of ["depressed", "discouraged", "worthless"]) expect(bySlug(slug).related, slug).toContain("thinking-of-suicide");
    for (const slug of ["struggling-marriage", "divorce", "hurt-by-someone"]) expect(bySlug(slug).related, slug).toContain("abused");
    expect(bySlug("thinking-of-suicide").related).not.toContain("abused");
    expect(bySlug("abused").related).not.toContain("thinking-of-suicide");
  });

  it("opens the grieving page's doors to the sympathy loss pages, and not from divorce or heartbreak", () => {
    const doors = bySlug("grieving").elsewhere!.map((link) => link.href);
    expect(doors).toEqual(expect.arrayContaining(["/sympathy/loss-of-mother", "/sympathy/loss-of-baby", "/sympathy/loss-to-suicide", "/sympathy/funeral-readings"]));
    for (const slug of ["divorce", "heartbroken", "infertility"]) {
      expect((bySlug(slug).elsewhere ?? []).some((link) => link.href.startsWith("/sympathy")), slug).toBe(false);
    }
  });
});

describe("when you're: help", () => {
  it("opens with help on exactly the two urgent pages, and carries the calm line on exactly four", () => {
    const at = (level: string) => WHEN_TOPICS.filter((topic) => topic.help.level === level).map((topic) => topic.slug).sort();
    expect(at("urgent")).toEqual(["abused", "thinking-of-suicide"]);
    expect(Object.keys(URGENT_HELP).sort()).toEqual(["abused", "thinking-of-suicide"]);
    expect(at("line")).toEqual(["addiction", "depressed", "discouraged", "worthless"]);
  });

  it("names only real directory entries, matching the foot help of design 6.4", () => {
    for (const topic of WHEN_TOPICS) for (const id of topic.help.entries) expect(helpIds.has(id), `${topic.slug}: ${id}`).toBe(true);
    for (const id of Object.values(URGENT_HELP).flat()) expect(helpIds.has(id), id).toBe(true);
    const entries = (slug: string) => bySlug(slug).help.entries;
    for (const slug of ["anxious", "depressed", "worthless", "lonely", "divorce", "worried-about-child", "struggling-marriage"]) {
      expect(entries(slug), slug).toEqual(expect.arrayContaining(COUNSELLING));
    }
    expect(entries("discouraged")[0]).toBe("crisis-text-line");
    expect(entries("grieving")).toEqual(["griefshare", "afsp-suicide-loss-groups"]);
    expect(entries("caregiving")).toEqual(["211-united-way"]);
    expect(entries("out-of-work")).toEqual(["211-united-way", "feeding-america-locator"]);
    expect(entries("money-worries")).toEqual(["211-united-way", "feeding-america-locator", "usda-national-hunger-hotline"]);
    expect(entries("addiction")).toEqual(["celebrate-recovery", "findtreatment-gov", "samhsa-helpline"]);
    expect(entries("struggling-marriage")).toContain("domestic-violence-hotline");
    expect(entries("thinking-of-suicide")).toEqual([]);
    expect(entries("abused")).toEqual([]);
    for (const topic of WHEN_TOPICS) {
      if (topic.help.level === "none") expect(topic.help.entries, topic.slug).toEqual([]);
      if (topic.help.level === "foot" || topic.help.level === "line") expect(topic.help.entries.length, topic.slug).toBeGreaterThan(0);
    }
  });
});
