import { useEffect, useRef, type RefObject } from "react";
import type { Bar, Library, Metric } from "./model";
import { PART_BY_ID } from "./model";
import type { PartId } from "./part-content";

// The zoomable river: every chapter as one bar. The wheel zooms around the pointer, dragging pans, the overview strip
// below moves the window, and clicking a part or book label flies to it. Drawn straight into the SVG (1,189 bars),
// outside React, so zooming never re-renders the page.

const LAYOUT = { band: 30, bars: 190, foot: 46, minSpan: 6, overview: 40 };

export interface RiverApi {
  select: (index: number, options?: { reveal?: boolean }) => void;
  flyToBook: (book: number) => void;
  flyToSection: (id: PartId) => void;
  reset: () => void;
  setMetric: (metric: Metric) => void;
}

export interface RiverElements {
  box: RefObject<HTMLDivElement | null>;
  svg: RefObject<SVGSVGElement | null>;
  overviewBox: RefObject<HTMLDivElement | null>;
  overview: RefObject<SVGSVGElement | null>;
}

export interface RiverCallbacks {
  onSelect: (index: number) => void;
  onHover: (bar: Bar | null) => void;
}

const SVG_NS = "http://www.w3.org/2000/svg";

function node(tag: string, attributes: Record<string, string | number>, text?: string): SVGElement {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
  if (text !== undefined) element.textContent = text;
  return element;
}
const color = (section: PartId) => `var(--${section})`;
const labelWidth = (text: string, size: number) => text.length * size * 0.56 + 12;
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useRiver(library: Library | null, elements: RiverElements, callbacks: RiverCallbacks): RefObject<RiverApi | null> {
  const api = useRef<RiverApi | null>(null);
  const handlers = useRef(callbacks);
  handlers.current = callbacks;

  useEffect(() => {
    const box = elements.box.current, svg = elements.svg.current;
    const overviewBox = elements.overviewBox.current, overview = elements.overview.current;
    if (!library || !box || !svg || !overviewBox || !overview) return;
    const { bars, books } = library;
    const total = bars.length;
    const state = { start: 0, end: total, metric: "verses" as Metric, selected: -1, hover: -1, animation: 0, frame: 0 };
    const tallestVerses = Math.max(...bars.map((b) => b.verses));
    const span = () => state.end - state.start;

    const clampView = (start: number, end: number): [number, number] => {
      const size = Math.min(total, Math.max(LAYOUT.minSpan, end - start));
      const from = Math.max(0, Math.min(total - size, start));
      return [from, from + size];
    };
    const setView = (start: number, end: number, now = false) => {
      [state.start, state.end] = clampView(start, end);
      if (now) draw();
      else if (!state.frame) state.frame = requestAnimationFrame(() => ((state.frame = 0), draw()));
    };
    const flyTo = (start: number, end: number, duration = 520) => {
      const [toStart, toEnd] = clampView(start, end);
      const fromStart = state.start, fromEnd = state.end, began = performance.now(), instant = reducedMotion();
      cancelAnimationFrame(state.animation);
      const step = (now: number) => {
        const t = instant ? 1 : Math.min(1, (now - began) / duration);
        const ease = 1 - Math.pow(1 - t, 3);
        setView(fromStart + (toStart - fromStart) * ease, fromEnd + (toEnd - fromEnd) * ease, true);
        if (t < 1) state.animation = requestAnimationFrame(step);
      };
      state.animation = requestAnimationFrame(step);
    };

    function draw() {
      const w = box!.clientWidth, h = LAYOUT.band + LAYOUT.bars + LAYOUT.foot;
      svg!.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg!.setAttribute("height", String(h));
      const unit = w / span();
      const x = (i: number) => (i - state.start) * unit;
      const base = LAYOUT.band + LAYOUT.bars;
      const gap = unit > 4 ? Math.min(unit * 0.2, 7) : 0;
      const first = Math.max(0, Math.floor(state.start)), last = Math.min(total - 1, Math.ceil(state.end));
      // bars are scaled to the tallest chapter on screen, so a zoomed-in book fills the height
      let tallest = 1;
      for (let i = first; i <= last; i++) tallest = Math.max(tallest, bars[i][state.metric]);
      const parts: SVGElement[] = [];

      let runStart = first;
      for (let i = first; i <= last + 1; i++) {
        if (i <= last && bars[i].section === bars[runStart].section) continue;
        const section = bars[runStart].section, left = Math.max(0, x(runStart)), right = Math.min(w, x(i));
        const name = PART_BY_ID[section].name;
        const band = node("g", { class: "lib-band", "data-fly-section": section });
        band.append(
          node("rect", { x: left, y: 0, width: right - left, height: LAYOUT.band - 6, fill: "transparent" }),
          node("line", { x1: left + 1, x2: right - 1, y1: LAYOUT.band - 8, y2: LAYOUT.band - 8, stroke: color(section), "stroke-width": 2 }),
        );
        if (right - left > labelWidth(name, 11)) band.append(node("text", { x: left + 4, y: LAYOUT.band - 14, fill: color(section) }, name));
        parts.push(band);
        runStart = i;
      }

      for (const book of books) {
        const end = book.start + book.count;
        if (end < state.start || book.start > state.end) continue;
        const left = x(book.start), right = x(end), size = labelWidth(book.name, 12);
        if (unit * book.count > 14 && left > 0) parts.push(node("line", { class: "lib-book-rule", x1: left, x2: left, y1: LAYOUT.band, y2: base + 30 }));
        const visibleLeft = Math.max(0, left), visibleRight = Math.min(w, right);
        if (visibleRight - visibleLeft > size) {
          const center = Math.min(Math.max((visibleLeft + visibleRight) / 2, visibleLeft + size / 2), visibleRight - size / 2);
          const y = base + (unit >= 18 ? 40 : 22);
          parts.push(node("text", { class: "lib-book-label", "data-fly-book": book.index, x: center, y, "text-anchor": "middle" }, book.name));
        }
      }

      for (let i = first; i <= last; i++) {
        const bar = bars[i], value = bar[state.metric];
        const height = value ? Math.max(2, (value / tallest) * (LAYOUT.bars - 22)) : 1;
        const left = x(i) + gap / 2, barWidth = Math.max(unit - gap, 0.6), middle = left + barWidth / 2;
        const cls = i === state.selected ? "lib-bar selected" : i === state.hover ? "lib-bar hover" : "lib-bar";
        parts.push(node("rect", { class: cls, "data-i": i, x: left, y: base - height, width: barWidth, height, fill: color(bar.section) }));
        if (unit >= 18) parts.push(node("text", { class: "lib-chapter-number", x: middle, y: base + 16, "text-anchor": "middle" }, String(bar.chapter)));
        if (unit >= 30 && value) parts.push(node("text", { class: "lib-bar-value", x: middle, y: base - height - 5, "text-anchor": "middle" }, value.toLocaleString("en-US")));
      }
      if (state.selected >= first && state.selected <= last) {
        const cx = x(state.selected) + unit / 2;
        parts.push(node("path", { class: "lib-marker", d: `M${cx - 5} ${LAYOUT.band + 2}h10l-5 7z` }));
      }
      parts.push(node("line", { class: "lib-baseline", x1: 0, x2: w, y1: base + 0.5, y2: base + 0.5 }));
      svg!.replaceChildren(...parts);
      drawOverview();
    }

    // The overview's 1,189 bars only change with its width; the window over them changes every frame.
    let overviewWidth = -1;
    const overviewBars = node("g", {});
    const overviewWindow = node("g", {});
    overview.replaceChildren(overviewBars, overviewWindow);
    function drawOverview() {
      const w = overviewBox!.clientWidth, h = LAYOUT.overview, unit = w / total;
      if (w !== overviewWidth) {
        overviewWidth = w;
        overview!.setAttribute("viewBox", `0 0 ${w} ${h}`);
        overview!.setAttribute("height", String(h));
        overviewBars.replaceChildren(
          ...bars.map((bar, i) => {
            const height = Math.max(1, (bar.verses / tallestVerses) * (h - 6));
            return node("rect", { x: i * unit, y: h - height, width: Math.max(unit, 0.7), height, fill: color(bar.section), opacity: 0.55 });
          }),
        );
      }
      const left = state.start * unit, right = state.end * unit;
      const parts = [
        node("rect", { class: "lib-shade", x: 0, y: 0, width: left, height: h }),
        node("rect", { class: "lib-shade", x: right, y: 0, width: w - right, height: h }),
        node("rect", { class: "lib-brush", x: left + 0.5, y: 0.5, width: Math.max(right - left - 1, 3), height: h - 1, rx: 4 }),
      ];
      if (state.selected >= 0) {
        const mark = (state.selected + 0.5) * unit;
        parts.push(node("line", { class: "lib-overview-mark", x1: mark, x2: mark, y1: 0, y2: h }));
      }
      overviewWindow.replaceChildren(...parts);
    }

    const indexAt = (clientX: number) => {
      const rect = box.getBoundingClientRect();
      return Math.floor(state.start + ((clientX - rect.left) / rect.width) * span());
    };
    const setHover = (i: number) => {
      if (i === state.hover) return;
      svg.querySelector(`[data-i="${state.hover}"]`)?.classList.remove("hover");
      state.hover = i;
      if (i >= 0 && i !== state.selected) svg.querySelector(`[data-i="${i}"]`)?.classList.add("hover");
      handlers.current.onHover(i >= 0 ? bars[i] : null);
    };
    const flyToSection = (id: PartId) => {
      const indexes = bars.flatMap((bar, i) => (bar.section === id ? [i] : []));
      const pad = Math.max(1, indexes.length * 0.02);
      flyTo(indexes[0] - pad, indexes[indexes.length - 1] + 1 + pad);
    };
    const flyToBook = (index: number) => {
      const book = books[index], pad = Math.max(1, book.count * 0.08);
      flyTo(book.start - pad, book.start + book.count + pad);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      cancelAnimationFrame(state.animation);
      // lines and pages (Firefox, some mice) to pixels, so every wheel zooms at the same rate
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? box.clientHeight : 1;
      const dx = event.deltaX * scale, dy = event.deltaY * scale;
      const rect = box.getBoundingClientRect(), fraction = (event.clientX - rect.left) / rect.width;
      if (Math.abs(dx) > Math.abs(dy)) {
        const shift = (dx / rect.width) * span();
        return setView(state.start + shift, state.end + shift);
      }
      const anchor = state.start + fraction * span(), size = span() * Math.exp(dy * 0.0016);
      setView(anchor - fraction * size, anchor - fraction * size + size);
    };

    let drag: { x: number; start: number; end: number; moved: boolean; target: EventTarget | null } | null = null;
    const onDown = (event: PointerEvent) => {
      drag = { x: event.clientX, start: state.start, end: state.end, moved: false, target: event.target };
      box.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (drag) {
        const dx = event.clientX - drag.x;
        if (Math.abs(dx) > 3) drag.moved = true;
        if (drag.moved) {
          cancelAnimationFrame(state.animation);
          const shift = (-dx / box.clientWidth) * (drag.end - drag.start);
          setView(drag.start + shift, drag.end + shift);
        }
        return;
      }
      const i = indexAt(event.clientX);
      if (i >= 0 && i < total) setHover(i);
    };
    const onUp = (event: PointerEvent) => {
      if (drag && !drag.moved) {
        const target = drag.target instanceof Element ? drag.target : null;
        const section = target?.closest<SVGElement>("[data-fly-section]")?.dataset.flySection as PartId | undefined;
        const book = target?.closest<SVGElement>("[data-fly-book]")?.dataset.flyBook;
        if (section) flyToSection(section);
        else if (book !== undefined) flyToBook(Number(book));
        else {
          const i = indexAt(event.clientX);
          if (i >= 0 && i < total) handlers.current.onSelect(i);
        }
      }
      drag = null;
    };
    const onCancel = () => (drag = null);
    const onLeave = () => !drag && setHover(-1);

    let brush: { x: number; start: number; end: number } | null = null;
    const onOverviewDown = (event: PointerEvent) => {
      const rect = overviewBox.getBoundingClientRect(), at = ((event.clientX - rect.left) / rect.width) * total;
      overviewBox.setPointerCapture(event.pointerId);
      if (at >= state.start && at <= state.end) brush = { x: event.clientX, start: state.start, end: state.end };
      else flyTo(at - span() / 2, at + span() / 2, 360);
    };
    const onOverviewMove = (event: PointerEvent) => {
      if (!brush) return;
      const shift = ((event.clientX - brush.x) / overviewBox.clientWidth) * total;
      setView(brush.start + shift, brush.end + shift);
    };
    const onOverviewUp = () => (brush = null);

    const listeners: [EventTarget, string, EventListener, AddEventListenerOptions?][] = [
      [box, "wheel", onWheel as EventListener, { passive: false }],
      [box, "pointerdown", onDown as EventListener],
      [box, "pointermove", onMove as EventListener],
      [box, "pointerup", onUp as EventListener],
      [box, "pointercancel", onCancel],
      [box, "pointerleave", onLeave],
      [overviewBox, "pointerdown", onOverviewDown as EventListener],
      [overviewBox, "pointermove", onOverviewMove as EventListener],
      [overviewBox, "pointerup", onOverviewUp],
      [overviewBox, "pointercancel", onOverviewUp],
    ];
    for (const [target, type, listener, options] of listeners) target.addEventListener(type, listener, options);
    const resize = new ResizeObserver(() => setView(state.start, state.end));
    resize.observe(box);

    api.current = {
      select(index, { reveal = true } = {}) {
        state.selected = index;
        if (reveal && (index < state.start || index + 1 > state.end)) flyTo(index + 0.5 - span() / 2, index + 0.5 + span() / 2, 360);
        setView(state.start, state.end);
      },
      flyToBook,
      flyToSection,
      reset: () => flyTo(0, total),
      setMetric(metric) {
        state.metric = metric;
        setView(state.start, state.end);
      },
    };
    draw();

    return () => {
      api.current = null;
      cancelAnimationFrame(state.animation);
      cancelAnimationFrame(state.frame);
      resize.disconnect();
      for (const [target, type, listener, options] of listeners) target.removeEventListener(type, listener, options);
    };
  }, [library, elements.box, elements.svg, elements.overviewBox, elements.overview]);

  return api;
}
