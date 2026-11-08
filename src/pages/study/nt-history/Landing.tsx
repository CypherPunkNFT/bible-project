// The study's opening: the shared trail, the gold concept line, the title with its turn, the drawing and motto, the figures bar
// with what each count stands on, the outcomes, the question, and the site's stance beside the chronology.
import { StudyTrail } from "@/components/study/StudyTrail";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, NH } from "./model";
import { Prose, Refs } from "./parts";

const CHAPTERS = [["lattice", "Seven names"], ["herods", "Which Herod?"], ["rome", "Rome arrives"], ["witnesses", "Witnesses outside"], ["years", "The years of Jesus"],
  ["trial", "The trial"], ["paul", "Paul's fixed points"], ["revolt", "The revolt"], ["claims", "Claims"], ["stops", "Where it stops"]];

/** A coin in the style of Herod's issues, a broken inscription and a scroll's edge, in the circle and orbit every study's opening uses. Symbolic: no real coin or stone is traced. */
function Hero() {
  return <figure className="nh-art">
    <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" role="img"
      aria-label="Line drawing of an ancient coin with a tripod and wreath, a broken stone inscription with a few letters, and the rolled edge of a scroll.">
      <circle cx="200" cy="200" r="172" fill="currentColor" fillOpacity=".035" opacity=".5" />
      <circle className="nh-orbit" cx="200" cy="200" r="188" strokeDasharray="1.5 8" opacity=".5" />
      <g transform="translate(150 118)">
        <circle r="54" fill="currentColor" fillOpacity=".07" />
        <circle r="47" strokeDasharray="1 3.5" opacity=".7" />
        <path d="M-16 18 0-22 16 18M-10 4h20M-20 18h40M0-22v-6" />
        <path d="M-28-8c-6 10-6 24 2 34M28-8c6 10 6 24-2 34" opacity=".75" />
        <path d="M-31 0l-5-3m5 9-6-1m6 8-5 2M31 0l5-3m-5 9 6-1m-6 8 5 2" strokeWidth=".9" opacity=".7" />
      </g>
      <g transform="translate(206 168)">
        <path d="M0 8 10 0h104l12 14-6 22 10 18-14 34H18L6 70l8-22L0 30Z" fill="currentColor" fillOpacity=".06" />
        <path d="M22 26h28M58 26h22M88 26h20M22 44h18M48 44h34M24 62h40" strokeWidth="1.6" opacity=".8" />
        <path d="M86 58l10 14 8-10 10 16" opacity=".5" />
      </g>
      <g transform="translate(96 262)">
        <path d="M14 0h176c8 0 12 9 12 20s-4 20-12 20H14" fill="currentColor" fillOpacity=".05" />
        <ellipse cx="14" cy="20" rx="8" ry="20" />
        <path d="M14 8c3-2 4 22 0 24" opacity=".6" />
        <path d="M40 12h120M40 20h136M40 28h96" strokeDasharray="7 2 3 2" opacity=".75" />
      </g>
      <path className="nh-spark" d="M76 92v14M69 99h14" /><path className="nh-spark nh-spark-b" d="M330 250v12M324 256h12" />
    </svg>
    <figcaption><span>Seven names.</span><span>One year.</span><small>Illustrative forms · not facsimiles</small></figcaption>
  </figure>;
}

export function Landing() {
  const { counts } = NH;
  const figures: [string, string, string][] = [
    ["Years", String(counts.years), "63 BC to AD 73, counted with no year zero"],
    ["Rulers of Herod's family", String(counts.herods), "named in the New Testament, most of them simply “Herod”"],
    ["Outside writers", String(counts.writers), "not Christians, writing before about AD 120"],
    ["Dates for the cross", String(counts.crossDates), "both shown, neither chosen"],
  ];
  return <>
    <div className="nh-intro">
      <div>
        <StudyTrail area="history" />
        <p className="nh-eyebrow">Kings · Governors · Witnesses · Years</p>
        <h1>New Testament history<em>from Herod to the fall of Jerusalem</em></h1>
        <p className="nh-lead">Every ruler the New Testament names is a thread out of the Bible. Follow it, and ask what it fixes.</p>
        <p className="nh-lede"><Prose text={D.premise} /></p>
      </div>
      <Hero />
    </div>
    <dl className="nh-figures">{figures.map(([name, value, note]) => <div key={name}><dt>{name}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>
    <div className="nh-outcomes"><p className="nh-kicker">By the end you can</p><ul>{D.outcomes.map((o) => <li key={o}><Prose text={o} /></li>)}</ul></div>
    <p className="nh-question"><Checked text={D.question} /></p>
    <nav className="nh-chapters" aria-label="On this page">{CHAPTERS.map(([id, name], i) => <a key={id} href={`#${id}`}><b>{String(i + 1).padStart(2, "0")}</b>{name}</a>)}</nav>
    <aside className="nh-stance" aria-label={D.stance.head}>
      <div>
        <p className="nh-kicker">{D.stance.head}</p>
        <p className="nh-confession"><Checked text={D.stance.confession} /><small>{D.stance.confessionSource}</small></p>
      </div>
      <div>
        <p className="nh-para"><Prose text={D.stance.body} /></p>
        <p className="nh-caption"><Prose text={D.yearRule} /></p>
        <Refs labels={D.stance.verses.slice(0, 2)} lead="The text itself" />
      </div>
    </aside>
  </>;
}
