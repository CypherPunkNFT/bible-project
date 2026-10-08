// The page viewer: a built workbook's real pages (the A4 edition as images, scripts/build-learning.mjs), opened over the
// page. Turn with the arrows, the arrow keys or a sideways swipe; each turn slides the next page in from its side (no
// fades; reduced motion turns at once). Closes with the x, Escape, or a click outside the page.
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const TURN_MS = 320, EASE = "cubic-bezier(.65, 0, .25, 1)";

export function PageViewer({ title, images, start, onClose }: { title: string; images: string[]; start: number; onClose: () => void }) {
  const total = images.length;
  const [page, setPage] = useState(Math.min(Math.max(1, start), total));
  const direction = useRef(0), img = useRef<HTMLImageElement>(null), closeButton = useRef<HTMLButtonElement>(null), touchX = useRef<number | null>(null);
  const turn = useCallback((by: number) => setPage((n) => {
    const next = Math.min(total, Math.max(1, n + by));
    if (next !== n) direction.current = Math.sign(by);
    return next;
  }), [total]);

  useLayoutEffect(() => {
    const el = img.current, sign = direction.current;
    direction.current = 0;
    if (!el || !sign) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.animate([{ transform: `translateX(${sign * 56}px)` }, { transform: "translateX(0)" }], { duration: reduce ? 1 : TURN_MS, easing: EASE });
  }, [page]);

  useEffect(() => { closeButton.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); turn(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); turn(-1); }
    };
    addEventListener("keydown", key, true);
    return () => removeEventListener("keydown", key, true);
  }, [onClose, turn]);

  // The next page is fetched before it is asked for, so a turn never waits on the network.
  useEffect(() => { for (const n of [page + 1, page - 1]) if (images[n - 1]) new Image().src = images[n - 1]; }, [page, images]);

  return createPortal(<div className="lm-viewer" role="dialog" aria-modal="true" aria-label={`${title}: the pages`}
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    onTouchStart={(e) => { touchX.current = e.touches[0]?.clientX ?? null; }}
    onTouchEnd={(e) => { const x0 = touchX.current, x1 = e.changedTouches[0]?.clientX; touchX.current = null; if (x0 !== null && x1 !== undefined && Math.abs(x1 - x0) > 50) turn(x1 < x0 ? 1 : -1); }}>
    <figure>
      <div className="lm-viewer-sheet"><img ref={img} src={images[page - 1]} alt={`Page ${page} of ${title}`} width={1000} height={1414} /></div>
      <figcaption>
        <button type="button" onClick={() => turn(-1)} disabled={page === 1} aria-label="Previous page"><ChevronLeft size={16} aria-hidden="true" /></button>
        <span aria-live="polite" data-page={page}>Page {page} of {total}</span>
        <button type="button" onClick={() => turn(1)} disabled={page === total} aria-label="Next page"><ChevronRight size={16} aria-hidden="true" /></button>
        <button type="button" ref={closeButton} onClick={onClose} aria-label="Close"><X size={16} aria-hidden="true" /></button>
      </figcaption>
    </figure>
  </div>, document.body);
}
