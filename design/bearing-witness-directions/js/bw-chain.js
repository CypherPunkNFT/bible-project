// Section 01, the page's main figure: the chain of Romans 10:14-15 in Paul's order, five links read backward from calling
// on the Lord to being sent. Each link says whose part it is only where the study says so, in the study's words.
(() => {
  if (!window.BWK) return;
  const { h, art, refLink, page, sectionHead } = BWK;
  const { chain, chainEnd, chainRange, passages } = window.BW;
  const WHOSE = { god: "God", speaks: "The one who speaks", hears: "The one who hears" };
  const linkView = (link, index) => h("li", { class: `bw-chain-link bw-whose-${link.whose ?? "none"}` },
    h("p", { class: "bw-chain-n" }, `Link ${index + 1}`),
    h("p", { class: "bw-chain-word" }, link.word),
    h("p", { class: "bw-chain-words" }, "“", h("a", { class: "bw-said", href: `?sheet=${link.r}`, "data-sheet": link.r }, link.words), "”"),
    h("p", { class: "bw-chain-whose" }, link.whose ? WHOSE[link.whose] : "Not given to anyone"),
    link.study ? h("p", { class: "bw-chain-study" }, h("span", { class: "bw-small" }, "The study"), ` “${link.study}”`) : null,
    link.note ? h("p", { class: "bw-chain-note" }, link.note) : null);
  page.append(h("section", { class: "t-sec bw-chain-sec", id: "chain" },
    sectionHead("01", "How will they hear?", "The chain of sending",
      "Paul asks four questions and ends with being sent. He reads the chain backward, from calling on the Lord to being sent. Taken from the last link back to the first, it is the order in which it happens. Choose any words to read the verse."),
    h("div", { class: "bw-chain-figure" },
      art(BWArt.chainRow, "bw-chain-art"),
      h("ol", { class: "bw-chain" }, chain.map(linkView))),
    h("p", { class: "bw-reads" }, "Then Paul sums it up: “", h("a", { class: "bw-said", href: `?sheet=${chainEnd.r}`, "data-sheet": chainEnd.r }, chainEnd.words), "” (", refLink(chainEnd.r, passages[chainEnd.r].label), ")."),
    h("p", { class: "bw-note" }, "Whose part each link is comes from the study’s own words, quoted beside it. Where the study gives a link to no one, the page leaves it so. The whole paragraph, ",
      refLink(chainRange, passages[chainRange].label), ", is read in ", h("a", { href: "#part-02" }, "part 02"), " below.")));
})();
