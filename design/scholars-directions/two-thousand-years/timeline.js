// The main event: one deep timeline from AD 1 to today in five lanes, one per field. Each scholar is a bar for their
// life with small upright marks for their key works; colour is faith. The time axis is gently stretched where many of
// them lived and squeezed where few did (computed from the data), and it can be zoomed and moved: drag, Ctrl/pinch +
// scroll, the +/− buttons, the era presets, or the window in the overview strip beneath. Drawn on one canvas.
(() => {
  const { scholars, FIELD_ORDER, FAITH_ORDER, FAITH_TONE, ERAS, TODAY, D, esc, years, faith, field, reduced } = Yrs;
  const PRESETS = [["All", 0, TODAY], ["Ancient", 0, 520], ["Middle Ages", 470, 1530], ["Reformation", 1440, 1820], ["Modern", 1780, TODAY]];
  const MIN_SPAN = 40, BASE_WEIGHT = 0.25, SANS = '"Archivo Variable", system-ui, sans-serif';
  const coarse = matchMedia("(pointer: coarse)").matches;

  // ── The time scale: an even one and a "crowd" one, blended by m (0 = even, 1 = stretched) ───────────────────
  const even = new Float64Array(TODAY + 1), crowd = new Float64Array(TODAY + 1);
  (() => {
    const alive = new Float64Array(TODAY);
    for (const s of scholars) for (let y = Math.max(0, s.born); y < Math.min(TODAY, s.died + 1); y++) alive[y]++;
    const blur = (src, r) => src.map((_, i) => { let t = 0, n = 0; for (let j = i - r; j <= i + r; j++) if (j >= 0 && j < src.length) { t += src[j]; n++; } return t / n; });
    const smooth = blur(blur(alive, 18), 18);
    for (let y = 0; y < TODAY; y++) { even[y + 1] = y + 1; crowd[y + 1] = crowd[y] + BASE_WEIGHT + Math.sqrt(smooth[y]); }
    const total = crowd[TODAY];
    for (let y = 0; y <= TODAY; y++) { even[y] /= TODAY; crowd[y] /= total; }
  })();
  const U = (y, m) => {
    const c = Math.max(0, Math.min(TODAY, y)), i = Math.min(TODAY - 1, Math.floor(c)), f = c - i;
    const at = (k) => (1 - m) * even[k] + m * crowd[k];
    return at(i) + (at(i + 1) - at(i)) * f;
  };
  const Uinv = (u, m) => {
    if (u <= 0) return 0;
    if (u >= 1) return TODAY;
    let lo = 0, hi = TODAY;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (U(mid, m) <= u) lo = mid; else hi = mid; }
    const a = U(lo, m), b = U(hi, m);
    return lo + (b > a ? (u - a) / (b - a) : 0);
  };

  // ── Lanes: within each field, lives are packed into rows so no two overlap ─────────────────────────────
  const lanes = FIELD_ORDER.map((f) => {
    const ends = [], items = [];
    for (const s of scholars.filter((p) => p.field === f).sort((a, b) => a.born - b.born)) {
      let row = ends.findIndex((end) => end + 4 < s.born);
      if (row < 0) { row = ends.length; ends.push(0); }
      ends[row] = s.died;
      items.push({ s, row, index: scholars.indexOf(s) });
    }
    for (const it of items) {
      it.next = items.find((o) => o.row === it.row && o.s.born > it.s.born) || null;
      it.prev = items.filter((o) => o.row === it.row && o.s.born < it.s.born).at(-1) || null;
    }
    return { field: f, rows: ends.length, items };
  });

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rgba = (color, a) => {
    const hex = color.replace("#", "");
    if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex)) return color;
    const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
    const n = parseInt(full, 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  };

  function mount(section) {
    const counts = Object.fromEntries(FAITH_ORDER.map((f) => [f, scholars.filter((s) => s.faith === f).length]));
    section.innerHTML = `<div class="yt-card">
      <div class="yt-tools">
        <div class="yt-presets" role="group" aria-label="Jump to a period">${PRESETS.map(([label], i) => `<button type="button" data-preset="${i}" aria-pressed="${i === 0}">${label}</button>`).join("")}</div>
        <div class="yt-zoom" role="group" aria-label="Zoom"><button type="button" data-zoom="-1" aria-label="Zoom out">−</button><button type="button" data-zoom="1" aria-label="Zoom in">+</button></div>
        <div class="yt-scale" role="group" aria-label="Time scale"><span>Scale</span><button type="button" data-m="1" aria-pressed="true">Stretched</button><button type="button" data-m="0" aria-pressed="false">Even</button></div>
      </div>
      <div class="yt-faiths" role="group" aria-label="Show one faith">
        <button type="button" class="yt-chip" data-faith="" aria-pressed="true">All faiths <small>${scholars.length}</small></button>
        ${FAITH_ORDER.map((f) => `<button type="button" class="yt-chip" data-faith="${f}" aria-pressed="false" style="--tone:var(${FAITH_TONE[f]})"><i></i>${esc(D.faiths[f])} <small>${counts[f]}</small></button>`).join("")}
      </div>
      <div class="yt-stage"><canvas class="yt-main" tabindex="0" role="img" aria-label="Timeline of ${scholars.length} scholars from AD 1 to today in five lanes by field. Every scholar is also listed in the directory below."></canvas>
        <div class="yt-tip" aria-hidden="true"></div></div>
      <div class="yt-over"><canvas aria-hidden="true"></canvas></div>
      <div class="yt-foot"><span class="yt-range"></span><span class="yt-hint">${coarse ? "Swipe sideways to move through time · tap a bar for the profile" : "Drag to move · Ctrl + scroll or pinch to zoom · drag the window in the strip"}</span></div>
    </div>
    <p class="yt-explain">Each bar is one scholar's life, in the lane of their field; the small upright marks are their key works and the colour is their faith. Faded ends mean the dates are approximate. Busy centuries are stretched and quiet ones squeezed; choose “Even” for plain years.</p>`;

    const stage = section.querySelector(".yt-stage"), canvas = section.querySelector(".yt-main"), ctx = canvas.getContext("2d");
    const over = section.querySelector(".yt-over canvas"), octx = over.getContext("2d");
    const tip = section.querySelector(".yt-tip"), rangeOut = section.querySelector(".yt-range");
    const st = { a: 0, b: TODAY, m: 1, mTarget: 1, filter: "", hover: -1 };
    const alpha = scholars.map(() => 1);
    let W = 0, H = 0, plotL = 0, plotW = 0, rowH = 20, barH = 13, laneTop = [], axisY = 0, OW = 0, OH = 44, dpr = 1;
    let pal = {}, hits = [], anim = null, raf = 0, lastT = 0, drag = null, brush = null;

    function palette() {
      const c = (t) => Frame.color(t);
      pal = { ink: c("--ink"), muted: c("--muted"), line: c("--line"), surface: c("--surface"), surface2: c("--surface-2"), accent: c("--accent"),
        dark: document.documentElement.dataset.theme === "dark", tone: Object.fromEntries(Object.entries(FAITH_TONE).map(([f, t]) => [f, c(t)])) };
    }

    function layout() {
      W = stage.clientWidth;
      const narrow = W < 640;
      rowH = narrow ? 19 : 20; barH = narrow ? 12 : 13;
      plotL = narrow ? 10 : 18; plotW = W - plotL * 2;
      let y = 36;
      laneTop = lanes.map((lane) => { const top = y; y += 22 + lane.rows * rowH + 10; return top; });
      axisY = y + 4; H = axisY + 26;
      dpr = Math.min(2, devicePixelRatio || 1);
      for (const [cv, w, h] of [[canvas, W, H], [over, W, OH]]) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = `${h}px`; }
      OW = W;
    }

    // ── Drawing ──────────────────────────────────────────────────────────────────────────────────────
    const xOf = (y, ua, k) => plotL + (U(y, st.m) - ua) * k;

    function ticks(ua, k) {
      const placed = [], small = W < 640;
      const cands = [];
      for (let y = 100; y <= TODAY; y += 10) {
        const x = xOf(y, ua, k);
        if (x < plotL + 8 || x > plotL + plotW - 56) continue;
        cands.push([y, x, y % 500 === 0 ? 4 : y % 100 === 0 ? 3 : y % 50 === 0 ? 2 : 1]);
      }
      cands.sort((p, q) => q[2] - p[2] || p[0] - q[0]);
      // Rounder years win; a plain decade only shows where the scale has stretched enough to give it room.
      const gapFor = (rank) => (rank >= 3 ? (small ? 50 : 58) : rank === 2 ? (small ? 70 : 84) : (small ? 110 : 140));
      for (const c of cands) if (placed.every((p) => Math.abs(p[1] - c[1]) >= gapFor(c[2]))) placed.push(c);
      return placed;
    }

    function roundRect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); }

    function draw() {
      const ua = U(st.a, st.m), ub = U(st.b, st.m), k = plotW / (ub - ua), right = plotL + plotW;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = "middle";
      // Era bands, with their names in the strip above the lanes.
      ERAS.forEach((e, i) => {
        const x0 = Math.max(plotL, xOf(e.from, ua, k)), x1 = Math.min(right, xOf(e.to, ua, k));
        if (x1 - x0 < 1) return;
        if (i % 2 === 0) { ctx.fillStyle = rgba(pal.surface2, pal.dark ? 0.55 : 0.5); ctx.fillRect(x0, 26, x1 - x0, axisY - 26); }
        ctx.font = `600 9.5px ${SANS}`;
        if ("letterSpacing" in ctx) ctx.letterSpacing = "1.4px";
        const label = [e.label.toUpperCase(), e.short.toUpperCase()].find((t) => ctx.measureText(t).width + 16 < x1 - x0);
        if (label) { ctx.fillStyle = pal.muted; ctx.textAlign = "center"; ctx.fillText(label, (x0 + x1) / 2, 14); }
        if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
      });
      const tickList = ticks(ua, k);
      ctx.strokeStyle = pal.line; ctx.lineWidth = 1; ctx.setLineDash([2, 5]);
      ctx.beginPath();
      for (const [, x] of tickList) { ctx.moveTo(Math.round(x) + 0.5, 26); ctx.lineTo(Math.round(x) + 0.5, axisY); }
      ctx.stroke(); ctx.setLineDash([]);
      // Lanes: a hairline above each, the field's name, then the lives.
      hits = [];
      ctx.save(); ctx.beginPath(); ctx.rect(plotL, 0, plotW, H); ctx.clip();
      lanes.forEach((lane, li) => {
        const top = laneTop[li];
        if (li) { ctx.fillStyle = pal.line; ctx.fillRect(plotL, top - 4, plotW, 1); }
        ctx.font = `600 9.5px ${SANS}`; ctx.textAlign = "left";
        if ("letterSpacing" in ctx) ctx.letterSpacing = "1.4px";
        ctx.fillStyle = pal.ink; ctx.globalAlpha = 0.72;
        ctx.fillText(`${field(lane.items[0].s).toUpperCase()}  ·  ${lane.items.length}`, plotL + 6, top + 9);
        ctx.globalAlpha = 1;
        if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
        for (const it of lane.items) drawBar(it, top + 22 + it.row * rowH + (rowH - barH) / 2, ua, k, right);
      });
      ctx.restore();
      // Axis.
      ctx.fillStyle = pal.line; ctx.fillRect(plotL, axisY, plotW, 1);
      ctx.font = `500 10.5px ${SANS}`; ctx.fillStyle = pal.muted; ctx.textAlign = "center";
      for (const [y, x] of tickList) ctx.fillText(String(y), x, axisY + 14);
      const tx = xOf(TODAY, ua, k);
      if (tx <= right + 1) {
        ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.arc(Math.min(tx, right - 3), axisY + 0.5, 3, 0, Math.PI * 2); ctx.fill();
        ctx.font = `600 10.5px ${SANS}`; ctx.textAlign = "right"; ctx.fillText("Today", right, axisY + 14);
      }
      const inView = scholars.filter((s) => s.died >= st.a && s.born <= st.b).length;
      const text = `${Math.round(st.a) || "AD 1"} – ${Math.round(st.b) >= TODAY ? "today" : Math.round(st.b)} · ${inView} of ${scholars.length} in view`;
      if (rangeOut.textContent !== text) rangeOut.textContent = text;
    }

    function drawBar(it, y, ua, k, right) {
      const s = it.s, i = it.index, x0 = xOf(s.born, ua, k), x1 = xOf(s.died, ua, k);
      it.labelEnd = x1;
      if (x1 < plotL - 4 || x0 > right + 4) return;
      const w = Math.max(3, x1 - x0), color = pal.tone[s.faith], a = alpha[i], hot = st.hover === i;
      const fillA = (hot ? 0.62 : pal.dark ? 0.34 : 0.26) * a, lineA = 0.9 * a;
      let fill = rgba(color, fillA), stroke = rgba(color, lineA);
      if (s.circa && w > 24) {
        const fade = Math.min(0.3, 12 / w);
        const grad = (al) => { const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
          g.addColorStop(0, rgba(color, 0)); g.addColorStop(fade, rgba(color, al)); g.addColorStop(1 - fade, rgba(color, al)); g.addColorStop(1, rgba(color, 0)); return g; };
        fill = grad(fillA); stroke = grad(lineA);
      }
      roundRect(ctx, x0, y, w, barH, barH / 2);
      ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = stroke; ctx.lineWidth = hot ? 1.5 : 1; ctx.stroke();
      ctx.fillStyle = rgba(pal.ink, (hot ? 0.95 : 0.7) * a);
      for (const [, wy] of s.works) { const tx = xOf(wy, ua, k); ctx.fillRect(Math.round(tx) - 1, y - 3, 2, barH + 6); }
      // The name: inside the bar if it fits, else just after it if the row is clear, else left to the hover card.
      ctx.font = `${hot ? 600 : 500} ${W < 640 ? 10.5 : 11.5}px ${SANS}`; ctx.textAlign = "left";
      const tw = ctx.measureText(s.short).width, vx0 = Math.max(x0, plotL), visible = Math.min(x1, right) - vx0;
      const nextX = it.next ? xOf(it.next.s.born, ua, k) : Infinity, prevX = it.prev ? it.prev.labelEnd : -Infinity;
      let lx = null;
      if (visible - 16 >= tw) lx = vx0 + 8;
      else if (x1 + 7 + tw + 8 < Math.min(nextX, right)) lx = x1 + 7;
      else if (x0 - 7 - tw - 8 > Math.max(prevX, plotL)) lx = x0 - 7 - tw;
      const outside = lx !== null && (lx > x1 || lx < x0);
      if (outside && lx > x1) it.labelEnd = lx + tw;
      if (lx !== null) { ctx.fillStyle = rgba(pal.ink, (outside ? 0.78 : 0.92) * a); ctx.fillText(s.short, lx, y + barH / 2 + 0.5); }
      hits.push({ i, x0: Math.min(x0, outside && lx < x0 ? lx : x0) - 2, x1: Math.max(x1, outside && lx > x1 ? lx + tw : x1) + 2, y0: y - 4, y1: y + barH + 4, cx: (Math.max(x0, plotL) + Math.min(x1, right)) / 2, y });
    }

    function drawOverview() {
      const k = OW - plotL * 2, X = (y) => plotL + U(y, st.m) * k;
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
      octx.clearRect(0, 0, OW, OH);
      roundRect(octx, plotL, 2, k, OH - 4, 10);
      octx.fillStyle = rgba(pal.surface2, pal.dark ? 0.5 : 0.55); octx.fill();
      const totalRows = lanes.reduce((n, l) => n + l.rows, 0), step = (OH - 14) / (totalRows + lanes.length);
      let r = 0;
      lanes.forEach((lane) => {
        for (const it of lane.items) {
          octx.fillStyle = rgba(pal.tone[it.s.faith], 0.85 * Math.max(0.25, alpha[it.index]));
          octx.fillRect(X(it.s.born), 7 + (r + it.row) * step, Math.max(1.5, X(it.s.died) - X(it.s.born)), Math.max(1.5, step - 0.6));
        }
        r += lane.rows + 1;
      });
      for (const e of ERAS.slice(1)) { octx.fillStyle = pal.line; octx.fillRect(Math.round(X(e.from)), 6, 1, OH - 12); }
      const xa = X(st.a), xb = X(st.b);
      octx.fillStyle = rgba(pal.surface, 0.62);
      octx.fillRect(plotL, 2, Math.max(0, xa - plotL), OH - 4); octx.fillRect(xb, 2, Math.max(0, plotL + k - xb), OH - 4);
      roundRect(octx, xa, 1, Math.max(4, xb - xa), OH - 2, 8);
      octx.strokeStyle = pal.ink; octx.lineWidth = 1.5; octx.stroke();
      octx.fillStyle = pal.ink;
      for (const x of [xa, xb]) { roundRect(octx, x - 2, OH / 2 - 8, 4, 16, 2); octx.fill(); }
    }

    // ── Animation: one requestAnimationFrame loop for zoom tweens and faith fades ──────────────────────
    function frame(now) {
      raf = 0;
      let more = false;
      const dt = lastT ? Math.min(64, now - lastT) : 16;
      lastT = now;
      if (anim) {
        const t = Math.min(1, (now - anim.t0) / anim.dur), e = ease(t), m = lerp(anim.m0, anim.m1, e);
        st.m = m;
        st.a = Uinv(lerp(U(anim.a0, m), U(anim.a1, m), e), m);
        st.b = Uinv(lerp(U(anim.b0, m), U(anim.b1, m), e), m);
        if (t < 1) more = true; else { Object.assign(st, { a: anim.a1, b: anim.b1, m: anim.m1 }); anim = null; syncButtons(); }
      }
      scholars.forEach((s, i) => {
        const target = !st.filter || s.faith === st.filter ? 1 : 0.12;
        if (alpha[i] === target) return;
        const stepA = reduced() ? 1 : dt / 240;
        alpha[i] = alpha[i] < target ? Math.min(target, alpha[i] + stepA) : Math.max(target, alpha[i] - stepA);
        more = true;
      });
      draw(); drawOverview();
      if (more) raf = requestAnimationFrame(frame); else lastT = 0;
    }
    const request = () => { if (!raf) raf = requestAnimationFrame(frame); };

    function animateTo(a, b, m = st.mTarget) {
      st.mTarget = m;
      if (reduced()) { Object.assign(st, { a, b, m }); anim = null; syncButtons(); request(); return; }
      anim = { a0: st.a, b0: st.b, m0: st.m, a1: a, b1: b, m1: m, t0: performance.now(), dur: 780 };
      request();
    }

    // Set the view directly in scale units (from a drag, wheel or brush), keeping it inside AD 1 to today.
    function setViewU(ua, ub) {
      const span = Math.min(1, ub - ua);
      if (ua < 0) { ua = 0; ub = span; }
      if (ub > 1) { ub = 1; ua = 1 - span; }
      const a = Uinv(ua, st.m), b = Uinv(ub, st.m);
      if (b - a < MIN_SPAN) return;
      anim = null; st.a = a; st.b = b;
      syncButtons(); request();
    }
    function zoomAt(px, factor) {
      const ua = U(st.a, st.m), ub = U(st.b, st.m), uc = ua + ((px - plotL) / plotW) * (ub - ua);
      setViewU(uc - (uc - ua) * factor, uc + (ub - uc) * factor);
    }

    function syncButtons() {
      section.querySelectorAll("[data-preset]").forEach((btn) => {
        const [, a, b] = PRESETS[btn.dataset.preset];
        btn.setAttribute("aria-pressed", String(!anim && Math.abs(st.a - a) < 1 && Math.abs(st.b - b) < 1));
      });
      section.querySelectorAll("[data-m]").forEach((btn) => btn.setAttribute("aria-pressed", String(Number(btn.dataset.m) === st.mTarget)));
    }

    // ── Hover card ───────────────────────────────────────────────────────────────────────────────────
    const hitAt = (x, y) => hits.find((h) => x >= h.x0 && x <= h.x1 && y >= h.y0 && y <= h.y1);
    function showTip(h) {
      const s = scholars[h.i];
      tip.style.setProperty("--tone", `var(${FAITH_TONE[s.faith]})`);
      tip.innerHTML = `<p class="kicker">${esc(field(s))}</p><b>${esc(s.name)}</b><small>${years(s)} · ${esc(s.place[0])}</small>
        <span class="yt-tip-faith"><i></i>${esc(faith(s))}</span>
        <ul>${s.works.map(([t, y]) => `<li><em>${y}</em>${esc(t)}</li>`).join("")}</ul><span class="yt-tip-go">Click for the full profile ${icon("arrowRight", 13)}</span>`;
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      const x = Math.max(4, Math.min(W - tw - 4, h.cx - tw / 2));
      const y = h.y - th - 12 > 0 ? h.y - th - 12 : h.y + barH + 12;
      tip.style.transform = `translate(${x}px, ${y}px)`;
      tip.classList.add("yt-tip-on");
    }
    function setHover(h) {
      const i = h ? h.i : -1;
      if (i === st.hover) return;
      st.hover = i;
      canvas.style.cursor = h ? "pointer" : "grab";
      if (h) showTip(h); else tip.classList.remove("yt-tip-on");
      request();
    }

    // ── Pointer, wheel and keys on the main canvas ─────────────────────────────────────────────────────
    const local = (e, el) => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    canvas.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      drag = { x: e.clientX, ua: U(st.a, st.m), ub: U(st.b, st.m), moved: false, id: e.pointerId };
    });
    canvas.addEventListener("pointermove", (e) => {
      if (drag) {
        const dx = e.clientX - drag.x;
        if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; canvas.setPointerCapture(drag.id); canvas.style.cursor = "grabbing"; setHover(null); }
        if (drag.moved) { const du = (-dx / plotW) * (drag.ub - drag.ua); setViewU(drag.ua + du, drag.ub + du); }
        return;
      }
      if (e.pointerType === "mouse") { const [x, y] = local(e, canvas); setHover(hitAt(x, y)); }
    });
    canvas.addEventListener("pointerup", (e) => {
      if (drag && !drag.moved) { const [x, y] = local(e, canvas); const h = hitAt(x, y); if (h) YrsDrawer.open(scholars[h.i].id); }
      drag = null;
      canvas.style.cursor = "grab";
    });
    canvas.addEventListener("pointercancel", () => { drag = null; });
    canvas.addEventListener("pointerleave", () => { if (!drag) setHover(null); });
    canvas.addEventListener("dblclick", () => animateTo(0, TODAY));
    canvas.addEventListener("wheel", (e) => {
      const [x] = local(e, canvas);
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomAt(x, Math.exp(Math.max(-60, Math.min(60, e.deltaY)) * 0.006)); }
      else if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        const ua = U(st.a, st.m), ub = U(st.b, st.m), du = (e.deltaX / plotW) * (ub - ua);
        setViewU(ua + du, ub + du);
      }
    }, { passive: false });
    canvas.addEventListener("keydown", (e) => {
      const ua = U(st.a, st.m), ub = U(st.b, st.m), du = (ub - ua) * 0.15;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); setViewU(ua + (e.key === "ArrowRight" ? du : -du), ub + (e.key === "ArrowRight" ? du : -du)); }
      if (e.key === "+" || e.key === "=") zoomAt(plotL + plotW / 2, 0.7);
      if (e.key === "-") zoomAt(plotL + plotW / 2, 1 / 0.7);
    });

    // ── The overview strip: drag the window, its edges, or draw a new one ────────────────────────────────
    const toU = (x) => Math.max(0, Math.min(1, (x - plotL) / (OW - plotL * 2)));
    const oX = (y) => plotL + U(y, st.m) * (OW - plotL * 2);
    function brushMode(x) {
      const xa = oX(st.a), xb = oX(st.b);
      if (Math.abs(x - xa) < 10) return "left";
      if (Math.abs(x - xb) < 10) return "right";
      return x > xa && x < xb ? "move" : "new";
    }
    over.addEventListener("pointerdown", (e) => {
      const [x] = local(e, over), mode = brushMode(x);
      brush = { mode, x0: x, u0: toU(x), ua: U(st.a, st.m), ub: U(st.b, st.m), moved: false };
      over.setPointerCapture(e.pointerId);
      anim = null;
    });
    over.addEventListener("pointermove", (e) => {
      const [x] = local(e, over);
      if (!brush) { over.style.cursor = { left: "ew-resize", right: "ew-resize", move: "grab", new: "crosshair" }[brushMode(x)]; return; }
      if (Math.abs(x - brush.x0) > 3) brush.moved = true;
      const u = toU(x), { ua, ub } = brush;
      if (brush.mode === "move") { const du = (x - brush.x0) / (OW - plotL * 2); setViewU(ua + du, ub + du); }
      else if (brush.mode === "left") setViewU(Math.min(u, ub - 0.01), ub);
      else if (brush.mode === "right") setViewU(ua, Math.max(u, ua + 0.01));
      else if (brush.moved) setViewU(Math.min(brush.u0, u), Math.max(brush.u0, u));
    });
    over.addEventListener("pointerup", () => {
      if (brush && brush.mode === "new" && !brush.moved) {
        // A plain click on the strip moves the current window there.
        const span = brush.ub - brush.ua, c = Math.max(span / 2, Math.min(1 - span / 2, brush.u0));
        animateTo(Uinv(c - span / 2, st.m), Uinv(c + span / 2, st.m));
      }
      brush = null;
    });

    // ── Toolbar ──────────────────────────────────────────────────────────────────────────────────────
    section.querySelector(".yt-tools").addEventListener("click", (e) => {
      const preset = e.target.closest("[data-preset]"), zoom = e.target.closest("[data-zoom]"), scale = e.target.closest("[data-m]");
      if (preset) { const [, a, b] = PRESETS[preset.dataset.preset]; animateTo(a, b); }
      if (zoom) {
        const ua = U(st.a, st.m), ub = U(st.b, st.m), c = (ua + ub) / 2, half = ((ub - ua) / 2) * (zoom.dataset.zoom === "1" ? 0.6 : 1 / 0.6);
        const na = Math.max(0, c - half), nb = Math.min(1, c + half);
        if (Uinv(nb, st.m) - Uinv(na, st.m) >= MIN_SPAN) animateTo(Uinv(na, st.m), Uinv(nb, st.m));
      }
      if (scale) { animateTo(st.a, st.b, Number(scale.dataset.m)); syncButtons(); }
    });
    section.querySelector(".yt-faiths").addEventListener("click", (e) => {
      const chip = e.target.closest("[data-faith]");
      if (!chip) return;
      st.filter = chip.dataset.faith === st.filter ? "" : chip.dataset.faith;
      section.querySelectorAll("[data-faith]").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.faith === st.filter)));
      request();
    });

    palette(); layout(); draw(); drawOverview();
    new ResizeObserver(() => { if (stage.clientWidth !== W) { layout(); request(); } }).observe(stage);
    addEventListener("themechange", () => { palette(); request(); });
    document.fonts?.ready.then(() => request());
    // Other sections can ask the timeline to show a stretch of years (e.g. a gap in "Gaps and crowds").
    Yrs.showYears = (a, b) => { section.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" }); animateTo(Math.max(0, a), Math.min(TODAY, b)); };
  }

  Yrs.sections.timeline = { mount };
})();
