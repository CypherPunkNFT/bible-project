// The drawings for the three homepage Resources blocks. Learning: workbooks for every age on a shelf and an open
// workbook whose answer line a pencil writes, beside a memory-verse card. Fellowships: one table around an open Bible,
// with threads out to the four kinds of fellowship. Help for life: a lighthouse beam sweeping over seven harbour lights,
// one for each kind of help. Loops run only while on screen and open up on hover (home-resources.css).
import type { CSSProperties } from "react";
import "./home-resources.css";

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;

/* ---------- Learning materials ---------- */

/** Seven audiences, little ones to leaders, as workbooks of growing height. */
const SHELF = [44, 54, 62, 72, 80, 90, 100];

export function LearningScene() {
  return <svg className="hf-scene hr-learning-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <path className="hf-cross" d="M40 330H560" />
    <g className="hf-layer-shelf">{SHELF.map((h, i) => <g key={h} className="hr-shelf-book" style={{ "--i": i } as CSSProperties}>
      <rect x={64 + i * 24} y={330 - h} width="19" height={h} rx="2" /><path d={`M${68 + i * 24} ${338 - h}h11M${68 + i * 24} ${322}h11`} />
    </g>)}
      <text className="hr-label" x="64" y="352">LITTLE ONES</text><text className="hr-label" x="227" y="352" textAnchor="end">LEADERS</text>
      <path className="hr-age-arrow" d="M144 349H172M168 346l4 3-4 3" />
    </g>
    <g className="hf-layer-workbook">
      <path className="hr-page" d="M280 172Q332 162 384 174V322Q332 310 280 320Z" /><path className="hr-page" d="M384 174Q436 162 488 172V320Q436 310 384 322Z" />
      <g className="hr-print">{Array.from({ length: 10 }, (_, r) => <path key={r} d={`M294 ${192 + r * 12}h${76 - ((r * 9) % 17)}`} />)}</g>
      <text className="hr-question" x="398" y="198">Read Exodus 3.</text>
      <text className="hr-question" x="398" y="214">What did God say?</text>
      {[244, 266, 288].map((y) => <path key={y} className="hr-rule" d={`M398 ${y}H474`} />)}
      <path className="hr-answer" pathLength={1} d="M400 242c8-3 12 2 20-1s12 2 20-1 12 2 20-1 9 1 12 0" />
      <g className="hr-pencil"><path d="M0 0l6-16 26-30 6 5-26 30Z" /><path d="M0 0l6-16 6 5Z" className="hr-pencil-tip" /></g>
    </g>
    <g className="hf-layer-card"><g className="hr-verse-card">
      <rect x="402" y="62" width="150" height="66" rx="5" />
      <text className="hr-card-verse" x="477" y="90" textAnchor="middle">Thy word have I hid</text>
      <text className="hr-card-verse" x="477" y="106" textAnchor="middle">in mine heart.</text>
      <text className="hr-label" x="477" y="121" textAnchor="middle">PSALM 119:11</text>
    </g></g>
    <text className="hf-caption" x="300" y="408" textAnchor="middle">WORKBOOKS · LESSONS · ACTIVITY PAGES · FOR EVERY READER</text>
  </svg>;
}

/* ---------- Fellowships ---------- */

const GATHERINGS = [
  { label: "BIBLE STUDY", x: 112, y: 104 }, { label: "STUDENTS", x: 488, y: 104 },
  { label: "PRAYER", x: 112, y: 340 }, { label: "LOCAL CHURCH", x: 488, y: 340 },
];

/** A small glyph for each kind of gathering. */
function GatheringGlyph({ index, x, y }: { index: number; x: number; y: number }) {
  if (index === 3) return <path d={`M${x - 16} ${y + 14}V${y - 2}L${x} ${y - 14}L${x + 16} ${y - 2}V${y + 14}ZM${x} ${y - 14}V${y - 28}M${x - 5} ${y - 23}H${x + 5}M${x - 4} ${y + 14}V${y + 4}H${x + 4}V${y + 14}`} />;
  if (index === 2) return <path d={`M${x} ${y + 12}V${y - 2}M${x - 7} ${y + 12}H${x + 7}M${x} ${y - 6}Q${x - 6} ${y - 14} ${x} ${y - 22}Q${x + 6} ${y - 14} ${x} ${y - 6}Z`} />;
  return <>{[0, 1, 2, 3].map((i) => { const a = (i * Math.PI) / 2 + Math.PI / 4; return <circle key={i} cx={x + 16 * Math.cos(a)} cy={y + 12 * Math.sin(a)} r="4" />; })}
    {index === 0 ? <path d={`M${x - 8} ${y - 3}Q${x - 4} ${y - 5} ${x} ${y - 3}Q${x + 4} ${y - 5} ${x + 8} ${y - 3}V${y + 4}Q${x + 4} ${y + 2} ${x} ${y + 4}Q${x - 4} ${y + 2} ${x - 8} ${y + 4}Z`} /> : <circle cx={x} cy={y} r="3" />}</>;
}

