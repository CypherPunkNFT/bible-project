import { useMemo } from "react";
import { useCatalog } from "@/lib/catalog";
import { loadCrossRefs } from "@/lib/data";
import type { CrossRefBook, Translation } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";

/** Cross-reference counts for one chapter: [verse, count] by verse, and the chapter total (KJV numbering only). */
export function useChapterCrossRefs(translation: Translation, bookCode: string, chapter: string) {
  const catalog = useCatalog();
  const inCanon = (catalog.books.find((b) => b.code === bookCode)?.num ?? 99) <= 66;
  const usable = inCanon && translation.numbering === "english";
  const refs = useAsync<CrossRefBook>(
    () => (usable ? loadCrossRefs(bookCode, chapter).catch(() => ({})) : Promise.resolve({})),
    `xref:${bookCode}:${chapter}:${usable}`,
  );
  return useMemo(() => {
    if (refs.status !== "ready") return { usable, verses: [] as [number, number][], total: 0 };
    const prefix = `${chapter}:`;
    const verses = Object.entries(refs.value)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, list]) => [Number(key.slice(prefix.length)), list.length] as [number, number])
      .sort((a, b) => a[0] - b[0]);
    return { usable, verses, total: verses.reduce((sum, [, n]) => sum + n, 0) };
  }, [refs, chapter, usable]);
}
