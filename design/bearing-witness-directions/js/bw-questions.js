// Section 04. Five questions as words joined by fine lines. Each opens the sheet: this study's reading first, then what else has been said.
(() => {
  if (!window.BWK) return;
  const { h, refLink, page, sectionHead, runs, blockView, passageText, questions } = BWK;
  const { study, passages } = window.BW;
  BWK.drawQuestion = (body, question) => {
    const text = passages[question.text];
    body.replaceChildren(
      h("p", { class: "bw-small" }, "A question readers ask"),
      h("h3", { tabindex: "-1" }, question.title),
      h("p", { class: "bw-small bw-sheet-ref" }, refLink(question.text, text.label)),
      passageText(question.text),
      ...question.blocks.map(blockView));
  };
  const questionButton = (question) => h("li", {}, h("button", { type: "button", class: "bw-q", "data-question": question.id, onclick: (event) => BWK.openQuestion(question.id, event.currentTarget) }, question.title));
  page.append(h("section", { class: "t-sec bw-questions", id: "questions" },
    sectionHead("04", "Five questions,", "faced", runs(study.questionsLead)),
    h("ol", { class: "bw-q-list" }, [...questions.values()].map(questionButton))));
})();
