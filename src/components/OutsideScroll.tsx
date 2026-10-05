import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import "./outside-scroll.css";

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
      extent.current.style.height = `${viewport.current.scrollHeight}px`;
      mirrored.current.set(scrollbar.current, viewport.current.scrollTop);
      scrollbar.current.scrollTop = viewport.current.scrollTop;
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (viewport.current) observer.observe(viewport.current);
    if (content.current) observer.observe(content.current);
    return () => observer.disconnect();
  }, []);

  const sync = (from: HTMLDivElement, to: HTMLDivElement | null) => {
    const expected = mirrored.current.get(from);
    mirrored.current.delete(from);
    if (expected !== undefined && Math.abs(expected - from.scrollTop) <= .5) return;
    if (to && Math.abs(to.scrollTop - from.scrollTop) > .5) {
      mirrored.current.set(to, from.scrollTop);
      to.scrollTop = from.scrollTop;
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
