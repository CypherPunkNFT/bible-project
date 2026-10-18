// 05 and 06 · Every hymn, two ways, one above the other so the owner can choose:
//   05 the card catalogue, as the Teachers page's "Every teacher, one place" (src/pages/teachers/preachers/catalogue):
//      search and filters on the left, a sort bar, a scrolling grid of cards;
//   06 the list catalogue, as the Teachers page's "The texts we hold" (src/pages/teachers/shared/AcquiredCatalogue):
//      a search and a select, two columns of names that open in place, 24 to a page.
window.Sections = window.Sections || {};
(() => {
  const esc = (text) => String(text).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const SECTION_LABEL = { history: "History", poetry: "Poetry & Wisdom", prophets: "Prophets", gospels: "Gospels & Acts", epistles: "Epistles", revelation: "Revelation" };
  const normalise = (text) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase();
  const METRES = { "8,6,8,6": "Common Metre", "8.6.8.6": "Common Metre", "8,8,8,8": "Long Metre", "8.8.8.8": "Long Metre", "6,6,8,6": "Short Metre", "6.6.8.6": "Short Metre" };
  const metreName = (m) => METRES[m] ?? (m ? "Other metres" : "Not recorded");
  const DISC = { psalms: "IW", hss: "IW", divine: "IW", newton: "JN", cowper: "WC" };

  function rows() {
    const { hymns, groups, books } = HYMNS;
    const groupById = new Map(groups.map((g) => [g.id, g]));
    return hymns.map((h) => {
      const g = groupById.get(h.g), b = h.v ? books[Math.floor(h.v / 1e6) - 1] : null;
      const section = b ? b.section : "none";
      return { h, g, section, metre: metreName(h.m), href: h.id === "ccel-olney-hymns-41-amazing-grace-how-sweet-the-sound" ? "../d/" : `/study/hymns/${h.id}`,
        search: normalise([h.t, h.s, h.r, g.label, g.who].join(" ")) };
    });
  }

  // ── 05 · the card catalogue ──────────────────────────────────────────────────────────────────────────────────────
  function mountCards(section) {
    const all = rows();
    const { groups } = HYMNS;
    const filters = { g: [], section: [], metre: [] };
    let query = "", sort = "bible";
    const SORTS = [["bible", "Bible order"], ["az", "A–Z"], ["book", "Hymn book"]];
    const SECTIONS = [...Object.entries(SECTION_LABEL), ["none", "On a subject"]];
    const metres = ["Common Metre", "Long Metre", "Short Metre", "Other metres", "Not recorded"];
    section.style.setProperty("--tone", "var(--accent)");
    section.innerHTML = `
      <header class="t-head"><span class="t-num">05</span><div><p class="kicker">The catalogue · cards</p>
        <h2>Every hymn, <em>one place</em></h2>
        <p>Search by first line, subject or passage, or narrow by hymn book, part of the Bible and metre. A card opens the hymn.</p></div></header>
      <div class="pc-layout">
        <aside class="pc-filters" aria-label="Filter the hymns">
          <div class="pc-filter-head"><span>Filter</span><button type="button" data-clear hidden>Clear all</button></div>
          <label class="pc-search">${icon("search", 16)}<input type="search" aria-label="Search hymns" placeholder="First line, subject or passage"></label>
          <div class="pc-facets"></div>
        </aside>
        <div class="pc-results">
          <div class="pc-toolbar"><p class="pc-result-count" aria-live="polite"></p>
            <div class="pc-sort" role="radiogroup" aria-label="Sort hymns"><span>Sort</span>${SORTS.map(([k, l]) => `<button type="button" role="radio" data-sort="${k}" aria-checked="${k === sort}">${l}</button>`).join("")}</div></div>
          <div class="pc-scroll" tabindex="0" role="region" aria-label="Hymn cards"><div class="pc-grid"></div></div>
        </div>
      </div>`;
    const $ = (s) => section.querySelector(s);
    // The card grid scrolls with the page's standard outside scroll: a pill with no track, outside the right edge.
    const cardScroll = OutsideScroll.wrap($(".pc-scroll"));
    const words = () => normalise(query).trim().split(/\s+/).filter(Boolean);
    const matches = (r, ignore) => words().every((w) => r.search.includes(w))
      && (ignore === "g" || !filters.g.length || filters.g.includes(r.g.id))
      && (ignore === "section" || !filters.section.length || filters.section.includes(r.section))
      && (ignore === "metre" || !filters.metre.length || filters.metre.includes(r.metre));
    const facet = (key, title, options) => `<div class="pc-facet"><h3>${title}</h3><div class="pc-options">${options.map(([value, label, tone]) =>
      `<button type="button" data-facet="${key}" data-value="${esc(value)}" aria-pressed="${filters[key].includes(value)}" ${tone ? `style="--tone: var(${tone})"` : ""}>${tone ? "<i></i>" : ""}<span>${esc(label)}</span><em>${all.filter((r) => (key === "g" ? r.g.id : r[key]) === value && matches(r, key)).length}</em></button>`).join("")}</div></div>`;
    const card = (r) => `<article class="pc-card" style="--tone: var(${r.g.tone})">
        <div class="pc-card-top"><span class="pc-mark" aria-hidden="true">${DISC[r.g.id]}</span><span class="pc-badge">${r.h.v ? esc(r.h.r) : "On a subject"}</span></div>
        <h3>${esc(r.h.t.replace(/[,;:]$/, ""))}</h3><p class="pc-meta">${esc(r.h.a)} · ${r.h.y}</p>
        <p class="pc-tags"><span>${esc(r.g.short)}</span><span>${esc(r.metre)}</span></p>
        <div class="pc-work"><small>${r.h.s ? "Subject" : "Hymn book"}</small><div><strong>${esc(r.h.s || r.g.label)}</strong></div></div>
        <a class="pc-card-hit" href="${r.href}" aria-label="Open ${esc(r.h.t)}"></a></article>`;
    function render() {
      const visible = all.filter((r) => matches(r)).sort((a, b) => sort === "az" ? a.h.t.localeCompare(b.h.t)
        : sort === "book" ? groups.findIndex((g) => g.id === a.g.id) - groups.findIndex((g) => g.id === b.g.id) || a.h.t.localeCompare(b.h.t)
        : (a.h.v || 1e10) - (b.h.v || 1e10) || a.h.t.localeCompare(b.h.t));
      $(".pc-facets").innerHTML = facet("g", "Hymn book", groups.map((g) => [g.id, g.short, g.tone]))
        + facet("section", "Part of the Bible", SECTIONS.map(([k, l]) => [k, l, k === "none" ? "" : `--${k}`]))
        + facet("metre", "Metre", metres.map((m) => [m, m]));
      $(".pc-result-count").innerHTML = `<strong>${formatNumber(visible.length)}</strong> of ${formatNumber(all.length)} hymns`;
      $(".pc-grid").innerHTML = visible.slice(0, 240).map(card).join("") || `<div class="pc-empty"><p>No hymn matches these filters.</p></div>`;
      if (visible.length > 240) $(".pc-grid").insertAdjacentHTML("beforeend", `<p class="pc-more">Showing the first 240 of ${formatNumber(visible.length)}. Narrow the filters to see the rest.</p>`);
      $("[data-clear]").hidden = !(query.trim() || Object.values(filters).some((v) => v.length));
      cardScroll.reset();
    }
    $("input").addEventListener("input", (e) => { query = e.target.value; render(); });
    section.addEventListener("click", (e) => {
      const f = e.target.closest("[data-facet]");
      if (f) { const list = filters[f.dataset.facet], v = f.dataset.value; list.includes(v) ? list.splice(list.indexOf(v), 1) : list.push(v); render(); return; }
      const s = e.target.closest("[data-sort]");
      if (s) { sort = s.dataset.sort; section.querySelectorAll("[data-sort]").forEach((b) => b.setAttribute("aria-checked", String(b === s))); render(); return; }
      if (e.target.closest("[data-clear]")) { query = ""; $("input").value = ""; Object.values(filters).forEach((v) => v.splice(0)); render(); }
    });
    render();
  }

  // ── 06 · the list catalogue ──────────────────────────────────────────────────────────────────────────────────────
  function mountList(section) {
    const all = rows().sort((a, b) => a.h.t.localeCompare(b.h.t));
    const { groups } = HYMNS;
    const PAGE = 24;
    let query = "", group = "", page = 0;
    section.style.setProperty("--tone", "var(--accent)");
    section.innerHTML = `
      <header class="t-head"><span class="t-num">06</span><div><p class="kicker">The catalogue · list</p>
        <h2>Every hymn, <em>by first line</em></h2>
        <p>The whole collection in first-line order, the way hymn books index themselves. Open a line to see its book, passage and metre.</p></div></header>
      <div class="acq-controls"><label>Find a hymn<input placeholder="First line, subject or passage"></label>
        <label>Hymn book<select><option value="">All hymn books</option>${groups.map((g) => `<option value="${g.id}">${esc(g.label)}</option>`).join("")}</select></label></div>
      <p class="acq-caption"></p>
      <div class="acq-contributors"></div>
      <nav class="acq-pagination" aria-label="Hymn pages"><button type="button" data-prev>Previous</button><span></span><button type="button" data-next>Next</button></nav>`;
    const $ = (s) => section.querySelector(s);
    const item = (r) => `<details style="--tone: var(${r.g.tone})"><summary><strong>${esc(r.h.t.replace(/[,;:]$/, ""))}</strong><span>${esc(r.g.short)} · ${r.h.y}${r.h.v ? ` · ${esc(r.h.r)}` : ""}</span></summary>
        <p class="acq-caption">${esc(r.g.label)}, ${esc(r.h.a)}, ${r.h.y}. ${r.h.s ? `Subject: ${esc(r.h.s)}. ` : ""}${r.h.v ? `Written on ${esc(r.h.r)}. ` : "Written on a subject rather than a passage. "}Metre: ${esc(r.h.m ? `${r.h.m.replace(/,/g, ".")} (${r.metre})` : "not recorded")}.</p>
        <p class="acq-links"><a href="${r.href}">Open the hymn ${icon("arrowRight", 13)}</a>${r.h.v ? `<a href="/read/kjv/${HYMNS.books[Math.floor(r.h.v / 1e6) - 1].code}/${Math.floor(r.h.v / 1e3) % 1000}">Read ${esc(r.h.r.split(":")[0])} ${icon("book", 13)}</a>` : ""}</p></details>`;
    function render() {
      const words = normalise(query).trim().split(/\s+/).filter(Boolean);
      const found = all.filter((r) => (!group || r.g.id === group) && words.every((w) => r.search.includes(w)));
      const pages = Math.max(1, Math.ceil(found.length / PAGE));
      page = Math.min(page, pages - 1);
      $(".acq-caption").textContent = `${query || group ? `${formatNumber(found.length)} of ${formatNumber(all.length)} hymns match` : `${formatNumber(all.length)} hymns`}, each listed once.`;
      $(".acq-contributors").innerHTML = found.slice(page * PAGE, (page + 1) * PAGE).map(item).join("") || `<p class="acq-caption">No hymn matches.</p>`;
      $(".acq-pagination span").textContent = `${page + 1} / ${pages}`;
      $("[data-prev]").disabled = !page; $("[data-next]").disabled = page >= pages - 1;
    }
    $("input").addEventListener("input", (e) => { query = e.target.value; page = 0; render(); });
    $("select").addEventListener("change", (e) => { group = e.target.value; page = 0; render(); });
    $("[data-prev]").addEventListener("click", () => { page--; render(); });
    $("[data-next]").addEventListener("click", () => { page++; render(); });
    render();
  }

  Sections.cards = { mount: mountCards };
  Sections.list = { mount: mountList };
})();
