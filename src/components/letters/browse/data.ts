/// <reference types="vite/client" /> // for import.meta.glob below
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Letter, LetterGroup, LettersOverview, Span } from "@/data/letters/types";

/** The four collections, as the Letters pages name them, and their data files in src/data/letters/. */
export type GroupKey = "paul" | "hebrews" | "general" | "john";
export const GROUP_KEYS: GroupKey[] = ["paul", "hebrews", "general", "john"];
const GROUP_FILE: Record<GroupKey, LetterGroup["id"]> = { paul: "paul-letters", hebrews: "hebrews", general: "general-letters", john: "john-letters" };
/** Each collection's colour, a section token from the site's reading-chart palette. */
export const GROUP_TONE: Record<GroupKey, string> = { paul: "epistles", hebrews: "gospels", general: "acts", john: "revelation" };
/** The letter each collection's "Inside" cards follow until another is chosen. */
const FIRST_LETTER: Record<GroupKey, string> = { paul: "ROM", hebrews: "HEB", general: "JAS", john: "1JN" };

/** What the "Across all twenty-one" pages need beyond the collection files (scripts/build-letters-browse.py). */
export interface Browse {
  christ: Record<string, { title: string; topics: { id: string; title: string; n: number; points: { text: string; refs: Span[] }[] }[] }>;
  topicsTop: { id: string; title: string; total: number; letters: Record<string, number> }[];
  greekWords: Record<string, number>;
  onlyHere: Record<string, { strongs: string; greek: string; count: number; refs: Span[] }[]>;
  grid: Record<string, number>; // "ROM|COL" → cross-references between the two, both directions
  gospels: Record<string, Record<string, number>>;
  gospelNames: Record<string, string>;
  translations: { slug: string; abbr: string; name: string; year?: number; lang: string; dir: string; verses: Record<string, string> }[];
}

export interface LettersData {
  groups: Record<GroupKey, LetterGroup>;
  overview: LettersOverview;
  browse: Browse;
  /** All twenty-one, in the Bible's order. */
  letters: Letter[];
  letter: (code: string) => Letter;
  groupOf: (code: string) => GroupKey;
}

const FILES = import.meta.glob<{ default: unknown }>("/src/data/letters/*.json");
const load = (name: string) => FILES[`/src/data/letters/${name}.json`]?.().then((m) => m.default);

/** The four collection files, the overview and the browse file, loaded together; null until they arrive. */
export function useLettersData(): LettersData | null {
  const [data, setData] = useState<LettersData | null>(null);
  useEffect(() => {
    let live = true;
    void Promise.all([...GROUP_KEYS.map((k) => load(GROUP_FILE[k])), load("overview"), load("browse")]).then((files) => {
      if (!live) return;
      const groups = Object.fromEntries(GROUP_KEYS.map((k, i) => [k, files[i] as LetterGroup])) as Record<GroupKey, LetterGroup>;
      const letters = GROUP_KEYS.flatMap((k) => groups[k].letters);
      const byCode = new Map(letters.map((l) => [l.code, l]));
      const keyOf = new Map(GROUP_KEYS.flatMap((k) => groups[k].letters.map((l) => [l.code, k] as const)));
      setData({
        groups, overview: files[4] as LettersOverview, browse: files[5] as Browse, letters,
        letter: (code) => byCode.get(code) ?? letters[0],
        groupOf: (code) => keyOf.get(code) ?? "paul",
      });
    }).catch((error) => console.error("letters: could not load the study data", error));
    return () => { live = false; };
  }, []);
  return data;
}

/**
 * The letter a collection's "Inside" cards follow: the page's ?letter= when it belongs to that collection, else the
 * collection's first. Choosing one keeps the reader on the same page (only the search changes).
 */
export function useChosenLetter(data: LettersData, key: GroupKey): [Letter, (code: string) => void] {
  const [params, setParams] = useSearchParams();
  const asked = params.get("letter");
  const code = asked && data.groupOf(asked) === key ? asked : FIRST_LETTER[key];
  const choose = (next: string) => setParams((p) => { const q = new URLSearchParams(p); q.set("letter", next); return q; }, { replace: true, preventScrollReset: true });
  return [data.letter(code), choose];
}

export const toneOfLetter = (data: LettersData, code: string) => GROUP_TONE[data.groupOf(code)];
