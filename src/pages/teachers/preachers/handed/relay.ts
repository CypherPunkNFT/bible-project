// 06 · Who passed it to whom: the relay. Each hand-off in a chain draws itself in after the one before, and its numbered
// badge fades in as the line arrives. Returns a function that stops it and leaves every line whole.
import type { Link } from "./model";

const EASE = "cubic-bezier(.16,1,.3,1)";

export function drawRelay(list: Link[], arcs: Map<number, SVGPathElement>, badges: Map<number, SVGGElement>): () => void {
  const running: Animation[] = [], dashed: SVGPathElement[] = [];
  list.forEach((link, i) => {
    const arc = arcs.get(link.k);
    if (!arc) return;
    const length = arc.getTotalLength();
    arc.style.strokeDasharray = `${length}`;
    dashed.push(arc);
    const line = arc.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], { duration: 650, delay: 150 + i * 320, easing: EASE, fill: "backwards" });
    line.onfinish = () => { arc.style.strokeDasharray = ""; };
    running.push(line);
    const badge = badges.get(link.k);
    if (badge) running.push(badge.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 500 + i * 320, fill: "backwards" }));
  });
  return () => {
    running.forEach((animation) => animation.cancel());
    dashed.forEach((arc) => { arc.style.strokeDasharray = ""; });
  };
}
