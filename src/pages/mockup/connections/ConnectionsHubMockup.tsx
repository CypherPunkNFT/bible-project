// /connections_mockup (local preview only): the way into the connections, beginning with Jesus.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Search } from "lucide-react";
import { KIND_NAME, fieldHref, loadEntity, loadGraphIndex, type Entity, type GraphIndex, type Kind } from "./graph-data";
import "./connections.css";

const BEGIN: { kind: Kind; title: string; ids: string[] }[] = [
  { kind: "p", title: "People", ids: ["abraham-gen-11-26", "moses-exo-2-10", "ruth-rut-1-4", "david-rut-4-17", "elijah-1ki-17-1", "isaiah-2ki-19-2", "mary-mat-1-16", "peter-mat-4-18", "paul-act-7-58"] },
  { kind: "l", title: "Places", ids: ["af301ca", "abfba2a", "ae686c9", "a15257a", "a112427", "af5884f", "a9cf1e8", "a217d18", "afc8e7a"] },
  { kind: "t", title: "Topics", ids: ["creation", "covenant", "grace", "faith", "prayer", "love", "atonement", "resurrection-of-christ", "holy-spirit"] },
];
const JESUS = "jesus-isa-7-14";

export default function ConnectionsHubMockup() {
  const [index, setIndex] = useState<GraphIndex>();
  const [jesus, setJesus] = useState<Entity>();
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.title = "Connections · Bible Guide";
    Promise.all([loadGraphIndex(), loadEntity("p", JESUS)])
      .then(([i, j]) => { setIndex(i); setJesus(j); })
      .catch((reason: unknown) => { console.error("connections: data did not load", reason); setError(String(reason)); });
    return () => { document.title = "Bible Guide"; };
  }, []);

  const counts = useMemo(() => {
    const c = { p: 0, l: 0, t: 0 };
    for (const key of Object.keys(index?.entities ?? {})) c[key[0] as Kind] += 1;
    return c;
  }, [index]);

  const hits = useMemo(() => {
    const words = query.trim().toLowerCase();
    if (!index || words.length < 2) return [];
    return Object.entries(index.entities)
      .filter(([, [name, verses]]) => verses > 0 && name.toLowerCase().includes(words))
      .sort((a, b) => Number(!a[1][0].toLowerCase().startsWith(words)) - Number(!b[1][0].toLowerCase().startsWith(words)) || b[1][1] - a[1][1])
      .slice(0, 24);
  }, [index, query]);

  if (error) return <main className="cn-page study-frame"><p className="cn-plain">{error}</p></main>;

  return (
    <main className="cn-page cn-hub study-frame">
      <header className="cn-hero">
        <div>
          <p className="cn-eyebrow">People · Places · Topics · Cross-references</p>
          <h1>Everything in Scripture, <em>connected.</em></h1>
          <p className="cn-lead">Every person, place and topic, joined to the others through the verses they share, and to the passages those verses point to. Choose one to see its field.</p>
        </div>
        <dl className="cn-stats">
          <div><dt>People</dt><dd>{counts.p.toLocaleString()}</dd></div>
          <div><dt>Places</dt><dd>{counts.l.toLocaleString()}</dd></div>
          <div><dt>Topics</dt><dd>{counts.t.toLocaleString()}</dd></div>
          <div><dt>Cross-references</dt><dd>341,264</dd></div>
        </dl>
      </header>

      <section className="cn-feature" aria-label="Begin with Jesus">
        <Link to={fieldHref("p", JESUS)} className="cn-feature-link">
          <svg viewBox="0 0 200 200" aria-hidden className="cn-feature-art">
            {[34, 56, 76, 94].map((r, k) => <circle key={r} cx={100} cy={100} r={r} style={{ animationDelay: `${k * 0.6}s` }} />)}
            {Array.from({ length: 28 }, (_, i) => { const r = [34, 56, 76, 94][i % 4]; const a = (i * 137.5 * Math.PI) / 180; return <circle key={`d${i}`} className="cn-feature-dot" cx={100 + Math.cos(a) * r} cy={100 + Math.sin(a) * r} r={2.4} style={{ animationDelay: `${(i % 7) * 0.4}s` }} />; })}
            <circle cx={100} cy={100} r={18} className="cn-feature-core" />
          </svg>
          <div>
            <p className="cn-kicker">Begin here</p>
            <h2>Jesus</h2>
            <p className="cn-plain">The Son of God and Savior of the world, at the centre of {jesus ? `${jesus.v.toLocaleString()} verses that name Him` : "the verses that name Him"}: the people beside Him, the places He went, the topics that gather around Him, and the Old Testament passages those verses point back to.</p>
            {jesus && <p className="cn-small">{jesus.pN} people · {jesus.lN} places · {jesus.tN.toLocaleString()} topics · {jesus.xoN} Old Testament chapters</p>}
            <span className="cn-feature-go">See His connections <ArrowUpRight size={15} aria-hidden /></span>
          </div>
        </Link>
      </section>

      <section className="cn-begin" aria-label="Or begin with">
        {BEGIN.map(({ kind, title, ids }) => (
          <div key={kind} className={`cn-words is-${kind}`}>
            <h3>{title}</h3>
            <ul>{ids.map((id) => { const e = index?.entities[`${kind}:${id}`]; return e ? <li key={id}><Link to={fieldHref(kind, id)}>{e[0]}</Link><small>{e[1].toLocaleString()}</small></li> : null; })}</ul>
          </div>))}
      </section>

      <section className="cn-search" aria-label="Find anyone or anything">
        <label><Search size={16} aria-hidden /><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find any person, place or topic…" aria-label="Find any person, place or topic" /></label>
        {hits.length > 0 && <ul>{hits.map(([key, [name, verses, description]]) => (
          <li key={key}><Link to={fieldHref(key[0] as Kind, key.slice(2))}><b>{name}</b><span>{KIND_NAME[key[0] as Kind]}{description ? ` · ${description}` : ""}</span><small>{verses.toLocaleString()} verses</small></Link></li>))}</ul>}
        {query.trim().length >= 2 && hits.length === 0 && index && <p className="cn-small">Nothing by that name.</p>}
      </section>
    </main>
  );
}
