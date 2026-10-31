// MOCK-UP: the Sources row of the doorway design sheet (/doorways_mockup). Owner, 2026-10-31: "I like sources, it can be
// enlarged." So the first drawing is the home page's shelf of books re-fitted to the taller frame, and the other four are
// close relatives that keep the library feel: a two-shelf bookcase, scroll and codex, a catalogue tray, a reading lamp.
import type { DoorwayVariant } from "./doorway-types";

type Book = readonly [x: number, width: number, height: number];

/** Standing books on a shelf whose top edge is `base`; each spine gets a soft tint and two bands. */
function Spines({ books, base, band = 10 }: { books: readonly Book[]; base: number; band?: number }) {
  return <>{books.map(([x, width, height], index) => <g key={x} stroke="currentColor" strokeWidth="1.3">
    <rect x={x} y={base - height} width={width} height={height} rx="2" fill="var(--surface)" />
    <rect x={x} y={base - height} width={width} height={height} rx="2" fill="currentColor" fillOpacity={0.06 + (index % 3) * 0.06} stroke="none" />
    <path d={`M${x + 3} ${base - height + band}H${x + width - 3}M${x + 3} ${base - band}H${x + width - 3}`} opacity=".5" />
  </g>)}</>;
}

/** Books lying flat, stacked upward from `base`: x, width, thickness. */
function Stack({ books, base }: { books: readonly Book[]; base: number }) {
  let top = base;
  return <>{books.map(([x, width, height]) => { top -= height; return <g key={top} stroke="currentColor" strokeWidth="1.2">
    <rect x={x} y={top} width={width} height={height} rx="1.5" fill="var(--surface)" />
    <path d={`M${x + width - 6} ${top + 2}V${top + height - 2}`} opacity=".45" />
  </g>; })}</>;
}

const Dot = ({ x, y }: { x: number; y: number }) => <g><circle cx={x} cy={y} r="7" fill="var(--surface)" stroke="currentColor" /><circle cx={x} cy={y} r="2.3" fill="currentColor" /></g>;

const SHELF: Book[] = [[32, 22, 96], [56, 28, 120], [86, 20, 86], [109, 25, 130], [136, 30, 107], [168, 23, 138], [193, 28, 101], [223, 20, 122]];

function Shelf() {
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <ellipse cx="160" cy="98" rx="150" ry="72" stroke="currentColor" opacity=".25" />
    <Spines books={SHELF} base={162} band={13} />
    <rect x="245" y="68" width="25" height="94" rx="2" fill="var(--surface)" stroke="currentColor" strokeWidth="1.3" transform="rotate(14 245 162)" />
    <path d="M22 162H298" stroke="currentColor" strokeWidth="1.6" />
    <Dot x={10} y={98} /><Dot x={310} y={98} />
  </svg>;
}

function Bookcase() {
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <path d="M8 172H312" stroke="currentColor" opacity=".25" />
    <rect x="44" y="12" width="232" height="154" fill="currentColor" fillOpacity=".05" stroke="currentColor" strokeWidth="1.4" />
    <rect x="36" y="5" width="248" height="8" rx="1" fill="var(--surface)" stroke="currentColor" strokeWidth="1.3" />
    <path d="M52 13V158M268 13V158" stroke="currentColor" opacity=".35" />
    <Spines books={[[56, 15, 62], [73, 19, 68], [94, 13, 52], [109, 17, 64], [128, 22, 58], [152, 15, 66], [169, 19, 54], [190, 14, 61]]} base={84} band={8} />
    <rect x="207" y="26" width="15" height="58" rx="2" fill="var(--surface)" stroke="currentColor" strokeWidth="1.3" transform="rotate(13 207 84)" />
    <Stack books={[[232, 32, 8], [235, 27, 7], [233, 30, 8]]} base={84} />
    <rect x="44" y="84" width="232" height="7" fill="var(--surface)" stroke="currentColor" strokeWidth="1.3" />
    <Stack books={[[56, 36, 8], [59, 31, 7], [57, 34, 8], [60, 29, 7]]} base={158} />
    <Spines books={[[98, 18, 62], [118, 14, 50], [134, 20, 60], [156, 16, 64], [174, 23, 55], [199, 14, 61], [215, 19, 48], [236, 15, 58], [253, 13, 52]]} base={158} band={8} />
    <rect x="44" y="158" width="232" height="8" fill="var(--surface)" stroke="currentColor" strokeWidth="1.3" />
    <rect x="38" y="166" width="244" height="6" rx="1" fill="var(--surface)" stroke="currentColor" strokeWidth="1.2" />
  </svg>;
}

