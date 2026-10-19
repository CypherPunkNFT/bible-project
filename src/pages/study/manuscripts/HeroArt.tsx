// The opening drawing (the owner's chosen variant E, 2026-10-18; mock-up js/landing.js): scroll, codex leaf and a
// papyrus fragment set a little left and lower, three smaller scraps threaded back to it, a museum tag, and a lens on the
// leaf showing it enlarged. Shapes describe formats only; no manuscript's text or damage is reproduced. It drifts slowly
// in a loop (mockup-manuscripts.css), and holds still under reduced motion.
import type { ReactNode } from "react";

/** Rows of writing as short strokes, slightly ragged, inside a column. */
function lines(x: number, y: number, width: number, rows: number, gap: number, opts: { right?: boolean; dash?: string } = {}): ReactNode[] {
  const out: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const w = width - ((r * 7 + x) % 11) - (r === rows - 1 ? width * 0.4 : 0);
    const x0 = opts.right ? x + width - w : x;
    out.push(<path key={`${x}-${y}-${r}`} d={`M${x0.toFixed(1)} ${(y + r * gap).toFixed(1)}h${w.toFixed(1)}`} strokeDasharray={opts.dash ?? "6 2 3 1.5"} opacity={(0.34 + (r % 4) * 0.12).toFixed(2)} />);
  }
  return out;
}
const fibres = (x: number, y: number, w: number, h: number, step = 6) => <>
  {Array.from({ length: Math.ceil(h / step) }, (_, i) => <path key={`h${i}`} d={`M${x} ${y + i * step}h${w}`} />)}
  {Array.from({ length: Math.ceil(w / (step + 2)) }, (_, i) => <path key={`v${i}`} d={`M${x + i * (step + 2)} ${y}v${h}`} />)}
</>;
const LeafBody = () => <>
  <path className="mh-sheet mh-sheet-front" d="M176 104 Q250 96 326 106 L322 286 Q248 276 172 284Z" />
  <path className="ms-fold" d="M249 104 V280" />
  <g className="ms-ink">{lines(186, 124, 54, 21, 7.2)}{lines(259, 124, 54, 21, 7.2)}</g>
</>;

/** Three smaller scraps lying apart, each tied back to the fragment by a dotted thread: pieces of one book. */
function Scraps() {
  const scrap = (n: number, d: string, x: number, y: number, w: number, h: number, rows: number) => <g key={n} className={`hv-scrap hv-scrap-${n}`}>
    <defs><clipPath id={`hv-s${n}`}><path d={d} /></clipPath></defs>
    <path className="ms-papyrus" d={d} />
    <g clipPath={`url(#hv-s${n})`}><g className="ms-fibres">{fibres(x, y, w, h)}</g><g className="ms-ink ms-ink-gold">{lines(x + 6, y + 9, w - 14, rows, 7, { dash: "5 1.5 2.5 1.5" })}</g></g>
  </g>;
  return <>
    <path className="hv-thread" d="M276 214Q340 214 352 246M266 236Q306 274 312 298M242 250Q262 290 250 312" />
    {scrap(1, "M346 236l22-6 18 9-3 15 9 14-10 15-20 2-9-11-10-3 2-19Z", 336, 226, 56, 60, 6)}
    {scrap(2, "M302 292l20-4 9 9-4 14-15 4-11-8Z", 298, 286, 34, 30, 3)}
    {scrap(3, "M240 306l15-3 6 7-3 10-12 2-7-7Z", 236, 300, 26, 22, 2)}
  </>;
}

/** A museum tag under the scroll, tied to the fragment's left edge. */
const Tag = () => <g className="hv-tag"><path className="hv-thread" d="M174 204Q150 214 132 226" />
  <g transform="rotate(-8 112 232)"><path className="mh-sheet mh-sheet-front" d="M92 220h52v26h-52l-8-13Z" /><circle className="ms-roll-end" cx="96" cy="233" r="2.4" />
    <path className="hv-label" d="M104 228h30M104 234h22M104 240h26" /></g></g>;

