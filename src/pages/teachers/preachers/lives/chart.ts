// 04 · Who was alive at the same time: the lifelines canvas as a small engine (the year cursor, playing, the re-sort
// animation, hover and dragging). It draws through requestAnimationFrame only while something moves, and tells the
// React side about the few things it shows: the whole year, the hovered life, play/pause, a click on a life.
import type { Person } from "@/data/teachers/pages-types";
import { FAMILIES, familyOf, lifeEnd, type Family } from "../../shared/people";
import { themeColor } from "../../shared/color";
import { easeOut, prefersReducedMotion } from "./common";
import { drawScene, SANS, type Palette } from "./draw";
import { END, OPEN_YEAR, RATE, START, SWEEP_FROM, geometry, isAlive, layout, xOf, yearAt, type Geometry, type Head, type Mode } from "./model";

export interface ChartEvents {
  /** The whole year under the cursor changed. */
  year: (year: number) => void;
  hover: (index: number) => void;
  playing: (on: boolean) => void;
  /** A life was clicked (not dragged). */
  open: (index: number) => void;
  /** Show the tooltip for a life at the pointer, or hide it (index -1). */
  tip: (index: number, x: number, y: number) => void;
}
interface Morph { from: Float32Array; to: Float32Array; oldHeads: Head[]; t0: number; p: number }
interface Tween { from: number; to: number; t0: number; dur: number }
interface Drag { id: number; x0: number; moved: boolean }

const KEY_JUMPS: Record<string, (year: number, step: number) => number> = {
  ArrowRight: (y, s) => y + s, ArrowUp: (y, s) => y + s, ArrowLeft: (y, s) => y - s, ArrowDown: (y, s) => y - s,
  PageUp: (y) => y + 25, PageDown: (y) => y - 25, Home: () => START, End: () => END,
};

export class LivesChart {
  private readonly canvas: HTMLCanvasElement;
  private readonly people: Person[];
  private readonly fams: Family[];
  private readonly events: ChartEvents;
  private readonly reduced = prefersReducedMotion();
  private readonly nameW: Float32Array;
  private readonly unbind: (() => void)[] = [];
  private ctx: CanvasRenderingContext2D | null = null;
  private width = 0;
  private height = 0;
  private g: Geometry = geometry(1000);
  private rowY: Float32Array;
  private heads: Head[] = [];
  private morph: Morph | null = null;
  private tween: Tween | null = null;
  private drag: Drag | null = null;
  private looping = false;
  private last = 0;
  private frame = 0;
  private palette: Palette | null = null;
  private year = OPEN_YEAR;
  private shown = -1;
  private mode: Mode = "birth";
  private hover = -1;
  private family: string | null = null;
  private pinnedFamily: string | null = null;
  private playing = false;
  private touched = false;

  constructor(canvas: HTMLCanvasElement, people: Person[], events: ChartEvents) {
    this.canvas = canvas;
    this.people = people;
    this.fams = people.map(familyOf);
    this.events = events;
    this.nameW = new Float32Array(people.length);
    this.rowY = new Float32Array(people.length);
    this.recolor();
    this.bind();
  }

  // ── Public controls ──
  resize(width: number) {
    if (width <= 0) return;
    this.width = width;
    this.g = geometry(width);
    const lay = layout(this.people, this.fams, this.mode, this.g);
    this.height = lay.height;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.height = `${this.height}px`;
    this.ctx = this.canvas.getContext("2d");
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.rowY = lay.ys;
    this.heads = lay.heads;
    this.morph = null;
    this.measureNames();
    this.applyYear(this.year);
    this.kick();
  }
  recolor() {
    const tone = new Map(FAMILIES.map((f) => [f.tone, themeColor(f.tone)]));
    this.palette = { family: this.fams.map((f) => tone.get(f.tone) ?? ""), tone, ink: themeColor("--ink"), muted: themeColor("--muted"), line: themeColor("--line"), page: themeColor("--page"), surface: themeColor("--surface") };
    this.kick();
  }
  measureNames() {
    if (!this.ctx) return;
    this.ctx.font = `600 ${this.g.font}px ${SANS}`;
    this.people.forEach((p, i) => { this.nameW[i] = this.ctx?.measureText(p.short).width ?? 0; });
    this.kick();
  }
  setMode(mode: Mode) {
    if (mode === this.mode) return;
    this.mode = mode;
    const next = layout(this.people, this.fams, mode, this.g);
    if (this.reduced) { this.rowY = next.ys; this.heads = next.heads; this.kick(); return; }
    this.morph = { from: Float32Array.from(this.rowY), to: next.ys, oldHeads: this.heads, t0: performance.now(), p: 0 };
    this.heads = next.heads;
    this.kick();
  }
  togglePlay() { this.touched = true; this.setPlaying(!this.playing); }
  setHover(index: number) {
    if (index === this.hover) return;
    this.hover = index;
    this.events.hover(index);
    this.kick();
  }
  setFamily(key: string | null) { this.family = key; this.kick(); }
  setPinnedFamily(key: string | null) { this.pinnedFamily = key; this.kick(); }
  /** The first time the chart comes into view (and nobody has touched it yet), the cursor sweeps briefly up to 1660. */
  sweep() {
    if (this.reduced || this.touched || this.playing) return;
    this.applyYear(SWEEP_FROM);
    this.goTo(OPEN_YEAR, true);
  }
  destroy() {
    this.unbind.forEach((off) => off());
    cancelAnimationFrame(this.frame);
    this.looping = false;
  }

