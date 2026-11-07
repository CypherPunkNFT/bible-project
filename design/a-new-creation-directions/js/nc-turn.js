// Section 03. Five letters as plain lines to one scale. The marks are drawings only; the references beneath are the controls, in text order,
// so nothing depends on hitting a mark a few pixels from its neighbour on a phone.
(() => {
  if (!window.NCK) return;
  const { h, refLink, runs, page, sectionHead } = NCK;
  const { study, letters, numbers, passages } = window.NC;
  const longest = Math.max(...letters.map((l) => l.total));
  const reading = h("p", { class: "nc-readline", "aria-live": "polite" });
  const prompt = () => reading.replaceChildren("Point at a reference, or move to it with the keyboard, to find it on its line and read it here.");
  prompt();

  const percent = (before, total) => `${(100 * before) / total}%`;
  const control = (mark, drawn) => {
    const link = refLink(mark.r, mark.label);
    const on = () => { drawn.classList.add("is-on"); reading.replaceChildren(h("b", {}, `${mark.label}. `), passages[mark.r].verses.map((v) => v.t).join(" ")); };
    const off = () => { drawn.classList.remove("is-on"); prompt(); };
    link.addEventListener("pointerenter", on);
    link.addEventListener("pointerleave", off);
    link.addEventListener("focus", on);
    link.addEventListener("blur", off);
    return link;
  };

  const letterView = (letter) => {
    const line = h("div", { class: "nc-line", style: `width:${(100 * letter.total) / longest}%`, "aria-hidden": "true" });
    const draw = (mark, className) => {
      const drawn = h("span", { class: className, style: `left:${percent(mark.before, letter.total)}` });
      line.append(drawn);
      return drawn;
    };
    if (letter.turn) line.append(h("span", { class: "nc-line-after", style: `left:${percent(letter.turn.before, letter.total)}` }));
    const turnMark = letter.turn ? draw(letter.turn, "nc-mark-turn") : null;
    const earlier = letter.marks.map((mark) => [mark, draw(mark, "nc-mark")]);
    const share = letter.turn ? Math.round((100 * letter.turn.before) / letter.total) : null;
    return h("li", { class: "nc-letter" },
      h("p", { class: "nc-letter-name" }, h("b", {}, letter.name), ` · ${letter.total} verses`),
      line,
      letter.turn
        ? h("p", { class: "nc-letter-line" }, "Turns at ", control(letter.turn, turnMark), `, “${letter.turn.words}”, after ${letter.turn.before} verses (${share}%).`)
        : null,
      h("p", { class: "nc-letter-line" }, letter.turn ? "Commands before it include " : "Named here: ", earlier.flatMap(([mark, drawn], index) => [index ? "; " : "", control(mark, drawn), ` “${mark.words}”`]), "."),
      letter.note ? h("p", { class: "nc-letter-line nc-muted" }, letter.note) : null);
  };
  page.append(h("section", { class: "t-sec nc-turn", id: "turn" },
    sectionHead("03", "A long way in.", "Then, therefore.", runs(study.turnLead)),
    h("ol", { class: "nc-letters" }, letters.map(letterView)),
    reading,
    h("p", { class: "nc-reads" }, `In these four letters the mark falls between ${numbers.low}% and ${numbers.high}% of the way through.`),
    h("p", { class: "nc-note" }, runs(study.turnReads)),
    h("p", { class: "nc-note" }, runs(study.turnCalvin))));
})();
