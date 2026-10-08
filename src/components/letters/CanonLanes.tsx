import type { CanonEvent, Letter } from "@/data/letters/types";
import { useKeep } from "./letter-hooks";
import type { ReactNode } from "react";
import { ClaimText, KeepX } from "./LetterParts";
import { StableTip } from "@/components/StableTip";

const W = 1000;
const LANE = 34;
const LEFT = 120;
const MIN_GAP = 46;
const STATUS = {
  accepted: { label: "Accepted", fill: "var(--lg)" },
  used: { label: "Quoted or used", fill: "color-mix(in srgb, var(--lg) 55%, var(--ink))" },
  doubted: { label: "Doubted", fill: "transparent" }, // a hollow ring, so it reads on every page colour
  omitted: { label: "Left out", fill: "color-mix(in srgb, var(--ink) 25%, transparent)" },
} as const;

/**
 * How the early church received each letter: one lane per letter, one mark per witness, coloured by its verdict. A year
 * (its label at the top, or any mark under it) selects the whole column: every witness of that year in every lane.
 */
export function CanonLanes({ events, letters }: { events: CanonEvent[]; letters: Letter[] }) {
  const keep = useKeep<number>();
  const { active } = keep; // a year
  if (!events.length) return null;
  const sorted = [...events].sort((a, b) => a.year - b.year);
  // Hidden sizing copies carry the "let go" mark too, so keeping an item never makes the box grow.
  const keptMark = <KeepX onRelease={() => undefined} />;
  const canonResting = <span className="lg-muted">Point at a year or a mark to read what the witnesses of that year say; click to keep it.</span>;
  const yearTip = (year: number, mark: ReactNode) => <>{sorted.filter((e) => e.year === year).map((e, i) => <div key={i}>
    <strong>{e.label}</strong>{i === 0 && mark} <span className="lg-muted">· about AD {e.year} · {e.who}</span><ClaimText claim={e.claim} />
  </div>)}</>;
  const lo = sorted[0].year, hi = sorted[sorted.length - 1].year;
  // Years follow time, but no two marks sit closer than MIN_GAP (110, 115 and 120 would collide); a long run of
  // witnesses makes the strip wider than the panel and it scrolls inside it rather than squeezing.
  const linear = (year: number) => LEFT + ((year - lo) / Math.max(1, hi - lo)) * (W - LEFT - 40);
  const at = new Map<number, number>();
  for (const year of [...new Set(sorted.map((e) => e.year))]) {
    const prev = [...at.values()].pop();
    at.set(year, prev === undefined ? linear(year) : Math.max(linear(year), prev + MIN_GAP));
  }
  const x = (year: number) => at.get(year)!;
  const width = Math.max(W, x(hi) + 40);
  const lanes = letters.filter((l) => sorted.some((e) => e.status[l.code]));
  const height = 36 + lanes.length * LANE + 10;

  return <figure>
    <div className="lg-figure">
      <svg viewBox={`0 0 ${width} ${height}`} style={width > W ? { minWidth: width } : undefined} role="img" aria-label={`How the early church received ${lanes.map((l) => l.name).join(", ")}, AD ${lo} to ${hi}`}>
        {active !== null && <line x1={x(active)} x2={x(active)} y1={22} y2={height - 6} stroke="var(--lg)" strokeDasharray="3 4" opacity={0.45} />}
        {[...at.keys()].map((year) => {
          const witnesses = sorted.filter((e) => e.year === year);
          return <g key={`y${year}`} style={{ cursor: "pointer" }} tabIndex={0} role="button" opacity={active !== null && active !== year ? 0.3 : 1}
            aria-label={`About AD ${year}: ${witnesses.map((e) => e.label).join("; ")}`} {...keep.bind(year)}>
            <rect x={x(year) - MIN_GAP / 2} y={0} width={MIN_GAP} height={22} fill="transparent" />
            <text x={x(year)} y={14} textAnchor="middle" className={active === year ? "lg-svg-strong" : "lg-svg-text"}>{year}</text>
          </g>;
        })}
        {lanes.map((letter, li) => {
          const y = 36 + li * LANE;
          return <g key={letter.code}>
            <text x={0} y={y + 4} className="lg-svg-strong">{letter.name}</text>
            <line x1={LEFT} x2={width - 30} y1={y} y2={y} stroke="var(--lg-line)" />
            {sorted.map((e, i) => {
              const status = e.status[letter.code];
              if (!status) return null;
              return <circle key={i} cx={x(e.year)} cy={y} r={active === e.year ? 8 : 6} fill={STATUS[status].fill} stroke={status === "doubted" ? "var(--lg)" : "var(--page)"} strokeWidth={status === "doubted" ? 2 : 1.5}
                className={[status === "accepted" && "lg-glow", keep.peek(e.year) && "lg-peek"].filter(Boolean).join(" ") || undefined} style={{ cursor: "pointer" }} tabIndex={0} role="button"
                aria-label={`${e.label}, about AD ${e.year}: ${letter.name} ${STATUS[status].label.toLowerCase()}`}
                {...keep.bind(e.year)} />;
            })}
          </g>;
        })}
      </svg>
    </div>
    <div className="lg-tabs" aria-hidden="true" style={{ marginTop: ".5rem" }}>
      {Object.values(STATUS).map((s) => <span key={s.label} className="lg-muted" style={{ fontSize: ".72rem", display: "inline-flex", alignItems: "center", gap: ".35rem", marginRight: ".8rem" }}>
        <svg width="12" height="12"><circle cx="6" cy="6" r="4.5" fill={s.fill} stroke={s.fill === "transparent" ? "var(--lg)" : "none"} strokeWidth="1.5" /></svg>{s.label}</span>)}
    </div>
    <StableTip show={active !== null ? yearTip(active, keep.kept !== null && <KeepX onRelease={keep.release} />) : canonResting}
      options={[canonResting, ...[...new Set(sorted.map((e) => e.year))].map((year) => yearTip(year, keptMark))]} cap="16rem" />
  </figure>;
}
