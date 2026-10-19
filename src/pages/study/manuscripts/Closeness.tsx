// "How close" (approved mock-up: js/closeness.js): for each New Testament book, when it was written (a wide, approximate
// editorial range) and the oldest copy in the open data that holds it, with the years between. Pointing at a book names
// the copy and the next oldest on the line below; choosing it opens the copy's record.
import { useMemo, useState, type CSSProperties } from "react";
import type { MsRecord } from "@/lib/manuscripts";
import { byDate, holderText, isDated, mid } from "./model";
import { useMs } from "./context";


const short = (r: MsRecord) => (r.g && /^P\d/.test(r.g) ? r.g : r.n.replace(/^Rylands Library Papyrus /, ""));
const shortBook = (name: string) => name.replace("Thessalonians", "Thess").replace("Corinthians", "Cor").replace("Philippians", "Phil")
  .replace("Colossians", "Col").replace("Ephesians", "Eph").replace("Galatians", "Gal").replace("Revelation", "Rev");
const BASE = "Point at a book to read its oldest copy here; choose it to open the record.";

export function Closeness() {
  const { index, openRecord } = useMs();
  const list = useMemo(() => Object.entries(index.data.written).map(([b, [a, z]]) => {
    const book = index.data.books[Number(b)];
    const copies = index.data.records.filter((r) => isDated(r) && !r.lect && r.b?.includes(Number(b))).sort(byDate) as (MsRecord & { e: number; l: number })[];
    const first = copies[0];
    return { b: Number(b), book, a, z, copies, first, gap: first ? Math.max(0, Math.round((mid(first) - (a + z) / 2) / 5) * 5) : null };
  }), [index]);
  type Row = (typeof list)[number];
  const end = useMemo(() => Math.ceil(Math.max(...list.map((x) => x.first?.l ?? 0), 200) / 50) * 50, [list]);
  const pos = (y: number) => `${((y / end) * 100).toFixed(2)}%`;
  const [order, setOrder] = useState<"bible" | "gap">("bible");
  const [pointed, setPointed] = useState<Row | null>(null);
  const shown = useMemo(() => [...list].sort((p, q) => (order === "gap" ? (p.gap ?? 1e9) - (q.gap ?? 1e9) || p.b - q.b : p.b - q.b)), [list, order]);

  const say = (x: Row | null) => {
    if (!x?.first) return BASE;
    const f = x.first, next = x.copies.slice(1, 4).map((r) => `${short(r)} (${r.d})`), held = holderText(index, f);
    return <><b>{x.book.name}</b> · written about {x.a}–{x.z} · oldest copy here: <b>{f.n}</b>, {f.d}{held ? `, ${held}` : ""}{x.gap ? ` · about ${x.gap} years after the middle of the writing range` : ""}{next.length ? ` · then ${next.join(", ")}` : ""}</>;
  };
  const row = (x: Row) => {
    const f = x.first;
    return <li key={x.b}><button type="button" className="cl-row" disabled={!f} data-open={f?.i} style={{ "--tone": `var(--${x.book.sec})` } as CSSProperties}
      onPointerOver={() => setPointed(x)} onFocus={() => setPointed(x)} onClick={(e) => { if (f) openRecord(f.i, e.currentTarget); }}>
      <span className="cl-name"><span className="cl-full">{x.book.name}</span><span className="cl-short">{shortBook(x.book.name)}</span></span>
      <span className="cl-track"><i className="cl-w" style={{ left: pos(x.a), width: pos(x.z - x.a) }} />
        {f && <><i className="cl-link" style={{ left: pos(x.z), width: pos(Math.max(0, mid(f) - x.z)) }} /><i className="cl-r" style={{ left: pos(f.e), width: pos(Math.max(0, f.l - f.e)) }} />
          <i className="cl-c" style={{ left: pos(mid(f)) }} /><em style={{ left: pos(mid(f)) }}>{short(f)}</em></>}</span>
      <span className="cl-gap">{f ? (x.gap ? `≈ ${x.gap} yrs` : "overlaps") : "no dated copy"}</span></button></li>;
  };

  return <>
    <div className="cl-top"><div className="cl-key"><span><i className="cl-k-w" />Written (approximate)</span><span><i className="cl-k-c" />Oldest copy, with the range of its date</span></div>
      <div className="ct-sort" role="radiogroup" aria-label="Order">
        <button type="button" role="radio" aria-checked={order === "bible"} onClick={() => setOrder("bible")}>Bible order</button>
        <button type="button" role="radio" aria-checked={order === "gap"} onClick={() => setOrder("gap")}>Closest first</button></div></div>
    <div className="cl-axis" aria-hidden="true">{Array.from({ length: end / 50 + 1 }, (_, i) => <span key={i} style={{ left: pos(i * 50) }}>{i === 0 ? "AD 1" : i * 50}</span>)}</div>
    <ol className="cl" onPointerLeave={() => setPointed(null)}>{shown.map(row)}</ol>
    <p className="ms-say cl-say" aria-live="polite">{say(pointed)}</p>
  </>;
}
