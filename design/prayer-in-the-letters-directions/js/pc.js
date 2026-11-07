// The close, and starting the page.
(() => {
  if (!window.PCK) return;
  const { h, refLink, runs, page } = PCK;
  const { study, passages, sources } = window.PC;
  const sourceName = (source) => (source.href ? h("a", { href: source.href }, source.name) : h("b", {}, source.name));
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
        mockup("faith-under-pressure", "Previous: Faith under pressure"), mockup("faith-in-daily-life", "Next: Faith in daily life"), mockup("praying-the-psalms", "The book of Psalms"))),
    h("details", { class: "pc-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, sourceName(source), " ", h("span", {}, source.note)))),
      h("p", { class: "pc-note" }, "Scripture references and the quotations from Calvin, Boyce, Wesley, Trent, the Second London Confession and the Baptist Faith and Message were checked by script against the copies this site holds: that proves the words are there, not that a reading is right. Where the study’s words differ from the held wording, or a fact is still to be checked, the page marks it in gold."))));
  PCK.startSheet();
  window.PC_READY = true;
})();
