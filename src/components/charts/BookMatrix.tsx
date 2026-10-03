import { useMemo, useState } from "react";
import { useCatalog } from "@/lib/catalog";
import { sectionColor } from "@/lib/sections";
import { formatNumber } from "@/lib/utils";

/** 66 x 66 grid: how many cross-references run from each book (row) to each book (column). */
export function BookMatrix({ pairs }: { pairs: [string, string, number][] }) {
  const catalog = useCatalog();
  const books = catalog.books.filter((b) => b.num <= 66);
  const index = useMemo(() => new Map(books.map((b, i) => [b.code, i])), [books]);
  const [hover, setHover] = useState<[number, number, number] | null>(null);
  const cells = useMemo(
    () => pairs.map(([a, b, n]) => [index.get(a) ?? -1, index.get(b) ?? -1, n] as [number, number, number]).filter(([a, b]) => a >= 0 && b >= 0),
    [pairs, index],
  );
  const max = Math.max(...cells.map((c) => c[2]));
  const size = 66;
  const pad = 2;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,560px)_1fr]">
      <svg viewBox={`-${pad} -${pad} ${size + pad} ${size + pad}`} className="w-full max-w-[560px]" role="img" aria-label="Heatmap of cross-references between every pair of books" onMouseLeave={() => setHover(null)}>
        {books.map((b, i) => (
          <g key={b.code}>
            <rect x={-pad} y={i} width={1.4} height={1} fill={sectionColor(b.section)} />
            <rect x={i} y={-pad} width={1} height={1.4} fill={sectionColor(b.section)} />
          </g>
        ))}
        {cells.map(([a, b, n]) => (
          <rect
            key={`${a}-${b}`}
            x={b}
            y={a}
            width={1}
            height={1}
            fill={sectionColor(books[a].section)}
            opacity={0.12 + 0.88 * Math.sqrt(n / max)}
            onMouseEnter={() => setHover([a, b, n])}
          />
        ))}
        {hover && <rect x={hover[1]} y={hover[0]} width={1} height={1} fill="none" stroke="currentColor" strokeWidth={0.25} />}
      </svg>
      <div className="text-sm lg:relative">
        <div className="flex flex-col lg:absolute lg:inset-0">
        {hover ? (
          <p className="rounded-lg bg-surface-2 p-3">
            <strong>{books[hover[0]].name}</strong> → <strong>{books[hover[1]].name}</strong>
            <br />
            {formatNumber(hover[2])} cross-references
          </p>
        ) : (
          <p className="text-muted">Rows are the book a cross-reference starts in, columns the book it points to (Genesis top-left, Revelation bottom-right). Darker = more. Point at a square.</p>
        )}
        <TopPairs pairs={cells} names={books.map((b) => b.name)} />
        </div>
      </div>
    </div>
  );
}

function TopPairs({ pairs, names }: { pairs: [number, number, number][]; names: string[] }) {
  const top = [...pairs].filter(([a, b]) => a !== b).sort((x, y) => y[2] - x[2]).slice(0, 100);
  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Most cross-referenced pairs of different books</h3>
      <ol className="slim-scroll max-h-80 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pe-2 lg:max-h-none">
        {top.map(([a, b, n]) => (
          <li key={`${a}-${b}`} className="flex justify-between gap-3 border-b border-line/60 py-1">
            <span>
              {names[a]} → {names[b]}
            </span>
            <span className="tabular-nums text-muted">{formatNumber(n)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
