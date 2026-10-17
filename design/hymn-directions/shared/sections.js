// Sections all three directions share, each a function returning markup plus a wire(root, panel) to make it live.
(() => {
  const { H, esc } = Hymn;

  /** 0X · Where Newton found it: his heading verse beside his line. */
  function found(num) {
    const v = H.heading.passage.verses[0].text;
    const marked = v.replace("that thou hast brought me hitherto", "<b>that thou hast brought me hitherto</b>");
    return `<section class="hy-sec" id="found"><div class="hy-head"><span class="hy-num">${num}</span><div>
        <h2>Where Newton <em>found it</em></h2>
        <p>He printed the hymn under David's prayer after God's promise of a lasting house. "Hitherto" is the word the hymn turns into "thus far".</p></div></div>
      <div class="hy-found">
        <blockquote>${marked}<cite>1 Chronicles 17:16 · King James Version</cite></blockquote>
        <span class="join" aria-hidden="true"></span>
        <blockquote>Through many dangers, toils and snares, I have already come; <b>’Tis grace has brought me safe thus far</b>, and grace will lead me home.<cite>Stanza III</cite></blockquote>
      </div></section>`;
  }

  /** 0X · Its place in the book: Olney Book I walks through the Bible, Genesis to Revelation. */
  function book(num) {
    const row = H.book1.map((h) => `<button type="button" style="--tone: var(--${h.tone})" class="${h.n === H.number ? "here" : ""}" data-n="${h.n}" aria-label="Hymn ${h.n}: ${esc(h.title)}"></button>`).join("");
    const html = `<section class="hy-sec" id="book"><div class="hy-head"><span class="hy-num">${num}</span><div>
        <h2>Its place in <em>the book</em></h2>
        <p>Book I of <i>Olney Hymns</i> walks through the Bible from Genesis to Revelation, one hymn per passage: ${H.book1.length} hymns.
          This is number ${H.number}, the only one on 1 Chronicles. (Across all three books Newton wrote ${H.olneyAuthors["John Newton"]} hymns, Cowper ${H.olneyAuthors["William Cowper"]}.)
          Hover a tick to see the hymn.</p></div></div>
      <div class="hy-book"><div class="hy-book-row">${row}</div>
        <div class="hy-book-scale"><span>Genesis</span><span>Psalms</span><span>Prophets</span><span>Gospels</span><span>Revelation</span></div>
        <p class="hy-book-readout" aria-live="polite"></p></div></section>`;
    return { html, wire(root) {
      const out = root.querySelector(".hy-book-readout");
      const show = (n) => { const h = H.book1.find((x) => x.n === n); out.innerHTML = `<small>No. ${h.n} · ${esc(h.book)} · ${esc(h.author)}</small>${esc(h.title)}`; };
      root.querySelectorAll(".hy-book-row button").forEach((b) => {
        b.addEventListener("mouseenter", () => show(+b.dataset.n));
        b.addEventListener("focus", () => show(+b.dataset.n));
        b.addEventListener("click", () => show(+b.dataset.n));
      });
      root.querySelector(".hy-book-row").addEventListener("mouseleave", () => show(H.number));
      show(H.number);
    } };
  }

  /** 0X · Where hymnals place it: this hymn only. Printed hymnals carry a scripture index, so a church can choose a hymn
   *  for a reading; Hymnary.org gathers those indexes. One square per passage editors tie this hymn to, by book. Hover
   *  shows the verse; click opens the passage beside the page. A ring marks a passage one of the hymn's own lines echoes. */
  function placed(num) {
    const all = H.placed.flatMap((b) => b.refs.map((r) => ({ ...r, book: b.book, tone: b.tone })));
    const ROMAN = ["I", "II", "III", "IV", "V", "VI"];
    const echoed = (r) => H.echoes.filter((e) => e.code === r.code && e.chapter === r.chapter
      && (r.whole || (e.verses[0].n <= r.first + r.count - 1 && e.verses.at(-1).n >= r.first)));
    all.forEach((r) => { r.echoes = echoed(r); });
    const echoedCount = all.filter((r) => r.echoes.length).length;
    let i = 0;
    const html = `<section class="hy-sec" id="placed"><div class="hy-head"><span class="hy-num">${num}</span><div>
        <h2>Where hymnals <em>place it</em></h2>
        <p>Printed hymnals list, for each hymn, the Bible passages it goes with, so a church can choose a hymn for the day's reading.
          Gathered from the hymnals Hymnary.org catalogues, editors have tied <b>this hymn</b> to ${all.length} passages in ${H.placed.length} books.
          One square is one passage; a ringed square is one the hymn's own lines echo. Point at a square to read it; click to open it beside the page.</p></div></div>
      <div class="hy-placed">${H.placed.map((b) => `<div class="hy-placed-book" style="--tone: var(--${b.tone})"><h4>${esc(b.book)}<span>${b.refs.length}</span></h4>
        <div class="sq">${b.refs.map(() => { const r = all[i]; return `<a href="${Hymn.placedUrl(r)}" data-p="${i++}" class="${r.echoes.length ? "echo" : ""}" aria-label="${esc(r.label)}"></a>`; }).join("")}</div></div>`).join("")}</div>
      <div class="hy-placed-read" aria-live="polite"></div>
      <p class="hy-placed-key"><span><i class="k-sq"></i>a passage hymnals tie it to</span><span><i class="k-sq echo"></i>one its lines echo (${echoedCount})</span></p></section>`;

    return { html, wire(root, P) {
      const read = root.querySelector(".hy-placed-read");
      const squares = [...root.querySelectorAll(".hy-placed .sq a")];
      const verseText = (r) => `${r.verses.map((v) => `<sup>${v.n}</sup>${esc(v.text)}`).join(" ")}${r.count > r.verses.length ? ` <span class="more">… ${r.count - r.verses.length} more verses</span>` : ""}`;
      function show(r, a) {
        squares.forEach((s) => s.classList.toggle("on", s === a));
        read.style.setProperty("--tone", `var(--${r.tone})`);
        read.innerHTML = `<p class="ref">${esc(r.label)}${r.whole ? " · the whole chapter" : ""}${r.echoes.length ? ` <em>echoed in stanza ${[...new Set(r.echoes.map((e) => ROMAN[e.stanza]))].join(", ")}</em>` : ""}</p>
          <p class="txt">${verseText(r)}</p>`;
      }
      const resting = all.find((r) => r.echoes.length) ?? all[0];
      show(resting, squares[all.indexOf(resting)]);
      squares.forEach((a) => {
        const r = all[+a.dataset.p];
        a.addEventListener("mouseenter", () => show(r, a));
        a.addEventListener("focus", () => show(r, a));
        a.addEventListener("click", (event) => {
          if (!P) return; // without a panel, the link opens the reader
          event.preventDefault();
          show(r, a);
          const line = r.echoes.length ? H.stanzas[r.echoes[0].stanza][r.echoes[0].line] : "";
          P.open({ ref: r.label, code: r.code, chapter: r.chapter, verses: r.verses }, line,
            `Hymnals tie the hymn here${r.count > r.verses.length ? ` · first ${r.verses.length} of ${r.count} verses` : ""}`);
        });
      });
    } };
  }

  window.HymnSections = { found, book, placed };
})();
