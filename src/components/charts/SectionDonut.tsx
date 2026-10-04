import { arc, pie } from "d3-shape";
import { useState } from "react";
import { SECTIONS, sectionColor } from "@/lib/sections";
import type { SectionId, Stats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

/** Share of the Bible's words in each reading-chart section. */
export function SectionDonut({ stats }: { stats: Stats }) {
  const [hover, setHover] = useState<SectionId | null>(null);
  const [pinned, setPinned] = useState<SectionId | null>(null);
  const selected = pinned ?? hover;
  const rows = SECTIONS.filter((s) => s.id !== "apocrypha").map((s) => {
    const books = stats.books.filter((b) => b.section === s.id);
    return { ...s, words: books.reduce((sum, b) => sum + b.words, 0), books: books.length, chapters: books.reduce((sum, b) => sum + b.chapters.length, 0) };
  });
  const total = rows.reduce((s, r) => s + r.words, 0);
  const slices = pie<(typeof rows)[number]>().value((r) => r.words).sort(null).padAngle(0.012)(rows);
  const shape = arc<(typeof slices)[number]>().innerRadius(62).outerRadius(100).cornerRadius(3);
  const grow = arc<(typeof slices)[number]>().innerRadius(60).outerRadius(106).cornerRadius(3);
  const active = rows.find((r) => r.id === selected);

  return (
    <div className="section-overview">
      <svg viewBox="-110 -110 220 220" role="img" aria-label="Donut chart of words by section. Select a section in the list for its share.">
        {slices.map((slice) => (
          <path
            key={slice.data.id}
            d={(selected === slice.data.id ? grow : shape)(slice) ?? ""}
            fill={sectionColor(slice.data.id)}
            opacity={selected && selected !== slice.data.id ? 0.3 : 1}
            onMouseEnter={() => setHover(slice.data.id)}
            onMouseLeave={() => setHover(null)}
            onClick={() => setPinned((current) => current === slice.data.id ? null : slice.data.id)}
          />
        ))}
        <text textAnchor="middle" y={-4} className="fill-ink font-serif" fontSize={18} fontWeight={600}>
          {active ? `${((active.words / total) * 100).toFixed(1)}%` : formatNumber(total)}
        </text>
        <text textAnchor="middle" y={14} className="fill-muted" fontSize={9}>
          {active ? active.name : "words (KJV)"}
        </text>
      </svg>
      <ul className="section-breakdown">
        {rows.map((r) => (
          <li key={r.id}><button type="button" aria-pressed={pinned === r.id} onClick={() => setPinned((current) => current === r.id ? null : r.id)} onMouseEnter={() => setHover(r.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(r.id)} onBlur={() => setHover(null)}>
            <span className="h-3 w-3 rounded-full" style={{ background: sectionColor(r.id) }} />
            <span>
              <strong>{r.name}</strong><small>{r.books} books · {r.chapters} chapters · {formatNumber(r.words)} words</small>
            </span>
            <span className="section-share" style={{ color: sectionColor(r.id) }}>{((r.words / total) * 100).toFixed(1)}%</span>
          </button></li>
        ))}
      </ul>
    </div>
  );
}
