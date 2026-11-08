// The one sheet: a record, with its three parts kept apart, or a Bible reference with its Berean words. It opens from the right,
// the same way as on every study, and closes on Escape.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { plainText } from "@/pages/study/check-notes/checked";
import { EC, readerHref, type Opened } from "./model";
import { Cite, Links, Prose, QuoteLine, Refs, ThreeParts } from "./parts";

function Body({ item }: { item: Opened }) {
  if (item.kind === "ref") {
    return <>
      <p className="ek-kicker">Berean Standard Bible</p>
      <h2>{item.label}</h2>
      {item.verses.map((v) => <blockquote key={`${v.code}${v.chapter}:${v.verse}`} className="ek-verse"><p>{v.text}</p>
        <cite><Link to={readerHref(v.code, v.chapter, v.verse)}>Read {v.chapter}:{v.verse} in the Berean reader <span aria-hidden="true">→</span></Link></cite></blockquote>)}
    </>;
  }
  const { record: r, part, path } = item;
  const alternatives = EC.alternatives[r.id] ?? [];
  return <>
    <p className="ek-kicker">{part.n} · {plainText(part.title)}</p>
    <h2><Checked text={r.name} /></h2>
    <p className="ek-sheet-meta"><Checked text={r.when} /> · <Checked text={r.where} /><small><Checked text={r.kind} /></small></p>
    {alternatives.length > 0 && <p className="ek-sheet-alt">Also argued: {alternatives.map((a) => a.holder).join("; ")}.</p>}
    {r.question && <p className="ek-question"><Prose text={r.question} /></p>}
    {r.quote && <QuoteLine words={r.quote.words} source={r.quote.source} reference={r.quote.ref} path={path} held={EC.held[`${path}.quote.words`]?.[0]?.title} />}
    <ThreeParts evidence={r.evidence} inference={r.inference} limit={r.limit} />
    {r.today && <p className="ek-para"><b>Today: </b><Prose text={r.today} /></p>}
    <Refs labels={r.verses} />
    <Links links={r.links} path={path} />
    <Cite ids={r.sources} />
  </>;
}

const titleOf = (item: Opened): string => (item.kind === "ref" ? item.label : plainText(item.record.name));

export function EkSheet({ item, onClose }: { item: Opened | null; onClose: () => void }) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);
  return <SlidePanel open={Boolean(item)} onClose={onClose} label={item ? titleOf(item) : "Record"} closeLabel="Close this record">
    {item && <Body item={item} />}
  </SlidePanel>;
}
