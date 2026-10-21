// Three proposals for the top drawing of the homepage Resources section, each showing learning materials, fellowships
// and help for life in one picture: a lit house with three rooms, a table set with a book, a teapot and a lamp, and a
// folded map with one panel for each. Motion rules in overview-mockups.css.
import type { CSSProperties } from "react";
import type { Mockup } from "./types";
import "./overview-mockups.css";

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;
const tone = (name: string) => ({ "--tone": `var(--${name})` }) as CSSProperties;

/* ---------- The open house ---------- */

const ROOMS = [{ x: 140, label: "LEARNING", tone: "epistles" }, { x: 252, label: "FELLOWSHIP", tone: "gospels" }, { x: 364, label: "HELP FOR LIFE", tone: "resource-life" }];

function HouseScene() {
  return <svg className="hf-scene mo-house-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <path className="hf-cross" d="M50 330H550" />
    <path className="mo-spill" d="M284 330H316L372 396H228Z" />
    <g className="mo-smoke">{[0, 1, 2].map((i) => <circle key={i} style={delay(i * 1.6)} cx="410" cy="78" r={5 + i} />)}</g>
    <g className="hf-layer-roof"><path className="mo-wall" d="M410 114V82H426V120" /><path className="mo-roof" d="M96 152L300 68L504 152Z" /><circle className="mo-attic" cx="300" cy="120" r="10" /></g>
    <rect className="mo-wall" x="120" y="152" width="360" height="178" />
    <g className="hf-layer-rooms">{ROOMS.map((room, i) => <g key={room.label} className="mo-room" style={tone(room.tone)}>
      <rect className="mo-window" x={room.x} y="184" width="96" height="78" rx="3" /><rect className="mo-window-glow" style={delay(i * 1.3)} x={room.x} y="184" width="96" height="78" rx="3" />
      <path className="mo-sill" d={`M${room.x - 6} 266H${room.x + 102}`} />
      <text className="mo-label" x={room.x + 48} y="176" textAnchor="middle">{room.label}</text>
    </g>)}
      <g className="mo-ink" style={tone("epistles")}><path d="M148 214H228" />{[20, 26, 18, 24, 22, 16, 25].map((h, i) => <rect key={i} x={153 + i * 10} y={214 - h} width="7" height={h} rx="1" />)}
        <path className="mo-fill" d="M164 242Q176 234 188 240Q200 234 212 242V256Q200 250 188 256Q176 250 164 256ZM188 240V256" /></g>
      <g className="mo-ink" style={tone("gospels")}>{[272, 286, 300, 314, 328].map((x, i) => <g key={x} className="mo-guest" style={delay(-i * 0.6)}><circle className="mo-fill" cx={x} cy="222" r="5" /><path d={`M${x - 6} 238Q${x} 228 ${x + 6} 238`} /></g>)}
        <ellipse className="mo-fill" cx="300" cy="244" rx="34" ry="7" /><path d="M292 242Q296 239 300 241Q304 239 308 242" /><path d="M284 251V258M316 251V258" /></g>
      <g className="mo-ink" style={tone("resource-life")}><path d="M412 184V196" /><circle className="mo-lamp-glow" cx="412" cy="210" r="15" /><path className="mo-fill" d="M401 206L407 196H417L423 206Z" />
        <rect className="mo-fill" x="390" y="226" width="44" height="28" rx="2" /><path d="M404 226V254M420 226V254" /><path className="mo-pin" d="M412 246c-4-5-5-7-5-9a5 5 0 0 1 10 0c0 2-1 4-5 9Z" /></g>
    </g>
    <path className="mo-wall" d="M284 330V278H316V330" />
    <g className="hf-layer-door"><path className="mo-door" d="M284 278L300 284V334L284 330Z" /></g>
    <text className="hf-caption" x="300" y="412" textAnchor="middle">THREE ROOMS · ONE OPEN DOOR</text>
  </svg>;
}

