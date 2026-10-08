// The life ring: one life in Scripture's own four parts (before the call, with Jesus or the call, the church in Acts,
// after Scripture). Scripture gives no years, so the ring is divided by how much is recorded: each arc's length
// follows its number of records (with a floor so a near-empty part still shows), and each record is a bead on its
// arc. The last part is tradition, drawn dashed. Clicking an arc (or its label) selects that part.
window.Ring = (() => {
  const TAU = Math.PI * 2;
  const pt = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const arcD = (cx, cy, r, a0, a1) => { const [x0, y0] = pt(cx, cy, r, a0), [x1, y1] = pt(cx, cy, r, a1); return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };

  // Geometry for the four parts.
  function layout(d) {
    const counts = d.periods.map((p) => p.entries.length);
    const weights = counts.map((n) => Math.max(n, 4));
    const total = weights.reduce((a, b) => a + b, 0), gap = .05;
    let a = -Math.PI / 2 + gap / 2;
    return d.periods.map((p, i) => {
      const span = (TAU - gap * 4) * (weights[i] / total), seg = { i, p, a0: a, a1: a + span, n: counts[i] };
      a += span + gap; return seg;
    });
  }

  // size: the drawing's box; opts.labels: draw part names outside the ring.
  function svg(d, sel = 1, { size = 440, labels = true, center = true } = {}) {
    const cx = size / 2, cy = size / 2, r = size * (labels ? .4 : .44), w = Math.max(8, size * .03);
    const segs = layout(d), o = [];
    o.push(`<circle class="ring-track" cx="${cx}" cy="${cy}" r="${r}" />`);
    for (const s of segs) {
      const on = s.i + 1 === sel, trad = s.i === 3;
      o.push(`<path class="ring-arc ${trad ? "trad" : ""} ${on ? "on" : ""}" style="--tone:${PERIOD_TONE[s.i + 1]}" stroke-width="${on ? w * 1.35 : w}" d="${arcD(cx, cy, r, s.a0, s.a1)}"/>`);
      o.push(`<path class="ring-hit" data-period="${s.i + 1}" stroke-width="${w * 3}" d="${arcD(cx, cy, r, s.a0, s.a1)}"><title>${esc(s.p.n)} · ${esc(s.p.title)}: ${plural(s.n, "record")}</title></path>`);
      // Beads: one per record, spread along the arc.
      s.p.entries.forEach((key, k) => {
        const t = s.n === 1 ? .5 : (k + .5) / s.n, [x, y] = pt(cx, cy, r, s.a0 + (s.a1 - s.a0) * t);
        o.push(`<circle class="bead ${trad ? "trad" : ""}" data-entry="${esc(key)}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.max(2.4, w * .26).toFixed(1)}" style="--tone:${PERIOD_TONE[s.i + 1]}"/>`);
      });
      // Boundary tick.
      const [tx0, ty0] = pt(cx, cy, r - w * 1.4, s.a0 - .025), [tx1, ty1] = pt(cx, cy, r + w * 1.4, s.a0 - .025);
      o.push(`<path class="ring-tick" d="M${tx0.toFixed(1)} ${ty0.toFixed(1)}L${tx1.toFixed(1)} ${ty1.toFixed(1)}"/>`);
      if (labels) {
        const mid = (s.a0 + s.a1) / 2, [lx, ly] = pt(cx, cy, r + w * 1.8 + 8, mid);
        const anchor = Math.cos(mid) > .25 ? "start" : Math.cos(mid) < -.25 ? "end" : "middle";
        o.push(`<text class="ring-label ${on ? "on" : ""}" data-period="${s.i + 1}" x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="${anchor}" style="--tone:${PERIOD_TONE[s.i + 1]}">${esc(s.p.n)} · ${esc(s.p.title.toUpperCase())}</text>`);
      }
    }
    if (center) {
      const s = segs[sel - 1];
      o.push(`<text class="ring-num" x="${cx}" y="${cy + size * .02}" text-anchor="middle">${s.n}</text>
        <text class="ring-cap" x="${cx}" y="${cy + size * .085}" text-anchor="middle">${s.i === 3 ? (s.n === 1 ? "SOURCE OUTSIDE SCRIPTURE" : "SOURCES OUTSIDE SCRIPTURE") : s.n === 1 ? "RECORD IN SCRIPTURE" : "RECORDS IN SCRIPTURE"}</text>
        <text class="ring-sub" x="${cx}" y="${cy - size * .145}" text-anchor="middle">${esc(s.p.n)} · ${esc(s.p.title)}</text>`);
    }
    const pad = labels ? size * .24 : 0, padY = labels ? size * .05 : 0;
    return `<svg class="ring" viewBox="${-pad} ${-padY} ${size + pad * 2} ${size + padY * 2}" role="img" aria-label="${esc(d.short)}'s life in four parts">${o.join("")}</svg>`;
  }

  // Wires hover (a bead shows its record) and click (a part is chosen) on a host holding the ring.
  function bind(host, d, onPick) {
    host.addEventListener("click", (e) => { const t = e.target.closest("[data-period]"); if (t) onPick(Number(t.dataset.period)); const b = e.target.closest("[data-entry]"); if (b) onPick(d.byKey[b.dataset.entry].period, b.dataset.entry); });
    host.addEventListener("pointermove", (e) => {
      const b = e.target.closest("[data-entry]");
      if (!b) { Tip.hide(); return; }
      const en = d.byKey[b.dataset.entry];
      Tip.show(`<b>${esc(en.title)}</b><small>${en.type === "trad" ? esc(whenShort(en.when)) : esc(en.refs[0] ? refText(en.refs[0]) : "")}</small>`, e.clientX, e.clientY);
    });
    host.addEventListener("pointerleave", () => Tip.hide());
  }
  return { svg, bind, layout };
})();
