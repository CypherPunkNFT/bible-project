// The face of the Hymns page: the big plain-type intro with four quiet figures, then a slow row of hymn cards drifting
// by (the best-known hymns in the collection), each opening its own page. The row pauses under the pointer
// (approved mock-up: design/hymn-directions/collection/landing.js).
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { bookIndexOf, chapterOf, hymnHref, type HymnCollection, type HymnEntry } from "@/lib/hymns";
import { firstLine, formatNumber, groupsById, tone } from "./model";

// Hymns still sung today, chosen by first line; each is shown only if the collection really holds it.
const KNOWN = ["Amazing grace", "When I survey the wondrous cross", "Our God, our help in ages past", "Joy to the world",
  "There is a fountain filled with blood", "God moves in a mysterious way", "Glorious things of thee are spoken",
  "How sweet the name of Jesus sounds", "Jesus shall reign", "Alas! and did my Saviour bleed", "There is a land of pure delight", "Begone unbelief"];
const plain = (text: string) => text.toLowerCase().replace(/[’']/g, "'");

export function Landing({ collection }: { collection: HymnCollection }) {
  const { hymns, counts, books } = collection;
  const groups = useMemo(() => groupsById(collection), [collection]);
  const psalms = books.findIndex((b) => b.code === "PSA");
  const psalmsSung = useMemo(() => new Set(hymns.filter((h) => h.v && bookIndexOf(h.v) === psalms).map((h) => chapterOf(h.v))).size, [hymns, psalms]);
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
      </div>
      <dl className="hc-figures">
        <div><dt>Hymns</dt><dd>{formatNumber(counts.distinct)}</dd><small>words held, each once</small></div>
        <div><dt>On a chapter</dt><dd>{formatNumber(counts.withChapter)}</dd><small>the rest on a subject</small></div>
        <div><dt>Hymn books</dt><dd>4</dd><small>by Watts, Newton and Cowper</small></div>
        <div><dt>Psalms sung</dt><dd>{psalmsSung} <small>of 150</small></dd><small>by Watts above all</small></div>
      </dl>
    </div>
    <div className="hc-row" aria-label="Hymns to begin with"><div className="hc-track">{cards.map((h) => card(h, false))}{cards.map((h) => card(h, true))}</div></div>
  </>;
}
