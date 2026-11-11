// The record sheet: a verse in the reader's Bible, a verse's own witness, a record in its three parts, a test for sources, or a
// dated view. It opens from the right, the same way as on every study, and closes on Escape.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BibleName } from "@/components/Verse";
import { plural } from "@/lib/site-format";
import { plainText } from "@/pages/study/check-notes/checked";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { bookOf, DATA, readerHref, REFS, type Opened } from "./model";
import { Para, RefVerses, ThreeParts, Txt, VerseQuote } from "./parts";

function VerseBody({ refKey }: { refKey: string }) {
  const ref = REFS.get(refKey)!, many = ref.toChapter > ref.chapter;
  return <>
    <p className="ob-kicker"><BibleName /></p>
    <h2>{refKey}</h2>
    {ref.verse === 0 ? <p className="ob-para">{many ? "Whole chapters: read them in the Bible reader." : "A whole chapter: read it in the Bible reader."}</p>
      : <div className="ob-sheet-verses"><p><RefVerses refer={ref} max={DATA.sheetVerses} numbered={many ? "chapter" : true} /></p></div>}
    {ref.more ? <p className="ob-caption">{plural(ref.more, "And one more verse, in the reader.", "And {n} more verses, in the reader.")}</p> : null}
    <Link className="ob-go" to={readerHref(ref)}>Read it in the Berean <span aria-hidden="true">→</span></Link>
  </>;
}

const recordBook = (part: string, verses: string[]): string | undefined => (part === "pentateuch" ? bookOf(verses[0]) : part === "isaiah" ? "Isaiah" : "Daniel");

function Body({ opened }: { opened: Opened }) {
  switch (opened.kind) {
    case "verse": return <VerseBody refKey={opened.key} />;
    case "self": return <>
      <p className="ob-kicker">The book speaks · the five books</p><h2>{opened.label}</h2>
      <Para text={opened.says} book={bookOf(opened.label)} /><VerseQuote refKey={opened.label} />
    </>;
    case "line": return <>
      <p className="ob-kicker">The book speaks · Isaiah</p><h2>“{plainText(opened.quote)}”</h2>
      <Para text={opened.note} book="Isaiah" /><VerseQuote refKey={opened.label} />
    </>;
    case "record": return <>
      <p className="ob-kicker">{opened.label}</p><h2><Txt text={opened.record.head} /></h2>
      <ThreeParts evidence={opened.record.evidence} inference={opened.record.inference} limit={opened.record.limit} book={recordBook(opened.part, opened.verses)} />
      {opened.verses.map((v) => <VerseQuote key={v} refKey={v} />)}
    </>;
    case "criterion": return <>
      <p className="ob-kicker">A test for sources · a proposed division</p><h2><Txt text={opened.criterion.head} /></h2>
      <ThreeParts evidence={opened.criterion.theyHold} inference={opened.criterion.answer} limit={opened.criterion.limit} labels={["What its holders say", "The answer given", "Where it stops"]} />
    </>;
    case "dateView": return <>
      <p className="ob-kicker">A date for Daniel</p><h2><Txt text={opened.view.name} /></h2>
      <ThreeParts evidence={opened.view.held} inference={opened.view.forIt} limit={opened.view.against} labels={["Held by", "The case for it", "The answer given"]} book="Daniel" />
    </>;
  }
}

function sheetTitle(opened: Opened | null): string {
  if (!opened) return "Record";
  if (opened.kind === "verse") return opened.key;
  if (opened.kind === "self" || opened.kind === "line") return opened.label;
  if (opened.kind === "record") return plainText(opened.record.head);
  return plainText(opened.kind === "criterion" ? opened.criterion.head : opened.view.name);
}

export function RecordSheet({ opened, onClose }: { opened: Opened | null; onClose: () => void }) {
  useEffect(() => {
    if (!opened) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opened, onClose]);
  return <SlidePanel open={Boolean(opened)} onClose={onClose} label={sheetTitle(opened)} closeLabel="Close this record">
    {opened && <Body opened={opened} />}
  </SlidePanel>;
}
