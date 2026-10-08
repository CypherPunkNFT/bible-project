import { useLayoutEffect, useMemo, useRef, useState } from "react";
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
/** A rounded tip across a ribbon's loose end, bulging the way the ribbon is travelling (from `inner` towards `end`). */
function tip(endL: Pt, endR: Pt, innerL: Pt, innerR: Pt): string {
  const mid = lerp(endL, endR, 0.5), width = Math.hypot(endR[0] - endL[0], endR[1] - endL[1]);
  const dx = endL[0] - innerL[0] + endR[0] - innerR[0], dy = endL[1] - innerL[1] + endR[1] - innerR[1], len = Math.hypot(dx, dy) || 1;
  const bulge = Math.min(width * 0.9, 12); // a wide ribbon keeps a gentle tip rather than a dome
  return pt([mid[0] + (dx / len) * bulge, mid[1] + (dy / len) * bulge]);
}
/**
 * The part of a ribbon between u and v along its two edges (0 = top rail, 1 = bottom rail), as a closed band. A loose
 * end (one that does not sit on a rail) is drawn as a rounded tip, so a growing or retracting ribbon reads as a tentacle.
 */
function band(leftEdge: Cubic, rightEdge: Cubic, u: number, v: number): string {
  const l = stretch(leftEdge, u, v), r = stretch(rightEdge, u, v);
  const endTip = v < 0.999 ? `Q${tip(l[3], r[3], l[2], r[2])} ${pt(r[3])}` : `L${pt(r[3])}`;
  const startTip = u > 0.001 ? `Q${tip(r[0], l[0], r[1], l[1])} ${pt(l[0])}` : "";
  return `M${pt(l[0])} C${pt(l[1])} ${pt(l[2])} ${pt(l[3])} ${endTip} C${pt(r[2])} ${pt(r[1])} ${pt(r[0])} ${startTip} Z`;
}

const STAGGER = 0.6; // how far apart the ribbons start and finish, as a share of the whole movement
/** One ribbon's own share of a shared reveal: each starts and finishes at its own moment (spread by the golden ratio),
 *  so the tips never move in a line like a wipe. `whole` is the reveal's full value (0.5 from each rail, or 1 from one). */
function ownShare(value: number, whole: number, index: number): number {
  const offset = (index * 0.6180339887) % 1;
  return Math.min(1, Math.max(0, (value / whole) * (1 + STAGGER) - STAGGER * offset)) * whole;
}

/** How much of every ribbon shows, as a share of its own length along its curve, grown from the top rail and from the
 *  bottom rail (0.5 + 0.5 is the whole ribbon). The pick-two comparison animates it: each ribbon grows out along its path
 *  from both rails, or draws back along it into one. */
export interface RibbonReveal { top: number; bottom: number }

/** A movement of the reveal from one state to another over `ms`; a new `key` starts it, `onDone` follows its end. */
export interface RibbonMotion { from: RibbonReveal; to: RibbonReveal; ms: number; key: number; onDone?: () => void }

/** One ribbon's geometry, worked out once per chart: its marks on the two rails and its two edges as curves. */
interface Shape { top: [number, number]; bottom: [number, number]; left: Cubic; right: Cubic }

/** A ribbon's outline at a given reveal (null = whole): only the stretches grown out from each rail, each on its own timing. */
function outline(shape: Shape, reveal: RibbonReveal | null, i: number): string {
  if (!reveal) return band(shape.left, shape.right, 0, 1);
  const whole = reveal.top > 0 && reveal.bottom > 0 ? 0.5 : 1;
  const fromTop = ownShare(reveal.top, whole, i), fromBottom = ownShare(reveal.bottom, whole, i);
  if (fromTop + fromBottom >= 0.999) return band(shape.left, shape.right, 0, 1);
  return [fromTop > 0.001 && band(shape.left, shape.right, 0, fromTop), fromBottom > 0.001 && band(shape.left, shape.right, 1 - fromBottom, 1)]
    .filter(Boolean).join(" ") || "M0,0";
}

/**
 * Two texts as two glowing rails (top and bottom), joined by a ribbon for each parallel passage. A ribbon's width
 * follows the passages' lengths (with a floor, so short passages stay visible); pointing at one names both ends and
 * clicking keeps it until its ✕. With `empty`, a rail whose text is not chosen is drawn grey. With `motion`, the ribbons
 * grow or draw back frame by frame; only their outlines are touched while they move (no page re-render per frame).
 */
