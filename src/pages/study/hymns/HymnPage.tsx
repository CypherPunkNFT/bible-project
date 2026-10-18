// /study/hymns/:id — one hymn. A hymn with a full study (Amazing Grace, the approved mock-up
// design/hymn-directions/a/) opens it; every other hymn opens a plain page of its words, its facts and its source.
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";
import { loadHymnCollection, loadHymnSong, loadHymnTexts } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";
import { AMAZING_GRACE, isHymnId, type HymnCollection, type HymnEntry, type HymnSong } from "@/lib/hymns";
import { PageStatus } from "@/pages/teachers/shared/Frame";
import { firstLine, groupsById, passageHref } from "./model";
import { Constellation } from "./song/Constellation";
import { Echoes } from "./song/Echoes";
import { BookRow, Found, Head, PlacedSquares } from "./song/Sections";
import { PassagePanel, ROMAN, Sources, type PanelContent } from "./song/parts";
import "./song/song.css";

function Crumb() {
  return <p className="hy-crumb"><Link to="/study">Study</Link><span>/</span><Link to="/study/theology?area=life">Living the Christian Life</Link><span>/</span><Link to="/study/hymns">Hymns</Link></p>;
}

function SongStudy({ song }: { song: HymnSong }) {
  const [panel, setPanel] = useState<PanelContent | null>(null);
  const [closedAt, setClosedAt] = useState(0);
  const close = useCallback(() => { setPanel(null); setClosedAt((n) => n + 1); }, []);
  const toConstellation = () => document.getElementById("constellation")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  return <div className="hy-song">
    <section className="hy-intro">
      <div>
        <Crumb />
        <h1>Amazing grace<em>how sweet the sound</em></h1>
        <p className="hy-lede">John Newton printed it in 1779 in <i>Olney Hymns</i>, the hymn book he made with William Cowper, under a verse
          from 1 Chronicles where David asks how God has brought him this far.</p>
        <div className="hp-actions"><button type="button" className="d-go" onClick={toConstellation}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="2.4" /><circle cx="12" cy="12" r="8.5" strokeDasharray="2 3" /><circle cx="12" cy="3.5" r="1.4" /><circle cx="19.4" cy="15.6" r="1.4" /><circle cx="4.6" cy="15.6" r="1.4" /></svg>
          See the constellation</button></div>
      </div>
      <dl className="hy-facts">
        <div><dt>Written by</dt><dd>{song.author}<small>{song.authorDates}</small></dd></div>
        <div><dt>Printed</dt><dd>{song.year}<small>{song.collection} · Book I, no. {song.number}</small></dd></div>
        <div><dt>Metre</dt><dd>{song.meterName}<small>{song.meter} · {song.stanzas.length} stanzas</small></dd></div>
        <div><dt>In hymnals</dt><dd>{song.hymnals.toLocaleString("en-GB")}<small>listed at Hymnary.org</small></dd></div>
      </dl>
    </section>
    <section className="hy-sec" id="hymn">
      <Head num="01" title={<>The hymn, <em>and the Scripture in it</em></>}>All six stanzas as Newton printed them. Beside the lines that echo a verse, the verse hymnal editors attach to the hymn.
        Hover a line or a verse to join them; click to read the passage. Below the hymn, the same links as a constellation.</Head>
      <Echoes song={song} open={setPanel} closedAt={closedAt} />
      <div className="d-among" id="constellation">
        <p className="d-among-k">Among the Scriptures</p>
        <p className="d-among-line">The six stanzas at the centre; around them, every book hymnal editors tie the hymn to, Old Testament on the left
          and New on the right, sized by how many of its passages they name. Choose a stanza or a book.</p>
        <Constellation song={song} open={setPanel} />
      </div>
    </section>
    <Found song={song} />
    <BookRow song={song} />
    <PlacedSquares song={song} open={setPanel} />
    <Sources song={song} />
    <PassagePanel content={panel} onClose={close} />
  </div>;
}

