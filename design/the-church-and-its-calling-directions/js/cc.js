// The close, and starting the page.
(() => {
  if (!window.CCK) return;
  const { h, art, refLink, runs, page } = CCK;
  const { study, passages, sources } = window.CC;
  const sourceName = (source) => h("a", { href: source.href, rel: "noopener noreferrer", target: source.href.startsWith("https://") ? "_blank" : null }, source.name);
  const mockup = (slug, label) => h("a", { href: `/mockups/${slug}-directions/` }, label);
  page.append(h("section", { class: "t-sec cc-closing", id: "close" },
    h("div", { class: "cc-close-text" },
      h("p", { class: "cc-concepts" }, study.closing),
      h("p", {}, runs(study.close)),
      h("p", { class: "cc-way" }, runs(study.way)),
      h("p", {}, runs(study.invite)),
      h("p", { class: "cc-question" }, runs(study.question)),
      h("p", { class: "cc-again" }, runs(study.again), " ", refLink(study.passage, passages[study.passage].label)),
      h("nav", { class: "cc-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=doctrine" }, "← Back to God & Christian Faith"),
        mockup("covenants-and-promises", "Covenants and promises"), mockup("the-hope-to-come", "The hope to come"), mockup("bearing-witness", "Bearing witness"), mockup("prayer-in-the-letters", "Prayer in the letters")),
      h("p", { class: "cc-note" }, "Named on this page and not yet built: a study of the Holy Spirit.")),
    art(CCArt.foot, "cc-land"),
    h("details", { class: "cc-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, sourceName(source), " ", h("span", {}, source.note)))),
      h("p", { class: "cc-note" }, "Every Scripture reference and every quotation from the held commentaries and confessions was checked by script: that proves the words are there, not that a reading is right. The Baptist Faith and Message phrases were compared once, by script, against that printable text on 2026-10-30; the file is not kept here, so the page's own build does not repeat that compare."))));
  CCK.startSheet();
  window.CC_READY = true;
})();
