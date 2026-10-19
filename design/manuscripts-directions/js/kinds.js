// A · 02 Every manuscript, by kind: the approved "crystals by kind" (large chips, one per kind, with its colour, glyph
// and count) filtering a searchable catalogue below. Each line opens the full record.
(() => {
  const { byDate, booksText, holderText, sigla } = MSX;
  const PAGE = matchMedia("(max-width: 640px)").matches ? 12 : 30;
  const normalise = (text) => String(text).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const GROUPS = ["Greek New Testament", "Greek Old Testament", "Hebrew Bible", "Early translations"];
  const SORTS = [["date", "Oldest first"], ["siglum", "By number"], ["name", "A–Z"]];

  function mount(section, { num }) {
    const counts = Object.fromEntries(KINDS.map((k) => [k.key, 0]));
    for (const r of MS.records) counts[r.k]++;
    const rows = MS.records.map((r) => ({ r, search: normalise([r.n, r.g, r.d, r.c, r.f, holderText(r), booksText(r)].filter(Boolean).join(" ")) }));
    let kind = "", query = "", sort = "date", page = 0;

    const crystal = (k) => `<button type="button" class="cr" data-kind="${k.key}" aria-pressed="false" ${counts[k.key] ? "" : "disabled"} style="--tone: var(${k.tone})">
      <span class="cr-glyph">${glyph(k.glyph, 22)}</span><span class="cr-text"><b>${esc(k.label)}</b><small>${counts[k.key] ? esc(k.line) : "none in the open data yet"}</small></span><em>${formatNumber(counts[k.key])}</em></button>`;
    section.innerHTML = `${head(num, "The catalogue", `Every manuscript, <em>by kind</em>`,
      `Choose a kind to narrow the list, or search by name, number, library or book. ${formatNumber(MS.records.length)} records from Wikidata, the ETCBC Dead Sea Scrolls and Syriaca.org.`)}
      <div class="cr-groups">${GROUPS.map((g) => `<div class="cr-group"><p class="cr-group-name">${esc(g)}</p><div class="cr-list">${KINDS.filter((k) => k.group === g).map(crystal).join("")}</div></div>`).join("")}</div>
      <div class="ct-bar">
        <label class="ct-search">${icon("search", 16)}<input type="search" aria-label="Search the manuscripts" placeholder="Name, number, library or book"></label>
        <div class="ct-sort" role="radiogroup" aria-label="Order">${SORTS.map(([k, l]) => `<button type="button" role="radio" data-sort="${k}" aria-checked="${k === sort}">${l}</button>`).join("")}</div>
      </div>
      <p class="ct-count" aria-live="polite"></p>
      <p class="ct-page" aria-live="polite"></p>
      <div class="ct-table">
        <button type="button" class="ct-arrow" data-prev aria-label="Previous page">${icon("arrowLeft", 16)}</button>
        ${[0, 1].map((n) => `<div class="ct-col"><p class="ct-head" aria-hidden="true"><span></span><span>No.</span><span>Manuscript</span><span>Date</span><span>Where</span></p><ol class="ct-list" data-col="${n}"></ol></div>`).join('<span class="ct-divider" aria-hidden="true"></span>')}
        <button type="button" class="ct-arrow" data-next aria-label="Next page">${icon("arrowRight", 16)}</button>
      </div>`;
    const $ = (s) => section.querySelector(s);

    const item = ({ r }) => {
      const k = KIND[r.k], where = r.h ? MSX.holderById.get(r.h[0]).city : r.f ?? "";
      return `<li><button type="button" data-open="${esc(r.i)}" style="--tone: var(${k.tone})"><i aria-hidden="true"></i>
        <span class="ct-sig">${esc(sigla(r) || r.g || "")}</span><span class="ct-name">${esc(r.n)}</span>
        <span class="ct-date">${esc(r.d ?? "undated")}</span><span class="ct-where" title="${esc(where)}">${esc(where)}</span></button></li>`;
    };
    function sorted(list) {
      if (sort === "name") return list.sort((a, b) => a.r.n.localeCompare(b.r.n, "en", { numeric: true }));
      if (sort === "siglum") return list.sort((a, b) => KINDS.findIndex((k) => k.key === a.r.k) - KINDS.findIndex((k) => k.key === b.r.k) || String(a.r.g ?? a.r.n).localeCompare(String(b.r.g ?? b.r.n), "en", { numeric: true }));
      return list.sort((a, b) => byDate(a.r, b.r));
    }
    function render() {
      const words = normalise(query).trim().split(/\s+/).filter(Boolean);
      const found = sorted(rows.filter((x) => (!kind || x.r.k === kind) && words.every((w) => x.search.includes(w))));
      const pages = Math.max(1, Math.ceil(found.length / PAGE));
      page = Math.min(page, pages - 1);
      const label = kind ? KIND[kind].label.toLowerCase() : "records";
      $(".ct-count").innerHTML = found.length
        ? `<strong>${formatNumber(found.length)}</strong> ${esc(label)}${query ? ` matching “${esc(query)}”` : ""} · showing ${page * PAGE + 1}–${Math.min(found.length, (page + 1) * PAGE)}`
        : `Nothing matches${query ? ` “${esc(query)}”` : ""}.`;
      // The page splits into two side-by-side tables, the first half on the left.
      const shown = found.slice(page * PAGE, (page + 1) * PAGE), half = Math.ceil(shown.length / 2);
      $('[data-col="0"]').innerHTML = shown.slice(0, half).map(item).join("");
      $('[data-col="1"]').innerHTML = shown.slice(half).map(item).join("");
      section.querySelectorAll(".ct-col")[1].hidden = shown.length <= half;
      $(".ct-page").innerHTML = `Page <b>${formatNumber(page + 1)}</b> of ${formatNumber(pages)}`;
      $("[data-prev]").disabled = !page; $("[data-next]").disabled = page >= pages - 1;
      for (const b of section.querySelectorAll("[data-kind]")) b.setAttribute("aria-pressed", String(b.dataset.kind === kind));
      section.classList.toggle("ct-filtered", Boolean(kind));
    }
    $("input").addEventListener("input", (e) => { query = e.target.value; page = 0; render(); });
    section.addEventListener("click", (e) => {
      const c = e.target.closest("[data-kind]");
      if (c) { kind = kind === c.dataset.kind ? "" : c.dataset.kind; page = 0; render(); return; }
      const s = e.target.closest("[data-sort]");
      if (s) { sort = s.dataset.sort; section.querySelectorAll("[data-sort]").forEach((b) => b.setAttribute("aria-checked", String(b === s))); render(); return; }
      if (e.target.closest("[data-prev]")) { page--; render(); }
      if (e.target.closest("[data-next]")) { page++; render(); }
    });
    render();
  }
  Sections.kinds = { mount };
})();
