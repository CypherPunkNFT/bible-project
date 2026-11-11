// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import { ART } from "@/pages/contact/conviction-art";
import { CONVICTIONS } from "@/pages/contact/AboutSections.shared";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import "./convictions-long-drawing.css";
export const GLORY_TEXT = "Every page is offered back to the One it is about: the Almighty, the Alpha and Omega, the beginning and the ending, worthy of all praise.";

export const ITEMS = CONVICTIONS.map((item, index) => ({ ...item, text: index === 0 ? GLORY_TEXT : item.text, drawing: ART[item.art === "books" ? "shelf" : item.art] }));

export const COUNT = ITEMS.length;

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const position = (index: number) => ({ "--i": index }) as CSSProperties;

export function useSideways() {
  const track = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const room = element.scrollWidth - element.clientWidth;
      const along = room > 0 ? (element.scrollLeft / room) * (COUNT - 1) : 0;
      element.parentElement?.style.setProperty("--p", along.toFixed(3));
      setActive(Math.round(along));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };
    element.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => { element.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);
  const goTo = useCallback((index: number) => {
    const element = track.current;
    const items = element?.querySelectorAll<HTMLElement>(":scope > li:not(.cvm-backdrop)");
    if (!element || !items) return;
    element.scrollTo({ left: items[index].offsetLeft - items[0].offsetLeft, behavior: reducedMotion() ? "auto" : "smooth" });
  }, []);
  return { track, active, goTo };
}
