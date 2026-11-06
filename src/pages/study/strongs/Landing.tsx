// The study's opening: the shared trail, the gold concept line, the title with its turn, the drawing and motto, the true counts.
import { StudyTrail } from "@/components/study/StudyTrail";
import { D, SN } from "./model";
import { formatNumber } from "@/lib/site-format";

const fmt = (n: number) => formatNumber(n);
const { counts } = SN;
const inUse = counts.greekTop - counts.greekUnused;

const FIGURES: [string, string, string][] = [
  ["Hebrew numbers", fmt(counts.hebrewTop), "H1 to H8674, the Old Testament's words, Aramaic among them"],
  ["Greek numbers", fmt(counts.greekTop), `G1 to G5624; ${fmt(inUse)} hold a word and ${counts.greekUnused} were never used`],
  ["King James tags", fmt(counts.rawTags), "on this site, counted 2026-10-31; a tag is not an exact count of uses"],
  ["Numbers tagged", fmt(counts.numbersTagged.hebrew + counts.numbersTagged.greek), `${fmt(counts.numbersTagged.hebrew)} Hebrew and ${fmt(counts.numbersTagged.greek)} Greek appear in those tags`],
];
const CHAPTERS = [["numbered", "Numbered by spelling"], ["renderings", "One number, many words"], ["mistakes", "Three mistakes"], ["bench", "Using them well"], ["stops", "Where it stops"]];

/** Our own drawing: an open reference book, a number on a thread, and the two scripts. Symbolic, not a facsimile. */
function Concordance() {
  const lines = (x: number, y: number, n: number, w: number) => Array.from({ length: n }, (_, i) => <path key={`${x}-${i}`} d={`M${x} ${y + i * 11}h${w - (i % 3) * 9}`} opacity={i % 3 === 0 ? 0.65 : 0.3} />);
  return <figure className="sn-art">
    <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Line drawing of an open reference book with a numbered tag on a thread leading to a Greek and a Hebrew word.">
      <circle cx="200" cy="200" r="172" fill="currentColor" fillOpacity=".035" opacity=".5" />
      <circle className="sn-orbit" cx="200" cy="200" r="188" strokeDasharray="1.5 8" opacity=".5" />
      <path d="M78 150q61-22 122 2q61-24 122-2v142q-61-22-122 2q-61-24-122-2Z" fill="var(--surface)" />
      <path d="M200 152v142M70 158v142q65-22 130 2q65-24 130-2V158" opacity=".45" />
      {lines(94, 176, 9, 88)}{lines(216, 176, 9, 88)}
      <rect x="216" y="208" width="70" height="11" rx="2" fill="currentColor" fillOpacity=".14" stroke="none" />
      <path className="sn-thread" d="M286 214q44-30 28-86" strokeDasharray="3 5" />
      <g transform="rotate(8 300 96)"><path d="M272 76h58l14 20-14 20h-58Z" fill="var(--surface)" /><circle cx="334" cy="96" r="2.4" />
        <text x="300" y="104" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="var(--font-serif)" fontSize="23">26</text></g>
      <text x="90" y="110" fill="currentColor" stroke="none" fontFamily="var(--font-serif)" fontSize="30" lang="el">ἀγάπη</text>
      <text x="196" y="72" fill="currentColor" stroke="none" fontFamily="var(--font-hebrew)" fontSize="28" lang="he" direction="rtl" opacity=".75">רוּחַ</text>
      <path className="sn-spark" d="M66 72v14M59 79h14" /><path className="sn-spark sn-spark-b" d="M348 306v12M342 312h12" />
    </svg>
    <figcaption><span>Numbered by spelling.</span><span>Read in the verse.</span><small>Illustrative form · not a facsimile</small></figcaption>
  </figure>;
}

export function Landing() {
  return <>
    <div className="sn-intro">
      <div>
        <StudyTrail area="languages" />
        <p className="sn-eyebrow">Number · Word · Verse</p>
        <h1>Strong's numbers<em>A label, not a meaning</em></h1>
        <p className="sn-lead">An address in a list. Not a definition.</p>
        <p className="sn-lede">In 1890 James Strong gave every Hebrew and Greek word behind the King James Bible a number, so a reader who knew neither language could trace a word home. It is still one of the most useful tools a Bible reader can pick up.</p>
        <p className="sn-lede">It is also easy to ask too much of it. This study shows what the numbers are, how to use the tools this site already has for them, and three mistakes to catch, in your own reading and in what you hear.</p>
      </div>
      <Concordance />
    </div>
    <dl className="sn-figures">{FIGURES.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>
    <div className="sn-outcomes"><p className="sn-kicker">By the end you can</p><ul>{D.outcomes.map((o) => <li key={o}>{o}</li>)}</ul></div>
    <nav className="sn-chapters" aria-label="On this page">{CHAPTERS.map(([id, label], i) => <a key={id} href={`#${id}`}><b>0{i + 1}</b>{label}</a>)}</nav>
  </>;
}
