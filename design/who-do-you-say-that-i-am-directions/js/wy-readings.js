// Section 02. Six ruled entries, opening where they stand. Each holds its passages, the form its own text has, what is said, what this study reads, and a question
// for the reader. Part 05, the long one on how the Son became a man, shows its ledger first and opens its subsections one at a time.
(() => {
  if (!window.WYK) return;
  const { h, runs, refLink, page, sectionHead, partView, blockView, readings, reducedMotion } = WYK;
  const { readingForms, words } = window.WY;
  const entries = new Map();

  function foldedParts(reading) {
    const items = reading.parts.map((part, index) => {
      const body = h("div", { class: "wy-fold-body", id: `part-${reading.slug}-${index}`, hidden: true }, part.blocks.map(blockView));
      const button = h("button", { type: "button", class: "wy-fold-open", "aria-expanded": "false", "aria-controls": body.id }, part.title);
      button.addEventListener("click", () => {
        const opening = button.getAttribute("aria-expanded") !== "true";
        for (const other of items) { other.button.setAttribute("aria-expanded", "false"); other.body.hidden = true; }
        button.setAttribute("aria-expanded", String(opening));
        body.hidden = !opening;
      });
      return { button, body, view: h("section", { class: "wy-fold" }, h("h4", {}, button), body) };
    });
    return h("div", { class: "wy-folds" }, items.map((item) => item.view));
  }

  const detail = (reading) => h("div", { class: `wy-entry-body wy-entry-${reading.slug}`, id: `reading-${reading.slug}` },
    h("p", { class: "wy-read-line" }, "Main readings: ", reading.read.map((item, index) => [index ? " · " : "", refLink(item.r, item.t)])),
    readingForms[reading.slug].map(WYK.formFor),
    reading.intro.length ? h("div", { class: "wy-intro-text" }, reading.intro.map(blockView)) : null,
    reading.slug === "word" ? foldedParts(reading) : h("div", { class: "wy-parts" }, reading.parts.map(partView)),
    h("div", { class: "wy-after" },
      h("section", {}, h("p", { class: "wy-small" }, "Consider"), h("p", {}, runs(reading.consider))),
      h("section", {}, h("p", { class: "wy-small" }, "Reflect"), h("p", {}, runs(reading.reflect)))));

  function entry(reading) {
    const body = detail(reading);
    const button = h("button", { type: "button", class: "wy-entry-open", "aria-expanded": "false", "aria-controls": `reading-${reading.slug}` },
      h("span", { class: "wy-entry-n", "aria-hidden": "true" }, reading.n),
      h("span", { class: "wy-entry-title" }, reading.title),
      h("span", { class: "wy-entry-ask" }, runs(reading.hook).map((run) => (typeof run === "string" ? run : run.textContent))),
      h("span", { class: "wy-entry-go", "aria-hidden": "true" }));
    button.addEventListener("click", () => {
      WYK.setView({ reading: WYK.state.reading === reading.slug ? "" : reading.slug });
      sync();
      button.scrollIntoView({ block: "nearest", behavior: reducedMotion.matches ? "auto" : "smooth" }); // closing one above can move this one out of view
    });
    entries.set(reading.slug, { button, body });
    return h("article", { class: `wy-entry${reading.slug === "word" ? " is-centre" : ""}` }, h("h3", {}, button), body);
  }
  function sync() {
    for (const [slug, { button, body }] of entries) {
      const open = slug === WYK.state.reading;
      button.setAttribute("aria-expanded", String(open));
      body.hidden = !open;
    }
  }
  page.append(h("section", { class: "t-sec wy-readings", id: "readings" },
    sectionHead("02", `${words.readings[0].toUpperCase()}${words.readings.slice(1)} readings,`, "read whole", "Scenes in which people answer Him, and, at the centre, one reading on where He came from. Each gives what the passage says, then what this study makes of it, then a question for you."),
    h("div", { class: "wy-entries" }, [...readings.values()].map(entry))));
  WYK.syncers.push(sync);
  sync();
})();
