// Prayers for occasions against the site's own Berean files, topic index, sibling features and the Tools hub
// (design 7.3: passage data, words, tone, the historic texts and their permission, links and the sitemap inventory).
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assemblePassage, CARD_MAX, partLetter, passageReference, passageVerseIds } from "@/pages/life-events/passage";
import { TOOLS } from "@/pages/tools/registry";
import { lifeEventPaths } from "../life-events";
import { sympathyPaths } from "../sympathy";
import type { SympathyPassage } from "../sympathy/types";
import { whenYourePaths } from "../when-youre";
import { homeBlessingPaths } from "../home-blessings";
import {
  BCP_WORD_LIMIT, DEFINED_OCCASIONS, GROUPS, HISTORIC_PRAYERS, HUB_ORDER, OCCASIONS, occasionBySlug, occasionPrayerPaths,
  PRAYERS_PATH, wordCount, type HistoricId,
} from ".";

interface CatalogBook { num: number; code: string; name: string }
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as { books: CatalogBook[] };
const books = new Map(catalog.books.map((book) => [book.num, book]));
const siteTopics = (JSON.parse(readFileSync("data/topics/index.json", "utf8")) as { topics: Record<string, { title: string; refs: number }> }).topics;

const held = new Map<string, Record<string, string>>();
/** A verse's Berean words as the site shows them, or null. */
function berean(id: number): string | null {
  const code = books.get(Math.floor(id / 1_000_000))!.code;
  if (!held.has(code)) held.set(code, JSON.parse(readFileSync(`data/plain/bsb/${code}.json`, "utf8")) as Record<string, string>);
  const text = held.get(code)![`${Math.floor(id / 1000) % 1000}:${id % 1000}`];
  return text === undefined ? null : text.replace(/^¶\s*/, "").replace(/\s+/g, " ").trim();
}
const bookName = (num: number) => books.get(num)!.name;

const prayers = OCCASIONS.flatMap((occasion) => occasion.prayers.map((prayer) => ({ occasion, prayer, where: `${occasion.slug}#${prayer.id}` })));
const roots: { passage: SympathyPassage; where: string }[] = [
  ...prayers.flatMap(({ prayer, where }) => prayer.rootedIn.map((passage) => ({ passage, where: `${where} ${passageReference(passage, bookName)}` }))),
  ...OCCASIONS.filter((occasion) => occasion.scriptureBlessing).map((occasion) => ({ passage: occasion.scriptureBlessing!, where: `${occasion.slug} blessing` })),
];

/** The site's own words on these pages: prayers, introductions, words before praying and context notes. */
const ownWords: { text: string; where: string }[] = [
  ...prayers.map(({ prayer, where }) => ({ text: prayer.text, where })),
  ...OCCASIONS.map((occasion) => ({ text: occasion.intro, where: `${occasion.slug} intro` })),
  ...OCCASIONS.filter((occasion) => occasion.before).map((occasion) => ({ text: occasion.before!, where: `${occasion.slug} before` })),
  ...roots.flatMap(({ passage, where }) => [{ text: passage.note, where: `${where} note` }, ...(passage.context ? [{ text: passage.context, where: `${where} context` }] : [])]),
];

/** Verses commonly misused as promises of success, presence, prosperity or results: never a root (design 4.3). */
const NEVER_ROOTS = ["JER 29:11", "ROM 8:28", "PHP 4:13", "MAT 18:20", "DEU 8:18", "3JN 1:2", "MAL 2:16", "PRO 22:6"];
/** Technique, false promises, pressure (design 4.6, 7.3); matched as whole words, case-insensitively. */
const BANNED = [
  "powerful", "breakthrough", "prayer points", "claim", "declare", "decree", "manifest", "I command", "God will heal",
  "you will get", "everything happens for a reason", "more than you can handle", "enough faith", "just pray", "at least",
];

