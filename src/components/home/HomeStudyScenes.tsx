// The drawings for the homepage Study sub-blocks and the Resources block, companions to HomeFeatureArt's scenes.
// Theology: a passage of Scripture with its teaching branching up into the five subjects. Scholarly: a museum case of
// surviving witnesses, scroll, codex and papyrus above, jar, inscription, lamp and coins below, read by a gliding lens. Atlas: the land between
// the sea and the Jordan, with a journey drawing itself between the towns. Resources: a road with three stops on it.
// All loop slowly while on screen, open up on hover (home-study.css) and hold still under reduced motion.
import { useId, type CSSProperties } from "react";
import "./home-study.css";

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;

/* ---------- Scripture & Theology ---------- */

/** The five theology subjects, each with its own small glyph drawn inside the node. */
const SUBJECTS = [
  { label: "THE BOOKS", x: 104, y: 168, glyph: "M-8 -5Q-4 -7 0 -5Q4 -7 8 -5V6Q4 4 0 6Q-4 4 -8 6ZM0 -5V6" },
  { label: "JESUS CHRIST", x: 200, y: 104, glyph: "M0 -8V8M-6 -3H6" },
  { label: "GOD & FAITH", x: 300, y: 76, glyph: "M0 -8L7.5 5.5H-7.5Z" },
  { label: "CHRISTIAN LIFE", x: 400, y: 104, glyph: "M0 7C-9 0 -8 -7 -3.5 -7C-1.6 -7 -.5 -5.6 0 -4.6C.5 -5.6 1.6 -7 3.5 -7C8 -7 9 0 0 7Z" },
  { label: "PEOPLE", x: 496, y: 168, glyph: "M0 -7a3 3 0 1 0 .01 0M-6 7Q-6 -1 0 -1Q6 -1 6 7" },
];
const TRUNK_TOP = 236;

export function TheologyScene() {
  return <svg className="hf-scene hs-theology-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <path className="hf-cross" d="M300 40V410M40 236H560" />
    <ellipse className="hf-orbit" cx="300" cy="200" rx="226" ry="150" />
    <g className="hf-layer-branches">
      <path className="hs-trunk" d={`M300 318V${TRUNK_TOP}`} />
      {SUBJECTS.map((s, i) => {
        const d = `M300 ${TRUNK_TOP}C300 ${TRUNK_TOP - 40} ${s.x} ${s.y + 70} ${s.x} ${s.y + 18}`;
        return <g key={s.label}><path className="hs-branch" d={d} /><path className="hs-current" pathLength={1} style={delay(i * 0.9)} d={d} /></g>;
      })}
    </g>
    <g className="hf-layer-nodes">{SUBJECTS.map((s, i) => <g key={s.label} className="hs-subject" style={delay(-i * 1.1)}>
      <circle cx={s.x} cy={s.y} r="17" /><path transform={`translate(${s.x} ${s.y})`} d={s.glyph} />
      <text x={s.x} y={s.y - 28} textAnchor="middle">{s.label}</text>
    </g>)}</g>
    <g className="hf-layer-passage">
      <rect className="hs-scroll" x="190" y="318" width="220" height="58" rx="5" />
      <rect className="hs-scroll-roll" x="181" y="313" width="11" height="68" rx="5.5" /><rect className="hs-scroll-roll" x="408" y="313" width="11" height="68" rx="5.5" />
      <text className="hs-verse" x="300" y="345" textAnchor="middle">Thy word is truth.</text>
      <text className="hs-verse-ref" x="300" y="364" textAnchor="middle">JOHN 17:17</text>
    </g>
    <text className="hf-caption" x="300" y="408" textAnchor="middle">READ · UNDERSTAND · LIVE THE WORD</text>
  </svg>;
}

/* ---------- Academic Studies: a cabinet of surviving witnesses ---------- */

/** Rows of writing as short ragged strokes inside a column. */
function writing(x: number, y: number, width: number, rows: number, gap: number) {
  return Array.from({ length: rows }, (_, r) => {
    const w = width - ((r * 7 + x) % 9) - (r === rows - 1 ? width * 0.45 : 0);
    return <path key={r} d={`M${x} ${y + r * gap}h${w}`} style={delay(-r * 0.6)} />;
  });
}
const FRAGMENT = "M418 124l26-8 22 6 30-4 10 22-6 26 8 28-24 8-18-6-26 6-16-12 4-22-10-20Z";
const TOP_SHELF = 214;
const BOTTOM_SHELF = 336;
/** Each witness and the tag that names it, left to right on its shelf. */
const TAGS = [
  { label: "SCROLL", x: 128, y: TOP_SHELF }, { label: "CODEX", x: 300, y: TOP_SHELF }, { label: "PAPYRUS", x: 462, y: TOP_SHELF },
  { label: "JAR", x: 104, y: BOTTOM_SHELF }, { label: "INSCRIPTION", x: 222, y: BOTTOM_SHELF }, { label: "LAMP", x: 348, y: BOTTOM_SHELF }, { label: "COINS", x: 474, y: BOTTOM_SHELF },
];

