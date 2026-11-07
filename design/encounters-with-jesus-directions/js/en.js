// The close, and starting the page.
(() => {
  if (!window.ENK) return;
  const { h, art, refLink, runs, page } = ENK;
  const { study, passages, sources, related } = window.EN;
  const REQUIRED = ["drawMeeting", "drawQuestion", "showReading"];
  const missing = REQUIRED.filter((name) => typeof ENK[name] !== "function");
  if (missing.length) throw new Error(`Encounters with Jesus: page parts missing: ${missing.join(", ")}`);
  const sourceName = (source) => h("a", { href: source.href, rel: "noopener noreferrer", target: "_blank" }, source.name);
  page.append(h("section", { class: "t-sec en-closing", id: "close" },
    h("div", { class: "en-close-text" },
      h("p", { class: "en-concepts" }, study.closing),
      h("p", {}, runs(study.close)),
      h("p", { class: "en-way" }, runs(study.way)),
      h("p", {}, runs(study.invite)),
      h("p", { class: "en-question" }, runs(study.question)),
      h("p", { class: "en-again" }, runs(study.again), " ", refLink(study.passage, passages[study.passage].label)),
      h("nav", { class: "en-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=jesus" }, "← Back to Jesus Christ"),
        related.map(([href, label]) => h("a", { href }, label)))),
    art(ENArt.foot, "en-land"),
    h("details", { class: "en-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, sourceName(source), " ", h("span", {}, source.note)))),
      h("p", { class: "en-note" }, "Every Scripture reference and every quotation from the held commentaries was checked by script: that proves the words are there, not that a meeting sits in the right cell or that a reading is right. The Baptist Faith and Message phrases were compared once, by script, against the text on that page on 2026-10-30; the page is not kept here, so this page's own build does not repeat that compare."))));
  ENK.startSheet();
  window.EN_READY = true;
})();
