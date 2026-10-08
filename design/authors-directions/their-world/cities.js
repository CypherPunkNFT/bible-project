// Section: cities that gathered them. City cards pick a city; a second map (Europe or America) glides its viewBox onto it,
// drawing where each person came from, and a small timeline lists who arrived when.
(() => {
  const ASPECT = 1000 / 640;
  const state = { city: null, view: null, box: null, anim: 0, pxPerUnit: 1 };
  let el = {}, cities = [];

  const cityCard = (c, i) => `
    <button type="button" class="city-card" data-city="${i}" aria-pressed="false">
      <span class="city-name">${TW.esc(c.name)}</span>
      <span class="city-count"><b>${c.stays.length}</b> people</span>
      <span class="city-span">${c.first}–${c.last >= THIS_YEAR ? "today" : c.last}</span>
      <span class="city-dots">${c.stays.map((s) => `<i style="--tone: var(${TW.tone(s.person)})"></i>`).join("")}</span>
    </button>`;

  function html() {
    return `
      <div class="city-rail" role="group" aria-label="Choose a city">${cities.map(cityCard).join("")}</div>
      <div class="city-body">
        <div class="city-map card-plain">
          <svg id="city-svg" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" aria-label="Map of the chosen city"></svg>
          <p class="map-caption" id="city-caption"></p>
        </div>
        <div class="city-time card-plain">
          <p class="kicker" id="city-kicker"></p>
          <h3 id="city-title"></h3>
          <p class="muted small">Each bar is the years a person lived here; the line on the map shows where they came from.</p>
          <ol class="stays" id="city-stays"></ol>
        </div>
      </div>`;
  }

  function landFor(view) {
    const v = AUTHORS.views[view];
    return `<rect x="-3000" y="-3000" width="7000" height="7000" class="water"/><path class="coast" d="${v.land}"/>`;
  }

  // Lines from where each person came from (when that place is on this map) into the city.
  function drawCity(c) {
    const proj = TW.project[c.view], [cx, cy] = proj(c.lon, c.lat);
    const pts = [[cx, cy]];
    const lines = [], marks = [], labels = new Map();
    c.stays.forEach((s, i) => {
      if (!s.cameFrom || s.bornHere) return;
      const prev = s.person.places[s.index - 1];
      const [x, y] = proj(prev[2], prev[1]);
      const v = AUTHORS.views[c.view];
      if (x < 0 || y < 0 || x > v.width || y > v.height) return;
      pts.push([x, y]);
      const mx = (x + cx) / 2, my = (y + cy) / 2, dx = cx - x, dy = cy - y, bend = 0.18;
      lines.push(`<path class="came" data-i="${i}" style="--tone: var(${TW.tone(s.person)})" d="M${x},${y} Q${mx - dy * bend},${my + dx * bend} ${cx},${cy}"/>`);
      marks.push(`<circle class="from" data-i="${i}" style="--tone: var(${TW.tone(s.person)})" cx="${x}" cy="${y}" r="3"/>`);
      if (!labels.has(prev[0])) labels.set(prev[0], [x, y]);
    });
    const labelSvg = [...labels].map(([name, [x, y]]) => `<text class="lbl" x="${x}" y="${y}" data-dx="6" data-dy="-6">${TW.esc(name)}</text>`).join("");
    el.svg.querySelector(".overlay").innerHTML = `${lines.join("")}${marks.join("")}
      <circle class="city-halo" cx="${cx}" cy="${cy}" r="14"/><circle class="city-pin" cx="${cx}" cy="${cy}" r="5"/>
      <text class="lbl city-lbl" x="${cx}" y="${cy}" data-dx="10" data-dy="16">${TW.esc(c.name)}</text>${labelSvg}`;
    const box = boxAround(pts);
    spreadLabels(box);
    return box;
  }

  // Labels that would overlap at the final zoom drop below their point instead of above it.
  function spreadLabels(box) {
    const unit = box.w / Math.max(1, el.svg.clientWidth), taken = [];
    el.svg.querySelectorAll(".lbl").forEach((t) => {
      const x = +t.getAttribute("x") / unit, y = +t.getAttribute("y") / unit, w = t.textContent.length * 6.6;
      const boxAt = (dy) => [x + +t.dataset.dx, y + dy - 10, x + +t.dataset.dx + w, y + dy + 3];
      const hits = (b) => taken.some((o) => !(b[2] < o[0] || b[0] > o[2] || b[3] < o[1] || b[1] > o[3]));
      let b = boxAt(+t.dataset.dy);
      if (hits(b)) { t.dataset.dy = 15; b = boxAt(15); }
      if (hits(b)) { t.dataset.dx = -6 - w; t.dataset.dy = 4; b = boxAt(4); }
      taken.push(b);
    });
  }

  function boxAround(pts) {
    let x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0]));
    let y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
    let w = Math.max(160, (x1 - x0) * 1.5), h = Math.max(160 / ASPECT, (y1 - y0) * 1.6);
    if (w / h < ASPECT) w = h * ASPECT; else h = w / ASPECT;
    return { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h };
  }

  // Keep pins and labels the same size on screen while the viewBox zooms.
  function applyBox(b) {
    el.svg.setAttribute("viewBox", `${b.x} ${b.y} ${b.w} ${b.h}`);
    const unit = b.w / Math.max(1, el.svg.clientWidth);
    el.svg.querySelectorAll(".lbl").forEach((t) => {
      t.setAttribute("font-size", 11.5 * unit);
      t.setAttribute("dx", t.dataset.dx * unit); t.setAttribute("dy", t.dataset.dy * unit);
    });
    el.svg.querySelectorAll(".from").forEach((c) => c.setAttribute("r", 3 * unit));
    const pin = el.svg.querySelector(".city-pin"), halo = el.svg.querySelector(".city-halo");
    if (pin) { pin.setAttribute("r", 5 * unit); halo.setAttribute("r", 13 * unit); }
  }

  function animateTo(target) {
    cancelAnimationFrame(state.anim);
    const from = state.box, start = performance.now();
    if (!from || TW.reducedMotion()) { state.box = target; applyBox(target); return; }
    const tick = (t) => {
      const k = Math.min(1, (t - start) / 1100), e = k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
      state.box = Object.fromEntries(["x", "y", "w", "h"].map((key) => [key, from[key] + (target[key] - from[key]) * e]));
      applyBox(state.box);
      if (k < 1) state.anim = requestAnimationFrame(tick);
    };
    state.anim = requestAnimationFrame(tick);
  }

  function choose(i) {
    const c = cities[i];
    state.city = c;
    el.rail.querySelectorAll("[data-city]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.city === i)));
    if (state.view !== c.view) {
      state.view = c.view;
      const v = AUTHORS.views[c.view];
      el.svg.innerHTML = `<g class="base">${landFor(c.view)}</g><g class="overlay"></g>`;
      state.box = { x: 0, y: 0, w: v.width, h: v.width / ASPECT }; // start wide, then glide in
      applyBox(state.box);
    }
    animateTo(drawCity(c));
    el.caption.textContent = c.view === "europe" ? "Britain and western Europe" : "Eastern United States";
    el.kicker.textContent = `${c.stays.length} people · ${c.first}–${c.last >= THIS_YEAR ? "today" : c.last}`;
    el.title.textContent = c.name;
    renderStays(c);
  }

  function renderStays(c) {
    const span = Math.max(1, c.last - c.first);
    el.stays.innerHTML = c.stays.map((s, i) => {
      const left = ((s.from - c.first) / span) * 100, width = Math.max(1.5, ((s.to - s.from) / span) * 100);
      const how = s.bornHere ? "born here" : s.cameFrom ? `from ${TW.esc(s.cameFrom)}` : "birthplace unknown";
      const until = s.to >= THIS_YEAR && !s.person.died ? "today" : s.to;
      return `<li><button type="button" data-i="${i}" style="--tone: var(${TW.tone(s.person)})">
        <span class="yr">${s.from}</span>
        <span class="who"><i></i><b>${TW.esc(s.person.name)}</b><small>${how} · until ${until}${s.returned ? " · returned later" : ""}</small></span>
        <span class="bar"><span style="left:${left}%;width:${Math.min(width, 100 - left)}%"></span></span>
      </button></li>`;
    }).join("");
  }

  function highlight(i) {
    el.svg.querySelectorAll(".came, .from").forEach((n) => n.classList.toggle("lit", i !== null && +n.dataset.i === i));
    el.svg.classList.toggle("has-lit", i !== null);
  }

  function init(container) {
    cities = TW.sharedCities();
    container.insertAdjacentHTML("beforeend", html());
    const $ = (id) => document.getElementById(id);
    el = { rail: container.querySelector(".city-rail"), svg: $("city-svg"), caption: $("city-caption"), kicker: $("city-kicker"), title: $("city-title"), stays: $("city-stays") };
    el.rail.addEventListener("click", (e) => { const b = e.target.closest("[data-city]"); if (b) choose(+b.dataset.city); });
    el.stays.addEventListener("pointerover", (e) => { const b = e.target.closest("[data-i]"); highlight(b ? +b.dataset.i : null); });
    el.stays.addEventListener("pointerleave", () => highlight(null));
    el.stays.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) TW.openProfile(state.city.stays[+b.dataset.i].person); });
    new ResizeObserver(() => state.box && applyBox(state.box)).observe(el.svg);
    choose(0);
  }

  TW.cities = { init, count: () => cities.length };
})();
