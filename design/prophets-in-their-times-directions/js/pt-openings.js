// The opening verses taken at their word. Rulers in rows, kept to their own kingdom; a prophet touches only the rungs his text names.
// Six books name no ruler, and sit in a sentence, not on the rungs. Below 900px the same facts become a list, with the same names.
(() => {
  if (!window.PTK) return;
  const { h, refLink, runs, page, sectionHead, roving, prophetIds } = PTK;
  const { prophets, rulers, markLabels, succession, numbers } = window.PT;
  const placed = prophets.filter((p) => p.touched.length);
  const shelf = prophets.filter((p) => !p.touched.length);
  const nameButtons = [];
  const nameButton = (prophet, className) => {
    const button = h("button", { type: "button", class: `${className} ${prophet.basis === "kings" ? "is-kings" : ""}`, "aria-pressed": "false", "data-opening": prophet.id, onclick: () => choose(prophet.id, true) }, prophet.name);
    nameButtons.push(button);
    return button;
  };
  const GROUPS = [
    ["judah", "Judah", "In the order Kings tells them."],
    ["israel", "Israel", "In the order Kings tells them."],
    ["foreign", "Foreign kings", "In no order here. They are other kingdoms’ rulers."],
  ];
  const RULER_NOTES = { uzziah: "called Azariah in Kings", jehoiachin: "Ezekiel dates by his exile", darius: "of Haggai and Zechariah" };
  const rulerRow = (ruler) => h("tr", {}, h("th", { scope: "row" }, ruler.name, RULER_NOTES[ruler.id] ? h("small", {}, RULER_NOTES[ruler.id]) : null),
    placed.map((prophet) => {
      const touch = prophet.touched.find((t) => t.ruler === ruler.id);
      return h("td", { class: prophet.basis === "kings" ? "is-kings" : "", "data-column": prophet.id }, touch ? h("span", { class: "pt-touch" }, h("span", { class: "pt-hidden" }, `${prophet.name}: ${touch.label}`)) : null);
    }));
  const groupRows = ([id, label, note]) => {
    const rows = [h("tr", { class: "pt-band" }, h("th", { colspan: placed.length + 1, scope: "rowgroup" }, label, " ", h("small", {}, note)))];
    for (const ruler of rulers.filter((r) => r.group === id)) {
      if (ruler.id === "josiah") rows.push(h("tr", { class: "pt-gap" }, h("td", { colspan: placed.length + 1 }, "Manasseh and Amon reign here. No opening names them.")));
      rows.push(rulerRow(ruler));
    }
    return rows;
  };
  const ladder = h("table", { class: "pt-ladder" },
    h("caption", { class: "pt-hidden" }, "Which rulers each prophet’s text names"),
    h("thead", {}, h("tr", {}, h("td", {}), placed.map((p) => h("th", { scope: "col", "data-column": p.id }, nameButton(p, "pt-name"), p.basis === "kings" ? h("small", { class: "pt-in-kings" }, "from Kings") : null)))),
    h("tbody", {}, GROUPS.map(groupRows)));
  const shortList = h("ul", { class: "pt-short" }, placed.map((p) => h("li", {},
    nameButton(p, "pt-name"), p.basis === "kings" ? h("small", { class: "pt-in-kings" }, "from Kings") : null,
    h("span", {}, p.touched.map((t) => rulers.find((r) => r.id === t.ruler).name).join(", ")))));
  const shelfNames = [];
  shelf.forEach((p, index) => {
    shelfNames.push(nameButton(p, "pt-name pt-shelf-name"));
    if (index < shelf.length - 2) shelfNames.push(", ");
    if (index === shelf.length - 2) shelfNames.push(" and ");
  });

  const panel = h("div", { class: "pt-verse", "aria-live": "polite" });
  const absent = [["ruler", "a ruler"], ["date", "a date"], ["family", "a family"]];
  function drawPanel(prophet) {
    const kinds = new Set(prophet.segments.map((s) => s.k).filter(Boolean));
    const missing = absent.filter(([kind]) => !kinds.has(kind)).map(([, word]) => word);
    panel.replaceChildren(...[
      h("p", { class: "pt-small" }, prophet.basis === "kings" ? `${prophet.name} · from Kings, not a heading` : `${prophet.name} · the book’s opening`),
      h("p", { class: "pt-verse-text" }, prophet.segments.map((piece) => (piece.k ? h("mark", { class: `pt-mark pt-mark-${piece.k}` }, piece.t) : piece.t))),
      h("p", { class: "pt-verse-ref" }, refLink(prophet.opening, prophet.openingLabel), " · Berean Standard Bible"),
      kinds.size ? h("ul", { class: "pt-named" }, prophet.segments.filter((s) => s.k).map((s) => h("li", {}, h("b", {}, markLabels[s.k]), s.t))) : null,
      missing.length ? h("p", { class: "pt-missing" }, `Not in these words: ${missing.join(", ")}.`) : null,
      prophet.noteRuns.length ? h("p", { class: "pt-verse-note" }, runs(prophet.noteRuns)) : null,
      h("button", { type: "button", class: "pt-action", "data-prophet": prophet.id, onclick: (event) => PTK.openProphet(prophet.id, event.currentTarget) }, `Open ${prophet.name}’s six lines →`),
    ].filter(Boolean));
  }
  function choose(id, keep) {
    if (keep) PTK.setView({ opening: id });
    drawPanel(prophetIds.get(id));
    for (const button of nameButtons) button.setAttribute("aria-pressed", String(button.dataset.opening === id));
    section.querySelectorAll("[data-column]").forEach((cell) => cell.classList.toggle("is-current", cell.dataset.column === id));
  }
  const section = h("section", { class: "t-sec pt-openings", id: "openings" },
    sectionHead("01", "The opening verses,", "taken at their word",
      `Choose a prophet. A mark means the text names that ruler in so many words. These are ${numbers.named} books’ own openings and two narratives. The figure shows order within each kingdom, not length or overlap, and it gives no years.`),
    h("div", { class: "pt-ladder-wrap" }, ladder), shortList,
    h("p", { class: "pt-shelf" }, h("b", {}, "These six name no ruler, so this page does not place them: "), shelfNames, "."),
    panel,
    h("details", { class: "pt-how" },
      h("summary", {}, "How the order of Judah’s kings was checked"),
      h("p", {}, "Each step is told in Kings: ", succession.flatMap((step, index) => [index ? ", " : "", refLink(step.r, step.label)]), ". Jehoahaz also reigns for a short time, and no opening names him.")));
  page.append(section);
  roving(nameButtons);
  choose(PTK.state.opening, false);
  PTK.syncers.push(() => choose(PTK.state.opening, false));
})();
