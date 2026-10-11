import { useEffect, useMemo, useRef, useState } from "react";
import usageUrl from "../../../../content/teachers/feature-usage.json?url";
import { ScholarSectionHead as SectionHead } from "./SectionHead";
import "./Built.css";

type Use = { page: string; address: string; locator: string };
type Source = { id: string; author: string; title: string; year: string | number; url: string; kind: "data" | "citation" | "bibliography"; uses: Use[] };
type Feature = { id: string; label: string; sources: Source[] };
const labels = { data: "Builds the feature", citation: "Cited on the page", bibliography: "Listed in the bibliography" };
const number = (n: number) => n.toLocaleString("en-US");

function SourceList({ feature }: { feature: Feature }) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(20);
  const scroll = useRef<HTMLDivElement>(null);
  const sources = useMemo(() => {
    const q = query.trim().toLowerCase();
    return feature.sources.filter(s => `${s.author} ${s.title} ${s.year} ${s.uses.map(u => `${u.page} ${u.locator}`).join(" ")}`.toLowerCase().includes(q));
  }, [feature, query]);
  return <div className="usage-detail">
    <div className="usage-heading"><div><span className="usage-eyebrow">Follow the sources</span><h3>{feature.label}</h3></div>
      <span>{number(sources.length)} source records</span></div>
    <label className="usage-search"><span>Find an author, work or passage</span><input type="search" value={query} placeholder="Search this feature" onChange={e => {
      setQuery(e.target.value); setLimit(20); if (scroll.current) scroll.current.scrollTop = 0;
    }} /></label>
    <div className="usage-scroll" ref={scroll} tabIndex={0} role="region" aria-label={`${feature.label} sources`} onScroll={e => {
      const el = e.currentTarget;
      if (el.scrollTop >= (el.scrollHeight - el.clientHeight) * .4) setLimit(n => Math.min(n + 20, sources.length));
    }}>
      {sources.slice(0, limit).map(source => <article className="usage-source" key={source.id}>
        <div className="usage-source-meta"><span>{labels[source.kind]}</span>{source.year && <span>{source.year}</span>}</div>
        <h4>{source.title}</h4><p className="usage-author">{source.author}</p>
        <a className="usage-original" href={source.url} target={source.url.startsWith("http") ? "_blank" : undefined} rel="noreferrer">Open source <span aria-hidden="true">↗</span></a>
        <ul className="usage-uses">{source.uses.slice(0, 2).map((use, i) => <li key={i}><a href={use.address}>{use.page}</a>{use.locator && <p>{use.locator}</p>}</li>)}</ul>
        {source.uses.length > 2 && <details><summary>{source.uses.length - 2} more references on the site</summary><ul className="usage-uses">{source.uses.slice(2).map((use, i) => <li key={i}><a href={use.address}>{use.page}</a>{use.locator && <p>{use.locator}</p>}</li>)}</ul></details>}
      </article>)}
      {!sources.length && <p className="usage-empty">No matching sources in this feature. Try another name or work.</p>}
      {sources.length > 0 && <p className="usage-end">{limit >= sources.length ? "All matching sources shown" : "More sources load as you scroll"}</p>}
    </div>
  </div>;
}

export function Built() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selected, setSelected] = useState("topics");
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(usageUrl, { signal: controller.signal }).then(r => { if (!r.ok) throw new Error("Source index unavailable"); return r.json(); })
      .then(data => setFeatures(data.features)).catch(e => { if (e.name !== "AbortError") setError(true); });
    return () => controller.abort();
  }, []);
  const feature = features.find(f => f.id === selected);
  const total = features.reduce((n, f) => n + f.sources.length, 0);
  return <>
    <SectionHead section="built" kicker="Behind the features" title={<>Built on <em>their work</em></>}
      line="See which works supply our study tools and support their claims. Choose a feature, then follow a source to the page that uses it." />
    <div className="usage-card">
      <p className="usage-summary">{features.length ? <><strong>{number(total)}</strong> source connections across <strong>{features.length}</strong> parts of the site.</> : error ? "The source index could not load. Reload the page to try again." : "Loading the source connections…"}</p>
      {feature && <div className="usage-layout"><nav className="usage-features" aria-label="Sources by site feature">{features.map(f => <button key={f.id} aria-pressed={selected === f.id} onClick={() => setSelected(f.id)}><span>{f.label}</span><b>{number(f.sources.length)}</b></button>)}</nav><SourceList key={feature.id} feature={feature} /></div>}
      <p className="usage-note">Counts are source records within each feature; editions and repeated works across features count separately. Coverage includes verified feature inputs, registered page bibliographies and published apologetics study citations. Library holdings alone do not count as use.</p>
    </div>
  </>;
}
