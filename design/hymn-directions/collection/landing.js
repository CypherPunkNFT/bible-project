// The face of the Hymns page: the big plain-type intro with its four figures in a row under the title and the organ pipes
// beside it (one pipe per book of the Bible, as tall as the hymns written on it), then a slow row of hymn cards drifting
// by (the best-known hymns in the collection), each opening its own page. The row pauses under the pointer.
window.Sections = window.Sections || {};
(() => {
  const esc = (text) => String(text).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  // Hymns still sung today, chosen by first line; each is shown only if the collection really holds it.
  const KNOWN = ["Amazing grace", "When I survey the wondrous cross", "Our God, our help in ages past", "Joy to the world",
    "There is a fountain filled with blood", "God moves in a mysterious way", "Glorious things of thee are spoken",
    "How sweet the name of Jesus sounds", "Jesus shall reign", "Alas! and did my Saviour bleed", "There is a land of pure delight", "Begone unbelief"];

  // The organ pipes: Genesis to Revelation, coloured by section. The tallest book (the Psalms) is cut down to PEAK with a
  // break mark across it, and every other pipe is scaled against the second tallest, so the Psalms do not tower.
  const SECTIONS = [["history", "Law & history"], ["poetry", "Poetry"], ["prophets", "Prophets"], ["gospels", "Gospels & Acts"], ["epistles", "Letters"], ["revelation", "Rev."]];
  const NAMED = new Set(["Genesis", "Isaiah", "Luke", "Revelation"]);
  function pipes(books, hymns) {
    const counts = books.map(() => 0);
    for (const h of hymns) if (h.v) counts[Math.floor(h.v / 1e6) - 1] += 1;
    const order = [...counts].sort((a, b) => b - a), peakAt = counts.indexOf(order[0]), second = order[1];
    const LEFT = 18, STEP = 8.6, W = 5.8, BASE = 150, PEAK = 132;
    const body = books.map((b, i) => {
      const n = counts[i], x = LEFT + i * STEP, h = i === peakAt ? PEAK : n ? 16 + Math.sqrt(n / second) * 68 : 6, top = BASE - h;
      let label = "";
      if (i === peakAt) label = `<text class="hc-pipe-name" x="${x - 6}" y="${top + 9}" text-anchor="end">${esc(b.name)}</text><text class="hc-pipe-n" x="${x - 6}" y="${top + 21}" text-anchor="end">${formatNumber(n)} hymns</text>`;
      else if (NAMED.has(b.name)) {
        const end = i === books.length - 1, lx = end ? x + W : x + W / 2, anchor = end ? "end" : "middle";
        label = `<text class="hc-pipe-name" x="${lx}" y="${top - 16}" text-anchor="${anchor}">${esc(b.name)}</text><text class="hc-pipe-n" x="${lx}" y="${top - 5}" text-anchor="${anchor}">${n}</text>`;
      }
      const cut = i === peakAt ? `<path d="M${x - 1} ${top + 52} L${x + W + 1} ${top + 47} M${x - 1} ${top + 57} L${x + W + 1} ${top + 52}" stroke="var(--page)" stroke-width="1.6"/>` : "";
      const mouth = n ? `<path d="M${x + 1.1} ${BASE - 7} q${W / 2 - 1.1} -3 ${W - 2.2} 0" stroke="var(--page)" stroke-width="1.1" fill="none"/>` : "";
      return `<g class="pipe${n ? "" : " silent"}" style="color: var(--${b.section}); animation-delay: ${(i * 0.055).toFixed(2)}s">
        <rect x="${x}" y="${top}" width="${W}" height="${h}" rx="1" fill="currentColor"/>
        <path d="M${x} ${BASE} L${x + W / 2} ${BASE + 10} L${x + W} ${BASE}" fill="currentColor" fill-opacity=".45"/>${mouth}${cut}</g>${label}`;
    }).join("");
    const sections = SECTIONS.map(([id, label]) => {
      const idx = books.flatMap((b, i) => (b.section === id ? [i] : []));
      if (!idx.length) return "";
      const x1 = LEFT + idx[0] * STEP, x2 = LEFT + idx[idx.length - 1] * STEP + W;
      return `<path d="M${x1} 167 V170 H${x2} V167" fill="none" stroke="var(--${id})" stroke-opacity=".6"/><text class="hc-pipe-section" x="${(x1 + x2) / 2}" y="181" text-anchor="middle">${label}</text>`;
    }).join("");
    const sung = counts.filter(Boolean).length;
    return `<figure class="hc-pipes"><svg viewBox="0 0 600 186" role="img" aria-label="Hymns written on each book of the Bible, Genesis to Revelation">
      <text class="hc-pipe-section" x="590" y="10" text-anchor="end">${sung} of ${books.length} books sung · one pipe per book</text>
      <path d="M10 160 H590" stroke="var(--line)" stroke-width="1.5"/>${body}${sections}</svg></figure>`;
  }

  function mount(section) {
    const { hymns, groups, counts, books } = HYMNS;
    const groupById = new Map(groups.map((g) => [g.id, g]));
    const psa = books.findIndex((b) => b.code === "PSA") + 1;
    const psalmsSung = new Set(hymns.filter((h) => Math.floor(h.v / 1e6) === psa).map((h) => Math.floor(h.v / 1e3) % 1000)).size;
    const cards = KNOWN.map((first) => hymns.find((h) => h.t.toLowerCase().replace(/[’']/g, "'").startsWith(first.toLowerCase().replace(/[’']/g, "'")))).filter(Boolean);
    const href = (h) => h.id === "ccel-olney-hymns-41-amazing-grace-how-sweet-the-sound" ? "../a/" : `/study/hymns/${h.id}`;
    const card = (h) => { const g = groupById.get(h.g); return `<a class="hc-card" href="${href(h)}" style="--tone: var(${g.tone})">
      <span class="hc-kicker">${esc(g.who)} · ${h.y}</span><span class="hc-first">${esc(h.t.replace(/[,;:]$/, ""))}</span>
      <span class="hc-book">${esc(g.id === "newton" || g.id === "cowper" ? "Olney Hymns" : g.label)}</span></a>`; };

    section.innerHTML = `
      <div class="hc-intro">
        <div>
          <p class="hc-crumb"><a href="/study">Study</a><span>/</span><a href="/study/theology">Living the Christian Life</a><span>/</span>Hymns</p>
          <h1>Hymns<em>the faith, sung</em></h1>
          <p class="hc-lede">Two English hymn books, 1707 to 1779: Isaac Watts's psalms and hymns, and the <i>Olney Hymns</i> of John Newton and
            William Cowper. Every hymn whose words we hold opens on its own page, beside the Scripture it was written on.</p>
        </div>
        ${pipes(books, hymns)}
      </div>
      <dl class="hc-figures">
            <div><dt>Hymns</dt><dd>${formatNumber(counts.distinct)}</dd><small>words held, each once</small></div>
            <div><dt>On a chapter</dt><dd>${formatNumber(counts.withChapter)}</dd><small>the rest on a subject</small></div>
            <div><dt>Hymn books</dt><dd>4</dd><small>by Watts, Newton and Cowper</small></div>
            <div><dt>Psalms sung</dt><dd>${psalmsSung} <small>of 150</small></dd><small>by Watts above all</small></div>
        <div><dt>Books sung</dt><dd>${new Set(hymns.filter((h) => h.v).map((h) => Math.floor(h.v / 1e6))).size} <small>of ${books.length}</small></dd><small>Genesis to Revelation</small></div>
        <div><dt>Years</dt><dd>1707–1779</dd><small>from Watts to the Olney Hymns</small></div>
          </dl>
      <div class="hc-row" aria-label="Hymns to begin with"><div class="hc-track">${cards.map(card).join("")}${cards.map(card).join("")}</div></div>`;
    // The second copy keeps the row continuous as it drifts; hide it from screen readers and the tab order.
    [...section.querySelectorAll(".hc-card")].slice(cards.length).forEach((a) => { a.setAttribute("aria-hidden", "true"); a.tabIndex = -1; });
  }

  Sections.landing = { mount };
})();
