// Small drawing parts the eight scenes share: the svg wrapper, grass, leaves, sheep, stars, a bird, and a few generators
// (feathered wing edge, woven nest). Each returns SVG markup in the 320 × 240 scene space.
(() => {
  const n = (v) => +v.toFixed(1);
  const svg = (label, body) => `<svg class="art" viewBox="0 0 320 240" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${label}">${body}</svg>`;
  /** Three blades of grass rooted at (x, y). */
  const tuft = (x, y, s = 1, cls = "tuft") => `<path class="${cls}" d="M${x} ${y}c${-1 * s} ${-3 * s} ${-3 * s} ${-5 * s} ${-5 * s} ${-6 * s}M${x} ${y}c0 ${-4 * s} ${1 * s} ${-7 * s} ${2 * s} ${-9 * s}M${x} ${y}c${2 * s} ${-2 * s} ${4 * s} ${-4 * s} ${6 * s} ${-5 * s}"/>`;
  /** An almond leaf from (x, y) pointing at angle a (degrees), with its midrib. */
  const leaf = (x, y, a, len = 14, w = 4.5, cls = "", vein = true) => `<g class="${cls}" style="transform-origin:${x}px ${y}px"><g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0C${n(len * .3)} ${-w} ${n(len * .7)} ${-w} ${len} 0C${n(len * .7)} ${w} ${n(len * .3)} ${w} 0 0Z"/>${vein ? `<path class="f" d="M1 0L${n(len * .8)} 0"/>` : ""}</g></g>`;
  /** A sheep lying down with its head up, facing right; its base at (x, y). */
  const sheepLying = (x, y, s = 1, cls = "") => `<g class="${cls}" transform="translate(${x} ${y}) scale(${s})">
      <path class="pf" d="M34 0H2C-4 0-6-7-1-10C-3-16 4-20 9-17C11-22 19-23 22-18C25-22 32-21 33-16L36-8C39-5 38-1 34 0Z"/><path d="M34 0H2C-4 0-6-7-1-10C-3-16 4-20 9-17C11-22 19-23 22-18C25-22 32-21 33-16"/><path d="M36-8C39-5 38-1 34 0"/>
      <path d="M33-15C35-20 41-22 45-20C49-18 52-14 51-11C50-8 46-7 43-8C40-8 38-8 36-8"/><path d="M39-19C35-21 31-21 28-19C31-18 35-17 38-17"/>
      <circle cx="45.5" cy="-15" r=".8" fill="currentColor"/><path d="M29 0C33 1 37 1 40 0"/></g>`;
  /** A sheep standing with its head down to graze (the head nods on its own), facing right; feet at (x, y). */
  const sheepGrazing = (x, y, s = 1, cls = "") => `<g class="${cls}" transform="translate(${x} ${y}) scale(${s})">
      <path class="wool" d="M0-12C-6-12-8-19-3-22C-3-28 4-31 9-28C12-33 21-33 24-28C28-32 35-29 35-24C39-23 40-18 37-15C37-11 33-9 29-10C22-8 8-8 0-12Z"/>
      <path d="M4-10V0M9-9V0M26-10V0M31-11V0"/><path d="M-3-20C-6-19-7-16-6-14"/>
      <g class="graze"><path d="M35-21C40-20 44-16 45-11C46-7 45-3 42-2C39-1 37-4 37-8"/><path d="M39-18C42-21 45-21 47-19"/></g></g>`;
  const stars = (pts) => pts.map(([x, y, r = 1], i) => `<circle class="star" style="--i:${i}" cx="${x}" cy="${y}" r="${r}"/>`).join("");
  /** A small bird in flight, two arcs. */
  const bird = (x, y, s = 1) => `<path d="M${x} ${y}c${2 * s} ${-3 * s} ${5 * s} ${-4 * s} ${7 * s} ${-1 * s}c${2 * s} ${-3 * s} ${5 * s} ${-3 * s} ${7 * s} ${1 * s}"/>`;
  /** A point on the quadratic curve p0–c–p1 at t. */
  const quad = (p0, c, p1, t) => [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]];
  /**
   * A row of feather tips along the curve p0–c–p1: each tip a small scallop bulging by `bulge` along the curve's normal,
   * and, if `toward` is given, a faint shaft running from each tip a share of the way to that point.
   */
  function featherEdge(p0, c, p1, count, bulge, toward, share = .3) {
    let edge = "", shafts = "";
    for (let i = 0; i < count; i++) {
      const a = quad(p0, c, p1, i / count), b = quad(p0, c, p1, (i + 1) / count);
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
      const mx = (a[0] + b[0]) / 2 - (dy / len) * bulge, my = (a[1] + b[1]) / 2 + (dx / len) * bulge;
      edge += `${i ? "" : `M${n(a[0])} ${n(a[1])}`}Q${n(mx)} ${n(my)} ${n(b[0])} ${n(b[1])}`;
      if (toward && i) shafts += `M${n(a[0])} ${n(a[1])}L${n(a[0] + (toward[0] - a[0]) * share)} ${n(a[1] + (toward[1] - a[1]) * share)}`;
    }
    return { edge, shafts };
  }
  /** Woven strokes across a bowl between rim y and bottom y, centred on cx with half-widths at rim and bottom. */
  function weave(cx, rimY, bottomY, rimHalf, bottomHalf, rows = 3, per = 9) {
    let d = "";
    for (let r = 0; r < rows; r++) {
      const t = (r + .5) / rows, y = rimY + (bottomY - rimY) * t, half = rimHalf + (bottomHalf - rimHalf) * t * t;
      for (let i = 0; i < per; i++) {
        const x = cx - half + (2 * half * (i + .5)) / per, lean = (r % 2 ? -1 : 1) * 4;
        d += `M${n(x - lean)} ${n(y - 3)}L${n(x + lean)} ${n(y + 3)}`;
      }
    }
    return d;
  }

  window.Parts = { n, svg, tuft, leaf, sheepLying, sheepGrazing, stars, bird, featherEdge, weave };
})();
