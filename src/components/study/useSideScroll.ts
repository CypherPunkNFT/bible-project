import { useEffect, useRef, type PointerEvent } from "react";

/**
 * A wide timeline that the page's downward scroll travels through once (owner, 2026-10-07). The section stays in the
 * page with its content right below it. Scrolling down, the page reaches the stop (the section's top just under the site
 * header, or higher if the timeline would run off the screen), then the same scroll carries the timeline sideways to its
 * end, then the page goes on. Only on the way down, and only once per page load: scrolling up is always the page, and
 * once the timeline has been travelled the page never holds again. Touch screens swipe the timeline.
 *
 * Near the stop on the way down, this hook drives the page itself and the timeline as one eased path (page, then
 * timeline, then page), so the browser's own smooth scrolling never overshoots the stop and has to be pulled back.
 * A pill under the timeline (no arrows) shows where you are and can be dragged, or its track clicked.
 *
 * `anchor` is the section that stops, `box` the sideways scroller, `pill` the pill's track and `thumb` the pill.
 */
export function useSideScroll() {
  const anchor = useRef<HTMLElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const stopGlide = useRef(() => {});

  useEffect(() => {
    const scroller = box.current, section = anchor.current;
    if (!scroller || !section) return;
    /** How far before the stop (page pixels) the hook takes over a downward scroll, so it can arrive without overshooting. */
    const APPROACH = 700;
    const sync = () => {
      const reach = scroller.scrollWidth - scroller.clientWidth;
      const shown = Math.min(1, scroller.clientWidth / Math.max(1, scroller.scrollWidth));
      const at = reach > 0 ? scroller.scrollLeft / reach : 0;
      if (thumb.current) { thumb.current.style.width = `${shown * 100}%`; thumb.current.style.left = `${at * (1 - shown) * 100}%`; }
    };
    const reachOf = () => Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    /** The page scroll position at which the section sits at its stop. */
    const pageAtStop = () => {
      const header = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
      const top = section.getBoundingClientRect().top;
      const tall = (pill.current ?? scroller).getBoundingClientRect().bottom - top;
      return window.scrollY + top - Math.min(header + 12, window.innerHeight - 20 - tall);
    };

    let lastWheel = -Infinity; // when the wheel last moved, to tell its glide from other scrolling
    let done = false; // the timeline has been travelled: from now on the page scrolls normally
    // One path for page and timeline: positions up to P are the page, the next stretch is the timeline from where it
    // already is (B) to its end (R), then the page again.
    let current = 0, target = 0, frame = 0, P = 0, R = 0, B = 0;
    const place = (v: number) => {
      const rest = R - B;
      const page = v <= P ? v : v <= P + rest ? P : v - rest;
      if (Math.abs(window.scrollY - page) > .5) window.scrollTo({ top: page, behavior: "instant" });
      scroller.scrollLeft = Math.min(R, B + Math.max(0, v - P));
      if (v >= P + rest - 1) done = true;
    };
    const ease = () => {
      const gap = target - current;
      if (Math.abs(gap) <= 1) { current = target; place(current); frame = 0; return; }
      current += Math.sign(gap) * Math.max(1, Math.abs(gap) * .2);
      place(current);
      frame = requestAnimationFrame(ease);
    };
    const halt = () => { cancelAnimationFrame(frame); frame = 0; };
    stopGlide.current = halt;

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return; // pinch zoom and sideways swipes stay native
      const dy = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * window.innerHeight : event.deltaY;
      lastWheel = performance.now();
      if (dy <= 0) { halt(); return; } // up: always the page, as usual
      if (done && !frame) return;
      if (!frame) {
        R = reachOf(); P = pageAtStop(); B = scroller.scrollLeft; // the timeline carries on from where it is
        const y = window.scrollY;
        if (R <= 0 || y < P - APPROACH || y > P + .5) return; // far from the stop, or already past it: the page as usual
        current = Math.min(y, P);
      }
      event.preventDefault();
      const end = document.documentElement.scrollHeight - window.innerHeight + R - B;
      target = Math.min(end, target > current && frame ? target + dy : current + dy);
      if (!frame) frame = requestAnimationFrame(ease);
    };
    // A scroll the hook did not start is left alone, except that the browser's downward glide after a wheel step is not
    // allowed to run past the stop before the timeline has been travelled: it stops there.
    let lastY = window.scrollY;
    const onPageScroll = () => {
      const y = window.scrollY;
      // Only the browser's glide straight after a wheel step; touch, keys, the scrollbar and links pass freely.
      if (!frame && !done && y > lastY && performance.now() - lastWheel < 600) {
        const stop = pageAtStop();
        if (lastY <= stop + .5 && y > stop + .5 && reachOf() > 0) window.scrollTo({ top: stop, behavior: "instant" });
      }
      lastY = window.scrollY;
    };

    sync();
    scroller.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(scroller);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onPageScroll, { passive: true });
    return () => {
      halt();
      scroller.removeEventListener("scroll", sync); observer.disconnect();
      window.removeEventListener("wheel", onWheel); window.removeEventListener("scroll", onPageScroll);
    };
  }, []);

  /** Drag the pill, or click its track to jump there. */
  const onPillDown = (event: PointerEvent<HTMLDivElement>) => {
    const scroller = box.current, bar = pill.current?.getBoundingClientRect(), knob = thumb.current?.getBoundingClientRect();
    if (!scroller || !bar || !knob || !pill.current) return;
    stopGlide.current(); // the pill moves the timeline directly
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
