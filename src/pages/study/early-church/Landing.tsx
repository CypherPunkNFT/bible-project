// The study's opening: the shared trail, the gold concept line, the title with its turn, the drawing and motto, the figures bar
// (each count checked by the build), the outcomes, the question, and the way through the page.
import { StudyTrail } from "@/components/study/StudyTrail";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { Hero } from "./drawings";
import { D } from "./model";
import { Prose } from "./parts";

const CHAPTERS = [["case", "The case"], ["councils", "The councils"], ["creed", "How a creed came"], ["claims", "Claims"], ["stops", "Where it stops"]];

export function Landing() {
  return <>
    <div className="ek-intro">
      <div>
        <StudyTrail area="church" />
        <p className="ek-eyebrow">Letters · Martyrs · Councils</p>
        <h1>The early church<em>from Nero to Chalcedon</em></h1>
        <p className="ek-lede"><Prose text={D.premise} /></p>
      </div>
      <Hero />
    </div>
    <dl className="ek-figures">{D.figures.map((f) => <div key={f.label}><dt><Checked text={f.label} /></dt><dd>{f.value}</dd><small><Checked text={f.caption} /></small></div>)}</dl>
    <div className="ek-outcomes"><p className="ek-kicker">By the end you can</p><ul>{D.outcomes.map((o) => <li key={o}><Prose text={o} /></li>)}</ul></div>
    <p className="ek-question"><Checked text={D.question} /></p>
    <nav className="ek-chapters" aria-label="On this page">{CHAPTERS.map(([id, name], i) => <a key={id} href={`#${id}`}><b>{String(i + 1).padStart(2, "0")}</b>{name}</a>)}</nav>
  </>;
}
