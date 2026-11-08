// The one sheet: a record (a parallel site, a find, a priests' record, a record of AD 70) in its three parts with its witnesses,
// or a Bible reference with its Berean words. It opens from the right, as on every study, and closes on Escape.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { readerHref, titleOf, type Opened } from "./model";
import { Refs, Tags, ThreeParts } from "./parts";

function Body({ item }: { item: Opened }) {
  if (item.kind === "ref") {
    return <>
      <p className="tw-kicker">Berean Standard Bible</p>
      <h2>{item.label}</h2>
      {item.verses.map((v) => <blockquote key={`${v.code}${v.chapter}:${v.verse}`} className="tw-verse"><p><sup>{v.verse}</sup> {v.text}</p>
        <cite><Link to={readerHref(v.code, v.chapter, v.verse)}>Read {v.chapter}:{v.verse} in the Berean reader <span aria-hidden="true">→</span></Link></cite></blockquote>)}
    </>;
  }
  return <>
    <p className="tw-kicker">{item.kicker}</p>
    <h2><Checked text={item.title} /></h2>
    <p className="tw-sheet-tags"><Tags kinds={item.tags} /></p>
    <ThreeParts evidence={item.evidence} inference={item.inference} limit={item.limit} />
    <Refs labels={item.verses} />
  </>;
}

export function TwSheet({ item, onClose }: { item: Opened | null; onClose: () => void }) {
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
