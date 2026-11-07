// The forms of the readings, drawn only from their own passages: three accounts side by side, the turn in steps, the council's record, the voice aligned,
// who says what of the Word made flesh, Thomas' mirror, and John's line.
(() => {
  if (!window.WYK) return;
  const { h, phrase, refLink, runs } = WYK;
  const forms = window.WY.forms;
  const said = (item) => h("span", { class: "wy-words" }, `“${item.t}”`);
  const at = (item) => h("span", { class: "wy-at" }, refLink(item.r, item.label));

  function three(form) {
    const rowCount = form.rows.length + 1;
    return h("div", { class: "wy-f wy-f-three", style: `--rows:${rowCount}` }, form.columns.map((column) => h("section", { class: "wy-three-col" },
      h("h5", {}, column.book),
      form.rows.map(([key, label]) => h("div", { class: `wy-three-row${key === form.same ? " is-same" : ""}` }, h("span", { class: "wy-small" }, label), h("span", {}, phrase(column[key])))))));
  }
  const stepItem = (step, extra) => h("li", { class: extra ?? "" }, h("span", { class: "wy-small" }, step.who), " ", said(step), " ", at(step));
  function steps(form) {
    const LIT = new Set(["Blessed are you, Simon son of Jonah!", "Get behind Me, Satan!"]);
    return h("ol", { class: "wy-f wy-f-steps" }, form.steps.map((step) => stepItem(step, `wy-who-${step.who.toLowerCase()}${LIT.has(step.t) ? " is-lit" : ""}`)));
  }
  function record(form) {
    return h("div", { class: "wy-f wy-f-record" },
      h("ol", { class: "wy-record-room" }, form.steps.map((step) => stepItem(step, step.who === "Jesus" ? "is-lit" : ""))),
      h("section", { class: "wy-record-names" }, h("h5", {}, form.witnessesTitle), h("ul", {}, form.witnesses.map((item) => stepItem(item)))));
  }
  function aligned(form) {
    const first = form.first.t.split(" "), second = form.second.t.split(" ");
    const cell = (word, kind) => h("span", { class: `wy-al-cell ${kind}` }, word);
    const columns = second.map((word, index) => h("span", { class: "wy-al-col" }, cell(first[index] ?? " ", first[index] ? "" : "is-none"), cell(word, first[index] ? "" : "is-added")));
    return h("div", { class: "wy-f wy-f-aligned" },
      h("div", { class: "wy-al-places wy-small" }, h("span", {}, form.firstPlace, " · ", at(form.first)), h("span", {}, form.secondPlace, " · ", at(form.second))),
      h("p", { class: "wy-visually" }, `${form.firstPlace}: ${form.first.t} ${form.secondPlace}: ${form.second.t}`),
      h("div", { class: "wy-al-grid", "aria-hidden": "true" }, columns),
      h("section", { class: "wy-al-others" }, h("h5", {}, "The same moments in the other accounts"), h("ul", {}, form.others.map((item) => h("li", {}, phrase(item))))));
  }
  function mirror(form) {
    return h("div", { class: "wy-f wy-f-mirror" },
      h("div", { class: "wy-mirror-head wy-small", "aria-hidden": "true" }, h("span", {}, form.leftTitle), h("span", {}, form.rightTitle)),
      form.rows.map(([left, right]) => h("div", { class: "wy-mirror-row" },
        h("p", {}, h("span", { class: "wy-visually" }, `${form.leftTitle}: `), phrase(left)),
        h("p", {}, h("span", { class: "wy-visually" }, `${form.rightTitle}: `), phrase(right)))),
      h("p", { class: "wy-mirror-result" }, phrase(form.result)),
      h("p", { class: "wy-mirror-note" }, form.note));
  }
  function line(form) {
    return h("ol", { class: "wy-f wy-f-line" },
      form.stops.map((stop) => stepItem(stop)),
      h("li", { class: "wy-line-you" }, h("span", { class: "wy-small" }, form.last), h("span", { class: "wy-line-blank", "aria-label": "Left blank", role: "img" })));
  }
  // One row for each speaker, each in their own verse. One word can be lit in gold. Nothing sorts the words into two sides; the church's later words sit
  // under a rule, marked as not Scripture, and the ledger ends on the text's own sentence about what these passages do not explain.
  function ledger(form) {
    const lit = (item, gold) => {
      if (!gold) return h("span", { class: "wy-words" }, `“${item.t}”`);
      const [before, after] = item.t.split(new RegExp(`\\b${gold}\\b`));
      return after === undefined ? h("span", { class: "wy-words" }, `“${item.t}”`) : h("span", { class: "wy-words" }, `“${before}`, h("span", { class: "wy-gold" }, gold), `${after}”`);
    };
    return h("div", { class: "wy-f wy-f-ledger" },
      h("ol", { class: "wy-ledger" }, form.rows.map((row) => h("li", {},
        h("span", { class: "wy-small" }, row.who),
        h("span", { class: "wy-ledger-said" }, row.said.map((item, index) => [index ? h("span", { class: "wy-ledger-then", "aria-label": "then" }, " → ") : "", lit(item, row.gold), " ", at(item)]))))),
      h("section", { class: "wy-ledger-church" }, h("h5", {}, form.churchTitle),
        h("ul", {}, form.church.map((item) => h("li", {}, h("span", { class: "wy-small" }, item.who), " ", h("span", { class: "wy-words" }, `“${item.t}”`))))),
      h("p", { class: "wy-ledger-close" }, runs(form.closing)));
  }
  const DRAW = { three, steps, record, aligned, ledger, mirror, line };
  WYK.formFor = (slug) => {
    const form = forms[slug];
    if (!form || !DRAW[form.kind]) throw new Error(`no form to draw for ${slug}`);
    return h("figure", { class: "wy-form" }, h("figcaption", { class: "wy-small" }, form.name), DRAW[form.kind](form));
  };
})();
