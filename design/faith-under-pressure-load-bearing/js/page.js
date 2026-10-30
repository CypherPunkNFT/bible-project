// The page, top to bottom, as one cut through the ground: the air and what presses, the wall, the ground line, what lies under it.
(() => {
  if (!window.LB) return;
  const { h, refLink, runs, plain, readings, remember, readAddress, state: first } = LB;
  const { study, passages, strips, pairs, sources, numbers } = window.FP;

  // ── Frame: the site's own header and footer, named as the site is now named ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  document.body.append(Stones.defs());

  // Which older passages sit under which reading, computed from the verse each pair belongs to.
  const placeOfVerse = new Map(strips.flatMap((strip) => strip.cells.map((cell) => [cell.r, strip.place])));
  const olderFor = (slug) => pairs.filter((pair) => placeOfVerse.get(pair.letter) === slug);
  for (const pair of pairs) if (!placeOfVerse.has(pair.letter)) console.error(`Faith under pressure: ${pair.letter} is in no walked passage`);
  const cellsOf = (slug) => strips.filter((strip) => strip.place === slug).flatMap((strip) => strip.cells);

  // ── Heading ──
  const motto = plain(study.motto).split(" / ");
  const head = h("section", { class: "head", id: "top" },
    h("div", { class: "head-sky" }, h("div", { class: "wrap head-grid" }, h("div", { class: "head-title" },
      h("nav", { class: "trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=life" }, "Living the Christian Life"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "here", "aria-current": "page" }, study.title)),
      h("p", { class: "concepts" }, plain(study.concepts)),
      h("h1", {}, "Faith", h("em", {}, "under pressure"))),
      h("div", { class: "head-art" }, Dusk.draw()))),
    h("div", { class: "head-earth" }, h("div", { class: "wrap head-ground" },
      h("div", {},
        h("p", { class: "lede" }, runs(study.lead)),
        h("figure", { class: "opening" }, h("blockquote", {}, study.opening.t), h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible"))),
      h("p", { class: "head-motto" }, motto[0], h("span", {}, motto[1])))));

  // ── 01 The six piers ──
  const bays = new Map();
  const plate = h("div", { class: "plate" });
  study.readings.forEach((reading) => {
    const parts = reading.read.map((id) => passages[id].label);
    const bay = h("a", { class: "bay", href: `?reading=${reading.slug}`, "aria-expanded": "false", "aria-controls": "reading", "data-reading": reading.slug },
      Stones.pier(reading, cellsOf(reading.slug), olderFor(reading.slug)),
      h("span", { class: "bay-caption" },
        h("span", { class: "bay-num" }, "Reading ", h("b", {}, `${reading.n} / ${String(study.readings.length).padStart(2, "0")}`)),
        h("span", { class: "bay-title" }, reading.title),
        h("span", { class: "bay-hook" }, plain(reading.hook)),
        h("span", { class: "bay-parts" }, `${reading.verseCount} verses · ${parts.join(" · ")}`),
        h("span", { class: "bay-action" }, "Open the reading →")));
    bays.set(reading.slug, bay);
    plate.append(bay);
  });
  const panel = h("section", { class: "reading", id: "reading", "aria-live": "off", hidden: true });
  const figures = [
    ["Pressures", numbers.pressures, "each with its own passage and its own call"],
    ["Verses walked", numbers.verses, `each counted once, in ${numbers.passages} passages`],
    ["Letters", numbers.letters, "and 2 Corinthians 1 to open and close"],
    ["Older passages", numbers.quoted + numbers.retold, `${numbers.quoted} quoted, ${numbers.retold} retold in 1 Corinthians 10`],
    ["Phrases marked", numbers.marks, "chosen by this study, not a census"],
  ];
  const piers = h("section", { id: "pressures" },
    h("header", { class: "plate-head wrap" }, h("span", { class: "s-num", "aria-hidden": "true" }, "01 / 03"), h("h2", {}, "Six pressures. ", h("em", {}, "Not one answer."))),
    plate, panel,
    h("div", { class: "under-plate" },
      h("dl", { class: "figures wrap" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
      h("div", { class: "wrap frame-text" },
        h("div", {}, h("p", { class: "frame-lead" }, runs(study.frame)), h("nav", { class: "jump", "aria-label": "On this page" }, [["pressures", "01", "Six pressures. Not one answer."], ["ground", "02", "Name the pressure. Find the ground."], ["older", "03", "Older words, underneath."]].map(([to, n, text]) => h("a", { href: `#${to}` }, h("b", {}, n), text)))),
        h("div", { class: "frame-notes" },
          h("p", {}, h("b", {}, "How to read this drawing: "), "every stone is one verse, as long as the verse is. A pier's height counts verses; it does not measure how hard a thing is. Gold stones state a ground, and open readings show the other marks. The arrows, the door, the gap and the prop are this site's picture of what each passage says, and the words beside them are the passages' own. The stones under the ground are older Scripture its letters quote or retell."),
          h("p", {}, h("b", {}, "How to read this page: "), "gold-referenced lines set apart are Scripture, in the Berean. Plain text is written by this site from Scripture. Outside sources are named, with what was read. An application is called an application. The numbers mark reading order, not levels of difficulty or stages to pass through."),
          h("p", {}, runs(study.selection))))));

  const reader = LBReading.create({
    olderFor,
    onChoose: (slug) => setReading(slug, false, true),
    onClose: () => setReading(null, true),
    onLens: (id) => remember({ lens: id, step: 0 }),
  });
  function setReading(slug, returnFocus = false, moveToPanel = false) {
    const previous = LB.state.reading;
    remember({ reading: slug, step: 0 });
    sync();
    if (slug) {
      const bay = bays.get(slug);
      bay.classList.remove("is-landing");
      void bay.getBoundingClientRect(); // restarts the landing when the same pier is chosen again
      bay.classList.add("is-landing");
    }
    if (!slug && returnFocus && previous) { bays.get(previous).focus({ preventScroll: false }); bays.get(previous).scrollIntoView({ block: "nearest" }); }
    if (slug && moveToPanel) document.getElementById("reading-title")?.focus({ preventScroll: true });
    if (slug) panel.scrollIntoView({ block: "start", behavior: LB.scrollBehavior() });
  }
  function sync() {
    for (const [slug, bay] of bays) {
      const on = slug === LB.state.reading;
      bay.setAttribute("aria-expanded", String(on));
      bay.classList.toggle("is-on", on);
      bay.querySelector(".bay-action").textContent = on ? "Reading now · close" : "Open the reading →";
    }
    if (LB.state.reading) { panel.replaceChildren(...reader.draw(readings.get(LB.state.reading))); panel.hidden = false; }
    else { panel.hidden = true; panel.replaceChildren(); }
  }
  plate.addEventListener("click", (event) => {
    const bay = event.target.closest("a.bay");
    if (!bay || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    const slug = bay.dataset.reading;
    setReading(LB.state.reading === slug ? null : slug);
  });

  // ── 02, 03 ──
  const verses = LBWall.verses(), older = LBWall.footings();

  // ── Close: dusk over the same wall, the light still small ──
  const close = h("section", { class: "close", id: "close" },
    h("div", { class: "wrap close-grid" },
      h("div", { class: "close-lamp" }, Stones.lamp()),
      h("div", { class: "close-text" },
        h("p", { class: "concepts" }, study.closing),
        h("p", {}, runs(study.close)),
        h("p", { class: "way" }, runs(study.way)),
        h("p", { class: "question" }, runs(study.question)),
        h("p", { class: "again" }, runs(study.again), " ", refLink(study.passage, passages[study.passage].label)),
        h("nav", { class: "close-links", "aria-label": "Where next" },
          h("a", { href: "/study/theology?area=life" }, "← Back to Living the Christian Life"),
          h("a", { href: "/mockups/faith-in-daily-life-directions/" }, "Faith in daily life, its mock-up →"),
          h("a", { href: "/study/letters" }, "Read the letters as they were sent →")))));
  const sourceList = h("details", { class: "sources wrap" },
    h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
    h("ul", {}, sources.map((source) => h("li", {}, h("a", { href: source.href, rel: "noopener noreferrer", target: "_blank" }, source.name), h("span", {}, source.note)))),
    h("p", { class: "note" }, "Studies this one leaves to others, none of them a page yet: Prayer in the letters, Bearing witness (answering others at full length), The hope to come (the last things), Grief and death, Faith and the troubled mind. Scripture references and the Calvin and Maclaren quotations were checked by script: that proves the words are there, not that the reading is right."));

  main.append(head, piers, verses.section, older.section, close, sourceList);
  document.body.append(LBSheet.el);

  addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (LB.state.sheet) { event.preventDefault(); LBSheet.closeSheet(); return; }
    if (LB.state.reading && (panel.contains(document.activeElement) || bays.get(LB.state.reading) === document.activeElement)) { event.preventDefault(); setReading(null, true); }
  });
  addEventListener("popstate", () => {
    const next = readAddress();
    const hadSheet = LB.state.sheet;
    LB.state = next;
    reader.setLens(next.lens);
    verses.sync(); older.sync(); sync();
    if (next.sheet) LBSheet.show(next.sheet);
    else if (hadSheet) LBSheet.hide();
  });

  // Cold load from a shared address: land on what it names.
  verses.sync(); older.sync(); sync();
  if (first.reading) panel.scrollIntoView({ block: "start" });
  if (first.sheet) LBSheet.show(first.sheet);
  window.LB_READY = true;
})();
