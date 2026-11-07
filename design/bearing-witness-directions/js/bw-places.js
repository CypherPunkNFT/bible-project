// Section 03. Whose part is whose: the seven passages against the close's three questions, all at once. Each phrase opens
// its verse. An empty place says so. The study's own line for a passage is quoted under it; where it gives none, the page says so.
(() => {
  if (!window.BWK) return;
  const { h, refLink, page, sectionHead } = BWK;
  const { study, places, columns, placesRead, passages } = window.BW;
  const parts = new Map(study.parts.map((part) => [part.n, part]));
  const phrase = (item) => h("li", {}, h("a", { class: "bw-said", href: `?sheet=${item.r}`, "data-sheet": item.r, title: passages[item.r].label }, item.words));
  const cell = (row, [key, question]) => h("td", { class: `bw-place bw-place-${key}` },
    h("span", { class: "bw-cell-label" }, question),
    row[key].length ? h("ul", {}, row[key].map(phrase)) : h("p", { class: "bw-empty" }, "Not named in these verses"));
  const rowView = (row) => {
    const part = parts.get(row.part);
    return h("tbody", { id: `places-${row.part}` },
      h("tr", {},
        h("th", { scope: "row", class: "bw-place-name" },
          h("span", { class: "bw-index-n" }, row.part), " ", h("a", { href: `#part-${row.part}` }, part.title),
          h("span", { class: "bw-place-ref" }, refLink(part.readings[0], passages[part.readings[0]].label))),
        columns.map((column) => cell(row, column))),
      h("tr", { class: "bw-place-foot" },
        h("td", { colspan: "4" },
          row.other ? h("p", { class: "bw-other" }, h("span", { class: "bw-small" }, row.other.label), " “",
            h("a", { class: "bw-said", href: `?sheet=${row.other.r}`, "data-sheet": row.other.r }, row.other.words), "”. The study: “", row.other.study, "” It is none of the three places.") : null,
          row.study
            ? h("p", { class: "bw-study-line" }, h("span", { class: "bw-small" }, "The study’s own line"), ` “${row.study}”`)
            : h("p", { class: "bw-study-line" }, h("span", { class: "bw-small" }, "The study’s own line"), " The study gives none for this passage. The sort above is this page’s only."))));
  };
  page.append(h("section", { class: "t-sec bw-places-sec", id: "places" },
    sectionHead("03", "Whose part is whose?", "Seven passages, three places",
      "The close of the study asks three questions of any passage about witness. Here they are asked of all seven at once."),
    h("table", { class: "bw-places" },
      h("caption", { class: "bw-hidden" }, "The seven passages sorted by the study’s three questions"),
      h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Passage"), columns.map(([key, question]) => h("th", { scope: "col", class: `bw-place-${key}` }, question)))),
      places.map(rowView)),
    h("p", { class: "bw-note" }, placesRead)));
})();
