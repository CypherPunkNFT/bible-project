// The generated pool (src/data/verse-completion/pool.json) against the BSB on disk and the build's rules (design §4,
// §7.2, §13): every passage is real, whole and the right length; counts, splits and decoys hold; the balance targets
// are met; pool.json is exactly what the build writes from curation.json; and it holds no verse wording.
import fs from "node:fs";
import curationFile from "@/data/verse-completion/curation.json";
import poolFile from "@/data/verse-completion/pool.json";
import { buildPool, type Curated } from "../../../../scripts/build-verse-completion";
import { passageText, startsSentence } from "../../../../scripts/verse-completion-candidates";
import type { Pool } from "./model";
import { eligibleText } from "./passage";
import { endingOf, endingsClash, splitAllowed } from "./pool-rules";
import { words } from "./words";

const pool = poolFile as unknown as Pool;
const byId = new Map(pool.passages.map((passage) => [passage.id, passage]));
const active = pool.passages.filter((passage) => !passage.retired);
const textOf = new Map(pool.passages.map((passage) => [passage.id, passageText(passage.from, passage.to)]));

describe("verse completion pool", () => {
  it("holds about 600 passages with unique ids, one to three verses of one chapter each", () => {
    expect(active.length).toBeGreaterThanOrEqual(480);
    expect(new Set(pool.passages.map((passage) => passage.id)).size).toBe(pool.passages.length);
    for (const passage of pool.passages) {
      expect(Math.floor(passage.from / 1000), passage.id).toBe(Math.floor(passage.to / 1000));
      expect(passage.to - passage.from, passage.id).toBeLessThanOrEqual(2);
    }
  });

  it("has only whole sentences of 8–45 words, without digits or contractions, and counts that match the BSB", () => {
    for (const passage of pool.passages) {
      const text = textOf.get(passage.id)!;
      expect(eligibleText(text), passage.id).toBe(passage.words);
      expect(words(text).length, passage.id).toBe(passage.words);
      expect(startsSentence(passage.from), passage.id).toBe(true);
    }
  });

  it("splits within the limits, at Hard no more than at Medium, at Medium no more than at Easy", () => {
    for (const passage of pool.passages) {
      for (const level of ["easy", "medium", "hard"] as const) expect(splitAllowed(passage.split[level], passage.words, level), `${passage.id} ${level}`).toBe(true);
      expect(passage.split.hard <= passage.split.medium && passage.split.medium <= passage.split.easy, passage.id).toBe(true);
    }
  });

  it("has two active, distinct decoys per Pick level, none sharing a verse or looking like another option", () => {
    for (const passage of pool.passages) {
      for (const level of ["easy", "medium"] as const) {
        const right = endingOf(textOf.get(passage.id)!, passage.split[level]);
        const decoys = passage.decoys[level].map((id) => byId.get(id)!);
        expect(decoys.every(Boolean), passage.id).toBe(true);
        expect(new Set([passage.id, ...passage.decoys[level]]).size, passage.id).toBe(3);
        const endings = decoys.map((decoy) => endingOf(textOf.get(decoy.id)!, decoy.split[level]));
        for (const [i, decoy] of decoys.entries()) {
          expect(decoy.retired, decoy.id).toBeUndefined();
          expect(decoy.from > passage.to || decoy.to < passage.from, `${passage.id} ${decoy.id}`).toBe(true);
          expect(endingsClash(endings[i].keys, right.keys), `${passage.id} ${decoy.id}`).toBe(false);
          expect(endings[i].mark, `${passage.id} ${decoy.id}`).toBe(right.mark);
        }
        expect(endingsClash(endings[0].keys, endings[1].keys), passage.id).toBe(false);
      }
    }
  });

  it("is a third Old Testament or more, no book above 12%, and tiers within 20% of 150, 250 and 200", () => {
    expect(active.filter((passage) => passage.testament === "ot").length * 3).toBeGreaterThanOrEqual(active.length);
    const perBook = new Map<number, number>();
    for (const passage of active) perBook.set(Math.floor(passage.from / 1e6), (perBook.get(Math.floor(passage.from / 1e6)) ?? 0) + 1);
    expect(Math.max(...perBook.values())).toBeLessThanOrEqual(active.length * 0.12);
    for (const [tier, target] of [[1, 150], [2, 250], [3, 200]] as const) {
      expect(Math.abs(active.filter((passage) => passage.tier === tier).length - target), `tier ${tier}`).toBeLessThanOrEqual(target * 0.2);
    }
  });

  it("is exactly what the build writes from curation.json, with the right ending longest on 25–42% of cards", () => {
    const built = buildPool(curationFile as unknown as Curated[]);
    expect(built.pool).toEqual(pool);
    for (const key of ["easyLongestShare", "mediumLongestShare"]) {
      expect(built.report[key] as number).toBeGreaterThanOrEqual(0.25);
      expect(built.report[key] as number).toBeLessThanOrEqual(0.42);
    }
  }, 60_000);

  it("holds no verse wording in pool.json or curation.json", () => {
    const files = ["src/data/verse-completion/pool.json", "src/data/verse-completion/curation.json"].map((path) => fs.readFileSync(path, "utf8"));
    for (const text of files) {
      for (const passage of pool.passages.slice(0, 200)) {
        const opening = words(textOf.get(passage.id)!).slice(0, 5).map((word) => word.text).join("").trim();
        expect(text.includes(opening), `${passage.id}: "${opening}"`).toBe(false);
      }
    }
  });
});
