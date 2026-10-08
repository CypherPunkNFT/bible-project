// Line drawings for the Teachers and Resources doorways (our own art, after design/README.md "Line-art scenes"): every
// stroke has pathLength=1 so it can draw itself. Every scene is drawn twice (StationArt): a faint complete base, always
// there, and a live copy that draws on over it, stroke by stroke, when the doorway is hovered, while its one living detail
// moves (stations.css). "sa-faint" strokes are the quiet background.
import type { CSSProperties, ReactElement } from "react";

export type StationArtKind = "preachers" | "authors" | "scholars" | "learning" | "fellowships" | "life";

const P = ({ d, c = "sa-line", t = 0 }: { d: string; c?: string; t?: number }) => <path pathLength={1} className={c} style={{ "--d": t } as CSSProperties} d={d} />;
const E = ({ x, y, rx, ry = rx, c = "sa-line", t = 0 }: { x: number; y: number; rx: number; ry?: number; c?: string; t?: number }) => <ellipse pathLength={1} className={c} style={{ "--d": t } as CSSProperties} cx={x} cy={y} rx={rx} ry={ry} />;

/** Stars over the preacher's scene, kept outside the arcs of his voice: [x, y, size]. */
const STARS: [number, number, number][] = [[18, 22, 3], [32, 48, 2.2], [76, 16, 2.4], [70, 40, 1.8], [172, 40, 1.8], [166, 14, 2.6], [206, 24, 3], [224, 50, 2.2]];

/** The scholar's shelf: books side by side from x 12 to 228, each [width, height]; a negative height leans the book, a
 *  zero height is a short stack lying flat. */
const SHELF = (() => {
  const books: [number, number][] = [[6, 26], [5, 22], [7, 30], [5, 24], [0, 0], [6, 28], [8, 20], [5, 25], [-9, 24], [6, 31], [5, 23], [7, 27],
    [6, 21], [0, 0], [5, 29], [7, 24], [6, 26], [-9, 22], [5, 30], [6, 25], [8, 22], [5, 28], [6, 24], [0, 0], [7, 27], [5, 23], [6, 30], [5, 21],
    [-8, 26], [6, 24], [7, 29], [5, 22]];
  let x = 12, d = "";
  for (const [w, h] of books) {
    if (x > 222) break;
    if (h === 0) { d += `M${x} 58V54H${x + 16}V58M${x + 1} 54V50H${x + 15}V54M${x + 2} 50V46H${x + 13}V50`; x += 17; continue; }
    if (w < 0) { d += `M${x} 58L${x + 7} ${58 - h}L${x - w + 1} ${58 - h + 2}L${x - w - 6} 58`; x += -w + 1; continue; }
    d += `M${x} 58V${58 - h}H${x + w}V58`;
    x += w + 1;
  }
  return d;
})();

function Preachers() {
  return <>
    {/* Behind: two tall arched windows with a mullion each. */}
    <P d="M38 132V78A16 16 0 0 1 70 78V132ZM54 62V132M38 100H70" c="sa-faint" />
    <P d="M170 132V78A16 16 0 0 1 202 78V132ZM186 62V132M170 100H202" c="sa-faint" t={.03} />
    {/* A cross above each window, and stars in the sky (they twinkle while the doorway is hovered). */}
    <P d="M54 38V52M49 43H59M186 38V52M181 43H191" c="sa-fine" t={.05} />
    {STARS.map(([x, y, r], i) => <path key={i} pathLength={1} className="sa-faint sa-star" style={{ "--d": .04 + i * .02, "--i": i } as CSSProperties}
      d={`M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`} />)}
    <P d="M16 150H224" c="sa-fine" t={.06} />
    {/* The platform, the pulpit with its ledge and the open Bible on it. */}
    <P d="M74 150V143H166V150" c="sa-fine" t={.1} />
    <P d="M88 143L95 94H145L152 143Z" t={.15} />
    <P d="M84 94H156L148 80H92Z" t={.22} />
    <P d="M100 104H140V134H100Z" c="sa-fine" t={.3} /><P d="M120 110V128M112 117H128" c="sa-tone" t={.38} />
    <P d="M98 80C106 72 114 72 120 76C126 72 134 72 142 80" t={.45} /><P d="M120 76V80" c="sa-fine" t={.5} />
    <P d="M103 77C108 74 112 74 116 76M124 76C128 74 132 74 137 77" c="sa-fine" t={.55} />
    <g className="sa-voice">{[16, 30, 46].map((r, i) => <path key={r} pathLength={1} className="sa-wave" style={{ "--i": i } as CSSProperties} d={`M${120 - r} 62A${r} ${r} 0 0 1 ${120 + r} 62`} />)}</g>
    {/* Two lamp stands either side. */}
    <P d="M24 150V120M18 120H30M21 120V113H27V120" c="sa-fine" t={.6} /><P d="M216 150V120M210 120H222M213 120V113H219V120" c="sa-fine" t={.65} />
  </>;
}

