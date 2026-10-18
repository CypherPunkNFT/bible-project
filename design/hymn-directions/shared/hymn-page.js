// The hymn page (the owner's pick, formerly direction D: page A with B's constellation inside section 01 and a "See the
// constellation" button at the top), with the whole hymn shown three ways, chosen by <body data-mode>:
//   read-compare  a "Read · Compare" switch on section 01: Read shows the stanzas clean, Compare the verses beside them;
//                 the block keeps its height either way, so the page does not grow;
//   hover         the stanzas clean; a line's verse and join appear only while you point at the line;
//   panel         section 01 as it was, plus "Read the whole hymn", which slides the clean hymn in beside the page.
(() => {
  const { H, esc, intro, panel, sources, switcher } = Hymn;
  const ROMAN = ["I", "II", "III", "IV", "V", "VI"];
  const mode = document.body.dataset.mode;
  const main = Frame.mount();
  const wrap = document.createElement("div");
  wrap.className = "wrap";
  main.append(wrap);
  const book = HymnSections.book("03");
  const placed = HymnSections.placed("04");

  const LEAD = {
    "read-compare": "All six stanzas as Newton printed them. Switch to Compare to see, beside each line that echoes Scripture, the verse hymnal editors attach to the hymn.",
    hover: "All six stanzas as Newton printed them. Point at a line to see the verse it echoes; click to read the passage.",
    panel: "All six stanzas as Newton printed them, with the verses their lines echo beside them. Read the whole hymn on its own from the button above.",
    compare: "All six stanzas as Newton printed them. Beside the lines that echo a verse, the verse hymnal editors attach to the hymn. Hover a line or a verse to join them; click to read the passage.",
  }[mode];

  wrap.innerHTML = `${intro()}
    <section class="hy-sec" id="hymn"><div class="hy-head"><span class="hy-num">01</span><div>
      <h2>The hymn, <em>and the Scripture in it</em></h2>
      <p>${LEAD} Below the hymn, the same links as a constellation.</p></div></div>
      ${mode === "read-compare" ? `<div class="hp-mode" role="radiogroup" aria-label="How to show the hymn"><button type="button" role="radio" data-view="read" aria-checked="true">Read</button><button type="button" role="radio" data-view="compare" aria-checked="false">Compare</button></div>` : ""}
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

  const actions = document.createElement("div");
  actions.className = "hp-actions";
  actions.innerHTML = `${mode === "panel" ? `<button type="button" class="d-go" data-whole>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 4h11l3 3v13H5z"/><path d="M8 9h8M8 12.5h8M8 16h5"/></svg>
      Read the whole hymn</button>` : ""}
    <a class="d-go" href="#constellation" data-constellation>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="2.4"/><circle cx="12" cy="12" r="8.5" stroke-dasharray="2 3"/><circle cx="12" cy="3.5" r="1.4"/><circle cx="19.4" cy="15.6" r="1.4"/><circle cx="4.6" cy="15.6" r="1.4"/></svg>
      See the constellation</a>`;
  wrap.querySelector(".hy-lede").after(actions);
  actions.querySelector("[data-constellation]").addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById("constellation").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });

  const P = panel();
  book.wire(wrap);
  placed.wire(wrap, P);
  if (mode !== "compare") switcher(); // the page itself has no variants now; the archived ones keep their switch
  const ec = wrap.querySelector(".ec");
  ec.classList.add(`hp-${mode}`);
  const echoes = HymnEchoes.wire(wrap, P);
  HymnConstellation.wire(wrap, P);

  if (mode === "read-compare") {
    const set = (view) => {
      ec.classList.toggle("hp-reading", view === "read");
      wrap.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.view === view)));
      echoes.layout();
    };
    wrap.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => set(b.dataset.view)));
    set("read");
  }

  if (mode === "panel") {
    const whole = `<p class="hp-whole-meta">${esc(H.collection)} · ${esc(H.bookOfCollection)}, no. ${H.number} · ${H.year} · ${esc(H.meterName)} (${esc(H.meter)})</p>
      <p class="hp-whole-text">${esc(H.heading.label)}</p>
      <div class="hp-whole">${H.stanzas.map((lines, s) => `<div class="hp-st"><span>${ROMAN[s]}</span>${lines.map((l) => `<p>${esc(l)}</p>`).join("")}</div>`).join("")}</div>
      <p class="hy-panel-tr">As printed in ${esc(H.collection)}, ${H.year}.</p>`;
    actions.querySelector("[data-whole]").addEventListener("click", () => P.show("The whole hymn", "Amazing grace! (how sweet the sound)", whole));
  }
})();
