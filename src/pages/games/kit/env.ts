// The games kit's one window into the browser: every hook that reads the window, the media queries or the frame clock
// goes through here, so the guards for jsdom, server rendering and reduced motion are written and tested once.

/** True in a browser, false while rendering on a server or in a bare test. */
export const hasWindow = (): boolean => typeof window !== "undefined" && typeof document !== "undefined";

/** The reader asked for reduced motion: the site cuts every animation to 0.01 ms (src/index.css), and the kit's own
 * timers skip their decoration too. Never throws where matchMedia is missing. */
export function prefersReducedMotion(): boolean {
  if (!hasWindow() || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** The hub's easing, for a game that drives a transition from code; kit.css carries the same curve as --kit-ease. */
export const KIT_EASE = "cubic-bezier(.16, 1, .3, 1)";

/** Milliseconds a decoration lasts, 0 under reduced motion, so a game that times a sound or a cleanup to the kit's
 * motion never waits for an animation the reader will not see. */
export const motionMs = (ms: number): number => (prefersReducedMotion() ? 0 : ms);
