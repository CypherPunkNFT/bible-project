// Verses for the converter: a reference and a reader link from the catalogue alone, and an example's Berean words loaded
// on demand as the countdowns load theirs (src/pages/countdowns/usePassages.ts): always the Berean ("bsb") whatever
// language the site is shown in, with a retry count in the cache key. A verse the Berean lacks comes back empty, and
// the page then shows the reference and its link alone.
import { useState } from "react";
import { useCatalog } from "@/lib/catalog";
import { bookByNum, splitId } from "@/lib/refs";
import type { Catalog } from "@/lib/types";
import { useAsync, type AsyncState } from "@/lib/useAsync";
import { resolveRange } from "@/lib/verses";

const BIBLE = "bsb";

/** "John 12:3–5", or "Genesis 6:15"; a range stays in one chapter here. */
export function verseReference(catalog: Catalog, from: number, to = from): string {
  const start = splitId(from);
  const end = splitId(to);
  const name = bookByNum(catalog, start.num)?.name ?? "";
  const last = end.verse === start.verse ? "" : `–${end.verse}`;
  return `${name} ${start.chapter}:${start.verse}${last}`;
}

/** The reader at that chapter with the verses lit, in the Berean. */
export function verseHref(catalog: Catalog, from: number, to = from): string {
  const start = splitId(from);
  const code = bookByNum(catalog, start.num)?.code ?? "GEN";
  return `/read/bsb/${code}/${start.chapter}?hl=${start.verse}-${splitId(to).verse}`;
}

/** The Berean words of verses `from` to `to`, joined; "" when the Berean has none of them. */
export async function loadVerseText(catalog: Catalog, from: number, to = from): Promise<string> {
  const { verses } = await resolveRange(catalog, from, to, BIBLE);
  return verses.map((verse) => verse.text).filter((text): text is string => Boolean(text)).join(" ");
}

export function useVerseText(from: number, to = from): { state: AsyncState<string>; retry: () => void } {
  const catalog = useCatalog();
  const [attempt, setAttempt] = useState(0);
  const state = useAsync(() => loadVerseText(catalog, from, to), `converter:${from}-${to}:${attempt}`);
  return { state, retry: () => setAttempt((value) => value + 1) };
}
