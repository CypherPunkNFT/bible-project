import type { Parallel, Span } from "@/data/letters/types";
import { ClaimText, KeepX, Refs } from "./LetterParts";
import { useKeep, useSpanLabel, useVerseIndex } from "./letter-hooks";

const W = 1000;
const H = 260;
const PAD = 30;
const TOP = 52;
const BOTTOM = H - 52;
// A one-verse passage would be a hairline at true scale, so every segment gets a floor width, centred on its real
// place: 22 for a handful of passages, shrinking for busy charts (60 links) so the ribbons don't pile up.
const minSegment = (pairs: number) => Math.max(6, Math.min(22, 180 / Math.max(1, pairs)));

type Pt = [number, number];
type Cubic = [Pt, Pt, Pt, Pt];
const lerp = (p: Pt, q: Pt, t: number): Pt => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
/** A cubic Bézier cut at t into its two halves (de Casteljau). */
function split([p0, p1, p2, p3]: Cubic, t: number): [Cubic, Cubic] {
  const a = lerp(p0, p1, t), b = lerp(p1, p2, t), c = lerp(p2, p3, t), d = lerp(a, b, t), e = lerp(b, c, t), f = lerp(d, e, t);
  return [[p0, a, d, f], [f, e, c, p3]];
}
/** The stretch of a cubic between t = u and t = v. */
function stretch(curve: Cubic, u: number, v: number): Cubic {
  const after = split(curve, u)[1];
  return split(after, u >= 1 ? 0 : (v - u) / (1 - u))[0];
}
const pt = ([x, y]: Pt) => `${x.toFixed(1)},${y.toFixed(1)}`;
/** The part of a ribbon between u and v along its two edges (0 = top rail, 1 = bottom rail), as a closed band. */
function band(leftEdge: Cubic, rightEdge: Cubic, u: number, v: number): string {
  const l = stretch(leftEdge, u, v), r = stretch(rightEdge, u, v);
  return `M${pt(l[0])} C${pt(l[1])} ${pt(l[2])} ${pt(l[3])} L${pt(r[3])} C${pt(r[2])} ${pt(r[1])} ${pt(r[0])} Z`;
}

/** How much of every ribbon shows, as a share of its own length along its curve, grown from the top rail and from the
 *  bottom rail (0.5 + 0.5 is the whole ribbon). The pick-two comparison animates it: each ribbon grows out along its path
 *  from both rails, or draws back along it into one. */
export interface RibbonReveal { top: number; bottom: number }

/**
 * Two texts as two glowing rails (top and bottom), joined by a ribbon for each parallel passage. A ribbon's width
 * follows the passages' lengths (with a floor, so short passages stay visible); pointing at one names both ends and
 * clicking keeps it until its ✕. With `empty`, a rail whose text is not chosen is drawn grey.
 */
