// MOCK-UP: the Resources row of the doorway design sheet (/doorways_mockup). Owner, 2026-10-31: "I don't like resources,
// that can change." The heart over cupped hands is gone; these are five new pictures of help for the road (study, gather,
// find help): a signpost, a road to a church, a set table, a lamp on the path and an open door.
import type { DoorwayVariant } from "./doorway-types";

const Dot = ({ x, y }: { x: number; y: number }) => <g><circle cx={x} cy={y} r="6" fill="var(--surface)" stroke="currentColor" /><circle cx={x} cy={y} r="2" fill="currentColor" /></g>;

const ARMS = [
  { d: "M166 28H260L272 40L260 52H166Z", x: 214, y: 43.5, label: "STUDY" },
  { d: "M154 62H62L50 74L62 86H154Z", x: 103, y: 77.5, label: "GATHER" },
  { d: "M166 96H244L256 108L244 120H166Z", x: 206, y: 111.5, label: "HELP" },
];

function Signpost() {
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <path d="M0 134Q60 120 120 128T240 122T320 130" stroke="currentColor" opacity=".2" />
    <path d="M148 162Q100 146 26 140M172 162Q230 144 294 136" stroke="currentColor" strokeDasharray="3 5" opacity=".5" />
    <path d="M128 180Q146 168 152 160M192 180Q174 168 168 160M108 166Q160 152 212 166" stroke="currentColor" opacity=".35" />
    <rect x="154" y="22" width="12" height="142" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" /><path d="M152 22L160 13 168 22Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.3" />
    {ARMS.map((arm) => <g key={arm.label}>
      <path d={arm.d} fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" /><path d={arm.d} fill="currentColor" fillOpacity=".07" />
      <text x={arm.x} y={arm.y} textAnchor="middle" fontSize="9" letterSpacing="2" fill="currentColor">{arm.label}</text>
    </g>)}
    {[40, 74, 108].map((y) => <circle key={y} cx="160" cy={y} r="1.6" fill="currentColor" opacity=".7" />)}
    <Dot x={20} y={140} /><Dot x={300} y={135} />
  </svg>;
}

function RoadToChurch() {
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <circle cx="262" cy="40" r="14" stroke="currentColor" opacity=".4" /><circle cx="262" cy="40" r="23" stroke="currentColor" opacity=".14" />
    <path d="M0 116Q50 98 100 106T204 96T320 104" stroke="currentColor" opacity=".2" />
    <path d="M0 158C60 148 110 98 150 74Q178 58 206 74C244 98 280 130 320 136V180H0Z" fill="var(--surface)" />
    <path d="M0 158C60 148 110 98 150 74Q178 58 206 74C244 98 280 130 320 136" fill="currentColor" fillOpacity=".06" stroke="currentColor" strokeWidth="1.4" />
    <path d="M70 180C110 160 230 150 222 130C214 112 160 112 168 96C172 86 180 76 182 68L187 68C188 76 190 86 188 94C182 108 236 108 244 126C254 148 190 162 150 180Z" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M110 180C150 160 244 150 233 128C224 110 172 110 178 95C181 86 184 76 184.5 70" stroke="currentColor" strokeDasharray="4 5" opacity=".4" />
    {[[236, 104], [250, 112], [116, 112]].map(([x, y]) => <path key={x} d={`M${x} ${y}Q${x - 6} ${y - 14} ${x} ${y - 28}Q${x + 6} ${y - 14} ${x} ${y}Z`} fill="var(--surface)" stroke="currentColor" strokeWidth="1.2" />)}
    <g fill="var(--surface)" stroke="currentColor" strokeWidth="1.4">
      <path d="M160 70V40H172V70Z" /><path d="M158 40L166 18 174 40Z" /><path d="M172 70V50L186 38 200 50V70Z" />
    </g>
    <path d="M166 18V8M162 12H170" stroke="currentColor" strokeWidth="1.4" />
    <path d="M182 70V61Q186 56 190 61V70M164 54V49Q166 46 168 49V54" stroke="currentColor" />
  </svg>;
}

