// A journey on the Atlas window map, told once from its first stop to its last, then told again (owner, 2026-11-06:
// "the journey and nothing but the journey"). Each telling: a ripple at the first stop; a short comet (bright head,
// fading tail) travels the road, lighting each stop it reaches the way the mouse does; it settles on the last stop,
// fades, rests, and starts again. A faint dotted track shows the whole road throughout. With reduced motion only the
// track is shown.
import { useEffect, useRef } from "react";

export interface Stop { key: string; x: number; y: number }

/** The comet: this many pieces, each PIECE_PX long, so the whole trail is about 64px on screen. */
const PIECES = 8, PIECE_PX = 8;
/** Travel speed in screen pixels per second. */
const SPEED_PX = 130;
/** The telling's other beats, in milliseconds: the start ripple, the hold on the last stop, the fade, the rest. */
const START_MS = 900;
export const HOLD_MS = 900, FADE_MS = 500, REST_MS = 700;

export function RouteTrail({ stops, k, onPassing }: { stops: Stop[]; k: number; onPassing: (key: string | null) => void }) {
  const d = `M${stops.map(s => `${s.x.toFixed(1)} ${s.y.toFixed(1)}`).join("L")}`;
  const track = useRef<SVGPathElement>(null), comet = useRef<SVGGElement>(null), ripple = useRef<SVGCircleElement>(null);
  const pieces = useRef<(SVGPathElement | null)[]>([]), latest = useRef({ stops, onPassing });
  latest.current = { stops, onPassing };

  useEffect(() => {
    const road = track.current, tail = comet.current, ring = ripple.current;
    if (!road || !tail || !ring) return;
    const { stops: route } = latest.current;
    let shown: string | null | undefined;
    const pass = (key: string | null) => { if (key !== shown) { shown = key; latest.current.onPassing(key); } };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { tail.style.opacity = "0"; ring.style.opacity = "0"; return () => latest.current.onPassing(null); }

    const length = road.getTotalLength(), piece = Math.min(PIECE_PX * k, length / (PIECES * 2)), travel = Math.max(length - piece, piece);
    const reachedAt: number[] = [];
    route.forEach((s, i) => reachedAt.push(i ? reachedAt[i - 1] + Math.hypot(s.x - route[i - 1].x, s.y - route[i - 1].y) : 0));
    const speed = SPEED_PX * k / 1000, arrive = START_MS + (length + PIECES * piece) / speed, fadeFrom = arrive + HOLD_MS;
    const telling = fadeFrom + FADE_MS + REST_MS;
    pieces.current.forEach(p => p?.setAttribute("stroke-dasharray", `${piece} ${length * 2}`));

    const begin = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      const t = (now - begin) % telling, opening = Math.min(1, t / START_MS);
      ring.setAttribute("r", String((4 + 22 * opening) * k));
      ring.style.opacity = String(t < START_MS ? 1 - opening : 0);
      // Past the road's end the head stops and the tail draws in behind it, onto the last stop.
      const head = Math.max(0, t - START_MS) * speed;
      pieces.current.forEach((p, i) => p?.setAttribute("stroke-dashoffset", String(-Math.min(travel, Math.max(0, head - i * piece)))));
      tail.style.opacity = String(t < START_MS ? opening : t < fadeFrom ? 1 : Math.max(0, 1 - (t - fadeFrom) / FADE_MS));
      let current: string | null = null;
      if (t < fadeFrom) { const front = Math.min(length, head + piece); reachedAt.forEach((at, i) => { if (at <= front + 0.5) current = route[i].key; }); }
      pass(current);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); latest.current.onPassing(null); };
  }, [d, k]);

  const first = stops[0];
  return <g className="am-journey">
    <path ref={track} className="am-route" d={d} style={{ strokeWidth: 1.4 * k, strokeDasharray: `${0.1 * k} ${5 * k}` }} />
    <circle ref={ripple} className="am-start-ripple" cx={first.x} cy={first.y} r={4 * k} style={{ strokeWidth: 1.5 * k, opacity: 0 }} />
    <g ref={comet} style={{ opacity: 0 }}>{Array.from({ length: PIECES }, (_, i) => {
      const fade = 1 - i / PIECES;
      return <path key={i} ref={el => { pieces.current[i] = el; }} className={i === 0 ? "am-trail am-trail-head" : "am-trail"} d={d}
        style={{ strokeWidth: (1 + 2.6 * fade) * k, opacity: 0.08 + 0.92 * fade * fade }} strokeDasharray="0 99999" />;
    })}</g>
  </g>;
}
