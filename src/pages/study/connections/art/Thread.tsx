import { useId } from "react";
import { ink, type End } from "./geometry";

/** Seconds each half of the 16-second loop lasts. */
const HALF = 8;

interface ThreadProps {
  a: End;
  b: End;
  /** 0: the first half of the loop (matching colours); 1: the second (mismatched). */
  half: 0 | 1;
  index: number;
  /** How many threads share this half, so they all start within its first three seconds. */
  count: number;
  /** How high the arch rises, as a share of its width. */
  rise?: number;
  weight?: number;
}

/** A thread arching from one end to the other, in the colour of its section or shading from one to the other, with the
 *  mark where it meets a page. It fades in and out with its half of the loop and draws itself (connections.css). */
export function Thread({ a, b, half, index, count, rise = 0.55, weight = 1.2 }: ThreadProps) {
  const id = useId().replace(/:/g, "");
  const delay = `${(half * HALF + index * Math.min(0.5, 2.4 / count)).toFixed(2)}s`;
  const top = Math.min(a.y, b.y) - Math.abs(b.x - a.x) * rise;
  const mixed = a.section !== b.section;
  return (
    <g className={`cx-art-link${half ? " cx-art-b" : ""}`} style={{ animationDelay: delay }}>
      {mixed && (
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={a.x} y1={0} x2={b.x} y2={0}>
          <stop offset="0" style={{ stopColor: ink(a.section) }} />
          <stop offset="1" style={{ stopColor: ink(b.section) }} />
        </linearGradient>
      )}
      {a.bar && <path d={a.bar} strokeWidth={2.2} stroke={ink(a.section)} />}
      {b.bar && <path d={b.bar} strokeWidth={2.2} stroke={ink(b.section)} />}
      <path
        className="cx-art-thread" pathLength={1} style={{ animationDelay: delay }} strokeWidth={weight}
        stroke={mixed ? `url(#${id})` : ink(a.section)}
        d={`M${a.x} ${a.y} C${a.x} ${top} ${b.x} ${top} ${b.x} ${b.y}`}
      />
    </g>
  );
}
