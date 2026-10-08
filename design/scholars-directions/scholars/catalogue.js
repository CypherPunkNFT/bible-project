// 01 · The catalogue (ported from "The index"): a facet sidebar (search, used-on-this-site, field, era, faith, each
// with live counts), a sort control, a live count and 35 cards. Filtering re-orders cards with CSS `order` (no DOM
// moves) and animates them with FLIP: staying cards slide from their old place, leaving cards fade where they stood,
// arriving cards fade in. Clicking a card opens the shared profile, which grows out of it.
//
// Other sections:
//   window.Scholars.filterCatalogue({ field, era, faith, used, q }, { scroll = true })
//     REPLACES the catalogue's filters with the ones given (each of field / era / faith: one key, a list of keys, or
//     nothing; used: true / false; q: search text, cleared when not given), keeps the sort, then scrolls to #catalogue.
//   After every change the catalogue announces its state on window:
//     "scholars:filter" with detail { field: [], era: [], faith: [], used, q, sort, visible: [ids in shown order] }.
window.Sections = window.Sections || {};
window.Scholars = window.Scholars || {};
(() => {
  const S = window.SCHOLARS;
  const TONE = { history: "--history", texts: "--prophets", places: "--poetry", reference: "--epistles", theology: "--gospels" };
  const NOW = 2026;
  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const tone = (s) => `var(${TONE[s.field]})`;
  const years = (s) => (s.circa ? `c. ${s.born}–c. ${s.died}` : `${s.born}–${s.died}`);
  const surname = (s) => s.short.split(" ").at(-1);
  const weight = (s) => Object.values(s.mentions).reduce((a, n) => a + n, 0);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const eraParts = (key) => {
    const m = S.eras[key].match(/^(?:The )?(.+?) \((.+)\)$/);
    return m ? [m[1][0].toUpperCase() + m[1].slice(1), m[2]] : [S.eras[key], ""];
  };
  const initials = (s) => {
    const words = s.name.split(/ (?:of|the) /)[0].split(" ").filter((w) => !/^(von|van|de)$/i.test(w));
    return words.length === 1 ? words[0][0] : words[0][0] + words.at(-1)[0];
  };
  // One shape per field (48 × 48 box): circle, rounded square, hexagon, tall card, arch.
  const SHAPES = {
    history: (k) => `<circle cx="24" cy="24" r="${22 * k}"/>`,
    texts: (k) => { const r = 21 * k; return `<rect x="${24 - r}" y="${24 - r}" width="${2 * r}" height="${2 * r}" rx="${11 * k}"/>`; },
    places: (k) => `<path d="${[0, 1, 2, 3, 4, 5].map((i) => { const a = Math.PI / 3 * i - Math.PI / 2; return `${i ? "L" : "M"}${(24 + 23 * k * Math.cos(a)).toFixed(2)} ${(24 + 23 * k * Math.sin(a)).toFixed(2)}`; }).join("")}Z" stroke-linejoin="round"/>`,
    reference: (k) => `<rect x="${24 - 16 * k}" y="${24 - 22 * k}" width="${32 * k}" height="${44 * k}" rx="${7 * k}"/>`,
    theology: (k) => { const w = 19 * k, top = 24 - 21 * k, bot = 24 + 21 * k; return `<path d="M${24 - w} ${bot}V${top + w}A${w} ${w} 0 0 1 ${24 + w} ${top + w}V${bot}Z"/>`; },
  };
  const mark = (s, size) => {
    const t = tone(s), ini = initials(s);
    return `<svg class="cat-mark" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true">
      <g style="fill: color-mix(in srgb, ${t} 15%, var(--surface)); stroke: color-mix(in srgb, ${t} 50%, transparent)" stroke-width="1.1">${SHAPES[s.field](1)}</g>
      <g fill="none" style="stroke: color-mix(in srgb, ${t} 22%, transparent)" stroke-width=".8">${SHAPES[s.field](.82)}</g>
      <text x="24" y="25" text-anchor="middle" dominant-baseline="central" style="fill: ${t}; font: ${ini.length > 1 ? 500 : 400} ${ini.length > 1 ? 15.5 : 21}px var(--serif); letter-spacing: -.02em">${esc(ini)}</text></svg>`;
  };
  const shapeIcon = (field, size = 14) => `<svg width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true" style="fill: color-mix(in srgb, var(${TONE[field]}) 22%, transparent); stroke: var(${TONE[field]})" stroke-width="4">${SHAPES[field](.9)}</svg>`;
  const siteBadge = (s) => {
    if (!s.site) return "";
    return s.site.status === "in-use" ? `<span class="cat-badge cat-badge-used"><i></i>Used on this site</span>` : `<span class="cat-badge cat-badge-held">In the library</span>`;
  };
  const pct = (year) => `${(Math.max(0, Math.min(NOW, year)) / NOW * 100).toFixed(3)}%`;
  const lifeBar = (s) => `<div class="cat-lb" role="img" aria-label="Lived ${esc(years(s))}, shown on a line from year 0 to ${NOW}">
    <div class="cat-lb-track"><b style="left:${pct(s.born)}; width:max(4px, calc(${pct(s.died)} - ${pct(s.born)}))"></b></div></div>`;

  const FACETS = [["field", "Field", S.fields], ["era", "Era", S.eras], ["faith", "Faith", S.faiths]];
  const SORTS = [["year", "Year"], ["az", "A–Z"], ["named", "Most named"]];
  const state = { field: new Set(), era: new Set(), faith: new Set(), used: false, q: "", sort: "year" };
  let root, grid, cards = new Map(), visible = [];

  const haystack = new Map(S.scholars.map((s) => [s.id, [s.name, s.short, s.place[0], S.fields[s.field], S.faiths[s.faith], s.line, ...s.works.map((w) => w[0])].join(" ").toLowerCase()]));
  // Does s pass every filter, optionally ignoring one facet (for that facet's own counts)?
  const passes = (s, ignore) => {
    for (const [key] of FACETS) if (key !== ignore && state[key].size && !state[key].has(s[key])) return false;
    if (state.used && ignore !== "used" && s.site?.status !== "in-use") return false;
    if (state.q && !state.q.split(/\s+/).every((word) => haystack.get(s.id).includes(word))) return false;
    return true;
  };
  const sorted = (list) => {
    const by = { year: (a, b) => a.born - b.born, az: (a, b) => surname(a).localeCompare(surname(b)), named: (a, b) => weight(b) - weight(a) || a.born - b.born };
    return [...list].sort(by[state.sort]);
  };

  const optionIcon = (key, value) => key === "field" ? shapeIcon(value) : key === "era" ? `<i class="cat-era-ic cat-era-${value}"></i>` : `<i class="cat-faith-ic"></i>`;
  const optionLabel = (key, value, label) => {
    if (key !== "era") return esc(label);
    const [name, span] = eraParts(value);
    return `${esc(name)} <small>${esc(span)}</small>`;
  };
  const sidebar = () => `
    <aside class="cat-side" aria-label="Filter the scholars">
      <div class="cat-side-head"><span class="kicker">Filter</span><button type="button" class="cat-clear" hidden>Clear all</button></div>
      <label class="cat-search">${icon("search", 16)}<input type="search" placeholder="Name, place or work" aria-label="Search the scholars" autocomplete="off"></label>
      <button type="button" class="cat-used" role="switch" aria-checked="false"><span class="cat-sw"><i></i></span><span class="cat-used-l">Used on this site</span><em></em></button>
      ${FACETS.map(([key, title, labels]) => `<div class="cat-facet" data-facet="${key}"><h3>${title}</h3><div class="cat-opts">
        ${Object.entries(labels).map(([value, label]) => `<button type="button" class="cat-opt" data-facet="${key}" data-value="${value}" aria-pressed="false"${key === "field" ? ` style="--tone: var(${TONE[value]})"` : ""}>
          <span class="cat-opt-ic">${optionIcon(key, value)}</span><span class="cat-opt-l">${optionLabel(key, value, label)}</span><em></em></button>`).join("")}
      </div></div>`).join("")}
    </aside>`;
  const card = (s) => {
    const [title, year] = s.works[0];
    return `<article class="cat-card" data-id="${s.id}" style="--tone: ${tone(s)}">
      <div class="cat-card-top">${mark(s, 54)}${siteBadge(s)}</div>
      <h3 class="cat-card-name">${esc(s.name)}</h3>
      <p class="cat-card-meta"><span>${esc(years(s))}</span><span>${esc(s.place[0])}</span></p>
      <p class="cat-card-tags"><span class="cat-field">${esc(S.fields[s.field])}</span><span class="cat-faith">${esc(S.faiths[s.faith])}</span></p>
      <div class="cat-card-work"><span>Key work</span><b>${esc(title)}</b><em>${year}</em></div>
      ${lifeBar(s)}
      <button type="button" class="cat-card-hit" aria-label="Open the profile of ${esc(s.name)}"></button>
    </article>`;
  };

  function mount(section) {
    root = section;
    section.style.setProperty("--tone", "var(--accent)");
    section.innerHTML = `<header class="s-head"><p class="kicker"><span class="s-num">01</span>The catalogue</p>
        <h2>Every scholar, <em>one card each</em></h2>
        <p>Narrow by field, era or faith, or show only the ones this site uses. Click a card to open the full profile.</p></header>
      <div class="cat-layout">${sidebar()}
      <div class="cat-results">
        <div class="cat-bar"><p class="cat-count" aria-live="polite"><b>${S.scholars.length}</b> of ${S.scholars.length} scholars</p>
          <div class="cat-sort" role="radiogroup" aria-label="Sort by"><span class="cat-sort-l">Sort</span>${SORTS.map(([key, label]) => `<button type="button" role="radio" data-sort="${key}" aria-checked="${key === state.sort}">${label}</button>`).join("")}</div></div>
        <div class="cat-grid">${S.scholars.map(card).join("")}</div>
        <div class="cat-empty" hidden><p>No scholar matches all of these.</p><button type="button" class="cat-clear">Clear the filters</button></div>
      </div></div>`;
    grid = section.querySelector(".cat-grid");
    for (const el of grid.children) cards.set(el.dataset.id, el);
    section.addEventListener("click", onClick);
    let typing;
    section.querySelector(".cat-search input").addEventListener("input", (event) => {
      clearTimeout(typing);
      typing = setTimeout(() => { state.q = event.target.value.trim().toLowerCase(); update(); }, 140);
    });
    update(true);
  }

  function onClick(event) {
    const opt = event.target.closest(".cat-opt");
    if (opt) return toggle(opt.dataset.facet, opt.dataset.value);
    if (event.target.closest(".cat-used")) { state.used = !state.used; return update(); }
    const sort = event.target.closest("[data-sort]");
    if (sort) { state.sort = sort.dataset.sort; return update(); }
    if (event.target.closest(".cat-clear")) return clear();
    const hit = event.target.closest(".cat-card-hit");
    if (hit) window.Scholars.openProfile?.(hit.parentElement.dataset.id, hit.parentElement);
  }
  function toggle(facet, value) {
    const set = state[facet];
    if (set.has(value)) set.delete(value); else set.add(value);
    update();
  }
  function clear() {
    for (const [key] of FACETS) state[key].clear();
    state.used = false; state.q = "";
    root.querySelector(".cat-search input").value = "";
    update();
  }

  // Counts beside each option: how many would show if that option were added, given every other filter.
  function paintControls() {
    for (const btn of root.querySelectorAll(".cat-opt")) {
      const key = btn.dataset.facet, on = state[key].has(btn.dataset.value);
      const n = S.scholars.filter((s) => s[key] === btn.dataset.value && passes(s, key)).length;
      btn.setAttribute("aria-pressed", String(on));
      btn.querySelector("em").textContent = n;
      btn.classList.toggle("cat-opt-zero", !n && !on);
    }
    const used = root.querySelector(".cat-used");
    used.setAttribute("aria-checked", String(state.used));
    used.querySelector("em").textContent = S.scholars.filter((s) => s.site?.status === "in-use" && passes(s, "used")).length;
    for (const btn of root.querySelectorAll("[data-sort]")) btn.setAttribute("aria-checked", String(btn.dataset.sort === state.sort));
    const active = FACETS.some(([key]) => state[key].size) || state.used || state.q;
    root.querySelector(".cat-side .cat-clear").hidden = !active;
    root.querySelector(".cat-count").innerHTML = `<b>${visible.length}</b> of ${S.scholars.length} scholars`;
    root.querySelector(".cat-empty").hidden = visible.length > 0;
  }

  // A leaving card is lifted out of the flow and fades where it stood; settle() puts it back, hidden.
  const settle = (el) => {
    el.hidden = true;
    el.classList.remove("cat-leaving");
    Object.assign(el.style, { position: "", left: "", top: "", width: "", height: "" });
  };
  let gridAnim;
  function update(first) {
    const animate = !first && !reduced();
    const before = new Map(), gridBox = grid.getBoundingClientRect();
    // Measure where every card is drawn right now (mid-animation included), then stop all running animations.
    if (animate) for (const [id, el] of cards) if (!el.hidden && !el.classList.contains("cat-leaving")) before.set(id, el.getBoundingClientRect());
    gridAnim?.cancel();
    for (const el of cards.values()) {
      el.getAnimations().forEach((a) => a.cancel());
      if (el.classList.contains("cat-leaving")) settle(el);
    }

    visible = sorted(S.scholars.filter((s) => passes(s))).map((s) => s.id);
    const shown = new Set(visible);
    visible.forEach((id, i) => { cards.get(id).style.order = i; });
    for (const [id, el] of cards) {
      if (shown.has(id)) { el.hidden = false; continue; }
      if (!animate || !before.has(id)) { el.hidden = true; continue; }
      const r = before.get(id);
      Object.assign(el.style, { position: "absolute", left: `${r.left - gridBox.left}px`, top: `${r.top - gridBox.top}px`, width: `${r.width}px`, height: `${r.height}px` });
      el.classList.add("cat-leaving");
      el.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.94)" }], { duration: 260, easing: "ease-out" }).onfinish = () => settle(el);
    }
    paintControls();
    if (animate) {
      const newHeight = grid.getBoundingClientRect().height;
      if (Math.abs(newHeight - gridBox.height) > 1) gridAnim = grid.animate([{ height: `${gridBox.height}px` }, { height: `${newHeight}px` }], { duration: 400, easing: "cubic-bezier(.2,.8,.2,1)" });
      visible.forEach((id, i) => {
        const el = cards.get(id), now = el.getBoundingClientRect(), was = before.get(id);
        if (was) {
          const dx = was.left - now.left, dy = was.top - now.top;
          if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" });
        } else {
          el.animate([{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "none" }], { duration: 380, delay: 90 + Math.min(i, 12) * 14, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" });
        }
      });
    }
    window.dispatchEvent(new CustomEvent("scholars:filter", { detail: {
      field: [...state.field], era: [...state.era], faith: [...state.faith], used: state.used, q: state.q, sort: state.sort, visible: [...visible],
    } }));
  }

  // Set the filters from another section (see the header comment), then bring the catalogue into view.
  const asList = (value, key) => {
    const list = value == null || value === "" ? [] : Array.isArray(value) ? value : [value];
    const labels = FACETS.find(([k]) => k === key)[2];
    const bad = list.filter((v) => !(v in labels));
    if (bad.length) console.error(`Scholars.filterCatalogue: unknown ${key} ${JSON.stringify(bad)} (expected one of ${Object.keys(labels).join(", ")})`);
    return list.filter((v) => v in labels);
  };
  window.Scholars.filterCatalogue = (filters = {}, { scroll = true } = {}) => {
    if (!root) { console.error("Scholars.filterCatalogue: the catalogue is not on the page (it failed to draw or has not mounted yet)"); return; }
    for (const [key] of FACETS) state[key] = new Set(asList(filters[key], key));
    state.used = Boolean(filters.used);
    state.q = String(filters.q || "").trim().toLowerCase();
    root.querySelector(".cat-search input").value = state.q;
    update();
    if (scroll) root.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  };

  Sections.catalogue = { mount };
})();
