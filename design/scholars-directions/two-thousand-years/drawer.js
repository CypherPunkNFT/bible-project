// The profile drawer: slides in from the right whenever a scholar is clicked anywhere on the page. It shows who they
// were (years, faith, field, place, one line), their life on the two-thousand-year line, who else was alive with them,
// their key works, how this site uses their work and where on the site they are named.
window.YrsDrawer = (() => {
  const { D, scholars, byId, esc, tone, years, faith, field, ERAS, TODAY, sameTime } = Yrs;
  let root, body, count, currentId = null, lastFocus = null;

  function build() {
    root = document.createElement("div");
    root.className = "yd";
    root.innerHTML = `<div class="yd-scrim" data-close></div>
      <aside class="yd-panel" role="dialog" aria-modal="true" aria-label="Scholar profile">
        <div class="yd-bar">
          <button type="button" data-step="-1" aria-label="Previous scholar">${icon("arrowLeft", 16)}</button>
          <button type="button" data-step="1" aria-label="Next scholar">${icon("arrowRight", 16)}</button>
          <span class="yd-count"></span>
          <button type="button" class="yd-close" data-close aria-label="Close">${icon("x", 16)}</button>
        </div>
        <div class="yd-body"></div>
      </aside>`;
    document.body.append(root);
    body = root.querySelector(".yd-body");
    count = root.querySelector(".yd-count");
    root.addEventListener("click", (event) => {
      if (event.target.closest("[data-close]")) close();
      const step = event.target.closest("[data-step]");
      if (step) {
        const i = scholars.findIndex((s) => s.id === currentId) + Number(step.dataset.step);
        open(scholars[(i + scholars.length) % scholars.length].id);
      }
    });
    addEventListener("keydown", (event) => {
      if (!root.classList.contains("yd-open")) return;
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") root.querySelector(`[data-step="${event.key === "ArrowRight" ? 1 : -1}"]`).click();
    });
  }

  // Their life on a plain 0-to-today line, with everyone else as faint marks behind it.
  function lifeLine(s) {
    const W = 520, x = (y) => (y / TODAY) * W;
    const bands = ERAS.map((e, i) => `<rect x="${x(e.from)}" y="0" width="${x(e.to) - x(e.from)}" height="40" class="${i % 2 ? "yd-band-off" : "yd-band"}"/>`).join("");
    const others = scholars.filter((o) => o !== s).map((o) => `<rect x="${x(o.born)}" y="17" width="${Math.max(1.5, x(o.died) - x(o.born))}" height="6" rx="3" class="yd-other"/>`).join("");
    const ticks = s.works.map(([, y]) => `<rect x="${x(y) - 1}" y="9" width="2" height="22" rx="1" class="yd-tick"/>`).join("");
    const axis = [0, 500, 1000, 1500, 2000].map((y) => `<span style="left:${(y / TODAY) * 100}%">${y || "AD 1"}</span>`).join("");
    return `<div class="yd-life"><svg viewBox="0 0 ${W} 40" preserveAspectRatio="none" aria-hidden="true">${bands}${others}
        <rect x="${x(s.born)}" y="13" width="${Math.max(3, x(s.died) - x(s.born))}" height="14" rx="7" class="yd-me"/>${ticks}</svg>
      <div class="yd-axis">${axis}</div></div>
      <p class="yd-note">Their life against the whole two thousand years; the faint bars are the other scholars, the upright marks their key works.</p>`;
  }

  // Where they mainly worked: the smallest pre-drawn map that holds the place, cropped around it.
  function placeMap(s) {
    const name = ["med", "world"].find((v) => D.views[v]?.points[s.id]);
    if (!name) return "";
    const view = D.views[name], [px, py] = view.points[s.id];
    const w = name === "world" ? 420 : 380, h = w / 2;
    const vx = Math.max(0, Math.min(view.width - w, px - w / 2)), vy = Math.max(0, Math.min(view.height - h, py - h / 2));
    const k = w / 420;
    return `<svg class="yd-map" viewBox="${vx} ${vy} ${w} ${h}" role="img" aria-label="Map showing ${esc(s.place[0])}">
      <path class="yd-land" d="${view.land}"/>
      <circle cx="${px}" cy="${py}" r="${11 * k}" class="yd-halo"/><circle cx="${px}" cy="${py}" r="${4.5 * k}" class="yd-pin"/>
      <text x="${px + 10 * k}" y="${py - 8 * k}" style="font-size:${12 * k}px">${esc(s.place[0])}</text></svg>`;
  }

  function siteUse(s) {
    if (!s.site) return `<p class="yd-empty">Not used by the site yet.</p>`;
    const live = s.site.status === "in-use";
    return `<div class="yd-use ${live ? "yd-use-live" : ""}"><span class="yd-status">${live ? "In use on this site" : "In the site's library · planned"}</span><p>${esc(s.site.note)}</p></div>`;
  }

  // Where the site's own pages name them: listed by area with a bar for relative weight (a rough text match, so no counts).
  function named(s) {
    const areas = Object.entries(s.mentions || {}).sort((a, b) => b[1] - a[1]);
    if (!areas.length) return `<p class="yd-empty">Not named in the site's pages yet.</p>`;
    const top = areas[0][1];
    return `<ul class="yd-areas">${areas.map(([area, n]) => `<li><span>${esc(area)}</span><i><b style="width:${Math.max(6, (n / top) * 100)}%"></b></i></li>`).join("")}</ul>
      <p class="yd-note">Bars compare how often each area names them, from a rough search of the site's text.</p>`;
  }

  function render(s) {
    const lived = s.died - s.born;
    const peers = sameTime(s);
    const finds = D.finds.filter((f) => f.by.includes(s.id));
    const step = D.chain.steps.findIndex(([id]) => id === s.id);
    return `<div class="yd-inner" style="--tone:${tone(s)}">
      <p class="kicker">${esc(field(s))}</p>
      <h2>${esc(s.name)}</h2>
      <p class="yd-years">${years(s)} · lived ${s.circa ? "about " : ""}${lived} years</p>
      <ul class="yd-pills">
        <li class="yd-faith"><i></i>${esc(faith(s))}</li>
        <li>${esc(field(s))}</li>
        <li>${esc(ERAS.find((e) => e.key === s.era)?.label || s.era)}</li>
        <li>${icon("map", 13)}${esc(s.place[0])}</li>
      </ul>
      <p class="yd-line">${esc(s.line)}</p>
      <section><h3>On the two-thousand-year line</h3>${lifeLine(s)}</section>
      <section><h3>Key works</h3><ul class="yd-works">${s.works.map(([title, y]) => `<li><b>${y}</b><span>${esc(title)}</span></li>`).join("")}</ul></section>
      <section><h3>How this site uses their work</h3>${siteUse(s)}</section>
      <section><h3>Where the site names them</h3>${named(s)}</section>
      ${step >= 0 ? `<section><h3>How the text reached you</h3><p class="yd-chain"><b>Step ${step + 1} of ${D.chain.steps.length}</b> · ${esc(D.chain.steps[step][1])}.</p></section>` : ""}
      ${finds.length ? `<section><h3>What they found or dug</h3><ul class="yd-finds">${finds.map((f) => `<li><b>${f.year}</b><div><span>${esc(f.name)}</span><small>${esc(f.where[0])} · ${esc(f.line)}</small></div></li>`).join("")}</ul></section>` : ""}
      <section><h3>Where they mainly worked</h3>${placeMap(s)}</section>
      <section><h3>Alive at the same time</h3>${peers.length
        ? `<div class="yd-peers">${peers.map((o) => `<button type="button" data-open="${esc(o.id)}" style="--tone:${tone(o)}"><i></i>${esc(o.short)}<small>${years(o)}</small></button>`).join("")}</div>`
        : `<p class="yd-empty">No one else on this list was alive in their lifetime.</p>`}</section>
    </div>`;
  }

  function open(id) {
    const s = byId.get(id);
    if (!s) { console.error(`profile drawer: unknown scholar "${id}"`); return; }
    if (!root) build();
    if (!root.classList.contains("yd-open")) lastFocus = document.activeElement;
    currentId = id;
    body.innerHTML = render(s);
    body.scrollTop = 0;
    count.textContent = `${scholars.indexOf(s) + 1} of ${scholars.length} · by birth`;
    root.classList.add("yd-open");
    root.querySelector(".yd-close").focus({ preventScroll: true });
  }

  function close() {
    if (!root) return;
    root.classList.remove("yd-open");
    currentId = null;
    if (lastFocus?.focus) lastFocus.focus({ preventScroll: true });
  }

  return { open, close };
})();
