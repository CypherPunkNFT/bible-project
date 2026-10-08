// The main event: all 1,189 chapters on one canvas, each lit by how many works in the library take it as a main text.
// Preacher chips repaint it with a wave that runs Genesis → Revelation; hover (or tap) a chapter for who, how many, titles.
PB.mountHero = (root) => {
  const { cells, valueOf, chapterName, readHref, escapeHtml: esc, plural, SECTION_LABEL, SPURGEON } = PB;
  const books = AUTHORS.books;
  const n = cells.length;
  const WAVE = 520, DURATION = 560; // ms: how long the wave takes to cross the Bible, and each square's own fade
  const narrow = matchMedia("(max-width: 899px)");

  const views = [
    { id: "all", label: "Everyone", chapters: PB.litCount, tone: "--accent" },
    { id: "others", label: "Without Spurgeon", chapters: cells.filter((c) => valueOf(c, "others")).length, tone: "--muted" },
    ...PB.preachers.map((p) => ({ id: p.person.id, label: p.person.short, chapters: p.chapters, tone: familyOf(p.person).tone, person: p.person })),
  ];

  root.innerHTML = `
    <div class="hero-bar">
      <p class="kicker">Light up the Bible for</p>
      <div class="chips" id="hero-chips">${views.map((v) => `<button type="button" class="chip" data-view="${v.id}" aria-pressed="${v.id === "all"}" style="--tone: var(${v.tone})"><i class="dot"></i>${esc(v.label)}<b>${formatNumber(v.chapters)}</b></button>`).join("")}</div>
    </div>
    <div class="hero-grid">
      <div class="bible-card">
        <div class="bible-key"><p>One square is one chapter, Genesis to Revelation, reading down each column. The brighter it is, the more works in the library take that chapter as their main text.</p>
          <span class="scale" aria-hidden="true">fewer<i></i><i></i><i></i><i></i><i></i>more</span></div>
        <div class="canvas-box"><canvas id="bible-canvas" tabindex="0" aria-label="Chapter map of the Bible. Use the arrow keys to move between chapters."></canvas></div>
        <div class="legend">${Object.entries(SECTION_LABEL).map(([key, label]) => `<span><i style="background: var(--${key})"></i>${label}</span>`).join("")}<span class="legend-quiet"><i></i>No work yet</span></div>
      </div>
      <aside class="detail" id="hero-detail" aria-live="polite"></aside>
    </div>
    <div class="sheet" id="hero-sheet" role="dialog" aria-label="Chapter" inert></div>`;

  const canvas = root.querySelector("canvas");
  const box = root.querySelector(".canvas-box");
  const detail = root.querySelector("#hero-detail");
  const sheet = root.querySelector("#hero-sheet");
  const ctx = canvas.getContext("2d");

  // ── State ────────────────────────────────────────────────────────────────────────────────
  let view = "all";
  let hovered = -1, pinned = -1;
  const current = new Float32Array(n), from = new Float32Array(n), target = new Float32Array(n);
  let animStart = 0, animating = false;
  let rects = [], labels = [], cssWidth = 0, cssHeight = 0;
  let palette = null;

  // ── Layout: books flow left to right in blocks eight chapters tall; a new section leaves a wider gap ───────────
  function layout(width) {
    const size = width >= 820 ? 12 : width >= 540 ? 11 : 9;
    const gap = 2, rows = 8, pitch = size + gap;
    const bookGap = size >= 11 ? 6 : 4, sectionGap = bookGap * 3, labelHeight = 15, lineGap = size >= 11 ? 16 : 12;
    const lineHeight = labelHeight + rows * pitch - gap + lineGap;
    rects = new Array(n); labels = [];
    let x = 0, line = 0, previous = null, index = 0;
    books.forEach((book, b) => {
      const count = book.chapters.length, w = Math.ceil(count / rows) * pitch - gap;
      if (previous && book.section !== previous && x > 0) x += sectionGap - bookGap;
      if (x > 0 && x + w > width) { x = 0; line++; }
      const top = line * lineHeight;
      labels.push({ b, x, y: top + 10, w });
      for (let c = 0; c < count; c++) rects[index++] = [x + Math.floor(c / rows) * pitch, top + labelHeight + (c % rows) * pitch, size];
      x += w + bookGap; previous = book.section;
    });
    cssWidth = width; cssHeight = (line + 1) * lineHeight - lineGap;
    const ratio = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(cssHeight * ratio);
    canvas.style.height = `${cssHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.font = '500 10px "Archivo Variable", system-ui, sans-serif';
    for (const label of labels) {
      const book = books[label.b];
      label.text = ctx.measureText(book.name).width <= label.w ? book.name : ctx.measureText(book.code).width <= label.w ? book.code : "";
    }
  }

  function readPalette() {
    const surface = PB.rgbOf("--surface"), line = PB.rgbOf("--line");
    palette = { quiet: PB.mix(surface, line, 0.55), sections: {}, ink: Frame.color("--ink"), muted: Frame.color("--muted") };
    for (const key of Object.keys(SECTION_LABEL)) palette.sections[key] = PB.rgbOf(`--${key}`);
  }

  function draw() {
    if (!palette) readPalette();
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.font = '500 10px "Archivo Variable", system-ui, sans-serif';
    ctx.textBaseline = "alphabetic";
    const activeBook = hovered >= 0 ? cells[hovered].b : pinned >= 0 ? cells[pinned].b : -1;
    for (const label of labels) {
      if (!label.text) continue;
      ctx.fillStyle = label.b === activeBook ? palette.ink : palette.muted;
      ctx.fillText(label.text, label.x, label.y);
    }
    for (let i = 0; i < n; i++) {
      const [x, y, s] = rects[i];
      const t = current[i];
      ctx.fillStyle = PB.css(PB.mix(palette.quiet, palette.sections[books[cells[i].b].section], t));
      ctx.beginPath(); ctx.roundRect(x, y, s, s, s > 10 ? 3 : 2); ctx.fill();
    }
    for (const i of [pinned, hovered]) {
      if (i < 0) continue;
      const [x, y, s] = rects[i];
      ctx.strokeStyle = palette.ink; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(x - 1.5, y - 1.5, s + 3, s + 3, 4); ctx.stroke();
    }
  }

  // ── Repaint: each square fades to its new brightness, the start delayed by its place in the canon ───────────
  function setTargets() {
    let max = 0;
    for (const cell of cells) max = Math.max(max, valueOf(cell, view));
    const scale = Math.log(1 + max);
    for (let i = 0; i < n; i++) {
      const v = valueOf(cells[i], view);
      target[i] = v ? 0.42 + 0.58 * (Math.log(1 + v) / scale) : 0;
    }
    from.set(current);
    if (PB.reducedMotion() || !rects.length) { current.set(target); draw(); return; }
    animStart = performance.now();
    if (!animating) { animating = true; requestAnimationFrame(step); }
  }
  function step(now) {
    let done = true;
    for (let i = 0; i < n; i++) {
      const local = (now - animStart - (i / n) * WAVE) / DURATION;
      if (local < 1) done = false;
      const k = local <= 0 ? 0 : local >= 1 ? 1 : PB.ease(local);
      current[i] = from[i] + (target[i] - from[i]) * k;
    }
    draw();
    if (done) animating = false; else requestAnimationFrame(step);
  }

  // ── Side panel / phone sheet ─────────────────────────────────────────────────────────────
  const viewMeta = () => views.find((v) => v.id === view);
  const personButton = (person, extra = "") => `<button type="button" class="name-btn" data-person="${person.id}">${esc(extra || person.name)}</button>`;
  const relevant = (personId) => view === "all" || (view === "others" ? personId !== SPURGEON : personId === view);

  function summaryHtml() {
    const meta = viewMeta();
    const lit = cells.filter((c) => valueOf(c, view));
    const works = lit.reduce((sum, c) => sum + valueOf(c, view), 0);
    const top = [...lit].sort((a, b) => valueOf(b, view) - valueOf(a, view) || a.i - b.i).slice(0, 6);
    const titled = meta.person ? meta.person.sermons.length : 0;
    let note = "";
    if (view === "all") note = `Spurgeon's sermons are ${formatNumber(PB.spurgeonWorks)} of these ${formatNumber(PB.totalWorks)}, so his choices set most of the brightness. Choose “Without Spurgeon” to see everyone else.`;
    else if (view === "others") note = `Everyone but Spurgeon: ${PB.preachers.length - 1} people. Their catalogues record far fewer Bible texts, so this map is sparse.`;
    else if (!titled) note = `None of these are listed as sermons, so no titles are shown here.`;
    else if (titled < works && view !== SPURGEON) note = `Titles on this page come from the first ${titled} of their sermons in the library.`;
    return `<div class="detail-inner" style="--tone: var(${meta.tone})">
      <p class="kicker">${view === "all" ? "Everyone in the library" : view === "others" ? "Everyone except Spurgeon" : familyOf(meta.person).label}</p>
      <h3>${meta.person ? personButton(meta.person) : esc(meta.label)}</h3>
      <p class="detail-big"><b>${formatNumber(lit.length)}</b> chapters · <b>${formatNumber(works)}</b> ${works === 1 ? "work" : "works"}</p>
      ${note ? `<p class="detail-note">${note}</p>` : ""}
      <p class="mini-head">Most taken chapters</p>
      <ol class="top-list">${top.map((c) => `<li><button type="button" data-cell="${c.i}"><span>${chapterName(c)}</span><b>${valueOf(c, view)}</b></button></li>`).join("")}</ol>
      <p class="detail-hint">${narrow.matches ? "Tap" : "Point at"} a square to see who took that chapter, and what they called it.</p>
    </div>`;
  }

  function chapterHtml(cell, closable) {
    const section = books[cell.b].section;
    const entries = Object.entries(cell.counts).sort((a, b) => b[1] - a[1]);
    const max = entries.length ? entries[0][1] : 1;
    const list = (PB.titles.get(cell.key) ?? []).filter(({ person }) => relevant(person.id));
    const counted = entries.filter(([id]) => relevant(id)).reduce((sum, [, c]) => sum + c, 0);
    const missing = counted - list.length;
    const shown = list.slice(0, 5);
    return `<div class="detail-inner" style="--tone: var(--${section})">
      <div class="detail-top"><p class="kicker">${SECTION_LABEL[section]}</p>${closable ? `<button type="button" class="icon-btn" data-unpin aria-label="Close">${icon("x", 16)}</button>` : ""}</div>
      <h3>${chapterName(cell)}<small>${cell.verses} verses</small></h3>
      <p class="detail-note">${cell.total ? `${plural(cell.total, "work")} in the library ${cell.total === 1 ? "takes" : "take"} this chapter as their main text, by ${plural(cell.voices, "person", "people")}.` : "No work in the library takes this chapter as its main text yet."}</p>
      ${entries.length ? `<ul class="voice-bars">${entries.map(([id, count]) => { const p = personById(id); return `<li class="${relevant(id) ? "" : "faded"}" style="--tone: var(${familyOf(p).tone})">${personButton(p, p.short)}<span class="vbar"><i style="width: ${Math.max(4, (count / max) * 100).toFixed(1)}%"></i></span><b>${count}</b></li>`; }).join("")}</ul>` : ""}
      ${shown.length ? `<p class="mini-head">Titles</p><ul class="title-list">${shown.map(({ person, sermon }) => `<li><span>${esc(sermon.t)}</span><small>${esc(sermon.r)} · ${esc(person.short)}${sermon.d ? ` · ${sermon.d.slice(0, 4)}` : ""}</small></li>`).join("")}</ul>` : ""}
      ${list.length > shown.length ? `<p class="detail-more">and ${plural(list.length - shown.length, "more title")}</p>` : ""}
      ${missing > 0 && counted ? `<p class="detail-more">${plural(missing, "work")} without a title on this page (commentaries, treatises, or sermons outside the sample).</p>` : ""}
      <a class="read-link" href="${readHref(cell)}">${icon("book", 15)}Read ${chapterName(cell)}${icon("arrowRight", 15)}</a>
    </div>`;
  }

  function renderDetail() {
    const shownCell = hovered >= 0 ? hovered : pinned;
    if (narrow.matches) {
      detail.innerHTML = summaryHtml();
      if (pinned >= 0) { sheet.innerHTML = chapterHtml(cells[pinned], true); sheet.inert = false; sheet.classList.add("open"); }
      else { sheet.classList.remove("open"); sheet.inert = true; }
      return;
    }
    sheet.classList.remove("open"); sheet.inert = true;
    detail.innerHTML = shownCell >= 0 ? chapterHtml(cells[shownCell], pinned >= 0 && hovered < 0) : summaryHtml();
  }

  // ── Pointer and keyboard ─────────────────────────────────────────────────────────────────
  function cellAt(event) {
    const box = canvas.getBoundingClientRect();
    const px = event.clientX - box.left, py = event.clientY - box.top;
    let best = -1, bestDistance = event.pointerType === "touch" ? 14 : 7;
    for (let i = 0; i < n; i++) {
      const [x, y, s] = rects[i];
      const d = Math.hypot(px - (x + s / 2), py - (y + s / 2));
      if (d < bestDistance) { best = i; bestDistance = d; }
    }
    return best;
  }
  let pendingMove = null;
  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    pendingMove = event;
    requestAnimationFrame(() => {
      if (!pendingMove) return;
      const i = cellAt(pendingMove); pendingMove = null;
      if (i === hovered) return;
      hovered = i; canvas.style.cursor = i >= 0 ? "pointer" : "default";
      draw(); renderDetail();
    });
  });
  canvas.addEventListener("pointerleave", () => { pendingMove = null; if (hovered < 0) return; hovered = -1; draw(); renderDetail(); });
  canvas.addEventListener("click", (event) => {
    const i = cellAt(event);
    pinned = i === pinned ? -1 : i;
    hovered = event.pointerType === "mouse" || event.pointerType === "" ? hovered : -1;
    if (narrow.matches) hovered = -1;
    draw(); renderDetail();
  });
  canvas.addEventListener("keydown", (event) => {
    const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!move && event.key !== "Enter") return;
    event.preventDefault();
    if (event.key === "Enter" && pinned >= 0) { location.href = readHref(cells[pinned]); return; }
    pinned = Math.max(0, Math.min(n - 1, (pinned < 0 ? -1 : pinned) + (move ?? 1)));
    hovered = -1; draw(); renderDetail();
  });
  root.addEventListener("click", (event) => {
    const jump = event.target.closest("[data-cell]");
    if (jump) { pinned = Number(jump.dataset.cell); hovered = -1; draw(); renderDetail(); return; }
    if (event.target.closest("[data-unpin]")) { pinned = -1; draw(); renderDetail(); return; }
    const chip = event.target.closest("[data-view]");
    if (chip) setView(chip.dataset.view);
  });

  function setView(id) {
    if (!views.some((v) => v.id === id)) throw new Error(`hero: unknown view "${id}"; expected "all", "others" or a person id with Bible texts`);
    view = id;
    for (const chip of root.querySelectorAll("[data-view]")) chip.setAttribute("aria-pressed", String(chip.dataset.view === id));
    const chip = root.querySelector(`[data-view="${id}"]`);
    const strip = chip.parentElement;
    if (strip.scrollWidth > strip.clientWidth) strip.scrollTo({ left: chip.offsetLeft - strip.clientWidth / 2 + chip.offsetWidth / 2, behavior: PB.reducedMotion() ? "auto" : "smooth" });
    setTargets(); renderDetail();
  }

  // ── Start, resize, theme ─────────────────────────────────────────────────────────────────
  let lastWidth = 0;
  new ResizeObserver(([entry]) => {
    const width = Math.floor(entry.contentRect.width);
    if (!width || width === lastWidth) return;
    lastWidth = width; layout(width); draw();
  }).observe(box);
  addEventListener("themechange", () => { palette = null; draw(); });
  narrow.addEventListener("change", renderDetail);
  document.fonts.ready.then(() => { if (lastWidth) { layout(lastWidth); draw(); } });
  layout(Math.floor(box.clientWidth) || 800);
  lastWidth = Math.floor(box.clientWidth);
  for (let i = 0; i < n; i++) current[i] = 0;
  setTargets();
  renderDetail();
  return { setView };
};
