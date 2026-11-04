// The record sheet: one reader. It opens from the right, the same way as on every study, keeps the three parts of a record apart, and
// closes on Escape.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { D, type Reader } from "./model";
import { Cite, Quote, ThreeParts } from "./parts";

function ReaderRecord({ reader }: { reader: Reader }) {
  return <>
    <p className="hc-kicker hc-sheet-when">Note {reader.mark} · {reader.when} · {reader.place}</p>
    <h2>{reader.name}</h2>
    <p className="hc-sheet-line">{reader.work}</p>
    <blockquote className="hc-sheet-quote">“{reader.quote}”</blockquote>
    <p className="hc-sheet-looking"><b>Looking for:</b> {reader.looking}</p>
    <ThreeParts evidence={reader.evidence} inference={reader.inference} limit={reader.limit} />
    <p className="hc-kicker hc-kicker-gap">The four questions, put to this reader</p>
    <dl className="hc-sheet-answers">{D.questions.map((q) => <div key={q.id}><dt>{q.label}</dt><dd>{reader.answers[q.id]}</dd></div>)}</dl>
    <p className="hc-kicker hc-kicker-gap">The words fastened on</p>
    <Quote label={reader.fasten.verse} />
    {reader.profile && <p className="hc-sheet-profile"><Link to={reader.profile.href}>{reader.profile.label} →</Link></p>}
    <Cite ids={reader.sources} />
  </>;
}

export function ReaderSheet({ reader, onClose }: { reader: Reader | null; onClose: () => void }) {
  useEffect(() => {
    if (!reader) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reader, onClose]);
  return <SlidePanel open={Boolean(reader)} onClose={onClose} label={reader?.name ?? "Record"} closeLabel="Close this record">
    {reader && <ReaderRecord reader={reader} />}
  </SlidePanel>;
}
