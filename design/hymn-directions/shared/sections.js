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

  /** 0X · Where hymnals place it: one square per passage hymnal editors attach to the hymn, by book. */
  function placed(num) {
    const total = H.placed.reduce((s, b) => s + b.refs.length, 0);
    const html = `<section class="hy-sec" id="placed"><div class="hy-head"><span class="hy-num">${num}</span><div>
        <h2>Where hymnals <em>place it</em></h2>
        <p>Hymnal editors attach it to ${total} passages in ${H.placed.length} books. Psalms, Ephesians and Romans lead. Hover a square to see the passage; click to read it.</p></div></div>
      <div class="hy-placed">${H.placed.map((b) => `<div class="hy-placed-book" style="--tone: var(--${b.tone})"><h4>${esc(b.book)}<span>${b.refs.length}</span></h4>
        <div class="sq">${b.refs.map((r) => { const m = /^(\d+)(?::([\d–-]+))?/.exec(r); const ch = m ? m[1] : "1"; const hl = m && m[2] ? `?hl=${m[2].replace("–", "-")}` : "";
          return `<a href="/read/kjv/${b.code}/${ch}${hl}" data-ref="${esc(`${b.book} ${r}`)}" aria-label="${esc(`${b.book} ${r}`)}"></a>`; }).join("")}</div></div>`).join("")}</div>
      <p class="hy-placed-tip" aria-live="polite">&nbsp;</p></section>`;
    return { html, wire(root) {
      const tip = root.querySelector(".hy-placed-tip");
      root.querySelectorAll(".hy-placed .sq a").forEach((a) => {
        a.addEventListener("mouseenter", () => { tip.textContent = a.dataset.ref; tip.style.color = "var(--ink)"; });
        a.addEventListener("mouseleave", () => { tip.innerHTML = "&nbsp;"; });
      });
    } };
  }

  window.HymnSections = { found, book, placed };
})();
