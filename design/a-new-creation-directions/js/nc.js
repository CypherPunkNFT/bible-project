// The close, and starting the page. The close's own list of what God has done is drawn across the fold one last time.
(() => {
  if (!window.NCK) return;
  const { h, art, refLink, runs, page } = NCK;
  const { study, passages, sources } = window.NC;
  const { close } = study;
  const sourceName = (source) => h("a", { href: source.href, rel: "noopener noreferrer", target: source.href.startsWith("https://") ? "_blank" : null }, source.name);
  const mockup = (slug, label) => h("a", { href: `../${slug}-directions/` }, label);
  const pair = (item) => h("li", { class: "nc-pair" },
    h("span", { class: "nc-cross" },
      h("span", { class: "nc-done" }, item.done),
      h("span", { class: "nc-crease" }, h("em", {}, "so")),
      h("span", { class: "nc-now" }, item.now)),
    h("span", { class: "nc-fold-ref" }, refLink(item.r, item.label)));
  page.append(h("section", { class: "t-sec nc-closing", id: "close" },
    h("div", { class: "nc-close-text" },
      h("p", { class: "nc-concepts" }, close.title),
      h("p", {}, runs(close.intro)),
      h("ol", { class: "nc-folds nc-folds-small nc-pairs" }, close.pairs.map(pair)),
      h("p", { class: "nc-way" }, runs(close.way)),
      h("p", {}, runs(close.invite)),
      h("p", { class: "nc-question" }, runs(close.question)),
      h("p", { class: "nc-again" }, runs(close.again), " ", refLink(close.passage, passages[close.passage].label)),
      h("nav", { class: "nc-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=life" }, "← Back to Living the Christian Life"),
        mockup("faith-in-daily-life", "Faith in daily life"), mockup("life-together", "Life together"), mockup("the-hope-to-come", "The hope to come"))),
    art(NCArt.foot, "nc-land"),
    h("details", { class: "nc-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, sourceName(source), " ", h("span", {}, source.note)))),
      h("p", { class: "nc-note" }, "Scripture references and the quotations from the Baptist Faith and Message, the Second London Confession and Luther’s Small Catechism were checked by script. That proves the words are there, not that a reading is right or a pairing is right. What Calvin and Wesley are said to have written is marked to check where it stands."))));
  NCK.startSheet();
  window.NC_READY = true;
})();
