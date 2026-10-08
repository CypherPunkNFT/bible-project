// A small tooltip that follows the pointer (sections 04 and 06). The words are ordinary React children; the position
// is moved with a transform through a ref, so following the pointer never re-renders anything.
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, type ReactNode } from "react";

export interface TipHandle {
  /** Show the tip beside the pointer at (x, y) in viewport pixels. */
  move: (x: number, y: number) => void;
  hide: () => void;
}
interface Point { x: number; y: number }

/** Beside the pointer, flipped to its left near the right edge, and kept inside the window. */
function placeTip(tip: HTMLElement | null, point: Point | null) {
  if (!tip || !point) return;
  const width = tip.offsetWidth, height = tip.offsetHeight;
  const left = point.x + 16 + width > window.innerWidth - 8 ? point.x - 16 - width : point.x + 16;
  const top = Math.min(window.innerHeight - height - 8, Math.max(8, point.y + 14));
  tip.style.transform = `translate(${Math.max(8, left)}px, ${top}px)`;
}

export const FloatingTip = forwardRef<TipHandle, { className: string; children: ReactNode }>(function FloatingTip({ className, children }, ref) {
  const element = useRef<HTMLDivElement>(null);
  const point = useRef<Point | null>(null);

  useImperativeHandle(ref, () => ({
    move(x, y) {
      point.current = { x, y };
      placeTip(element.current, point.current);
      element.current?.classList.add("show");
    },
    hide() {
      point.current = null;
      element.current?.classList.remove("show");
    },
  }), []);

  // New words change the tip's size: place it again beside the last pointer position.
  useLayoutEffect(() => { placeTip(element.current, point.current); }, [children]);

  return <div ref={element} className={className} role="status">{children}</div>;
});
