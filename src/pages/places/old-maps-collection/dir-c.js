// Direction C, "How the land was drawn": one question, answered with eight maps. A year track steps through the Holy
// Land from a twelfth-century manuscript to the survey of the 1880s; each map stands beside the same land as the
// Atlas draws it today (Natural Earth coast, OpenBible places), which can turn to face the way the old map faces.
// Then a heat grid of every subject by half-century; choosing a cell lays out its maps beneath.
(() => {
  const { D, esc, fmt, subjects, subjectByKey, maps, mapById, dotHas, head, thumb, landing } = OM;

  // Notes for each set's eight maps, by year: only what the record itself says, the holding library's description, or
  // what is plain on the sheet. "up" is where the sheet puts the top, read from the sheet itself (sea along the bottom =
  // east up). The Holy Land set came first (direction C); the owner asked for more lands on 2026-10-19 ("One land,
  // different maps"), and only Jerusalem among the cities has enough dated plans for a set of its own.
  const NOTES = {
    "holy-land": {
      1150: { up: null, text: "A twelfth-century manuscript map. Its catalogue title says it is drawn after Eusebius and Jerome, whose lists of biblical place-names were the guide to the land for the Middle Ages." },
      1250: { up: null, text: "Drawn by Matthew Paris, monk and chronicler of St Albans, in the age of the crusades: the land the crusaders called Outremer, 'beyond the sea'." },
      1320: { up: "east", text: "Pietro Vesconte's map for Marino Sanudo's book urging a new crusade, with a grid of squares laid over the land. The record also names Bongars, who printed Sanudo's work and its maps in 1611." },
      1475: { up: "east", text: "From the Rudimentum Novitiorum, a world history printed in Lübeck in 1475 that holds what are considered the first printed maps. Jerusalem stands at the centre and west is at the bottom. (Library of Congress)" },
      1537: { up: "west", text: "Gerard Mercator's first map, engraved at Leuven when he was twenty-five. Egypt lies to the left and the sea runs along the top." },
      1659: { up: "west", text: "From Amsterdam, the centre of the map trade in the age of the great atlases. The Mediterranean runs along the top. Its maker was the son of the mapmaker Claes Janszoon Visscher. (Library of Congress)" },
      1748: { up: "north", text: "From the Nuremberg house of Johann Baptist Homann, which went on publishing under his name after his death in 1724. North is at the top, as on the Atlas today." },
      1880: { up: "north", text: "Measured on the ground: the survey of western Palestine made for the Palestine Exploration Fund, published in 26 sheets and joined here into one." },
    },
    jerusalem: {
      680: { up: "east", text: "The plan in Adomnán of Iona's account of the pilgrim bishop Arculf, who visited Jerusalem about 680: the walls, gates and churches drawn as a ring. West, 'Occidens', is at the bottom." },
      1572: { up: null, text: "A woodcut view in a printed book, headed 'Jerusalem, the holy city, once capital of the Jewish kingdom, today a Turkish colony': the walls, the Temple and the hills around them." },
      1730: { up: null, text: "Jerusalem 'with its suburbs, as it flourished in the time of Christ': not a survey but a picture of the city as Bible readers imagined it, with a long numbered key beneath. (Library of Congress)" },
      1745: { up: "north", text: "Richard Pococke, an English traveller who was there in 1738, drew the city among its hills and valleys: Moriah, Bezetha, the Mount of Olives and the valley of Jehoshaphat." },
      1784: { up: "north", text: "A small French plan bound into a book: the walled city with its hills named, Sion, Acra and Bezetha, and the Temple square inside. (New York Public Library)" },
      1835: { up: "north", text: "Frederick Catherwood's plan, from his own survey of the city: one of the first plans of Jerusalem measured on the ground. (Library of Congress)" },
      1864: { up: "north", text: "The city as it then stood, inside its walls, with the hills around it drawn in shading. (New York Public Library)" },
      1890: { up: "north", text: "From a German encyclopedia: the walls of Jesus' day laid over the city, with the Temple, the Pool of Siloam and the valleys of the Kidron and Hinnom named." },
    },
    egypt: {
      1565: { up: "north", text: "Abraham Ortelius's Egypt: the Nile from the delta south towards Ethiopia, with pyramids, camels and elephants drawn in the deserts. North, 'Septentrio', is at the top." },
      1600: { up: "west", text: "Pierre Du Val's ancient Egypt, divided into its nomes, the old provinces. The Mediterranean runs down the right-hand side, so west is at the top." },
      1753: { up: "north", text: "'Ancient and modern' Egypt on one sheet, drawn after the map of the Jesuit Claude Sicard, who travelled the Nile in the early 1700s." },
      1800: { up: "north", text: "Egypt with part of Arabia and Palestine: the Nile and its delta in colour, and the Red Sea's two gulfs on either side of Sinai. (Library of Congress)" },
      1838: { up: "north", text: "Lower Egypt, the delta and the deserts east of it, with part of Palestine: the ground between Egypt and Canaan." },
      1846: { up: "north", text: "Egypt and Palestine 'up to the time of Moses': a map for Bible history, with an inset carrying the Nile south into Ethiopia." },
      1874: { up: "north", text: "Sinai and the desert of the wanderings: the peninsula between the two gulfs, with an inset of Mount Sinai itself." },
      1881: { up: "north", text: "Egypt and the Sinai peninsula on one sheet, the desert of the Exodus between them. (New York Public Library)" },
    },
    "asia-minor": {
      1552: { up: "north", text: "A woodcut map: mountains as rows of peaks, and the regions of the New Testament named, Bithynia, Galatia, Cappadocia, Lycaonia and Cilicia." },
      1606: { up: "east", text: "'Natolia, once Asia Minor': west, 'Occidens', is at the bottom, so the islands of the Aegean run along the foot of the sheet." },
      1636: { up: "north", text: "Natolia, or Asia Minor, engraved by Petrus Kaerius for an atlas made in Amsterdam." },
      1665: { up: "north", text: "Natolia, as the Turkish province was called, with Cyprus below and ships and a figure in costume in the margins." },
      1708: { up: "north", text: "Asia Minor divided into its ancient provinces, each edged in colour, with Cyprus and the islands of the Aegean." },
      1756: { up: "north", text: "Asia Minor by Robert, of the French family of royal geographers, with the Black Sea, 'Pontus Euxinus', across the top." },
      1825: { up: "north", text: "From the London house of Arrowsmith: Asia Minor reaching east to the Euphrates and south to Sinai." },
      1873: { up: "north", text: "Turkey in Asia: the land of Paul's journeys as a province of the Ottoman Empire, coloured by its divisions of the day." },
    },
  };
  const TURN = { east: -90, west: 90, north: 0 };

  Sections.c_landing = { mount(section) {
    const holy = D.dots.filter((d) => dotHas(d, "holy-land"));
    const makers = new Set(holy.map((d) => d[3]).filter(Boolean));
    landing(section, {
      kicker: "Old maps",
      title: "How the land <em>was drawn</em>",
      lede: `One land, drawn again and again. Step through eight maps of the Holy Land, from a twelfth-century manuscript to a survey measured on the ground, each beside the same coast as our Atlas draws it today. Then see which stories mapmakers drew, and when.`,
      figureItems: [["Holy Land maps", fmt(subjectByKey.get("holy-land").count), "held, of the land as a whole"], ["Dated", fmt(holy.length), `${holy[0][0]} to ${holy.at(-1)[0]}`], ["Mapmakers", fmt(makers.size), "named on them"], ["Shown here", D.sequence.length, "chosen for the comparison"]],
    });
  } };

  // Older data (before the lands were added) carries only the Holy Land set.
  const LANDS = D.lands ?? [{ key: "holy-land", label: "The Holy Land", ids: D.sequence, outline: D.levant }];
  Sections.c_sequence = { mount(section) {
    section.innerHTML = `${head("01", "One land, different maps", "The same ground, <em>drawn again and again</em>", "Choose a land, then a year. The old map stands on the left, the same ground as the Atlas draws it today on the right. Where the old sheet faces another way, turn today's map to match it.")}
      <div class="om-lands" role="tablist" aria-label="Lands">${LANDS.map((land, i) => `<button type="button" role="tab" data-land="${i}" aria-selected="${i === 0}">${esc(land.label)}<small>${land.ids.length} maps</small></button>`).join("")}</div>
      <div class="om-years" role="tablist" aria-label="Eight maps by year"></div>
      <div class="om-compare">
        <figure class="om-old"><button type="button" class="om-old-stage" aria-label="Open this map full size"><img alt=""></button><figcaption></figcaption></figure>
        <figure class="om-modern"><div class="om-modern-box"></div><figcaption><span class="om-modern-cap"></span><button type="button" class="om-turn"></button></figcaption></figure>
      </div>
      <div class="om-step"><button type="button" class="om-prev" aria-label="Earlier map">${icon("arrowLeft", 16)}</button><span class="om-step-n"></span><button type="button" class="om-next" aria-label="Later map">${icon("arrowRight", 16)}</button></div>`;
    const years = section.querySelector(".om-years");
    const img = section.querySelector(".om-old img");
    const cap = section.querySelector(".om-old figcaption");
    const turnBtn = section.querySelector(".om-turn");
    const box = section.querySelector(".om-modern-box");
    let land = LANDS[0], seq = [], index = 0, turned = false;
    const noteFor = (j) => NOTES[land.key]?.[seq[j].y] ?? { up: null, text: "" };
    const note = () => noteFor(index);
    const turnLabel = () => turned ? "Turn it back: north up" : `This sheet has ${note().up} at the top. Turn today's map to match`;
    // Where two place names meet (the city plan is crowded, and a turned map stacks names that sat side by side), the
    // later name in the list gives way, as does a name the turn carries past the frame's edge; the key place is kept
    // first. Measured on screen once the turn has settled.
    let settle = 0;
    const declutter = () => {
      const texts = [...box.querySelectorAll(".om-modern-turn g text")].sort((a, b) => Boolean(b.closest(".is-key")) - Boolean(a.closest(".is-key")));
      const frame = box.querySelector("svg").getBoundingClientRect(), kept = [];
      for (const text of texts) {
        text.classList.remove("is-hidden");
        const r = text.getBoundingClientRect();
        const out = r.left < frame.left || r.right > frame.right || r.top < frame.top || r.bottom > frame.bottom;
        const hit = out || kept.some((k) => r.left < k.right + 2 && r.right > k.left - 2 && r.top < k.bottom && r.bottom > k.top);
        if (hit) text.classList.add("is-hidden"); else kept.push(r);
      }
    };
    const setTurn = (deg) => {
      const g = box.querySelector(".om-modern-turn"); g.style.transform = `rotate(${deg}deg)`; g.style.setProperty("--counter", `${-deg}deg`);
      clearTimeout(settle); settle = setTimeout(declutter, 950);
    };
    function show(i) {
      index = (i + seq.length) % seq.length;
      const m = seq[index];
      years.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(Number(b.dataset.i) === index)));
      img.classList.remove("is-in");
      img.onload = () => img.classList.add("is-in");
      img.src = m.full ?? m.th;
      img.alt = `${m.t}, ${m.y}`;
      section.querySelector(".om-old-stage").dataset.map = m.id;
      cap.querySelectorAll(".om-cap").forEach((c) => c.classList.toggle("is-on", Number(c.dataset.i) === index));
      turned = false;
      setTurn(0);
      const deg = TURN[note().up] ?? 0;
      // Hidden but still taking its line when the sheet is north up, so the arrows below do not move.
      turnBtn.style.visibility = deg ? "" : "hidden";
      turnBtn.textContent = deg ? turnLabel() : "North up";
      section.querySelector(".om-step-n").textContent = `${index + 1} of ${seq.length}`;
    }
    // A land: its year track (evenly spaced, so a lone early sheet does not squeeze the rest) and its ground today.
    function chooseLand(i) {
      land = LANDS[i];
      seq = land.ids.map((id) => mapById.get(id)).filter(Boolean);
      section.querySelectorAll(".om-lands button").forEach((b) => b.setAttribute("aria-selected", String(Number(b.dataset.land) === i)));
      years.innerHTML = `<i class="om-years-line"></i>${seq.map((m, j) => `<button type="button" role="tab" data-i="${j}" style="left:${(j / (seq.length - 1) * 100).toFixed(2)}%"><i></i><b>${m.y}</b></button>`).join("")}`;
      // Every caption of the land is laid in the same spot and only the current one shows, so the caption keeps the
      // height of the longest and the arrows below stay put from year to year.
      cap.innerHTML = seq.map((m, j) => `<div class="om-cap" data-i="${j}"><b>${m.y}</b><strong>${esc(m.t)}</strong><small>${esc(m.m ?? "Mapmaker not recorded")} · ${esc(m.lib)}</small><p>${esc(noteFor(j).text)}</p><small class="om-credit">${esc(m.credit)} · ${esc(m.lic)}</small></div>`).join("");
      box.innerHTML = OM.levantSVG({ outline: land.outline });
      section.querySelector(".om-modern-cap").textContent = land.outline.lines.length
        ? "The same ground today: the coast as the Atlas draws it (Natural Earth), places from OpenBible.info."
        : "The same ground today: the places Scripture names in and around the city, where OpenBible.info sets them.";
      const start = land.key === "holy-land" ? seq.findIndex((m) => m.y === 1475) : 0;
      show(Math.max(0, start));
    }
    turnBtn.addEventListener("click", () => {
      turned = !turned;
      setTurn(turned ? TURN[note().up] ?? 0 : 0);
      turnBtn.textContent = turnLabel();
    });
    section.querySelector(".om-lands").addEventListener("click", (event) => { const b = event.target.closest("button[data-land]"); if (b) chooseLand(Number(b.dataset.land)); });
    years.addEventListener("click", (event) => { const b = event.target.closest("button[data-i]"); if (b) show(Number(b.dataset.i)); });
    years.addEventListener("keydown", (event) => { if (event.key === "ArrowRight") show(index + 1); if (event.key === "ArrowLeft") show(index - 1); });
    section.querySelector(".om-prev").addEventListener("click", () => show(index - 1));
    section.querySelector(".om-next").addEventListener("click", () => show(index + 1));
    section.querySelector(".om-old-stage").addEventListener("click", (event) => Viewer.open(event.currentTarget.dataset.map, event.currentTarget));
    chooseLand(0);
  } };

  // Columns: everything before print, then half-centuries.
  const BINS = [[0, 1449, "before 1450"], ...[1450, 1500, 1550, 1600, 1650, 1700, 1750, 1800, 1850, 1900].map((y) => [y, y + 49, `${y}–${String(y + 49).slice(2)}`])];
  Sections.c_grid = { mount(section) {
    const cell = (key, [a, b]) => D.dots.filter((d) => d[0] >= a && d[0] <= b && dotHas(d, key));
    const max = Math.max(...subjects.flatMap((s) => BINS.map((bin) => cell(s.key, bin).length)));
    section.innerHTML = `${head("02", "Which stories, when", "What did mapmakers <em>choose to draw?</em>", `Every dated map by its subject and its half-century; the darker the square, the more maps. Choose a square to lay out its maps below. The busiest square holds ${max}.`)}
      <div class="om-heat-wrap"><table class="om-heat"><thead><tr><th></th>${BINS.map(([, , label]) => `<th scope="col"><span>${label}</span></th>`).join("")}</tr></thead>
        <tbody>${subjects.map((s) => `<tr style="--tone:var(${s.tone})"><th scope="row">${esc(s.short)}</th>${BINS.map((bin, j) => { const n = cell(s.key, bin).length; return `<td><button type="button" data-key="${s.key}" data-j="${j}" style="--k:${n ? (0.12 + 0.88 * Math.sqrt(n / max)).toFixed(3) : 0}" aria-label="${esc(s.label)}, ${bin[2]}: ${n} maps"${n ? "" : " disabled"}>${n || ""}</button></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>
      <div class="om-heat-pick" aria-live="polite"></div>`;
    const pick = section.querySelector(".om-heat-pick");
    function choose(key, j) {
      section.querySelectorAll(".om-heat button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.key === key && Number(b.dataset.j) === j)));
      const [a, b, label] = BINS[j], s = subjectByKey.get(key), held = cell(key, BINS[j]).length;
      const here = maps.filter((m) => m.y != null && m.y >= a && m.y <= b && m.s.includes(key));
      pick.innerHTML = `<p class="om-pick-head" style="--tone:var(${s.tone})"><b>${esc(s.label)}</b>, ${label}: ${held} maps held${here.length < held ? `, ${here.length} shown here` : ""}</p>
        <div class="om-strip">${here.slice(0, 10).map((m) => thumb(m)).join("") || `<p class="om-mocknote">None of these is shown here.</p>`}</div>`;
    }
    section.querySelector(".om-heat").addEventListener("click", (event) => { const b = event.target.closest("button[data-key]"); if (b) choose(b.dataset.key, Number(b.dataset.j)); });
    pick.addEventListener("click", (event) => { const t = event.target.closest("[data-map]"); if (t) Viewer.open(t.dataset.map, t); });
    choose("paul", BINS.findIndex(([a]) => a === 1800));
  } };
})();
