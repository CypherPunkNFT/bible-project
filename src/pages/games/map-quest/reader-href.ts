// The reader's address for a verse, shared by the answer card and the Scripture panel.
import { useCallback } from "react";
import { useCatalog } from "@/lib/catalog";
import { bookByNum, splitId } from "@/lib/refs";
import { useCurrentBible } from "@/lib/verses";

/** The reader's address for one verse, opening at it. */
export function useReaderHref(): (id: number) => string {
  const catalog = useCatalog();
  const bible = useCurrentBible();
  return useCallback((id: number) => {
    const { num, chapter, verse } = splitId(id);
    return `/read/${bible.slug}/${bookByNum(catalog, num)?.code ?? "GEN"}/${chapter}?v=${verse}`;
  }, [catalog, bible.slug]);
}
