// 07 · "Same year, different worlds" (from D · Rearrange): pick a year and see every teacher who was alive then, gathered
// by the town they were living in. The slider sits on a small chart of how many of them were alive in each year.
window.Sections = window.Sections || {};
(() => {
  const people = AUTHORS.people;
  const FIRST = people[0].born, LAST = THIS_YEAR, PRESETS = [1560, 1650, 1740, 1850, 1890, 1960];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const tone = (person) => `var(${familyOf(person).tone})`;
  const aliveIn = (year) => people.filter((p) => year >= p.born && year <= lifeEnd(p));
  let year = 1650, yearEl, range, grid, summary, marker, host;
  const cards = new Map();

  function histogram() {
    const counts = [];
    for (let y = FIRST; y <= LAST; y++) counts.push(aliveIn(y).length);
    const max = Math.max(...counts), w = LAST - FIRST;
    const d = `M0 60${counts.map((c, i) => `L${i} ${(60 - (c / max) * 54).toFixed(1)}`).join("")}L${w} 60Z`;
    return { svg: `<svg viewBox="0 0 ${w} 60" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`, max };
  }

  function row(p) {
    const age = year - p.born, published = p.known.filter((k) => k.y === year);
    const when = age === 0 ? "born this year" : p.died === year ? "died this year" : `${p.circa ? "about " : "turns "}${age}`;
    return `<li><button type="button" data-id="${p.id}"><i class="yr-dot" style="--tone:${tone(p)}"></i><span class="yr-who">${esc(p.name)}</span><small>${when}</small>
      ${published.map((k) => `<em>${year}: ${esc(k.t)}</em>`).join("")}</button></li>`;
  }

  function update(animate) {
    const alive = aliveIn(year), groups = new Map();
    for (const p of alive) {
      // Someone whose birthplace is not recorded is never placed anywhere before their earliest known place.
      const place = p.birthplaceKnown === false && year < p.places[0][3] ? "Place not recorded" : placeIn(p, year).name;
      if (!groups.has(place)) groups.set(place, []);
      groups.get(place).push(p);
    }
    const sorted = [...groups].sort((a, b) => b[1].length - a[1].length || a[1][0].born - b[1][0].born);
    const live = new Set(sorted.map(([place]) => place));
    for (const [place, el] of cards) if (!live.has(place)) { el.remove(); cards.delete(place); }
    sorted.forEach(([place, group], i) => {
      let el = cards.get(place);
      if (!el) {
        el = document.createElement("article");
        el.className = "yr-card";
        cards.set(place, el);
        if (animate && !reduced) el.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: Math.min(i, 12) * 25, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
      }
      el.style.order = String(i);
      el.innerHTML = `<header><h4>${esc(place)}</h4><span>${group.length}</span></header><ul>${group.map(row).join("")}</ul>`;
      grid.append(el);
    });
    const notYet = people.filter((p) => p.born > year).length, gone = people.filter((p) => p.died && p.died < year).length, now = year === THIS_YEAR;
    yearEl.textContent = year;
    range.value = year;
    marker.style.left = `${((year - FIRST) / (LAST - FIRST)) * 100}%`;
    summary.innerHTML = `<b>${alive.length}</b> of the ${people.length} ${now ? "are" : "were"} alive, in <b>${groups.size}</b> ${groups.size === 1 ? "place" : "places"}. ${notYet} not yet born · ${gone} ${now ? "have" : "had"} died.`;
    host.querySelectorAll(".yr-presets button").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.year) === year)));
  }

  function mount(section) {
    host = section;
    section.style.setProperty("--tone", "var(--poetry)");
    const hist = histogram();
    section.innerHTML = `<header class="t-head"><span class="t-num">07</span><div><p class="kicker">Side by side</p>
        <h2>Same year, <em>different worlds</em></h2><p>Pick a year to see which teachers were alive and where each of them was living.</p></div></header>
      <div class="yr">
        <div class="yr-controls">
          <div class="yr-year"><button type="button" data-step="-10" aria-label="Ten years earlier">${icon("arrowLeft", 16)}</button>
            <output class="yr-big"></output><button type="button" data-step="10" aria-label="Ten years later">${icon("arrowRight", 16)}</button></div>
          <p class="yr-sum"></p>
          <div class="yr-hist">${hist.svg}<span class="yr-marker"></span>
            <input type="range" min="${FIRST}" max="${LAST}" step="1" aria-label="Year"></div>
          <div class="yr-axis"><span>${FIRST}</span><span>Today</span></div>
          <p class="yr-note">Shaded: how many of the ${people.length} were alive in each year (at most ${hist.max}). Places are where each person was living that year.</p>
          <div class="yr-presets">${PRESETS.map((y) => `<button type="button" data-year="${y}" aria-pressed="false">${y}<small>${aliveIn(y).length}</small></button>`).join("")}</div>
        </div>
        <div class="yr-grid"></div></div>`;
    yearEl = section.querySelector(".yr-big");
    range = section.querySelector(".yr-hist input");
    grid = section.querySelector(".yr-grid");
    summary = section.querySelector(".yr-sum");
    marker = section.querySelector(".yr-marker");
    let raf = 0;
    range.addEventListener("input", () => {
      year = Number(range.value);
      raf ||= requestAnimationFrame(() => { raf = 0; update(false); });
    });
    section.addEventListener("click", (e) => {
      const step = e.target.closest("[data-step]"), preset = e.target.closest("[data-year]"), person = e.target.closest("[data-id]");
      if (step) { year = Math.max(FIRST, Math.min(LAST, year + Number(step.dataset.step))); update(true); }
      else if (preset) { year = Number(preset.dataset.year); update(true); }
      else if (person) window.Teachers?.openProfile(person.dataset.id);
    });
    update(false);
  }

  Sections.sameyear = { mount };
})();
