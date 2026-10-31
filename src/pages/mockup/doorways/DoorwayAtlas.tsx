// MOCK-UP: the Atlas row of the doorway design sheet (/doorways_mockup). Owner, 2026-10-31: "I like Atlas, it can also
// be enlarged, vertically as well." So the first drawing is today's coastline map stretched to fill the taller frame;
// the other four keep the map, coast, marked places and grid but frame them differently.
import type { DoorwayVariant } from "./doorway-types";

const NS = { vectorEffect: "non-scaling-stroke" } as const;
const Place = ({ x, y, big }: { x: number; y: number; big?: boolean }) => <g stroke="currentColor" strokeWidth="1.5"><circle cx={x} cy={y} r={big ? 14 : 8} opacity=".25" /><circle cx={x} cy={y} r={big ? 5 : 3} fill="currentColor" /></g>;
const Pin = ({ x, y, big }: { x: number; y: number; big?: boolean }) => <g><circle cx={x} cy={y} r={big ? 9 : 6} fill="var(--surface)" stroke="currentColor" strokeOpacity=".7" /><circle cx={x} cy={y} r={big ? 3.5 : 2.2} fill="currentColor" /></g>;
const ray = (cx: number, cy: number, n: number, length: number) => Array.from({ length: n }, (_, i) => `M${cx} ${cy}l${(length * Math.cos((i * 2 * Math.PI) / n)).toFixed(1)} ${(length * Math.sin((i * 2 * Math.PI) / n)).toFixed(1)}`).join("");
/** A four-point compass star with fainter diagonals, centred on (x,y). */
const Rose = ({ x, y, r }: { x: number; y: number; r: number }) => {
  const s = r * .22, d = r * .62;
  return <g>
    <circle cx={x} cy={y} r={r * .78} stroke="currentColor" opacity=".35" /><circle cx={x} cy={y} r={r * .66} stroke="currentColor" strokeDasharray="1 3" opacity=".5" />
    <path d={`M${x - d} ${y - d}L${x + s * .7} ${y - s * .7}L${x + d} ${y + d}L${x - s * .7} ${y + s * .7}ZM${x + d} ${y - d}L${x + s * .7} ${y + s * .7}L${x - d} ${y + d}L${x - s * .7} ${y - s * .7}Z`} fill="var(--surface)" stroke="currentColor" strokeOpacity=".45" />
    <path d={`M${x} ${y - r}L${x + s} ${y - s}L${x + r} ${y}L${x + s} ${y + s}L${x} ${y + r}L${x - s} ${y + s}L${x - r} ${y}L${x - s} ${y - s}Z`} fill="var(--surface)" stroke="currentColor" strokeWidth="1.2" />
    <path d={`M${x} ${y - r}L${x + s} ${y - s}L${x} ${y}ZM${x + r} ${y}L${x + s} ${y + s}L${x} ${y}ZM${x} ${y + r}L${x - s} ${y + s}L${x} ${y}ZM${x - r} ${y}L${x - s} ${y - s}L${x} ${y}Z`} fill="currentColor" fillOpacity=".45" />
    <text x={x} y={y - r - 4} textAnchor="middle" fill="currentColor" fontSize="9" letterSpacing="1">N</text>
  </g>;
};

function CurrentEnlarged() {
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <g stroke="currentColor" opacity=".1"><path d="M6 32H314M6 92H314M6 152H314M54 4V178M118 4V178M182 4V178M246 4V178" /><ellipse cx="160" cy="92" rx="152" ry="82" /><ellipse cx="160" cy="92" rx="120" ry="60" /></g>
    <path transform="matrix(.813 0 0 1.073 -29.9 -9.3)" {...NS} d="M58 22L152 18 184 34 198 28 232 41 260 32 292 45 316 41 343 62 374 59 411 81 413 139 381 169 306 163 278 151 238 148 196 156 158 149 132 159 76 139 54 112 79 95 106 100 129 91 141 104 161 109 183 105 198 121 237 126 275 118 304 129 337 115 343 92 319 80 295 83 277 70 252 75 230 63 205 74 183 65 171 71 145 56 104 62 82 49Z" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeOpacity=".5" />
    {[[56, 50], [104, 65], [147, 59], [201, 74], [244, 94], [233, 129], [274, 146]].map(([x, y], i) => <Place key={i} x={x} y={y} big={i === 4} />)}
    <path d="M258 94H291M233 134V158H199" stroke="currentColor" opacity=".6" />
    <g fill="currentColor" fontSize="9" letterSpacing="2"><text x="295" y="97">E</text><text x="193" y="161" textAnchor="end">EXPLORE</text></g>
  </svg>;
}

