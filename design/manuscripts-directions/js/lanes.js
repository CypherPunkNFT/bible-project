// B · 01 Through time: the approved "through time (lanes)" section. One lane per tradition across 250 BC to AD 1500, a
// dot per dated copy (a copy dated only by century is spread across its century). Pointing at a lane tints it lightly;
// clicking it opens that tradition across the whole chart, top to bottom, its dots stacked into columns so each can be
// told apart, on that tradition's own time axis (empty years cut out, sparse ones narrowed). In the open chart, pointing
// at a dot names it on the line below and clicking it opens the record.
(() => {
  const { mid, yearText, booksText, holderText, sigla } = MSX;
  const LANES = [["hebrew", "Hebrew Bible"], ["dss", "Dead Sea Scrolls"], ["lxx", "Greek Old Testament"], ["papyrus", "NT papyri"],
    ["majuscule", "NT majuscules"], ["minuscule", "NT minuscules"], ["lectionary", "NT lectionaries"], ["latin", "Latin"],
    ["syriac", "Syriac"], ["coptic", "Coptic"], ["gothic", "Gothic"], ["armenian", "Armenian"], ["georgian", "Georgian"], ["geez", "Ge'ez"]];
  const Y0 = -250, Y1 = 1500, LABEL = 206, RIGHT = 54, TOP = 30, LANE = 36, FULL = LANES.length * LANE;
  const COL_WIDTHS = [6.5, 8, 10, 12, 14, 16, 18, 20, 22], STEP_TARGET = 10, MAX_STEP = 14, DURATION = 320;
  const BIN = 25, THIN = 3, THIN_W = 14, GAP_W = 18, TICK_SPACE = 46;
  const DSS_SPAN = [-250, 135];
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const hash = (text) => { let h = 2166136261; for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; };
  const ease = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  function lanesData() {
    return LANES.map(([key, label], i) => {
      const all = MS.records.filter((r) => r.L.includes(key));
      const dated = all.filter((r) => "e" in r);
      return { key, label, i, all, dated, later: dated.filter((r) => mid(r) > Y1).length, kind: KIND[key], h: LANE };
    });
  }

  // What the small number under a lane's name says, in words rather than a bare fraction.
  function countText(lane) {
    if (lane.key === "dss") return `${formatNumber(lane.all.length)} scrolls · none dated yet`;
    if (!lane.all.length) return "no open records yet";
    if (lane.dated.length === lane.all.length) return lane.all.length === 1 ? "1 copy, dated" : `${formatNumber(lane.all.length)} copies, all dated`;
    return `${formatNumber(lane.dated.length)} dated of ${formatNumber(lane.all.length)}`;
  }

  // The open lane's layout: dots binned into narrow columns and stacked outward from the middle line, as tall as the chart.
  // Column width is chosen so the tallest stack reaches most of the chart's height: the narrowest column (finest dates)
  // whose stacks, at a comfortable spacing, fill three quarters of it. Each dot sits on its column's centre line.
  function stack(lane) {
    const room = FULL - 56;
    const layout = (width) => {
      const byCol = new Map();
      let deepest = 0;
      const placed = lane.dots.map((d) => {
        const col = Math.round(d.xo / width), k = byCol.get(col) ?? 0;
        byCol.set(col, k + 1);
        const offset = k ? (k % 2 ? 1 : -1) * Math.ceil(k / 2) : 0;
        deepest = Math.max(deepest, Math.abs(offset));
        return { d, offset, xs: col * width };
      });
      return { placed, deepest, width };
    };
    let best = layout(COL_WIDTHS[0]);
    for (const width of COL_WIDTHS) {
      best = layout(width);
      if (2 * best.deepest * STEP_TARGET >= room * 0.75) break;
    }
    const step = Math.min(MAX_STEP, room / Math.max(1, 2 * best.deepest));
    lane.rOpen = Math.max(2.6, Math.min(4.4, step * 0.42, best.width * 0.42));
    // Centre each column on the mean position of its own copies, so a column never drifts into a cut-out stretch.
    const centres = new Map();
    for (const { d, xs } of best.placed) { const c = centres.get(xs) ?? { sum: 0, n: 0 }; c.sum += d.xo; c.n++; centres.set(xs, c); }
    for (const { d, offset, xs } of best.placed) { const c = centres.get(xs); d.ye = offset * step; d.xs = c.sum / c.n; }
  }

  // The open lane's own time axis: only the years its copies cover. Stretches of 25 years with no copy fold into a narrow
  // break; stretches with one to three copies get a narrow strip; the rest of the width goes to the busy stretches, more
  // to the busier ones. Returns the year-to-x mapping, its year labels and where the breaks are.
  function fitAxis(lane, plot) {
    if (!lane.dots.length) return null;
    const years = lane.dots.map((d) => d.v);
    const a0 = Math.floor(Math.min(...years) / BIN) * BIN, a1 = Math.floor(Math.max(...years) / BIN) * BIN + BIN;
    const bins = [];
    for (let y = a0; y < a1; y += BIN) bins.push({ a: y, b: y + BIN, n: 0 });
    for (const v of years) bins[Math.min(bins.length - 1, Math.floor((v - a0) / BIN))].n++;
    const segs = [];
    for (const bin of bins) {
      if (bin.n) segs.push({ ...bin, gap: false });
      else if (segs.at(-1)?.gap) segs.at(-1).b = bin.b;
      else segs.push({ ...bin, gap: true });
    }
    const dense = segs.filter((s) => !s.gap && s.n > THIN), thin = segs.filter((s) => !s.gap && s.n <= THIN), gaps = segs.filter((s) => s.gap);
    let thinW = THIN_W, gapW = GAP_W;
    if (!dense.length) thinW = (plot - gaps.length * gapW) / thin.length;
    else {
      const fixed = thin.length * thinW + gaps.length * gapW;
      if (fixed > plot * 0.45) { const k = (plot * 0.45) / fixed; thinW *= k; gapW *= k; }
    }
    const weight = (s) => s.n ** 0.75, total = dense.reduce((sum, s) => sum + weight(s), 0);
    const free = plot - thin.length * thinW - gaps.length * gapW;
    let x = LABEL;
    for (const s of segs) { s.x0 = x; x += s.gap ? gapW : s.n > THIN ? (free * weight(s)) / total : thinW; s.x1 = x; }
    const map = (year) => {
      if (year <= segs[0].a) return segs[0].x0;
      const s = segs.find((seg) => year < seg.b) ?? segs.at(-1);
      return s.x0 + ((Math.min(year, s.b) - s.a) / (s.b - s.a)) * (s.x1 - s.x0);
    };
    const every = a1 - a0 > 600 ? 100 : 50, candidates = [];
    segs.forEach((s, n) => {
      if (s.gap) return;
      if (n === 0 || segs[n - 1].gap) candidates.push(s.a);
      for (let y = Math.ceil(s.a / every) * every; y < s.b; y += every) candidates.push(y);
    });
    candidates.push(segs.at(-1).b);
    const ticks = [];
    let last = -Infinity;
    for (const y of [...new Set(candidates)].sort((a, b) => a - b)) {
      const tx = map(y);
      if (tx - last >= TICK_SPACE) { ticks.push({ y, x: tx }); last = tx; }
    }
    return { map, ticks, breaks: gaps.map((s) => ({ x0: s.x0, x1: s.x1, a: s.a, b: s.b })) };
  }

  function mount(section, { num }) {
    const lanes = lanesData();
    const datedTotal = MS.records.filter((r) => "e" in r).length;
    section.innerHTML = `${head(num, "Through time", `Every dated copy, <em>tradition by tradition</em>`,
      `${formatNumber(datedTotal)} dated records on one line of time. A copy dated only by century is spread across its century. Choose a tradition to open it across the whole chart; then point at a copy to read it below, and choose it to open the record. Under each name: how many copies have a date and can be placed, of all we hold.`)}
      <div class="ln-bar"><button type="button" class="ln-back" hidden>${icon("arrowLeft", 14)}<span>All traditions</span></button></div>
      <div class="ln-scroll"><svg class="ln" role="img" tabindex="0" aria-label="Dated manuscripts by tradition, 250 BC to AD 1500. Up and down arrows choose a tradition, Enter opens it; left and right move between copies; Escape returns to all traditions."></svg></div>
      <p class="ms-say ln-say" aria-live="polite"></p>`;
    const svg = section.querySelector(".ln"), say = section.querySelector(".ln-say"), box = section.querySelector(".ln-scroll"), back = section.querySelector(".ln-back");
    const baseAll = "Choose a tradition to open it across the whole chart.";
    const baseOpen = "Point at a copy to read it; choose it to open the record. The thin line shows the full range of its date.";
    let W = 0, cur = null, hover = null, openLane = null, frame = 0;

    const progress = (lane) => clamp01((lane.h - LANE) / (FULL - LANE));
    const tops = () => { let y = TOP; return lanes.map((lane) => { const top = y; y += lane.h; return top; }); };
    const dotY = (d, top) => {
      const lane = lanes[d.lane], p = ease(progress(lane)), shrink = Math.min(1, lane.h / LANE);
      return top + lane.h / 2 + d.yc * shrink * (1 - p) + d.ye * p;
    };

    function draw() {
      W = Math.max(760, box.clientWidth);
      const plot = W - LABEL - RIGHT;
      const sx = (y) => LABEL + ((Math.max(Y0, Math.min(Y1, y)) - Y0) / (Y1 - Y0)) * plot;
      const ticks = [-250, 1, 250, 500, 750, 1000, 1250, 1500];
      const parts = [`<defs><pattern id="ln-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v6" class="ln-hatch"/></pattern></defs>`];
      const tickLabel = (t) => (t === 1 || t === 0 ? "AD 1" : yearText(t < 0 ? t + 1 : t).replace("AD ", ""));
      parts.push(`<g class="ln-axis-all">${ticks.map((t) => `<line class="ln-grid" x1="${sx(t)}" x2="${sx(t)}" y1="${TOP - 6}" y2="${TOP + FULL + 2}"/><text class="ln-tick" x="${sx(t)}" y="14" text-anchor="middle">${tickLabel(t)}</text>`).join("")}</g>`);
      for (const lane of lanes) {
        lane.dots = [];
        for (const r of lane.dated) {
          const m = mid(r);
          if (m > Y1) continue;
          const span = r.l - r.e;
          const v = span >= 50 ? r.e + hash(`${r.i}x`) * span : m;
          lane.dots.push({ r, v, lane: lane.i, x: sx(v), yc: (hash(r.i + lane.key) * 2 - 1) * (LANE / 2 - 7), x0: sx(r.e), x1: sx(r.l) });
        }
        lane.dots.sort((a, b) => a.v - b.v);
        lane.axis = fitAxis(lane, plot);
        for (const d of lane.dots) { d.xo = lane.axis.map(d.v); d.xo0 = lane.axis.map(d.r.e); d.xo1 = lane.axis.map(d.r.l); }
        stack(lane);
        if (lane.axis) parts.push(`<g class="ln-axis" data-axis="${lane.i}" style="opacity: 0">
          ${lane.axis.breaks.map((g) => `<rect class="ln-gap" x="${g.x0.toFixed(1)}" y="${TOP - 6}" width="${(g.x1 - g.x0).toFixed(1)}" height="${FULL + 8}"><title>${tickLabel(g.a)} to ${tickLabel(g.b)}: no dated copy</title></rect><path class="ln-break" d="M${(g.x0 + 4).toFixed(1)} ${TOP - 2}l4 -8M${(g.x1 - 8).toFixed(1)} ${TOP - 2}l4 -8"/>`).join("")}
          ${lane.axis.ticks.map((t) => `<line class="ln-grid" x1="${t.x.toFixed(1)}" x2="${t.x.toFixed(1)}" y1="${TOP - 6}" y2="${TOP + FULL + 2}"/><text class="ln-tick" x="${t.x.toFixed(1)}" y="14" text-anchor="middle">${tickLabel(t.y)}</text>`).join("")}
        </g>`);
        const tone = `var(${lane.kind.tone})`;
        parts.push(`<g class="ln-lane${lane.dots.length ? "" : " is-empty"}" data-lane="${lane.i}">
          <rect class="ln-wash" x="0" y="0" width="${W - RIGHT}"/>
          <line class="ln-rule" x1="${LABEL}" x2="${W - RIGHT}"/>
          <text class="ln-name" x="0" y="${LANE / 2 - 1}">${esc(lane.label)}</text>
          <text class="ln-n" x="0" y="${LANE / 2 + 11}">${esc(countText(lane))}</text>
          ${lane.key === "dss" ? `<rect class="ln-band" data-band="1" x="${sx(DSS_SPAN[0])}" y="6" width="${sx(DSS_SPAN[1]) - sx(DSS_SPAN[0])}" rx="4"/><text class="ln-bandtext" x="${sx(DSS_SPAN[1]) + 8}">no date per scroll in this data yet</text>` : ""}
          ${lane.later ? `<text class="ln-later" x="${W - RIGHT + 8}">+${lane.later}</text>` : ""}
          ${lane.dots.map(() => `<circle class="ln-dot" r="2.6" style="fill: ${tone}"/>`).join("")}
        </g>`);
      }
      parts.push(`<text class="ln-later" x="${W - RIGHT + 14}" y="14">later</text>`);
      parts.push(`<g class="ln-focus" style="display: none"><line class="ln-range"/><circle class="ln-ring" r="6"/></g>`);
      svg.innerHTML = parts.join("");
      for (const lane of lanes) {
        lane.g = svg.querySelector(`.ln-lane[data-lane="${lane.i}"]`);
        [...lane.g.querySelectorAll(".ln-dot")].forEach((el, n) => { lane.dots[n].el = el; });
      }
      place();
      if (cur) focusDot(lanes[cur.lane].dots.find((d) => d.r === cur.r) ?? null);
    }

    // Puts every lane and dot where the lanes' current heights say. The chart keeps the same total height throughout.
    function place() {
      const at = tops();
      svg.setAttribute("viewBox", `0 0 ${W} ${TOP + FULL + 8}`); svg.setAttribute("width", W); svg.setAttribute("height", TOP + FULL + 8);
      for (const lane of lanes) {
        const h = lane.h, top = at[lane.i], p = ease(progress(lane));
        lane.g.setAttribute("transform", `translate(0 ${top.toFixed(1)})`);
        lane.g.style.opacity = Math.min(1, h / LANE).toFixed(2);
        lane.g.style.display = h < 0.5 ? "none" : "";
        lane.g.classList.toggle("is-open", lane.i === openLane);
        lane.g.classList.toggle("is-hover", lane.i === hover && openLane == null);
        lane.g.querySelector(".ln-wash").setAttribute("height", h.toFixed(1));
        const rule = lane.g.querySelector(".ln-rule"); rule.setAttribute("y1", h.toFixed(1)); rule.setAttribute("y2", h.toFixed(1));
        lane.g.querySelector(".ln-band")?.setAttribute("height", Math.max(0, h - 12).toFixed(1));
        lane.g.querySelector(".ln-bandtext")?.setAttribute("y", (h / 2 + 4).toFixed(1));
        lane.g.querySelector(".ln-later")?.setAttribute("y", (h / 2 + 4).toFixed(1));
        const r = (2.6 + (lane.rOpen - 2.6) * p).toFixed(2);
        for (const d of lane.dots) {
          d.cx = d.x + (d.xs - d.x) * p;
          d.el.setAttribute("cx", d.cx.toFixed(1)); d.el.setAttribute("cy", (dotY(d, top) - top).toFixed(1)); d.el.setAttribute("r", r);
        }
        svg.querySelector(`[data-axis="${lane.i}"]`)?.style.setProperty("opacity", p.toFixed(2));
      }
      const fitted = Math.max(0, ...lanes.filter((lane) => lane.axis).map((lane) => ease(progress(lane))));
      svg.querySelector(".ln-axis-all").style.opacity = (1 - fitted).toFixed(2);
      svg.querySelectorAll(".ln-later").forEach((el) => { el.style.opacity = (1 - fitted).toFixed(2); });
      if (cur) ringAt(cur);
    }

    // Animates every lane from its current height to the height the new state wants: the open one fills the chart, the
    // others fold away; with none open, all return to one row each.
    function setOpen(index) {
      openLane = index;
      back.hidden = index == null;
      if (index == null) focusDot(null); else { hover = null; say.textContent = baseOpen; }
      if (index == null) say.textContent = baseAll;
      const from = lanes.map((lane) => lane.h), to = lanes.map((lane) => (index == null ? LANE : lane.i === index ? FULL : 0));
      cancelAnimationFrame(frame);
      const start = performance.now();
      const tick = (now) => {
        const t = motion.matches ? 1 : clamp01((now - start) / DURATION), k = ease(t);
        lanes.forEach((lane, i) => { lane.h = from[i] + (to[i] - from[i]) * k; });
        place();
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }

    function ringAt(d) {
      const g = svg.querySelector(".ln-focus"), y = dotY(d, tops()[d.lane]), p = ease(progress(lanes[d.lane]));
      const ring = g.querySelector(".ln-ring"), range = g.querySelector(".ln-range");
      ring.setAttribute("cx", d.cx ?? d.x); ring.setAttribute("cy", y);
      range.setAttribute("x1", d.x0 + (d.xo0 - d.x0) * p); range.setAttribute("x2", d.x1 + (d.xo1 - d.x1) * p); range.setAttribute("y1", y); range.setAttribute("y2", y);
    }
    function focusDot(d) {
      cur = d;
      const g = svg.querySelector(".ln-focus");
      if (!d) { g.style.display = "none"; say.textContent = openLane == null ? baseAll : baseOpen; return; }
      g.style.display = "";
      ringAt(d);
      g.querySelector(".ln-ring").style.stroke = `var(${KIND[LANES[d.lane][0]].tone})`;
      const r = d.r, bits = [sigla(r), r.d, booksText(r), holderText(r)].filter(Boolean);
      say.innerHTML = `<b>${esc(r.n)}</b> · ${bits.map(esc).join(" · ")} <span class="ms-say-go">Choose to open</span>`;
    }
    function bandSay() {
      cur = null; svg.querySelector(".ln-focus").style.display = "none";
      say.innerHTML = `<b>The Judaean Desert scrolls</b> · ${formatNumber(MS.counts.byKind.dss)} manuscripts from Qumran, Masada and the caves nearby. This data gives no date scroll by scroll; they are generally dated between the 3rd century BC and the 2nd century AD.`;
    }
    function setHover(index) {
      if (index === hover) return;
      hover = index;
      place();
    }

    function laneAt(py) {
      const at = tops();
      for (let i = lanes.length - 1; i >= 0; i--) if (lanes[i].h >= 0.5 && py >= at[i]) return py < at[i] + lanes[i].h ? i : null;
      return null;
    }
    function nearest(px, py, index) {
      if (index == null) return null;
      const top = tops()[index];
      let best = null, bestD = 12 * 12;
      for (const d of lanes[index].dots) {
        const dd = ((d.cx ?? d.x) - px) ** 2 + (dotY(d, top) - py) ** 2;
        if (dd < bestD) { bestD = dd; best = d; }
      }
      return best;
    }
    const local = (e) => { const b = svg.getBoundingClientRect(); return [(e.clientX - b.left) * (W / b.width), (e.clientY - b.top) * (W / b.width)]; };
    const canOpen = (index) => index != null && (lanes[index].dots.length || lanes[index].key === "dss");

    svg.addEventListener("pointermove", (e) => {
      const [px, py] = local(e), index = laneAt(py);
      if (openLane == null) {
        setHover(canOpen(index) ? index : null);
        svg.style.cursor = canOpen(index) ? "pointer" : "";
        if (e.target.closest("[data-band]")) bandSay();
        return;
      }
      if (e.target.closest("[data-band]")) { bandSay(); return; }
      const d = nearest(px, py, index);
      svg.style.cursor = d || px < LABEL ? "pointer" : "";
      if (d) focusDot(d);
    });
    svg.addEventListener("pointerleave", () => { setHover(null); if (openLane != null) focusDot(null); });
    svg.addEventListener("click", (e) => {
      const [px, py] = local(e), index = laneAt(py);
      if (openLane == null) { if (canOpen(index)) setOpen(index); return; }
      if (px < LABEL) { setOpen(null); return; }
      const d = nearest(px, py, index);
      if (d) Sheet.open(d.r.i, svg);
    });
    back.addEventListener("click", () => setOpen(null));
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
      if (e.key === "Enter" && cur) { Sheet.open(cur.r.i, svg); return; }
      if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && list.length) {
        e.preventDefault();
        const at = cur ? list.indexOf(cur) : -1;
        focusDot(list[Math.max(0, Math.min(list.length - 1, at + (e.key === "ArrowRight" ? 1 : -1)))] ?? list[0]);
      }
    });
    say.textContent = baseAll;
    let lastWidth = 0;
    new ResizeObserver(() => { if (box.clientWidth !== lastWidth) { lastWidth = box.clientWidth; draw(); } }).observe(box);
    addEventListener("themechange", draw);
  }
  Sections.lanes = { mount };
})();
