// The puzzle set's checks (design §5.5 checks 1–5, §5.1 counts, §13): every clue word in the site's BSB text of its
// passage, every emoji on the allow-list, no two puzzles too alike, the title and alias rules, and the generated files
// up to date with stories.json.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import storyFile from "@/data/emoji-stories/stories.json";
import emojiFile from "@/data/emoji-stories/emoji.json";
import { clueWordsIn, searchWords, singular } from "./answer-match";
import { DIFFICULTIES, MIN_FILTER_SIZE, TESTAMENTS, isOffered, storiesFor } from "./deal";
import { parseRef } from "./passage";
import { isFace, type EmojiFile, type Story, type StoryFile } from "./types";

const stories = (storyFile as StoryFile).stories;
const emoji = (emojiFile as EmojiFile).emoji;
const live = stories.filter((story) => !story.retired);
const books = new Map<string, Record<string, string>>();
const bookText = (code: string) => {
  if (!books.has(code)) books.set(code, JSON.parse(fs.readFileSync(path.join("data/plain/bsb", `${code}.json`), "utf8")));
  return books.get(code)!;
};
/** The passage's verses as [book, chapter * 1000 + verse, text]. */
function verses(ref: string): [string, number, string][] {
  return parseRef(ref).flatMap((range) => {
    const from = range.chapter * 1000 + range.verse, to = range.endChapter * 1000 + range.endVerse;
    return Object.entries(bookText(range.book)).flatMap(([key, text]) => {
      const match = /^(\d+):(\d+)$/.exec(key);
      const at = match ? Number(match[1]) * 1000 + Number(match[2]) : -1;
      return at >= from && at <= to ? [[range.book, at, text] as [string, number, string]] : [];
    });
  });
}
const wordsOf = (text: string) => ` ${text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()} `;
const NUMBER_EMOJI = new Set(["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "💯"]);
const NUMBER_WORD = /^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirty|forty|fifty|hundred|first|second|third|sixth|seventh|eighth|ninth|tenth|\d+|(twenty|thirty|forty|fifty)-(one|two|three|four|five|six|seven|eight|nine))$/i;
const BLOCKED = new Set(["🩸", "💀", "☠️", "🔪", "🔫", "💣", "⚰️"]);
const nonFace = (story: Story) => new Set(story.emoji.map(([char]) => char).filter((char) => !isFace(emoji[char])));

describe("emoji stories puzzle set", () => {
  it("has at least 100 active puzzles and 20 in every Practice filter it offers, Easy and Hard included", () => {
    expect(live.length).toBeGreaterThanOrEqual(100);
    for (const difficulty of DIFFICULTIES) {
      for (const testament of TESTAMENTS) {
        const filter = { difficulty, testament };
        expect(isOffered(stories, filter), `${difficulty} / ${testament}`).toBe(storiesFor(stories, filter).length >= MIN_FILTER_SIZE);
        expect(storiesFor(stories, filter).length, `${difficulty} / ${testament}`).toBeGreaterThanOrEqual(MIN_FILTER_SIZE);
      }
    }
  });

  it("finds every clue word in the BSB text of its passage, and the key verse inside the passage with a clue word", () => {
    for (const story of stories) {
      const passage = verses(story.ref);
      expect(passage.length, story.id).toBeGreaterThan(0);
      const text = wordsOf(passage.map(([, , words]) => words).join(" "));
      for (const [, word] of story.emoji) expect(text, `${story.id}: "${word}" in ${story.ref}`).toContain(wordsOf(word));
      const key = verses(story.key);
      expect(key.length, `${story.id}: key ${story.key}`).toBeGreaterThanOrEqual(1);
      expect(key.length).toBeLessThanOrEqual(3);
      for (const [book, at] of key) expect(passage.some(([b, a]) => b === book && a === at), `${story.id}: key inside ref`).toBe(true);
      const keyText = wordsOf(key.map(([, , words]) => words).join(" "));
      expect(keyText.trim().split(" ").length, `${story.id}: key length`).toBeLessThanOrEqual(60);
      expect(story.emoji.some(([, word]) => keyText.includes(wordsOf(word))), `${story.id}: key holds a clue word`).toBe(true);
    }
  });

  it("uses only allowed emoji: on the list, fully qualified, Emoji 13.0 or earlier, no joiner, skin tone, flag or blocked one", () => {
    for (const story of stories) {
      expect(story.emoji.length, story.id).toBeGreaterThanOrEqual(3);
      expect(story.emoji.length, story.id).toBeLessThanOrEqual(6);
      for (const [char, word] of story.emoji) {
        const info = emoji[char];
        expect(info, `${story.id}: ${char}`).toBeDefined();
        expect(info.version, `${story.id}: ${char}`).toBeLessThanOrEqual(13);
        expect([...char].some((c) => c.codePointAt(0) === 0x200d || /[\u{1F3FB}-\u{1F3FF}\u{1F1E6}-\u{1F1FF}]/u.test(c)), `${story.id}: ${char}`).toBe(false);
        expect(BLOCKED.has(char), `${story.id}: ${char}`).toBe(false);
        if (NUMBER_EMOJI.has(char)) expect(word, `${story.id}: ${char} stands for a number`).toMatch(NUMBER_WORD);
        expect(["god", "lord", "jesus", "christ"]).not.toContain(word.toLowerCase());
      }
    }
  });

  it("keeps every two puzzles apart by at least two emoji that are not faces", () => {
    for (const a of stories) {
      for (const b of stories) {
        if (a === b) continue;
        const other = new Set(b.emoji.map(([char]) => char));
        const only = [...nonFace(a)].filter((char) => !other.has(char));
        expect(only.length, `${a.id} has only ${only.join("")} that ${b.id} lacks`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("keeps confusable lists symmetric and naming real stories", () => {
    const ids = new Set(stories.map((story) => story.id));
    for (const story of stories) {
      for (const id of story.confusable) {
        expect(ids.has(id), `${story.id} → ${id}`).toBe(true);
        expect(stories.find((other) => other.id === id)!.confusable, `${id} → ${story.id}`).toContain(story.id);
      }
    }
  });

  it("never spells the answer out: tier 2–3 titles and every alias hold at most one clue word, no alias only clue words", () => {
    for (const story of stories) {
      if (story.tier >= 2) expect(clueWordsIn(story.title, story).length, `${story.id}: title`).toBeLessThanOrEqual(1);
      for (const alias of story.aliases) {
        if (story.tier >= 2) expect(clueWordsIn(alias, story).length, `${story.id}: ${alias}`).toBeLessThanOrEqual(1);
        const words = searchWords(alias).map(singular);
        expect(words.length && words.every((word) => clueWordsIn(word, story).length > 0), `${story.id}: alias "${alias}" is only clue words`).toBeFalsy();
      }
    }
  });

  it("has unique, address-safe ids, unique titles and aliases, short titles, and people who exist", () => {
    const labels = new Map<string, string>();
    expect(new Set(stories.map((story) => story.id)).size).toBe(stories.length);
    for (const story of stories) {
      expect(story.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(story.title.length, story.id).toBeLessThanOrEqual(48);
      expect(["old", "new"]).toContain(story.testament);
      expect([1, 2, 3]).toContain(story.tier);
      expect(story.who.trim(), story.id).not.toBe("");
      for (const label of [story.title, ...story.aliases]) {
        const key = searchWords(label).join(" ");
        expect(labels.get(key) ?? story.id, `"${label}"`).toBe(story.id);
        labels.set(key, story.id);
      }
      for (const person of story.people) {
        expect(fs.existsSync(path.join("data/study/people", `${person.id}.json`)), `${story.id}: ${person.id}`).toBe(true);
        expect(person.name.trim()).not.toBe("");
      }
    }
  });

  it("has emoji.json, daily.json and the review sheet up to date with stories.json", () => {
    expect(() => execFileSync(process.execPath, ["--experimental-strip-types", "scripts/build-emoji-stories.ts", "--check"], { stdio: "pipe" })).not.toThrow();
  });
});
