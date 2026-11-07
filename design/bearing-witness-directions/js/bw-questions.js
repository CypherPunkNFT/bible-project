// Section 04. The questions readers ask, as words joined by fine lines. Each opens the one sheet: the study's reading,
// and where they differ, what Baptists and other Christians hold, each labelled.
(() => {
  if (!window.BWK) return;
  const { h, page, sectionHead, blockView, questions } = BWK;
  BWK.drawQuestion = (body, question) => {
    body.replaceChildren(
      h("p", { class: "bw-small" }, "A question readers ask"),
      h("h3", { tabindex: "-1" }, question.title),
      ...question.blocks.map(blockView));
  };
  const questionButton = (question) => h("li", {}, h("button", { type: "button", class: "bw-q", "data-question": question.id, onclick: (event) => BWK.openQuestion(question.id, event.currentTarget) }, question.title));
  page.append(h("section", { class: "t-sec bw-questions", id: "questions" },
    sectionHead("04", "Questions", "readers ask", "Each opens beside the page, with the study’s reading first and the views that differ labelled as theirs."),
    h("ol", { class: "bw-q-list" }, [...questions.values()].map(questionButton))));
})();
