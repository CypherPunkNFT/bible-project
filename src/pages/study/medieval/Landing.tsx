// The study's opening: the shared trail, the gold concept line, the title with its turn, the drawing and motto, the figures with what each
// stands on, the reader's outcomes and the chapters.
import { StudyTrail } from "@/components/study/StudyTrail";
import { D, sourceCounts } from "./model";

const CHAPTERS = [["mirror", "Written above, found below"], ["mission", "How the north was baptised"], ["powers", "Popes and kings"], ["school", "A question and its schools"], ["parish", "A walk to the altar"], ["claims", "Four claims tested"], ["stops", "Where it stops"]];

/** The study's own drawing, in the circle and orbit every study's opening uses: a sealed decree coming down on its cord to a small parish church. Symbolic: no one church or document. */
function Hero() {
  return <figure className="mv-art">
    <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Line drawing of a parchment with a hanging seal, its cord running down to a small parish church with a tower, a door and a yard wall.">
      <circle cx="200" cy="200" r="172" fill="currentColor" fillOpacity=".035" opacity=".5" />
      <circle className="mv-orbit" cx="200" cy="200" r="188" strokeDasharray="1.5 8" opacity=".5" />
      <path d="M142 58h116c-4 8-4 14 0 22 4 8 4 14 0 22H142c4-8 4-14 0-22-4-8-4-14 0-22Z" fill="currentColor" fillOpacity=".05" />
      <path d="M160 72h80M160 81h80M160 90h52" strokeDasharray="7 2 3 2" opacity=".7" />
      <path d="M200 102v44" />
      <circle cx="200" cy="158" r="12" fill="currentColor" fillOpacity=".14" />
      <path d="M194 158h12M200 152v12" opacity=".7" />
      <path d="M200 170v30" strokeDasharray="2 5" />
      <path d="M92 324v-74h44v-16l14-20 14 20v16h96l18-24 18 24v74" fill="currentColor" fillOpacity=".04" />
      <path d="M136 250v74M164 250v74M260 250v74M200 250h.01" opacity=".55" />
      <path d="M150 208v-16M144 198h12" />
      <path d="M278 226v-14M272 217h12" />
      <path d="M106 324v-26c0-16 18-16 18 0v26" />
      <path d="M180 282c0-14 16-14 16 0v14h-16ZM216 282c0-14 16-14 16 0v14h-16Z" opacity=".7" />
      <path d="M52 324h296M66 324v-12h40M294 324v-12h40" />
      <path d="M72 340h256" opacity=".3" />
      <path className="mv-spark" d="M64 112v14M57 119h14" /><path className="mv-spark mv-spark-b" d="M340 118v12M334 124h12" />
    </svg>
    <figcaption><span>Decreed at the top.</span><span>Lived in the parish.</span><small>Illustrative forms · no one church or document</small></figcaption>
  </figure>;
}

export function Landing() {
  const counts = sourceCounts(D.sources);
  const figures: [string, string, string][] = [
    ["Years", "About 850", "AD 500 to 1350 in the Latin West, with the East left to another study"],
    ["Pairs set side by side", String(D.pairs.length), "a decree and what is found near it, picked to show the gap, so they cannot measure how often rules were kept"],
    ["Places baptised", String(D.stations.length), "from Reims to Prussia, each with who wrote the story and how long after"],
    ["Sources listed", String(D.sources.length), `${counts.read} read whole, ${counts.part} in part, ${counts["second-hand"]} second-hand, ${counts.located} only located`],
  ];
  return <>
    <div className="mv-intro">
      <div>
        <StudyTrail area="church" />
        <p className="mv-eyebrow">Mission · Throne · School · Parish</p>
        <h1>The medieval church<em>what was ordered, and what reached the village</em></h1>
        <p className="mv-lead">Most of what survives was written by the people giving the orders.</p>
        <p className="mv-lede">A pope's list says he may depose emperors. An emperor then takes Rome. A council orders bishops to train their priests, and seven years later a curate in Berkshire cannot say what case the first word of his own prayer is in.</p>
        <p className="mv-lede">This study reads the church from about AD 500 to 1350 through its conversions, its quarrels with kings, its schools and its parish floors. In each it asks the same thing: who wrote this down, and how far did it reach?</p>
      </div>
      <Hero />
    </div>
    <dl className="mv-figures">{figures.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>
    <div className="mv-outcomes"><p className="mv-kicker">By the end you can</p><ul>{D.outcomes.map((o) => <li key={o}>{o}</li>)}</ul></div>
    <nav className="mv-chapters" aria-label="On this page">{CHAPTERS.map(([id, label], i) => <a key={id} href={`#${id}`}><b>0{i + 1}</b>{label}</a>)}</nav>
  </>;
}
