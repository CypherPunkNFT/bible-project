// 02 · Hymns through the Bible. The approved "teachers through the Bible" section of the Preachers page
// (design/authors-directions/teachers/through.js), with hymn books in the left list, a ring of 66 spokes (one per book
// of the Bible, as long as the chosen hymn book's hymns on it), and the individual hymns on the chosen book in the
// right panel, each opening its own page. Hymn books carry one date each, so the year slider is left out.
window.Sections = window.Sections || {};
(() => {
  const SECTION_LABEL = { history: "History", poetry: "Poetry & Wisdom", prophets: "Prophets", gospels: "Gospels & Acts", epistles: "Epistles", revelation: "Revelation" };
  const R0 = 92, R1 = 240, STEP = (Math.PI * 2) / 66, PAD = 0.012;
  // The scale stops at 50 hymns (owner, 2026-10-17: one book "drowns out everything else"). A book with more reaches the
  // edge and gets a dashed tip; its real count still shows in the centre and in the list.
  const CAP = 50;
  const esc = (text) => String(text).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const plural = (n, word, many = `${word}s`) => `${formatNumber(n)} ${n === 1 ? word : many}`;
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DISC = { psalms: "PI", hss: "HS", divine: "DS", newton: "JN", cowper: "WC" };

  function buildData() {
    const { books, groups, hymns } = HYMNS;
    const bookOf = (h) => Math.floor(h.v / 1e6) - 1;
    const shelves = groups.map((g) => {
      const byBook = books.map(() => []);
      for (const h of hymns) if (h.g === g.id && h.v) byBook[bookOf(h)].push(h);
      return { id: g.id, group: g, byBook, totals: byBook.map((l) => l.length), works: hymns.filter((h) => h.g === g.id && h.v).length, all: hymns.filter((h) => h.g === g.id).length };
    });
    const everyone = { id: "all", group: null, byBook: books.map((_, b) => shelves.flatMap((s) => s.byBook[b]).sort((x, y) => x.v - y.v)), works: hymns.filter((h) => h.v).length, all: hymns.length };
    everyone.totals = everyone.byBook.map((l) => l.length);
    for (const s of [everyone, ...shelves]) { s.max = Math.max(...s.totals); s.bookCount = s.totals.filter(Boolean).length; s.top = s.totals.indexOf(s.max); }
    return { books, shelves, everyone, byId: new Map([everyone, ...shelves].map((s) => [s.id, s])), groupById: new Map(groups.map((g) => [g.id, g])) };
  }

  function mount(section) {
    const D = buildData();
    const { books } = D;
    const angle = (b) => -Math.PI / 2 + b * STEP;
    const point = (r, a) => `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
    const radiusOf = (fraction) => R0 + (R1 - R0) * fraction;
    const wedge = (b, r) => {
      const a0 = angle(b) + PAD, a1 = angle(b + 1) - PAD, outer = Math.max(R0 + 1.5, r);
      return `M${point(R0, a0)} L${point(outer, a0)} A${outer} ${outer} 0 0 1 ${point(outer, a1)} L${point(R0, a1)} A${R0} ${R0} 0 0 0 ${point(R0, a0)}Z`;
    };
    const bookName = (b, chapter) => (books[b].name === "Psalms" && chapter ? "Psalm" : books[b].name);
    const hymnHref = (h) => h.id === "ccel-olney-hymns-41-amazing-grace-how-sweet-the-sound" ? "../d/" : `/study/hymns/${h.id}`;

    const railItem = (s) => {
      const g = s.group;
      return `<button type="button" class="thr-t" data-thr-teacher="${s.id}" aria-pressed="${s.id === "all"}" style="--tone: var(${g ? g.tone : "--accent"})">
        <span class="thr-disc">${g ? DISC[g.id] : icon("library", 16)}</span>
        <span class="thr-t-text"><span class="thr-full">${g ? esc(g.label.replace("Olney Hymns · ", "")) : "Every hymn"}</span><span class="thr-short">${g ? esc(g.short) : "Every hymn"}</span>
          <small>${g ? `${g.year} · ${g.id === "newton" || g.id === "cowper" ? "Olney Hymns" : g.who}` : `${D.shelves.length} books and hands, together`}</small></span>
        <b>${formatNumber(s.works)}</b></button>`;
    };

    section.style.setProperty("--tone", "var(--poetry)");
    section.innerHTML = `
      <header class="t-head"><span class="t-num">02</span><div><p class="kicker">Book by book</p>
        <h2>Hymns <em>through</em> the Bible</h2>
        <p>Choose a hymn book. Each spoke is one book of the Bible, as long as the number of its hymns on it. Choose a spoke to open those hymns.</p></div></header>
      <div class="thr-layout">
        <div class="thr-side">
          <nav class="thr-rail" aria-label="Choose a hymn book">
            <p class="thr-rail-head"><span>Hymn books</span><span>Hymns on a chapter</span></p>
            ${[D.everyone, ...D.shelves].map(railItem).join("")}
          </nav>
          <details class="thr-quiet"><summary>${formatNumber(D.everyone.all - D.everyone.works)} more hymns are on a subject, not a chapter</summary>
            <p>Their books give them a subject (the love of God, the Lord's Supper, a funeral) rather than a passage, so they have no spoke. They are listed on their book's shelf.</p></details>
        </div>
        <div class="thr-ringcard">
          <div class="thr-who"></div>
          <svg class="thr-ring" viewBox="-330 -330 660 660" role="img" tabindex="0" aria-label="Hymns by book of the Bible. Use the left and right arrow keys to move between books.">
            <g class="thr-guides"></g>
            <g class="thr-spokes">${books.map((book, b) => `<path data-thr-book="${b}" fill="var(--${book.section})" d="${wedge(b, R0)}"><title></title></path>`).join("")}</g>
            <g class="thr-labels"></g>
            <circle r="${R0 - 6}" class="thr-hole"/>
            <text class="thr-big" y="-2" text-anchor="middle"></text>
            <text class="thr-small" y="22" text-anchor="middle"></text>
          </svg>
        </div>
        <aside class="thr-book">
          <div class="thr-book-head"><p class="kicker"></p><h3></h3><p class="thr-book-sub"></p></div>
          <ol class="thr-list"></ol>
        </aside>
      </div>`;

    const $ = (selector) => section.querySelector(selector);
    const paths = [...section.querySelectorAll(".thr-spokes path")];
    const list = $(".thr-list");
    // The hymn list scrolls with its pill outside the panel's right edge, as on the rest of the site.
    // Only the list scrolls; the panel's header stays fixed and whole above it.
    const listBox = document.createElement("div");
    listBox.className = "thr-scroll";
    list.before(listBox); listBox.append(list);
    const bookScroll = OutsideScroll.wrap(listBox);
    const shown = new Float32Array(66);
    let current = D.everyone, selected = current.top, hover = -1, raf = 0;
    const scaleMax = () => Math.min(current.max, CAP);
    const goal = (b) => Math.sqrt(Math.min(current.totals[b], scaleMax()) / scaleMax());

    function drawSpokes() { for (let b = 0; b < 66; b++) paths[b].setAttribute("d", wedge(b, radiusOf(shown[b]))); }
    function tick() {
      let moving = false;
      for (let b = 0; b < 66; b++) { const diff = goal(b) - shown[b]; if (Math.abs(diff) > 0.002) { shown[b] += diff * 0.16; moving = true; } else shown[b] = goal(b); }
      drawSpokes();
      raf = moving ? requestAnimationFrame(tick) : 0;
    }
    function kick() {
      if (reducedMotion()) { for (let b = 0; b < 66; b++) shown[b] = goal(b); drawSpokes(); return; }
      if (!raf) raf = requestAnimationFrame(tick);
    }
    const niceStep = (max) => { for (const s of [200, 100, 50, 20, 10, 5]) if (s <= max / 3) return s; return 0; };
    function drawFrame() {
      const max = scaleMax(), capped = current.max > CAP, mid = capped ? CAP / 2 : niceStep(max);
      $(".thr-guides").innerHTML = [mid, max].filter(Boolean).map((v) => {
        const r = radiusOf(Math.sqrt(v / max)).toFixed(1);
        return `<circle r="${r}" class="thr-guide"/><text class="thr-guide-label" x="0" text-anchor="middle" y="${(Number(r) + 11).toFixed(1)}">${formatNumber(v)}${capped && v === max ? "+" : ""}</text>`;
      }).join("");
      const over = current.totals.map((t, b) => [t, b]).filter(([t]) => t > CAP).map(([, b]) => b);
      const labelled = current.totals.map((t, b) => [t, b]).filter(([t]) => t).sort((a, b) => b[0] - a[0]).slice(0, 10).map(([, b]) => b);
      $(".thr-labels").innerHTML = labelled.map((b) => {
        const a = angle(b) + STEP / 2, r = R1 + (over.includes(b) ? 30 : 10), deg = (a * 180) / Math.PI, flip = Math.cos(a) < 0;
        return `<text class="thr-label" transform="translate(${point(r, a).replace(" ", ",")}) rotate(${flip ? deg + 180 : deg})" text-anchor="${flip ? "end" : "start"}" dominant-baseline="middle">${esc(books[b].name)}</text>`;
      }).join("") + over.map((b) => { const a = angle(b) + STEP / 2; return `<path class="thr-over" d="M${point(R1 + 4, a)} L${point(R1 + 22, a)}"/>`; }).join("");
      paths.forEach((path, b) => { path.classList.toggle("thr-zero", !current.totals[b]); path.firstElementChild.textContent = `${books[b].name}: ${plural(current.totals[b], "hymn")}`; });
    }
    function renderWho() {
      const s = current, g = s.group;
      $(".thr-who").innerHTML = g
        ? `<p class="kicker" style="--tone: var(${g.tone})">${g.year} · ${esc(g.who)}</p><h3>${esc(g.label)}</h3>
           <p>${plural(s.works, "hymn")} on a chapter, across ${plural(s.bookCount, "book")} of the Bible; ${plural(s.all - s.works, "more hymn")} on a subject.</p>`
        : `<p class="kicker">Every hymn, together</p><h3>Every hymn</h3>
           <p>${plural(s.works, "hymn")} on a chapter in ${D.shelves.length} hymn books and hands, across ${plural(s.bookCount, "book")} of the Bible.</p>`;
      const runs = s.totals.map((t, b) => [t, b]).filter(([t]) => t > CAP).map(([t, b]) => `${books[b].name} (${formatNumber(t)})`);
    }
    function center() {
      const b = hover >= 0 ? hover : selected;
      $(".thr-big").textContent = formatNumber(current.totals[b]);
      $(".thr-small").textContent = books[b].name;
      paths.forEach((path, i) => path.classList.toggle("thr-on", i === selected));
    }
    function hymnItem(h) {
      const b = Math.floor(h.v / 1e6) - 1, chapter = Math.floor(h.v / 1e3) % 1000, verse = h.v % 1000, g = D.groupById.get(h.g);
      const bits = [
        `<a class="thr-ref" href="/read/kjv/${books[b].code}/${chapter}${verse > 1 ? `?hl=${verse}` : ""}" title="Read ${esc(bookName(b, true))} ${chapter} on this site">${icon("book", 12)}${esc(h.r)}</a>`,
        `<span class="thr-who-tag" style="--tone: var(${g.tone})">${esc(g.short)}</span>`,
        String(h.y), h.m ? `metre ${esc(h.m.replace(/,/g, "."))}` : "",
      ].filter(Boolean);
      return `<li class="thr-item"><a class="thr-work" href="${hymnHref(h)}">${esc(h.t)}</a><p class="thr-meta">${bits.join('<span class="thr-sep">·</span>')}</p>
        <a class="thr-go" href="${hymnHref(h)}">Open the hymn${icon("arrowRight", 12)}</a></li>`;
    }
    function renderList() {
      const book = books[selected], entries = current.byBook[selected];
      const panel = $(".thr-book");
      panel.style.setProperty("--tone", `var(--${book.section})`);
      panel.querySelector(".kicker").textContent = SECTION_LABEL[book.section];
      panel.querySelector("h3").textContent = book.name;
      panel.querySelector(".thr-book-sub").textContent = `${plural(entries.length, "hymn")} · ${current.group ? current.group.short : "every hymn book"}`;
      let lastChapter = 0;
      list.innerHTML = entries.length ? entries.map((h) => {
        const chapter = Math.floor(h.v / 1e3) % 1000;
        const head = chapter !== lastChapter ? `<li class="thr-chapter">${esc(bookName(selected, true))} ${chapter}</li>` : "";
        lastChapter = chapter;
        return head + hymnItem(h);
      }).join("") : `<li class="thr-empty">No hymn on ${esc(book.name)} in ${current.group ? esc(current.group.short) : "any of these books"}.</li>`;
      bookScroll.reset();
    }
    function setShelf(id) {
      current = D.byId.get(id);
      if (!current.totals[selected]) selected = current.top;
      for (const item of section.querySelectorAll("[data-thr-teacher]")) item.setAttribute("aria-pressed", String(item.dataset.thrTeacher === id));
      section.querySelector(".thr-ringcard").style.setProperty("--tone", current.group ? `var(${current.group.tone})` : "var(--accent)");
      drawFrame(); renderWho(); center(); renderList(); kick();
    }
    function selectBook(b) { selected = (b + 66) % 66; hover = -1; center(); renderList(); }

    const spokes = $(".thr-spokes");
    spokes.addEventListener("pointerover", (event) => { const p = event.target.closest("[data-thr-book]"); if (p) { hover = Number(p.dataset.thrBook); center(); } });
    spokes.addEventListener("pointerleave", () => { hover = -1; center(); });
    spokes.addEventListener("click", (event) => { const p = event.target.closest("[data-thr-book]"); if (p) selectBook(Number(p.dataset.thrBook)); });
    $(".thr-ring").addEventListener("keydown", (event) => {
      const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!move) return;
      event.preventDefault(); selectBook(selected + move);
    });
    section.addEventListener("click", (event) => { const shelf = event.target.closest("[data-thr-teacher]"); if (shelf) setShelf(shelf.dataset.thrTeacher); });

    // The book panel is always exactly as tall as the ring card beside it; its list scrolls inside.
    const ringCard = $(".thr-ringcard"), bookPanel = $(".thr-book");
    new ResizeObserver(() => { bookPanel.style.height = innerWidth > 1100 ? `${ringCard.offsetHeight}px` : ""; }).observe(ringCard);
    setShelf("all");
    shown.fill(0); drawSpokes();
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    const firstGrow = new IntersectionObserver((entries) => { if (!entries.some((e) => e.isIntersecting)) return; firstGrow.disconnect(); kick(); }, { threshold: 0.2 });
    firstGrow.observe($(".thr-ring"));
  }

  Sections.through = { mount };
})();
