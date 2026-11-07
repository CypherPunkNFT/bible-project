// Section 05. The hard questions as a plain ruled list. Each opens the sheet: the passage, this study's reading, then what others have written, labelled as theirs.
(() => {
  if (!window.SWK) return;
  const { h, refLink, page, sectionHead, runs, blockView, passageText, questions } = SWK;
  const { study, passages, words } = window.SW;
  SWK.drawQuestion = (body, question) => {
    const text = passages[question.text];
    body.replaceChildren(
      h("p", { class: "sw-small" }, "A question readers ask"),
      h("h3", { tabindex: "-1" }, question.title),
      h("p", { class: "sw-small sw-sheet-ref" }, refLink(question.text, text.label)),
      passageText(question.text),
      ...question.blocks.map(blockView));
  };
  const questionButton = (question) => h("li", {}, h("button", { type: "button", class: "sw-q", "data-question": question.id, onclick: (event) => SWK.openQuestion(question.id, event.currentTarget) }, question.title));
  page.append(h("section", { class: "t-sec sw-questions", id: "questions" },
    sectionHead("05", `${words.Questions} questions,`, "faced", runs(study.questionsLead)),
    h("ol", { class: "sw-q-list" }, [...questions.values()].map(questionButton))));
})();