function Manuscripts({ clip }: { clip: string }) {
  return <g className="hf-layer-manuscripts">
    <g className="hs-scroll-witness">
      <path className="hs-sheet" d="M92 150H176V204H92Z" /><g className="hs-ink">{writing(100, 162, 66, 5, 8)}</g>
      <rect className="hs-roller" x="78" y="142" width="16" height="70" rx="8" /><rect className="hs-roller" x="174" y="142" width="16" height="70" rx="8" />
    </g>
    <g className="hs-codex">
      <path className="hs-sheet" d="M232 112Q266 104 300 112Q334 104 368 112V206Q334 198 300 206Q266 198 232 206Z" /><path className="hs-gutter" d="M300 112V206" />
      <g className="hs-ink">{writing(242, 126, 48, 9, 8.6)}{writing(310, 126, 48, 9, 8.6)}</g>
    </g>
    <defs><clipPath id={clip}><path d={FRAGMENT} /></clipPath></defs>
    <path className="hs-papyrus" d={FRAGMENT} />
    <g clipPath={`url(#${clip})`}>{Array.from({ length: 8 }, (_, r) => <path key={r} className="hs-fibre" d={`M404 ${120 + r * 11}H514`} />)}<g className="hs-ink hs-ink-faded">{writing(432, 138, 58, 5, 11)}</g></g>
  </g>;
}

function Artifacts() {
  return <g className="hf-layer-artifacts">
    <g className="hs-jar"><path d="M90 336V286Q84 270 92 258H116Q124 270 118 286V336Z" /><path d="M86 252H122V258H86Z" /><path className="hs-jar-band" d="M90 296H118M90 304H118" /></g>
    <g className="hs-stele"><path d="M198 336V262Q198 244 222 244Q246 244 246 262V336Z" /><g className="hs-ink">{writing(206, 268, 32, 6, 9)}</g></g>
    <g className="hs-lamp"><path d="M318 336Q316 318 340 314H368Q378 316 380 324L392 320Q388 336 370 336Z" /><path className="hs-lamp-handle" d="M320 328q-12 -2 -10 -10q4 -6 12 -2" /><circle cx="346" cy="322" r="3" /><path className="hs-flame" d="M386 318Q380 308 388 298Q392 310 386 318Z" /></g>
    <g className="hs-coins">{[[458, 326], [478, 330], [492, 322]].map(([x, y], i) => <g key={i} className="hs-coin" style={delay(-i * 1.3)}><circle cx={x} cy={y} r="9" /><circle cx={x} cy={y} r="5" /></g>)}</g>
  </g>;
}

export function ScholarlyScene() {
  const clip = `hs-fragment-${useId().replace(/:/g, "")}`;
  return <svg className="hf-scene hs-scholarly-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <path className="hs-case" d="M54 92H546V362H54Z" />
    <path className="hs-shelf" d={`M60 ${TOP_SHELF}H540M60 ${BOTTOM_SHELF}H540`} />
    <Manuscripts clip={clip} />
    <Artifacts />
    <g className="hs-lens-track"><g className="hs-lens"><circle cx="0" cy="160" r="30" /><path d="M21 181L36 196" /></g></g>
    <g className="hf-layer-tags">{TAGS.map((tag) => <text key={tag.label} x={tag.x} y={tag.y + 14} textAnchor="middle">{tag.label}</text>)}</g>
    <text className="hf-caption" x="300" y="404" textAnchor="middle">SURVIVING WITNESSES · COPIED, CARRIED AND KEPT</text>
  </svg>;
}

/* ---------- Atlas ---------- */

const PLACES = [
  { name: "CAPERNAUM", x: 350, y: 106, side: -1 }, { name: "NAZARETH", x: 318, y: 142, side: -1 },
  { name: "CAESAREA", x: 236, y: 170, side: -1 }, { name: "JERICHO", x: 354, y: 264, side: 1 },
  { name: "JERUSALEM", x: 330, y: 282, side: -1 }, { name: "BETHLEHEM", x: 324, y: 304, side: -1 },
];
const COAST = "M262 40C258 80 248 110 240 150C232 190 226 220 214 250C202 280 188 320 170 360L158 404";
const JOURNEY = "M318 142C330 128 340 116 350 106C334 160 336 224 354 264C346 272 338 278 330 282";

