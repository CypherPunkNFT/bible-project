// The one sheet: a Bible reference, each verse in the Berean with its Hebrew beside it (line beside line where the build
// divided it), or an outside source with what was read of it. It opens from the right, the same way as on every study, and
// closes on Escape.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { plainText } from "@/pages/study/check-notes/checked";
import { readerHref, readingTag, type Opened } from "./model";
import { Prose, VersePair } from "./parts";

function Body({ item }: { item: Opened }) {
  if (item.kind === "ref") {
    return <>
      <p className="hpn-kicker">Berean Standard Bible{item.verses.some((v) => v.hebrew) ? " · Leningrad Hebrew" : ""}</p>
      <h2>{item.label}</h2>
      {item.verses.map((v) => {
        const key = `${v.code} ${v.chapter}:${v.verse}`;
        return <div key={key} className="hpn-sheet-verse">
          {item.verses.length > 1 && <p className="hpn-sheet-num">{v.chapter}:{v.verse}</p>}
          <VersePair verseKey={key} caption={false} />
          <Link to={readerHref(v.code, v.chapter, v.verse)}>Read {v.chapter}:{v.verse} in the Berean reader <span aria-hidden="true">→</span></Link>
        </div>;
      })}
    </>;
  }
  const s = item.source;
  return <>
    <p className="hpn-kicker">Outside source · {readingTag(s.status)}</p>
    <h2><Checked text={s.title} /></h2>
    <p className="hpn-sheet-line"><b>Kind:</b> <Checked text={s.kind} /></p>
    <p className="hpn-sheet-line"><b>The question it answers here:</b> <Prose text={s.answers} /></p>
    <p className="hpn-sheet-line"><b>What was read:</b> <Prose text={s.read} /></p>
    <p className="hpn-caption">The research record gives no web address for this work, so none is linked.</p>
  </>;
}

const titleOf = (item: Opened): string => (item.kind === "ref" ? item.label : plainText(item.source.title));

export function HpnSheet({ item, onClose }: { item: Opened | null; onClose: () => void }) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);
  return <SlidePanel open={Boolean(item)} onClose={onClose} label={item ? titleOf(item) : "Verse"} closeLabel="Close">
    {item && <Body item={item} />}
  </SlidePanel>;
}
