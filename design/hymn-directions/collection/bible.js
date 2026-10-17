// 01 · Every chapter, sung in our hymns. The approved "every chapter, lit by our teachers" section of the Preachers page
// (design/authors-directions/teachers/bible.js), with hymns in place of teachers' works: one square per chapter, lit by
// how many hymns take it as their text; chips choose a hymn book; point at a chapter to see its hymns, each opening
// that hymn's page.
window.Sections = window.Sections || {};
(() => {
  const SECTION_LABEL = { history: "History", poetry: "Poetry & Wisdom", prophets: "Prophets", gospels: "Gospels & Acts", epistles: "Epistles", revelation: "Revelation" };
  const WAVE = 520, DURATION = 560;
  const SHOWN_TITLES = 8;
  const esc = (text) => String(text).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const plural = (n, word, many = `${word}s`) => `${formatNumber(n)} ${n === 1 ? word : many}`;
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const css = (rgb) => `rgb(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0})`;
  function rgbOf(token) {
    const value = Frame.color(token), hex = value.replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error(`hymns bible: colour ${token} is "${value}", expected a 6-digit hex colour`);
    return [0, 2, 4].map((at) => parseInt(hex.slice(at, at + 2), 16));
  }

  function buildData() {
    const { books, groups, hymns } = HYMNS;
    const cells = [], cellOf = new Map();
    books.forEach((book, b) => book.chapters.forEach((verses, c) => {
      const key = `${b + 1}:${c + 1}`;
      const cell = { i: cells.length, b, c: c + 1, key, verses, counts: {}, total: 0, hymns: [] };
      cells.push(cell); cellOf.set(key, cell);
    }));
    for (const h of hymns) {
      if (!h.v) continue;
      const cell = cellOf.get(`${Math.floor(h.v / 1e6)}:${Math.floor(h.v / 1e3) % 1000}`);
      cell.counts[h.g] = (cell.counts[h.g] ?? 0) + 1; cell.total++; cell.hymns.push(h);
    }
    const groupStats = groups.map((g) => ({ ...g, chapters: cells.filter((c) => c.counts[g.id]).length, hymns: hymns.filter((h) => h.g === g.id && h.v).length }));
    return { books, cells, groups: groupStats, litCount: cells.filter((c) => c.total).length, onChapters: hymns.filter((h) => h.v).length };
  }

  function mount(section) {
    const D = buildData();
    const { books, cells } = D, n = cells.length;
    const narrow = matchMedia("(max-width: 899px)");
    const groupById = new Map(D.groups.map((g) => [g.id, g]));
    const valueOf = (cell, view) => view === "all" ? cell.total : cell.counts[view] ?? 0;
    const chapterName = (cell) => `${books[cell.b].name === "Psalms" ? "Psalm" : books[cell.b].name} ${cell.c}`;
    const readHref = (cell) => `/read/kjv/${books[cell.b].code}/${cell.c}`;
    const hymnHref = (h) => h.id === "ccel-olney-hymns-41-amazing-grace-how-sweet-the-sound" ? "../d/" : `/study/hymns/${h.id}`;
    const views = [{ id: "all", label: "Every hymn", chapters: D.litCount, tone: "--accent" }, ...D.groups.map((g) => ({ id: g.id, label: g.short, chapters: g.chapters, tone: g.tone, group: g }))];

    section.style.setProperty("--tone", "var(--accent)");
    section.innerHTML = `
      <header class="t-head"><span class="t-num">01</span><div><p class="kicker">The whole Bible</p>
        <h2>Every chapter, sung in our <em>hymns</em></h2>
        <p>All ${formatNumber(n)} chapters of the Bible, each lit by how many of our hymns take it as their text. Choose a hymn book to see the chapters it sang.</p></div></header>
      <div class="bib-bar">
        <p class="kicker">Light up the Bible for</p>
        <div class="bib-chips">${views.map((v) => `<button type="button" class="bib-chip" data-bib-view="${v.id}" aria-pressed="${v.id === "all"}" style="--tone: var(${v.tone})"><i class="bib-dot"></i>${esc(v.label)}<b>${formatNumber(v.chapters)}</b></button>`).join("")}</div>
      </div>
      <div class="bib-grid">
        <div class="bib-card">
          <div class="bib-key"><p>One square is one chapter, Genesis to Revelation, reading down each column. The brighter it is, the more hymns take that chapter as their text.</p>
            <span class="bib-scale" aria-hidden="true">fewer<i></i><i></i><i></i><i></i><i></i>more</span></div>
          <div class="bib-canvas-box"><canvas tabindex="0" aria-label="Chapter map of the Bible. Use the arrow keys to move between chapters, Enter to read one."></canvas></div>
          <div class="bib-legend">${Object.entries(SECTION_LABEL).map(([key, label]) => `<span><i style="background: var(--${key})"></i>${label}</span>`).join("")}<span class="bib-legend-quiet"><i></i>No hymn yet</span></div>
        </div>
        <aside class="bib-detail" aria-live="polite"></aside>
      </div>
      <div class="bib-sheet" role="dialog" aria-label="Chapter" inert></div>`;

    const canvas = section.querySelector("canvas"), box = section.querySelector(".bib-canvas-box");
    const panel = section.querySelector(".bib-detail"), sheet = section.querySelector(".bib-sheet");
    // The side panel is always exactly as tall as the chapter map beside it; anything longer scrolls, with the pill outside.
    const panelScroll = OutsideScroll.wrap(panel), detail = panelScroll.content;
    const card = section.querySelector(".bib-card");
    new ResizeObserver(() => { panel.style.height = narrow.matches ? "" : `${card.offsetHeight}px`; }).observe(card);
    const ctx = canvas.getContext("2d");
    let view = "all", hovered = -1, pinned = -1, expanded = false;
    const current = new Float32Array(n), from = new Float32Array(n), target = new Float32Array(n);
    let animStart = 0, animating = false, rects = [], labels = [], cssWidth = 0, cssHeight = 0, palette = null;

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
      palette = { quiet: mix(rgbOf("--surface"), rgbOf("--line"), 0.55), sections: {}, ink: Frame.color("--ink"), muted: Frame.color("--muted") };
      for (const key of Object.keys(SECTION_LABEL)) palette.sections[key] = rgbOf(`--${key}`);
    }
    function draw() {
      if (!palette) readPalette();
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      ctx.font = '500 10px "Archivo Variable", system-ui, sans-serif';
      const activeBook = hovered >= 0 ? cells[hovered].b : pinned >= 0 ? cells[pinned].b : -1;
      for (const label of labels) {
        if (!label.text) continue;
        ctx.fillStyle = label.b === activeBook ? palette.ink : palette.muted;
        ctx.fillText(label.text, label.x, label.y);
      }
      for (let i = 0; i < n; i++) {
        const [x, y, s] = rects[i];
        ctx.fillStyle = css(mix(palette.quiet, palette.sections[books[cells[i].b].section], current[i]));
        ctx.beginPath(); ctx.roundRect(x, y, s, s, s > 10 ? 3 : 2); ctx.fill();
      }
      for (const i of [pinned, hovered]) {
        if (i < 0) continue;
        const [x, y, s] = rects[i];
        ctx.strokeStyle = palette.ink; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(x - 1.5, y - 1.5, s + 3, s + 3, 4); ctx.stroke();
      }
    }
    function setTargets() {
      let max = 0;
      for (const cell of cells) max = Math.max(max, valueOf(cell, view));
      const scale = Math.log(1 + max);
      for (let i = 0; i < n; i++) { const v = valueOf(cells[i], view); target[i] = v ? 0.42 + 0.58 * (Math.log(1 + v) / scale) : 0; }
      from.set(current);
      if (reducedMotion() || !rects.length) { current.set(target); draw(); return; }
      animStart = performance.now();
      if (!animating) { animating = true; requestAnimationFrame(step); }
    }
    function step(now) {
      let done = true;
      for (let i = 0; i < n; i++) {
        const local = (now - animStart - (i / n) * WAVE) / DURATION;
        if (local < 1) done = false;
        const k = local <= 0 ? 0 : local >= 1 ? 1 : ease(local);
        current[i] = from[i] + (target[i] - from[i]) * k;
      }
      draw();
      if (done) animating = false; else requestAnimationFrame(step);
    }

    const viewMeta = () => views.find((v) => v.id === view);
    function summaryHtml() {
      const meta = viewMeta();
      const lit = cells.filter((c) => valueOf(c, view));
      const sung = lit.reduce((sum, c) => sum + valueOf(c, view), 0);
      const top = [...lit].sort((a, b) => valueOf(b, view) - valueOf(a, view) || a.i - b.i).slice(0, 6);
      const psalms = cells.filter((c) => books[c.b].code === "PSA").reduce((s, c) => s + c.total, 0);
      const note = view === "all"
        ? `Watts set nearly every psalm, so the Psalms hold ${formatNumber(psalms)} of these ${formatNumber(D.onChapters)} hymns and are the brightest block. Choose a book to see its own map.`
        : `${esc(meta.group.label)}, ${meta.group.year}. ${meta.group.who}.`;
      return `<div class="bib-inner" style="--tone: var(${meta.tone})">
        <p class="kicker">${view === "all" ? "Every hymn with its words held" : "One hymn book"}</p>
        <h3>${esc(view === "all" ? "Every hymn" : meta.group.label)}</h3>
        <p class="bib-big"><b>${formatNumber(lit.length)}</b> chapters · <b>${formatNumber(sung)}</b> ${sung === 1 ? "hymn" : "hymns"}</p>
        <p class="bib-note">${note}</p>
        <p class="bib-mini">Most sung chapters</p>
        <ol class="bib-top">${top.map((c) => `<li><button type="button" data-bib-cell="${c.i}"><span>${chapterName(c)}</span><b>${valueOf(c, view)}</b></button></li>`).join("")}</ol>
        <p class="bib-hint">${narrow.matches ? "Tap a square" : "Point at a square, or click it to keep it open,"} to see the hymns on that chapter and open one.</p>
      </div>`;
    }
    function chapterHtml(cell, closable) {
      const section = books[cell.b].section;
      const entries = Object.entries(cell.counts).sort((a, b) => b[1] - a[1]);
      const max = entries.length ? entries[0][1] : 1;
      const list = cell.hymns.filter((h) => view === "all" || h.g === view);
      const shown = expanded ? list : list.slice(0, SHOWN_TITLES);
      return `<div class="bib-inner" style="--tone: var(--${section})">
        <div class="bib-top-row"><p class="kicker">${SECTION_LABEL[section]}</p>${closable ? `<button type="button" class="bib-icon-btn" data-bib-unpin aria-label="Close">${icon("x", 16)}</button>` : ""}</div>
        <h3>${chapterName(cell)}<small>${cell.verses} verses</small></h3>
        <p class="bib-note">${cell.total ? `${plural(cell.total, "hymn")} ${cell.total === 1 ? "takes" : "take"} this chapter as ${cell.total === 1 ? "its" : "their"} text.` : "No hymn whose words we hold takes this chapter as its text."}</p>
        ${entries.length ? `<ul class="bib-bars">${entries.map(([id, count]) => { const g = groupById.get(id); return `<li class="${view === "all" || view === id ? "" : "bib-faded"}" style="--tone: var(${g.tone})"><span class="bib-name">${esc(g.short)}</span><span class="bib-vbar"><i style="width: ${Math.max(4, (count / max) * 100).toFixed(1)}%"></i></span><b>${count}</b></li>`; }).join("")}</ul>` : ""}
        ${shown.length ? `<p class="bib-mini">Open a hymn</p><ul class="bib-titles">${shown.map((h) => `<li><a class="bib-work" href="${hymnHref(h)}"><span>${esc(h.t)}</span>${icon("arrowRight", 13)}</a><small>${esc(h.r)} · ${esc(groupById.get(h.g).short)} · ${h.y}</small></li>`).join("")}</ul>` : ""}
        ${list.length > shown.length ? `<button type="button" class="bib-more" data-bib-more>Show all ${formatNumber(list.length)} hymns</button>` : ""}
        <a class="bib-read" href="${readHref(cell)}">${icon("book", 15)}Read ${chapterName(cell)}${icon("arrowRight", 15)}</a>
      </div>`;
    }
    function renderDetail() {
      const shownCell = hovered >= 0 ? hovered : pinned;
      if (narrow.matches) {
        detail.innerHTML = summaryHtml();
        if (pinned >= 0) { sheet.innerHTML = chapterHtml(cells[pinned], true); sheet.inert = false; sheet.classList.add("bib-open"); }
        else { sheet.classList.remove("bib-open"); sheet.inert = true; }
        return;
      }
      sheet.classList.remove("bib-open"); sheet.inert = true;
      detail.innerHTML = shownCell >= 0 ? chapterHtml(cells[shownCell], pinned >= 0 && hovered < 0) : summaryHtml();
      panelScroll.reset();
    }
    function pin(i) { pinned = i; expanded = false; hovered = -1; draw(); renderDetail(); }
    function cellAt(event) {
      const bounds = canvas.getBoundingClientRect(), px = event.clientX - bounds.left, py = event.clientY - bounds.top;
      let best = -1, bestDistance = event.pointerType === "touch" ? 14 : 7;
      for (let i = 0; i < n; i++) { const [x, y, s] = rects[i]; const d = Math.hypot(px - (x + s / 2), py - (y + s / 2)); if (d < bestDistance) { best = i; bestDistance = d; } }
      return best;
    }
    let pendingMove = null;
    canvas.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      const scheduled = pendingMove !== null;
      pendingMove = event;
      if (scheduled) return;
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
      pinned = i === pinned ? -1 : i; expanded = false;
      if (narrow.matches || event.pointerType !== "mouse") hovered = -1;
      draw(); renderDetail();
    });
    canvas.addEventListener("keydown", (event) => {
      const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!move && event.key !== "Enter") return;
      event.preventDefault();
      if (event.key === "Enter" && pinned >= 0) { location.href = readHref(cells[pinned]); return; }
      pin(Math.max(0, Math.min(n - 1, (pinned < 0 ? -1 : pinned) + (move ?? 1))));
    });
    section.addEventListener("click", (event) => {
      const jump = event.target.closest("[data-bib-cell]");
      if (jump) { pin(Number(jump.dataset.bibCell)); return; }
      if (event.target.closest("[data-bib-unpin]")) { pin(-1); return; }
      if (event.target.closest("[data-bib-more]")) { expanded = true; renderDetail(); return; }
      const chip = event.target.closest("[data-bib-view]");
      if (chip) setView(chip.dataset.bibView);
    });
    addEventListener("keydown", (event) => { if (event.key === "Escape" && narrow.matches && pinned >= 0) pin(-1); });
    function setView(id) {
      view = id;
      for (const chip of section.querySelectorAll("[data-bib-view]")) chip.setAttribute("aria-pressed", String(chip.dataset.bibView === id));
      setTargets(); renderDetail();
    }

    let lastWidth = 0;
    new ResizeObserver(([entry]) => { const width = Math.floor(entry.contentRect.width); if (!width || width === lastWidth) return; lastWidth = width; layout(width); draw(); }).observe(box);
    addEventListener("themechange", () => { palette = null; draw(); });
    narrow.addEventListener("change", renderDetail);
    document.fonts.ready.then(() => { if (lastWidth) { layout(lastWidth); draw(); } });
    layout(Math.floor(box.clientWidth) || 800);
    lastWidth = Math.floor(box.clientWidth);
    renderDetail(); draw();
    const firstLight = new IntersectionObserver((entries) => { if (!entries.some((e) => e.isIntersecting)) return; firstLight.disconnect(); setTargets(); }, { threshold: 0.15 });
    firstLight.observe(box);
  }

  Sections.bible = { mount };
})();
