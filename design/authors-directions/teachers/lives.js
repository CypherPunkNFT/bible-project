// 04 · Five centuries of lives (ported from direction A, Lifelines): every life as a line on one 1500–today axis,
// a year cursor (drag, arrow keys, play), the people alive in that year listed with their city, and a small map of where
// they were. Starts at 1660; the only automatic motion is one short sweep the first time the section scrolls into view.
window.Sections = window.Sections || {};
(() => {
  const START = 1500, END = THIS_YEAR, RATE = 16, OPEN_YEAR = 1660; // RATE = years per second while playing
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SANS = "'Archivo Variable', system-ui, sans-serif";
  const PEOPLE = AUTHORS.people, N = PEOPLE.length, FAM = PEOPLE.map(familyOf);

  // ── Small helpers (kept inside this section so it shares nothing with the others) ──
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const toneVar = (p) => `var(${familyOf(p).tone})`;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const plural = (n, one, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`;
  const openProfile = (id) => { Tip.hide(); window.Teachers?.openProfile?.(id); };
  // Where someone was living in a year. For people whose first recorded place is not their birthplace (Watson, White),
  // the years before they arrived there are "place not recorded" (index -1), never their first place.
  const whereIn = (p, year) => {
    if (year < p.born || year > lifeEnd(p)) return null;
    if (p.birthplaceKnown === false && year < p.places[0][3]) return { name: null, index: -1, unknown: true };
    return placeIn(p, year);
  };
  function sizeCanvas(canvas, width, height) {
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.height = `${height}px`;
    const c = canvas.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return c;
  }
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }
  function onResize(el, fn) {
    let lastWidth = 0, pending = 0;
    new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width);
      if (w === lastWidth) return;
      lastWidth = w;
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => fn(w));
    }).observe(el);
  }
  // One tooltip element for this section, moved with a transform.
  const tip = document.createElement("div");
  tip.className = "life-tip";
  tip.setAttribute("role", "status");
  let tipW = 0, tipH = 0;
  const Tip = {
    show(html, x, y) {
      if (!tip.isConnected) document.body.append(tip);
      if (tip.dataset.html !== html) { tip.innerHTML = html; tip.dataset.html = html; tipW = tip.offsetWidth; tipH = tip.offsetHeight; }
      const left = x + 16 + tipW > innerWidth - 8 ? x - 16 - tipW : x + 16;
      const top = Math.min(innerHeight - tipH - 8, Math.max(8, y + 14));
      tip.style.transform = `translate(${Math.max(8, left)}px, ${top}px)`;
      tip.classList.add("show");
    },
    hide() { tip.classList.remove("show"); },
  };

  const st = { year: OPEN_YEAR, shown: null, mode: "birth", hover: -1, family: null, pinnedFamily: null, playing: false, view: "auto", shownView: null, touched: false };
  let root, canvas, ctx, W = 0, H = 0, g, rowY = new Float32Array(N), heads = [], morph = null, tween = null, drag = null, looping = false, last = 0;
  const nameW = new Float32Array(N);
  let colors = [], C = {}, side = {}, pins = [];

  const PLAY = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';
  const PAUSE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>';

  // ── Layout: rows grouped by century of birth, or by tradition; both orders take the same height. ──
  function groups(mode) {
    if (mode === "family") return FAMILIES.map((f) => ({ label: f.label, tone: f.tone, members: PEOPLE.map((_, i) => i).filter((i) => FAM[i].key === f.key) })).filter((x) => x.members.length);
    const by = new Map();
    PEOPLE.forEach((p, i) => { const c = Math.floor(p.born / 100) * 100; if (!by.has(c)) by.set(c, []); by.get(c).push(i); });
    return [...by].map(([c, members]) => ({ label: `Born in the ${c}s`, members }));
  }
  const MAX_GROUPS = Math.max(groups("birth").length, groups("family").length);
  function layout(mode) {
    const list = groups(mode), gap = (g.head * MAX_GROUPS) / list.length, ys = new Float32Array(N), hs = [];
    let y = g.top;
    for (const grp of list) {
      hs.push({ label: grp.label, tone: grp.tone, y: y + gap * 0.48 });
      y += gap;
      for (const i of grp.members) { ys[i] = y + g.pitch / 2; y += g.pitch; }
    }
    return { ys, hs, height: Math.ceil(y + 8) };
  }
  const X = (year) => g.padL + ((year - START) / (END - START)) * (W - g.padL - g.padR);
  const yearAt = (x) => START + ((x - g.padL) / (W - g.padL - g.padR)) * (END - START);
  const alive = (p, y) => p.born <= y && y <= lifeEnd(p);

  // ── Drawing ──
  function readColors() {
    colors = FAM.map((f) => Frame.color(f.tone));
    for (const t of ["ink", "muted", "line", "page", "surface", "accent"]) C[t] = Frame.color(`--${t}`);
  }
  function measureNames() {
    ctx.font = `600 ${g.font}px ${SANS}`;
    PEOPLE.forEach((p, i) => { nameW[i] = ctx.measureText(p.short).width; });
  }
  const rank = (i, year) => (i === st.hover ? 2 : alive(PEOPLE[i], year) ? 1 : 0);
  function draw() {
    const year = Math.round(st.year), dark = document.documentElement.dataset.theme === "dark";
    ctx.clearRect(0, 0, W, H);
    ctx.textBaseline = "middle";
    // Century grid and labels.
    ctx.lineWidth = 1;
    ctx.textAlign = "center";
    ctx.font = `500 10px ${SANS}`;
    const cursorX = X(st.year);
    for (let y = START; y <= 2000; y += 50) {
      const x = Math.round(X(y)) + 0.5, major = y % 100 === 0, covered = Math.abs(x - cursorX) < 40;
      ctx.globalAlpha = major ? 1 : 0.45;
      ctx.strokeStyle = C.line;
      ctx.beginPath(); ctx.moveTo(x, 24); ctx.lineTo(x, H - 2); ctx.stroke();
      if ((major || !g.narrow) && !covered) { ctx.fillStyle = C.muted; ctx.globalAlpha = major ? 1 : 0.7; ctx.fillText(String(y), x, 12); }
    }
    // Group headings (cross-fading while the order changes).
    ctx.textAlign = "left";
    ctx.font = `600 ${g.narrow ? 8 : 9}px ${SANS}`;
    const drawHeads = (hs, a) => { for (const h of hs) { ctx.globalAlpha = a; ctx.fillStyle = h.tone ? Frame.color(h.tone) : C.muted; ctx.letterSpacing = "1.6px"; ctx.fillText(h.label.toUpperCase(), 0, h.y); ctx.letterSpacing = "0px"; } };
    if (morph) { const p = ease(morph.p); drawHeads(morph.oldHeads, 1 - p); drawHeads(heads, p); } else drawHeads(heads, 1);
    // Lives: faint first, then the living-at-the-cursor on top, then the hovered one.
    const order = [...Array(N).keys()].sort((a, b) => rank(a, year) - rank(b, year));
    const focusFam = st.family ?? st.pinnedFamily;
    ctx.lineCap = "round";
    for (const i of order) {
      const p = PEOPLE[i], y = rowY[i], x1 = X(p.born), x2 = X(lifeEnd(p)), on = alive(p, year), hot = i === st.hover;
      const dim = focusFam && FAM[i].key !== focusFam;
      ctx.globalAlpha = dim ? 0.1 : on || hot ? 1 : dark ? 0.46 : 0.42;
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = hot ? 4 : on ? 3.2 : 2;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
      if (on || hot) { // small gaps where they moved to a new place
        ctx.fillStyle = C.surface;
        for (let k = 1; k < p.places.length; k++) { const mx = X(p.places[k][3]); if (mx > x1 + 3 && mx < x2 - 3) ctx.fillRect(mx - 0.75, y - 3, 1.5, 6); }
      }
      if (!p.died) { ctx.globalAlpha *= 0.9; ctx.fillStyle = colors[i]; ctx.beginPath(); ctx.moveTo(x2 + 3, y - 3.5); ctx.lineTo(x2 + 8, y); ctx.lineTo(x2 + 3, y + 3.5); ctx.fill(); }
      ctx.globalAlpha = dim ? 0.18 : on || hot ? 1 : 0.62;
      ctx.font = `${on || hot ? 600 : 400} ${g.font}px ${SANS}`;
      ctx.fillStyle = on || hot ? C.ink : C.muted;
      ctx.textAlign = "right";
      ctx.fillText(p.short, x1 - 6, y + 0.5);
    }
    // Cursor: a line, a dot on every life it crosses, and a year pill on the axis.
    const cx = X(st.year);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(Math.round(cx) + 0.5, 22); ctx.lineTo(Math.round(cx) + 0.5, H - 2); ctx.stroke();
    for (let i = 0; i < N; i++) {
      if (!alive(PEOPLE[i], year) || (focusFam && FAM[i].key !== focusFam)) continue;
      ctx.fillStyle = C.surface; ctx.beginPath(); ctx.arc(cx, rowY[i], 5, 0, 7); ctx.fill();
      ctx.fillStyle = colors[i]; ctx.beginPath(); ctx.arc(cx, rowY[i], 3.3, 0, 7); ctx.fill();
    }
    ctx.font = `600 11px ${SANS}`;
    const label = String(year), pw = ctx.measureText(label).width + 16, px = Math.min(W - pw, Math.max(0, cx - pw / 2));
    ctx.fillStyle = C.ink; roundRect(ctx, px, 2, pw, 20, 10); ctx.fill();
    ctx.fillStyle = C.page; ctx.textAlign = "center"; ctx.fillText(label, px + pw / 2, 12.5);
  }

  // ── Animation loop: runs only while something moves. ──
  function kick() { if (!looping) { looping = true; last = performance.now(); requestAnimationFrame(loop); } }
  function loop(now) {
    const dt = Math.min(0.064, (now - last) / 1000);
    last = now;
    let busy = false;
    if (st.playing) {
      const next = st.year + dt * RATE;
      if (next >= END) { setPlaying(false); applyYear(END); } else { applyYear(next); busy = true; }
    }
    if (tween) {
      const t = Math.min(1, (now - tween.t0) / tween.dur);
      applyYear(tween.from + (tween.to - tween.from) * ease(t));
      if (t < 1) busy = true; else tween = null;
    }
    if (morph) {
      morph.p = Math.min(1, (now - morph.t0) / 750);
      const e = ease(morph.p);
      for (let i = 0; i < N; i++) rowY[i] = morph.from[i] + (morph.to[i] - morph.from[i]) * e;
      if (morph.p < 1) busy = true; else morph = null;
    }
    draw();
    if (busy) requestAnimationFrame(loop); else looping = false;
  }
  function goTo(year, animate = true) {
    year = Math.max(START, Math.min(END, year));
    if (!animate || REDUCED) { tween = null; applyYear(year); kick(); return; }
    tween = { from: st.year, to: year, t0: performance.now(), dur: Math.min(900, 250 + Math.abs(year - st.year) * 4) };
    kick();
  }
  function applyYear(year) {
    st.year = Math.max(START, Math.min(END, year));
    const y = Math.round(st.year);
    if (y !== st.shown) { st.shown = y; updateSide(y); canvas.setAttribute("aria-valuenow", String(y)); canvas.setAttribute("aria-valuetext", `${y}: ${side.count} alive`); }
  }
  function setPlaying(on) {
    st.playing = on;
    side.play.setAttribute("aria-pressed", String(on));
    side.play.setAttribute("aria-label", on ? "Pause" : "Play through the years");
    side.play.innerHTML = on ? PAUSE : PLAY;
    if (on) { tween = null; if (st.year >= END - 0.5) st.year = START; kick(); }
  }
  function setMode(mode) {
    if (mode === st.mode) return;
    st.mode = mode;
    root.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
    const next = layout(mode);
    if (REDUCED) { rowY = next.ys; heads = next.hs; kick(); return; }
    morph = { from: Float32Array.from(rowY), to: next.ys, oldHeads: heads, t0: performance.now(), p: 0 };
    heads = next.hs;
    kick();
  }

  // ── Side panel: the year, who was alive, and where. ──
  function chooseView(list) {
    if (st.view !== "auto") return st.view;
    const mapped = list.filter((x) => !x.at.unknown).filter((x) => AUTHORS.views.atlantic.places[`${x.p.id}#${x.at.index}`] || AUTHORS.views.europe.places[`${x.p.id}#${x.at.index}`]);
    return mapped.length && mapped.every((x) => AUTHORS.views.europe.places[`${x.p.id}#${x.at.index}`]) ? "europe" : "atlantic";
  }
  function updateSide(year) {
    const list = PEOPLE.map((p, i) => ({ p, i, at: whereIn(p, year) })).filter((x) => x.at);
    const cities = new Set(list.filter((x) => !x.at.unknown).map((x) => x.at.name));
    side.count = list.length;
    side.year.textContent = year;
    side.meta.innerHTML = `<b>${plural(list.length, "teacher")} alive</b>${plural(cities.size, "place")}`;
    const key = list.map((x) => `${x.i}@${x.at.index}`).join(",");
    if (key !== side.key) {
      side.key = key;
      side.chips.innerHTML = list.length ? list.map(({ p, i, at }) => `<button type="button" class="life-chip" data-i="${i}" style="--tone: ${toneVar(p)}"><i class="life-dot"></i>${esc(p.short)}<small>${at.unknown ? "place not recorded" : esc(at.name)}</small></button>`).join("")
        : `<p class="life-plain">No teacher in the library was alive yet. Drag right.</p>`;
    }
    drawMap(list, chooseView(list));
  }
  function drawMap(list, viewName) {
    if (viewName !== st.shownView) {
      const first = st.shownView === null;
      st.shownView = viewName;
      const swap = () => {
        const v = AUTHORS.views[viewName];
        side.svg.setAttribute("viewBox", `0 0 ${v.width} ${v.height}`);
        side.land.setAttribute("d", v.land);
        side.inset.classList.add("instant");
        placePins(side.lastList ?? list);
        requestAnimationFrame(() => { side.inset.classList.remove("instant"); side.svg.classList.remove("fading"); });
      };
      if (first || REDUCED) swap(); else { side.svg.classList.add("fading"); setTimeout(swap, 220); }
    }
    side.lastList = list;
    placePins(list);
  }
  function placePins(list) {
    const v = AUTHORS.views[st.shownView], seen = new Map(), labels = new Map(), shown = new Set();
    let off = 0;
    for (const { p, i, at } of list) {
      if (at.unknown) continue;
      const xy = v.places[`${p.id}#${at.index}`];
      if (!xy) { off++; continue; }
      const k = seen.get(at.name) ?? 0;
      seen.set(at.name, k + 1);
      const angle = k * 2.4, r = k ? 13 + k * 2 : 0; // people in one city sit in a small spiral
      pins[i].style.transform = `translate(${xy[0] + Math.cos(angle) * r}px, ${xy[1] + Math.sin(angle) * r}px)`;
      pins[i].style.opacity = "1";
      shown.add(i);
      if (!labels.has(at.name)) labels.set(at.name, { x: xy[0], y: xy[1], n: 0 });
      labels.get(at.name).n++;
    }
    pins.forEach((pin, i) => { if (!shown.has(i)) pin.style.opacity = "0"; pin.classList.toggle("lit", i === st.hover); });
    // City names: busiest first, skipping any that would overlap one already placed.
    const placed = [], out = [];
    for (const [name, c] of [...labels].sort((a, b) => b[1].n - a[1].n)) {
      const w = name.length * 15 + 10, box = { x: c.x + 16, y: c.y - 14, w, h: 28 };
      if (box.x + w > 1000) box.x = c.x - 16 - w;
      if (placed.some((b) => box.x < b.x + b.w && b.x < box.x + box.w && box.y < b.y + b.h && b.y < box.y + box.h)) continue;
      placed.push(box);
      out.push(`<text class="life-city" x="${box.x}" y="${c.y + 9}">${esc(name)}</text>`);
    }
    side.labels.innerHTML = out.join("");
    side.off.textContent = off ? `${off} beyond this map` : "";
  }

  function setHover(i) {
    if (i === st.hover) return;
    st.hover = i;
    pins.forEach((pin, k) => pin.classList.toggle("lit", k === i));
    kick();
  }
  function hit(x, y) {
    let best = -1, bestD = g.pitch / 2 + 1.5;
    for (let i = 0; i < N; i++) {
      const p = PEOPLE[i], d = Math.abs(y - rowY[i]);
      if (d < bestD && x >= X(p.born) - nameW[i] - 10 && x <= X(lifeEnd(p)) + 8) { best = i; bestD = d; }
    }
    return best;
  }
  const local = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  function bindChart() {
    canvas.addEventListener("pointerdown", (e) => {
      if (e.button) return;
      st.touched = true;
      drag = { id: e.pointerId, x0: e.clientX, moved: false };
      canvas.setPointerCapture(e.pointerId);
      if (st.playing) setPlaying(false);
    });
    canvas.addEventListener("pointermove", (e) => {
      const { x, y } = local(e);
      if (drag && drag.id === e.pointerId) {
        if (!drag.moved && Math.abs(e.clientX - drag.x0) > 4) { drag.moved = true; tween = null; Tip.hide(); }
        if (drag.moved) { applyYear(yearAt(x)); kick(); }
        return;
      }
      if (e.pointerType !== "mouse") return;
      const i = hit(x, y);
      setHover(i);
      canvas.style.cursor = i >= 0 ? "pointer" : "ew-resize";
      if (i >= 0) { const p = PEOPLE[i]; Tip.show(`<b>${esc(p.name)}</b><small>${lifeLabel(p)} · ${esc(FAM[i].label)}<br>Click for their profile</small>`, e.clientX, e.clientY); } else Tip.hide();
    });
    canvas.addEventListener("pointerup", (e) => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (moved) return;
      const { x, y } = local(e), i = hit(x, y);
      if (i >= 0) openProfile(PEOPLE[i].id); else goTo(Math.round(yearAt(x)));
    });
    canvas.addEventListener("pointercancel", () => { drag = null; });
    canvas.addEventListener("pointerleave", () => { if (!drag) { setHover(-1); Tip.hide(); } });
    canvas.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 10 : 1, y = Math.round(st.year);
      const to = { ArrowRight: y + step, ArrowUp: y + step, ArrowLeft: y - step, ArrowDown: y - step, PageUp: y + 25, PageDown: y - 25, Home: START, End: END }[e.key];
      if (to !== undefined) { e.preventDefault(); st.touched = true; if (st.playing) setPlaying(false); goTo(to, e.key.startsWith("Page") || e.key === "Home" || e.key === "End"); }
      else if (e.key === " ") { e.preventDefault(); st.touched = true; setPlaying(!st.playing); }
    });
  }
  function bindPanel() {
    side.play.addEventListener("click", () => { st.touched = true; setPlaying(!st.playing); });
    root.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
    root.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => {
      st.view = b.dataset.view;
      root.querySelectorAll("[data-view]").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      updateSide(Math.round(st.year));
    }));
    side.chips.addEventListener("click", (e) => { const c = e.target.closest("[data-i]"); if (c) openProfile(PEOPLE[+c.dataset.i].id); });
    side.chips.addEventListener("pointerover", (e) => { const c = e.target.closest("[data-i]"); setHover(c ? +c.dataset.i : -1); });
    side.chips.addEventListener("pointerleave", () => setHover(-1));
    const legend = root.querySelector(".life-legend");
    legend.addEventListener("pointerover", (e) => { const c = e.target.closest("[data-fam]"); st.family = c ? c.dataset.fam : null; kick(); });
    legend.addEventListener("pointerleave", () => { st.family = null; kick(); });
    legend.addEventListener("click", (e) => {
      const c = e.target.closest("[data-fam]");
      if (!c) return;
      st.pinnedFamily = st.pinnedFamily === c.dataset.fam ? null : c.dataset.fam;
      legend.querySelectorAll("[data-fam]").forEach((o) => o.setAttribute("aria-pressed", String(o.dataset.fam === st.pinnedFamily)));
      kick();
    });
    addEventListener("themechange", () => { readColors(); kick(); });
    addEventListener("scroll", () => Tip.hide(), { passive: true });
  }

  function resize(width) {
    W = width;
    const narrow = W < 640;
    g = { narrow, padL: narrow ? 50 : 72, padR: narrow ? 12 : 18, top: 26, pitch: narrow ? 9 : 10, head: narrow ? 15 : 17, font: narrow ? 9 : 11 };
    const lay = layout(st.mode);
    H = lay.height;
    ctx = sizeCanvas(canvas, W, H);
    rowY = lay.ys;
    heads = lay.hs;
    morph = null;
    measureNames();
    kick();
  }

  function markup() {
    const fams = FAMILIES.filter((f) => FAM.some((x) => x.key === f.key));
    return `
      <header class="t-head"><span class="t-num">04</span><div><p class="kicker">Five centuries of lives</p>
        <h2>Who was alive <em>at the same time?</em></h2>
        <p>Every line is one teacher's life, coloured by tradition. Drag across the chart, use the arrow keys or press play: those alive in that year light up, and the map shows where each was living. Click a line to meet that teacher.</p></div></header>
      <div class="life-card">
        <div class="life-tools">
          <button type="button" class="life-round life-play" aria-pressed="false" aria-label="Play through the years">${PLAY}</button>
          <span class="life-lab">Order</span>
          <div class="life-seg" role="group" aria-label="Order the lives"><button type="button" data-mode="birth" aria-pressed="true">By birth</button><button type="button" data-mode="family" aria-pressed="false">By tradition</button></div>
        </div>
        <div class="life-grid">
          <div class="life-chart-col"><div class="life-chart"><canvas tabindex="0" role="slider" aria-label="Year" aria-valuemin="${START}" aria-valuemax="${END}"></canvas></div>
            <div class="life-legend" aria-label="Traditions">${fams.map((f) => `<button type="button" class="life-chip" data-fam="${f.key}" aria-pressed="false" style="--tone: var(${f.tone})"><i class="life-dot"></i>${f.label}<small>${FAM.filter((x) => x.key === f.key).length}</small></button>`).join("")}</div></div>
          <div class="life-side">
            <div class="life-now"><div><p class="kicker">The year</p><b class="life-year">${OPEN_YEAR}</b></div><p class="life-meta"></p></div>
            <div class="life-inset"><svg role="img" aria-label="Where they were living that year" viewBox="0 0 1000 600"><path class="life-land"></path><g>${PEOPLE.map((p) => `<circle class="life-pin" r="12" fill="var(${familyOf(p).tone})" style="opacity:0"></circle>`).join("")}</g><g class="life-labels"></g></svg>
              <div class="life-inset-foot"><div class="life-seg" role="group" aria-label="Map"><button type="button" data-view="auto" aria-pressed="true">Follow</button><button type="button" data-view="europe" aria-pressed="false">Europe</button><button type="button" data-view="atlantic" aria-pressed="false">Atlantic</button></div><small class="life-off"></small></div></div>
            <div class="life-alive" aria-live="polite"></div>
          </div>
        </div>
      </div>`;
  }

  // The first time the chart scrolls into view (and nobody has touched it yet), the cursor sweeps briefly up to 1660.
  function sweepOnFirstView() {
    if (REDUCED || !("IntersectionObserver" in window)) return;
    const seen = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      seen.disconnect();
      if (st.touched || st.playing) return;
      applyYear(1560);
      goTo(OPEN_YEAR, true);
    }, { threshold: 0.3 });
    seen.observe(root.querySelector(".life-chart"));
  }

  Sections.lives = {
    mount(sectionEl) {
      root = sectionEl;
      root.innerHTML = markup();
      canvas = root.querySelector("canvas");
      side = { year: root.querySelector(".life-year"), meta: root.querySelector(".life-meta"), chips: root.querySelector(".life-alive"), svg: root.querySelector(".life-inset svg"), inset: root.querySelector(".life-inset"),
        land: root.querySelector(".life-land"), labels: root.querySelector(".life-labels"), off: root.querySelector(".life-off"), play: root.querySelector(".life-play"), count: 0 };
      pins = [...root.querySelectorAll(".life-pin")];
      readColors();
      bindChart();
      bindPanel();
      const chart = root.querySelector(".life-chart");
      onResize(chart, resize);
      resize(chart.clientWidth);
      applyYear(OPEN_YEAR);
      document.fonts?.ready.then(() => { measureNames(); kick(); });
      sweepOnFirstView();
    },
  };
})();
