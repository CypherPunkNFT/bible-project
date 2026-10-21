// Three proposed drawings for the homepage block "Help for life": a street at dusk with a lit door for each kind of
// help, an open hand holding a small lamp whose light reaches every kind of help, and a folded local map with a
// glowing "you are here" beside a phone with a calm voice on the line. Motion rules in life-mockups.css.
import type { CSSProperties } from "react";
import type { Mockup } from "./types";
import "./life-mockups.css";

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;

const KINDS = ["CRISIS", "PREGNANCY", "HEALING", "FAMILIES", "FOOD", "GRIEF", "RECOVERY"];

/* ---------- Lamplit Street ---------- */

const ROOFS = [188, 166, 198, 158, 182, 170, 192];

function StreetScene() {
  return <svg className="hf-scene mf-street-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <g className="hf-layer-sky">
      <path className="mf-moon" d="M512 66A20 20 0 1 0 530 100A16 16 0 1 1 512 66Z" />
      {[[90, 70], [168, 104], [250, 58], [338, 92], [420, 62], [560, 132]].map(([x, y], i) =>
        <circle key={x} className="mf-star" style={delay(-i * 0.9)} cx={x} cy={y} r="1.6" />)}
    </g>
    <path className="hf-cross" d="M30 320H570" />
    <g className="hf-layer-houses">{KINDS.map((kind, i) => {
      const x = 60 + i * 80, roof = ROOFS[i], wall = roof + 34;
      return <g key={kind}>
        <path className="mf-house" d={`M${x - 30} 320V${wall}H${x + 30}V320Z`} />
        <path className="mf-roof" d={`M${x - 35} ${wall + 2}L${x} ${roof}L${x + 35} ${wall + 2}`} />
        <rect className="mf-window" style={delay(-i * 0.8)} x={x - 10} y={wall + 14} width="20" height="16" rx="1.5" />
        <path className="mf-window-bar" d={`M${x} ${wall + 14}V${wall + 30}M${x - 10} ${wall + 22}H${x + 10}`} />
        <path className="mf-door-light" d={`M${x - 9} 320V294A9 9 0 0 1 ${x + 9} 294V320Z`} />
        <path className="mf-door-leaf" style={{ transitionDelay: `${i * 60}ms` }} d={`M${x - 9} 320V294A9 9 0 0 1 ${x + 9} 294V320Z`} />
        <path className="mf-spill" d={`M${x - 9} 321H${x + 9}L${x + 17} 335H${x - 17}Z`} />
        <text className="mf-label" x={x} y="354" textAnchor="middle">{kind}</text>
      </g>;
    })}</g>
    <text className="hf-caption" x="300" y="410" textAnchor="middle">A LIT DOOR FOR EVERY KIND OF HELP</text>
  </svg>;
}

/* ---------- Held Light ---------- */

/** Where each kind of help sits on the arc of light, as angles around the lamp's flame. */
const FLAME = { x: 300, y: 286 };
const ARC = KINDS.map((kind, i) => {
  const a = Math.PI + Math.PI / 18 + (i * 4 * Math.PI) / 27;
  return { kind, x: FLAME.x + 220 * Math.cos(a), y: FLAME.y + 170 * Math.sin(a) };
});

function HandScene() {
  const ray = (p: { x: number; y: number }, t: number) => `${FLAME.x + (p.x - FLAME.x) * t} ${FLAME.y + (p.y - FLAME.y) * t}`;
  return <svg className="hf-scene mf-hand-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <path className="hf-orbit" d="M80 286A220 170 0 0 1 520 286" />
    <defs><radialGradient id="mf-held-glow"><stop offset="0" className="mf-glow-stop" stopOpacity=".55" /><stop offset="1" className="mf-glow-stop" stopOpacity="0" /></radialGradient></defs>
    <g className="hf-layer-rays">{ARC.map((p, i) => <path key={p.kind} className="mf-ray" style={delay(-i * 0.5)} d={`M${ray(p, 0.3)}L${ray(p, 0.9)}`} />)}</g>
    <g className="hf-layer-kinds">{ARC.map((p, i) => <g key={p.kind}>
      <circle className="mf-kind-dot" style={delay(i * 0.6)} cx={p.x} cy={p.y} r="4" />
      <text className="mf-label" x={p.x} y={p.y - 11} textAnchor="middle">{p.kind}</text>
    </g>)}</g>
    <g className="hf-layer-hands">
      <circle className="mf-glow" cx="300" cy="286" r="56" fill="url(#mf-held-glow)" />
      <path className="mf-flame" d="M300 302Q287 290 300 266Q313 290 300 302Z" />
      <path className="mf-lamp" d="M270 312C276 298 322 298 332 306L348 300C346 308 340 312 332 314C316 319 284 319 270 312Z" />
      <path className="mf-hands" d="M196 308C210 306 216 302 222 294C226 288 234 286 238 290C242 294 240 304 248 312C270 320 312 318 340 312C364 306 386 301 398 304C409 307 407 318 396 321C372 328 352 336 330 340C290 348 236 346 196 342Z" />
      <path className="mf-hand-line" d="M356 318C370 315 384 313 398 312M350 328C364 325 378 322 392 320M248 312C244 322 236 330 226 334" />
      <path className="mf-sleeve" d="M146 304L196 302L198 344L148 346Z" /><path className="mf-hand-line" d="M186 303L188 345" />
    </g>
    <text className="hf-caption" x="300" y="410" textAnchor="middle">HELP RIGHT NOW · AND CLOSE TO HOME</text>
  </svg>;
}

