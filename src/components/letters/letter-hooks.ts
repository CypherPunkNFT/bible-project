import { useEffect, useMemo, useState } from "react";
import { useCatalog } from "@/lib/catalog";
import { loadChapter, loadStats } from "@/lib/data";
import { bookByNum, formatRange, splitId } from "@/lib/refs";
import { useAsync } from "@/lib/useAsync";
import type { Span } from "@/data/letters/types";
import type { Run } from "@/lib/types";

/** The 21 letters, in canonical order. */
/** Each letter's group colour (the four pages' colours), for pickers that span all 21. */
export const LETTER_TONE = (code: string) => (["HEB"].includes(code) ? "gospels" : ["JAS", "1PE", "2PE", "JUD"].includes(code) ? "acts" : ["1JN", "2JN", "3JN"].includes(code) ? "revelation" : "epistles");
export const ALL_LETTERS = ["ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD"];

/**
 * Position of a verse inside its book (0 = the book's first verse), from the site's chapter lengths, so charts can
 * place verses along an axis. Returns undefined until stats.json has loaded.
 */
export function useVerseIndex(): ((id: number) => number) | undefined {
  const catalog = useCatalog();
  const stats = useAsync(loadStats, "stats");
  return useMemo(() => {
    if (stats.status !== "ready") return undefined;
    const starts = new Map<string, number[]>();
    for (const book of stats.value.books) {
      let total = 0;
      starts.set(book.code, book.chapters.map(([verses]) => { const at = total; total += verses; return at; }));
    }
    return (id: number) => {
      const { num, chapter, verse } = splitId(id);
      const before = starts.get(bookByNum(catalog, num)?.code ?? "")?.[chapter - 1] ?? 0;
      return before + verse - 1;
    };
  }, [stats, catalog]);
}

/** "Hebrews 11:4" style label for one span. */
export function useSpanLabel(): (span: Span) => string {
  const catalog = useCatalog();
  return (span) => formatRange(catalog, span[0], span[1]);
}

/**
 * Every verse in the given letters where a Greek word (Strong's number, e.g. "G2909") stands behind the KJV text,
 * read from the site's tagged KJV chapters. Undefined while loading.
 */
export function useWordVerses(codes: string[], strongs: string | null): Span[] | undefined {
  const catalog = useCatalog();
  const [found, setFound] = useState<{ key: string; spans: Span[] } | null>(null);
  const key = `${codes.join(",")}:${strongs ?? ""}`;
  useEffect(() => {
    if (!strongs) return;
    let live = true;
    const kjv = catalog.translations.find((t) => t.slug === "kjv");
    const tagged = (run: Run) => Array.isArray(run) && run.length === 3 && run[2].split(/\s+/).some((s) => s === strongs || s.replace(/[a-z]$/, "") === strongs);
    void Promise.all(codes.map(async (code) => {
      const num = catalog.books.find((b) => b.code === code)?.num ?? 0;
      const labels = kjv?.books[code] ?? [];
      const chapters = await Promise.all(labels.map((label) => loadChapter("kjv", code, labels, label).catch(() => null)));
      return chapters.flatMap((chapter) => chapter ? chapter.v.filter((v) => v.r.some(tagged)).map((v): Span => {
        const id = num * 1_000_000 + Number(chapter.c) * 1_000 + Number(v.n);
        return [id, id];
      }) : []);
    })).then((lists) => { if (live) setFound({ key, spans: lists.flat() }); });
    return () => { live = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- key covers codes and strongs
  }, [key, catalog]);
  return strongs && found?.key === key ? found.spans : undefined;
}

type KeepEvent = { key?: string; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; preventDefault: () => void };

/**
 * Every chart's pointer behaviour. Pointing at an item previews it; clicking keeps it until its ✕ is pressed (or
 * Escape). While one is kept, pointing at another only marks it (`peek`); the chart and its details stay on the kept one.
 * `T` must be stable across renders (an id, an index, or an object from props).
 */
export function useKeep<T>() {
  const [hover, setHover] = useState<T | null>(null);
  const [kept, setKept] = useState<T | null>(null);
  // Releasing clears the pointer too: the ✕ vanishes from under it, so no leave event would follow.
  const release = () => { setKept(null); setHover(null); };
  const bind = (item: T) => ({
    onMouseEnter: () => setHover(item),
    onMouseLeave: () => setHover(null),
    onClick: (e: KeepEvent) => { if (e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); setKept(item); },
    onKeyDown: (e: KeepEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setKept(item); }
      if (e.key === "Escape") release();
    },
  });
  const peek = (item: T) => kept !== null && hover === item && kept !== item;
  return { active: kept ?? hover, kept, release, bind, peek };
}
