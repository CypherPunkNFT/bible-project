// Section 05. Three more prayers, unbroken. Opening the answer shows the same passage broken into lines.
(() => {
  if (!window.PCK) return;
  const { h, page, sectionHead, runs, refLink, passageText } = PCK;
  const { study, leaves, tryLeaves } = window.PC;
  const tryView = (label) => {
    const leaf = leaves[label];
    return h("li", { class: "pc-try" },
      h("h3", {}, refLink(leaf.r, leaf.label)),
      passageText(leaf.r),
      h("details", {}, h("summary", {}, "Compare with how this study sets it out"), PCK.leafLines(leaf),
        h("p", { class: "pc-note" }, h("b", {}, "What gives confidence: "), runs(leaf.sure))));
  };
  page.append(h("section", { class: "t-sec pc-tryit", id: "try" },
    sectionHead("05", "Three more prayers.", "Follow them yourself.", runs(study.tryLead)),
    h("ol", { class: "pc-tries" }, tryLeaves.map(tryView)),
    h("p", { class: "pc-reads" }, runs(study.tryReads))));
})();
