import { CollectionBrowser } from "./shared/CollectionBrowser";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AcquiredCatalogue } from "./shared/AcquiredCatalogue";
import { getAcquired, getReadingPage, recordUrl, languageLabel, sourceLabel, type ReadingRecord } from "./shared/acquired";
import "./shared/acquired.css";

function creditText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(creditText).filter(Boolean).join("; ");
  if (value && typeof value === "object") {
    const credit = value as { name?: string; role?: string };
    return [credit.name, credit.role].filter(Boolean).join(" — ");
  }
  return "";
}

export default function LibraryWorkPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const [record, setRecord] = useState<ReadingRecord | null>(null), [error, setError] = useState("");
  const [page, setPage] = useState(0), [blocks, setBlocks] = useState<{ text: string; locator: string }[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setRecord(null); setBlocks([]); setPage(0); setError("");
    if (!id) return;
    const abort = new AbortController();
    recordUrl(id).then(url => getAcquired<Record<string, ReadingRecord>>(url, abort.signal)).then(rows => {
      if (!rows[id]) throw new Error("This work is not in the current catalogue.");
      if (!abort.signal.aborted) setRecord(rows[id]);
    }).catch(error => { if (!abort.signal.aborted) setError(error.message); });
    return () => abort.abort();
  }, [id]);
  useEffect(() => {
    setBlocks([]);
    if (!record || record.availability !== "on-site-text" || !record.pages) return;
    const abort = new AbortController(); setLoading(true); setError("");
    getReadingPage(record, page, abort.signal).then(data => { if (!abort.signal.aborted) setBlocks(data.blocks); }).catch(error => { if (!abort.signal.aborted) setError(error.message); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [record, page]);
  useEffect(() => { document.title = record ? `${record.title} · Bible Project` : "Acquired library · Bible Project"; return () => { document.title = "Bible Project"; }; }, [record]);
  return <div className="tp-page acq-reader"><nav className="acq-breadcrumb"><Link to="/teachers/preachers-and-authors">Preachers and authors</Link><Link to="/teachers/scholars">Scholars</Link><Link to="/teachers/works">Acquired library</Link></nav>
    {!id ? <>{!search.get("author") && <CollectionBrowser />}<AcquiredCatalogue authorId={search.get("author")} /></> : <>
      {error && <p role="alert">{error}</p>}
      {!record && !error && <p role="status">Loading the work…</p>}
      {record && <><header><p className="tp-kicker">{record.genre} · {languageLabel(record.language)}</p><h1>{record.title}</h1><p>{record.authors.join(" · ") || "Author not individually recorded"}</p></header>
        {record.reviewWarning && <aside className="acq-warning"><strong>Doctrinal review</strong><p>{record.reviewWarning}</p></aside>}
        {record.availability === "on-site-text" ? <>
          <p className="acq-caption">The held edition, read on this site. Extracted text retains its source locators; transcription accuracy has not been fully reviewed.</p>
          {loading && <p role="status">Loading text…</p>}
          <article className="acq-reading">{blocks.map((block, i) => <section key={`${page}-${i}`}><small>{block.locator}</small><p>{block.text}</p></section>)}</article>
          {record.pages > 1 && <nav className="acq-pagination" aria-label="Reading pages"><button disabled={!page || loading} onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }}>Previous</button><span>Reading page {page + 1} / {record.pages}</span><button disabled={page + 1 >= record.pages || loading} onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}>Next</button></nav>}
        </> : <section className="acq-pending"><h2>{record.availability === "not-published" ? "Catalogue record" : "Held in the library"}</h2><p>{record.availability === "identity-review" ? "The acquired manifest's title, attribution and edition rights await verification against the source item. The recorded attribution above is provisional; this text is not offered for public reading yet." : record.availability === "permission-required" ? "This text is held for local research. Public display permission is not yet established; the catalogue preserves its identity and source." : "The public reading copy is not available yet. This record stays on the site while its text and edition are reconciled."}</p></section>}
        <footer className="acq-sources"><h2>Sources and credits</h2><p>{sourceLabel(record.source)}</p>{record.sourceId && <p>Source identifier: <code>{record.sourceId}</code></p>}<p>Licence: {record.licence}</p>{record.editors?.length ? <p>Edition contributors: {record.editors.join("; ")}</p> : null}{record.licenseUrl && /^https?:\/\//.test(record.licenseUrl) && <p><a href={record.licenseUrl} target="_blank" rel="noreferrer">Licence terms</a></p>}{creditText(record.credit) && <p>{creditText(record.credit)}</p>}{record.sha256 && <details><summary>Original file identity</summary><code>{record.sha256}</code></details>}{record.sourceUrl && /^https?:\/\//.test(record.sourceUrl) && <a href={record.sourceUrl} target="_blank" rel="noreferrer">Original source and provenance ↗</a>}</footer>
      </>}
    </>}
  </div>;
}
