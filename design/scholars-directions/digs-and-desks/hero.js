// 01 · The discoveries: the seven finds in date order beside a tall map of the Holy Land and Sinai. Choosing a find, or
// scrolling the list, flies the map to it. Ramsay's find lies outside that map, so an edge marker points to it and choosing
// it crossfades to the wider map.
(() => {
  const { S, byId, esc, years, tone, PROJ, pt, MapStage } = DD;
  const finds = [...S.finds].sort((a, b) => a.year - b.year);
  const inHoly = (f) => Boolean(pt("holyland", `find:${f.id}`));
  const outside = finds.filter((f) => !inHoly(f));
  const items = [{ overview: true }, ...finds];
  const SEAS = { holyland: [["Mediterranean Sea", 33.55, 32.35], ["Sinai", 33.75, 29.75]],
    med: [["Mediterranean Sea", 18.5, 35.2], ["Asia Minor", 33, 39.3], ["Black Sea", 34.5, 43.2]] };

  const chip = (s) => `<button type="button" class="dd-chip" data-sid="${s.id}" style="--tone:${tone(s)}"><i></i><span><b>${esc(s.name)}</b>
    <small>${esc(DD.faith(s))} · ${esc(DD.field(s))}</small></span>${icon("arrowRight", 14)}</button>`;

  function cardHtml(item, i) {
    if (item.overview) {
      const holyCount = finds.length - outside.length;
      return `<article class="dd-find dd-find-all" data-i="0"><button type="button" class="dd-find-hit" aria-label="Show all seven discoveries"></button>
        <div class="dd-find-top"><span class="dd-year">${finds[0].year}–${finds.at(-1).year}</span><span class="dd-where">All ${finds.length}</span></div>
        <h3>The ${finds.length} discoveries</h3>
        <p>From ${esc(byId[finds[0].by[0]].name)} at ${esc(finds[0].where[0])} in ${finds[0].year} to ${esc(byId[finds.at(-1).by[0]].name)} at ${esc(finds.at(-1).where[0])} in ${finds.at(-1).year}.
        ${holyCount} lie in the Holy Land and Sinai; ${outside.map((f) => `${esc(byId[f.by[0]].short)}'s lies beyond this map, at ${esc(f.where[0])}`).join("; ")}.</p>
        <p class="dd-find-hint">Scroll the list, or choose one.</p></article>`;
    }
    return `<article class="dd-find" data-i="${i}" style="--tone:var(--history)"><button type="button" class="dd-find-hit" aria-label="Show ${esc(item.name)} on the map"></button>
      <div class="dd-find-top"><span class="dd-year">${item.year}</span><span class="dd-where">${esc(item.where[0])}${inHoly(item) ? "" : ` <em>· beyond this map</em>`}</span></div>
      <h3>${esc(item.name)}</h3><p>${esc(item.line)}</p>
      <div class="dd-by"><span class="kicker">Found or studied by</span>${item.by.map((id) => chip(byId[id])).join("")}</div></article>`;
  }

  function railHtml() {
    const lo = 1830, hi = 1970, pos = (y) => ((y - lo) / (hi - lo)) * 100;
    return `<div class="dd-rail" aria-label="The discoveries by year"><span class="dd-rail-line"></span>
      ${finds.map((f, i) => `<button type="button" class="dd-rail-pt" data-i="${i + 1}" style="--p:${pos(f.year).toFixed(2)}" title="${f.year} · ${esc(f.name)}"><i></i></button>`).join("")}
      <span class="dd-rail-end" style="--p:${pos(finds[0].year).toFixed(2)}">${finds[0].year}</span><span class="dd-rail-end" style="--p:${pos(finds.at(-1).year).toFixed(2)}">${finds.at(-1).year}</span>
      <span class="dd-rail-now" style="--p:0"></span></div>`;
  }

  function addFindMarkers(stage, view) {
    // Desks: where a scholar in this view mainly worked (no click target; the list and the directory open them).
    const desks = {};
    for (const s of S.scholars) { const p = pt(view, s.id); if (p && view === "holyland") (desks[s.place[0]] ||= { p, names: [] }).names.push(s.short); }
    for (const [city, d] of Object.entries(desks)) {
      const el = document.createElement("div");
      el.className = "dd-mk dd-mk-desk";
      el.innerHTML = `<i class="dd-mk-sq"></i><span class="dd-lab"><b>${esc(city)}</b><small>${esc(d.names.join(", "))}</small></span>`;
      stage.add({ el, x: d.p[0], y: d.p[1], label: el.querySelector(".dd-lab"), priority: 4, labelLeft: city === "Jerusalem" || city === "Bethlehem" });
    }
    for (const f of finds) {
      const p = pt(view, `find:${f.id}`);
      if (!p) continue;
      const el = document.createElement("button");
      el.type = "button"; el.className = "dd-mk dd-mk-find"; el.dataset.find = f.id; el.setAttribute("aria-label", `${f.name}, ${f.year}`);
      el.innerHTML = `<i class="dd-mk-pulse"></i><i class="dd-mk-dot"></i><span class="dd-lab"><b>${esc(f.name)}</b><small>${f.year}</small></span>`;
      stage.add({ el, x: p[0], y: p[1], label: el.querySelector(".dd-lab"), priority: 10, find: f, labelLeft: f.id === "robinsons-arch" || f.id === "hazor" });
    }
    for (const [name, lon, lat] of SEAS[view]) {
      const [x, y] = PROJ[view].project(lon, lat), el = document.createElement("div");
      el.className = "dd-mk dd-mk-sea"; el.innerHTML = `<span class="dd-lab">${esc(name)}</span>`;
      stage.add({ el, x, y, label: el.firstElementChild, priority: 1, center: true });
    }
  }

  // Move a camera from one view's coordinates to the other's through longitude and latitude.
  function convertCam(from, to, cam) {
    const [lonA, latA] = PROJ[from].invert(cam.x - cam.w / 2, cam.y), [lonB] = PROJ[from].invert(cam.x + cam.w / 2, cam.y);
    const [lon, lat] = PROJ[from].invert(cam.x, cam.y), [x, y] = PROJ[to].project(lon, lat);
    return { x, y, w: Math.abs(PROJ[to].project(lonB, latA)[0] - PROJ[to].project(lonA, latA)[0]) };
  }

  DD.mountHero = (host) => {
    host.insertAdjacentHTML("beforeend", `<section class="dd-sec dd-hero" id="discoveries">
      <div class="dd-head"><p class="kicker">01 · The discoveries</p><h2>Seven discoveries, <em>${finds[0].year} to ${finds.at(-1).year}.</em></h2>
        <p>Choose a discovery, or scroll the list: the map flies to the place and shows who found or studied it. Round dots are the discoveries; small squares are where a scholar worked.</p></div>
      <div class="dd-disc">
        <div class="dd-list-wrap"><div class="dd-list">${items.map(cardHtml).join("")}<div class="dd-list-end"></div></div></div>
        <figure class="dd-mapcard">
          <div class="dd-tools"><div class="dd-seg" role="group" aria-label="Map"><button type="button" data-mode="holyland" aria-pressed="true">Holy Land &amp; Sinai</button><button type="button" data-mode="med" aria-pressed="false">Wider map</button></div>
            <p class="dd-now" aria-live="polite"></p></div>
          <div class="dd-stages"><button type="button" class="dd-edge"><span class="dd-edge-arrow">${icon("arrowRight", 15)}</span><span><b>${esc(outside[0].where[0])}</b><small>${esc(byId[outside[0].by[0]].short)} · ${outside[0].year}</small></span></button></div>
          ${railHtml()}
        </figure>
      </div></section>`);
    const sec = host.lastElementChild, list = sec.querySelector(".dd-list"), cards = [...list.querySelectorAll(".dd-find")];
    const stagesEl = sec.querySelector(".dd-stages"), edge = sec.querySelector(".dd-edge"), now = sec.querySelector(".dd-now");
    const stages = { holyland: new MapStage(stagesEl, "holyland", { minW: 90, cls: "dd-on-stage" }), med: new MapStage(stagesEl, "med", { minW: 120 }) };
    addFindMarkers(stages.holyland, "holyland");
    addFindMarkers(stages.med, "med");
    stagesEl.append(edge);
    let mode = "holyland", active = -1, programmatic = 0;

    const overviewCam = (m) => stages[m].fit(m === "holyland" ? Object.values(S.views.holyland.points) : finds.map((f) => pt("med", `find:${f.id}`)), 40, m === "med" ? 300 : 90);
    const findCam = (f, m) => { const p = pt(m, `find:${f.id}`); const w = m === "med" ? 300 : f.id === "sinaiticus" ? 340 : 250;
      // Sit the chosen place a little left of centre so its name, to the right, has room.
      return { x: p[0] + w * 0.14, y: p[1], w }; };

    // The off-map marker sits on the map's edge, on the line from the centre towards Asia Minor.
    stages.holyland.onRender = (st) => {
      if (mode !== "holyland") return;
      const [tx, ty] = PROJ.holyland.project(outside[0].where[2], outside[0].where[1]), [sx, sy] = st.toScreen(tx, ty);
      const cx = st.cw / 2, cy = st.ch / 2, dx = sx - cx, dy = sy - cy, ew = edge.offsetWidth / 2 + 14, eh = edge.offsetHeight / 2 + 14;
      const k = Math.min((cx - ew) / Math.abs(dx || 1e-6), (cy - eh) / Math.abs(dy || 1e-6));
      edge.style.transform = `translate3d(${(cx + dx * k - edge.offsetWidth / 2).toFixed(1)}px, ${(cy + dy * k - edge.offsetHeight / 2).toFixed(1)}px, 0)`;
      edge.querySelector(".dd-edge-arrow").style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    };

    function setMode(next, cam) {
      if (next !== mode) {
        stages[next].jump(convertCam(mode, next, stages[mode].cam));
        stages[mode].el.classList.remove("dd-on-stage");
        stages[next].el.classList.add("dd-on-stage");
        mode = next;
        edge.hidden = mode !== "holyland";
        sec.querySelectorAll(".dd-seg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
      }
      stages[mode].fly(cam);
    }

    function select(i, { scroll = false } = {}) {
      if (i === active) return;
      active = i;
      const f = items[i].overview ? null : items[i];
      cards.forEach((c, n) => c.classList.toggle("dd-on", n === i));
      for (const st of Object.values(stages)) for (const m of st.markers) {
        if (!m.find) continue;
        const on = f && m.find.id === f.id;
        m.el.classList.remove("dd-pulse");
        m.el.classList.toggle("dd-on", Boolean(on));
        m.priority = on ? 20 : 10;
        if (Boolean(on) !== Boolean(m.force)) m.lw = 0; // the chosen label is larger: measure it again
        m.force = Boolean(on);
        if (on) { void m.el.offsetWidth; m.el.classList.add("dd-pulse"); }
      }
      stagesEl.classList.toggle("dd-has-active", Boolean(f));
      sec.querySelectorAll(".dd-rail-pt").forEach((b) => b.classList.toggle("dd-on", Number(b.dataset.i) === i));
      const nowEl = sec.querySelector(".dd-rail-now");
      nowEl.textContent = f ? f.year : "";
      nowEl.style.setProperty("--p", f ? sec.querySelector(`.dd-rail-pt[data-i="${i}"]`).style.getPropertyValue("--p") : "0");
      nowEl.classList.toggle("dd-on", Boolean(f));
      now.textContent = f ? f.where[0] : `All ${finds.length} discoveries`;
      if (!f) setMode(mode === "med" ? "holyland" : mode, overviewCam("holyland"));
      else setMode(inHoly(f) ? "holyland" : "med", findCam(f, inHoly(f) ? "holyland" : "med"));
      if (scroll) scrollToCard(i);
    }

    const horizontal = () => getComputedStyle(list).flexDirection === "row";
    function scrollToCard(i) {
      programmatic = performance.now();
      const c = cards[i];
      if (horizontal()) list.scrollTo({ left: c.offsetLeft - list.clientWidth / 2 + c.offsetWidth / 2, behavior: DD.reduced() ? "auto" : "smooth" });
      else list.scrollTo({ top: c.offsetTop - 14, behavior: DD.reduced() ? "auto" : "smooth" });
    }
    // Scrolling the list makes the card under the reading line (a third of the way down, or the middle across) the active one.
    let pending = false;
    list.addEventListener("scroll", () => {
      if (pending || performance.now() - programmatic < 900) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const h = horizontal(), line = h ? list.scrollLeft + list.clientWidth / 2 : list.scrollTop + Math.min(140, list.clientHeight * 0.3);
        let best = 0;
        cards.forEach((c, n) => { const start = h ? c.offsetLeft : c.offsetTop; if (start <= line) best = n; });
        select(best);
      });
    }, { passive: true });
    const fitEnd = () => { const end = list.querySelector(".dd-list-end"), last = cards.at(-1); end.style.height = horizontal() ? "" : `${Math.max(0, list.clientHeight - last.offsetHeight - 40)}px`; };
    new ResizeObserver(fitEnd).observe(list);

    sec.addEventListener("click", (e) => {
      const person = e.target.closest(".dd-chip");
      if (person) { DD.openProfile(person.dataset.sid); return; }
      const card = e.target.closest(".dd-find"), marker = e.target.closest(".dd-mk-find"), rail = e.target.closest(".dd-rail-pt"), seg = e.target.closest(".dd-seg button");
      if (card) select(Number(card.dataset.i), { scroll: true });
      else if (marker) select(items.findIndex((it) => it.id === marker.dataset.find), { scroll: true });
      else if (rail) select(Number(rail.dataset.i), { scroll: true });
      else if (e.target.closest(".dd-edge")) select(items.indexOf(outside[0]), { scroll: true });
      else if (seg && seg.dataset.mode !== mode) setMode(seg.dataset.mode, overviewCam(seg.dataset.mode));
    });

    stages.holyland.jump(overviewCam("holyland"));
    stages.med.jump(overviewCam("med"));
    requestAnimationFrame(() => { select(0); fitEnd(); });
    DD.showFind = (id) => { sec.scrollIntoView({ behavior: DD.reduced() ? "auto" : "smooth", block: "start" }); select(items.findIndex((it) => it.id === id), { scroll: true }); };
  };
})();
