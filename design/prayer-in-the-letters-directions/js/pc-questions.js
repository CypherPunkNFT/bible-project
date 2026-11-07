// Section 06. Six questions as a plain ruled list. Each opens the sheet: this study's reading first, then what else has been said.
(() => {
  if (!window.PCK) return;
  const { h, refLink, page, sectionHead, runs, blockView, passageText, questions } = PCK;
  const { study, passages } = window.PC;
  PCK.drawQuestion = (body, question) => {
    const text = passages[question.text];
    body.replaceChildren(
      h("p", { class: "pc-small" }, "A question readers ask"),
      h("h3", { tabindex: "-1" }, question.title),
      h("p", { class: "pc-small pc-sheet-ref" }, refLink(question.text, text.label)),
      passageText(question.text),
      ...question.blocks.map(blockView));
  };
  const questionButton = (question) => h("li", {}, h("button", { type: "button", class: "pc-q", "data-question": question.id, onclick: (event) => PCK.openQuestion(question.id, event.currentTarget) }, question.title));
  page.append(h("section", { class: "t-sec pc-questions", id: "questions" },
    sectionHead("06", "Six questions,", "faced", runs(study.questionsLead)),
    h("ol", { class: "pc-q-list" }, [...questions.values()].map(questionButton))));
})();
