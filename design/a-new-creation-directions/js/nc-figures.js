// The one figure that sits inside a part: Ephesians' four three-part lines, in the part named by linesPart.
(() => {
  if (!window.NCK) return;
  const { h, refLink, runs } = NCK;
  const { study, lines, linesPart } = window.NC;

  const linesFigure = () => h("figure", { class: "nc-lines" },
    h("figcaption", {}, runs(study.linesLead)),
    h("table", {},
      h("thead", {}, h("tr", {}, ["Stop", "Instead", "Why", "Verse"].map((label) => h("th", { scope: "col" }, label)))),
      h("tbody", {}, lines.map((line) => h("tr", {},
        h("td", { "data-label": "Stop", class: "nc-stop" }, line.stop),
        h("td", { "data-label": "Instead" }, line.instead),
        h("td", { "data-label": "Why", class: "nc-why" }, line.because),
        h("td", { "data-label": "Verse" }, refLink(line.r, line.label)))))));

  NCK.partFigure = { [linesPart]: linesFigure };
})();
