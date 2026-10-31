// MOCK-UP: five more drawings for the Atlas row of the doorway design sheet (/doorways_mockup). Owner, 2026-10-31: picked
// the folded paper map for now and said "lets do some more", so these stay with paper maps, coastlines, marked places and
// routes: a scroll on rollers, an atlas open at a double-page map, a pinned board with a route string, a sea chart with a
// ship, and a folded map with a pocket compass lying on it.
import type { DoorwayVariant } from "./doorway-types";

const Pin = ({ x, y, big }: { x: number; y: number; big?: boolean }) => <g><circle cx={x} cy={y} r={big ? 8 : 5.5} fill="var(--surface)" stroke="currentColor" strokeOpacity=".7" /><circle cx={x} cy={y} r={big ? 3.2 : 2} fill="currentColor" /></g>;
const Pins = ({ at, big }: { at: readonly (readonly [number, number])[]; big: number }) => <>{at.map(([x, y], i) => <Pin key={i} x={x} y={y} big={i === big} />)}</>;
/** Land below a coastline: soft tint, the coast itself, and one fainter echo out to sea. */
const Coast = ({ d, close }: { d: string; close: string }) => <g>
  <path d={`${d}${close}`} fill="currentColor" fillOpacity=".1" /><path d={d} transform="translate(0 -7)" stroke="currentColor" opacity=".22" />
  <path d={d} stroke="currentColor" strokeWidth="1.4" strokeOpacity=".7" />
</g>;
const Route = ({ d }: { d: string }) => <path d={d} stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 4" opacity=".7" />;
const ray = (cx: number, cy: number, n: number, length: number) => Array.from({ length: n }, (_, i) => `M${cx} ${cy}l${(length * Math.cos((i * 2 * Math.PI) / n)).toFixed(1)} ${(length * Math.sin((i * 2 * Math.PI) / n)).toFixed(1)}`).join("");
/** A four-point compass star centred on (x,y). */
const Rose = ({ x, y, r }: { x: number; y: number; r: number }) => {
  const s = r * .22;
  return <g>
    <circle cx={x} cy={y} r={r * .74} stroke="currentColor" opacity=".35" /><circle cx={x} cy={y} r={r * .6} stroke="currentColor" strokeDasharray="1 3" opacity=".5" />
    <path d={`M${x} ${y - r}L${x + s} ${y - s}L${x + r} ${y}L${x + s} ${y + s}L${x} ${y + r}L${x - s} ${y + s}L${x - r} ${y}L${x - s} ${y - s}Z`} fill="var(--surface)" stroke="currentColor" strokeWidth="1.2" />
    <path d={`M${x} ${y - r}L${x + s} ${y - s}L${x} ${y}ZM${x + r} ${y}L${x + s} ${y + s}L${x} ${y}ZM${x} ${y + r}L${x - s} ${y + s}L${x} ${y}ZM${x - r} ${y}L${x - s} ${y - s}L${x} ${y}Z`} fill="currentColor" fillOpacity=".45" />
    <text x={x} y={y - r - 3} textAnchor="middle" fill="currentColor" fontSize="8" letterSpacing="1">N</text>
  </g>;
};