/* ---------- Close to Home ---------- */

const TOP = [[70, 124], [170, 112], [270, 124], [370, 112]];
const PINS = [[118, 168], [186, 150], [306, 160], [338, 232], [124, 262]];

function Pin({ x, y }: { x: number; y: number }) {
  return <><path d={`M${x} ${y}C${x - 7} ${y - 9} ${x - 7} ${y - 20} ${x} ${y - 20}C${x + 7} ${y - 20} ${x + 7} ${y - 9} ${x} ${y}Z`} /><circle cx={x} cy={y - 13} r="2.5" /></>;
}

function MapScene() {
  return <svg className="hf-scene mf-map-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <g className="hf-layer-map">
      {[0, 1, 2].map((i) => { const [ax, ay] = TOP[i], [bx, by] = TOP[i + 1];
        return <path key={i} className={`mf-panel mf-panel-${i % 2}`} d={`M${ax} ${ay}L${bx} ${by}L${bx} ${by + 200}L${ax} ${ay + 200}Z`} />; })}
      <path className="mf-river" d="M70 306C120 286 170 316 220 306S320 276 370 292" />
      <path className="mf-road" d="M70 200C130 190 160 240 236 248S330 186 370 196M200 118C210 170 256 196 236 248S262 320 250 330" />
    </g>
    <g className="hf-layer-pins">{PINS.map(([x, y], i) => <g key={x} className="mf-pin" style={delay(-i * 0.7)}><Pin x={x} y={y} /></g>)}</g>
    <g className="hf-layer-here">
      {[0, 1, 2].map((i) => <circle key={i} className="mf-here-ring" style={delay(i * 1.2)} cx="236" cy="248" r="12" />)}
      <circle className="mf-here" cx="236" cy="248" r="5" />
      <rect className="mf-tag" x="191" y="266" width="90" height="15" rx="3" /><text className="mf-tag-text" x="236" y="276.5" textAnchor="middle">YOU ARE HERE</text>
    </g>
    <g className="hf-layer-phone">
      <rect className="mf-phone" x="424" y="128" width="80" height="172" rx="14" /><rect className="mf-screen" x="432" y="146" width="64" height="134" rx="4" />
      <path className="mf-phone-line" d="M454 137H474" />
      <circle className="mf-caller" cx="464" cy="184" r="14" />
      <path className="mf-heart" d="M464 191C454 184 457 176 464 180C471 176 474 184 464 191Z" />
      <g className="mf-voice">{[6, 12, 20, 26, 18, 10, 6].map((h, i) => <rect key={i} style={delay(-i * 0.3)} x={438 + i * 8} y={236 - h / 2} width="4" height={h} rx="2" />)}</g>
      <g className="mf-sound">{[14, 24, 34].map((r, i) => <path key={r} style={delay(i * 0.4)} d={`M${504 + r * 0.3} ${170 - r}A${r} ${r} 0 0 1 ${504 + r * 0.3} ${170 + r}`} />)}</g>
    </g>
    <text className="mf-label" x="220" y="362" textAnchor="middle">CLOSE TO HOME</text>
    <text className="mf-label" x="464" y="362" textAnchor="middle">HELP RIGHT NOW</text>
    <text className="hf-caption" x="300" y="410" textAnchor="middle">NATIONAL LINES · LOCAL MAPS IN 15 CITIES</text>
  </svg>;
}

export const MOCKUPS: Mockup[] = [
  { name: "Lamplit Street", note: "A street at dusk with a lit doorway for each kind of help; on hover every door swings open and its light spills onto the pavement.", Scene: StreetScene },
  { name: "Held Light", note: "An open hand holds a small lamp whose light reaches out to each kind of help; on hover the hand lifts and the light grows.", Scene: HandScene },
  { name: "Close to Home", note: "A folded local map with a glowing \"you are here\" beside a phone with a calm voice on the line; on hover the pins rise and the phone lifts.", Scene: MapScene },
];
