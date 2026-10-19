// Every manuscript, by kind (approved mock-up: js/kinds.js): the approved "crystals by kind" (large chips, one per kind,
// with its colour, glyph and count) filtering a searchable catalogue below, paged, in three orders. The list is two
// side-by-side tables on a sheet torn down both sides. Each line opens the full record.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { MsRecord } from "@/lib/manuscripts";
import { useMs } from "./context";
import { catalogueLead } from "./leads";
import { booksText, byDate, formatNumber, holderText, kindOf, KINDS, reducedMotion, sigla, type Kind } from "./model";
import { Glyph, Icon } from "./parts";

const normalise = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const GROUPS = ["Greek New Testament", "Greek Old Testament", "Hebrew Bible", "Early translations"];
const SORTS: [string, string][] = [["date", "Oldest first"], ["siglum", "By number"], ["name", "A–Z"]];

// The table sits on a sheet torn down both sides, like a leaf with pieces lost. Three tears take turns, in a loop: the tear
// on the right comes round to the left as its mirror while a new tear opens on the right. Every outline has the same
// number of points, so one eases into the next.
const DEPTH = 18, TEAR_EVERY = 6000;
const TEARS = (() => {
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const tear = () => Array.from({ length: 41 }, () => (rand() < 0.12 ? 10 + rand() * 8 : rand() * 7));
  const edges = [tear(), tear(), tear()];
  const top = Array.from({ length: 23 }, () => rand() * 1.6), bottom = Array.from({ length: 23 }, () => rand() * 1.6);
  return edges.map((_, i) => {
    const right = edges[(i + 1) % 3], left = edges[i].map((x) => DEPTH - x).reverse();
    const points = [`${left[40].toFixed(1)}px 0%`];
    top.forEach((r, k) => points.push(`${(((k + 1) / 24) * 100).toFixed(1)}% ${r.toFixed(1)}px`));
    right.forEach((x, k) => points.push(`calc(100% - ${x.toFixed(1)}px) ${(k * 2.5).toFixed(1)}%`));
    bottom.forEach((r, k) => points.push(`${(100 - ((k + 1) / 24) * 100).toFixed(1)}% calc(100% - ${r.toFixed(1)}px)`));
    left.forEach((x, k) => points.push(`${x.toFixed(1)}px ${(100 - k * 2.5).toFixed(1)}%`));
    return `polygon(${points.join(", ")})`;
  });
})();


