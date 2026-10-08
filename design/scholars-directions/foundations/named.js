// 02 · Where the site names them: scholars (rows) × site areas (columns), shaded by how often each is named in that
// area compared with the most-named scholar there. No counts are shown; the match is a rough text search.
Sections.named = (() => {
  const { D, AREAS, esc, weight, namedAreas, mono, reduced } = Sc;
  const named = D.scholars.filter((s) => namedAreas(s).length);
  const unnamed = D.scholars.filter((s) => !namedAreas(s).length);
  const SORTS = {
    era: (list) => [...list].sort((a, b) => a.born - b.born),
    wide: (list) => [...list].sort((a, b) => namedAreas(b).length - namedAreas(a).length
      || AREAS.reduce((t, [area]) => t + weight(b, area) - weight(a, area), 0) || a.born - b.born),
  };
  const headRow = `<div class="nm-hrow"><span></span>${AREAS.map(([a, t]) => `<span style="--tone: var(${t})">${esc(a)}</span>`).join("")}</div>`;

  const rowHtml = (s) => `<li data-id="${s.id}"><button type="button" class="nm-name" data-scholar="${s.id}">${mono(s)}<span>${esc(s.short)}</span></button>
    ${AREAS.map(([a, t]) => { const w = weight(s, a); return `<span class="nm-cell${w ? "" : " nm-none"}" data-area="${esc(a)}" style="--tone: var(${t}); --w: ${(14 + w * 78).toFixed(0)}%"></span>`; }).join("")}</li>`;

  function reorder(list, key) {
    const rows = new Map([...list.children].map((li) => [li.dataset.id, li]));
    const before = new Map([...rows].map(([id, li]) => [id, li.getBoundingClientRect()]));
    SORTS[key](named).forEach((s) => list.append(rows.get(s.id)));
    if (reduced()) return;
    for (const [id, li] of rows) {
      const a = before.get(id), b = li.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (!dx && !dy) continue;
      li.style.transition = "none";
      li.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    list.getBoundingClientRect();
    requestAnimationFrame(() => {
      for (const li of rows.values()) { li.style.transition = ""; li.style.transform = ""; }
    });
  }

  function wireTip(section) {
    const grid = section.querySelector(".nm-grid"), tip = section.querySelector(".nm-tip");
    let lastCell = null;
    grid.addEventListener("pointerover", (e) => {
      const cell = e.target.closest(".nm-cell");
      if (cell === lastCell) return;
      lastCell = cell;
      grid.querySelectorAll(".nm-hot").forEach((el) => el.classList.remove("nm-hot"));
      if (!cell) { tip.classList.remove("nm-tip-on"); return; }
      const li = cell.closest("li"), s = Sc.byId.get(li.dataset.id), area = cell.dataset.area;
      li.classList.add("nm-hot");
      grid.querySelectorAll(`.nm-hrow span:nth-child(${[...li.children].indexOf(cell) + 1})`).forEach((h) => h.classList.add("nm-hot"));
      const where = area === "Topics" ? "the Topics pages" : area === "Rulers" ? "the Rulers pages" : area === "People pages" ? "the People pages" : `the ${area}`;
      tip.innerHTML = `<b>${esc(s.name)}</b><span>${s.mentions[area] ? `Named in ${esc(where)}` : `Not named in ${esc(where)}`}</span>`;
      const g = grid.getBoundingClientRect(), c = cell.getBoundingClientRect();
      const x = Math.min(Math.max(c.left + c.width / 2 - g.left, 90), g.width - 90);
      tip.style.transform = `translate(${x}px, ${c.top - g.top - 8}px) translate(-50%, -100%)`;
      tip.classList.add("nm-tip-on");
    });
    grid.addEventListener("pointerleave", () => { lastCell = null; tip.classList.remove("nm-tip-on"); grid.querySelectorAll(".nm-hot").forEach((el) => el.classList.remove("nm-hot")); });
  }

  function mount(section) {
    section.innerHTML = `${Sc.head("02", "In the site's own pages", "Where the site <em>names them</em>",
      "Darker squares mean a scholar is named more often in that part of the site, compared with the other scholars. Point at a square to read it; click a name to meet them.")}
      <div class="nm-tools" role="group" aria-label="Sort the grid">
        <span>Sort</span><button type="button" data-sort="era" aria-pressed="true">By era</button><button type="button" data-sort="wide" aria-pressed="false">By how widely named</button>
      </div>
      <div class="nm-grid">
        <div class="nm-heads">${headRow}${headRow}</div>
        <ol class="nm-rows">${SORTS.era(named).map(rowHtml).join("")}</ol>
        <div class="nm-tip" aria-hidden="true"></div>
      </div>
      <p class="nm-unnamed"><span>Not named in the site's pages yet:</span> ${unnamed.map((s) => `<button type="button" data-scholar="${s.id}">${esc(s.short)}</button>`).join("")}</p>`;
    const list = section.querySelector(".nm-rows");
    section.querySelectorAll("[data-sort]").forEach((b) => b.addEventListener("click", () => {
      if (b.getAttribute("aria-pressed") === "true") return;
      section.querySelectorAll("[data-sort]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      reorder(list, b.dataset.sort);
    }));
    wireTip(section);
  }
  return { mount };
})();
