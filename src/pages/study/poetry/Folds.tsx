// 02 Folds and frames: the small chiasm drawn over the Hebrew words of Genesis 9:6 and lit in both languages in Isaiah 6:10;
// the flood's day-counts as a fold the reader can put five tests to (each test marks what it checks; none gives a verdict);
// then the frame and the refrain, with the words that change between the refrains lit in the Hebrew.
import type { ReactNode } from "react";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, P, patternById } from "./model";
import { Head, Prose, RefButton, Refs, SourceButton, ThreeParts, VersePair } from "./parts";
import { useOpen } from "./open";

/** Genesis 9:6's first six Hebrew words, right to left, joined outside in by arcs. */
function Gen96() {
  const { words, pairs, glosses } = P.folds.gen96;
  const x = (i: number) => 560 - i * 100;
  return <figure className="hpn-fold-small">
    <svg viewBox="0 0 620 190" role="img" aria-label="The first six Hebrew words of Genesis 9:6, read from the right, with arcs joining the first and sixth, the second and fifth, the third and fourth: sheds, blood, of man; by man, his blood, will be shed.">
      {pairs.map(([a, b]) => {
        const depth = 26 + (b - a) * 15;
        return <path key={a} className="hpn-arc" d={`M${x(a)} 92C${x(a)} ${92 + depth} ${x(b)} ${92 + depth} ${x(b)} 92`} />;
      })}
      {words.map((word, i) => <g key={i} transform={`translate(${x(i)} 0)`}>
        <text className="hpn-svg-letter" y="22" textAnchor="middle">{"ABCCBA"[i]}{i > 2 ? "′" : ""}</text>
        <text className="hpn-svg-he" y="62" textAnchor="middle" direction="rtl">{word}</text>
        <text className="hpn-svg-gloss" y="84" textAnchor="middle">{glosses[i]}</text>
      </g>)}
    </svg>
    <figcaption>Read from the right. The arcs join words that share their consonants: shed with shed, blood with blood, man with man.</figcaption>
  </figure>;
}

const { flood: FLOOD, floodVerses: SPAN } = P.folds;
const TEST_MARKS = [
  "Marked: the words that make each count, as the Berean gives them. They are in the text without any heading.",
  "Marked: the counts that answer each other. Seven answers seven and forty answers forty: shared words, not themes.",
  `Marked: the whole story, Genesis 6:9 to 9:19. The counts stand between its verse ${FLOOD[0].at + 1} and its verse ${FLOOD[FLOOD.length - 1].at + 1}, of ${SPAN}.`,
  "Marked: the centre the mirror proposes, God remembering Noah.",
  "Marked: where the story begins and ends, and where the first and last counts stand.",
];

