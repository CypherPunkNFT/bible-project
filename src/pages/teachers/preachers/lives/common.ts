// Small helpers shared by three sections of the Preachers & authors page: 04 Who was alive at the same time,
// 05 Did their lives cross? and 06 Who passed it to whom.
import { useLayoutEffect, useState, type RefObject } from "react";
import type { Person } from "@/data/teachers/pages-types";
import { familyOf, formatNumber } from "../../shared/people";

/** "1 year", "12 years", "1,204 places". */
export const plural = (n: number, one: string, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`;

/** A person's family colour as a CSS value, e.g. "var(--history)". */
export const toneVar = (person: Person) => `var(${familyOf(person).tone})`;

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Ease out (cubic): fast start, gentle stop. */
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Calls `onWidth` with the element's rounded content width whenever it changes (at most once a frame). */
export function observeWidth(element: Element, onWidth: (width: number) => void): () => void {
  let lastWidth = -1;
  let pending = 0;
  const observer = new ResizeObserver((entries) => {
    const width = Math.round(entries[0].contentRect.width);
    if (width === lastWidth) return;
    lastWidth = width;
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => onWidth(width));
  });
  observer.observe(element);
  return () => { observer.disconnect(); cancelAnimationFrame(pending); };
}

/** The element's content width in whole pixels (0 until it has been measured). */
export function useWidth(ref: RefObject<Element>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(Math.round(element.getBoundingClientRect().width));
    return observeWidth(element, setWidth);
  }, [ref]);
  return width;
}

/** Runs `onSeen` once, the first time the element is at least `threshold` in view. */
export function onFirstView(element: Element, threshold: number, onSeen: () => void): () => void {
  if (!("IntersectionObserver" in window)) return () => undefined;
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    onSeen();
  }, { threshold });
  observer.observe(element);
  return () => observer.disconnect();
}
