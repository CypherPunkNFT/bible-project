// The close, and starting the page.
(() => {
  if (!window.RCK) return;
  const { h, art, refLink, runs, page } = RCK;
  const { study, passages, sources, related } = window.RC;
  const REQUIRED = ["drawRuler", "drawQuestion"];
  const missing = REQUIRED.filter((name) => typeof RCK[name] !== "function");
  if (missing.length) throw new Error(`Rulers and their choices: page parts missing: ${missing.join(", ")}`);
  const sourceName = (source) => h("a", { href: source.href, rel: "noopener noreferrer", target: source.href.startsWith("https://") ? "_blank" : null }, source.name);
  page.append(h("section", { class: "t-sec rc-closing", id: "close" },
    h("div", { class: "rc-close-text" },
      h("p", { class: "rc-concepts" }, study.closing),
      h("p", {}, runs(study.close)),
      h("p", { class: "rc-way" }, runs(study.way)),
      h("p", {}, runs(study.invite)),
      h("p", { class: "rc-question" }, runs(study.question)),
      h("p", { class: "rc-again" }, runs(study.again), " ", refLink(study.passage, passages[study.passage].label)),
      h("nav", { class: "rc-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=people" }, "← Back to People of Scripture"),
        related.map(([href, label]) => h("a", { href }, label)))),
    art(RCArt.foot, "rc-foot"),
    h("details", { class: "rc-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, sourceName(source), " ", h("span", {}, source.note)))),
      h("p", { class: "rc-note" }, "Every Scripture reference and every quotation from the held commentaries was checked by script, and each ruler's reign and verdict words against the verse: that proves the words are there, not that a later verse is about that ruler or that a reading is right. The Baptist Faith and Message phrases were compared once, by script, against that printable text on 2026-10-30; the file is not kept here, so the page's own build does not repeat that compare."))));
  RCK.startSheet();
  window.RC_READY = true;
})();
