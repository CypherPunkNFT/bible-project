// A journey on the Atlas window map, shown travelling (owner, 2026-11-06: "a stronger start than a finish, and much
// shorter, so we can see it actually travel from A to B back to A"). A short comet runs the route out and back, again
// and again: a bright, thick head with a thin tail fading behind it, over a faint dotted track that shows the whole road.
// With reduced motion the comet rests at the journey's end.
import { useEffect, useRef } from "react";

/** The comet: this many pieces, each PIECE_PX long, so the whole trail is about 64px on screen. */
const PIECES = 8, PIECE_PX = 8;
/** Travel speed in screen pixels per second; a route across the map takes about four seconds each way. */
const SPEED_PX = 130;

/** Where a point `distance` along an out-and-back run sits on a road of length `travel`. */
const bounce = (distance: number, travel: number) => { const cycle = distance % (2 * travel); return cycle <= travel ? cycle : 2 * travel - cycle; };

export function RouteTrail({ d, k }: { d: string; k: number }) {
  const track = useRef<SVGPathElement>(null), pieces = useRef<(SVGPathElement | null)[]>([]);
  useEffect(() => {
    const road = track.current;
    if (!road) return;
    const length = road.getTotalLength(), piece = Math.min(PIECE_PX * k, length / (PIECES * 2));
    const travel = Math.max(length - piece, piece), still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    pieces.current.forEach(p => p?.setAttribute("stroke-dasharray", `${piece} ${length * 2}`));
    const start = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      const head = still ? travel : ((now - start) / 1000) * SPEED_PX * k;
      // Each piece follows the one in front by one piece's length, so the tail always trails the head, both ways.
      pieces.current.forEach((p, i) => p?.setAttribute("stroke-dashoffset", String(-bounce(Math.max(0, head - i * piece), travel))));
      if (!still) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [d, k]);

  return <g className="am-journey">
    <path ref={track} className="am-route" d={d} style={{ strokeWidth: 1.4 * k, strokeDasharray: `${0.1 * k} ${5 * k}` }} />
    {Array.from({ length: PIECES }, (_, i) => {
      const fade = 1 - i / PIECES;
      return <path key={i} ref={el => { pieces.current[i] = el; }} className={i === 0 ? "am-trail am-trail-head" : "am-trail"} d={d}
        style={{ strokeWidth: (1 + 2.6 * fade) * k, opacity: 0.08 + 0.92 * fade * fade }} strokeDasharray="0 99999" />;
    })}
  </g>;
}
