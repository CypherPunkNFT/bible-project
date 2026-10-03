import { useState } from "react";
import { Link } from "react-router-dom";
import { sectionColor } from "@/lib/sections";
import type { Stats } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";

type Metric = "words" | "verses" | "chapters";
const METRICS: Metric[] = ["words", "verses", "chapters"];

/** Every book as a bar, in canonical order, coloured by section. */
export function BookSizes({ stats }: { stats: Stats }) {
  const [metric, setMetric] = useState<Metric>("words");
  const [apocrypha, setApocrypha] = useState(false);
  const books = stats.books.filter((b) => apocrypha || b.section !== "apocrypha");
  const value = (b: Stats["books"][number]) => (metric === "chapters" ? b.chapters.length : b[metric]);
  const max = Math.max(...books.map(value));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <div role="radiogroup" aria-label="Measure" className="inline-flex rounded-full bg-surface-2 p-0.5">
          {METRICS.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={metric === m}
              onClick={() => setMetric(m)}
              className={cn("rounded-full px-3 py-1 capitalize", metric === m ? "bg-ink text-page" : "text-muted hover:text-ink")}
            >
              {m}
            </button>
          ))}
        </div>
        <label className="ms-2 flex items-center gap-2 text-muted">
          <input type="checkbox" checked={apocrypha} onChange={(e) => setApocrypha(e.target.checked)} className="accent-[var(--apocrypha)]" /> Apocrypha
        </label>
      </div>
      <ol className="gap-x-8 sm:columns-2 [&>li]:mb-[3px] [&>li]:break-inside-avoid">
        {books.map((b) => (
          <li key={b.code}>
            <Link to={`/read/kjv/${b.code}/1`} className="group grid grid-cols-[7.5rem_1fr_4.5rem] items-center gap-2 text-xs">
              <span className="truncate text-right group-hover:text-accent">{b.name}</span>
              <span className="h-3.5 rounded-sm transition-all duration-500" style={{ width: `${Math.max(0.5, (value(b) / max) * 100)}%`, background: sectionColor(b.section) }} />
              <span className="tabular-nums text-muted">{formatNumber(value(b))}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
