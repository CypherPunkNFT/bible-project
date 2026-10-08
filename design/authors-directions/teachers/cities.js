// Section 03 · Cities that gathered them (ported from "Their world"). City cards, each with a line drawing of the town's
// best-known landmark; choosing one glides the second map (Europe or America) onto it, drawing a line from where each
// teacher came, and a timeline beside it lists who arrived when (each row opens the shared profile drawer).
window.Sections = window.Sections || {};
(() => {
  const ASPECT = 1000 / 640;
  const RAD = Math.PI / 180;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tone = (person) => familyOf(person).tone;
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const yearsLabel = (c) => `${c.first}–${c.last >= THIS_YEAR ? "today" : c.last}`;
  const count = (n) => `${n} ${n === 1 ? "teacher" : "teachers"}`;

  // ── Landmark line drawings (40×40, one stroke weight, round caps; faint lines are ground and detail) ──────────
  const G = '<path class="cty-faint" d="M4 35.5H36"/>';
  const LANDMARKS = {
    London: ["Elizabeth Tower (Big Ben), Westminster", `${G}
      <path d="M16.5 35.5V18M23.5 35.5V18M15.5 18H24.5V11H15.5Z"/><circle cx="20" cy="14.5" r="2.4"/><path class="cty-soft" d="M20 14.5V13.1M20 14.5H21.1"/>
      <path d="M16.5 11V8.2H23.5V11M16.5 8.2L20 2.5L23.5 8.2"/><path class="cty-soft" d="M18.6 21.5V24.5M21.4 21.5V24.5M18.6 28V31M21.4 28V31"/>
      <path d="M23.5 26.5H33.5V35.5M27 26.5V24.8M30.5 26.5V24.8"/><path class="cty-soft" d="M26.5 29.5V32M30 29.5V32"/>`],
    Princeton: ["Nassau Hall, Princeton University", `${G}
      <path d="M5.5 35.5V20.5H34.5V35.5M4.5 20.5L7 17.5H33L35.5 20.5M17.5 17.5V13.5H22.5V17.5"/><path d="M17.5 13.5Q20 9.5 22.5 13.5M20 10.9V7.5"/>
      <path d="M18.4 35.5V31.6Q20 29.8 21.6 31.6V35.5"/><path class="cty-soft" d="M15.5 20.5V35.5M24.5 20.5V35.5M8.8 23.5V25.5M12.2 23.5V25.5M27.8 23.5V25.5M31.2 23.5V25.5M8.8 29V31M12.2 29V31M27.8 29V31M31.2 29V31M20 23.5V26"/>`],
    Cambridge: ["King's College Chapel", `${G}
      <path d="M9 35.5V11.5M12.5 35.5V11.5M9 11.5L10.75 6.5L12.5 11.5M27.5 35.5V11.5M31 35.5V11.5M27.5 11.5L29.25 6.5L31 11.5"/>
      <path d="M12.5 16.5H27.5M15 31V21.5Q20 14.5 25 21.5V31Z"/><path class="cty-soft" d="M18.3 31V18.3M21.7 31V18.3M15 25.5H25M10.75 4.8V6.5M29.25 4.8V6.5M9 20H12.5M27.5 20H31"/>`],
    Philadelphia: ["Independence Hall", `${G}
      <path d="M4.5 35.5V23.5H35.5V35.5M3.5 23.5L5.5 21.5H34.5L36.5 23.5M16.5 35.5V15.5H23.5V21.5"/><path d="M17.8 15.5V11H22.2V15.5M18.6 11V8.4H21.4V11M18.6 8.4Q20 6.2 21.4 8.4M20 6.8V3.5"/>
      <circle cx="20" cy="18.6" r="1.5"/><path class="cty-soft" d="M18.6 35.5V31.8Q20 30.4 21.4 31.8V35.5M7.5 26.5V28.5M10.5 26.5V28.5M13.5 26.5V28.5M26.5 26.5V28.5M29.5 26.5V28.5M32.5 26.5V28.5M7.5 31V33M10.5 31V33M13.5 31V33M26.5 31V33M29.5 31V33M32.5 31V33"/>`],
    Glasgow: ["Glasgow Cathedral", `${G}
      <path d="M5 35.5V24.5M35 35.5V24.5M3.5 24.5L7 20.5H33L36.5 24.5M17 20.5V12.5H23V20.5M17 12.5L20 3L23 12.5"/>
      <path class="cty-soft" d="M8.5 32V27.5M11.5 32V27.5M14.5 32V27.5M25.5 32V27.5M28.5 32V27.5M31.5 32V27.5M20 18.5V15M17 12.5V11M23 12.5V11"/>`],
    Geneva: ["St Pierre Cathedral, where Calvin preached", `${G}
      <path d="M6.5 35.5V15.5H13V35.5M27 35.5V15.5H33.5V35.5M6 15.5L9.75 12.5L13.5 15.5M26.5 15.5L30.25 12.5L34 15.5"/>
      <path d="M13 21.5H27M18.6 21.5V13.5L20 4L21.4 13.5V21.5M13 27L20 23L27 27H13"/><path class="cty-soft" d="M15.2 35.5V27M18.4 35.5V27M21.6 35.5V27M24.8 35.5V27M9.75 18V21M30.25 18V21"/>`],
    Edinburgh: ["Edinburgh Castle on its rock", `
      <path d="M3.5 35.5L6.5 31L8.5 30.2L10.5 26.5L12.5 25H30L32 28L34.5 30L36.5 35.5"/>
      <path d="M12.5 25V15.5H14V14H15.5V15.5H17V14H18.5V15.5H20V25M20 18.5H27.5V25M27.5 18.5Q30 18.3 30 20.5V25M23.5 18.5V11.5M23.5 11.5H26.3L23.5 13.3"/>
      <path class="cty-soft" d="M15 19V21.5M17.5 19V21.5M22 21V22.8M25 21V22.8M8.5 33L12 30.5M27.5 33L31 30"/>`],
    Oxford: ["The Radcliffe Camera", `
      <path class="cty-faint" d="M6 35.5H34"/><path d="M8.5 35.5V27.5H31.5V35.5M10 27.5V19.5H30V27.5M8.5 19.5H31.5M11 19.5Q11 9.5 20 9.5Q29 9.5 29 19.5"/>
      <path d="M18 9.5V7H22V9.5M18 7Q20 4.6 22 7M20 5.2V3.5"/><path class="cty-soft" d="M13 26.5V20.5M17 26.5V20.5M23 26.5V20.5M27 26.5V20.5M15.5 19Q15.6 12.6 20 9.6M24.5 19Q24.4 12.6 20 9.6M18.5 35.5V31.5H21.5V35.5"/>`],
    Franeker: ["The Martinikerk tower", `${G}
      <path d="M8 35.5V14.5H15V35.5M8 14.5L11.5 3.5L15 14.5M15 35.5V23.5M15 23.5L18 20.5H33.5L35.5 23.5V35.5"/>
      <path class="cty-soft" d="M10.5 18V21.5M12.5 18V21.5M10.5 26V29M12.5 26V29M19.5 32V26.5M23.5 32V26.5M27.5 32V26.5M31.5 32V26.5M11.5 10V12"/>`],
    Gloucester: ["Gloucester Cathedral tower", `${G}
      <path d="M4 35.5V25.5M36 35.5V25.5M3 25.5L5.5 22.5H34.5L37 25.5M15 22.5V9.5H25V22.5M15 9.5V5M25 9.5V5M18.3 9.5V6.5M21.7 9.5V6.5"/>
      <path class="cty-soft" d="M15 9.5H25M17.8 20V13M20 20V13M22.2 20V13M8 32V28.5M11 32V28.5M29 32V28.5M32 32V28.5"/>`],
    Northampton: ["A New England meeting house", `${G}
      <path d="M7 35.5V24L17 18.5M23 18.5L33 24V35.5M17 35.5V14.5H23V35.5M17.5 14.5V10.5H22.5V14.5M17.5 10.5L20 2.5L22.5 10.5"/>
      <path d="M18.5 35.5V31.4Q20 29.8 21.5 31.4V35.5"/><path class="cty-soft" d="M10.5 32V27.5M13.5 32V27.5M26.5 32V27.5M29.5 32V27.5M19.2 13V11.8Q20 11 20.8 11.8V13M20 25V27.5"/>`],
    Liverpool: ["The Royal Liver Building", `${G}
      <path d="M6 35.5V17.5H34V35.5M8 17.5V9.5H14V17.5M26 17.5V9.5H32V17.5M8.5 9.5Q11 5.5 13.5 9.5M26.5 9.5Q29 5.5 31.5 9.5"/>
      <circle cx="11" cy="13.4" r="1.6"/><circle cx="29" cy="13.4" r="1.6"/><path d="M11 6.6V5M10 4.4Q11 3.5 12 4.4M29 6.6V5M28 4.4Q29 3.5 30 4.4"/>
      <path class="cty-soft" d="M17 21V32M20 21V32M23 21V32M8.5 21V32M31.5 21V32"/>`],
    Amsterdam: ["Canal houses on the water", `
      <path d="M5 32.5V19H6.2V17H7.6V15H10.4V17H11.8V19H13M13 32.5V16Q14.6 15 15 12.5H18Q18.4 15 20 16V32.5M20 32.5V18H21.5V13.5H25.5V18H27V32.5M21.5 13.5L23.5 11.5L25.5 13.5M27 32.5V20L31 13.5L35 20V32.5M4 32.5H36"/>
      <path class="cty-soft" d="M7.6 22V24M10.4 22V24M7.6 27V29M10.4 27V29M15.3 19.5V21.5M17.7 19.5V21.5M15.3 25V27M17.7 25V27M22.3 21V23M24.7 21V23M22.3 26V28M24.7 26V28M29.5 22V24M32.5 22V24M29.5 27V29M32.5 27V29"/>
      <path class="cty-faint" d="M5 36Q7.5 34.8 10 36T15 36T20 36T25 36T30 36T35 36"/>`],
    "Grand Rapids": ["A bridge over the Grand River", `
      <path d="M3 22.5H37M6.5 22.5L10.5 15.5H29.5L33.5 22.5M10.5 15.5L14.3 22.5L18.1 15.5L21.9 22.5L25.7 15.5L29.5 22.5M12 22.5V29.5M28 22.5V29.5"/>
      <path class="cty-soft" d="M14.3 22.5V15.5M18.1 22.5V15.5M21.9 22.5V15.5M25.7 22.5V15.5"/>
      <path class="cty-faint" d="M4 31.5Q7 30.3 10 31.5T16 31.5T22 31.5T28 31.5T34 31.5M8 35Q11 33.8 14 35T20 35T26 35T32 35"/>`],
    Allegheny: ["The Allegheny Observatory", `${G}
      <path d="M6 35.5V24.5H34V35.5M5 24.5H35M12.5 24.5V20.5H27.5V24.5M13.5 20.5Q13.5 11 20 11Q26.5 11 26.5 20.5"/>
      <path d="M19 11.3L21.5 11.4L22.2 20.5M19 11.3L18.6 20.5"/><path class="cty-soft" d="M9.5 28V32M13 28V32M27 28V32M30.5 28V32M18.5 35.5V30.5H21.5V35.5M20 11V8.5"/>`],
  };
  // Any town without its own drawing still gets a quiet one (a church among roofs), so the card never looks broken.
  const FALLBACK = ["", `${G}<path d="M6 35.5V24L11 20L16 24V35.5M16 35.5V17H24V35.5M16 17L20 9L24 17M20 9V5.5M18.6 6.8H21.4M24 35.5V25.5L29 21.5L34 25.5V35.5"/>`];
  const landmarkOf = (name) => {
    if (LANDMARKS[name]) return LANDMARKS[name];
    console.warn(`Teachers · cities: no landmark drawing for "${name}"; using the general town drawing`);
    return FALLBACK;
  };
  const landmarkSvg = (name, size, cls) =>
    `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${landmarkOf(name)[1]}</svg>`;

  // ── Place maths (copied from Their world's geo.js): projections fitted to the pre-projected map views ────────────
  const mercator = (lon, lat) => [lon, Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2))];
  function fitView(name) {
    const pts = Object.entries(AUTHORS.views[name].places).map(([key, xy]) => {
      const [id, index] = key.split("#");
      const place = personById(id).places[+index];
      return [mercator(place[2], place[1]), xy];
    });
    const line = (a, b) => {
      const n = a.length, ma = a.reduce((s, v) => s + v, 0) / n, mb = b.reduce((s, v) => s + v, 0) / n;
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); den += (a[i] - ma) ** 2; }
      return [num / den, mb - (num / den) * ma];
    };
    const [kx, bx] = line(pts.map((p) => p[0][0]), pts.map((p) => p[1][0]));
    const [ky, by] = line(pts.map((p) => p[0][1]), pts.map((p) => p[1][1]));
    return (lon, lat) => { const [x, y] = mercator(lon, lat); return [kx * x + bx, ky * y + by]; };
  }

  // A person's stays: each place from the year they arrived to the next arrival (or the end of their life). When the
  // birthplace is unknown, the first place is only the earliest known one, counted from the year they arrived there.
  const knowsBirthplace = (person) => person.birthplaceKnown !== false;
  const staysOf = (person) => person.places.map((place, i) => ({
    name: place[0], lat: place[1], lon: place[2], index: i, birth: i === 0 && knowsBirthplace(person),
    from: i === 0 && knowsBirthplace(person) ? person.born : place[3],
    to: i + 1 < person.places.length ? person.places[i + 1][3] : lifeEnd(person),
    cameFrom: i === 0 ? null : person.places[i - 1][0],
  }));

  // Towns where two or more teachers lived, with each teacher's stay there (counted once per town).
  function sharedCities() {
    const byName = new Map();
    for (const person of AUTHORS.people) {
      for (const stay of staysOf(person)) {
        if (!byName.has(stay.name)) byName.set(stay.name, { name: stay.name, lat: stay.lat, lon: stay.lon, stays: [] });
        const city = byName.get(stay.name);
        const mine = city.stays.find((s) => s.person === person);
        if (mine) { mine.to = Math.max(mine.to, stay.to); mine.returned = true; continue; }
        city.stays.push({ person, ...stay, bornHere: stay.birth });
      }
    }
    return [...byName.values()].filter((c) => c.stays.length >= 2).map((c) => {
      c.stays.sort((a, b) => a.from - b.from);
      c.first = c.stays[0].from;
      c.last = Math.max(...c.stays.map((s) => s.to));
      c.view = AUTHORS.views.europe.places[`${c.stays[0].person.id}#${c.stays[0].index}`] ? "europe" : "america";
      return c;
    }).sort((a, b) => b.stays.length - a.stays.length || a.first - b.first);
  }

  // ── The section ────────────────────────────────────────────────────────────────────────────────────────────────
  function mount(root) {
    const cities = sharedCities();
    const project = { europe: fitView("europe"), america: fitView("america") };
    const state = { city: null, view: null, box: null, anim: 0, seen: false };

    const card = (c, i) => `
      <button type="button" class="cty-card" data-city="${i}" aria-pressed="false" aria-label="${esc(c.name)}, ${count(c.stays.length)}">
        <span class="cty-card-top">${landmarkSvg(c.name, 38, "cty-ico")}<span class="cty-card-years">${yearsLabel(c)}</span></span>
        <span class="cty-card-name">${esc(c.name)}</span>
        <span class="cty-card-count"><b>${c.stays.length}</b> teachers</span>
        <span class="cty-card-dots">${c.stays.map((s) => `<i style="--dot: var(${tone(s.person)})"></i>`).join("")}</span>
      </button>`;

    root.style.setProperty("--tone", "var(--poetry)");
    root.innerHTML = `
      <header class="t-head"><span class="t-num">03</span><div>
        <p class="kicker">Places · where their paths met</p>
        <h2>Cities that <em>gathered them</em></h2>
        <p>${cities.length} towns where two or more of these teachers lived. Choose one and the map flies there, with a line from where each of them came.</p>
      </div></header>
      <div class="cty-rail" role="group" aria-label="Choose a city">${cities.map(card).join("")}</div>
      <div class="cty-body">
        <div class="cty-map">
          <svg class="cty-svg" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map of the chosen city"></svg>
          <p class="cty-caption"></p><p class="cty-offmap" hidden></p>
        </div>
        <div class="cty-panel">
          <div class="cty-panel-head"><span class="cty-panel-ico"></span><div>
            <p class="kicker cty-kicker"></p><h3 class="cty-title"></h3><p class="cty-landmark"></p></div></div>
          <p class="cty-note">Each bar is the years a teacher lived here; the line on the map shows where they came from.</p>
          <ol class="cty-stays"></ol>
        </div>
      </div>`;
    const q = (sel) => root.querySelector(sel);
    const el = { rail: q(".cty-rail"), svg: q(".cty-svg"), caption: q(".cty-caption"), offmap: q(".cty-offmap"), kicker: q(".cty-kicker"), title: q(".cty-title"),
      landmark: q(".cty-landmark"), ico: q(".cty-panel-ico"), stays: q(".cty-stays") };

    const landFor = (view) => `<rect x="-3000" y="-3000" width="7000" height="7000" class="cty-water"/><path class="cty-coast" d="${AUTHORS.views[view].land}"/>`;

    // Lines from where each teacher came from (when that place is on this map) into the city.
    function drawCity(c) {
      const proj = project[c.view], [cx, cy] = proj(c.lon, c.lat), v = AUTHORS.views[c.view];
      const pts = [[cx, cy]], lines = [], marks = [], labels = new Map(), offMap = new Set();
      c.stays.forEach((s, i) => {
        if (!s.cameFrom || s.bornHere) return;
        const prev = s.person.places[s.index - 1];
        const [x, y] = proj(prev[2], prev[1]);
        if (x < 0 || y < 0 || x > v.width || y > v.height) { offMap.add(prev[0]); return; }
        pts.push([x, y]);
        const mx = (x + cx) / 2, my = (y + cy) / 2, dx = cx - x, dy = cy - y, bend = 0.18;
        lines.push(`<path class="cty-came" data-i="${i}" style="--dot: var(${tone(s.person)})" d="M${x},${y} Q${mx - dy * bend},${my + dx * bend} ${cx},${cy}"/>`);
        marks.push(`<circle class="cty-from" data-i="${i}" style="--dot: var(${tone(s.person)})" cx="${x}" cy="${y}" r="3"/>`);
        if (!labels.has(prev[0])) labels.set(prev[0], [x, y]);
      });
      const labelSvg = [...labels].map(([name, [x, y]]) => `<text class="cty-lbl" x="${x}" y="${y}" data-dx="7" data-dy="-7">${esc(name)}</text>`).join("");
      el.svg.querySelector(".cty-overlay").innerHTML = `${lines.join("")}${marks.join("")}
        <circle class="cty-halo" cx="${cx}" cy="${cy}" r="14"/><circle class="cty-pin" cx="${cx}" cy="${cy}" r="5"/>
        <text class="cty-lbl cty-lbl-city" x="${cx}" y="${cy}" data-dx="11" data-dy="17">${esc(c.name)}</text>${labelSvg}`;
      el.offmap.hidden = !offMap.size;
      el.offmap.textContent = offMap.size ? `Also came from off this map: ${[...offMap].join(" · ")}` : "";
      const box = boxAround(pts, v);
      spreadLabels(box);
      return box;
    }

    // Labels that would overlap at the final zoom drop below their point, then to its left.
    function spreadLabels(box) {
      const unit = box.w / Math.max(1, el.svg.clientWidth), taken = [];
      el.svg.querySelectorAll(".cty-lbl").forEach((t) => {
        const x = +t.getAttribute("x") / unit, y = +t.getAttribute("y") / unit, w = t.textContent.length * (t.classList.contains("cty-lbl-city") ? 8.2 : 7.2);
        const boxAt = (dy) => [x + +t.dataset.dx, y + dy - 11, x + +t.dataset.dx + w, y + dy + 3];
        const hits = (b) => taken.some((o) => !(b[2] < o[0] || b[0] > o[2] || b[3] < o[1] || b[1] > o[3]));
        let b = boxAt(+t.dataset.dy);
        if (hits(b)) { t.dataset.dy = 16; b = boxAt(16); }
        if (hits(b)) { t.dataset.dx = -10 - w; t.dataset.dy = 4; b = boxAt(4); }
        taken.push(b);
      });
    }

    // A city with no lines on this map gets a wider frame, so there is coastline around it; the frame is kept inside
    // the map's drawn area where it fits (beyond it the outline stops in a straight edge).
    function boxAround(pts, view) {
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const least = pts.length > 1 ? 160 : 720;
      let w = Math.max(least, (x1 - x0) * 1.5), h = Math.max(least / ASPECT, (y1 - y0) * 1.6);
      if (w / h < ASPECT) w = h * ASPECT; else h = w / ASPECT;
      if (w > view.width) { w = view.width; h = w / ASPECT; }
      const fit = (start, size, limit) => (size <= limit ? Math.min(Math.max(start, 0), limit - size) : (limit - size) / 2);
      return { x: fit((x0 + x1) / 2 - w / 2, w, view.width), y: fit((y0 + y1) / 2 - h / 2, h, view.height), w, h };
    }

    // Keep pins and labels the same size on screen while the viewBox zooms.
    function applyBox(b) {
      el.svg.setAttribute("viewBox", `${b.x} ${b.y} ${b.w} ${b.h}`);
      const unit = b.w / Math.max(1, el.svg.clientWidth);
      el.svg.querySelectorAll(".cty-lbl").forEach((t) => {
        t.setAttribute("font-size", (t.classList.contains("cty-lbl-city") ? 13 : 12) * unit);
        t.setAttribute("dx", t.dataset.dx * unit); t.setAttribute("dy", t.dataset.dy * unit);
      });
      el.svg.querySelectorAll(".cty-from").forEach((n) => n.setAttribute("r", 3.5 * unit));
      const pin = el.svg.querySelector(".cty-pin"), halo = el.svg.querySelector(".cty-halo");
      if (pin) { pin.setAttribute("r", 5.5 * unit); halo.setAttribute("r", 14 * unit); }
    }

    function animateTo(target) {
      cancelAnimationFrame(state.anim);
      const from = state.box, start = performance.now();
      if (!from || reducedMotion()) { state.box = target; applyBox(target); return; }
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
        el.svg.innerHTML = `<g class="cty-base">${landFor(c.view)}</g><g class="cty-overlay"></g>`;
        state.box = { x: 0, y: 0, w: v.width, h: v.width / ASPECT }; // start wide, then glide in
        applyBox(state.box);
      }
      const target = drawCity(c);
      if (state.seen) animateTo(target); else { state.pending = target; applyBox(state.box); }
      el.caption.textContent = c.view === "europe" ? "Britain and western Europe" : "Eastern United States";
      el.kicker.textContent = `${count(c.stays.length)} · ${yearsLabel(c)}`;
      el.title.textContent = c.name;
      el.landmark.textContent = landmarkOf(c.name)[0];
      el.ico.innerHTML = landmarkSvg(c.name, 60, "cty-ico cty-ico-lg");
      renderStays(c);
    }

    function renderStays(c) {
      const span = Math.max(1, c.last - c.first);
      el.stays.innerHTML = c.stays.map((s, i) => {
        const left = ((s.from - c.first) / span) * 100, width = Math.max(1.5, ((s.to - s.from) / span) * 100);
        const how = s.bornHere ? "born here" : s.cameFrom ? `from ${esc(s.cameFrom)}` : "birthplace unknown";
        const until = s.to >= THIS_YEAR && !s.person.died ? "today" : s.to;
        return `<li><button type="button" data-i="${i}" style="--dot: var(${tone(s.person)})">
          <span class="cty-yr">${s.from}</span>
          <span class="cty-who"><i></i><b>${esc(s.person.name)}</b><small>${how} · until ${until}${s.returned ? " · returned later" : ""}</small></span>
          <span class="cty-bar"><span style="left:${left}%;width:${Math.min(width, 100 - left)}%"></span></span>
        </button></li>`;
      }).join("");
    }

    function highlight(i) {
      el.svg.querySelectorAll(".cty-came, .cty-from").forEach((n) => n.classList.toggle("is-lit", i !== null && +n.dataset.i === i));
      el.svg.classList.toggle("has-lit", i !== null);
    }

    el.rail.addEventListener("click", (e) => { const b = e.target.closest("[data-city]"); if (b) choose(+b.dataset.city); });
    el.stays.addEventListener("pointerover", (e) => { const b = e.target.closest("[data-i]"); highlight(b ? +b.dataset.i : null); });
    el.stays.addEventListener("pointerleave", () => highlight(null));
    el.stays.addEventListener("click", (e) => {
      const b = e.target.closest("[data-i]");
      if (b) window.Teachers?.openProfile?.(state.city.stays[+b.dataset.i].person.id);
    });
    new ResizeObserver(() => state.box && applyBox(state.box)).observe(el.svg);

    // The first glide waits until the map is actually on screen, so the reader sees it fly in.
    const reveal = () => { if (state.seen) return; state.seen = true; if (state.pending) { animateTo(state.pending); state.pending = null; } };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => { if (entries.some((x) => x.isIntersecting)) { io.disconnect(); reveal(); } }, { threshold: 0.35 });
      io.observe(el.svg);
    } else reveal();
    choose(0);
  }

  Sections.cities = { mount };
})();
