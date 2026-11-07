// The close, and starting the page. The ruled line at the end is not a form: nothing can be typed in it and nothing is kept.
(() => {
  if (!window.WYK) return;
  const { h, art, refLink, runs, page } = WYK;
  const { study, passages, sources, related } = window.WY;
  const REQUIRED = ["drawQuestion", "formFor"];
  const missing = REQUIRED.filter((name) => !WYK[name]);
  if (missing.length) throw new Error(`Who do you say I am: page parts missing: ${missing.join(", ")}`);
  const sourceName = (source) => h("a", { href: source.href, rel: "noopener noreferrer", target: "_blank" }, source.name);
  page.append(h("section", { class: "t-sec wy-closing", id: "close" },
    h("div", { class: "wy-close-text" },
      h("p", { class: "wy-concepts" }, study.closing),
      h("p", {}, runs(study.close)),
      h("p", { class: "wy-way" }, runs(study.way)),
      h("p", {}, runs(study.invite)),
      h("p", { class: "wy-question" }, runs(study.question)),
      h("div", { class: "wy-close-blank", role: "img", "aria-label": "A blank line. Nothing is typed here and nothing is kept." }),
      h("p", { class: "wy-again" }, runs(study.again), " ", refLink(study.passage, passages[study.passage].label)),
      h("nav", { class: "wy-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=jesus" }, "← Back to Jesus Christ"),
        related.map(([href, label]) => h("a", { href }, label)))),
    art(WYArt.road, "wy-land"),
    h("details", { class: "wy-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, sourceName(source), " ", h("span", {}, source.note)))),
      h("p", { class: "wy-note" }, "Every Scripture reference and every quotation from the held commentaries was checked by script: that proves the words are there, and not that a speaker is sorted rightly or that a reading is right. The Baptist Faith and Message phrases were compared by hand through a web tool, and the original Greek was not consulted."))));
  WYK.startSheet();
  window.WY_READY = true;
})();
