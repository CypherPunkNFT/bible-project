// Small wording and motion helpers shared by "The whole Bible" and "Teachers through the Bible".
import { formatNumber } from "../../shared/people";

/** "1 work" / "1,204 works". */
export const plural = (n: number, word: string, many = `${word}s`) => `${formatNumber(n)} ${n === 1 ? word : many}`;
export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Centre a chosen chip in its strip when the strip scrolls sideways (phones), so the choice stays in sight. */
export function centreInStrip(item: HTMLElement | null) {
  const strip = item?.parentElement;
  if (!item || !strip || strip.scrollWidth <= strip.clientWidth + 2) return;
  strip.scrollTo({ left: item.offsetLeft - strip.offsetLeft - strip.clientWidth / 2 + item.offsetWidth / 2, behavior: reducedMotion() ? "auto" : "smooth" });
}
