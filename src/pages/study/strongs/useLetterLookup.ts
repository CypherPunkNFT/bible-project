// The verse lookup for one Greek number across the 21 letters. It reads what the Letters study's useWordVerses reads, but it
// reports failure: a chapter that does not load makes the answer "incomplete", never a shorter list or a false "none".
import { useEffect, useState } from "react";
import { ALL_LETTERS } from "@/components/letters/letter-hooks";
import { useCatalog } from "@/lib/catalog";
import { loadChapter } from "@/lib/data";
import type { Run } from "@/lib/types";

export type Found = { code: string; book: string; chapter: number; verse: number };
export type Lookup = { status: "idle" | "loading" | "timeout" } | { status: "incomplete"; failed: number } | { status: "ready"; verses: Found[] };

const TIMEOUT_MS = 20_000;

/** A run carrying this number, by the same rule as the Letters study's lookup. */
export function runHasNumber(run: Run, number: string): boolean {
  return Array.isArray(run) && run.length === 3 && run[2].split(/\s+/).some((s) => s === number || s.replace(/[a-z]$/, "") === number);
}

export function useLetterLookup(number: string | null, attempt: number): Lookup {
  const catalog = useCatalog();
  const [state, setState] = useState<{ key: string; lookup: Lookup } | null>(null);
  const key = `${number}:${attempt}`;
  useEffect(() => {
    if (!number) return;
    let live = true;
    const settle = (lookup: Lookup) => { if (live) setState({ key, lookup }); };
    const timer = setTimeout(() => settle({ status: "timeout" }), TIMEOUT_MS);
    const kjv = catalog.translations.find((t) => t.slug === "kjv");
    const reads = ALL_LETTERS.flatMap((code) => {
      const labels = kjv?.books[code] ?? [];
      const book = catalog.books.find((b) => b.code === code)?.name ?? code;
      return labels.map((label) => loadChapter("kjv", code, labels, label).then((chapter) => ({ code, book, chapter })));
    });
    void Promise.allSettled(reads).then((results) => {
      clearTimeout(timer);
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length || !reads.length) {
        console.error(`Strong's lookup: ${failed.length} of ${reads.length} chapters did not load for ${number}`, failed[0]);
        settle({ status: "incomplete", failed: failed.length });
        return;
      }
      const verses = results.flatMap((r) => r.status !== "fulfilled" ? [] : r.value.chapter.v
        .filter((v) => v.r.some((run) => runHasNumber(run, number)))
        .map((v) => ({ code: r.value.code, book: r.value.book, chapter: Number(r.value.chapter.c), verse: Number(v.n) })));
      settle({ status: "ready", verses });
    });
    return () => { live = false; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key covers number and attempt
  }, [key, catalog]);
  if (!number) return { status: "idle" };
  return state?.key === key ? state.lookup : { status: "loading" };
}
