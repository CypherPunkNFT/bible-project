// /people_mockup/moses (local preview only): Moses's real page, with one section added after "The long memory":
// "Connected in Scripture", the strongest of what his verses join him to, and the way into his full connections page.
// The real page draws inside its own shadow root; the section is placed there once the page says it is ready
// (data-people-ready), so the page's own code is left as it is.
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCatalog } from "@/lib/catalog";
import { useCachedLoad } from "@/lib/people-pages";
import { loadPeople, loadPersonDetail } from "@/lib/study";
import MosesPage from "@/components/moses-page/MosesPage";
import { chapterName } from "./field-layout";
import { fieldHref, loadEntity, pageHref, type Entity } from "./graph-data";
import styles from "./moses-connected.css?inline";

const MOSES = "moses-exo-2-10";
const SHOWN = 6;

export default function MosesConnectedMockup() {
  const people = useCachedLoad("people", loadPeople);
  const detail = useCachedLoad(`person:${MOSES}`, () => loadPersonDetail(MOSES));
  const outer = useRef<HTMLDivElement>(null);
  const [slot, setSlot] = useState<HTMLElement>();
  const row = people.status === "ready" ? people.value.find((p) => p.id === MOSES) : undefined;
  // One person object for the page's life: a new one would make the Moses page draw itself again (and drop the section).
  const record = detail.status === "ready" ? detail.value : undefined;
  const person = useMemo(() => (row && record ? { ...row, ...record } : undefined), [row, record]);
  const loaded = Boolean(person);

  // Each time the page (re)draws, put the section back after the long-memory banner.
  useEffect(() => {
    const element = outer.current;
    if (!element) return;
    const place = () => {
      const shadow = element.querySelector<HTMLElement>("[data-people-ready]")?.shadowRoot;
      const banner = shadow?.querySelector(".mg-end-links");
      if (!shadow || !banner || shadow.querySelector(".cx-slot")) return;
      const next = document.createElement("div");
      next.className = "cx-slot";
      const style = document.createElement("style");
      style.textContent = styles;
      next.append(style);
      banner.after(next);
      setSlot(next);
    };
    const watch = new MutationObserver(place);
    watch.observe(element, { subtree: true, attributes: true, attributeFilter: ["data-people-ready"] });
    place();
    return () => watch.disconnect();
  }, [loaded]);

  if (people.status === "error" || detail.status === "error") return <p className="mx-auto max-w-7xl p-6">Moses’ page could not be loaded.</p>;
  if (!person) return <div className="min-h-[60vh] animate-pulse" role="status" aria-label="Loading Moses" />;
  return <div ref={outer}>
    <MosesPage person={person} />
    {slot?.isConnected && createPortal(<ConnectedSection />, slot)}
  </div>;
}

interface Column { kind: "p" | "l" | "t" | "x"; title: string; total: number; rows: { key: string; name: string; count: number; href: string }[] }

/** The strongest few of each kind; links are plain anchors, which the Moses page routes (carrying "back to Moses"). */
function ConnectedSection() {
  const catalog = useCatalog();
  const [moses, setMoses] = useState<Entity | null>();
  useEffect(() => {
    let live = true;
    loadEntity("p", MOSES).then((entity) => { if (live) setMoses(entity ?? null); })
      .catch((reason: unknown) => { console.error("Moses connections: data did not load", reason); if (live) setMoses(null); });
    return () => { live = false; };
  }, []);
  if (moses === undefined) return <section className="mx cx" aria-busy="true"><div className="wrap cx-wait" /></section>;
  if (moses === null) return null;

  const bookCode = (chapter: number) => catalog.books.find((b) => b.num === Math.floor(chapter / 1000))?.code ?? "GEN";
  // The topic named after him ("Moses") is himself, not a connection, so it is left out of the short list.
  const topics = moses.t.filter((t) => t[1] !== moses.n);
  const columns: Column[] = [
    { kind: "p", title: "People", total: moses.pN, rows: moses.p.map(([id, name, count]) => ({ key: id, name, count, href: pageHref("p", id) })) },
    { kind: "l", title: "Places", total: moses.lN, rows: moses.l.map(([id, name, count]) => ({ key: id, name, count, href: pageHref("l", id) })) },
    { kind: "t", title: "Topics", total: moses.tN, rows: topics.map(([id, name, count]) => ({ key: id, name, count, href: pageHref("t", id) })) },
    { kind: "x", title: "The New Testament, looking back", total: moses.xoN, rows: [...moses.xo].sort((a, b) => b[2] - a[2]).map(([chapter, , count]) => ({ key: String(chapter), name: chapterName(catalog, chapter), count, href: `/read/bsb/${bookCode(chapter)}/${chapter % 1000}` })) },
  ];
  columns.forEach((c) => c.rows.sort((a, b) => b.count - a.count));

  return <section className="mx cx" id="mg-connected" aria-labelledby="cx-title">
    <div className="wrap">
      <header className="mx-head"><div className="mx-section-label"><span className="mx-n">05</span><span className="mg-kick">Connected in Scripture</span></div>
        <h2 id="cx-title">What his verses <em>join him to</em></h2>
        <p>The {moses.v.toLocaleString()} verses that name Moses also name {moses.pN} other people, {moses.lN} places and {columns[2].total.toLocaleString()} topics, and {moses.xoN} New Testament chapters point back to them. The strongest of each, by the verses they share:</p>
      </header>
      <div className="cx-cols">{columns.map((c) => <div key={c.kind} className={`cx-col is-${c.kind}`}>
        <h3>{c.title} <small>{c.total.toLocaleString()}</small></h3>
        <ol>{c.rows.slice(0, SHOWN).map((r) => <li key={r.key}><a href={r.href}>{r.name}</a><span>{r.count.toLocaleString()}</span></li>)}</ol>
      </div>)}</div>
      <a className="cx-go" href={fieldHref("p", MOSES)}>
        <svg viewBox="0 0 200 200" aria-hidden="true" className="cx-art">
          {[34, 56, 76, 94].map((r) => <circle key={r} className="cx-ring" cx={100} cy={100} r={r} />)}
          {Array.from({ length: 28 }, (_, i) => { const r = [34, 56, 76, 94][i % 4]; const a = (i * 137.5 * Math.PI) / 180; return <circle key={i} className={`cx-dot is-${["p", "l", "t", "x"][i % 4]}`} cx={100 + Math.cos(a) * r} cy={100 + Math.sin(a) * r} r={3} />; })}
          <circle cx={100} cy={100} r={16} className="cx-core" />
        </svg>
        <span className="cx-go-text"><span className="mg-kick">All of it, in one picture</span><strong>See every connection</strong>
          <small>Family, people, places, topics and passages around Moses. Choose any of them to read the verses that join it to him.</small></span>
      </a>
      <p className="cx-source">Joined through shared verses in the site’s own people, places and topics, and OpenBible.info’s cross-references. Nothing here is written by AI.</p>
    </div>
  </section>;
}
