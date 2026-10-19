// The "Where are they now?" map's zoom and pan (approved mock-up: js/places.js), done by rewriting the SVG's viewBox. The
// opening view fits every city with a margin; zooming never goes further out than the whole map, nor further in than
// MAX_ZOOM times the opening view. Dots and names keep their size on screen at every zoom (dots grow a little as you
// zoom in), and names never overlap a bigger city's dot or another name. Scroll zooms around the pointer, dragging
// moves, two fingers pinch; plus, minus, 0 and the arrow keys do the same. The chosen city radiates.
import type { MsMap } from "@/lib/manuscripts";
import { reducedMotion } from "./model";

const DRAG = 6; // pixels of movement before a press becomes a drag rather than a click
const MAX_ZOOM = 14;
const CHAR_W = 0.56, LABEL_PX = 13; // a name's width on screen is about its letters × CHAR_W × the font size
const NS = "http://www.w3.org/2000/svg";
interface Box { x: number; y: number; w: number; h: number }
interface Rect { x0: number; x1: number; y0: number; y1: number; rank?: number }

export interface MapZoom { focusCity: (name: string) => void; stopPulse: () => void; dragged: () => boolean; destroy: () => void }

export function mountMapZoom(view: HTMLElement, svg: SVGSVGElement, P: MsMap): MapZoom {
  const cities = [...svg.querySelectorAll<SVGGElement>(".pl-city")];
  const num = (g: SVGGElement, key: string) => Number(g.dataset[key]);
  const xs = cities.map((g) => num(g, "x")), ys = cities.map((g) => num(g, "y"));
  const box = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  let vb: Box = { x: 0, y: 0, w: P.w, h: P.h }, fitWidth = 0, dragged = false;
  const aspect = () => view.clientWidth / Math.max(1, view.clientHeight);
  const pad = () => [(box.x1 - box.x0) * 0.08 + 30, (box.y1 - box.y0) * 0.12 + 30];

  /** The frame is as tall as the fitted land needs (so no empty page shows above or below it), within sensible limits. */
  function sizeFrame() {
    const [padX, padY] = pad();
    const landAspect = Math.min(P.w, box.x1 - box.x0 + 2 * padX) / Math.min(P.h, box.y1 - box.y0 + 2 * padY);
    view.style.height = `${Math.round(Math.max(view.clientWidth < 640 ? 220 : 320, Math.min(640, view.clientWidth / landAspect)))}px`;
  }
  function fit(): Box {
    const [padX, padY] = pad();
    let w = Math.min(P.w, box.x1 - box.x0 + 2 * padX), h = Math.min(P.h, box.y1 - box.y0 + 2 * padY);
    if (w / h < aspect()) w = h * aspect(); else h = w / aspect();
    fitWidth = w;
    return clampBox({ x: (box.x0 + box.x1) / 2 - w / 2, y: (box.y0 + box.y1) / 2 - h / 2, w, h });
  }
  function clampBox(b: Box): Box {
    const maxW = Math.max(P.w, fitWidth || P.w), minW = (fitWidth || P.w) / MAX_ZOOM;
    const w = Math.min(maxW, Math.max(minW, b.w)), h = w / aspect();
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const x = w >= P.w ? (P.w - w) / 2 : Math.min(P.w - w, Math.max(0, cx - w / 2));
    const y = h >= P.h ? (P.h - h) / 2 : Math.min(P.h - h, Math.max(0, cy - h / 2));
    return { x, y, w, h };
  }
  function apply() {
    svg.setAttribute("viewBox", `${vb.x.toFixed(2)} ${vb.y.toFixed(2)} ${vb.w.toFixed(2)} ${vb.h.toFixed(2)}`);
    const unit = vb.w / view.clientWidth, zoom = fitWidth / vb.w, grow = Math.min(1.8, zoom ** 0.25);
    svg.style.setProperty("--u", unit.toFixed(4));
    view.classList.toggle("is-zoomed", zoom > 1.02);
    const placed: Rect[] = [];
    // A label may sit over the dot of a smaller city, never over a bigger city's dot or another label (labels have no rank).
    const hits = (a: Rect, rank: number) => placed.some((b) => (b.rank === undefined || b.rank < rank) && a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0);
    for (const [rank, g] of cities.entries()) { // biggest cities first: cityTable() sorts by record count
      const x = num(g, "x"), y = num(g, "y"), r = num(g, "r") * 0.62 * unit * grow;
      g.firstElementChild?.setAttribute("r", r.toFixed(2));
      placed.push({ x0: x - r, x1: x + r, y0: y - r, y1: y + r, rank });
    }
    for (const [rank, g] of cities.entries()) {
      const x = num(g, "x"), y = num(g, "y"), r = Number(g.firstElementChild?.getAttribute("r"));
      const text = g.lastElementChild as SVGTextElement, gap = r + 4 * unit, w = (text.textContent ?? "").length * CHAR_W * LABEL_PX * unit, h = LABEL_PX * unit;
      const options: Record<string, [number, number, string]> = { e: [x + gap, y + 4 * unit, "start"], w: [x - gap, y + 4 * unit, "end"], s: [x, y + gap + 10 * unit, "middle"], n: [x, y - gap, "middle"] };
      const order = [g.dataset.side ?? "e", "e", "w", "n", "s"].filter((s, i, all) => all.indexOf(s) === i);
      let chosen: { tx: number; ty: number; anchor: string; rect: Rect } | null = null;
      for (const side of order) {
        const [tx, ty, anchor] = options[side];
        const x0 = anchor === "start" ? tx : anchor === "end" ? tx - w : tx - w / 2, rect = { x0, x1: x0 + w, y0: ty - h * 0.8, y1: ty + h * 0.25 };
        const inside = x0 >= vb.x && x0 + w <= vb.x + vb.w && rect.y0 >= vb.y && rect.y1 <= vb.y + vb.h;
        if (!hits(rect, rank) && inside) { chosen = { tx, ty, anchor, rect }; break; }
      }
      text.style.display = chosen ? "" : "none";
      if (!chosen) continue;
      placed.push(chosen.rect);
      text.setAttribute("x", chosen.tx.toFixed(2)); text.setAttribute("y", chosen.ty.toFixed(2)); text.setAttribute("text-anchor", chosen.anchor);
    }
    drawPulse();
  }

  // The chosen city radiates: two rings widening from its dot and fading, again and again, sized on screen.
  const pulseLayer = svg.querySelector<SVGGElement>(".pl-pulse");
  let pulsing: string | null = null;
  function drawPulse() {
    if (!pulseLayer) return;
    const g = pulsing ? cities.find((c) => c.dataset.city === pulsing) : undefined;
    if (!g) { pulseLayer.replaceChildren(); return; }
    const x = g.dataset.x ?? "0", y = g.dataset.y ?? "0", r0 = Number(g.firstElementChild?.getAttribute("r")), unit = vb.w / view.clientWidth;
    const r1 = r0 + 30 * unit, width = (1.4 * unit).toFixed(3);
    pulseLayer.replaceChildren(...[0, 0.9].map((begin) => {
      const circle = document.createElementNS(NS, "circle");
      for (const [k, v] of Object.entries({ cx: x, cy: y, r: r0.toFixed(2), "stroke-width": width, style: "stroke: var(--tone-pulse, var(--prophets))" })) circle.setAttribute(k, v);
      for (const [attributeName, values] of [["r", `${r0.toFixed(2)};${r1.toFixed(2)}`], ["opacity", ".75;0"]]) {
        const animate = document.createElementNS(NS, "animate");
        for (const [k, v] of Object.entries({ attributeName, values, dur: "1.8s", begin: `${begin}s`, repeatCount: "indefinite" })) animate.setAttribute(k, v);
        circle.append(animate);
      }
      return circle;
    }));
    pulseLayer.style.setProperty("--tone-pulse", g.style.getPropertyValue("--tone"));
  }

  // Glide towards a city: most of the way to centring it, not all, and a little closer in if the map is wide open.
  let glide = 0;
  function focusCity(name: string) {
    const g = cities.find((c) => c.dataset.city === name);
    if (!g) { console.error(`Where are they now: no dot for "${name}" to move to`); return; }
    pulsing = name;
    const from = { ...vb }, zoom = fitWidth / vb.w, w = zoom < 1.5 ? fitWidth / 1.5 : vb.w, h = w / aspect();
    const cx0 = vb.x + vb.w / 2, cy0 = vb.y + vb.h / 2, x = num(g, "x"), y = num(g, "y");
    // The city panel covers the right of the screen on wide screens: aim for the middle of what is left uncovered.
    const rect = view.getBoundingClientRect(), covered = innerWidth > 720 ? Math.max(0, rect.right - (innerWidth - Math.min(440, innerWidth))) : 0;
    const unitTo = w / view.clientWidth, shift = (covered / 2) * unitTo;
    const to = clampBox({ x: cx0 + (x - cx0) * 0.8 - w / 2, y: cy0 + (y - cy0) * 0.8 - h / 2, w, h });
    // Past the land's eastern edge only by as much as the panel covers, so what shows is never empty map.
    if (covered) to.x = Math.min(to.x + shift * 2, Math.max(to.x, x - (w - covered * unitTo) / 2), P.w - w + covered * unitTo);
    const still = reducedMotion(), start = performance.now(), ms = 700;
    cancelAnimationFrame(glide);
    const step = (now: number) => {
      const t = still ? 1 : Math.min(1, (now - start) / ms), k = 1 - (1 - t) ** 3;
      vb = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, w: from.w + (to.w - from.w) * k, h: from.h + (to.h - from.h) * k };
      apply();
      if (t < 1) glide = requestAnimationFrame(step);
    };
    glide = requestAnimationFrame(step);
  }

  function zoomAt(factor: number, px: number, py: number) {
    const b = view.getBoundingClientRect(), fx = (px - b.left) / b.width, fy = (py - b.top) / b.height;
    const w = vb.w / factor, h = vb.h / factor;
    vb = clampBox({ x: vb.x + (vb.w - w) * fx, y: vb.y + (vb.h - h) * fy, w, h });
    apply();
  }
  function panBy(dxPx: number, dyPx: number) {
    const unit = vb.w / view.clientWidth;
    vb = clampBox({ ...vb, x: vb.x - dxPx * unit, y: vb.y - dyPx * unit });
    apply();
  }

  const stop = new AbortController(), on = { signal: stop.signal };
  view.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomAt(Math.exp(-delta * 0.0018), e.clientX, e.clientY);
  }, { passive: false, signal: stop.signal });

  const pointers = new Map<number, { x: number; y: number }>();
  let press: { x: number; y: number; last: { x: number; y: number } } | null = null, pinch: { dist: number } | null = null;
  view.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) { press = { x: e.clientX, y: e.clientY, last: { x: e.clientX, y: e.clientY } }; dragged = false; }
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) };
      dragged = true;
    }
  }, on);
  view.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()], dist = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt(dist / pinch.dist, (a.x + b.x) / 2, (a.y + b.y) / 2);
      pinch.dist = dist;
      return;
    }
    if (!press) return;
    if (!dragged && Math.hypot(e.clientX - press.x, e.clientY - press.y) < DRAG) return;
    if (!dragged) { dragged = true; view.setPointerCapture(e.pointerId); view.classList.add("is-dragging"); }
    panBy(e.clientX - press.last.x, e.clientY - press.last.y);
    press.last = { x: e.clientX, y: e.clientY };
  }, on);
  const end = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!pointers.size) { press = null; view.classList.remove("is-dragging"); }
  };
  view.addEventListener("pointerup", end, on);
  view.addEventListener("pointercancel", end, on);
  view.addEventListener("keydown", (e) => {
    const b = view.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2, step = view.clientWidth * 0.15;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) { e.preventDefault(); panBy(...moves[e.key]); }
    else if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomAt(1.4, cx, cy); }
    else if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomAt(1 / 1.4, cx, cy); }
    else if (e.key === "0") { e.preventDefault(); vb = fit(); apply(); }
  }, on);

  let lastSize = "";
  const observer = new ResizeObserver(() => {
    const size = `${view.clientWidth}x${view.clientHeight}`;
    if (!view.clientWidth || size === lastSize) return;
    sizeFrame();
    lastSize = `${view.clientWidth}x${view.clientHeight}`;
    vb = fit();
    apply();
  });
  observer.observe(view);

  return {
    focusCity,
    stopPulse: () => { pulsing = null; drawPulse(); },
    dragged: () => dragged,
    destroy: () => { stop.abort(); observer.disconnect(); cancelAnimationFrame(glide); },
  };
}
