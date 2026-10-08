// 08 · Everyone, by where they served: all the teachers grouped by the country or region of their longest stay
// (B · Their world's rule and town table), in D · Rearrange's clean directory rows, with a name search and family chips.
window.Sections = window.Sections || {};
(() => {
  const people = AUTHORS.people;
  const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const tone = (person) => `var(${familyOf(person).tone})`;

  // Which country or region each town is in (from B · Their world's geo.js).
  const REGIONS = {
    England: "Marston Jabbett|Cambridge|Ipswich|Tostock|London|Rollesby|Oxford|Stadhampton|Coggeshall|Bromsgrove|Dartmouth|Elstow|Bedford|Kettering|Gloucester|Liverpool|Olney|Paulerspury|Leicester|Macclesfield|Helmingham|Stradbroke|Kelvedon|Waterbeach|Bristol",
    Scotland: "Haddington|Edinburgh|Nisbet|Anwoth|Aberdeen|St Andrews|Duns|Simprin|Ettrick|Collace|Glasgow|Dundee|Kirkmahoe|Badbea|Hamilton",
    Wales: "Cardiff|Aberavon",
    Ireland: "Dublin",
    Switzerland: "Bremgarten|Zürich|Geneva",
    France: "Noyon|Paris|Strasbourg",
    Germany: "Wittenberg|Heidelberg|Neustadt",
    Silesia: "Breslau",
    Netherlands: "Franeker|Enkhuizen|Utrecht|Leiden|Maassluis|Amsterdam|Hoogeveen|Kampen|Heerenveen|Emmen",
    "United States": "West Nottingham|Fredericksburg|Wilkes-Barre|East Windsor|Northampton|Stockbridge|Princeton|Savannah|Newburyport|Haddam|Crossweeksung|Lexington, Virginia|Philadelphia|Lexington, Kentucky|Allegheny|Grand Rapids|Vriesland|Baltimore|Pittsburgh|Ligonier|Sanford|Deerfield|Chattanooga|Minneapolis|Columbia, South Carolina|Cleveland|Phoenix",
    Canada: "Vancouver|Montreal",
    India: "Serampore|Allahabad",
    "Middle East": "Bahrain|Cairo",
    "Australia & Pacific": "Aniwa|Melbourne",
  };
  const REGION_OF = {};
  for (const [region, names] of Object.entries(REGIONS)) for (const n of names.split("|")) REGION_OF[n] = region;
  const REGION_ORDER = Object.keys(REGIONS);
  const regionOf = (placeName) => {
    const r = REGION_OF[placeName];
    if (!r) throw new Error(`directory: no country or region recorded for the town "${placeName}"`);
    return r;
  };

  // Each place from the year they arrived to the next arrival (or the end of their life). When the birthplace is not
  // recorded, the first place is only the earliest known one, counted from the year they arrived.
  const knowsBirthplace = (person) => person.birthplaceKnown !== false;
  const staysOf = (person) => person.places.map((place, i) => ({
    name: place[0], from: i === 0 && knowsBirthplace(person) ? person.born : place[3],
    to: i + 1 < person.places.length ? person.places[i + 1][3] : lifeEnd(person),
  }));
  // Where someone mainly served: the town where they spent the most years after their birthplace (or the birthplace if it
  // is their only place). Repeat stays in one town add up, so A. A. Hodge's two Princeton spells outweigh India.
  const mainStay = (person) => {
    const stays = staysOf(person);
    const pool = stays.length > 1 && knowsBirthplace(person) ? stays.slice(1) : stays;
    const years = new Map();
    for (const s of pool) years.set(s.name, (years.get(s.name) ?? 0) + (s.to - s.from));
    const town = [...years].reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0];
    return pool.find((s) => s.name === town);
  };

  const rows = people.map((p) => { const stay = mainStay(p); return { p, town: stay.name, region: regionOf(stay.name) }; });
  const groups = [...rows.reduce((map, r) => map.set(r.region, [...(map.get(r.region) ?? []), r]), new Map())]
    .map(([region, list]) => [region, list.sort((a, b) => a.p.born - b.p.born)])
    .sort((a, b) => b[1].length - a[1].length || REGION_ORDER.indexOf(a[0]) - REGION_ORDER.indexOf(b[0]));
  const worksLabel = (n) => (n ? `<b>${formatNumber(n)}</b> ${n === 1 ? "work" : "works"}` : `<span class="dir-none">no works yet</span>`);

  let list, count, query = "", family = null;

  function render() {
    const q = query.trim().toLowerCase();
    const match = (r) => (!family || familyOf(r.p).key === family) && (!q || r.p.name.toLowerCase().includes(q) || r.town.toLowerCase().includes(q));
    let shown = 0;
    // Two balanced columns: each group (largest first) goes to whichever column is shorter so far.
    const cols = [{ rows: 0, html: "" }, { rows: 0, html: "" }];
    groups.forEach(([region, members], order) => {
      const visible = members.filter(match);
      shown += visible.length;
      if (!visible.length) return;
      const col = cols[0].rows <= cols[1].rows ? cols[0] : cols[1];
      col.rows += visible.length + 2;
      col.html += `<section class="dir-group" style="order:${order}"><h3>${esc(region)}<span>${visible.length} ${visible.length === 1 ? "teacher" : "teachers"}</span></h3>
        <ul>${visible.map((r) => `<li><button type="button" data-id="${r.p.id}">
          <i class="dir-dot" style="--tone:${tone(r.p)}"></i><span class="dir-nm">${esc(r.p.name)}</span><span class="dir-town">${esc(r.town)}</span>
          <span class="dir-yr">${lifeLabel(r.p)}</span><span class="dir-wk">${worksLabel(r.p.works)}</span></button></li>`).join("")}</ul></section>`;
    });
    list.innerHTML = shown ? cols.map((c) => `<div class="dir-col">${c.html}</div>`).join("") : `<p class="dir-empty">No one matches${q ? ` “${esc(query.trim())}”` : ""}${family ? ` among the ${esc(FAMILIES.find((f) => f.key === family).label)}` : ""}.</p>`;
    count.textContent = `${shown} of ${people.length} teachers`;
  }

  function mount(section) {
    section.style.setProperty("--tone", "var(--prophets)");
    section.innerHTML = `<header class="t-head"><span class="t-num">08</span><div><p class="kicker">Everyone</p>
        <h2>All ${people.length}, <em>by where they served</em></h2>
        <p>Grouped by the country where each one lived longest after their birthplace, with the town and how many of their works the library holds. Choose a name to open the profile.</p></div></header>
      <div class="dir-tools">
        <label class="dir-search">${icon("search", 15)}<input type="search" placeholder="Find a name or a town" aria-label="Find a name or a town" autocomplete="off"></label>
        <div class="dir-chips">${FAMILIES.map((f) => `<button type="button" data-family="${f.key}" aria-pressed="false" style="--tone:var(${f.tone})"><i></i>${f.label}</button>`).join("")}</div>
        <span class="dir-count"></span></div>
      <div class="dir-list"></div>`;
    list = section.querySelector(".dir-list");
    count = section.querySelector(".dir-count");
    section.querySelector(".dir-search input").addEventListener("input", (e) => { query = e.target.value; render(); });
    section.querySelector(".dir-chips").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      family = family === b.dataset.family ? null : b.dataset.family;
      section.querySelectorAll(".dir-chips button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.family === family)));
      render();
    });
    list.addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) window.Teachers?.openProfile(b.dataset.id); });
    render();
  }

  Sections.directory = { mount };
})();
