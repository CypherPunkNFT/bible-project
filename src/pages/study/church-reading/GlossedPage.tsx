// Section 01: the central comparison. Eleven verses in the Berean stand in the middle of the page, and twelve readers stand in its margins
// in date order, each tied by a letter to the words they fasten on, the way a glossed manuscript ties its notes. Choosing a reader lights
// the words and fills the strip; the strip opens the record. On a phone each note drops under its own verse.
import { VerseAt } from "@/components/Verse";
import { useCurrentBible } from "@/lib/verses";
import { CR, D, PASSAGE, readersOnVerse, segmentVerse, verseByLabel, type Reader } from "./model";
import { Head, HcBoundary, Picture, VerseLink } from "./parts";

type Choose = { chosen: Reader; onChoose: (id: string) => void };

function Note({ reader, chosen, onChoose }: { reader: Reader } & Choose) {
  const on = reader.id === chosen.id;
  return <button type="button" className={`hc-note${on ? " on" : ""}`} aria-pressed={on} data-opener={`note:${reader.id}`} onClick={() => onChoose(reader.id)}>
    <span className="hc-note-head"><b aria-hidden="true">{reader.mark}</b><strong>{reader.name}</strong><small>{reader.when}</small></span>
    <span className="hc-note-gloss">{reader.gloss}</span>
  </button>;
}

function Margin({ side, chosen, onChoose }: { side: "left" | "right" } & Choose) {
  return <ol className={`hc-margin hc-margin-${side}`} aria-label={side === "left" ? "Readers from about AD 200 to 1274" : "Readers from 1531 to 2010"}>
    {D.readers.filter((r) => r.side === side).map((reader) => <li key={reader.id}><Note reader={reader} chosen={chosen} onChoose={onChoose} /></li>)}
  </ol>;
}

function PassageVerse({ label, chosen, onChoose }: { label: string } & Choose) {
  const bible = useCurrentBible();
  const verse = verseByLabel.get(label);
  if (!verse) { console.error(`The church reading page: verse "${label}" is not in the generated data`); return null; }
  const readers = readersOnVerse(label);
  // The fastened phrases are the Berean's words: in another Bible the verse shows whole and the notes stay under it.
  return <li className="hc-pv">
    <VerseLink label={label}><sup aria-label={label}>{verse.verse}</sup></VerseLink>{" "}
    <VerseAt verse={verse} render={(text) => segmentVerse(text, readers, bible.slug === "bsb").map((segment, i) => {
      if (!segment.readers.length) return <span key={i}>{segment.text}</span>;
      const lit = segment.readers.some((r) => r.id === chosen.id);
      return <span key={i} className="hc-fastened">
        <mark className={lit ? "lit" : ""}>{segment.text}</mark>
        {segment.readers.map((r) => <button key={r.id} type="button" className={`hc-tie${r.id === chosen.id ? " on" : ""}`} aria-pressed={r.id === chosen.id} aria-label={`Note ${r.mark}: ${r.name}`} data-opener={`tie:${r.id}`} onClick={() => onChoose(r.id)}>{r.mark}</button>)}
      </span>;
    })} />
    {readers.length > 0 && <ul className="hc-undernotes">{readers.map((reader) => <li key={reader.id}><Note reader={reader} chosen={chosen} onChoose={onChoose} /></li>)}</ul>}
  </li>;
}

function Strip({ chosen, onOpen }: { chosen: Reader; onOpen: (id: string) => void }) {
  return <div className="hc-strip" aria-live="polite">
    <p className="hc-kicker">{`${chosen.name} · ${chosen.when} · on ${chosen.fasten.verse}`}</p>
    <blockquote>“{chosen.quote}”</blockquote>
    <p className="hc-strip-looking"><b>Looking for:</b> {chosen.looking}</p>
    <button type="button" className="hc-open" aria-haspopup="dialog" data-opener={`strip:${chosen.id}`} onClick={() => onOpen(chosen.id)}>{`Open ${chosen.name}'s record →`}</button>
  </div>;
}

function RealLeaf() {
  return <div className="hc-leaf">
    <div className="hc-leaf-pics"><Picture id="leaf" /></div>
    <div>
      <p className="hc-kicker">The real thing</p>
      <h3>The same verses, in about the 1100s.</h3>
      <ul className="hc-facts">{D.leaf.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
      <p className="hc-doubt"><b>This study's own reading of the photograph.</b> {D.leaf.reading}</p>
      <p className="hc-para">{D.leaf.shape}</p>
    </div>
    <div>
      <Picture id="detail" />
      <div className="hc-word">
        <p className="hc-kicker">One word</p>
        <p className="hc-word-greek" lang="grc">{CR.word.greek}</p>
        <p className="hc-word-pair"><span><small>King James</small>{`“are an ${CR.word.kingJames}”`}</span><span><small>Berean</small>“serve as illustrations”</span></p>
        <p className="hc-para">{D.theWord.note}</p>
      </div>
    </div>
  </div>;
}

export function GlossedPage({ chosen, resetKey, onChoose, onOpen }: { resetKey: string; onOpen: (id: string) => void } & Choose) {
  return <>
    <Head num="01" kicker="The glossed page" title={<>One passage.<em> Twelve margins.</em></>}
      lead="What did each reader fasten on? Choose a note or a letter to light the words and read what they were looking for. The words in the middle are Scripture. The notes are this site's summary, and only what stands in quotation marks is the reader's own." />
    <div className="hc-page">
      <HcBoundary name="left margin" resetKey={resetKey}><Margin side="left" chosen={chosen} onChoose={onChoose} /></HcBoundary>
      <div className="hc-text">
        <p className="hc-text-head">Galatians 4:21–31<small>Berean Standard Bible</small></p>
        <ol>{PASSAGE.map((label) => <PassageVerse key={label} label={label} chosen={chosen} onChoose={onChoose} />)}</ol>
      </div>
      <HcBoundary name="right margin" resetKey={resetKey}><Margin side="right" chosen={chosen} onChoose={onChoose} /></HcBoundary>
    </div>
    <HcBoundary name="strip" resetKey={resetKey}><Strip chosen={chosen} onOpen={onOpen} /></HcBoundary>
    <RealLeaf />
  </>;
}
