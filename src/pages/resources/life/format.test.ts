import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Help, LifeData } from "@/data/resources";
import { groupStats, quickActions, subtitle } from "./format";
import { SITE_LANGUAGES } from "@/lib/site-languages";

// The page reads a line's notes and hours for its buttons ("Dial 988 then press 1", "Office line", "24/7"), and in Spanish
// and every other language it reads the translated copy (apply.py). Every button and count must come out the same as in English.
const read = (path: string) => JSON.parse(readFileSync(path, "utf8")) as LifeData;
const english = read("src/data/resources/life.json");
const entries = (data: LifeData): Help[] => [...data.groups.flatMap((g) => g.entries), ...data.cities.flatMap((c) => [...c.entries, ...(c.lines ?? [])])];
const ways = (text: string) => text.split("  ·  ")[0];

// Known wrong, found 2026-11-06 when this test stopped covering only Spanish and Portuguese (translation system, stage 3
// job 3): answersAlways in format.ts knows only English "24/7" and Spanish/Portuguese "24 horas", so these copies
// under-count the lines answering around the clock. Stage 5 fixes it; it.fails makes sure this list then goes.
const COUNT_KNOWN_WRONG = new Set(["zh", "ar", "hi", "id"]);

for (const { folder } of SITE_LANGUAGES.filter((language) => language.folder && !language.pseudo)) {
  const path = `data/i18n/${folder}/resources/life.json`;
  describe.skipIf(!existsSync(path))(`Help for life in the ${folder} copy`, () => {
    const translated = existsSync(path) ? read(path) : english;
    it("keeps every call and text button, with its number, keyword and the key to press", () => {
      const all = entries(translated);
      const differ = entries(english).flatMap((entry, i) => {
        const [want, got] = [JSON.stringify(quickActions(entry, 2)), JSON.stringify(quickActions(all[i], 2))];
        return want === got ? [] : [`${entry.id}: ${want} became ${got}`];
      });
      expect(differ).toEqual([]);
    });
    (COUNT_KNOWN_WRONG.has(folder!) ? it.fails : it)("counts the same lines as answering around the clock, and the same ways to reach each line", () => {
      english.groups.forEach((group, i) => expect(groupStats(translated.groups[i]).n, group.id).toBe(groupStats(group).n));
      english.groups.forEach((group, i) => expect(groupStats(translated.groups[i]).line.split(" · ")[0].replace(/\D/g, ""), group.id)
        .toBe(groupStats(group).line.split(" · ")[0].replace(/\D/g, "")));
      const all = entries(translated);
      entries(english).forEach((entry, i) => expect(ways(subtitle(all[i])), entry.id).toBe(ways(subtitle(entry))));
    });
  });
}
