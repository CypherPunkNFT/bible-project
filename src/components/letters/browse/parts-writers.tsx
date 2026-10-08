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

const list = (items: string[]) => (items.length < 3 ? items.join(" and ") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

/** Each letter's share of the chart: how many passages, from how many books, and the books it draws on most; then the
 *  books every letter draws on. Worked out from the chart's own lines, so the two always agree. */
function OtSummary({ flow, letters }: { flow: Flow; letters: Letter[] }) {
  const per = new Map(letters.map((l) => [l.name, new Map<string, number>()]));
  for (const link of flow.links) per.get(link.target)?.set(link.source, (per.get(link.target)!.get(link.source) ?? 0) + link.value);
  const used = [...per.values()].filter((books) => books.size);
  const everyLetter = used.length > 1 ? [...used[0].keys()].filter((book) => used.every((books) => books.has(book))) : [];
  return <div className="lb-ot-summary">
    <dl className="lb-figures">{[...per].map(([name, books]) => {
      const total = [...books.values()].reduce((sum, n) => sum + n, 0), top = Math.max(0, ...books.values());
      const most = [...books].filter(([, n]) => n === top).map(([book]) => book);
      return <div key={name}><dt>{name}</dt><small>{books.size} books</small><dd>{total} passages</dd>
        {total > 0 && <p className="lb-ot-most">Most from {list(most)} ({top}{most.length > 1 ? " each" : ""})</p>}</div>;
    })}</dl>
    {everyLetter.length > 0 && <p className="lb-tip">Every one of these letters draws on {list(everyLetter)}.</p>}
  </div>;
}

/** The collection's Old Testament chart, with each letter's share above it, then every quotation, letter by letter. */
export function CollectionOt({ flow, letters }: { flow: Flow; letters: Letter[] }) {
  return <>
    <OtSummary flow={flow} letters={letters} />
    <FlowChart flow={flow} />
    {letters.map((letter) => <section key={letter.code} className="lb-look-letter"><h3 className="lb-look-head">{letter.name}</h3><OtList letter={letter} /></section>)}
  </>;
}
