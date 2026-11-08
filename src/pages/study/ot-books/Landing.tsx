// The study's opening: the shared trail, the gold concept line, the title with its turn, the drawing and motto, the
// figures with what each stands on, the reader's outcomes, the site's stance and the chapters.
import { StudyTrail } from "@/components/study/StudyTrail";
import { plainText } from "@/pages/study/check-notes/checked";
import { booksCovered, R } from "./model";
import { Para, Txt, VerseQuote } from "./parts";

const CHAPTERS: [string, string][] = [["five", "The five books"], ["sources", "Four sources"], ["isaiah", "Isaiah"], ["daniel", "Daniel"],
  ["darius", "Darius the Mede"], ["every-book", "Every book"], ["claims", "Things often said"], ["stops", "Where it stops"]];

/** The study's own drawing: a scroll partly open beside a stylus and a small clay tablet. Symbolic forms, no one manuscript. */
function Hero() {
  return <figure className="ob-art">
    <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" role="img"
      aria-label="Line drawing of a scroll partly unrolled, its columns of writing shown as dashes, with a reed stylus laid beside it and a small clay tablet with wedge marks.">
      <circle cx="200" cy="200" r="172" fill="currentColor" fillOpacity=".035" opacity=".5" />
      <circle className="ob-orbit" cx="200" cy="200" r="188" strokeDasharray="1.5 8" opacity=".5" />
      <path d="M86 120c0-12 22-12 22 0v156c0 12-22 12-22 0Z" fill="currentColor" fillOpacity=".06" />
      <path d="M97 112v172" opacity=".45" />
      <path d="M108 128h168v144H108" fill="currentColor" fillOpacity=".04" />
      <path d="M276 120c0-12 22-12 22 0v156c0 12-22 12-22 0Z" fill="currentColor" fillOpacity=".06" />
      <path d="M287 112v172" opacity=".45" />
      <path d="M124 148h56M124 160h56M124 172h48M124 184h56M124 196h52M124 208h56M124 220h40M124 232h56M124 244h50" strokeDasharray="6 2 3 2" opacity=".7" />
      <path d="M200 148h60M200 160h60M200 172h54M200 184h60M200 196h44" strokeDasharray="6 2 3 2" opacity=".7" />
      <path d="M200 214h60M200 226h60M200 238h52M200 250h60" strokeDasharray="6 2 3 2" opacity=".45" />
      <path d="M190 140v120" opacity=".25" />
      <path d="M118 318l150-28" /><path d="M268 290l14-3-11 9Z" fill="currentColor" fillOpacity=".25" />
      <path d="M292 300c0-8 6-12 14-12h34c8 0 12 5 12 12v30c0 8-5 12-12 12h-34c-8 0-14-4-14-12Z" fill="currentColor" fillOpacity=".07" />
      <path d="M302 300l4 4M312 300l4 4M322 300l4 4M302 312l4 4M314 312l4 4M326 312l4 4M304 324l4 4M316 324l4 4" opacity=".75" />
      <path d="M60 352h280" opacity=".3" />
      <path className="ob-spark" d="M70 96v14M63 103h14" /><path className="ob-spark ob-spark-b" d="M334 96v12M328 102h12" />
    </svg>
    <figcaption><span>The book speaks first.</span><span>Then its readers.</span><small>Illustrative forms · not manuscript facsimiles</small></figcaption>
  </figure>;
}

function Figures() {
  const figures: [string, string, string][] = [
    ["Books", String(booksCovered(R.table.rows)), `in ${R.table.rows.length} rows, Samuel, Kings and Chronicles one row each; three argued in full, the rest one line each`],
    ["Verses where Moses writes", String(R.pentateuch.selfWitness.length), "in Exodus, Numbers and Deuteronomy; none of them claims all five books for him"],
    ["Signs of a later hand", String(R.pentateuch.laterHand.length), "in the five books, each with what it shows and what it does not"],
    ["Answers on Darius the Mede", String(R.darius.views.length), "four held by scholars who hold the text true, not chosen between; one others' view"],
  ];
  return <dl className="ob-figures">{figures.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>;
}

/** The premise's first two sentences are the lead; the rest follows it. */
function splitPremise(text: string): [string, string] {
  const second = text.indexOf(". ", text.indexOf(". ") + 2);
  return second < 0 ? [text, ""] : [text.slice(0, second + 1), text.slice(second + 2)];
}

export function Landing() {
  const [lead, rest] = splitPremise(plainText(R.premise));
  return <>
    <div className="ob-intro">
      <div>
        <StudyTrail area="texts" />
        <p className="ob-eyebrow">Self-witness · Editing · Sources · Prophecy</p>
        <h1>{R.title}<em>{R.turn}</em></h1>
        <p className="ob-lead">{lead}</p>
        {rest && <p className="ob-lede">{rest}</p>}
      </div>
      <Hero />
    </div>
    <Figures />
    <div className="ob-open">
      <div className="ob-outcomes"><p className="ob-kicker">By the end you can</p><ul>{R.outcomes.map((o) => <li key={o}><Txt text={o} /></li>)}</ul></div>
      <aside className="ob-stance">
        <p className="ob-kicker">{R.stance.head}</p>
        <p className="ob-confession"><Txt text={R.stance.confession} /> <small><Txt text={R.stance.confessionSource} /></small></p>
        <Para text={R.stance.body} />
        <Para text={R.stance.open} />
        {R.stance.verses.map((v) => <VerseQuote key={v} refKey={v} />)}
      </aside>
    </div>
    <nav className="ob-chapters" aria-label="On this page">{CHAPTERS.map(([id, label], i) => <a key={id} href={`#${id}`}><b>0{i + 1}</b>{label}</a>)}</nav>
  </>;
}
