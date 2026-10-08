// The profile's motion: the panel grows out of the element that opened it and shrinks back into it (Web Animations on
// transform and opacity only), and the page scroll is locked while it is open.
const EASE = "cubic-bezier(.16, 1, .3, 1)";

const isCard = (el: Element | null) => Boolean(el?.classList.contains("cat-card"));

/** A catalogue card hides while the panel stands in for it; any other origin stays where it is. */
export function liftCard(el: Element | null, on: boolean) {
  if (isCard(el)) el?.classList.toggle("prf-lifted", on);
}

const towards = (from: DOMRect, to: DOMRect) =>
  `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;

export function grow(panel: HTMLElement, body: HTMLElement, origin: Element | null) {
  const end = panel.getBoundingClientRect(), start = origin?.isConnected ? origin.getBoundingClientRect() : null;
  if (start && start.width) {
    liftCard(origin, true);
    panel.animate([{ transform: towards(start, end), borderRadius: "28px", opacity: isCard(origin) ? 1 : 0.2 }, { transform: "none", opacity: 1 }], { duration: 520, easing: EASE });
  } else {
    panel.animate([{ transform: "translateY(24px) scale(.97)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420, easing: EASE });
  }
  body.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 160, easing: "ease-out", fill: "backwards" });
}

/** Shrink back into the origin if it is still on screen, else sink and fade; `done` runs at the end. Returns a cancel. */
export function shrink(panel: HTMLElement, body: HTMLElement, origin: Element | null, done: () => void): () => void {
  const target = origin && origin.isConnected && !(origin instanceof HTMLElement && origin.hidden) ? origin.getBoundingClientRect() : null;
  const end = panel.getBoundingClientRect();
  const onScreen = Boolean(target && target.width && target.bottom > 0 && target.top < innerHeight);
  const frames = onScreen && target
    ? [{ transform: "none" }, { transform: towards(target, end), borderRadius: "28px", opacity: 0.4 }]
    : [{ transform: "none", opacity: 1 }, { transform: "translateY(18px) scale(.97)", opacity: 0 }];
  const fade = body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "forwards" });
  const move = panel.animate(frames, { duration: onScreen ? 380 : 260, easing: onScreen ? EASE : "ease-in" });
  move.onfinish = () => { fade.cancel(); done(); };
  return () => { move.onfinish = null; move.cancel(); fade.cancel(); };
}

/** Stop the page scrolling behind the profile (keeping the scrollbar's room); returns the undo. */
export function lockPage(): () => void {
  const root = document.documentElement.style, was = { overflow: root.overflow, gutter: root.scrollbarGutter };
  root.overflow = "hidden";
  root.scrollbarGutter = "stable";
  return () => { root.overflow = was.overflow; root.scrollbarGutter = was.gutter; };
}
