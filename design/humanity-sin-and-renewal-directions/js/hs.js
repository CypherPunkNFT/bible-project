// The close, and starting the page.
(() => {
  if (!window.HSK) return;
  const { h, art, refLink, runs, page } = HSK;
  const { study, passages, sources } = window.HS;
  const sourceName = (source) => (source.href ? h("a", { href: source.href, rel: "noopener noreferrer", target: "_blank" }, source.name) : h("b", {}, source.name));
  page.append(h("section", { class: "t-sec hs-closing", id: "close" },
    h("div", { class: "hs-close-text" },
      h("p", { class: "hs-concepts" }, study.closing),
      h("p", {}, runs(study.close)),
      h("p", { class: "hs-way" }, runs(study.way)),
      h("p", {}, runs(study.invite)),
      h("p", { class: "hs-question" }, runs(study.question)),
      h("p", { class: "hs-again" }, runs(study.again), " ", refLink(study.passage, passages[study.passage].label)),
      h("nav", { class: "hs-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=doctrine" }, "← Back to God & Christian Faith"),
        h("a", { href: "/mockups/faith-in-daily-life-directions/" }, "Faith in daily life →"),
        h("a", { href: "/mockups/the-hope-to-come-directions/" }, "The hope to come →"))),
    art(HSArt.foot, "hs-land"),
    h("details", { class: "hs-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, sourceName(source), " ", h("span", {}, source.note)))),
      h("p", { class: "hs-note" }, "Scripture references and the Boyce, Calvin, Henry, Abstract of Principles, Second London, Westminster, Trent and Longer Catechism quotations were checked by script: that proves the words are there, not that the reading is right. Some Baptist Faith and Message phrases are not held here and were not checked by script."))));
  HSK.startSheet();
  window.HS_READY = true;
})();
