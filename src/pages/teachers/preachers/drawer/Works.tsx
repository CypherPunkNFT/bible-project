// The drawer's "what they wrote" parts: best-known works (each the library can open has a Read link), the genre bar,
// the 66-book strip, and a few titles from the library (ported from the mock-up's drawer.js).
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { PeopleData, Person } from "@/data/teachers/pages-types";
import { formatNumber } from "../../shared/people";
import { GENRE_TONE, cssVars, genreName } from "./helpers";

const ICON = { strokeWidth: 1.5, "aria-hidden": true } as const;

function ReadLink({ url }: { url: string }) {
  return <Link className="drw-read" to={url}>Read<ArrowUpRight size={13} {...ICON} /></Link>;
}

export function KnownWorks({ person }: { person: Person }) {
  return <ul className="drw-known">
    {person.known.map((k) => <li key={`${k.t}-${k.y}`}>
      <b>{k.y}</b>
      <span>{k.u ? <Link to={k.u}>{k.t}</Link> : k.t}</span>
      <span className="drw-tags">
        {k.inLibrary ? <em className="drw-in">In the library</em> : <em className="drw-out">Not in the library yet</em>}
        {k.u && <ReadLink url={k.u} />}
      </span>
    </li>)}
  </ul>;
}

export function GenreBar({ person }: { person: Person }) {
  const entries = Object.entries(person.genres).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return <p className="drw-empty">Nothing by {person.short} is catalogued in the library yet.</p>;
  const colour = (genre: string) => `var(${GENRE_TONE[genre] ?? "--muted"})`;
  return <>
    <div className="drw-gbar">
      {entries.map(([g, n]) => <i key={g} style={{ flex: `${n} 1 0`, background: colour(g) }} title={`${genreName(g)}: ${formatNumber(n)}`} />)}
    </div>
    <ul className="drw-glegend">
      {entries.map(([g, n]) => <li key={g}><i style={{ background: colour(g) }} />{genreName(g)} <b>{formatNumber(n)}</b></li>)}
    </ul>
  </>;
}

export function BookStrip({ data, person }: { data: PeopleData; person: Person }) {
  const max = Math.max(...person.books);
  if (!max) return <p className="drw-empty">None of {person.short}&apos;s works in the library is tied to a main Bible passage yet.</p>;
  const top = person.books.map((n, i) => [n, data.books[i]] as const).filter(([n]) => n).sort((a, b) => b[0] - a[0]);
  return <>
    <div className="drw-books" role="img" aria-label="Works by Bible book">
      {data.books.map((book, i) => {
        const n = person.books[i];
        return <i key={book.code} title={`${book.name}: ${n}`}
          style={{ ...cssVars({ "--h": String(n ? 0.14 + 0.86 * Math.sqrt(n / max) : 0.05) }), background: `var(--${book.section})`, opacity: n ? 1 : 0.35 }} />;
      })}
    </div>
    <div className="drw-books-ends"><span>Old Testament</span><span>New Testament</span></div>
    <p className="drw-note">{top.length} of 66 books. Most often: {top.slice(0, 3).map(([n, b]) => `${b.name} (${formatNumber(n)})`).join(", ")}. Bar height uses a square-root scale.</p>
  </>;
}

interface WorkRow { t: string; s: string; u: string | null }

function WorkList({ rows }: { rows: WorkRow[] }) {
  return <ul className="drw-worklist">
    {rows.map((w, i) => <li key={`${i}-${w.t}`}>
      {w.u ? <Link to={w.u}><span>{w.t}</span><small>{w.s}</small><ArrowUpRight size={14} {...ICON} /></Link>
        : <div><span>{w.t}</span><small>{w.s}</small></div>}
    </li>)}
  </ul>;
}

/** A few titles from the library (a title the library can open is a link), then works on passages spread across the Bible. */
export function FromLibrary({ person }: { person: Person }) {
  const urlOf = new Map<string, string>();
  for (const w of [...person.passages, ...person.sermons, ...person.known]) if (w.u) urlOf.set(w.t, w.u);
  const items: WorkRow[] = person.notable.length
    ? person.notable.map((w) => ({ t: w.t, s: genreName(w.g), u: urlOf.get(w.t) ?? null }))
    : person.sermons.map((s) => ({ t: s.t, s: s.r, u: s.u }));
  const withUrl = person.passages.filter((w) => w.u), want = Math.min(4, withUrl.length), picks: WorkRow[] = [];
  for (let i = 0; i < want; i++) {
    const w = withUrl[Math.floor(((i + 0.5) * withUrl.length) / want)];
    picks.push({ t: w.t, s: `${w.r} · ${genreName(w.g)}`, u: w.u });
  }
  return <>
    {person.acquiredId && <section><h3>Acquired texts</h3><p className="drw-note">{formatNumber(person.heldTexts)} held text representations · {formatNumber(person.readableTexts)} readable here. Editions and formats can overlap.</p><Link className="drw-read" to={`/teachers/works?author=${encodeURIComponent(person.acquiredId)}`}>Browse the full shelf →</Link></section>}
    {items.length > 0 && <section><h3>From the library</h3><WorkList rows={items.slice(0, 5)} /></section>}
    {picks.length > 0 && person.notable.length > 0 && <section><h3>Read them on a passage</h3><WorkList rows={picks} /></section>}
  </>;
}
