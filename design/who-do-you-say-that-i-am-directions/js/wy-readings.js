// Section 02. Six ruled entries, opening where they stand. Each holds the passages, a form from its own text, what is said, what this study reads, and a question for the reader.
(() => {
  if (!window.WYK) return;
  const { h, runs, refLink, page, sectionHead, partView, readings, reducedMotion } = WYK;
  const { study, words } = window.WY;
  const entries = new Map();

  const detail = (reading) => h("div", { class: "wy-entry-body", id: `reading-${reading.slug}` },
    h("p", { class: "wy-hook" }, runs(reading.hook)),
    h("p", { class: "wy-read-line" }, "Read it whole: ", reading.read.map((item, index) => [index ? " · " : "", refLink(item.r, item.t)])),
    WYK.formFor(reading.slug),
    h("div", { class: "wy-parts" }, reading.parts.map(partView)),
    h("div", { class: "wy-after" },
      h("section", {}, h("p", { class: "wy-small" }, "Consider"), h("p", {}, runs(reading.consider))),
      h("section", {}, h("p", { class: "wy-small" }, "Reflect"), h("p", {}, runs(reading.reflect)))));

  function entry(reading) {
    const body = detail(reading);
    const button = h("button", { type: "button", class: "wy-entry-open", "aria-expanded": "false", "aria-controls": `reading-${reading.slug}` },
      h("span", { class: "wy-entry-n", "aria-hidden": "true" }, reading.n),
      h("span", { class: "wy-entry-title" }, reading.title),
      h("span", { class: "wy-entry-ask" }, runs(reading.ask).map((run) => (typeof run === "string" ? run : run.textContent))),
      h("span", { class: "wy-entry-go", "aria-hidden": "true" }));
    button.addEventListener("click", () => {
      WYK.setView({ reading: WYK.state.reading === reading.slug ? "" : reading.slug });
      sync();
      button.scrollIntoView({ block: "nearest", behavior: reducedMotion.matches ? "auto" : "smooth" }); // closing one above can move this one out of view
    });
    entries.set(reading.slug, { button, body });
    return h("article", { class: "wy-entry" }, h("h3", {}, button), body);
  }
  function sync() {
    for (const [slug, { button, body }] of entries) {
      const open = slug === WYK.state.reading;
      button.setAttribute("aria-expanded", String(open));
      body.hidden = !open;
    }
  }
  page.append(h("section", { class: "t-sec wy-readings", id: "readings" },
    sectionHead("02", `${words.Readings} scenes,`, "read whole", runs(study.readingsLead)),
    h("div", { class: "wy-entries" }, [...readings.values()].map(entry))));
  WYK.syncers.push(sync);
  sync();
})();
