// Two supporting sections: "Born here, served there" (a slope chart joining birth country to the country of the longest
// stay) and the closing directory of everyone, grouped by where they served longest.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  let el = {}, rows = [], hot = null;
  const CAPTION = "Each line is one person, from the country of their birth (left) to the country of their longest stay (right). People whose birthplace is unknown are left out. Point at a line or a country.";

  const regionRank = (r) => TW.REGION_ORDER.indexOf(r);
  function computeRows() {
    rows = AUTHORS.people.filter(TW.knowsBirthplace).map((p) => {
      const main = TW.mainStay(p);
      return { p, born: TW.regionOf(p.places[0][0]), served: TW.regionOf(main.name), main };
    });
  }

  function slopeHtml() {
    const moved = rows.filter((r) => r.born !== r.served).length;
    return `
      <div class="slope card-plain">
        <p class="slope-sum"><b>${moved}</b> of the ${rows.length} whose birthplace is known served longest outside the country where they were born.</p>
        <div class="slope-heads"><span>Born in</span><span>Served longest in</span></div>
        <div id="slope-box"></div>
        <p class="slope-cap" id="slope-cap">${CAPTION}</p>
      </div>`;
  }

  // Drawn at the box's real pixel width so the labels stay readable on a phone.
  function drawSlope() {
    const box = el.slopeBox, W = Math.max(300, box.clientWidth), narrow = W < 560;
    const labelW = narrow ? 122 : 170, xL = labelW, xR = W - labelW, rowH = narrow ? 8 : 9, gap = 12;
    const stack = (key, other) => {
      const groups = new Map();
      [...rows].sort((a, b) => regionRank(a[key]) - regionRank(b[key]) || regionRank(a[other]) - regionRank(b[other]) || a.p.born - b.p.born)
        .forEach((r) => { if (!groups.has(r[key])) groups.set(r[key], []); groups.get(r[key]).push(r); });
      let y = 6;
      const out = new Map();
      for (const [region, list] of groups) {
        out.set(region, { y, h: list.length * rowH, n: list.length });
        list.forEach((r, i) => { r[key + "Y"] = y + i * rowH + rowH / 2; });
        y += list.length * rowH + gap;
      }
      return { out, height: y };
    };
    const left = stack("born", "served"), right = stack("served", "born"), H = Math.max(left.height, right.height);
    const node = (side, region, g, x) => `<g class="node" data-side="${side}" data-region="${TW.esc(region)}">
        <rect x="${x - 3}" y="${g.y}" width="6" height="${g.h}" rx="3"/>
        <text x="${side === "born" ? x - (narrow ? 9 : 12) : x + (narrow ? 9 : 12)}" y="${g.y + g.h / 2}" text-anchor="${side === "born" ? "end" : "start"}">${TW.esc(region)}<tspan dx="${narrow ? 4 : 6}">${g.n}</tspan></text></g>`;
    const lines = rows.map((r, i) => {
      const mx = (xL + xR) / 2;
      return `<path class="line" data-i="${i}" style="--tone: var(${TW.tone(r.p)})" d="M${xL + 3},${r.bornY} C${mx},${r.bornY} ${mx},${r.servedY} ${xR - 3},${r.servedY}"/>`;
    }).join("");
    box.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="${NS}" role="img" aria-label="Lines from country of birth to country of longest stay">
      <g class="lines">${lines}</g>
      ${[...left.out].map(([r, g]) => node("born", r, g, xL)).join("")}${[...right.out].map(([r, g]) => node("served", r, g, xR)).join("")}</svg>`;
    if (hot) setHot(hot);
  }

  function setHot(h) {
    hot = h;
    const svg = el.slopeBox.querySelector("svg");
    if (!svg) return;
    svg.classList.toggle("has-lit", !!h);
    const litRow = (r) => h && (h.type === "row" ? r === rows[h.i] : r[h.side] === h.region);
    svg.querySelectorAll(".line").forEach((l) => l.classList.toggle("lit", !!litRow(rows[+l.dataset.i])));
    svg.querySelectorAll(".node").forEach((n) => n.classList.toggle("lit", !!h && h.type === "node" && n.dataset.side === h.side && n.dataset.region === h.region));
    if (!h) { el.cap.innerHTML = CAPTION; return; }
    if (h.type === "row") {
      const r = rows[h.i], until = r.main.to >= THIS_YEAR && !r.p.died ? "today" : r.main.to;
      el.cap.innerHTML = `<b>${TW.esc(r.p.name)}</b>: born in ${TW.esc(r.p.places[0][0])} (${r.born}); longest in ${TW.esc(r.main.name)} (${r.served}), ${r.main.from}–${until}.`;
    } else {
      const list = rows.filter((r) => r[h.side] === h.region);
      const stayed = list.filter((r) => r.born === r.served).length;
      el.cap.innerHTML = h.side === "born"
        ? `<b>Born in ${TW.esc(h.region)}</b>: ${list.length}; ${stayed} of them served longest there too.`
        : `<b>Served longest in ${TW.esc(h.region)}</b>: ${list.length}; ${stayed} of them were born there.`;
    }
  }

  function directoryHtml() {
    const groups = new Map();
    AUTHORS.people.map((p) => ({ p, main: TW.mainStay(p), served: TW.regionOf(TW.mainStay(p).name) })).sort((a, b) => regionRank(a.served) - regionRank(b.served) || a.p.born - b.p.born)
      .forEach((r) => { if (!groups.has(r.served)) groups.set(r.served, []); groups.get(r.served).push(r); });
    return `
      <div class="dir-tools"><label class="dir-search">${icon("search", 15)}<input id="dir-q" type="search" placeholder="Find a name or a place" autocomplete="off"></label><span class="muted small" id="dir-n">${AUTHORS.people.length} people</span></div>
      <div class="directory" id="directory">${[...groups].map(([region, list]) => `
        <section class="dir-group" data-region="${TW.esc(region)}">
          <h3>${TW.esc(region)}<span>${list.length}</span></h3>
          <ul>${list.map((r) => `<li><button type="button" data-id="${r.p.id}" data-q="${TW.esc((r.p.name + " " + r.p.places.map((x) => x[0]).join(" ")).toLowerCase())}" style="--tone: var(${TW.tone(r.p)})">
            <i></i><span class="nm">${TW.esc(r.p.name)}<small>${TW.esc(r.main.name)}</small></span><span class="yrs">${lifeLabel(r.p)}</span><span class="wk">${r.p.works ? formatNumber(r.p.works) : "–"}</span></button></li>`).join("")}</ul>
        </section>`).join("")}</div>
      <p class="muted small dir-key">Grouped by the country of each person's longest stay. The last number is how many of their works the library holds.</p>`;
  }

  function filterDirectory() {
    const q = el.q.value.trim().toLowerCase();
    let shown = 0;
    el.dir.querySelectorAll(".dir-group").forEach((g) => {
      let n = 0;
      g.querySelectorAll("[data-q]").forEach((b) => { const on = !q || b.dataset.q.includes(q); b.parentElement.hidden = !on; n += on; });
      g.hidden = n === 0; shown += n;
    });
    el.n.textContent = q ? `${shown} of ${AUTHORS.people.length} people` : `${AUTHORS.people.length} people`;
  }

  function initSlope(container) {
    computeRows();
    container.insertAdjacentHTML("beforeend", slopeHtml());
    el.slopeBox = document.getElementById("slope-box"); el.cap = document.getElementById("slope-cap");
    el.slopeBox.addEventListener("pointerover", (e) => {
      const line = e.target.closest(".line"), nodeEl = e.target.closest(".node");
      if (line) setHot({ type: "row", i: +line.dataset.i });
      else if (nodeEl) setHot({ type: "node", side: nodeEl.dataset.side, region: nodeEl.dataset.region });
    });
    el.slopeBox.addEventListener("pointerleave", () => setHot(null));
    el.slopeBox.addEventListener("click", (e) => { const line = e.target.closest(".line"); if (line) TW.openProfile(rows[+line.dataset.i].p); });
    let width = 0;
    new ResizeObserver(() => { if (el.slopeBox.clientWidth !== width) { width = el.slopeBox.clientWidth; drawSlope(); } }).observe(el.slopeBox);
  }

  function initDirectory(container) {
    container.insertAdjacentHTML("beforeend", directoryHtml());
    el.dir = document.getElementById("directory"); el.q = document.getElementById("dir-q"); el.n = document.getElementById("dir-n");
    el.q.addEventListener("input", filterDirectory);
    el.dir.addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) TW.openProfile(personById(b.dataset.id)); });
  }

  TW.origins = { initSlope, initDirectory, regionCount: () => new Set(AUTHORS.people.flatMap((p) => p.places.map((x) => TW.regionOf(x[0])))).size };
})();
