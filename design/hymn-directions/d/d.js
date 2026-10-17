// Direction D · A + B together (owner, 2026-10-17): page A, with B's constellation inside section 01 directly below the
// hymn, and a "See the constellation" button at the top that takes you there.
(() => {
  const { intro, panel, sources, switcher } = Hymn;
  const main = Frame.mount();
  const wrap = document.createElement("div");
  wrap.className = "wrap";
  main.append(wrap);
  const book = HymnSections.book("03");
  const placed = HymnSections.placed("04");

  wrap.innerHTML = `${intro()}
    <section class="hy-sec" id="hymn"><div class="hy-head"><span class="hy-num">01</span><div>
      <h2>The hymn, <em>and the Scripture in it</em></h2>
      <p>All six stanzas as Newton printed them. Beside the lines that echo a verse, the verse hymnal editors attach to the hymn.
        Hover a line or a verse to join them; click to read the passage. Below the hymn, the same links as a constellation.</p></div></div>
      ${HymnEchoes.html()}
      <div class="d-among" id="constellation">
        <p class="d-among-k">Among the Scriptures</p>
        <p class="d-among-line">The six stanzas at the centre; around them, every book hymnal editors tie the hymn to, Old Testament on the left
          and New on the right, sized by how many of its passages they name. Choose a stanza or a book.</p>
        ${HymnConstellation.html()}
      </div>
    </section>
    ${HymnSections.found("02")}
    ${book.html}
    ${placed.html}
    ${sources()}`;

  // The button at the top: beside the opening line, it takes you down to the constellation.
  const go = document.createElement("a");
  go.className = "d-go";
  go.href = "#constellation";
  go.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="2.4"/><circle cx="12" cy="12" r="8.5" stroke-dasharray="2 3"/><circle cx="12" cy="3.5" r="1.4"/><circle cx="19.4" cy="15.6" r="1.4"/><circle cx="4.6" cy="15.6" r="1.4"/></svg>
    See the constellation`;
  go.addEventListener("click", (event) => { event.preventDefault(); document.getElementById("constellation").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); });
  wrap.querySelector(".hy-lede").after(go);

  const P = panel();
  book.wire(wrap);
  placed.wire(wrap);
  switcher();
  HymnEchoes.wire(wrap, P);
  HymnConstellation.wire(wrap, P);
})();
