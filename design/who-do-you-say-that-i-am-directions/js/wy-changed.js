// Section 03. People who changed their answer, read across, and the older words, each saying who draws the link.
(() => {
  if (!window.WYK) return;
  const { h, phrase, runs, page, sectionHead } = WYK;
  const { study, changed, older } = window.WY;
  const cell = (label, ...items) => h("div", { class: "wy-changed-cell" }, h("span", { class: "wy-small" }, label), items.map((item) => h("p", {}, phrase(item))));
  page.append(h("section", { class: "t-sec wy-changed", id: "changed" },
    sectionHead("03", "The answer", "that changed", runs(study.changedLead)),
    h("div", { class: "wy-changed-list" }, changed.map((row) => h("article", { class: "wy-changed-row" },
      h("h3", {}, row.who), cell("First", row.before), cell("Between", row.between), cell("After", ...row.after)))),
    h("p", { class: "wy-reads" }, runs(study.changedReads)),
    h("div", { class: "wy-flag wy-flag-care wy-wall-care" }, h("p", { class: "wy-flag-label" }, "Care"), h("p", {}, runs(study.changedCare))),
    h("section", { class: "wy-older" },
      h("h3", {}, "Words that were already old"),
      h("p", { class: "wy-lead-small" }, runs(study.olderLead)),
      h("ul", {}, older.map((row) => h("li", {}, h("p", {}, phrase(row.then)), h("p", {}, phrase(row.now)), h("p", { class: "wy-older-by" }, row.by)))))));
})();
