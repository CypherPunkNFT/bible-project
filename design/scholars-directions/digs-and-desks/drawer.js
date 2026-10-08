// The profile drawer: any scholar anywhere on the page opens it through DD.openProfile(id). Name, years, faith, field,
// era, place (with a small map), the one-line summary, works, the discoveries they made or studied, their place in the
// chain of the text, how this site uses their work, and which areas of the site name them.
(() => {
  const { S, byId, esc, years, tone, pt } = DD;
  const order = S.scholars.map((s) => s.id);
  let root, body, count, current = null, lastFocus = null;

  function placeMap(s) {
    const inMed = pt("med", s.id), view = inMed ? "med" : "world", p = pt(view, s.id), w = inMed ? 300 : 120, h = w / 2;
    const V = S.views[view], x = Math.max(-10, Math.min(V.width - w + 10, p[0] - w / 2)), y = Math.max(-10, Math.min(V.height - h + 10, p[1] - h / 2)), k = w / 400;
    return `<svg class="dd-pmap" viewBox="${x.toFixed(1)} ${y.toFixed(1)} ${w} ${h}" role="img" aria-label="Map showing ${esc(s.place[0])}">
      <rect class="dd-water" x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}"/><use href="#dd-land-${view}" class="dd-landpath"/>
      <circle cx="${p[0]}" cy="${p[1]}" r="${(11 * k).toFixed(2)}" class="dd-pmap-halo"/><circle cx="${p[0]}" cy="${p[1]}" r="${(4.5 * k).toFixed(2)}" class="dd-pmap-dot"/>
      <text x="${p[0] + 10 * k}" y="${p[1] + 4 * k}" style="font-size:${(12 * k).toFixed(2)}px;stroke-width:${(3 * k).toFixed(2)}px">${esc(s.place[0])}</text></svg>`;
  }

  function useHtml(s) {
    if (!s.site) return `<p class="dd-pd-empty">Not used on this site yet.</p>`;
    return `<div class="dd-use dd-use-${s.site.status}"><em>${s.site.status === "in-use" ? "Used on this site" : "In the library, planned"}</em><p>${esc(s.site.note)}</p></div>`;
  }

  function mentionsHtml(s) {
    const areas = Object.entries(s.mentions).sort((a, b) => b[1] - a[1]);
    if (!areas.length) return `<p class="dd-pd-empty">Not named in the site's text yet.</p>`;
    const top = areas[0][1];
    return `<ul class="dd-ment">${areas.map(([area, n]) => `<li><a href="${DD.AREA_ROUTE[area] || "#"}">${esc(area)}</a><span><i style="width:${Math.max(6, (n / top) * 100).toFixed(0)}%"></i></span></li>`).join("")}</ul>
      <p class="dd-pd-note">Longer bar, named more often there. From a rough search of the site's text.</p>`;
  }

  function render(s) {
    const finds = S.finds.filter((f) => f.by.includes(s.id)), step = S.chain.steps.find(([id]) => id === s.id), [eraName] = DD.eraParts(s.era);
    return `<div class="dd-pd" style="--tone:${tone(s)}">
      <p class="kicker">${esc(DD.field(s))}</p><h2 id="dd-pd-title">${esc(s.name)}</h2>
      <p class="dd-pd-years">${years(s)} · ${esc(eraName)}</p>
      <div class="dd-pd-tags"><span class="dd-faith dd-faith-${s.faith}">${esc(DD.faith(s))}</span><span>${esc(s.place[0])}</span></div>
      <p class="dd-pd-line">${esc(s.line)}</p>
      ${placeMap(s)}
      <section><h3>Works</h3><ul class="dd-works">${s.works.map(([title, year]) => `<li><span>${esc(title)}</span><b>${year}</b></li>`).join("")}</ul></section>
      ${finds.length ? `<section><h3>Discoveries</h3><ul class="dd-pd-finds">${finds.map((f) => `<li><button type="button" data-find="${f.id}"><b>${f.year}</b><span>${esc(f.name)}<small>${esc(f.where[0])}</small></span>${icon("map", 16)}</button></li>`).join("")}</ul></section>` : ""}
      ${step ? `<section><h3>In the chain of the text</h3><p class="dd-pd-chain">${esc(step[1])}. <span>${esc(S.chain.about)}</span></p></section>` : ""}
      <section><h3>How this site uses their work</h3>${useHtml(s)}</section>
      <section><h3>Where the site names them</h3>${mentionsHtml(s)}</section></div>`;
  }

  function show(id) {
    const s = byId[id];
    current = id;
    body.innerHTML = render(s);
    body.scrollTop = 0;
    count.textContent = `${order.indexOf(id) + 1} of ${order.length}, by year of birth`;
  }

  function close() {
    root.classList.remove("dd-drw-open");
    root.setAttribute("aria-hidden", "true");
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  DD.mountDrawer = () => {
    document.body.insertAdjacentHTML("beforeend", `<div class="dd-drw" aria-hidden="true"><div class="dd-drw-scrim"></div>
      <div class="dd-drw-panel" role="dialog" aria-modal="true" aria-labelledby="dd-pd-title">
        <div class="dd-drw-bar"><button type="button" data-step="-1" aria-label="Previous scholar">${icon("arrowLeft", 16)}</button><button type="button" data-step="1" aria-label="Next scholar">${icon("arrowRight", 16)}</button>
          <span class="dd-drw-count"></span><button type="button" class="dd-drw-close" aria-label="Close">${icon("x", 16)}</button></div>
        <div class="dd-drw-body"></div></div></div>`);
    root = document.body.lastElementChild; body = root.querySelector(".dd-drw-body"); count = root.querySelector(".dd-drw-count");
    root.addEventListener("click", (e) => {
      const stepBtn = e.target.closest("[data-step]"), find = e.target.closest("[data-find]");
      if (e.target.closest(".dd-drw-scrim, .dd-drw-close")) close();
      else if (stepBtn) show(order[(order.indexOf(current) + Number(stepBtn.dataset.step) + order.length) % order.length]);
      else if (find) { close(); DD.showFind(find.dataset.find); }
    });
    addEventListener("keydown", (e) => {
      if (!root.classList.contains("dd-drw-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight" || e.key === "ArrowLeft") root.querySelector(`[data-step="${e.key === "ArrowRight" ? 1 : -1}"]`).click();
    });
  };

  DD.openProfile = (id) => {
    if (!byId[id]) { console.warn(`openProfile: no scholar with id "${id}"`); return; }
    lastFocus = document.activeElement;
    show(id);
    root.setAttribute("aria-hidden", "false");
    root.classList.add("dd-drw-open");
    root.querySelector(".dd-drw-close").focus({ preventScroll: true });
  };
})();
