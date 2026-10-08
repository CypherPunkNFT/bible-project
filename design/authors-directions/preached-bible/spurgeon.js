// "Spurgeon through the Bible": a ring of 66 spokes, one per book, sized by his sermons on it. A year slider (and a
// play button) grows the ring through his dated sermons; choosing a spoke lists every sermon on that book.
PB.mountSpurgeon = (root) => {
  const { escapeHtml: esc, plural, formatDate, SECTION_LABEL } = PB;
  const PLAY = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>';
  const PAUSE = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>';
  const books = AUTHORS.books;
  const person = personById(PB.SPURGEON);
  const byBook = books.map(() => []);
  for (const sermon of person.sermons) byBook[Math.floor(sermon.v / 1e6) - 1].push(sermon);
  for (const list of byBook) list.sort((a, b) => a.v - b.v);
  const totals = byBook.map((list) => list.length);
  const maxTotal = Math.max(...totals);
  const all = person.sermons.length;

  // Dates inside his preaching life (from 1850 to his death); anything outside is left out of the year playback.
  const yearOf = (s) => (s.d ? Number(s.d.slice(0, 4)) : null);
  const inLife = (s) => { const y = yearOf(s); return y !== null && y >= 1850 && y <= person.died; };
  const dated = person.sermons.filter(inLife);
  const undated = person.sermons.filter((s) => !s.d).length;
  const outside = person.sermons.filter((s) => s.d && !inLife(s)).length;
  const firstYear = Math.min(...dated.map(yearOf)), lastYear = Math.max(...dated.map(yearOf));
  const ALL = lastYear + 1; // the slider's last stop: every sermon, dated or not
  const cumulative = byBook.map((list) => {
    const perYear = new Array(lastYear - firstYear + 1).fill(0);
    for (const s of list) if (inLife(s)) perYear[yearOf(s) - firstYear]++;
    for (let i = 1; i < perYear.length; i++) perYear[i] += perYear[i - 1];
    return perYear;
  });
  const countAt = (b, year) => (year >= ALL ? totals[b] : year < firstYear ? 0 : cumulative[b][Math.min(year, lastYear) - firstYear]);

  // ── Geometry ─────────────────────────────────────────────────────────────────────────────
  const R0 = 92, R1 = 248, STEP = (Math.PI * 2) / 66, PAD = 0.012;
  const radius = (count) => R0 + (R1 - R0) * Math.sqrt(count / maxTotal);
  const angle = (b) => -Math.PI / 2 + b * STEP;
  const point = (r, a) => `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
  const wedge = (b, r) => {
    const a0 = angle(b) + PAD, a1 = angle(b + 1) - PAD, outer = Math.max(R0 + 1.5, r);
    return `M${point(R0, a0)} L${point(outer, a0)} A${outer} ${outer} 0 0 1 ${point(outer, a1)} L${point(R0, a1)} A${R0} ${R0} 0 0 0 ${point(R0, a0)}Z`;
  };
  const labelled = totals.map((t, b) => [t, b]).sort((a, b) => b[0] - a[0]).slice(0, 10).map(([, b]) => b);
  const label = (b) => {
    const a = angle(b) + STEP / 2, r = R1 + 10;
    const deg = (a * 180) / Math.PI, flip = Math.cos(a) < 0;
    return `<text class="ring-label" transform="translate(${point(r, a).replace(" ", ",")}) rotate(${flip ? deg + 180 : deg})" text-anchor="${flip ? "end" : "start"}" dominant-baseline="middle">${esc(books[b].name)}</text>`;
  };
  const rings = [100, maxTotal].map((n) => `<circle r="${radius(n).toFixed(1)}" class="ring-guide"/><text class="ring-guide-label" x="-4" text-anchor="end" y="${(-radius(n) - 3).toFixed(1)}">${n}</text>`).join("");

  root.innerHTML = `
    <div class="spurgeon-grid">
      <div class="ring-card">
        <svg class="ring" viewBox="-320 -320 640 640" role="img" aria-label="Spurgeon's sermons by book of the Bible">
          ${rings}
          <g id="spokes">${books.map((book, b) => `<path data-book="${b}" fill="var(--${book.section})" d="${wedge(b, radius(totals[b]))}"><title>${esc(book.name)}: ${totals[b]}</title></path>`).join("")}</g>
          <g>${labelled.map(label).join("")}</g>
          <circle r="${R0 - 6}" class="ring-hole"/>
          <text class="ring-big" id="ring-big" y="-2" text-anchor="middle"></text>
          <text class="ring-small" id="ring-small" y="22" text-anchor="middle"></text>
        </svg>
        <div class="years">
          <button type="button" class="play" id="ring-play" aria-label="Play through the years">${PLAY}</button>
          <input type="range" id="ring-year" min="${firstYear}" max="${ALL}" step="1" value="${ALL}" aria-label="Show sermons up to year">
          <output id="ring-readout"></output>
        </div>
        <p class="caption">Spoke length grows with the square root of the count, so small books stay visible. The slider counts the ${formatNumber(dated.length)} sermons dated ${firstYear}–${lastYear}; ${formatNumber(undated)} have no date${outside ? ` and ${outside} carry a date outside his preaching life` : ""}, so they appear only at “All”.</p>
      </div>
      <div class="sermon-card">
        <div class="sermon-head"><div><p class="kicker" id="list-kicker"></p><h3 id="list-title"></h3></div>
          <div class="seg" role="group" aria-label="Order"><button type="button" data-order="text" aria-pressed="true">By chapter</button><button type="button" data-order="date" aria-pressed="false">By date</button></div></div>
        <ol class="sermon-list" id="sermon-list"></ol>
      </div>
    </div>`;

  const paths = [...root.querySelectorAll("#spokes path")];
  const slider = root.querySelector("#ring-year");
  const shown = Float32Array.from(totals); // the spoke counts currently drawn (they ease toward the target)
  let year = ALL, selected = totals.indexOf(maxTotal), hover = -1, order = "text", playing = false, raf = 0;

  function drawSpokes() { paths.forEach((path, b) => path.setAttribute("d", wedge(b, radius(shown[b])))); }
  function tick() {
    let moving = false;
    for (let b = 0; b < 66; b++) {
      const goal = countAt(b, year), diff = goal - shown[b];
      if (Math.abs(diff) > 0.05) { shown[b] += diff * 0.2; moving = true; } else shown[b] = goal;
    }
    drawSpokes();
    raf = moving || playing ? requestAnimationFrame(tick) : 0;
  }
  const kick = () => { if (PB.reducedMotion()) { for (let b = 0; b < 66; b++) shown[b] = countAt(b, year); drawSpokes(); return; } if (!raf) raf = requestAnimationFrame(tick); };

  function center() {
    const b = hover >= 0 ? hover : selected;
    root.querySelector("#ring-big").textContent = formatNumber(countAt(b, year));
    root.querySelector("#ring-small").textContent = books[b].name;
    paths.forEach((path, i) => path.classList.toggle("on", i === selected));
    root.classList.toggle("ring-hovering", hover >= 0);
  }
  function readout() {
    const shownCount = year >= ALL ? all : dated.filter((s) => yearOf(s) <= year).length;
    root.querySelector("#ring-readout").innerHTML = year >= ALL ? `<b>All</b> ${formatNumber(all)} sermons` : `<b>${year}</b> ${formatNumber(shownCount)} dated so far`;
  }
  function list() {
    const book = books[selected];
    const sermons = byBook[selected].filter((s) => year >= ALL || (inLife(s) && yearOf(s) <= year));
    const sorted = order === "date" ? [...sermons].sort((a, b) => (a.d ?? "9").localeCompare(b.d ?? "9") || a.v - b.v) : sermons;
    root.querySelector("#list-kicker").textContent = SECTION_LABEL[book.section];
    root.querySelector(".sermon-card").style.setProperty("--tone", `var(--${book.section})`);
    root.querySelector("#list-title").innerHTML = `${esc(book.name)} <small>${plural(sermons.length, "sermon")}${year < ALL ? ` by ${year}` : ""}</small>`;
    const target = root.querySelector("#sermon-list");
    let lastChapter = 0;
    target.innerHTML = sorted.length ? sorted.map((s) => {
      const chapter = Math.floor(s.v / 1e3) % 1000;
      const head = order === "text" && chapter !== lastChapter ? `<li class="chapter-head">${book.name === "Psalms" ? "Psalm" : esc(book.name)} ${chapter}</li>` : "";
      lastChapter = chapter;
      return `${head}<li><a href="/read/kjv/${book.code}/${chapter}?hl=${s.v % 1000}"><span>${esc(s.t)}</span><small>${esc(s.r)} · ${formatDate(s.d)}</small></a></li>`;
    }).join("") : `<li class="empty">No sermons on ${esc(book.name)} by ${year}.</li>`;
    target.scrollTop = 0;
  }

  function setYear(next, fromSlider = false) {
    const changed = next !== year;
    year = next;
    if (!fromSlider) slider.value = String(year);
    readout(); center(); kick();
    if (changed) list();
  }
  function play() {
    if (playing) { stop(); return; }
    playing = true;
    root.querySelector("#ring-play").classList.add("on");
    root.querySelector("#ring-play").innerHTML = PAUSE;
    root.querySelector("#ring-play").setAttribute("aria-label", "Pause");
    const start = performance.now(), from = year >= ALL ? firstYear : year, perYear = PB.reducedMotion() ? 40 : 130;
    const advance = (now) => {
      if (!playing) return;
      const next = Math.min(ALL, from + Math.floor((now - start) / perYear));
      if (next !== year) setYear(next);
      if (next >= ALL) { stop(); return; }
      requestAnimationFrame(advance);
    };
    setYear(from); requestAnimationFrame(advance);
  }
  function stop() {
    playing = false;
    root.querySelector("#ring-play").classList.remove("on");
    root.querySelector("#ring-play").innerHTML = PLAY;
    root.querySelector("#ring-play").setAttribute("aria-label", "Play through the years");
  }

  const spokes = root.querySelector("#spokes");
  spokes.addEventListener("pointerover", (event) => { const p = event.target.closest("[data-book]"); if (p) { hover = Number(p.dataset.book); center(); } });
  spokes.addEventListener("pointerleave", () => { hover = -1; center(); });
  spokes.addEventListener("click", (event) => { const p = event.target.closest("[data-book]"); if (!p) return; selected = Number(p.dataset.book); hover = -1; center(); list(); });
  slider.addEventListener("input", () => { stop(); setYear(Number(slider.value), true); });
  root.querySelector("#ring-play").addEventListener("click", play);
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-order]");
    if (!button) return;
    order = button.dataset.order;
    for (const b of root.querySelectorAll("[data-order]")) b.setAttribute("aria-pressed", String(b === button));
    list();
  });
  readout(); center(); list();
};
