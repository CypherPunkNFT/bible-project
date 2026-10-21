// The zoomable river: every chapter as one bar. Wheel zooms around the pointer, drag pans,
// the overview strip below moves the window, and clicking a part or book label flies to it.
const SVG_NS = 'http://www.w3.org/2000/svg';
const RIVER = { band: 30, bars: 190, foot: 46, minSpan: 6 };

function createRiver({ bars, books, onSelect, onHover }) {
  const box = document.getElementById('river-box');
  const svg = document.getElementById('river-svg');
  const overviewBox = document.getElementById('overview-box');
  const overview = document.getElementById('overview-svg');
  const total = bars.length;
  const state = { start: 0, end: total, metric: 'verses', selected: -1, hover: -1, animation: 0 };
  const maxima = { verses: 1, words: 1, red: 1 };
  for (const bar of bars) for (const key of Object.keys(maxima)) maxima[key] = Math.max(maxima[key], bar[key]);

  const color = (section) => `var(--${section})`;
  const span = () => state.end - state.start;
  const width = () => box.clientWidth;

  function clampView(start, end) {
    let size = Math.min(total, Math.max(RIVER.minSpan, end - start));
    let from = Math.max(0, Math.min(total - size, start));
    return [from, from + size];
  }

  function setView(start, end) {
    [state.start, state.end] = clampView(start, end);
    draw();
  }

  function flyTo(start, end, duration = 520) {
    const [toStart, toEnd] = clampView(start, end);
    const fromStart = state.start, fromEnd = state.end, began = performance.now();
    cancelAnimationFrame(state.animation);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const step = (now) => {
      const t = reduce ? 1 : Math.min(1, (now - began) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      setView(fromStart + (toStart - fromStart) * ease, fromEnd + (toEnd - fromEnd) * ease);
      if (t < 1) state.animation = requestAnimationFrame(step);
    };
    state.animation = requestAnimationFrame(step);
  }

  function labelWidth(text, size) { return text.length * size * 0.56 + 12; }

  function draw() {
    const w = width(), h = RIVER.band + RIVER.bars + RIVER.foot;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('height', h);
    const unit = w / span();
    const x = (i) => (i - state.start) * unit;
    const base = RIVER.band + RIVER.bars;
    const gap = unit > 4 ? Math.min(unit * 0.2, 7) : 0;
    const first = Math.max(0, Math.floor(state.start)), last = Math.min(total - 1, Math.ceil(state.end));
    // bars are scaled to the tallest chapter on screen, so a zoomed-in book fills the height
    let tallest = 1;
    for (let i = first; i <= last; i++) tallest = Math.max(tallest, bars[i][state.metric]);
    const parts = [];

    // part bands across the top
    let runStart = first;
    for (let i = first; i <= last + 1; i++) {
      if (i <= last && bars[i].section === bars[runStart].section) continue;
      const section = bars[runStart].section, left = Math.max(0, x(runStart)), right = Math.min(w, x(i));
      const name = SECTIONS.find((s) => s.id === section).name;
      parts.push(`<g class="band" data-fly-section="${section}"><rect x="${left}" y="0" width="${right - left}" height="${RIVER.band - 6}" fill="transparent"/><line x1="${left + 1}" x2="${right - 1}" y1="${RIVER.band - 8}" y2="${RIVER.band - 8}" stroke="${color(section)}" stroke-width="2"/>`
        + (right - left > labelWidth(name, 11) ? `<text x="${left + 4}" y="${RIVER.band - 14}" fill="${color(section)}">${name}</text>` : '') + '</g>');
      runStart = i;
    }

    // book separators and labels
    for (const book of books) {
      const end = book.start + book.count;
      if (end < state.start || book.start > state.end) continue;
      const left = x(book.start), right = x(end);
      if (unit * book.count > 14 && left > 0) parts.push(`<line class="book-rule" x1="${left}" x2="${left}" y1="${RIVER.band}" y2="${base + 30}"/>`);
      const visibleLeft = Math.max(0, left), visibleRight = Math.min(w, right);
      if (visibleRight - visibleLeft > labelWidth(book.name, 12)) {
        const center = Math.min(Math.max((visibleLeft + visibleRight) / 2, visibleLeft + labelWidth(book.name, 12) / 2), visibleRight - labelWidth(book.name, 12) / 2);
        parts.push(`<text class="book-label" data-fly-book="${book.index}" x="${center}" y="${base + (unit >= 18 ? 40 : 22)}" text-anchor="middle">${book.name}</text>`);
      }
    }

    // the bars, with chapter numbers and values once there is room
    for (let i = first; i <= last; i++) {
      const bar = bars[i], value = bar[state.metric];
      const height = value ? Math.max(2, (value / tallest) * (RIVER.bars - 22)) : 1;
      const left = x(i) + gap / 2, barWidth = Math.max(unit - gap, 0.6);
      const cls = i === state.selected ? 'bar selected' : i === state.hover ? 'bar hover' : 'bar';
      parts.push(`<rect class="${cls}" x="${left}" y="${base - height}" width="${barWidth}" height="${height}" fill="${color(bar.section)}"/>`);
      if (unit >= 18) parts.push(`<text class="chapter-number" x="${left + barWidth / 2}" y="${base + 16}" text-anchor="middle">${bar.chapter}</text>`);
      if (unit >= 30 && value) parts.push(`<text class="bar-value" x="${left + barWidth / 2}" y="${base - height - 5}" text-anchor="middle">${value.toLocaleString('en-US')}</text>`);
    }
    if (state.selected >= first && state.selected <= last) {
      const cx = x(state.selected) + unit / 2;
      parts.push(`<path class="marker" d="M${cx - 5} ${RIVER.band + 2}h10l-5 7z"/>`);
    }
    parts.push(`<line class="baseline" x1="0" x2="${w}" y1="${base + .5}" y2="${base + .5}"/>`);
    svg.innerHTML = parts.join('');
    drawOverview();
  }

  function drawOverview() {
    const w = overviewBox.clientWidth, h = 40, unit = w / total;
    overview.setAttribute('viewBox', `0 0 ${w} ${h}`);
    overview.setAttribute('height', h);
    const parts = bars.map((bar, i) => {
      const height = Math.max(1, (bar.verses / maxima.verses) * (h - 6));
      return `<rect x="${i * unit}" y="${h - height}" width="${Math.max(unit, .7)}" height="${height}" fill="${color(bar.section)}" opacity=".55"/>`;
    });
    const left = state.start * unit, right = state.end * unit;
    parts.push(`<rect class="shade" x="0" y="0" width="${left}" height="${h}"/><rect class="shade" x="${right}" y="0" width="${w - right}" height="${h}"/>`);
    parts.push(`<rect class="brush" x="${left + .5}" y=".5" width="${Math.max(right - left - 1, 3)}" height="${h - 1}" rx="4"/>`);
    if (state.selected >= 0) parts.push(`<line class="overview-mark" x1="${(state.selected + .5) * unit}" x2="${(state.selected + .5) * unit}" y1="0" y2="${h}"/>`);
    overview.innerHTML = parts.join('');
  }

  function indexAt(clientX) {
    const rect = box.getBoundingClientRect();
    return Math.floor(state.start + ((clientX - rect.left) / rect.width) * span());
  }

  box.addEventListener('wheel', (event) => {
    event.preventDefault();
    cancelAnimationFrame(state.animation);
    const rect = box.getBoundingClientRect(), fraction = (event.clientX - rect.left) / rect.width;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) { const shift = (event.deltaX / rect.width) * span(); setView(state.start + shift, state.end + shift); return; }
    const anchor = state.start + fraction * span(), size = span() * Math.exp(event.deltaY * 0.0016);
    setView(anchor - fraction * size, anchor - fraction * size + size);
  }, { passive: false });

  let drag = null;
  box.addEventListener('pointerdown', (event) => {
    drag = { x: event.clientX, start: state.start, end: state.end, moved: false, target: event.target };
    box.setPointerCapture(event.pointerId);
  });
  box.addEventListener('pointermove', (event) => {
    if (drag) {
      const dx = event.clientX - drag.x;
      if (Math.abs(dx) > 3) drag.moved = true;
      if (drag.moved) { cancelAnimationFrame(state.animation); const shift = (-dx / width()) * (drag.end - drag.start); setView(drag.start + shift, drag.end + shift); }
      return;
    }
    const i = indexAt(event.clientX);
    if (i !== state.hover && i >= 0 && i < total) { state.hover = i; draw(); onHover(bars[i]); }
  });
  box.addEventListener('pointerup', (event) => {
    if (drag && !drag.moved) {
      const section = drag.target.closest?.('[data-fly-section]')?.dataset.flySection;
      const book = drag.target.closest?.('[data-fly-book]')?.dataset.flyBook;
      if (section) flyToSection(section);
      else if (book !== undefined) flyToBook(Number(book));
      else { const i = indexAt(event.clientX); if (i >= 0 && i < total) onSelect(i, { from: 'river' }); }
    }
    drag = null;
  });
  box.addEventListener('pointerleave', () => { if (!drag && state.hover >= 0) { state.hover = -1; draw(); onHover(null); } });

  let brushDrag = null;
  overviewBox.addEventListener('pointerdown', (event) => {
    const rect = overviewBox.getBoundingClientRect(), at = ((event.clientX - rect.left) / rect.width) * total;
    overviewBox.setPointerCapture(event.pointerId);
    if (at >= state.start && at <= state.end) brushDrag = { x: event.clientX, start: state.start, end: state.end };
    else { const half = span() / 2; flyTo(at - half, at + half, 360); }
  });
  overviewBox.addEventListener('pointermove', (event) => {
    if (!brushDrag) return;
    const shift = ((event.clientX - brushDrag.x) / overviewBox.clientWidth) * total;
    setView(brushDrag.start + shift, brushDrag.end + shift);
  });
  overviewBox.addEventListener('pointerup', () => { brushDrag = null; });

  function flyToSection(id) {
    const indexes = bars.flatMap((bar, i) => (bar.section === id ? [i] : []));
    const pad = Math.max(1, indexes.length * 0.02);
    flyTo(indexes[0] - pad, indexes[indexes.length - 1] + 1 + pad);
  }
  function flyToBook(index) {
    const book = books[index], pad = Math.max(1, book.count * 0.08);
    flyTo(book.start - pad, book.start + book.count + pad);
  }

  /** Select a chapter; if it is off screen (or the view is the whole Bible) bring it into view. */
  function select(i, { reveal = true } = {}) {
    state.selected = i;
    if (reveal && (i < state.start || i + 1 > state.end)) { const size = span(); flyTo(i + 0.5 - size / 2, i + 0.5 + size / 2, 360); }
    draw();
  }

  new ResizeObserver(draw).observe(box);
  return {
    select, flyToBook, flyToSection,
    reset: () => flyTo(0, total),
    setMetric(metric) { state.metric = metric; draw(); },
    view: () => [state.start, state.end],
  };
}
