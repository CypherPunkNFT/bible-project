// The close, and starting the page.
(() => {
  if (!window.SSK) return;
  const { h, art, refLink, runs, page } = SSK;
  const { study, passages, sources } = window.SS;
  page.append(h("section", { class: "t-sec ss-closing", id: "close" },
    h("div", { class: "ss-close-text" },
      h("p", { class: "ss-concepts" }, study.closing),
      h("p", {}, runs(study.close)),
      h("p", { class: "ss-way" }, runs(study.way)),
      h("p", {}, runs(study.invite)),
      h("p", { class: "ss-question" }, runs(study.question)),
      h("p", { class: "ss-again" }, runs(study.again), " ", refLink(study.passage, passages[study.passage].label)),
      h("nav", { class: "ss-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=books" }, "← Back to Explore the Bible"),
        h("a", { href: "/study/structure" }, "The shape of the Bible, its charts →"),
        h("a", { href: "/study/references" }, "Connections in Scripture →"),
        h("a", { href: "/study/letters" }, "Letters →"))),
    art(SSArt.river, "ss-land"),
    h("details", { class: "ss-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, h("a", { href: source.href, rel: "noopener noreferrer", target: "_blank" }, source.name), " ", h("span", {}, source.note)))),
      h("p", { class: "ss-note" }, "Scripture references and the Maclaren, Calvin, Henry, Jamieson-Fausset-Brown and Second London quotations were checked by script: that proves the words are there, not that the reading is right. One Baptist Faith and Message phrase, from Article 1, is not held and was not checked by script."))));
  SSK.startSheet();
  window.SS_READY = true;
})();
