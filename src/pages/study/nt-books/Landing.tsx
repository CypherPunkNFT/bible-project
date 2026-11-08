// The study's opening: the shared trail, the gold concept line, the title with its turn, the drawing and its motto, four
// true figures with what each means, the reader's outcomes, and the seven sections as a line of contents.
import { StudyTrail } from "@/components/study/StudyTrail";
import { D } from "./model";
import { Text } from "./parts";

const GOSPELS = ["Matthew", "Mark", "Luke", "John"];

const CHAPTERS: [string, string][] = [["tellings", "Three tellings"], ["maps", "Four maps"], ["witnesses", "The witnesses"],
  ["quest", "The quest"], ["letters", "Letters"], ["claims", "Five claims"], ["books", "Every book"]];

/** A reed pen over three narrow columns of script, one tie running across them. Illustrative: no manuscript is drawn. */
function Hero() {
  const columns = [118, 176, 234];
  return <figure className="nb-art">
    <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" role="img"
      aria-label="Line drawing of three narrow columns of handwriting side by side, one line running across all three at the same height, and a reed pen resting over them.">
      <circle cx="200" cy="200" r="172" fill="currentColor" fillOpacity=".035" opacity=".5" />
      <circle className="nb-orbit" cx="200" cy="200" r="188" strokeDasharray="1.5 8" opacity=".5" />
      {columns.map((x, c) => <g key={x}>
        <path d={`M${x} 102h46v198h-46Z`} fill="currentColor" fillOpacity=".045" />
        {Array.from({ length: 15 }, (_, i) => {
          const y = 116 + i * 12.4, short = (i + c * 2) % 5 === 4;
          return <path key={i} d={`M${x + 6} ${y}h${short ? 22 : 34}`} strokeDasharray={i % 3 === c ? "5 2 9 2" : "8 2 4 2"} opacity={i === 7 ? 0 : .55} />;
        })}
      </g>)}
      <path className="nb-art-tie" d="M124 203c14-5 26 5 40 0 4-1 8-2 12 0 14 5 26-5 40 0 4 1 8 2 12 0 14-5 26 5 40 0" strokeWidth="1.6" />
      {columns.map((x) => <circle key={x} cx={x + 23} cy="203" r="2.4" fill="currentColor" />)}
      <path d="M318 62 196 268" strokeWidth="1.5" />
      <path d="M322 58 314 70M196 268l-7 20 13-14" />
      <path d="M200 262l-3 7" opacity=".7" />
      <path d="M96 318h208" opacity=".35" />
      <path className="nb-spark" d="M84 118v14M77 125h14" /><path className="nb-spark nb-spark-b" d="M318 296v12M312 302h12" />
    </svg>
    <figcaption><span>Many hands.</span><span>Each one named.</span><small>Illustrative forms · not manuscript facsimiles</small></figcaption>
  </figure>;
}

export function Landing() {
  const letters = D.paul.groups.reduce((n, g) => n + g.letters.length, 0);
  const figures: [string, string, string][] = [
    ["Books", String(D.referenceTable.length), "each one line in the table at the end, in the order of the canon"],
    ["Letters naming Paul", String(letters), `in three groups by how scholars have weighed them; ${D.paul.groups[0].letters.length} accepted by almost all`],
    ["Gospels", String(D.referenceTable.filter((r) => GOSPELS.includes(r.book)).length), "none of the four names its writer in its text"],
    ["Early witnesses", String(D.witnesses.records.length), "Papias to Clement of Alexandria, restated from translations, not quoted"],
  ];
  return <>
    <div className="nb-intro">
      <div>
        <StudyTrail area="texts" />
        <p className="nb-eyebrow">Witnesses · Sources · Signatures · Dates</p>
        <h1>How the New Testament books were written<em>who wrote it, who said so</em></h1>
        <p className="nb-lead">{D.question}</p>
        <p className="nb-lede"><Text text={D.premise} /></p>
      </div>
      <Hero />
    </div>
    <dl className="nb-figures">{figures.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>
    <div className="nb-outcomes">
      <p className="nb-kicker">By the end you can</p>
      <ol>{D.outcomes.map((o) => <li key={o}><Text text={o} /></li>)}</ol>
    </div>
    <nav className="nb-chapters" aria-label="On this page">
      {CHAPTERS.map(([id, label], i) => <a key={id} href={`#${id}`}><b>0{i + 1}</b>{label}</a>)}
    </nav>
  </>;
}
