// The study's opening: the shared trail, the gold concept line, the title with its turn, the drawing and motto, the figures with what
// each stands on.
import { StudyTrail } from "@/components/study/StudyTrail";
import { HouseLines } from "./HouseDrawing";
import { D } from "./model";

const FIGURES: [string, string, string][] = [
  ["Houses known", "Hundreds", "mainly in the hill country; the source gives no census"],
  ["Span of the plan", "Over 400 years", "from the late 11th century BC to the exile, in an encyclopedia's dating"],
  ["Calories from grain", "53–75%", "one book's range of scholars' estimates, never a measurement"],
  ["Bread in the Hebrew Bible", "297", "Tim Frank's count of the word, ahead of oil, wine, honey and milk"],
];
const CHAPTERS = [["house", "One house, cut open"], ["work", "Who did what, where"], ["bread", "Bread, thread and the cabinet"], ["kin", "Who lived inside"], ["claims", "Three claims tested"], ["stops", "Where it stops"]];

/** The study's own drawing, in the circle and orbit every study's opening uses. Symbolic: no single excavated house. */
function Hero() {
  return <figure className="hh-art">
    <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" role="img" aria-label="Line drawing of a pillared stone house cut open, with its lower walls in solid line, its upper floor dashed and its roof dotted, and smoke rising from an oven.">
      <circle cx="200" cy="200" r="172" fill="currentColor" fillOpacity=".035" opacity=".5" />
      <circle className="hh-orbit" cx="200" cy="200" r="188" strokeDasharray="1.5 8" opacity=".5" />
      <g transform="translate(21 68) scale(.56)"><HouseLines /></g>
      <path className="hh-smoke" d="M187 250q-9-14 0-27q9-14 0-28" strokeDasharray="3 6" opacity=".7" />
      <path className="hh-spark" d="M64 92v14M57 99h14" /><path className="hh-spark hh-spark-b" d="M344 300v12M338 306h12" />
    </svg>
    <figcaption><span>Solid where it was found.</span><span>Dashed where we picture it.</span><small>Illustrative form · no single excavated house</small></figcaption>
  </figure>;
}

export function Landing() {
  return <>
    <div className="hh-intro">
      <div>
        <StudyTrail area="culture" />
        <p className="hh-eyebrow">Stone · Bread · Thread · Kin</p>
        <h1>Home and household<em>in Old Testament Israel</em></h1>
        <p className="hh-lead">The walls survive. The evening does not.</p>
        <p className="hh-lede">Most Bible readers carry a picture of an Israelite home: animals below, a family above, bread on the fire. Parts of that picture come from stone that was dug up. Parts come from a passage about one house. Parts come from a modern drawing.</p>
        <p className="hh-lede">This study walks through the house and keeps those apart. It reads the rooms, the food, the cloth and the people, and asks of each: what was found on the floor, and what am I picturing?</p>
      </div>
      <Hero />
    </div>
    <dl className="hh-figures">{FIGURES.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>
    <div className="hh-outcomes"><p className="hh-kicker">By the end you can</p><ul>{D.outcomes.map((o) => <li key={o}>{o}</li>)}</ul></div>
    <nav className="hh-chapters" aria-label="On this page">{CHAPTERS.map(([id, label], i) => <a key={id} href={`#${id}`}><b>0{i + 1}</b>{label}</a>)}</nav>
  </>;
}
