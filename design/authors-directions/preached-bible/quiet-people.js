// "Quiet chapters" (per-book strips of the chapters no work in the library takes as a main text, re-sortable) and the
// closing directory of all 47 people, each with a 66-book sparkline of their Bible texts where they have any.
PB.mountQuiet = (root) => {
  const { cells, chapterName, readHref, escapeHtml: esc, plural, SECTION_LABEL } = PB;
  const books = AUTHORS.books;
  const rows = books.map((book, b) => {
    const own = cells.filter((c) => c.b === b);
    const quiet = own.filter((c) => !c.total);
    return { b, book, own, quiet, share: quiet.length / own.length };
  });
  const quietTotal = rows.reduce((n, r) => n + r.quiet.length, 0);
  const bySection = {};
  for (const r of rows) bySection[r.book.section] = (bySection[r.book.section] ?? 0) + r.quiet.length;
  const [top1, top2] = Object.entries(bySection).sort((a, b) => b[1] - a[1]);
  const full = rows.filter((r) => !r.quiet.length).length;
  const silent = rows.filter((r) => r.quiet.length === r.own.length);

  // A strip of ticks, one per chapter, drawn as a single gradient (no element per chapter).
  const strip = (r) => {
    const n = r.own.length, gap = n <= 60 ? 0.3 / n : 0;
    const stops = r.own.map((c, i) => {
      const colour = c.total ? "color-mix(in srgb, var(--line) 75%, transparent)" : `var(--${r.book.section})`;
      const a = (i / n) * 100, z = ((i + 1) / n - gap) * 100, e = ((i + 1) / n) * 100;
      return `${colour} ${a.toFixed(2)}% ${z.toFixed(2)}%, transparent ${z.toFixed(2)}% ${e.toFixed(2)}%`;
    });
    return `linear-gradient(90deg, ${stops.join(", ")})`;
  };

  root.innerHTML = `
    <div class="quiet-top">
      <p class="section-line"><b>${formatNumber(quietTotal)}</b> of ${formatNumber(cells.length)} chapters have no work in the library that takes them as a main text. Most are in ${SECTION_LABEL[top1[0]]} (${top1[1]}) and ${SECTION_LABEL[top2[0]]} (${top2[1]}). ${full} books are lit in every chapter${silent.length ? `; ${silent.length === 1 ? "one is" : `${silent.length} are`} quiet throughout (${silent.map((r) => esc(r.book.name)).join(", ")})` : ""}. This shows what the library holds, not what was ever preached.</p>
      <div class="seg" role="group" aria-label="Order"><button type="button" data-sort="canon" aria-pressed="true">Bible order</button><button type="button" data-sort="quiet" aria-pressed="false">Quietest first</button></div>
    </div>
    <p class="quiet-reading" id="quiet-reading" aria-live="polite">Coloured ticks are the quiet chapters; grey ticks have at least one work. Choose a book to list its quiet chapters, each a link to read it.</p>
    <div class="quiet-grid" id="quiet-grid">${rows.map((r) => `<button type="button" class="quiet-row" data-book="${r.b}" aria-pressed="false" style="--tone: var(--${r.book.section})">
      <span class="q-name">${esc(r.book.name)}</span><span class="q-strip" style="background: ${strip(r)}"></span>
      <span class="q-count">${r.quiet.length ? `${r.quiet.length}<small> of ${r.own.length}</small>` : `<small>none</small>`}</span></button>`).join("")}</div>`;

  const grid = root.querySelector("#quiet-grid");
  function sortRows(mode) {
    const items = [...grid.children];
    const before = new Map(items.map((el) => [el, el.getBoundingClientRect()]));
    const order = [...rows].sort(mode === "quiet" ? (a, b) => b.share - a.share || b.quiet.length - a.quiet.length || a.b - b.b : (a, b) => a.b - b.b);
    for (const r of order) grid.appendChild(grid.querySelector(`[data-book="${r.b}"]`));
    if (PB.reducedMotion()) return;
    items.forEach((el) => {
      const was = before.get(el), now = el.getBoundingClientRect();
      const dx = was.left - now.left, dy = was.top - now.top;
      if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 650, easing: "cubic-bezier(.16, 1, .3, 1)", delay: Math.min(220, Math.abs(dy) / 6) });
    });
  }
  root.addEventListener("click", (event) => {
    const sort = event.target.closest("[data-sort]");
    if (sort) {
      for (const b of root.querySelectorAll("[data-sort]")) b.setAttribute("aria-pressed", String(b === sort));
      sortRows(sort.dataset.sort);
      return;
    }
    const row = event.target.closest("[data-book]");
    if (!row) return;
    for (const b of grid.children) b.setAttribute("aria-pressed", String(b === row));
    const r = rows[Number(row.dataset.book)];
    root.querySelector("#quiet-reading").innerHTML = r.quiet.length
      ? `<b>${esc(r.book.name)}</b>, ${plural(r.quiet.length, "quiet chapter")}: ${r.quiet.map((c) => `<a href="${readHref(c)}">${c.c}</a>`).join("")}`
      : `<b>${esc(r.book.name)}</b>: every chapter has at least one work in the library. The busiest is ${chapterName([...r.own].sort((a, b) => b.total - a.total)[0])}.`;
  });
};

PB.mountDirectory = (root) => {
  const { escapeHtml: esc } = PB;
  const people = AUTHORS.people;
  const used = FAMILIES.filter((f) => people.some((p) => familyOf(p).key === f.key));
  const flat = `<svg class="book-bars none" viewBox="0 0 132 22" preserveAspectRatio="none" aria-hidden="true"><line x1="0" x2="132" y1="21" y2="21" stroke="var(--line)" stroke-dasharray="2 3" vector-effect="non-scaling-stroke"/></svg>`;
  root.innerHTML = `
    <div class="family-chips">${[{ key: "all", label: "Everyone", tone: "--accent" }, ...used].map((f) => `<button type="button" class="chip small" data-family="${f.key}" aria-pressed="${f.key === "all"}" style="--tone: var(${f.tone})"><i class="dot"></i>${f.label}<b>${f.key === "all" ? people.length : people.filter((p) => familyOf(p).key === f.key).length}</b></button>`).join("")}</div>
    <p class="caption dir-caption">Sorted by year of birth. The small bars are each person's works with a main Bible text, one bar per book from Genesis to Revelation; a dotted line means none are recorded yet.</p>
    <div class="directory" id="directory">${people.map((p) => {
      const family = familyOf(p);
      return `<button type="button" class="person-row" data-person="${p.id}" data-fam="${family.key}" style="--tone: var(${family.tone})">
        <i class="dot"></i><span class="p-name"><b>${esc(p.name)}</b><small>${PB.years(p)}</small></span>
        ${PB.bookBars(p, 132, 22) || flat}<span class="p-works">${formatNumber(p.works)}<small>${p.works === 1 ? "work" : "works"}</small></span></button>`;
    }).join("")}</div>`;
  root.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-family]");
    if (!chip) return;
    for (const c of root.querySelectorAll("[data-family]")) c.setAttribute("aria-pressed", String(c === chip));
    for (const row of root.querySelectorAll(".person-row")) row.classList.toggle("dim", chip.dataset.family !== "all" && row.dataset.fam !== chip.dataset.family);
  });
};