describe("prayers for occasions: the pages", () => {
  it("has the 32 planned occasions in hub order, in six groups of 6, 7, 6, 5, 5 and 3", () => {
    expect(OCCASIONS.map((occasion) => occasion.slug)).toEqual(HUB_ORDER);
    expect(DEFINED_OCCASIONS).toHaveLength(32);
    const counts = Object.fromEntries(GROUPS.map((group) => [group.id, OCCASIONS.filter((occasion) => occasion.group === group.id).length]));
    expect(counts).toEqual({ health: 6, work: 7, home: 6, hard: 5, journeys: 5, church: 3 });
    expect(OCCASIONS.map((occasion) => occasion.group)).toEqual([...OCCASIONS].sort((a, b) => GROUPS.findIndex((g) => g.id === a.group) - GROUPS.findIndex((g) => g.id === b.group)).map((occasion) => occasion.group));
  });

  it("gives every page a unique URL-safe slug and heading, and a search title of 50 characters or fewer", () => {
    expect(new Set(OCCASIONS.map((occasion) => occasion.slug)).size).toBe(32);
    expect(new Set(OCCASIONS.map((occasion) => occasion.heading)).size).toBe(32);
    for (const occasion of OCCASIONS) {
      expect(occasion.slug).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
      expect(occasion.heading, occasion.slug).toMatch(/^(A|An) .*Prayer/);
      expect(occasion.searchTitle.length, occasion.slug).toBeLessThanOrEqual(50);
      expect(occasion.words.length, occasion.slug).toBeGreaterThan(0);
    }
  });

  it("lists the hub and the 32 occasion addresses in the sitemap inventory, and nothing else", () => {
    const paths = occasionPrayerPaths();
    expect(paths).toHaveLength(33);
    expect(new Set(paths).size).toBe(33);
    expect(paths[0]).toBe(PRAYERS_PATH);
    expect(paths.slice(1)).toEqual(OCCASIONS.map((occasion) => `/prayers/${occasion.slug}`));
  });

  it("shows an older prayer on the thirteen planned pages", () => {
    const shown = Object.fromEntries(OCCASIONS.filter((occasion) => occasion.historic).map((occasion) => [occasion.slug, occasion.historic]));
    expect(shown).toEqual({
      "before-surgery": "bcp-perils", "waiting-for-results": "bcp-peace", "someone-in-hospital": "bcp-sick",
      "job-interview": "bcp-prevent", "new-job": "bcp-grace", exam: "bcp-prevent", "big-decision": "bcp-trinity-4",
      "moving-away": "breastplate", travel: "breastplate", "mission-trip": "breastplate", "new-year": "bcp-grace",
      "opening-a-meeting": "bcp-purity", "before-reading-the-bible": "bcp-advent-2",
    });
  });
});

