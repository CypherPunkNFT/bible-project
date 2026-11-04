// The study's opening: the shared trail, the gold concept line, the title with its turn, the drawing and motto, the figures with what
// each stands on.
import { StudyTrail } from "@/components/study/StudyTrail";
import { D, EG } from "./model";

const CHAPTERS = [["seam", "Where the threads run"], ["songs", "Two songs, eight themes"], ["letters", "Letters from Canaan"], ["likeness", "A likeness is not a lineage"], ["claims", "Four claims tested"], ["stops", "Where it stops"]];
const RAYS = [-58, -38, -19, 0, 19, 38, 58];

/** The study's own drawing, in the circle and orbit every study's opening uses: a sun disc whose rays end in small hands, over a papyrus roll and a clay tablet. Symbolic: neither a tracing nor a facsimile. */
function Hero() {
  return <figure className="eg-art">
    <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Line drawing of a sun disc with long rays, each ending in a small open hand, reaching down over a rolled papyrus and a small clay tablet.">
      <circle cx="200" cy="200" r="172" fill="currentColor" fillOpacity=".035" opacity=".5" />
      <circle className="eg-orbit" cx="200" cy="200" r="188" strokeDasharray="1.5 8" opacity=".5" />
      <circle cx="200" cy="102" r="30" fill="currentColor" fillOpacity=".1" />
      <circle cx="200" cy="102" r="36" opacity=".35" />
      {RAYS.map((angle) => <g key={angle} transform={`rotate(${angle} 200 102)`}>
        <path d="M200 140v92" />
        <path d="M200 232c-4 2-6 5-7 10M200 232c-1.800 3-2 7-2 12M200 232c1 3 2 7 2 12M200 232c3 2 5 5 6 10" strokeWidth=".95" />
      </g>)}
      <g transform="translate(92 268)">
        <path d="M6 8h104c6 0 10 8 10 18s-4 18-10 18H6" fill="currentColor" fillOpacity=".05" />
        <ellipse cx="6" cy="26" rx="6" ry="18" />
        <path d="M6 16c2-2 3 18 0 20" opacity=".6" />
        <path d="M24 18h70M24 26h78M24 34h54" strokeDasharray="6 2 3 2" opacity=".75" />
      </g>
      <g transform="translate(232 258)">
        <path d="M6 2h54c6 0 8 4 8 8v44c0 6-3 8-8 8H8c-5 0-8-3-8-8V10c0-5 2-8 6-8z" fill="currentColor" fillOpacity=".07" />
        {[12, 21, 30, 39, 48].map((y) => <path key={y} d={`M10 ${y}l5 2-3 2m6-4 5 2-3 2m6-4 5 2-3 2m6-4 5 2-3 2m6-4 5 2-3 2`} strokeWidth=".9" />)}
      </g>
      <path className="eg-spark" d="M64 112v14M57 119h14" /><path className="eg-spark eg-spark-b" d="M340 118v12M334 124h12" />
    </svg>
    <figcaption><span>Words that run close.</span><span>Names that do not.</span><small>Illustrative forms · not facsimiles</small></figcaption>
  </figure>;
}

export function Landing() {
  const { canaanite, withText } = EG.letters;
  const figures: [string, string, string][] = [
    ["Passages usually matched", String(D.parallels.length), "Amenemope to Proverbs 22:17-23:11, which three judges count differently"],
    ["Themes in common", String(D.themes.length), "a hymn and a psalm, chosen by this study, reached in a different order"],
    ["Letters read by script", String(withText), `of ${EG.letters.catalogue} entries in the edition's catalogue, the rest without text there`],
    ["Words tagged Canaanite", String(canaanite.words), `in ${canaanite.letters} letters: the edition's tags, added up here`],
  ];
  return <>
    <div className="eg-intro">
      <div>
        <StudyTrail area="culture" />
        <p className="eg-eyebrow">Papyrus · Tomb wall · Clay tablet</p>
        <h1>Egypt beside Israel<em>a wisdom book, a hymn, and letters from Canaan</em></h1>
        <p className="eg-lead">The likeness is real. What it shows is the question.</p>
        <p className="eg-lede">A papyrus in London warns against moving a boundary stone, and describes riches growing wings. A wall in an Egyptian tomb sings of lions leaving their dens at nightfall, and of people going out to work at dawn. A clay letter from Jerusalem says that a king has set his name there for ever. A reader who knows Proverbs, Psalm 104 and Kings will hear something familiar in each.</p>
        <p className="eg-lede">This study reads all three beside Scripture, line by line. It counts what lines up and names whose count it is. It shows where each pair parts company. And it keeps a likeness apart from a line of descent, which is where most claims about these texts go astray.</p>
      </div>
      <Hero />
    </div>
    <dl className="eg-figures">{figures.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>
    <div className="eg-outcomes"><p className="eg-kicker">By the end you can</p><ul>{D.outcomes.map((o) => <li key={o}>{o}</li>)}</ul></div>
    <nav className="eg-chapters" aria-label="On this page">{CHAPTERS.map(([id, label], i) => <a key={id} href={`#${id}`}><b>0{i + 1}</b>{label}</a>)}</nav>
  </>;
}
