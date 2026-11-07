// The close, and starting the page.
(() => {
  if (!window.BWK) return;
  const { h, art, refLink, runs, page, passageText } = BWK;
  const { study, passages, sources } = window.BW;
  const close = study.close;
  const sourceName = (source) => (source.href ? h("a", { href: source.href, rel: "noopener noreferrer", target: source.href.startsWith("https://") ? "_blank" : null }, source.name) : h("b", {}, source.name));
  page.append(h("section", { class: "t-sec bw-closing", id: "close" },
    h("div", { class: "bw-close-text" },
      h("p", { class: "bw-concepts" }, "Whose part is whose"),
      h("p", { class: "bw-way" }, runs(close.way)),
      h("p", {}, runs(close.invite)),
      h("p", { class: "bw-question" }, runs(close.question)),
      h("p", { class: "bw-again" }, runs(close.again), " ", refLink(close.passage, passages[close.passage].label)),
      h("nav", { class: "bw-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=life" }, "← Back to Living the Christian Life"))),
    h("aside", { class: "bw-passage-again", "aria-label": passages[close.passage].label },
      h("p", { class: "bw-small" }, refLink(close.passage, passages[close.passage].label), " · Berean Standard Bible"),
      passageText(close.passage)),
    art(BWArt.foot, "bw-land"),
    h("details", { class: "bw-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, sourceName(source), " ", h("span", {}, source.note)))),
      h("p", { class: "bw-note" }, "Every Scripture quotation and reference, and the Baptist Faith and Message quotations, were checked by script. That proves the words are there, not that a reading is right or a phrase rightly sorted. A gold diamond marks a note the study still has to check; point at it to see what it is."))));
  BWK.startSheet();
  window.BW_READY = true;
})();
