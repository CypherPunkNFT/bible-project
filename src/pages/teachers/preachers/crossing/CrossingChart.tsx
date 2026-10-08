// 05 · Did their lives cross?: the two lives on one timeline (cut into the places they lived, a dashed stretch where the
// place is not recorded), the shared years shaded, any shared city outlined; and the plain sentence above it.
import type { PersonLink, Person } from "@/data/teachers/pages-types";
import { familyOf, lifeEnd, lifeLabel } from "../../shared/people";
import { plural } from "../lives/common";
import { overlap, sharedPlaces, stays, type SharedPlace } from "./model";

const span = (s: SharedPlace) => (s.until > s.start ? `from ${s.start} until ${s.until}` : `in ${s.start}`);
const ageAt = (p: Person, year: number) => (year === p.born ? `${p.short} was born there` : `${p.short} was ${p.circa ? "about " : ""}${year - p.born}`);

/** The sentence under the pickers, computed from the dates and places on record. */
export function CrossingSentence({ p, q, link }: { p: Person; q: Person; link: PersonLink | undefined }) {
  const { s, e } = overlap(p, q);
  const note = link && <span className="xing-link-note">On record between them: {link.note}</span>;
  if (e < s) {
    const [first, second] = lifeEnd(p) < q.born ? [p, q] : [q, p];
    const gap = second.born - lifeEnd(first);
    return <>{first.short} died in {lifeEnd(first)}, {gap === 0 ? "the same year" : `${plural(gap, "year")} before`} {second.short} was born. Their lives never overlapped.{note}</>;
  }
  const years = e - s, A = <b>{p.short}</b>, B = <b>{q.short}</b>;
  const opening = !p.died && !q.died ? <>{A} and {B} have both been alive since {s}.</>
    : years === 0 ? <>{A} and {B} were both alive only in {s}.</>
    : <>{A} and {B} were both alive for {plural(years, "year")}, from {s} to {e}.</>;
  const shared = sharedPlaces(p, q);
  const cities = shared.slice(0, 3).map((x, i, all) => (i && all[i - 1].name === x.name ? `again ${span(x)}` : `${x.name} ${span(x)}`)).join(", and ");
  const rest = shared.length
    ? ` They lived in the same city: ${cities}. In ${shared[0].start}, ${ageAt(p, shared[0].start)} and ${ageAt(q, shared[0].start)}.`
    : " The places on record never put them in the same city at the same time.";
  return <>{opening}{rest}{note}</>;
}

interface Row { p: Person; y: number; label: number }
interface RowProps { row: Row; order: number; X: (year: number) => number; width: number; pad: number; barH: number; onOpen: (id: string, origin: Element) => void }

/** One life as a bar cut into the places they lived (plus a dashed stretch where the place is not recorded). */
function LifeRow({ row, order, X, width, pad, barH, onOpen }: RowProps) {
  const { p, y } = row, tone = `var(${familyOf(p).tone})`, first = p.places[0][3];
  const nx = width < 560 ? pad : Math.min(Math.max(X(p.born), pad), width - 240); // narrow screens: names start at the left edge
  return <>
    <g className="xing-grow" style={{ animationDelay: `${order * 0.12}s` }}>
      {first > p.born && <rect x={X(p.born)} y={y + 0.5} width={Math.max(1, X(first) - X(p.born) - 1.5)} height={barH - 1} rx={4} fill="none" stroke={tone} strokeDasharray="3 3">
        <title>Where they lived before {first} is not recorded</title></rect>}
      {stays(p).map((sg, i) => {
        const x1 = X(sg.start), x2 = X(sg.last ? lifeEnd(p) : sg.end), w = Math.max(1.5, x2 - x1 - (sg.last ? 0 : 1.5));
        return <g key={i}>
          <rect x={x1} y={y} width={w} height={barH} rx={4} fill={tone} fillOpacity={i % 2 ? 0.72 : 1}><title>{sg.name}, from {sg.start}</title></rect>
          {sg.name.length * 6.3 + 12 < w && <text x={x1 + 7} y={y + 12.5} fontSize={10.5} fontWeight={600} fill="var(--page)" pointerEvents="none">{sg.name}</text>}
        </g>;
      })}
    </g>
    <text className="xing-who" x={nx} y={row.label} fontSize={13} fill="var(--ink)" onClick={(e) => onOpen(p.id, e.currentTarget)}>
      <tspan fontWeight={600}>{p.name}</tspan><tspan fill="var(--muted)" dx={8}>{lifeLabel(p)}{p.died ? "" : "today"}</tspan>
    </text>
  </>;
}

const H = 168, BAR_H = 18, PAD = 6, AXIS_Y = 140;

export function CrossingChart({ p, q, width, onOpen }: { p: Person; q: Person; width: number; onOpen: (id: string, origin: Element) => void }) {
  const lo = Math.floor((Math.min(p.born, q.born) - 3) / 10) * 10, hi = Math.ceil((Math.max(lifeEnd(p), lifeEnd(q)) + 3) / 10) * 10;
  const X = (y: number) => PAD + ((y - lo) / (hi - lo)) * (width - PAD * 2);
  const rows: Row[] = [{ p, y: 28, label: 16 }, { p: q, y: 78, label: 112 }];
  const { s, e } = overlap(p, q), crossed = e >= s;
  const step = [10, 20, 25, 50, 100].find((t) => ((width - PAD * 2) * t) / (hi - lo) >= 46) ?? 100;
  const ticks: number[] = [];
  for (let y = Math.ceil(lo / step) * step; y <= hi; y += step) ticks.push(y);
  const bandY = rows[0].y, bandH = rows[1].y - rows[0].y + BAR_H;
  return <svg className="xing-svg" width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img" aria-label={`${p.name} and ${q.name} on one timeline`}>
    {crossed && <rect className="xing-fade" x={X(s)} y={bandY - 6} width={Math.max(2, X(e) - X(s))} height={bandH + 12} rx={8} fill="var(--accent)" fillOpacity={0.07} />}
    {sharedPlaces(p, q).map((sp) => {
      const x1 = X(sp.start), x2 = Math.max(x1 + 3, X(sp.until === sp.start ? sp.start + 1 : sp.until));
      return <g key={`${sp.name}-${sp.start}`} className="xing-fade" style={{ animationDelay: ".45s" }}>
        <rect x={x1} y={bandY - 4} width={x2 - x1} height={bandH + 8} rx={6} fill="var(--accent)" fillOpacity={0.16} stroke="var(--accent)" strokeWidth={1.2} />
        <text x={(x1 + x2) / 2} y={(rows[0].y + BAR_H + rows[1].y) / 2 + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--accent)">{sp.name}</text>
      </g>;
    })}
    {rows.map((row, k) => <LifeRow key={row.p.id} row={row} order={k} X={X} width={width} pad={PAD} barH={BAR_H} onOpen={onOpen} />)}
    <line x1={PAD} x2={width - PAD} y1={AXIS_Y} y2={AXIS_Y} stroke="var(--line)" />
    {ticks.map((y) => <g key={y}>
      <line x1={X(y)} x2={X(y)} y1={AXIS_Y} y2={AXIS_Y + 5} stroke="var(--line)" />
      <text x={X(y)} y={AXIS_Y + 18} textAnchor="middle" fontSize={10} fill="var(--muted)">{y}</text>
    </g>)}
    {crossed && <line className="xing-fade" x1={X(s)} x2={Math.max(X(s) + 2, X(e))} y1={AXIS_Y} y2={AXIS_Y} stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" />}
  </svg>;
}
