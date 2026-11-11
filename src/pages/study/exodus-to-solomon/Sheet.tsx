// The one sheet: a station's record with its three parts kept apart, or a Bible reference with its words in the reader's
// Bible and the Berean's own footnotes (Exodus 12:40's note on the Samaritan and Greek readings; 1 Kings 6:1's on the Greek's 440). It
// opens from the right, the same way as on every study, and closes on Escape.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BibleName, VerseAt } from "@/components/Verse";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { readerHref, titleOf, type Opened } from "./model";
import { Refs, ThreeParts } from "./parts";

function Body({ item }: { item: Opened }) {
  if (item.kind === "ref") {
    return <>
      <p className="xs-kicker"><BibleName /></p>
      <h2>{item.label}</h2>
      {item.verses.map((v) => <blockquote key={`${v.code}${v.chapter}:${v.verse}`} className="xs-verse">
        <p><VerseAt verse={v} /></p>
        {v.notes.length > 0 && <ul className="xs-footnotes" aria-label="The Berean's footnotes">{v.notes.map((n) => <li key={n}><b>Berean footnote</b> {n}</li>)}</ul>}
        <cite><Link to={readerHref(v.code, v.chapter, v.verse)}>{`Read ${v.chapter}:${v.verse} in the Berean reader`} <span aria-hidden="true">→</span></Link></cite>
      </blockquote>)}
    </>;
  }
  const { station, record } = item;
  return <>
    <p className="xs-kicker">{`Station ${String(station.num).padStart(2, "0")}`} · <Checked text={station.name} /></p>
    <h2><Checked text={record.title} /></h2>
    <ThreeParts evidence={record.evidence} inference={record.inference} limit={record.limit} />
    <Refs labels={station.verses} lead="The station's passages" />
  </>;
}

export function XsSheet({ item, onClose }: { item: Opened | null; onClose: () => void }) {
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
