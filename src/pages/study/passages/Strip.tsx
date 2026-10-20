// A chapter's quiet strip (mock-up js/lane.js strip()): how many narrowly dated open records of the book survive from each
// century, first to sixteenth, with the study's own witnesses ticked on their century. Pointing at a bar names it; a
// ticked witness opens its record (through the page's [data-open] handler).
import { useMemo, useState, type CSSProperties } from "react";
import { useMs } from "../manuscripts/context";
import { formatNumber, mid, ordinal, plural } from "../manuscripts/model";
import { narrowlyDated, recordsFor } from "./model";

const century = (year: number) => Math.max(0, Math.floor((year - 1) / 100));

export function Strip({ book, keys }: { book: number; keys: readonly (readonly [string, string])[] }) {
  const { index } = useMs();
  const [pointed, setPointed] = useState<{ c: number; n: number } | null>(null);
  const { dated, buckets, max } = useMemo(() => {
    const list = recordsFor(index, book).filter(narrowlyDated), counts = new Map<number, number>();
    for (const r of list) counts.set(century(mid(r)), (counts.get(century(mid(r))) ?? 0) + 1);
    return { dated: list, buckets: counts, max: Math.max(...counts.values()) };
  }, [index, book]);
  const name = index.data.books[book].name;
  return <div className="st" onPointerLeave={() => setPointed(null)}>
    <div className="st-bars" role="group" aria-label={`Dated copies of ${name} per century`}>{Array.from({ length: 16 }, (_, i) => i + 1).map((c) => {
      const n = buckets.get(c) ?? 0;
      const here = keys.filter(([rec]) => { const r = index.byId.get(rec); return r && century(mid(r)) === c; });
      return <button key={c} type="button" className="st-bar" data-c={c} data-n={n} style={{ "--h": `${(Math.sqrt(n / max) * 100).toFixed(1)}%` } as CSSProperties}
        onPointerOver={() => setPointed({ c, n })}>
        <i />{here.map(([rec, label]) => <em key={rec} data-open={rec}>{label}</em>)}<span>{c === 1 || c % 4 === 0 ? `${ordinal(c + 1)} c.` : ""}</span>
      </button>;
    })}</div>
    <p className="st-say">{pointed
      ? <><b>{ordinal(pointed.c + 1)} century</b> · {plural(pointed.n, "dated copy", "dated copies")}</>
      : `${formatNumber(dated.length)} dated open records hold ${name}. Point at a century.`}</p>
  </div>;
}