function TableSet() {
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <path d="M160 0V18" stroke="currentColor" opacity=".6" /><path d="M144 32Q160 14 176 32Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="160" cy="35" r="3" fill="currentColor" opacity=".8" />
    <path d="M144 40L104 104M176 40L216 104" stroke="currentColor" strokeDasharray="2 5" opacity=".35" />
    <path d="M144 40L176 40 216 104H104Z" fill="currentColor" fillOpacity=".05" />
    <path d="M58 132V160M262 132V160" stroke="currentColor" opacity=".35" />
    <path d="M40 114H280L300 126H20Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />
    <rect x="20" y="126" width="280" height="8" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />
    <path d="M34 134V174M286 134V174" stroke="currentColor" strokeWidth="1.5" /><path d="M8 174H312" stroke="currentColor" opacity=".25" />
    <rect x="56" y="150" width="208" height="6" rx="1" fill="var(--surface)" stroke="currentColor" strokeWidth="1.3" /><path d="M70 156V174M250 156V174" stroke="currentColor" strokeWidth="1.3" />
    <ellipse cx="78" cy="120" rx="34" ry="4" fill="var(--surface)" stroke="currentColor" strokeWidth="1.2" />
    <path d="M50 119Q52 96 78 95Q104 96 106 119Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" /><path d="M50 119Q52 96 78 95Q104 96 106 119Z" fill="currentColor" fillOpacity=".1" />
    <path d="M64 104L70 110M76 100L82 106M88 102L94 108" stroke="currentColor" strokeWidth="1.2" opacity=".6" />
    <path d="M118 121L130 101Q146 95 160 101Q174 95 190 101L202 121Q182 116 160 121Q138 116 118 121Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" />
    <path d="M160 101V121" stroke="currentColor" opacity=".5" />
    <g stroke="currentColor" opacity=".4">{[0, 1, 2].map((row) => <path key={row} d={`M${134 - row * 2} ${106 + row * 4}Q147 ${102 + row * 4} 156 ${106 + row * 4}M164 ${106 + row * 4}Q173 ${102 + row * 4} ${186 + row * 2} ${106 + row * 4}`} />)}</g>
    <path d="M226 90H250Q250 106 238 108V117M229 119H247" stroke="currentColor" strokeWidth="1.4" /><path d="M226 90H250Q250 106 238 108Q226 106 226 90Z" fill="currentColor" fillOpacity=".1" />
    <path d="M262 119V96Q262 86 270 84V78H280V84Q288 86 288 96V119Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.4" /><path d="M288 94Q298 96 296 106Q294 112 288 112" stroke="currentColor" strokeWidth="1.3" />
  </svg>;
}

const STARS = [[28, 24], [70, 12], [118, 30], [160, 16], [250, 20], [294, 36], [214, 8]];
const STONES = [[248, 166, 18, 5], [226, 146, 14, 4], [211, 128, 11, 3.4], [203, 112, 8, 2.6], [200, 98, 6, 2], [200, 86, 4.5, 1.6], [201, 76, 3, 1.2]];

