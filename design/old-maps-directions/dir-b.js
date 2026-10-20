// Direction B, "The map chest": the approved cabinet intro (big plain type, four small figures beside it), then a chest
// of drawers, one per century. A rail of Roman numerals opens a drawer; its maps lie in a quiet grid with the giant
// numeral behind (the cinema-chapter feel), and drawers slide sideways as you move through them. Subject crystals
// filter every drawer. Any map opens full size in the slide-in viewer.
(() => {
  const { D, esc, fmt, subjects, subjectByKey, maps, ROMAN, ORDINAL, centuryOf, dotHas, head, thumb, crystals, figures } = OM;

  const DRAWERS = [
    { id: "med", label: "Before print", numeral: "VII–XV", lo: 0, hi: 1499, name: "Manuscripts and the first printed maps" },
    ...[16, 17, 18, 19, 20].map((c) => ({ id: String(c), label: `${c}th century`, numeral: ROMAN[c], lo: (c - 1) * 100, hi: c * 100 - 1, name: `The ${ORDINAL[c]} century` })),
    { id: "nd", label: "Undated", numeral: "n.d.", lo: null, hi: null, name: "Maps with no date in their record" },
  ];
  const inDrawer = (drawer, year) => drawer.lo === null ? year == null : year != null && year >= drawer.lo && year <= drawer.hi;
  // How many held maps each drawer stands for (all dated on-subject maps, not only this mock-up's selection).
  const heldIn = (drawer) => drawer.lo === null ? D.counts.onSubject - D.counts.dated : D.dots.filter((d) => inDrawer(drawer, d[0])).length;
  const SHOW = 12;

  Sections.b_landing = { mount(section) {
    const c = D.counts;
    section.classList.add("om-landing", "om-cabinet-intro");
    section.innerHTML = `<div><p class="om-crumb"><a href="/study">Study</a><span>/</span><a href="/study/atlas">Atlas</a><span>/</span>Old maps</p>
        <h1>In the <em>map chest</em></h1>
        <p class="om-lede">Every old map of the biblical world we hold, laid in drawers by century: hand-drawn manuscripts, the first woodcuts, the great Dutch atlases and the measured surveys of the 1800s. Open a drawer, choose a map, and read it at full size.</p></div>
      ${figures([["Maps", fmt(c.onSubject), "of the biblical world"], ["Earliest", c.earliest, "a plan of Jerusalem"], ["Mapmakers", fmt(c.makers), "named in the records"], ["Libraries", c.libraries, "credited on every map"]])}`;
  } };

  Sections.b_chest = { mount(section) {
    section.innerHTML = `${head("01", "The chest", "Seven drawers, <em>one per age</em>", "Choose a drawer. A subject keeps only its maps in every drawer; the counts on the rail are the maps we hold, the grid the ones this mock-up carries.")}
      <div class="om-chest-chips"></div>
      <div class="om-rail" role="tablist" aria-label="Centuries"></div>
      <div class="om-drawer" role="tabpanel"><div class="om-drawer-inner"></div></div>`;
    const rail = section.querySelector(".om-rail");
    const drawerEl = section.querySelector(".om-drawer");
    const inner = section.querySelector(".om-drawer-inner");
    let filter = new Set();
    let current = 1;
    let expanded = false;
    const matches = (m) => filter.size === 0 || m.s.some((k) => filter.has(k));

    function drawRail() {
      rail.innerHTML = DRAWERS.map((d, i) => {
        const shown = maps.filter((m) => inDrawer(d, m.y) && matches(m)).length;
        return `<button type="button" role="tab" aria-selected="${i === current}" data-i="${i}"${shown ? "" : " disabled"}>
          <b>${d.numeral}</b><span>${d.label}</span><small>${fmt(heldIn(d))} held</small></button>`;
      }).join("");
    }
    function drawDrawer(direction = 0) {
      const d = DRAWERS[current];
      const list = maps.filter((m) => inDrawer(d, m.y) && matches(m));
      const counts = new Map();
      const pool = d.lo === null ? maps.filter((m) => m.y == null) : null;
      if (pool) pool.forEach((m) => m.s.forEach((k) => counts.set(k, (counts.get(k) ?? 0) + 1)));
      else D.dots.filter((x) => inDrawer(d, x[0])).forEach((x) => subjects.forEach((s) => { if (dotHas(x, s.key)) counts.set(s.key, (counts.get(s.key) ?? 0) + 1); }));
      const [topKey, topN] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
      const shown = expanded ? list : list.slice(0, SHOW);
      const html = `<span class="om-numeral" aria-hidden="true">${d.numeral}</span>
        <header class="om-drawer-head"><p class="kicker">${esc(d.label)}</p><h3>${esc(d.name)}</h3>
          <p>${fmt(heldIn(d))} maps held${topKey ? ` · most often drawn: <b style="color:var(${subjectByKey.get(topKey).tone})">${esc(subjectByKey.get(topKey).label)}</b> (${fmt(topN)}${pool ? " in this selection" : ""})` : ""} · ${list.length} in this mock-up${filter.size ? " for the chosen subjects" : ""}</p></header>
        <div class="om-grid">${shown.map((m) => thumb(m)).join("")}</div>
        ${list.length > SHOW ? `<button type="button" class="om-more">${expanded ? "Show fewer" : `Show all ${list.length} in this drawer`}</button>` : ""}
        ${list.length === 0 ? `<p class="om-mocknote">No map in this drawer carries the chosen subjects.</p>` : ""}`;
      if (!direction) { inner.innerHTML = html; return; }
      // Slide the drawer out sideways, swap it, and slide the next one in from the other side.
      inner.style.setProperty("--from", `${direction * 48}px`);
      inner.classList.add("is-leaving");
      setTimeout(() => { inner.innerHTML = html; inner.classList.remove("is-leaving"); inner.classList.add("is-entering"); requestAnimationFrame(() => requestAnimationFrame(() => inner.classList.remove("is-entering"))); }, 220);
    }
    function choose(i) {
      if (i === current || !DRAWERS[i]) return;
      const direction = i > current ? -1 : 1;
      current = i;
      expanded = false;
      drawRail();
      drawDrawer(direction);
    }
    crystals(section.querySelector(".om-chest-chips"), { onChange(chosen) {
      filter = chosen;
      if (!maps.some((m) => inDrawer(DRAWERS[current], m.y) && matches(m))) current = DRAWERS.findIndex((d) => maps.some((m) => inDrawer(d, m.y) && matches(m)));
      drawRail();
      drawDrawer();
    } });
    rail.addEventListener("click", (event) => { const b = event.target.closest("button[data-i]"); if (b) choose(Number(b.dataset.i)); });
    rail.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const step = event.key === "ArrowRight" ? 1 : -1;
      let i = current + step;
      while (DRAWERS[i] && rail.querySelector(`[data-i="${i}"]`).disabled) i += step;
      if (DRAWERS[i]) { choose(i); rail.querySelector(`[data-i="${i}"]`).focus(); }
    });
    drawerEl.addEventListener("click", (event) => {
      if (event.target.closest(".om-more")) { expanded = !expanded; drawDrawer(); return; }
      const t = event.target.closest("[data-map]");
      if (t) Viewer.open(t.dataset.map, t);
    });
    drawRail();
    drawDrawer();
  } };
})();
