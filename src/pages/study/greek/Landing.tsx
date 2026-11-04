// The study's opening: the shared trail, the gold concept line, the title with its turn, the drawing and motto, the figures with what
// each stands on, and the way through the page.
import { StudyTrail } from "@/components/study/StudyTrail";
import { D, G, percent, thousands } from "./model";
import { Gk } from "./parts";

const c = G.counts;
const FIGURES: [string, string, string][] = [
  ["Letters", "24", "fifteen of them are not new shapes to a reader of English"],
  ["Greek words counted", thousands(c.words), "those STEP Bible marks as in the Nestle-Aland 28th edition, a modern printed Greek text"],
  ["Nouns with a case ending", thousands(c.nouns), `${thousands(c.cases.N)} marked as the doer or the thing named, ${thousands(c.cases.A)} as the receiver, by STEP's tags`],
  ["Verbs that state a thing", `${percent(c.indicative, c.verbs)}%`, `${thousands(c.indicative)} indicative forms, of ${thousands(c.verbs)} verbs, by STEP's tags`],
];
const CHAPTERS = [["move", "Move the words"], ["letters", "Twenty-four letters"], ["endings", "The endings"], ["article", "The small word"], ["verb", "The verb"], ["everyday", "Everyday Greek"], ["stops", "Where it stops"]];
const ENDINGS: [string, number][] = [["ος", 74], ["ου", 137], ["ῳ", 200], ["ον", 263], ["οι", 326]];

/** The study's own drawing, in the circle and orbit every study's opening uses. Symbolic: not a page from any manuscript. */
function Hero() {
  return <figure className="ng-art">
    <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" role="img" aria-label="Line drawing of the Greek stem log, of the word logos, with dotted threads running from it to five different endings.">
      <circle cx="200" cy="200" r="172" fill="currentColor" fillOpacity=".035" opacity=".5" />
      <circle className="ng-orbit" cx="200" cy="200" r="188" strokeDasharray="1.5 8" opacity=".5" />
      <text x="72" y="222" lang="grc" className="ng-art-stem" fill="currentColor" stroke="none">λόγ</text>
      {ENDINGS.map(([end, y], i) => <g key={end}>
        <path className="ng-thread" style={{ animationDelay: `${i * .7}s` }} d={`M178 200C225 200 225 ${y} 268 ${y}`} strokeDasharray="1.5 5" />
        <circle cx="268" cy={y} r="2.2" fill="currentColor" stroke="none" />
        <text x="280" y={y + 10} lang="grc" className="ng-art-end" fill="currentColor" stroke="none">{end}</text>
      </g>)}
      <path d="M70 240H172" /><path d="M70 246H172" opacity=".4" />
      <path className="ng-spark" d="M92 112v14M85 119h14" /><path className="ng-spark ng-spark-b" d="M108 300v12M102 306h12" />
    </svg>
    <figcaption><span>Move the words.</span><span>Watch the endings.</span><small>Illustrative form · not a facsimile</small></figcaption>
  </figure>;
}

export function Landing() {
  return <>
    <div className="ng-intro">
      <div>
        <StudyTrail area="languages" />
        <p className="ng-eyebrow">Alphabet · Ending · Order · Verb</p>
        <h1 tabIndex={-1}>How New Testament Greek works<em>The endings do the work</em></h1>
        <p className="ng-lead">A sermon says “in the Greek”. Now you can look.</p>
        <p className="ng-lede">In English, “God loved the world” and “the world loved God” differ only by word order. In the Greek of John and Romans the words can stand in almost any order, because each one's ending says what it is doing.</p>
        <p className="ng-lede">This page does not teach you to translate. It teaches you to sound out <Gk>λόγος</Gk>, to find who acts and who receives, and to ask of each claim about a Greek verb: is that in the form, or in the verse?</p>
      </div>
      <Hero />
    </div>
    <dl className="ng-figures">{FIGURES.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>
    <div className="ng-outcomes"><p className="ng-kicker">By the end you can</p><ul>{D.outcomes.map((o) => <li key={o}>{o}</li>)}</ul></div>
    <nav className="ng-chapters" aria-label="On this page">{CHAPTERS.map(([id, label], i) => <a key={id} href={`#${id}`}><b>0{i + 1}</b>{label}</a>)}</nav>
  </>;
}
