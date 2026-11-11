// The generated files (answers.json, daily.json, guesses.json) against the hand-kept curation and the site's own data
// (design §4, §5, §12). curation.json is read here and by the build script only, never by the game page.
import { readFileSync } from "node:fs";
import answersFile from "@/data/wordle/answers.json";
import curationFile from "@/data/wordle/curation.json";
import scheduleFile from "@/data/wordle/daily.json";
import guessesFile from "@/data/wordle/guesses.json";
import { bsbWords } from "@/lib/bsb-for-tests";
import { splitId } from "@/lib/refs";
import type { Answers } from "./daily";
import type { WordleSchedule } from "./daily-rules";
import { guessSet } from "./evaluate";
import { verseHasWord } from "./verse-match";

interface Curated { word: string; category: string; tier: number; verse?: number; person?: string; retired?: boolean }
const curation = curationFile as { answers: Curated[]; blocked: string[]; usSpellings: string[]; pins: Record<string, string>; easter?: string };
const answers = answersFile as unknown as Answers;
const schedule = scheduleFile as unknown as WordleSchedule;
const allowed = guessSet(guessesFile.words);
const curatedByWord = new Map(curation.answers.map((answer) => [answer.word, answer]));
const bookCode = new Map((JSON.parse(readFileSync("data/catalog.json", "utf8")) as { books: { code: string; num: number }[] }).books.map((b) => [b.num, b.code]));
const slugs = (JSON.parse(readFileSync("src/data/people-slugs.json", "utf8")) as { slugs: Record<string, string> }).slugs;
const people = new Map((JSON.parse(readFileSync("data/study/people.json", "utf8")) as { id: string; c?: number }[]).map((p) => [p.id, p.c ?? 0]));

describe("bible wordle data", () => {
  it("has every answer as five letters a-z, in the guess list and in the curation", () => {
    for (const word of Object.keys(answers)) {
      expect(word).toMatch(/^[a-z]{5}$/);
      expect(allowed.has(word), word).toBe(true);
      expect(curatedByWord.has(word), word).toBe(true);
    }
    expect(Object.keys(answers).sort()).toEqual([...curatedByWord.keys()].sort());
  });

  it("points every answer at a BSB verse that contains the word as a whole word", () => {
    const problems: string[] = [];
    for (const [word, entry] of Object.entries(answers)) {
      const { num, chapter, verse } = splitId(entry.v);
      const code = bookCode.get(num);
      const text = code ? bsbWords({ code, chapter, verse }) : "";
      if (!verseHasWord(text, word)) problems.push(`${word}: ${entry.v} reads "${text}"`);
    }
    expect(problems).toEqual([]);
  });

  it("gives every person and place a verse chosen by hand", () => {
    const named = curation.answers.filter((answer) => answer.category === "person" || answer.category === "place");
    expect(named.length).toBeGreaterThan(40);
    for (const answer of named) {
      expect(answer.verse, answer.word).toBeDefined();
      expect(answers[answer.word].v, answer.word).toBe(answer.verse);
    }
  });

  it("links every person to a real record mentioned at least ten times, by its readable address where there is one", () => {
    for (const [word, entry] of Object.entries(answers)) {
      if (entry.c !== "person") continue;
      expect(entry.pid, word).toBeDefined();
      expect(people.get(entry.pid!) ?? 0, word).toBeGreaterThanOrEqual(10);
      const slug = Object.entries(slugs).find(([, id]) => id === entry.pid)?.[0];
      expect(entry.p, word).toBe(slug ?? entry.pid);
    }
  });

  it("has at least 400 answers that are not retired, with names and hard words in proportion", () => {
    const active = Object.values(answers).filter((entry) => !entry.r);
    expect(active.length).toBeGreaterThanOrEqual(400);
    expect(active.filter((entry) => entry.t === 3).length / active.length).toBeLessThanOrEqual(0.15);
    expect(active.filter((entry) => entry.c === "person" || entry.c === "place").length / active.length).toBeLessThanOrEqual(0.2);
  });

  it("keeps blocked words out of the guess list and American-only spellings out of the answers", () => {
    for (const word of curation.blocked) expect(allowed.has(word), word).toBe(false);
    for (const word of curation.usSpellings) expect(answers[word], word).toBeUndefined();
    expect(curation.usSpellings).toEqual(expect.arrayContaining(["honor", "favor", "labor", "valor", "armor"]));
  });

  it("accepts ordinary English and Bible-only words as guesses", () => {
    for (const word of ["adieu", "crane", "slate", "jesus", "sheol", "thine", "hadst", "honor"]) expect(allowed.has(word), word).toBe(true);
    expect(allowed.size).toBeGreaterThan(9000);
  });

  it("schedules only words that have an entry, and no retired word after the frozen days", () => {
    for (const word of schedule.days) expect(answers[word], word).toBeDefined();
    schedule.days.slice(schedule.frozenThrough).forEach((word, i) => expect(answers[word].r, `#${schedule.frozenThrough + i + 1}`).toBeUndefined());
  });

  it("never lets the game page import the curation file", () => {
    for (const file of ["WordleGame.tsx", "Play.tsx", "Result.tsx", "daily.ts"]) {
      expect(readFileSync(`src/pages/games/wordle/${file}`, "utf8"), file).not.toContain("wordle/curation");
    }
  });
});
