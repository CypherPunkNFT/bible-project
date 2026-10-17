// Direction A · The page and its echoes.
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
        Hover a line or a verse to join them; click to read the passage.</p></div></div>
      ${HymnEchoes.html()}
    </section>
    ${HymnSections.found("02")}
    ${book.html}
    ${placed.html}
    ${sources()}`;

  const P = panel();
  book.wire(wrap);
  placed.wire(wrap);
  switcher();
  HymnEchoes.wire(wrap, P);
})();
