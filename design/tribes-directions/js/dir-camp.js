// B · The camp. The tabernacle at the centre and the twelve tribes around it as Numbers 2 places them, each block
// a field of dots sized by its census (one dot for each thousand men, our rounding). A toggle moves between the
// census of Numbers 1 and of Numbers 26; "Break camp" plays the order of march of Numbers 10.
(() => {
  const S = 11, COLS = 10; // dot spacing and columns in a block
  const SIDE = { east: { x: 845, y: 470, dir: "v" }, west: { x: 155, y: 470, dir: "v" }, north: { x: 500, y: 120, dir: "h" }, south: { x: 500, y: 820, dir: "h" } };
  const dotsOf = (n) => (typeof n === "number" ? Math.round(n / 1000) : 0);
  const census = (id, which) => T.byId[id]?.census?.[which]?.n;

  // Where each tribe's block sits: its side from campLayout, its place along the side in its order (1, 2, 3).
  function layout() {
    const out = {};
    for (const s of T.campLayout?.sides ?? []) {
      const g = SIDE[s.side];
      s.tribes.forEach((id, i) => {
        const off = (i - 1) * (g.dir === "v" ? 172 : 150);
        out[id] = { side: s.side, i, standard: s.standard === id, x: g.dir === "v" ? g.x : g.x + off, y: g.dir === "v" ? g.y + off : g.y };
      });
    }
    return out;
  }
  // The march: every step of marchOrder in one file, read like a line of text (right to left, then the next row).
  function marchSlots() {
    const steps = T.marchOrder?.steps ?? [];
    const w = 1000 / Math.max(steps.length, 1);
    const per = Math.ceil(steps.length / 2);
    return steps.map((s, i) => ({ ...s, x: 1000 - 75 - (i % per) * (850 / Math.max(per - 1, 1)), y: i < per ? 300 : 650, w }));
  }

  function block(id, pos, maxDots) {
    const t = T.byId[id];
    const rows = Math.ceil(maxDots / COLS);
    const w = (COLS - 1) * S, h = (rows - 1) * S;
    let dots = "";
    for (let i = 0; i < maxDots; i++) dots += `<circle class="cp-dot" data-i="${i}" cx="${((i % COLS) * S - w / 2).toFixed(1)}" cy="${(Math.floor(i / COLS) * S - h / 2).toFixed(1)}" r="3.6"/>`;
    return `<g class="cp-unit cp-tribe ${pos.standard ? "is-standard" : ""}" data-tribe="${id}" data-x="${pos.x}" data-y="${pos.y}" transform="translate(${pos.x} ${pos.y})" style="--tone:${tone(id)}">
      <title>${esc(t?.name ?? id)}: ${fmt(t?.census?.first?.n)} (${esc(refText(t?.census?.first?.span))}), ${fmt(t?.census?.second?.n)} (${esc(refText(t?.census?.second?.span))})</title>
      <rect class="cp-pad" x="${-w / 2 - 14}" y="${-h / 2 - 14}" width="${w + 28}" height="${h + 28}" rx="14"/>
      <g class="cp-dots">${dots}</g>
      <text class="cp-name" y="${-h / 2 - 22}">${esc(t?.name ?? id)}${pos.standard ? " ⚑" : ""}</text>
      <text class="cp-n" y="${h / 2 + 32}"></text>
    </g>`;
  }

  window.CampMap = (host, { focus = null, compact = false } = {}) => {
    const L = layout(), ids = Object.keys(L);
    const maxDots = Math.max(1, ...ids.map((id) => Math.max(dotsOf(census(id, "first")), dotsOf(census(id, "second")))));
    const lev = T.campLayout?.levites ?? [];
    const levPos = { north: [500, 330], south: [500, 610], west: [330, 470], east: [670, 470] };
    const slots = marchSlots();
    host.classList.add("cp-host");
    host.innerHTML = `<svg class="cp" viewBox="0 0 1000 960" role="img" aria-label="The camp of Numbers 2: the tabernacle at the centre, three tribes on each side">
      <defs><radialGradient id="cp-glow"><stop offset="0" class="cp-g1"/><stop offset="1" class="cp-g2"/></radialGradient></defs>
      <circle cx="500" cy="470" r="470" fill="url(#cp-glow)"/>
      <g class="cp-compass"><text x="500" y="22">North</text><text x="500" y="950">South</text><text x="18" y="474" class="is-v">West</text><text x="982" y="474" class="is-v is-e">East</text></g>
      <g class="cp-lane"><rect x="4" y="215" width="992" height="170" rx="40"/><rect x="4" y="565" width="992" height="170" rx="40"/><text x="500" y="775">${T.marchOrder?.span ? `The order of march, first at the right · ${esc(refText(T.marchOrder.span))}` : ""}</text></g>
      <g class="cp-centre cp-unit" data-step="tabernacle">
        <rect class="cp-court" x="390" y="415" width="220" height="110" rx="6"/>
        <rect class="cp-tent" x="410" y="445" width="90" height="50" rx="3"/>
        <text class="cp-centre-label" x="500" y="540">The tabernacle</text>
      </g>
      ${lev.map((l) => `<g class="cp-lev cp-unit" data-lev="${esc(l.side)}" transform="translate(${levPos[l.side].join(" ")})"><text class="cp-lev-label">${esc(l.who)}</text></g>`).join("")}
      ${ids.map((id) => block(id, L[id], maxDots)).join("")}
    </svg>`;
    const svg = host.querySelector("svg");
    const units = Object.fromEntries([...svg.querySelectorAll(".cp-tribe")].map((g) => [g.dataset.tribe, g]));
    let which = 0; // 0 = Numbers 1, 1 = Numbers 26
    const kohath = [...svg.querySelectorAll(".cp-lev")].find((g) => /Kohath/i.test(g.textContent));
    const api = {
      svg, L,
      // p from 0 (Numbers 1) to 1 (Numbers 26): dots appear or go out one by one; the figure switches at the midpoint.
      census(p, grow = 1) {
        which = p;
        for (const [id, g] of Object.entries(units)) {
          const a = dotsOf(census(id, "first")), b = dotsOf(census(id, "second")), cur = (a + (b - a) * p) * grow;
          g.querySelectorAll(".cp-dot").forEach((d, i) => { const v = clamp01(cur - i); d.style.setProperty("--v", v.toFixed(3)); d.classList.toggle("is-lost", i >= b && i < a && p > 0); d.classList.toggle("is-gain", i >= a && i < b); });
          const n = census(id, p < .5 ? "first" : "second");
          g.querySelector(".cp-n").textContent = typeof n === "number" ? fmt(n) : "—";
        }
      },
      // p from 0 (encamped) to 1 (all in the line of march): each step leaves in turn.
      march(p) {
        const n = slots.length;
        slots.forEach((s, i) => {
          const f = easeInOut(clamp01(p * (n + 2) / 3 - i / 3 * 1)), k = f;
          let el, x0, y0;
          if (s.kind === "tribe") { el = units[s.what]; if (!el) return; x0 = Number(el.dataset.x); y0 = Number(el.dataset.y); }
          else if (/Gershon|tabernacle/i.test(s.what)) { el = svg.querySelector(".cp-centre"); x0 = 0; y0 = 0; }
          else { el = kohath; x0 = levPos[kohath?.dataset.lev]?.[0]; y0 = levPos[kohath?.dataset.lev]?.[1]; if (!el) return; }
          const isCentre = el.classList.contains("cp-centre");
          const tx = isCentre ? (s.x - 500) * k : x0 + (s.x - x0) * k, ty = isCentre ? (s.y - 470) * k : y0 + (s.y - y0) * k;
          const sc = 1 - (isCentre ? .5 : .28) * k;
          el.setAttribute("transform", isCentre ? `translate(${(500 * (1 - sc) + tx).toFixed(1)} ${(470 * (1 - sc) + ty).toFixed(1)}) scale(${sc.toFixed(3)})` : `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${sc.toFixed(3)})`);
          el.classList.toggle("is-marching", k > .02);
        });
        svg.querySelectorAll(".cp-lev").forEach((g) => { if (g !== kohath) g.classList.toggle("is-away", p > .05); });
        svg.classList.toggle("is-march", p > .001);
      },
      focus(id) { Object.entries(units).forEach(([k, g]) => { g.classList.toggle("is-focus", k === id); g.classList.toggle("is-dim", !!id && k !== id); }); svg.classList.toggle("is-levi", id === "levi"); },
      get which() { return which; },
    };
    api.census(0); api.focus(focus);
    return api;
  };

  // The control bar: the census toggle and Break camp.
  const controls = () => `<div class="cp-controls">
    <div class="cp-seg" role="group" aria-label="Which census"><button type="button" data-census="0" aria-pressed="true">Numbers 1</button><button type="button" data-census="1" aria-pressed="false">Numbers 26</button><i></i></div>
    <button type="button" class="cp-break">${icon("route", 16)}Break camp</button>
  </div>`;
  function wire(main, map, label) {
    let at = 0, marched = false;
    main.querySelectorAll("[data-census]").forEach((b) => b.addEventListener("click", () => {
      const to = Number(b.dataset.census);
      main.querySelectorAll("[data-census]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      main.querySelector(".cp-seg").dataset.on = String(to);
      if (marched) { map.march(0); marched = false; main.querySelector(".cp-break").classList.remove("is-on"); }
      const from = at;
      Clock.run({ label: `${label}: Numbers ${from ? 26 : 1} → Numbers ${to ? 26 : 1}`, duration: 2600, frame: (q) => { at = from + (to - from) * easeInOut(q); map.census(at); main.dataset.census = String(Math.round(at)); },
        moving: () => ["Dots going out and coming in, one for each thousand"] });
    }));
    main.querySelector(".cp-break")?.addEventListener("click", (e) => {
      marched = !marched;
      e.currentTarget.classList.toggle("is-on", marched);
      const steps = T.marchOrder?.steps ?? [];
      if (!marched) { Clock.run({ label: "Back into camp", duration: 1600, frame: (q) => map.march(1 - easeInOut(q)) }); return; }
      Clock.run({ label: "Break camp: the order of march (Numbers 10)", duration: 9000, frame: (q) => map.march(q),
        moving: (q) => { const i = Math.min(steps.length - 1, Math.floor(q * steps.length)); const s = steps[i]; return s ? [s.kind === "tribe" ? tribeName(s.what) : s.what] : []; } });
    });
  }

  function guide(main) {
    const sides = T.campLayout?.sides ?? [];
    main.innerHTML = `<section class="cp-stage wrap">
      ${topline(false)}
      <div class="cp-hero">
        <div class="cp-intro">
          <span class="kicker">${icon("tent", 14)}The twelve tribes · in the camp</span>
          <h1>Every man <em>by his own standard</em></h1>
          ${T.campLayout?.source ? `<p class="cp-lede">The tribes around the tabernacle as Numbers 2 places them: three on each side, the standard-bearer first. ${refLink(T.campLayout.source.span)}</p>` : pend("campLayout")}
          ${controls()}
          <div class="cp-totals">
            <div><small>Numbers 1</small><b>${fmt(T.censusTotals?.first?.n) || "—"}</b>${refLink(T.censusTotals?.first?.span)}</div>
            <div><small>Numbers 26</small><b>${fmt(T.censusTotals?.second?.n) || "—"}</b>${refLink(T.censusTotals?.second?.span)}</div>
          </div>
          <p class="cp-key"><i></i>One dot for each thousand men, rounded by us. The figure beside each block is Numbers' own.</p>
          ${T.campLayout?.note ? `<p class="cp-note">${icon("help", 14)}${esc(T.campLayout.note)} Here each side's three tribes are set in their order; where they sit along the side is our drawing.</p>` : ""}
        </div>
        <div class="cp-board glass"><div class="cp-map"></div></div>
      </div>
    </section>
    <section class="wrap cp-sides">
      <header class="sec-head"><div><h2>Four camps, four standards</h2><p>Each side's total and its words for the march, as Numbers gives them.</p></div></header>
      <div class="cp-side-grid">${sides.map((s) => `<article class="cp-side glass" style="--tone:${tone(s.standard)}">
        <span class="kicker">${esc(cap(s.side))} · ${esc(ordinal(s.marchRank))} to set out</span>
        <h3>The camp of ${esc(tribeName(s.standard))}</h3>
        <div class="cp-side-tribes">${s.tribes.map((id) => `<a href="#camp/${id}" style="--tone:${tone(id)}"><i></i><b>${esc(tribeName(id))}</b><span>${fmt(census(id, "first"))}</span><em>${fmt(census(id, "second"))}</em></a>`).join("")}</div>
        <p class="cp-side-total"><span>All the camp</span><b>${fmt(s.total?.n)}</b>${refLink(s.total?.span)}</p>
        ${quote(s.marchWords, "q-inline")}
      </article>`).join("")}</div>
      ${T.campLayout?.levites?.length ? `<article class="cp-levites glass"><span class="kicker">${icon("tent", 14)}In the midst: the Levites</span>${T.campLayout.centre ? quote(T.campLayout.centre, "q-inline") : ""}
        <div class="cp-lev-grid">${T.campLayout.levites.map((l) => `<div><small>${esc(cap(l.side))}</small><b>${esc(l.who)}</b>${quote(l, "q-inline")}</div>`).join("")}</div></article>` : ""}
    </section>`;
    const map = CampMap(main.querySelector(".cp-map"));
    wire(main, map, "The camp");
    map.svg.addEventListener("click", (e) => { const g = e.target.closest(".cp-tribe"); if (g) go(g.dataset.tribe); });
    // Opens by drawing the camp in, Numbers 1.
    Clock.run({ label: "The camp gathers (Numbers 2)", duration: 2200, frame: (q) => map.census(0, easeOut(q)), moving: () => ["The tribes taking their places, a dot at a time"] });
    return null;
  }

  // ── The tribe page ──
  function tribePage(main, id) {
    const t = T.byId[id];
    if (!t) { main.innerHTML = `<div class="wrap">${topline(true)}${picker(id)}${pendingTribe(id)}</div>`; return null; }
    const side = (T.campLayout?.sides ?? []).find((s) => s.tribes.includes(id));
    const steps = T.marchOrder?.steps ?? [], march = steps.findIndex((s) => s.what === id);
    const days = (T.lists ?? []).find((l) => l.id === "num7-offerings");
    const d = t.census?.change?.n;
    main.innerHTML = `<section class="wrap cp-t">
      ${topline(true)}
      <div class="cp-pick">${picker(id)}</div>
      <div class="cp-t-hero" style="--tone:${tone(id)}">
        <div class="cp-t-intro">
          <span class="kicker">${side ? `${esc(cap(side.side))} side · the camp of ${esc(tribeName(side.standard))}` : t.id === "levi" ? "In the midst of the camp" : "Not encamped as a tribe"}</span>
          <h1>${esc(t.name)}</h1>
          <div class="cp-t-census">
            <div><small>Numbers 1</small><b>${fmt(t.census?.first?.n) || "—"}</b>${refLink(t.census?.first?.span)}</div>
            <span class="cp-arrow">${icon("arrowRight", 20)}</span>
            <div><small>Numbers 26</small><b>${fmt(t.census?.second?.n) || "—"}</b>${refLink(t.census?.second?.span)}</div>
          </div>
          ${typeof d === "number" ? `<p class="cp-t-delta"><b class="${d < 0 ? "is-down" : "is-up"}">${signed(d)}</b> ${chip("ours")}</p>` : ""}
          ${t.census?.basis ? `<p class="cp-basis">Counted: ${esc(t.census.basis)}</p>` : ""}
          ${controls()}
        </div>
        <div class="cp-board glass"><div class="cp-map"></div></div>
      </div>
      <div class="cp-record">
        <div class="cp-rec glass" style="--tone:${tone(id)}"><small>Prince</small><b>${who(t.prince) || "—"}</b>${refLink(t.prince?.span)}</div>
        <div class="cp-rec glass" style="--tone:${tone(id)}"><small>Spy</small><b>${who(t.spy) || "—"}</b>${refLink(t.spy?.span)}</div>
        <div class="cp-rec glass" style="--tone:${tone(id)}"><small>Divider of the land</small><b>${who(t.divider) || "—"}</b>${refLink(t.divider?.span)}</div>
        <div class="cp-rec cp-rec-wide glass" style="--tone:${tone(id)}"><small>Twelve days of offering · Numbers 7</small>
          <div class="cp-days">${(days?.order ?? []).map((x, i) => `<a href="#camp/${x}" class="${x === id ? "is-me" : ""}" style="--tone:${tone(x)}" title="${esc(tribeName(x))}"><span>${i + 1}</span></a>`).join("")}</div>
          <p>${t.offeringDay?.day ? `The ${esc(t.offeringDay.dayWord)} day` : "No day"} ${refLink(t.offeringDay?.span)}</p></div>
        <div class="cp-rec cp-rec-wide glass" style="--tone:${tone(id)}"><small>Breaking camp · Numbers 10</small>
          <div class="cp-days cp-steps">${steps.map((s, i) => `<span class="${s.what === id ? "is-me" : ""} ${s.kind !== "tribe" ? "is-lev" : ""}" style="--tone:${s.kind === "tribe" ? tone(s.what) : "var(--muted)"}" title="${esc(s.kind === "tribe" ? tribeName(s.what) : s.what)}"><span>${i + 1}</span></span>`).join("")}</div>
          <p>${march >= 0 ? `Step ${march + 1} of ${steps.length}` : "Not in the order of march as a tribe"} ${march >= 0 ? refLink(steps[march].span) : ""}</p></div>
      </div>
      <div class="cp-bento" style="--tone:${tone(id)}">${["birth", "blessings", "land", "people", "story", "fate", "visions", "tradition"].map((k) => sec(k, t)).join("")}</div>
    </section>`;
    const map = CampMap(main.querySelector(".cp-map"), { focus: id, compact: false });
    wire(main, map, t.name);
    map.svg.addEventListener("click", (e) => { const g = e.target.closest(".cp-tribe"); if (g && g.dataset.tribe !== id) go(g.dataset.tribe); });
    const host = main.querySelector(".cp-sec-map");
    if (host) {
      const m = LandMap(host, { labels: false, tribes: [...new Set([...landTribes(), id])], townLabels: [id], outlines: true });
      m.focus(id);
      const fit = () => m.setView(m.fit(m.cons[id]?.box ?? landBox()));
      fit(); const ro = new ResizeObserver(fit); ro.observe(host);
      return () => { ro.disconnect(); m.destroy(); };
    }
    return null;
  }
  const sec = (key, t) => {
    const s = SECTIONS.find((x) => x.key === key);
    return `<section class="cp-sec cp-sec-${key} glass">
      <header class="sx-head"><span class="sx-ico">${icon(s.icon, 20)}</span><div><span class="sx-n">${String(s.n).padStart(2, "0")}</span><h3>${s.title}</h3><p>${s.sub}</p></div></header>
      ${SECTION(key, t, { limit: 8 })}${key === "land" ? `${landKey()}</section><section class="cp-sec cp-sec-landmap glass"><div class="cp-sec-map"></div>` : ""}</section>`;
  };

  DIRECTIONS.camp = { name: "The camp", swatch: "var(--t-reuben)", mount: (main, r) => (r.tribe ? tribePage(main, r.tribe) : guide(main)) };
})();
