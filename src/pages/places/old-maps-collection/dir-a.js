// Direction A, "Through time": one lane per biblical subject across 680–1928, a dot per dated map (the approved
// "through time" lanes, made interactive: hovering a dot shows that map on a line below the lanes; a ringed dot opens
// in the viewer). Then the mapmakers as lifelines of their dated sheets, and the libraries that keep the scans.
(() => {
  const { D, esc, fmt, subjects, subjectByKey, maps, dotHas, subjectIcon, head, thumb, crystals, landing } = OM;

  // A broken axis: the few medieval maps share the first eighth of the width; print (1450 on) takes the rest.
  const BREAK = 1450, START = 650, END = 1935, SPLIT = 0.13;
  const xOf = (year) => year < BREAK ? SPLIT * (year - START) / (BREAK - START) : SPLIT + (1 - SPLIT) * (year - BREAK) / (END - BREAK);
  const pct = (year) => `${(xOf(year) * 100).toFixed(2)}%`;
  const TICKS = [700, 1000, 1300, 1500, 1600, 1700, 1800, 1900];
  const axis = () => `<div class="om-axis" aria-hidden="true">${TICKS.map((y) => `<span style="left:${pct(y)}">${y}</span>`).join("")}<i class="om-axis-break" style="left:${(SPLIT * 100).toFixed(2)}%"></i></div>`;
  const jitter = (n) => ((Math.sin(n * 12.9898) * 43758.5453) % 1 + 1) % 1; // fixed scatter, so dots never move

  // The line under a chart that shows the map under the pointer.
  function readoutHTML(dot) {
    if (!dot) return `<p class="om-read-empty">Point at a dot to see that map here. A ringed dot opens the map itself.</p>`;
    const m = dot[4] >= 0 ? maps[dot[4]] : null;
    const tags = subjects.filter((s) => dotHas(dot, s.key)).map((s) => `<span style="--tone:var(${s.tone})">${esc(s.short)}</span>`).join("");
    return `${m ? `<span class="om-read-img"><img src="${m.th}" alt=""></span>` : `<span class="om-read-img is-empty">${subjectIcon(subjects.find((s) => dotHas(dot, s.key))?.key, 22)}</span>`}
      <div class="om-read-txt"><b>${dot[0]}</b><p>${esc(dot[2])}</p><small>${esc(dot[3] || "Mapmaker not recorded")}${m ? ` · ${esc(m.lib)}` : ""}</small><span class="om-read-tags">${tags}</span></div>
      ${m ? `<button type="button" class="om-read-open" data-map="${m.id}">Open the map ${icon("arrowRight", 14)}</button>` : `<span class="om-read-none">Catalogued and held; not shown on this page</span>`}`;
  }

  Sections.a_landing = { mount(section) {
    const c = D.counts;
    landing(section, {
      kicker: "Old maps",
      title: "The biblical world,<br><em>as it was drawn.</em>",
      lede: `Twelve centuries of maps of the Holy Land, Jerusalem and the lands around them, from a plan of Jerusalem's churches dated about ${c.earliest} to the surveys of the 1920s. Follow each story through time, then open any map at full size, with its maker, its library and its credit.`,
      figureItems: [["Maps", fmt(c.onSubject), "of the biblical world, scanned"], ["Dated", fmt(c.dated), `${c.earliest} to ${c.latest}`], ["Mapmakers", fmt(c.makers), "named in the records"], ["Libraries", c.libraries, "credited on every map"]],
    });
  } };

  Sections.a_lanes = { mount(section) {
    const dated = D.dots;
    section.innerHTML = `${head("01", "Through time", "Twelve centuries, <em>one lane per story</em>", `Every dated map we hold, as a dot on its subject's lane: ${fmt(dated.length)} maps from ${dated[0][0]} to ${dated.at(-1)[0]}. A map of several subjects sits on each of their lanes. Choose a subject to keep only its lane.`)}
      <div class="om-lane-chips"></div>
      <div class="om-lanes" role="group" aria-label="Maps by subject through time">${subjects.map((s) => `<div class="om-lane" data-key="${s.key}" style="--tone:var(${s.tone})">
          <span class="om-lane-label">${subjectIcon(s.key, 16)}<b>${esc(s.short)}</b><small>${s.dated}</small></span>
          <span class="om-lane-track">${dated.map((dot, i) => dotHas(dot, s.key) ? `<i class="om-dot${dot[4] >= 0 ? " has-map" : ""}" data-i="${i}" style="left:${pct(dot[0])};top:${(12 + jitter(i + s.key.length) * 76).toFixed(1)}%"></i>` : "").join("")}</span></div>`).join("")}
        <div class="om-lane om-lane-axis"><span class="om-lane-label"></span><span class="om-lane-track">${axis()}<i class="om-hair" hidden></i></span></div>
      </div>
      <div class="om-readout" aria-live="polite">${readoutHTML(null)}</div>
      <p class="om-mocknote">The axis is broken at ${BREAK}: the ${dated.filter((d) => d[0] < BREAK).length} manuscript maps before printing share the first strip. Years are the dates the holding libraries give each sheet.</p>`;
    const lanes = section.querySelector(".om-lanes");
    const readout = section.querySelector(".om-readout");
    const hair = section.querySelector(".om-hair");
    crystals(section.querySelector(".om-lane-chips"), { count: (s) => s.dated, onChange(chosen) {
      lanes.querySelectorAll(".om-lane[data-key]").forEach((lane) => { lane.hidden = chosen.size > 0 && !chosen.has(lane.dataset.key); });
    } });
    let active = null;
    const show = (dotEl) => {
      if (dotEl === active) return;
      active?.classList.remove("is-on");
      active = dotEl;
      dotEl.classList.add("is-on");
      const dot = dated[Number(dotEl.dataset.i)];
      readout.innerHTML = readoutHTML(dot);
      hair.hidden = false;
      hair.style.left = pct(dot[0]);
    };
    lanes.addEventListener("pointerover", (event) => { const dotEl = event.target.closest(".om-dot"); if (dotEl) show(dotEl); });
    lanes.addEventListener("click", (event) => {
      const dotEl = event.target.closest(".om-dot");
      if (!dotEl) return;
      show(dotEl);
      const dot = dated[Number(dotEl.dataset.i)];
      if (dot[4] >= 0) Viewer.open(maps[dot[4]].id, dotEl);
    });
    readout.addEventListener("click", (event) => { const b = event.target.closest("[data-map]"); if (b) Viewer.open(b.dataset.map, b); });
    // Start on the earliest Paul map, so the line below the lanes is never empty on first sight.
    const first = lanes.querySelector('.om-lane[data-key="paul"] .om-dot.has-map');
    if (first) show(first);
  } };

  Sections.a_makers = { mount(section) {
    const byMaker = new Map();
    // One mapmaker can be spelt with and without accents across libraries (Münster, Munster): group them as one.
    const keyOf = (name) => name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    const display = new Map();
    D.dots.forEach((dot, i) => {
      if (!dot[3]) return;
      const key = keyOf(dot[3]);
      if (!byMaker.has(key)) { byMaker.set(key, []); display.set(key, dot[3]); }
      byMaker.get(key).push(i);
    });
    const top = [...byMaker.entries()].map(([key, list]) => [display.get(key), list]).filter(([, list]) => list.length >= 5).sort((a, b) => D.dots[a[1][0]][0] - D.dots[b[1][0]][0]).slice(0, 14);
    section.innerHTML = `${head("02", "Who drew them", "The mapmakers, <em>sheet by sheet</em>", `The ${top.length} mapmakers with the most dated maps here, earliest first. Each line runs from their first sheet to their last; atlases were reprinted long after their makers died, so some lines run on past a life.`)}
      <div class="om-makers">${top.map(([name, list]) => {
        const years = list.map((i) => D.dots[i][0]);
        const lo = Math.min(...years), hi = Math.max(...years);
        return `<div class="om-maker"><span class="om-maker-name"><b>${esc(name)}</b><small>${list.length} maps · ${lo}${hi > lo ? `–${hi}` : ""}</small></span>
          <span class="om-lane-track"><i class="om-maker-line" style="left:${pct(lo)};width:calc(${pct(hi)} - ${pct(lo)})"></i>${list.map((i) => `<i class="om-dot${D.dots[i][4] >= 0 ? " has-map" : ""}" data-i="${i}" style="left:${pct(D.dots[i][0])};top:50%;--tone:var(${subjects.find((s) => dotHas(D.dots[i], s.key)).tone})"></i>`).join("")}</span></div>`;
      }).join("")}
      <div class="om-maker om-lane-axis"><span class="om-maker-name"></span><span class="om-lane-track">${axis()}</span></div></div>
      <div class="om-readout" aria-live="polite">${readoutHTML(null)}</div>`;
    const readout = section.querySelector(".om-readout");
    const box = section.querySelector(".om-makers");
    box.addEventListener("pointerover", (event) => { const d = event.target.closest(".om-dot"); if (d) readout.innerHTML = readoutHTML(D.dots[Number(d.dataset.i)]); });
    box.addEventListener("click", (event) => { const d = event.target.closest(".om-dot"); const dot = d && D.dots[Number(d.dataset.i)]; if (dot) { readout.innerHTML = readoutHTML(dot); if (dot[4] >= 0) Viewer.open(maps[dot[4]].id, d); } });
    readout.addEventListener("click", (event) => { const b = event.target.closest("[data-map]"); if (b) Viewer.open(b.dataset.map, b); });
  } };

  // What each holder's licence asks of us, per the corpus rules (MANIFEST.md, owner decision 2026-10-17).
  const TERMS = {
    "David Rumsey Map Collection, David Rumsey Map Center, Stanford Libraries": "CC BY-NC-SA 3.0 · credited by name on every map, shared alike, never sold",
    "Library of Congress, Geography and Map Division": "Public domain · the library named as a courtesy",
    "New York Public Library": "Public domain · the library named as a courtesy",
    "Wikimedia Commons": "Per file · public domain, or the named author credited",
  };
  Sections.a_libraries = { mount(section) {
    const most = D.libraries[0][1];
    section.innerHTML = `${head("03", "Who kept them", "The libraries <em>behind the scans</em>", "Where each scan comes from, and what its licence asks. Several libraries reached us through Wikimedia Commons, which keeps their own credit on each file.")}
      <div class="om-libs">${D.libraries.map(([name, n]) => `<div class="om-lib"><span class="om-lib-name">${esc(name)}</span><span class="om-lib-bar"><i style="width:${(n / most * 100).toFixed(1)}%"></i></span><b>${fmt(n)}</b><small>${esc(TERMS[name] ?? "Through Wikimedia Commons · credited as the file records")}</small></div>`).join("")}</div>
      <p class="om-licences">${D.licences.map(([lic, n]) => `<span><b>${fmt(n)}</b> ${esc(lic)}</span>`).join("")}</p>`;
  } };
})();
