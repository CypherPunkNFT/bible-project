import { ArrowRight, X } from "lucide-react";
import { useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import type { Hit } from "@/lib/search";
import { SECTIONS, sectionColor } from "@/lib/sections";
import type { BookInfo } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import "./word-distribution.css";

const plural = (n: number, one: string, many: string) => `${formatNumber(n)} ${n === 1 ? one : many}`;

/**
 * Where the matches fall: one bar per book, Genesis to Revelation, coloured by section. Bars grow in; pointing at one
 * names it; clicking one picks that book, which filters the verse list below and opens its chapters.
 */
export function WordDistribution({ books, hits, selected, onSelect, slug }: {
  books: BookInfo[]; hits: Hit[]; selected: string; onSelect: (code: string) => void; slug: string;
}) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const hit of hits) map.set(hit.code, (map.get(hit.code) ?? 0) + 1);
    return map;
  }, [hits]);
  const max = Math.max(1, ...counts.values());
  const [pointed, setPointed] = useState("");
  const focus = pointed || selected;
  const focusBook = books.find((b) => b.code === focus);
  const chosen = books.find((b) => b.code === selected);
  const chapters = useMemo(() => {
    const map = new Map<number, { count: number; verse: string }>();
    for (const hit of hits) if (hit.code === selected) {
      const entry = map.get(Number(hit.chapter));
      if (entry) entry.count++; else map.set(Number(hit.chapter), { count: 1, verse: hit.verse });
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [hits, selected]);
  const booksWithHits = counts.size;
  // Bars are a few pixels wide on a phone: a tap anywhere on the chart picks the nearest book with matches.
  const pickNearest = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("button")) return;
    const columns = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button.is-hit")];
    const distance = (el: HTMLElement) => { const box = el.getBoundingClientRect(); return Math.abs(box.left + box.width / 2 - event.clientX); };
    columns.sort((x, y) => distance(x) - distance(y))[0]?.click();
  };

  return (
    <figure className="word-dist mt-4 rounded-2xl border border-line bg-surface p-4">
      <p className="flex min-h-6 flex-wrap items-baseline justify-between gap-2 text-sm" aria-live="polite">
        {focusBook ? (
          <span><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: sectionColor(focusBook.section) }} aria-hidden /><strong className="font-serif text-base">{focusBook.name}</strong> <span className="text-muted">· {plural(counts.get(focusBook.code) ?? 0, "verse", "verses")}</span></span>
        ) : (
          <span className="text-muted">In {plural(booksWithHits, "book", "books")}. Point at a bar to name it; click one to see its verses.</span>
        )}
        {selected && <button type="button" onClick={() => onSelect("")} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"><X size={13} aria-hidden />Show every book</button>}
      </p>
      <div className="mt-1 flex h-32 items-end gap-px pt-5" role="group" aria-label="Matches per book, Genesis to Revelation" onMouseLeave={() => setPointed("")} onClick={pickNearest}>
        {books.map((b, i) => {
          const n = counts.get(b.code) ?? 0;
          const height = { height: `${n ? Math.max(6, (n / max) * 100) : 2}%` };
          const bar = { background: sectionColor(b.section), animationDelay: `${i * 7}ms` } as CSSProperties;
          if (!n) return <span key={b.code} className="word-dist-col" aria-hidden><span className="word-dist-stack" style={height}><span className="word-dist-bar opacity-20" style={bar} /></span></span>;
          const isSelected = b.code === selected;
          return (
            <button
              key={b.code}
              type="button"
              className={cn("word-dist-col is-hit", isSelected && "is-selected", selected && !isSelected && "is-dimmed")}
              aria-pressed={isSelected}
              aria-label={`${b.name}: ${plural(n, "verse", "verses")}`}
              onMouseEnter={() => setPointed(b.code)}
              onFocus={() => setPointed(b.code)}
              onBlur={() => setPointed("")}
              onClick={() => onSelect(isSelected ? "" : b.code)}
            >
              <span className="word-dist-stack" style={height}>
                <span className="word-dist-count" style={{ color: sectionColor(b.section) }}>{n}</span>
                <span className="word-dist-bar" style={bar} />
              </span>
            </button>
          );
        })}
      </div>
      {chosen && chapters.length > 0 && (
        <div className="word-dist-chapters mt-4 border-t border-line pt-3">
          <p className="text-xs text-muted">{chosen.name}: {plural(counts.get(chosen.code) ?? 0, "verse", "verses")} in {plural(chapters.length, "chapter", "chapters")}. Open one in the reader:</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {chapters.map(([chapter, { count, verse }], i) => (
              <li key={chapter} style={{ animationDelay: `${i * 25}ms` }}>
                <Link to={`/read/${slug}/${chosen.code}/${chapter}?v=${verse}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-page px-3 py-1 text-sm hover:border-current" style={{ color: sectionColor(chosen.section) }}>
                  <span className="text-ink">{chosen.name} {chapter}</span>{count > 1 && <span className="text-xs">×{count}</span>}<ArrowRight size={12} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <figcaption className="mt-3 flex flex-wrap justify-end gap-3 text-xs text-muted">
        {SECTIONS.filter((s) => books.some((b) => b.section === s.id)).map((s) => (
          <span key={s.id} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: sectionColor(s.id) }} /> {s.name}</span>
        ))}
      </figcaption>
    </figure>
  );
}
