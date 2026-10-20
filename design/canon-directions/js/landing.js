// The face of the study, in the manner of the Manuscripts page: breadcrumb, the big serif title with its italic line, the
// live page's lede, and the surviving witnesses up top. A draws the gathering (scroll, open codex, and a list whose marks
// keep changing between canonical, instruction and not named); B lays the real codex pictures on the table; C runs them
// as a strip above the map. Every direction closes with one row of figures counted from the research file.
(() => {
  const { D, imgSrc, pictureWhat } = CNX;
  const P = CN.pictured;

  const fig = (label, value, note) => `<div><dt>${label}</dt><dd>${value}</dd><small>${note}</small></div>`;
  const figures = () => [
    fig("Records", D.records.length, "texts, objects and decisions"),
    fig("Kinds of evidence", D.evidenceKinds.length, "not five steps every book climbed"),
    fig("Periods", D.eras.length, "from inherited writings to confessions"),
    fig("Span", "132 BC – 1647", "Sirach's translator to Westminster"),
    fig("Traditions", D.traditions.length, "compared side by side, none the default"),
    fig("Writings traced", D.comparisonRows.length, "rows in the comparison"),
    fig("Sources", D.sources.length, "each one linked where it is used"),
  ];
  const LEDE = `<p class="hc-lede">Before there was a table of contents, there were communities of readers. Follow how writings were gathered, used and recognized as Scripture. Each list belongs to a place, a time and a conversation.</p>`;
  const intro = (accent, { title = "How the canon took shape", lede = LEDE, start = ["#registers", "Compare the evidence"] } = {}) => `<div>
      <p class="hc-crumb"><a href="/study/academic?area=texts">Study</a><span>/</span><a href="/study/academic?area=texts">The Bible: formation &amp; transmission</a><span>/</span>${title}</p>
      <h1>${title}<em>${accent}</em></h1>
      <p class="cn-lead">The writing stays the same. The claim changes.</p>
      ${lede}
      ${start ? `<a href="${start[0]}" class="cn-start">${start[1]} <span aria-hidden="true">↓</span></a>` : ""}
    </div>`;

  // Rows of writing as short ragged strokes.
  function lines(x, y, width, rows, gap, opts = {}) {
    return Array.from({ length: rows }, (_, r) => {
      const w = width - ((r * 7 + x) % 11) - (r === rows - 1 ? width * 0.4 : 0);
      return `<path d="M${(opts.right ? x + width - w : x).toFixed(1)} ${(y + r * gap).toFixed(1)}h${w.toFixed(1)}" stroke-dasharray="${opts.dash ?? "6 2 3 1.5"}" opacity="${(0.34 + (r % 4) * 0.12).toFixed(2)}"/>`;
    }).join("");
  }
  // A: the drawing. A scroll and an open codex (forms only, no manuscript reproduced) feed a list leaf; each entry's mark
  // keeps changing between the three ways a writer can place the same book.
  function gathering() {
    const entries = Array.from({ length: 9 }, (_, i) => {
      const y = 112 + i * 17;
      return `<g class="cg-row" style="--i:${i}"><circle class="cg-mark" cx="300" cy="${y}" r="4.2"/><path class="cg-entry" d="M312 ${y}h${46 - ((i * 13) % 17)}"/></g>`;
    }).join("");
    return `<figure class="ms-hero-art cn-hero-art" aria-hidden="true"><svg viewBox="0 0 420 330">
      <ellipse class="ms-orbit" cx="214" cy="170" rx="196" ry="128"/>
      <ellipse class="ms-orbit ms-orbit-2" cx="214" cy="170" rx="160" ry="150" transform="rotate(-18 214 170)"/>
      <path class="hv-thread" d="M150 128Q232 92 288 108M168 236Q236 250 288 226"/>
      <g class="ms-scroll"><g transform="rotate(-10 120 100)">
        <path class="mh-sheet" d="M52 56 H192 V146 H52Z"/>
        <path class="ms-roll" d="M38 52 h14 v98 h-14 a7 4 0 0 1 0 -8 v-82 a7 4 0 0 1 0 -8Z M192 52 h14 a7 4 0 0 1 0 8 v82 a7 4 0 0 1 0 8 h-14Z"/>
        <ellipse class="ms-roll-end" cx="45" cy="52" rx="7" ry="3.5"/><ellipse class="ms-roll-end" cx="199" cy="52" rx="7" ry="3.5"/>
        <g class="ms-ink">${lines(62, 70, 36, 10, 7, { right: true, dash: "4 1.5 7 1.5" })}${lines(106, 70, 36, 10, 7, { right: true, dash: "4 1.5 7 1.5" })}${lines(150, 70, 34, 10, 7, { right: true, dash: "4 1.5 7 1.5" })}</g>
      </g></g>
      <g class="ms-leaf"><g transform="rotate(-3 150 240)">
        <path class="mh-sheet" d="M150 196c-22-9-56-12-96-7v96c40-5 74-2 96 7 22-9 56-12 96-7v-96c-40-5-74-2-96 7z"/>
        <path class="mh-sheet-front" d="M150 196v96" stroke="currentColor" stroke-opacity=".45"/>
        <g class="ms-ink">${lines(66, 210, 32, 9, 8)}${lines(104, 210, 36, 9, 8)}${lines(160, 210, 36, 9, 8)}${lines(202, 210, 32, 9, 8)}</g>
      </g></g>
      <g class="cg-list"><g transform="rotate(4 330 180)">
        <path class="mh-sheet mh-sheet-front" d="M282 76h96v196h-96z"/>
        <path class="cg-rule" d="M292 94h76"/>
        ${entries}
        <path class="cg-rule" d="M292 268h40"/>
      </g></g>
      <path class="ms-mark" d="M28 52h10m-5-5v10M384 296h10m-5-5v10M372 40h8m-4-4v8"/>
    </svg>
    <span class="ms-art-top">Copied · read · listed</span>
    <span class="ms-art-note"><i></i>One writing, three placings.<br><span>Canonical · instruction · not named.</span></span>
    </figure>`;
  }
  // B: the real pictures laid on the table, slightly turned; each opens its record or catalogue card.
  const SPOTS = [[2, 4, -6, 27], [27, 1, 3, 28], [51, 5, -3, 27], [76, 2, 5, 22], [16, 55, 4, 23], [44, 56, -4, 23]];
  function table() {
    const order = ["Q152962", "Q209285", "Q318233", "Q1513469", "Q733492", "Q637584"];
    return `<figure class="cn-table" aria-label="Six surviving codices"><div class="cn-table-top">${order.map((q, i) => {
      const p = P.find((x) => x.q === q), [left, top, turn, width] = SPOTS[i];
      return `<button type="button" class="cn-photo" data-picture="${q}" style="--l:${left}%;--t:${top}%;--r:${turn}deg;--w:${width}%;--z:${i}">
        <img src="${imgSrc(q)}" width="${p.w}" height="${p.h}" alt="${esc(`${p.name}: ${pictureWhat(p)}`)}"><span><b>${esc(p.name)}</b>${esc(p.date)}</span></button>`;
    }).join("")}</div><figcaption>Six surviving codices, pictured from Wikimedia Commons (public domain). Open any for its credit and catalogue record.</figcaption></figure>`;
  }
  // C: the same pictures as one strip under the title.
  function strip() {
    return `<figure class="cn-strip"><div class="cn-strip-row">${P.map((p) => `<button type="button" class="cn-strip-item" data-picture="${p.q}">
        <img src="${imgSrc(p.q)}" width="${p.w}" height="${p.h}" alt="${esc(`${p.name}: ${pictureWhat(p)}`)}"><span><b>${esc(p.name)}</b>${esc(p.date)}</span></button>`).join("")}</div>
      <figcaption>Surviving witnesses, from a papyrus book of Paul's letters to the great Greek and Hebrew codices, pictured from Wikimedia Commons (public domain). Open any for its credit.</figcaption></figure>`;
  }

  // D: before anything else, say what the word means and which Bibles it names, with each tradition's own count.
  const COUNTS = [
    ["Jewish · Tanakh", "24", "Torah, Prophets and Writings"],
    ["Protestant · Westminster", "66", "39 Old Testament + 27 New"],
    ["Roman Catholic", "73", "46 Old Testament + 27 New"],
    ["Eastern Orthodox", "More", "adds Tobit, Judith, Wisdom, Sirach, Maccabees and others"],
    ["Ethiopian Orthodox", "81", "46 Old Testament + 35 New"],
  ];
  const canon = () => `<div class="cn-canon"><div><p class="kicker">First, what “canon” means</p>
      <p>The word comes from the Greek <i>kanōn</i>, a measuring rod or rule. Said of Scripture, a canon is <strong>the list of books a community receives as its Bible</strong>. There is more than one such list, and they still differ today.</p>
      <p class="cn-caption">The 24 and the 39 are the same Hebrew books, counted and grouped differently.</p></div>
      <dl class="cn-counts">${COUNTS.map(([who, n, what]) => `<div><dt>${who}</dt><dd>${n}</dd><small>${what}</small></div>`).join("")}</dl></div>`;

  // D: the lede says what the contents page would be of (the Bible), and walks the reader through the page in two paragraphs.
  const D_LEDE = `<p class="hc-lede">Before the Bible had a table of contents, there were communities of readers. Jews and Christians copied writings by hand, read them aloud in worship and quoted them in argument. Over centuries, some drew up lists of the books they held to be Scripture, and those lists did not all agree.</p>
      <p class="hc-lede">This page follows that process through what survives: the manuscripts themselves, the writers who quoted and recommended books, and the councils and confessions that finally named them. Each list belongs to a place, a time and a conversation, and each piece of evidence can show only so much.</p>`;

  function mount(section, { d }) {
    if (d === "d") section.innerHTML = `<div class="hc-intro ms-intro cn-intro-d">${intro("Gathered, read, listed", { title: "The canon takes shape", lede: D_LEDE, start: null })}${gathering()}</div>${canon()}<dl class="ms-figures">${figures().join("")}</dl>`;
    if (d === "a") section.innerHTML = `<div class="hc-intro ms-intro">${intro("Gathered, read, listed")}${gathering()}</div><dl class="ms-figures">${figures().join("")}</dl>`;
    if (d === "b") section.innerHTML = `<div class="hc-intro cn-intro-b">${intro("The surviving witnesses")}${table()}</div><dl class="ms-figures">${figures().join("")}</dl>`;
    if (d === "c") section.innerHTML = `<div class="hc-intro cn-intro-c">${intro("Where the lists were made")}</div>${strip()}<dl class="ms-figures">${figures().join("")}</dl>`;
  }
  Sections.landing = { mount };
})();
