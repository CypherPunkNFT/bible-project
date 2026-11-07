// Section 01. The prayer Jesus taught, line by line, is the way into the six parts: choosing a line shows the part that reads
// it, beside the prayer. Beside each line, the letters' prayers this study pairs with it. A change of part is not a Back step.
(() => {
  if (!window.PCK || !window.PCK.panels) return;
  const { h, refLink, page, sectionHead, runs, plain, roving, parts, panels } = PCK;
  const { study, spine, bands } = window.PC;
  const order = study.parts.map((part) => part.n);
  const buttons = [];

  const lineItem = (line) => {
    const button = h("button", { type: "button", class: "pc-sp-line", "aria-controls": `part-${line.part}`, onclick: () => choose(line.part, true) },
      h("span", { class: "pc-sp-words" }, line.words),
      h("span", { class: "pc-sp-part" }, `Part ${line.part}`));
    button.dataset.part = line.part;
    buttons.push(button);
    return h("li", { class: `pc-sp pc-sp-${line.band}` }, button,
      line.letters.length ? h("p", { class: "pc-sp-letters" }, "Beside it: ", line.letters.map((l, i) => [i ? " · " : "", refLink(l.r, l.label)])) : null);
  };
  // One list per band, in the prayer's order: the disciple's request, the address, three lines about God, three about us.
  const groups = [];
  for (const line of spine) {
    if (!groups.length || groups[groups.length - 1].band !== line.band) groups.push({ band: line.band, lines: [] });
    groups[groups.length - 1].lines.push(line);
  }
  const rail = h("nav", { class: "pc-spine", "aria-label": "The prayer Jesus taught, line by line" },
    groups.map((group) => h("div", { class: `pc-sp-group pc-sp-group-${group.band}` },
      h("p", { class: "pc-small pc-sp-band" }, bands[group.band]),
      h("ol", { class: "pc-sp-list" }, group.lines.map(lineItem)))),
    h("p", { class: "pc-sp-note" }, "The Berean ends the prayer here. Part 02 says why many churches add a closing praise."));
  const panelArea = h("div", { class: "pc-panels" }, [...panels.values()].map((panel) => panel.view));

  function draw() {
    for (const [n, panel] of panels) panel.view.hidden = n !== PCK.state.part;
    for (const button of buttons) button.setAttribute("aria-pressed", String(button.dataset.part === PCK.state.part));
    markStop(buttons.find((button) => button.dataset.part === PCK.state.part));
  }
  // A long part can leave the reader far below where the next one starts, so bring its top into view at once, with no animation.
  function choose(n, focusHeading = false) {
    if (!parts.has(n)) { console.error(`Prayer across Scripture: unknown part ${n}`); return; }
    PCK.setView({ part: n });
    draw();
    const top = panelArea.getBoundingClientRect().top;
    if (top < 0 || top > innerHeight * 0.6 || focusHeading) scrollTo({ top: scrollY + top - 16, behavior: "instant" });
    if (focusHeading) panels.get(n).head.focus({ preventScroll: true });
  }
  const markStop = roving(buttons, () => buttons.find((button) => button.dataset.part === PCK.state.part));
  PCK.syncers.push(draw);
  panels.forEach((panel, n) => {
    const next = order[order.indexOf(n) + 1];
    if (next) panel.view.append(h("button", { type: "button", class: "pc-action", onclick: () => choose(next, true) }, `Next part: ${plain(parts.get(next).title)} →`));
  });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-part]");
    if (link) { event.preventDefault(); choose(link.dataset.part, true); }
  });
  page.append(h("section", { class: "t-sec pc-readings", id: "prayer" },
    sectionHead("01", "The prayer Jesus taught.", "Line by line.", runs(study.spineLead)),
    h("p", { class: "pc-reads" }, runs(study.spineReads)),
    h("p", { class: "pc-note pc-pairing" }, h("b", {}, "This study’s pairing · "), runs(study.spineCare)),
    h("div", { class: "pc-desk" }, rail, panelArea)));
  draw();
})();