/** The flood's day-counts on one line, rising to the centre and falling away, with the whole story beneath. */
function Flood({ test, onTest }: { test: number | null; onTest: (value: string | null) => void }) {
  const open = useOpen();
  const { flood, floodVerses } = P.folds;
  const height: Record<string, number> = { "7": 30, "40": 62, "150": 96, centre: 122 };
  const x = (i: number) => 50 + i * 65;
  const along = (at: number) => 30 + (at / (floodVerses - 1)) * 560;
  return <div className="hpn-flood" data-test={test ?? 0}>
    <svg viewBox="0 0 620 250" role="img" aria-label="The flood's day-counts in story order: seven, seven, forty, a hundred and fifty, God remembers Noah, a hundred and fifty, forty, seven, seven. Beneath, the whole story from Genesis 6:9 to 9:19, with the counts standing in its middle stretch.">
      <polyline className="hpn-fold-line" points={flood.map((f, i) => `${x(i)},${150 - height[f.count]}`).join(" ")} />
      {flood.map((f, i) => {
        const mirror = flood.length - 1 - i;
        return <g key={f.ref} className={`hpn-count${f.count === "centre" ? " hpn-centre" : ""}`}>
          {i < mirror && <path className="hpn-answer" d={`M${x(i)} 160Q${(x(i) + x(mirror)) / 2} ${200 - (mirror - i) * 3} ${x(mirror)} 160`} />}
          <circle cx={x(i)} cy={150 - height[f.count]} r={f.count === "centre" ? 7 : 5} />
          <text className="hpn-count-num" x={x(i)} y={140 - height[f.count]} textAnchor="middle">{f.count === "centre" ? "8:1" : f.count}</text>
          <text className="hpn-count-words" x={x(i)} y={172 - height[f.count] + (i % 2 ? 11 : 0)} textAnchor="middle">{f.count === "centre" ? "" : f.words}</text>
        </g>;
      })}
      <g className="hpn-span">
        <line x1="30" x2="590" y1="225" y2="225" />
        {flood.map((f) => <line key={f.ref} className="hpn-span-tick" x1={along(f.at)} x2={along(f.at)} y1="217" y2="233" />)}
        <text x="30" y="246">6:9</text><text x="590" y="246" textAnchor="end">9:19</text>
      </g>
    </svg>
    <ol className="hpn-flood-refs">{flood.map((f) => <li key={f.ref}>
      <button type="button" className="hpn-ref" data-opener={`ref:${f.ref}`} aria-haspopup="dialog" onClick={() => open(`ref:${f.ref}`)}>{f.ref.replace("Genesis ", "")}</button>
      <span>{f.count === "centre" ? "centre" : f.words}</span>
    </li>)}</ol>
    <div className="hpn-tests">
      <p className="hpn-kicker">{D.patterns.tests.head}</p>
      <p className="hpn-caption"><Prose text={D.patterns.tests.lead} /></p>
      <ol>{D.patterns.tests.items.map((t, i) => <li key={t}>
        <button type="button" className="hpn-test" aria-pressed={test === i + 1} onClick={() => onTest(test === i + 1 ? null : String(i + 1))}>
          <b>{i + 1}</b><span><Checked text={t} /></span>
        </button>
      </li>)}</ol>
      <p className="hpn-test-mark" aria-live="polite">{test ? TEST_MARKS[test - 1] : "Choose a test to mark on the fold what it checks. The answer is yours to give."}</p>
    </div>
  </div>;
}

function Pattern({ id, children }: { id: string; children: ReactNode }) {
  const item = patternById.get(id)!;
  return <article className="hpn-pattern">
    <h3 className="hpn-sub"><Checked text={item.name} /></h3>
    <p className="hpn-look"><Prose text={item.look} /></p>
    {children}
    <ThreeParts evidence={item.evidence} inference={item.inference} limit={item.limit} />
  </article>;
}

export function Folds({ test, onChange }: { test: number | null; onChange: (values: Record<string, string | null>) => void }) {
  const refrain = (label: string, key: string) => <VersePair key={label} label={label} lit={P.refrain[key]} />;
  return <>
    <Head num="02" kicker="Folds and frames" headline={D.patterns.headline} lead={D.patterns.lead} />
    <div className="hpn-folds">
      <Pattern id="chiasm-small">
        <Gen96 />
        <VersePair label="Isaiah 6:10" lit={P.folds.isa610.hebrew} litEn={P.folds.isa610.english} />
      </Pattern>
      <Pattern id="chiasm-large">
        <Flood test={test} onTest={(value) => onChange({ test: value })} />
        <p className="hpn-caption">The pairing of the counts is Gordon Wenham's, as the research record reports it; J. A. Emerton's reply is beside it. <SourceButton id="wenham" /> <SourceButton id="emerton" /></p>
      </Pattern>
      <Pattern id="inclusio">
        <div className="hpn-frame">
          <VersePair label="Psalm 8:1" />
          <p className="hpn-between">Psalm 8:2–8, between the frame</p>
          <VersePair label="Psalm 8:9" />
        </div>
        <div className="hpn-frame">
          <VersePair label="Psalm 103:1" />
          <p className="hpn-between">Psalm 103:2–21, between the frame</p>
          <VersePair label="Psalm 103:22" />
        </div>
      </Pattern>
      <Pattern id="refrain">
        <div className="hpn-refrains">
          {refrain("Psalm 42:5", "PSA 42:5")}
          {refrain("Psalm 42:11", "PSA 42:11")}
          {refrain("Psalm 43:5", "PSA 43:5")}
        </div>
        <p className="hpn-caption">Lit: the Hebrew words of Psalm 42:11 and 43:5 that are not in the first refrain, Psalm 42:5, found by comparing the consonants word by word.</p>
        <VersePair label="Psalm 107:8" />
        <Refs labels={["Psalm 107:15", "Psalm 107:21", "Psalm 107:31"]} lead="The same words close the other three stories" />
      </Pattern>
    </div>
    <p className="hpn-caption">References in this part: <RefButton label="Genesis 6:9" /> to 9:19, the whole flood story.</p>
  </>;
}
