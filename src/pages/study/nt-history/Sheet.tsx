// The one sheet: a record (era step, witness, trial hearing, Paul's fixed point), a ruler of Herod's family, or a Bible reference
// with its Berean words. It opens from the right, the same way as on every study, keeps a record's three parts apart, and closes
// on Escape.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { plainText } from "@/pages/study/check-notes/checked";
import { readerHref, type Opened } from "./model";
import { Cite, Prose, Refs, ThreeParts } from "./parts";

function Body({ item }: { item: Opened }) {
  if (item.kind === "ref") {
    return <>
      <p className="nh-kicker">Berean Standard Bible</p>
      <h2>{item.label}</h2>
      {item.verses.map((v) => <blockquote key={`${v.code}${v.chapter}:${v.verse}`} className="nh-verse"><p>{v.text}</p>
        <cite><Link to={readerHref(v.code, v.chapter, v.verse)}>Read {v.chapter}:{v.verse} in the Berean reader <span aria-hidden="true">→</span></Link></cite></blockquote>)}
    </>;
  }
  if (item.kind === "herod") {
    const h = item.herod;
    return <>
      <p className="nh-kicker">Herod's family · {h.title}</p>
      <h2>{h.name}</h2>
      <p className="nh-sheet-line"><b>Ruled:</b> <Prose text={h.ruled} /></p>
      <p className="nh-sheet-line"><b>Territory:</b> <Prose text={h.territory} /></p>
      <p className="nh-sheet-says"><Prose text={h.note} /></p>
      <Refs labels={h.nt} lead="Named in" />
    </>;
  }
  return <>
    <p className="nh-kicker"><Checked text={item.kicker} />{item.when && <> · <Checked text={item.when} /></>}</p>
    <h2><Checked text={item.title} /></h2>
    {item.says && <p className="nh-sheet-says"><Prose text={item.says} /></p>}
    <ThreeParts evidence={item.evidence} inference={item.inference} limit={item.limit} />
    <Refs labels={item.verses} />
    <Cite ids={item.sources} />
  </>;
}

const titleOf = (item: Opened): string => (item.kind === "ref" ? item.label : item.kind === "herod" ? item.herod.name : plainText(item.title));

export function NhSheet({ item, onClose }: { item: Opened | null; onClose: () => void }) {
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
