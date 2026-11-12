// Timeline sort's controls for the card list (design §9.2–9.4): drag with a finger, mouse or pen, tap to move, and the
// keyboard. Tap and keyboard share one "lifted" card, since Enter on a button also fires its click. Every route ends
// in one call to onMove(from, to), the pure move of sortable.ts, so they cannot disagree.
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

const LONG_PRESS_MS = 300;
const MOUSE_SLOP = 4;
const TOUCH_SLOP = 8;
const EDGE = 48;
const MAX_SCROLL_STEP = 18;

interface Session {
  pointerId: number;
  from: number;
  startY: number;
  startX: number;
  startScroll: number;
  pointerY: number;
  /** Where every card's middle sat when the drag began, in page coordinates. */
  middles: number[];
  height: number;
  dragging: boolean;
  /** Started on the grip: the click that follows a drop lands on the grip, not the card, so no tap needs eating. */
  fromHandle: boolean;
  timer: number | null;
  element: HTMLElement;
}

export interface DragView { from: number; target: number; dy: number; height: number }

export function useSortable({ count, disabled, onMove }: { count: number; disabled: boolean; onMove: (from: number, to: number) => void }) {
  const [lifted, setLifted] = useState<{ at: number; origin: number } | null>(null);
  const [drag, setDrag] = useState<DragView | null>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const list = useRef<HTMLOListElement>(null);
  const session = useRef<Session | null>(null);
  const suppressClick = useRef(false);
  const frame = useRef<number | null>(null);

  const targetOf = (s: Session) => {
    const centre = s.middles[s.from] + (s.pointerY + window.scrollY) - (s.startY + s.startScroll);
    let target = 0;
    s.middles.forEach((middle, i) => { if (i !== s.from && middle < centre) target++; });
    return { target, dy: centre - s.middles[s.from] };
  };
  const refresh = useCallback(() => {
    const s = session.current;
    if (!s?.dragging) return;
    const { target, dy } = targetOf(s);
    setDrag({ from: s.from, target, dy, height: s.height });
  }, []);

  const end = useCallback((commit: boolean) => {
    const s = session.current;
    if (!s) return;
    if (s.timer !== null) window.clearTimeout(s.timer);
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    session.current = null;
    try { if (s.element.hasPointerCapture?.(s.pointerId)) s.element.releasePointerCapture(s.pointerId); } catch { /* already released */ }
    if (s.dragging) {
      if (!s.fromHandle) suppressClick.current = true; // the click that follows a drop on the card itself is not a tap
      const { target } = targetOf(s);
      if (commit && target !== s.from) onMove(s.from, target);
    }
    setDrag(null);
  }, [onMove]);

  // Near the top or bottom of the screen the page scrolls, faster the deeper the pointer is in the band; the card's
  // place is worked out again on every step, so it stays under a finger that is holding still (§9.2).
  const autoScroll = useCallback(() => {
    const s = session.current;
    if (!s?.dragging) { frame.current = null; return; }
    const y = s.pointerY;
    const step = y < EDGE ? -Math.ceil(((EDGE - y) / EDGE) * MAX_SCROLL_STEP) : y > window.innerHeight - EDGE ? Math.ceil(((y - (window.innerHeight - EDGE)) / EDGE) * MAX_SCROLL_STEP) : 0;
    if (step) { window.scrollBy(0, step); refresh(); }
    frame.current = requestAnimationFrame(autoScroll);
  }, [refresh]);

  const begin = useCallback((s: Session) => {
    s.dragging = true;
    s.timer = null;
    try { s.element.setPointerCapture(s.pointerId); } catch { /* the pointer is already gone */ }
    setLifted(null);
    refresh();
    frame.current ??= requestAnimationFrame(autoScroll);
  }, [autoScroll, refresh]);

  const start = useCallback((event: ReactPointerEvent<HTMLElement>, from: number, fromHandle: boolean) => {
    if (disabled || session.current || (event.pointerType === "mouse" && event.button !== 0)) return; // one pointer at a time
    suppressClick.current = false; // a new gesture: a stale flag from an earlier drop must not eat this tap (the audit's fault)
    const middles = items.current.slice(0, count).map((item) => { const r = item?.getBoundingClientRect(); return r ? r.top + r.height / 2 + window.scrollY : 0; });
    const rect = items.current[from]?.getBoundingClientRect();
    const s: Session = { pointerId: event.pointerId, from, startY: event.clientY, startX: event.clientX, startScroll: window.scrollY, pointerY: event.clientY,
      middles, height: (rect?.height ?? 56) + 8, dragging: false, fromHandle, timer: null, element: event.currentTarget };
    session.current = s;
    if (fromHandle) { event.preventDefault(); begin(s); return; }
    if (event.pointerType !== "mouse") {
      s.timer = window.setTimeout(() => { navigator.vibrate?.(15); begin(s); }, LONG_PRESS_MS);
    }
  }, [begin, count, disabled]);

  useEffect(() => {
    const onMovePointer = (event: PointerEvent) => {
      const s = session.current;
      if (!s || event.pointerId !== s.pointerId) return;
      s.pointerY = event.clientY;
      const moved = Math.hypot(event.clientX - s.startX, event.clientY - s.startY);
      if (!s.dragging) {
        if (event.pointerType === "mouse" && moved > MOUSE_SLOP) begin(s);
        else if (event.pointerType !== "mouse" && moved > TOUCH_SLOP) end(false); // a finger meant to scroll the page
        return;
      }
      refresh();
    };
    const onUp = (event: PointerEvent) => { if (session.current?.pointerId === event.pointerId) end(true); };
    const onCancel = (event: PointerEvent) => { if (session.current?.pointerId === event.pointerId) end(false); };
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape" && session.current?.dragging) end(false); };
    // React's touch handlers are passive, so they cannot keep the page still; this one does, only once a long-press
    // has armed a drag, so the browser does not take the move as a scroll and cancel the drag (§9.2).
    const onTouchMove = (event: TouchEvent) => { if (session.current?.dragging) event.preventDefault(); };
    const listElement = list.current;
    window.addEventListener("pointermove", onMovePointer);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
    listElement?.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("pointermove", onMovePointer);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
      listElement?.removeEventListener("touchmove", onTouchMove);
    };
  }, [begin, end, refresh]);

  useEffect(() => () => { if (session.current) end(false); }, [end]);
  useEffect(() => { if (disabled) setLifted(null); }, [disabled]);

  // Tapping anywhere outside the list puts a lifted card down where it is (§9.3).
  useEffect(() => {
    if (!lifted) return;
    const onDown = (event: PointerEvent) => { if (!list.current?.contains(event.target as Node)) setLifted(null); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [lifted]);

  /** A tap or Enter/Space on card `i`: lift it, put it down, or move the lifted card into its slot. */
  const tap = useCallback((i: number) => {
    if (suppressClick.current) { suppressClick.current = false; return; }
    if (disabled) return;
    if (!lifted) setLifted({ at: i, origin: i });
    else if (lifted.at === i) setLifted(null);
    else { onMove(lifted.at, i); setLifted(null); }
  }, [disabled, lifted, onMove]);

  /** Move the lifted card one slot up (-1) or down (+1); it stays lifted. */
  const nudge = useCallback((direction: -1 | 1) => {
    if (!lifted) return;
    const to = lifted.at + direction;
    if (to < 0 || to >= count) return;
    onMove(lifted.at, to);
    setLifted({ ...lifted, at: to });
  }, [count, lifted, onMove]);

  const keyDown = useCallback((event: KeyboardEvent, i: number) => {
    if (!lifted || lifted.at !== i) return;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); nudge(event.key === "ArrowUp" ? -1 : 1); }
    else if (event.key === "Escape") {
      event.preventDefault();
      if (lifted.at !== lifted.origin) onMove(lifted.at, lifted.origin); // cancelled: back where it was picked up
      setLifted(null);
    }
  }, [lifted, nudge, onMove]);

  return { items, list, lifted: lifted?.at ?? null, drag, start, tap, nudge, keyDown, putDown: () => setLifted(null) };
}

/** How far card `i` is shifted while another is dragged, so the others slide aside to show where it will land. */
export function shiftOf(drag: DragView | null, i: number): number {
  if (!drag) return 0;
  if (i === drag.from) return drag.dy;
  if (drag.from < drag.target && i > drag.from && i <= drag.target) return -drag.height;
  if (drag.target < drag.from && i >= drag.target && i < drag.from) return drag.height;
  return 0;
}
