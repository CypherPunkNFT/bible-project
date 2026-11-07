// Section 02. Eight more places across the same fold. Pointing or focus shows the verses on a line beneath; choosing opens them on the sheet.
(() => {
  if (!window.NCK) return;
  const { h, runs, page, sectionHead, roving, foldCross } = NCK;
  const { study, more, passages } = window.NC;
  const reading = h("p", { class: "nc-readline", "aria-live": "polite" });
  const prompt = () => reading.replaceChildren("Point at a line, or move to it with the keyboard, to read its verses here.");
  const showVerses = (fold) => reading.replaceChildren(h("b", {}, `${fold.span}. `), passages[fold.r].verses.map((v) => `${v.t} `).join(""));
  const buttons = more.map((fold) => h("button", {
    type: "button", class: "nc-fold nc-fold-small", "data-sheet": fold.r,
    onpointerenter: () => showVerses(fold), onpointerleave: prompt, onfocus: () => showVerses(fold), onblur: prompt,
  }, h("span", { class: "nc-cross" }, foldCross(fold)), h("span", { class: "nc-fold-ref" }, fold.join ? fold.span : `${fold.span} · no joining word`)));
  prompt();
  roving(buttons);
  page.append(h("section", { class: "t-sec nc-more", id: "more" },
    sectionHead("02", "Eight more.", "The same fold.", runs(study.moreLead)),
    h("ol", { class: "nc-folds nc-folds-small" }, buttons.map((button) => h("li", {}, button))),
    reading,
    h("p", { class: "nc-reads" }, runs(study.moreReads))));
})();
