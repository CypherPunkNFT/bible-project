import { useState } from "react";
import { Link } from "react-router-dom";
import { sectionColor } from "@/lib/sections";
import type { Stats } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import type { SectionFilter } from "./SectionGuide";

type Metric = "words" | "verses" | "chapters";
const METRICS: Metric[] = ["words", "verses", "chapters"];

/** Every book, with comparable scales and a choice of canonical or size order. */
export function BookSizes({ stats, section = "" }: { stats: Stats; section?: SectionFilter }) {
  const [metric, setMetric] = useState<Metric>("words");
  const [apocrypha, setApocrypha] = useState(false);
  const [order, setOrder] = useState("canon");
  const value = (b: Stats["books"][number]) => metric === "chapters" ? b.chapters.length : b[metric];
  const books = stats.books.filter((b) => (!section || b.section === section) && (apocrypha || b.section !== "apocrypha"));
  if (order === "longest") books.sort((a, b) => value(b) - value(a));
  const max = Math.max(1, ...books.map(value));
  const longest = books.reduce((a, b) => value(a) > value(b) ? a : b);

  return (
    <div>
      <div className="chart-controls">
        <div role="group" aria-label="Measure" className="inline-flex rounded-full bg-surface-2 p-0.5">
          {METRICS.map((m) => <button key={m} type="button" aria-pressed={metric === m} onClick={() => setMetric(m)}
            className={cn("rounded-full px-3 py-1.5 capitalize", metric === m ? "bg-ink text-page" : "text-muted hover:text-ink")}>{m}</button>)}
        </div>
        <label>Order<select aria-label="Order" value={order} onChange={(event) => setOrder(event.target.value)}><option value="canon">Bible order</option><option value="longest">Longest first</option></select></label>
        {!section && <label><input type="checkbox" checked={apocrypha} onChange={(event) => setApocrypha(event.target.checked)} className="accent-[var(--apocrypha)]" />Include Apocrypha</label>}
      </div>
      <div className="chart-live-detail"><strong>{longest.name}</strong><span>Longest by {metric} · {formatNumber(value(longest))} {metric}</span></div>
      <ol className="size-bars">{books.map((b) => <li key={b.code}>
        <Link to={"/read/kjv/" + b.code + "/1"} aria-label={b.name + ": " + formatNumber(value(b)) + " " + metric + ". Read this book."}>
          <span className="truncate text-right">{b.name}</span>
          <span className="size-bar-track"><span style={{ width: Math.max(.5, value(b) / max * 100) + "%", background: sectionColor(b.section) }} /></span>
          <span className="text-right tabular-nums text-muted">{formatNumber(value(b))}</span>
        </Link>
      </li>)}</ol>
    </div>
  );
}
