// A chapter's slowly living backdrop (mock-up js/dir-b.js): a sky of faint twinkling dots above, and a line-art landscape
// along the foot: Galatia's road and walker, Rome's arches and temple, Mark's tomb with its stone, olive and sun.
import type { CSSProperties } from "react";
import type { CaseId } from "./evidence";

export function Sky() {
  return <svg className="bsky" viewBox="0 0 1200 90" preserveAspectRatio="none" aria-hidden="true">{Array.from({ length: 46 }, (_, i) =>
    <circle key={i} cx={(i * 263) % 1200} cy={((i * 37) % 86) + 2} r={i % 5 === 0 ? 1.4 : 0.8} style={{ "--d": `${(i % 7) * 0.9}s` } as CSSProperties} />)}</svg>;
}

const cloud = (x: number, y: number, small = false) => small
  ? `M${x} ${y}c4-7 14-7 18 0 7-2 10 5 5 8h-27c-5-2-3-8 4-8z`
  : `M${x} ${y}c4-8 16-8 20 0 8-2 12 6 6 10h-30c-6-2-4-10 4-10z`;

const LAND: Record<CaseId, JSX.Element> = {
  galatians: <>
    <path className="bl-hill" d="M0 96C120 60 220 70 330 88S560 50 700 76 960 98 1200 70" /><path className="bl-hill bl-far" d="M0 70C160 40 300 56 420 48S700 24 860 44 1080 30 1200 40" />
    <path className="bl-road" d="M610 120C600 104 660 98 640 86S600 74 630 64" /><path className="bl-stone" d="M720 92v-12h6v12M716 92h14" /><path className="bl-stone" d="M520 98v-9h5v9" />
    <g className="bl-walker"><circle cx="0" cy="-14" r="2.4" /><path d="M0 -11v8l-3 6M0 -3l3 6M0 -9l-4 4M0 -9l5 2l2 -10" /></g>
    <g className="bl-cloud"><path d={cloud(180, 30)} /></g><g className="bl-cloud bl-cloud-2"><path d={cloud(880, 22, true)} /></g>
  </>,
  romans: <>
    <path className="bl-hill" d="M0 100C140 80 260 90 380 84S640 70 800 86 1040 92 1200 80" />
    <g className="bl-arches">{Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${120 + i * 34} 92v-30a17 17 0 0 1 34 0v30`} />)}<path d="M116 62h314" /></g>
    <g className="bl-temple"><path d="M760 92V58M778 92V58M796 92V58M814 92V58M832 92V58M850 92V58" /><path d="M752 58h106l-53-22z" /><path d="M748 92h114" /></g>
    <g className="bl-bird"><path d="M600 30q5-5 10 0q5-5 10 0" /></g><g className="bl-bird bl-bird-2"><path d="M650 22q4-4 8 0q4-4 8 0" /></g>
    <g className="bl-cloud"><path d={cloud(980, 30)} /></g>
  </>,
  mark: <>
    <path className="bl-hill" d="M0 100C200 86 380 96 520 90S820 80 1000 92 1120 96 1200 90" />
    <path className="bl-rock" d="M560 100V60C560 40 590 26 640 26S720 40 724 60V100" /><path className="bl-door" d="M612 100V74a16 16 0 0 1 32 0V100" />
    <circle className="bl-stoneround" cx="680" cy="84" r="16" /><path className="bl-stoneround" d="M672 84h16" />
    <g className="bl-olive"><path d="M420 100V74M420 80c-10-4-18 0-22 -6M420 76c8-6 18-4 22-10" /><ellipse cx="406" cy="66" rx="12" ry="7" /><ellipse cx="436" cy="62" rx="12" ry="7" /></g>
    <g className="bl-sun"><circle cx="960" cy="70" r="16" /><g className="bl-rays">{Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      return <path key={i} d={`M${960 + Math.cos(a) * 22} ${70 + Math.sin(a) * 22}L${960 + Math.cos(a) * 30} ${70 + Math.sin(a) * 30}`} />;
    })}</g></g>
  </>,
};

export function Land({ caseId }: { caseId: CaseId }) {
  return <svg className="bl" viewBox="0 0 1200 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">{LAND[caseId]}</svg>;
}
