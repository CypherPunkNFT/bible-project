// The small figures that sit inside a reading: four Beholds (In Christ), Colossians' two rails (The old and the new), Ephesians' four lines (Words).
(() => {
  if (!window.NCK) return;
  const { h, refLink, runs } = NCK;
  const { study, beholds, rails, lines } = window.NC;

  const beholdFigure = () => h("figure", { class: "nc-beholds" },
    h("figcaption", {}, runs(study.beholdLead)),
    h("ol", {}, beholds.map((item) => h("li", {},
      h("span", { class: "nc-tense" }, item.tense),
      h("p", {}, item.words),
      refLink(item.r, item.label)))),
    h("p", { class: "nc-note" }, runs(study.beholdReads)));

  const railGroup = (group) => h("li", {},
    h("ul", { class: "nc-hung" }, group.words.map((word) => h("li", {}, word))),
    refLink(group.r, group.label));
  const railsFigure = () => h("figure", { class: "nc-rails" },
    h("figcaption", {}, runs(study.railsReads)),
    h("div", { class: "nc-rail-set" },
      h("div", { class: "nc-rail nc-rail-off" }, h("p", { class: "nc-small" }, "Put to death, put aside"), h("ol", {}, rails.off.map(railGroup))),
      h("div", { class: "nc-rail nc-rail-on" },
        h("p", { class: "nc-over" }, rails.over.words, " ", refLink(rails.over.r, rails.over.label)),
        h("p", { class: "nc-small" }, "Clothe yourselves"), h("ol", {}, rails.on.map(railGroup)))));

  const linesFigure = () => h("figure", { class: "nc-lines" },
    h("figcaption", {}, runs(study.linesLead)),
    h("table", {},
      h("thead", {}, h("tr", {}, ["Stop", "Instead", "Why", "Verse"].map((label) => h("th", { scope: "col" }, label)))),
      h("tbody", {}, lines.map((line) => h("tr", {},
        h("td", { "data-label": "Stop", class: "nc-stop" }, line.stop),
        h("td", { "data-label": "Instead" }, line.instead),
        h("td", { "data-label": "Why", class: "nc-why" }, line.because),
        h("td", { "data-label": "Verse" }, refLink(line.r, line.label)))))));

  NCK.readingFigure = { "in-christ": beholdFigure, "old-and-new": railsFigure, words: linesFigure };
})();
