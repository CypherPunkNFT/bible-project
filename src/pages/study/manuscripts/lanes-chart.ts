// "Through time" drawn and animated (approved mock-up: js/lanes.js). One lane per tradition across 250 BC to AD 1500, a
// dot per dated copy (a copy dated only by century is spread across its century). Pointing at a lane tints it; choosing
// it opens that tradition across the whole chart, its dots stacked into columns on its own fitted time axis. In the open
// chart, pointing at a dot names it on the line below and choosing it opens the record. The SVG is built and moved
// directly (thousands of dots animate every frame), never through React state.
import type { MsRecord } from "@/lib/manuscripts";
import { kindOf, mid, reducedMotion, yearText } from "./model";
import { clamp01, countText, ease, FULL, fitAxis, hash, LABEL, LANE, LANES, RIGHT, stack, TOP, Y0, Y1, type Dot, type Lane } from "./lanes-layout";

const NS = "http://www.w3.org/2000/svg", DURATION = 320;
type Attrs = Record<string, string | number | undefined>;
function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: (Node | string)[]): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined) node.setAttribute(k, String(v));
  node.append(...children);
  return node;
}
const tickLabel = (t: number) => (t === 1 || t === 0 ? "AD 1" : yearText(t < 0 ? t + 1 : t).replace("AD ", ""));

export interface LanesHooks {
  /** A copy is pointed at (or none: null); the chart's open state changes; a copy is chosen. */
  onFocus: (record: MsRecord | null, open: boolean) => void;
  onOpenChange: (open: boolean) => void;
  onChoose: (record: MsRecord, from: Element) => void;
}

