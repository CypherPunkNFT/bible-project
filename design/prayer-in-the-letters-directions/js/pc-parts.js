// The six parts, each built once and only shown or hidden, so links survive the sheet and Back. Each letter passage is whole,
// broken into lines that step in at each so that. pc-spine.js places the parts beside the prayer and chooses between them.
(() => {
  if (!window.PCK) return;
  const { h, refLink, runs, plain, partView } = PCK;
  const { study, leaves, kinds } = window.PC;

  const lineView = (line) => h("p", { class: `pc-line pc-l${line.l}${line.k ? ` pc-k-${line.k}` : ""}` },
    line.k ? h("span", { class: "pc-line-kind" }, kinds[line.k]) : null,
    h("span", { class: "pc-line-text" }, line.runs.map((run) => (typeof run === "string" ? `${run} ` : h("sup", {}, String(run.v))))));
  const notes = (leaf) => h("dl", { class: "pc-margin" },
    h("div", {}, h("dt", {}, "For whom"), h("dd", {}, runs(leaf.who))),
    h("div", {}, h("dt", {}, "What gives confidence"), h("dd", {}, runs(leaf.sure))),
    leaf.note ? h("div", {}, h("dt", {}, "Not here"), h("dd", {}, runs(leaf.note))) : null);
  const leafView = (label) => {
    const leaf = leaves[label];
    return h("article", { class: "pc-leaf" },
      h("header", { class: "pc-leaf-head" }, h("p", { class: "pc-small" }, leaf.role), h("h4", {}, refLink(leaf.r, leaf.label))),
      h("div", { class: "pc-leaf-body" }, h("div", { class: "pc-leaf-lines" }, leaf.lines.map(lineView)), notes(leaf)));
  };
  const joined = (items) => items.map((item, index) => [index ? " · " : "", refLink(item.r, item.label)]);

  const panelFor = (part) => {
    const head = h("h3", { tabindex: "-1" }, h("span", { class: "pc-part-n" }, `Part ${part.n}`), plain(part.title));
    const [first, ...rest] = part.leaves;
    const view = h("div", { class: "pc-reading", id: `part-${part.n}`, role: "group", "aria-label": plain(part.title), hidden: true },
      head,
      h("p", { class: "pc-hook" }, runs(part.hook)),
      h("p", { class: "pc-readings-line" }, h("span", { class: "pc-small" }, "Main readings"), " ", joined(part.readings)),
      first ? h("p", { class: "pc-small pc-leaf-lead" }, "Keep it whole · each line steps in at its so that") : null,
      first ? leafView(first) : null,
      rest.map((label) => h("details", { class: "pc-more" }, h("summary", {}, `Then read ${label} whole`), leafView(label))),
      h("div", { class: "pc-parts" }, part.sub.map(partView)),
      h("div", { class: "pc-after" },
        h("div", {}, h("p", { class: "pc-small" }, "Consider · what the passage says"), h("p", {}, runs(part.consider))),
        h("div", {}, h("p", { class: "pc-small" }, "Reflect · your response"), h("p", {}, runs(part.reflect)))));
    return { view, head };
  };
  PCK.panels = new Map(study.parts.map((part) => [part.n, panelFor(part)]));
})();
