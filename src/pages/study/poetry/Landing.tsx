// The study's opening: the shared trail, the gold concept line, the title with its turn, the drawing and motto, the figures bar
// with what each count stands on (each counted by the build in the held Hebrew and Berean), the outcomes, the question, the
// chapters and the site's stance beside the craft.
import { StudyTrail } from "@/components/study/StudyTrail";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, P } from "./model";
import { Prose, Refs } from "./parts";

const CHAPTERS: [string, string][] = [["lines", "Parallel lines"], ["folds", "Folds and frames"], ["letters", "The alphabet poems"],
  ["words", "Words that return"], ["story", "The storyteller"], ["greek", "Into Greek"], ["claims", "Claims and limits"]];

/** A scroll opened on two short lines, the second indented under the first, with a folded ribbon beneath. Illustrative. */
function Hero() {
  return <figure className="hpn-art">
    <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" role="img"
      aria-label="Line drawing of an open scroll showing two short lines, the second set in under the first, with a folded ribbon beneath.">
      <circle cx="200" cy="200" r="172" fill="currentColor" fillOpacity=".035" opacity=".5" />
      <circle className="hpn-orbit" cx="200" cy="200" r="188" strokeDasharray="1.5 8" opacity=".5" />
      <g transform="translate(78 120)">
        <path d="M22 0h200v120H22Z" fill="currentColor" fillOpacity=".05" />
        <ellipse cx="22" cy="60" rx="12" ry="62" fill="currentColor" fillOpacity=".08" />
        <ellipse cx="222" cy="60" rx="12" ry="62" fill="currentColor" fillOpacity=".08" />
        <path d="M22-2v-10M22 122v10M222-2v-10M222 122v10" strokeWidth="2" />
        <path className="hpn-line-a" d="M196 38H58" strokeWidth="2.4" strokeDasharray="22 5 9 5 30 5 14 5 40" />
        <path className="hpn-line-b" d="M180 68H86" strokeWidth="2.4" strokeDasharray="16 5 26 5 12 5 30" />
        <path d="M60 52c10 10 18 14 26 14" opacity=".55" strokeDasharray="2 3" />
        <path d="M86 66l-6-4m6 4-6 4" opacity=".55" />
      </g>
      <path d="M96 300c40-26 70-26 104 0s64 26 104 0" opacity=".45" />
      <path d="M96 312c40 26 70 26 104 0s64-26 104 0" opacity=".25" strokeDasharray="3 4" />
      <path className="hpn-spark" d="M84 96v14M77 103h14" /><path className="hpn-spark hpn-spark-b" d="M324 262v12M318 268h12" />
    </svg>
    <figcaption><span>Said once. Said again.</span><span>Left unsaid.</span><small>Illustrative form · not a manuscript facsimile</small></figcaption>
  </figure>;
}

export function Landing() {
  const { counts } = P;
  const figures: [string, string, string][] = [
    ["Letters", String(counts.letters), "the length of an alphabet poem: one line, verse or stanza for each"],
    ["Alphabet poems", String(counts.poems), "complete or nearly complete, in Psalms, Proverbs and Lamentations"],
    ["Verses in Psalm 119", String(counts.psalm119), "eight for each letter, counted in the Hebrew and in the Berean"],
    ["Verdicts in Genesis 1", String(counts.verdicts), "“good”, in the Berean and as טוב in the Hebrew; the last “very good”"],
  ];
  return <>
    <div className="hpn-intro">
      <div>
        <StudyTrail area="languages" />
        <p className="hpn-eyebrow">Line · Fold · Letter · Scene · Silence</p>
        <h1>Hebrew poetry and <em>biblical narrative</em></h1>
        <p className="hpn-lede"><Prose text={D.premise} /></p>
      </div>
      <Hero />
    </div>
    <dl className="hpn-figures">{figures.map(([name, value, note]) => <div key={name}><dt>{name}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>
    <div className="hpn-outcomes"><p className="hpn-kicker">By the end you can</p><ul>{D.outcomes.map((o) => <li key={o}><Prose text={o} /></li>)}</ul></div>
    <p className="hpn-question"><Checked text={D.question} /></p>
    <nav className="hpn-chapters" aria-label="On this page">{CHAPTERS.map(([id, name], i) => <a key={id} href={`#${id}`}><b>{String(i + 1).padStart(2, "0")}</b>{name}</a>)}</nav>
    <aside className="hpn-stance" aria-label={D.stance.head}>
      <div>
        <p className="hpn-kicker">{D.stance.head}</p>
        <p className="hpn-confession"><Checked text={D.stance.confession} /><small>{D.stance.confessionSource}</small></p>
      </div>
      <div>
        <p className="hpn-para"><Prose text={D.stance.body} /></p>
        <Refs labels={D.stance.verses} lead="The text itself" />
      </div>
    </aside>
  </>;
}
