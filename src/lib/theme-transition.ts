import { flushSync } from "react-dom";
import "./theme-transition.css";

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void>; finished: Promise<void> };
};

let changing = false;

/** Reveal the new palette from the switch, matching Dealwright's circular sweep. */
export function revealTheme(origin: HTMLElement | undefined, update: () => void): void {
  if (changing) return;
  const doc = document as TransitionDocument;
  if (!origin || !doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    flushSync(update);
    return;
  }

  const rect = origin.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const root = document.documentElement;
  changing = true;
  root.dataset.themeTransition = "";
  let applied = false;
  const apply = () => {
    if (applied) return;
    applied = true;
    flushSync(update);
  };

  void (async () => {
    try {
      const transition = doc.startViewTransition!(apply);
      await transition.ready;
      await root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 750, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" },
      ).finished;
      await transition.finished;
    } catch {
      // Hidden tabs/unsupported animation may skip the reveal; the choice still applies.
      apply();
    } finally {
      delete root.dataset.themeTransition;
      changing = false;
    }
  })();
}