function HolyLand() {
  const coast = "M176 0C172 18 166 34 158 46Q148 54 154 62C150 80 144 100 138 120S128 158 122 180";
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <defs><clipPath id="atlas-holy-frame"><rect width="320" height="180" /></clipPath></defs>
    <path d={ray(62, 122, 16, 150)} clipPath="url(#atlas-holy-frame)" stroke="currentColor" opacity=".1" />
    <path d={`${coast}L320 180V0Z`} fill="var(--surface)" />
    <path d={`${coast}L320 180V0Z`} fill="currentColor" fillOpacity=".08" />
    <g stroke="currentColor" opacity=".1"><path d="M0 40H320M0 90H320M0 140H320M100 0V180M190 0V180M280 0V180" /></g>
    {[6, 12, 18].map((dx, i) => <path key={dx} d={coast} transform={`translate(${-dx} 0)`} stroke="currentColor" opacity={.32 - i * .09} />)}
    <path d={coast} stroke="currentColor" strokeWidth="1.5" strokeOpacity=".7" />
    <path d="M241 59C245 70 235 76 239 86S233 100 237 108" stroke="currentColor" strokeWidth="1.2" opacity=".7" />
    <ellipse cx="241" cy="48" rx="7" ry="10" fill="currentColor" fillOpacity=".15" stroke="currentColor" />
    <path d="M237 108C244 110 245 124 242 136S232 146 230 134 231 110 237 108Z" fill="currentColor" fillOpacity=".15" stroke="currentColor" />
    {([[198, 56], [222, 30], [140, 106]] as const).map(([x, y]) => <Pin key={x} x={x} y={y} />)}<Pin x={204} y={124} big />
    <g fill="currentColor" fontSize="8" letterSpacing="2"><text x="62" y="36" textAnchor="middle">GREAT SEA</text><text x="198" y="152" textAnchor="middle">JERUSALEM</text></g>
    <Rose x={62} y={122} r={28} />
  </svg>;
}

const FOLD_COAST = "M24 98C56 86 78 58 110 64S150 104 184 94 236 50 264 58 290 86 296 80";
function FoldedMap() {
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <path d="M30 172L98 162 166 172 234 162 302 172" stroke="currentColor" opacity=".15" />
    {[0, 1, 2, 3].map((i) => {
      const x = 24 + i * 68, k = i % 2 ? -12 / 68 : 12 / 68, e = -k * x + (i % 2 ? 12 : 0);
      return <g key={i} transform={`matrix(1 ${k.toFixed(4)} 0 1 0 ${e.toFixed(2)})`}>
        <defs><clipPath id={`atlas-fold-${i}`}><rect x={x} y="20" width="68" height="138" /></clipPath></defs>
        <g clipPath={`url(#atlas-fold-${i})`}>
          <rect x={x} y="20" width="68" height="138" fill="var(--surface)" />
          <path d={`${FOLD_COAST}L296 158H24Z`} fill="currentColor" fillOpacity=".1" /><path d={FOLD_COAST} stroke="currentColor" strokeWidth="1.4" strokeOpacity=".7" />
          <path d={FOLD_COAST} transform="translate(0 -7)" stroke="currentColor" opacity=".25" />
          <g stroke="currentColor" opacity=".12"><path d="M24 50H296M24 90H296M24 130H296M58 20V158M126 20V158M194 20V158M262 20V158" /></g>
          <path d="M62 132C90 112 116 136 146 116S200 138 226 120 252 92 262 86" stroke="currentColor" strokeDasharray="3 4" opacity=".7" />
          {[[62, 132], [146, 116], [226, 120], [262, 86]].map(([px, py], j) => <Pin key={j} x={px} y={py} big={j === 2} />)}
          <path d="M268 30L274 44 268 41 262 44Z" fill="currentColor" fillOpacity=".5" stroke="currentColor" /><text x="268" y="56" textAnchor="middle" fill="currentColor" fontSize="8">N</text>
          <rect x={x} y="20" width="68" height="138" fill="currentColor" fillOpacity={i % 2 ? .07 : 0} stroke="currentColor" strokeOpacity=".55" />
        </g>
      </g>;
    })}
  </svg>;
}

