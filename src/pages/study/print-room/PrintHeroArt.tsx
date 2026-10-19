// The opening drawing, a companion to the Manuscripts page's scroll-codex-fragment drawing: a hand-copied leaf with its
// quill, a line of metal type set in reverse, and a stack of printed sheets under a press platen that keeps pressing. Gold
// is the hand, vermilion the press. Shapes describe formats only; no Bible's text is reproduced. It moves slowly in a
// loop (overhaul.css) and holds still under reduced motion.
import type { ReactNode } from 'react';

/** Rows of writing as short strokes; ragged for the hand, even for the press. */
function rows(x: number, y: number, width: number, count: number, gap: number, opts: { even?: boolean; dash?: string } = {}): ReactNode[] {
  return Array.from({ length: count }, (_, r) => {
    const short = opts.even ? (r % 7 === 6 ? width * 0.45 : 0) : ((r * 7 + x) % 11) + (r === count - 1 ? width * 0.4 : 0);
    return <path key={`${x}-${y}-${r}`} d={`M${x} ${(y + r * gap).toFixed(1)}h${(width - short).toFixed(1)}`}
      strokeDasharray={opts.even ? undefined : (opts.dash ?? '6 2 3 1.5')} opacity={opts.even ? 0.8 : (0.34 + (r % 4) * 0.12).toFixed(2)} />;
  });
}

const LEAF = 'M40 70 Q110 62 180 72 L176 236 Q108 228 36 236Z';
const SHEET = 'M226 98 H370 V290 H226Z';
const LETTERS = ['T', 'N', 'I', 'R', 'P'];

function Leaf() {
  return <g className="ph-leaf"><g transform="rotate(-8 108 150)">
    <path className="ph-vellum" d={LEAF} />
    <rect className="ph-initial-gold" x="50" y="84" width="11" height="12" rx="1" />
    <g className="ph-ink-hand">{rows(66, 88, 34, 2, 7.5)}{rows(50, 103, 50, 17, 7.5)}{rows(114, 88, 52, 19, 7.5)}</g>
  </g></g>;
}

const Quill = () => <g className="ph-quill">
  <path className="ph-vane" d="M206 26 C196 50 170 70 136 90 C156 66 180 44 206 26Z" />
  <path className="ph-shaft" d="M206 26 Q170 62 126 98 L120 106" />
</g>;

/** The printed sheet and two finished copies behind it: the press repeats the page. */
function Sheets() {
  const sheet = (n: number) => <path key={n} className={n === 0 ? 'ph-paper' : 'ph-paper ph-paper-back'} d={SHEET} transform={`translate(${-n * 7} ${-n * 6})`} />;
  return <g className="ph-sheets"><g transform="rotate(6 298 194)">
    {[2, 1, 0].map(sheet)}
    <path className="ph-head" d="M276 110h44" />
    <g className="ph-ink-press">{rows(256, 124, 34, 4, 6.4, { even: true })}{rows(238, 150, 52, 21, 6.4, { even: true })}{rows(304, 124, 54, 25, 6.4, { even: true })}</g>
    <rect className="ph-initial-red" x="238" y="120" width="14" height="22" rx="1" />
    <path className="ph-sig" d="M330 282h12" />
  </g></g>;
}

/** The press platen above the sheets, on its screw; it comes down and lifts again. */
const Platen = () => <g className="ph-press">
  <path className="ph-frame" d="M210 16 V78 M392 16 V78 M204 16 H398" />
  <g className="ph-platen">
    <path className="ph-screw" d="M301 16 V54 M296 22 l10 4 M296 30 l10 4 M296 38 l10 4 M296 46 l10 4" />
    <path className="ph-bar" d="M264 26 H338" />
    <path className="ph-plate" d="M218 56 H384 V68 H218Z" />
  </g>
</g>;

/** A composing stick holding PRINT set in reverse, as type must be. */
function Type() {
  return <g className="ph-type"><g transform="rotate(-4 306 290)">
    <path className="ph-stick" d="M236 268 H376 V312 H236Z" />
    {LETTERS.map((c, i) => <g key={c} className="ph-sort" style={{ animationDelay: `${i * 0.35}s` }}>
      <rect x={244 + i * 26} y="274" width="23" height="32" rx="1.5" />
      <text x={-(255.5 + i * 26)} y="298" transform="scale(-1 1)" className={c === 'R' ? 'ph-letter ph-letter-red' : 'ph-letter'}>{c}</text>
    </g>)}
  </g></g>;
}

export function PrintHeroArt() {
  return <figure className="ph-art" aria-hidden="true"><svg viewBox="0 0 420 330">
    <ellipse className="ph-orbit" cx="214" cy="172" rx="198" ry="132" />
    <ellipse className="ph-orbit ph-orbit-2" cx="214" cy="172" rx="162" ry="152" transform="rotate(-18 214 172)" />
    <Leaf /><Quill />
    <Sheets /><Platen />
    <path className="ph-thread" d="M176 168 Q196 246 238 288" />
    <Type />
    <path className="ph-mark" d="M24 50h10m-5-5v10M392 300h10m-5-5v10M30 300h8m-4-4v8" />
  </svg>
    <span className="ph-art-top">Hand. Type. Press.</span>
    <span className="ph-art-note"><i />The press repeats the page.<br /><span>People decide what goes on it.</span></span>
  </figure>;
}