/* ---------- The table set ---------- */

function Cup({ x }: { x: number }) {
  return <g><ellipse className="mo-fill" cx={x + 10} cy="290" rx="16" ry="3.5" /><path className="mo-fill" d={`M${x} 272H${x + 20}V280Q${x + 20} 288 ${x + 10} 288Q${x} 288 ${x} 280Z`} /><path d={`M${x + 20} 275Q${x + 27} 276 ${x + 20} 283`} /></g>;
}

function TableScene() {
  return <svg className="hf-scene mo-table-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <g className="hf-layer-verse"><rect className="mo-frame" x="180" y="62" width="240" height="70" rx="4" />
      <text className="mo-verse" x="300" y="90" textAnchor="middle">Thy word is a lamp unto my feet,</text>
      <text className="mo-verse" x="300" y="106" textAnchor="middle">and a light unto my path.</text><text className="mo-label" x="300" y="122" textAnchor="middle">PSALM 119:105</text></g>
    <g transform="translate(300 300) scale(1.22) translate(-300 -300)">
    <circle className="mo-halo" cx="456" cy="246" r="46" />
    <path className="mo-tabletop" d="M70 300H530L498 270H102Z" /><path className="mo-wall" d="M70 300V308H530V300M104 308V340M496 308V340" />
    <g className="mo-steam">{[282, 322, 382].map((x, i) => <path key={x} style={delay(i * 1.1)} d={`M${x} ${i === 1 ? 246 : 266}q-5-8 0-14t0-14`} />)}</g>
    <g className="hf-layer-book mo-ink" style={tone("epistles")}>
      <path className="mo-fill" d="M122 288Q154 278 186 286V244Q154 236 122 246Z" /><path className="mo-fill" d="M186 286Q218 278 250 288V246Q218 236 186 244Z" />
      <g className="mo-print">{[0, 1, 2, 3].map((r) => <path key={r} d={`M132 ${254 + r * 7}h${44 - r * 4}M196 ${251 + r * 7}h${44 - ((r * 7) % 11)}`} />)}</g>
      <path className="mo-ribbon" d="M186 286V302l-3 4M186 286" />
    </g>
    <g className="hf-layer-tea mo-ink" style={tone("gospels")}>
      <Cup x={262} /><Cup x={362} />
      <g className="mo-teapot"><ellipse className="mo-fill" cx="322" cy="272" rx="22" ry="16" /><path d="M300 268Q288 262 286 252M344 264Q354 266 350 280" /><path className="mo-fill" d="M312 257Q322 250 332 257Z" /><ellipse className="mo-fill" cx="322" cy="289" rx="18" ry="3" /></g>
    </g>
    <g className="hf-layer-lamp mo-ink" style={tone("resource-life")}>
      <ellipse className="mo-fill" cx="456" cy="288" rx="18" ry="4" /><path className="mo-fill" d="M441 288Q438 270 456 266Q474 270 471 288" />
      <path className="mo-glass" d="M449 266Q443 248 450 236V216H462V236Q469 248 463 266" /><path className="mo-flame" d="M456 254c-4-5-5-9-1-16c1 4 6 8 1 16Z" />
      <g transform="rotate(8 507 270)"><rect className="mo-fill" x="490" y="250" width="34" height="40" rx="2" /><path d="M497 260h20M497 266h14" /><path className="mo-pin" d="M507 284c-4-5-5-7-5-9a5 5 0 0 1 10 0c0 2-1 4-5 9Z" /></g>
    </g>
    </g>
    <text className="mo-label" x="161" y="378" textAnchor="middle">LEARNING</text><text className="mo-label" x="327" y="378" textAnchor="middle">FELLOWSHIP</text>
    <text className="mo-label" x="508" y="378" textAnchor="middle">HELP FOR LIFE</text>
    <text className="hf-caption" x="300" y="412" textAnchor="middle">A PLACE SET FOR YOU</text>
  </svg>;
}