function ScrollMap() {
  const roller = (x: number) => <g stroke="currentColor">
    <path d={`M${x + 6} 10V170`} strokeWidth="1.2" opacity=".5" />
    {[14, 166].map((y) => <ellipse key={y} cx={x + 6} cy={y} rx="5" ry="4" fill="var(--surface)" strokeOpacity=".7" />)}
    <rect x={x} y="20" width="12" height="140" rx="6" fill="var(--surface)" strokeWidth="1.3" strokeOpacity=".75" />
    <path d={`M${x + 4} 27V153`} opacity=".25" /><path d={`M${x} 34H${x + 12}M${x} 146H${x + 12}`} opacity=".4" />
  </g>;
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <defs><clipPath id="atlas-more-scroll"><rect x="42" y="28" width="236" height="124" /></clipPath></defs>
    <rect x="42" y="28" width="236" height="124" fill="var(--surface)" />
    <g clipPath="url(#atlas-more-scroll)">
      <g stroke="currentColor" opacity=".1"><path d="M42 60H278M42 92H278M42 124H278M90 28V152M150 28V152M210 28V152M262 28V152" /></g>
      <Coast d="M42 98C68 88 88 66 116 72S154 106 184 96 228 58 278 66" close="L278 152H42Z" />
      <Route d="M76 128C104 112 128 134 156 120S206 132 238 110" /><Pins at={[[76, 128], [156, 120], [238, 110]]} big={1} />
      <rect x="42" y="28" width="12" height="124" fill="currentColor" fillOpacity=".07" /><rect x="266" y="28" width="12" height="124" fill="currentColor" fillOpacity=".07" />
    </g>
    <path d="M42 28H278M42 152H278" stroke="currentColor" strokeOpacity=".55" />
    <Rose x={92} y={54} r={15} />
    <text x="214" y="48" textAnchor="middle" fill="currentColor" fontSize="8" letterSpacing="2">EXPLORE</text>
    {roller(32)}{roller(276)}
  </svg>;
}

function OpenAtlas() {
  const page = (dx: 1 | -1) => `M160 42Q${160 - dx * 50} 30 ${160 - dx * 130} 36V156Q${160 - dx * 50} 150 160 164Z`;
  const curve = (y: number) => `M30 ${y}Q110 ${y - 8} 160 ${y + 4}Q210 ${y - 8} 290 ${y}`;
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <defs><clipPath id="atlas-more-book"><path d={`${page(1)}${page(-1)}`} /></clipPath></defs>
    <path d="M22 40V164Q110 158 160 172Q210 158 298 164V40Q210 32 160 44Q110 32 22 40Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeOpacity=".5" />
    {[6, 3].map((d) => <path key={d} d={`M30 ${156 + d}Q110 ${150 + d} 160 ${164 + d}Q210 ${150 + d} 290 ${156 + d}`} stroke="currentColor" opacity=".35" />)}
    <path d={`${page(1)}${page(-1)}`} fill="var(--surface)" />
    <g clipPath="url(#atlas-more-book)">
      <g stroke="currentColor" opacity=".1"><path d={`${curve(70)}${curve(104)}${curve(138)}M80 20V170M120 20V170M200 20V170M240 20V170`} /></g>
      <Coast d="M30 86C60 80 80 102 110 98S146 72 176 80 228 108 258 100 290 90" close="L290 170H30Z" />
      <Route d="M70 126C98 114 116 120 132 112S180 138 206 128 238 112 256 118" /><Pins at={[[70, 126], [132, 112], [206, 128], [256, 118]]} big={2} />
      <rect x="146" y="20" width="28" height="160" fill="currentColor" fillOpacity=".05" /><rect x="153" y="20" width="14" height="160" fill="currentColor" fillOpacity=".07" />
    </g>
    <path d={`${page(1)}${page(-1)}`} stroke="currentColor" strokeWidth="1.2" strokeOpacity=".65" />
    <path d="M160 42V164" stroke="currentColor" opacity=".45" />
    <Rose x={64} y={60} r={13} />
    <text x="236" y="62" textAnchor="middle" fill="currentColor" fontSize="8" letterSpacing="2">CANAAN</text>
  </svg>;
}

