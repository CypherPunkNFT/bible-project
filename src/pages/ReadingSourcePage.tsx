import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getAcquired, workUrl } from "./teachers/shared/acquired";
import type { ReadingSource } from "@/lib/reading-sources";
import "./teachers/shared/acquired.css";

export default function ReadingSourcePage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const [source, setSource] = useState<ReadingSource | null>(null), [error, setError] = useState("");
  const [text, setText] = useState<Record<string, string>>({}), [chapter, setChapter] = useState("1");
  useEffect(() => {
    const abort = new AbortController();
    setSource(null); setText({}); setError("");
    getAcquired<ReadingSource[]>("/content/reading-sources.json", abort.signal).then(async rows => {
      const found = rows.find(r => r.id === id);
      if (!found) throw new Error("This source is not in the current catalogue.");
      if (abort.signal.aborted) return;
      setSource(found);
      const match = (search.get("at") ?? found.title).match(/(\d+)[:.](\d+)/);
      setChapter(match?.[1] ?? "1");
      if (found.basis) {
        const data = await getAcquired<Record<string, string>>(`/basis/${found.basis}.json`, abort.signal);
        if (!abort.signal.aborted) setText(data);
      }
    }).catch(e => { if (!abort.signal.aborted) setError(e.message); });
    return () => abort.abort();
  }, [id, search]);
  useEffect(() => { document.title = source ? `${source.title} · Bible Project` : "Source record · Bible Project"; }, [source]);
  const chapters = [...new Set(Object.keys(text).map(k => k.split(/[.:]/)[0]))].sort((a,b) => Number(a)-Number(b));
  const isQuran = source?.basis === "quran-pickthall";
  return <main className="tp-page acq-reader"><nav className="acq-breadcrumb"><Link to="/apologetics/sources">Apologetics sources</Link><Link to="/teachers/works">Acquired library</Link></nav>
    {error && <p role="alert">{error}</p>}{!source && !error && <p role="status">Loading source…</p>}
    {source && <><header><p className="tp-kicker">{source.role}</p><h1>{source.title}</h1><p>{source.basis ? isQuran ? "Marmaduke Pickthall · English translation" : "Westminster Assembly · held Creeds JSON edition" : source.author}</p></header>
      <p>{source.note}</p>
      {source.catholic && <aside className="acq-warning"><strong>Catholic source · doctrinal review</strong><p>Examine claims about justification, merit and Marian teachings against Scripture and the project’s doctrinal standard. Philosophical contributions are assessed separately; these review topics do not imply that every passage addresses them.</p></aside>}
      {source.basis ? <><p className="acq-caption">{isQuran ? "The held Pickthall translation is provided for comparison. It is a different edition from the Quran.com translations cited by the guide; it is not a Christian teaching authority." : "Read the held transcription here. Edition details and the guide’s reference edition are recorded below."}</p>
        {chapters.length ? <label>Chapter <select aria-label="Reading chapter" value={chapter} onChange={e => setChapter(e.target.value)}>{chapters.map(c => <option key={c}>{c}</option>)}</select></label> : !error && <p role="status">Loading text…</p>}
        <article className="acq-reading">{Object.entries(text).filter(([key]) => key.split(/[.:]/)[0] === chapter).sort(([a],[b]) => Number(a.split(/[.:]/)[1])-Number(b.split(/[.:]/)[1])).map(([key,value]) => <section id={key} key={key}><small>{key}</small><p>{value}</p></section>)}</article>
      </> : source.held?.availability === "on-site-text" ? <p><Link to={workUrl(source.held.id)}>Read the held edition on this site →</Link></p> : <section className="acq-pending"><h2>Public reading copy pending</h2><p>The reference is catalogued here. A verified edition cleared for public display has not yet been matched to this citation.</p>{source.held && <Link to={workUrl(source.held.id)}>View the matched library record</Link>}</section>}
      <footer className="acq-sources"><h2>Sources and credits</h2><p>{source.author}</p><a href={source.url} target="_blank" rel="noreferrer">Guide’s original source and provenance ↗</a>
        {source.basis === "westminster" && <p>Held text: Creeds JSON transcription, public-domain confession. <a href="https://github.com/NonlinearFruit/Creeds.json" target="_blank" rel="noreferrer">Dataset source</a>. No claim of textual identity with the OPC edition is made.</p>}
        {isQuran && <p>Public-domain Pickthall translation. Dataset: <a href="https://quran-json.risanb.com/" target="_blank" rel="noreferrer">Quran JSON by Risan</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>. Text unchanged; indexed by chapter and verse. <a href="/basis/QURAN-DATA-LICENSE.txt">Full dataset licence</a>.</p>}
      </footer>
    </>}
  </main>;
}
