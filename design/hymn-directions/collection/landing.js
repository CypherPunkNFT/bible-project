// The face of the Hymns page: the big plain-type intro with four quiet figures, then a slow row of hymn cards drifting
// by (the best-known hymns in the collection), each opening its own page. The row pauses under the pointer.
window.Sections = window.Sections || {};
(() => {
  const esc = (text) => String(text).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  // Hymns still sung today, chosen by first line; each is shown only if the collection really holds it.
  const KNOWN = ["Amazing grace", "When I survey the wondrous cross", "Our God, our help in ages past", "Joy to the world",
    "There is a fountain filled with blood", "God moves in a mysterious way", "Glorious things of thee are spoken",
    "How sweet the name of Jesus sounds", "Jesus shall reign", "Alas! and did my Saviour bleed", "There is a land of pure delight", "Begone unbelief"];

  function mount(section) {
    const { hymns, groups, counts, books } = HYMNS;
    const groupById = new Map(groups.map((g) => [g.id, g]));
    const psa = books.findIndex((b) => b.code === "PSA") + 1;
    const psalmsSung = new Set(hymns.filter((h) => Math.floor(h.v / 1e6) === psa).map((h) => Math.floor(h.v / 1e3) % 1000)).size;
    const cards = KNOWN.map((first) => hymns.find((h) => h.t.toLowerCase().replace(/[’']/g, "'").startsWith(first.toLowerCase().replace(/[’']/g, "'")))).filter(Boolean);
    const href = (h) => h.id === "ccel-olney-hymns-41-amazing-grace-how-sweet-the-sound" ? "../d/" : `/study/hymns/${h.id}`;
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
        <dl class="hc-figures">
          <div><dt>Hymns</dt><dd>${formatNumber(counts.distinct)}</dd><small>words held, each once</small></div>
          <div><dt>On a chapter</dt><dd>${formatNumber(counts.withChapter)}</dd><small>the rest on a subject</small></div>
          <div><dt>Hymn books</dt><dd>4</dd><small>by Watts, Newton and Cowper</small></div>
          <div><dt>Psalms sung</dt><dd>${psalmsSung} <small>of 150</small></dd><small>by Watts above all</small></div>
        </dl>
      </div>
      <div class="hc-row" aria-label="Hymns to begin with"><div class="hc-track">${cards.map(card).join("")}${cards.map(card).join("")}</div></div>`;
    // The second copy keeps the row continuous as it drifts; hide it from screen readers and the tab order.
    [...section.querySelectorAll(".hc-card")].slice(cards.length).forEach((a) => { a.setAttribute("aria-hidden", "true"); a.tabIndex = -1; });
  }

  Sections.landing = { mount };
})();
