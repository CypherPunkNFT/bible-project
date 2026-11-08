// The study's opening: the shared trail, the gold concept line, the title with its turn, the lead, the drawing in its circle and
// orbit with the motto, the figures bar (every number worked out by the build from the record), the outcomes and the chapters.
import { StudyTrail } from "@/components/study/StudyTrail";
import { D, LD } from "./model";
import { T } from "./parts";

const CHAPTERS = [["slice", "A hundred kilometres, five lands"], ["climb", "Up and down"], ["rain", "Rain, not river"], ["water", "Where the water is"],
  ["roads", "Roads and battles"], ["places", "Places and proposals"], ["claims", "Four claims tested"], ["stops", "Where it stops"]];

/** The study's drawing: a slice of ground from the sea over the ridge, down into the rift and up onto the plateau, with a cloud
 *  drifting in from the sea. Illustrative, not to scale. */
function Hero() {
  return <figure className="ls-art">
    <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" role="img"
      aria-label="Line drawing of a slice of land: the sea on the left, low hills, a high ridge with a small walled town, a deep valley with a lake, and a plateau on the right, with a rain cloud drifting in from the sea.">
      <circle cx="200" cy="200" r="172" fill="currentColor" fillOpacity=".035" opacity=".5" />
      <circle className="ls-orbit" cx="200" cy="200" r="188" strokeDasharray="1.5 8" opacity=".5" />
      <g className="ls-cloud">
        <path d="M70 128c-12 0-20-8-20-17s8-16 18-16c3-11 13-18 24-18 13 0 23 9 25 21 9 0 16 7 16 15s-7 15-16 15Z" fill="currentColor" fillOpacity=".06" />
        <path d="M74 152l-5 12M92 152l-5 12M110 152l-5 12M83 168l-4 10M101 168l-4 10" opacity=".55" strokeDasharray="3 4" />
      </g>
      <path d="M38 262h44" opacity=".6" /><path d="M42 272h32M50 281h20" opacity=".35" />
      <path d="M38 262c26 0 40-2 58-10s30-22 48-30 30-24 44-40c8-9 14-12 20-6 10 14 18 38 28 62s18 60 32 70c8 6 14 6 20-2 8-14 16-46 30-62 8-10 20-14 44-14"
        fill="currentColor" fillOpacity=".05" />
      <path d="M38 262c26 0 40-2 58-10s30-22 48-30 30-24 44-40c8-9 14-12 20-6 10 14 18 38 28 62s18 60 32 70c8 6 14 6 20-2 8-14 16-46 30-62 8-10 20-14 44-14V330H38Z"
        fill="currentColor" fillOpacity=".035" stroke="none" />
      <path d="M266 316c8 4 18 4 26 0" opacity=".7" /><path d="M262 322h34" opacity=".4" />
      <path d="M190 178v-12h6v-6h8v6h6v12" fill="currentColor" fillOpacity=".08" />
      <path d="M198 178v-6h4v6" opacity=".7" />
      <path d="M96 252c-6-6-4-12 0-14M102 250c6-6 3-11 0-13" opacity=".5" />
      <path d="M150 220c-3-6 0-10 4-11M330 206c-4-5-1-9 3-10M346 205c4-5 1-9-3-10" opacity=".5" />
      <path d="M38 340h324" opacity=".3" strokeDasharray="2 6" />
      <path className="ls-spark" d="M292 96v14M285 103h14" /><path className="ls-spark ls-spark-b" d="M338 140v10M333 145h10" />
    </svg>
    <figcaption><span>Sea, hills, rift.</span><span>Waiting on the rain.</span><small>Illustrative forms · not to scale</small></figcaption>
  </figure>;
}

export function Landing() {
  const f = LD.figures;
  const figures: [string, string, string][] = [
    ["Jerusalem to the Dead Sea", `About ${f.drop.metres.toLocaleString("en-GB")} m`, `of fall in about ${f.drop.km} km, from the record's rounded heights (each marked and checked)`],
    ["Rain, north against south", `About ${f.rainRatio}×`, `as much in Upper Galilee as at Beersheba: long-term averages, ${f.rain[0].words} mm against ${f.rain[2].words}`],
    ["Regions read", String(f.regions), "five bands on one line from the sea, and three basins off it: a selection, not a census"],
    ["Battle places", String(f.battles), "valleys and passes where Scripture's battles return, each with what the ground explains and what it does not"],
  ];
  return <>
    <div className="ls-intro">
      <div>
        <StudyTrail area="culture" />
        <p className="ls-eyebrow">Coast · Hills · Rift · Rain</p>
        <h1>The land <em>of the Bible</em></h1>
        <p className="ls-lead"><T text={D.premise} /></p>
        <p className="ls-lede"><T text={D.question} /></p>
      </div>
      <Hero />
    </div>
    <dl className="ls-figures">{figures.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>
    <div className="ls-outcomes"><p className="ls-kicker">By the end you can</p><ul>{D.outcomes.map((o) => <li key={o}><T text={o} /></li>)}</ul></div>
    <nav className="ls-chapters" aria-label="On this page">{CHAPTERS.map(([id, label], i) => <a key={id} href={`#${id}`}><b>0{i + 1}</b>{label}</a>)}</nav>
  </>;
}
