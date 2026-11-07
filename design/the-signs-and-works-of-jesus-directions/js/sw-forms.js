// The six forms, one to a reading. Each is drawn from phrases build-data.py has checked against their verses.
(() => {
  if (!window.SWK) return;
  const { h, phrase, art } = SWK;
  const noAnswer = (text) => h("span", { class: "sw-f-none" }, text);
  SWK.FORMS = {
    steps: (form) => h("div", { class: "sw-f sw-f-steps" },
      h("p", { class: "sw-f-cured" }, h("span", { class: "sw-f-star" }, art(SWArt.star)), " ", phrase(form.cured)),
      h("ol", {}, form.steps.map((step) => h("li", {}, h("span", { class: "sw-f-who" }, step.who), phrase(step)))),
      h("p", { class: "sw-note" }, form.note)),
    begs: (form) => h("ol", { class: "sw-f sw-f-begs" }, form.rows.map((row) => h("li", {},
      h("span", { class: "sw-f-who" }, row.who),
      h("span", {}, phrase(row.ask)),
      h("span", { class: "sw-f-answer" }, row.answer ? phrase(row.answer) : noAnswer("No answer given"))))),
    counts: (form) => h("div", { class: "sw-f sw-f-counts" },
      h("section", {}, h("p", { class: "sw-small" }, "Mark counts"), h("ul", {}, form.counts.map((item) => h("li", {}, phrase(item))))),
      h("section", {}, h("p", { class: "sw-small" }, "Mark does not show"),
        h("p", {}, phrase(form.before)),
        h("p", { class: "sw-f-gap" }, form.gap),
        h("p", {}, phrase(form.after))),
      h("section", {}, h("p", { class: "sw-small" }, "At Cana, who knew"), h("ul", {}, form.knew.map((item) => h("li", {}, h("span", { class: "sw-f-who" }, item.who), phrase(item)))))),
    crossings: (form) => h("div", { class: "sw-f sw-f-cross" },
      h("div", { class: "sw-f-cross-head", "aria-hidden": "true" }, h("span", {}), form.heads.map((head) => h("span", {}, head))),
      h("ul", {}, form.rows.map(([label, first, second]) => h("li", {},
        h("span", { class: "sw-f-who" }, label),
        h("span", {}, h("span", { class: "sw-visually" }, `${form.heads[0]}: `), first ? phrase(first) : noAnswer("Mark adds nothing here")),
        h("span", {}, h("span", { class: "sw-visually" }, `${form.heads[1]}: `), second ? phrase(second) : noAnswer("Mark adds nothing here"))))),
      h("p", { class: "sw-f-later" }, "Later, Jesus Himself: ", phrase(form.later))),
    speaks: (form) => h("ol", { class: "sw-f sw-f-speaks" }, form.rows.map((row) => h("li", { class: row.who === form.deed ? "is-deed" : null },
      h("span", { class: "sw-f-who" }, row.who, row.who === form.deed ? h("span", { class: "sw-f-star" }, art(SWArt.star)) : null),
      h("span", {}, phrase(row))))),
    stairs: (form) => h("div", { class: "sw-f sw-f-stairs" },
      h("section", { class: "sw-f-up" }, h("p", { class: "sw-small" }, form.up), h("ol", {}, form.man.map((item) => h("li", {}, phrase(item))))),
      h("section", { class: "sw-f-down" }, h("p", { class: "sw-small" }, form.down), h("ol", {}, form.them.map((item) => h("li", {}, phrase(item)))))),
  };
})();
