// Section 04. Four orders of events in one chart, every one lined up on the return, and one gold line runs down through all four
// returns. Each step has its own drawn mark. The thick bar is the thousand years: it sits right after the return on two maps and
// right before it on the other two, and that is the whole of the disagreement. No map is favoured: same weight, same colour, the
// study's own order. Under the chart, one card for each map says who holds it and why. Nothing here depicts God or Christ.
(() => {
  if (!window.HZ) return;
  const { h, art, runs, page, sectionHead, blockView } = HZ;
  const { study, mapSteps } = HP;

  const [mapsFirst, mapsTurn] = study.mapsTitle.split(". ");
  const mapParts = study.maps.slice(0, mapSteps.length);
  const [founder, shared] = study.maps.slice(mapSteps.length);
  const returnAt = (map) => map.steps.findIndex(([, kind]) => kind === "return");
  // The chart's first column is the map's name. A track counts its own columns: two before the return, the return, three after.
  const RETURN_COLUMN = 3;

  const CLOUD = `<path d="M7 17.5h10.5a3.5 3.5 0 0 0 .4-7A5 5 0 0 0 8.3 9 4.3 4.3 0 0 0 7 17.5Z"/>`;
  const ICONS = {
    rise: `<path d="M7 10.5h10a3 3 0 0 0 .3-6A4.5 4.5 0 0 0 8.6 3.6 3.5 3.5 0 0 0 7 10.5Z"/><path d="M12 21.5v-8M8.8 16.5l3.2-3.2 3.2 3.2"/>`,
    storm: `<path d="M7 13h10.5a3.5 3.5 0 0 0 .4-7A5 5 0 0 0 8.3 4.5 4.3 4.3 0 0 0 7 13Z"/><path d="M12.5 14.5l-2.5 4h3.5l-2 3.5"/>`,
    cloud: `${CLOUD}<path d="M12 2.5v3M5.2 5.2l2 2M18.8 5.2l-2 2M2.5 12h2M19.5 12h2"/>`,
    crown: `<path d="M4 19h16M5 19 3.8 8.5l4.6 3.8L12 5.5l3.6 6.8 4.6-3.8L19 19Z"/>`,
    book: `<path d="M12 6.5C10 5 7 4.6 3.5 5v13.5c3.5-.4 6.5 0 8.5 1.5 2-1.5 5-1.9 8.5-1.5V5C17 4.6 14 5 12 6.5ZM12 6.5V20"/>`,
    city: `<path d="M2.5 21h19M4.5 21V10.5L7.5 8l3 2.5V21M13.5 21V10.5l3-2.5 3 2.5V21M10.5 21v-4.5a1.5 1.5 0 0 1 3 0V21M12 3.5v2.5"/>`,
    tomb: `<path d="M2.5 20.5h19M4 20.5v-7a6 6 0 0 1 12 0v7M8 20.5V16a2 2 0 0 1 4 0v4.5"/><circle cx="18.6" cy="17.6" r="2.9"/>`,
    globe: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>`,
  };
  const ICON_FOR = {
    "Believers taken up": "rise", "The tribulation": "storm", "The last judgment": "book", "Resurrection and judgment": "book",
    "New heaven and earth": "city", "Christ's first coming and resurrection": "tomb", "The gospel spreads through the world": "globe",
  };
  const iconOf = ([label, kind]) => {
    const name = kind === "return" ? "cloud" : kind === "reign" ? "crown" : ICON_FOR[label];
    if (!name) console.error(`The hope to come: no mark drawn for the step "${label}"`);
    return art(`<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ""}</svg>`, "hz-step-mark");
  };
  const stepItem = (step, index, at) => h("li", { class: `hz-step hz-step-${step[1] || "plain"}`, style: `grid-column:${RETURN_COLUMN + index - at}` },
    iconOf(step), h("span", {}, step[0]));
  const rows = mapParts.map((part, index) => {
    const map = mapSteps[index], at = returnAt(map);
    return h("li", { class: "hz-map-row" },
      h("h3", { class: "hz-map-name" }, part.title),
      h("ol", { class: "hz-track", "aria-label": `Order of events, not scale: ${map.name}` }, map.steps.map((step, i) => stepItem(step, i, at))));
  });
  const cards = mapParts.map((part, index) => h("article", { class: "hz-map-card" },
    h("h3", {}, part.title),
    h("p", {}, mapSteps[index].reads),
    h("details", { class: "hz-who" },
      h("summary", {}, "Who holds this map, and why"),
      h("div", { class: "hz-who-text" }, part.blocks.map((block) => blockView[block.k](block))))));

  page.append(h("section", { class: "hz-sec", id: "maps" },
    sectionHead("04", `${mapsFirst}.`, mapsTurn, runs(study.mapsLead)),
    h("p", { class: "hz-reads" }, `All ${mapSteps.length} line up below on the return, in gold. Look at whether the thousand years come before it or after it.`),
    h("div", { class: "hz-chart" },
      h("div", { class: "hz-chart-head", "aria-hidden": "true" }, h("span", { class: "hz-chart-before" }, "Before"), h("span", { class: "hz-chart-return" }, "The return"), h("span", { class: "hz-chart-after" }, "After")),
      h("span", { class: "hz-spine", "aria-hidden": "true" }),
      h("ol", { class: "hz-map-rows" }, rows)),
    h("p", { class: "hz-note" }, "Each map shows order, not length: no step is drawn to scale."),
    h("div", { class: "hz-map-cards" }, cards),
    h("div", { class: "hz-founder" }, h("h3", {}, founder.title), founder.blocks.map((block) => blockView[block.k](block)))));
  page.append(h("section", { class: "hz-shared" },
    h("h3", {}, shared.title),
    shared.blocks.map((block) => blockView[block.k](block))));
})();
