// The face of the Hymns page, one full screen (owner, 2026-10-18): the title, the three writers and a way in on the left;
// the organ pipes in two rows on the right; the figures in a row; and the slow row of hymn cards drifting
// by at the foot of the screen, each opening its own page. The row pauses under the pointer
// (approved mock-up: design/hymn-directions/collection/landing.js).
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AMAZING_GRACE, bookIndexOf, chapterOf, hymnHref, type HymnCollection, type HymnEntry } from "@/lib/hymns";
import { firstLine, formatNumber, groupsById, plural, tone } from "./model";
import { Pipes } from "./Pipes";

// Hymns still sung today, chosen by first line; each is shown only if the collection really holds it.
const KNOWN = ["Amazing grace", "When I survey the wondrous cross", "Our God, our help in ages past", "Joy to the world",
  "There is a fountain filled with blood", "God moves in a mysterious way", "Glorious things of thee are spoken",
  "How sweet the name of Jesus sounds", "Jesus shall reign", "Alas! and did my Saviour bleed", "There is a land of pure delight", "Begone unbelief"];
const plain = (text: string) => text.toLowerCase().replace(/[’']/g, "'");
// The three hands, with the hymn book each is chiefly known by here and its tone.
const WRITERS = [
  { name: "Isaac Watts", dates: "1674–1748", books: "Psalms Imitated, Hymns & Songs", tone: "--poetry" },
  { name: "John Newton", dates: "1725–1807", books: "Olney Hymns, 1779", tone: "--history" },
  { name: "William Cowper", dates: "1731–1800", books: "Olney Hymns, 1779", tone: "--prophets" },
];

export function Landing({ collection }: { collection: HymnCollection }) {
  const { hymns, counts, books } = collection;
  const groups = useMemo(() => groupsById(collection), [collection]);
  const psalms = books.findIndex((b) => b.code === "PSA");
  const psalmsSung = useMemo(() => new Set(hymns.filter((h) => h.v && bookIndexOf(h.v) === psalms).map((h) => chapterOf(h.v))).size, [hymns, psalms]);
  const booksSung = useMemo(() => new Set(hymns.filter((h) => h.v).map((h) => bookIndexOf(h.v))).size, [hymns]);
  const byWriter = useMemo(() => new Map(WRITERS.map((w) => [w.name, hymns.filter((h) => h.a === w.name).length])), [hymns]);
  const cards = useMemo(() => KNOWN.map((first) => hymns.find((h) => plain(h.t).startsWith(plain(first)))).filter((h): h is HymnEntry => Boolean(h)), [hymns]);

  // The second copy keeps the row continuous as it drifts; it is hidden from screen readers and the tab order.
  const card = (h: HymnEntry, copy: boolean) => {
    const g = groups.get(h.g);
    if (!g) throw new Error(`Hymns: "${h.id}" is filed under hymn book "${h.g}", which the collection does not list`);
    return <Link key={`${copy ? "b" : "a"}-${h.id}`} className="hc-card" to={hymnHref(h.id)} style={tone(g.tone)} aria-hidden={copy || undefined} tabIndex={copy ? -1 : undefined}>
      <span className="hc-kicker">{g.who} · {h.y}</span><span className="hc-first">{firstLine(h)}</span>
      <span className="hc-book">{g.id === "newton" || g.id === "cowper" ? "Olney Hymns" : g.label}</span></Link>;
  };

  return <>
    <div className="hc-intro">
      <div>
        <p className="hc-crumb"><Link to="/study">Study</Link><span>/</span><Link to="/study/theology?area=life">Living the Christian Life</Link><span>/</span>Hymns</p>
        <h1>Hymns<em>the faith, sung</em></h1>
        <p className="hc-lede">Two English hymn books, 1707 to 1779: Isaac Watts's psalms and hymns, and the <i>Olney Hymns</i> of John Newton and
          William Cowper. Every hymn whose words we hold opens on its own page, beside the Scripture it was written on.</p>
        <ul className="hc-writers" aria-label="The writers">
          {WRITERS.map((w) => <li key={w.name} style={tone(w.tone)}><span className="hc-w-name">{w.name}</span><span className="hc-w-dates">{w.dates}</span>
            <b>{plural(byWriter.get(w.name) ?? 0, "hymn")}</b><small>{w.books}</small></li>)}
        </ul>
        <Link className="hc-begin" to={hymnHref(AMAZING_GRACE)}>Begin with <i>Amazing Grace</i> and every verse its lines echo<span aria-hidden="true">→</span></Link>
      </div>
      <Pipes collection={collection} />
    </div>
    <dl className="hc-figures">
      <div><dt>Hymns</dt><dd>{formatNumber(counts.distinct)}</dd><small>words held, each once</small></div>
      <div><dt>On a chapter</dt><dd>{formatNumber(counts.withChapter)}</dd><small>the rest on a subject</small></div>
      <div><dt>Hymn books</dt><dd>4</dd><small>by Watts, Newton and Cowper</small></div>
      <div><dt>Psalms sung</dt><dd>{psalmsSung} <small>of 150</small></dd><small>by Watts above all</small></div>
      <div><dt>Books sung</dt><dd>{booksSung} <small>of {books.length}</small></dd><small>Genesis to Revelation</small></div>
      <div><dt>Years</dt><dd>1707–1779</dd><small>from Watts to the Olney Hymns</small></div>
    </dl>
    <div className="hc-row" aria-label="Hymns to begin with"><div className="hc-track">{cards.map((h) => card(h, false))}{cards.map((h) => card(h, true))}</div></div>
  </>;
}