function ScrollAndCodex() {
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <path d="M10 166H310" stroke="currentColor" strokeWidth="1.4" opacity=".55" /><path d="M40 174H280" stroke="currentColor" opacity=".2" />
    <rect x="34" y="40" width="78" height="112" fill="currentColor" fillOpacity=".07" stroke="currentColor" strokeWidth="1.2" />
    {[0, 1].map((column) => <g key={column} stroke="currentColor" opacity=".45">{Array.from({ length: 11 }, (_, row) => <path key={row} d={`M${41 + column * 36} ${52 + row * 9}H${69 + column * 36 - (row * 7 % 5) * 2}`} />)}</g>)}
    {[22, 112].map((x) => <g key={x} stroke="currentColor" strokeWidth="1.3" fill="var(--surface)">
      <rect x={x + 3} y="24" width="6" height="12" rx="2" /><rect x={x + 3} y="156" width="6" height="10" rx="2" />
      <rect x={x} y="32" width="12" height="128" rx="6" />
    </g>)}
    <path d="M156 34L164 28H226L218 34M218 34L226 28V156L218 164" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M221 34V160M224 31V158" stroke="currentColor" opacity=".35" />
    <rect x="148" y="34" width="70" height="132" rx="3" fill="var(--surface)" stroke="currentColor" strokeWidth="1.5" />
    <rect x="156" y="43" width="54" height="114" rx="1.5" stroke="currentColor" opacity=".45" />
    <path d="M183 76L199 100 183 124 167 100Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.2" /><path d="M183 90V110M175 100H191" stroke="currentColor" strokeWidth="1.2" />
    {[66, 128].map((y) => <rect key={y} x="211" y={y} width="15" height="9" rx="1.5" fill="var(--surface)" stroke="currentColor" strokeWidth="1.2" />)}
    <path d="M246 82L262 76 272 80 287 74 302 79 306 98 299 112 306 130 300 152 282 158 268 152 252 160 242 142 246 124 238 104Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.2" transform="rotate(-5 272 118)" />
    <path d="M246 82L262 76 272 80 287 74 302 79 306 98 299 112 306 130 300 152 282 158 268 152 252 160 242 142 246 124 238 104Z" fill="currentColor" fillOpacity=".09" transform="rotate(-5 272 118)" />
    <g stroke="currentColor" opacity=".5" transform="rotate(-5 272 118)"><path d="M252 94H296M249 104H293M254 114H290M252 124H298M250 134H284M258 144H292" strokeDasharray="9 3 14 3" /></g>
  </svg>;
}

function CatalogueTray() {
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <path d="M8 166H312" stroke="currentColor" strokeWidth="1.6" />
    {[[66, 36], [74, 100]].map(([top, tab], index) => <path key={index} d={`M28 96V${top}H${tab}V${top - 7}H${tab + 22}V${top}H132V96`} fill="var(--surface)" stroke="currentColor" strokeOpacity={0.4 + index * 0.2} strokeWidth="1.2" />)}
    <g transform="rotate(-7 96 44)"><rect x="56" y="14" width="80" height="50" rx="2" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />
      <path d="M63 25H104M63 36H129M63 44H129M63 52H118" stroke="currentColor" opacity=".45" /><circle cx="96" cy="58" r="2.4" stroke="currentColor" opacity=".7" /><path d="M112 25H129" stroke="currentColor" strokeWidth="2" opacity=".6" /></g>
    <rect x="20" y="88" width="120" height="78" rx="2" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />
    <rect x="20" y="88" width="120" height="78" rx="2" fill="currentColor" fillOpacity=".06" />
    <path d="M20 96H140" stroke="currentColor" opacity=".5" />
    {[[26, 102], [82, 102], [26, 134], [82, 134]].map(([x, y]) => <g key={`${x}-${y}`} stroke="currentColor">
      <rect x={x} y={y} width="52" height="26" rx="1.5" fill="var(--surface)" strokeWidth="1.2" />
      <rect x={x + 18} y={y + 5} width="16" height="7" rx="1" opacity=".6" /><path d={`M${x + 21} ${y + 19}Q${x + 26} ${y + 15} ${x + 31} ${y + 19}`} strokeWidth="1.3" />
    </g>)}
    <Spines books={[[156, 20, 98], [178, 25, 124], [205, 17, 88], [224, 23, 134], [249, 27, 108], [278, 20, 120]]} base={166} band={12} />
  </svg>;
}

function ReadingLamp() {
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <path d="M196 54L124 152H274L230 54Z" fill="currentColor" fillOpacity=".07" />
    <path d="M196 54L124 152M230 54L274 152" stroke="currentColor" strokeDasharray="2 5" opacity=".35" />
    <path d="M6 156H314" stroke="currentColor" strokeWidth="1.6" /><path d="M6 163H314" stroke="currentColor" opacity=".3" />
    <Spines books={[[16, 17, 82], [35, 21, 100], [58, 14, 70], [74, 19, 92], [95, 22, 78]]} base={156} band={10} />
    <path d="M119 156V104H125V156" fill="var(--surface)" stroke="currentColor" strokeWidth="1.3" />
    <path d="M136 152L150 132Q174 124 196 132Q218 124 242 132L256 152Q226 146 196 152Q166 146 136 152Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />
    <path d="M196 132V152" stroke="currentColor" opacity=".5" />
    <g stroke="currentColor" opacity=".4">{[0, 1, 2].map((row) => <path key={row} d={`M${154 + row * 2} ${137 + row * 4}Q${174} ${132 + row * 4} ${190} ${137 + row * 4}M${202} ${137 + row * 4}Q${218} ${132 + row * 4} ${238 - row * 2} ${137 + row * 4}`} />)}</g>
    <path d="M282 156V150H306V156M294 150V60Q294 30 262 30Q236 30 222 42" stroke="currentColor" strokeWidth="1.5" />
    <path d="M190 58Q194 36 216 36Q238 38 236 60Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.5" />
    <path d="M190 58Q194 36 216 36Q238 38 236 60Z" fill="currentColor" fillOpacity=".14" />
    <circle cx="213" cy="60" r="3.5" fill="currentColor" opacity=".8" />
  </svg>;
}

export const SOURCES_DOORWAYS: DoorwayVariant[] = [
  { name: "The shelf, enlarged", Art: Shelf },
  { name: "Two-shelf bookcase", Art: Bookcase },
  { name: "Scroll, codex and fragment", Art: ScrollAndCodex },
  { name: "Catalogue tray and shelf", Art: CatalogueTray },
  { name: "Books under a reading lamp", Art: ReadingLamp },
];
