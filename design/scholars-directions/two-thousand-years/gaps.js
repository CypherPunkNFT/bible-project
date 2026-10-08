// "Gaps and crowds": how many of these scholars were alive in each decade, on an even scale, with the empty
// stretches found and named from the data. Hover a decade for who was alive; click a gap to see it on the timeline.
(() => {
  const { scholars, ERAS, TODAY, esc, fmt } = Yrs;
  const MIN_GAP = 40, SANS = '"Archivo Variable", system-ui, sans-serif';
  const decades = [];
  for (let d = 0; d <= TODAY; d += 10) decades.push({ d, alive: scholars.filter((s) => s.born <= d + 9 && s.died >= d) });
  const peak = Math.max(...decades.map((x) => x.alive.length));

  // Stretches of at least MIN_GAP years when no one on the list was alive, with who came just before and just after.
  const gaps = (() => {
    const found = [];
    let reach = -Infinity, lastOut = null;
    for (const s of [...scholars].sort((a, b) => a.born - b.born)) {
      if (lastOut && s.born - reach >= MIN_GAP) found.push({ from: reach, to: s.born, before: lastOut, after: s });
      if (s.died > reach) { reach = s.died; lastOut = s; }
    }
    return found;
  })();
  const peakRuns = (() => {
    const runs = [];
    for (const x of decades) if (x.alive.length === peak) { const r = runs.at(-1); if (r && r.to === x.d - 10) r.to = x.d; else runs.push({ from: x.d, to: x.d }); }
    return runs;
  })();
  const decadeName = (d) => `${d}s`;
  const runName = (r) => (r.from === r.to ? `the ${decadeName(r.from)}` : `the ${decadeName(r.from)} to the ${decadeName(r.to)}`);

  function mount(section) {
    const quiet = gaps.reduce((t, g) => t + g.to - g.from, 0);
    section.innerHTML = `<header class="yr-head"><p class="kicker">Gaps and crowds</p>
        <h2>Long silences, <em>then a crowd.</em></h2>
        <p>Each column is a decade; its height is how many of these ${scholars.length} were alive in it. The hatched stretches had no one from this list at all.</p></header>
      <div class="gp-card">
        <div class="gp-stage"><canvas aria-label="Scholars alive in each decade from AD 1 to today" role="img"></canvas></div>
        <p class="gp-read" aria-live="polite"></p>
      </div>
      <div class="gp-list">
        <button type="button" class="gp-item gp-peak" data-from="${peakRuns[0].from - 40}" data-to="${peakRuns.at(-1).to + 50}">
          <span class="gp-big">${peak}</span><span><b>The most alive at once</b>, in ${peakRuns.map(runName).join(" and ")}.</span></button>
        ${gaps.map((g, i) => `<button type="button" class="gp-item" data-gap="${i}" data-from="${g.from - 30}" data-to="${g.to + 30}">
          <span class="gp-big">${g.before.circa || g.after.circa ? "c. " : ""}${fmt(g.to - g.from)}<small>years</small></span>
          <span><b>No scholar on this list between ${esc(g.before.short)} and ${esc(g.after.short)}.</b> ${esc(g.before.short)} died ${g.from}; ${esc(g.after.short)} was born ${g.to}.</span></button>`).join("")}
      </div>
      <p class="gp-note">Together the empty stretches add up to ${fmt(quiet)} of the ${fmt(TODAY)} years. Click any of these to see it on the timeline above.</p>`;

    const stage = section.querySelector(".gp-stage"), canvas = section.querySelector("canvas"), ctx = canvas.getContext("2d"), read = section.querySelector(".gp-read");
    let W = 0, H = 0, dpr = 1, pad = 0, hover = -1, lit = -1, pal = {};
    const defaultRead = `Hover a column to see who was alive in that decade.`;
    read.textContent = defaultRead;

    const palette = () => { const c = (t) => Frame.color(t); pal = { ink: c("--ink"), muted: c("--muted"), line: c("--line"), accent: c("--accent"), surface2: c("--surface-2"), dark: document.documentElement.dataset.theme === "dark" }; };
    const x = (y) => pad + (y / TODAY) * (W - pad * 2);

    function draw() {
      const top = 22, base = H - 24, colW = x(10) - x(0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ERAS.forEach((e, i) => {
        if (i % 2 === 0) { ctx.globalAlpha = pal.dark ? 0.5 : 0.55; ctx.fillStyle = pal.surface2; ctx.fillRect(x(e.from), 0, x(e.to) - x(e.from), base); ctx.globalAlpha = 1; }
        ctx.font = `600 9px ${SANS}`; ctx.fillStyle = pal.muted; ctx.textAlign = "left"; ctx.textBaseline = "middle";
        if ("letterSpacing" in ctx) ctx.letterSpacing = "1.2px";
        if (ctx.measureText(e.short.toUpperCase()).width + 12 < x(e.to) - x(e.from)) ctx.fillText(e.short.toUpperCase(), x(e.from) + 6, 11);
        if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
      });
      gaps.forEach((g, i) => {
        const x0 = x(g.from), x1 = x(g.to);
        ctx.save(); ctx.beginPath(); ctx.rect(x0, top, x1 - x0, base - top); ctx.clip();
        ctx.strokeStyle = pal.muted; ctx.globalAlpha = i === lit ? 0.6 : 0.28; ctx.lineWidth = 1; ctx.beginPath();
        for (let k = x0 - (base - top); k < x1; k += 6) { ctx.moveTo(k, base); ctx.lineTo(k + (base - top), top); }
        ctx.stroke(); ctx.restore();
        ctx.font = `600 10px ${SANS}`; ctx.textAlign = "center";
        const label = `${fmt(g.to - g.from)} yrs`;
        if (ctx.measureText(label).width + 10 < x1 - x0) { ctx.fillStyle = i === lit ? pal.ink : pal.muted; ctx.fillText(label, (x0 + x1) / 2, top + 10); }
      });
      decades.forEach((dec, i) => {
        const n = dec.alive.length;
        if (!n) return;
        const h = ((base - top - 16) * n) / peak;
        ctx.fillStyle = i === hover ? pal.ink : pal.accent;
        ctx.globalAlpha = i === hover ? 1 : 0.8;
        ctx.beginPath(); ctx.roundRect(x(dec.d) + 0.4, base - h, Math.max(1, colW - 0.8), h, Math.min(2, colW / 2)); ctx.fill();
        ctx.globalAlpha = 1;
      });
      ctx.fillStyle = pal.line; ctx.fillRect(pad, base, W - pad * 2, 1);
      ctx.font = `500 10px ${SANS}`; ctx.fillStyle = pal.muted; ctx.textAlign = "center";
      for (const y of [500, 1000, 1500, 2000]) ctx.fillText(String(y), x(y), base + 13);
      ctx.textAlign = "left"; ctx.fillText("AD 1", pad, base + 13);
    }

    function layout() {
      W = stage.clientWidth; H = W < 640 ? 130 : 150; pad = W < 640 ? 4 : 8;
      dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); canvas.style.height = `${H}px`;
    }

    function pick(e) {
      const r = canvas.getBoundingClientRect(), year = ((e.clientX - r.left - pad) / (W - pad * 2)) * TODAY;
      const i = Math.max(0, Math.min(decades.length - 1, Math.floor(year / 10)));
      if (i === hover) return;
      hover = i;
      const dec = decades[i];
      read.innerHTML = dec.alive.length
        ? `<b>${decadeName(dec.d)}</b> · ${dec.alive.length} alive: ${dec.alive.map((s) => esc(s.short)).join(", ")}`
        : `<b>${decadeName(dec.d)}</b> · no one on this list was alive`;
      draw();
    }
    canvas.addEventListener("pointermove", pick);
    canvas.addEventListener("pointerdown", pick);
    canvas.addEventListener("pointerleave", () => { hover = -1; read.textContent = defaultRead; draw(); });

    const list = section.querySelector(".gp-list");
    list.addEventListener("click", (e) => {
      const item = e.target.closest(".gp-item");
      if (item && Yrs.showYears) Yrs.showYears(Number(item.dataset.from), Number(item.dataset.to));
    });
    list.addEventListener("pointerover", (e) => { const g = e.target.closest("[data-gap]"); const n = g ? Number(g.dataset.gap) : -1; if (n !== lit) { lit = n; draw(); } });
    list.addEventListener("pointerleave", () => { lit = -1; draw(); });

    palette(); layout(); draw();
    new ResizeObserver(() => { if (stage.clientWidth !== W) { layout(); draw(); } }).observe(stage);
    addEventListener("themechange", () => { palette(); draw(); });
    document.fonts?.ready.then(draw);
  }

  Yrs.sections.gaps = { mount };
})();
