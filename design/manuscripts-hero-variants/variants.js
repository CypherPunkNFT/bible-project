// Four variants of the Manuscripts page's opening drawing (owner 2026-10-18), in a 2×2 grid. The base drawing (scroll,
// codex leaf, papyrus fragment, orbits, marks and the two captions) is copied unchanged from
// manuscripts-directions/js/landing.js; each variant only adds a layer, mostly in the empty bottom-right corner:
// behind the sheets ("back") or in front of them ("front"). Shapes describe formats only; no manuscript is reproduced.
(() => {
  // Rows of writing as short strokes, slightly ragged, inside a column (as in landing.js).
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

  // The base drawing, unchanged, with two slots for a variant's additions.
  function art(id, back = "", front = "") {
    const frag = "M214 128 L262 116 290 134 284 158 302 181 289 222 258 236 236 218 212 226 198 190 210 170Z";
    return `<figure class="ms-hero-art" aria-hidden="true"><svg viewBox="0 0 420 330">
      <defs><clipPath id="ms-frag-${id}"><path d="${frag}"/></clipPath></defs>
      <ellipse class="ms-orbit" cx="214" cy="170" rx="196" ry="128"/>
      <ellipse class="ms-orbit ms-orbit-2" cx="214" cy="170" rx="160" ry="150" transform="rotate(-18 214 170)"/>
      <g class="hv-back">${back}</g>
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
      <g class="ms-fragment">
        <path class="ms-papyrus" d="${frag}"/>
        <g clip-path="url(#ms-frag-${id})"><g class="ms-fibres">${Array.from({ length: 14 }, (_, i) => `<path d="M190 ${116 + i * 9}h120"/>`).join("")}${Array.from({ length: 10 }, (_, i) => `<path d="M${200 + i * 10} 110v130"/>`).join("")}</g>
          <g class="ms-ink ms-ink-gold">${lines(212, 140, 72, 12, 7.5, { dash: "5 1.5 2.5 1.5" })}</g></g>
      </g>
      <g class="hv-front">${front}</g>
      <path class="ms-mark" d="M28 52h10m-5-5v10M384 286h10m-5-5v10M372 40h8m-4-4v8"/>
    </svg>
    <span class="ms-art-top">Three forms, one text</span>
    <span class="ms-art-note"><i></i>Scroll. Codex. Fragment.<br><span>Copied by hand.</span></span>
    </figure>`;
  }

  // A · The library behind: bound codices, closed, stacked and leaning behind the leaf.
  function library() {
    const flat = (x, y, w, h, tilt) => `<g transform="rotate(${tilt} ${x + w / 2} ${y + h / 2})"><path class="mh-sheet" d="M${x} ${y}h${w}v${h}h-${w}Z"/><path class="hv-pages" d="M${x + 4} ${y + 2.5}h${w - 6}M${x + 4} ${y + h - 2.5}h${w - 6}"/><path class="hv-band" d="M${x + 9} ${y}v${h}M${x + 14} ${y}v${h}M${x + w - 12} ${y}v${h}"/></g>`;
    const upright = (x, y, w, h, tilt) => `<g transform="rotate(${tilt} ${x} ${y + h})"><path class="ms-roll" d="M${x} ${y}h${w}v${h}h-${w}Z"/><path class="hv-band" d="M${x} ${y + 10}h${w}M${x} ${y + 15}h${w}M${x} ${y + h - 14}h${w}"/><path class="hv-pages" d="M${x + w / 2} ${y + 24}v${h - 46}"/></g>`;
    return `<g class="hv-books">
      ${upright(350, 196, 15, 92, 0)}${upright(366, 204, 13, 84, 0)}${upright(380, 214, 14, 74, 14)}
      ${flat(318, 288, 86, 13, 0)}${flat(324, 275, 76, 13, -2)}${flat(330, 302, 82, 12, 1)}
      <path class="hv-shelf" d="M300 316h116"/></g>`;
  }

  // B · Jar and pen: a lidded storage jar of the kind the scrolls were kept in, and a reed pen beside an inkwell.
  function jar() {
    return `<g class="hv-jar">
      <path class="mh-sheet" d="M352 196q-3-8 4-10h32q7 2 4 10q16 10 16 46q0 40-14 52q-6 4-22 4t-22-4q-14-12-14-52q0-36 16-46Z"/>
      <path class="ms-roll" d="M350 188q22-12 44 0q-2 8-22 8t-22-8Z"/><path class="hv-band" d="M360 182q12-5 24 0"/>
      <path class="hv-pages" d="M342 222q30 8 60 0M340 236q32 8 64 0M344 280q28 6 56 0"/>
      <path class="hv-band" d="M371 200v8"/></g>
    <g class="hv-pen">
      <path class="ms-roll" d="M330 296h22q4 0 4 4v12q0 4-4 4h-22q-4 0-4-4v-12q0-4 4-4Z"/><ellipse class="ms-roll-end" cx="341" cy="296" rx="7" ry="2.4"/>
      <path class="hv-reed" d="M343 293 386 236"/><path class="hv-nib" d="m343 293-3 6 6-3Z"/></g>`;
  }

  // C · Scattered witnesses: three smaller scraps lying apart, each tied back to the main fragment by a dotted line,
  // like leaves of one codex waiting to be reunited.
  function scattered(id) {
    const scrap = (n, d, x, y, w, h, rows) => `<g class="hv-scrap hv-scrap-${n}"><defs><clipPath id="hv-s${n}-${id}"><path d="${d}"/></clipPath></defs>
      <path class="ms-papyrus" d="${d}"/><g clip-path="url(#hv-s${n}-${id})"><g class="ms-fibres">${fibres(x, y, w, h)}</g><g class="ms-ink ms-ink-gold">${lines(x + 6, y + 9, w - 14, rows, 7, { dash: "5 1.5 2.5 1.5" })}</g></g></g>`;
    return `<path class="hv-thread" d="M300 200Q340 214 352 246M290 222Q306 274 312 298M266 236Q262 290 250 312"/>
      ${scrap(1, "M346 236l22-6 18 9-3 15 9 14-10 15-20 2-9-11-10-3 2-19Z", 336, 226, 56, 60, 6)}
      ${scrap(2, "M302 292l20-4 9 9-4 14-15 4-11-8Z", 298, 286, 34, 30, 3)}
      ${scrap(3, "M240 306l15-3 6 7-3 10-12 2-7-7Z", 236, 300, 26, 22, 2)}`;
  }

  // D · The witness tag: a reading lens over the leaf, and a museum tag tied to the fragment by a thread.
  function tag(id) {
    return `<defs><clipPath id="hv-lens-${id}"><circle cx="352" cy="214" r="30"/></clipPath></defs>
      <g class="hv-lens"><circle class="hv-glass" cx="352" cy="214" r="30"/>
        <g clip-path="url(#hv-lens-${id})"><g class="ms-ink hv-big" transform="translate(-120 -150) scale(1.5)">${lines(286, 230, 54, 9, 7.2)}</g></g>
        <circle class="hv-rim" cx="352" cy="214" r="30"/><circle class="hv-rim hv-rim-2" cx="352" cy="214" r="34"/>
        <path class="hv-handle" d="M376 238 404 266"/></g>
      <g class="hv-tag"><path class="hv-thread" d="M288 224Q320 282 336 286"/>
        <g transform="rotate(-12 362 292)"><path class="mh-sheet mh-sheet-front" d="M336 280h52v26h-52l-8-13Z"/><circle class="ms-roll-end" cx="340" cy="293" r="2.4"/>
        <path class="hv-label" d="M348 288h30M348 294h22M348 300h26"/></g></g>`;
  }

  const VARIANTS = [
    ["A", "The library behind", "Bound books, closed, stacked and leaning behind the leaf: the codex as it ended up, on shelves.", (id) => [library(), ""]],
    ["B", "Jar and pen", "A lidded storage jar like those the scrolls were found in, and a reed pen at its inkwell: where the text was kept, and how it was copied.", (id) => [jar(), ""]],
    ["C", "Scattered witnesses", "Three smaller scraps lying apart, each tied back to the fragment by a dotted thread: pieces of one book, waiting to be reunited.", (id) => ["", scattered(id)]],
    ["D", "The witness tag", "A reading lens enlarging the leaf's writing, and a museum tag tied to the fragment: the witness, looked at closely and catalogued.", (id) => ["", tag(id)]],
  ];

  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  const header = Frame.header, footer = Frame.footer;
  Frame.header = () => header().replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}
      <span class="sep"`).replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  main.insertAdjacentHTML("beforeend", `<div class="wrap hv-page">
    <p class="hv-kicker">Manuscripts · the opening drawing</p>
    <h1>Four ways to <em>fill the corner</em></h1>
    <p class="hv-lede">The drawing as it is, unchanged, with one addition each, mostly in the empty corner at the bottom right.</p>
    <div class="hv-grid">${VARIANTS.map(([letter, name, line, make], i) => { const [back, front] = make(i); return `<section class="hv-card hv-${letter.toLowerCase()}">
      <header><span>${letter}</span><div><h2>${name}</h2><p>${line}</p></div></header>${art(i, back, front)}</section>`; }).join("")}</div></div>`);
})();
