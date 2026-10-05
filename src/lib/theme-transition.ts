import { flushSync } from "react-dom";
import "./theme-transition.css";

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void>; finished: Promise<void> };
};

let changing = false;

/** Light grows from the switch, then retracts into it to reveal the dark palette. */
export function revealTheme(origin: HTMLElement | undefined, next: "light" | "dark", update: () => void): void {
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
  const retract = next === "dark";
  root.dataset.themeTransition = retract ? "retract" : "expand";
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
      const circle = [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`];
      await root.animate(
        { clipPath: retract ? circle.reverse() : circle },
        {
          duration: retract ? 650 : 850,
          // Retraction keeps moving into the switch instead of lingering as a tiny disc.
          easing: retract ? "cubic-bezier(0.25, 0.1, 0.75, 0.9)" : "cubic-bezier(0.22, 0.8, 0.3, 1)",
          pseudoElement: retract ? "::view-transition-old(root)" : "::view-transition-new(root)",
          fill: "forwards",
        },
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