export function mountLanes(svg: SVGSVGElement, box: HTMLElement, lanes: Lane[], hooks: LanesHooks) {
  let W = 0, cur: Dot | null = null, hover: number | null = null, openLane: number | null = null, frame = 0;
  const progress = (lane: Lane) => clamp01((lane.h - LANE) / (FULL - LANE));
  const tops = () => { let y = TOP; return lanes.map((lane) => { const top = y; y += lane.h; return top; }); };
  const dotY = (d: Dot, top: number) => {
    const lane = lanes[d.lane], p = ease(progress(lane)), shrink = Math.min(1, lane.h / LANE);
    return top + lane.h / 2 + d.yc * shrink * (1 - p) + d.ye * p;
  };
  const focusGroup = () => svg.querySelector<SVGGElement>(".ln-focus");

  function draw() {
    W = Math.max(760, box.clientWidth);
    const plot = W - LABEL - RIGHT;
    const sx = (y: number) => LABEL + ((Math.max(Y0, Math.min(Y1, y)) - Y0) / (Y1 - Y0)) * plot;
    const ticks = [-250, 1, 250, 500, 750, 1000, 1250, 1500];
    const parts: SVGElement[] = [el("defs", {}, el("pattern", { id: "ln-hatch", width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, el("path", { d: "M0 0v6", class: "ln-hatch" })))];
    parts.push(el("g", { class: "ln-axis-all" }, ...ticks.flatMap((t) => [
      el("line", { class: "ln-grid", x1: sx(t), x2: sx(t), y1: TOP - 6, y2: TOP + FULL + 2 }),
      el("text", { class: "ln-tick", x: sx(t), y: 14, "text-anchor": "middle" }, tickLabel(t))])));
    for (const lane of lanes) {
      lane.dots = [];
      for (const r of lane.dated) {
        const m = mid(r);
        if (m > Y1) continue;
        const span = r.l - r.e;
        const v = span >= 50 ? r.e + hash(`${r.i}x`) * span : m;
        lane.dots.push({ r, v, lane: lane.i, x: sx(v), yc: (hash(r.i + lane.key) * 2 - 1) * (LANE / 2 - 7), x0: sx(r.e), x1: sx(r.l), xo: 0, xo0: 0, xo1: 0, xs: 0, ye: 0 });
      }
      lane.dots.sort((a, b) => a.v - b.v);
      lane.axis = fitAxis(lane, plot);
      const axis = lane.axis;
      if (axis) for (const d of lane.dots) { d.xo = axis.map(d.v); d.xo0 = axis.map(d.r.e); d.xo1 = axis.map(d.r.l); }
      stack(lane);
      if (axis) parts.push(el("g", { class: "ln-axis", "data-axis": lane.i, style: "opacity: 0" },
        ...axis.breaks.flatMap((g) => [
          el("rect", { class: "ln-gap", x: g.x0.toFixed(1), y: TOP - 6, width: (g.x1 - g.x0).toFixed(1), height: FULL + 8 }, el("title", {}, `${tickLabel(g.a)} to ${tickLabel(g.b)}: no dated copy`)),
          el("path", { class: "ln-break", d: `M${(g.x0 + 4).toFixed(1)} ${TOP - 2}l4 -8M${(g.x1 - 8).toFixed(1)} ${TOP - 2}l4 -8` })]),
        ...axis.ticks.flatMap((t) => [
          el("line", { class: "ln-grid", x1: t.x.toFixed(1), x2: t.x.toFixed(1), y1: TOP - 6, y2: TOP + FULL + 2 }),
          el("text", { class: "ln-tick", x: t.x.toFixed(1), y: 14, "text-anchor": "middle" }, tickLabel(t.y))])));
      const fill = `fill: var(${lane.kind.tone})`;
      const g = el("g", { class: `ln-lane${lane.dots.length ? "" : " is-empty"}`, "data-lane": lane.i },
        el("rect", { class: "ln-wash", x: 0, y: 0, width: W - RIGHT }),
        el("line", { class: "ln-rule", x1: LABEL, x2: W - RIGHT }),
        el("text", { class: "ln-name", x: 0, y: LANE / 2 - 1 }, lane.label),
        el("text", { class: "ln-n", x: 0, y: LANE / 2 + 11 }, countText(lane)));
      if (lane.later) g.append(el("text", { class: "ln-later", x: W - RIGHT + 8 }, `+${lane.later}`));
      for (const d of lane.dots) { d.el = el("circle", { class: "ln-dot", r: 2.6, style: fill }); g.append(d.el); }
      lane.g = g;
      parts.push(g);
    }
    parts.push(el("text", { class: "ln-later", x: W - RIGHT + 14, y: 14 }, "later"));
    parts.push(el("g", { class: "ln-focus", style: "display: none" }, el("line", { class: "ln-range" }), el("circle", { class: "ln-ring", r: 6 })));
    svg.replaceChildren(...parts);
    place();
    if (cur) { const again = lanes[cur.lane].dots.find((d) => d.r === cur?.r) ?? null; focusDot(again); }
  }

  /** Puts every lane and dot where the lanes' current heights say. The chart keeps the same total height throughout. */
  function place() {
    const at = tops();
    svg.setAttribute("viewBox", `0 0 ${W} ${TOP + FULL + 8}`); svg.setAttribute("width", String(W)); svg.setAttribute("height", String(TOP + FULL + 8));
    for (const lane of lanes) {
      const g = lane.g;
      if (!g) continue;
      const h = lane.h, top = at[lane.i], p = ease(progress(lane));
      g.setAttribute("transform", `translate(0 ${top.toFixed(1)})`);
      g.style.opacity = Math.min(1, h / LANE).toFixed(2);
      g.style.display = h < 0.5 ? "none" : "";
      g.classList.toggle("is-open", lane.i === openLane);
      g.classList.toggle("is-hover", lane.i === hover && openLane == null);
      g.querySelector(".ln-wash")?.setAttribute("height", h.toFixed(1));
      const rule = g.querySelector(".ln-rule"); rule?.setAttribute("y1", h.toFixed(1)); rule?.setAttribute("y2", h.toFixed(1));
      g.querySelector(".ln-later")?.setAttribute("y", (h / 2 + 4).toFixed(1));
      const r = (2.6 + (lane.rOpen - 2.6) * p).toFixed(2);
      for (const d of lane.dots) {
        d.cx = d.x + (d.xs - d.x) * p;
        d.el?.setAttribute("cx", d.cx.toFixed(1)); d.el?.setAttribute("cy", (dotY(d, top) - top).toFixed(1)); d.el?.setAttribute("r", r);
      }
      svg.querySelector<SVGGElement>(`[data-axis="${lane.i}"]`)?.style.setProperty("opacity", p.toFixed(2));
    }
    const fitted = Math.max(0, ...lanes.filter((lane) => lane.axis).map((lane) => ease(progress(lane))));
    const all = svg.querySelector<SVGGElement>(".ln-axis-all");
    if (all) all.style.opacity = (1 - fitted).toFixed(2);
    svg.querySelectorAll<SVGTextElement>(".ln-later").forEach((t) => { t.style.opacity = (1 - fitted).toFixed(2); });
    if (cur) ringAt(cur);
  }

  /** Animates every lane to the height the new state wants: the open one fills the chart, the others fold away. */
  function setOpen(index: number | null) {
    openLane = index;
    hooks.onOpenChange(index != null);
    if (index == null) focusDot(null); else { hover = null; hooks.onFocus(null, true); }
    const from = lanes.map((lane) => lane.h), to = lanes.map((lane) => (index == null ? LANE : lane.i === index ? FULL : 0));
    cancelAnimationFrame(frame);
    const start = performance.now(), still = reducedMotion();
    const tick = (now: number) => {
      const t = still ? 1 : clamp01((now - start) / DURATION), k = ease(t);
      lanes.forEach((lane, i) => { lane.h = from[i] + (to[i] - from[i]) * k; });
      place();
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }

  function ringAt(d: Dot) {
    const g = focusGroup();
    if (!g) return;
    const y = dotY(d, tops()[d.lane]), p = ease(progress(lanes[d.lane]));
    const ring = g.querySelector(".ln-ring"), range = g.querySelector(".ln-range");
    ring?.setAttribute("cx", String(d.cx ?? d.x)); ring?.setAttribute("cy", String(y));
    range?.setAttribute("x1", String(d.x0 + (d.xo0 - d.x0) * p)); range?.setAttribute("x2", String(d.x1 + (d.xo1 - d.x1) * p));
    range?.setAttribute("y1", String(y)); range?.setAttribute("y2", String(y));
  }
  function focusDot(d: Dot | null) {
    cur = d;
    const g = focusGroup();
    if (!g) return;
    if (!d) { g.style.display = "none"; hooks.onFocus(null, openLane != null); return; }
    g.style.display = "";
    ringAt(d);
    g.querySelector<SVGCircleElement>(".ln-ring")?.style.setProperty("stroke", `var(${kindOf(LANES[d.lane][0]).tone})`);
    hooks.onFocus(d.r, true);
  }
  function setHover(index: number | null) {
    if (index === hover) return;
    hover = index;
    place();
  }
  function laneAt(py: number) {
    const at = tops();
    for (let i = lanes.length - 1; i >= 0; i--) if (lanes[i].h >= 0.5 && py >= at[i]) return py < at[i] + lanes[i].h ? i : null;
    return null;
  }
  function nearest(px: number, py: number, index: number | null) {
    if (index == null) return null;
    const top = tops()[index];
    let best: Dot | null = null, bestD = 12 * 12;
    for (const d of lanes[index].dots) {
      const dd = ((d.cx ?? d.x) - px) ** 2 + (dotY(d, top) - py) ** 2;
      if (dd < bestD) { bestD = dd; best = d; }
    }
    return best;
  }
  const local = (e: MouseEvent) => { const b = svg.getBoundingClientRect(); return [(e.clientX - b.left) * (W / b.width), (e.clientY - b.top) * (W / b.width)]; };
  const canOpen = (index: number | null): index is number => index != null && lanes[index].dots.length > 0;

  const stop = new AbortController(), on = { signal: stop.signal };
  svg.addEventListener("pointermove", (e) => {
    const [px, py] = local(e), index = laneAt(py);
    if (openLane == null) {
      setHover(canOpen(index) ? index : null);
      svg.style.cursor = canOpen(index) ? "pointer" : "";
      return;
    }
    const d = nearest(px, py, index);
    svg.style.cursor = d || px < LABEL ? "pointer" : "";
    if (d) focusDot(d);
  }, on);
  svg.addEventListener("pointerleave", () => { setHover(null); if (openLane != null) focusDot(null); }, on);
  svg.addEventListener("click", (e) => {
    const [px, py] = local(e), index = laneAt(py);
    if (openLane == null) { if (canOpen(index)) setOpen(index); return; }
    if (px < LABEL) { setOpen(null); return; }
    const d = nearest(px, py, index);
    if (d) hooks.onChoose(d.r, svg);
  }, on);
  svg.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openLane != null) { setOpen(null); return; }
    if (openLane == null) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        let next = hover ?? (e.key === "ArrowDown" ? -1 : 0);
        do { next = (next + (e.key === "ArrowDown" ? 1 : -1) + LANES.length) % LANES.length; } while (!canOpen(next));
        setHover(next);
      }
      if (e.key === "Enter" && hover != null) setOpen(hover);
      return;
    }
    const list = lanes[openLane].dots;
    if (e.key === "Enter" && cur) { hooks.onChoose(cur.r, svg); return; }
    if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && list.length) {
      e.preventDefault();
      const at = cur ? list.indexOf(cur) : -1;
      focusDot(list[Math.max(0, Math.min(list.length - 1, at + (e.key === "ArrowRight" ? 1 : -1)))] ?? list[0]);
    }
  }, on);
  let lastWidth = 0;
  const observer = new ResizeObserver(() => { if (box.clientWidth !== lastWidth) { lastWidth = box.clientWidth; draw(); } });
  observer.observe(box);

  return {
    close: () => setOpen(null),
    destroy: () => { stop.abort(); observer.disconnect(); cancelAnimationFrame(frame); },
  };
}
