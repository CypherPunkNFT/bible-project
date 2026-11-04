// The study's opening: the shared trail, the gold concept line, the title with its turn, the drawing and motto, the figures with what
// each stands on, and the way through the page.
import { StudyTrail } from "@/components/study/StudyTrail";
import { D, H, thousands } from "./model";
import { He } from "./parts";

const c = H.counts;
const FIGURES: [string, string, string][] = [
  ["Letters", "22", "five of them take another shape at a word's end; none is a vowel of its own"],
  ["Hebrew words counted", thousands(c.hebrewWords), `in STEP Bible's tagged text, with ${thousands(c.aramaicWords)} Aramaic words set aside`],
  ["Point marks around the letters", thousands(c.pointsTotal), `around ${thousands(c.lettersTotal)} letters, counting vowels and dots but not accents`],
  ["Commonest verb form", thousands(c.forms.w), `the narrative form, by STEP's tags, of ${thousands(c.verbsTotal)} verbs`],
];
const CHAPTERS = [["line", "Peel the line"], ["letters", "Twenty-two letters"], ["points", "The points"], ["bench", "Sound it out"], ["roots", "Three-letter roots"], ["verb", "The verb"], ["stops", "Where it stops"]];

/** The study's own drawing, in the circle and orbit every study's opening uses. Symbolic: not a page from any manuscript. */
function Hero() {
  return <figure className="hw-art">
    <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" role="img" aria-label="Line drawing of the Hebrew word bara, he created, hanging from a ruled line with its vowel points drifting beneath it, a reed pen above, and an arrow running from right to left.">
      <circle cx="200" cy="200" r="172" fill="currentColor" fillOpacity=".035" opacity=".5" />
      <circle className="hw-orbit" cx="200" cy="200" r="188" strokeDasharray="1.5 8" opacity=".5" />
      <path d="M62 158H338" /><path d="M62 150H338" opacity=".35" /><path d="M62 276H338" opacity=".35" />
      <text x="200" y="240" textAnchor="middle" direction="rtl" lang="he" className="hw-art-word" fill="currentColor" stroke="none">ברא</text>
      <g className="hw-drift" fill="currentColor" stroke="none">
        <circle cx="238" cy="206" r="3" /><path d="M153 256h20" stroke="currentColor" strokeWidth="2.4" /><path d="M163 256v8" stroke="currentColor" strokeWidth="2.4" />
      </g>
      <g className="hw-drift hw-drift-b"><path d="M226 256h20" strokeWidth="2.4" /><path d="M236 256v8" strokeWidth="2.4" /></g>
      <path d="M284 78 l-56 56 l-8 16 l16 -8 l56 -56 c5 -5 5 -9 2 -12 c-3 -3 -5 -1 -10 4 Z" /><path d="M228 134l8 8" /><path d="M220 150l8 -8" />
      <path d="M322 320H96" /><path d="M108 310l-12 10l12 10" />
      <path className="hw-spark" d="M72 92v14M65 99h14" /><path className="hw-spark hw-spark-b" d="M340 300v12M334 306h12" />
    </svg>
    <figcaption><span>Read from the right.</span><span>Sound it before you look it up.</span><small>Illustrative form · not a facsimile</small></figcaption>
  </figure>;
}

export function Landing() {
  return <>
    <div className="hw-intro">
      <div>
        <StudyTrail area="languages" />
        <p className="hw-eyebrow">Letter · Point · Root · Form</p>
        <h1 tabIndex={-1}>How Hebrew works<em>A line you can sound out</em></h1>
        <p className="hw-lead">Letters on the line. Vowels around them.</p>
        <p className="hw-lede">You open a commentary and meet <He>בָּרָא</He>. It can look like a wall. It is twenty-two letters, a set of small marks, and a handful of habits, and a little patience is enough to begin hearing it.</p>
        <p className="hw-lede">This page does not teach you to translate. It teaches you to say a verse of Genesis or the Psalms aloud, to see how a word is built, and to ask of each form: what does the form show, and what am I reading into it?</p>
      </div>
      <Hero />
    </div>
    <dl className="hw-figures">{FIGURES.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>
    <div className="hw-outcomes"><p className="hw-kicker">By the end you can</p><ul>{D.outcomes.map((o) => <li key={o}>{o}</li>)}</ul></div>
    <nav className="hw-chapters" aria-label="On this page">{CHAPTERS.map(([id, label], i) => <a key={id} href={`#${id}`}><b><He>{D.letters[i].glyph}</He> 0{i + 1}</b>{label}</a>)}</nav>
  </>;
}
