// The canvas of 1,189 chapter squares. Books flow left to right in blocks eight chapters tall (a new section of the
// Bible leaves a wider gap); a repaint fades each square to its new brightness, the start delayed by its place in the
// canon, so a wave runs Genesis → Revelation. All per-frame work stays here, off React.
import type { Book } from "@/data/teachers/pages-types";
import { themeColor } from "../../shared/color";
import type { Cell } from "./model";
import { SECTION_LABEL } from "./model";
import { reducedMotion } from "./words";

const WAVE = 520, DURATION = 560; // ms: how long the wave takes to cross the Bible, and each square's own fade
const FONT = '500 10px "Archivo Variable", system-ui, sans-serif';
type Rgb = [number, number, number];
type Rect = [number, number, number];
interface Label { b: number; x: number; y: number; w: number; text: string }
interface Palette { quiet: Rgb; sections: Record<string, Rgb>; ink: string; muted: string }

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (rgb: Rgb) => `rgb(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0})`;
function rgbOf(token: string): Rgb {
  const value = themeColor(token);
  const hex = value.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error(`The whole Bible: colour ${token} is "${value}", expected a 6-digit hex colour`);
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}

export class ChapterCanvas {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly n: number;
  private readonly current: Float32Array;
  private readonly from: Float32Array;
  private target: Float32Array;
  private rects: Rect[] = [];
  private labels: Label[] = [];
  private width = 0;
  private height = 0;
  private palette: Palette | null = null;
  private animStart = 0;
  private frame = 0;
  private hovered = -1;
  private pinned = -1;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly books: Book[], private readonly cells: Cell[]) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("The whole Bible: this browser gave no 2D canvas to draw the chapter map on");
    this.ctx = ctx;
    this.n = cells.length;
    this.current = new Float32Array(this.n);
    this.from = new Float32Array(this.n);
    this.target = new Float32Array(this.n);
  }

  /** Lay the squares out for a box this many CSS pixels wide, and size the canvas to fit. */
  layout(width: number) {
    const size = width >= 820 ? 12 : width >= 540 ? 11 : 9;
    const gap = 2, rows = 8, pitch = size + gap;
    const bookGap = size >= 11 ? 6 : 4, sectionGap = bookGap * 3, labelHeight = 15, lineGap = size >= 11 ? 16 : 12;
    const lineHeight = labelHeight + rows * pitch - gap + lineGap;
    this.rects = new Array<Rect>(this.n);
    this.labels = [];
    let x = 0, line = 0, index = 0, previous: string | null = null;
    this.books.forEach((book, b) => {
      const count = book.chapters.length, w = Math.ceil(count / rows) * pitch - gap;
      if (previous && book.section !== previous && x > 0) x += sectionGap - bookGap;
      if (x > 0 && x + w > width) { x = 0; line++; }
      const top = line * lineHeight;
      this.labels.push({ b, x, y: top + 10, w, text: "" });
      for (let c = 0; c < count; c++) this.rects[index++] = [x + Math.floor(c / rows) * pitch, top + labelHeight + (c % rows) * pitch, size];
      x += w + bookGap; previous = book.section;
    });
    this.width = width;
    this.height = (line + 1) * lineHeight - lineGap;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.ctx.font = FONT;
    for (const label of this.labels) {
      const book = this.books[label.b];
      label.text = this.ctx.measureText(book.name).width <= label.w ? book.name : this.ctx.measureText(book.code).width <= label.w ? book.code : "";
    }
  }

  /** Forget the colours, so the next draw reads the theme as now painted. */
  resetPalette() { this.palette = null; }

  private readPalette(): Palette {
    const sections: Record<string, Rgb> = {};
    for (const key of Object.keys(SECTION_LABEL)) sections[key] = rgbOf(`--${key}`);
    return { quiet: mix(rgbOf("--surface"), rgbOf("--line"), 0.55), sections, ink: themeColor("--ink"), muted: themeColor("--muted") };
  }

  setHighlight(hovered: number, pinned: number) { this.hovered = hovered; this.pinned = pinned; }

  draw() {
    if (!this.rects.length) return;
    const palette = this.palette ?? (this.palette = this.readPalette());
    const { ctx } = this;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.font = FONT;
    ctx.textBaseline = "alphabetic";
    const active = this.hovered >= 0 ? this.cells[this.hovered].b : this.pinned >= 0 ? this.cells[this.pinned].b : -1;
    for (const label of this.labels) {
      if (!label.text) continue;
      ctx.fillStyle = label.b === active ? palette.ink : palette.muted;
      ctx.fillText(label.text, label.x, label.y);
    }
    for (let i = 0; i < this.n; i++) {
      const [x, y, s] = this.rects[i];
      ctx.fillStyle = css(mix(palette.quiet, palette.sections[this.books[this.cells[i].b].section], this.current[i]));
      ctx.beginPath(); ctx.roundRect(x, y, s, s, s > 10 ? 3 : 2); ctx.fill();
    }
    for (const i of [this.pinned, this.hovered]) {
      if (i < 0) continue;
      const [x, y, s] = this.rects[i];
      ctx.strokeStyle = palette.ink; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(x - 1.5, y - 1.5, s + 3, s + 3, 4); ctx.stroke();
    }
  }

  /** Repaint toward new brightnesses with the wave (or at once when motion is reduced). */
  repaint(target: Float32Array) {
    this.target = target;
    this.from.set(this.current);
    if (reducedMotion() || !this.rects.length) { this.current.set(target); this.draw(); return; }
    this.animStart = performance.now();
    if (!this.frame) this.frame = requestAnimationFrame(this.step);
  }

  private readonly step = (now: number) => {
    let done = true;
    for (let i = 0; i < this.n; i++) {
      const local = (now - this.animStart - (i / this.n) * WAVE) / DURATION;
      if (local < 1) done = false;
      const k = local <= 0 ? 0 : local >= 1 ? 1 : ease(local);
      this.current[i] = this.from[i] + (this.target[i] - this.from[i]) * k;
    }
    this.draw();
    this.frame = done ? 0 : requestAnimationFrame(this.step);
  };

  /** The chapter nearest a pointer, within reach (wider for a finger), or -1. */
  cellAt(clientX: number, clientY: number, touch: boolean): number {
    const bounds = this.canvas.getBoundingClientRect();
    const px = clientX - bounds.left, py = clientY - bounds.top;
    let best = -1, bestDistance = touch ? 14 : 7;
    for (let i = 0; i < this.n; i++) {
      const [x, y, s] = this.rects[i];
      const d = Math.hypot(px - (x + s / 2), py - (y + s / 2));
      if (d < bestDistance) { best = i; bestDistance = d; }
    }
    return best;
  }

  stop() { if (this.frame) cancelAnimationFrame(this.frame); this.frame = 0; }
}
