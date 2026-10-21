import { useEffect, useRef, type RefObject } from "react";

const MIN_DISTANCE = 60; // px — ignore small or accidental drags
const MAX_VERTICAL_RATIO = 0.5; // vertical drift must stay under half the horizontal distance
const MAX_DURATION = 800; // ms — a slow drag is more likely a text selection than a swipe

/**
 * Swipe left/right on a touch device to go to the next/previous chapter. Only a quick, mostly-horizontal,
 * single-finger gesture counts, and nothing fires while there is a live text selection — so it never fights
 * vertical scrolling or picking a verse.
 */
export function useSwipeNavigation(ref: RefObject<HTMLElement | null>, onSwipeLeft: () => void, onSwipeRight: () => void) {
  const start = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTouchStart = (event: TouchEvent) => {
      start.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY, time: event.timeStamp } : null;
    };

    const onTouchEnd = (event: TouchEvent) => {
      const begin = start.current;
      start.current = null;
      if (!begin || event.changedTouches.length !== 1 || event.touches.length !== 0) return;
      if (window.getSelection()?.toString()) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - begin.x;
      const dy = touch.clientY - begin.y;
      if (event.timeStamp - begin.time > MAX_DURATION) return;
      if (Math.abs(dx) < MIN_DISTANCE) return;
      if (Math.abs(dy) > Math.abs(dx) * MAX_VERTICAL_RATIO) return;
      if (dx < 0) onSwipeLeft();
      else onSwipeRight();
    };

    const onTouchCancel = () => {
      start.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [ref, onSwipeLeft, onSwipeRight]);
}
