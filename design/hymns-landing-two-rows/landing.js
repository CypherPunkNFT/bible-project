// Hymns landing mock-up (owner, 2026-10-18): the live landing up to the first section, with the organ pipes split into
// two rows, the Old Testament over the New, and no "most sung chapters" line. Data: ../hymn-directions/shared/collection-data.js.
(() => {
  const esc = (text) => String(text).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const { hymns, groups, counts, books } = HYMNS;
  const KNOWN = ["Amazing grace", "When I survey the wondrous cross", "Our God, our help in ages past", "Joy to the world",
    "There is a fountain filled with blood", "God moves in a mysterious way", "Glorious things of thee are spoken",
    "How sweet the name of Jesus sounds", "Jesus shall reign", "Alas! and did my Saviour bleed", "There is a land of pure delight", "Begone unbelief"];
  const WRITERS = [
    { name: "Isaac Watts", dates: "1674–1748", books: "Psalms Imitated, Hymns & Songs", tone: "--poetry" },
    { name: "John Newton", dates: "1725–1807", books: "Olney Hymns, 1779", tone: "--history" },
    { name: "William Cowper", dates: "1731–1800", books: "Olney Hymns, 1779", tone: "--prophets" },
  ];
  const SECTIONS = [["history", "Law & history"], ["poetry", "Poetry"], ["prophets", "Prophets"], ["gospels", "Gospels & Acts"], ["epistles", "Letters"], ["revelation", "Rev."]];

  const perBook = books.map(() => 0);
  for (const h of hymns) if (h.v) perBook[Math.floor(h.v / 1e6) - 1] += 1;
  const order = [...perBook].sort((a, b) => b - a), peakAt = perBook.indexOf(order[0]), second = order[1];

  // One row of pipes. Every pipe in both rows has the same width and scale, so the two Testaments compare directly; the
  // tallest book (the Psalms) is cut down with a break mark and labelled to its left.
  const STEP = 14.8, W = 10, PEAK = 112;
  function row(first, last, named) {
    const idx = []; for (let i = first; i <= last; i++) idx.push(i);
    const tallest = Math.max(...idx.map((i) => (i === peakAt ? PEAK : 14 + Math.sqrt(perBook[i] / second) * 66)));
    const base = tallest + 26, height = base + 34, left = (600 - ((idx.length - 1) * STEP + W)) / 2; // each row centred
    const body = idx.map((i, k) => {
      const b = books[i], n = perBook[i], x = left + k * STEP, h = i === peakAt ? PEAK : n ? 14 + Math.sqrt(n / second) * 66 : 6, top = base - h;
      let label = "";
      if (i === peakAt) label = `<text class="hc-pipe-name" x="${x - 6}" y="${top + 10}" text-anchor="end">${esc(b.name)}</text><text class="hc-pipe-n" x="${x - 6}" y="${top + 22}" text-anchor="end">${formatNumber(n)} hymns</text>`;
      else if (named.includes(b.name)) {
        const anchor = k === 0 ? "start" : "middle", lx = k === 0 ? x : x + W / 2;
        label = `<text class="hc-pipe-name" x="${lx}" y="${top - 15}" text-anchor="${anchor}">${esc(b.name)}</text><text class="hc-pipe-n" x="${lx}" y="${top - 4}" text-anchor="${anchor}">${n}</text>`;
      }
      const cut = i === peakAt ? `<path d="M${x - 1} ${top + 46} L${x + W + 1} ${top + 40} M${x - 1} ${top + 51} L${x + W + 1} ${top + 45}" stroke="var(--page)" stroke-width="1.8"/>` : "";
      const mouth = n ? `<path d="M${x + 1.5} ${base - 9} q${W / 2 - 1.5} -4 ${W - 3} 0" stroke="var(--page)" stroke-width="1.3" fill="none"/>` : "";
      return `<g class="pipe${n ? "" : " silent"}" style="color: var(--${b.section}); animation-delay: ${(k * 0.07).toFixed(2)}s">
        <rect x="${x}" y="${top}" width="${W}" height="${h}" rx="1.4" fill="currentColor"/>
        <path d="M${x} ${base} L${x + W / 2} ${base + 12} L${x + W} ${base}" fill="currentColor" fill-opacity=".45"/>${mouth}${cut}</g>${label}`;
    }).join("");
    const sections = SECTIONS.map(([id, label]) => {
      const in_ = idx.filter((i) => books[i].section === id);
      if (!in_.length) return "";
      const x1 = left + (in_[0] - first) * STEP, x2 = left + (in_[in_.length - 1] - first) * STEP + W;
      return `<path d="M${x1} ${base + 18} V${base + 21} H${x2} V${base + 18}" fill="none" stroke="var(--${id})" stroke-opacity=".6"/><text class="hc-pipe-section" x="${(x1 + x2) / 2}" y="${base + 32}" text-anchor="middle">${label}</text>`;
    }).join("");
    return `<svg viewBox="0 0 600 ${height}" role="img">${body}${sections}</svg>`;
  }

  const byGroup = new Map(groups.map((g) => [g.id, g]));
  const psa = books.findIndex((b) => b.code === "PSA") + 1;
  const psalmsSung = new Set(hymns.filter((h) => Math.floor(h.v / 1e6) === psa).map((h) => Math.floor(h.v / 1e3) % 1000)).size;
  const booksSung = perBook.filter(Boolean).length;
  const cards = KNOWN.map((f) => hymns.find((h) => h.t.toLowerCase().replace(/[’']/g, "'").startsWith(f.toLowerCase()))).filter(Boolean);
  const card = (h, copy) => { const g = byGroup.get(h.g); return `<a class="hc-card" href="/study/hymns/${h.id}" style="--tone: var(${g.tone})"${copy ? ' aria-hidden="true" tabindex="-1"' : ""}>
    <span class="hc-kicker">${esc(g.who)} · ${h.y}</span><span class="hc-first">${esc(h.t.replace(/[,;:]$/, ""))}</span>
    <span class="hc-book">${esc(g.id === "newton" || g.id === "cowper" ? "Olney Hymns" : g.label)}</span></a>`; };

  const main = Frame.mount();
  document.querySelectorAll(".site-header .nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "/study"));
  document.querySelectorAll(".site-header img").forEach((img) => { img.src = "../letters-shared/favicon.svg"; });
  main.innerHTML = `<div class="wrap t-page"><section class="t-sec t-sec-landing" aria-label="Hymns">
    <div class="hc-intro">
      <div>
        <p class="hc-crumb"><a href="/study">Study</a><span>/</span><a href="/study/theology?area=life">Living the Christian Life</a><span>/</span>Hymns</p>
        <h1>Hymns<em>the faith, sung</em></h1>
        <p class="hc-lede">Two English hymn books, 1707 to 1779: Isaac Watts's psalms and hymns, and the <i>Olney Hymns</i> of John Newton and
          William Cowper. Every hymn whose words we hold opens on its own page, beside the Scripture it was written on.</p>
        <ul class="hc-writers">${WRITERS.map((w) => `<li style="--tone: var(${w.tone})"><span class="hc-w-name">${w.name}</span><span class="hc-w-dates">${w.dates}</span>
          <b>${formatNumber(hymns.filter((h) => h.a === w.name).length)} hymns</b><small>${esc(w.books)}</small></li>`).join("")}</ul>
        <a class="hc-begin" href="/study/hymns/ccel-olney-hymns-41-amazing-grace-how-sweet-the-sound">Begin with <i>Amazing Grace</i> and every verse its lines echo<span aria-hidden="true">→</span></a>
      </div>
      <figure class="hc-rows" aria-label="Hymns written on each book of the Bible, Genesis to Revelation">
        <div>${row(0, 38, ["Genesis", "Judges", "Isaiah", "Zechariah"])}</div>
        <div>${row(39, 65, ["Luke", "Romans", "Hebrews", "Revelation"])}</div>
      </figure>
    </div>
    <dl class="hc-figures">
      <div><dt>Hymns</dt><dd>${formatNumber(counts.distinct)}</dd><small>words held, each once</small></div>
      <div><dt>On a chapter</dt><dd>${formatNumber(counts.withChapter)}</dd><small>the rest on a subject</small></div>
      <div><dt>Hymn books</dt><dd>4</dd><small>by Watts, Newton and Cowper</small></div>
      <div><dt>Psalms sung</dt><dd>${psalmsSung} <small>of 150</small></dd><small>by Watts above all</small></div>
      <div><dt>Books sung</dt><dd>${booksSung} <small>of 66</small></dd><small>Genesis to Revelation</small></div>
      <div><dt>Years</dt><dd>1707–1779</dd><small>from Watts to the Olney Hymns</small></div>
    </dl>
    <div class="hc-row" aria-label="Hymns to begin with"><div class="hc-track">${cards.map((h) => card(h, false)).join("")}${cards.map((h) => card(h, true)).join("")}</div></div>
  </section></div>`;
})();