export function ParallelRibbon({ parallel, weightLabel = "shared Greek words", motion, empty = {}, hint }: {
  parallel: Parallel; weightLabel?: string; motion?: RibbonMotion; empty?: { top?: boolean; bottom?: boolean }; hint?: string;
}) {
  const index = useVerseIndex();
  const label = useSpanLabel();
  const keep = useKeep<number>();
  const { active } = keep;
  // The shapes depend only on the passages and the two texts' extents, not on labels, so a re-render around the chart
  // never restarts a movement.
  const { pairs, left: { span: topSpan }, right: { span: bottomSpan } } = parallel;
  const shapes = useMemo<Shape[] | null>(() => {
    if (!index) return null;
    const axis = (side: Span) => {
      const start = index(side[0]);
      const length = Math.max(1, index(side[1]) - start + 1);
      return (id: number) => PAD + ((index(id) - start) / length) * (W - PAD * 2);
    };
    const floor = minSegment(pairs.length);
    /** A passage's left and right edges on a rail: its true extent, widened to the floor and kept on the rail. */
    const segment = (x: (id: number) => number, span: Span): [number, number] => {
      const from = x(span[0]), to = x(span[1]) + 2;
      const width = Math.max(floor, to - from);
      const left = Math.min(W - PAD - width, Math.max(PAD, (from + to) / 2 - width / 2));
      return [left, left + width];
    };
    const xTop = axis(topSpan), xBottom = axis(bottomSpan), mid = (TOP + BOTTOM) / 2;
    return pairs.map((p) => {
      const [a0, a1] = segment(xTop, p.left), [b0, b1] = segment(xBottom, p.right);
      return { top: [a0, a1], bottom: [b0, b1], left: [[a0, TOP], [a0, mid], [b0, mid], [b0, BOTTOM]], right: [[a1, TOP], [a1, mid], [b1, mid], [b1, BOTTOM]] };
    });
  }, [index, pairs, topSpan, bottomSpan]);

  // The reveal the outlines show now (null = whole). The animation moves it and redraws the outlines directly.
  const current = useRef<RibbonReveal | null>(motion ? motion.from : null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const [, settle] = useState(0); // one render when a movement ends, so the rail marks follow
  useLayoutEffect(() => {
    if (!motion || !shapes) return;
    const draw = (reveal: RibbonReveal) => {
      current.current = reveal;
      shapes.forEach((shape, i) => paths.current[i]?.setAttribute("d", outline(shape, reveal, i)));
    };
    const end = () => { draw(motion.to); settle((n) => n + 1); motion.onDone?.(); };
    if (motion.ms <= 0) { end(); return; }
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / motion.ms), e = 1 - (1 - k) ** 3;
      if (k >= 1) { end(); return; }
      draw({ top: motion.from.top + (motion.to.top - motion.from.top) * e, bottom: motion.from.bottom + (motion.to.bottom - motion.from.bottom) * e });
      frame = requestAnimationFrame(step);
    };
    draw(motion.from);
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- one movement per key, redrawn when the chart's shapes change
  }, [motion?.key, shapes]);

  if (!index || !shapes) return <div className="lg-figure" style={{ minHeight: H }} />;
  const kinds = [...new Set(parallel.pairs.map((p) => p.kind).filter(Boolean))] as string[];
  const opacityOf = (i: number) => (active === null ? 0.32 : active === i ? 0.9 : keep.peek(i) ? 0.22 : 0.08);
  const pair = active !== null ? parallel.pairs[active] : undefined;
  const reveal = current.current;
  // On a rail the ribbons have left (or not reached yet), the passage marks fade with them.
  const showTop = !reveal || reveal.top > 0.02, showBottom = !reveal || reveal.bottom > 0.02;

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
        {parallel.pairs.map((p, i) => <path key={i} ref={(el) => { paths.current[i] = el; }} d={outline(shapes[i], reveal, i)} fill={`url(#rib-${parallel.id})`}
          // fill-opacity, not opacity: the same look, but each ribbon no longer needs its own offscreen layer per frame.
          fillOpacity={opacityOf(i)} className={active === i ? "lg-glow" : undefined} style={{ transition: "fill-opacity .25s", cursor: "pointer" }} tabIndex={0} role="button"
          aria-label={`${label(p.left)} with ${label(p.right)}`} {...keep.bind(i)} />)}
        {shapes.map((shape, i) => <g key={`m${i}`} opacity={active === null || active === i ? 1 : keep.peek(i) ? 0.6 : 0.3}>
          <rect x={shape.top[0]} y={TOP - 6} width={shape.top[1] - shape.top[0]} height={6} rx={2} fill="var(--lg)" opacity={showTop ? 1 : 0} style={{ transition: "opacity .3s" }} />
          <rect x={shape.bottom[0]} y={BOTTOM} width={shape.bottom[1] - shape.bottom[0]} height={6} rx={2} fill="var(--lg)" opacity={showBottom ? 1 : 0} style={{ transition: "opacity .3s" }} />
        </g>)}
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