/* ---------- The folded map ---------- */

const PANELS = ["M75 112L225 100V312L75 324Z", "M225 100L375 112V324L225 312Z", "M375 112L525 100V312L375 324Z"];
const CITIES = Array.from({ length: 15 }, (_, i) => { const c = i % 3, r = Math.floor(i / 3); return { x: 402 + c * 44 + ((r * 17 + c * 11) % 14), y: 142 + r * 34 + ((c * 13 + r * 7) % 12) }; });
const TRAIL = "M92 292C132 262 112 214 150 196S240 246 300 236S352 160 400 176S470 262 508 244";

function MapScene() {
  return <svg className="hf-scene mo-map-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <ellipse className="hf-orbit" cx="300" cy="214" rx="250" ry="150" />
    {PANELS.map((d, i) => <g key={d} className={`hf-layer-panel${i} mo-panel`} style={tone(["epistles", "gospels", "resource-life"][i])}>
      <path className={i === 1 ? "mo-paper mo-paper-shade" : "mo-paper"} d={d} />
      {i === 0 && <g className="mo-ink"><path className="mo-fill" d="M126 172Q138 164 150 170Q162 164 174 172V188Q162 182 150 188Q138 182 126 188ZM150 170V188" />
        {[0, 1, 2].map((r) => <rect key={r} className="mo-fill" x={118 + r * 22} y={268 - r * 6 - 14} width="16" height={14 + r * 6} rx="1.5" />)}</g>}
      {i === 1 && <g className="mo-ink">{Array.from({ length: 6 }, (_, k) => { const a = (k * Math.PI) / 3; return <circle key={k} className="mo-fill mo-guest" style={delay(-k * 0.5)} cx={300 + 30 * Math.cos(a)} cy={180 + 22 * Math.sin(a)} r="6" />; })}
        <path d="M294 180H306M300 174V186" /><path className="mo-fill" d="M284 292V272L300 258L316 272V292ZM300 258V244M295 249H305" /></g>}
      {i === 2 && <g className="mo-ink"><path className="mo-street" d="M380 200Q440 186 520 214M420 116Q412 220 440 318M478 108Q494 210 486 316" />
        {CITIES.map((c, k) => <path key={k} className="mo-pin mo-city" style={delay(k * 0.35)} d={`M${c.x} ${c.y}c-4-5-5-7-5-9a5 5 0 0 1 10 0c0 2-1 4-5 9Z`} />)}</g>}
    </g>)}
    <path className="mo-trail" d={TRAIL} />
    <g className="hf-layer-compass"><circle className="mo-compass" cx="540" cy="80" r="18" /><path className="mo-needle" d="M540 66L545 80L540 94L535 80Z" /></g>
    <text className="mo-label" x="150" y="350" textAnchor="middle">LEARNING</text><text className="mo-label" x="300" y="350" textAnchor="middle">FELLOWSHIP</text>
    <text className="mo-label" x="450" y="350" textAnchor="middle">HELP FOR LIFE</text>
    <text className="hf-caption" x="300" y="410" textAnchor="middle">FIFTEEN CITIES · ONE WORD · EVERY READER</text>
  </svg>;
}

export const MOCKUPS: Mockup[] = [
  { name: "The open house", note: "A house with three lit rooms, a bookshelf, a table of friends and a lamp over a map, whose windows glow in turn; on hover the roof lifts and the door swings open.", Scene: HouseScene },
  { name: "The table set", note: "An open book, a teapot with two steaming cups and a lit oil lamp beside a help card, laid on one table; on hover the book rises, the teapot pours and the lamp brightens.", Scene: TableScene },
  { name: "The folded map", note: "A three-panel folded map, one panel each for learning, fellowship and fifteen city pins, with a trail running through; on hover the panels open out and the pins rise.", Scene: MapScene },
];
