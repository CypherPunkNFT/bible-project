// C · The curriculum map, front page. The whole division as a scope-and-sequence grid: nine subjects down, seven
// readers across, each cell shaded by how many titles it holds. The series are drawn as lines with floating names
// across the grid. Choosing a cell slides its shelf in beside the map.
(() => {
  const { esc, icon, plural } = Frame;
  const { AUDIENCES, TRACKS, KINDS, SERIES, ITEMS } = LEARN;
  const cellItems = (tid, aid) => LEARN.forAudience(aid).filter((it) => it.track === tid);

  function grid() {
    const head = `<span></span>${AUDIENCES.map((a) => `<span class="cm-colh${a.setting ? " setting" : ""}" style="--tone: var(${a.tone})">${ART.audience(a.art)}<b>${a.name}</b><small>${a.setting ? a.age : a.age}</small></span>`).join("")}`;
    const rows = TRACKS.map((t) => `<span class="cm-rowh">${ART.track(t.id, 20)}<span>${t.name}<small>${t.from}</small></span></span>${AUDIENCES.map((a) => {
      const list = cellItems(t.id, a.id);
      return `<button type="button" class="cm-cell${a.setting ? " setting" : ""}${list.length ? "" : " empty"}" data-t="${t.id}" data-a="${a.id}" style="--n:${Math.min(list.length, 4)}"${list.length ? "" : " disabled"} aria-label="${t.name}, ${a.name}: ${plural(list.length, "title")}">
        <span class="n">${list.length || "·"}</span><span class="sq">${list.map((it) => `<i class="${it.status}${it.audience !== a.id ? " guide" : ""}" data-id="${it.id}"></i>`).join("")}</span></button>`;
    }).join("")}`).join("");
    return `<div class="cm-scroll"><div class="cm-grid">${head}${rows}<svg class="cm-paths" aria-hidden="true"></svg></div></div>
      <div class="cm-legend"><span><i style="background:var(--ink)"></i>Ready</span><span><i></i>Planned</span><span><i style="border-style:dashed;opacity:.5"></i>Shown again under Leaders (comes with a leader guide)</span><span>Darker cells hold more titles</span></div>`;
  }

  // Each series as a curve through the cells of its titles, its name floating at the start.
  function drawPaths(root, shown, hi) {
    const g = root.querySelector(".cm-grid"), svg = g.querySelector(".cm-paths"), box = g.getBoundingClientRect();
    svg.innerHTML = SERIES.map((s, si) => {
      const pts = LEARN.inSeries(s.id).map((it) => g.querySelector(`.cm-cell[data-t="${it.track}"][data-a="${it.audience}"]`)).filter(Boolean).map((cell, i) => {
        const r = cell.getBoundingClientRect(); return [r.left - box.left + r.width * (0.62 + ((si % 3) - 1) * 0.12), r.top - box.top + r.height * (0.5 + ((i % 2) - 0.5) * 0.18)]; });
      const uniq = pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 4);
      if (uniq.length < 2) return "";
      const d = uniq.map(([x, y], i) => (i ? `C${(uniq[i - 1][0] + x) / 2} ${uniq[i - 1][1]} ${(uniq[i - 1][0] + x) / 2} ${y} ${x} ${y}` : `M${x} ${y}`)).join(" ");
      const [lx, ly] = uniq[0];
      return `<g class="${shown.has(s.id) ? "" : "off"}${hi === s.id ? " hi" : ""}"><path d="${d}"/>${uniq.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join("")}<text x="${lx + 8}" y="${ly - 9}">${esc(s.name)}</text></g>`;
    }).join("");
  }

  function panel() {
    let el = document.querySelector(".cm-panel");
    if (!el) { el = document.createElement("aside"); el.className = "cm-panel"; el.setAttribute("aria-label", "Titles in this cell"); document.body.append(el); }
    return el;
  }
  function openCell(root, tid, aid) {
    const t = LEARN.T[tid], a = LEARN.A[aid], list = cellItems(tid, aid), el = panel();
    root.querySelectorAll(".cm-cell").forEach((c) => c.classList.toggle("on", c.dataset.t === tid && c.dataset.a === aid));
    el.innerHTML = `<button type="button" class="x" aria-label="Close">${icon("x", 16)}</button><p class="kicker" style="--tone: var(${a.tone})">${a.name} · ${a.age}</p><h3>${t.name}</h3>
      <p>${plural(list.length, "title")} where this subject meets this reader. Built from ${t.from.toLowerCase()}.</p>
      <ol>${list.map((it) => `<li>${ART.kind(it.kind, 22)}<b><a href="#c/item/${it.id}">${esc(it.title)}</a></b><p>${LEARN.K[it.kind].name}${it.audience !== aid ? ` · for ${LEARN.A[it.audience].name.toLowerCase()}, with a leader guide` : ""} · ${esc(it.sub)}</p><p>Built from ${Frame.sources(it)}</p>${Frame.status(it)}</li>`).join("")}</ol>
      <p style="margin-top:1rem"><a class="textlink" href="#c/age/${aid}">All of ${a.name.toLowerCase()} as a scope and sequence</a></p>`;
    requestAnimationFrame(() => el.classList.add("open"));
    el.querySelector(".x").addEventListener("click", () => { el.classList.remove("open"); root.querySelectorAll(".cm-cell.on").forEach((c) => c.classList.remove("on")); });
  }

  function kindsBars() {
    return `<div class="cm-kinds">${AUDIENCES.map((a) => { const list = LEARN.forAudience(a.id);
      return `<div class="cm-krow"><b>${a.name}</b><div class="cm-bar">${KINDS.map((k) => [k, list.filter((it) => it.kind === k.id)]).filter(([, l]) => l.length).map(([k, l]) =>
        `<span style="flex:${l.length}" title="${k.plural}: ${l.length}">${ART.kind(k.id, 13)}<small>${l.length} ${(l.length === 1 ? k.name : k.plural).toLowerCase()}</small>${l.some((it) => it.status === "ready") ? `<b class="rd">${l.filter((it) => it.status === "ready").length} ready</b>` : ""}</span>`).join("")}</div><em>${list.length}</em></div>`; }).join("")}</div>`;
  }

  function front(wrap) {
    const filled = TRACKS.reduce((n, t) => n + AUDIENCES.filter((a) => cellItems(t.id, a.id).length).length, 0);
    wrap.innerHTML = `${Frame.crumbs("Direction C · The curriculum map")}
      <section class="cm-intro"><div><p class="kicker rule">Resources · Learning materials · Scope and sequence</p><h1 class="plain-title">The whole division<br><em>on one map.</em></h1></div>
        <div><p class="lede">Every subject the site can teach, for every reader. A shaded cell holds titles; a blank one is a gap in the plan. The lines are the series, which carry a reader from one cell to the next.</p>
          <dl class="figures"><div><dt>Cells with titles</dt><dd>${filled}<small> of ${TRACKS.length * AUDIENCES.length}</small></dd></div><div><dt>Ready</dt><dd>${LEARN.ready.length}</dd></div><div><dt>Planned</dt><dd>${LEARN.planned.length}</dd></div><div><dt>Series</dt><dd>${SERIES.length}</dd></div></dl></div></section>
      <section class="sec" style="margin-top:2rem"><div class="sec-head"><span class="sec-num">01</span><div><h2>Subjects × readers, <em>with the paths across</em></h2><p>Choose a cell to open its shelf beside the map. Choose a series to show or hide its line.</p></div></div>
        <div class="cm-tools"><span class="lab">Series</span>${SERIES.map((s) => `<button type="button" data-s="${s.id}" aria-pressed="true"><i></i>${s.name}</button>`).join("")}</div>
        ${grid()}</section>
      <section class="sec"><div class="sec-head"><span class="sec-num">02</span><div><h2>What kind of thing, <em>for whom</em></h2><p>Each reader's titles by kind; the dark mark is the one ready today.</p></div></div>${kindsBars()}</section>`;
    const shown = new Set(SERIES.map((s) => s.id));
    let hi = null;
    const redraw = () => drawPaths(wrap, shown, hi);
    requestAnimationFrame(redraw);
    addEventListener("resize", redraw);
    document.fonts?.ready.then(redraw);
    wrap.querySelectorAll(".cm-tools [data-s]").forEach((b) => {
      b.addEventListener("click", () => { const on = !shown.has(b.dataset.s); on ? shown.add(b.dataset.s) : shown.delete(b.dataset.s); b.setAttribute("aria-pressed", String(on)); redraw(); });
      b.addEventListener("pointerenter", () => { hi = b.dataset.s; redraw(); });
      b.addEventListener("pointerleave", () => { hi = null; redraw(); });
    });
    wrap.querySelectorAll(".cm-cell:not(.empty)").forEach((c) => c.addEventListener("click", () => openCell(wrap, c.dataset.t, c.dataset.a)));
    addEventListener("hashchange", () => document.querySelector(".cm-panel")?.classList.remove("open"), { once: true });
  }

  DIRS.c = { name: "The curriculum map", defaultAge: "teens", front };
})();
