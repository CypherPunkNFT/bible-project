// The city section, laid out as the owner asked (2026-10-08) and identical in every direction: the USA map on the
// left, Jacksonville's sourced facts to its right, a rule, then the Jacksonville map (US Census TIGER/Line) with the
// places beside it, starting level with the map's top. Both maps zoom (wheel, pinch, buttons). Choosing a place lights
// its pin; pointing at a pin lights its row.
(() => {
  const { LIFE, esc, plural, cat, tone, rowHtml, wireRows, setOpen, host } = window.Life;
  const city = LIFE.city, M = window.JAX_MAP, US = window.US_STATES, F = window.JAX_FACTS;
  const P = M.projection;
  const project = (lon, lat) => [(lon - P.west) * P.cos * P.k, (P.north - lat) * P.k];

  function miles(a, b) {
    const rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
    return 3958.8 * 2 * Math.asin(Math.sqrt(h));
  }
  function compass(a, b) {
    const east = (b.lon - a.lon) * Math.cos((a.lat * Math.PI) / 180), north = b.lat - a.lat;
    const deg = (Math.atan2(east, north) * 180) / Math.PI;
    return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(((deg + 360) % 360) / 45) % 8];
  }
  const where = (e) => { const d = miles(city, e); return d < 0.5 ? "downtown, by city hall" : `${d.toFixed(1)} mi ${compass(city, e)} of city hall`; };
  const placeSub = (e) => `${cat(e.category).short}  ·  ${where(e)}`;
  const places = city.entries.map((e, i) => ({ e, n: i + 1, at: project(e.lon, e.lat) }));
  const kinds = [...new Set(city.entries.map((e) => e.category))].map((k) => [k, city.entries.filter((e) => e.category === k).length]).sort((a, b) => b[1] - a[1]);
  const hall = project(city.lon, city.lat);

  const zoomButtons = (id) => `<div class="zoom-btns" data-for="${id}"><button type="button" data-z="in" aria-label="Zoom in">${icon("plus", 16)}</button><button type="button" data-z="out" aria-label="Zoom out">${icon("minus", 16)}</button><button type="button" data-z="reset" aria-label="Show all">${icon("reset", 15)}</button></div>`;

  // ── The USA map and the facts beside it ─────────────────────────────────────────────────────────────────────
  function usaHtml() {
    const pt = window.US_POINT;
    return `<figure class="usa mapframe"><div class="stage">
      <svg viewBox="0 0 ${US.width} ${US.height}" style="aspect-ratio:${US.width} / ${US.height}" role="img" aria-label="Map of the USA with Jacksonville, Florida marked">
        <g class="states">${US.states.map((s) => `<path d="${s.d}"${s.name === "Florida" ? ' class="fl"' : ""}><title>${esc(s.name)}</title></path>`).join("")}</g>
        <g class="us-city" data-x="${pt.x}" data-y="${pt.y}"><circle class="ring" r="11"/><circle class="dot" r="5"/><text x="-14" y="-9" text-anchor="end">Jacksonville</text></g>
      </svg>
      ${zoomButtons("usa")}</div>
      <figcaption>States: Natural Earth 1:50m (public domain). Scroll or pinch to zoom.</figcaption>
    </figure>`;
  }
  function factsHtml() {
    const f = Object.fromEntries(F.facts.map((x) => [x.label, x]));
    const n = (v) => v.toLocaleString("en-US");
    const src = (x) => `<a class="src" href="${esc(x.source)}" target="_blank" rel="noreferrer"><span class="long">${esc(x.by)}</span><span class="short">US Census Bureau</span> · checked ${esc(F.checked)}</a>`;
    const l211 = city.lines.find((l) => l.id === "jax-211");
    const total = city.entries.length;
    return `<div class="city-info">
      <p class="kick">02 · Local help</p>
      <h2>Jacksonville, <em>Florida</em></h2>
      <p class="city-lead">${plural(city.entries.length, "place")} you can walk into and ${plural(city.lines.length, "phone line")}, each checked on the organisation’s own page.</p>
      <dl class="facts">
        <div><dt>County</dt><dd><strong>${esc(f.County.value)}</strong><span>${esc(f.County.note)}</span>${src(f.County)}</dd></div>
        <div><dt>Population</dt><dd><strong>${n(f["Duval County population"].value)}</strong><span>in Duval County, and ${n(f["Jacksonville city population"].value)} in the city of Jacksonville; ${esc(f["Duval County population"].note)}</span>${src(f["Duval County population"])}</dd></div>
        <div><dt>Area</dt><dd><strong>${f["Land area"].value} sq mi</strong><span>of land, ${esc(f["Land area"].note)}</span>${src(f["Land area"])}</dd></div>
        ${l211 ? `<div><dt>Local 211</dt><dd><strong><a href="tel:211">211</a></strong><span>${esc(l211.name.replace(/\s*\(.*\)/, ""))} of Northeast Florida · ${esc(l211.hours)} · ${esc(l211.cost ?? "")}; also 904-632-0600, or text “Hello” to 211904</span><a class="src" href="${esc(l211.source)}" target="_blank" rel="noreferrer">${esc(host(l211.source))} · checked ${esc(l211.checked)}</a></dd></div>` : ""}
        <div class="by-kind"><dt>Checked here</dt><dd>
          <div class="kind-bar" aria-hidden="true">${kinds.map(([k, c]) => `<span style="flex:${c};background:${tone(k)}"></span>`).join("")}</div>
          <ul class="kind-key">${kinds.map(([k, c]) => `<li style="--c:${tone(k)}"><i></i>${esc(cat(k).short)} <b>${c}</b></li>`).join("")}<li class="lines"><i></i>Phone lines <b>${city.lines.length}</b></li></ul>
          <span class="src plain">${total} places from this site’s list · checked ${esc(LIFE.checked)}</span></dd></div>
      </dl>
    </div>`;
  }

  // ── The Jacksonville map ────────────────────────────────────────────────────────────────────────────────────
  const waterName = (s) => s.replace(/\bRiv\b/, "River").replace(/\bLk\b/, "Lake").replace(/^St /, "St. ");
  function jaxHtml() {
    const W = M.width, H = M.height;
    return `<figure class="jax mapframe"><div class="stage">
      <div class="map-filter" role="group" aria-label="Show on the map">${kinds.map(([k, c]) => `<button type="button" data-k="${esc(k)}" aria-pressed="true" style="--c:${tone(k)}"><i></i>${esc(cat(k).short)}<b>${c}</b></button>`).join("")}</div>
      <svg viewBox="0 0 ${W} ${H}" style="aspect-ratio:${W} / ${H}" role="group" aria-label="Map of Jacksonville and Duval County with the ${city.entries.length} places">
        <rect class="sea" width="${W}" height="${H}"/>
        <path class="around" d="${M.land.around}"/>
        <path class="duval" d="${M.land.duval}"/>
        <path class="streets" d="${M.roads.streets}"/>
        <path class="water" d="${M.water}"/>
        <path class="road2" d="${M.roads.secondary}"/>
        <path class="road1" d="${M.roads.primary}"/>
        <path class="county-line" d="${M.land.duval}"/>
        <g class="labels">
          ${M.waterLabels.filter((w) => !/Atlantic/.test(w.name)).slice(0, 4).map((w) => `<g class="lab water-lab" data-x="${w.x}" data-y="${w.y}"><text>${esc(waterName(w.name))}</text></g>`).join("")}
          <g class="lab sea-lab" data-x="${W - 34}" data-y="${H * 0.62}"><text transform="rotate(90)">Atlantic Ocean</text></g>
          ${M.places.map((p) => `<g class="lab town-lab${p.duval ? "" : " out"}" data-x="${p.x}" data-y="${p.y}"><text>${esc(p.name)}</text></g>`).join("")}
          ${M.roadLabels.map((r) => `<g class="lab road-lab" data-x="${r.x}" data-y="${r.y}"><rect x="-17" y="-8" width="34" height="16" rx="4"/><text>${esc(r.name)}</text></g>`).join("")}
          <g class="lab hall" data-x="${hall[0]}" data-y="${hall[1]}"><rect x="-3.5" y="-3.5" width="7" height="7" transform="rotate(45)"/><text x="8" y="-7">City hall</text></g>
        </g>
        <g class="leaders"></g>
        <g class="pins">${places.map(({ e, n, at }) => `<g class="pin" data-id="${esc(e.id)}" data-cat="${esc(e.category)}" data-x="${at[0]}" data-y="${at[1]}" style="--c:${tone(e.category)}" role="button" tabindex="-1" aria-label="${esc(`${n}. ${e.name}`)}"><circle class="halo" r="16"/><circle class="disc" r="10"/><text>${n}</text></g>`).join("")}</g>
      </svg>

      <div class="map-views" role="group" aria-label="View"><button type="button" data-view="county" aria-pressed="true">County</button><button type="button" data-view="downtown" aria-pressed="false">Downtown</button></div>
      ${zoomButtons("jax")}</div>
      <figcaption>Map: US Census Bureau TIGER/Line 2026 (roads, water, towns) and 2025 county boundary, public domain. Places located from their addresses by the Census Bureau geocoder.</figcaption>
    </figure>`;
  }
  function listHtml(opts) {
    const quick = (e) => opts.quickAll || e.category === "crisis" || e.category === "abuse";
    return `<div class="city-list" tabindex="-1">
      <p class="list-head"><span>${plural(city.entries.length, "place")}</span><span class="muted">${plural(city.lines.length, "phone line")} below</span></p>
      <ol class="rows places">${places.map(({ e, n }) => rowHtml(e, { n, sub: placeSub(e), address: true, quick: quick(e), quickMax: 1 })).join("")}</ol>
      <h3 class="lines-head">Phone lines <small>no walk-in address</small></h3>
      <ol class="rows lines">${city.lines.map((l) => rowHtml(l, { address: true, quick: true, quickMax: 2 })).join("")}</ol>
    </div>`;
  }

  function render(opts = {}) {
    return `<section class="city" id="city">
      <div class="city-top">${usaHtml()}${factsHtml()}</div>
      <hr class="city-rule">
      <div class="city-main">${jaxHtml()}${listHtml(opts)}</div>
    </section>`;
  }

  // ── Behaviour ───────────────────────────────────────────────────────────────────────────────────────────────
  function wire(root) {
    const usaSvg = root.querySelector(".usa svg");
    const usDot = usaSvg.querySelector(".us-city");
    const usZoom = Zoom(usaSvg, { width: US.width, height: US.height, max: 8, onChange: () => placeMarks(usaSvg, US.width) });
    const svg = root.querySelector(".jax svg"), list = root.querySelector(".city-list");
    const pinsG = svg.querySelector(".pins"), leaders = svg.querySelector(".leaders");
    const pins = [...pinsG.querySelectorAll(".pin")];
    const rowOf = (id) => list.querySelector(`.row[data-id="${CSS.escape(id)}"]`);
    const pinOf = (id) => pinsG.querySelector(`.pin[data-id="${CSS.escape(id)}"]`);
    const shown = new Set(kinds.map(([k]) => k));
    let selected = null;

    const zoom = Zoom(svg, { width: M.width, height: M.height, max: 14, onChange: (z) => { svg.dataset.z = z > 2.2 ? "near" : "far"; placeMarks(svg, M.width); layoutPins(); } });
    const views = root.querySelectorAll(".map-views button");
    const setView = (v) => views.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === v)));

    /** Labels and pins keep their size on screen: each is scaled by map units per pixel. */
    function placeMarks(s, width) {
      const vb = s.viewBox.baseVal, px = vb.width / (s.getBoundingClientRect().width || width);
      s.querySelectorAll(".lab, .us-city").forEach((g) => g.setAttribute("transform", `translate(${g.dataset.x} ${g.dataset.y}) scale(${px})`));
      s.dataset.px = px;
    }
    /** Pins that would overlap at this zoom are pushed apart, each with a thin line back to its true spot. */
    function layoutPins() {
      const px = +svg.dataset.px || 1, R = 10.5;
      const live = pins.filter((p) => shown.has(p.dataset.cat));
      const at = live.map((p) => [+p.dataset.x / px, +p.dataset.y / px]);
      const pos = at.map(([x, y]) => [x, y]);
      for (let round = 0; round < 60; round++) {
        let movedAny = false;
        for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
          const dx = pos[j][0] - pos[i][0], dy = pos[j][1] - pos[i][1], d = Math.hypot(dx, dy), need = R * 2 + 2;
          if (d >= need) continue;
          const push = (need - d) / 2, ux = d > 0.01 ? dx / d : Math.cos(i + j), uy = d > 0.01 ? dy / d : Math.sin(i + j);
          pos[i][0] -= ux * push; pos[i][1] -= uy * push; pos[j][0] += ux * push; pos[j][1] += uy * push; movedAny = true;
        }
        if (!movedAny) break;
      }
      let lines = "";
      live.forEach((p, i) => {
        const [x, y] = [pos[i][0] * px, pos[i][1] * px];
        p.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${px})`);
        if (Math.hypot(pos[i][0] - at[i][0], pos[i][1] - at[i][1]) > 3) lines += `<line x1="${+p.dataset.x}" y1="${+p.dataset.y}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" style="--c:${tone(p.dataset.cat)}"/><circle cx="${+p.dataset.x}" cy="${+p.dataset.y}" r="${(1.8 * px).toFixed(2)}" style="--c:${tone(p.dataset.cat)}"/>`;
      });
      pins.forEach((p) => { p.style.display = shown.has(p.dataset.cat) ? "" : "none"; });
      leaders.innerHTML = lines;
    }
    new ResizeObserver(() => { placeMarks(svg, M.width); layoutPins(); placeMarks(usaSvg, US.width); }).observe(svg);

    const light = (id, on) => { pinOf(id)?.toggleAttribute("data-on", on); rowOf(id)?.toggleAttribute("data-lit", on); };
    function scrollRow(row) {
      if (getComputedStyle(list).overflowY === "visible") return;
      const top = row.offsetTop - list.offsetTop, bottom = top + row.offsetHeight;
      if (top < list.scrollTop + 8) list.scrollTo({ top: top - 8, behavior: "smooth" });
      else if (bottom > list.scrollTop + list.clientHeight - 8) list.scrollTo({ top: bottom - list.clientHeight + 8, behavior: "smooth" });
    }
    function select(id) {
      if (selected && selected !== id) pinOf(selected)?.removeAttribute("data-sel");
      selected = id;
      if (!id) return;
      const pin = pinOf(id);
      pin?.setAttribute("data-sel", "");
      if (pin) { pinsG.append(pin); zoom.reveal(+pin.dataset.x, +pin.dataset.y); }
    }

    pins.forEach((p) => {
      p.addEventListener("pointerenter", () => { light(p.dataset.id, true); const r = rowOf(p.dataset.id); if (r) scrollRow(r); });
      p.addEventListener("pointerleave", () => light(p.dataset.id, false));
      p.addEventListener("click", () => {
        const row = rowOf(p.dataset.id);
        list.querySelectorAll(".places .row[data-open]").forEach((r) => r !== row && setOpen(r, false));
        setOpen(row, true); select(p.dataset.id); requestAnimationFrame(() => scrollRow(row));
      });
    });
    list.querySelectorAll(".places .row").forEach((r) => {
      r.addEventListener("pointerenter", () => light(r.dataset.id, true));
      r.addEventListener("pointerleave", () => light(r.dataset.id, false));
    });
    wireRows(list, { onToggle: (row, open) => { if (row.closest(".places")) select(open ? row.dataset.id : selected === row.dataset.id ? null : selected); } });

    root.querySelectorAll(".map-filter button").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.k, all = shown.size === kinds.length;
      // The first tap shows only that kind; later taps add or remove kinds; the last one switched off shows all again.
      if (all) { shown.clear(); shown.add(k); } else if (shown.has(k)) shown.delete(k); else shown.add(k);
      if (!shown.size) kinds.forEach(([kk]) => shown.add(kk));
      root.querySelectorAll(".map-filter button").forEach((x) => x.setAttribute("aria-pressed", String(shown.has(x.dataset.k))));
      list.querySelectorAll(".places .row").forEach((r) => { r.hidden = !shown.has(r.dataset.cat); });
      layoutPins();
    }));
    views.forEach((b) => b.addEventListener("click", () => {
      setView(b.dataset.view);
      if (b.dataset.view === "county") zoom.reset();
      else { const d = 2.2 / 69 * P.k; zoom.fit([hall[0] - d * 1.2, hall[1] - d, hall[0] + d * 1.2, hall[1] + d], 0); }
    }));
    const act = (z, which) => (b) => b.addEventListener("click", () => {
      if (b.dataset.z === "in") z.zoomBy(1.8); else if (b.dataset.z === "out") z.zoomBy(1 / 1.8); else { z.reset(); if (which === "jax") setView("county"); }
    });
    root.querySelectorAll('.zoom-btns[data-for="jax"] button').forEach(act(zoom, "jax"));
    root.querySelectorAll('.zoom-btns[data-for="usa"] button').forEach(act(usZoom, "usa"));
    usDot.addEventListener("click", () => usZoom.fit([+usDot.dataset.x - 70, +usDot.dataset.y - 50, +usDot.dataset.x + 70, +usDot.dataset.y + 50], 0));
    placeMarks(svg, M.width); placeMarks(usaSvg, US.width); layoutPins();
    if (matchMedia("(max-width: 600px)").matches) {
      const xs = places.map((q) => q.at[0]), ys = places.map((q) => q.at[1]);
      zoom.fit([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], 0.12);
      setView("downtown"); views.forEach((b) => b.setAttribute("aria-pressed", "false"));
    }
  }

  window.City = { render, wire };
})();
