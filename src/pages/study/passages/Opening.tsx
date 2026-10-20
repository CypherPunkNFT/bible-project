// The opening (mock-up direction A's landing, as D keeps it): the title and route beside a codex leaf of Romans 5:1 under
// a lens, where the first hand's ω gives way to the corrector's ο and back, slowly, for ever; then one row of figures,
// every one counted from the open collection and the study's own content. The heading is the studies' standard one
// (StudyTrail, a line of page words, the title; colours from study-trail.css), in place of the mock-up's crumb.
import { useMemo } from "react";
import { StudyTrail } from "@/components/study/StudyTrail";
import { useMs } from "../manuscripts/context";
import { formatNumber, isDated } from "../manuscripts/model";
import { cases, hero, readingsFor, sources, stops } from "./evidence";
import { inkLines } from "./ink";
import { BOOK_OF, gapOf, studyRecords } from "./model";

/** The opening drawing. Letters are typeset, not traced; the page is a drawing of the form. */
function HeroArt() {
  return <figure className="ah-art" aria-hidden="true"><svg viewBox="0 0 440 340">
    <defs><clipPath id="ah-lens"><circle cx="300" cy="168" r="62" /></clipPath></defs>
    <ellipse className="ms-orbit" cx="220" cy="172" rx="206" ry="140" />
    <ellipse className="ms-orbit ms-orbit-2" cx="220" cy="172" rx="170" ry="160" transform="rotate(-16 220 172)" />
    <g className="ah-leaf"><g transform="rotate(-5 220 180)">
      <path className="mh-sheet" d="M86 36 Q220 26 352 38 L346 318 Q218 306 80 316Z" />
      <path className="mh-sheet mh-sheet-front" d="M96 44 Q220 34 342 46 L338 308 Q218 298 90 306Z" />
      <path className="ms-fold" d="M218 42V302" />
      <g className="ah-holes">{[70, 120, 170, 220, 270].map((y) => <circle key={y} cx="218" cy={y} r="1.3" />)}</g>
      <g className="ah-pricks">{Array.from({ length: 12 }, (_, i) => <path key={i} d={`M102 ${62 + i * 20}h3M334 ${62 + i * 20}h3`} />)}</g>
      <path className="ah-rule" d="M110 54h96M234 54h96M110 296h96M234 296h96" />
      <g className="ms-ink">{inkLines(112, 64, 90, 12, 9.5, 2)}{inkLines(112, 196, 90, 11, 9.5, 5)}{inkLines(236, 64, 90, 10, 9.5, 7)}{inkLines(236, 186, 90, 12, 9.5, 1)}</g>
      <text className="ah-uncial" x="236" y="164" lang="grc">ειρηνηνεχ<tspan className="ah-slot-w">ω</tspan>μεν</text>
      <path className="ah-margin" d="M352 150c10 4 10 18 0 22" />
    </g></g>
    <g className="ah-lens-g">
      <circle className="hv-glass" cx="300" cy="168" r="62" />
      <g clipPath="url(#ah-lens)"><g className="ah-zoom">
        <path className="ah-zoom-line" d="M200 128h220M200 214h220" />
        <text className="ah-big" x="214" y="182" lang="grc">νεχ</text>
        <text className="ah-big ah-letter ah-w" x="281" y="182" lang="grc">ω</text>
        <text className="ah-big ah-letter ah-o" x="284" y="182" lang="grc">ο</text>
        <text className="ah-big" x="314" y="182" lang="grc">μεν</text>
        <text className="ah-corr" x="290" y="146" lang="grc">ο</text>
      </g></g>
      <circle className="hv-rim" cx="300" cy="168" r="62" /><circle className="hv-rim hv-rim-2" cx="300" cy="168" r="67" />
      <path className="hv-handle" d="M344 212 386 254" />
    </g>
    <g className="ah-nib"><path d="M378 92l-40 38 6 6 40-38c4-6-1-11-6-6z" /><path d="M338 130l-6 12 12-6" /><path d="M352 118l6 6" /></g>
    <path className="ms-mark" d="M30 52h10m-5-5v10M402 300h10m-5-5v10M398 40h8m-4-4v8" />
  </svg>
  <span className="ah-tags">{hero.tags.map(([letter, hand, gloss], i) => <span key={letter} className={`ah-tag ${i === 0 ? "ah-tag-w" : "ah-tag-o"}`}>
    <b lang="grc">{letter}</b><span>{hand}</span><small>{gloss}</small></span>)}</span>
  <small className="ah-note">{hero.note}</small>
  </figure>;
}

/** The quiet row of figures under the opening, counted from the collection and evidence.ts. */
function Figures() {
  const { index } = useMs();
  const items = useMemo(() => {
    const records = studyRecords(index);
    const g = gapOf(index, BOOK_OF.galatians), m = gapOf(index, BOOK_OF.mark);
    const witnesses = cases.reduce((n, c) => n + readingsFor(c.id, false).length, 0);
    return [
      ["Passages", <>3</>, "Galatians 1:3 · Romans 5:1 · Mark 16"],
      ["Witnesses compared", <>{witnesses}</>, "manuscripts, editions and one gap"],
      ["Open records", <>{formatNumber(records.length)}</>, `hold one of the three books · ${formatNumber(records.filter(isDated).length)} dated`],
      ["Oldest copy", <>{g.oldest.d}</>, `${g.oldest.n}, of Galatians and Romans`],
      ["Written to copied", <>{g.from}–{g.to} <small>yrs</small></>, "Galatians to P46 · approximate"],
      ["Mark’s oldest", <>{m.oldest.d}</>, `${m.oldest.n} · Mark 16 itself lost`],
      ["Sources", <>{Object.keys(sources).length}</>, `cited · ${records.filter((r) => r.im).length} open pictures`],
    ] as const;
  }, [index]);
  return <dl className="ms-figures pm-figures">{items.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>;
}

export function Opening() {
  return <>
    <div className="hc-intro ms-intro pm-intro">
      <div>
        <StudyTrail area="texts" n="02" />
        <p className="ms-eyebrow pm-eyebrow">{hero.words}</p>
        <h1>A passage through<em>the manuscripts</em></h1>
        <p className="pm-hero-lead">{hero.lead}</p>
        <p className="hc-lede">{hero.kicker}. {hero.lede}</p>
        <nav className="pm-route" aria-label="In this study">{stops.slice(1).map(([id, label]) => {
          const [n, name] = label.split(" · ");
          return <a key={id} href={`#${id}`}><span>{n}</span>{name}</a>;
        })}</nav>
      </div>
      <HeroArt />
    </div>
    <Figures />
  </>;
}
