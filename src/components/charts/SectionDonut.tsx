import { arc, pie } from "d3-shape";
import { useState } from "react";
import { SECTIONS, sectionColor } from "@/lib/sections";
import type { SectionId, Stats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

/** Share of the Bible's words in each reading-chart section. */
export function SectionDonut({ stats }: { stats: Stats }) {
  const [hover, setHover] = useState<SectionId | null>(null);
  const rows = SECTIONS.filter((s) => s.id !== "apocrypha").map((s) => {
    const books = stats.books.filter((b) => b.section === s.id);
    return { ...s, words: books.reduce((sum, b) => sum + b.words, 0), books: books.length, chapters: books.reduce((sum, b) => sum + b.chapters.length, 0) };
  });
  const total = rows.reduce((s, r) => s + r.words, 0);
  const slices = pie<(typeof rows)[number]>().value((r) => r.words).sort(null).padAngle(0.012)(rows);
  const shape = arc<(typeof slices)[number]>().innerRadius(62).outerRadius(100).cornerRadius(3);
  const grow = arc<(typeof slices)[number]>().innerRadius(60).outerRadius(106).cornerRadius(3);
  const active = rows.find((r) => r.id === hover);

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[220px_1fr]">
      <svg viewBox="-110 -110 220 220" className="mx-auto w-full max-w-[240px]" role="img" aria-label="Donut chart of words by section">
        {slices.map((slice) => (
          <path
            key={slice.data.id}
            d={(hover === slice.data.id ? grow : shape)(slice) ?? ""}
            fill={sectionColor(slice.data.id)}
            opacity={hover && hover !== slice.data.id ? 0.4 : 1}
            onMouseEnter={() => setHover(slice.data.id)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        <text textAnchor="middle" y={-4} className="fill-ink font-serif" fontSize={18} fontWeight={600}>
          {active ? `${((active.words / total) * 100).toFixed(1)}%` : formatNumber(total)}
        </text>
        <text textAnchor="middle" y={14} className="fill-muted" fontSize={9}>
          {active ? active.name : "words (KJV)"}
        </text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {rows.map((r) => (
          <li key={r.id} onMouseEnter={() => setHover(r.id)} onMouseLeave={() => setHover(null)} className="grid grid-cols-[1rem_1fr_auto] items-center gap-2 rounded px-1 py-0.5 hover:bg-surface-2">
            <span className="h-3 w-3 rounded-full" style={{ background: sectionColor(r.id) }} />
            <span>
              <strong>{r.name}</strong> <span className="text-muted">· {r.books} books, {r.chapters} chapters</span>
            </span>
            <span className="tabular-nums text-muted">{((r.words / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
