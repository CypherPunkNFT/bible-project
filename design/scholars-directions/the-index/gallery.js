// The index · the catalogue: a facet sidebar (search, used-on-this-site, field, era, faith), a sort control, a live
// count and 35 cards. Filtering re-orders cards with CSS `order` (no DOM moves) and animates them with FLIP:
// staying cards slide from their old place, leaving cards fade where they stood, arriving cards fade in.
window.IX.gallery = (() => {
  const { S, esc, tone, years, surname, weight, keyWork, eraParts, mark, shapeIcon, siteBadge, faithPill, lifeBar, emit, reduced } = IX;
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

  const optionIcon = (key, value) => key === "field" ? shapeIcon(value) : key === "era" ? `<i class="ix-era-ic ix-era-${value}"></i>` : `<i class="ix-faith-ic"></i>`;
  const optionLabel = (key, value, label) => {
    if (key !== "era") return esc(label);
    const [name, span] = eraParts(value);
    return `${esc(name)} <small>${esc(span)}</small>`;
  };
  const sidebar = () => `
    <aside class="ix-side" aria-label="Filter the scholars">
      <div class="ix-side-head"><span class="kicker">Filter</span><button type="button" class="ix-clear" hidden>Clear all</button></div>
      <label class="ix-search">${icon("search", 16)}<input type="search" placeholder="Name, place or work" aria-label="Search the scholars" autocomplete="off"></label>
      <button type="button" class="ix-used" role="switch" aria-checked="false"><span class="ix-sw"><i></i></span><span class="ix-used-l">Used on this site</span><em></em></button>
      ${FACETS.map(([key, title, labels]) => `<div class="ix-facet" data-facet="${key}"><h3>${title}</h3><div class="ix-opts">
        ${Object.entries(labels).map(([value, label]) => `<button type="button" class="ix-opt" data-facet="${key}" data-value="${value}" aria-pressed="false"${key === "field" ? ` style="--tone: var(${IX.TONE[value]})"` : ""}>
          <span class="ix-opt-ic">${optionIcon(key, value)}</span><span class="ix-opt-l">${optionLabel(key, value, label)}</span><em></em></button>`).join("")}
      </div></div>`).join("")}
    </aside>`;
  const card = (s) => {
    const [title, year] = keyWork(s);
    return `<article class="ix-card" data-id="${s.id}" style="--tone: ${tone(s)}">
      <div class="ix-card-top">${mark(s, 54)}${siteBadge(s, true)}</div>
      <h3 class="ix-card-name">${esc(s.name)}</h3>
      <p class="ix-card-meta"><span>${esc(years(s))}</span><span>${esc(s.place[0])}</span></p>
      <p class="ix-card-tags"><span class="ix-field">${esc(S.fields[s.field])}</span>${faithPill(s)}</p>
      <div class="ix-card-work"><span>Key work</span><b>${esc(title)}</b><em>${year}</em></div>
      ${lifeBar(s)}
      <button type="button" class="ix-card-hit" aria-label="Open the profile of ${esc(s.name)}"></button>
    </article>`;
  };

  function mount(section) {
    root = section;
    section.innerHTML = `${sidebar()}
      <div class="ix-results">
        <div class="ix-bar"><p class="ix-count" aria-live="polite"><b>35</b> of ${S.scholars.length} scholars</p>
          <div class="ix-sort" role="radiogroup" aria-label="Sort by"><span class="ix-sort-l">Sort</span>${SORTS.map(([key, label]) => `<button type="button" role="radio" data-sort="${key}" aria-checked="${key === state.sort}">${label}</button>`).join("")}</div></div>
        <div class="ix-grid">${S.scholars.map(card).join("")}</div>
        <div class="ix-empty" hidden><p>No scholar matches all of these.</p><button type="button" class="ix-clear">Clear the filters</button></div>
      </div>`;
    grid = section.querySelector(".ix-grid");
    for (const el of grid.children) cards.set(el.dataset.id, el);
    section.addEventListener("click", onClick);
    let typing;
    section.querySelector(".ix-search input").addEventListener("input", (event) => {
      clearTimeout(typing);
      typing = setTimeout(() => { state.q = event.target.value.trim().toLowerCase(); update(); }, 140);
    });
    update(true);
  }

  function onClick(event) {
    const opt = event.target.closest(".ix-opt");
    if (opt) return toggle(opt.dataset.facet, opt.dataset.value);
    if (event.target.closest(".ix-used")) return setUsed(!state.used);
    const sort = event.target.closest("[data-sort]");
    if (sort) { state.sort = sort.dataset.sort; return update(); }
    if (event.target.closest(".ix-clear")) return clear();
    const hit = event.target.closest(".ix-card-hit");
    if (hit) emit("open", hit.parentElement.dataset.id, hit.parentElement, visible);
  }
  function toggle(facet, value) {
    const set = state[facet];
    if (set.has(value)) set.delete(value); else set.add(value);
    update();
  }
  function setUsed(on) { state.used = on; update(); }
  function clear() {
    for (const [key] of FACETS) state[key].clear();
    state.used = false; state.q = "";
    root.querySelector(".ix-search input").value = "";
    update();
  }

  // Counts beside each option: how many would show if that option were added, given every other filter.
  function paintControls() {
    for (const btn of root.querySelectorAll(".ix-opt")) {
      const key = btn.dataset.facet, on = state[key].has(btn.dataset.value);
      const n = S.scholars.filter((s) => s[key] === btn.dataset.value && passes(s, key)).length;
      btn.setAttribute("aria-pressed", String(on));
      btn.querySelector("em").textContent = n;
      btn.classList.toggle("ix-opt-zero", !n && !on);
    }
    const used = root.querySelector(".ix-used");
    used.setAttribute("aria-checked", String(state.used));
    used.querySelector("em").textContent = S.scholars.filter((s) => s.site?.status === "in-use" && passes(s, "used")).length;
    for (const btn of root.querySelectorAll("[data-sort]")) btn.setAttribute("aria-checked", String(btn.dataset.sort === state.sort));
    const active = FACETS.some(([key]) => state[key].size) || state.used || state.q;
    root.querySelector(".ix-side .ix-clear").hidden = !active;
    root.querySelector(".ix-count").innerHTML = `<b>${visible.length}</b> of ${S.scholars.length} scholars`;
    root.querySelector(".ix-empty").hidden = visible.length > 0;
  }

  // A leaving card is lifted out of the flow and fades where it stood; settle() puts it back, hidden.
  const settle = (el) => {
    el.hidden = true;
    el.classList.remove("ix-leaving");
    Object.assign(el.style, { position: "", left: "", top: "", width: "", height: "" });
  };
  let gridAnim;
  function update(first) {
    const animate = !first && !reduced();
    const before = new Map(), gridBox = grid.getBoundingClientRect();
    // Measure where every card is drawn right now (mid-animation included), then stop all running animations.
    if (animate) for (const [id, el] of cards) if (!el.hidden && !el.classList.contains("ix-leaving")) before.set(id, el.getBoundingClientRect());
    gridAnim?.cancel();
    for (const el of cards.values()) {
      el.getAnimations().forEach((a) => a.cancel());
      if (el.classList.contains("ix-leaving")) settle(el);
    }

    visible = sorted(S.scholars.filter((s) => passes(s))).map((s) => s.id);
    const shown = new Set(visible);
    visible.forEach((id, i) => { cards.get(id).style.order = i; });
    for (const [id, el] of cards) {
      if (shown.has(id)) { el.hidden = false; continue; }
      if (!animate || !before.has(id)) { el.hidden = true; continue; }
      const r = before.get(id);
      Object.assign(el.style, { position: "absolute", left: `${r.left - gridBox.left}px`, top: `${r.top - gridBox.top}px`, width: `${r.width}px`, height: `${r.height}px` });
      el.classList.add("ix-leaving");
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
    emit("filter", { ...state, visible });
  }

  // Bring the gallery into view (used when a chart elsewhere sets a filter).
  const reveal = () => root.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  return { mount, toggle, setUsed, clear, reveal, state, visibleIds: () => visible, cardFor: (id) => cards.get(id) };
})();