function PinnedBoard() {
  const Tack = ({ x, y }: { x: number; y: number }) => <g><circle cx={x + 1.5} cy={y + 2} r="4.5" fill="currentColor" fillOpacity=".15" /><circle cx={x} cy={y} r="4.5" fill="var(--surface)" stroke="currentColor" strokeOpacity=".75" /><circle cx={x} cy={y} r="1.8" fill="currentColor" /></g>;
  const stops = [[84, 124], [134, 100], [190, 122], [240, 102]] as const;
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <defs><clipPath id="atlas-more-board"><rect x="46" y="30" width="228" height="124" /></clipPath></defs>
    <rect x="8" y="6" width="304" height="168" rx="5" fill="currentColor" fillOpacity=".05" stroke="currentColor" strokeOpacity=".45" />
    <rect x="16" y="14" width="288" height="152" rx="2" stroke="currentColor" opacity=".2" />
    <g transform="rotate(-2.5 160 92)">
      <rect x="46" y="30" width="228" height="124" fill="var(--surface)" />
      <g clipPath="url(#atlas-more-board)">
        <g stroke="currentColor" opacity=".1"><path d="M46 62H274M46 94H274M46 126H274M92 30V154M146 30V154M200 30V154M250 30V154" /></g>
        <Coast d="M46 72C76 64 96 86 126 82S170 56 200 64 244 94 274 86" close="L274 154H46Z" />
      </g>
      <rect x="46" y="30" width="228" height="124" stroke="currentColor" strokeOpacity=".55" />
      <path d={`M${stops.map(([x, y]) => `${x} ${y}`).join("L")}`} stroke="currentColor" strokeWidth="1.2" opacity=".7" />
      {stops.map(([x, y]) => <Tack key={x} x={x} y={y} />)}
      {[[54, 38], [266, 38], [54, 146]].map(([x, y]) => <Tack key={`${x}${y}`} x={x} y={y} />)}
    </g>
    <g transform="rotate(5 262 140)">
      <rect x="230" y="120" width="64" height="40" fill="var(--surface)" stroke="currentColor" strokeOpacity=".6" />
      <text x="262" y="138" textAnchor="middle" fill="currentColor" fontSize="8" letterSpacing="2">ROUTE</text>
      <path d="M240 148H284M240 154H270" stroke="currentColor" opacity=".3" />
    </g>
    <Tack x={262} y={124} />
  </svg>;
}

function SeaChart() {
  // Coastlines only (stroked); the land fill closes each one along the frame edge without stroking it.
  const north = "M150 0C142 14 126 18 118 30S96 42 84 52 54 56 40 70 12 72 0 78";
  const south = "M150 180C160 168 178 166 190 154S220 148 232 134 270 128 284 112 310 106 320 100";
  const land = [`${north}L0 0Z`, `${south}L320 180Z`];
  const waves = [[112, 112], [252, 50], [196, 34], [276, 82], [108, 148]].map(([x, y]) => `M${x} ${y}q3-3 6 0t6 0`).join("");
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <defs><clipPath id="atlas-more-chart"><rect width="320" height="180" /></clipPath></defs>
    <g clipPath="url(#atlas-more-chart)">
      <path d={ray(50, 136, 16, 340)} stroke="currentColor" opacity=".1" />
      {land.map((d) => <g key={d.slice(0, 6)}><path d={d} fill="var(--surface)" /><path d={d} fill="currentColor" fillOpacity=".1" /></g>)}
      <path d={north} transform="translate(6 6)" stroke="currentColor" opacity=".2" /><path d={south} transform="translate(-6 -6)" stroke="currentColor" opacity=".2" />
      <path d={`${north}${south}`} stroke="currentColor" strokeWidth="1.4" strokeOpacity=".7" />
    </g>
    <path d="M200 64C202 52 220 48 232 54S236 70 222 74 198 74 200 64Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeOpacity=".6" />
    <path d={waves} stroke="currentColor" opacity=".4" />
    <Route d="M84 52Q118 88 158 88T232 134" /><path d="M158 88Q186 70 212 64" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 4" opacity=".45" />
    <g transform="translate(150 84)" stroke="currentColor">
      <path d="M0 -1V-27" strokeWidth="1.2" /><path d="M0 -27l7 2.5-7 2.5" fill="currentColor" stroke="none" />
      <path d="M1.5 -24Q13 -14 12 -4H1.5Z" fill="currentColor" fillOpacity=".15" strokeOpacity=".7" /><path d="M-1.5 -20L-12 -4H-1.5Z" fill="var(--surface)" strokeOpacity=".7" />
      <path d="M-16 -1H16Q13 6 8 7H-9Q-14 6-16 -1Z" fill="var(--surface)" strokeWidth="1.3" strokeOpacity=".8" />
      <path d="M-24 11q4-3 8 0t8 0 8 0 8 0 8 0 8 0" opacity=".4" />
    </g>
    <Pins at={[[84, 52], [232, 134], [212, 64]]} big={1} />
    <Rose x={50} y={136} r={24} />
    <text x="244" y="22" textAnchor="middle" fill="currentColor" fontSize="8" letterSpacing="2">JOURNEYS</text>
  </svg>;
}

