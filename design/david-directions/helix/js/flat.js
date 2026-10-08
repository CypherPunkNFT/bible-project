// The flat fallback when WebGL is unavailable (or ?flat=1): the same helix drawn as a side view in SVG, with the
// same strands, crystals, rungs and crown, driven by the same calls as the 3D sculpture.
import { R, CRYSTAL_OUT, theta, chroniclesRuns } from "./helix-geometry.js";
import { esc, KIND, span, easeOutBack } from "./util.js";

const NS = "http://www.w3.org/2000/svg";
const lerp = (a, b, t) => a + (b - a) * t;
// 2D silhouettes of the crystal shapes, in a unit box.
const SHAPE = {
  anointing: "M0,-1.25 L.55,0 L0,1.25 L-.55,0Z",
  battle: "M0,-1 L.95,.75 L-.95,.75Z",
  building: "M-.72,-.72 H.72 V.72 H-.72Z",
  worship: "M0,-.95 L.82,-.48 L.82,.48 L0,.95 L-.82,.48 L-.82,-.48Z",
  family: "M0,-.95 L.9,-.29 L.56,.77 L-.56,.77 L-.9,-.29Z",
  sin: "M.1,-1.45 L.42,.1 L-.08,1.45 L-.4,-.1Z",
  word: "M0,-1 L.24,-.33 L.95,-.31 L.38,.12 L.59,.81 L0,.4 L-.59,.81 L-.38,.12 L-.95,-.31 L-.24,-.33Z",
  court: "M-.5,-.86 H.5 L1,0 L.5,.86 H-.5 L-1,0Z",
};