function Authors() {
  return <>
    <P d="M14 138H226" /><P d="M30 138V150M210 138V150" c="sa-fine" t={.05} />
    <P d="M24 138V128H58V138M28 128V120H54V128M32 120V113H50V120" c="sa-fine" t={.1} />
    <P d="M66 72L166 64L174 132L74 140Z" t={.15} />
    {[82, 92, 102, 112].map((y, i) => <P key={y} d={`M${80 + i * .6} ${y - i * .2}L${158 - (i % 2) * 14} ${y - 6 - i * .3}`} c="sa-fine" t={.25 + i * .04} />)}
    <path pathLength={1} className="sa-ink" d="M82 124L132 120" />
    <g className="sa-quill"><P d="M132 120C148 96 170 66 198 40C190 64 170 92 136 118Z" t={.4} /><P d="M140 108L170 66M146 102L184 56M152 94L190 50" c="sa-fine" t={.5} /></g>
    <P d="M184 138V124C184 118 206 118 206 124V138" t={.3} /><E x={195} y={122} rx={9} ry={2.5} c="sa-tone" t={.35} />
  </>;
}

function Scholars() {
  return <>
    {/* Behind: one long shelf of books from wall to wall, standing, leaning and lying flat. */}
    <P d="M10 58H230" c="sa-faint" />
    <P d={SHELF} c="sa-faint" t={.03} />
    <P d="M12 146H228" t={.08} />
    {/* The open book: covers under the pages, the two pages, their edge, the writing and the spine. */}
    <P d="M40 80V128C68 118 98 120 120 131C142 120 172 118 200 128V80" c="sa-fine" t={.12} />
    <P d="M46 124C72 114 98 116 120 126V82C98 72 72 70 46 78Z" t={.16} /><P d="M194 124C168 114 142 116 120 126V82C142 72 168 70 194 78Z" t={.2} />
    <P d="M46 124V127C72 117 98 119 120 129C142 119 168 117 194 127V124" c="sa-fine" t={.26} />
    {[0, 1, 2, 3, 4].map((i) => <P key={i} d={`M${54} ${86 + i * 7}C${72} ${80 + i * 7} ${92} ${82 + i * 7} ${112} ${89 + i * 7}M${128} ${89 + i * 7}C${148} ${82 + i * 7} ${168} ${80 + i * 7} ${186} ${86 + i * 7}`} c="sa-fine" t={.3 + i * .03} />)}
    <P d="M120 126V131" c="sa-fine" t={.45} />
    <g className="sa-glass"><E x={84} y={96} rx={12} c="sa-tone" t={.5} /><P d="M93 105L106 118" c="sa-tone" t={.55} /></g>
    {/* A small stack of closed books on the right, the lamp on the left. */}
    <P d="M200 146V138H224V146M204 138V130H220V138M206 130V124H218V130" c="sa-fine" t={.6} />
    <P d="M20 146C20 136 30 132 36 132H44C48 132 50 136 50 140" t={.4} /><P d="M16 146H54" c="sa-fine" t={.45} />
    <path className="sa-flame" d="M34 128C30 120 33 114 35 108C37 114 41 120 37 128Z" />
  </>;
}

