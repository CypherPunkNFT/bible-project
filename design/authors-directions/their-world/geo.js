// Place maths for "Their world": projections fitted to the pre-projected views, distances, regions, stays and cities.
// Everything here is computed from AUTHORS; the only hand-written table is which country or region each town is in.
(() => {
  const RAD = Math.PI / 180;
  const mercator = (lon, lat) => [lon, Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2))];
  const naturalEarth = (lon, lat) => {
    const l = lon * RAD, p = lat * RAD, p2 = p * p, p4 = p2 * p2;
    return [l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4))),
      p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)))];
  };

  // Each view was projected by build-data.mjs; its projection is the raw formula plus a scale and shift, which we
  // recover by a least-squares line through the places it already holds (residuals are under 0.1 px).
  function fitView(name, raw) {
    const pts = Object.entries(AUTHORS.views[name].places).map(([key, xy]) => {
      const [id, index] = key.split("#");
      const place = personById(id).places[+index];
      return [raw(place[2], place[1]), xy];
    });
    const line = (a, b) => {
      const n = a.length, ma = a.reduce((s, v) => s + v, 0) / n, mb = b.reduce((s, v) => s + v, 0) / n;
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); den += (a[i] - ma) ** 2; }
      return [num / den, mb - (num / den) * ma];
    };
    const [kx, bx] = line(pts.map((p) => p[0][0]), pts.map((p) => p[1][0]));
    const [ky, by] = line(pts.map((p) => p[0][1]), pts.map((p) => p[1][1]));
    return (lon, lat) => { const [x, y] = raw(lon, lat); return [kx * x + bx, ky * y + by]; };
  }

  const project = {
    atlantic: fitView("atlantic", mercator),
    europe: fitView("europe", mercator),
    america: fitView("america", mercator),
    world: fitView("world", naturalEarth),
  };

  const km = (lat1, lon1, lat2, lon2) => {
    const a = Math.sin(((lat2 - lat1) * RAD) / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(((lon2 - lon1) * RAD) / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(a));
  };

  // Points along the great circle between two places (for arcs on the world map).
  function greatCircle(lat1, lon1, lat2, lon2, steps = 64) {
    const toVec = (lat, lon) => [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)];
    const a = toVec(lat1, lon1), b = toVec(lat2, lon2);
    const omega = Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    const out = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, s = Math.sin(omega) || 1;
      const f1 = Math.sin((1 - t) * omega) / s, f2 = Math.sin(t * omega) / s;
      const v = [f1 * a[0] + f2 * b[0], f1 * a[1] + f2 * b[1], f1 * a[2] + f2 * b[2]];
      out.push([Math.atan2(v[1], v[0]) / RAD, Math.atan2(v[2], Math.hypot(v[0], v[1])) / RAD]);
    }
    return out; // [lon, lat]
  }

  const REGION_OF = {};
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
  for (const [region, names] of Object.entries(REGIONS)) for (const n of names.split("|")) REGION_OF[n] = region;
  const REGION_ORDER = Object.keys(REGIONS);
  const regionOf = (placeName) => {
    const r = REGION_OF[placeName];
    if (!r) throw new Error(`regionOf: no region recorded for place "${placeName}"`);
    return r;
  };

  // A person's stays: each place from the year they arrived to the next arrival (or the end of their life).
  // When the birthplace is unknown, the first place is only the earliest known one, from the year they arrived.
  const knowsBirthplace = (person) => person.birthplaceKnown !== false;
  const staysOf = (person) => person.places.map((place, i) => ({
    name: place[0], lat: place[1], lon: place[2], index: i, birth: i === 0 && knowsBirthplace(person),
    from: i === 0 && knowsBirthplace(person) ? person.born : place[3],
    to: i + 1 < person.places.length ? person.places[i + 1][3] : lifeEnd(person),
    cameFrom: i === 0 ? null : person.places[i - 1][0],
  }));

  // Where someone mainly served: their longest stay after their birthplace (or the birthplace if it is their only place).
  const mainStay = (person) => {
    const stays = staysOf(person);
    const pool = stays.length > 1 && knowsBirthplace(person) ? stays.slice(1) : stays;
    return pool.reduce((best, s) => (s.to - s.from > best.to - best.from ? s : best), pool[0]);
  };

  // Cities shared by two or more people, with each person's stay there (a person counted once per city).
  function sharedCities() {
    const byName = new Map();
    for (const person of AUTHORS.people) {
      for (const stay of staysOf(person)) {
        if (!byName.has(stay.name)) byName.set(stay.name, { name: stay.name, lat: stay.lat, lon: stay.lon, stays: [] });
        const city = byName.get(stay.name);
        const mine = city.stays.find((s) => s.person === person);
        if (mine) { mine.to = Math.max(mine.to, stay.to); mine.returned = true; continue; }
        city.stays.push({ person, ...stay, bornHere: stay.birth });
      }
    }
    return [...byName.values()].filter((c) => c.stays.length >= 2).map((c) => {
      c.stays.sort((a, b) => a.from - b.from);
      c.first = c.stays[0].from;
      c.last = Math.max(...c.stays.map((s) => s.to));
      c.view = AUTHORS.views.europe.places[`${c.stays[0].person.id}#${c.stays[0].index}`] ? "europe" : "america";
      return c;
    }).sort((a, b) => b.stays.length - a.stays.length || a.first - b.first);
  }

  // Long journeys: consecutive places at least 2,000 km apart.
  function longJourneys(minKm = 2000) {
    const out = [];
    for (const person of AUTHORS.people) {
      for (let i = 1; i < person.places.length; i++) {
        const a = person.places[i - 1], b = person.places[i], d = km(a[1], a[2], b[1], b[2]);
        if (d >= minKm) out.push({ person, from: a, to: b, year: b[3], km: d });
      }
    }
    return out.sort((x, y) => x.year - y.year);
  }

  // Where a person was in a given year, or null before the earliest known place of someone whose birthplace is unknown.
  const placeAt = (person, year) => (!knowsBirthplace(person) && year < person.places[0][3] ? null : placeIn(person, year));

  window.TW = { project, km, knowsBirthplace, placeAt, greatCircle, regionOf, REGION_ORDER, staysOf, mainStay, sharedCities, longJourneys,
    roundKm: (d) => formatNumber(Math.round(d / 100) * 100),
    tone: (person) => familyOf(person).tone,
    esc: (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])),
    reducedMotion: () => matchMedia("(prefers-reduced-motion: reduce)").matches };
})();