export function Catalogue() {
  const { index, openRecord } = useMs();
  const pageSize = useRef(window.matchMedia("(max-width: 640px)").matches ? 12 : 30).current;
  const counts = useMemo(() => { const c = new Map<string, number>(); for (const r of index.data.records) c.set(r.k, (c.get(r.k) ?? 0) + 1); return c; }, [index]);
  const rows = useMemo(() => index.data.records.map((r) => ({ r, search: normalise([r.n, r.g, r.d, r.c, r.f, holderText(index, r), booksText(index, r)].filter(Boolean).join(" ")) })), [index]);
  const [kind, setKind] = useState(""), [query, setQuery] = useState(""), [sort, setSort] = useState("date"), [page, setPage] = useState(0), [tear, setTear] = useState(0);

  useEffect(() => {
    if (reducedMotion()) return;
    const timer = setInterval(() => setTear((t) => (t + 1) % TEARS.length), TEAR_EVERY);
    return () => clearInterval(timer);
  }, []);

  const found = useMemo(() => {
    const words = normalise(query).trim().split(/\s+/).filter(Boolean);
    const list = rows.filter((x) => (!kind || x.r.k === kind) && words.every((w) => x.search.includes(w)));
    if (sort === "name") return list.sort((a, b) => a.r.n.localeCompare(b.r.n, "en", { numeric: true }));
    const order = (r: MsRecord) => KINDS.findIndex((k) => k.key === r.k);
    if (sort === "siglum") return list.sort((a, b) => order(a.r) - order(b.r) || String(a.r.g ?? a.r.n).localeCompare(String(b.r.g ?? b.r.n), "en", { numeric: true }));
    return list.sort((a, b) => byDate(a.r, b.r));
  }, [rows, kind, query, sort]);
  const pages = Math.max(1, Math.ceil(found.length / pageSize)), current = Math.min(page, pages - 1);
  const shown = found.slice(current * pageSize, (current + 1) * pageSize), half = Math.ceil(shown.length / 2);
  const narrowed = Boolean(kind || query);
  const label = kind ? kindOf(kind).label.toLowerCase() : "records";

  const crystal = (k: Kind) => {
    const n = counts.get(k.key) ?? 0;
    return <button key={k.key} type="button" className="cr" aria-pressed={k.key === kind} disabled={!n} style={{ "--tone": `var(${k.tone})` } as CSSProperties}
      onClick={() => { setKind(kind === k.key ? "" : k.key); setPage(0); }}>
      <span className="cr-glyph"><Glyph name={k.glyph} size={22} /></span><span className="cr-text"><b>{k.label}</b><small>{n ? k.line : "none in the open data yet"}</small></span><em>{formatNumber(n)}</em></button>;
  };
  const item = ({ r }: { r: MsRecord }) => {
    const k = kindOf(r.k), where = r.h ? index.holderById.get(r.h[0])?.city ?? "" : r.f ?? "";
    return <li key={r.i}><button type="button" data-open={r.i} style={{ "--tone": `var(${k.tone})` } as CSSProperties} onClick={(e) => openRecord(r.i, e.currentTarget)}><i aria-hidden="true" />
      <span className="ct-sig">{sigla(r) || r.g || ""}</span><span className="ct-name">{r.n}</span>
      <span className="ct-date">{r.d ?? "undated"}</span><span className="ct-where" title={where}>{where}</span></button></li>;
  };
  const column = (n: number, list: typeof found) => <div className="ct-col" hidden={n === 1 && shown.length <= half}>
    <p className="ct-head" aria-hidden="true"><span /><span>No.</span><span>Manuscript</span><span>Date</span><span>Where</span></p><ol className="ct-list" data-col={n}>{list.map(item)}</ol></div>;

  return <div className={`ms-part ms-part-kinds${kind ? " ct-filtered" : ""}`}>
    <p className="ms-part-lead">{catalogueLead(index)}</p>
    <div className="cr-groups">{GROUPS.map((g) => <div key={g} className="cr-group"><p className="cr-group-name">{g}</p><div className="cr-list">{KINDS.filter((k) => k.group === g).map(crystal)}</div></div>)}</div>
    <div className="ct-bar">
      <div className="ct-left"><label className="ct-search"><Icon name="search" size={16} /><input type="search" aria-label="Search the manuscripts" placeholder="Name, number, library or book" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} /></label>
        <p className={`ct-count ct-pill${narrowed ? " is-narrowed" : ""}`} aria-live="polite"><span>{formatNumber(found.length)} {query ? "matching" : label}</span>
          {narrowed && <button type="button" className="ct-clear" aria-label="Show every record" onClick={() => { setKind(""); setQuery(""); setPage(0); }}><Icon name="x" size={13} /></button>}</p></div>
      <div className="ct-pager"><button type="button" className="ct-arrow" aria-label="Previous page" disabled={!current} onClick={() => setPage(current - 1)}><Icon name="arrowLeft" size={16} /></button>
        <p className="ct-page ct-pill" aria-live="polite"><span>Page</span><b>{formatNumber(current + 1)}</b><span>of</span><b>{formatNumber(pages)}</b></p>
        <button type="button" className="ct-arrow" aria-label="Next page" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}><Icon name="arrowRight" size={16} /></button></div>
      <div className="ct-sort" role="radiogroup" aria-label="Order">{SORTS.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={k === sort} onClick={() => setSort(k)}>{l}</button>)}</div>
    </div>
    <div className="ct-table">
      <div className="ct-sheet" style={{ "--torn": TEARS[tear] } as CSSProperties}><div className="ct-sheet-inner">
        {column(0, shown.slice(0, half))}<span className="ct-divider" aria-hidden="true" />{column(1, shown.slice(half))}
      </div></div>
    </div>
  </div>;
}
