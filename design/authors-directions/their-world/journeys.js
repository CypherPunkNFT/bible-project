// Section: sent across the world. Every move of 2,000 km or more, drawn as a great-circle arc that draws itself
// (in date order) when the section scrolls into view. Hover an arc or a row for who, from, to and when.
(() => {
  const V = AUTHORS.views.world, proj = TW.project.world;
  let el = {}, journeys = [], played = false, anim = 0;

  // The edge of the Natural Earth globe and a light graticule, both through the fitted projection.
  function sphere() {
    const pts = [];
    for (let lat = -90; lat <= 90; lat += 5) pts.push(proj(180, lat));
    for (let lat = 90; lat >= -90; lat -= 5) pts.push(proj(-180, lat));
    return `M${pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join("L")}Z`;
  }
  function graticule() {
    const d = [];
    for (let lon = -150; lon <= 150; lon += 30) { const pts = []; for (let lat = -90; lat <= 90; lat += 5) pts.push(proj(lon, lat)); d.push(`M${pts.map((p) => p.join(",")).join("L")}`); }
    for (let lat = -60; lat <= 60; lat += 30) { const pts = []; for (let lon = -180; lon <= 180; lon += 5) pts.push(proj(lon, lat)); d.push(`M${pts.map((p) => p.join(",")).join("L")}`); }
    return d.join("");
  }

  function arcPath(j) {
    const pts = TW.greatCircle(j.from[1], j.from[2], j.to[1], j.to[2]).map(([lon, lat]) => proj(lon, lat));
    let d = "";
    pts.forEach(([x, y], i) => { d += `${i && Math.abs(x - pts[i - 1][0]) < 400 ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`; });
    return d;
  }

  function html() {
    const arcs = journeys.map((j, i) => {
      const [x0, y0] = proj(j.from[2], j.from[1]), [x1, y1] = proj(j.to[2], j.to[1]), d = arcPath(j);
      return `<g class="journey" data-j="${i}" style="--tone: var(${TW.tone(j.person)})">
        <path class="arc" d="${d}"/><path class="arc-hit" d="${d}"/>
        <circle class="end start" cx="${x0}" cy="${y0}" r="2.6"/><circle class="end stop" cx="${x1}" cy="${y1}" r="3.6"/>
      </g>`;
    }).join("");
    const rows = journeys.map((j, i) => `
      <li><button type="button" data-j="${i}" style="--tone: var(${TW.tone(j.person)})">
        <span class="yr">${j.year}</span><span class="who"><b>${TW.esc(j.person.short)}</b><small>${TW.esc(j.from[0])} → ${TW.esc(j.to[0])}</small></span><span class="km">${TW.roundKm(j.km)} km</span>
      </button></li>`).join("");
    const longest = journeys.reduce((a, b) => (b.km > a.km ? b : a));
    return `
      <div class="journeys">
        <div class="world card-plain">
          <svg id="world-svg" viewBox="0 0 ${V.width} ${V.height}" aria-label="World map of long journeys">
            <path class="sea" d="${sphere()}"/><path class="grat" d="${graticule()}"/><path class="coast" d="${V.land}"/>
            <g id="world-arcs">${arcs}</g><circle id="world-runner" r="3.5" opacity="0"/>
          </svg>
          <dl class="world-facts">
            <div><dt>Journeys</dt><dd>${journeys.length}<small>${new Set(journeys.map((j) => j.person)).size} people</small></dd></div>
            <div><dt>Longest</dt><dd>${TW.roundKm(longest.km)} km<small>${TW.esc(longest.person.short)}, ${TW.esc(longest.from[0])} → ${TW.esc(longest.to[0])}</small></dd></div>
            <div><dt>All together</dt><dd>${TW.roundKm(journeys.reduce((s, j) => s + j.km, 0))} km<small>in a straight line, place to place</small></dd></div>
          </dl>
          <div class="map-tip" id="world-tip" hidden></div>
          <button type="button" class="ghost-btn" id="world-replay">${icon("arrowRight", 14)}Draw again</button>
        </div>
        <div class="journey-list card-plain">
          <p class="kicker">${journeys.length} journeys of 2,000 km or more</p>
          <ol id="journey-rows">${rows}</ol>
        </div>
      </div>`;
  }

  // Draw the arcs one after another in date order; a small dot rides each arc as it draws.
  function play() {
    cancelAnimationFrame(anim);
    const groups = [...el.arcs.querySelectorAll(".journey")];
    const lens = groups.map((g) => g.querySelector(".arc").getTotalLength());
    groups.forEach((g, i) => { const a = g.querySelector(".arc"); a.style.strokeDasharray = `${lens[i]} ${lens[i]}`; a.style.strokeDashoffset = lens[i]; g.classList.remove("done"); });
    if (TW.reducedMotion()) { groups.forEach((g) => { g.querySelector(".arc").style.strokeDashoffset = 0; g.classList.add("done"); }); return; }
    const per = 520, gap = 140, start = performance.now();
    const tick = (t) => {
      const elapsed = t - start;
      let active = null;
      groups.forEach((g, i) => {
        const k = Math.max(0, Math.min(1, (elapsed - i * gap) / per)), e = 1 - (1 - k) ** 3;
        g.querySelector(".arc").style.strokeDashoffset = lens[i] * (1 - e);
        if (k > 0 && k < 1) active = { g, i, e };
        if (k >= 1 && !g.classList.contains("done")) g.classList.add("done");
      });
      if (active) {
        const p = active.g.querySelector(".arc").getPointAtLength(lens[active.i] * active.e);
        el.runner.setAttribute("cx", p.x); el.runner.setAttribute("cy", p.y); el.runner.setAttribute("opacity", "1");
        el.runner.style.fill = `var(${TW.tone(journeys[active.i].person)})`;
      } else el.runner.setAttribute("opacity", "0");
      if (elapsed < (groups.length - 1) * gap + per + 50) anim = requestAnimationFrame(tick);
      else el.runner.setAttribute("opacity", "0");
    };
    anim = requestAnimationFrame(tick);
  }

  function lit(i, evt) {
    el.arcs.classList.toggle("has-lit", i !== null);
    el.arcs.querySelectorAll(".journey").forEach((g) => g.classList.toggle("lit", +g.dataset.j === i));
    el.rows.querySelectorAll("[data-j]").forEach((b) => b.classList.toggle("lit", +b.dataset.j === i));
    if (i === null) { el.tip.hidden = true; return; }
    const j = journeys[i];
    el.tip.innerHTML = `<b>${TW.esc(j.person.name)}</b><span>${TW.esc(j.from[0])} → ${TW.esc(j.to[0])}, ${j.year} · about ${TW.roundKm(j.km)} km</span>`;
    el.tip.hidden = false;
    const box = el.svg.getBoundingClientRect(), wrap = el.svg.parentElement.getBoundingClientRect();
    let x, y;
    if (evt && evt.clientX) { x = evt.clientX - wrap.left; y = evt.clientY - wrap.top; }
    else { const [px, py] = proj(j.to[2], j.to[1]); x = box.left - wrap.left + (px / V.width) * box.width; y = box.top - wrap.top + (py / V.height) * box.height; }
    const tw = el.tip.offsetWidth;
    el.tip.style.transform = `translate(${Math.min(wrap.width - tw - 8, Math.max(8, x + 12))}px, ${Math.max(8, y - 50)}px)`;
  }

  function init(container) {
    journeys = TW.longJourneys(2000);
    container.insertAdjacentHTML("beforeend", html());
    const $ = (id) => document.getElementById(id);
    el = { svg: $("world-svg"), arcs: $("world-arcs"), runner: $("world-runner"), tip: $("world-tip"), rows: $("journey-rows"), replay: $("world-replay") };
    el.arcs.addEventListener("pointermove", (e) => { const g = e.target.closest("[data-j]"); lit(g ? +g.dataset.j : null, e); });
    el.arcs.addEventListener("pointerleave", () => lit(null));
    el.arcs.addEventListener("click", (e) => { const g = e.target.closest("[data-j]"); if (g) TW.openProfile(journeys[+g.dataset.j].person); });
    el.rows.addEventListener("pointerover", (e) => { const b = e.target.closest("[data-j]"); lit(b ? +b.dataset.j : null); });
    el.rows.addEventListener("pointerleave", () => lit(null));
    el.rows.addEventListener("click", (e) => { const b = e.target.closest("[data-j]"); if (b) TW.openProfile(journeys[+b.dataset.j].person); });
    el.replay.addEventListener("click", play);
    // Hide the arcs until the map is on screen, then draw them once.
    el.arcs.querySelectorAll(".arc").forEach((a) => { const n = a.getTotalLength(); a.style.strokeDasharray = `${n} ${n}`; a.style.strokeDashoffset = n; });
    new IntersectionObserver((entries, obs) => {
      if (entries.some((e) => e.isIntersecting) && !played) { played = true; play(); obs.disconnect(); }
    }, { threshold: 0.35 }).observe(el.svg);
  }

  TW.journeys = { init, count: () => journeys.length, play };
})();
