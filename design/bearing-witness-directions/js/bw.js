// The close, and starting the page.
(() => {
  if (!window.BWK) return;
  const { h, art, refLink, runs, page } = BWK;
  const { study, passages, sources } = window.BW;
  const sourceName = (source) => (source.href ? h("a", { href: source.href, rel: "noopener noreferrer", target: source.href.startsWith("https://") ? "_blank" : null }, source.name) : h("b", {}, source.name));
  page.append(h("section", { class: "t-sec bw-closing", id: "close" },
    h("div", { class: "bw-close-text" },
      h("p", { class: "bw-concepts" }, study.closing),
      h("p", {}, runs(study.close)),
      h("p", { class: "bw-way" }, runs(study.way)),
      h("p", {}, runs(study.invite)),
      h("p", { class: "bw-question" }, runs(study.question)),
      h("p", { class: "bw-again" }, runs(study.again), " ", refLink(study.passage, passages[study.passage].label)),
      h("nav", { class: "bw-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=life" }, "← Back to Living the Christian Life"))),
    art(BWArt.foot, "bw-land"),
    h("details", { class: "bw-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, sourceName(source), " ", h("span", {}, source.note)))),
      h("p", { class: "bw-note" }, "Scripture references and the Calvin, Jamieson-Fausset-Brown and two confession quotations were checked by script: that proves the words are there, not that a reading is right or a phrase rightly sorted. The Baptist Faith and Message phrases are not all in a file the script reads, as the entry above says."))));
  BWK.startSheet();
  window.BW_READY = true;
})();
