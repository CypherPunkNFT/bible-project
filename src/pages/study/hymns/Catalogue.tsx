// 05 and 06 · Every hymn, two ways (approved mock-up: design/hymn-directions/collection/catalogue.js):
//   05 the card catalogue, as the Teachers page's "Every teacher, one place": search and filters on the left, a sort bar,
//      a scrolling grid of cards with the outside pill;
//   06 the list catalogue, as the Teachers page's "The texts we hold": a search and a select, two columns of first lines
//      that open in place, 24 to a page.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import { OutsideScroll } from "@/components/OutsideScroll";
import { bookIndexOf, chapterOf, hymnHref, metreName, type HymnCollection, type HymnEntry, type HymnGroup } from "@/lib/hymns";
import { SectionHead } from "@/pages/teachers/shared/Frame";
import { SECTION_LABEL } from "@/pages/teachers/preachers/bible/model";
import { firstLine, formatNumber, groupsById, tone } from "./model";
import "@/pages/teachers/shared/acquired.css";
import "./catalogue.css";

const normalise = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase();
const DISC: Record<string, string> = { psalms: "IW", hss: "IW", divine: "IW", newton: "JN", cowper: "WC" };
const SORTS = [["bible", "Bible order"], ["az", "A–Z"], ["book", "Hymn book"]] as const;
const SECTIONS: [string, string][] = [...Object.entries(SECTION_LABEL), ["none", "On a subject"]];
const METRES = ["Common Metre", "Long Metre", "Short Metre", "Other metres", "Not recorded"];
type Sort = (typeof SORTS)[number][0];
type FacetKey = "g" | "section" | "metre";
interface Row { h: HymnEntry; g: HymnGroup; section: string; metre: string; search: string }

function useRows(collection: HymnCollection): Row[] {
  return useMemo(() => {
    const groups = groupsById(collection);
    return collection.hymns.map((h) => {
      const g = groups.get(h.g);
      if (!g) throw new Error(`Hymns catalogue: "${h.id}" is filed under hymn book "${h.g}", which the collection does not list`);
      return { h, g, section: h.v ? collection.books[bookIndexOf(h.v)].section : "none", metre: metreName(h.m), search: normalise([h.t, h.s, h.r, g.label, g.who].join(" ")) };
    });
  }, [collection]);
}
const wordsOf = (query: string) => normalise(query).trim().split(/\s+/).filter(Boolean);
const valueOf = (row: Row, key: FacetKey) => (key === "g" ? row.g.id : row[key]);

export function Cards({ collection }: { collection: HymnCollection }) {
  const rows = useRows(collection);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("bible");
  const [filters, setFilters] = useState<Record<FacetKey, string[]>>({ g: [], section: [], metre: [] });
  const words = wordsOf(query);
  const matches = (r: Row, ignore?: FacetKey) => words.every((w) => r.search.includes(w))
    && (["g", "section", "metre"] as FacetKey[]).every((key) => key === ignore || !filters[key].length || filters[key].includes(valueOf(r, key)));
  const order = collection.groups.map((g) => g.id as string);
  const visible = rows.filter((r) => matches(r)).sort((a, b) => sort === "az" ? a.h.t.localeCompare(b.h.t)
    : sort === "book" ? order.indexOf(a.g.id) - order.indexOf(b.g.id) || a.h.t.localeCompare(b.h.t)
    : (a.h.v || 1e10) - (b.h.v || 1e10) || a.h.t.localeCompare(b.h.t));
  const toggle = (key: FacetKey, value: string) => setFilters((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }));
  const busy = query.trim() !== "" || Object.values(filters).some((v) => v.length);
  const facet = (key: FacetKey, title: string, options: [string, string, string][]) => <div className="pc-facet"><h3>{title}</h3><div className="pc-options">{options.map(([value, label, toneToken]) =>
    <button key={value} type="button" aria-pressed={filters[key].includes(value)} style={toneToken ? tone(toneToken) : undefined} onClick={() => toggle(key, value)}>
      {toneToken && <i />}<span>{label}</span><em>{rows.filter((r) => valueOf(r, key) === value && matches(r, key)).length}</em></button>)}</div></div>;

  return <div style={tone("--accent")}>
    <SectionHead num="05" kicker="The catalogue · cards" title={<>Every hymn, <em>one place</em></>}
      line="Search by first line, subject or passage, or narrow by hymn book, part of the Bible and metre. A card opens the hymn." />
    <div className="pc-layout">
      <aside className="pc-filters" aria-label="Filter the hymns">
        <div className="pc-filter-head"><span>Filter</span><button type="button" hidden={!busy} onClick={() => { setQuery(""); setFilters({ g: [], section: [], metre: [] }); }}>Clear all</button></div>
        <label className="pc-search"><Search size={16} strokeWidth={1.5} aria-hidden /><input type="search" aria-label="Search hymns" placeholder="First line, subject or passage" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        <div className="pc-facets">
          {facet("g", "Hymn book", collection.groups.map((g) => [g.id, g.short, g.tone]))}
          {facet("section", "Part of the Bible", SECTIONS.map(([k, l]) => [k, l, k === "none" ? "" : `--${k}`]))}
          {facet("metre", "Metre", METRES.map((m) => [m, m, ""]))}
        </div>
      </aside>
      <div className="pc-results">
        <div className="pc-toolbar"><p className="pc-result-count" aria-live="polite"><strong>{formatNumber(visible.length)}</strong> of {formatNumber(rows.length)} hymns</p>
          <div className="pc-sort" role="radiogroup" aria-label="Sort hymns"><span>Sort</span>{SORTS.map(([k, l]) =>
            <button key={k} type="button" role="radio" aria-checked={k === sort} onClick={() => setSort(k)}>{l}</button>)}</div></div>
        <OutsideScroll label="Hymn cards" className="pc-scroll" resetKey={`${query}|${sort}|${JSON.stringify(filters)}`}>
          <div className="pc-grid">
            {visible.slice(0, 240).map((r) => <article key={r.h.id} className="pc-card" style={tone(r.g.tone)}>
              <div className="pc-card-top"><span className="pc-mark" aria-hidden="true">{DISC[r.g.id]}</span><span className="pc-badge">{r.h.v ? r.h.r : "On a subject"}</span></div>
              <h3>{firstLine(r.h)}</h3><p className="pc-meta">{r.h.a} · {r.h.y}</p>
              <p className="pc-tags"><span>{r.g.short}</span><span>{r.metre}</span></p>
              <div className="pc-work"><small>{r.h.s ? "Subject" : "Hymn book"}</small><div><strong>{r.h.s || r.g.label}</strong></div></div>
              <Link className="pc-card-hit" to={hymnHref(r.h.id)} aria-label={`Open ${r.h.t}`} /></article>)}
            {visible.length === 0 && <div className="pc-empty"><p>No hymn matches these filters.</p></div>}
            {visible.length > 240 && <p className="pc-more">Showing the first 240 of {formatNumber(visible.length)}. Narrow the filters to see the rest.</p>}
          </div>
        </OutsideScroll>
      </div>
    </div>
  </div>;
}

