import type { ReactNode } from "react";
import type { Flow, Letter, Timeline, Writer } from "@/data/letters/types";
import { FlowChart } from "../FlowChart";
import { TimelineStrip } from "../TimelineStrip";
import { PersonLink } from "./frame";
import { Glance, LetterWords, OtList, OutlineBar } from "./parts-letter";

/** A writer's card: his life in the story, step by step, then the way to his own page. */
export function WriterLife({ writer, timeline, from }: { writer: Writer; timeline: Timeline; from: string }) {
  return <>
    <TimelineStrip timeline={timeline} />
    <p className="lb-person-links"><PersonLink writer={writer} from={from} /></p>
  </>;
}

/** A deeper look at one letter: at a glance, how it is built, the words it leans on, its Old Testament quotations. */
function LetterLook({ letter }: { letter: Letter }) {
  return <div className="lb-look">
    <Glance letter={letter} />
    <h3 className="lb-look-head">How it is built</h3>
    <OutlineBar letter={letter} headings />
    <h3 className="lb-look-head">The words it leans on</h3>
    <LetterWords letter={letter} />
    <h3 className="lb-look-head">The Old Testament behind it</h3>
    <OtList letter={letter} />
  </div>;
}

/** One letter, or several from one writer (1 and 2 Peter) each under its name, then what they share (maps). */
export function LettersLook({ letters, after }: { letters: Letter[]; after?: ReactNode }) {
  if (letters.length === 1) return <><LetterLook letter={letters[0]} />{after}</>;
  return <>
    {letters.map((letter) => <section key={letter.code} className="lb-look-letter"><h2 className="lb-look-title">{letter.name}</h2><LetterLook letter={letter} /></section>)}
    {after}
  </>;
}

/** The collection's Old Testament chart, then every quotation, letter by letter. */
export function CollectionOt({ flow, letters }: { flow: Flow; letters: Letter[] }) {
  return <>
    <FlowChart flow={flow} />
    {letters.map((letter) => <section key={letter.code} className="lb-look-letter"><h3 className="lb-look-head">{letter.name}</h3><OtList letter={letter} /></section>)}
  </>;
}
