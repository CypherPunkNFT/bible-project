// 05 · Where the site names them (ported from A "Foundations"): scholars (rows) × site areas (columns), shaded by how
// often each is named in that area compared with the most-named scholar there. No counts are shown; the match is a
// rough text search. Two sort orders slide the rows into place; those never named are listed as chips underneath.
window.Sections = window.Sections || {};
(() => {
  const D = window.SCHOLARS;
  if (!D || !Array.isArray(D.scholars)) throw new Error("Where the site names them: window.SCHOLARS is missing (expected ../shared/scholars-data.js to load first)");
  const FIELD_TONE = { history: "--history", texts: "--prophets", places: "--poetry", reference: "--epistles", theology: "--gospels" };
  // Site areas in `mentions`, each with the tone used wherever that area is drawn.
  const AREAS = [["Letters study", "--epistles"], ["Apologetics", "--revelation"], ["Topics", "--poetry"], ["People pages", "--history"], ["Rulers", "--prophets"]];
  const byId = new Map(D.scholars.map((s) => [s.id, s]));
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const monogram = (s) => {
    const words = s.name.split(/ (?:of|the) /)[0].split(/\s+/).filter((w) => /^[A-Z]/.test(w));
    return words.length > 1 ? words[0][0] + words.at(-1)[0] : words[0][0];
  };
  const mono = (s) => `<span class="nmd-mono" style="--tone: var(${FIELD_TONE[s.field] || "--accent"})" aria-hidden="true">${esc(monogram(s))}</span>`;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Relative weight of each mention: the scholar's count against the most-named scholar in that area (0–1).
  const areaMax = Object.fromEntries(AREAS.map(([a]) => [a, Math.max(...D.scholars.map((s) => s.mentions[a] || 0))]));
  const weight = (s, area) => (s.mentions[area] ? s.mentions[area] / areaMax[area] : 0);
  const namedAreas = (s) => AREAS.map(([a]) => a).filter((a) => s.mentions[a]).sort((a, b) => weight(s, b) - weight(s, a));

  const named = D.scholars.filter((s) => namedAreas(s).length);
  const unnamed = D.scholars.filter((s) => !namedAreas(s).length);
  const SORTS = {
    era: (list) => [...list].sort((a, b) => a.born - b.born),
    wide: (list) => [...list].sort((a, b) => namedAreas(b).length - namedAreas(a).length
      || AREAS.reduce((t, [area]) => t + weight(b, area) - weight(a, area), 0) || a.born - b.born),
  };
  const headRow = `<div class="nmd-hrow"><span></span>${AREAS.map(([a, t]) => `<span style="--tone: var(${t})">${esc(a)}</span>`).join("")}</div>`;

  const rowHtml = (s) => `<li data-id="${s.id}"><button type="button" class="nmd-name" data-scholar="${s.id}">${mono(s)}<span>${esc(s.short)}</span></button>
    ${AREAS.map(([a, t]) => { const w = weight(s, a); return `<span class="nmd-cell${w ? "" : " nmd-none"}" data-area="${esc(a)}" style="--tone: var(${t}); --w: ${(14 + w * 78).toFixed(0)}%"></span>`; }).join("")}</li>`;

  // Re-sorts the rows and slides each from where it was to where it lands (transforms only).
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
    const grid = section.querySelector(".nmd-grid"), tip = section.querySelector(".nmd-tip");
    let lastCell = null;
    const clear = () => grid.querySelectorAll(".nmd-hot").forEach((el) => el.classList.remove("nmd-hot"));
    grid.addEventListener("pointerover", (e) => {
      const cell = e.target.closest(".nmd-cell");
      if (cell === lastCell) return;
      lastCell = cell;
      clear();
      if (!cell) { tip.classList.remove("nmd-tip-on"); return; }
      const li = cell.closest("li"), s = byId.get(li.dataset.id), area = cell.dataset.area;
      li.classList.add("nmd-hot");
      grid.querySelectorAll(`.nmd-hrow span:nth-child(${[...li.children].indexOf(cell) + 1})`).forEach((h) => h.classList.add("nmd-hot"));
      const where = area === "Topics" ? "the Topics pages" : area === "Rulers" ? "the Rulers pages" : area === "People pages" ? "the People pages" : `the ${area}`;
      tip.innerHTML = `<b>${esc(s.name)}</b><span>${s.mentions[area] ? `Named in ${esc(where)}` : `Not named in ${esc(where)}`}</span>`;
      const g = grid.getBoundingClientRect(), c = cell.getBoundingClientRect();
      const x = Math.min(Math.max(c.left + c.width / 2 - g.left, 90), g.width - 90);
      tip.style.transform = `translate(${x}px, ${c.top - g.top - 8}px) translate(-50%, -100%)`;
      tip.classList.add("nmd-tip-on");
    });
    grid.addEventListener("pointerleave", () => { lastCell = null; tip.classList.remove("nmd-tip-on"); clear(); });
  }

  function mount(section) {
    section.innerHTML = `<header class="s-head"><p class="kicker"><span class="s-num">05</span>In the site's own pages</p>
        <h2>Where the site <em>names them</em></h2>
        <p>Darker squares mean a scholar is named more often in that part of the site, compared with the other scholars. Point at a square to read it; click a name to meet them.</p></header>
      <div class="nmd-tools" role="group" aria-label="Sort the grid">
        <span>Sort</span><button type="button" data-sort="era" aria-pressed="true">By era</button><button type="button" data-sort="wide" aria-pressed="false">By how widely named</button>
      </div>
      <div class="nmd-grid">
        <div class="nmd-heads">${headRow}${headRow}</div>
        <ol class="nmd-rows">${SORTS.era(named).map(rowHtml).join("")}</ol>
        <div class="nmd-tip" aria-hidden="true"></div>
      </div>
      <p class="nmd-unnamed"><span>Not named in the site's pages yet:</span> ${unnamed.map((s) => `<button type="button" data-scholar="${s.id}">${esc(s.short)}</button>`).join("")}</p>`;
    const list = section.querySelector(".nmd-rows");
    section.querySelectorAll("[data-sort]").forEach((b) => b.addEventListener("click", () => {
      if (b.getAttribute("aria-pressed") === "true") return;
      section.querySelectorAll("[data-sort]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      reorder(list, b.dataset.sort);
    }));
    section.addEventListener("click", (event) => {
      const hit = event.target.closest("[data-scholar]");
      if (hit) window.Scholars?.openProfile?.(hit.dataset.scholar, hit);
    });
    wireTip(section);
  }

  window.Sections.named = { mount };
})();
