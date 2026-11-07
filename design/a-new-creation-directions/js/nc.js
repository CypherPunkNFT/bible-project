// The close, and starting the page.
(() => {
  if (!window.NCK) return;
  const { h, art, refLink, runs, page } = NCK;
  const { study, passages, sources } = window.NC;
  const sourceName = (source) => (source.href ? h("a", { href: source.href, rel: "noopener noreferrer", target: source.href.startsWith("https://") ? "_blank" : null }, source.name) : h("b", {}, source.name));
  const mockup = (slug, label) => h("a", { href: `/mockups/${slug}-directions/` }, label);
  page.append(h("section", { class: "t-sec nc-closing", id: "close" },
    h("div", { class: "nc-close-text" },
      h("p", { class: "nc-concepts" }, study.closing),
      h("p", {}, runs(study.close)),
      h("p", { class: "nc-way" }, runs(study.way)),
      h("p", {}, runs(study.invite)),
      h("p", { class: "nc-question" }, runs(study.question)),
      h("p", { class: "nc-again" }, runs(study.again), " ", refLink(study.passage, passages[study.passage].label)),
      h("nav", { class: "nc-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=life" }, "← Back to Living the Christian Life"),
        mockup("faith-in-daily-life", "Faith in daily life"), mockup("faith-under-pressure", "Faith under pressure"), mockup("the-hope-to-come", "The hope to come")),
      h("p", { class: "nc-note" }, "Next in this field, with no page yet: Life together. Also named on this page and not yet built: Returning and restoring, Growing in maturity, Grace, faith and salvation.")),
    art(NCArt.foot, "nc-land"),
    h("details", { class: "nc-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, sourceName(source), " ", h("span", {}, source.note)))),
      h("p", { class: "nc-note" }, "Scripture references and the quotations from Calvin, Wesley, Boyce, Jamieson-Fausset-Brown and the held confessions were checked by script: that proves the words are there, not that a reading is right or a pairing is right. The Baptist Faith and Message phrases are not all in a file the script reads, as the entry above says."))));
  NCK.startSheet();
  window.NC_READY = true;
})();