  // ── Animation loop: runs only while something moves. ──
  private kick() {
    if (this.looping) return;
    this.looping = true;
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.loop);
  }
  private readonly loop = (now: number) => {
    const dt = Math.min(0.064, (now - this.last) / 1000);
    this.last = now;
    let busy = false;
    if (this.playing) {
      const next = this.year + dt * RATE;
      if (next >= END) { this.setPlaying(false); this.applyYear(END); } else { this.applyYear(next); busy = true; }
    }
    if (this.tween) {
      const t = Math.min(1, (now - this.tween.t0) / this.tween.dur);
      this.applyYear(this.tween.from + (this.tween.to - this.tween.from) * easeOut(t));
      if (t < 1) busy = true; else this.tween = null;
    }
    if (this.morph) {
      const m = this.morph;
      m.p = Math.min(1, (now - m.t0) / 750);
      const e = easeOut(m.p);
      for (let i = 0; i < this.rowY.length; i++) this.rowY[i] = m.from[i] + (m.to[i] - m.from[i]) * e;
      if (m.p < 1) busy = true; else this.morph = null;
    }
    this.draw();
    if (busy) this.frame = requestAnimationFrame(this.loop); else this.looping = false;
  };
  private draw() {
    if (!this.ctx || !this.palette || !this.width) return;
    drawScene(this.ctx, {
      width: this.width, height: this.height, g: this.g, people: this.people, fams: this.fams, rowY: this.rowY,
      heads: this.heads, fadingHeads: this.morph?.oldHeads ?? null, morph: this.morph?.p ?? 1,
      year: this.year, hover: this.hover, focus: this.family ?? this.pinnedFamily, dark: document.documentElement.dataset.theme === "dark",
    }, this.palette);
  }
  private goTo(year: number, animate: boolean) {
    const to = Math.max(START, Math.min(END, year));
    if (!animate || this.reduced) { this.tween = null; this.applyYear(to); this.kick(); return; }
    this.tween = { from: this.year, to, t0: performance.now(), dur: Math.min(900, 250 + Math.abs(to - this.year) * 4) };
    this.kick();
  }
  private applyYear(year: number) {
    this.year = Math.max(START, Math.min(END, year));
    const whole = Math.round(this.year);
    if (whole === this.shown) return;
    this.shown = whole;
    const count = this.people.filter((p) => isAlive(p, whole)).length;
    this.canvas.setAttribute("aria-valuenow", String(whole));
    this.canvas.setAttribute("aria-valuetext", `${whole}: ${count} alive`);
    this.events.year(whole);
  }
  private setPlaying(on: boolean) {
    this.playing = on;
    this.events.playing(on);
    if (on) { this.tween = null; if (this.year >= END - 0.5) this.year = START; this.kick(); }
  }

  // ── Pointer and keys ──
  private hit(x: number, y: number) {
    let best = -1, bestD = this.g.pitch / 2 + 1.5;
    this.people.forEach((p, i) => {
      const d = Math.abs(y - this.rowY[i]);
      if (d < bestD && x >= xOf(this.g, this.width, p.born) - this.nameW[i] - 10 && x <= xOf(this.g, this.width, lifeEnd(p)) + 8) { best = i; bestD = d; }
    });
    return best;
  }
  private local(e: PointerEvent) { const r = this.canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  private on<K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void) {
    this.canvas.addEventListener(type, fn);
    this.unbind.push(() => this.canvas.removeEventListener(type, fn));
  }
  private bind() {
    this.on("pointerdown", (e) => {
      if (e.button) return;
      this.touched = true;
      this.drag = { id: e.pointerId, x0: e.clientX, moved: false };
      this.canvas.setPointerCapture(e.pointerId);
      if (this.playing) this.setPlaying(false);
    });
    this.on("pointermove", (e) => this.pointerMove(e));
    this.on("pointerup", (e) => {
      if (!this.drag) return;
      const moved = this.drag.moved;
      this.drag = null;
      if (moved) return;
      const { x, y } = this.local(e), i = this.hit(x, y);
      if (i >= 0) this.events.open(i); else this.goTo(Math.round(yearAt(this.g, this.width, x)), true);
    });
    this.on("pointercancel", () => { this.drag = null; });
    this.on("pointerleave", () => { if (!this.drag) { this.setHover(-1); this.events.tip(-1, 0, 0); } });
    this.on("keydown", (e) => this.key(e));
  }
  private pointerMove(e: PointerEvent) {
    const { x, y } = this.local(e);
    if (this.drag && this.drag.id === e.pointerId) {
      if (!this.drag.moved && Math.abs(e.clientX - this.drag.x0) > 4) { this.drag.moved = true; this.tween = null; this.events.tip(-1, 0, 0); }
      if (this.drag.moved) { this.applyYear(yearAt(this.g, this.width, x)); this.kick(); }
      return;
    }
    if (e.pointerType !== "mouse") return;
    const i = this.hit(x, y);
    this.setHover(i);
    this.canvas.style.cursor = i >= 0 ? "pointer" : "ew-resize";
    this.events.tip(i, e.clientX, e.clientY);
  }
  private key(e: KeyboardEvent) {
    const jump = KEY_JUMPS[e.key];
    if (jump) {
      e.preventDefault();
      this.touched = true;
      if (this.playing) this.setPlaying(false);
      this.goTo(jump(Math.round(this.year), e.shiftKey ? 10 : 1), e.key.startsWith("Page") || e.key === "Home" || e.key === "End");
    } else if (e.key === " ") { e.preventDefault(); this.togglePlay(); }
  }
}
