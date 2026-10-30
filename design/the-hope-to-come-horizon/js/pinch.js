// Section 04. Four orders of events laid on one chart, every one lined up on the return. The thick bar is the thousand years: it
// sits right after the return on two maps and right before it on the other two, and that is the whole of the disagreement.
// No map is favoured: same weight, same colour, the study's own order. Who holds each map opens under it, one at a time.
(() => {
  if (!window.HZ) return;
  const { h, runs, page, sectionHead, blockView } = HZ;
  const { study, mapSteps } = HP;

  const [mapsFirst, mapsTurn] = study.mapsTitle.split(". ");
  const mapParts = study.maps.slice(0, mapSteps.length);
  const [founder, shared] = study.maps.slice(mapSteps.length);
  const returnAt = (map) => map.steps.findIndex(([, kind]) => kind === "return");
  const RETURN_COLUMN = 3;

  const stepItem = ([label, kind], index, at) => h("li", { class: `hz-step hz-step-${kind || "plain"}`, style: `grid-column:${RETURN_COLUMN + index - at}` },
    h("i", { "aria-hidden": "true" }), h("span", {}, label));
  const maps = mapParts.map((part, index) => {
    const map = mapSteps[index], at = returnAt(map);
    return h("article", { class: "hz-map" },
      h("header", { class: "hz-map-head" }, h("h3", {}, part.title), h("p", {}, map.reads)),
      h("ol", { class: "hz-track", "aria-label": `Order of events, not scale: ${map.name}` }, map.steps.map((step, i) => stepItem(step, i, at))),
      h("details", { class: "hz-who" },
        h("summary", {}, "Who holds this map, and why"),
        h("div", { class: "hz-who-text" }, part.blocks.map((block) => blockView[block.k](block)))));
  });

  page.append(h("section", { class: "hz-sec", id: "maps" },
    sectionHead("04", `${mapsFirst}.`, mapsTurn, runs(study.mapsLead)),
    h("p", { class: "hz-reads" }, `All ${mapSteps.length} line up below on the return, in gold. Look at whether the thousand years come before it or after it.`),
    h("div", { class: "hz-chart" },
      h("div", { class: "hz-chart-head", "aria-hidden": "true" }, h("span", { class: "hz-chart-before" }, "Before"), h("span", { class: "hz-chart-return" }, "The return"), h("span", { class: "hz-chart-after" }, "After")),
      maps),
    h("p", { class: "hz-note" }, "Each strip shows order, not length: no step is drawn to scale."),
    h("div", { class: "hz-founder" }, h("h3", {}, founder.title), founder.blocks.map((block) => blockView[block.k](block)))));
  page.append(h("section", { class: "hz-shared" },
    h("h3", {}, shared.title),
    shared.blocks.map((block) => blockView[block.k](block))));
})();