function Learning() {
  return <>
    <P d="M150 24H196L206 34V104H150Z" c="sa-fine" /><P d="M196 24V34H206" c="sa-fine" t={.05} /><P d="M160 50H194M160 60H190M160 70H194M160 80H184" c="sa-fine" t={.1} />
    <P d="M60 30H172V142H60Z" t={.12} />
    {[42, 58, 74, 90, 106, 122].map((y, i) => <E key={y} x={60} y={y} rx={3.5} c="sa-fine" t={.2 + i * .02} />)}
    <P d="M78 46H150" t={.25} /><P d="M78 55H128" c="sa-fine" t={.3} />
    {[72, 92, 112].map((y, i) => <g key={y}><P d={`M80 ${y - 5}h10v10h-10Z`} c="sa-fine" t={.32 + i * .04} /><P d={`M98 ${y}H${156 - i * 10}`} c="sa-fine" t={.36 + i * .04} /><path pathLength={1} className="sa-tick" style={{ "--i": i } as CSSProperties} d={`M82 ${y}l3 3.5l6 -8`} /></g>)}
    <g className="sa-pencil"><P d="M150 134L192 92L200 100L158 142Z" t={.45} /><P d="M150 134L145 147L158 142" c="sa-tone" t={.5} /><P d="M186 98L194 106" c="sa-fine" t={.55} /></g>
  </>;
}

const SEATS = Array.from({ length: 7 }, (_, i) => { const a = Math.PI * (1.08 + (i / 6) * 0.84) - Math.PI; return [120 + Math.cos(a) * 92, 106 - Math.sin(a) * 40] as const; });

function Fellowships() {
  return <>
    <E x={120} y={114} rx={70} ry={18} t={.05} /><P d="M70 128V150M170 128V150M120 132V152" c="sa-fine" t={.1} />
    <P d="M104 112C110 106 116 106 120 109C124 106 130 106 136 112" t={.2} /><P d="M120 109V112" c="sa-fine" t={.25} />
    {SEATS.map(([x, y], i) => <g key={i} className="sa-person" style={{ "--i": i } as CSSProperties}>
      <path pathLength={1} className="sa-thread" d={`M${x.toFixed(1)} ${(y - 4).toFixed(1)}L120 ${108}`} />
      <circle className="sa-head" cx={x.toFixed(1)} cy={(y - 16).toFixed(1)} r={5} /><path className="sa-body" d={`M${(x - 9).toFixed(1)} ${(y - 2).toFixed(1)}C${(x - 9).toFixed(1)} ${(y - 10).toFixed(1)} ${(x + 9).toFixed(1)} ${(y - 10).toFixed(1)} ${(x + 9).toFixed(1)} ${(y - 2).toFixed(1)}`} />
    </g>)}
  </>;
}

function Life() {
  return <>
    <P d="M10 140H230" />
    <P d="M72 140V94L114 64L156 94V140" t={.08} /><P d="M62 100L114 60L166 100" t={.15} /><P d="M136 76V62H146V84" c="sa-fine" t={.2} />
    <P d="M104 140V114H122V140" t={.25} /><E x={118} y={128} rx={1.2} c="sa-tone" t={.3} />
    <rect className="sa-window" x={130} y={104} width={16} height={16} /><P d="M130 104H146V120H130ZM138 104V120M130 112H146" t={.3} />
    <P d="M113 140C110 148 132 152 174 156" c="sa-fine" t={.35} />
    <P d="M196 140V92" t={.4} /><P d="M180 96H214L220 103L214 110H180Z" t={.45} /><P d="M186 103H206" c="sa-fine" t={.5} />
    <P d="M36 140V114" c="sa-fine" t={.4} /><E x={36} y={102} rx={14} ry={16} c="sa-fine" t={.45} />
    <g className="sa-steps">{[0, 1, 2, 3].map((i) => <circle key={i} style={{ "--i": i } as CSSProperties} cx={128 + i * 12} cy={150 + i * 1.2} r={1.4} />)}</g>
  </>;
}

const ART: Record<StationArtKind, () => ReactElement> = { preachers: Preachers, authors: Authors, scholars: Scholars, learning: Learning, fellowships: Fellowships, life: Life };

/** Each scene twice: a faint complete base that is always there, and the live drawing over it, which draws itself on
 *  brightly when its doorway is hovered or focused (stations.css). */
export function StationArt({ kind }: { kind: StationArtKind }) {
  const Art = ART[kind];
  return <svg className="sa-art" viewBox="0 0 240 160" fill="none" aria-hidden="true" focusable="false">
    <g className="sa-base"><Art /></g><g className="sa-live"><Art /></g>
  </svg>;
}
