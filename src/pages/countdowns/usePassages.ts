// A day's passages with their Berean words, loaded as the sympathy and life-event pages load theirs: the site's own verse
// functions, always the Berean ("bsb") whatever language the site is shown in, then the life-event passage helpers.
import { useState } from "react";
import type { LifeEventPassage } from "@/data/life-events";
import { useCatalog } from "@/lib/catalog";
import { bookByNum } from "@/lib/refs";
import type { Catalog } from "@/lib/types";
import { useAsync, type AsyncState } from "@/lib/useAsync";
import { resolveRange } from "@/lib/verses";
import { assemblePassage, passageReference, readHref, type ShownPassage } from "@/pages/life-events/passage";

const BIBLE = "bsb";

export async function showPassage(catalog: Catalog, passage: LifeEventPassage, key: string): Promise<ShownPassage> {
  const { verses } = await resolveRange(catalog, passage.from, passage.to ?? passage.from, BIBLE);
  const words = new Map(verses.map((verse) => [verse.id, verse.text]));
  const text = assemblePassage(passage, (id) => words.get(id) ?? null);
  const book = bookByNum(catalog, Math.floor(passage.from / 1_000_000));
  if (!book) throw new Error(`countdowns: no book ${Math.floor(passage.from / 1_000_000)} in the catalogue (passage ${key})`);
  return { key, passage, reference: passageReference(passage, () => book.name), text, readHref: readHref(passage, book.code) };
}

/** `name` tells lists apart in the async cache, e.g. "advent:dec-12". */
export function useCountdownPassages(name: string, passages: LifeEventPassage[]): { state: AsyncState<ShownPassage[]>; retry: () => void } {
  const catalog = useCatalog();
  const [attempt, setAttempt] = useState(0);
  const state = useAsync(() => Promise.all(passages.map((passage, index) => showPassage(catalog, passage, `${name}:${index}`))), `countdowns:${name}:${attempt}`);
  return { state, retry: () => setAttempt((value) => value + 1) };
}

/** A passage's reference from the catalogue alone, with no verse text fetched: for plans and calendars. */
export function useReference(): (passage: LifeEventPassage) => string {
  const catalog = useCatalog();
  return (passage) => passageReference(passage, (book) => bookByNum(catalog, book)?.name ?? `Book ${book}`);
}
