// Section 03. Ten baptisms down one line of water: what the passage names first on the left, the baptism on the right. Written text in a list, read in Acts' order.
(() => {
  if (!window.CCK) return;
  const { h, refLink, page, sectionHead, runs } = CCK;
  const { study, water, waterOther } = window.CC;
  const side = (kind, label, item) => h("div", { class: `cc-side cc-side-${kind}` },
    h("p", { class: "cc-small" }, label),
    h("p", { class: "cc-words" }, "“", item.t, "”"),
    h("p", { class: "cc-side-ref" }, refLink(item.r, item.label)));
  const row = (item) => h("li", { class: `cc-bap${item.open ? " is-open" : ""}` },
    h("h3", {}, item.who),
    side("before", "Named first", item.before),
    h("span", { class: "cc-drop", "aria-hidden": "true" }),
    side("water", "The water", item.water),
    item.open ? h("p", { class: "cc-bap-open" }, h("b", {}, "Left open. "), item.open) : null);
  page.append(h("section", { class: "t-sec cc-water", id: "water" },
    sectionHead("03", "Ten baptisms,", "read down the water", runs(study.waterLead)),
    h("ol", { class: "cc-baps" }, water.map(row)),
    h("p", { class: "cc-reads" }, runs(study.waterReads)),
    h("div", { class: "cc-flag cc-flag-care" }, h("p", { class: "cc-flag-label" }, "Care"), h("p", {}, runs(study.waterCare))),
    h("details", { class: "cc-others" },
      h("summary", {}, `The other ${waterOther.length} verses in Acts that use the word`),
      h("p", {}, "Commands, John's baptism, retellings, and talk around a baptism already shown above. They are not counted among the ten."),
      h("ul", { class: "cc-refs" }, waterOther.map((link) => h("li", {}, refLink(link.r, link.t)))))));
})();
