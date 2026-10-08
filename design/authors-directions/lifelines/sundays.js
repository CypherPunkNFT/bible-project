// 04 · Spurgeon's Sundays: every dated sermon of his in the library, one row per year and one square per week.
window.Sundays = (() => {
  const SP = personById("author-charles-spurgeon"), FIRST = 1855, LAST = 1891, YEARS = LAST - FIRST + 1, WEEKS = 53;
  const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const sermons = SP.sermons.filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s.d ?? "") && +s.d.slice(0, 4) >= FIRST && +s.d.slice(0, 4) <= LAST).map((s) => {
    const [y, m, d] = s.d.split("-").map(Number), t = Date.UTC(y, m - 1, d);
    return { ...s, y, m, day: d, dow: new Date(t).getUTCDay(), week: Math.floor((t - Date.UTC(y, 0, 1)) / 864e5 / 7) };
  });
  const grid = Array.from({ length: YEARS }, () => Array.from({ length: WEEKS }, () => []));
  for (const s of sermons) grid[s.y - FIRST][s.week].push(s);
  const nice = (s) => `${DAY[s.dow]} ${s.day} ${MONTH[s.m - 1]} ${s.y}`;

  let canvas, ctx, W = 0, H = 0, geo, hover = null, pinned = false, tone, empty, ink, muted;

  function figures() {
    const perYear = grid.map((row, i) => ({ y: FIRST + i, n: row.reduce((a, w) => a + w.length, 0) })).sort((a, b) => b.n - a.n);
    const weeks = grid.reduce((a, row) => a + row.filter((w) => w.length).length, 0);
    const sundays = sermons.filter((s) => s.dow === 0).length;
    const byDay = DAY.map((_, d) => sermons.filter((s) => s.dow === d).length), next = byDay.indexOf(Math.max(...byDay.slice(1)));
    const byBook = new Map();
    for (const s of sermons) { const b = Math.floor(s.v / 1e6); byBook.set(b, (byBook.get(b) ?? 0) + 1); }
    const [book, n] = [...byBook].sort((a, b) => b[1] - a[1])[0];
    const undated = SP.sermons.length - sermons.length;
    return `<dl class="sun-figs">
      <div><dt>Dated sermons</dt><dd>${formatNumber(sermons.length)}<small>preached ${FIRST}–${LAST}; ${formatNumber(undated)} more of his sermons in the library have no full date or fall outside these years</small></dd></div>
      <div><dt>On a Sunday</dt><dd>${Math.round((sundays / sermons.length) * 100)}%<small>${formatNumber(sundays)} of them; the next most common day is ${DAY[next]}, with ${formatNumber(byDay[next])}</small></dd></div>
      <div><dt>Busiest year</dt><dd>${perYear[0].y}<small>${perYear[0].n} sermons in the library from that year</small></dd></div>
      <div><dt>Most-preached book</dt><dd>${L.esc(AUTHORS.books[book - 1].name)}<small>the main text of ${formatNumber(n)} of these sermons</small></dd></div>
    </dl>`;
  }

  function colors() { tone = Frame.color(familyOf(SP).tone); empty = Frame.color("--surface-2"); ink = Frame.color("--ink"); muted = Frame.color("--muted"); }
  function resize(width) {
    W = width;
    const narrow = W < 640, labelW = narrow ? 30 : 38, cw = (W - labelW) / WEEKS, ch = Math.min(narrow ? 7 : 10, Math.max(5, cw * 0.7));
    geo = { narrow, labelW, cw, ch, top: 18, rowGap: narrow ? 2 : 2.5 };
    H = Math.ceil(geo.top + YEARS * (ch + geo.rowGap) + 2);
    ctx = L.sizeCanvas(canvas, W, H);
    draw();
  }
  function cellAt(x, y) {
    const c = Math.floor((x - geo.labelW) / geo.cw), r = Math.floor((y - geo.top) / (geo.ch + geo.rowGap));
    return c >= 0 && c < WEEKS && r >= 0 && r < YEARS ? { r, c } : null;
  }
  function draw() {
    const { labelW, cw, ch, top, rowGap, narrow } = geo;
    ctx.clearRect(0, 0, W, H);
    ctx.font = `500 ${narrow ? 8.5 : 10}px ${L.SANS}`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = muted;
    ctx.textAlign = "left";
    const months = narrow ? [0, 3, 6, 9] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    for (const m of months) { const wk = Math.floor((Date.UTC(1870, m, 1) - Date.UTC(1870, 0, 1)) / 864e5 / 7); ctx.fillText(MONTH[m].slice(0, 3), labelW + wk * cw + 1, 8); }
    for (let r = 0; r < YEARS; r++) {
      const y = top + r * (ch + rowGap);
      if ((FIRST + r) % 5 === 0 || r === 0) { ctx.globalAlpha = 1; ctx.fillStyle = muted; ctx.textAlign = "left"; ctx.fillText(String(FIRST + r), 0, y + ch / 2); }
      for (let c = 0; c < WEEKS; c++) {
        const n = grid[r][c].length;
        ctx.globalAlpha = n ? (n === 1 ? 0.42 : n === 2 ? 0.72 : 1) : 0.55;
        ctx.fillStyle = n ? tone : empty;
        L.roundRect(ctx, labelW + c * cw + 0.75, y, Math.max(1, cw - 1.5), ch, Math.min(2.5, ch / 3));
        ctx.fill();
      }
    }
    if (hover) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5;
      L.roundRect(ctx, geo.labelW + hover.c * cw, top + hover.r * (ch + rowGap) - 0.75, cw, ch + 1.5, 3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function show(cell, e) {
    if (cell?.r !== hover?.r || cell?.c !== hover?.c) { hover = cell; draw(); }
    if (!cell) { L.Tip.hide(); return; }
    const list = grid[cell.r][cell.c], year = FIRST + cell.r;
    if (!list.length) { L.Tip.show(`<b>${year}, week ${cell.c + 1}</b><small>No dated sermon from this week in the library.</small>`, e.clientX, e.clientY); return; }
    L.Tip.show(`<b>${year}, week ${cell.c + 1}</b><ul>${list.slice(0, 4).map((s) => `<li>${L.esc(s.t)}<br><small>${L.esc(s.r)} · ${nice(s)}</small></li>`).join("")}</ul>${list.length > 4 ? `<small>and ${list.length - 4} more</small>` : ""}`, e.clientX, e.clientY);
  }

  function mount(container) {
    const root = document.createElement("section");
    root.className = "sec small";
    root.innerHTML = `${L.head("04", "One preacher, week by week", "Spurgeon's <em>Sundays</em>", `Every sermon of Charles Spurgeon's in the library with a known date, from his first year in London to his last. One row per year, one square per week; the darker the square, the more sermons that week. Point at a square to see them.`)}
      <div class="sundays"><div class="card sundays-card" style="--tone: ${L.toneVar(SP)}"><canvas role="img" aria-label="Spurgeon's dated sermons by week, ${FIRST} to ${LAST}"></canvas>
        <div class="sundays-key"><span><i style="background: color-mix(in srgb, var(--tone) 42%, transparent)"></i>1 sermon</span><span><i style="background: color-mix(in srgb, var(--tone) 72%, transparent)"></i>2</span><span><i style="background: var(--tone)"></i>3 or more</span><span><i style="background: var(--surface-2)"></i>none in the library</span></div></div>
        <div>${figures()}</div></div>`;
    container.append(root);
    canvas = root.querySelector("canvas");
    colors();
    const local = (e) => { const r = canvas.getBoundingClientRect(); return cellAt(e.clientX - r.left, e.clientY - r.top); };
    canvas.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") show(local(e), e); });
    canvas.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") show(null, e); });
    canvas.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") { pinned = true; show(local(e), e); } });
    addEventListener("scroll", () => { if (pinned) { pinned = false; show(null); } }, { passive: true });
    addEventListener("themechange", () => { colors(); draw(); });
    L.onResize(root.querySelector(".sundays-card"), () => resize(canvas.clientWidth));
    resize(canvas.clientWidth);
  }
  return { mount };
})();
