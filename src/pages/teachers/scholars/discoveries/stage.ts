// A map whose land is an SVG (its viewBox is the camera, animated in requestAnimationFrame) with markers and labels in
// an HTML layer above it, moved by transforms only. React draws the elements once; this class only moves them, through
// refs: the svg's viewBox, each marker's transform, and two data attributes (data-side, data-off) React never sets.
import type { DiscoveryModel, View } from "./model";
import { ease, interpolateZoom, reducedMotion, WATERS, type Cam, type Projection } from "./projection";

/** One marker as React draws it: a find (a button with a dot and a label) or a sea's name. */
export interface MarkerSpec { key: string; x: number; y: number; findId: string | null; name: string; year: number | null; labelLeft: boolean }

export function markersFor(model: DiscoveryModel, projections: Record<View, Projection>, view: View): MarkerSpec[] {
  const points = model.data.views[view].points, specs: MarkerSpec[] = [];
  for (const f of model.finds) {
    const p = points[`find:${f.id}`];
    if (p) specs.push({ key: f.id, x: p[0], y: p[1], findId: f.id, name: f.name, year: f.year, labelLeft: f.id === "robinsons-arch" || f.id === "hazor" });
  }
  for (const [name, lon, lat] of WATERS[view]) {
    const [x, y] = projections[view].project(lon, lat);
    specs.push({ key: `sea:${name}`, x, y, findId: null, name, year: null, labelLeft: false });
  }
  return specs;
}

interface Marker extends MarkerSpec { el: HTMLElement; label: HTMLElement | null; center: boolean; sx: number; sy: number; lw: number; lh: number; priority: number; force: boolean }
type Box = [number, number, number, number];

export class MapStage {
  cam: Cam;
  cw = 1;
  ch = 1;
  onRender: ((stage: MapStage) => void) | null = null;
  private markers: Marker[];
  private svg: SVGSVGElement;
  private raf = 0;
  private observer: ResizeObserver;
  private width: number;
  private height: number;

