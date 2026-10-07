import { useEffect, useRef, type PointerEvent } from "react";

/**
 * A wide strip that scrolls sideways inside its own frame (the page never does), with the outside scroll pill turned
 * on its side under it (as under the prophets river): the pill shows where you are; drag it, or click its track.
 * `centre` is the fraction (0–1) of the strip to start centred on, e.g. this ruler's reign.
 */
export function useStripPill(centre?: number) {
  const frame = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const box = frame.current;
    if (!box) return;
    const sync = () => {
      const reach = box.scrollWidth - box.clientWidth;
      if (pill.current) pill.current.hidden = reach <= 1;
      const shown = Math.min(1, box.clientWidth / Math.max(1, box.scrollWidth));
      if (thumb.current) { thumb.current.style.width = `${shown * 100}%`; thumb.current.style.left = `${(reach > 0 ? box.scrollLeft / reach : 0) * (1 - shown) * 100}%`; }
    };
    if (centre !== undefined) box.scrollLeft = Math.max(0, centre * box.scrollWidth - box.clientWidth / 2);
    sync();
    box.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(box);
    return () => { box.removeEventListener("scroll", sync); observer.disconnect(); };
  }, [centre]);

  const onPillDown = (event: PointerEvent<HTMLDivElement>) => {
    const box = frame.current, track = pill.current;
    if (!box || !track) return;
    const rect = track.getBoundingClientRect();
    const moveTo = (clientX: number) => {
      const at = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      box.scrollLeft = at * (box.scrollWidth - box.clientWidth);
    };
    moveTo(event.clientX);
    track.setPointerCapture(event.pointerId);
    const move = (e: globalThis.PointerEvent) => moveTo(e.clientX);
    const up = () => { track.removeEventListener("pointermove", move); track.removeEventListener("pointerup", up); };
    track.addEventListener("pointermove", move);
    track.addEventListener("pointerup", up);
  };

  return { frame, pill, thumb, onPillDown };
}
