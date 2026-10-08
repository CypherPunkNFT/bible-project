// Pan and zoom for an SVG map by moving its viewBox: the wheel zooms around the pointer, one finger or the mouse drags,
// two fingers pinch, and the page's own buttons call zoomBy / reset / fit. A drag never counts as a click. The viewBox
// is written straight to the element (React renders it once and never again), so a wheel turn re-renders nothing.

export interface Zoom {
  zoomBy(factor: number): void;
  reset(): void;
  /** Show the box [x0, y0, x1, y1] (map units), with a margin. */
  fit(box: [number, number, number, number], pad?: number): void;
  /** Keep the zoom, bring (x, y) into view if it is near or past the edge. */
  reveal(x: number, y: number): void;
  destroy(): void;
}

interface View { x: number; y: number; w: number; h: number }
type Gesture = { kind: "pan"; at: [number, number]; view: View } | { kind: "pinch"; dist: number; mid: [number, number]; view: View } | null;

export function attachZoom(svg: SVGSVGElement, { width, height, max = 10, onChange }: { width: number; height: number; max?: number; onChange?: (zoom: number) => void }): Zoom {
  let view: View = { x: 0, y: 0, w: width, h: height };
  let anim = 0, moved = false, gesture: Gesture = null;
  const pointers = new Map<number, [number, number]>();

  const clamp = (v: View): View => {
    const w = Math.min(width, Math.max(width / max, v.w)), h = w * (height / width);
    return { w, h, x: Math.min(width - w, Math.max(0, v.x)), y: Math.min(height - h, Math.max(0, v.y)) };
  };
  const apply = () => { svg.setAttribute("viewBox", `${view.x.toFixed(2)} ${view.y.toFixed(2)} ${view.w.toFixed(2)} ${view.h.toFixed(2)}`); onChange?.(width / view.w); };
  const toMap = (cx: number, cy: number): [number, number] => { const r = svg.getBoundingClientRect(); return [view.x + ((cx - r.left) / r.width) * view.w, view.y + ((cy - r.top) / r.height) * view.h]; };
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function tween(target: View, ms = 420) {
    cancelAnimationFrame(anim);
    const from = { ...view }, to = clamp(target), t0 = performance.now();
    if (reduced()) { view = to; apply(); return; }
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms), k = 1 - Math.pow(1 - t, 3);
      view = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, w: from.w + (to.w - from.w) * k, h: from.h + (to.h - from.h) * k };
      apply();
      if (t < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  const zoomAround = (mx: number, my: number, base: View, factor: number) => {
    const w = base.w / factor, h = base.h / factor;
    return clamp({ w, h, x: mx - ((mx - base.x) / base.w) * w, y: my - ((my - base.y) / base.h) * h });
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    cancelAnimationFrame(anim);
    const [mx, my] = toMap(e.clientX, e.clientY);
    view = zoomAround(mx, my, view, Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0018)));
    apply();
  };
  const pinchStart = (): Gesture => {
    const [a, b] = [...pointers.values()];
    return { kind: "pinch", dist: Math.hypot(a[0] - b[0], a[1] - b[1]), mid: toMap((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), view: { ...view } };
  };
  const onDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    cancelAnimationFrame(anim);
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    moved = false;
    gesture = pointers.size === 1 ? { kind: "pan", at: [e.clientX, e.clientY], view: { ...view } } : pinchStart();
  };
  const onMove = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId) || !gesture) return;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    const r = svg.getBoundingClientRect();
    if (gesture.kind === "pan") {
      const dx = e.clientX - gesture.at[0], dy = e.clientY - gesture.at[1];
      if (!moved && Math.hypot(dx, dy) < 4) return;
      if (!moved) svg.setPointerCapture(e.pointerId);
      moved = true;
      view = clamp({ ...gesture.view, x: gesture.view.x - (dx / r.width) * gesture.view.w, y: gesture.view.y - (dy / r.height) * gesture.view.h });
      svg.dataset.dragging = "";
      apply();
    } else if (pointers.size === 2) {
      moved = true;
      const [a, b] = [...pointers.values()];
      view = zoomAround(gesture.mid[0], gesture.mid[1], gesture.view, Math.hypot(a[0] - b[0], a[1] - b[1]) / gesture.dist);
      apply();
    }
  };
  const onEnd = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    delete svg.dataset.dragging;
    gesture = pointers.size === 1 ? { kind: "pan", at: [...pointers.values()][0], view: { ...view } } : null;
  };
  // A drag that ends over a pin must not open it.
  const onClick = (e: MouseEvent) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } };

  svg.addEventListener("wheel", onWheel, { passive: false });
  svg.addEventListener("pointerdown", onDown);
  svg.addEventListener("pointermove", onMove);
  svg.addEventListener("pointerup", onEnd);
  svg.addEventListener("pointercancel", onEnd);
  svg.addEventListener("click", onClick, true);
  apply();

  return {
    zoomBy(f) { const cx = view.x + view.w / 2, cy = view.y + view.h / 2, w = view.w / f, h = w * (height / width); tween({ w, h, x: cx - w / 2, y: cy - h / 2 }, 320); },
    reset() { tween({ x: 0, y: 0, w: width, h: height }); },
    fit([x0, y0, x1, y1], pad = 0.25) {
      const bw = (x1 - x0) * (1 + pad * 2) || width / max, bh = (y1 - y0) * (1 + pad * 2) || height / max;
      const w = Math.max(bw, (bh * width) / height), h = (w * height) / width;
      tween({ w, h, x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2 });
    },
    reveal(x, y) {
      const m = 0.12;
      if (x > view.x + view.w * m && x < view.x + view.w * (1 - m) && y > view.y + view.h * m && y < view.y + view.h * (1 - m)) return;
      tween({ ...view, x: x - view.w / 2, y: y - view.h / 2 }, 360);
    },
    destroy() {
      cancelAnimationFrame(anim);
      svg.removeEventListener("wheel", onWheel);
      svg.removeEventListener("pointerdown", onDown);
      svg.removeEventListener("pointermove", onMove);
      svg.removeEventListener("pointerup", onEnd);
      svg.removeEventListener("pointercancel", onEnd);
      svg.removeEventListener("click", onClick, true);
    },
  };
}

/** Labels and markers keep their size on screen: each `.lf-mark` is scaled by the map units per pixel. Returns that scale. */
export function placeMarks(svg: SVGSVGElement, width: number): number {
  const px = svg.viewBox.baseVal.width / (svg.getBoundingClientRect().width || width);
  svg.querySelectorAll<SVGGElement>(".lf-mark").forEach((g) => g.setAttribute("transform", `translate(${g.dataset.x} ${g.dataset.y}) scale(${px})`));
  svg.dataset.px = String(px);
  return px;
}
