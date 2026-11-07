// Places shown in an order that is not a journey (owner, 2026-11-06): the seven churches, in the order Revelation 2–3
// gives their letters. No one in the text travels between them, so there is no road and no comet: each place lights in
// turn, the way the mouse lights it, with a ripple as it does; the last one holds, the light goes out, a rest, and again.
// The beats match a journey's (RouteTrail). With reduced motion nothing moves.
import { useEffect, useRef } from "react";
import { FADE_MS, HOLD_MS, REST_MS, type Stop } from "./RouteTrail";

/** How long each place stays lit before the next. */
const STEP_MS = 1100;

export function StopSequence({ stops, k, onPassing }: { stops: Stop[]; k: number; onPassing: (key: string | null) => void }) {
  const ripple = useRef<SVGCircleElement>(null), latest = useRef({ stops, onPassing });
  latest.current = { stops, onPassing };
  const keys = stops.map(s => s.key).join("|");

  useEffect(() => {
    const ring = ripple.current;
    if (!ring || matchMedia("(prefers-reduced-motion: reduce)").matches) return () => latest.current.onPassing(null);
    const count = latest.current.stops.length, darkFrom = count * STEP_MS + HOLD_MS, telling = darkFrom + FADE_MS + REST_MS;
    let shown: string | null | undefined;
    const begin = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      const t = (now - begin) % telling, step = Math.min(count - 1, Math.floor(t / STEP_MS)), stop = latest.current.stops[step];
      const key = t < darkFrom ? stop.key : null;
      if (key !== shown) { shown = key; latest.current.onPassing(key); }
      const opening = Math.min(1, (t - step * STEP_MS) / 800), rippling = t < count * STEP_MS && opening < 1;
      ring.setAttribute("cx", String(stop.x)); ring.setAttribute("cy", String(stop.y));
      ring.setAttribute("r", String((4 + 22 * opening) * k));
      ring.style.opacity = String(rippling ? 1 - opening : 0);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); latest.current.onPassing(null); };
  }, [keys, k]);

  return <circle ref={ripple} className="am-start-ripple" r={4 * k} style={{ strokeWidth: 1.5 * k, opacity: 0 }} />;
}
