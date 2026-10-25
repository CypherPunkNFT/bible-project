// /connections_mockup/:kind/:id (local preview only): one person, place or topic at the centre of its connections.
// A person's field is also their own page's sub-page (PersonConnectionsMockup.tsx), with a trail back to them.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCatalog } from "@/lib/catalog";
import { Constellation } from "./Constellation";
import { RING_NAME, chapterName, layoutPoints, type Ring } from "./field-layout";
import { Panel } from "./Panel";
import { KIND_NAME, fieldHref, isKind, loadEntity, loadGraphIndex, type Entity, type GraphIndex } from "./graph-data";
import "./connections.css";

type Scope = "other" | "all";
const FILTERS: (Ring | "all")[] = ["all", "fam", "p", "l", "t", "x"];

const ALL = <Link to="/connections_mockup"><ArrowLeft size={13} aria-hidden />All connections</Link>;

export default function ConnectionsEntityMockup() {
  const { kind, id = "" } = useParams();
  return <ConnectionsField kind={kind} id={id} back={ALL} />;
}

/** `back`: the way out (the person's page, or the hub), shown in the trail and under an error. */
export function ConnectionsField({ kind, id, back }: { kind: string | undefined; id: string; back: ReactNode }) {
  const catalog = useCatalog();
  const navigate = useNavigate();
  const [data, setData] = useState<{ entity?: Entity; index?: GraphIndex; error?: string }>({});
  const [chosen, setChosen] = useState<string>();
  const [only, setOnly] = useState<Ring | "all">("all");
  const [scope, setScope] = useState<Scope>("other");
  const [expanded, setExpanded] = useState(false);
  const field = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    setChosen(undefined); setData({});
    if (!isKind(kind)) { setData({ error: `No such kind of thing: "${kind}"` }); return; }
    Promise.all([loadGraphIndex(), loadEntity(kind, id)])
      .then(([index, entity]) => { if (live) setData(entity ? { index, entity } : { error: `Nothing called "${id}" is in the connections data.` }); })
      .catch((reason: unknown) => { console.error("connections: data did not load", reason); if (live) setData({ error: String(reason) }); });
    return () => { live = false; };
  }, [kind, id]);

  const { entity, index } = data;
  useEffect(() => { if (entity) document.title = `${entity.n} · Connections · Bible Guide`; return () => { document.title = "Bible Guide"; }; }, [entity]);
  const newTestament = useMemo(() => !!entity && Object.entries(entity.b).reduce((n, [code, c]) => n + ((catalog.books.find((b) => b.code === code)?.num ?? 0) >= 40 ? c : -c), 0) > 0, [entity, catalog]);
  const passages = useMemo(() => (entity ? (scope === "other" ? entity.xo : entity.x) : []), [entity, scope]);
  const points = useMemo(() => (entity ? layoutPoints(entity, catalog, passages) : []), [entity, catalog, passages]);

  if (data.error) return <main className="cn-page study-frame"><p className="cn-plain">{data.error}</p>{back}</main>;
  if (!entity || !index) return <main className="cn-page study-frame"><p className="cn-plain" role="status">Opening the connections…</p></main>;

  const point = points.find((p) => p.key === chosen);
  const choose = (key: string | undefined) => setChosen(key || undefined);
  const otherName = newTestament ? "Old Testament" : "New Testament";
  const pick = (key: string) => {
    if (points.some((p) => p.key === key)) { setChosen(key); field.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }
    else if (!key.startsWith("x:")) navigate(fieldHref(key[0] as Entity["k"], key.slice(2)));
  };
  const columns: { ring: Ring; total: number; rows: { key: string; name: string; weight: number }[] }[] = [
    ...(["p", "l", "t"] as const).map((ring) => ({ ring, total: entity[`${ring}N`], rows: entity[ring].map((r) => ({ key: `${ring}:${r[0]}`, name: r[1], weight: r[2] })).sort((a, b) => b.weight - a.weight) })),
    { ring: "x", total: scope === "other" ? entity.xoN : entity.xN, rows: passages.map((c) => ({ key: `x:${c[0]}`, name: chapterName(catalog, c[0]), weight: c[2] })).sort((a, b) => b.weight - a.weight) },
  ];

  return (
    <main className="cn-page study-frame">
      <header className="cn-hero">
        <div>
          <nav className="cn-trail" aria-label="Connections">{back}<span aria-hidden>/</span><span>{entity.k === "p" ? "Connected in Scripture" : KIND_NAME[entity.k]}</span></nav>
          <p className="cn-eyebrow">{entity.e || KIND_NAME[entity.k]} · {entity.v.toLocaleString()} verses</p>
          <h1>{entity.n}, <em>connected.</em></h1>
          {entity.d && <p className="cn-lead">{entity.d}</p>}
        </div>
        <dl className="cn-stats">
          {entity.fam.length > 0 && <div><dt>Family</dt><dd>{entity.fam.length}</dd></div>}
          <div><dt>People</dt><dd>{entity.pN.toLocaleString()}</dd></div>
          <div><dt>Places</dt><dd>{entity.lN.toLocaleString()}</dd></div>
          <div><dt>Topics</dt><dd>{entity.tN.toLocaleString()}</dd></div>
          <div><dt>Passages</dt><dd>{entity.xN.toLocaleString()}</dd></div>
        </dl>
      </header>

      <div className="cn-controls" ref={field}>
        <div className="cn-seg" role="group" aria-label="Show">{FILTERS.filter((f) => f !== "fam" || entity.fam.length).map((f) => (
          <button key={f} type="button" aria-pressed={only === f} onClick={() => setOnly(f)}>{f === "all" ? "Everything" : RING_NAME[f]}</button>))}</div>
        <div className="cn-seg" role="group" aria-label="Passages from">
          <button type="button" aria-pressed={scope === "other"} onClick={() => { setScope("other"); setChosen(undefined); }}>Passages in the {otherName}</button>
          <button type="button" aria-pressed={scope === "all"} onClick={() => { setScope("all"); setChosen(undefined); }}>In the whole Bible</button>
        </div>
      </div>

      <section className="cn-stage">
        <div className="cn-field" key={`${entity.k}:${entity.id}:${scope}`}>
          <Constellation name={entity.n} points={points} only={only} chosen={chosen} onChoose={choose} />
          <p className="cn-hint">Choose a point to see the verses that join it to {entity.n}; lines show what else those verses name.</p>
        </div>
        <aside className="cn-panel" aria-live="polite"><Panel entity={entity} index={index} catalog={catalog} passages={passages} point={point} choose={pick} /></aside>
      </section>

      <section className="cn-lists" aria-labelledby="cn-lists-title">
        <h2 id="cn-lists-title">Every connection, <em>as a list</em></h2>
        <div className="cn-cols">{columns.map(({ ring, total, rows }) => (
          <div key={ring} className={`cn-col is-${ring}`}>
            <h3>{RING_NAME[ring]}{ring === "x" && scope === "other" ? ` in the ${otherName}` : ""} <small>{ring === "x" ? "cross-references" : "shared verses"} · strongest {Math.min(rows.length, total)} of {total.toLocaleString()}</small></h3>
            <ol>{rows.slice(0, expanded ? rows.length : 8).map((r) => (
              <li key={r.key}><button type="button" onClick={() => pick(r.key)}>{r.name}</button><span>{r.weight.toLocaleString()}</span></li>))}</ol>
          </div>))}</div>
        <button type="button" className="cn-more" onClick={() => setExpanded((v) => !v)}>{expanded ? "Show fewer" : "Show the strongest 30 of each"}</button>
        <p className="cn-source">How this is made: every person, place and topic on the site lists the verses that name it, so two of them are joined where they share a verse (the number beside each). Passages come from OpenBible.info's cross-references, counted from the verses naming {entity.n}. Nothing here is written by AI; each line can be checked against its verses.</p>
      </section>
    </main>
  );
}
