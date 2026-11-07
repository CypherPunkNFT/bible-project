// Section 02. Six readings in a rail beside the chosen one. Each passage is whole, broken into lines that step in at each so that.
// All six are built once and only shown or hidden, so links survive the sheet and Back.
(() => {
  if (!window.PCK) return;
  const { h, refLink, page, sectionHead, runs, partView, roving, readings } = PCK;
  const { study, leaves, kinds } = window.PC;

  const lineView = (line) => h("p", { class: `pc-line pc-l${line.l}${line.k ? ` pc-k-${line.k}` : ""}` },
    line.k ? h("span", { class: "pc-line-kind" }, kinds[line.k]) : null,
    h("span", { class: "pc-line-text" }, line.runs.map((run) => (typeof run === "string" ? `${run} ` : h("sup", {}, String(run.v))))));
  PCK.leafLines = (leaf) => h("div", { class: "pc-leaf-lines" }, leaf.lines.map(lineView));
  const leafHead = (leaf) => h("header", { class: "pc-leaf-head" },
    h("p", { class: "pc-small" }, leaf.role),
    h("h4", {}, refLink(leaf.r, leaf.label)));
  const notes = (leaf) => h("dl", { class: "pc-margin" },
    h("div", {}, h("dt", {}, "For whom"), h("dd", {}, runs(leaf.who))),
    h("div", {}, h("dt", {}, "What gives confidence"), h("dd", {}, runs(leaf.sure))),
    leaf.note ? h("div", {}, h("dt", {}, "Not here"), h("dd", {}, runs(leaf.note))) : null);
  const leafView = (label, pick) => {
    const leaf = leaves[label];
    return h("article", { class: `pc-leaf${pick ? ` pc-pick-${pick}` : ""}` }, leafHead(leaf), h("div", { class: "pc-leaf-body" }, PCK.leafLines(leaf), notes(leaf)));
  };
  const readingView = (reading) => {
    const [first, ...rest] = reading.leaves;
    const head = h("h3", { tabindex: "-1" }, reading.title);
    const view = h("div", { class: "pc-reading", id: `reading-${reading.slug}`, role: "group", "aria-label": reading.title, hidden: PCK.state.reading !== reading.slug },
      head,
      h("p", { class: "pc-hook" }, runs(reading.hook)),
      leafView(first, reading.pick),
      rest.map((label) => h("details", { class: "pc-more", open: reading.restOpen }, h("summary", {}, `Then read ${label}`), leafView(label, reading.pick))),
      h("div", { class: "pc-parts" }, reading.parts.map(partView)),
      h("div", { class: "pc-after" },
        h("div", {}, h("p", { class: "pc-small" }, "Consider · what the passage says"), h("p", {}, runs(reading.consider))),
        h("div", {}, h("p", { class: "pc-small" }, "Reflect · your response"), h("p", {}, runs(reading.reflect)))));
    return { view, head };
  };
  const panels = new Map(study.readings.map((reading) => [reading.slug, readingView(reading)]));
  const order = study.readings.map((reading) => reading.slug);
  const rail = new Map(study.readings.map((reading, index) => [reading.slug, h("button", { type: "button", class: "pc-rail-item", "aria-controls": `reading-${reading.slug}`, onclick: () => choose(reading.slug) },
    h("span", { class: "pc-rail-n" }, `${index + 1} / ${order.length}`),
    h("span", { class: "pc-rail-title" }, reading.title),
    h("span", { class: "pc-rail-ask" }, runs(reading.ask)))]));
  const panelArea = h("div", { class: "pc-panels" }, [...panels.values()].map((panel) => panel.view));

  function draw() {
    for (const [slug, panel] of panels) panel.view.hidden = slug !== PCK.state.reading;
    for (const [slug, button] of rail) button.setAttribute("aria-pressed", String(slug === PCK.state.reading));
    markStop(rail.get(PCK.state.reading));
  }
  // A long reading can leave the reader far below where the next one starts, so bring its top into view, at once and with no animation.
  function choose(slug, focusHeading = false) {
    if (!readings.has(slug)) { console.error(`Prayer in the letters: unknown reading ${slug}`); return; }
    PCK.setView({ reading: slug });
    draw();
    const top = panelArea.getBoundingClientRect().top;
    if (top < 0 || focusHeading) scrollTo({ top: scrollY + top - 16, behavior: "instant" });
    if (focusHeading) panels.get(slug).head.focus({ preventScroll: true });
  }
  PCK.chooseReading = choose;
  const markStop = roving([...rail.values()], () => rail.get(PCK.state.reading));
  PCK.syncers.push(draw);
  panels.forEach((panel, slug) => {
    const next = order[order.indexOf(slug) + 1];
    if (next) panel.view.append(h("button", { type: "button", class: "pc-action", onclick: () => choose(next, true) }, `Next reading: ${readings.get(next).title} →`));
  });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-reading]");
    if (link) { event.preventDefault(); choose(link.dataset.reading, true); }
  });
  page.append(h("section", { class: "t-sec pc-readings", id: "readings" },
    sectionHead("02", "Keep it whole.", "See where it goes.", runs(study.leafLead)),
    h("div", { class: "pc-desk" }, h("nav", { class: "pc-rail", "aria-label": "Six readings" }, [...rail.values()]), panelArea)));
  draw();
})();
