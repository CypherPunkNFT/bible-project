// The record sheet: one rendering of one number, with its sample verse in the Berean. It opens from the right, the same way as on
// every study, keeps the three parts of a record apart, and closes on Escape.
import { BibleName, VerseAt } from "@/components/Verse";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { useCatalog } from "@/lib/catalog";
import { readerHref, type Row, type Word } from "./model";
import { Lemma, ThreeParts } from "./parts";

function bereanLine(row: Row): string {
  const { kjv, bsbWord } = row.sample;
  if (!bsbWord) return `Over “${kjv}” in the King James. The Berean's wording here does not line up one word for one, so no single Berean word is named.`;
  if (bsbWord.toLowerCase() === kjv.toLowerCase()) return `Over “${kjv}” in the King James. The Berean's English here is the same word.`;
  return `Over “${kjv}” in the King James. The Berean's English here is “${bsbWord}”. Same number, two English choices.`;
}

export function StrongsSheet({ opened, onClose }: { opened: { word: Word; row: Row } | null; onClose: () => void }) {
  const catalog = useCatalog();
  useEffect(() => {
    if (!opened) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opened, onClose]);
  const label = opened ? `${opened.word.id}, ${opened.row.label}` : "Record";
  return <SlidePanel open={Boolean(opened)} onClose={onClose} label={label} closeLabel="Close this record">
    {opened && (() => {
      const { word, row } = opened, s = row.sample;
      const book = catalog.books.find((b) => b.code === s.code)?.name ?? s.code;
      return <>
        <p className="sn-kicker">{word.id} · a sample, not the list</p>
        <h2><Lemma lang={word.lang}>{word.lemma}</Lemma> as “{row.label}”</h2>
        <blockquote className="sn-verse"><p><VerseAt verse={s} /></p><cite>{book} {s.chapter}:{s.verse}, <BibleName /></cite></blockquote>
        <ThreeParts
          evidence={<>{bereanLine(row)} This group holds {row.count.toLocaleString("en-US")} of the {word.total.toLocaleString("en-US")} King James tags for {word.id}. Word and short sense from STEP Bible: <i>{word.translit}</i>, “{word.gloss}”.</>}
          inference="This is one more English choice for one number. What the word is doing here is shown by the verse and the verses around it."
          limit="One sample was picked by hand from this group, so it does not show the group's range. Tags can fall on neighbouring words. Two English versions chose their words; this study does not rank them." />
        <Link className="sn-sheet-go" to={readerHref(s.code, s.chapter, s.verse)}>Read {book} {s.chapter} in the Berean →</Link>
      </>;
    })()}
  </SlidePanel>;
}
