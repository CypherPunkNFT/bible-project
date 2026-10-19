// The face of the Manuscripts page: breadcrumb, the big plain-type title with one italic accent and a short lede beside
// a line drawing of the three forms the text survives in (scroll, codex leaf, papyrus fragment), in the manner of the
// Surviving witnesses study but its own. Directions B and D add the strip of dated copies per century; every direction
// then closes with one end-to-end row of figures, as on the Hymns page. All figures are counted from data.js.
(() => {
  const { mid } = MSX;
  const C = MS.counts;
  const R = MS.records;

  const fig = (label, value, note) => `<div><dt>${label}</dt><dd>${value}</dd><small>${note}</small></div>`;
  function figures() {
    const dated = R.filter((r) => "e" in r);
    const oldest = dated.reduce((a, b) => (b.e < a.e ? b : a));
    const lanes = new Set(R.flatMap((r) => r.L));
    const early = dated.filter((r) => ["papyrus", "majuscule"].includes(r.k) && mid(r) < 400).length;
    const cities = new Set(MS.holders.map((h) => h.city)).size;
    const pictured = R.filter((r) => r.im).length;
    return [
      fig("Records", formatNumber(C.records), "from open catalogues"),
      fig("Dated", formatNumber(C.dated), `${Math.round((C.dated / C.records) * 100)}% of the records`),
      fig("Oldest dated", esc(oldest.d.replace(" century", " c.")), esc(oldest.n)),
      fig("Traditions", `${lanes.size}`, "languages and families of copies"),
      fig("Greek New Testament", formatNumber(C.gaTotal), `of about ${formatNumber(C.liste.total)} known · ${formatNumber(early)} before AD 400`),
      fig("Libraries", formatNumber(C.holders), `in ${cities} cities, Dublin to Sinai`),
      fig("Pictured", `${formatNumber(pictured)} <span class="ms-star" aria-hidden="true">★</span>`, "with an openly licensed picture"),
    ];
  }
  const TEXT = {
    a: ["across the centuries", "The Bible reaches us through copies made by hand: scrolls, bound books and scraps of papyrus. Open the great witnesses case by case, follow every dated copy through time, choose a book to see the copies that hold it, and find where they are kept today."],
    b: ["across the centuries", "The Bible reaches us through copies made by hand: scrolls, bound books and scraps of papyrus. Follow every dated copy through time, choose a book to see the copies that hold it, find where they are kept today, then browse them all."],
    c: ["the surviving witnesses", "The Bible reaches us through copies made by hand: scrolls, bound books and scraps of papyrus. Begin with the great witnesses, see where every copy is kept today, then follow them through time and book by book."],
    d: ["five ways in", "The Bible reaches us through copies made by hand: scrolls, bound books and scraps of papyrus. One collection of over five thousand records, explored through time, by book, by place, or one by one."],
  };

  // Rows of writing as short strokes, slightly ragged, inside a column.
  function lines(x, y, width, rows, gap, opts = {}) {
    const out = [];
    for (let r = 0; r < rows; r++) {
      const w = width - ((r * 7 + x) % 11) - (r === rows - 1 ? width * 0.4 : 0);
      const x0 = opts.right ? x + width - w : x;
      out.push(`<path d="M${x0.toFixed(1)} ${(y + r * gap).toFixed(1)}h${w.toFixed(1)}" stroke-dasharray="${opts.dash ?? "6 2 3 1.5"}" opacity="${(0.34 + (r % 4) * 0.12).toFixed(2)}"/>`);
    }
    return out.join("");
  }
  const fibres = (x, y, w, h, step = 6) => `${Array.from({ length: Math.ceil(h / step) }, (_, i) => `<path d="M${x} ${y + i * step}h${w}"/>`).join("")}${Array.from({ length: Math.ceil(w / (step + 2)) }, (_, i) => `<path d="M${x + i * (step + 2)} ${y}v${h}"/>`).join("")}`;
  const leafBody = () => `<path class="mh-sheet mh-sheet-front" d="M176 104 Q250 96 326 106 L322 286 Q248 276 172 284Z"/>
        <path class="ms-fold" d="M249 104 V280"/>
        <g class="ms-ink">${lines(186, 124, 54, 21, 7.2)}${lines(259, 124, 54, 21, 7.2)}</g>`;
  // Three smaller scraps lying apart, each tied back to the fragment by a dotted thread: pieces of one book.
  function scraps() {
    const scrap = (n, d, x, y, w, h, rows) => `<g class="hv-scrap hv-scrap-${n}"><defs><clipPath id="hv-s${n}"><path d="${d}"/></clipPath></defs>
      <path class="ms-papyrus" d="${d}"/><g clip-path="url(#hv-s${n})"><g class="ms-fibres">${fibres(x, y, w, h)}</g><g class="ms-ink ms-ink-gold">${lines(x + 6, y + 9, w - 14, rows, 7, { dash: "5 1.5 2.5 1.5" })}</g></g></g>`;
    return `<path class="hv-thread" d="M276 214Q340 214 352 246M266 236Q306 274 312 298M242 250Q262 290 250 312"/>
      ${scrap(1, "M346 236l22-6 18 9-3 15 9 14-10 15-20 2-9-11-10-3 2-19Z", 336, 226, 56, 60, 6)}
      ${scrap(2, "M302 292l20-4 9 9-4 14-15 4-11-8Z", 298, 286, 34, 30, 3)}
      ${scrap(3, "M240 306l15-3 6 7-3 10-12 2-7-7Z", 236, 300, 26, 22, 2)}`;
  }
  // A museum tag under the scroll, tied to the fragment's left edge.
  const tag = () => `<g class="hv-tag"><path class="hv-thread" d="M174 204Q150 214 132 226"/>
      <g transform="rotate(-8 112 232)"><path class="mh-sheet mh-sheet-front" d="M92 220h52v26h-52l-8-13Z"/><circle class="ms-roll-end" cx="96" cy="233" r="2.4"/>
      <path class="hv-label" d="M104 228h30M104 234h22M104 240h26"/></g></g>`;
  // A lens resting on the leaf's right-hand column, showing the leaf beneath it enlarged.
  function lens() {
    const [cx, cy, r] = [312, 150, 30];
    return `<defs><clipPath id="hv-lens"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>
      <g><circle class="hv-glass" cx="${cx}" cy="${cy}" r="${r}"/>
        <g clip-path="url(#hv-lens)"><g transform="translate(${cx} ${cy}) scale(1.7) translate(${-cx} ${-cy})"><g transform="rotate(7 250 190)">${leafBody()}</g></g></g>
        <circle class="hv-glare" cx="${cx}" cy="${cy}" r="${r}"/>
        <circle class="hv-rim" cx="${cx}" cy="${cy}" r="${r}"/><circle class="hv-rim hv-rim-2" cx="${cx}" cy="${cy}" r="${r + 4}"/>
        <path class="hv-handle" d="M${cx + 22} ${cy + 22} ${cx + 48} ${cy + 48}"/></g>`;
  }
  // The drawing (the owner's chosen variant E, 2026-10-18): scroll, codex leaf and a papyrus fragment set a little left and
  // lower, three smaller scraps threaded back to it, a museum tag, and a lens on the leaf. Shapes describe formats only;
  // no manuscript's text or damage is reproduced.
  function art() {
    const frag = "M214 128 L262 116 290 134 284 158 302 181 289 222 258 236 236 218 212 226 198 190 210 170Z";
    return `<figure class="ms-hero-art" aria-hidden="true"><svg viewBox="0 0 420 330">
      <defs><clipPath id="ms-frag"><path d="${frag}"/></clipPath></defs>
      <ellipse class="ms-orbit" cx="214" cy="170" rx="196" ry="128"/>
      <ellipse class="ms-orbit ms-orbit-2" cx="214" cy="170" rx="160" ry="150" transform="rotate(-18 214 170)"/>
      <g class="ms-scroll"><g transform="rotate(-9 150 120)">
        <path class="mh-sheet" d="M62 64 H244 V176 H62Z"/>
        <path class="ms-roll" d="M48 60 h14 v120 h-14 a7 4 0 0 1 0 -8 v-104 a7 4 0 0 1 0 -8Z M244 60 h14 a7 4 0 0 1 0 8 v104 a7 4 0 0 1 0 8 h-14Z"/>
        <ellipse class="ms-roll-end" cx="55" cy="60" rx="7" ry="3.5"/><ellipse class="ms-roll-end" cx="251" cy="60" rx="7" ry="3.5"/>
        <g class="ms-ink">${lines(74, 80, 46, 13, 7, { right: true, dash: "4 1.5 7 1.5" })}${lines(130, 80, 46, 13, 7, { right: true, dash: "4 1.5 7 1.5" })}${lines(186, 80, 46, 13, 7, { right: true, dash: "4 1.5 7 1.5" })}</g>
      </g></g>
      <g class="ms-leaf"><g transform="rotate(7 250 190)">
        <path class="mh-sheet mh-sheet-front" d="M176 104 Q250 96 326 106 L322 286 Q248 276 172 284Z"/>
        <path class="ms-fold" d="M249 104 V280"/>
        <g class="ms-ink">${lines(186, 124, 54, 21, 7.2)}${lines(259, 124, 54, 21, 7.2)}</g>
      </g></g>
      <g transform="translate(-24 14)"><g class="ms-fragment">
        <path class="ms-papyrus" d="${frag}"/>
        <g clip-path="url(#ms-frag)"><g class="ms-fibres">${Array.from({ length: 14 }, (_, i) => `<path d="M190 ${116 + i * 9}h120"/>`).join("")}${Array.from({ length: 10 }, (_, i) => `<path d="M${200 + i * 10} 110v130"/>`).join("")}</g>
          <g class="ms-ink ms-ink-gold">${lines(212, 140, 72, 12, 7.5, { dash: "5 1.5 2.5 1.5" })}</g></g>
      </g></g>
      ${scraps()}${tag()}${lens()}
      <path class="ms-mark" d="M28 52h10m-5-5v10M384 286h10m-5-5v10M372 40h8m-4-4v8"/>
    </svg>
    <span class="ms-art-top">Three forms, one text</span>
    <span class="ms-art-note"><i></i>Scroll. Codex. Fragment.<br><span>Copied by hand.</span></span>
    </figure>`;
  }

  // B and D: how many dated copies survive from each century, as a quiet strip; pointing at a century names it below.
  function centuries() {
    const buckets = new Map();
    for (const r of R) if ("e" in r) { const c = Math.floor((mid(r) - 1) / 100); buckets.set(c, (buckets.get(c) ?? 0) + 1); }
    const keys = [...buckets.keys()].sort((a, b) => a - b), max = Math.max(...buckets.values());
    const label = (c) => (c < 0 ? `${ordinal(-c)} century BC` : `${ordinal(c + 1)} century`);
    const bars = [];
    for (let c = keys[0]; c <= keys.at(-1); c++) {
      const n = buckets.get(c) ?? 0;
      bars.push(`<button type="button" class="cs-bar" data-c="${esc(label(c))}" data-n="${n}" style="--h:${(Math.sqrt(n / max) * 100).toFixed(1)}%"><i></i><span>${c === keys[0] ? esc(label(c).replace(" century", " c.")) : (c + 1) % 5 === 0 && c > 0 ? (c + 1) * 100 : ""}</span></button>`);
    }
    return `<div class="cs"><p class="cs-say" aria-live="polite">Dated copies per century. Point at a century.</p><div class="cs-bars" role="group" aria-label="Dated copies per century">${bars.join("")}</div></div>`;
  }

  function mount(section, { d }) {
    const [accent, lede] = TEXT[d];
    const strip = d === "a"; // the century strip stays only on the merged page; the consolidations rely on the timeline
    section.innerHTML = `
      <div class="hc-intro ms-intro">
        <div>
          <p class="hc-crumb"><a href="/study">Study</a><span>/</span><a href="/study">The Bible: formation &amp; transmission</a><span>/</span>Manuscripts</p>
          <h1>Manuscripts<em>${accent}</em></h1>
          <p class="hc-lede">${lede}</p>
        </div>
        ${art()}
      </div>${strip ? centuries() : ""}
      <dl class="ms-figures">${figures().join("")}</dl>`;
    if (strip) {
      const say = section.querySelector(".cs-say"), base = say.textContent;
      const show = (bar) => { say.innerHTML = bar ? `<b>${esc(bar.dataset.c)}</b> · ${plural(Number(bar.dataset.n), "dated copy", "dated copies")}` : base; };
      section.querySelector(".cs-bars").addEventListener("pointerover", (e) => show(e.target.closest(".cs-bar")));
      section.querySelector(".cs-bars").addEventListener("focusin", (e) => show(e.target.closest(".cs-bar")));
      section.querySelector(".cs-bars").addEventListener("pointerleave", () => show(null));
      section.querySelector(".cs-bars").addEventListener("click", (e) => { const bar = e.target.closest(".cs-bar"); if (bar) document.getElementById("lanes")?.scrollIntoView({ behavior: "smooth" }); });
    }
  }
  Sections.landing = { mount };
})();
