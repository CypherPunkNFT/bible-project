// Section 05. Three passages to sort yourself. The study's own sort stays hidden until asked for, and is shown in the verse, in words as well as marks.
(() => {
  if (!window.BWK) return;
  const { h, refLink, runs, page, sectionHead } = BWK;
  const { study, sorts } = window.BW;
  const MARK_LABELS = { speaker: "the one who speaks", other: "the one before them", god: "God" };
  const verseView = (verse, revealed) => [
    h("sup", {}, String(verse.v)),
    verse.pieces.map((piece) => (piece.m && revealed
      ? [h("mark", { class: `bw-mark bw-mark-${piece.m}` }, piece.t), h("small", { class: "bw-mark-label" }, ` ${MARK_LABELS[piece.m]} `)]
      : piece.t)),
    " ",
  ];
  function sortCard(sort) {
    const text = h("p", { class: "bw-sort-text" });
    const said = h("div", { class: "bw-sort-said", "aria-live": "polite" });
    const toggle = h("button", { type: "button", class: "bw-action", "aria-expanded": "false", onclick: () => draw(toggle.getAttribute("aria-expanded") !== "true") });
    const draw = (revealed) => {
      text.replaceChildren(...sort.verses.flatMap((verse) => verseView(verse, revealed)).flat(2));
      said.replaceChildren(...(revealed ? [h("p", {}, runs(sort.said))] : []));
      toggle.setAttribute("aria-expanded", String(revealed));
      toggle.textContent = revealed ? "Hide this study’s sort" : "Compare with this study’s sort";
    };
    draw(false);
    return h("li", { class: "bw-sort" }, h("p", { class: "bw-small" }, refLink(sort.r, sort.label)), text, toggle, said);
  }
  page.append(h("section", { class: "t-sec bw-sort-sec", id: "sort" },
    sectionHead("05", "Sort it", "yourself", runs(study.sortLead)),
    h("ol", { class: "bw-sorts" }, sorts.map(sortCard))));
})();
