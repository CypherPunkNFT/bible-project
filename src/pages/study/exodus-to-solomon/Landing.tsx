// The study's opening: the shared trail, the gold concept line, the title with its turn, the drawing and motto, the figures
// bar with what each count stands on, the outcomes, the question, the chapters and the site's stance, said once.
import { StudyTrail } from "@/components/study/StudyTrail";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, XS } from "./model";
import { Prose, Refs } from "./parts";

const CHAPTERS: [string, string][] = [["cords", "Cords and nails"], ["stations", "Six stations"], ["ai", "Ai"], ["gates", "The gates"],
  ["invented", "Invented?"], ["claims", "Claims"], ["stops", "Where it stops"]];

const PIERS = [118, 160, 202, 244];

/** A six-chambered gate in plan, a measuring cord stretched across it and a potsherd at its threshold, in the circle and orbit
 * every study's opening uses. Illustrative: no excavated plan is traced. */
function Hero() {
  return <figure className="xs-art">
    <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" role="img"
      aria-label="Line drawing of a city gate seen from above, with three chambers on each side of the passage and two towers at the front, a measuring cord stretched across it, and a broken potsherd lying at its threshold.">
      <circle cx="200" cy="200" r="172" fill="currentColor" fillOpacity=".035" opacity=".5" />
      <circle className="xs-orbit" cx="200" cy="200" r="188" strokeDasharray="1.5 8" opacity=".5" />
      <path d="M44 104h112M244 104h112M44 116h112M244 116h112" opacity=".55" />
      <path d="M52 104v12M84 104v12M116 104v12M284 104v12M316 104v12M348 104v12" opacity=".4" />
      <g fill="currentColor" fillOpacity=".08">
        {PIERS.map((y) => <g key={y}><rect x="118" y={y} width="62" height="12" /><rect x="220" y={y} width="62" height="12" /></g>)}
        <rect x="104" y="256" width="76" height="40" /><rect x="220" y="256" width="76" height="40" />
      </g>
      <path d="M118 104v152M282 104v152" />
      <path d="M180 104v192M220 104v192" strokeDasharray="2 4" opacity=".55" />
      <path d="M136 134h26M136 176h26M136 218h26M238 134h26M238 176h26M238 218h26" opacity=".35" />
      <g className="xs-cord-art">
        <path d="M58 186Q200 204 342 186" strokeWidth="1.3" strokeDasharray="10 3" />
        {[96, 134, 172, 210, 248, 286, 320].map((cx) => <circle key={cx} cx={cx} cy={cx > 200 ? 195 - (cx - 200) / 18 : 195 - (200 - cx) / 18} r="2.2" fill="currentColor" />)}
        <path d="M58 176v20M342 176v20" strokeWidth="1.8" />
      </g>
      <g transform="translate(200 324)">
        <path d="M-28-8 4-16 30-6 24 12-4 16-26 8Z" fill="currentColor" fillOpacity=".09" />
        <path d="M-16-4h18M-14 3h26M-10 9h14" strokeWidth=".9" opacity=".7" />
      </g>
      <path className="xs-spark" d="M76 286v14M69 293h14" /><path className="xs-spark xs-spark-b" d="M326 70v12M320 76h12" />
    </svg>
    <figcaption><span>Numbers in the text.</span><span>Ranges in the ground.</span><small>Illustrative forms · not a site plan</small></figcaption>
  </figure>;
}

export function Landing() {
  const { counts } = XS;
  const figures: [string, string, string][] = [
    ["Spans", String(counts.spans), "numbers in Scripture: every exodus date is built from them"],
    ["Nails", String(counts.nails), "outside records that fix a point, Merneptah and Shoshenq"],
    ["Stations", String(counts.stations), "Egypt to Solomon, in the Bible's own order"],
    ["Records read", String(counts.records), "finds and readings across the six stations: a selection, not a census of the period's sites"],
  ];
  return <>
    <div className="xs-intro">
      <div>
        <StudyTrail area="history" />
        <p className="xs-eyebrow">Span · Site · Nail · Range</p>
        <h1>Israel from the exodus <em>to Solomon</em></h1>
        <p className="xs-lead">Scripture gives numbers. The ground gives ranges. A date for the exodus is a way of joining the two.</p>
        <p className="xs-lede"><Prose text={D.premise} /></p>
      </div>
      <Hero />
    </div>
    <dl className="xs-figures">{figures.map(([name, value, note]) => <div key={name}><dt>{name}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>
    <div className="xs-outcomes"><p className="xs-kicker">By the end you can</p><ul>{D.outcomes.map((o) => <li key={o}><Prose text={o} /></li>)}</ul></div>
    <p className="xs-question"><Checked text={D.question} /></p>
    <nav className="xs-chapters" aria-label="On this page">{CHAPTERS.map(([id, name], i) => <a key={id} href={`#${id}`}><b>{String(i + 1).padStart(2, "0")}</b>{name}</a>)}</nav>
    <aside className="xs-stance" aria-label={D.stance.head}>
      <div>
        <p className="xs-kicker">{D.stance.head}</p>
        <p className="xs-confession"><Checked text={D.stance.confession} /><small>{D.stance.confessionSource}</small></p>
      </div>
      <div>
        <p className="xs-para"><Prose text={D.stance.body} /></p>
        <Refs labels={D.stance.verses} lead="The text itself" />
      </div>
    </aside>
  </>;
}
