// Section 06. Six questions as a plain ruled list. Each opens the sheet: the passage, this study's reading, then what else has been taught.
(() => {
  if (!window.CCK) return;
  const { h, refLink, page, sectionHead, runs, blockView, passageText, questions } = CCK;
  const { study, passages } = window.CC;
  CCK.drawQuestion = (body, question) => {
    const text = passages[question.text];
    body.replaceChildren(
      h("p", { class: "cc-small" }, "A question readers ask"),
      h("h3", { tabindex: "-1" }, question.title),
      h("p", { class: "cc-small cc-sheet-ref" }, refLink(question.text, text.label)),
      passageText(question.text),
      ...question.blocks.map(blockView));
  };
  const questionButton = (question) => h("li", {}, h("button", { type: "button", class: "cc-q", "data-question": question.id, onclick: (event) => CCK.openQuestion(question.id, event.currentTarget) }, question.title));
  page.append(h("section", { class: "t-sec cc-questions", id: "questions" },
    sectionHead("06", "Six questions,", "faced", runs(study.questionsLead)),
    h("ol", { class: "cc-q-list" }, [...questions.values()].map(questionButton))));
})();
