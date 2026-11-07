// Section 04. Three commands. The reader looks back first; the answer stays closed until asked for.
(() => {
  if (!window.NCK) return;
  const { h, refLink, runs, page, sectionHead } = NCK;
  const { study, back } = window.NC;
  const commandView = (item) => h("li", { class: "nc-back-item" },
    h("p", { class: "nc-back-command" }, `“${item.command}”`, " ", refLink(item.commandR, item.commandLabel)),
    h("details", {},
      h("summary", {}, "Look back"),
      h("p", { class: "nc-back-done" }, `“${item.done}”`, " ", refLink(item.doneR, item.doneLabel)),
      h("p", { class: "nc-note" }, item.said, " Read it all: ", refLink(item.r, item.span))));
  page.append(h("section", { class: "t-sec nc-look", id: "look-back" },
    sectionHead("04", "A command.", "Now look back.", runs(study.backLead)),
    h("ol", { class: "nc-back-list" }, back.map(commandView))));
})();
