// Direction C, "How the land was drawn": one question, answered with eight maps. A year track steps through the Holy
// Land from a twelfth-century manuscript to the survey of the 1880s; each map stands beside the same land as the
// Atlas draws it today (Natural Earth coast, OpenBible places), which can turn to face the way the old map faces.
// Then a heat grid of every subject by half-century; choosing a cell lays out its maps beneath.
(() => {
  const { D, esc, fmt, subjects, subjectByKey, maps, mapById, dotHas, head, thumb, landing } = OM;

  // Notes for the eight maps: only what the record itself says, the holding library's description, or what is plain
  // on the sheet. "up" is where the sheet puts the top, read from the sheet itself (sea along the bottom = east up).
  const NOTES = {
    1150: { up: null, text: "A twelfth-century manuscript map. Its catalogue title says it is drawn after Eusebius and Jerome, whose lists of biblical place-names were the guide to the land for the Middle Ages." },
    1250: { up: null, text: "Drawn by Matthew Paris, monk and chronicler of St Albans, in the age of the crusades: the land the crusaders called Outremer, 'beyond the sea'." },
    1320: { up: "east", text: "Pietro Vesconte's map for Marino Sanudo's book urging a new crusade, with a grid of squares laid over the land. The record also names Bongars, who printed Sanudo's work and its maps in 1611." },
    1475: { up: "east", text: "From the Rudimentum Novitiorum, a world history printed in Lübeck in 1475 that holds what are considered the first printed maps. Jerusalem stands at the centre and west is at the bottom. (Library of Congress)" },
    1537: { up: "west", text: "Gerard Mercator's first map, engraved at Leuven when he was twenty-five. Egypt lies to the left and the sea runs along the top." },
    1659: { up: "west", text: "From Amsterdam, the centre of the map trade in the age of the great atlases. The Mediterranean runs along the top. Its maker was the son of the mapmaker Claes Janszoon Visscher. (Library of Congress)" },
    1748: { up: "north", text: "From the Nuremberg house of Johann Baptist Homann, which went on publishing under his name after his death in 1724. North is at the top, as on the Atlas today." },
    1880: { up: "north", text: "Measured on the ground: the survey of western Palestine made for the Palestine Exploration Fund, published in 26 sheets and joined here into one." },
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

  Sections.c_sequence = { mount(section) {
    const seq = D.sequence.map((id) => mapById.get(id));
    const lo = seq[0].y - 40, hi = seq.at(-1).y + 30, at = (y) => ((y - lo) / (hi - lo) * 100).toFixed(2);
    section.innerHTML = `${head("01", "One land, eight maps", "How did the shape <em>of the land</em> change?", "Choose a year. The old map stands on the left, the land as the Atlas draws it on the right. Where the old sheet faces another way, turn today's map to match it.")}
      <div class="om-years" role="tablist" aria-label="Eight maps by year"><i class="om-years-line"></i>${seq.map((m, i) => `<button type="button" role="tab" data-i="${i}" style="left:${at(m.y)}%"><i></i><b>${m.y}</b></button>`).join("")}</div>
      <div class="om-compare">
        <figure class="om-old"><button type="button" class="om-old-stage" aria-label="Open this map full size"><img alt=""></button><figcaption></figcaption></figure>
        <figure class="om-modern">${OM.levantSVG()}<figcaption><span>The same land today: the coast as the Atlas draws it (Natural Earth), places from OpenBible.info.</span><button type="button" class="om-turn" hidden></button></figcaption></figure>
      </div>
      <div class="om-step"><button type="button" class="om-prev" aria-label="Earlier map">${icon("arrowLeft", 16)}</button><span class="om-step-n"></span><button type="button" class="om-next" aria-label="Later map">${icon("arrowRight", 16)}</button></div>`;
    const years = section.querySelector(".om-years");
    const img = section.querySelector(".om-old img");
    const cap = section.querySelector(".om-old figcaption");
    const turnBtn = section.querySelector(".om-turn");
    const turnG = section.querySelector(".om-modern-turn");
    let index = 0, turned = false;
    const setTurn = (deg) => { turnG.style.transform = `rotate(${deg}deg)`; turnG.style.setProperty("--counter", `${-deg}deg`); };
    function show(i) {
      index = (i + seq.length) % seq.length;
      const m = seq[index], note = NOTES[m.y] ?? { up: null, text: "" };
      years.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(Number(b.dataset.i) === index)));
      img.classList.remove("is-in");
      img.onload = () => img.classList.add("is-in");
      img.src = m.full ?? m.th;
      img.alt = `${m.t}, ${m.y}`;
      section.querySelector(".om-old-stage").dataset.map = m.id;
      cap.innerHTML = `<b>${m.y}</b><strong>${esc(m.t)}</strong><small>${esc(m.m ?? "Mapmaker not recorded")} · ${esc(m.lib)}</small><p>${esc(note.text)}</p><small class="om-credit">${esc(m.credit)} · ${esc(m.lic)}</small>`;
      turned = false;
      setTurn(0);
      const deg = TURN[note.up] ?? 0;
      turnBtn.hidden = !deg;
      turnBtn.textContent = deg ? `This sheet has ${note.up} at the top. Turn today's map to match` : "";
      section.querySelector(".om-step-n").textContent = `${index + 1} of ${seq.length}`;
    }
    turnBtn.addEventListener("click", () => {
      const deg = TURN[NOTES[seq[index].y]?.up] ?? 0;
      turned = !turned;
      setTurn(turned ? deg : 0);
      turnBtn.textContent = turned ? "Turn it back: north up" : `This sheet has ${NOTES[seq[index].y].up} at the top. Turn today's map to match`;
    });
    years.addEventListener("click", (event) => { const b = event.target.closest("button[data-i]"); if (b) show(Number(b.dataset.i)); });
    years.addEventListener("keydown", (event) => { if (event.key === "ArrowRight") show(index + 1); if (event.key === "ArrowLeft") show(index - 1); });
    section.querySelector(".om-prev").addEventListener("click", () => show(index - 1));
    section.querySelector(".om-next").addEventListener("click", () => show(index + 1));
    section.querySelector(".om-old-stage").addEventListener("click", (event) => Viewer.open(event.currentTarget.dataset.map, event.currentTarget));
    show(3);
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
      pick.innerHTML = `<p class="om-pick-head" style="--tone:var(${s.tone})"><b>${esc(s.label)}</b>, ${label}: ${held} maps held${here.length < held ? `, ${here.length} in this mock-up` : ""}</p>
        <div class="om-strip">${here.slice(0, 10).map((m) => thumb(m)).join("") || `<p class="om-mocknote">None of these is in this mock-up's selection.</p>`}</div>`;
    }
    section.querySelector(".om-heat").addEventListener("click", (event) => { const b = event.target.closest("button[data-key]"); if (b) choose(b.dataset.key, Number(b.dataset.j)); });
    pick.addEventListener("click", (event) => { const t = event.target.closest("[data-map]"); if (t) Viewer.open(t.dataset.map, t); });
    choose("paul", BINS.findIndex(([a]) => a === 1800));
  } };
})();
