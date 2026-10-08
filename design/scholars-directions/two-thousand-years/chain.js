// "How the text reached you": the chain of scholars who carried the Bible's text to English readers, as a relay of
// cards joined by a line that draws itself step by step as the section scrolls into view, with a year ruler beneath
// that shows the gaps between the steps (computed from the year of each step's work).
(() => {
  const { D, byId, esc, tone, faith, fmt, TODAY, reduced } = Yrs;
  const PRINT_FROM = 1450; // the hand-copied centuries, then the age of print
  const steps = D.chain.steps.map(([id, what], i) => {
    const s = byId.get(id), [title, year] = s.works[0];
    return { i, s, what, title, year, phase: year < PRINT_FROM ? "Copied by hand" : "Printed" };
  });

  function longestGap() {
    let best = null;
    for (let i = 1; i < steps.length; i++) {
      const gap = steps[i].year - steps[i - 1].year;
      if (!best || gap > best.gap) best = { gap, from: steps[i - 1], to: steps[i] };
    }
    return best;
  }

  // The year ruler: one dot per distinct year (steps in the same year share it), the gaps bracketed beneath.
  function ruler(width) {
    const x = (y) => (y / TODAY) * width, narrow = width < 560;
    const points = [];
    for (const st of steps) {
      const last = points.at(-1);
      if (last && last.year === st.year) last.names.push(st.s.short); else points.push({ year: st.year, names: [st.s.short], tone: tone(st.s) });
    }
    // Labels merge into one stacked label whenever they would touch (widths estimated from the text length).
    const labelW = (c) => Math.max(...c.map((p) => (p.names.join(" & ").length + 5) * 6.4));
    const centre = (c) => Math.max(48, Math.min(width - 48, c.reduce((t, p) => t + x(p.year), 0) / c.length));
    let clusters = points.map((p) => [p]);
    for (let merged = true; merged;) {
      merged = false;
      for (let i = 1; i < clusters.length; i++) {
        if (centre(clusters[i]) - centre(clusters[i - 1]) < (labelW(clusters[i]) + labelW(clusters[i - 1])) / 2 + 10) {
          clusters.splice(i - 1, 2, [...clusters[i - 1], ...clusters[i]]); merged = true; break;
        }
      }
    }
    const lines = Math.max(...clusters.map((c) => c.length));
    const big = longestGap();
    const ends = [...points.map((p) => p.year), TODAY];
    const gaps = ends.slice(1).map((to, i) => {
      const from = ends[i], w = x(to) - x(from), isBig = big && from === big.from.year && to === big.to.year;
      const label = to === TODAY ? `${fmt(to - from)} years to today` : `${fmt(to - from)} years`;
      return `<span class="ch-gap${isBig ? " ch-gap-big" : ""}${to === TODAY ? " ch-gap-now" : ""}" style="left:${x(from)}px;width:${w}px">${w > (narrow ? 64 : 76) ? `<em>${label}</em>` : ""}</span>`;
    }).join("");
    const labels = clusters.map((c) => {
      const half = labelW(c) / 2, pos = Math.max(half, Math.min(width - half, centre(c)));
      return `<span class="ch-lab" style="left:${pos}px">${c.map((p) => `<b>${p.names.map(esc).join(" & ")}</b> ${p.year}`).join("<br>")}</span>`;
    }).join("");
    const axis = [500, 1000, 1500].map((y) => `<span class="ch-tick" style="left:${x(y)}px">${y}</span>`).join("");
    return `<div class="ch-labs" style="height:${lines * 1.35 + 0.6}em">${labels}</div>
      <div class="ch-track"><i></i>${points.map((p) => `<span class="ch-dot" style="left:${x(p.year)}px;--tone:${p.tone}"></span>`).join("")}<span class="ch-now" style="left:${width}px"></span></div>
      <div class="ch-gaps">${gaps}</div>
      <div class="ch-axis"><span class="ch-tick" style="left:0">AD 1</span>${axis}<span class="ch-tick ch-tick-now" style="left:${width}px">Today</span></div>`;
  }

  function mount(section) {
    const first = steps[0], last = steps.at(-1), big = longestGap();
    const runs = [];
    for (const st of steps) { if (runs.at(-1)?.phase === st.phase) runs.at(-1).n++; else runs.push({ phase: st.phase, n: 1 }); }
    section.innerHTML = `<header class="yr-head"><p class="kicker">The chain of hands</p>
        <h2>How the text <em>reached you.</em></h2>
        <p>${steps.length} scholars across ${fmt(last.year - first.year)} years, each carrying the Bible's text a step nearer to readers of English. Click any of them for their profile.</p></header>
      <div class="ch-phases" style="--n:${steps.length}">${runs.map((r) => `<span style="grid-column:span ${r.n}">${r.phase}</span>`).join("")}</div>
      <ol class="ch-steps" style="--n:${steps.length}">${steps.map((st) => `<li style="--i:${st.i};--tone:${tone(st.s)}">
          <span class="ch-node" aria-hidden="true">${st.i + 1}</span>${st.i < steps.length - 1 ? '<span class="ch-seg" aria-hidden="true"></span>' : ""}
          <button type="button" class="ch-card" data-open="${esc(st.s.id)}">
            <span class="ch-phase">${st.phase}</span>
            <span class="ch-year">${st.year}</span>
            <b>${esc(st.s.short)}</b>
            <span class="ch-what">${esc(st.what)}</span>
            <span class="ch-work">${esc(st.title)}</span>
            <span class="ch-faith"><i></i>${esc(faith(st.s))}</span>
          </button></li>`).join("")}</ol>
      <div class="ch-ruler-box">
        <p class="ch-callout">The longest wait between two steps: <b>${fmt(big.gap)} years</b>, from ${esc(big.from.s.short)} (${esc(big.from.title)}, ${big.from.year}) to ${esc(big.to.s.short)} (${esc(big.to.title)}, ${big.to.year}).</p>
        <div class="ch-ruler"></div>
        <p class="ch-note">The ruler runs evenly from AD 1 to today; each dot is the year of a step's work.</p>
      </div>`;

    const box = section.querySelector(".ch-ruler"), list = section.querySelector(".ch-steps");
    let width = 0;
    new ResizeObserver(() => { if (box.clientWidth !== width) { width = box.clientWidth; box.innerHTML = ruler(width); } }).observe(box);

    // The line draws as the list scrolls up the screen; once drawn it stays drawn.
    let shown = 0, ticking = false;
    const update = () => {
      ticking = false;
      const r = list.getBoundingClientRect(), vh = innerHeight;
      const p = Math.max(0, Math.min(1, (vh * 0.88 - r.top) / Math.max(r.height, vh * 0.45)));
      if (p > shown) { shown = p; section.style.setProperty("--p", p.toFixed(3)); }
      if (shown >= 1) removeEventListener("scroll", onScroll);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    if (reduced()) section.style.setProperty("--p", "1");
    else { section.style.setProperty("--p", "0"); addEventListener("scroll", onScroll, { passive: true }); update(); }
  }

  Yrs.sections.chain = { mount };
})();
