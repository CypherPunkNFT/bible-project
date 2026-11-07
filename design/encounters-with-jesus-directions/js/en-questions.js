// Section 05. The hard questions as a plain ruled list. Each opens the sheet: the passage, this study's reading, then what others have written, labelled as theirs.
(() => {
  if (!window.ENK) return;
  const { h, refLink, page, sectionHead, runs, blockView, passageText, questions } = ENK;
  const { study, passages } = window.EN;
  ENK.drawQuestion = (body, question) => {
    const text = passages[question.text];
    body.replaceChildren(
      h("p", { class: "en-small" }, "A question readers ask"),
      h("h3", { tabindex: "-1" }, question.title),
      h("p", { class: "en-small en-sheet-ref" }, refLink(question.text, text.label)),
      passageText(question.text),
      ...question.blocks.map(blockView));
  };
  const questionButton = (question) => h("li", {}, h("button", { type: "button", class: "en-q", "data-question": question.id, onclick: (event) => ENK.openQuestion(question.id, event.currentTarget) }, question.title));
  page.append(h("section", { class: "t-sec en-questions", id: "questions" },
    sectionHead("05", "Hard questions,", "faced", runs(study.questionsLead)),
    h("ol", { class: "en-q-list" }, [...questions.values()].map(questionButton))));
})();
