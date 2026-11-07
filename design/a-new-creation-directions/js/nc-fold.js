// Section 01. Six lines across one fold, each opening its reading in place beneath it. Every reading is built once and only shown or hidden,
// so a click never redraws what is under the pointer and links inside a reading survive the sheet and Back.
(() => {
  if (!window.NCK) return;
  const { h, refLink, runs, plain, page, sectionHead, partView, roving, readings, state, NO_READING, syncers } = NCK;
  const { study, folds, passages } = window.NC;

  const foldCross = (fold) => [
    h("span", { class: "nc-done" }, fold.done, h("small", {}, fold.who)),
    h("span", { class: "nc-crease", "aria-hidden": fold.join ? null : "true" }, fold.join ? h("em", {}, fold.join) : null),
    h("span", { class: "nc-now" }, fold.now, fold.commandFirst ? h("small", {}, "The command comes first") : null),
  ];
  NCK.foldCross = foldCross;

  const panels = new Map(), buttons = new Map();
  let shown = state.reading;
  const order = study.readings.map((r) => r.slug);
  const next = (slug) => order[order.indexOf(slug) + 1];

  const panelFor = (reading) => {
    const figure = NCK.readingFigure[reading.slug];
    const following = next(reading.slug);
    return h("div", { class: "nc-reading", id: `reading-${reading.slug}`, role: "region", "aria-label": reading.title },
      h("div", { class: "nc-reading-head" },
        h("p", { class: "nc-hook" }, runs(reading.hook)),
        h("p", { class: "nc-also" }, h("b", {}, "Read"), " ", reading.read.map((id, index) => [index ? " · " : "", refLink(id, passages[id].label)]))),
      h("div", { class: "nc-parts" }, reading.parts.map(partView)),
      figure ? figure() : null,
      h("div", { class: "nc-after" },
        h("div", {}, h("p", { class: "nc-small" }, "Consider"), h("p", {}, runs(reading.consider))),
        h("div", {}, h("p", { class: "nc-small" }, "Reflect · your response"), h("p", {}, runs(reading.reflect)))),
      following
        ? h("button", { type: "button", class: "nc-action", onclick: () => { choose(following); buttons.get(following).focus({ preventScroll: true }); } }, `Next reading: ${readings.get(following).title} →`)
        : h("a", { class: "nc-action", href: "#close" }, "Return to the beginning →"));
  };

  function show(slug) {
    for (const [name, panel] of panels) {
      panel.hidden = name !== slug;
      buttons.get(name).setAttribute("aria-expanded", String(name === slug));
    }
  }
  function setReading(target, anchor) {
    const before = anchor.getBoundingClientRect().top;
    show(target);
    scrollBy({ top: anchor.getBoundingClientRect().top - before, behavior: "instant" }); // the line stays where the pointer left it
    NCK.setView({ reading: target });
    shown = target;
  }
  const choose = (slug) => setReading(slug, buttons.get(slug));
  const toggle = (slug) => setReading(NCK.state.reading === slug ? NO_READING : slug, buttons.get(slug));

  const list = h("ol", { class: "nc-folds" });
  for (const fold of folds) {
    const reading = readings.get(fold.id);
    const button = h("button", { type: "button", class: "nc-fold", "aria-controls": `reading-${fold.id}`, "aria-expanded": "false", onclick: () => toggle(fold.id) },
      h("span", { class: "nc-fold-title" }, h("span", { class: "nc-fold-n" }, reading.n), h("span", { class: "nc-fold-name" }, reading.title), h("span", { class: "nc-fold-ask" }, plain(reading.ask))),
      h("span", { class: "nc-cross" }, foldCross(fold)),
      h("span", { class: "nc-fold-ref" }, fold.span));
    const panel = panelFor(reading);
    buttons.set(fold.id, button);
    panels.set(fold.id, panel);
    list.append(h("li", {}, button, panel));
  }
  roving([...buttons.values()]);
  show(state.reading);
  syncers.push(() => { if (NCK.state.reading !== shown) { shown = NCK.state.reading; show(shown); } });

  page.append(h("section", { class: "t-sec nc-fold-sec", id: "folds" },
    sectionHead("01", "Already so.", "Now live by it.", runs(study.foldLead)),
    h("p", { class: "nc-heads", "aria-hidden": "true" }, h("span", {}, "Already so"), h("span", {}), h("span", {}, "Now")),
    list));
})();