function GlobeRoutes() {
  const meridians = [-24, -16, -8, 0, 8, 16, 24].map((deg) => `M160 430L${(160 + 400 * Math.sin((deg * Math.PI) / 180)).toFixed(1)} ${(430 - 400 * Math.cos((deg * Math.PI) / 180)).toFixed(1)}`).join("");
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <defs><clipPath id="atlas-globe"><circle cx="160" cy="430" r="390" /></clipPath><clipPath id="atlas-globe-frame"><rect width="320" height="180" /></clipPath></defs>
    {/* The globe's rims are far larger than the frame; only the arc inside it is drawn. */}
    <g clipPath="url(#atlas-globe-frame)">
      <circle cx="160" cy="430" r="399" stroke="currentColor" opacity=".2" />
      <circle cx="160" cy="430" r="390" fill="currentColor" fillOpacity=".05" stroke="currentColor" strokeWidth="1.5" strokeOpacity=".7" />
      <g clipPath="url(#atlas-globe)">
        <g stroke="currentColor" opacity=".14">{[360, 330, 300].map((r) => <circle key={r} cx="160" cy="430" r={r} />)}<path d={meridians} /></g>
        <path d="M0 92C30 84 48 96 70 90S104 70 128 78 150 100 176 96 214 72 240 80 276 98 320 88V180H0Z" fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeOpacity=".45" />
        <path d="M150 118C164 112 182 120 196 116S214 126 204 132 170 136 156 130 140 122 150 118Z" fill="var(--surface)" stroke="currentColor" strokeOpacity=".45" />
      </g>
    </g>
    <path d="M58 102Q96 30 160 62Q222 22 266 96" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 4" opacity=".75" />
    <path d="M160 62Q184 92 178 124" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 4" opacity=".5" />
    {([[58, 102], [266, 96], [178, 124]] as const).map(([x, y]) => <Pin key={x} x={x} y={y} />)}<Pin x={160} y={62} big />
    <text x="160" y="166" textAnchor="middle" fill="currentColor" fontSize="8" letterSpacing="2">TO THE ENDS OF THE EARTH</text>
  </svg>;
}

function AtlasPlate() {
  const north = "M14 58C40 50 62 64 84 60S112 78 122 96Q130 92 126 76C134 62 156 56 180 62S226 44 252 52 290 40 306 44V12H14Z";
  const south = "M14 140C46 132 80 144 112 138S170 126 204 134 260 120 306 126V168H14Z";
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <defs><clipPath id="atlas-plate"><rect x="14" y="12" width="292" height="156" /></clipPath></defs>
    <g clipPath="url(#atlas-plate)">
      <path d={ray(70, 104, 16, 300)} stroke="currentColor" opacity=".12" />
      {[north, south].map((d) => <path key={d.slice(0, 8)} d={d} fill="var(--surface)" />)}
      {[north, south].map((d) => <path key={d.slice(0, 8)} d={d} fill="currentColor" fillOpacity=".09" stroke="currentColor" strokeOpacity=".6" />)}
      <g stroke="currentColor" opacity=".1"><path d="M14 52H306M14 92H306M14 132H306M86 12V168M160 12V168M234 12V168" /></g>
      <path d="M196 106Q206 100 220 104Q214 110 196 106ZM256 88Q264 82 274 86Q266 92 256 88Z" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeOpacity=".6" />
    </g>
    {([[122, 92], [180, 66], [282, 120]] as const).map(([x, y]) => <Pin key={x} x={x} y={y} />)}<Pin x={290} y={74} big />
    <Rose x={70} y={104} r={22} />
    <path d="M108 22H212Q218 32 212 42H108Q102 32 108 22Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.2" />
    <path d="M108 22Q98 22 98 30Q98 36 104 36M212 22Q222 22 222 30Q222 36 216 36" stroke="currentColor" opacity=".6" />
    <text x="160" y="35.5" textAnchor="middle" fill="currentColor" fontSize="9" letterSpacing="3">ATLAS</text>
    <rect x="8" y="6" width="304" height="168" stroke="currentColor" strokeOpacity=".6" /><rect x="14" y="12" width="292" height="156" stroke="currentColor" strokeOpacity=".6" />
    <g fill="currentColor" fillOpacity=".3">{Array.from({ length: 19 }, (_, i) => i % 2 ? null : <g key={i}><rect x={8 + i * 16} y="6" width="16" height="6" /><rect x={8 + i * 16} y="168" width="16" height="6" /></g>)}
      {Array.from({ length: 12 }, (_, i) => i % 2 ? null : <g key={i}><rect x="8" y={6 + i * 14} width="6" height="14" /><rect x="306" y={6 + i * 14} width="6" height="14" /></g>)}</g>
  </svg>;
}

export const ATLAS_DOORWAYS: DoorwayVariant[] = [
  { name: "Current, enlarged", Art: CurrentEnlarged },
  { name: "Holy Land with compass rose", Art: HolyLand },
  { name: "Folded paper map", Art: FoldedMap },
  { name: "Globe with routes", Art: GlobeRoutes },
  { name: "Old atlas plate", Art: AtlasPlate },
];
