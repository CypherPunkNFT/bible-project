// Section 04. Said, or supplied? Each saying, three plain choices, then the passage's answer. No score and no right-or-wrong colour. Nothing is kept in the address, because this is the reader's own.
(() => {
  if (!window.ENK) return;
  const { h, page, sectionHead, runs } = ENK;
  const { study, test, verdicts } = window.EN;
  const rowView = (item) => {
    const answer = h("div", { class: "en-answer", hidden: true },
      h("p", { class: "en-small" }, item.verdictLabel), h("p", {}, runs(item.answer)));
    const choices = Object.entries(verdicts).map(([id, label]) => h("button", { type: "button", class: "en-choice", "aria-pressed": "false", onclick: (event) => {
      choices.forEach((button) => button.setAttribute("aria-pressed", String(button === event.currentTarget)));
      answer.hidden = false;
    } }, id === "says" ? "Says it" : id === "part" ? "Part of it" : "Does not say", h("span", { class: "en-visually" }, ` (${label})`)));
    return h("li", { class: "en-test-item" }, h("p", { class: "en-saying" }, item.saying), h("div", { class: "en-choices", role: "group", "aria-label": `How far does the passage go: ${item.saying}` }, choices), answer);
  };
  page.append(h("section", { class: "t-sec en-test-sec", id: "test" },
    sectionHead("04", "Said,", "or supplied?", runs(study.testLead)),
    h("ol", { class: "en-test" }, test.map(rowView))));
})();