function PlainHymn({ collection, hymn }: { collection: HymnCollection; hymn: HymnEntry }) {
  const texts = useAsync(() => loadHymnTexts(hymn.g), `hymns/texts/${hymn.g}`);
  const group = groupsById(collection).get(hymn.g);
  if (texts.status !== "ready") return <PageStatus error={texts.status === "error" ? texts.error as Error : null} />;
  const words = texts.value[hymn.id];
  if (!words) return <NotAHymn />;
  const title = words.title && words.title !== hymn.t && words.title !== words.subject ? words.title : "";
  return <div className="hy-song hy-plain">
    <section className="hy-intro">
      <div>
        <Crumb />
        <h1>{firstLine(hymn)}{(title || words.subject) && <em>{title || words.subject}</em>}</h1>
        <p className="hy-lede">{group?.label ?? words.source.title}{words.book ? `, ${words.book}` : ""}{words.number ? `, no. ${words.number.replace(/^\d+:/, "")}` : ""}. {hymn.a}, {hymn.y}.</p>
        {hymn.v > 0 && <div className="hp-actions"><Link className="d-go" to={passageHref(collection.books, hymn)}><BookOpen size={16} strokeWidth={1.5} aria-hidden />Read {hymn.r}</Link></div>}
      </div>
      <dl className="hy-facts">
        <div><dt>Written by</dt><dd>{hymn.a}<small>{group?.who === hymn.a ? group.label : ""}</small></dd></div>
        <div><dt>Printed</dt><dd>{hymn.y}<small>{words.book || group?.short}</small></dd></div>
        <div><dt>Metre</dt><dd>{words.meter || (hymn.m ? hymn.m.replace(/,/g, ".") : "Not recorded")}<small>{words.stanzas.length} stanzas</small></dd></div>
        <div><dt>Written on</dt><dd>{hymn.r || "A subject"}<small>{words.refs.length > 1 ? `and ${words.refs.length - 1} more passages` : hymn.v ? "its main passage" : words.subject}</small></dd></div>
      </dl>
    </section>
    <section className="hy-sec">
      <Head num="01" title={<>The <em>hymn</em></>}>The words as {hymn.a.split(" ").pop()} printed them{words.refs.length ? `, on ${words.refs.join("; ")}` : ""}.</Head>
      <div className="ec ec-plain"><div className="stanzas">{words.stanzas.map((lines, s) => <div key={s} className="stanza"><span className="rn" aria-hidden="true">{ROMAN[s] ?? s + 1}</span>
        {lines.map((line, l) => <span key={l} className="line"><span className="t">{line}</span></span>)}</div>)}</div></div>
    </section>
    <details className="hy-sources"><summary>Source</summary><ul>
      <li><b>The hymn.</b> {words.source.title}{words.source.url && <> (<a href={words.source.url} target="_blank" rel="noreferrer">{words.source.url.replace("https://", "")}</a>)</>}. {words.source.licence}.</li></ul></details>
  </div>;
}

function NotAHymn() {
  return <div className="hy-song"><section className="hy-intro"><div><Crumb /><h1>Not a hymn on this site</h1>
    <p className="hy-lede">There is no hymn at this address. <Link to="/study/hymns"><ArrowLeft size={14} strokeWidth={1.5} aria-hidden /> Open the collection</Link> and choose one.</p></div></section></div>;
}

export default function HymnPage() {
  const { id = "" } = useParams();
  const valid = isHymnId(id);
  const collection = useAsync(loadHymnCollection, "hymns/collection");
  const song = useAsync(() => (id === AMAZING_GRACE ? loadHymnSong(id) : Promise.resolve(null)), `hymns/song/${id}`);
  const hymn = collection.status === "ready" ? collection.value.hymns.find((h) => h.id === id) : undefined;
  useEffect(() => {
    const old = document.title;
    document.title = `${hymn ? firstLine(hymn) : "A hymn"} · Hymns · Bible Project`;
    return () => { document.title = old; };
  }, [hymn]);
  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  if (!valid) return <NotAHymn />;
  if (collection.status !== "ready" || song.status === "loading") return <PageStatus error={collection.status === "error" ? collection.error as Error : null} />;
  if (!hymn) return <NotAHymn />;
  if (song.status === "ready" && song.value) return <SongStudy song={song.value} />;
  return <PlainHymn collection={collection.value} hymn={hymn} />;
}
