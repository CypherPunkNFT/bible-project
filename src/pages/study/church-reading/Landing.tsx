// The study's opening: the shared trail, the gold concept line, the title with its turn, the drawing and motto, the figures with what
// each stands on.
import { StudyTrail } from "@/components/study/StudyTrail";
import { CR, D, longestGap } from "./model";

const CHAPTERS = [["page", "The glossed page"], ["questions", "Four questions"], ["senses", "One Jerusalem, four ways"], ["time", "A long argument"], ["whom", "Expel whom?"], ["claims", "Four claims tested"], ["stops", "Where it stops"]];
const CENTRE_LINES = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const MARGIN_LINES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const TIES = [[138, 136, 170, 134], [262, 188, 230, 186], [138, 224, 174, 222], [262, 260, 226, 258]];

/** The study's own drawing, in the circle and orbit every study's opening uses: a leaf with its text at the centre and its readers crowding the margins, tied to the words. Symbolic: not a facsimile. */
function Hero() {
  return <figure className="hc-art">
    <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Line drawing of a manuscript leaf: a column of large lines in the middle, small lines of notes filling both margins, and fine ties joining notes to words.">
      <circle cx="200" cy="200" r="172" fill="currentColor" fillOpacity=".035" opacity=".5" />
      <circle className="hc-orbit" cx="200" cy="200" r="188" strokeDasharray="1.5 8" opacity=".5" />
      <path d="M104 72h192v256H104z" fill="currentColor" fillOpacity=".05" />
      <path d="M104 72h192v256H104z" transform="translate(5 5)" opacity=".25" />
      <path d="M152 72v256M248 72v256" opacity=".22" strokeDasharray="2 5" />
      {CENTRE_LINES.map((i) => <path key={i} d={`M${166 + (i % 3)} ${108 + i * 26}h${64 - ((i * 5) % 12)}`} strokeWidth="2.6" />)}
      <path d="M163 84h18v16h-18zM168 96l4-10 4 10M169.500 93h5" strokeWidth="1" />
      {MARGIN_LINES.map((i) => <g key={i} opacity={i % 4 === 3 ? .35 : .7}>
        <path d={`M114 ${92 + i * 16}h${28 - ((i * 7) % 11)}`} strokeWidth=".9" />
        <path d={`M258 ${92 + i * 16}h${28 - ((i * 5) % 13)}`} strokeWidth=".9" />
      </g>)}
      <g className="hc-ties">{TIES.map(([x1, y1, x2, y2]) => <g key={`${x1}${y1}`}><path d={`M${x1} ${y1}L${x2} ${y2}`} strokeDasharray="2 3" /><circle cx={x1} cy={y1} r="2.2" fill="currentColor" stroke="none" /><circle cx={x2} cy={y2} r="1.4" fill="currentColor" stroke="none" /></g>)}</g>
      <path className="hc-spark" d="M60 96v14M53 103h14" /><path className="hc-spark hc-spark-b" d="M342 300v12M336 306h12" />
    </svg>
    <figcaption><span>One passage.</span><span>Every reader's margin.</span><small>Illustrative form · not a manuscript facsimile</small></figcaption>
  </figure>;
}

export function Landing() {
  const gap = longestGap(D.readers);
  const figures: [string, string, string][] = [
    ["Readers", String(D.readers.length), "from about AD 200 to 2010: a selection to reach each stage, not a census"],
    ["Verses", "11", "Galatians 4:21 to 31, every reader on the same words"],
    ["Paul's Greek word", `${CR.word.times}×`, "tagged in the site's King James at this verse, and nowhere else in the Bible"],
    ["Years with no reader here", String(gap.years), `about AD ${gap.from} to ${gap.to}: the gap is this selection's, not the church's`],
  ];
  return <>
    <div className="hc-intro">
      <div>
        <StudyTrail area="church" />
        <p className="hc-eyebrow">Letter · Figure · Sense · Margin</p>
        <h1>How the church has read the Bible<em>one passage, twelve readers</em></h1>
        <p className="hc-lead">Each came asking something. The asking shows in the reading.</p>
        <p className="hc-lede">In Galatians 4 Paul reads the story of Hagar and Sarah, and says these things “serve as illustrations”. Behind that phrase is a single Greek word that Christians have argued over ever since: is this allegory, a type, or a picture? What does it allow the next reader to do?</p>
        <p className="hc-lede">So this study lays eleven verses out as a medieval page laid out Scripture: the text in the middle, its readers in the margin. Origen, the four senses, the Reformers' plain sense and modern critical reading all meet on the same words, and the page keeps apart what each one wrote, what this study infers from it, and where the evidence stops.</p>
      </div>
      <Hero />
    </div>
    <dl className="hc-figures">{figures.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>
    <div className="hc-outcomes"><p className="hc-kicker">By the end you can</p><ul>{D.outcomes.map((o) => <li key={o}>{o}</li>)}</ul></div>
    <nav className="hc-chapters" aria-label="On this page">{CHAPTERS.map(([id, label], i) => <a key={id} href={`#${id}`}><b>0{i + 1}</b>{label}</a>)}</nav>
  </>;
}
