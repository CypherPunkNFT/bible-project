// Section 02. Six readings behind six small drawings. Each one opens with who was in the room, in the passage's own words.
// All six are built once and only shown or hidden, so links survive the sheet and Back.
(() => {
  if (!window.CCK) return;
  const { h, art, refLink, page, sectionHead, runs, partView, roving, readings } = CCK;
  const { study, rooms } = window.CC;
  const roomPlate = (slug) => h("aside", { class: "cc-room" },
    h("p", { class: "cc-small" }, "Who was in the room"),
    h("ul", {}, rooms[slug].map((room) => h("li", {},
      h("p", { class: "cc-room-words" }, "“", room.t, "”"),
      h("p", { class: "cc-room-note" }, room.note, " ", refLink(room.r, room.label))))));
  const readingView = (reading) => {
    const head = h("h3", { tabindex: "-1" }, reading.title);
    const view = h("div", { class: "cc-reading", id: `reading-${reading.slug}`, role: "group", "aria-label": reading.title, hidden: CCK.state.reading !== reading.slug },
      head,
      h("p", { class: "cc-hook" }, runs(reading.hook)),
      h("p", { class: "cc-read-these" }, "Read first: ", reading.read.map((link, index) => [index ? " · " : "", refLink(link.r, link.t)])),
      roomPlate(reading.slug),
      h("div", { class: "cc-parts" }, reading.parts.map(partView)),
      h("div", { class: "cc-after" },
        h("div", {}, h("p", { class: "cc-small" }, "Consider · what the passage says"), h("p", {}, runs(reading.consider))),
        h("div", {}, h("p", { class: "cc-small" }, "Reflect · your response"), h("p", {}, runs(reading.reflect)))));
    return { view, head };
  };
  const panels = new Map(study.readings.map((reading) => [reading.slug, readingView(reading)]));
  const order = study.readings.map((reading) => reading.slug);
  const cabinet = new Map(study.readings.map((reading) => [reading.slug, h("button", { type: "button", class: "cc-drawer", "aria-controls": `reading-${reading.slug}`, onclick: () => choose(reading.slug) },
    art(CCArt[reading.slug], "cc-drawer-art"),
    h("span", { class: "cc-drawer-title" }, reading.title),
    h("span", { class: "cc-drawer-ask" }, runs(reading.ask)))]));
  const panelArea = h("div", { class: "cc-panels" }, [...panels.values()].map((panel) => panel.view));

  function draw() {
    for (const [slug, panel] of panels) panel.view.hidden = slug !== CCK.state.reading;
    for (const [slug, button] of cabinet) button.setAttribute("aria-pressed", String(slug === CCK.state.reading));
    markStop(cabinet.get(CCK.state.reading));
  }
  // A long reading can leave the reader far below where the next one starts, so bring its top into view, at once and with no animation.
  function choose(slug, focusHeading = false) {
    if (!readings.has(slug)) { console.error(`The church and its calling: unknown reading ${slug}`); return; }
    CCK.setView({ reading: slug });
    draw();
    const top = panelArea.getBoundingClientRect().top;
    if (top < 0 || focusHeading) scrollTo({ top: scrollY + top - 80, behavior: "instant" });
    if (focusHeading) panels.get(slug).head.focus({ preventScroll: true });
  }
  const markStop = roving([...cabinet.values()], () => cabinet.get(CCK.state.reading));
  CCK.syncers.push(draw);
  panels.forEach((panel, slug) => {
    const next = order[order.indexOf(slug) + 1];
    if (next) panel.view.append(h("button", { type: "button", class: "cc-action", onclick: () => choose(next, true) }, `Next reading: ${readings.get(next).title} →`));
  });
  page.append(h("section", { class: "t-sec cc-readings", id: "readings" },
    sectionHead("02", "Six readings,", "and who was listening", runs(study.readingsLead)),
    h("nav", { class: "cc-cabinet", "aria-label": "Six readings" }, [...cabinet.values()]),
    panelArea));
  draw();
})();
