// Homepage (live): the lighthouse drawing ("The rock higher than I", Psalm 61:2) from the Help for life drawings mock-up of
// 2026-10-08 (design/help-for-life-drawings/art.js, drawing 6), carried into React unchanged for the left of the centred
// "Close to home" opening (owner, 2026-10-23: "ligthouse to the left"). Its tone is the prophets blue it was drawn in;
// the beam sweeps, the sea runs, the surf breathes, the boat rides the swell, the gulls glide (nearby-lighthouse.css).
import type { CSSProperties } from "react";
import "./nearby-lighthouse.css";

const STARS: [number, number, number?][] = [[30, 24], [96, 14, 1.2], [150, 34], [292, 22], [312, 72, 0.9], [60, 50, 0.8]];
const tuft = (x: number, y: number, s: number) => `M${x} ${y}c${-s} ${-3 * s} ${-3 * s} ${-5 * s} ${-5 * s} ${-6 * s}M${x} ${y}c0 ${-4 * s} ${s} ${-7 * s} ${2 * s} ${-9 * s}M${x} ${y}c${2 * s} ${-2 * s} ${4 * s} ${-4 * s} ${6 * s} ${-5 * s}`;
const bird = (x: number, y: number, s: number) => `M${x} ${y}c${2 * s} ${-3 * s} ${5 * s} ${-4 * s} ${7 * s} ${-s}c${2 * s} ${-3 * s} ${5 * s} ${-3 * s} ${7 * s} ${s}`;
const ROCK = "M150 240L154 222L164 212L168 194L178 184L182 164L192 154L196 134L208 124H244L254 134L258 150L268 160L272 180L286 192L292 210L306 218L320 222";

export function LighthouseArt() {
  return <svg className="la-art" viewBox="0 0 320 240" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {STARS.map(([cx, cy, r = 1], i) => <circle key={i} className="la-star" style={{ "--i": i } as CSSProperties} cx={cx} cy={cy} r={r} />)}
    <g className="la-beam"><path className="ft" d="M222 58L34 26M222 58L34 96" /><path className="ft" d="M222 58L40 61" strokeDasharray="2 7" /></g>
    <path className="pf" d={`${ROCK}V240Z`} /><path d={ROCK} />
    <path className="f" d="M168 194L184 198L196 190M182 164L198 168L206 160M196 134L212 140L222 136M254 134L246 146L250 156M258 150L252 166L262 176M272 180L262 196L274 206M222 186L238 194L234 210M196 212L214 218M232 160L244 168" />
    <path className="la-tuft" d={tuft(212, 124, 0.7)} /><path className="la-tuft" d={tuft(240, 124, 0.6)} /><path className="la-tuft" d={tuft(190, 156, 0.6)} />
    <path className="pf" d="M216 124L220 70H232L236 124Z" /><path d="M216 124L220 70M232 70L236 124" />
    <path className="f" d="M218.4 106H233.6M219.6 90H232.4" /><path d="M223 124V116C223 113 229 113 229 116V124" /><path className="f" d="M225 80h2v5h-2z" />
    <path d="M214 70H238" /><path d="M216 70V64H236V70" /><path className="f" d="M220 64v6M224 64v6M228 64v6M232 64v6" />
    <path d="M219 64V52H233V64" /><path className="f" d="M226 52V64" /><path d="M217 52C218 44 234 44 235 52" /><path d="M226 45V40M224 40h4" />
    <circle className="t la-lamp" cx="226" cy="58" r="1.5" />
    <g className="t">
      <path className="la-ripple" style={{ "--dx": "-8px" } as CSSProperties} d="M0 214H132M44 214C48 210 52 210 56 213" />
      <path className="la-ripple" style={{ "--dx": "10px" } as CSSProperties} d="M10 224H148M98 224C102 220 107 220 110 223" />
      <path className="la-ripple" style={{ "--dx": "-6px" } as CSSProperties} d="M0 234H140M24 234C28 230 32 230 35 233" />
      <path className="la-ripple" style={{ "--dx": "6px" } as CSSProperties} d="M298 230H320M290 238H320" />
    </g>
    <path className="t la-surf" d="M136 212C140 205 148 205 151 211M128 222C134 215 143 215 147 222M134 232C140 226 147 226 150 232" />
    <g className="la-boat"><path d="M54 208H96C94 212 90 215 86 216H64C60 215 56 212 54 208Z" /><path d="M76 208V168" />
      <path d="M77 170C88 180 94 192 96 204H77Z" /><path className="f" d="M75 174C68 184 64 194 62 204H75Z" /></g>
    <g className="la-gull"><path d={bird(108, 74, 1.1)} /><path d={bird(132, 92, 0.8)} /></g>
  </svg>;
}
