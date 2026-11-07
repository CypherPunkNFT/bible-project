// The close, and starting the page.
(() => {
  if (!window.SWK) return;
  const { h, art, refLink, runs, page } = SWK;
  const { study, passages, sources, related } = window.SW;
  const REQUIRED = ["drawAccount", "drawQuestion", "FORMS"];
  const missing = REQUIRED.filter((name) => !SWK[name]);
  if (missing.length) throw new Error(`The signs and works of Jesus: page parts missing: ${missing.join(", ")}`);
  const sourceName = (source) => h("a", { href: source.href, rel: "noopener noreferrer", target: "_blank" }, source.name);
  page.append(h("section", { class: "t-sec sw-closing", id: "close" },
    h("div", { class: "sw-close-text" },
      h("p", { class: "sw-concepts" }, study.closing),
      h("p", {}, runs(study.close)),
      h("p", { class: "sw-way" }, runs(study.way)),
      h("p", {}, runs(study.invite)),
      h("p", { class: "sw-question" }, runs(study.question)),
      h("p", { class: "sw-again" }, runs(study.again), " ", refLink(study.passage, passages[study.passage].label)),
      h("nav", { class: "sw-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=jesus" }, "← Back to Jesus Christ"),
        related.map(([href, label]) => h("a", { href }, label)))),
    art(SWArt.foot, "sw-land"),
    h("details", { class: "sw-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, sourceName(source), " ", h("span", {}, source.note)))),
      h("p", { class: "sw-note" }, "Every Scripture reference and every quotation from the held commentaries was checked by script: that proves the words are there, not that a verse is sorted rightly or that a reading is right. The Baptist Faith and Message phrases were compared on 2026-10-30 against what a web tool returned from that page, not by this page's build. Compare them by eye before release."))));
  SWK.startSheet();
  window.SW_READY = true;
})();
