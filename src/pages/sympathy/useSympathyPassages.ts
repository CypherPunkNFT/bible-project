// A list of sympathy passages with their Berean words, loaded the way the life-event loader does (design 2.4): the site's
// own verse functions, always the Berean ("bsb") whatever language the site is shown in, then the life-event helpers.
import { useState } from "react";
import { passageKey, type SympathyPassage } from "@/data/sympathy";
import { useCatalog } from "@/lib/catalog";
import { bookByNum } from "@/lib/refs";
import { useAsync, type AsyncState } from "@/lib/useAsync";
import { resolveRange } from "@/lib/verses";
import { assemblePassage, passageReference, readHref, type ShownPassage } from "@/pages/life-events/passage";
import type { Catalog } from "@/lib/types";

const BIBLE = "bsb";

/** A passage ready to show; `key` is its permanent passage key (design 5.5). */
export interface ShownSympathy extends ShownPassage {
  passage: SympathyPassage;
}

export async function showPassage(catalog: Catalog, passage: SympathyPassage): Promise<ShownSympathy> {
  const { verses } = await resolveRange(catalog, passage.from, passage.to ?? passage.from, BIBLE);
  const words = new Map(verses.map((verse) => [verse.id, verse.text]));
  const text = assemblePassage(passage, (id) => words.get(id) ?? null);
  const bookNumber = Math.floor(passage.from / 1_000_000);
  const book = bookByNum(catalog, bookNumber);
  if (!book) throw new Error(`sympathy: no book ${bookNumber} in the catalogue (passage ${passageKey(passage)})`);
  return { key: passageKey(passage), passage, reference: passageReference(passage, () => book.name), text, readHref: readHref(passage, book.code) };
}

/** `name` tells the page's lists apart in the async cache: the set slug, "funeral" or "card:<key>". */
export function useSympathyPassages(name: string, passages: SympathyPassage[]): { state: AsyncState<ShownSympathy[]>; retry: () => void } {
  const catalog = useCatalog();
  const [attempt, setAttempt] = useState(0);
  const state = useAsync(() => Promise.all(passages.map((passage) => showPassage(catalog, passage))), `sympathy:${name}:${attempt}`);
  return { state, retry: () => setAttempt((value) => value + 1) };
}
