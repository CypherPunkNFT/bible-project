// The "In the Atlas" view: convincing excerpts, not whole pages, of where the old maps would sit in the site.
// 1 · the Atlas home with a ninth card; 2 · strips inside Journeys (Paul, Moses) and Ancient Cities (Jerusalem);
// 3 · an "Old maps of this place" row on the map's place panel; 4 · the Study card beside Museum-Grade Archaeology.
(() => {
  const { D, esc, fmt, subjects, subjectByKey, maps, dotHas, thumb, levantSVG } = OM;
  const ARROW_UP = icon("arrowUp", 19), ARROW_RIGHT = icon("arrowRight", 15);
  const ICON = (svg, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg}</svg>`;
  const L = Art.LUCIDE;
  // The eight cards exactly as the Atlas home words them today (AtlasCollection.tsx, history-collections.ts).
  const ROW1 = [
    ["atlas", "Atlas", "Find a place", L.map, "poetry", "Explore the biblical world. Find a city, a mountain, or a sea, and read the passages that name it.", "Places · Regions · Scripture", "Explore the atlas"],
    ["journeys", "Journeys", "Follow a life", L.route, "accent", "Follow people through the places that shaped their stories. See the encounters, companions, and turning points along the way.", "Paul · Abraham · Moses · More", "Choose a journey"],
    ["cities", "Ancient Cities", "Enter their world", L.landmark, "history", "Get to know a city behind the text. Explore its setting, its people, and the moments that make it part of the story.", "Jerusalem · Corinth · Beyond", "Choose a city"],
    ["gospels", "Gospel Events", "Walk through the accounts", L.bookOpen, "gospels", "Follow the life of Jesus across the land. Explore events in their setting and see how the four Gospels tell them.", "Four accounts · Places & encounters", "Explore the Gospels"],
  ];
  const ROW2 = [
    ["early-church", "The Early Church", "After the apostles", L.church, "gospels", "Discover communities learning to live, worship, and confess their faith through persecution, debate, and change.", "Communities · Worship · Councils", "Explore the early church"],
    ["catholic-orthodox", "Apostolic Church", "Shared roots, distinct traditions", L.split, "prophets", "Explore the development of Catholic and Orthodox Christianity through its worship, centers of authority, divisions, and encounters.", "Traditions · Authority · Communion", "Explore the traditions"],
    ["reformation", "The Reformation", "Read the questions that changed Europe", L.scrollText, "history", "Explore reform movements and their disagreements. Bring cities, printing, Scripture, and the arguments themselves into view.", "Movements · Scripture · Reform", "Explore the Reformation"],
    ["missions", "Global Missions", "Across languages and cultures", L.earth, "poetry", "Explore how communities receive and share the gospel. Meet local believers, translators, and missionaries within the worlds they inhabit.", "Regions · Languages · Communities", "Explore missions"],
  ];
  const card = ([id, title, eyebrow, ico, color, text, detail, action], n) => `<a class="places-destination-card" href="#" style="--places-color:var(--${color})">
      <div class="places-card-top">${ICON(ico)}<span>${eyebrow}</span>${ARROW_UP}</div>${Art.card(id)}
      <div class="places-card-copy"><span class="places-card-number">0${n}</span><h2>${title}</h2><p>${text}</p></div>
      <div class="places-card-foot"><span>${detail}</span><strong>${action}${ARROW_RIGHT}</strong></div></a>`;
  const label = (n, title, text) => `<header class="om-x-label"><span>${n}</span><div><h2>${title}</h2><p>${text}</p></div></header>`;

  Sections.x_home = { mount(section) {
    const c = D.counts;
    const fan = [3, 5, 6].map((i) => OM.mapById.get(D.sequence[i])).filter(Boolean); // 1475, 1659, 1748 from direction C
    section.innerHTML = `${label(1, "The Atlas home, with a ninth card", "The two rows stay as they are. Old maps comes in as a third row of its own: one wide card, because it spans every age the other eight cover.")}
      <div class="om-excerpt places-collection">
        <div class="places-topline"><a href="/study">${icon("arrowLeft", 15)}Back to Study</a><span>Atlas</span></div>
        <header class="places-collection-intro"><div><p class="places-kicker">Scripture, place & Christian history</p><h1>Real places.<br><em>An unfolding story.</em></h1><p>Find a place. Follow a life. Step into the world of the Bible.<br>Then explore the communities and movements that followed.</p></div></header>
        <nav class="places-destinations" aria-label="Places and journeys collection">${ROW1.map((r, i) => card(r, i + 1)).join("")}</nav>
        <div class="places-section-heading places-row-heading"><h2>Beyond the New Testament</h2><span>Communities, traditions & a worldwide church</span></div>
        <nav class="places-destinations" aria-label="Christian history collection">${ROW2.map((r, i) => card(r, i + 5)).join("")}</nav>
        <div class="places-section-heading places-row-heading om-new-row"><h2>How it was drawn</h2><span>Twelve centuries of maps of the biblical world</span></div>
        <a class="places-destination-card om-wide-card" href="?d=a" style="--places-color:var(--epistles)">
          <div class="places-card-top">${ICON(L.oldMaps)}<span>See how it was drawn</span>${ARROW_UP}</div>
          <div class="om-wide-body">${Art.card("old-maps")}
            <div class="places-card-copy"><span class="places-card-number">09</span><h2>Old maps</h2><p>The Holy Land, Jerusalem and the lands of the Bible as mapmakers drew them, from medieval manuscripts to measured surveys. Open any map at full size, with its maker, its library and its credit.</p>
              <div class="places-card-foot"><span>${fmt(c.onSubject)} maps · ${fmt(c.makers)} mapmakers · ${c.earliest}–${c.latest}</span><strong>Open the old maps${ARROW_RIGHT}</strong></div></div>
            <div class="om-fan" aria-hidden="true">${fan.map((m) => `<img src="${m.th}" alt="">`).join("")}</div></div></a>
        <div class="places-collection-note"><span>${ICON(L.bookOpen, 16)}Every place opens a passage. Every journey invites a closer reading.</span><a href="/study/atlas/map">Open the map ${icon("arrowUp", 14)}</a></div>
      </div>`;
  } };

  // A strip of one subject's maps, in year order, for a page elsewhere in the Atlas.
  function strip(key, phrase, limit = 12) {
    const s = subjectByKey.get(key);
    const dated = D.dots.filter((d) => dotHas(d, key));
    const list = maps.filter((m) => m.s.includes(key) && m.y != null).slice(0, 400);
    const step = Math.max(1, list.length / limit);
    const chosen = Array.from({ length: Math.min(limit, list.length) }, (_, i) => list[Math.floor(i * step)]);
    return `<div class="om-strip-block" style="--tone:var(${s.tone})">
        <div class="om-strip-head"><div><p class="kicker">Old maps</p><h3>How mapmakers drew ${phrase}, <em>${dated[0][0]}–${dated.at(-1)[0]}</em></h3>
          <p>${fmt(s.count)} maps in the collection, ${fmt(dated.length)} of them dated. Choose one to open it beside the page.</p></div>
          <a href="?d=a" class="om-strip-all">See all ${fmt(s.count)} in Old maps ${icon("arrowRight", 14)}</a></div>
        <div class="om-strip om-strip-years">${chosen.map((m) => thumb(m, { cls: "is-small" })).join("")}</div></div>`;
  }
  const journeyHead = (who, sub, seal, tone, lenses, active) => `<header class="om-jhead" style="--tone:var(--${tone})"><span class="om-seal">${ICON(seal, 26)}</span><div><p class="places-kicker">Your journey</p><h3>${who}<span>${sub}</span></h3></div>
      <div class="om-lenses"><span>Explore through</span>${lenses.map((l) => `<b${l === active ? ' class="on"' : ""}>${l}</b>`).join("")}</div></header>`;

  Sections.x_strips = { mount(section) {
    const ship = OM.subjectIcon("paul").replace(/<svg[^>]*>|<\/svg>/g, ""), tablets = '<path d="M5 3h6v18H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M13 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6z"/><path d="M6 8h3M6 12h3M15 8h3M15 12h3"/>';
    section.innerHTML = `${label(2, "Inside the pages that already exist", "Each story keeps its own map; beneath it, a quiet strip shows how mapmakers drew that story over the centuries. The strips open the same slide-in viewer.")}
      <div class="om-excerpt"><p class="om-x-where">Journeys → Paul → Story</p>
        <div class="om-jcard">${journeyHead("Paul", "Damascus to Rome", ship, "acts", ["Story", "People", "Teaching", "Letters", "Setting"], "Story")}
          <div class="om-placeholder">The journey map and its stops, as they are today</div>${strip("paul", "Paul's journeys")}</div></div>
      <div class="om-excerpt"><p class="om-x-where">Journeys → Moses → Story</p>
        <div class="om-jcard">${journeyHead("Moses", "Egypt & the wilderness", tablets, "poetry", ["Story", "People", "Teaching", "Setting"], "Story")}
          <div class="om-placeholder">The journey preview, as it is today</div>${strip("exodus", "the Exodus and the wilderness")}</div></div>
      <div class="om-excerpt"><p class="om-x-where">Ancient Cities → The Holy City → Jerusalem</p>
        <div class="om-jcard"><header class="om-jhead" style="--tone:var(--history)"><span class="om-seal">${ICON(L.landmark, 26)}</span><div><p class="places-kicker">Your city</p><h3>Jerusalem<span>City & setting</span></h3></div></header>
          <div class="om-placeholder">The city card, its map and its landmarks, as they are today</div>${strip("jerusalem", "Jerusalem")}</div></div>
      <p class="om-mocknote">Paul's strip counts maps whose title names Paul or the apostles with their travels; Jerusalem's counts titles that name the city. The corpus's own tags overcount both (see the README).</p>`;
    section.addEventListener("click", (event) => { const t = event.target.closest("[data-map]"); if (t) { event.preventDefault(); Viewer.open(t.dataset.map, t); } });
  } };

  const BOOKS = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings"];
  Sections.x_panel = { mount(section) {
    const jer = D.levant.places.find((p) => p.n === "Jerusalem");
    const byBook = new Map();
    (jer.refs ?? []).forEach((v) => { const b = Math.floor(v / 1e6), ch = Math.floor(v / 1e3) % 1000, vs = v % 1000; if (!byBook.has(b)) byBook.set(b, []); byBook.get(b).push(`${ch}:${vs}`); });
    const list = maps.filter((m) => m.s.includes("jerusalem") && m.y != null);
    const picks = [0, 0.33, 0.66, 0.99].map((f) => list[Math.floor(f * (list.length - 1))]);
    const count = subjectByKey.get("jerusalem").count;
    section.innerHTML = `${label(3, "On the map, in a place's own panel", "Open Jerusalem on the map and its panel gains one row: old maps of this place, earliest first, each opening full size.")}
      <div class="om-excerpt om-panel-scene">
        <div class="om-panel-map" aria-hidden="true">${levantSVG({ cls: "om-panel-svg" })}</div>
        <aside class="om-place-panel">
          <div class="om-pp-head"><p class="kicker">Settlement</p><h3>Jerusalem</h3><p>Named in ${fmt(jer.v)} verses · location confidence ${Math.round((jer.c ?? 0) * 100)}%</p><span class="om-pp-x">${icon("x", 16)}</span></div>
          <div class="om-pp-old" style="--tone:var(--history)"><p class="om-pp-label">Old maps of this place <span>${fmt(count)}</span></p>
            <div class="om-pp-row">${picks.map((m) => `<button type="button" data-map="${m.id}" title="${esc(m.t)}"><img src="${m.th}" alt=""><b>${m.y}</b></button>`).join("")}</div>
            <a href="?d=a">See all ${fmt(count)}, from ${list[0].y} ${icon("arrowRight", 13)}</a></div>
          <div class="om-pp-verses"><p class="om-pp-label">Where it is named</p>${[...byBook.entries()].map(([b, refs]) => `<p><b>${BOOKS[b - 1] ?? `Book ${b}`}</b> ${refs.join(", ")}</p>`).join("")}<p class="om-fade">…</p></div>
        </aside></div>`;
    section.addEventListener("click", (event) => { const t = event.target.closest("[data-map]"); if (t) Viewer.open(t.dataset.map, t); });
  } };

  // Study → Academic → History & archaeology: the card grid, with the new card beside Museum-Grade Archaeology.
  const STUDY_ART = {
    inscription: '<path d="M200 150V60q0-38 40-38t40 38v90z" stroke="currentColor"/><path d="M212 146V64q0-30 28-30t28 30v82z" stroke="currentColor" stroke-opacity=".35"/>' + [0, 1, 2, 3, 4, 5].map((r) => [0, 1, 2, 3].map((c) => `<circle cx="${226 + c * 9}" cy="${66 + r * 12}" r="1.6" fill="currentColor" opacity=".55"/>`).join("")).join("") + '<path d="M150 158h180" stroke="currentColor" stroke-opacity=".3"/>',
    museum: '<path d="M160 70l80-40 80 40z" stroke="currentColor"/><path d="M172 70v80M308 70v80M196 70v80M284 70v80M150 154h180" stroke="currentColor"/><path d="M218 150v-44q22-22 44 0v44" stroke="currentColor" fill="currentColor" fill-opacity=".06"/>',
    empires: '<path d="M150 40l60-12 60 12 60-12v110l-60 12-60-12-60 12z" stroke="currentColor" fill="currentColor" fill-opacity=".05"/><path d="M210 28v110M270 40v110" stroke="currentColor" stroke-opacity=".4"/><path d="M172 112q30-40 64-10t70-34" stroke="currentColor" stroke-dasharray="3 4"/><circle cx="172" cy="112" r="4" fill="currentColor"/><circle cx="306" cy="68" r="4" fill="currentColor"/>',
  };
  const studyCard = ({ kind, title, text, meta, artMeta, tone, art, isNew }) => `<a class="om-study-card${isNew ? " is-new" : ""}" href="${isNew ? "?d=a" : "#"}" style="--tone:var(--${tone})">
      <p class="om-sc-kind">${kind}${isNew ? '<span class="om-sc-new">New</span>' : ""}</p>
      <div class="om-sc-art">${art === "old-maps" ? Art.card("old-maps") : `<svg class="places-artwork" viewBox="0 0 480 185" fill="none" aria-hidden="true">${STUDY_ART[art]}</svg>`}<span>${artMeta}</span></div>
      <h3>${title}</h3><p>${text}</p><div class="om-sc-foot"><span>${meta}</span><i>${icon("arrowUp", 15)}</i></div></a>`;

  Sections.x_study = { mount(section) {
    const c = D.counts;
    section.innerHTML = `${label(4, "In Study, beside Museum-Grade Archaeology", "Study → Academic Studies → History & archaeology. The new card is a collection, like the museums, and opens the Atlas's Old maps page.")}
      <div class="om-excerpt"><p class="om-x-where">History & archaeology · <em>A world recorded. A past to investigate.</em></p>
        <div class="om-study-grid">
          ${studyCard({ kind: "Methods study", title: "From discovery to history", text: "Learn how historians read archaeology and inscriptions through worked examples from the biblical world.", meta: "Preserved evidence · Reconstruction · Interpretation", artMeta: "Objects · Context · Evidence", tone: "history", art: "inscription" })}
          ${studyCard({ kind: "Museum collections", title: "Museum-Grade Archaeology", text: "Open the museums themselves: real object records from collections that publish openly, with dates, findspots and photographs under their own licences.", meta: "Museums · Objects · Open licences", artMeta: "Museums · Records · Licences", tone: "poetry", art: "museum" })}
          ${studyCard({ kind: "Map collection", title: "Old maps of the Holy Land", text: `${fmt(c.onSubject)} historical maps of the biblical world, ${c.earliest} to ${c.latest}, from ${c.libraries} libraries. Open any map at full size, with its maker, its library and its credit.`, meta: "Maps · Mapmakers · Libraries", artMeta: "Maps · Centuries · Credits", tone: "epistles", art: "old-maps", isNew: true })}
          ${studyCard({ kind: "Interactive study", title: "Israel among the empires", text: "Trace tribute, conquest, exile and return through synchronized maps and primary evidence.", meta: "Places · Relationships · Journeys", artMeta: "Places · Relationships · Journeys", tone: "prophets", art: "empires" })}
        </div></div>`;
  } };
})();
