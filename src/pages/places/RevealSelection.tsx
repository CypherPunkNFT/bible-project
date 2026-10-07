import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

/** One selection surface: the detail rolls down over the grid while the page makes room. */
export function RevealSelection({ expanded, selectionKey, grid, children, onBack }: {
  expanded: boolean; selectionKey: string; grid: ReactNode; children: ReactNode; onBack: () => void;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const detail = useRef<HTMLDivElement>(null);
  const initial = useRef(expanded);
  const previous = useRef(expanded);
  const running = useRef(false);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const box = stage.current!, cards = list.current!, panel = detail.current!;
    const changed = previous.current !== expanded;
    previous.current = expanded;
    const target = expanded ? panel : cards;
    const other = expanded ? cards : panel;
    const startHeight = box.getBoundingClientRect().height;
    target.hidden = false;
    const endHeight = target.offsetHeight;
    let cancelled = false;
    const animations: Animation[] = [];
    const finish = () => {
      if (cancelled) return;
      other.hidden = true;
      target.hidden = false;
      cards.inert = expanded; panel.inert = !expanded;
      box.style.height = `${target.offsetHeight}px`;
      box.dataset.phase = expanded ? "expanded" : "collapsed";
      running.current = false;
      animations.forEach((animation) => animation.cancel());
      if (changed) {
        const focus = expanded ? panel.querySelector<HTMLElement>(".places-collections-back") : cards.querySelector<HTMLElement>(`[data-selection-key="${selectionKey}"]`);
        focus?.focus({ preventScroll: true });
      }
    };
    if (!changed || reduced) finish();
    else {
      running.current = true;
      cards.hidden = false; panel.hidden = false;
      cards.inert = true; panel.inert = true;
      box.dataset.phase = "animating";
      const animate = (element: HTMLElement, keyframes: Keyframe[]) => {
        const animation = element.animate(keyframes, { duration: 480, easing: "cubic-bezier(.65, 0, .35, 1)", fill: "both" });
        animations.push(animation);
        return animation.finished;
      };
      void Promise.all([
        animate(box, [{ height: `${startHeight}px` }, { height: `${endHeight}px` }]),
        animate(panel, [{ clipPath: expanded ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)" }, { clipPath: expanded ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)" }]),
        animate(cards, [{ opacity: expanded ? 1 : 0 }, { opacity: expanded ? 0 : 1 }]),
      ]).then(finish).catch(() => undefined);
    }
    const observer = new ResizeObserver(() => {
      if (!running.current) box.style.height = `${target.offsetHeight}px`;
    });
    observer.observe(target);
    return () => { cancelled = true; observer.disconnect(); animations.forEach((animation) => animation.cancel()); running.current = false; };
  }, [expanded, reduced, selectionKey]);

  return <div ref={stage} className="places-reveal" onKeyDown={(event) => {
    // A nested selection handles its own Escape first; the outer one then leaves it alone.
    if (event.key === "Escape" && !event.defaultPrevented && expanded && !running.current) { event.preventDefault(); onBack(); }
  }}>
    <div ref={list} className="places-reveal-grid" hidden={initial.current}>{grid}</div>
    <div ref={detail} className="places-reveal-detail" hidden={!initial.current}>{children}</div>
  </div>;
}
