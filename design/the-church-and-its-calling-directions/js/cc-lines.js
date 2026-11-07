// Section 05. Three lines often read alone, each with its answer closed, so the reader tries the habit first.
(() => {
  if (!window.CCK) return;
  const { h, refLink, page, sectionHead, runs } = CCK;
  const { study, lines } = window.CC;
  const card = (line) => h("li", { class: "cc-line-card" },
    h("h3", {}, refLink(line.r, line.label)),
    h("p", { class: "cc-line-words" }, line.t),
    h("p", { class: "cc-line-alone" }, h("b", {}, "Read alone. "), line.alone),
    h("details", {},
      h("summary", {}, "Who was in the room?"),
      h("p", { class: "cc-line-room" }, "“", line.room.t, "” ", refLink(line.room.r, line.room.label)),
      h("p", {}, runs(line.answer))));
  page.append(h("section", { class: "t-sec cc-lines", id: "lines" },
    sectionHead("05", "Three lines,", "tried in their rooms", runs(study.roomLead)),
    h("ol", { class: "cc-line-cards" }, lines.map(card))));
})();
