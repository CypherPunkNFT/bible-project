// 04 · Who wrote them, and how they were sung. A timeline from the metrical psalms English churches sang before Watts to
// the Olney Hymns; the three writers, each with a lifeline on one shared scale; and how a hymn was actually sung in their
// churches. Words floating with lines, no boxes; a moment reads out below the line
// (approved mock-up: design/hymn-directions/collection/history.js).
import { useState } from "react";
import { SectionHead } from "./parts";
import { tone } from "./model";

// The scale runs 1640–1845; 1562 sits at the left edge, behind a break in the line.
const START = 1640, END = 1845;
const at = (year: number) => `${Math.max(0, ((year - START) / (END - START)) * 100)}%`;
// Where each moment's label sits, so close years never collide: u = above the line, d = below; 1 near, 2 far.
const TIER: Record<number, string> = { 1562: "u1", 1696: "d1", 1707: "u1", 1715: "d2", 1719: "u2", 1748: "d1", 1764: "u1", 1773: "d2", 1779: "u2", 1835: "u1" };

const MOMENTS: [number, string, string][] = [
  [1562, "The Old Version", "Sternhold and Hopkins's whole psalter in metre is bound into English prayer books. For more than a century most English congregations sing the psalms and almost nothing else."],
  [1696, "The New Version", "Tate and Brady's smoother psalter appears. Churches argue over it for decades; it is still psalms, not hymns."],
  [1707, "Hymns and Spiritual Songs", "Isaac Watts, a young Independent minister in London, publishes hymns of his own making: songs about Christ, the cross and heaven, not only paraphrases of the psalms."],
  [1715, "Divine Songs for Children", "Watts writes simple songs for children to learn by heart. They stay in print for well over a century."],
  [1719, "The Psalms of David Imitated", "Watts recasts the psalms 'in the language of the New Testament', naming Christ where David looked ahead. Our God, our help in ages past and Joy to the world are both here."],
  [1748, "Newton turns", "John Newton, a sailor in the slave trade, cries to God in a storm off Ireland. His full break with the trade comes years later."],
  [1764, "Newton at Olney", "Newton becomes curate of Olney, a lace-making town in Buckinghamshire. The poet William Cowper moves there in 1767 to be near him."],
  [1773, "Amazing grace", "Newton writes it for the New Year's Day service of 1773, on David's prayer in 1 Chronicles 17. That same month Cowper falls into a long darkness."],
  [1779, "Olney Hymns", "The two publish their hymns for the town's weekly prayer meeting: 349 in three books, 281 of them Newton's."],
  [1835, "A tune for it", "In America, Amazing grace is printed with the tune now called New Britain. Until then, any tune in its metre could carry it."],
];
const PEOPLE = [
  { name: "Isaac Watts", born: 1674, died: 1748, tone: "--poetry", line: "Independent minister in London; never strong in health, he wrote most of his hymns for his own congregation to sing after the sermon.", count: "880 here" },
  { name: "John Newton", born: 1725, died: 1807, tone: "--history", line: "Sailor, slave-ship captain, then Anglican curate. Later rector in London, he spoke against the slave trade in print in 1788.", count: "280 here" },
  { name: "William Cowper", born: 1731, died: 1800, tone: "--prophets", line: "One of the finest poets of his day, and often in deep despair. His hymns hold both the trust and the dark.", count: "68 here" },
];
const SUNG: [string, string][] = [
  ["Words without music", "Hymn books printed only the words. Tunes lived in separate tune books, or in the clerk's head."],
  ["Lined out", "Few could read and books were dear, so a clerk read or sang each line and the congregation sang it back after him."],
  ["Any tune of the metre", "Common Metre (8.6.8.6) is the old ballad measure. A Common Metre text fits any Common Metre tune, which is why our pages give a metre and not a tune."],
  ["At the prayer meeting", "Olney Hymns were written for a weekday meeting in a large room, not for Sunday worship, where the metrical psalms still ruled."],
];

export function History() {
  const [shown, setShown] = useState(7);
  const [year, title, text] = MOMENTS[shown];
  return <div style={tone("--accent")}>
    <SectionHead num="04" kicker="Their history" title={<>Who wrote them, and <em>how they were sung</em></>}
      line="English churches sang the psalms in metre for over a century before Watts. These hymn books changed that, and were sung in a way that would surprise us now." />
    <div className="hh-time">
      <div className="hh-axis">
        {[1650, 1700, 1750, 1800].map((y) => <span key={y} className="hh-tick" style={{ left: at(y) }}>{y}</span>)}
        <span className="hh-break" aria-hidden="true" />
        {MOMENTS.map(([y, label], i) => <button key={y} type="button" className={`hh-dot hh-${TIER[y]}${y < START ? " hh-before" : ""}${i === shown ? " on" : ""}`} style={{ left: at(y) }}
          onMouseEnter={() => setShown(i)} onFocus={() => setShown(i)} onClick={() => setShown(i)}><i /><span><b>{y}</b>{label}</span></button>)}
        {PEOPLE.map((p, i) => <span key={p.name} className="hh-life" style={{ ...tone(p.tone), left: at(p.born), width: `calc(${at(p.died)} - ${at(p.born)})`, top: `${12.6 + i * 1.05}rem` }}><em>{p.name} · {p.born}–{p.died}</em></span>)}
      </div>
      <p className="hh-read" aria-live="polite"><b>{year} · {title}.</b> {text}</p>
    </div>
    <div className="hh-people">{PEOPLE.map((p) => <div key={p.name} className="hh-person" style={tone(p.tone)}><p className="k">{p.born}–{p.died} · {p.count}</p><h3>{p.name}</h3><p>{p.line}</p></div>)}</div>
    <div className="hh-sung"><p className="k">How they were sung</p>{SUNG.map(([h, t]) => <div key={h}><h4>{h}</h4><p>{t}</p></div>)}</div>
  </div>;
}