describe("prayers for occasions: the words", () => {
  it("keeps introductions to 40–90 words and a word before praying to 60 words, on the five pages that need one", () => {
    for (const occasion of OCCASIONS) {
      expect(wordCount(occasion.intro), `${occasion.slug} intro`).toBeGreaterThanOrEqual(40);
      expect(wordCount(occasion.intro), `${occasion.slug} intro`).toBeLessThanOrEqual(90);
      if (occasion.before) expect(wordCount(occasion.before), `${occasion.slug} before`).toBeLessThanOrEqual(60);
    }
    expect(OCCASIONS.filter((occasion) => occasion.before).map((occasion) => occasion.slug).sort())
      .toEqual(["after-bad-news", "before-a-funeral", "court-date", "giving-birth", "struggling-marriage"]);
  });

  it("gives each page 1–3 prayers with unique ids, each 60–140 words, ending “amen.”, with 2–5 roots", () => {
    for (const occasion of OCCASIONS) {
      expect(occasion.prayers.length, occasion.slug).toBeGreaterThanOrEqual(1);
      expect(occasion.prayers.length, occasion.slug).toBeLessThanOrEqual(3);
      expect(new Set(occasion.prayers.map((prayer) => prayer.id)).size, occasion.slug).toBe(occasion.prayers.length);
    }
    for (const { prayer, where } of prayers) {
      expect(prayer.id, where).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
      expect(wordCount(prayer.text), where).toBeGreaterThanOrEqual(60);
      expect(wordCount(prayer.text), where).toBeLessThanOrEqual(140);
      expect(prayer.text, where).toMatch(/amen\.$/i);
      expect(prayer.rootedIn.length, where).toBeGreaterThanOrEqual(2);
      expect(prayer.rootedIn.length, where).toBeLessThanOrEqual(5);
      expect(prayer.rootedIn.every((passage) => passage.role === "card"), where).toBe(true);
    }
  });

  it("puts [name] in every prayer for someone and no other, never at the start of a sentence", () => {
    for (const { prayer, where } of prayers) {
      expect(prayer.text.includes("[name]"), where).toBe(Boolean(prayer.forSomeone));
      expect(prayer.text, where).not.toMatch(/(^|[.?!:;]\s+|[“"]\s*)\[name\]/);
    }
  });

  it("uses none of the words of technique, false promise or pressure, and no exclamation marks, in its own words", () => {
    for (const { text, where } of ownWords) {
      for (const phrase of BANNED) {
        expect(new RegExp(`\\b${phrase.replace(/ /g, "\\s+")}\\b`, "i").test(text), `${where}: “${phrase}”`).toBe(false);
      }
      expect(text.includes("!"), `${where}: exclamation mark`).toBe(false);
    }
  });

  it("matches the banned words as whole words, so “proclaim” is not taken for “claim”", () => {
    const claim = new RegExp("\\bclaim\\b", "i");
    expect(claim.test("that we may proclaim the mystery")).toBe(false);
    expect(claim.test("Claim your healing")).toBe(true);
  });

  it("addresses no saint, Mary or angel in any written prayer", () => {
    for (const { prayer, where } of prayers) {
      const sentences = prayer.text.split(/(?<=[.?:;])\s+/);
      for (const sentence of sentences) expect(sentence, where).not.toMatch(/^(Saint|St\.?|Mary|Holy Mother|angel)\b/i);
    }
  });
});

describe("prayers for occasions: the verses beneath each prayer", () => {
  it("uses only verses the Berean has, in ranges that run forward inside one chapter", () => {
    for (const { passage, where } of roots) {
      if (passage.to !== undefined) {
        expect(passage.to, where).toBeGreaterThan(passage.from);
        expect(Math.floor(passage.to / 1000), where).toBe(Math.floor(passage.from / 1000));
      }
      for (const id of passageVerseIds(passage)) expect(berean(id), `${where} verse ${id}`).toBeTruthy();
    }
  });

  it("stores every excerpt exactly, on the last verse, marked a or b by where it sits", () => {
    const partial = roots.filter(({ passage }) => passage.part);
    expect(partial.length).toBeGreaterThanOrEqual(3);
    for (const { passage, where } of partial) {
      expect(passage.part!.verse, where).toBe(passage.to ?? passage.from);
      const verse = berean(passage.part!.verse)!;
      expect(verse.includes(passage.part!.text), where).toBe(true);
      expect(partLetter(passage, verse), where).toBe(passage.part!.mark);
    }
  });

  it("keeps every root within the 320-character card limit", () => {
    for (const { passage, where } of roots) expect(assemblePassage(passage, berean).length, where).toBeLessThanOrEqual(CARD_MAX);
  });

  it("never roots a prayer in the eight verses so often misused as promises", () => {
    const never = NEVER_ROOTS.map((reference) => {
      const [, code, chapter, verse] = /^(\w+) (\d+):(\d+)$/.exec(reference)!;
      const book = catalog.books.find((item) => item.code === code)!;
      return { reference, id: book.num * 1_000_000 + Number(chapter) * 1000 + Number(verse) };
    });
    for (const { passage, where } of roots) {
      const ids = passageVerseIds(passage);
      for (const { reference, id } of never) expect(ids.includes(id), `${where} uses ${reference}`).toBe(false);
    }
  });

  it("carries the no-guarantee note wherever Psalm 121:7–8 or Psalm 91 roots a prayer", () => {
    const guarded = roots.filter(({ passage }) => [19121007, 19091001].includes(passage.from));
    expect(guarded.length).toBeGreaterThanOrEqual(4);
    for (const { passage, where } of guarded) expect(passage.context, where).toMatch(/not a guarantee that no harm will come/);
  });

  it("ends the closing page with exactly Numbers 6:24–26, shown as Scripture", () => {
    const withBlessing = OCCASIONS.filter((occasion) => occasion.scriptureBlessing);
    expect(withBlessing.map((occasion) => occasion.slug)).toEqual(["closing-a-meeting"]);
    const blessing = withBlessing[0].scriptureBlessing!;
    expect([blessing.from, blessing.to, blessing.part]).toEqual([4006024, 4006026, undefined]);
  });
});

/** sha256 of each older prayer as stored, so an accidental "modernising" edit fails (design 7.3). */
const CHECKSUMS: Record<HistoricId, string> = {
  "bcp-grace": "fddc37d7a66f827460997b79d52997f5ec6d2ace3461445ff047a4ccf72a096e",
  "bcp-peace": "46a5d5717b11725eda99c3e16a526f3e0eae6a41f9f4f656851b8e956d210e9f",
  "bcp-perils": "dfc97f7907a6c8cb0f32c12ec074150b12d67794a0eaf614a025b5cb9211e5de",
  "bcp-purity": "714b54b7223788fb6e4c5aceafa6f1477002a1080278eab43ccf04ce4d06702e",
  "bcp-prevent": "3340544a978caa992995e6235dd1269c7594974863e46f0362c0a61dd7a6bdfa",
  "bcp-sick": "9ec9e489e0a18706c1d0282d9e62181205c638f0e6fcb60eb69f1cd31ff85356",
  "bcp-advent-2": "9e5e15a0c797fcd0193106cc369e5dc83de270e4a8e0f7cb2904627e6dfa30e0",
  "bcp-trinity-4": "47e116e1a53d105ebdb186653710c5e5c48221dca24db33ea3914aec615942a9",
  breastplate: "affac6fdb9842161cffa4e38b4720e7e78ddf868ae6415f27e95bc4eec14bd7d",
};

describe("prayers for occasions: the older prayers", () => {
  it("holds each text to its checksum and its word count", () => {
    const words: Record<HistoricId, number> = {
      "bcp-grace": 72, "bcp-peace": 69, "bcp-perils": 35, "bcp-purity": 48, "bcp-prevent": 51, "bcp-sick": 52,
      "bcp-advent-2": 63, "bcp-trinity-4": 59, breastplate: 53,
    };
    for (const prayer of Object.values(HISTORIC_PRAYERS)) {
      expect(createHash("sha256").update(prayer.text).digest("hex"), prayer.id).toBe(CHECKSUMS[prayer.id]);
      expect(wordCount(prayer.text), prayer.id).toBe(words[prayer.id]);
      expect(prayer.checkedAgainst, prayer.id).toMatch(/2026-11-09/);
    }
  });

  it("keeps the distinct 1662 texts within Cambridge's 500-word permission", () => {
    const total = Object.values(HISTORIC_PRAYERS).filter((prayer) => prayer.rights === "bcp-1662-crown").reduce((sum, prayer) => sum + wordCount(prayer.text), 0);
    expect(total, `the 1662 texts total ${total} words`).toBeLessThanOrEqual(BCP_WORD_LIMIT);
    expect(total).toBe(449);
  });

  it("names a real older prayer on every page that shows one", () => {
    for (const occasion of OCCASIONS) if (occasion.historic) expect(HISTORIC_PRAYERS[occasion.historic], occasion.slug).toBeDefined();
  });
});

describe("prayers for occasions: links", () => {
  const routes = new Set([...whenYourePaths(), ...lifeEventPaths(), ...sympathyPaths(), ...homeBlessingPaths(), "/study/the-good-news"]);

  it("links two or three site topics that exist with references, under their own titles", () => {
    for (const occasion of OCCASIONS) {
      expect(occasion.topics.length, occasion.slug).toBeGreaterThanOrEqual(2);
      expect(occasion.topics.length, occasion.slug).toBeLessThanOrEqual(3);
      for (const topic of occasion.topics) {
        expect(siteTopics[topic.slug]?.refs, `${occasion.slug} -> ${topic.slug}`).toBeGreaterThan(0);
        expect(siteTopics[topic.slug].title, `${occasion.slug} -> ${topic.slug}`).toBe(topic.title);
      }
    }
  });

  it("links two to four real sibling occasions, never itself", () => {
    for (const occasion of OCCASIONS) {
      expect(occasion.related.length, occasion.slug).toBeGreaterThanOrEqual(2);
      expect(occasion.related.length, occasion.slug).toBeLessThanOrEqual(4);
      for (const slug of occasion.related) {
        expect(occasionBySlug(slug), `${occasion.slug} -> ${slug}`).toBeDefined();
        expect(slug).not.toBe(occasion.slug);
      }
    }
  });

  it("links only real pages of the sibling features", () => {
    for (const occasion of OCCASIONS) for (const link of occasion.elsewhere ?? []) expect(routes.has(link.href), `${occasion.slug} -> ${link.href}`).toBe(true);
    expect(occasionBySlug("struggling-marriage")!.elsewhere!.map((link) => link.href)).toContain("/when-youre/abused");
    expect(occasionBySlug("before-a-funeral")!.elsewhere!.map((link) => link.href)).toEqual(expect.arrayContaining(["/sympathy", "/sympathy/funeral-readings", "/study/the-good-news"]));
  });

  it("is live on the Tools hub at /prayers", () => {
    const tool = TOOLS.find((item) => item.slug === "occasion-prayers");
    expect(tool).toMatchObject({ status: "live", path: "/prayers" });
  });
});
