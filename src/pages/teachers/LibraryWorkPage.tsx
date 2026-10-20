import { CollectionBrowser } from "./shared/CollectionBrowser";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AcquiredCatalogue } from "./shared/AcquiredCatalogue";
import { getWorkRecord, getReadingPage, languageLabel, sourceLabel, type ReadingRecord } from "./shared/acquired";
import { readingPosition } from "./shared/reading-position";
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

export default function LibraryWorkPage({ workId, embedded = false, fallbackRecord }: { workId?: string; embedded?: boolean; fallbackRecord?: ReadingRecord } = {}) {
  const { id: routeId } = useParams();
  const id = workId ?? routeId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useSearchParams();
  const controlId = useId();
  const [recordLoad, setRecordLoad] = useState<{ id: string; record?: ReadingRecord; error?: string } | null>(null);
  const record = recordLoad && recordLoad.id === id ? recordLoad.record ?? null : null;
  const [embeddedPosition, setEmbeddedPosition] = useState<{ id: string; page: number } | null>(null);
  const requestedPage = embedded ? null : search.get("page");
  const readable = !!record && ["on-site-text", "local-text"].includes(record.availability) && Number.isSafeInteger(record.pages) && record.pages > 0;
  const position = readable ? readingPosition(requestedPage, record.pages) : { page: 0, message: "" };
  const page = embedded ? (embeddedPosition && embeddedPosition.id === id ? embeddedPosition.page : 0) : position.page;
  const [pageLoad, setPageLoad] = useState<{ id: string; page: number; blocks?: { text: string; locator: string }[]; error?: string } | null>(null);
  const currentPageLoad = pageLoad && pageLoad.id === id && pageLoad.page === page ? pageLoad : null;
  const blocks = currentPageLoad?.blocks ?? [];
  const error = (recordLoad && recordLoad.id === id ? recordLoad.error : "") || currentPageLoad?.error || "";
  const loading = readable && !currentPageLoad;
  const [pageInput, setPageInput] = useState("1"), [inputError, setInputError] = useState("");
  useEffect(() => {
    if (!id) return;
    const abort = new AbortController();
    setRecordLoad(null); setPageLoad(null);
    getWorkRecord(id,abort.signal).then(row=>{if(!abort.signal.aborted)setRecordLoad({id,record:row});})
      .catch(error=>{if(!abort.signal.aborted){if(fallbackRecord&&error.message==='This work is not in the current catalogue.')setRecordLoad({id,record:fallbackRecord});else setRecordLoad({id,error:error.message});}});
    return () => abort.abort();
  }, [id, fallbackRecord]);
  useEffect(() => {
    if (!id || !record || !readable) return;
    const abort = new AbortController();
    setPageLoad(null);
    getReadingPage(record, page, abort.signal).then(data => { if (!abort.signal.aborted) setPageLoad({id,page,blocks:data.blocks}); }).catch(error => { if (!abort.signal.aborted) setPageLoad({id,page,error:error.message}); });
    return () => abort.abort();
  }, [id, record, readable, page]);
  useEffect(() => { setPageInput(String(page + 1)); setInputError(""); }, [id, page, requestedPage]);
  useEffect(() => { if (embedded) return; document.title = record ? `${record.title} · Bible Project` : "Acquired library · Bible Project"; return () => { document.title = "Bible Project"; }; }, [record, embedded]);
  function goToPage(nextPage: number) {
    if (!id || !record || !readable || nextPage < 0 || nextPage >= record.pages) return;
    setInputError("");
    if (embedded) setEmbeddedPosition({id,page:nextPage});
    else {
      const next = new URLSearchParams(search);
      if (nextPage === 0) next.delete("page"); else next.set("page", String(nextPage + 1));
      if (next.toString() !== search.toString()) setSearch(next);
    }
    if (nextPage !== page) { if(embedded) rootRef.current?.parentElement?.scrollTo?.(0,0); else window.scrollTo(0,0); }
  }
  function submitPage(event: FormEvent) {
    event.preventDefault();
    if (!record) return;
    const next = readingPosition(pageInput, record.pages);
    if (next.message) { setInputError(`Enter a whole reading page number from 1 to ${record.pages}.`); return; }
    goToPage(next.page);
  }
  function pageNavigation(placement: "top" | "bottom") {
    if (!record || !readable || record.pages <= 1) return null;
    const inputId = `${controlId}-page-${placement}`;
    return <nav className="acq-pagination" aria-label={placement === "top" ? "Reading pages" : "Reading pages, bottom"}>
      <button type="button" disabled={!page || loading} onClick={() => goToPage(page - 1)}>Previous</button>
      <form className="acq-page-jump" onSubmit={submitPage} noValidate>
        <div><label htmlFor={inputId}>Reading page</label><input id={inputId} type="text" inputMode="numeric" pattern="[0-9]*" value={pageInput} onChange={event => { setPageInput(event.target.value); setInputError(""); }} disabled={loading} aria-invalid={!!inputError} aria-describedby={`${inputId}-hint${inputError ? ` ${inputId}-error` : ""}`} /><span aria-hidden="true">/ {record.pages}</span><button type="submit" disabled={loading}>Go</button></div>
        <span id={`${inputId}-hint`}>Text reading pages, not print pages.</span>
        {inputError && <p id={`${inputId}-error`} role="alert">{inputError}</p>}
      </form>
      <span className="acq-page-status" aria-live={placement === "top" ? "polite" : undefined}>Reading page {page + 1} / {record.pages}</span>
      <button type="button" disabled={page + 1 >= record.pages || loading} onClick={() => goToPage(page + 1)}>Next</button>
    </nav>;
  }
  return <div ref={rootRef} className={`tp-page acq-reader${embedded ? " acq-reader-embedded" : ""}`}>{!embedded&&<nav className="acq-breadcrumb"><Link to="/teachers/preachers-and-authors">Preachers and authors</Link><Link to="/teachers/scholars">Scholars</Link><Link to="/teachers/works">Acquired library</Link></nav>}
    {!id ? <>{!search.get("author") && <CollectionBrowser />}<AcquiredCatalogue authorId={search.get("author")} /></> : <>
      {error && <p role="alert">{error}</p>}
      {!record && !error && <p role="status">Loading the work…</p>}
      {record && <><header><p className="tp-kicker">{record.genre} · {languageLabel(record.language)}</p><h1>{record.title}</h1><p>{record.authors.join(" · ") || "Author not individually recorded"}</p></header>
        {record.translators?.length ? <p className="acq-caption">Translated by {record.translators.join("; ")}</p> : null}
        {record.editionDetails && <details className="acq-caption"><summary>About this edition</summary>
          <p>Print edition: {record.editionDetails.printDate || "Date unrecorded"}{record.editionDetails.printPublisher ? ` · ${record.editionDetails.printPublisher}` : ""}</p>
          <p>Electronic edition: {record.editionDetails.electronicDate || "Date unrecorded"}{record.editionDetails.electronicPublisher ? ` · ${record.editionDetails.electronicPublisher}` : ""}</p>
          <p>Dates and publishers follow the held source header; brackets and uncertainty are retained.</p>
        </details>}
        {record.reviewWarning && <aside className="acq-warning"><strong>Doctrinal review</strong><p>{record.reviewWarning}</p></aside>}
        {["on-site-text","local-text"].includes(record.availability) ? <>
          <p className="acq-caption">{record.localCopy?'Your locally held edition.':'The held edition, read on this site.'} Extracted text retains its source locators; transcription accuracy has not been fully reviewed.</p>
          {!embedded && position.message && <p className="acq-caption" role="status">{position.message}</p>}
          {!readable && <p className="acq-caption">No reading pages are available for this record.</p>}
          {pageNavigation("top")}
          {loading && <p role="status">Loading text…</p>}
          <article className="acq-reading">{blocks.map((block, i) => <section key={`${page}-${i}`}><small>{block.locator}</small><p>{block.text}</p></section>)}</article>
          {pageNavigation("bottom")}
        </> : record.availability==='local-pdf' ? <section><p className="acq-caption">Your locally held scan.</p><iframe className="acq-local-pdf" title={record.title} src={`/api/local-library/files/${encodeURIComponent(record.id)}`} /><a href={`/api/local-library/files/${encodeURIComponent(record.id)}`} target="_blank" rel="noreferrer">Open the original PDF ↗</a></section> : <section className="acq-pending"><h2>{record.availability === "not-published" ? "Catalogue record" : "Held in the library"}</h2><p>{record.availability === "identity-review" ? "The acquired manifest's title, attribution and edition rights await verification against the source item. The recorded attribution above is provisional; this text is not offered for public reading yet." : record.availability === "permission-required" ? "This text is held for local research. Public display permission is not yet established; the catalogue preserves its identity and source." : "The public reading copy is not available yet. This record stays on the site while its text and edition are reconciled."}</p></section>}
        <footer className="acq-sources"><h2>Sources and credits</h2><p>{sourceLabel(record.source)}</p>{record.sourceId && <p>Source identifier: <code>{record.sourceId}</code></p>}<p>Licence: {record.licence}</p>{record.editors?.length ? <p>Edition contributors: {record.editors.join("; ")}</p> : null}{record.licenseUrl && /^https?:\/\//.test(record.licenseUrl) && <p><a href={record.licenseUrl} target="_blank" rel="noreferrer">Licence terms</a></p>}{creditText(record.credit) && <p>{creditText(record.credit)}</p>}{record.sha256 && <details><summary>Original file identity</summary><code>{record.sha256}</code></details>}{record.sourceUrl && /^https?:\/\//.test(record.sourceUrl) && <a href={record.sourceUrl} target="_blank" rel="noreferrer">Original source and provenance ↗</a>}</footer>
      </>}
    </>}
  </div>;
}
