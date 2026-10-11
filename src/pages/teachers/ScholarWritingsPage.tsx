import { useEffect, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import collection from "../../../content/teachers/writings/william-lane-craig.json";
import "./scholar-writings.css";

export default function ScholarWritingsPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "", category = params.get("category") ?? "";
  const valid = id === collection.id;
  useEffect(() => {
    document.title = valid ? `${collection.name} · Writings · Bible Project` : "Collection not found · Bible Project";
    return () => { document.title = "Bible Project"; };
  }, [valid]);
  const visible = useMemo(() => {
    const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return collection.writings.filter(w => (!category || w.categories.includes(category)) &&
      words.every(word => `${w.title} ${w.categories.join(" ")}`.toLocaleLowerCase().includes(word)));
  }, [query, category]);
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  }
  if (!valid) return <div className="sw-page"><h1>Collection not found</h1><Link to="/teachers/scholars">Browse Scholars</Link></div>;
  return <div className="sw-page">
    <nav className="sw-breadcrumbs" aria-label="Collection navigation"><Link to="/teachers/scholars">Scholars</Link><span aria-hidden="true">/</span><Link to="/apologetics/sources">Apologetics materials</Link></nav>
    <header className="sw-hero">
      <p className="sw-eyebrow">{collection.collection}</p>
      <h1>{collection.name}</h1>
      <p className="sw-lead">Explore arguments for the Christian faith, the historical Jesus, and questions in philosophy and theology.</p>
      <ul className="sw-tags" aria-label="Subjects">{collection.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
      <p className="sw-stats"><strong>{collection.documents} PDFs</strong><span>{collection.pages.toLocaleString()} pages</span><span>{collection.categories.length} source categories</span></p>
      <p className="sw-note">Popular and scholarly writings from Reasonable Faith, catalogued 11 October 2026. Links open the publisher’s articles and original PDFs.</p>
      <a href={collection.biographyUrl} target="_blank" rel="noreferrer">About the author at Reasonable Faith ↗</a>
    </header>
    <section aria-labelledby="sw-library-title">
      <h2 id="sw-library-title">Browse the writings</h2>
      <div className="sw-filters">
        <label>Search titles and subjects<input type="search" value={query} onChange={e => change("q", e.target.value)} placeholder="Try resurrection, time, or God" /></label>
        <label>Source category<select value={category} onChange={e => change("category", e.target.value)}><option value="">All categories</option>{collection.categories.map(c => <option key={c}>{c}</option>)}</select></label>
      </div>
      <p className="sw-result" role="status">{visible.length} of {collection.documents} writings{(query || category) && <button type="button" onClick={() => setParams({}, { replace: true })}>Clear filters</button>}</p>
      {!visible.length && <p className="sw-empty">No writings match these filters. Try another title or choose all categories.</p>}
      <ul className="sw-list">{visible.map(w => <li key={w.id}>
        <article><p className="sw-category">{w.categories.join(" · ")}</p><h3>{w.title}</h3><p className="sw-note">{w.pages} {w.pages === 1 ? "page" : "pages"}</p>
          <div className="sw-links"><a href={w.pdfUrl} target="_blank" rel="noreferrer" aria-label={`Open PDF: ${w.title}`}>Open PDF ↗</a>{w.articleUrls.map((url, i) => <a key={url} href={url} target="_blank" rel="noreferrer" aria-label={`Read source article: ${w.title}${i ? ` (${i + 1})` : ""}`}>Source article{i ? ` ${i + 1}` : ""} ↗</a>)}</div>
        </article>
      </li>)}</ul>
    </section>
  </div>;
}
