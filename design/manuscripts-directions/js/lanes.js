// B · 01 Through time: the approved "through time (lanes)" section. One lane per tradition across 250 BC to AD 1500, a
// dot per dated copy (a copy dated only by century is spread across its century). Pointing at a dot names the
// manuscript on the line below; choosing it opens the record. Arrow keys walk the dots.
(() => {
  const { mid, yearText, booksText, holderText, sigla } = MSX;
  const LANES = [["hebrew", "Hebrew Bible"], ["dss", "Dead Sea Scrolls"], ["lxx", "Greek Old Testament"], ["papyrus", "NT papyri"],
    ["majuscule", "NT majuscules"], ["minuscule", "NT minuscules"], ["lectionary", "NT lectionaries"], ["latin", "Latin"],
    ["syriac", "Syriac"], ["coptic", "Coptic"], ["gothic", "Gothic"], ["armenian", "Armenian"], ["georgian", "Georgian"], ["geez", "Ge'ez"]];
  const Y0 = -250, Y1 = 1500, LABEL = 206, RIGHT = 54, TOP = 30, LANE = 30;
  const DSS_SPAN = [-250, 135];
  const hash = (text) => { let h = 2166136261; for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; };

  function lanesData() {
    return LANES.map(([key, label], i) => {
      const all = MS.records.filter((r) => r.L.includes(key));
      const dated = all.filter((r) => "e" in r);
      return { key, label, i, all, dated, later: dated.filter((r) => mid(r) > Y1).length, kind: KIND[key] };
    });
  }

  function mount(section, { num }) {
    const lanes = lanesData();
    const datedTotal = MS.records.filter((r) => "e" in r).length;
    section.innerHTML = `${head(num, "Through time", `Every dated copy, <em>tradition by tradition</em>`,
      `${formatNumber(datedTotal)} dated records on one line of time. A copy dated only by century is spread across its century. Point at a dot to read it below; choose it to open the record.`)}
      <div class="ln-scroll"><svg class="ln" role="img" tabindex="0" aria-label="Dated manuscripts by tradition, 250 BC to AD 1500. Arrow keys move between copies; Enter opens one."></svg></div>
      <p class="ms-say ln-say" aria-live="polite"></p>`;
    const svg = section.querySelector(".ln"), say = section.querySelector(".ln-say"), box = section.querySelector(".ln-scroll");
    const base = "Point at a dot. The thin line shows the full range of its date.";
    let W = 0, dots = [], cur = null, laneOf = 0;

    function draw() {
      W = Math.max(760, box.clientWidth);
      const H = TOP + LANES.length * LANE + 8, plot = W - LABEL - RIGHT;
      const sx = (y) => LABEL + ((Math.max(Y0, Math.min(Y1, y)) - Y0) / (Y1 - Y0)) * plot;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("width", W); svg.setAttribute("height", H);
      const ticks = [-250, 1, 250, 500, 750, 1000, 1250, 1500];
      dots = [];
      const parts = [`<defs><pattern id="ln-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v6" class="ln-hatch"/></pattern></defs>`];
      parts.push(ticks.map((t) => `<line class="ln-grid" x1="${sx(t)}" x2="${sx(t)}" y1="${TOP - 6}" y2="${H - 6}"/><text class="ln-tick" x="${sx(t)}" y="14" text-anchor="middle">${t === 1 ? "AD 1" : yearText(t < 0 ? t + 1 : t).replace("AD ", "")}</text>`).join(""));
      for (const lane of lanes) {
        const y0 = TOP + lane.i * LANE, cy = y0 + LANE / 2;
        parts.push(`<line class="ln-rule" x1="${LABEL}" x2="${W - RIGHT}" y1="${y0 + LANE}" y2="${y0 + LANE}"/>`);
        parts.push(`<text class="ln-name" x="0" y="${cy + 4}">${esc(lane.label)}</text><text class="ln-n" x="${LABEL - 12}" y="${cy + 4}" text-anchor="end">${lane.key === "dss" ? formatNumber(lane.all.length) : lane.all.length ? `${formatNumber(lane.dated.length)}${lane.dated.length !== lane.all.length ? ` / ${formatNumber(lane.all.length)}` : ""}` : "none"}</text>`);
        if (lane.key === "dss") {
          parts.push(`<rect class="ln-band" data-band="1" x="${sx(DSS_SPAN[0])}" y="${y0 + 6}" width="${sx(DSS_SPAN[1]) - sx(DSS_SPAN[0])}" height="${LANE - 12}" rx="4"/>`);
          parts.push(`<text class="ln-bandtext" x="${sx(DSS_SPAN[1]) + 8}" y="${cy + 4}">no date per scroll in this data</text>`);
        }
        if (lane.later) parts.push(`<text class="ln-later" x="${W - RIGHT + 8}" y="${cy + 4}">+${lane.later}</text>`);
        for (const r of lane.dated) {
          const m = mid(r);
          if (m > Y1) continue;
          const span = r.l - r.e, x = sx(span >= 50 ? r.e + hash(`${r.i}x`) * span : m), y = cy + (hash(r.i + lane.key) * 2 - 1) * (LANE / 2 - 6);
          dots.push({ r, x, y, lane: lane.i, x0: sx(r.e), x1: sx(r.l) });
          parts.push(`<circle class="ln-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" style="fill: var(${lane.kind.tone})"/>`);
        }
      }
      parts.push(`<text class="ln-later" x="${W - RIGHT + 8}" y="14">later</text>`);
      parts.push(`<g class="ln-focus" hidden><line class="ln-range"/><circle class="ln-ring" r="6"/></g>`);
      svg.innerHTML = parts.join("");
      for (const lane of lanes) lane.dots = dots.filter((d) => d.lane === lane.i).sort((a, b) => a.x - b.x);
      if (cur) focusDot(dots.find((d) => d.r === cur.r && d.lane === cur.lane) ?? null);
    }
    function focusDot(d) {
      cur = d;
      const g = svg.querySelector(".ln-focus");
      if (!d) { g.hidden = true; say.textContent = base; return; }
      laneOf = d.lane;
      g.hidden = false;
      const ring = g.querySelector(".ln-ring"), range = g.querySelector(".ln-range");
      ring.setAttribute("cx", d.x); ring.setAttribute("cy", d.y);
      range.setAttribute("x1", d.x0); range.setAttribute("x2", d.x1); range.setAttribute("y1", d.y); range.setAttribute("y2", d.y);
      ring.style.stroke = `var(${KIND[LANES[d.lane][0]].tone})`;
      const r = d.r, bits = [sigla(r), r.d, booksText(r), holderText(r)].filter(Boolean);
      say.innerHTML = `<b>${esc(r.n)}</b> · ${bits.map(esc).join(" · ")} <span class="ms-say-go">Choose to open</span>`;
    }
    function bandSay() {
      cur = null; svg.querySelector(".ln-focus").hidden = true;
      say.innerHTML = `<b>The Judaean Desert scrolls</b> · ${formatNumber(MS.counts.byKind.dss)} manuscripts from Qumran, Masada and the caves nearby. This data gives no date scroll by scroll; they are generally dated between the 3rd century BC and the 2nd century AD.`;
    }
    function nearest(px, py) {
      const lane = Math.floor((py - TOP) / LANE);
      if (lane < 0 || lane >= LANES.length) return null;
      let best = null, bestD = 14 * 14;
      for (const d of lanes[lane].dots) {
        const dd = (d.x - px) ** 2 + (d.y - py) ** 2;
        if (dd < bestD) { bestD = dd; best = d; }
      }
      return best;
    }
    const local = (e) => { const b = svg.getBoundingClientRect(); return [(e.clientX - b.left) * (W / b.width), e.clientY - b.top]; };
    svg.addEventListener("pointermove", (e) => {
      if (e.target.closest("[data-band]")) { bandSay(); return; }
      const d = nearest(...local(e));
      if (d) focusDot(d);
    });
    svg.addEventListener("pointerleave", () => focusDot(null));
    svg.addEventListener("click", (e) => { const d = nearest(...local(e)); if (d) Sheet.open(d.r.i, svg); });
    svg.addEventListener("keydown", (e) => {
      const lane = lanes[laneOf];
      if (e.key === "Enter" && cur) { Sheet.open(cur.r.i, svg); return; }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const list = lane.dots, at = cur ? list.indexOf(cur) : -1;
        if (list.length) focusDot(list[Math.max(0, Math.min(list.length - 1, at + (e.key === "ArrowRight" ? 1 : -1)))] ?? list[0]);
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        let next = laneOf;
        do { next = (next + (e.key === "ArrowDown" ? 1 : -1) + LANES.length) % LANES.length; } while (!lanes[next].dots.length && next !== laneOf);
        laneOf = next; focusDot(lanes[next].dots[0] ?? null);
      }
    });
    say.textContent = base;
    let lastWidth = 0;
    new ResizeObserver(() => { if (box.clientWidth !== lastWidth) { lastWidth = box.clientWidth; draw(); } }).observe(box);
    addEventListener("themechange", draw);
  }
  Sections.lanes = { mount };
})();
