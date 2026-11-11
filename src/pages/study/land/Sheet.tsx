// The record sheet: one record or one verse. It opens from the right, the same way as on every study, keeps the three parts
// of a record apart, shows a verse in the reader's current Bible (named under it) with a link to read it in its chapter, and
// closes on Escape.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BibleName, VerseAt } from "@/components/Verse";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { kindLabel, readerHref, type Openable } from "./model";
import { Cite, StudyLink, T, ThreeParts, VerseRefs } from "./parts";

function Body({ opened }: { opened: Openable }) {
  if (opened.kind === "verse") {
    return <>
      <p className="ls-kicker"><BibleName /></p>
      <h2>{opened.label}</h2>
      <blockquote className="ls-verse ls-verse-big"><p><VerseAt verse={opened.verse} /></p></blockquote>
      <p><Link to={readerHref(opened.verse)} className="ls-back">Read it in its chapter →</Link></p>
    </>;
  }
  const { item } = opened;
  return <>
    <p className="ls-kicker">{kindLabel(opened.kind)}</p>
    <h2>{item.name}</h2>
    {item.where && <p className="ls-para"><T text={item.where} /></p>}
    <ThreeParts evidence={item.evidence} background={item.background} inference={item.inference} limit={item.limit} />
    <VerseRefs labels={item.verses} />
    <Cite ids={item.sources} />
    <StudyLink title={item.link} />
  </>;
}

export function RecordSheet({ opened, onClose }: { opened: Openable | null; onClose: () => void }) {
  useEffect(() => {
    if (!opened) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opened, onClose]);
  const label = !opened ? "Record" : opened.kind === "verse" ? opened.label : opened.item.name;
  return <SlidePanel open={Boolean(opened)} onClose={onClose} label={label} closeLabel="Close this sheet" className="ls-sheet">
    {opened && <Body opened={opened} />}
  </SlidePanel>;
}
