// C · 02 Where are they now? The approved "place cards + SVG atlas map": the cities that hold the manuscripts as dots on
// a map from Chicago to the Caucasus. The map opens zoomed out to show every city; scrolling over it zooms in and out
// around the pointer, dragging moves it, and two fingers pinch on touch (owner 2026-10-18: no bar). Choosing a city
// slides its panel in from the right; choosing a manuscript there opens its record over it. Beneath, the holders as
// cards, grouped by continent, in a four-row area that scrolls under the pointer and fades out at its foot.
(() => {
  const { byDate, sigla } = MSX;
  const P = MS.map;
  const proj = (lat, lon) => [(lon - P.lon0) * P.cos * P.k, (P.lat1 - lat) * P.k];
  const DRAG = 6; // pixels of movement before a press becomes a drag rather than a click
  const MAX_ZOOM = 14; // how far in, relative to the opening view
  const CHAR_W = 0.56, LABEL_PX = 13; // a name's width on screen is about its letters × CHAR_W × the font size
  const CONTINENTS = [["Europe", "Europe"], ["Near East", "The Near East and the Caucasus"], ["North America", "North America"]];
  const CONTINENT_OF = { Egypt: "Near East", Israel: "Near East", Syria: "Near East", Georgia: "Near East", Armenia: "Near East", "United States": "North America" };
  const continentOf = (country) => CONTINENT_OF[country] ?? "Europe";
  // Each continent has its own colour on the map, repeated as a key beside its name above the cards (owner 2026-10-18).
  const TONE = { Europe: "--prophets", "Near East": "--history", "North America": "--poetry" };

  // What kind of place keeps them, read from the holder's name (owner 2026-10-18: an icon for each kind). Checked in
  // order, so "Grottaferrata Abbey Library" is a monastery and "Berlin State Museums and Library" a museum; a name that
  // says library is a library even inside a university ("Cambridge University Library"); what is left is a university.
  const HOLDER_KINDS = [
    ["monastery", "Monastery", /monaster|abbey|saint catherine/i,
      '<path d="M10 9h4"/><path d="M12 7v5"/><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="M18 22V5.618a1 1 0 0 0-.553-.894l-4.553-2.277a2 2 0 0 0-1.788 0L6.553 4.724A1 1 0 0 0 6 5.618V22"/><path d="m18 7 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9.382a1 1 0 0 1 .553-.894L6 7"/>'],
    ["museum", "Museum", /museum|gallery|bodmer/i,
      '<path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2 20 7H4z"/>'],
    ["treasury", "Mosque treasury", /qubbat/i,
      '<path d="M4 21h16"/><path d="M6 21v-7a6 6 0 0 1 12 0v7"/><path d="M12 8V3"/><path d="M10 21v-4h4v4"/>'],
    ["library", "Library", /librar|bibliot|matenadaran|centre of manuscripts/i,
      '<rect width="8" height="18" x="3" y="3" rx="1"/><path d="M7 3v18"/><path d="M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z"/>'],
    ["university", "University", /./,
      '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>'],
  ];
  const holderKind = (name) => HOLDER_KINDS.find(([, , test]) => test.test(name));
  const holderIcon = (kind) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${kind[3]}</svg>`;

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
  const SIDE = { Oxford: "w", London: "e", Cambridge: "n", "Cambridge, Massachusetts": "e", "New Haven": "w", "New York": "s", Princeton: "w", "Washington, D.C.": "e" };
  const shortCity = (name) => name.replace(", North Carolina", ", N.C.").replace(", Massachusetts", ", Mass.");

  function mapHtml(cities) {
    const dots = cities.map((c) => {
      const [x, y] = proj(c.lat, c.lon);
      return `<g class="pl-city" style="--tone: var(${TONE[continentOf(c.country)]})" data-city="${esc(c.city)}" data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}" data-r="${(4 + Math.sqrt(c.n) * 1.5).toFixed(1)}" data-side="${SIDE[c.city] ?? "e"}" tabindex="0" role="button" aria-label="${esc(c.city)}: ${plural(c.n, "record")}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}"/><text>${esc(shortCity(c.city))}</text></g>`;
    }).join("");
    return `<div class="pl-mapview" tabindex="0" aria-label="Map of the cities that hold the manuscripts. Scroll or pinch to zoom, drag to move; plus and minus keys zoom, arrow keys move.">
        <svg class="pl-map" role="img" aria-label="Map from Chicago to the Caucasus">
          <g class="pl-land">${P.d.map((d) => `<path d="${d}"/>`).join("")}</g>
          <g class="pl-pulse" aria-hidden="true"></g>
          <g class="pl-dots">${dots}</g>
        </svg>
      </div>`;
  }

  function cardsHtml(cities) {
    const holders = [...MS.holders].sort((a, b) => b.n - a.n);
    const card = (h) => {
      const c = cities.find((x) => x.city === h.city), first = c.records.find((r) => r.h.includes(h.id));
      const kind = holderKind(h.name);
      return `<button type="button" role="listitem" class="pl-card" style="--tone: var(${TONE[continentOf(h.country)]})" data-city="${esc(h.city)}" data-holder="${h.id}" data-kind="${kind[0]}"><span class="pl-icon" title="${kind[1]}">${holderIcon(kind)}</span>
        <span class="pl-card-text"><b>${esc(h.name)}</b><small>${kind[1]} · ${esc(h.city)}, ${esc(h.country)}</small><small>Oldest here: ${esc(first ? `${first.n}${first.d ? `, ${first.d}` : ""}` : "–")}</small></span><em>${formatNumber(h.n)}</em></button>`;
    };
    const groups = CONTINENTS.map(([key, title]) => ({ key, title, list: holders.filter((h) => continentOf(h.country) === key) })).filter((g) => g.list.length)
      .sort((x, y) => x.list.length - y.list.length); // smallest first (owner 2026-10-18): Near East, North America, Europe
    return `<div class="pl-continents">${groups.map((g) => `<button type="button" data-continent="${g.key}" style="--tone: var(${TONE[g.key]})"><i></i>${esc(g.key)} <em>${g.list.length}</em></button>`).join("")}</div>
      <div class="pl-cardarea">${groups.map((g) => `<div class="pl-group" data-group="${g.key}"><p class="pl-group-head">${esc(g.title)}<span>${plural(g.list.length, "place")} · ${plural(g.list.reduce((s, h) => s + h.n, 0), "record")}</span></p>
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

  // Zoom and pan by rewriting the SVG's viewBox. The opening view fits every city with a margin; zooming never goes
  // further out than the whole map, nor further in than MAX_ZOOM times the opening view. Dots and names keep their size
  // on screen whatever the zoom (dots grow a little as you zoom in).
  function zooming(view, svg) {
    const cities = [...svg.querySelectorAll(".pl-city")];
    const xs = cities.map((g) => Number(g.dataset.x)), ys = cities.map((g) => Number(g.dataset.y));
    const box = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    let vb = null, fitWidth = 0;
    view.dragged = false;

    const aspect = () => view.clientWidth / Math.max(1, view.clientHeight);
    // The frame is as tall as the fitted land needs (so no empty page shows above or below it), within sensible limits.
    function sizeFrame() {
      const padX = (box.x1 - box.x0) * 0.08 + 30, padY = (box.y1 - box.y0) * 0.12 + 30;
      const landAspect = Math.min(P.w, box.x1 - box.x0 + 2 * padX) / Math.min(P.h, box.y1 - box.y0 + 2 * padY);
      view.style.height = `${Math.round(Math.max(view.clientWidth < 640 ? 220 : 320, Math.min(640, view.clientWidth / landAspect)))}px`;
    }
    function fit() {
      const padX = (box.x1 - box.x0) * 0.08 + 30, padY = (box.y1 - box.y0) * 0.12 + 30;
      // The margin never reaches past the map's own edges, where the land outline stops.
      let w = Math.min(P.w, box.x1 - box.x0 + 2 * padX), h = Math.min(P.h, box.y1 - box.y0 + 2 * padY);
      if (w / h < aspect()) w = h * aspect(); else h = w / aspect();
      fitWidth = w;
      return clampBox({ x: (box.x0 + box.x1) / 2 - w / 2, y: (box.y0 + box.y1) / 2 - h / 2, w, h });
    }
    function clampBox(b) {
      const maxW = Math.max(P.w, fitWidth || P.w), minW = (fitWidth || P.w) / MAX_ZOOM;
      const w = Math.min(maxW, Math.max(minW, b.w)), h = w / aspect();
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      const x = w >= P.w ? (P.w - w) / 2 : Math.min(P.w - w, Math.max(0, cx - w / 2));
      const y = h >= P.h ? (P.h - h) / 2 : Math.min(P.h - h, Math.max(0, cy - h / 2));
      return { x, y, w, h };
    }
    function apply() {
      svg.setAttribute("viewBox", `${vb.x.toFixed(2)} ${vb.y.toFixed(2)} ${vb.w.toFixed(2)} ${vb.h.toFixed(2)}`);
      const unit = vb.w / view.clientWidth, zoom = fitWidth / vb.w, grow = Math.min(1.8, zoom ** 0.25);
      svg.style.setProperty("--u", unit.toFixed(4));
      view.classList.toggle("is-zoomed", zoom > 1.02);
      const placed = []; // label boxes already placed, in map units
      // A label may sit over the dot of a smaller city (so London is named before Oxford), never over a bigger city's dot
      // or another label. Dots carry their rank; labels have none and always count.
      const hits = (a, rank) => placed.some((b) => (b.rank === undefined || b.rank < rank) && a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0);
      for (const [rank, g] of cities.entries()) { // biggest cities first: cityTable() sorts by record count
        const x = Number(g.dataset.x), y = Number(g.dataset.y), r = Number(g.dataset.r) * 0.62 * unit * grow;
        g.firstElementChild.setAttribute("r", r.toFixed(2));
        placed.push({ x0: x - r, x1: x + r, y0: y - r, y1: y + r, rank });
      }
      for (const [rank, g] of cities.entries()) {
        const x = Number(g.dataset.x), y = Number(g.dataset.y), r = Number(g.firstElementChild.getAttribute("r"));
        const text = g.lastElementChild, gap = r + 4 * unit, w = text.textContent.length * CHAR_W * LABEL_PX * unit, h = LABEL_PX * unit;
        const options = { e: [x + gap, y + 4 * unit, "start"], w: [x - gap, y + 4 * unit, "end"], s: [x, y + gap + 10 * unit, "middle"], n: [x, y - gap, "middle"] };
        const order = [g.dataset.side, "e", "w", "n", "s"].filter((s, i, all) => all.indexOf(s) === i);
        let chosen = null;
        for (const side of order) {
          const [tx, ty, anchor] = options[side];
          const x0 = anchor === "start" ? tx : anchor === "end" ? tx - w : tx - w / 2, rect = { x0, x1: x0 + w, y0: ty - h * 0.8, y1: ty + h * 0.25 };
          const inside = x0 >= vb.x && x0 + w <= vb.x + vb.w && rect.y0 >= vb.y && rect.y1 <= vb.y + vb.h;
          if (!hits(rect, rank) && inside) { chosen = { tx, ty, anchor, rect }; break; }
        }
        text.style.display = chosen ? "" : "none";
        if (!chosen) continue;
        placed.push(chosen.rect);
        text.setAttribute("x", chosen.tx.toFixed(2)); text.setAttribute("y", chosen.ty.toFixed(2)); text.setAttribute("text-anchor", chosen.anchor);
      }
      drawPulse();
    }
    // The chosen city radiates: two rings widening from its dot and fading, again and again, sized on screen.
    const pulseLayer = svg.querySelector(".pl-pulse");
    let pulsing = null;
    function drawPulse() {
      if (!pulsing) { pulseLayer.innerHTML = ""; return; }
      const g = cities.find((c) => c.dataset.city === pulsing);
      if (!g) { pulseLayer.innerHTML = ""; return; }
      const x = g.dataset.x, y = g.dataset.y, r0 = Number(g.firstElementChild.getAttribute("r")), unit = vb.w / view.clientWidth;
      const r1 = r0 + 30 * unit, width = (1.4 * unit).toFixed(3);
      pulseLayer.innerHTML = [0, 0.9].map((begin) => `<circle cx="${x}" cy="${y}" r="${r0.toFixed(2)}" stroke-width="${width}" style="stroke: var(--tone-pulse, var(--prophets))">
        <animate attributeName="r" values="${r0.toFixed(2)};${r1.toFixed(2)}" dur="1.8s" begin="${begin}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values=".75;0" dur="1.8s" begin="${begin}s" repeatCount="indefinite"/></circle>`).join("");
      pulseLayer.style.setProperty("--tone-pulse", g.style.getPropertyValue("--tone"));
    }
    // Glide towards a city: most of the way to centring it, not all, and a little closer in if the map is wide open.
    let glide = 0;
    function focusCity(name) {
      const g = cities.find((c) => c.dataset.city === name);
      if (!g) { console.error(`Where are they now: no dot for "${name}" to move to`); return; }
      pulsing = name;
      const from = { ...vb }, zoom = fitWidth / vb.w, w = zoom < 1.5 ? fitWidth / 1.5 : vb.w, h = w / aspect();
      const cx0 = vb.x + vb.w / 2, cy0 = vb.y + vb.h / 2, x = Number(g.dataset.x), y = Number(g.dataset.y);
      // The city panel covers the right of the screen on wide screens: aim for the middle of what is left uncovered.
      const box = view.getBoundingClientRect(), covered = innerWidth > 720 ? Math.max(0, box.right - (innerWidth - Math.min(440, innerWidth))) : 0;
      const unitTo = w / view.clientWidth, shift = (covered / 2) * unitTo;
      const to = clampBox({ x: cx0 + (x - cx0) * 0.8 - w / 2, y: cy0 + (y - cy0) * 0.8 - h / 2, w, h });
      // Past the land's eastern edge only by as much as the panel covers, so what shows is never empty map.
      if (covered) to.x = Math.min(to.x + shift * 2, Math.max(to.x, x - (w - covered * unitTo) / 2), P.w - w + covered * unitTo);
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches, start = performance.now(), ms = 700;
      cancelAnimationFrame(glide);
      const step = (now) => {
        const t = still ? 1 : Math.min(1, (now - start) / ms), k = 1 - (1 - t) ** 3;
        vb = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, w: from.w + (to.w - from.w) * k, h: from.h + (to.h - from.h) * k };
        apply();
        if (t < 1) glide = requestAnimationFrame(step);
      };
      glide = requestAnimationFrame(step);
    }
    function stopPulse() { pulsing = null; drawPulse(); }

    function zoomAt(factor, px, py) {
      const b = view.getBoundingClientRect(), fx = (px - b.left) / b.width, fy = (py - b.top) / b.height;
      const w = vb.w / factor, h = vb.h / factor;
      vb = clampBox({ x: vb.x + (vb.w - w) * fx, y: vb.y + (vb.h - h) * fy, w, h });
      apply();
    }
    function panBy(dxPx, dyPx) {
      const unit = vb.w / view.clientWidth;
      vb = clampBox({ ...vb, x: vb.x - dxPx * unit, y: vb.y - dyPx * unit });
      apply();
    }

    view.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAt(Math.exp(-delta * 0.0018), e.clientX, e.clientY);
    }, { passive: false });

    const pointers = new Map();
    let press = null, pinch = null;
    view.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) { press = { x: e.clientX, y: e.clientY, last: { x: e.clientX, y: e.clientY } }; view.dragged = false; }
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) };
        view.dragged = true;
      }
    });
    view.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size === 2) {
        const [a, b] = [...pointers.values()], dist = Math.hypot(a.x - b.x, a.y - b.y);
        zoomAt(dist / pinch.dist, (a.x + b.x) / 2, (a.y + b.y) / 2);
        pinch.dist = dist;
        return;
      }
      if (!press) return;
      if (!view.dragged && Math.hypot(e.clientX - press.x, e.clientY - press.y) < DRAG) return;
      if (!view.dragged) { view.dragged = true; view.setPointerCapture(e.pointerId); view.classList.add("is-dragging"); }
      panBy(e.clientX - press.last.x, e.clientY - press.last.y);
      press.last = { x: e.clientX, y: e.clientY };
    });
    const end = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (!pointers.size) { press = null; view.classList.remove("is-dragging"); }
    };
    view.addEventListener("pointerup", end);
    view.addEventListener("pointercancel", end);
    view.addEventListener("keydown", (e) => {
      const b = view.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2, step = view.clientWidth * 0.15;
      const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
      if (moves[e.key]) { e.preventDefault(); panBy(...moves[e.key]); }
      else if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomAt(1.4, cx, cy); }
      else if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomAt(1 / 1.4, cx, cy); }
      else if (e.key === "0") { e.preventDefault(); vb = fit(); apply(); }
    });

    let lastSize = "";
    new ResizeObserver(() => {
      const size = `${view.clientWidth}x${view.clientHeight}`;
      if (!view.clientWidth || size === lastSize) return;
      sizeFrame();
      lastSize = `${view.clientWidth}x${view.clientHeight}`;
      vb = fit();
      apply();
    }).observe(view);
    return { focusCity, stopPulse };
  }

  // The holder cards fade out at the foot of their area while there is more below, and end crisply at the bottom.
  function footFade(area) {
    const vp = area.querySelector(".os-viewport");
    if (!vp) { console.error("Where are they now: the card area has no scrolling viewport to fade"); return; }
    const update = () => area.classList.toggle("at-end", vp.scrollTop + vp.clientHeight >= vp.scrollHeight - 2);
    vp.addEventListener("scroll", update, { passive: true });
    new ResizeObserver(update).observe(vp);
    update();
  }

  function mount(section, { num }) {
    const cities = cityTable();
    const unplaced = MS.counts.withHolder - MS.counts.placed;
    section.innerHTML = `${head(num, "Where are they now?", `From Chicago to Sinai, <em>who keeps them</em>`,
      `${formatNumber(MS.counts.placed)} records name a holder this page can place, in ${cities.length} cities. Scroll on the map to zoom in and out, and drag to move it; choose a city or a card to see what is kept there, oldest first. ${formatNumber(unplaced)} more name a holder not yet placed; their records still show it.`)}
      <div class="pl-mapwrap">${mapHtml(cities)}</div>
      <div class="pl-holderwrap">${cardsHtml(cities)}</div>`;
    const view = section.querySelector(".pl-mapview");
    const map = zooming(view, section.querySelector(".pl-map"));
    const area = section.querySelector(".pl-cardarea");
    const scroller = OutsideScroll.wrap(area);
    footFade(area);
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
      map.focusCity(name);
      // Coming from a card below, bring the map into view so the move can be seen.
      if (from && !view.contains(from)) {
        const b = view.getBoundingClientRect(), shown = Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 64));
        if (shown < b.height * 0.65) view.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      requestAnimationFrame(() => panel.classList.add("open"));
    }
    function close() {
      panel.classList.remove("open");
      map.stopPulse();
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