function LampToPath() {
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    {STARS.map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.3" fill="currentColor" opacity=".5" />)}
    <path d="M0 70Q60 56 120 64T240 58T320 66" stroke="currentColor" opacity=".3" />
    <path d="M196 180C206 150 170 128 176 104C180 88 194 76 198 66L204 66C208 76 218 90 222 104C230 128 292 148 300 180Z" fill="currentColor" fillOpacity=".07" stroke="currentColor" strokeWidth="1.2" />
    {STONES.map(([x, y, rx, ry]) => <ellipse key={y} cx={x} cy={y} rx={rx} ry={ry} fill="var(--surface)" stroke="currentColor" strokeOpacity=".6" />)}
    <path d="M172 112L190 104M174 124L196 122M168 100L184 86" stroke="currentColor" strokeDasharray="2 4" opacity=".35" />
    <circle cx="154" cy="112" r="30" fill="currentColor" fillOpacity=".05" stroke="currentColor" opacity=".12" /><circle cx="154" cy="112" r="18" stroke="currentColor" opacity=".22" />
    <path d="M8 166H160" stroke="currentColor" opacity=".3" />
    <path d="M70 161L73 166H103L106 161" fill="var(--surface)" stroke="currentColor" strokeWidth="1.3" />
    <path d="M46 146Q28 146 30 134Q33 124 48 136" stroke="currentColor" strokeWidth="1.4" />
    <path d="M42 152Q44 128 88 126Q116 126 128 136L150 130Q158 130 156 138L132 148Q124 162 88 162Q42 162 42 152Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.5" />
    <path d="M42 152Q44 128 88 126Q116 126 128 136L150 130Q158 130 156 138L132 148Q124 162 88 162Q42 162 42 152Z" fill="currentColor" fillOpacity=".08" />
    <ellipse cx="88" cy="132" rx="13" ry="2.8" stroke="currentColor" opacity=".6" /><path d="M48 150Q88 156 128 144" stroke="currentColor" opacity=".35" />
    <path d="M152 131Q142 116 154 94Q166 116 156 131Z" fill="currentColor" opacity=".75" />
  </svg>;
}

const VOUSSOIRS = [22.5, 45, 67.5, 112.5, 135, 157.5].map((angle) => {
  const [cos, sin] = [Math.cos(angle * Math.PI / 180), Math.sin(angle * Math.PI / 180)];
  return `M${160 - 40 * cos} ${76 - 40 * sin}L${160 - 54 * cos} ${76 - 54 * sin}`;
}).join("");

function OpenDoor() {
  return <svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <g stroke="currentColor" opacity=".16">{[48, 72, 96, 120, 144].map((y, row) => <path key={y} d={`M12 ${y}H96M224 ${y}H308${[0, 1, 2].map((i) => `M${30 + i * 28 + row % 2 * 14} ${y}v24M${238 + i * 28 + row % 2 * 14} ${y}v24`).join("")}`} />)}</g>
    <path d="M10 172H310" stroke="currentColor" opacity=".35" />
    <path d="M106 160V76A54 54 0 0 1 214 76V160" fill="var(--surface)" stroke="currentColor" strokeWidth="1.5" />
    <path d={VOUSSOIRS} stroke="currentColor" opacity=".45" />
    <path d="M154 22H166L164 36H156Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.3" /><path d="M160 4V16M155 8.5H165" stroke="currentColor" strokeWidth="1.4" />
    <path d="M120 160V76A40 40 0 0 1 200 76V160Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="172" cy="92" r="20" fill="currentColor" fillOpacity=".06" stroke="currentColor" opacity=".14" /><circle cx="172" cy="92" r="11" stroke="currentColor" opacity=".24" />
    <path d="M172 64V84" stroke="currentColor" opacity=".5" /><path d="M166 90Q172 80 178 90Z" fill="currentColor" opacity=".7" />
    <path d="M120 160V76Q126 66 142 60V152Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.3" />
    <path d="M120 160V76Q126 66 142 60V152Z" fill="currentColor" fillOpacity=".14" />
    <path d="M127 157V70M134 155V65" stroke="currentColor" opacity=".35" /><circle cx="138" cy="110" r="1.8" fill="currentColor" />
    <rect x="100" y="160" width="120" height="6" fill="var(--surface)" stroke="currentColor" strokeWidth="1.2" />
    <rect x="90" y="166" width="140" height="6" fill="var(--surface)" stroke="currentColor" strokeWidth="1.2" />
    <path d="M150 160L120 180M170 160L210 180M192 160L250 180M144 160L96 178" stroke="currentColor" strokeDasharray="2 4" opacity=".3" />
  </svg>;
}

export const RESOURCES_DOORWAYS: DoorwayVariant[] = [
  { name: "Signpost with three arms", Art: Signpost },
  { name: "Road to the church on the hill", Art: RoadToChurch },
  { name: "A table set for gathering", Art: TableSet },
  { name: "A lamp for the path", Art: LampToPath },
  { name: "The open door", Art: OpenDoor },
];
