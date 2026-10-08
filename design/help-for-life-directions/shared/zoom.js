// Pan and zoom for an SVG map by moving its viewBox: the wheel zooms around the pointer, one finger or the mouse drags,
// two fingers pinch, and the page's own buttons call zoomBy / reset / focus. A drag never counts as a click.
window.Zoom = function zoomable(svg, { width, height, max = 10, onChange } = {}) {
  let view = { x: 0, y: 0, w: width, h: height };
  let anim = 0;
  const pointers = new Map();
  let gesture = null, moved = false;

  const clamp = (v) => {
    const w = Math.min(width, Math.max(width / max, v.w)), h = w * (height / width);
    return { w, h, x: Math.min(width - w, Math.max(0, v.x)), y: Math.min(height - h, Math.max(0, v.y)) };
  };
  const apply = () => { svg.setAttribute("viewBox", `${view.x.toFixed(2)} ${view.y.toFixed(2)} ${view.w.toFixed(2)} ${view.h.toFixed(2)}`); onChange?.(width / view.w, view); };
  const toMap = (cx, cy) => { const r = svg.getBoundingClientRect(); return [view.x + ((cx - r.left) / r.width) * view.w, view.y + ((cy - r.top) / r.height) * view.h]; };
  function zoomAt(mx, my, factor) {
    const w = view.w / factor, h = view.h / factor;
    view = clamp({ w, h, x: mx - ((mx - view.x) / view.w) * w, y: my - ((my - view.y) / view.h) * h });
    apply();
  }
  function tween(target, ms = 420) {
    cancelAnimationFrame(anim);
    const from = { ...view }, to = clamp(target), t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms), k = ease(t);
      view = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, w: from.w + (to.w - from.w) * k, h: from.h + (to.h - from.h) * k };
      apply();
      if (t < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    cancelAnimationFrame(anim);
    const [mx, my] = toMap(e.clientX, e.clientY);
    zoomAt(mx, my, Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0018)));
  }, { passive: false });

  svg.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    cancelAnimationFrame(anim);
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    moved = false;
    gesture = pointers.size === 1 ? { kind: "pan", at: [e.clientX, e.clientY], view: { ...view } } : pinchStart();
  });
  function pinchStart() {
    const [a, b] = [...pointers.values()];
    return { kind: "pinch", dist: Math.hypot(a[0] - b[0], a[1] - b[1]), mid: toMap((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), view: { ...view } };
  }
  svg.addEventListener("pointermove", (e) => {
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
      const factor = Math.hypot(a[0] - b[0], a[1] - b[1]) / gesture.dist;
      const w = gesture.view.w / factor, h = gesture.view.h / factor, [mx, my] = gesture.mid;
      view = clamp({ w, h, x: mx - ((mx - gesture.view.x) / gesture.view.w) * w, y: my - ((my - gesture.view.y) / gesture.view.h) * h });
      apply();
    }
  });
  const end = (e) => {
    pointers.delete(e.pointerId);
    delete svg.dataset.dragging;
    gesture = pointers.size === 1 ? { kind: "pan", at: [...pointers.values()][0], view: { ...view } } : null;
  };
  svg.addEventListener("pointerup", end);
  svg.addEventListener("pointercancel", end);
  // A drag that ends over a pin must not open it.
  svg.addEventListener("click", (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);

  apply();
  return {
    zoomBy(f) { const cx = view.x + view.w / 2, cy = view.y + view.h / 2, w = view.w / f; tween({ w, h: w * height / width, x: cx - w / 2, y: cy - (w * height / width) / 2 }, 320); },
    reset() { tween({ x: 0, y: 0, w: width, h: height }); },
    /** Show the box [x0, y0, x1, y1] (map units), with a margin. */
    fit([x0, y0, x1, y1], pad = 0.25) {
      const bw = (x1 - x0) * (1 + pad * 2) || width / max, bh = (y1 - y0) * (1 + pad * 2) || height / max;
      const w = Math.max(bw, bh * width / height), h = w * height / width;
      tween({ w, h, x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2 });
    },
    /** Keep the zoom, bring (x, y) into view if it is near or past the edge. */
    reveal(x, y) {
      const m = 0.12;
      if (x > view.x + view.w * m && x < view.x + view.w * (1 - m) && y > view.y + view.h * m && y < view.y + view.h * (1 - m)) return;
      tween({ ...view, x: x - view.w / 2, y: y - view.h / 2 }, 360);
    },
    get zoom() { return width / view.w; },
  };
};
