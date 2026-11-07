// Section 03. Six questions as a plain ruled list. Each opens the sheet: its passages, then the blocks in the study's order.
(() => {
  if (!window.PCK) return;
  const { h, refLink, page, sectionHead, runs, plain, blockView, passageText, questions } = PCK;
  const { study } = window.PC;
  PCK.drawQuestion = (body, question) => {
    body.replaceChildren(
      h("p", { class: "pc-small" }, "A question readers ask"),
      h("h3", { tabindex: "-1" }, plain(question.title)),
      ...question.texts.flatMap((text, index) => [
        h("p", { class: "pc-small pc-sheet-ref" }, index ? "Also read · " : null, refLink(text.r, text.label)),
        passageText(text.r)]),
      ...question.blocks.map(blockView));
  };
  const questionButton = (question) => h("li", {}, h("button", { type: "button", class: "pc-q", "data-question": question.id, onclick: (event) => PCK.openQuestion(question.id, event.currentTarget) }, plain(question.title)));
  page.append(h("section", { class: "t-sec pc-questions", id: "questions" },
    sectionHead("03", "Six questions,", "faced", runs(study.questionsLead)),
    h("ol", { class: "pc-q-list" }, [...questions.values()].map(questionButton))));
})();
