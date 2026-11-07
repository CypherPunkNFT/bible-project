// Section 02. The seven passages, all of them, in the study's order, with an index above them. Part 01 carries the
// rings of Acts 1:8 after that verse; part 02 points back to the chain. Each part ends with its limits, then Consider and Reflect.
(() => {
  if (!window.BWK) return;
  const { h, art, refLink, runs, page, sectionHead, blockView } = BWK;
  const { study, passages, rings, chainRange } = window.BW;
  const refList = (keys) => keys.flatMap((key, index) => [index ? " · " : "", refLink(key, passages[key].label)]);

  const ringsView = () => h("figure", { class: "bw-rings" },
    art(BWArt.rings, "bw-rings-art"),
    h("figcaption", {},
      h("ol", { class: "bw-rings-list" }, rings.rings.map((ring, index) => h("li", { class: `bw-ring-label bw-ring-label-${index + 1}` },
        h("b", {}, ring.label), " ", h("span", {}, `“${ring.words}”`)))),
      h("p", { class: "bw-note" }, "The three places of ", refLink(rings.r, passages[rings.r].label), ", in the verse’s order. The rings draw the verse’s map. They do not rank people by how far away they are.")));
  const chainPointer = () => h("p", { class: "bw-pointer" }, "The five links of this question are drawn in ", h("a", { href: "#chain" }, "section 01"), ".");
  const extraAfter = (part, block) => {
    if (block.k !== "quote") return null;
    if (block.r === rings.r) return ringsView();
    if (block.r === chainRange) return chainPointer();
    return null;
  };

  const partView = (part) => h("article", { class: "bw-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
    h("header", { class: "bw-part-head" },
      h("p", { class: "bw-part-n", "aria-hidden": "true" }, part.n),
      h("div", {},
        h("h3", { id: `part-${part.n}-title` }, part.title),
        h("p", { class: "bw-part-reads" }, h("b", {}, "Main reading"), " ", refList(part.readings)),
        part.also.length ? h("p", { class: "bw-part-reads" }, h("b", {}, "Also quoted"), " ", refList(part.also)) : null)),
    h("div", { class: "bw-part-body" },
      part.blocks.map((block) => [blockView(block), extraAfter(part, block)]),
      h("div", { class: "bw-after" },
        h("div", {}, h("p", { class: "bw-small" }, "Consider"), h("p", {}, runs(part.consider))),
        h("div", {}, h("p", { class: "bw-small" }, "Reflect"), h("p", {}, runs(part.reflect)))),
      h("p", { class: "bw-pointer" }, h("a", { href: `#places-${part.n}` }, `This passage sorted by whose part is whose, in section 03 →`))));

  page.append(h("section", { class: "t-sec bw-parts-sec", id: "passages" },
    sectionHead("02", "Seven passages,", "read in order",
      "Why, what, to whom, by what means, at what cost and in what manner: each passage was chosen for a different question about telling others. All seven follow, in the study’s order."),
    h("nav", { "aria-label": "The seven passages" },
      h("ol", { class: "bw-index" }, study.parts.map((part) => h("li", {},
        h("a", { href: `#part-${part.n}` }, h("span", { class: "bw-index-n" }, part.n), h("span", { class: "bw-index-title" }, part.title),
          h("span", { class: "bw-index-ref" }, passages[part.readings[0]].label)))))),
    study.parts.map(partView)));
})();
