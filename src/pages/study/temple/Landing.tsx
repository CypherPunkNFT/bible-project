// The study's opening: the shared trail, the gold concept line, the title with its turn, the drawing of nested courts round one
// small room with its motto, the figures bar with what each count stands on, the outcomes, the question, the witness key and the
// page's chapters.
import { StudyTrail } from "@/components/study/StudyTrail";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, TD } from "./model";
import { Prose, Tag } from "./parts";

const CHAPTERS = [["houses", "Four houses"], ["world", "Its world"], ["platform", "Herod's platform"], ["priests", "Priests"],
  ["calendar", "The day and the year"], ["fall", "AD 70"], ["claims", "Claims"], ["stops", "Where it stops"]];

/** Four nested outlines round one small square, a lampstand faint at the centre. Illustrative: no plan is traced. */
function Hero() {
  const rings = [[66, 150], [96, 196], [128, 240], [160, 286]];
  return <figure className="tw-art">
    <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" role="img"
      aria-label="Line drawing of four rectangles nested one inside another round a small square room, with a seven-branched lampstand drawn faintly at the centre.">
      <circle cx="200" cy="200" r="172" fill="currentColor" fillOpacity=".035" opacity=".5" />
      <circle className="tw-orbit" cx="200" cy="200" r="188" strokeDasharray="1.5 8" opacity=".5" />
      {rings.map(([h, w], i) => <rect key={w} x={200 - w / 2} y={200 - h / 2} width={w} height={h} rx="1.5"
        strokeDasharray={i === 1 ? "6 4" : i === 3 ? "1.5 4" : undefined} opacity={0.85 - i * 0.14} fill="currentColor" fillOpacity={0.025} />)}
      <rect x="171" y="182" width="36" height="36" fill="currentColor" fillOpacity=".12" strokeWidth="1.5" />
      <g opacity=".55" strokeWidth=".9">
        <path d="M189 213v-22M181 191c0 8 4 12 8 12s8-4 8-12M175 191c0 12 6 17 14 17s14-5 14-17" />
        <path d="M184 213h10" />
        <path d="M175 190v-1m6 2v-1m8 1v-2m8 2v-1m6 1v-2" strokeWidth="1.6" />
      </g>
      <path d="M232 200h44M124 200h-44" strokeDasharray="1 4" opacity=".45" />
      <path className="tw-spark" d="M80 96v14M73 103h14" /><path className="tw-spark tw-spark-b" d="M322 292v12M316 298h12" />
    </svg>
    <figcaption><span>Measured in cubits.</span><span>Kept in feasts.</span><small>Illustrative forms · not plans to scale</small></figcaption>
  </figure>;
}

export function Landing() {
  const { counts } = TD;
  const inner = TD.plans.find((p) => p.id === "sol-inner");
  const figures: [string, string, string][] = [
    ["Houses", String(counts.houses), "a tent, Solomon's, the second, Herod's: one holy room kept in each"],
    ["Cubits, the inner room", String(inner?.w ?? ""), "Solomon's, every way (1 Kings 6:20); the tabernacle's 10 is inferred"],
    ["Feasts on the year", String(counts.feasts), "each named first as Jews name and keep it"],
    ["Priestly divisions", String(counts.divisions), "serving in turn; Zechariah's, Abijah's, was the eighth"],
  ];
  return <>
    <div className="tw-intro">
      <div>
        <StudyTrail area="culture" />
        <p className="tw-eyebrow">Tent · House · Courts · Feasts</p>
        <h1>The temple and Israel's worship<em>one holy room, four houses</em></h1>
        <p className="tw-lead">A tent in Exodus, cedar in Kings, a lot in Luke, a feast in John, the stones in Mark 13. Put them in one place, and ask who told you each.</p>
        <p className="tw-lede"><Prose text={D.premise} /></p>
      </div>
      <Hero />
    </div>
    <dl className="tw-figures">{figures.map(([name, value, note]) => <div key={name}><dt>{name}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>
    <div className="tw-outcomes"><p className="tw-kicker">By the end you can</p><ol>{D.outcomes.map((o, i) => <li key={o}><b>{i + 1}</b><Prose text={o} /></li>)}</ol></div>
    <p className="tw-question"><Checked text={D.question} /></p>
    <div className="tw-key">
      <p className="tw-kicker">Every line on this page carries its witness</p>
      <ul>
        <li><Tag kind="scripture" /> the record this site holds true</li>
        <li><Tag kind="josephus" /> a priest who saw Herod's temple, writing in the 70s to 90s AD</li>
        <li><Tag kind="rabbinic" /> written down by rabbis more than a century after the fall</li>
        <li><Tag kind="ground" /> a find, with its place where one is recorded</li>
      </ul>
      <p className="tw-caption">A dashed line is inferred and says so. A missing measurement is left as a gap. {counts.checks} passages carry an editor's check mark; {counts.open} are still open.</p>
    </div>
    <nav className="tw-chapters" aria-label="On this page">{CHAPTERS.map(([id, name], i) => <a key={id} href={`#${id}`}><b>{String(i + 1).padStart(2, "0")}</b>{name}</a>)}</nav>
  </>;
}
