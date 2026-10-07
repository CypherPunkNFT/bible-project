import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import "./outside-scroll.css";

/** A very long list would shrink the pill to a dot (browsers ignore a minimum pill size), so the bar's track stands for
 * the list at a reduced scale beyond this many screens: the pill stays at least 1/LONGEST_TRACK of the bar. */
const LONGEST_TRACK = 12;

/** How far the bar scrolls per pixel of the list. */
function scale(list: HTMLDivElement, bar: HTMLDivElement): number {
  const listRange = list.scrollHeight - list.clientHeight, barRange = bar.scrollHeight - bar.clientHeight;
  return listRange > 0 && barRange > 0 ? barRange / listRange : 1;
}

/** A fixed frame with gutter-free content and a native scrollbar just beyond its right edge. */
export function OutsideScroll({ children, label, className, frameClassName, viewportClassName, style, resetKey }: {
  children: ReactNode;
  label: string;
  className?: string;
  frameClassName?: string;
  viewportClassName?: string;
  style?: CSSProperties;
  resetKey?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const scrollbar = useRef<HTMLDivElement>(null);
  const extent = useRef<HTMLDivElement>(null);
  const mirrored = useRef(new WeakMap<HTMLDivElement, number>());

  useLayoutEffect(() => {
    if (viewport.current) viewport.current.scrollTop = 0;
  }, [resetKey]);

  useLayoutEffect(() => {
    const measure = () => {
      if (!root.current || !viewport.current || !scrollbar.current || !extent.current) return;
      scrollbar.current.style.top = `${viewport.current.getBoundingClientRect().top - root.current.getBoundingClientRect().top}px`;
      scrollbar.current.style.height = `${viewport.current.clientHeight}px`;
      extent.current.style.height = `${Math.min(viewport.current.scrollHeight, viewport.current.clientHeight * LONGEST_TRACK)}px`;
      const target = viewport.current.scrollTop * scale(viewport.current, scrollbar.current);
      mirrored.current.set(scrollbar.current, target);
      scrollbar.current.scrollTop = target;
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (viewport.current) observer.observe(viewport.current);
    if (content.current) observer.observe(content.current);
    return () => observer.disconnect();
  }, []);

  /** One element's scroll position mirrored onto the other, through the bar's scale (1 unless the list is very long). */
  const sync = (from: HTMLDivElement, to: HTMLDivElement | null) => {
    const expected = mirrored.current.get(from);
    mirrored.current.delete(from);
    if (expected !== undefined && Math.abs(expected - from.scrollTop) <= 1) return;
    if (!to || !viewport.current || !scrollbar.current) return;
    const ratio = scale(viewport.current, scrollbar.current);
    const target = from === viewport.current ? from.scrollTop * ratio : from.scrollTop / ratio;
    if (Math.abs(to.scrollTop - target) > 1) {
      mirrored.current.set(to, target);
      to.scrollTop = target;
    }
  };

  return <div ref={root} className={cn("outside-scroll-area", className)} style={style}>
    <div className={cn("outside-scroll-frame", frameClassName)}>
      <div ref={viewport} className={cn("outside-scroll-viewport no-scrollbar", viewportClassName)} role="region" aria-label={label} tabIndex={0} onScroll={(event) => sync(event.currentTarget, scrollbar.current)}>
        <div ref={content} className="outside-scroll-content">{children}</div>
      </div>
    </div>
    <div ref={scrollbar} className="outside-scrollbar slim-scroll" aria-hidden="true" tabIndex={-1} onScroll={(event) => sync(event.currentTarget, viewport.current)}><div ref={extent} className="w-px" /></div>
  </div>;
}