export function AtlasScene() {
  return <svg className="hf-scene hs-atlas-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <g className="hf-layer-sea">{Array.from({ length: 12 }, (_, i) => <path key={i} className="hs-wave" style={delay(-i * 0.7)}
      d={`M${60 + (i % 3) * 22} ${70 + i * 28}q10 -5 20 0t20 0t20 0`} />)}
      <text className="hs-sea-name" x="118" y="232" textAnchor="middle">THE GREAT SEA</text>
    </g>
    <g className="hf-layer-land">
      <path className="hs-coast" d={COAST} />
      <path className="hs-coast-shadow" d={COAST} transform="translate(-7 2)" />
      <ellipse className="hs-water" cx="364" cy="126" rx="10" ry="16" />
      <path className="hs-river" d="M364 142C370 170 360 200 368 230C374 250 366 266 372 282" />
      <ellipse className="hs-water" cx="374" cy="312" rx="11" ry="30" />
      <text className="hs-region" x="394" y="316">DEAD SEA</text><text className="hs-region" x="384" y="122">GALILEE</text>
    </g>
    <path className="hs-journey" pathLength={1} d={JOURNEY} />
    <g className="hf-layer-pins">{PLACES.map((p, i) => <g key={p.name} className="hs-pin" style={delay(-i * 0.8)}>
      <circle cx={p.x} cy={p.y} r="4" /><circle className="hs-pin-halo" cx={p.x} cy={p.y} r="9" />
      <text x={p.x + p.side * 12} y={p.y + 3} textAnchor={p.side > 0 ? "start" : "end"}>{p.name}</text>
    </g>)}</g>
    <g className="hf-layer-compass"><g transform="translate(500 96)">
      <circle r="30" /><circle r="22" className="hs-compass-inner" />
      <g className="hs-needle"><path d="M0 -26L5 0L0 26L-5 0Z" /><path className="hs-needle-north" d="M0 -26L5 0H-5Z" /></g>
      <text y="-36" textAnchor="middle">N</text>
    </g></g>
    <g className="hs-scale"><path d="M450 360H530M450 355V365M490 357V363M530 355V365" /><text x="490" y="380" textAnchor="middle">20 MILES</text></g>
    <text className="hf-caption" x="300" y="414" textAnchor="middle">REAL PLACES · AN UNFOLDING STORY</text>
  </svg>;
}

/* ---------- Resources ---------- */

const ROAD = "M40 392C150 384 170 330 250 312S380 282 420 236S500 170 566 160";

export function ResourcesScene() {
  return <svg className="hf-scene hs-resources-scene" viewBox="0 20 600 400" fill="none" aria-hidden="true">
    <path className="hf-cross" d="M30 160H570" />
    <g className="hf-layer-sky"><circle className="hs-sun" cx="470" cy="112" r="34" />
      {Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (1.08 + i * 0.105); return <path key={i} className="hs-sun-ray" style={delay(i * 0.5)} d={`M${470 + 44 * Math.cos(a)} ${112 + 44 * Math.sin(a)}L${470 + 60 * Math.cos(a)} ${112 + 60 * Math.sin(a)}`} />; })}
    </g>
    <g className="hf-layer-road"><path className="hs-road" d={ROAD} /><path className="hs-road-line" d={ROAD} /></g>
    <circle className="hs-traveller" r="5" style={{ offsetPath: `path("${ROAD}")` }} />
    <g className="hf-layer-stops">
      <g className="hs-stop" style={{ "--tone": "var(--epistles)" } as CSSProperties}>
        <path d="M124 318Q138 310 152 318Q166 310 180 318V344Q166 336 152 344Q138 336 124 344ZM152 318V344" />
        <text x="152" y="298" textAnchor="middle">LEARNING</text>
      </g>
      <g className="hs-stop" style={{ "--tone": "var(--gospels)" } as CSSProperties}>
        <circle cx="300" cy="250" r="20" className="hs-gathering" />
        {Array.from({ length: 6 }, (_, i) => { const a = (i * Math.PI) / 3; return <circle key={i} className="hs-person" cx={300 + 20 * Math.cos(a)} cy={250 + 20 * Math.sin(a)} r="4.5" />; })}
        <text x="300" y="217" textAnchor="middle">FELLOWSHIP</text>
      </g>
      <g className="hs-stop" style={{ "--tone": "var(--resource-life)" } as CSSProperties}>
        <path d="M482 244V218L502 202L522 218V244Z" /><rect className="hs-window" x="496" y="224" width="12" height="12" rx="1.5" />
        <text x="502" y="264" textAnchor="middle">HELP FOR LIFE</text>
      </g>
    </g>
    <text className="hf-caption" x="300" y="414" textAnchor="middle">HELP FOR THE ROAD · CLOSE AT HAND</text>
  </svg>;
}
