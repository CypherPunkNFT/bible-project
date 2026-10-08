// "Same year, different worlds": pick a year and see everyone who was alive then, gathered by the town they were
// living in. The slider sits on a small chart of how many of the 47 were alive in each year.
window.SameYear = (() => {
  const FIRST = 1504, LAST = THIS_YEAR, PRESETS = [1560, 1650, 1740, 1850, 1890, 1960];
  const aliveIn = (year) => R.people.filter((p) => year >= p.born && year <= lifeEnd(p));
  let year = 1650, yearEl, range, grid, summary, marker;
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
    return `<li><button type="button" data-id="${p.id}">${R.dot(p)}<span class="who">${R.esc(p.name)}</span><small>${when}</small>
      ${published.map((k) => `<em>${year}: ${R.esc(k.t)}</em>`).join("")}</button></li>`;
  }

  function update(animate) {
    const alive = aliveIn(year), groups = new Map();
    for (const p of alive) {
      const place = p.birthplaceKnown === false && year < p.places[0][3] ? "Place not recorded" : placeIn(p, year).name;
      if (!groups.has(place)) groups.set(place, []);
      groups.get(place).push(p);
    }
    const sorted = [...groups].sort((a, b) => b[1].length - a[1].length || a[1][0].born - b[1][0].born);
    const live = new Set(sorted.map(([place]) => place));
    for (const [place, el] of cards) if (!live.has(place)) { el.remove(); cards.delete(place); }
    sorted.forEach(([place, people], i) => {
      let el = cards.get(place);
      if (!el) {
        el = document.createElement("article");
        el.className = "sy-card";
        cards.set(place, el);
        if (animate && !R.reduced) el.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: Math.min(i, 12) * 25, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
      }
      el.style.order = String(i);
      el.innerHTML = `<header><h4>${R.esc(place)}</h4><span>${people.length}</span></header><ul>${people.map(row).join("")}</ul>`;
      grid.append(el);
    });
    const notYet = R.people.filter((p) => p.born > year).length, gone = R.people.filter((p) => p.died && p.died < year).length, now = year === THIS_YEAR;
    yearEl.textContent = year;
    range.value = year;
    marker.style.left = `${((year - FIRST) / (LAST - FIRST)) * 100}%`;
    summary.innerHTML = `<b>${alive.length}</b> of the 47 ${now ? "are" : "were"} alive, in <b>${groups.size}</b> ${groups.size === 1 ? "place" : "places"}. ${notYet} not yet born · ${gone} ${now ? "have" : "had"} died.`;
    grid.parentElement.querySelectorAll(".sy-presets button").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.year) === year)));
  }

  function mount(host) {
    const hist = histogram();
    host.innerHTML = `<div class="sy">
      <div class="sy-controls">
        <div class="sy-year"><button type="button" data-step="-10" aria-label="Ten years earlier">${icon("arrowLeft", 16)}</button>
          <output class="sy-big"></output><button type="button" data-step="10" aria-label="Ten years later">${icon("arrowRight", 16)}</button></div>
        <p class="sy-sum"></p>
        <div class="sy-hist">${hist.svg}<span class="sy-marker"></span>
          <input type="range" min="${FIRST}" max="${LAST}" step="1" aria-label="Year"></div>
        <div class="sy-axis"><span>${FIRST}</span><span>${LAST}</span></div>
        <p class="small-note">Shaded: how many of the 47 were alive in each year (at most ${hist.max}). Places are where each person was living that year.</p>
        <div class="sy-presets">${PRESETS.map((y) => `<button type="button" data-year="${y}" aria-pressed="false">${y}<small>${aliveIn(y).length}</small></button>`).join("")}</div>
      </div>
      <div class="sy-grid"></div></div>`;
    yearEl = host.querySelector(".sy-big");
    range = host.querySelector("input");
    grid = host.querySelector(".sy-grid");
    summary = host.querySelector(".sy-sum");
    marker = host.querySelector(".sy-marker");
    let raf = 0;
    range.addEventListener("input", () => {
      year = Number(range.value);
      raf ||= requestAnimationFrame(() => { raf = 0; update(false); });
    });
    host.addEventListener("click", (e) => {
      const step = e.target.closest("[data-step]"), preset = e.target.closest("[data-year]"), person = e.target.closest("[data-id]");
      if (step) { year = Math.max(FIRST, Math.min(LAST, year + Number(step.dataset.step))); update(true); }
      else if (preset) { year = Number(preset.dataset.year); update(true); }
      else if (person) R.open(person.dataset.id);
    });
    grid.addEventListener("pointerover", (e) => { const p = e.target.closest("[data-id]"); if (p) R.light(p.dataset.id); });
    grid.addEventListener("pointerleave", () => R.light(null));
    update(false);
  }

  return { mount };
})();
