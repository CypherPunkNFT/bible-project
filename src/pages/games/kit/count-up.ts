// A number that counts up to its value (the audits' result panel, item 6). The real value is the state; the counting is
// decoration. useCountUp hands back the number to draw this frame, time-based so it lands exactly on the target however
// slow the frames are, and under reduced motion (or with no frame clock) it is the target from the first render.
import { useEffect, useState } from "react";
import { hasWindow, prefersReducedMotion } from "./env";

/** The hub's ease-out: fast at first, settling softly. */
export const easeOut = (p: number): number => 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3);

/** The number to draw when the count from `from` to `to` is `progress` (0 to 1) of the way through. */
export const countAt = (from: number, to: number, progress: number): number =>
  progress >= 1 ? to : Math.round(from + (to - from) * easeOut(progress));

const canAnimate = () => hasWindow() && typeof window.requestAnimationFrame === "function" && !prefersReducedMotion();

/** The number to draw this frame while counting from 0 (or `from`) to `to` over `ms` milliseconds. */
export function useCountUp(to: number, ms = 900, from = 0): number {
  const [shown, setShown] = useState(() => (ms > 0 && canAnimate() ? from : to));
  useEffect(() => {
    if (ms <= 0 || !canAnimate()) {
      setShown(to);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = (now - start) / ms;
      setShown(countAt(from, to, progress));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [to, ms, from]);
  return shown;
}