export function ParallelRibbon({ parallel, weightLabel = "shared Greek words", reveal, empty = {}, hint }: {
  parallel: Parallel; weightLabel?: string; reveal?: RibbonReveal; empty?: { top?: boolean; bottom?: boolean }; hint?: string;
}) {
  const index = useVerseIndex();
  const label = useSpanLabel();
  const keep = useKeep<number>();
  const { active } = keep;
  if (!index) return <div className="lg-figure" style={{ minHeight: H }} />;

  const axis = (side: Span) => {
    const start = index(side[0]);
    const length = Math.max(1, index(side[1]) - start + 1);
    return (id: number) => PAD + ((index(id) - start) / length) * (W - PAD * 2);
  };
  const floor = minSegment(parallel.pairs.length);
  /** A passage's left and right edges on a rail: its true extent, widened to the floor and kept on the rail. */
  const segment = (x: (id: number) => number, span: Span): [number, number] => {
    const from = x(span[0]), to = x(span[1]) + 2;
    const width = Math.max(floor, to - from);
    const left = Math.min(W - PAD - width, Math.max(PAD, (from + to) / 2 - width / 2));
    return [left, left + width];
  };
  const xTop = axis(parallel.left.span);
  const xBottom = axis(parallel.right.span);
  const kinds = [...new Set(parallel.pairs.map((p) => p.kind).filter(Boolean))] as string[];
  const opacityOf = (i: number) => (active === null ? 0.32 : active === i ? 0.9 : keep.peek(i) ? 0.22 : 0.08);
  const pair = active !== null ? parallel.pairs[active] : undefined;

  return <figure>
    <div className="lg-figure">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${parallel.title}: ${parallel.pairs.length} parallel passages between ${parallel.left.label} and ${parallel.right.label}`}>
        <defs>
          <linearGradient id={`rib-${parallel.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--lg)" stopOpacity=".9" />
            <stop offset="1" stopColor="var(--lg)" stopOpacity=".35" />
          </linearGradient>
        </defs>
        <text x={PAD} y={TOP - 18} className={empty.top ? "lg-svg-muted" : "lg-svg-strong"}>{parallel.left.label}</text>
        <text x={PAD} y={BOTTOM + 30} className={empty.bottom ? "lg-svg-muted" : "lg-svg-strong"}>{parallel.right.label}</text>
        <rect x={PAD} y={TOP - 6} width={W - PAD * 2} height={6} rx={3} fill={empty.top ? "var(--muted)" : "var(--lg)"} opacity={empty.top ? .45 : .25} style={{ transition: "fill .4s, opacity .4s" }} />
        <rect x={PAD} y={BOTTOM} width={W - PAD * 2} height={6} rx={3} fill={empty.bottom ? "var(--muted)" : "var(--lg)"} opacity={empty.bottom ? .45 : .25} style={{ transition: "fill .4s, opacity .4s" }} />
        {parallel.pairs.map((p, i) => {
          const [a0, a1] = segment(xTop, p.left);
          const [b0, b1] = segment(xBottom, p.right);
          const mid = (TOP + BOTTOM) / 2;
          const leftEdge: Cubic = [[a0, TOP], [a0, mid], [b0, mid], [b0, BOTTOM]], rightEdge: Cubic = [[a1, TOP], [a1, mid], [b1, mid], [b1, BOTTOM]];
          // Whole, or only the stretches grown out from each rail along the ribbon's own curve.
          const whole = !reveal || reveal.top + reveal.bottom >= 0.999;
          const d = whole ? band(leftEdge, rightEdge, 0, 1)
            : [reveal.top > 0.001 && band(leftEdge, rightEdge, 0, reveal.top), reveal.bottom > 0.001 && band(leftEdge, rightEdge, 1 - reveal.bottom, 1)].filter(Boolean).join(" ") || "M0,0";
          return <path key={i} d={d} fill={`url(#rib-${parallel.id})`} opacity={opacityOf(i)} className={active === i ? "lg-glow" : undefined}
            style={{ transition: "opacity .25s", cursor: "pointer" }} tabIndex={0} role="button"
            aria-label={`${label(p.left)} with ${label(p.right)}`}
            {...keep.bind(i)} />;
        })}
        {parallel.pairs.map((p, i) => {
          const [a0, a1] = segment(xTop, p.left), [b0, b1] = segment(xBottom, p.right);
          // On a rail the ribbons have left (or not reached yet), the passage marks fade with them.
          const showTop = !reveal || reveal.top > 0.02, showBottom = !reveal || reveal.bottom > 0.02;
          return <g key={`m${i}`} opacity={active === null || active === i ? 1 : keep.peek(i) ? 0.6 : 0.3}>
            <rect x={a0} y={TOP - 6} width={a1 - a0} height={6} rx={2} fill="var(--lg)" opacity={showTop ? 1 : 0} style={{ transition: "opacity .3s" }} />
            <rect x={b0} y={BOTTOM} width={b1 - b0} height={6} rx={2} fill="var(--lg)" opacity={showBottom ? 1 : 0} style={{ transition: "opacity .3s" }} />
          </g>;
        })}
      </svg>
    </div>
    <div className="lg-tip" aria-live="polite">
      {pair ? <><strong>{label(pair.left)}</strong> <span className="lg-muted">with</span> <strong>{label(pair.right)}</strong>{keep.kept !== null && <KeepX onRelease={keep.release} />}
        {pair.kind && <span className="lg-muted"> · {pair.kind}</span>}{pair.weight !== undefined && <span className="lg-muted"> · {pair.weight} {weightLabel}</span>}
        {pair.note && <span className="lg-muted"> · {pair.note}</span>}<Refs refs={[pair.left, pair.right]} /></>
        : hint ? <span className="lg-muted">{hint}</span>
        : <span className="lg-muted">{parallel.pairs.length} parallel passages{kinds.length ? ` · ${kinds.join(" · ")}` : ""}. Point at a ribbon to read both ends; click to keep it.</span>}
    </div>
    <figcaption className="lg-caption"><ClaimText claim={parallel.claim} as="span" /></figcaption>
  </figure>;
}
