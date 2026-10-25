// The Berean Standard Bible's words for the verses shown in the connections panels.
import { useEffect, useState } from "react";
import { loadPlain } from "@/lib/data";
import { bookByNum, splitId } from "@/lib/refs";
import type { Catalog } from "@/lib/types";

/** The Berean Standard Bible's words for each verse, loaded a book at a time. */
export function useVerseTexts(catalog: Catalog, verses: number[]): Record<number, string> {
  const [texts, setTexts] = useState<Record<number, string>>({});
  const wanted = verses.join(",");
  useEffect(() => {
    let live = true;
    const ids = wanted ? wanted.split(",").map(Number) : [];
    Promise.all(ids.map(async (id) => {
      const { num, chapter, verse } = splitId(id);
      const code = bookByNum(catalog, num)?.code;
      if (!code) return [id, ""] as const;
      const book = await loadPlain("bsb", code).catch((reason: unknown) => { console.error(`connections: BSB ${code} did not load`, reason); return {}; });
      return [id, (book as Record<string, string>)[`${chapter}:${verse}`] ?? ""] as const;
    })).then((pairs) => { if (live) setTexts(Object.fromEntries(pairs)); });
    return () => { live = false; };
  }, [catalog, wanted]);
  return texts;
}
