// The Berean words of the passages on screen (design 8, 9). References and links come straight from the data and the
// catalogue, so they show at once; only the words are fetched, a passage at a time, and kept in a map that only grows:
// a passage already loaded is never fetched again, so reordering the list or coming back to an occasion loads nothing.
// One book that will not load leaves its passages marked as failed and the rest shown; Try again asks only for those.
// Always the Berean ("bsb"), whatever language the site is shown in.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { passageKey } from "@/data/sympathy";
import type { OccasionPassage } from "@/data/occasion-verses";
import { assemblePassage, passageReference, readHref } from "@/pages/life-events/passage";
import { useCatalog } from "@/lib/catalog";
import { bookByNum } from "@/lib/refs";
import type { Catalog } from "@/lib/types";
import { resolveRange } from "@/lib/verses";

export const BIBLE = "bsb";

export interface PassageLabel { key: string; reference: string; readHref: string }

/** A passage's key, its reference ("Ecclesiastes 4:12b") and the reader's address for it. */
export function labelOf(catalog: Catalog, passage: OccasionPassage): PassageLabel {
  const book = bookByNum(catalog, Math.floor(passage.from / 1_000_000));
  if (!book) throw new Error(`occasion-verses: no book ${Math.floor(passage.from / 1_000_000)} in the catalogue (passage ${passage.from})`);
  return { key: passageKey(passage), reference: passageReference(passage, () => book.name), readHref: readHref(passage, book.code) };
}

async function loadWords(catalog: Catalog, passage: OccasionPassage): Promise<string> {
  const { verses } = await resolveRange(catalog, passage.from, passage.to ?? passage.from, BIBLE);
  const words = new Map(verses.map((verse) => [verse.id, verse.text]));
  return assemblePassage(passage, (id) => words.get(id) ?? null);
}

export interface PassageWords {
  /** Key -> words, for every passage loaded so far. */
  words: ReadonlyMap<string, string>;
  /** Keys whose words could not be loaded. */
  failed: ReadonlySet<string>;
  retry: () => void;
}

export function usePassageWords(passages: readonly OccasionPassage[]): PassageWords {
  const catalog = useCatalog();
  const [words, setWords] = useState<ReadonlyMap<string, string>>(() => new Map());
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const [attempt, setAttempt] = useState(0);
  const asked = useRef(new Set<string>());
  // The passages to ask for, keyed on the set of keys (sorted), so a reorder asks for nothing.
  const wanted = useMemo(() => {
    const byKey = new Map(passages.map((passage) => [passageKey(passage), passage]));
    return [...byKey.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  }, [passages]);
  const wantedKey = wanted.map(([key]) => key).join(",");

  useEffect(() => {
    const missing = wanted.filter(([key]) => !asked.current.has(key));
    if (!missing.length) return;
    for (const [key] of missing) asked.current.add(key);
    void Promise.allSettled(missing.map(([, passage]) => loadWords(catalog, passage))).then((results) => {
      const loaded = new Map<string, string>();
      const lost = new Set<string>();
      results.forEach((result, index) => {
        const key = missing[index][0];
        if (result.status === "fulfilled") loaded.set(key, result.value);
        else {
          lost.add(key);
          asked.current.delete(key);
          console.warn(`occasion-verses: the words of ${key} could not be loaded`, result.reason);
        }
      });
      if (loaded.size) setWords((current) => new Map([...current, ...loaded]));
      setFailed((current) => {
        const next = new Set([...current].filter((key) => !loaded.has(key)));
        lost.forEach((key) => next.add(key));
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `wantedKey` names the set of passages; `attempt` asks again
  }, [wantedKey, attempt, catalog]);

  const retry = useCallback(() => { setFailed(new Set()); setAttempt((value) => value + 1); }, []);
  return { words, failed, retry };
}
