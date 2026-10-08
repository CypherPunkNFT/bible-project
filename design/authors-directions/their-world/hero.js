// The main event: every person on one Atlantic map, year by year. Land is SVG (it follows the theme by itself);
// dots, trails and labels are two canvases drawn in requestAnimationFrame only while something is moving.
(() => {
  const VIEW = AUTHORS.views.atlantic, W = VIEW.width, H = VIEW.height;
  const FIRST = 1500, LAST = THIS_YEAR, SPEED = 16, FOLLOW_SPEED = 7; // years per second
  const proj = TW.project.atlantic;
  const camFromBox = (west, south, east, north) => {
    const [x0, y1] = proj(west, south), [x1, y0] = proj(east, north);
    let w = x1 - x0, h = y1 - y0;
    if (w / h < W / H) w = (h * W) / H; else h = (w * H) / W;
    return { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w };
  };
  const CAMERAS = {
    atlantic: { label: "Atlantic", cam: { x: 0, y: 0, w: W } },
    europe: { label: "Britain & Europe", cam: camFromBox(-10.5, 44.5, 19, 59.2), box: [-11, 43, 20, 60] },
    america: { label: "North America", cam: camFromBox(-96, 29, -67, 46.5), box: [-97, 27, -66, 47] },
  };
  const people = AUTHORS.people;
  const state = { year: 1880, playing: false, followEnd: null, focus: null, hover: null, selected: null,
    camera: "atlantic", cam: { ...CAMERAS.atlantic.cam }, camAnim: null, lastFloor: null };
  const dots = new Map(people.map((p) => [p.id, { x: 0, y: 0, a: 0, ox: 0, oy: 0, tx: 0, ty: 0, ta: 0, tox: 0, toy: 0, place: null, init: false }]));
  let el = {}, ctx, trailCtx, cssW = 0, cssH = 0, dpr = 1, raf = 0, lastT = 0, trailLife = 0, colors = {};

  const aliveIn = (year, focus) => people.filter((p) => year >= p.born && year <= lifeEnd(p) && (!focus || familyOf(p).key === focus));
  const xy = (place) => proj(place.lon, place.lat);

  function histogramPath(focus) {
    const pts = [];
    let max = 0;
    for (let y = FIRST; y <= LAST; y++) { const n = aliveIn(y, null).length; max = Math.max(max, n); }
    for (let y = FIRST; y <= LAST; y++) pts.push([((y - FIRST) / (LAST - FIRST)) * 1000, 40 - (aliveIn(y, focus).length / max) * 36]);
    return `M0,40 ${pts.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join("")} L1000,40Z`;
  }

  function graticule() {
    const lines = [];
    for (let lon = -110; lon <= 30; lon += 10) { const [x] = proj(lon, 40); lines.push(`M${x.toFixed(1)},-50V${H + 50}`); }
    for (let lat = 30; lat <= 60; lat += 10) { const [, y] = proj(0, lat); lines.push(`M-50,${y.toFixed(1)}H${W + 50}`); }
    return lines.join("");
  }

  function html() {
    const families = FAMILIES.map((f) => ({ ...f, n: people.filter((p) => familyOf(p).key === f.key).length }));
    const ticks = [1500, 1600, 1700, 1800, 1900, 2000].map((y) => `<span style="left:${((y - FIRST) / (LAST - FIRST)) * 100}%">${y}</span>`).join("");
    return `
    <section class="stage" aria-label="Map of their lives">
      <div class="stage-map">
        <div class="map-frame" id="hero-frame">
          <svg class="land" id="hero-land" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
            <rect x="-2000" y="-2000" width="${W + 4000}" height="${H + 4000}" class="water"/>
            <path class="grat" d="${graticule()}"/>
            <path class="coast" d="${VIEW.land}"/>
          </svg>
          <canvas class="trails" id="hero-trails"></canvas>
          <canvas class="dots" id="hero-dots" aria-label="People on the map; hover a dot for a name, click for their profile"></canvas>
          <div class="year-badge" aria-live="polite"><b id="hero-year">1880</b><span id="hero-count"></span></div>
          <div class="map-tip" id="hero-tip" hidden></div>
        </div>
        <div class="seg" role="group" aria-label="Map area">${Object.entries(CAMERAS).map(([k, c]) => `<button type="button" data-cam="${k}" aria-pressed="${k === "atlantic"}">${c.label}</button>`).join("")}</div>
        <div class="controls">
          <button type="button" class="play" id="hero-play" aria-label="Play through the years">${playIcon(false)}</button>
          <div class="scrub">
            <svg class="hist" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true"><path class="all" d="${histogramPath(null)}"/><path class="focus" id="hero-hist-focus" d=""/></svg>
            <input type="range" id="hero-range" min="${FIRST}" max="${LAST}" step="1" value="1880" aria-label="Year">
            <div class="ticks" aria-hidden="true">${ticks}</div>
          </div>
        </div>
        <div class="fam-chips" role="group" aria-label="Show one family">
          ${families.map((f) => `<button type="button" data-fam="${f.key}" style="--tone: var(${f.tone})" aria-pressed="false"><i></i>${f.label}<small>${f.n}</small></button>`).join("")}
        </div>
        <p class="note">Each dot is one person at the place they lived that year; it glides when they move and leaves a fading trail. The shaded band under the slider counts how many were alive each year.</p>
      </div>
      <aside class="alive-panel">
        <p class="kicker">Living in <span id="alive-year">1880</span></p>
        <ol id="alive-list"></ol>
      </aside>
    </section>`;
  }

  const playIcon = (on) => on
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';

  // Where every dot should be for the current whole year: place, alpha, and a small ring offset for shared places.
  function retarget() {
    const year = Math.floor(state.year);
    const groups = new Map();
    for (const p of people) {
      const d = dots.get(p.id);
      const place = TW.placeAt(p, year);
      const shown = place ?? (year <= lifeEnd(p) ? { ...placeFrom(p, 0) } : { ...placeFrom(p, p.places.length - 1) });
      [d.tx, d.ty] = xy(shown);
      d.ta = place ? 1 : 0;
      d.place = place;
      if (!d.init) { d.x = d.tx; d.y = d.ty; d.init = true; }
      if (place) { const key = place.name; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(d); }
      d.tox = 0; d.toy = 0;
    }
    for (const group of groups.values()) {
      if (group.length < 2) continue;
      const r = 3.2 + group.length * 0.9;
      group.forEach((d, i) => { const t = (i / group.length) * Math.PI * 2 - Math.PI / 2; d.tox = Math.cos(t) * r; d.toy = Math.sin(t) * r; });
    }
    state.lastFloor = year;
  }
  const placeFrom = (p, i) => ({ name: p.places[i][0], lat: p.places[i][1], lon: p.places[i][2], index: i });

  function resize() {
    const r = el.frame.getBoundingClientRect();
    cssW = r.width; cssH = r.height; dpr = Math.min(2, devicePixelRatio || 1);
    for (const c of [el.dots, el.trails]) { c.width = Math.round(cssW * dpr); c.height = Math.round(cssH * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); trailCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function readColors() {
    colors = { ink: Frame.color("--ink"), muted: Frame.color("--muted"), page: Frame.color("--page"), surface: Frame.color("--surface") };
    for (const f of FAMILIES) colors[f.key] = Frame.color(f.tone);
  }

  const scale = () => cssW / state.cam.w;
  const toScreen = (x, y) => { const s = scale(); return [(x - state.cam.x) * s, (y - state.cam.y) * s]; };

  function step(t) {
    raf = 0;
    const dt = Math.min(0.05, lastT ? (t - lastT) / 1000 : 0.016);
    lastT = t;
    const reduced = TW.reducedMotion();
    if (state.playing) {
      const end = state.followEnd ?? LAST;
      state.year = Math.min(end, state.year + dt * (state.followEnd ? FOLLOW_SPEED : SPEED));
      if (state.year >= end) setPlaying(false);
      syncYear();
    }
    if (state.camAnim) {
      const a = state.camAnim, k = reduced ? 1 : Math.min(1, (t - a.start) / 900), e = k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
      for (const key of ["x", "y", "w"]) state.cam[key] = a.from[key] + (a.to[key] - a.from[key]) * e;
      el.land.setAttribute("viewBox", `${state.cam.x} ${state.cam.y} ${state.cam.w} ${(state.cam.w * H) / W}`);
      trailCtx.clearRect(0, 0, cssW, cssH);
      if (k >= 1) state.camAnim = null;
    }
    const ease = reduced ? 1 : 1 - Math.exp(-dt * 7);
    let moving = false;
    trailCtx.globalCompositeOperation = "destination-out";
    trailCtx.fillStyle = `rgba(0,0,0,${Math.min(1, dt * 2.2)})`;
    trailCtx.fillRect(0, 0, cssW, cssH);
    trailCtx.globalCompositeOperation = "source-over";
    trailCtx.lineWidth = 1.6; trailCtx.lineCap = "round";
    for (const p of people) {
      const d = dots.get(p.id);
      const [sx0, sy0] = toScreen(d.x, d.y);
      const before = [sx0 + d.ox, sy0 + d.oy];
      for (const [v, tv] of [["x", "tx"], ["y", "ty"], ["a", "ta"], ["ox", "tox"], ["oy", "toy"]]) {
        const diff = d[tv] - d[v];
        if (Math.abs(diff) > 0.01) { d[v] += diff * ease; moving = true; } else d[v] = d[tv];
      }
      const [sx, sy] = toScreen(d.x, d.y);
      if (!reduced && d.a > 0.3 && !state.camAnim && Math.hypot(sx + d.ox - before[0], sy + d.oy - before[1]) > 0.4) {
        trailCtx.strokeStyle = colors[familyOf(p).key];
        trailCtx.globalAlpha = dimmed(p) ? 0.12 : 0.6;
        trailCtx.beginPath(); trailCtx.moveTo(before[0], before[1]); trailCtx.lineTo(sx + d.ox, sy + d.oy); trailCtx.stroke();
        trailLife = 2.5;
      }
    }
    trailCtx.globalAlpha = 1;
    trailLife -= dt;
    if (trailLife <= 0 && trailLife > -1) { trailCtx.clearRect(0, 0, cssW, cssH); trailLife = -1; }
    draw();
    if (state.playing || moving || state.camAnim || trailLife > 0) kick();
  }
  const kick = () => { if (!raf) { if (!lastT) lastT = performance.now(); raf = requestAnimationFrame(step); } };
  const dimmed = (p) => state.focus && familyOf(p).key !== state.focus;

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, cssW, cssH);
    drawCityLabels();
    if (state.selected) drawRoute(state.selected);
    const inset = 10, offMap = state.camera === "atlantic";
    const order = [...people].sort((a, b) => (dimmed(a) ? 0 : 1) - (dimmed(b) ? 0 : 1));
    for (const p of order) {
      const d = dots.get(p.id);
      if (d.a < 0.02) continue;
      let [x, y] = toScreen(d.x, d.y); x += d.ox; y += d.oy;
      const out = x < inset || y < inset || x > cssW - inset || y > cssH - inset;
      const hot = state.hover === p.id || state.selected?.id === p.id;
      const alpha = d.a * (dimmed(p) ? 0.16 : 1);
      ctx.fillStyle = colors[familyOf(p).key];
      if (out) {
        const cx = Math.max(inset, Math.min(cssW - inset, x)), cy = Math.max(inset, Math.min(cssH - inset, y));
        ctx.globalAlpha = alpha * (offMap ? 1 : 0.45);
        drawEdgeMarker(cx, cy, x, y, offMap && d.place ? d.place.name : null, hot);
        p._screen = [cx, cy];
        continue;
      }
      p._screen = [x, y];
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(x, y, hot ? 6.5 : 4.4, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 1.4; ctx.strokeStyle = colors.surface; ctx.stroke();
      if (hot) { ctx.globalAlpha = alpha * 0.35; ctx.lineWidth = 1; ctx.strokeStyle = colors[familyOf(p).key]; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  }

  // A person beyond the map's edge sits on the edge with a small arrow pointing their way.
  function drawEdgeMarker(cx, cy, x, y, label, hot) {
    const ang = Math.atan2(y - cy, x - cx);
    ctx.beginPath(); ctx.arc(cx, cy, hot ? 5.5 : 4, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(5.5, -3); ctx.lineTo(5.5, 3); ctx.closePath(); ctx.fill(); ctx.restore();
    if (!label) return;
    ctx.font = "italic 11px " + Frame.color("--serif");
    ctx.fillStyle = colors.muted;
    ctx.textBaseline = "middle";
    const right = cx > cssW / 2;
    ctx.textAlign = right ? "right" : "left";
    const ly = Math.max(14, Math.min(cssH - 14, cy - (cy > cssH - 20 ? 12 : 0)));
    ctx.fillText(`${label}`, cx + (right ? -14 : 14), ly);
  }

  let labelPlaces = [];
  function drawCityLabels() {
    ctx.font = "11px " + Frame.color("--serif");
    ctx.textBaseline = "middle"; ctx.textAlign = "left";
    const placed = [];
    const busy = people.filter((p) => p._screen && dots.get(p.id).a > 0.3).map((p) => p._screen);
    const onRoute = new Set(state.selected ? state.selected.places.map((pl) => pl[0]) : []);
    for (const c of labelPlaces) {
      if (onRoute.has(c.name)) continue;
      const [x, y] = toScreen(...proj(c.lon, c.lat));
      if (x < 0 || y < 0 || x > cssW - 40 || y > cssH) continue;
      const w = ctx.measureText(c.name).width, box = [x + 7, y - 7, x + 9 + w, y + 7];
      if (placed.some((b) => !(box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3]))) continue;
      if (busy.some(([dx, dy]) => dx > box[0] - 5 && dx < box[2] + 5 && dy > box[1] - 5 && dy < box[3] + 5)) continue;
      placed.push(box);
      ctx.globalAlpha = 0.5; ctx.fillStyle = colors.muted;
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.8; ctx.fillText(c.name, x + 8, y);
    }
    ctx.globalAlpha = 1;
  }

  function drawRoute(p) {
    const pts = p.places.map((pl) => toScreen(...proj(pl[2], pl[1])));
    const color = colors[familyOf(p).key];
    ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.setLineDash([3, 4]); ctx.globalAlpha = 0.75;
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "11px " + Frame.color("--serif"); ctx.textAlign = "left"; ctx.textBaseline = "middle";
    pts.forEach(([x, y], i) => {
      ctx.globalAlpha = 0.9; ctx.fillStyle = colors.surface; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = colors.ink; ctx.fillText(`${p.places[i][0]} ${TW.staysOf(p)[i].from}`, x + 7, y + (i % 2 ? 9 : -9));
    });
    ctx.globalAlpha = 1;
  }

  function syncYear() {
    const y = Math.floor(state.year);
    el.range.value = String(y);
    if (y === state.lastFloor) return;
    retarget();
    el.year.textContent = y;
    el.aliveYear.textContent = y;
    renderAlive(y);
    kick();
  }

  let aliveSig = "";
  function renderAlive(year) {
    const alive = aliveIn(year, null);
    const off = alive.filter((p) => { const pl = TW.placeAt(p, year); if (!pl) return false; const [x, y] = xy(pl); return x < 0 || y < 0 || x > W || y > H; }).length;
    el.count.textContent = `${alive.length} living${off ? ` · ${off} beyond this map` : ""}`;
    const sig = alive.map((p) => p.id + (TW.placeAt(p, year)?.index ?? "-")).join("|") + state.focus;
    if (sig === aliveSig) return;
    aliveSig = sig;
    el.alive.innerHTML = alive.length ? alive.map((p) => {
      const pl = TW.placeAt(p, year);
      const where = !pl ? "Place not yet recorded" : `${TW.esc(pl.name)} · ${TW.staysOf(p)[pl.index].birth ? `born ${p.born}` : `since ${p.places[pl.index][3]}`}`;
      return `<li><button type="button" data-id="${p.id}" class="${dimmed(p) ? "dim" : ""}" style="--tone: var(${TW.tone(p)})"><i></i><b>${TW.esc(p.name)}</b><span>${where}</span></button></li>`;
    }).join("") : `<li class="empty">No one from the library was alive in ${year}.</li>`;
  }

  function setPlaying(on) {
    state.playing = on;
    if (!on) state.followEnd = null;
    el.play.innerHTML = playIcon(on);
    el.play.setAttribute("aria-label", on ? "Pause" : "Play through the years");
    el.play.setAttribute("aria-pressed", String(on));
    if (on) { lastT = 0; kick(); }
  }

  function setCamera(key) {
    state.camera = key;
    el.root.querySelectorAll("[data-cam]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cam === key)));
    state.camAnim = { from: { ...state.cam }, to: { ...CAMERAS[key].cam }, start: performance.now() };
    kick();
  }

  function setFocus(key) {
    state.focus = state.focus === key ? null : key;
    el.root.querySelectorAll("[data-fam]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.fam === state.focus)));
    el.histFocus.setAttribute("d", state.focus ? histogramPath(state.focus) : "");
    aliveSig = ""; renderAlive(Math.floor(state.year));
    trailCtx.clearRect(0, 0, cssW, cssH);
    draw();
  }

  function hitTest(evt) {
    const r = el.frame.getBoundingClientRect(), mx = evt.clientX - r.left, my = evt.clientY - r.top;
    let best = null, bestD = 14;
    for (const p of people) {
      const d = dots.get(p.id);
      if (d.a < 0.5 || !p._screen) continue;
      const dist = Math.hypot(p._screen[0] - mx, p._screen[1] - my);
      if (dist < bestD) { best = p; bestD = dist; }
    }
    return { person: best, mx, my };
  }

  function showTip(p, mx, my) {
    if (!p) { el.tip.hidden = true; return; }
    const pl = dots.get(p.id).place;
    el.tip.innerHTML = `<b>${TW.esc(p.name)}</b><span>${pl ? `${TW.esc(pl.name)}${TW.staysOf(p)[pl.index].birth ? `, born ${p.born}` : ` since ${p.places[pl.index][3]}`}` : ""}</span>`;
    el.tip.hidden = false;
    const tw = el.tip.offsetWidth;
    el.tip.style.transform = `translate(${Math.min(cssW - tw - 8, Math.max(8, mx + 14))}px, ${Math.max(8, my - 46)}px)`;
  }

  function bind() {
    el.range.addEventListener("input", () => { if (state.playing) setPlaying(false); state.year = +el.range.value; syncYear(); });
    el.play.addEventListener("click", () => {
      if (!state.playing && state.year >= LAST - 0.5) { state.year = FIRST; syncYear(); }
      setPlaying(!state.playing);
    });
    el.root.querySelectorAll("[data-cam]").forEach((b) => b.addEventListener("click", () => setCamera(b.dataset.cam)));
    el.root.querySelectorAll("[data-fam]").forEach((b) => b.addEventListener("click", () => setFocus(b.dataset.fam)));
    el.dots.addEventListener("pointermove", (e) => {
      const { person, mx, my } = hitTest(e);
      el.dots.style.cursor = person ? "pointer" : "default";
      if ((person?.id ?? null) !== state.hover) { state.hover = person?.id ?? null; draw(); }
      showTip(person, mx, my);
    });
    el.dots.addEventListener("pointerleave", () => { state.hover = null; el.tip.hidden = true; draw(); });
    el.dots.addEventListener("click", (e) => { const { person } = hitTest(e); if (person) select(person, true); else if (state.selected) select(null, false); });
    el.alive.addEventListener("pointerover", (e) => { const b = e.target.closest("[data-id]"); state.hover = b?.dataset.id ?? null; draw(); });
    el.alive.addEventListener("pointerleave", () => { state.hover = null; draw(); });
    el.alive.addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) select(personById(b.dataset.id), true); });
    new ResizeObserver(resize).observe(el.frame);
    addEventListener("themechange", () => { readColors(); trailCtx.clearRect(0, 0, cssW, cssH); draw(); });
  }

  function select(person, openCard) {
    state.selected = person;
    draw();
    if (openCard) TW.openProfile(person);
  }

  // From a profile card: show this person's route and play through their life.
  function follow(person) {
    state.selected = person;
    const inBox = (box) => person.places.every(([, lat, lon]) => lon >= box[0] && lon <= box[2] && lat >= box[1] && lat <= box[3]);
    setCamera(inBox(CAMERAS.europe.box) ? "europe" : inBox(CAMERAS.america.box) ? "america" : "atlantic");
    state.year = person.born; syncYear();
    state.followEnd = lifeEnd(person);
    setPlaying(true);
    el.root.scrollIntoView({ behavior: TW.reducedMotion() ? "auto" : "smooth", block: "center" });
  }

  function init(container) {
    container.insertAdjacentHTML("beforeend", html());
    el.root = container.querySelector(".stage");
    const $ = (id) => document.getElementById(id);
    Object.assign(el, { frame: $("hero-frame"), land: $("hero-land"), dots: $("hero-dots"), trails: $("hero-trails"), year: $("hero-year"), count: $("hero-count"),
      tip: $("hero-tip"), play: $("hero-play"), range: $("hero-range"), histFocus: $("hero-hist-focus"), alive: $("alive-list"), aliveYear: $("alive-year") });
    ctx = el.dots.getContext("2d"); trailCtx = el.trails.getContext("2d");
    labelPlaces = TW.sharedCities().filter((c) => { const [x, y] = proj(c.lon, c.lat); return x >= 0 && x <= W && y >= 0 && y <= H; });
    readColors();
    retarget(); state.lastFloor = null; syncYear();
    bind();
    resize();
    document.fonts?.ready.then(draw);
  }

  TW.hero = { init, follow, state };
})();
