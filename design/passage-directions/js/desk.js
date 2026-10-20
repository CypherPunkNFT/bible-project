// The comparison desk: each witness's line as floating text, joined by a thread to the reading it supports. Readings
// with more than one witness gather their threads; an edition's thread is dashed, a lost leaf's thread stops short.
// Choosing a witness shows its evidence on the line below. Used by all three directions, each in its own dress.
(() => {
  const { CASES, readings } = PM;
  const { cite, recButton, choice } = PMX;
  const caseOf = (id) => CASES.find((c) => c.id === id);
  const kindClass = (row) => (row.layer === "Critical edition" ? "is-edition" : row.layer === "No surviving text" ? "is-lost" : "is-ms");
  const isGreek = (id) => id !== "mark";

  function rowsHtml(c, rows) {
    return rows.map((r) => `<li><button type="button" class="dk-wit ${kindClass(r)}" data-row="${r.id}" aria-pressed="false">
        <span class="dk-sig">${esc(r.siglum)}</span>
        <span class="dk-who"><b>${esc(r.name)}</b><small>${esc(r.layer)}</small></span>
        <span class="dk-line"${isGreek(c.id) ? ' lang="grc"' : ""}><span>${esc(r.before ?? "")}</span><mark data-slot>${esc(r.difference)}</mark><span>${esc(r.after ?? "")}</span></span>
        <span class="dk-gloss">${esc(r.gloss)}</span></button></li>`).join("");
  }
  // One floating word per distinct reading, with how many witnesses of each layer support it.
  function groups(rows) {
    const map = new Map();
    for (const r of rows) {
      const key = r.layer === "No surviving text" ? `lost:${r.id}` : r.difference;
      if (!map.has(key)) map.set(key, { key, text: r.difference, lost: r.layer === "No surviving text", ms: 0, ed: 0 });
      const g = map.get(key);
      if (r.layer === "Manuscript") g.ms++; else if (r.layer === "Critical edition") g.ed++;
    }
    return [...map.values()];
  }
  const support = (g) => (g.lost ? "no leaf survives here" : [g.ms ? `${g.ms} manuscript${g.ms > 1 ? "s" : ""}` : "", g.ed ? `${g.ed} edition${g.ed > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · "));
  const keyOf = (r) => (r.layer === "No surviving text" ? `lost:${r.id}` : r.difference);

  // The right edge of the last line of text inside a node, and the rightmost edge of any of its lines.
  function textEdges(node) {
    const range = document.createRange(); range.selectNodeContents(node);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0);
    return rects.length ? { last: rects[rects.length - 1], right: Math.max(...rects.map((r) => r.right)) } : null;
  }

  // `clearText`: threads start after the end of each witness's sentence and only bend once they are clear of every
  // row's lettering, so no line runs over a letter.
  function mount(el, { caseId = "galatians", menu = true, onCase = () => {}, clearText = false } = {}) {
    let c = caseOf(caseId), alt = false, chosen = null;
    el.classList.add("dk");
    el.innerHTML = `${menu ? `<div class="dk-menu" role="group" aria-label="Choose a passage">${CASES.map((x, i) => `<button type="button" data-case="${x.id}" aria-pressed="${x.id === c.id}" style="--tone: var(${x.tone})"><span>0${i + 1}</span><b>${esc(x.passage)}</b><small>${esc(x.title)}</small></button>`).join("")}</div>` : ""}
      <div class="dk-intro"><div><p class="kicker dk-passage"></p><h3 class="dk-sub"></h3><p class="dk-context"></p></div><div class="dk-controls"></div></div>
      <div class="dk-graph"><ol class="dk-wits"></ol><ul class="dk-reads" aria-label="Readings"></ul><svg class="dk-threads" aria-hidden="true"></svg></div>
      <div class="dk-below ms-say" aria-live="polite"></div>
      <div class="dk-foot"><p class="dk-key"></p><div class="dk-cites"></div></div>`;
    const $ = (s) => el.querySelector(s);

    function controls() {
      if (!c.toggle) return `<p class="dk-note">${esc(c.note)}</p>`;
      return `<div><p class="dk-legend">${esc(c.toggle.label)}</p><div class="ct-sort dk-toggle" role="group" aria-label="${esc(c.toggle.label)}">
        <button type="button" data-alt="0" aria-pressed="${!alt}">${esc(c.toggle.off)}</button><button type="button" data-alt="1" aria-pressed="${alt}">${esc(c.toggle.on)}</button></div></div>`;
    }
    function below() {
      const rows = readings(c.id, alt), r = rows.find((x) => x.id === chosen);
      if (!r) { $(".dk-below").innerHTML = `<span class="dk-hint">Choose a witness to see what it is, where the extract comes from, and its sources.</span> <span class="dk-caption">${esc(c.caption)}</span>`; return; }
      $(".dk-below").innerHTML = `<p class="kicker">${esc(r.siglum)} · ${esc(r.name)} · ${esc(r.date)}</p><p class="dk-evidence">${esc(r.evidence)}</p>${cite(r.links)}${recButton(r.rec)}`;
    }
    function draw(animate) {
      const rows = readings(c.id, alt);
      el.style.setProperty("--tone", `var(${c.tone})`);
      el.dataset.case = c.id;
      $(".dk-passage").textContent = c.passage;
      $(".dk-sub").innerHTML = c.subtitle;
      $(".dk-context").textContent = c.context;
      $(".dk-controls").innerHTML = controls();
      $(".dk-wits").innerHTML = rowsHtml(c, rows);
      const gs = groups(rows);
      $(".dk-reads").innerHTML = gs.map((g) => `<li data-read="${esc(g.key)}" class="${g.lost ? "is-lost" : ""}"><b${isGreek(c.id) && !g.lost ? ' lang="grc"' : ""}>${esc(g.lost ? "no reading" : g.text)}</b><small>${esc(support(g))}</small></li>`).join("");
      $(".dk-key").innerHTML = `<span><i class="k-ms"></i>Manuscript evidence</span><span><i class="k-ed"></i>Editor’s text</span>${c.id === "mark" ? `<span><i class="k-lost"></i>Not extant ≠ omitted</span>` : ""}`;
      $(".dk-cites").innerHTML = cite(c.cites);
      if (chosen) el.querySelector(`[data-row="${chosen}"]`)?.setAttribute("aria-pressed", "true");
      if (animate) el.querySelectorAll("[data-slot]").forEach((m) => m.classList.add("is-new"));
      below();
      requestAnimationFrame(threads);
    }
    // Curves from each witness's highlighted words to the reading it supports.
    function threads() {
      const svg = $(".dk-threads"), box = $(".dk-graph").getBoundingClientRect();
      if (!box.width) return;
      svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      const rows = readings(c.id, alt);
      if (clearText) { svg.innerHTML = clearThreads(svg, box, rows); return; }
      svg.innerHTML = rows.map((r) => {
        const slot = el.querySelector(`[data-row="${r.id}"] [data-slot]`)?.getBoundingClientRect();
        const read = el.querySelector(`[data-read="${CSS.escape(keyOf(r))}"] b`)?.getBoundingClientRect();
        if (!slot || !read) return "";
        const x1 = slot.right - box.left + 4, y1 = slot.top + slot.height / 2 - box.top;
        const x2 = read.left - box.left - 8, y2 = read.top + read.height / 2 - box.top;
        if (x2 - x1 < 12) return "";
        const mx = x1 + (x2 - x1) * 0.55;
        const d = r.layer === "No surviving text" ? `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x1 + (x2 - x1) * 0.7} ${y2}` : `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
        const on = chosen === r.id ? " is-on" : "";
        return `<path class="dk-thread ${kindClass(r)}${on}" data-row-thread="${r.id}" d="${d}"/><circle class="dk-knot ${kindClass(r)}${on}" cx="${x1}" cy="${y1}" r="2.6"/>${r.layer === "No surviving text" ? `<path class="dk-cut" d="M${x1 + (x2 - x1) * 0.7 + 4} ${y2 - 5}l6 10m0-10-6 10"/>` : `<circle class="dk-knot ${kindClass(r)}" cx="${x2}" cy="${y2}" r="2.2"/>`}`;
      }).join("");
    }

    function clearThreads(svg, box, rows) {
      const GAP = 12;
      const ends = rows.map((r) => { const line = el.querySelector(`[data-row="${r.id}"] .dk-line`); return line ? textEdges(line) : null; });
      // Everything lettered in the witness column: Greek lines, names and glosses.
      const clear = Math.max(...[...el.querySelectorAll(".dk-wits .dk-line, .dk-wits .dk-who, .dk-wits .dk-gloss, .dk-wits .dk-sig")].map((n) => textEdges(n)?.right ?? 0)) - box.left + GAP;
      return rows.map((r, i) => {
        const end = ends[i], read = el.querySelector(`[data-read="${CSS.escape(keyOf(r))}"] b`)?.getBoundingClientRect();
        if (!end || !read) return "";
        const x1 = end.last.right - box.left + GAP, y1 = end.last.top + end.last.height / 2 - box.top;
        const x2 = read.left - box.left - GAP, y2 = read.top + read.height / 2 - box.top;
        const xs = Math.max(clear, x1);
        if (x2 - xs < 18) return "";
        const lost = r.layer === "No surviving text", xe = lost ? xs + (x2 - xs) * 0.6 : x2, mx = xs + (xe - xs) * 0.5;
        const on = chosen === r.id ? " is-on" : "";
        return `<path class="dk-thread ${kindClass(r)}${on}" data-row-thread="${r.id}" d="M${x1} ${y1}H${xs}C${mx} ${y1} ${mx} ${y2} ${xe} ${y2}"/><circle class="dk-knot ${kindClass(r)}${on}" cx="${x1}" cy="${y1}" r="2.6"/>${lost ? `<path class="dk-cut" d="M${xe + 4} ${y2 - 5}l6 10m0-10-6 10"/>` : `<circle class="dk-knot ${kindClass(r)}" cx="${x2}" cy="${y2}" r="2.2"/>`}`;
      }).join("");
    }

    el.addEventListener("click", (e) => {
      // Buttons only: the desk itself carries data-case, so a bare selector matched every click and reset the toggle.
      const caseBtn = e.target.closest("button[data-case]");
      if (caseBtn) { setCase(caseBtn.dataset.case); onCase(c.id); return; }
      const altBtn = e.target.closest("[data-alt]");
      if (altBtn) { alt = altBtn.dataset.alt === "1"; draw(true); return; }
      const wit = e.target.closest("[data-row]");
      if (wit) { chosen = chosen === wit.dataset.row ? null : wit.dataset.row; el.querySelectorAll("[data-row]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.row === chosen))); below(); threads(); }
    });
    el.addEventListener("pointerover", (e) => {
      const wit = e.target.closest("[data-row]");
      el.querySelectorAll(".dk-thread").forEach((p) => p.classList.toggle("is-hover", !!wit && p.dataset.rowThread === wit.dataset.row));
    });
    new ResizeObserver(() => threads()).observe($(".dk-graph"));
    function setCase(id) {
      c = caseOf(id) ?? c; alt = false; chosen = null;
      el.querySelectorAll("[data-case]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.case === c.id)));
      draw(true);
    }
    draw(false);
    return { setCase, get case() { return c.id; }, setAlt(v) { alt = v; draw(true); } };
  }
  window.Desk = { mount, choice };
})();
