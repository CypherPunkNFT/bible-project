// Section 04. The hard questions as a plain ruled list. Each opens the sheet: the passage, this study's reading, then what others have written, labelled as theirs.
(() => {
  if (!window.WYK) return;
  const { h, refLink, page, sectionHead, runs, blockView, passageText, questions } = WYK;
  const { study, passages, words } = window.WY;
  WYK.drawQuestion = (body, question) => {
    const text = passages[question.text];
    body.replaceChildren(
      h("p", { class: "wy-small" }, "A question readers ask"),
      h("h3", { tabindex: "-1" }, question.title),
      h("p", { class: "wy-small wy-sheet-ref" }, refLink(question.text, text.label)),
      passageText(question.text),
      ...question.blocks.map(blockView));
  };
  const questionButton = (question) => h("li", {}, h("button", { type: "button", class: "wy-q", "data-question": question.id, onclick: (event) => WYK.openQuestion(question.id, event.currentTarget) }, question.title));
  page.append(h("section", { class: "t-sec wy-questions", id: "questions" },
    sectionHead("04", `${words.Questions} questions,`, "faced", runs(study.questionsLead)),
    h("ol", { class: "wy-q-list" }, [...questions.values()].map(questionButton))));
})();
