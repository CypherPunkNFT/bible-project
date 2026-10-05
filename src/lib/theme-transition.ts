import { flushSync } from "react-dom";
import "./theme-transition.css";

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> };
};

/** Towerline's original sweep: the incoming theme expands from the switch in both directions. */
export function revealTheme(origin: HTMLElement | undefined, update: () => void): void {
  const doc = document as TransitionDocument;
  if (!origin || !doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    flushSync(update);
    return;
  }

  const rect = origin.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  doc.startViewTransition(() => flushSync(update)).ready.then(() =>
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 750, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" },
    ),
  ).catch((error: unknown) => console.warn("theme sweep skipped:", error));
}
