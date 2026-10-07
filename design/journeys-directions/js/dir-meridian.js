// Meridian: a precise instrument. An isometric stack of map layers in the header, a command-list of people,
// and an app-like workspace: chapters in a sidebar, a graticule map with a live position readout and a scrubber
// with a tick per stop, and a panel with a progress ring.
(() => {
  const box = [GEO.project([29.6, 39.0]), GEO.project([36.9, 34.3])];
  const vb = `${box[0][0].toFixed(0)} ${box[0][1].toFixed(0)} ${(box[1][0] - box[0][0]).toFixed(0)} ${(box[1][1] - box[0][1]).toFixed(0)}`;
  const first = CHAPTERS.find((c) => c.id === "journey-1");
  const grid = () => {
    let d = "";
    for (let lon = 30; lon <= 37; lon++) { const [x] = GEO.project([lon, 0]); d += `M${x.toFixed(1)} 0V700`; }
    for (let lat = 34; lat <= 39; lat++) { const [, y] = GEO.project([0, lat]); d += `M0 ${y.toFixed(1)}H1000`; }
    return d;
  };
  const isoPlanes = () => {
    const route = `M${first.stops.map((s) => GEO.project(s.at).map((v) => v.toFixed(1)).join(" ")).join("L")}`;
    const dots = [...new Set(first.stops.map((s) => GEO.project(s.at).map((v) => v.toFixed(1)).join(",")))].map((k) => { const [x, y] = k.split(","); return `<circle cx="${x}" cy="${y}" r="3.2"/>`; }).join("");
    const svg = (cls, inner) => `<svg class="md-plane ${cls}" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${inner}</svg>`;
    return `<div class="md-iso" aria-hidden="true"><div class="md-stack">
      ${svg("md-p1", `<path class="md-p-grid" d="${grid()}"/>`)}
      ${svg("md-p2", `<g class="md-p-land">${GEO.landPaths().map(({ d }) => `<path d="${d}"/>`).join("")}</g>`)}
      ${svg("md-p3", `<path class="md-p-route" pathLength="1" d="${route}"/><g class="md-p-dots">${dots}</g>`)}
    </div><span class="md-iso-cap">Eastern Mediterranean · First journey</span></div>`;
  };

  const row = (p, i) => `<button type="button" class="md-row" data-j="person" data-person="${p.id}" aria-pressed="${JSTATE.person === p.id}" style="--tone: var(--${p.tone})">
      <span class="md-ico">${emblem(p.id, 30, 1.6)}</span><span class="md-row-t"><strong>${p.name}</strong><small>${p.sub}</small></span><kbd>${pad2(i + 1)}</kbd>${icon("arrowRight", 15)}</button>`;

  const side = (s) => `<nav class="md-side" aria-label="Chapters"><p class="md-label">Chapters</p>${CHAPTERS.map((c, i) => `<button type="button" data-j="chapter" data-i="${i}" aria-pressed="${i === s.chapter}">
      <i>${pad2(i + 1)}</i><span><b>${esc(c.title)}</b><small>${yearsOf(c)} · ${c.stops.length} stops</small></span><span class="md-sbar"><span ${i === s.chapter ? "data-progress" : ""}></span></span></button>`).join("")}</nav>`;

  const ticks = (ch) => `<div class="md-scrub"><span class="md-track"><span data-progress></span></span>${ch.stops.map((st, i) => `<button type="button" class="md-tick" data-j="stop" data-n="${i + 1}" data-stop="${i + 1}" style="--x: ${ch.stops.length > 1 ? i / (ch.stops.length - 1) : 0}" title="${esc(st.name)}" aria-label="${i + 1}. ${esc(st.name)}"></button>`).join("")}</div>`;

  const ring = () => `<span class="md-ring"><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19" class="md-ring-bg"/><circle cx="22" cy="22" r="19" class="md-ring-fg" data-progress pathLength="1"/></svg></span>`;

  const panel = (s, ch) => {
    const N = ch.stops.length;
    const top = `<div class="md-ptop">${ring()}<div><b data-count>1 of ${N}</b><span data-here></span></div></div>`;
    if (!s.stop) return `${top}<p class="kicker">${yearsOf(ch)}</p><h3>${esc(ch.title)}</h3><p class="md-sum">${esc(ch.summary)}</p>${ch.years ? `<p class="md-dating">${DATING}</p>` : ""}
      <ol class="md-list">${ch.stops.map((st, i) => `<li><button type="button" data-j="stop" data-n="${i + 1}" data-stop="${i + 1}"><i>${pad2(i + 1)}</i><span>${esc(st.name)}</span>${st.layer !== "scripture" ? layerBadge(st.layer) : ""}<em>${icon("check", 13, 2)}</em></button></li>`).join("")}</ol>${stepButtons("md-steps")}`;
    const st = ch.stops[s.stop - 1];
    const [lon, lat] = st.at;
    return `${top}<p class="kicker">${esc(ch.title)} · stop ${s.stop} of ${N}</p><h3 class="md-big">${esc(st.name)}</h3>${layerBadge(st.layer)}
      <p class="md-coord">${lat.toFixed(2)}° N · ${lon.toFixed(2)}° E</p>${stopWords(st)}${stepButtons("md-steps")}`;
  };

  const journey = (s) => {
    const p = personOf();
    const bar = `<div class="md-bar"><span class="md-ico md-ico-sm">${emblem(p.id, 22, 1.7)}</span><div><p class="md-label">Your journey</p><h2>${p.name}<span>${p.sub}</span></h2></div>${lensButtons("md-seg")}</div>`;
    if (p.id !== "paul") return `<div class="md-app" style="--tone: var(--${p.tone})">${bar}<div class="md-soon"><span class="md-ico md-ico-xl">${emblem(p.id, 64, 1.3)}</span><p>${PAGE.next}</p></div></div>`;
    const ch = CHAPTERS[s.chapter];
    return `<div class="md-app" style="--tone: var(--${p.tone})">${bar}
      <div class="md-body">${side(s)}
        <div class="md-center">
          <div class="md-map" data-map></div>
          <div class="md-hud"><div><span>Lat</span><b data-lat>—</b></div><div><span>Lon</span><b data-lon>—</b></div><div><span>Leg</span><b data-leg>—</b></div><div><span>Straight line</span><b data-km>—</b></div><div class="md-mode" data-mode>Overland</div></div>
          <div class="md-transport"><button type="button" data-j="toggle" class="md-play" aria-label="Play">${icon("play", 15)}</button><button type="button" data-j="replay" aria-label="Replay the journey" title="Replay">${icon("replay", 15)}</button><div data-ticks>${ticks(ch)}</div></div>
        </div>
        <aside class="md-panel" data-panel aria-live="polite">${panel(s, ch)}</aside>
      </div></div>${keyList("md-key")}`;
  };

  const hud = (root, lonlat, sea, legText, km) => {
    const set = (k, v) => { const e = root.querySelector(`[data-${k}]`); if (e) e.textContent = v; };
    set("lat", `${lonlat[1].toFixed(2)}° N`); set("lon", `${lonlat[0].toFixed(2)}° E`);
    if (legText) set("leg", legText);
    if (km != null) set("km", km ? `${Math.round(km)} km` : "—");
    const m = root.querySelector("[data-mode]");
    if (m) { m.textContent = sea ? "At sea" : "Overland"; m.classList.toggle("is-sea", sea); }
  };
  DIRECTIONS.meridian = {
    id: "meridian", name: "Meridian", swatch: "var(--poetry)",
    mapOptions: { className: "v-meridian", graticule: true, pad: 0.1, reserve: () => ({ top: matchMedia("(max-width: 767px)").matches ? 0.2 : 0.11 }) },
    render: (s) => `${atlasFrame()}
      <header class="md-hero"><div><p class="kicker">${PAGE.kicker}</p><h1>Follow a life.<br>See the story unfold.</h1><p>${PAGE.description}</p></div>${isoPlanes()}</header>
      <section class="md-choose"><div class="md-head"><h2>${PAGE.choose}</h2><span>Choose your starting point</span></div>
        <div class="md-rows" role="group" aria-label="${PAGE.choose}">${PEOPLE.map(row).join("")}</div></section>
      <section data-region="journey">${journey(s)}</section>`,
    journey, panel,
    onFrame: (root, info) => {
      const legs = CHAPTERS[JSTATE.chapter].stops.length - 1;
      hud(root, info.lonlat, info.sea, `${info.leg + 1} of ${legs}`, GEO.km(info.from.at, info.to.at));
    },
    onReach: (root, n, ch) => {
      const st = ch.stops[n - 1], prev = ch.stops[n - 2];
      hud(root, st.at, false, n > 1 ? `${n - 1} of ${ch.stops.length - 1}` : "—", prev ? GEO.km(prev.at, st.at) : 0);
    },
    onChapter: (root, s) => {
      root.querySelector("[data-ticks]").innerHTML = ticks(CHAPTERS[s.chapter]);
      root.querySelectorAll(".md-sbar > span").forEach((b, i) => { if (i === s.chapter) b.setAttribute("data-progress", ""); else { b.removeAttribute("data-progress"); b.style.setProperty("--p", 0); } });
    },
  };
})();
