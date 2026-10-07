import { useLayoutEffect, type RefObject } from "react";

/**
 * Every family card inside `box` as tall as the tallest one (owner: "make the shorter as long as the longest").
 * Heights depend on the width, so it measures again when the width changes and once the fonts have loaded.
 */
export function useEqualCardHeights(box: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = box.current;
    if (!root) return;
    let width = -1;
    const measure = () => {
      root.style.removeProperty("--topics-card-h");
      const tallest = Math.max(0, ...[...root.querySelectorAll<HTMLElement>(".topics-family-card")].map((card) => card.offsetHeight));
      if (tallest) root.style.setProperty("--topics-card-h", `${tallest}px`);
    };
    measure();
    // Only a change of width re-measures; the height change measuring causes must not set it off again.
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next !== width) { width = next; measure(); }
    });
    observer.observe(root);
    void document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [box]);
}
