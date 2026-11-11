// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import { useCatalog } from "@/lib/catalog";
import { useMemo, type CSSProperties } from "react";
export const fixed = (value: number) => value.toFixed(1);

export const tone = (section: string) => ({ "--tone": `var(--${section})` } as CSSProperties);

export function useBooks() {
  const catalog = useCatalog();
  return useMemo(() => {
    const bible = catalog.translations.find((item) => item.slug === "bsb");
    return catalog.books.flatMap((book) => { const chapters = bible?.books[book.code]?.length; return chapters ? [{ ...book, chapters }] : []; });
  }, [catalog]);
}
