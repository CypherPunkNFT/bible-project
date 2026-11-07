// The close, and starting the page.
(() => {
  if (!window.PTK) return;
  const { h, art, refLink, runs, page } = PTK;
  const { study, passages, sources } = window.PT;
  const sourceName = (source) => (source.href ? h("a", { href: source.href, rel: "noopener noreferrer", target: source.href.startsWith("https://") ? "_blank" : null }, source.name) : h("b", {}, source.name));
  page.append(h("section", { class: "t-sec pt-closing", id: "close" },
    h("div", { class: "pt-close-text" },
      h("p", { class: "pt-concepts" }, study.closing),
      h("p", {}, runs(study.close)),
      h("p", { class: "pt-way" }, runs(study.way)),
      h("p", {}, runs(study.invite)),
      h("p", { class: "pt-question" }, runs(study.question)),
      h("p", { class: "pt-again" }, runs(study.again), " ", refLink(study.passage, passages[study.passage].label)),
      h("nav", { class: "pt-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=people" }, "← Back to People of Scripture"),
        h("a", { href: "/study/prophets" }, "The prophets timeline →"))),
    art(PTArt.foot, "pt-land"),
    h("details", { class: "pt-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, sourceName(source), " ", h("span", {}, source.note)))),
      h("p", { class: "pt-note" }, "Scripture references and the Calvin and Fausset quotations were checked by script: that proves the words are there, not that the reading is right. It does not prove that a silence is real, or that a man of the same name is another man. The Baptist Faith and Message phrases were not all held here, as the entry above says."))));
  PTK.startSheet();
  window.PT_READY = true;
})();
