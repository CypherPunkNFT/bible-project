// Section 01. The first question, then the wall of answers, the blank they are tried in, the words that join them, and three pairs of the same words.
(() => {
  if (!window.WYK) return;
  const { h, runs, phrase, refLink, page, sectionHead, roving, answerIds, lensIds, reducedMotion } = WYK;
  const { study, groups, answers, lenses, pairs, wayIn, words } = window.WY;
  const QUESTION_PROMPT = "Point at a line, or tab to it, to try it here.";
  const NO_NEXT = "For what follows, read the passage.";

  const wayStrip = h("section", { class: "wy-way-in", "aria-label": "The first question" },
    h("p", { class: "wy-way-lead" }, runs(study.wayInLead)),
    h("ol", {},
      h("li", {}, h("span", { class: "wy-small" }, "Jesus asks"), " ", phrase(wayIn.asks)),
      h("li", {}, h("span", { class: "wy-small" }, "They report"), " ", wayIn.reports.map((item, index) => [index ? " · " : "", h("span", { class: "wy-words" }, item.t)]), " ", h("span", { class: "wy-at" }, refLink(wayIn.reports[0].r, wayIn.reports[0].label))),
      h("li", { class: "wy-way-turn" }, h("span", { class: "wy-small" }, "Then He turns"), " ", phrase(wayIn.turns), " ", h("span", { class: "wy-words" }, `“${wayIn.then.t}”`))));

  // ── The blank ──
  const readWords = h("p", { class: "wy-read-words" });
  const readWho = h("p", { class: "wy-read-who" });
  const readNext = h("p", { class: "wy-read-next" });
  const readButton = h("button", { type: "button", class: "wy-read-go", "data-read": "", "aria-disabled": "true" }, "Read it");
  const announce = h("p", { class: "wy-visually", "aria-live": "polite" });
  const readout = h("div", { class: "wy-readout" }, h("div", { class: "wy-read-text" }, readWords, readWho, readNext), readButton, announce);
  let previewing = null;

  function drawReadout() {
    const shown = answerIds.get(previewing ?? WYK.state.answer);
    readout.classList.toggle("is-empty", !shown);
    readout.classList.toggle("is-preview", Boolean(previewing) && previewing !== WYK.state.answer);
    readButton.setAttribute("aria-disabled", String(!WYK.state.answer));
    if (!shown) {
      readWords.textContent = QUESTION_PROMPT;
      readWho.replaceChildren();
      readNext.replaceChildren();
      return;
    }
    readWords.className = `wy-read-words wy-how-${shown.how}`;
    readWords.textContent = shown.t;
    readWho.replaceChildren(`${shown.who} · ${shown.howLabel} · ${shown.label}`);
    readNext.replaceChildren(...(shown.next ? [h("span", { class: "wy-small" }, "Next"), " ", `“${shown.next.t}”`, " ", h("span", { class: "wy-at" }, shown.next.label)] : [NO_NEXT]));
  }
  const preview = (id) => { previewing = id; drawReadout(); };
  readButton.addEventListener("click", () => {
    const chosen = answerIds.get(WYK.state.answer);
    if (chosen) WYK.openPassage(chosen.read, readButton);
  });

  // ── The wall ──
  const lines = new Map();
  function pin(id) {
    WYK.setView({ answer: WYK.state.answer === id ? "" : id });
    previewing = null;
    syncLines();
    const chosen = answerIds.get(WYK.state.answer);
    announce.textContent = chosen ? `Chosen: ${chosen.t}. ${chosen.who}. Use Read it for the passage.` : "Nothing chosen.";
  }
  function lineButton(answer) {
    const button = h("button", { type: "button", class: `wy-line wy-how-${answer.how}`, "data-answer": answer.id, "aria-pressed": "false", "aria-label": `${answer.t}. ${answer.who}, ${answer.howLabel}, ${answer.label}.`, onclick: () => pin(answer.id) }, answer.t);
    button.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") preview(answer.id); });
    button.addEventListener("pointerleave", (event) => { if (event.pointerType === "mouse") preview(null); });
    button.addEventListener("focus", () => { if (button.matches(":focus-visible")) preview(answer.id); });
    button.addEventListener("blur", () => preview(null));
    lines.set(answer.id, button);
    return h("li", {}, button);
  }
  const groupView = (group) => {
    const items = answers.filter((answer) => answer.group === group.id).map(lineButton);
    const buttons = items.map((item) => item.firstChild);
    roving(buttons, () => buttons.find((button) => button.dataset.answer === WYK.state.answer));
    return h("section", { class: "wy-group" }, h("h3", {}, group.name), h("ul", {}, items));
  };
  const joinPath = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  joinPath.setAttribute("class", "wy-join");
  joinPath.setAttribute("aria-hidden", "true");
  const wall = h("div", { class: "wy-wall" }, joinPath, groups.map(groupView));

  function syncLines() {
    for (const [id, button] of lines) button.setAttribute("aria-pressed", String(id === WYK.state.answer));
    drawReadout();
  }

  // ── The words ──
  const wordButtons = lenses.map((lens) => h("button", { type: "button", class: "wy-word", "data-word": lens.id, "aria-pressed": "false", onclick: () => { WYK.setView({ word: WYK.state.word === lens.id ? "" : lens.id }); syncWord(); } }, lens.label));
  const wordText = h("p", { class: "wy-word-text", "aria-live": "polite" });
  roving(wordButtons, () => wordButtons.find((button) => button.dataset.word === WYK.state.word));

  // A fine rule down the wall's margin, from the first line that uses the word to the last, with a mark level with each.
  function drawJoin() {
    joinPath.replaceChildren();
    const lens = lensIds.get(WYK.state.word);
    if (!lens) return;
    const top = wall.getBoundingClientRect().top;
    const levels = lens.ids.map((id) => { const box = lines.get(id).getBoundingClientRect(); return box.top - top + box.height / 2; }).sort((a, b) => a - b);
    const svgNode = (tag, attrs) => {
      const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
      for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
      return node;
    };
    joinPath.append(svgNode("line", { x1: 4, x2: 4, y1: levels[0], y2: levels[levels.length - 1] }));
    for (const level of levels) joinPath.append(svgNode("circle", { cx: 4, cy: level, r: 3 }));
  }
  function syncWord() {
    const lens = lensIds.get(WYK.state.word);
    wall.classList.toggle("has-word", Boolean(lens));
    for (const button of wordButtons) button.setAttribute("aria-pressed", String(button.dataset.word === WYK.state.word));
    for (const [id, button] of lines) button.classList.toggle("lit", Boolean(lens?.ids.includes(id)));
    wordText.replaceChildren(...(lens ? runs(lens.text) : ["Choose a word to see who else used it. Nothing is hidden: the other lines only fade."]));
    drawJoin();
  }
  new ResizeObserver(drawJoin).observe(wall);
  document.fonts?.ready.then(drawJoin);

  // ── The pairs ──
  const side = (item) => {
    const answer = answerIds.get(item.answer);
    return h("div", { class: "wy-pair-side" },
      h("p", { class: "wy-small" }, answer.who),
      h("p", { class: `wy-pair-said wy-how-${answer.how}` }, answer.t), h("p", { class: "wy-at" }, refLink(answer.r, answer.label), ` · ${answer.howLabel}`),
      h("p", { class: "wy-pair-around" }, phrase(item.around)));
  };
  const pairsView = h("section", { class: "wy-pairs" },
    h("h3", {}, "The same words, in two mouths"),
    h("p", { class: "wy-lead-small" }, runs(study.pairsLead)),
    pairs.map((pair) => h("article", { class: "wy-pair" }, h("h4", {}, pair.word), side(pair.left), side(pair.right))),
    h("p", { class: "wy-reads" }, runs(study.pairsReads)));

  page.append(h("section", { class: "t-sec wy-answers", id: "wall" },
    sectionHead("01", "The answers,", "and a blank", runs(study.wallLead)),
    wayStrip,
    h("div", { class: "wy-words-row" }, h("div", { class: "wy-word-list", role: "group", "aria-label": "Show the lines that use a word" }, wordButtons), wordText),
    h("div", { class: "wy-wall-hold" }, wall, readout),
    h("p", { class: "wy-reads" }, runs(study.wallReads)),
    h("div", { class: "wy-flag wy-flag-care wy-wall-care" }, h("p", { class: "wy-flag-label" }, "Care"), h("p", {}, runs(study.wallCare))),
    pairsView));

  WYK.syncers.push(syncLines, syncWord);
  syncLines();
  syncWord();
  reducedMotion.addEventListener("change", drawJoin);
})();
