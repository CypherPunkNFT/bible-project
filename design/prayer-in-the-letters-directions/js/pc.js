// The close, and starting the page.
(() => {
  if (!window.PCK) return;
  const { h, art, refLink, runs, page } = PCK;
  const { study, passages, sources } = window.PC;
  const sourceName = (source) => (source.href ? h("a", { href: source.href, rel: "noopener noreferrer", target: source.href.startsWith("https://") ? "_blank" : null }, source.name) : h("b", {}, source.name));
  const mockup = (slug, label) => h("a", { href: `/mockups/${slug}-directions/` }, label);
  page.append(h("section", { class: "t-sec pc-closing", id: "close" },
    h("div", { class: "pc-close-text" },
      h("p", { class: "pc-concepts" }, study.closing),
      h("p", {}, runs(study.close)),
      h("p", { class: "pc-way" }, runs(study.way)),
      h("p", {}, runs(study.invite)),
      h("p", { class: "pc-question" }, runs(study.question)),
      h("p", { class: "pc-again" }, runs(study.again), " ", refLink(study.passage, passages[study.passage].label)),
      h("nav", { class: "pc-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=life" }, "← Back to Living the Christian Life"),
        mockup("faith-under-pressure", "Previous: Faith under pressure"), mockup("faith-in-daily-life", "Next: Faith in daily life"), mockup("bearing-witness", "Bearing witness")),
      h("p", { class: "pc-note" }, "Named in the plans and not yet built: Learning to discern, Growing in maturity, The Holy Spirit, Praying the Psalms.")),
    art(PCArt.foot, "pc-land"),
    h("details", { class: "pc-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, sourceName(source), " ", h("span", {}, source.note)))),
      h("p", { class: "pc-note" }, "Scripture references and the quotations from Calvin, Barnes, Jamieson-Fausset-Brown, Boyce, Wesley, Trent and the Second London Confession were checked by script: that proves the words are there, not that a reading is right. The Baptist Faith and Message phrases are not all in a file the script reads, as the entry above says."))));
  PCK.startSheet();
  window.PC_READY = true;
})();
