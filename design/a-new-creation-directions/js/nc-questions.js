// Section 05. Six questions as a plain ruled list. Each opens the sheet: this study's reading first, then what else has been said.
(() => {
  if (!window.NCK) return;
  const { h, refLink, page, sectionHead, runs, blockView, passageText, questions } = NCK;
  const { study, passages } = window.NC;
  NCK.drawQuestion = (body, question) => {
    const text = passages[question.text];
    body.replaceChildren(
      h("p", { class: "nc-small" }, "A question readers ask"),
      h("h3", { tabindex: "-1" }, question.title),
      h("p", { class: "nc-small nc-sheet-ref" }, refLink(question.text, text.label)),
      passageText(question.text),
      ...question.blocks.map(blockView));
  };
  const questionButton = (question) => h("li", {}, h("button", { type: "button", class: "nc-q", "data-question": question.id, onclick: (event) => NCK.openQuestion(question.id, event.currentTarget) }, question.title));
  page.append(h("section", { class: "t-sec nc-questions", id: "questions" },
    sectionHead("05", "Six questions,", "faced", runs(study.questionsLead)),
    h("ol", { class: "nc-q-list" }, [...questions.values()].map(questionButton))));
})();
