import { useEffect, useRef, type PointerEvent } from "react";

/**
 * Scrolling down the page moves a wide track sideways while its box is held under the site header (owner, 2026-10-07):
 * one pixel down is one pixel across, then the page carries on. A pill under the track shows where you are and can be
 * dragged (or its track clicked); it moves the page, which moves the track.
 *
 * `stage` is the tall outer box (the held box's height plus the sideways distance), `box` the sticky box that clips,
 * `track` the wide content, `pill` the pill's track and `thumb` the pill. The track moves by transform, set directly,
 * so the page is not re-rendered while scrolling.
 */
export function useSideScroll() {
  const stage = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const distance = useRef(0);
  const progress = useRef(0);

  useEffect(() => {
    let frame = 0;
    const heldAt = () => parseFloat(getComputedStyle(box.current!).top) || 0;
    const update = () => {
      frame = 0;
      if (!stage.current || !track.current) return;
      const reach = distance.current;
      progress.current = reach ? Math.min(1, Math.max(0, (heldAt() - stage.current.getBoundingClientRect().top) / reach)) : 0;
      track.current.style.transform = `translateX(${-progress.current * reach}px)`;
      if (thumb.current && box.current) {
        const shown = Math.min(1, box.current.clientWidth / track.current.scrollWidth);
        thumb.current.style.width = `${shown * 100}%`;
        thumb.current.style.left = `${progress.current * (1 - shown) * 100}%`;
      }
    };
    const measure = () => {
      if (!stage.current || !box.current || !track.current) return;
      distance.current = Math.max(0, track.current.scrollWidth - box.current.clientWidth);
      stage.current.style.height = `${box.current.offsetHeight + distance.current}px`;
      update();
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    measure();
    const observer = new ResizeObserver(measure);
    if (box.current) observer.observe(box.current);
    if (track.current) observer.observe(track.current);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);

  /** Move the page so the track shows `to` (0 = the start, 1 = the end). */
  const travel = (to: number) => {
    if (!stage.current || !box.current) return;
    const clamped = Math.min(1, Math.max(0, to));
    const held = parseFloat(getComputedStyle(box.current).top) || 0;
    window.scrollTo({ top: window.scrollY + stage.current.getBoundingClientRect().top - held + clamped * distance.current, behavior: "instant" });
  };

  /** Drag the pill, or click its track to jump there. */
  const onPillDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!pill.current || !thumb.current) return;
    const bar = pill.current.getBoundingClientRect(), knob = thumb.current.getBoundingClientRect();
    const room = Math.max(1, bar.width - knob.width);
    const jump = event.target !== thumb.current ? Math.min(1, Math.max(0, (event.clientX - bar.left - knob.width / 2) / room)) : null;
    if (jump !== null) travel(jump);
    const startX = event.clientX, start = jump ?? progress.current;
    pill.current.setPointerCapture(event.pointerId);
    const move = (next: globalThis.PointerEvent) => travel(start + (next.clientX - startX) / room);
    const up = () => { pill.current?.removeEventListener("pointermove", move); pill.current?.removeEventListener("pointerup", up); pill.current?.removeEventListener("pointercancel", up); };
    pill.current.addEventListener("pointermove", move);
    pill.current.addEventListener("pointerup", up);
    pill.current.addEventListener("pointercancel", up);
  };

  return { stage, box, track, pill, thumb, onPillDown };
}
