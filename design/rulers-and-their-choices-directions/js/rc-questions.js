// Section 04. Six questions as a plain ruled list. Each opens the sheet: the passage, this study's reading, then what others have written, labelled as theirs.
(() => {
  if (!window.RCK) return;
  const { h, refLink, page, sectionHead, runs, blockView, passageText, questions } = RCK;
  const { study, passages } = window.RC;
  RCK.drawQuestion = (body, question) => {
    const text = passages[question.text];
    body.replaceChildren(
      h("p", { class: "rc-small" }, "A question readers ask"),
      h("h3", { tabindex: "-1" }, question.title),
      h("p", { class: "rc-small rc-sheet-ref" }, refLink(question.text, text.label)),
      passageText(question.text),
      ...question.blocks.map(blockView));
  };
  const questionButton = (question) => h("li", {}, h("button", { type: "button", class: "rc-q", "data-question": question.id, onclick: (event) => RCK.openQuestion(question.id, event.currentTarget) }, question.title));
  page.append(h("section", { class: "t-sec rc-questions", id: "questions" },
    sectionHead("04", "Six questions,", "faced", runs(study.questionsLead)),
    h("ol", { class: "rc-q-list" }, [...questions.values()].map(questionButton))));
})();