  constructor(readonly el: HTMLElement, view: { width: number; height: number }, specs: MarkerSpec[], private minW: number, private margin = 12) {
    const svg = el.querySelector("svg"), layer = el.querySelector(".dsc-layer");
    if (!svg || !layer || layer.children.length !== specs.length) throw new Error(`Discoveries map: the stage has ${layer?.children.length ?? 0} marker elements, expected ${specs.length}`);
    this.svg = svg; this.width = view.width; this.height = view.height;
    this.cam = { x: view.width / 2, y: view.height / 2, w: view.width };
    this.markers = specs.map((spec, i) => {
      const markerEl = layer.children[i] as HTMLElement, center = spec.findId === null;
      if (!center && spec.labelLeft) markerEl.dataset.side = "left";
      return { ...spec, el: markerEl, label: markerEl.querySelector<HTMLElement>(".dsc-lab"), center, sx: 0, sy: 0, lw: 0, lh: 0, priority: center ? 1 : 10, force: false };
    });
    this.size();
    this.observer = new ResizeObserver(() => { this.size(); this.cam = this.clamp(this.cam); this.render(); });
    this.observer.observe(el);
  }
  destroy() { cancelAnimationFrame(this.raf); this.observer.disconnect(); this.onRender = null; }
  private size() { this.cw = this.el.clientWidth || 1; this.ch = this.el.clientHeight || 1; }
  clamp({ x, y, w }: Cam): Cam {
    const m = this.margin, W = this.width, H = this.height, a = this.ch / this.cw;
    w = Math.max(this.minW, Math.min(w, W + 2 * m, (H + 2 * m) / a));
    const h = w * a;
    x = Math.min(Math.max(x, -m + w / 2), W + m - w / 2);
    y = Math.min(Math.max(y, -m + h / 2), H + m - h / 2);
    return { x, y, w };
  }
  /** The camera that holds these points with `pad` screen pixels to spare on every side. */
  fit(points: number[][], pad = 48, minW = this.minW): Cam {
    const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
    const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
    const px = Math.min(pad, this.cw / 4), py = Math.min(pad, this.ch / 4);
    const w = Math.max(minW, (bw * this.cw) / (this.cw - 2 * px), (bh * this.cw) / (this.ch - 2 * py));
    return this.clamp({ x: (Math.max(...xs) + Math.min(...xs)) / 2, y: (Math.max(...ys) + Math.min(...ys)) / 2, w });
  }
  toScreen(x: number, y: number): [number, number] {
    const s = this.cw / this.cam.w, h = this.cam.w * (this.ch / this.cw);
    return [(x - (this.cam.x - this.cam.w / 2)) * s, (y - (this.cam.y - h / 2)) * s];
  }
  /** The chosen find's label is larger and always shown; the others give way to it. */
  setActive(findId: string | null) {
    for (const m of this.markers) {
      if (m.center) continue;
      const on = m.findId === findId;
      m.priority = on ? 20 : 10;
      if (on !== m.force) m.lw = 0; // the chosen label is larger: measure it again
      m.force = on;
    }
  }
  jump(cam: Cam) { cancelAnimationFrame(this.raf); this.cam = this.clamp(cam); this.render(); }
  fly(target: Cam, max = 1500) {
    cancelAnimationFrame(this.raf);
    target = this.clamp(target);
    const still = Math.abs(target.x - this.cam.x) + Math.abs(target.y - this.cam.y) + Math.abs(target.w - this.cam.w) < 0.5;
    if (still || reducedMotion()) { this.jump(target); return; }
    const zoom = interpolateZoom([this.cam.x, this.cam.y, this.cam.w], [target.x, target.y, target.w]);
    const duration = Math.min(max, Math.max(650, zoom.duration * 0.9)), start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration), [x, y, w] = zoom.at(ease(t));
      this.cam = t < 1 ? { x, y, w } : target;
      this.render();
      if (t < 1) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }
  render() {
    const { x, y, w } = this.cam, h = w * (this.ch / this.cw);
    this.svg.setAttribute("viewBox", `${(x - w / 2).toFixed(2)} ${(y - h / 2).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
    for (const m of this.markers) {
      [m.sx, m.sy] = this.toScreen(m.x, m.y);
      m.el.style.transform = `translate3d(${m.sx.toFixed(1)}px, ${m.sy.toFixed(1)}px, 0)`;
    }
    this.placeLabels();
    this.onRender?.(this);
  }
  /** Every dot is an obstacle a label may not cover; labels go highest priority first, and one that would overlap a label
   *  already shown, or leave the map, is hidden. The chosen place always keeps its name. */
  private placeLabels() {
    const placed: Box[] = this.markers.filter((m) => !m.center).map((m) => [m.sx - 6, m.sy - 6, m.sx + 6, m.sy + 6]);
    for (const m of [...this.markers].sort((a, b) => b.priority - a.priority)) {
      if (!m.label) continue;
      if (!m.lw) { m.lw = m.label.offsetWidth; m.lh = m.label.offsetHeight; }
      const sides = m.center ? ["center"] : m.labelLeft ? ["left", "right"] : ["right", "left"];
      let shown: string | null = null;
      for (const side of sides) {
        const box = this.labelBox(m, side);
        const out = box[0] < 2 || box[2] > this.cw - 2 || box[1] < 2 || box[3] > this.ch - 2;
        if (out || placed.some((o) => box[0] < o[2] && box[2] > o[0] && box[1] < o[3] && box[3] > o[1])) continue;
        shown = side; placed.push(box); break;
      }
      if (!shown && m.force) shown = sides[0];
      m.label.toggleAttribute("data-off", !shown);
      if (shown && !m.center) m.el.dataset.side = shown;
    }
  }
  private labelBox(m: Marker, side: string): Box {
    const left = side === "center" ? m.sx - m.lw / 2 : side === "left" ? m.sx - 10 - m.lw : m.sx + 10;
    return [left - 2, m.sy - m.lh / 2 - 1, left + m.lw + 2, m.sy + m.lh / 2 + 1];
  }
}

/** The off-map marker sits on the map's edge, on the line from the centre towards the place, its arrow pointing there. */
export function placeEdge(stage: MapStage, edge: HTMLElement, target: [number, number]) {
  const [sx, sy] = stage.toScreen(target[0], target[1]);
  const cx = stage.cw / 2, cy = stage.ch / 2, dx = sx - cx, dy = sy - cy, ew = edge.offsetWidth / 2 + 14, eh = edge.offsetHeight / 2 + 14;
  const k = Math.min((cx - ew) / Math.abs(dx || 1e-6), (cy - eh) / Math.abs(dy || 1e-6));
  edge.style.transform = `translate3d(${(cx + dx * k - edge.offsetWidth / 2).toFixed(1)}px, ${(cy + dy * k - edge.offsetHeight / 2).toFixed(1)}px, 0)`;
  const arrow = edge.querySelector<HTMLElement>(".dsc-edge-arrow");
  if (arrow) arrow.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
}