const PAGE = 24;

export function List({ collection }: { collection: HymnCollection }) {
  const rows = useRows(collection);
  const sorted = useMemo(() => [...rows].sort((a, b) => a.h.t.localeCompare(b.h.t)), [rows]);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [page, setPage] = useState(0);
  const words = wordsOf(query);
  const found = sorted.filter((r) => (!group || r.g.id === group) && words.every((w) => r.search.includes(w)));
  const pages = Math.max(1, Math.ceil(found.length / PAGE));
  const current = Math.min(page, pages - 1);

  return <div style={tone("--accent")}>
    <SectionHead num="06" kicker="The catalogue · list" title={<>Every hymn, <em>by first line</em></>}
      line="The whole collection in first-line order, the way hymn books index themselves. Open a line to see its book, passage and metre." />
    <div className="acq-controls">
      <label>Find a hymn<input placeholder="First line, subject or passage" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} /></label>
      <label>Hymn book<select value={group} onChange={(e) => { setGroup(e.target.value); setPage(0); }}><option value="">All hymn books</option>
        {collection.groups.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select></label>
    </div>
    <p className="acq-caption">{query || group ? `${formatNumber(found.length)} of ${formatNumber(sorted.length)} hymns match` : `${formatNumber(sorted.length)} hymns`}, each listed once.</p>
    <div className="acq-contributors">
      {found.slice(current * PAGE, (current + 1) * PAGE).map((r) => {
        const book = r.h.v ? collection.books[bookIndexOf(r.h.v)] : null;
        return <details key={r.h.id} style={tone(r.g.tone)}><summary><strong>{firstLine(r.h)}</strong><span>{r.g.short} · {r.h.y}{r.h.v ? ` · ${r.h.r}` : ""}</span></summary>
          <p className="acq-caption">{r.g.label}, {r.h.a}, {r.h.y}. {r.h.s ? `Subject: ${r.h.s}. ` : ""}{r.h.v ? `Written on ${r.h.r}. ` : "Written on a subject rather than a passage. "}Metre: {r.h.m ? `${r.h.m.replace(/,/g, ".")} (${r.metre})` : "not recorded"}.</p>
          <p className="acq-links"><Link to={hymnHref(r.h.id)}>Open the hymn <ArrowRight size={13} strokeWidth={1.5} aria-hidden /></Link>
            {book && <Link to={`/read/kjv/${book.code}/${chapterOf(r.h.v)}`}>Read {r.h.r.split(":")[0]} <BookOpen size={13} strokeWidth={1.5} aria-hidden /></Link>}</p></details>;
      })}
      {found.length === 0 && <p className="acq-caption">No hymn matches.</p>}
    </div>
    <nav className="acq-pagination" aria-label="Hymn pages"><button type="button" disabled={!current} onClick={() => setPage(current - 1)}>Previous</button>
      <span>{current + 1} / {pages}</span><button type="button" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next</button></nav>
  </div>;
}
