// The "In the pages" view (?d=pages), asked for by the owner on 2026-10-19 after choosing parts 1 and 4 of "In the Atlas":
// 2 · old-map strips at the very bottom of pages that already exist (Paul, Moses, Jerusalem), shown under pictures of
//     those pages exactly as they are today;
// 3 · in the map's place panel, a small bar pinned to the panel's foot (an icon, "Old maps of Jerusalem", a count) that
//     unfolds upward into a row of maps. "Not vital, just fun", so it stays folded until asked for and never sits on top.
(() => {
  const { D, esc, fmt, subjectByKey, maps, dotHas, thumb, bindOpen } = OM;
  const OLD_MAP_ICON = (size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${Art.LUCIDE.oldMaps}</svg>`;
  const CHEVRON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>';
  const label = (n, title, text) => `<header class="om-x-label"><span>${n}</span><div><h2>${title}</h2><p>${text}</p></div></header>`;
  // A capture of the real page in the viewer's theme; both are in the page and CSS shows the matching one.
  const real = (name, alt) => `<img class="op-real op-light" src="assets/real/${name}-light.png" alt="${esc(alt)}" loading="lazy"><img class="op-real op-dark" src="assets/real/${name}-dark.png" alt="" loading="lazy">`;

  // The maps of one subject, dated, spread evenly across their years.
  function spread(key, count) {
    const list = maps.filter((m) => m.s.includes(key) && m.y != null);
    const step = Math.max(1, list.length / count);
    return Array.from({ length: Math.min(count, list.length) }, (_, i) => list[Math.floor(i * step)]);
  }

  // The band that closes a page: a quiet heading line and one sideways row of maps, earliest first.
  function strip(key, phrase) {
    const s = subjectByKey.get(key);
    const dated = D.dots.filter((d) => dotHas(d, key));
    return `<div class="op-strip" style="--tone:var(${s.tone})">
        <div class="op-strip-head"><p class="op-kicker">${OLD_MAP_ICON(16)}Old maps</p>
          <h3>How mapmakers drew ${phrase}, <em>${dated[0][0]}–${dated.at(-1)[0]}</em></h3>
          <a href="?d=a" class="om-strip-all">All ${fmt(s.count)} in Old maps ${icon("arrowRight", 14)}</a></div>
        <div class="om-strip om-strip-years">${spread(key, 12).map((m) => thumb(m, { cls: "is-small" })).join("")}</div></div>`;
  }

  const PAGES = [
    { id: "paul", tab: "Paul", where: "Journeys → Paul → Story", alt: "Paul's journey page today: the stops, the map and the stop card", key: "paul", phrase: "Paul's journeys" },
    { id: "moses", tab: "Moses", where: "Journeys → Moses → Story", alt: "Moses's journey page today: the Story lens preview", key: "exodus", phrase: "the Exodus and the wilderness" },
    { id: "jerusalem", tab: "Jerusalem", where: "Ancient Cities → Ancient Israel & Judah → Jerusalem", alt: "Jerusalem's city card today: the collection, the city and where it is named", key: "jerusalem", phrase: "Jerusalem" },
  ];

  Sections.p_strips = { mount(section) {
    section.innerHTML = `${label(2, "At the foot of the pages that already exist", "Each page stays exactly as it is. Below it, before the site's footer, one quiet row: how mapmakers drew that story. Choose a page; the picture above the row is the page as it is today.")}
      <div class="op-tabs" role="tablist" aria-label="Pages">${PAGES.map((p, i) => `<button type="button" role="tab" data-page="${p.id}" aria-selected="${i === 0}">${p.tab}</button>`).join("")}</div>
      ${PAGES.map((p, i) => `<div class="om-excerpt op-page" data-page="${p.id}"${i ? " hidden" : ""}>
        <p class="om-x-where">${p.where} <em>as it is today, then the new row</em></p>
        <div class="op-real-wrap">${real(p.id, p.alt)}</div>
        ${strip(p.key, p.phrase)}
        <div class="op-footer-hint">The site's footer follows</div></div>`).join("")}
      <p class="om-mocknote">Paul's row counts maps whose title names Paul's travels; the Exodus row, the Exodus and the wanderings; Jerusalem's, titles naming the city. Every map opens in the same slide-in viewer as the Old maps page.</p>`;
    section.querySelector(".op-tabs").addEventListener("click", (event) => {
      const tab = event.target.closest("[data-page]");
      if (!tab) return;
      section.querySelectorAll(".op-tabs [data-page]").forEach((b) => b.setAttribute("aria-selected", String(b === tab)));
      section.querySelectorAll(".op-page").forEach((page) => { page.hidden = page.dataset.page !== tab.dataset.page; });
    });
    bindOpen(section);
  } };

  Sections.p_panel = { mount(section) {
    const s = subjectByKey.get("jerusalem");
    const picks = spread("jerusalem", 4);
    const first = maps.find((m) => m.s.includes("jerusalem") && m.y != null);
    section.innerHTML = `${label(3, "On the map, folded into the foot of a place's panel", "Open Jerusalem on the map. The panel is unchanged, except for one small bar pinned to its foot. It stays folded; choose it and it unfolds upward into four maps of the place, earliest first. Choose it again to fold it away.")}
      <div class="om-excerpt op-map-scene">
        <p class="om-x-where">Atlas → the map → Jerusalem <em>the panel as it is today, with the new bar at its foot</em></p>
        <div class="op-map">${real("map", "The Atlas map around Jerusalem")}
          <div class="op-panel">
            ${real("panel", "Jerusalem's place panel today: settlement, 955 verses, where it is named")}
            <div class="op-fold" style="--tone:var(${s.tone})">
              <div class="op-drawer" id="op-drawer" aria-hidden="true"><div class="op-drawer-in">
                <div class="op-drawer-row">${picks.map((m) => `<button type="button" data-map="${m.id}" title="${esc(`${m.y}, ${m.t}`)}" tabindex="-1"><img src="${m.th}" alt=""><b>${m.y}</b></button>`).join("")}</div>
                <a href="?d=a" tabindex="-1">All ${fmt(s.count)}, from ${first.y} ${icon("arrowRight", 13)}</a>
              </div></div>
              <button type="button" class="op-bar" aria-expanded="false" aria-controls="op-drawer">${OLD_MAP_ICON(18)}<span>Old maps of Jerusalem</span><b>${fmt(s.count)}</b><i>${CHEVRON}</i></button>
            </div>
          </div>
        </div>
      </div>
      <p class="om-mocknote">Every place that old maps name gets the bar; a place no old map names gets none, so the panel looks as it does today.</p>`;
    const fold = section.querySelector(".op-fold"), bar = fold.querySelector(".op-bar"), drawer = fold.querySelector(".op-drawer");
    bar.addEventListener("click", () => {
      const open = bar.getAttribute("aria-expanded") !== "true";
      bar.setAttribute("aria-expanded", String(open));
      fold.classList.toggle("is-open", open);
      drawer.setAttribute("aria-hidden", String(!open));
      drawer.querySelectorAll("button, a").forEach((el) => { el.tabIndex = open ? 0 : -1; });
    });
    bindOpen(section);
  } };
})();
