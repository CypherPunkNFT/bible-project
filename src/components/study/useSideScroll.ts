import { useEffect, useRef, type PointerEvent } from "react";

/**
 * A wide timeline that the page's scroll travels through (owner, 2026-10-07). The section stays where it is in the page,
 * with its content right below it. When the page reaches the stop (the section's top just under the site header, or
 * higher if the timeline would otherwise run off the bottom of the screen), the scroll wheel moves the timeline sideways
 * instead of the page; at either end of the timeline the page scrolls on as usual. Touch screens swipe the timeline.
 * A pill under it (no arrows) shows where you are and can be dragged, or its track clicked.
 *
 * `anchor` is the section that stops, `box` the sideways scroller, `pill` the pill's track and `thumb` the pill.
 */
export function useSideScroll() {
  const anchor = useRef<HTMLElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const scroller = box.current, section = anchor.current;
    if (!scroller || !section) return;
    const sync = () => {
      const reach = scroller.scrollWidth - scroller.clientWidth;
      const shown = Math.min(1, scroller.clientWidth / Math.max(1, scroller.scrollWidth));
      const at = reach > 0 ? scroller.scrollLeft / reach : 0;
      if (thumb.current) { thumb.current.style.width = `${shown * 100}%`; thumb.current.style.left = `${at * (1 - shown) * 100}%`; }
    };
    /** Where the section's top stops: just under the site header, or higher so the pill stays on screen. */
    const stopAt = () => {
      const header = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
      const tall = (pill.current ?? scroller).getBoundingClientRect().bottom - section.getBoundingClientRect().top;
      return Math.min(header + 12, window.innerHeight - 20 - tall);
    };
    // Browsers animate each wheel step, so the page can still be gliding when the stop is reached: a glide that carries
    // the section past its stop while the timeline has further to go is pulled back to the stop.
    const GLIDE = 450;
    let lastWheel = 0, direction = 0;
    const toStop = (top: number, stop: number) => { if (Math.abs(top - stop) > .5) window.scrollBy({ top: top - stop, behavior: "instant" }); };
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return; // pinch zoom and sideways swipes stay native
      const reach = scroller.scrollWidth - scroller.clientWidth;
      if (reach <= 0) return;
      const dy = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * window.innerHeight : event.deltaY;
      lastWheel = performance.now(); direction = Math.sign(dy);
      const stop = stopAt(), top = section.getBoundingClientRect().top;
      const forward = dy > 0 && scroller.scrollLeft < reach - .5, backward = dy < 0 && scroller.scrollLeft > .5;
      if (!forward && !backward) return; // at the end the timeline lets the page go
      // At the stop, or just past it in the direction of travel (a glide overshot): hold the page there, move the timeline.
      const held = forward ? top <= stop + 1 && top > stop - GLIDE : top >= stop - 1 && top < stop + GLIDE;
      if (held) { event.preventDefault(); toStop(top, stop); scroller.scrollLeft += dy; return; }
      // Arriving at the stop within this step: scroll the page exactly to it and give the rest to the timeline.
      const crossing = forward ? top > stop && top - dy < stop : top < stop && top - dy > stop;
      if (!crossing) return;
      event.preventDefault();
      toStop(top, stop);
      scroller.scrollLeft += dy - (top - stop);
    };
    const onPageScroll = () => {
      if (performance.now() - lastWheel > 600 || !direction) return; // only the glide after a wheel step, never the scrollbar or keys
      const reach = scroller.scrollWidth - scroller.clientWidth, stop = stopAt(), top = section.getBoundingClientRect().top;
      const past = direction > 0 ? top < stop - .5 && top > stop - GLIDE && scroller.scrollLeft < reach - .5 : top > stop + .5 && top < stop + GLIDE && scroller.scrollLeft > .5;
      if (past) { scroller.scrollLeft += direction > 0 ? stop - top : -(top - stop); toStop(top, stop); }
    };
    window.addEventListener("scroll", onPageScroll, { passive: true });
    sync();
    scroller.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(scroller);
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => { scroller.removeEventListener("scroll", sync); observer.disconnect(); window.removeEventListener("wheel", onWheel); window.removeEventListener("scroll", onPageScroll); };
  }, []);

  /** Drag the pill, or click its track to jump there. */
  const onPillDown = (event: PointerEvent<HTMLDivElement>) => {
    const scroller = box.current, bar = pill.current?.getBoundingClientRect(), knob = thumb.current?.getBoundingClientRect();
    if (!scroller || !bar || !knob || !pill.current) return;
    const reach = scroller.scrollWidth - scroller.clientWidth, room = Math.max(1, bar.width - knob.width);
    const goTo = (at: number) => { scroller.scrollLeft = Math.min(1, Math.max(0, at)) * reach; };
    const jump = event.target !== thumb.current ? (event.clientX - bar.left - knob.width / 2) / room : null;
    if (jump !== null) goTo(jump);
    const startX = event.clientX, start = jump ?? scroller.scrollLeft / Math.max(1, reach);
    pill.current.setPointerCapture(event.pointerId);
    const move = (next: globalThis.PointerEvent) => goTo(start + (next.clientX - startX) / room);
    const up = () => { pill.current?.removeEventListener("pointermove", move); pill.current?.removeEventListener("pointerup", up); pill.current?.removeEventListener("pointercancel", up); };
    pill.current.addEventListener("pointermove", move);
    pill.current.addEventListener("pointerup", up);
    pill.current.addEventListener("pointercancel", up);
  };

  return { anchor, box, pill, thumb, onPillDown };
}