const FOLD_COAST = "M26 92C52 80 74 58 102 64S140 100 170 92 214 54 254 60";
function FoldedCompass() {
  const ticks = Array.from({ length: 24 }, (_, i) => { const a = (i * Math.PI) / 12, r0 = i % 6 ? 18 : 15; return `M${(262 + r0 * Math.sin(a)).toFixed(1)} ${(134 - r0 * Math.cos(a)).toFixed(1)}L${(262 + 20 * Math.sin(a)).toFixed(1)} ${(134 - 20 * Math.cos(a)).toFixed(1)}`; }).join("");
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <path d="M30 172L102 162 178 172 254 162" stroke="currentColor" opacity=".15" />
    {[0, 1, 2].map((i) => {
      const x = 26 + i * 76, k = i % 2 ? -10 / 76 : 10 / 76, e = -k * x + (i % 2 ? 10 : 0);
      return <g key={i} transform={`matrix(1 ${k.toFixed(4)} 0 1 0 ${e.toFixed(2)})`}>
        <defs><clipPath id={`atlas-more-fold-${i}`}><rect x={x} y="26" width="76" height="128" /></clipPath></defs>
        <g clipPath={`url(#atlas-more-fold-${i})`}>
          <rect x={x} y="26" width="76" height="128" fill="var(--surface)" />
          <g stroke="currentColor" opacity=".12"><path d="M26 58H254M26 94H254M26 130H254M64 26V154M140 26V154M216 26V154" /></g>
          <Coast d={FOLD_COAST} close="L254 154H26Z" />
          <Route d="M58 126C86 108 112 130 140 112S184 132 206 114" /><Pins at={[[58, 126], [140, 112], [206, 114]]} big={1} />
          <rect x={x} y="26" width="76" height="128" fill="currentColor" fillOpacity={i % 2 ? .07 : 0} stroke="currentColor" strokeOpacity=".55" />
        </g>
      </g>;
    })}
    <circle cx="265" cy="137" r="24" fill="currentColor" fillOpacity=".12" />
    <path d="M262 110V106" stroke="currentColor" strokeWidth="2" opacity=".6" /><circle cx="262" cy="102" r="4" stroke="currentColor" strokeWidth="1.2" strokeOpacity=".7" />
    <circle cx="262" cy="134" r="24" fill="var(--surface)" stroke="currentColor" strokeWidth="1.5" strokeOpacity=".75" />
    <circle cx="262" cy="134" r="20.5" stroke="currentColor" opacity=".35" /><path d={ticks} stroke="currentColor" opacity=".55" />
    <g transform="rotate(-24 262 134)"><path d="M262 120L266 134H258Z" fill="currentColor" fillOpacity=".6" stroke="currentColor" strokeOpacity=".7" /><path d="M258 134H266L262 148Z" fill="var(--surface)" stroke="currentColor" strokeOpacity=".6" /></g>
    <circle cx="262" cy="134" r="2" fill="currentColor" />
  </svg>;
}

export const ATLAS_MORE_DOORWAYS: DoorwayVariant[] = [
  { name: "Map unrolled on a scroll", Art: ScrollMap },
  { name: "Atlas open at a double-page map", Art: OpenAtlas },
  { name: "Map pinned to a board, route string", Art: PinnedBoard },
  { name: "Sea chart with a ship", Art: SeaChart },
  { name: "Folded map with a pocket compass", Art: FoldedCompass },
];
