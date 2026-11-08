// A pack's passages with their Berean words, loaded through the site's own verse functions. Always the Berean ("bsb"),
// whatever language the site is shown in: those functions would otherwise use the language's own Bible (design 7.1).
import { useState } from "react";
import type { LifeEvent } from "@/data/life-events";
import { useCatalog } from "@/lib/catalog";
import { bookByNum } from "@/lib/refs";
import { useAsync, type AsyncState } from "@/lib/useAsync";
import { resolveRange } from "@/lib/verses";
import { assemblePassage, passageReference, passagesInOrder, readHref, type ShownPassage } from "./passage";

export const BIBLE = "bsb";

export function usePackPassages(event: LifeEvent): { state: AsyncState<ShownPassage[]>; retry: () => void } {
  const catalog = useCatalog();
  const [attempt, setAttempt] = useState(0);
  const state = useAsync(async () => {
    const ordered = passagesInOrder(event);
    return Promise.all(ordered.map(async (passage, index) => {
      const { verses } = await resolveRange(catalog, passage.from, passage.to ?? passage.from, BIBLE);
      const words = new Map(verses.map((verse) => [verse.id, verse.text]));
      const text = assemblePassage(passage, (id) => words.get(id) ?? null);
      const book = bookByNum(catalog, Math.floor(passage.from / 1_000_000));
      if (!book) throw new Error(`life-events: no book ${Math.floor(passage.from / 1_000_000)} in the catalogue`);
      const reference = passageReference(passage, () => book.name);
      return { key: `${index}-${passage.from}`, passage, reference, text, readHref: readHref(passage, book.code) } satisfies ShownPassage;
    }));
  }, `life-events:${event.slug}:${attempt}`);
  return { state, retry: () => setAttempt((value) => value + 1) };
}
