// The record sheet: one letter, one word or one cell of the verb's grid. It opens from the right, the same way as on every study, and
// closes on Escape. The grammar lines are STEP Bible's own, shown unchanged and named as theirs.
import { BibleName, VerseAt } from "@/components/Verse";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { D, H, letterById, readerHref, thousands, type Letter, type Opened } from "./model";
import { He, Mixed, Quote } from "./parts";

function Grammar({ code, note, gloss }: { code: string; note: string; gloss: string }) {
  return <dl className="hw-facts">
    <div><dt>STEP Bible's gloss</dt><dd>{gloss}</dd></div>
    <div><dt>STEP Bible's grammar code</dt><dd>{code}</dd></div>
    <div><dt>STEP Bible's note on it</dt><dd>{note}</dd></div>
  </dl>;
}

function LetterRecord({ letter }: { letter: Letter }) {
  const stanza = H.psalm[letter.id];
  return <>
    <p className="hw-kicker">Letter {D.letters.indexOf(letter) + 1} of 22</p>
    <h2 tabIndex={-1}>{letter.name}</h2>
    <p className="hw-sheet-glyph" lang="he" dir="rtl">{letter.glyph}{letter.final && <span> {letter.final}</span>}</p>
    <dl className="hw-facts">
      <div><dt>Sound here</dt><dd>{letter.sound}</dd></div>
      {letter.dot && <div><dt>The dot</dt><dd><Mixed text={letter.dot} /></dd></div>}
      {letter.final && <div><dt>At a word's end</dt><dd><He>{letter.final}</He>, with the same sound.</dd></div>}
      {letter.twins.length > 0 && <div><dt>Do not mistake it for</dt><dd>{letter.twins.map((id) => { const twin = letterById.get(id); return twin && <span key={id} className="hw-twin"><He>{twin.glyph}</He> {twin.name}</span>; })}</dd></div>}
      {letter.note && <div><dt>Note</dt><dd><Mixed text={letter.note} /></dd></div>}
      <div><dt>In the Hebrew text</dt><dd>{thousands(H.counts.letterCounts[letter.id])} of {thousands(H.counts.lettersTotal)} letters</dd></div>
    </dl>
    <p className="hw-kicker hw-kicker-gap">Its stanza of Psalm 119</p>
    <p className="hw-sheet-line">The stanza opens with <He>{stanza.first}</He>, which begins with this letter. This study's script checked that against the Leningrad text.</p>
    <blockquote className="hw-verse"><p><VerseAt verse={{ code: "PSA", chapter: 119, verse: stanza.verse }} /></p><cite><Link to={readerHref("PSA", 119, stanza.verse)}>Psalm 119:{stanza.verse}</Link>, <BibleName /></cite></blockquote>
  </>;
}

function WordRecord({ opened }: { opened: Extract<Opened, { type: "word" }> }) {
  const { item, data } = opened;
  return <>
    <p className="hw-kicker">A word in its verse</p>
    <h2 tabIndex={-1}>{item.word}</h2>
    <p className="hw-sheet-glyph" lang="he" dir="rtl">{data.he}</p>
    <p className="hw-sheet-line">Said <b>{item.sound}</b> in this page's scheme.</p>
    <Grammar code={data.code} note={data.note} gloss={data.gloss} />
    <p className="hw-sheet-line">Its dictionary number stands {thousands(data.count)} times in the tagged Hebrew text. This page lists no others: one verse is enough to see the form.</p>
    <Quote label={data.label} />
  </>;
}

function CellRecord({ opened }: { opened: Extract<Opened, { type: "cell" }> }) {
  const { row, col, cell } = opened;
  return <>
    <p className="hw-kicker">{D.grid.name} · {col.label}</p>
    <h2 tabIndex={-1}>{row.label}</h2>
    <p className="hw-sheet-glyph" lang="he" dir="rtl">{cell.he}</p>
    <p className="hw-sheet-line">{cell.all === 1 ? "The only word with this person and form and no object ending." : `${cell.count} of the ${cell.all} words with this person and form and no object ending have this spelling.`} STEP Bible writes its sound {cell.step}.</p>
    <Grammar code={cell.code} note={cell.note} gloss={cell.gloss} />
    <Quote label={cell.label} />
  </>;
}

export function HebrewSheet({ opened, onClose }: { opened: Opened | null; onClose: () => void }) {
  useEffect(() => {
    if (!opened) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opened, onClose]);
  const label = opened?.type === "letter" ? opened.letter.name : opened?.type === "word" ? opened.item.word : "Record";
  return <SlidePanel open={Boolean(opened)} onClose={onClose} label={label} closeLabel="Close this record">
    {opened?.type === "letter" && <LetterRecord letter={opened.letter} />}
    {opened?.type === "word" && <WordRecord opened={opened} />}
    {opened?.type === "cell" && <CellRecord opened={opened} />}
  </SlidePanel>;
}
