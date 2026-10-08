// 01 · The whole Bible: all 1,189 chapters on one canvas, each lit by how many of our teachers' works take it as a
// main text. Chips repaint it with a wave that runs Genesis → Revelation; hover (or tap) a chapter for who, how many,
// and the titles, each linking to the work itself. Ported from the preached-Bible direction's hero.
window.Sections = window.Sections || {};
(() => {
  const SPURGEON = "author-charles-spurgeon";
  const SECTION_LABEL = { history: "History", poetry: "Poetry & Wisdom", prophets: "Prophets", gospels: "Gospels & Acts", epistles: "Epistles", revelation: "Revelation" };
  const GENRE_WORD = { sermon: "sermon", commentary: "commentary", treatise: "treatise", lecture: "lecture" };
  const WAVE = 520, DURATION = 560; // ms: how long the wave takes to cross the Bible, and each square's own fade
  const SHOWN_TITLES = 6;

  const esc = (text) => String(text).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const plural = (n, word, many = `${word}s`) => `${formatNumber(n)} ${n === 1 ? word : many}`;
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const css = (rgb) => `rgb(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0})`;
  function rgbOf(token) {
    const value = Frame.color(token);
    const hex = value.replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error(`bible: colour ${token} is "${value}", expected a 6-digit hex colour`);
    return [0, 2, 4].map((at) => parseInt(hex.slice(at, at + 2), 16));
  }

  // ── Data: every chapter in canon order with who took it as a main text, and every titled work filed by chapter ──
  function buildData() {
    const { books, people, chapters } = AUTHORS;
    const cells = [];
    books.forEach((book, b) => book.chapters.forEach((verses, c) => {
      const key = `${b + 1}:${c + 1}`;
      const counts = chapters[key] ?? {};
      const total = Object.values(counts).reduce((n, v) => n + v, 0);
      cells.push({ i: cells.length, b, c: c + 1, key, verses, counts, total, voices: Object.keys(counts).length });
    }));
    const keyOfVerse = (v) => `${Math.floor(v / 1e6)}:${Math.floor(v / 1e3) % 1000}`;
    const titles = new Map();
    const sharedUrl = new Map(); // person id → Map(url → how many of their works point at it)
    for (const person of people) {
      const urls = new Map();
      for (const work of person.passages) if (work.u) urls.set(work.u, (urls.get(work.u) ?? 0) + 1);
      sharedUrl.set(person.id, urls);
      for (const work of person.passages) {
        const key = keyOfVerse(work.v);
        if (!titles.has(key)) titles.set(key, []);
        titles.get(key).push({ person, work });
      }
    }
    for (const list of titles.values()) list.sort((a, b) => a.work.v - b.work.v || a.person.born - b.person.born);
    const teachers = people.map((person) => {
      const lit = cells.filter((cell) => cell.counts[person.id]);
      return { person, chapters: lit.length };
    }).filter((t) => t.chapters).sort((a, b) => b.chapters - a.chapters);
    const totalWorks = cells.reduce((n, cell) => n + cell.total, 0);
    const spurgeonWorks = cells.reduce((n, cell) => n + (cell.counts[SPURGEON] ?? 0), 0);
    return { books, cells, titles, sharedUrl, teachers, totalWorks, spurgeonWorks, litCount: cells.filter((c) => c.total).length };
  }

  function mount(section) {
    const D = buildData();
    const { books, cells } = D;
    const n = cells.length;
    const narrow = matchMedia("(max-width: 899px)");

    const valueOf = (cell, view) => view === "all" ? cell.total : view === "others" ? cell.total - (cell.counts[SPURGEON] ?? 0) : cell.counts[view] ?? 0;
    const chapterName = (cell) => `${books[cell.b].name === "Psalms" ? "Psalm" : books[cell.b].name} ${cell.c}`;
    const readHref = (cell) => `/read/kjv/${books[cell.b].code}/${cell.c}`;

    const views = [
      { id: "all", label: "Everyone", chapters: D.litCount, tone: "--accent" },
      { id: "others", label: "Without Spurgeon", chapters: cells.filter((c) => valueOf(c, "others")).length, tone: "--muted" },
      ...D.teachers.map((t) => ({ id: t.person.id, label: t.person.short, chapters: t.chapters, tone: familyOf(t.person).tone, person: t.person })),
    ];

    section.style.setProperty("--tone", "var(--accent)");
    section.innerHTML = `
      <header class="t-head"><span class="t-num">01</span><div><p class="kicker">The whole Bible</p>
        <h2>Every chapter, lit by our <em>teachers</em></h2>
        <p>All ${formatNumber(n)} chapters of the Bible, each lit by how many of our teachers' works take it as their main text. Choose a teacher to see the chapters they gave their work to.</p></div></header>
      <div class="bib-bar">
        <p class="kicker">Light up the Bible for</p>
        <div class="bib-chips">${views.map((v) => `<button type="button" class="bib-chip" data-bib-view="${v.id}" aria-pressed="${v.id === "all"}" style="--tone: var(${v.tone})"><i class="bib-dot"></i>${esc(v.label)}<b>${formatNumber(v.chapters)}</b></button>`).join("")}</div>
      </div>
      <div class="bib-grid">
        <div class="bib-card">
          <div class="bib-key"><p>One square is one chapter, Genesis to Revelation, reading down each column. The brighter it is, the more works take that chapter as their main text.</p>
            <span class="bib-scale" aria-hidden="true">fewer<i></i><i></i><i></i><i></i><i></i>more</span></div>
          <div class="bib-canvas-box"><canvas tabindex="0" aria-label="Chapter map of the Bible. Use the arrow keys to move between chapters, Enter to read one."></canvas></div>
          <div class="bib-legend">${Object.entries(SECTION_LABEL).map(([key, label]) => `<span><i style="background: var(--${key})"></i>${label}</span>`).join("")}<span class="bib-legend-quiet"><i></i>No work yet</span></div>
        </div>
        <aside class="bib-detail" aria-live="polite"></aside>
      </div>
      <div class="bib-sheet" role="dialog" aria-label="Chapter" inert></div>`;

    const canvas = section.querySelector("canvas");
    const box = section.querySelector(".bib-canvas-box");
    const detail = section.querySelector(".bib-detail");
    const sheet = section.querySelector(".bib-sheet");
    const ctx = canvas.getContext("2d");

    let view = "all", hovered = -1, pinned = -1, expanded = false;
    const current = new Float32Array(n), from = new Float32Array(n), target = new Float32Array(n);
    let animStart = 0, animating = false;
    let rects = [], labels = [], cssWidth = 0, cssHeight = 0, palette = null;

    // ── Layout: books flow left to right in blocks eight chapters tall; a new section leaves a wider gap ─────────
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
      ctx.textBaseline = "alphabetic";
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

    // ── Repaint: each square fades to its new brightness, the start delayed by its place in the canon ────────────
    function setTargets() {
      let max = 0;
      for (const cell of cells) max = Math.max(max, valueOf(cell, view));
      const scale = Math.log(1 + max);
      for (let i = 0; i < n; i++) {
        const v = valueOf(cells[i], view);
        target[i] = v ? 0.42 + 0.58 * (Math.log(1 + v) / scale) : 0;
      }
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

    // ── Side panel / phone sheet ───────────────────────────────────────────────────────────────────────────────
    const viewMeta = () => views.find((v) => v.id === view);
    const personButton = (person, label) => `<button type="button" class="bib-name" data-bib-person="${person.id}">${esc(label ?? person.name)}</button>`;
    const relevant = (personId) => view === "all" || (view === "others" ? personId !== SPURGEON : personId === view);

    function summaryHtml() {
      const meta = viewMeta();
      const lit = cells.filter((c) => valueOf(c, view));
      const works = lit.reduce((sum, c) => sum + valueOf(c, view), 0);
      const top = [...lit].sort((a, b) => valueOf(b, view) - valueOf(a, view) || a.i - b.i).slice(0, 6);
      let note = "";
      if (view === "all") note = `Spurgeon's sermons are ${formatNumber(D.spurgeonWorks)} of these ${formatNumber(D.totalWorks)}, so his choices set most of the brightness. Choose “Without Spurgeon” to see every other teacher.`;
      else if (view === "others") note = `Every teacher but Spurgeon: ${D.teachers.length - 1} of them. Their works in the library record far fewer Bible texts, so this map is sparse.`;
      return `<div class="bib-inner" style="--tone: var(${meta.tone})">
        <p class="kicker">${view === "all" ? "Every teacher in the library" : view === "others" ? "Every teacher except Spurgeon" : familyOf(meta.person).label}</p>
        <h3>${meta.person ? personButton(meta.person) : esc(meta.label)}${meta.person ? `<small>${lifeLabel(meta.person)}</small>` : ""}</h3>
        <p class="bib-big"><b>${formatNumber(lit.length)}</b> chapters · <b>${formatNumber(works)}</b> ${works === 1 ? "work" : "works"}</p>
        ${note ? `<p class="bib-note">${note}</p>` : ""}
        <p class="bib-mini">Most taken chapters</p>
        <ol class="bib-top">${top.map((c) => `<li><button type="button" data-bib-cell="${c.i}"><span>${chapterName(c)}</span><b>${valueOf(c, view)}</b></button></li>`).join("")}</ol>
        <p class="bib-hint">${narrow.matches ? "Tap a square" : "Point at a square, or click it to keep it open,"} to see who took that chapter and read what they wrote.</p>
      </div>`;
    }

    function workLink({ person, work }) {
      const volume = (D.sharedUrl.get(person.id).get(work.u) ?? 0) > 1;
      const year = work.d ? work.d.slice(0, 4) : "";
      const kind = work.g !== "sermon" && GENRE_WORD[work.g] ? ` · ${GENRE_WORD[work.g]}` : "";
      const title = work.u
        ? `<a class="bib-work" href="${esc(work.u)}" target="_blank" rel="noopener" aria-label="${esc(work.t)}, ${volume ? "read in the volume" : "read it"} (opens a new tab)"><span>${esc(work.t)}</span>${icon("arrowUp", 13)}</a>`
        : `<span class="bib-work-plain">${esc(work.t)}</span>`;
      return `<li>${title}<small>${esc(work.r)} · ${esc(person.short)}${year ? ` · ${year}` : ""}${kind}${work.u && volume ? ` · <em>in the volume</em>` : ""}</small></li>`;
    }

    function chapterHtml(cell, closable) {
      const section = books[cell.b].section;
      const entries = Object.entries(cell.counts).sort((a, b) => b[1] - a[1]);
      const max = entries.length ? entries[0][1] : 1;
      const list = (D.titles.get(cell.key) ?? []).filter(({ person }) => relevant(person.id));
      const counted = entries.filter(([id]) => relevant(id)).reduce((sum, [, c]) => sum + c, 0);
      const elsewhere = counted - list.length;
      const shown = expanded ? list : list.slice(0, SHOWN_TITLES);
      return `<div class="bib-inner" style="--tone: var(--${section})">
        <div class="bib-top-row"><p class="kicker">${SECTION_LABEL[section]}</p>${closable ? `<button type="button" class="bib-icon-btn" data-bib-unpin aria-label="Close">${icon("x", 16)}</button>` : ""}</div>
        <h3>${chapterName(cell)}<small>${cell.verses} verses</small></h3>
        <p class="bib-note">${cell.total ? `${plural(cell.total, "work")} in the library ${cell.total === 1 ? "takes" : "take"} this chapter as their main text, by ${plural(cell.voices, "teacher")}.` : "No work in the library takes this chapter as its main text yet."}</p>
        ${entries.length ? `<ul class="bib-bars">${entries.map(([id, count]) => { const p = personById(id); return `<li class="${relevant(id) ? "" : "bib-faded"}" style="--tone: var(${familyOf(p).tone})">${personButton(p, p.short)}<span class="bib-vbar"><i style="width: ${Math.max(4, (count / max) * 100).toFixed(1)}%"></i></span><b>${count}</b></li>`; }).join("")}</ul>` : ""}
        ${shown.length ? `<p class="bib-mini">Read their works</p><ul class="bib-titles">${shown.map(workLink).join("")}</ul>` : ""}
        ${list.length > shown.length ? `<button type="button" class="bib-more" data-bib-more>Show all ${formatNumber(list.length)} titles</button>` : ""}
        ${elsewhere > 0 ? `<p class="bib-more-note">${plural(elsewhere, "more work")} ${elsewhere === 1 ? "takes" : "take"} this chapter alongside an earlier main text, so ${elsewhere === 1 ? "it is" : "they are"} listed under that chapter.</p>` : ""}
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
    }
    function pin(i) { pinned = i; expanded = false; hovered = -1; draw(); renderDetail(); }

    // ── Pointer and keyboard ───────────────────────────────────────────────────────────────────────────────────
    function cellAt(event) {
      const bounds = canvas.getBoundingClientRect();
      const px = event.clientX - bounds.left, py = event.clientY - bounds.top;
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
      pinned = i === pinned ? -1 : i;
      expanded = false;
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
      const who = event.target.closest("[data-bib-person]");
      if (who) { window.Teachers?.openProfile(who.dataset.bibPerson); return; }
      const jump = event.target.closest("[data-bib-cell]");
      if (jump) { pin(Number(jump.dataset.bibCell)); return; }
      if (event.target.closest("[data-bib-unpin]")) { pin(-1); return; }
      if (event.target.closest("[data-bib-more]")) { expanded = true; renderDetail(); return; }
      const chip = event.target.closest("[data-bib-view]");
      if (chip) setView(chip.dataset.bibView);
    });
    addEventListener("keydown", (event) => { if (event.key === "Escape" && narrow.matches && pinned >= 0) pin(-1); });

    function setView(id) {
      if (!views.some((v) => v.id === id)) throw new Error(`bible: unknown view "${id}"; expected "all", "others" or the id of a teacher with Bible texts`);
      view = id;
      for (const chip of section.querySelectorAll("[data-bib-view]")) chip.setAttribute("aria-pressed", String(chip.dataset.bibView === id));
      const chip = section.querySelector(`[data-bib-view="${id}"]`);
      const strip = chip.parentElement;
      if (strip.scrollWidth > strip.clientWidth) strip.scrollTo({ left: chip.offsetLeft - strip.offsetLeft - strip.clientWidth / 2 + chip.offsetWidth / 2, behavior: reducedMotion() ? "auto" : "smooth" });
      setTargets(); renderDetail();
    }

    // ── Start, resize, theme ───────────────────────────────────────────────────────────────────────────────────
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
    renderDetail();
    // The first wave runs when the map scrolls into view, so it is seen rather than spent off-screen.
    draw();
    const firstLight = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      firstLight.disconnect();
      setTargets();
    }, { threshold: 0.15 });
    firstLight.observe(box);
  }

  Sections.bible = { mount };
})();
