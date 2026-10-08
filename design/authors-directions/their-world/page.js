// Authors · Their world: page layout. Place is the spine: the map first, then cities, journeys, origins, and everyone.
(() => {
  const main = Frame.mount();
  const people = AUTHORS.people;
  const placeNames = new Set(people.flatMap((p) => p.places.map((x) => x[0])));

  // Furthest anyone lived from their birthplace (straight-line distance).
  let far = { km: 0 };
  for (const p of people.filter(TW.knowsBirthplace)) for (const pl of p.places.slice(1)) {
    const d = TW.km(p.places[0][1], p.places[0][2], pl[1], pl[2]);
    if (d > far.km) far = { km: d, person: p, place: pl[0] };
  }
  const cityCount = TW.sharedCities().length, journeyCount = TW.longJourneys(2000).length;
  const sections = [
    ["cities", "Cities that gathered them", `${cityCount} towns where two or more of them lived. Choose one and the map flies there.`],
    ["journeys", "Sent across the world", `${journeyCount} moves of 2,000 km or more, drawn in the order they happened.`],
    ["origins", "Born here, served there", "Where each life began, and where it was spent longest."],
    ["everyone", "Everyone, by where they served", `All ${people.length}, grouped by the country of their longest stay.`],
  ];
  const pad = (n) => String(n).padStart(2, "0");
  const head = (i, [id, title, text]) => `<header class="sec-head"><span class="num">${pad(i + 1)}</span><h2>${title}</h2><p>${text}</p></header>`;

  main.innerHTML = `<div class="wrap">
    <header class="tw-intro">
      <div>
        <p class="kicker">Authors · the people behind the library</p>
        <h1>Where they were born.<br><em>Where they served.</em></h1>
        <p>The ${people.length} preachers and writers whose works are in the library, set on the map. Press play to watch five centuries pass:
          each dot is one person, appearing where they were born (or first recorded) and moving as they move.</p>
      </div>
      <nav class="jump" aria-label="Sections">${sections.map(([id, title], i) => `<a href="#${id}"><span>${pad(i + 1)}</span>${title}</a>`).join("")}</nav>
    </header>
    <dl class="figures">
      <div><dt>People</dt><dd>${people.length}</dd></div>
      <div><dt>Places they lived</dt><dd>${placeNames.size}</dd></div>
      <div><dt>Countries & regions</dt><dd>${TW.origins.regionCount()}</dd></div>
      <div><dt>Furthest from home</dt><dd>${TW.roundKm(far.km)} km<small>${far.person.name}, in ${far.place}</small></dd></div>
    </dl>
    <div id="hero-slot"></div>
    ${sections.map((s, i) => `<section class="sec${i > 1 ? " small-sec" : ""}" id="${s[0]}">${head(i, s)}<div id="${s[0]}-slot"></div></section>`).join("")}
  </div>`;

  main.querySelectorAll(".jump a").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelector(a.getAttribute("href")).scrollIntoView({ behavior: TW.reducedMotion() ? "auto" : "smooth" });
  }));

  TW.hero.init(document.getElementById("hero-slot"));
  TW.cities.init(document.getElementById("cities-slot"));
  TW.journeys.init(document.getElementById("journeys-slot"));
  TW.origins.initSlope(document.getElementById("origins-slot"));
  TW.origins.initDirectory(document.getElementById("everyone-slot"));
})();
