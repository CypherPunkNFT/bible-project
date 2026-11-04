// The study's opening: the shared trail, the gold concept line, the title with its turn, the drawing and motto, the figures with what
// each stands on.
import { StudyTrail } from "@/components/study/StudyTrail";
import { D, FY } from "./model";

const CHAPTERS = [["stone", "Seven lines on a stone"], ["clock", "The Bible keeps the same clock"], ["jobs", "Ten jobs through the year"], ["hearer", "What the hearer knew"], ["claims", "Three claims tested"], ["stops", "Where it stops"]];
const LINE_WIDTHS = [62, 46, 52, 56, 50, 38, 30];

/** The study's own drawing, in the circle and orbit every study's opening uses: a tablet, a sheaf, and the year's twelve marks. Symbolic: not a tracing of the stone. */
function Hero() {
  return <figure className="fy-art">
    <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Line drawing of a small broken tablet with seven scratched lines, beside a tied sheaf of grain, inside a ring of twelve marks for the months.">
      <circle cx="200" cy="200" r="172" fill="currentColor" fillOpacity=".035" opacity=".5" />
      <circle className="fy-orbit" cx="200" cy="200" r="188" strokeDasharray="1.5 8" opacity=".5" />
      {Array.from({ length: 12 }, (_, i) => <path key={i} d="M200 42v12" transform={`rotate(${i * 30} 200 200)`} opacity=".65" />)}
      <path d="M112 112l92-6 12 16 4 150-34 8-8-14-12 16-50-4z" fill="currentColor" fillOpacity=".06" />
      <path d="M112 112l92-6 12 16 4 150-34 8-8-14-12 16-50-4z" transform="translate(4 4)" opacity=".28" />
      {LINE_WIDTHS.map((width, i) => <path key={i} d={`M${126 + i % 2} ${136 + i * 18}l${width} -2m6 1l${Math.max(10, 72 - width)} -1`} strokeWidth="1.5" strokeDasharray="5 2 2 3 7 2" />)}
      <g className="fy-sheaf">
        <path d="M268 322c-3-44 0-92 6-136M280 322c0-44 4-86 12-128M256 322c-6-42-10-82-10-122M292 322c4-36 12-70 22-100M244 322c-10-32-18-60-24-92" />
        <path d="M242 270c16 7 44 7 62 0M242 277c16 7 44 7 62 0" strokeWidth="1.6" />
        {[[274, 186, 0], [292, 194, 10], [246, 200, -10], [314, 222, 20], [220, 230, -18]].map(([x, y, tilt]) => <g key={x} transform={`translate(${x} ${y}) rotate(${tilt})`}>
          <path d="M0 0c-6-10-6-24 0-36c6 12 6 26 0 36zM0 -8l-7-6M0 -8l7-6M0 -18l-6-6M0 -18l6-6M0 -36v-10" />
        </g>)}
      </g>
      <path className="fy-spark" d="M64 92v14M57 99h14" /><path className="fy-spark fy-spark-b" d="M344 90v12M338 96h12" />
    </svg>
    <figcaption><span>Seven lines on a stone.</span><span>A year in every hearer's head.</span><small>Illustrative form · not a tracing of the tablet</small></figcaption>
  </figure>;
}

export function Landing() {
  const figures: [string, string, string][] = [
    ["Lines on the stone", "7", "with a partly kept name at the foot"],
    ["Seasons it names", "8", "two of them share a line, and one word breaks between two"],
    ["Months they fill", "12", "added up from the stone; it names no month"],
    ["“Harvest” in Scripture", String(FY.harvestTags), "tags of that Hebrew word in the site's King James, a few rendered otherwise"],
  ];
  return <>
    <div className="fy-intro">
      <div>
        <StudyTrail area="culture" />
        <p className="fy-eyebrow">Plough · Sickle · Floor · Vat</p>
        <h1>The farming year<em>from a stone at Gezer to the first hearer</em></h1>
        <p className="fy-lead">The stone lists the work. The passages assume it.</p>
        <p className="fy-lede">Ruth arrives “at the beginning of the barley harvest”, and the book does not stop to say why that matters. Amos sees a basket of summer fruit. The prophets, the law and Jesus's stories keep reaching for farm work without explaining it, because nobody listening needed it explained.</p>
        <p className="fy-lede">A small limestone tablet from Gezer sets that year out in seven lines. This study reads the tablet, walks through the work from the plough to the vat, and asks of each passage what its first hearers already knew. It keeps apart the stone, the passage and the modern photograph.</p>
      </div>
      <Hero />
    </div>
    <dl className="fy-figures">{figures.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>
    <div className="fy-outcomes"><p className="fy-kicker">By the end you can</p><ul>{D.outcomes.map((o) => <li key={o}>{o}</li>)}</ul></div>
    <nav className="fy-chapters" aria-label="On this page">{CHAPTERS.map(([id, label], i) => <a key={id} href={`#${id}`}><b>0{i + 1}</b>{label}</a>)}</nav>
  </>;
}
