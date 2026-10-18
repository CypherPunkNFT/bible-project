// C · 02 Where are they now? The approved "place cards + SVG atlas map": the cities that hold the manuscripts as dots
// on a map of Europe and the Near East (those across the Atlantic listed in the ocean, joined by a line), a panel for
// the chosen city with its oldest copies, and a two-row strip of holder cards beneath. All counts are records.
(() => {
  const { byDate, sigla } = MSX;
  const P = MS.map;
  const proj = (lat, lon) => [(lon - P.lon0) * P.cos * P.k, (P.lat1 - lat) * P.k];

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
  const SIDE = { Oxford: "w", London: "s", Cambridge: "n" };
  function labelAt(name, x, y, r) {
    const side = SIDE[name] ?? "e";
    const [tx, ty, anchor] = side === "w" ? [x - r - 5, y + 4, "end"] : side === "s" ? [x, y + r + 14, "middle"] : side === "n" ? [x + 4, y - r - 5, "start"] : [x + r + 5, y + 4, "start"];
    return `<text x="${tx.toFixed(0)}" y="${ty.toFixed(0)}" text-anchor="${anchor}">${esc(name)}</text>`;
  }

  function mount(section, { num }) {
    const cities = cityTable(), onMap = cities.filter((c) => c.lon > P.lon0), across = cities.filter((c) => c.lon <= P.lon0);
    const unplaced = MS.counts.withHolder - MS.counts.placed;
    const holders = [...MS.holders].sort((a, b) => b.n - a.n);
    let city = cities[0];
    section.innerHTML = `${head(num, "Where are they now?", `From Dublin to Sinai, <em>who keeps them</em>`,
      `${formatNumber(MS.counts.placed)} records name a holder this page can place, in ${cities.length} cities. Choose a city or a card to see what is kept there, oldest first. ${formatNumber(unplaced)} more name a holder not yet placed; their records still show it.`)}
      <div class="pl-layout">
        <div class="pl-mapbox">
          <svg class="pl-map" viewBox="0 0 ${P.w} ${P.h}" role="img" aria-label="Map of the cities that hold the manuscripts">
            <g class="pl-land">${P.d.map((d) => `<path d="${d}"/>`).join("")}</g>
            <g class="pl-dots">${onMap.map((c) => { const [x, y] = proj(c.lat, c.lon), r = 4 + Math.sqrt(c.n) * 1.5;
              return `<g class="pl-city" data-city="${esc(c.city)}" tabindex="0" role="button" aria-label="${esc(c.city)}: ${plural(c.n, "record")}"><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}"/>${c.n >= 25 ? labelAt(c.city, x, y, r) : ""}</g>`; }).join("")}</g>
          </svg>
          <div class="pl-across"><p>Across the Atlantic</p>${across.map((c) => `<button type="button" data-city="${esc(c.city)}" title="${esc(c.city)}"><b>${esc(c.city.replace(", North Carolina", ", N.C.").replace(", Massachusetts", ", Mass."))}</b><em>${formatNumber(c.n)}</em></button>`).join("")}</div>
        </div>
        <aside class="pl-panel"></aside>
      </div>
      <div class="pl-cards" role="list">${holders.map((h) => { const c = cities.find((x) => x.city === h.city), first = c.records.find((r) => r.h.includes(h.id));
        return `<button type="button" role="listitem" class="pl-card" data-city="${esc(h.city)}" data-holder="${h.id}"><span class="pl-icon">${glyph("building", 22)}</span>
          <span class="pl-card-text"><b>${esc(h.name)}</b><small>${esc(h.city)}, ${esc(h.country)}</small><small>Oldest here: ${esc(first ? `${first.n}${first.d ? `, ${first.d}` : ""}` : "–")}</small></span><em>${formatNumber(h.n)}</em></button>`; }).join("")}</div>`;
    const panel = section.querySelector(".pl-panel");

    function render(holderId) {
      section.querySelectorAll("[data-city]").forEach((el) => el.classList.toggle("on", el.dataset.city === city.city));
      section.querySelectorAll(".pl-card").forEach((el) => el.setAttribute("aria-pressed", String(el.dataset.holder === holderId)));
      const list = holderId ? city.records.filter((r) => r.h.includes(holderId)) : city.records;
      const kinds = {};
      for (const r of list) kinds[r.k] = (kinds[r.k] ?? 0) + 1;
      panel.innerHTML = `<p class="kicker">${esc(city.country)}</p><h3>${esc(city.city)}</h3>
        <p class="pl-holders">${city.holders.map((h) => `<button type="button" data-holder-pick="${h.id}" aria-pressed="${h.id === holderId}">${esc(h.name)} <em>${formatNumber(h.n)}</em></button>`).join("")}</p>
        <p class="pl-kinds">${Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<span style="--tone: var(${KIND[k].tone})"><i></i>${esc(KIND[k].label)} ${formatNumber(n)}</span>`).join("")}</p>
        <p class="pl-sub">Oldest first${list.length > 8 ? ` · 8 of ${formatNumber(list.length)}` : ""}</p>
        <ol class="pl-list">${list.slice(0, 8).map((r) => `<li><button type="button" data-open="${esc(r.i)}"><span>${esc(r.d ?? "undated")}</span><b>${esc(r.n)}</b>${sigla(r) ? `<small>${esc(sigla(r))}</small>` : ""}</button></li>`).join("")}</ol>`;
    }
    section.addEventListener("click", (e) => {
      const pick = e.target.closest("[data-holder-pick]");
      if (pick) { render(pick.getAttribute("aria-pressed") === "true" ? null : pick.dataset.holderPick); return; }
      const el = e.target.closest("[data-city]");
      if (!el) return;
      city = cities.find((c) => c.city === el.dataset.city);
      render(el.dataset.holder ?? null);
    });
    section.querySelector(".pl-dots").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.target.closest("[data-city]")?.dispatchEvent(new MouseEvent("click", { bubbles: true })); } });
    render(null);
  }
  Sections.places = { mount };
})();
