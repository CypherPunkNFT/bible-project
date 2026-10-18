// C · 02 Where are they now? The approved "place cards + SVG atlas map": the cities that hold the manuscripts as dots on
// a full-width map from New England to the Caucasus (owner 2026-10-18). The map opens on Europe and drags (or scrolls
// sideways, with the standard pill under it) west across the Atlantic. Choosing a city slides its panel in from the
// right; choosing a manuscript there opens its record over it. Beneath, the holders as cards, grouped by continent, in
// a three-row area that scrolls under the pointer with the site's outside pill. All counts are records.
(() => {
  const { byDate, sigla } = MSX;
  const P = MS.map;
  const proj = (lat, lon) => [(lon - P.lon0) * P.cos * P.k, (P.lat1 - lat) * P.k];
  const START_LON = -12; // the map opens with Ireland at its left edge
  const DRAG = 6; // pixels of movement before a press becomes a drag rather than a click
  const CONTINENTS = [["Europe", "Europe"], ["Near East", "The Near East and the Caucasus"], ["North America", "North America"]];
  const CONTINENT_OF = { Egypt: "Near East", Israel: "Near East", Syria: "Near East", Georgia: "Near East", Armenia: "Near East", "United States": "North America" };
  const continentOf = (country) => CONTINENT_OF[country] ?? "Europe";

  function cityTable() {
    const byCity = new Map();
    for (const h of MS.holders) {
      const c = byCity.get(h.city) ?? { city: h.city, country: h.country, lat: h.lat, lon: h.lon, holders: [], n: 0 };
      c.holders.push(h); byCity.set(h.city, c);
    }
    for (const c of byCity.values()) {
      const ids = new Set(c.holders.map((h) => h.id));
      c.records = MS.records.filter((r) => r.h?.some((id) => ids.has(id))).sort(byDate);
      c.n = c.records.length;
    }
    return [...byCity.values()].sort((a, b) => b.n - a.n);
  }

  // Cities close together on the map get their labels on different sides.
  const SIDE = { Oxford: "w", London: "s", Cambridge: "n", "Cambridge, Massachusetts": "e", "New Haven": "w", "New York": "s", Princeton: "w", "Washington, D.C.": "e" };
  function labelAt(name, x, y, r) {
    const side = SIDE[name] ?? "e";
    const [tx, ty, anchor] = side === "w" ? [x - r - 5, y + 4, "end"] : side === "s" ? [x, y + r + 14, "middle"] : side === "n" ? [x + 4, y - r - 5, "start"] : [x + r + 5, y + 4, "start"];
    return `<text x="${tx.toFixed(0)}" y="${ty.toFixed(0)}" text-anchor="${anchor}">${esc(name)}</text>`;
  }
  const shortCity = (name) => name.replace(", North Carolina", ", N.C.").replace(", Massachusetts", ", Mass.");

  function mapHtml(cities) {
    const onMap = cities.filter((c) => c.lon >= P.lon0), west = cities.filter((c) => c.lon < P.lon0);
    const dots = onMap.map((c) => {
      const [x, y] = proj(c.lat, c.lon), r = 4 + Math.sqrt(c.n) * 1.5, label = c.n >= 25 || continentOf(c.country) !== "Europe";
      return `<g class="pl-city" data-city="${esc(c.city)}" tabindex="0" role="button" aria-label="${esc(c.city)}: ${plural(c.n, "record")}"><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}"/>${label ? labelAt(c.city, x, y, r).replace(`>${esc(c.city)}<`, `>${esc(shortCity(c.city))}<`) : ""}</g>`;
    }).join("");
    return `<div class="pl-mapview" tabindex="0" aria-label="Map of the cities that hold the manuscripts. Drag, or use the left and right arrows, to move west to America.">
        <div class="pl-mapcontent">
          <svg class="pl-map" viewBox="0 0 ${P.w} ${P.h}" role="img" aria-label="Map from New England to the Caucasus">
            <g class="pl-land">${P.d.map((d) => `<path d="${d}"/>`).join("")}</g>
            <g class="pl-dots">${dots}</g>
          </svg>
          ${west.length ? `<div class="pl-west"><p>Further west</p>${west.map((c) => `<button type="button" data-city="${esc(c.city)}"><b>${esc(shortCity(c.city))}</b><em>${formatNumber(c.n)}</em></button>`).join("")}</div>` : ""}
        </div>
      </div>
      <div class="pl-hbar" aria-hidden="true"><span class="pl-hthumb"></span></div>`;
  }

  function cardsHtml(cities) {
    const holders = [...MS.holders].sort((a, b) => b.n - a.n);
    const card = (h) => {
      const c = cities.find((x) => x.city === h.city), first = c.records.find((r) => r.h.includes(h.id));
      return `<button type="button" role="listitem" class="pl-card" data-city="${esc(h.city)}" data-holder="${h.id}"><span class="pl-icon">${glyph("building", 22)}</span>
        <span class="pl-card-text"><b>${esc(h.name)}</b><small>${esc(h.city)}, ${esc(h.country)}</small><small>Oldest here: ${esc(first ? `${first.n}${first.d ? `, ${first.d}` : ""}` : "–")}</small></span><em>${formatNumber(h.n)}</em></button>`;
    };
    const groups = CONTINENTS.map(([key, title]) => ({ key, title, list: holders.filter((h) => continentOf(h.country) === key) })).filter((g) => g.list.length);
    return `<div class="pl-continents">${groups.map((g) => `<button type="button" data-continent="${g.key}">${esc(g.key)} <em>${g.list.length}</em></button>`).join("")}</div>
      <div class="pl-cardarea">${groups.map((g) => `<div class="pl-group" data-group="${g.key}"><p class="pl-group-head">${esc(g.title)}<span>${plural(g.list.length, "library", "libraries")} · ${plural(g.list.reduce((s, h) => s + h.n, 0), "record")}</span></p>
        <div class="pl-cards" role="list">${g.list.map(card).join("")}</div></div>`).join("")}</div>`;
  }

  // The city panel: the record sheet's slide-in shell, sitting just beneath the record sheet so a record opened from it
  // slides over it.
  function drawer() {
    const el = document.createElement("aside");
    el.className = "ms-sheet pl-drawer";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "City");
    el.innerHTML = `<button type="button" class="ms-sheet-close" aria-label="Close">${icon("x", 18)}</button><div class="ms-sheet-body"></div>`;
    document.body.append(el);
    return el;
  }

  // Sideways movement of the map: drag, arrow keys, and the pill beneath, which mirrors and drives the scroll.
  function panning(view, bar) {
    const thumb = bar.querySelector(".pl-hthumb");
    let press = null;
    view.dragged = false;
    function measure() {
      const ratio = view.clientWidth / view.scrollWidth, range = view.scrollWidth - view.clientWidth;
      bar.hidden = range <= 1;
      thumb.style.width = `${ratio * 100}%`;
      thumb.style.left = `${range > 0 ? (view.scrollLeft / range) * (1 - ratio) * 100 : 0}%`;
    }
    view.addEventListener("scroll", measure, { passive: true });
    new ResizeObserver(measure).observe(view);
    view.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.pointerType === "touch") return; // touch scrolls natively
      press = { x: e.clientX, left: view.scrollLeft, id: e.pointerId };
      view.dragged = false;
    });
    view.addEventListener("pointermove", (e) => {
      if (!press || e.pointerId !== press.id) return;
      const dx = e.clientX - press.x;
      if (!view.dragged && Math.abs(dx) < DRAG) return;
      if (!view.dragged) { view.dragged = true; view.setPointerCapture(press.id); view.classList.add("is-dragging"); }
      view.scrollLeft = press.left - dx;
    });
    const end = () => { press = null; view.classList.remove("is-dragging"); };
    view.addEventListener("pointerup", end);
    view.addEventListener("pointercancel", end);
    view.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      view.scrollBy({ left: (e.key === "ArrowLeft" ? -1 : 1) * view.clientWidth * 0.4, behavior: "smooth" });
    });
    thumb.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const x0 = e.clientX, left0 = view.scrollLeft, perPixel = view.scrollWidth / bar.clientWidth;
      thumb.setPointerCapture(e.pointerId);
      const move = (m) => { view.scrollLeft = left0 + (m.clientX - x0) * perPixel; };
      thumb.addEventListener("pointermove", move);
      thumb.addEventListener("pointerup", () => thumb.removeEventListener("pointermove", move), { once: true });
    });
    bar.addEventListener("pointerdown", (e) => {
      if (e.target === thumb) return;
      const at = (e.clientX - bar.getBoundingClientRect().left) / bar.clientWidth;
      view.scrollTo({ left: at * view.scrollWidth - view.clientWidth / 2, behavior: "smooth" });
    });
    // Open on Europe rather than the middle of the Atlantic.
    const start = () => { view.scrollLeft = (proj(0, START_LON)[0] / P.w) * view.scrollWidth; measure(); };
    requestAnimationFrame(start);
    return { measure };
  }

  function mount(section, { num }) {
    const cities = cityTable();
    const unplaced = MS.counts.withHolder - MS.counts.placed;
    section.innerHTML = `${head(num, "Where are they now?", `From New England to Sinai, <em>who keeps them</em>`,
      `${formatNumber(MS.counts.placed)} records name a holder this page can place, in ${cities.length} cities. Drag the map west to reach America; choose a city or a card to see what is kept there, oldest first. ${formatNumber(unplaced)} more name a holder not yet placed; their records still show it.`)}
      <div class="pl-mapwrap">${mapHtml(cities)}</div>
      <div class="pl-holderwrap">${cardsHtml(cities)}</div>`;
    const view = section.querySelector(".pl-mapview");
    panning(view, section.querySelector(".pl-hbar"));
    const area = section.querySelector(".pl-cardarea");
    const scroller = OutsideScroll.wrap(area);
    const panel = drawer(), body = panel.querySelector(".ms-sheet-body");
    let city = null, lastFocus = null;

    function render(holderId) {
      section.querySelectorAll("[data-city]").forEach((el) => el.classList.toggle("on", el.dataset.city === city.city));
      section.querySelectorAll(".pl-card").forEach((el) => el.setAttribute("aria-pressed", String(el.dataset.city === city.city && el.dataset.holder === holderId)));
      const list = holderId ? city.records.filter((r) => r.h.includes(holderId)) : city.records;
      const kinds = {};
      for (const r of list) kinds[r.k] = (kinds[r.k] ?? 0) + 1;
      body.innerHTML = `<p class="kicker">${esc(city.country)} · ${esc(continentOf(city.country))}</p><h2>${esc(city.city)}</h2>
        <p class="pl-holders">${city.holders.map((h) => `<button type="button" data-holder-pick="${h.id}" aria-pressed="${h.id === holderId}">${esc(h.name)} <em>${formatNumber(h.n)}</em></button>`).join("")}</p>
        <p class="pl-kinds">${Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<span style="--tone: var(${KIND[k].tone})"><i></i>${esc(KIND[k].label)} ${formatNumber(n)}</span>`).join("")}</p>
        <p class="pl-sub">Oldest first · ${plural(list.length, "record")}</p>
        <ol class="pl-list">${list.map((r) => `<li><button type="button" data-open="${esc(r.i)}"><span>${esc(r.d ?? "undated")}</span><b>${esc(r.n)}</b>${sigla(r) ? `<small>${esc(sigla(r))}</small>` : ""}</button></li>`).join("")}</ol>`;
      body.scrollTop = 0;
    }
    function open(name, holderId, from) {
      city = cities.find((c) => c.city === name);
      if (!city) { console.error(`Where are they now: no city named "${name}" in the holder table`); return; }
      lastFocus = from ?? null;
      render(holderId ?? null);
      requestAnimationFrame(() => panel.classList.add("open"));
    }
    function close() {
      panel.classList.remove("open");
      section.querySelectorAll("[data-city].on").forEach((el) => el.classList.remove("on"));
      section.querySelectorAll('.pl-card[aria-pressed="true"]').forEach((el) => el.setAttribute("aria-pressed", "false"));
      if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
    }
    const recordOpen = () => document.querySelector(".ms-sheet.open:not(.pl-drawer)");

    panel.querySelector(".ms-sheet-close").addEventListener("click", close);
    panel.addEventListener("click", (e) => {
      const pick = e.target.closest("[data-holder-pick]");
      if (pick) render(pick.getAttribute("aria-pressed") === "true" ? null : pick.dataset.holderPick);
    });
    section.addEventListener("click", (e) => {
      const jump = e.target.closest("[data-continent]");
      if (jump) {
        const vp = area.querySelector(".os-viewport"), group = section.querySelector(`[data-group="${jump.dataset.continent}"]`);
        vp.scrollTo({ top: vp.scrollTop + group.getBoundingClientRect().top - vp.getBoundingClientRect().top, behavior: "smooth" });
        return;
      }
      const el = e.target.closest("[data-city]");
      if (!el || (view.dragged && view.contains(el))) return;
      open(el.dataset.city, el.dataset.holder, el);
    });
    section.querySelector(".pl-dots").addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const el = e.target.closest("[data-city]"); if (el) open(el.dataset.city, null, el); }
    });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && panel.classList.contains("open") && !recordOpen()) close(); });
    document.addEventListener("click", (e) => {
      if (!panel.classList.contains("open") || panel.contains(e.target) || e.target.closest(".ms-sheet, [data-city], [data-open], .dir-switch")) return;
      close();
    });
    scroller.reset();
  }
  Sections.places = { mount };
})();