export function createFlat({ host, data, onPick, onHover }) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "helix-flat");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "David's life as a helix of crystals, drawn flat.");
  host.prepend(svg);
  const view = { year: 0, overview: 1, summit: 0 }, cur = { ...view };
  const ui = { selected: null, filter: null, highlight: null, hover: null, offset: { x: 0, y: 0 }, w: 1, h: 1, drag: 0 };
  let build = 1, raf = 0;
  const runs = chroniclesRuns(data.chronicles);
  const isLive = (c) => (!ui.filter || ui.filter.has(c.kind)) && (!ui.highlight || ui.highlight.has(c.id));

  function resize() { const r = host.getBoundingClientRect(); ui.w = r.width; ui.h = r.height; svg.setAttribute("viewBox", `0 0 ${ui.w} ${ui.h}`); kick(); }
  new ResizeObserver(resize).observe(host);

  function draw() {
    raf = 0;
    const k = 0.18;
    let moving = false;
    for (const key of ["year", "overview", "summit"]) { const d = view[key] - cur[key]; if (Math.abs(d) > 0.002) { cur[key] += d * k; moving = true; } else cur[key] = view[key]; }
    const o = cur.overview;
    const cx = ui.w / 2 + ui.offset.x, cy = ui.h / 2 + ui.offset.y;
    const pxClose = Math.min(52, ui.h / 14), pxAll = (ui.h * 0.86) / 76;
    const px = lerp(pxClose, pxAll, o), focus = lerp(cur.year, 36, o) + cur.summit * 3;
    const rpx = Math.min(ui.w * 0.26, 150) * lerp(1, 0.55, o);
    const yOf = (y) => cy - (y - focus) * px;
    const angle = (y, strand) => theta(y) - theta(cur.year) * (1 - o) - ui.drag + (strand === "chr" ? Math.PI : 0) - 0.18;
    const pt = (y, strand, r = rpx) => { const a = angle(y, strand); return [cx + r * Math.sin(a), yOf(y), Math.cos(a)]; };
    const reach = span(build, 0, 0.55) * 70, chrReach = 30 + span(build, 0.3, 0.7) * 40;
    const lo = Math.max(0, focus - ui.h / px / 1.6), hi = Math.min(70, focus + ui.h / px / 1.6);

    // Strands as front and back halves.
    const strandPaths = (from, to, strand) => {
      let front = "", back = "", prevFront = null;
      for (let y = from; y <= to + 1e-6; y += 0.06) {
        const [x, yy, d] = pt(y, strand), f = d >= 0;
        const cmd = `${x.toFixed(1)},${yy.toFixed(1)}`;
        if (f !== prevFront) { if (f) front += `M${cmd}`; else back += `M${cmd}`; prevFront = f; }
        else if (f) front += `L${cmd}`; else back += `L${cmd}`;
      }
      return { front, back };
    };
    const seg = (a, b, strand, cls) => {
      const from = Math.max(a, lo), to = Math.min(b, hi, strand === "chr" ? chrReach : reach);
      if (to <= from) return "";
      const p = strandPaths(from, to, strand);
      return `<path class="fs-back ${cls}" d="${p.back}"/><path class="fs-front ${cls}" d="${p.front}"/>`;
    };
    let out = `<line class="fs-axis" x1="${cx}" x2="${cx}" y1="${yOf(Math.min(reach, hi))}" y2="${yOf(lo)}"/>`;
    out += seg(0, 30, "sk", "fs-pre") + seg(30, 70, "sk", "fs-sk");
    for (const [a, b] of runs) out += seg(a, b, "chr", "fs-chr");
    out += seg(30, data.chronicles.start, "chr", "fs-ghost");
    for (const g of data.chronicles.gaps) out += seg(g.from, g.to, "chr", "fs-ghost");
    for (const [y, t] of [[30, "30 · king at Hebron"], [37.5, "37½ · all Israel"], [70, "70 · death"]]) if (y >= lo && y <= hi && y <= reach) out += `<g class="fs-year"><line x1="${cx - 26}" x2="${cx + 26}" y1="${yOf(y)}" y2="${yOf(y)}"/><text x="${cx + 32}" y="${yOf(y) + 4}">${t}</text></g>`;
    // Rungs.
    data.rungs.forEach((r, i) => {
      if (r.year < lo || r.year > hi || build < 0.6 + i * 0.016) return;
      const a = pt(r.year, "sk"), b = pt(r.year, "chr"), m = [lerp(a[0], b[0], 0.3), a[1]];
      const dim = ui.highlight && !ui.highlight.has(r.id) ? " is-dim" : "";
      out += `<g class="fs-rung${dim}${ui.selected === r.id ? " is-on" : ""}" data-pick="rung" data-id="${r.id}"><line x1="${a[0]}" x2="${b[0]}" y1="${a[1]}" y2="${b[1]}"/><path d="M${m[0]},${m[1] - 7} l6,7 -6,7 -6,-7Z"/><title>${esc(r.topic)}</title></g>`;
    });
    // Crystals, back ones first.
    const list = data.crystals.filter((c) => c.year >= lo - 1 && c.year <= hi + 1).map((c) => ({ c, p: pt(c.year, c.strand, rpx * (R + CRYSTAL_OUT) / R), s: pt(c.year, c.strand) }));
    list.sort((a, b) => a.p[2] - b.p[2]);
    for (const { c, p, s } of list) {
      const t = 0.04 + 0.55 * (c.year / 70), appear = easeOutBack(span(build, t, t + 0.07));
      if (appear <= 0) continue;
      const live = isLive(c), sel = ui.selected === c.id;
      const size = (sel ? 15 : 10.5) * (c.dated ? 1.2 : 1) * lerp(0.7, 1.1, (p[2] + 1) / 2) * appear * (live ? 1 : 0.6) * lerp(1, 0.6, o);
      out += `<line class="fs-stem${c.dated ? "" : " is-dashed"}" x1="${s[0]}" y1="${s[1]}" x2="${p[0]}" y2="${p[1]}"/>`;
      out += `<g class="fs-crystal${live ? "" : " is-dim"}${sel ? " is-on" : ""}${p[2] < 0 ? " is-back" : ""}" style="--c: var(--k-${c.kind})" data-pick="crystal" data-id="${c.id}" transform="translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})">
        <circle r="${size * 1.9}" class="fs-halo"/><path d="${SHAPE[c.kind]}" transform="scale(${size.toFixed(2)})"/><title>${esc(c.label)}</title></g>`;
      if (live && o < 0.5 && p[2] > -0.2 && (Math.abs(c.year - cur.year) < 3.5 || sel)) { const left = p[0] > ui.w * 0.58; out += `<text class="fs-label${sel ? " is-on" : ""}" text-anchor="${left ? "end" : "start"}" x="${left ? p[0] - size - 9 : p[0] + size + 9}" y="${p[1] + 4}">${esc(c.label)}</text>`; }
    }
    // The crown.
    const capT = easeOutBack(span(build, 0.86, 1));
    if (capT > 0 && 75 <= hi + 8) {
      const y = yOf(74.6);
      out += `<g class="fs-cap${ui.selected === "cap" ? " is-on" : ""}" data-pick="cap" data-id="cap" transform="translate(${cx} ${y}) scale(${capT * lerp(1, 0.7, o)})"><circle r="34" class="fs-halo"/><path d="M-22,8 L-24,-12 L-11,-2 L0,-18 L11,-2 L24,-12 L22,8Z"/><line x1="-22" x2="22" y1="14" y2="14"/><title>The verdict</title></g>`;
    }
    svg.innerHTML = out;
    if (moving) kick();
  }
  function kick() { if (!raf) raf = requestAnimationFrame(draw); }

  // Drag sideways to turn the flat helix; click a crystal, rung or the crown.
  let down = null, moved = false;
  svg.addEventListener("pointerdown", (e) => { down = { x: e.clientX }; moved = false; });
  addEventListener("pointermove", (e) => {
    if (down && (e.buttons || e.pointerType !== "mouse")) { const dx = e.clientX - down.x; if (Math.abs(dx) > 4) moved = true; ui.drag -= dx * 0.008; down.x = e.clientX; kick(); return; }
    const g = e.target.closest?.("[data-pick]");
    const id = g && svg.contains(g) ? g.dataset.id : null;
    if (id !== ui.hover) { ui.hover = id; onHover?.(g ? { type: g.dataset.pick, id } : null); }
  });
  addEventListener("pointerup", (e) => {
    const was = down; down = null;
    if (!was || moved) return;
    const g = e.target.closest?.("[data-pick]");
    if (g && svg.contains(g)) onPick?.({ type: g.dataset.pick, id: g.dataset.id });
  });

  return {
    kind: "flat",
    setView(t) { Object.assign(view, t); kick(); },
    jumpView(t) { Object.assign(view, t); Object.assign(cur, t); kick(); },
    setSelected(id) { ui.selected = id; kick(); },
    setFilter(set) { ui.filter = set; kick(); },
    setHighlight(set) { ui.highlight = set; kick(); },
    setBuild(p) { build = p; kick(); },
    setOffset(x, y) { ui.offset = { x, y }; kick(); },
    setSafeArea() {},
    applyTheme() { kick(); },
    screenOf() { return null; },
    nudge(dx) { ui.drag -= dx * 2; kick(); },
    resize,
  };
}