/** A lens resting on the leaf's right-hand column, showing the leaf beneath it enlarged. */
function Lens() {
  const [cx, cy, r] = [312, 150, 30];
  return <>
    <defs><clipPath id="hv-lens"><circle cx={cx} cy={cy} r={r} /></clipPath></defs>
    <g><circle className="hv-glass" cx={cx} cy={cy} r={r} />
      <g clipPath="url(#hv-lens)"><g transform={`translate(${cx} ${cy}) scale(1.7) translate(${-cx} ${-cy})`}><g transform="rotate(7 250 190)"><LeafBody /></g></g></g>
      <circle className="hv-glare" cx={cx} cy={cy} r={r} />
      <circle className="hv-rim" cx={cx} cy={cy} r={r} /><circle className="hv-rim hv-rim-2" cx={cx} cy={cy} r={r + 4} />
      <path className="hv-handle" d={`M${cx + 22} ${cy + 22} ${cx + 48} ${cy + 48}`} /></g>
  </>;
}

const FRAGMENT = "M214 128 L262 116 290 134 284 158 302 181 289 222 258 236 236 218 212 226 198 190 210 170Z";

export function HeroArt() {
  return <figure className="ms-hero-art" aria-hidden="true"><svg viewBox="0 0 420 330">
    <defs><clipPath id="ms-frag"><path d={FRAGMENT} /></clipPath></defs>
    <ellipse className="ms-orbit" cx="214" cy="170" rx="196" ry="128" />
    <ellipse className="ms-orbit ms-orbit-2" cx="214" cy="170" rx="160" ry="150" transform="rotate(-18 214 170)" />
    <g className="ms-scroll"><g transform="rotate(-9 150 120)">
      <path className="mh-sheet" d="M62 64 H244 V176 H62Z" />
      <path className="ms-roll" d="M48 60 h14 v120 h-14 a7 4 0 0 1 0 -8 v-104 a7 4 0 0 1 0 -8Z M244 60 h14 a7 4 0 0 1 0 8 v104 a7 4 0 0 1 0 8 h-14Z" />
      <ellipse className="ms-roll-end" cx="55" cy="60" rx="7" ry="3.5" /><ellipse className="ms-roll-end" cx="251" cy="60" rx="7" ry="3.5" />
      <g className="ms-ink">{lines(74, 80, 46, 13, 7, { right: true, dash: "4 1.5 7 1.5" })}{lines(130, 80, 46, 13, 7, { right: true, dash: "4 1.5 7 1.5" })}{lines(186, 80, 46, 13, 7, { right: true, dash: "4 1.5 7 1.5" })}</g>
    </g></g>
    <g className="ms-leaf"><g transform="rotate(7 250 190)"><LeafBody /></g></g>
    <g transform="translate(-24 14)"><g className="ms-fragment">
      <path className="ms-papyrus" d={FRAGMENT} />
      <g clipPath="url(#ms-frag)"><g className="ms-fibres">
        {Array.from({ length: 14 }, (_, i) => <path key={`h${i}`} d={`M190 ${116 + i * 9}h120`} />)}
        {Array.from({ length: 10 }, (_, i) => <path key={`v${i}`} d={`M${200 + i * 10} 110v130`} />)}
      </g><g className="ms-ink ms-ink-gold">{lines(212, 140, 72, 12, 7.5, { dash: "5 1.5 2.5 1.5" })}</g></g>
    </g></g>
    <Scraps /><Tag /><Lens />
    <path className="ms-mark" d="M28 52h10m-5-5v10M384 286h10m-5-5v10M372 40h8m-4-4v8" />
  </svg>
    <span className="ms-art-top">Three forms, one text</span>
    <span className="ms-art-note"><i />Scroll. Codex. Fragment.<br /><span>Copied by hand.</span></span>
  </figure>;
}
