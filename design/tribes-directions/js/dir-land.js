// A · The land. The guide is a full-screen map: every tribe a constellation of the towns Joshua gives it, and a
// history scrubber that runs the land through five moments (allotment → Dan moves north → the kingdom divided →
// the north carried away → Ezekiel's portions). A tribe page flies the map in to that tribe.
(() => {
  // The five moments. Spans are the chapters the brief names (Research/People/TRIBES.md); kingdom.span from the data
  // replaces the third when present.
  const eras = () => [
    { id: "allot", label: "Allotted", short: "Allotted", sub: "The towns Joshua gives each tribe", spans: [[6013001, 6019051]] },
    { id: "dan", label: "Dan moves north", short: "Dan", sub: "Men of Dan go out from Zorah and Eshtaol and take Laish, in the far north", spans: [[7018001, 7018031]] },
    { id: "divided", label: "The kingdom divided", short: "Divided", sub: "The north follows Jeroboam; Judah stays with Rehoboam", spans: T.kingdom?.span ? [T.kingdom.span] : [[11011029, 11012024]] },
    { id: "exile", label: "The north carried away", short: "Exile", sub: "Assyria takes the northern tribes", spans: [[12015029, 12015029], [12017001, 12017041]] },
    { id: "ezekiel", label: "Ezekiel's portions", short: "Ezekiel", sub: "The land in Ezekiel's vision: one portion per tribe, north to south. Ezekiel gives the order; the equal widths here are our drawing", spans: [[26048001, 26048035]] },
  ];
  const anchor = (name) => G.anchors.find((a) => a.name === name);
  const curve = (a, b, bend = .28) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1]; return [mx + dy * bend, my - dx * bend]; };
  const qAt = (a, c, b, t) => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];

  // The overlay for the moments: Dan's journey, the two kingdoms' names, the arrow to Assyria, Ezekiel's bands.
  function overlay(map, focusId = null) {
    const zorah = anchor("Zorah"), dan = anchor("Dan"), jer = anchor("Jerusalem"), sam = anchor("Samaria"), kad = anchor("Kadesh-barnea");
    const c = curve(zorah.xy, dan.xy, -.22);
    // Ezekiel: the order of the bands comes from tribes[].ezekiel.band (north = 1). The holy portion sits after Judah (Ezekiel 48:8).
    // Ezekiel's order, north to south, from the data's list "ezek48" (Ezekiel 48:1–27).
    const banded = (listById("ezek48")?.order ?? []).map((id) => ({ id, name: tribeName(id) }));
    const rows = [];
    banded.forEach((t) => { rows.push(t); if (t.id === "judah") rows.push({ id: "holy", name: "The holy portion" }); });
    const top = landBox()[1] + 6, bottom = kad.xy[1], east = project(35.62, 32)[0], west = project(33.85, 31)[0], h = (bottom - top) / Math.max(rows.length, 1);
    map.over.innerHTML = `
      <defs><clipPath id="land-clip"><path d="${G.land}"/></clipPath></defs>
      <g class="ln-bands" clip-path="url(#land-clip)">${rows.map((r, i) => `<g class="ln-band ${focusId && r.id === focusId ? "is-me" : ""} ${focusId && r.id !== focusId ? "is-other" : ""}" data-i="${i}" style="--tone:${r.id === "holy" ? "var(--accent)" : tone(r.id)}">
        <rect x="${west.toFixed(1)}" y="${(top + i * h).toFixed(1)}" width="${(east - west).toFixed(1)}" height="${h.toFixed(1)}" class="${r.id === "holy" ? "is-holy" : ""}"/></g>`).join("")}</g>
      <g class="ln-band-labels">${rows.map((r, i) => `<text class="ln-band-label ${focusId && r.id === focusId ? "is-me" : ""}" data-i="${i}" x="${(east - 14).toFixed(1)}" y="${(top + i * h + h / 2 + 4).toFixed(1)}" style="--tone:${r.id === "holy" ? "var(--accent)" : tone(r.id)}">${esc(r.name)}</text>`).join("")}</g>
      <path class="ln-dan-path" d="M${zorah.xy.join(",")}Q${c.join(",")} ${dan.xy.join(",")}" pathLength="1"/>
      <g class="ln-comet" style="--tone:${tone("dan")}"><circle class="ln-comet-halo"/><circle class="ln-comet-dot"/></g>
      <g class="ln-anchor ln-zorah cm-anchor" transform="translate(${zorah.xy.join(" ")})"><circle/><text>${esc(zorah.name)}</text></g>
      <g class="ln-anchor ln-dan cm-anchor" transform="translate(${dan.xy.join(" ")})"><circle/><text>${esc(dan.name)}</text></g>
      <g class="ln-anchor ln-kingdom is-north cm-anchor" transform="translate(${sam.xy.join(" ")})"><circle/><text>${esc(sam.name)} · Israel</text></g>
      <g class="ln-anchor ln-kingdom is-south cm-anchor" transform="translate(${jer.xy.join(" ")})"><circle/><text>${esc(jer.name)} · Judah</text></g>
      <g class="ln-assyria" transform="translate(${project(36.35, 33.0).join(" ")})"><path d="M-60,40 L0,0" /><path d="M-12,2 L0,0 L-3,12"/><text x="-4" y="-10">To Assyria</text></g>`;
    return { zorah, dan, c, rows, bands: [...map.over.querySelectorAll(".ln-band")], labels: [...map.over.querySelectorAll(".ln-band-label")], comet: map.over.querySelector(".ln-comet"), path: map.over.querySelector(".ln-dan-path") };
  }

  // One frame of the history at p (0..1): five equal moments.
  function frame(map, ov, p) {
    const svg = map.svg, k = Math.min(4, Math.floor(p * 5)), t = p * 5 - k;
    svg.dataset.era = String(k);
    const north = new Set(T.kingdom?.north ?? []), south = new Set(T.kingdom?.south ?? []);
    const groups = [...svg.querySelectorAll(".cm-tribe")];
    groups.forEach((g, i) => {
      const id = g.dataset.tribe;
      // Allotment: the constellations draw in one by one.
      const drawn = k > 0 ? 1 : clamp01(t * 1.6 - i / groups.length * .6);
      g.style.setProperty("--in", drawn.toFixed(3));
      g.classList.toggle("is-north", k >= 2 && k < 4 && north.has(id));
      g.classList.toggle("is-south", k >= 2 && k < 4 && south.has(id));
      g.classList.toggle("is-unclear", k >= 2 && k < 4 && !north.has(id) && !south.has(id) && !!T.kingdom);
      // The north carried away: its stars drift north-east and go out.
      const gone = k === 3 && north.has(id) ? easeInOut(t) : 0;
      g.setAttribute("transform", gone ? `translate(${(gone * 140).toFixed(1)} ${(-gone * 90).toFixed(1)})` : "");
      g.style.setProperty("--gone", gone.toFixed(3));
      g.classList.toggle("is-ghost", (k === 4) || (k === 3 && north.has(id) && t > .98));
      g.classList.toggle("is-left", k >= 1 && k < 4 && id === "dan");
    });
    // Dan: the comet travels from Zorah to Dan.
    const dt = k === 1 ? easeInOut(clamp01(t * 1.25)) : k > 1 && k < 4 ? 1 : 0;
    ov.path.style.strokeDashoffset = String(1 - dt);
    const pt = qAt(ov.zorah.xy, ov.c, ov.dan.xy, dt);
    ov.comet.setAttribute("transform", `translate(${pt[0].toFixed(1)} ${pt[1].toFixed(1)})`);
    // Ezekiel's bands, north to south.
    ov.bands.forEach((b, i) => { const f = k === 4 ? easeOut(clamp01(t * 1.5 - i / ov.bands.length * .5)) : 0; b.style.setProperty("--f", f.toFixed(3)); });
    ov.labels.forEach((l, i) => l.classList.toggle("is-on", k === 4 && t * 1.5 - i / ov.labels.length * .5 > .5));
  }
  const momentText = (e, i) => `<div class="ln-moment" data-era="${i}"><span class="ln-mn">${String(i + 1).padStart(2, "0")}</span><b>${esc(e.label)}</b><p>${esc(e.sub)}</p>${e.id === "divided" && T.kingdom ? `<p class="ln-kkey"><span><i style="--k:var(--north)"></i>With the north</span><span><i style="--k:var(--south)"></i>With Judah</span><span><i style="--k:var(--muted)"></i>Not clear</span></p>` : ""}${e.id === "divided" && T.kingdom?.northNote ? `<p class="ln-mnote">${esc(T.kingdom.northNote.split(/(?<=\.) /)[0])}</p>` : ""}<footer>${chip("scripture")}${refList(e.spans)}</footer></div>`;

  function guide(main) {
    const E = eras();
    main.innerHTML = `<section class="ln-stage">
      <div class="ln-map"></div>
      <aside class="ln-panel glass">
        <span class="kicker">${icon("map", 14)}The twelve tribes · in the land</span>
        <h1>The tribes as Joshua <em>sets them in the land</em></h1>
        <p class="ln-lede">Every star is a town Joshua gives a tribe, placed where the Atlas places it. The fine lines only join them; no border is drawn as fact.</p>
        <div class="ln-moment-host">${E.map(momentText).join("")}</div>
        <p class="ln-legend-cap">Towns placed on the map, by tribe <span class="tag-ours">(our count)</span></p>
        <div class="ln-legend">${tribeList().map((t) => `<a href="#land/${t.id}" class="ln-leg" style="--tone:${tone(t.id)}"><i></i><span>${esc(t.name)}</span><em>${T.byId[t.id] ? townsOf(T.byId[t.id]).length || "—" : "…"}</em></a>`).join("")}</div>
        <label class="ln-toggle"><input type="checkbox" id="ln-outlines"><span></span>Approximate outlines (dashed, drawn by us around each tribe's towns)</label>
        ${T.pending ? `<p class="ln-wait">${pend("data/tribes.json")}</p>` : ""}
      </aside>
      <div class="ln-scrub glass">
        <button type="button" class="ln-play" aria-label="Play the history">${icon("play", 16)}</button>
        <div class="ln-track"><i class="ln-fill"></i>${E.map((e, i) => `<button type="button" class="ln-stop" data-i="${i}" style="left:${(i / 4) * 100}%"><span>${esc(e.label)}</span><span class="ln-short">${esc(e.short)}</span></button>`).join("")}</div>
      </div>
    </section>
    <section class="wrap ln-below">
      <div class="ln-cards">${tribeList().map((t) => card(t.id)).join("")}</div>
    </section>`;
    const host = main.querySelector(".ln-map"), map = LandMap(host, { labels: true });
    const ov = overlay(map);
    const panel = main.querySelector(".ln-panel"), scrub = main.querySelector(".ln-scrub");
    const place = () => {
      const r = host.getBoundingClientRect(), pr = panel.getBoundingClientRect(), wide = r.width > 900;
      const region = wide ? { x: pr.right - r.left + 16, y: 16, w: r.width - (pr.right - r.left) - 32, h: r.height - 110 } : { x: 8, y: 8, w: r.width - 16, h: r.height - 90 };
      map.setView(map.fit(landBox(), region));
    };
    place();
    const ro = new ResizeObserver(place); ro.observe(host);
    let p = 0;
    const set = (v) => {
      p = v; frame(map, ov, v);
      const k = Math.min(4, Math.floor(v * 5 + 1e-6));
      main.querySelectorAll(".ln-moment").forEach((m) => m.classList.toggle("is-on", Number(m.dataset.era) === k));
      main.querySelectorAll(".ln-stop").forEach((s) => s.classList.toggle("is-past", Number(s.dataset.i) <= k));
      main.querySelector(".ln-fill").style.width = `${Math.min(1, v * 1.25) * 100}%`;
    };
    const play = (from = 0, to = 1) => Clock.run({ label: "The land through five moments", duration: 15000 * (to - from), frame: (q) => set(from + (to - from) * q),
      moving: (q) => { const v = from + (to - from) * q, k = Math.min(4, Math.floor(v * 5)); return [["The constellations drawing in", "Dan's journey north", "The two kingdoms", "The north drifting away", "Ezekiel's bands"][k]]; } });
    set(.2 - 1e-4);
    main.querySelector(".ln-play").addEventListener("click", () => play(0, 1));
    main.querySelector(".ln-track").addEventListener("click", (e) => {
      const b = e.target.closest(".ln-stop");
      const i = b ? Number(b.dataset.i) : Math.round(((e.clientX - e.currentTarget.getBoundingClientRect().left) / e.currentTarget.getBoundingClientRect().width) * 4);
      play(i / 5, (i + 1) / 5 - 1e-4);
    });
    main.querySelector("#ln-outlines").addEventListener("change", (e) => map.showOutlines(e.target.checked));
    map.svg.addEventListener("click", (e) => { const g = e.target.closest(".cm-tribe"); if (g) go(g.dataset.tribe); });
    map.svg.addEventListener("mouseover", (e) => { const g = e.target.closest(".cm-tribe"); map.focus(g?.dataset.tribe ?? null); });
    map.svg.addEventListener("mouseleave", () => map.focus(null));
    // Opens on the allotment, drawn in.
    requestAnimationFrame(() => play(0, .2 - 1e-4));
    return () => { ro.disconnect(); map.destroy(); };
  }

  // A tribe's card in the guide: its constellation as the bottom half of the card.
  function card(id) {
    const t = T.byId[id];
    if (!t) return `<a class="ln-card glass is-pending" href="#land/${id}" style="--tone:${tone(id)}"><div class="ln-card-top"><b>${esc(tribeName(id))}</b>${pend()}</div></a>`;
    const c = constellation(t);
    const box = c.box ? c.box : [G.w * .4, G.h * .4, 120, 120];
    const pad = Math.max(box[2], box[3]) * .25, vb = [box[0] - pad, box[1] - pad, box[2] + 2 * pad, box[3] + 2 * pad];
    return `<a class="ln-card glass" href="#land/${id}" style="--tone:${tone(id)}">
      <div class="ln-card-top"><span class="kicker">${t.son?.mother?.name ? `${esc(t.son.mother.name)}'s son` : ""}</span><b>${esc(t.name)}</b>
        <p>${c.towns.length ? `${c.towns.length} towns placed` : "No towns placed"}${typeof t.census?.first?.n === "number" ? ` · ${fmt(t.census.first.n)} in Numbers 1` : ""}</p></div>
      <svg class="ln-card-map" viewBox="${vb.map((v) => v.toFixed(1)).join(" ")}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path class="ln-card-land" d="${G.land}"/>${G.lakes.map((d) => `<path class="ln-card-lake" d="${d}"/>`).join("")}
        <path class="cm-outline" d="${c.outline}" vector-effect="non-scaling-stroke"/>
        <path class="cm-web" d="${c.edges.map(([a, b]) => `M${c.pts[a].join(",")}L${c.pts[b].join(",")}`).join("")}" vector-effect="non-scaling-stroke"/>
        ${c.pts.map((q) => `<circle class="ln-card-star" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${(Math.max(vb[2], vb[3]) / 110).toFixed(2)}"/>`).join("")}
      </svg></a>`;
  }

  // ── The tribe page ──
  function tribePage(main, id) {
    const t = T.byId[id];
    const E = eras();
    main.innerHTML = `<section class="ln-hero">
      <div class="ln-map ln-map-hero"></div>
      <div class="wrap ln-hero-inner">
        ${topline(true)}
        <div class="ln-hero-card glass" style="--tone:${tone(id)}">
          <span class="kicker">Tribe of Israel${t?.son?.order ? ` · ${esc(ordinal(t.son.order))} son of Jacob` : ""}${t?.son?.mother?.name ? `, by ${esc(t.son.mother.name)}` : ""}</span>
          <h1>${esc(tribeName(id))}</h1>
          ${t?.son?.nameQuote?.text ? quote(t.son.nameQuote, "q-hero") : t ? `<p>${pend("son.nameQuote")}</p>` : ""}
          <div class="ln-hero-stats">
            <div><b>${t ? townsOf(t).length : "…"}</b><span>towns on the map</span></div>
            <div><b>${typeof t?.census?.first?.n === "number" ? fmt(t.census.first.n) : "—"}</b><span>Numbers 1</span></div>
            <div><b>${typeof t?.census?.second?.n === "number" ? fmt(t.census.second.n) : "—"}</b><span>Numbers 26</span></div>
          </div>
        </div>
        ${t ? `<div class="ln-fate glass" style="--tone:${tone(id)}"><span class="kicker">${icon("hourglass", 13)}${esc(t.name)} through the five moments</span>
          <div class="ln-fate-row">${E.map((e, i) => `<button type="button" class="ln-fate-step" data-i="${i}"><span>${String(i + 1).padStart(2, "0")}</span><b>${esc(e.label)}</b><em>${esc(fateLine(t, e.id))}</em></button>`).join("")}</div></div>` : ""}
      </div>
    </section>
    <div class="wrap ln-pick-wrap">${picker(id)}</div>
    <div class="wrap ln-sections" style="--tone:${tone(id)}">${t ? sections(t) : pendingTribe(id)}</div>`;
    const host = main.querySelector(".ln-map-hero"), map = LandMap(host, { labels: true, tribes: [...new Set([...landTribes(), id])], townLabels: [id], outlines: true });
    const ov = overlay(map, id);
    map.focus(id);
    const card = main.querySelector(".ln-hero-card");
    const box = map.cons[id]?.box ?? landBox();
    const place = (fly) => {
      const r = host.getBoundingClientRect(), cr = card.getBoundingClientRect(), wide = r.width > 900;
      const region = wide ? { x: cr.right - r.left + 24, y: 70, w: r.width - (cr.right - r.left) - 48, h: r.height - 150 } : { x: 12, y: 12, w: r.width - 24, h: Math.max(160, cr.top - r.top - 24) };
      const v = map.fit(box, region);
      fly ? map.fly(v, 1300) : map.setView(v);
    };
    map.setView(map.fit(landBox()));
    requestAnimationFrame(() => place(true));
    const ro = new ResizeObserver(() => place(false)); ro.observe(host);
    frame(map, ov, .1999);
    // The five moments, replayed for this tribe on its own map.
    main.querySelectorAll(".ln-fate-step").forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.dataset.i);
      main.querySelectorAll(".ln-fate-step").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      map.fly(map.fit(i === 0 ? box : landBox(), { x: 0, y: 0, w: host.clientWidth, h: host.clientHeight }), 900);
      Clock.run({ label: `${tribeName(id)}: ${E[i].label}`, duration: 3200, frame: (q) => frame(map, ov, (i + q * .9999) / 5), moving: () => [E[i].label] });
    }));
    map.svg.addEventListener("click", (e) => { const g = e.target.closest(".cm-tribe"); if (g && g.dataset.tribe !== id) go(g.dataset.tribe); });
    return () => { ro.disconnect(); map.destroy(); };
  }

  // What the data says of this tribe at each moment (no claim beyond the data's own fields).
  function fateLine(t, era) {
    const north = T.kingdom?.north ?? [], south = T.kingdom?.south ?? [];
    if (era === "allot") return townsOf(t).length ? `${townsOf(t).length} towns placed` : "No towns placed";
    if (era === "dan") return t.id === "dan" ? "Moves to the far north" : "Stays";
    if (era === "divided") return north.includes(t.id) ? "With the north" : south.includes(t.id) ? "With Judah" : T.kingdom ? "In neither list" : "data pending";
    if (era === "exile") return north.includes(t.id) ? "Carried away" : T.kingdom ? "Not in the north's list" : "data pending";
    if (era === "ezekiel") { const b = placeIn(listById("ezek48"), t.id); return b ? `Band ${b} from the north` : listById("ezek48") ? "No band" : "data pending"; }
    return "";
  }

  function sections(t) {
    const sec = (key, extra = "") => { const s = SECTIONS.find((x) => x.key === key); return `<section class="ln-sec ln-sec-${key} glass" id="sec-${key}">
      <header class="sx-head"><span class="sx-ico">${icon(s.icon, 20)}</span><div><span class="sx-n">${String(s.n).padStart(2, "0")}</span><h3>${s.title}</h3><p>${s.sub}</p></div></header>${extra}${SECTION(key, t)}</section>`; };
    const landMap = `<div class="ln-sec-map"></div>`;
    return `<div class="ln-grid">${sec("birth")}${sec("numbers")}${sec("blessings")}${sec("camp")}</div>
      <div class="ln-land-card glass">${sec("land").replace('class="ln-sec ln-sec-land glass"', 'class="ln-sec ln-sec-land"').replace("</section>", `${landKey()}</section>`)}${landMap}</div>
      <div class="ln-grid">${sec("people")}${sec("story")}${sec("fate")}${sec("visions")}${sec("tradition")}</div>`;
  }

  DIRECTIONS.land = {
    name: "The land", swatch: "var(--t-judah)",
    mount(main, r) {
      if (!r.tribe) return guide(main);
      const off = tribePage(main, r.tribe);
      // The land section's own map: the bottom half of its card.
      const host = main.querySelector(".ln-sec-map");
      let m2 = null;
      if (host && T.byId[r.tribe]) {
        m2 = LandMap(host, { labels: false, tribes: [...new Set([...landTribes(), r.tribe])], townLabels: [r.tribe], outlines: true });
        m2.focus(r.tribe);
        const fit2 = () => m2.setView(m2.fit(m2.cons[r.tribe]?.box ?? landBox()));
        fit2(); const ro2 = new ResizeObserver(fit2); ro2.observe(host);
        return () => { off(); ro2.disconnect(); m2.destroy(); };
      }
      return off;
    },
  };
})();
