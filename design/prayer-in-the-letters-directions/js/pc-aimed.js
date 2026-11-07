// Sections 03 and 04. Three requests about circumstances and where each goes; then six older lines beside lines in these passages.
(() => {
  if (!window.PCK) return;
  const { h, page, sectionHead, runs, refLink } = PCK;
  const { study, aimed, older } = window.PC;
  const aimedView = (item) => h("li", { class: "pc-aim" },
    h("h3", {}, item.name),
    h("p", { class: "pc-aim-ask" }, h("span", { class: "pc-small" }, "Asks"), item.ask),
    h("p", { class: "pc-aim-to" }, h("span", { class: "pc-small" }, "It goes to"), item.aim),
    h("p", { class: "pc-aim-ref" }, refLink(item.r, item.span)));
  page.append(h("section", { class: "t-sec pc-aimed", id: "aimed" },
    sectionHead("03", "A road, a door, a quiet life.", "Even these go somewhere.", runs(study.aimedLead)),
    h("ol", { class: "pc-aims" }, aimed.map(aimedView)),
    h("p", { class: "pc-reads" }, runs(study.aimedReads)),
    h("div", { class: "pc-flag pc-flag-care" }, h("p", { class: "pc-flag-label" }, "Care"), h("p", {}, runs(study.aimedCare)))));
  const olderView = (item) => h("li", { class: "pc-old" },
    h("p", { class: "pc-old-then" }, item.oldT, " ", refLink(item.oldR, item.oldLabel)),
    h("p", { class: "pc-old-how" }, item.how),
    h("p", { class: "pc-old-now" }, item.newT, " ", refLink(item.newR, item.newLabel)));
  page.append(h("section", { class: "t-sec pc-older", id: "older" },
    sectionHead("04", "Older words,", "prayed again", runs(study.olderLead)),
    h("ol", { class: "pc-olds" }, older.map(olderView)),
    h("p", { class: "pc-reads" }, runs(study.olderReads))));
})();
