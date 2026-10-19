// C · 01 Which copies hold each book? The 66 books as tiles, darker where more records hold the book (scaled within
// each Testament). Choose a book to list its copies oldest first, with the approved chapter grid above the list:
// one square per chapter, darker where more fragment records name it; choose a chapter to keep only those copies.
(() => {
  const { byDate, holderText, sigla } = MSX;
  const ABBR = ["Gen", "Exod", "Lev", "Num", "Deut", "Josh", "Judg", "Ruth", "1 Sam", "2 Sam", "1 Kgs", "2 Kgs", "1 Chr", "2 Chr", "Ezra", "Neh", "Esth", "Job", "Ps", "Prov", "Eccl", "Song", "Isa", "Jer", "Lam", "Ezek", "Dan", "Hos", "Joel", "Amos", "Obad", "Jonah", "Mic", "Nah", "Hab", "Zeph", "Hag", "Zech", "Mal",
    "Matt", "Mark", "Luke", "John", "Acts", "Rom", "1 Cor", "2 Cor", "Gal", "Eph", "Phil", "Col", "1 Thess", "2 Thess", "1 Tim", "2 Tim", "Titus", "Phlm", "Heb", "Jas", "1 Pet", "2 Pet", "1 John", "2 John", "3 John", "Jude", "Rev"];
  const SEC = { history: "History", poetry: "Poetry & Wisdom", prophets: "Prophets", gospels: "Gospels & Acts", epistles: "Epistles", revelation: "Revelation" };
  // A star marks a book, chapter or copy that has an openly licensed picture.
  const STAR = `<span class="bk-star" title="Has a picture" aria-label="has a picture">★</span>`;
  const VERSIONS = ["latin", "syriac", "coptic", "gothic", "armenian", "geez"];
  const FILTERS = [["all", "Every record", () => true], ["dss", "Dead Sea Scrolls", (r) => r.k === "dss"], ["hebrew", "Hebrew codices", (r) => r.k === "hebrew"],
    ["greek", "Greek New Testament", (r) => ["papyrus", "majuscule", "minuscule"].includes(r.k)], ["versions", "Early translations", (r) => VERSIONS.includes(r.k)]];

  function mount(section, { num }) {
    const holding = MS.records.filter((r) => r.b?.length);
    let filter = "all", book = 42, chapter = 0;
    const lect = MS.counts.lectionaries;
    section.innerHTML = `${head(num, "Book by book", `Which copies hold <em>each book?</em>`,
      `Each tile is a book, darker where more records hold it (scaled within each Testament). Choose one to list its copies, oldest first. ${formatNumber(holding.length)} records say which books they hold; the ${formatNumber(lect)} lectionaries hold readings rather than books and are left out.`)}
      <div class="bk-filters" role="radiogroup" aria-label="Which records">${FILTERS.map(([k, l]) => `<button type="button" role="radio" data-f="${k}" aria-checked="${k === filter}">${l}<em></em></button>`).join("")}</div>
      <div class="bk-layout">
        <div class="bk-grids"><p class="bk-t">Old Testament</p><div class="bk-grid" data-t="ot"></div><p class="bk-t">New Testament</p><div class="bk-grid" data-t="nt"></div>
          <p class="bk-key"><span class="bk-key-star"><span class="bk-star">★</span> copies with a picture</span><span>fewer</span><i></i><i></i><i></i><i></i><span>more</span><span class="bk-key-0"><b></b>none in the open data</span></p></div>
        <aside class="bk-panel"><div class="bk-head"></div><div class="bk-chapters"></div><div class="bk-scroll"><ol class="bk-list"></ol></div></aside>
      </div>`;
    const $ = (s) => section.querySelector(s);
    const scroller = OutsideScroll.wrap($(".bk-scroll"));

    const subset = () => holding.filter(FILTERS.find((f) => f[0] === filter)[2]);
    function counts() {
      const n = new Array(66).fill(0);
      for (const r of subset()) for (const b of r.b) n[b]++;
      return n;
    }
    function grids() {
      const n = counts(), pictured = new Array(66).fill(0), maxOT = Math.max(1, ...n.slice(0, 39)), maxNT = Math.max(1, ...n.slice(39));
      for (const r of subset()) if (r.im) for (const b of r.b) pictured[b]++;
      const tile = (b) => {
        const k = n[b] ? Math.sqrt(n[b] / (b < 39 ? maxOT : maxNT)) : 0;
        return `<button type="button" class="bk-tile${n[b] ? "" : " bk-zero"}" data-b="${b}" aria-pressed="${b === book}" style="--tone: var(--${MS.books[b].sec}); --k:${k.toFixed(3)}" title="${esc(MS.books[b].name)}: ${plural(n[b], "record")}"><b>${ABBR[b]}</b><small>${n[b] ? formatNumber(n[b]) : "–"}${pictured[b] ? `<span class="bk-pic" title="${plural(pictured[b], "copy", "copies")} with a picture">★ ${pictured[b]}</span>` : ""}</small></button>`;
      };
      $('[data-t="ot"]').innerHTML = Array.from({ length: 39 }, (_, b) => tile(b)).join("");
      $('[data-t="nt"]').innerHTML = Array.from({ length: 27 }, (_, i) => tile(i + 39)).join("");
      for (const [k, , test] of FILTERS) section.querySelector(`[data-f="${k}"] em`).textContent = formatNumber(holding.filter(test).length);
    }
    function panel() {
      const info = MS.books[book], all = subset().filter((r) => r.b.includes(book)).sort(byDate);
      const withCh = all.filter((r) => r.ch?.[book]);
      const perCh = new Array(info.ch + 1).fill(0);
      for (const r of withCh) for (const c of r.ch[book]) perCh[c]++;
      const maxCh = Math.max(1, ...perCh);
      const chPictured = new Set(withCh.filter((r) => r.im).flatMap((r) => r.ch[book]));
      const shown = chapter ? withCh.filter((r) => r.ch[book].includes(chapter)) : all;
      const dated = all.filter((r) => "e" in r).length;
      const p = $(".bk-panel");
      p.style.setProperty("--tone", `var(--${info.sec})`);
      $(".bk-head").innerHTML = `<p class="kicker">${SEC[info.sec]}</p><h3>${esc(info.name)}</h3><p>${plural(all.length, "record")} hold it${all.length ? `, ${formatNumber(dated)} with a date` : ""}.</p>`;
      $(".bk-chapters").innerHTML = withCh.length
        ? `<div class="bk-ch" style="--cols:${Math.min(info.ch, info.ch > 60 ? 15 : 10)}">${Array.from({ length: info.ch }, (_, i) => i + 1).map((c) => `<button type="button" data-c="${c}" aria-pressed="${c === chapter}" style="--k:${perCh[c] ? Math.sqrt(perCh[c] / maxCh).toFixed(3) : 0}" title="Chapter ${c}: ${plural(perCh[c], "record")} name it${chPictured.has(c) ? ", one with a picture" : ""}">${c}${chPictured.has(c) ? STAR : ""}</button>`).join("")}</div>
           <p class="bk-ch-note">${chapter ? `Chapter ${chapter}: ${plural(shown.length, "record")} name it. <button type="button" data-c="0">Show every copy</button>` : `${plural(withCh.length, "record")} name the chapters they hold, mostly fragments; the rest name only the book. Choose a chapter.`}</p>`
        : `<p class="bk-ch-note">${all.length ? "These records name the book, not its chapters." : ""}</p>`;
      $(".bk-list").innerHTML = shown.length ? shown.map((r) => `<li><button type="button" data-open="${esc(r.i)}" style="--tone: var(${KIND[r.k].tone})"><span class="bk-d">${esc(r.d ?? "undated")}</span>
          <span class="bk-n"><b>${esc(r.n)}${r.im ? STAR : ""}</b><small>${esc([sigla(r), KIND[r.k].label, holderText(r) || r.f].filter(Boolean).join(" · "))}</small></span></button></li>`).join("")
        : `<li class="bk-none">No record in this selection holds ${esc(info.name)}.</li>`;
      scroller.reset();
    }
    section.addEventListener("click", (e) => {
      const f = e.target.closest("[data-f]"), t = e.target.closest("[data-b]"), c = e.target.closest("[data-c]");
      if (f) { filter = f.dataset.f; chapter = 0; section.querySelectorAll("[data-f]").forEach((x) => x.setAttribute("aria-checked", String(x === f))); grids(); panel(); }
      else if (t) { book = Number(t.dataset.b); chapter = 0; section.querySelectorAll(".bk-tile").forEach((x) => x.setAttribute("aria-pressed", String(x === t))); panel(); }
      else if (c) { const n = Number(c.dataset.c); chapter = chapter === n ? 0 : n; panel(); }
    });
    const grid = $(".bk-grids"), side = $(".bk-panel");
    new ResizeObserver(() => { side.style.height = innerWidth > 960 ? `${Math.max(grid.offsetHeight, 520)}px` : ""; }).observe(grid);
    grids(); panel();
  }
  Sections.books = { mount };
})();
