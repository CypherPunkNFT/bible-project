// B · 01 Through time: the approved "through time (lanes)" section. One lane per tradition across 250 BC to AD 1500, a
// dot per dated copy (a copy dated only by century is spread across its century). Pointing at a lane opens it out: the
// lane grows and its dots stack into columns so each can be told apart (tapping the lane's name does the same on touch).
// Pointing at a dot names the manuscript on the line below; choosing it opens the record. Arrow keys walk the dots.
(() => {
  const { mid, yearText, booksText, holderText, sigla } = MSX;
  const LANES = [["hebrew", "Hebrew Bible"], ["dss", "Dead Sea Scrolls"], ["lxx", "Greek Old Testament"], ["papyrus", "NT papyri"],
    ["majuscule", "NT majuscules"], ["minuscule", "NT minuscules"], ["lectionary", "NT lectionaries"], ["latin", "Latin"],
    ["syriac", "Syriac"], ["coptic", "Coptic"], ["gothic", "Gothic"], ["armenian", "Armenian"], ["georgian", "Georgian"], ["geez", "Ge'ez"]];
  const Y0 = -250, Y1 = 1500, LABEL = 206, RIGHT = 54, TOP = 30, LANE = 36;
  const OPEN_MIN = 64, OPEN_MAX = 240, STEP = 6.4, COL = 6.5, OPEN_DELAY = 140, CLOSE_DELAY = 220;
  const DSS_SPAN = [-250, 135];
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const hash = (text) => { let h = 2166136261; for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; };
  const ease = (t) => 1 - (1 - t) ** 3;

  function lanesData() {
    return LANES.map(([key, label], i) => {
      const all = MS.records.filter((r) => r.L.includes(key));
      const dated = all.filter((r) => "e" in r);
      return { key, label, i, all, dated, later: dated.filter((r) => mid(r) > Y1).length, kind: KIND[key], f: 0, target: 0 };
    });
  }

  // What the small number under a lane's name says, in words rather than a bare fraction.
  function countText(lane) {
    if (lane.key === "dss") return `${formatNumber(lane.all.length)} scrolls · none dated yet`;
    if (!lane.all.length) return "no open records yet";
    if (lane.dated.length === lane.all.length) return lane.all.length === 1 ? "1 copy, dated" : `${formatNumber(lane.all.length)} copies, all dated`;
    return `${formatNumber(lane.dated.length)} dated of ${formatNumber(lane.all.length)}`;
  }

  // The open lane's layout: dots binned into narrow columns and stacked outward from the middle line.
  function stack(lane) {
    const byCol = new Map();
    let deepest = 0;
    for (const d of [...lane.dots].sort((a, b) => a.x - b.x)) {
      const col = Math.round(d.x / COL), k = byCol.get(col) ?? 0;
      byCol.set(col, k + 1);
      d.k = k ? (k % 2 ? 1 : -1) * Math.ceil(k / 2) : 0;
      deepest = Math.max(deepest, Math.abs(d.k));
    }
    const step = Math.min(STEP, (OPEN_MAX - 28) / Math.max(1, 2 * deepest));
    lane.open = Math.max(OPEN_MIN, Math.min(OPEN_MAX, 2 * deepest * step + 28));
    for (const d of lane.dots) d.ye = d.k * step;
  }

  function mount(section, { num }) {
    const lanes = lanesData();
    const datedTotal = MS.records.filter((r) => "e" in r).length;
    section.innerHTML = `${head(num, "Through time", `Every dated copy, <em>tradition by tradition</em>`,
      `${formatNumber(datedTotal)} dated records on one line of time. A copy dated only by century is spread across its century. Point at a row to open it out, then at a dot to read it below; choose it to open the record. Under each name: how many copies have a date and can be placed, of all we hold.`)}
      <div class="ln-scroll"><svg class="ln" role="img" tabindex="0" aria-label="Dated manuscripts by tradition, 250 BC to AD 1500. Up and down arrows open a tradition; left and right move between copies; Enter opens one."></svg></div>
      <p class="ms-say ln-say" aria-live="polite"></p>`;
    const svg = section.querySelector(".ln"), say = section.querySelector(".ln-say"), box = section.querySelector(".ln-scroll");
    const base = "Point at a row to open it out, then at a dot. The thin line shows the full range of its date.";
    let W = 0, cur = null, laneOf = 0, openLane = null, timer = 0, frame = 0;

    const heightOf = (lane) => LANE + (lane.open - LANE) * ease(lane.f);
    const tops = () => { let y = TOP; return lanes.map((lane) => { const top = y; y += heightOf(lane); return top; }); };
    const dotY = (d, top) => { const lane = lanes[d.lane], h = heightOf(lane); return top + h / 2 + d.yc + (d.ye - d.yc) * ease(lane.f); };

    function draw() {
      W = Math.max(760, box.clientWidth);
      const plot = W - LABEL - RIGHT;
      const sx = (y) => LABEL + ((Math.max(Y0, Math.min(Y1, y)) - Y0) / (Y1 - Y0)) * plot;
      const ticks = [-250, 1, 250, 500, 750, 1000, 1250, 1500];
      const parts = [`<defs><pattern id="ln-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v6" class="ln-hatch"/></pattern></defs>`];
      parts.push(ticks.map((t) => `<line class="ln-grid" x1="${sx(t)}" x2="${sx(t)}" y1="${TOP - 6}"/><text class="ln-tick" x="${sx(t)}" y="14" text-anchor="middle">${t === 1 ? "AD 1" : yearText(t < 0 ? t + 1 : t).replace("AD ", "")}</text>`).join(""));
      for (const lane of lanes) {
        lane.dots = [];
        for (const r of lane.dated) {
          const m = mid(r);
          if (m > Y1) continue;
          const span = r.l - r.e;
          lane.dots.push({ r, lane: lane.i, x: sx(span >= 50 ? r.e + hash(`${r.i}x`) * span : m), yc: (hash(r.i + lane.key) * 2 - 1) * (LANE / 2 - 7), x0: sx(r.e), x1: sx(r.l) });
        }
        stack(lane);
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
      parts.push(`<g class="ln-focus" hidden><line class="ln-range"/><circle class="ln-ring" r="6"/></g>`);
      svg.innerHTML = parts.join("");
      for (const lane of lanes) {
        lane.g = svg.querySelector(`.ln-lane[data-lane="${lane.i}"]`);
        lane.circles = [...lane.g.querySelectorAll(".ln-dot")];
        lane.dots.forEach((d, n) => { d.el = lane.circles[n]; d.el.setAttribute("cx", d.x.toFixed(1)); });
        lane.dots.sort((a, b) => a.x - b.x);
      }
      place(true);
      if (cur) focusDot(lanes[cur.lane].dots.find((d) => d.r === cur.r) ?? null);
    }

    // Puts every lane, rule and dot where the current open/closed state says; `all` repositions every dot, otherwise only
    // the dots of lanes that are still moving.
    function place(all) {
      const at = tops(), total = at[at.length - 1] + heightOf(lanes[lanes.length - 1]);
      svg.setAttribute("viewBox", `0 0 ${W} ${total + 8}`); svg.setAttribute("width", W); svg.setAttribute("height", total + 8);
      svg.querySelectorAll(".ln-grid").forEach((line) => line.setAttribute("y2", total + 2));
      for (const lane of lanes) {
        const h = heightOf(lane), top = at[lane.i];
        lane.g.setAttribute("transform", `translate(0 ${top.toFixed(1)})`);
        lane.g.classList.toggle("is-open", lane.target === 1);
        lane.g.querySelector(".ln-wash").setAttribute("height", h.toFixed(1));
        const rule = lane.g.querySelector(".ln-rule"); rule.setAttribute("y1", h.toFixed(1)); rule.setAttribute("y2", h.toFixed(1));
        lane.g.querySelector(".ln-band")?.setAttribute("height", (h - 12).toFixed(1));
        lane.g.querySelector(".ln-bandtext")?.setAttribute("y", (h / 2 + 4).toFixed(1));
        lane.g.querySelector(".ln-later")?.setAttribute("y", (h / 2 + 4).toFixed(1));
        if (!all && lane.f === lane.target) continue;
        for (const d of lane.dots) d.el.setAttribute("cy", (dotY(d, top) - top).toFixed(1));
      }
      if (cur) ringAt(cur);
    }

    function animate() {
      cancelAnimationFrame(frame);
      let last = performance.now();
      const tick = (now) => {
        const dt = motion.matches ? 1 : Math.max(0, now - last) / 240; // the first frame's stamp can precede `last`
        last = now;
        let moving = false;
        for (const lane of lanes) {
          if (lane.f === lane.target) continue;
          lane.f = lane.target > lane.f ? Math.min(lane.target, lane.f + dt) : Math.max(lane.target, lane.f - dt);
          moving = true;
        }
        place(false);
        if (moving) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }

    function openAt(index) {
      if (index === openLane) return;
      openLane = index;
      for (const lane of lanes) lane.target = lane.i === index ? 1 : 0;
      animate();
    }
    function schedule(index, delay) {
      clearTimeout(timer);
      timer = setTimeout(() => openAt(index), delay);
    }

    function ringAt(d) {
      const g = svg.querySelector(".ln-focus"), at = tops(), y = dotY(d, at[d.lane]);
      const ring = g.querySelector(".ln-ring"), range = g.querySelector(".ln-range");
      ring.setAttribute("cx", d.x); ring.setAttribute("cy", y);
      range.setAttribute("x1", d.x0); range.setAttribute("x2", d.x1); range.setAttribute("y1", y); range.setAttribute("y2", y);
    }
    function focusDot(d) {
      cur = d;
      const g = svg.querySelector(".ln-focus");
      if (!d) { g.hidden = true; say.textContent = base; return; }
      laneOf = d.lane;
      g.hidden = false;
      ringAt(d);
      g.querySelector(".ln-ring").style.stroke = `var(${KIND[LANES[d.lane][0]].tone})`;
      const r = d.r, bits = [sigla(r), r.d, booksText(r), holderText(r)].filter(Boolean);
      say.innerHTML = `<b>${esc(r.n)}</b> · ${bits.map(esc).join(" · ")} <span class="ms-say-go">Choose to open</span>`;
    }
    function bandSay() {
      cur = null; svg.querySelector(".ln-focus").hidden = true;
      say.innerHTML = `<b>The Judaean Desert scrolls</b> · ${formatNumber(MS.counts.byKind.dss)} manuscripts from Qumran, Masada and the caves nearby. This data gives no date scroll by scroll; they are generally dated between the 3rd century BC and the 2nd century AD.`;
    }

    function laneAt(py) {
      const at = tops();
      for (let i = lanes.length - 1; i >= 0; i--) if (py >= at[i]) return py < at[i] + heightOf(lanes[i]) ? i : null;
      return null;
    }
    function nearest(px, py, index) {
      if (index == null) return null;
      const top = tops()[index];
      let best = null, bestD = 12 * 12;
      for (const d of lanes[index].dots) {
        const dd = (d.x - px) ** 2 + (dotY(d, top) - py) ** 2;
        if (dd < bestD) { bestD = dd; best = d; }
      }
      return best;
    }
    const local = (e) => { const b = svg.getBoundingClientRect(); return [(e.clientX - b.left) * (W / b.width), (e.clientY - b.top) * (W / b.width)]; };

    svg.addEventListener("pointermove", (e) => {
      const [px, py] = local(e), index = laneAt(py);
      if (index != null && index !== openLane && lanes[index].dots.length) schedule(index, OPEN_DELAY);
      else if (index === openLane) clearTimeout(timer);
      if (e.target.closest("[data-band]")) { bandSay(); return; }
      const d = nearest(px, py, index);
      if (d) focusDot(d);
    });
    svg.addEventListener("pointerleave", () => { focusDot(null); schedule(null, CLOSE_DELAY); });
    svg.addEventListener("click", (e) => {
      const [px, py] = local(e), index = laneAt(py);
      if (index == null) return;
      if (px < LABEL) { openAt(index === openLane ? null : index); return; }
      const d = nearest(px, py, index);
      if (d) Sheet.open(d.r.i, svg);
      else if (lanes[index].dots.length) openAt(index);
    });
    svg.addEventListener("keydown", (e) => {
      const lane = lanes[laneOf];
      if (e.key === "Enter" && cur) { Sheet.open(cur.r.i, svg); return; }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        openAt(laneOf);
        const list = lane.dots, at = cur ? list.indexOf(cur) : -1;
        if (list.length) focusDot(list[Math.max(0, Math.min(list.length - 1, at + (e.key === "ArrowRight" ? 1 : -1)))] ?? list[0]);
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        let next = laneOf;
        do { next = (next + (e.key === "ArrowDown" ? 1 : -1) + LANES.length) % LANES.length; } while (!lanes[next].dots.length && next !== laneOf);
        laneOf = next; openAt(next); focusDot(lanes[next].dots[0] ?? null);
      }
      if (e.key === "Escape") { openAt(null); focusDot(null); }
    });
    say.textContent = base;
    let lastWidth = 0;
    new ResizeObserver(() => { if (box.clientWidth !== lastWidth) { lastWidth = box.clientWidth; draw(); } }).observe(box);
    addEventListener("themechange", draw);
  }
  Sections.lanes = { mount };
})();
