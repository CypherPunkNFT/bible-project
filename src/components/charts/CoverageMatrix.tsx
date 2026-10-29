import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { groupOf, VERSION_GROUPS } from "@/lib/languages";
import { sectionColor } from "@/lib/sections";

/** Which books each edition includes. A page that filters by version group itself passes `group`, and the chart's own
 *  group menu goes. `bookStrip` swaps the "Inspect a book" menu for a row of grey squares over the columns: hovering
 *  one shows a bubble above it with the book and how many of these versions hold it, choosing one inspects it, choosing
 *  it again, or clicking anywhere outside the chart, clears it. `plain` leaves out the closing note under the table. */
export function CoverageMatrix({ group: shared, bookStrip = false, plain = false }: { group?: string; bookStrip?: boolean; plain?: boolean } = {}) {
  const catalog = useCatalog();
  const [hover, setHover] = useState("");
  const [own, setGroup] = useState("");
  const group = shared ?? own;
  const [selected, setSelected] = useState("");
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!bookStrip || !selected) return;
    const clearOutside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setSelected(""); };
    document.addEventListener("pointerdown", clearOutside);
    return () => document.removeEventListener("pointerdown", clearOutside);
  }, [bookStrip, selected]);
  const books = useMemo(() => catalog.books.filter((b) => catalog.translations.some((t) => t.books[b.code])), [catalog]);
  const versions = useMemo(() => catalog.translations.filter((t) => !group || groupOf(t.lang).id === group), [catalog.translations, group]);
  // Hovering changes the description, not the thousands of cells in the table.
  const table = useMemo(() => <table className="coverage-table"><caption className="sr-only">Books included in each Bible version. Filled squares indicate an included book.</caption>
    {bookStrip && <thead><tr><th scope="col"><span className="sr-only">Inspect a book</span></th>
      {books.map((b) => <td key={b.code} className="coverage-book"><button type="button" data-tip={b.name + " · " + versions.filter((t) => t.books[b.code]).length + "/" + versions.length + " versions"} aria-label={"Inspect " + b.name} aria-pressed={selected === b.code}
        onClick={() => { setSelected((current) => (current === b.code ? "" : b.code)); setHover(""); }} /></td>)}<td /></tr></thead>}
    <tbody>
    {versions.map((t) => {
      const first = selected && t.books[selected] ? selected : Object.keys(t.books)[0];
      return <tr key={t.slug}><th scope="row"><Link to={"/read/" + t.slug + "/" + first + "/" + t.books[first][0]} title={t.name}>{t.abbr}</Link></th>
        {books.map((b) => {
          const has = !!t.books[b.code];
          return <td key={b.code} onMouseEnter={() => setHover(t.abbr + " — " + b.name + ": " + (has ? t.books[b.code].length + " chapters" : "not included"))}
            style={{ background: has ? sectionColor(b.section) : "transparent", opacity: selected && selected !== b.code ? .22 : 1, boxShadow: has ? undefined : "inset 0 0 0 1px var(--line)", outline: selected === b.code ? "1px solid var(--ink)" : undefined }}>
            <span className="sr-only">{b.name + (has ? " included" : " not included")}</span>
          </td>;
        })}<td className="coverage-count">{Object.keys(t.books).length}</td></tr>;
    })}
  </tbody></table>, [books, versions, selected, bookStrip]);
  const selectedName = books.find((b) => b.code === selected)?.name;

  return <div ref={root}>
    {/* Only when it has a menu to show: a page that passes both `group` and `bookStrip` needs neither. */}
    {(shared === undefined || !bookStrip) && <div className="chart-controls">
      {shared === undefined && <label>Versions<select value={group} onChange={(event) => { setGroup(event.target.value); setHover(""); }}><option value="">All groups</option>{VERSION_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</select></label>}
      {!bookStrip && <label>Inspect a book<select value={selected} onChange={(event) => { setSelected(event.target.value); setHover(""); }}><option value="">All books</option>{books.map((b) => <option value={b.code} key={b.code}>{b.name}</option>)}</select></label>}
    </div>}
    <p className="chart-live-detail" aria-live="polite">{hover || (selected ? selectedName + " is included in " + versions.filter((t) => t.books[selected]).length + " of these " + versions.length + " versions." : "Filled = included. Hover to inspect a square, or choose a book " + (bookStrip ? "from the grey squares along the top." : "above."))}</p>
    <div className={"slim-scroll relative overflow-x-auto pb-3" + (bookStrip ? " pt-9" : "")} tabIndex={0} role="region" aria-label="Version coverage table; scroll horizontally to see more books" onMouseLeave={() => setHover("")}>{table}</div>
    {!plain && <p className="chart-hint mt-3">Books run from Genesis to Revelation, followed by the Apocrypha. The total at right is the number of books in that version. Select a version’s abbreviation to start reading.</p>}
  </div>;
}
