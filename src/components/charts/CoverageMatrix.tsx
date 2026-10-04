import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { groupOf, VERSION_GROUPS } from "@/lib/languages";
import { sectionColor } from "@/lib/sections";

export function CoverageMatrix() {
  const catalog = useCatalog();
  const [hover, setHover] = useState("");
  const [group, setGroup] = useState("");
  const [selected, setSelected] = useState("");
  const books = useMemo(() => catalog.books.filter((b) => catalog.translations.some((t) => t.books[b.code])), [catalog]);
  const versions = useMemo(() => catalog.translations.filter((t) => !group || groupOf(t.lang).id === group), [catalog.translations, group]);
  // Hovering changes the description, not the thousands of cells in the table.
  const table = useMemo(() => <table className="coverage-table"><caption className="sr-only">Books included in each Bible version. Filled squares indicate an included book.</caption><tbody>
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
  </tbody></table>, [books, versions, selected]);
  const selectedName = books.find((b) => b.code === selected)?.name;

  return <div>
    <div className="chart-controls">
      <label>Versions<select value={group} onChange={(event) => { setGroup(event.target.value); setHover(""); }}><option value="">All groups</option>{VERSION_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</select></label>
      <label>Inspect a book<select value={selected} onChange={(event) => { setSelected(event.target.value); setHover(""); }}><option value="">All books</option>{books.map((b) => <option value={b.code} key={b.code}>{b.name}</option>)}</select></label>
    </div>
    <p className="chart-live-detail" aria-live="polite">{hover || (selected ? selectedName + " is included in " + versions.filter((t) => t.books[selected]).length + " of these " + versions.length + " versions." : "Filled = included. Hover to inspect a square, or choose a book above.")}</p>
    <div className="slim-scroll relative overflow-x-auto pb-3" tabIndex={0} role="region" aria-label="Version coverage table; scroll horizontally to see more books" onMouseLeave={() => setHover("")}>{table}</div>
    <p className="chart-hint mt-3">Books run from Genesis to Revelation, followed by the Apocrypha. The total at right is the number of books in that version. Select a version’s abbreviation to start reading.</p>
  </div>;
}
