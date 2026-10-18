// Direction B · Constellation.
(() => {
  const { intro, panel, sources, switcher } = Hymn;
  const main = Frame.mount();
  const wrap = document.createElement("div");
  wrap.className = "wrap";
  main.append(wrap);
  const book = HymnSections.book("03");

  wrap.innerHTML = `${intro()}
    <section class="hy-sec" id="constellation"><div class="hy-head"><span class="hy-num">01</span><div>
      <h2>The hymn <em>among the Scriptures</em></h2>
      <p>The six stanzas at the centre; around them, every book hymnal editors tie the hymn to, Old Testament on the left and New
        on the right, sized by how many of its passages they name. Bright lines run from a stanza to the verse one of its lines echoes.</p></div></div>
      ${HymnConstellation.html()}
    </section>
    ${HymnSections.found("02")}
    ${book.html}
    ${sources()}`;

  const P = panel();
  book.wire(wrap);
  switcher();
  HymnConstellation.wire(wrap, P);
})();