export function FellowshipScene() {
  return <svg className="hf-scene hr-fellowship-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <ellipse className="hf-orbit" cx="300" cy="222" rx="226" ry="140" />
    <g className="hf-layer-threads">{GATHERINGS.map((g, i) => <path key={g.label} className="hr-thread" style={delay(-i * 0.8)} d={`M${g.x} ${g.y}Q${(g.x + 300) / 2} ${g.y < 222 ? g.y + 70 : g.y - 70} 300 222`} />)}</g>
    <g className="hf-layer-table">
      <ellipse className="hr-table" cx="300" cy="226" rx="74" ry="34" />
      <path className="hr-table-book" d="M276 222Q288 214 300 220Q312 214 324 222V236Q312 230 300 236Q288 230 276 236ZM300 220V236" />
      {Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4 + Math.PI / 8; return <circle key={i} className="hr-person" style={delay(-i * 0.5)} cx={300 + 100 * Math.cos(a)} cy={226 + 56 * Math.sin(a)} r="9" />; })}
    </g>
    <g className="hf-layer-gatherings">{GATHERINGS.map((g, i) => <g key={g.label} className="hr-gathering" style={{ "--dx": `${g.x < 300 ? -8 : 8}px`, "--dy": `${g.y < 222 ? -6 : 6}px` } as CSSProperties}>
      <circle className="hr-gathering-ring" cx={g.x} cy={g.y} r="30" /><GatheringGlyph index={i} x={g.x} y={g.y} />
      <text className="hr-label" x={g.x} y={g.y < 222 ? g.y - 40 : g.y + 50} textAnchor="middle">{g.label}</text>
    </g>)}</g>
    <text className="hf-caption" x="300" y="414" textAnchor="middle">TO PRAY AND TO STUDY THE WORD TOGETHER</text>
  </svg>;
}

/* ---------- Help for life ---------- */

const KINDS = ["CRISIS", "PREGNANCY", "HEALING", "FAMILIES", "FOOD", "GRIEF", "RECOVERY"];

export function LifeScene() {
  return <svg className="hf-scene hr-life-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <g className="hf-layer-beam"><path className="hr-beam" d="M132 132L590 92V176Z" /></g>
    <g className="hf-layer-sea">{Array.from({ length: 6 }, (_, i) => <path key={i} className="hr-wave" style={delay(-i * 0.9)} d={`M${50 + (i % 2) * 30} ${318 + i * 14}q15 -6 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0`} />)}</g>
    <g className="hf-layer-lighthouse">
      <path className="hr-rock" d="M76 316Q90 296 122 298Q160 294 172 316Z" />
      <path className="hr-tower" d="M108 300L114 150H150L156 300Z" /><path className="hr-band" d="M110 252H154M112 204H152" />
      <rect className="hr-lantern" x="116" y="124" width="32" height="26" rx="2" /><path className="hr-tower" d="M110 124H154L132 104Z" />
      <circle className="hr-lamp" cx="132" cy="137" r="6" />
    </g>
    <g className="hf-layer-lights">{KINDS.map((kind, i) => { const x = 252 + i * 46, y = 236 + Math.abs(i - 3) * 9; return <g key={kind} className="hr-light" style={delay(i * 0.55)}>
      <path className="hr-buoy" d={`M${x - 8} ${y + 16}L${x - 4} ${y}H${x + 4}L${x + 8} ${y + 16}Z`} /><circle className="hr-glow" cx={x} cy={y - 6} r="5" />
      <text className="hr-label" x={x} y={y + 32} textAnchor="middle">{kind}</text>
    </g>; })}</g>
    <text className="hf-caption" x="300" y="412" textAnchor="middle">HELP RIGHT NOW · AND CLOSE TO HOME</text>
  </svg>;
}
