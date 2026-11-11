// Bible crossword: the small hooks the play screen needs (docs/visual-audits/crossword-redesign.md): whether the
// screen is a phone's, the clock that pauses while the tab is hidden, and the measured height of the pinned block.
import { useEffect, useRef, useState, type RefObject } from "react";

const NARROW = "(max-width: 899px)";

/** True on a phone-width screen (under 900px), where the clue lists live in a sheet and the keys are pinned. */
export function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(NARROW).matches);
  useEffect(() => {
    const query = window.matchMedia?.(NARROW);
    if (!query) return;
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return narrow;
}

/** The seconds spent so far, counted from the clock's own time (not ticks, which a hidden tab throttles), paused while
 *  the page is hidden or `running` is false. `read()` gives the current total at any moment for a save. */
export function useElapsed(initial: number, running: boolean): { seconds: number; read: () => number } {
  const base = useRef(initial);
  const since = useRef<number | null>(null);
  const [seconds, setSeconds] = useState(initial);
  const read = () => Math.floor(base.current + (since.current === null ? 0 : (performance.now() - since.current) / 1000));
  useEffect(() => {
    if (!running) return;
    const start = () => { if (since.current === null && document.visibilityState !== "hidden") since.current = performance.now(); };
    const stop = () => { if (since.current !== null) { base.current += (performance.now() - since.current) / 1000; since.current = null; } };
    const onVisible = () => (document.visibilityState === "hidden" ? stop() : start());
    start();
    const tick = setInterval(() => setSeconds(read()), 1000);
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(tick); document.removeEventListener("visibilitychange", onVisible); stop(); };
  }, [running]);
  return { seconds, read };
}

/** Keeps `--cw-dock` on `root` equal to the pinned block's height, so the grid frame can take the space above it. */
export function useDockHeight(root: RefObject<HTMLElement | null>, dock: RefObject<HTMLElement | null>, on: boolean): void {
  useEffect(() => {
    const target = dock.current, host = root.current;
    if (!on || !target || !host || typeof ResizeObserver === "undefined") return;
    const apply = () => host.style.setProperty("--cw-dock", `${target.getBoundingClientRect().height}px`);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(target);
    return () => { observer.disconnect(); host.style.removeProperty("--cw-dock"); };
  }, [root, dock, on]);
}
