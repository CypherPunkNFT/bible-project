// Sections 02, 03 and 04: a kind of writing across the books, the staircase of looking back, and trying the habit yourself.
(() => {
  if (!window.SSK) return;
  const { h, refLink, runs, page, sectionHead } = SSK;
  const { study, passages, kinds, marks, parts, steps, books, practice, numbers } = window.SS;
  const partById = new Map(parts.map((p) => [p.id, p]));
  const bookByCode = new Map(books.map((b) => [b.code, b]));

  // ── 02 One kind at a time: the list is the content at every width; the rail above it is a picture of the same list ──
  const rail = h("div", { class: "ss-rail", "aria-hidden": "true" }, parts.map((part) => {
    const inPart = books.filter((b) => b.part === part.id);
    return h("div", { class: "ss-rail-part", style: `--tone:var(--${part.tone});flex-grow:${inPart.length}` },
      h("span", { class: "ss-rail-name" }, part.name),
      h("div", { class: "ss-rail-books" }, inPart.map((book) => h("i", { "data-book": book.code, title: book.name }))));
  }));
  const said = h("p", { class: "ss-rail-said", "aria-hidden": "true" });
  const kindHead = h("p", { class: "ss-reads" });
  const list = h("ul", { class: "ss-marks" });
  const kindButtons = new Map();
  const kindGroup = h("div", { class: "ss-kinds", role: "group", "aria-label": "Choose a kind of writing" }, kinds.map((kind) => {
    const button = h("button", { type: "button", "aria-pressed": "false", onclick: () => { SSK.setView({ kind: kind.id }); drawKind(); } }, kind.name);
    kindButtons.set(kind.id, button);
    return button;
  }));
  function drawKind() {
    const kind = kinds.find((k) => k.id === SSK.state.kind);
    const rows = marks[kind.id];
    for (const [id, button] of kindButtons) button.setAttribute("aria-pressed", String(id === kind.id));
    const partsHit = new Set(rows.map((row) => bookByCode.get(row.code).part));
    kindHead.textContent = `${kind.line} Here are ${rows.length} places, in ${partsHit.size} of the ${parts.length} parts of the Bible.`;
    const byBook = new Map();
    rows.forEach((row) => byBook.set(row.code, [...(byBook.get(row.code) ?? []), row]));
    rail.querySelectorAll("i").forEach((tick) => {
      const on = byBook.get(tick.dataset.book);
      tick.classList.toggle("is-on", Boolean(on));
      tick.replaceChildren();
      if (on) {
        const say = () => { said.textContent = `${bookByCode.get(on[0].code).name}: ${on.map((item) => `${item.label}, ${item.line}`).join(". ")}.`; };
        tick.append(h("a", { href: `?sheet=${on[0].r}`, "data-sheet": on[0].r, tabindex: "-1", "aria-hidden": "true", onmouseenter: say }));
      }
    });
    said.textContent = "Point at a mark to read it here; choose it to open the verse. The same places are in the list below, for keyboards and phones.";
    list.replaceChildren(...rows.map((row) => {
      const part = partById.get(bookByCode.get(row.code).part);
      return h("li", { style: `--tone:var(--${part.tone})` }, refLink(row.r, row.label), h("span", {}, row.line), h("small", {}, part.name));
    }));
  }
  page.append(h("section", { class: "t-sec", id: "kinds" },
    sectionHead("02", "One book.", "Many kinds of writing.", runs(study.mixed)),
    kindGroup, kindHead, rail, said, list,
    h("p", { class: "ss-note" }, "A script checks that a telling word is in each verse (a word such as song or letter). That proves the word is there. Whether the passage is that kind of writing is this study's reading.")));
  drawKind();
  SSK.syncers.push(drawKind);

  // ── 03 The staircase: rows are later parts, columns earlier ones, in the Bible's order ──
  const KIND_WORDS = { names: "names", retells: "retells", shares: "shares words" };
  const KIND_LONG = { names: "The later verse names the person or the book.", retells: "Both verses tell the same thing, in the same words.", shares: "The verses share words. The later one does not name the earlier one, so the link is this study's comparison." };
  const stepButtons = new Map();
  const readout = h("div", { class: "ss-readout", "aria-live": "polite" });
  const columns = parts.slice(0, -1);
  const stair = h("div", { class: "ss-stair" },
    h("div", { class: "ss-stair-row ss-stair-top", "aria-hidden": "true" }, h("span"), columns.map((part) => h("span", { style: `--tone:var(--${part.tone})` }, part.name))),
    parts.slice(1).map((later) => h("div", { class: "ss-stair-row", style: `--tone:var(--${later.tone})` },
      h("span", { class: "ss-stair-later" }, later.name),
      columns.map((earlier) => {
        const step = steps.find((s) => s.later === later.id && s.earlier === earlier.id);
        if (!step) return h("span", { class: "ss-stair-empty" });
        const button = h("button", { type: "button", class: `ss-cell ss-cell-${step.kind}`, "aria-pressed": "false", onclick: () => { SSK.setView({ step: step.id }); drawStep(); } },
          h("span", { class: "ss-cell-on" }, `On ${earlier.name}`), h("b", {}, step.laterLabel), h("small", {}, h("i", { "aria-hidden": "true" }), KIND_WORDS[step.kind]));
        stepButtons.set(step.id, button);
        return button;
      }))));
  function verseWithMark(id, phrase) {
    const text = passages[id].verses.map((v) => v.t).join(" ");
    const at = text.indexOf(phrase);
    return at < 0 ? h("blockquote", {}, text) : h("blockquote", {}, text.slice(0, at), h("mark", {}, phrase), text.slice(at + phrase.length));
  }
  function drawStep() {
    const step = steps.find((s) => s.id === SSK.state.step);
    for (const [id, button] of stepButtons) button.setAttribute("aria-pressed", String(id === step.id));
    readout.style.setProperty("--tone", `var(--${partById.get(step.later).tone})`);
    readout.replaceChildren(
      h("p", { class: "ss-readout-line" }, step.line),
      h("div", { class: "ss-readout-pair" },
        h("div", {}, h("span", { class: "ss-zone-label" }, `Later · ${partById.get(step.later).name}`), verseWithMark(step.laterR, step.laterText), refLink(step.laterR, step.laterLabel)),
        h("div", {}, h("span", { class: "ss-zone-label" }, `Earlier · ${partById.get(step.earlier).name}`), verseWithMark(step.earlierR, step.earlierText), refLink(step.earlierR, step.earlierLabel))),
      h("p", { class: "ss-note" }, h("b", {}, `It ${KIND_WORDS[step.kind]}. `), KIND_LONG[step.kind]));
  }
  page.append(h("section", { class: "t-sec", id: "steps" },
    sectionHead("03", "Every later part.", "Looks back.", runs(study.steps)),
    h("p", { class: "ss-reads" }, `Each of the ${numbers.steps} pairs has an example: ${numbers.names} name the earlier part outright, ${numbers.retells} retell it, and ${numbers.shares} share words with it. Choose a step to read both verses.`),
    stair, readout,
    h("p", { class: "ss-note" }, "This is one example per pair, chosen by this study. It is not a count, and a pair's example says nothing about how often it happens. The order is the Bible's order, not the date of writing, so \"earlier\" here means earlier on the page. Revelation never uses a formula such as \"it is written\", which is why so many of its steps only share words. A script checks that the words are in both verses. That does not prove a writer meant the link. For every cross-reference the site holds, see the Connections study.")));
  drawStep();
  SSK.syncers.push(drawStep);

  // ── 04 Try the habit: one passage at a time ──
  const tryBox = h("div", { class: "ss-try" });
  let at = 0;
  function drawTry(chosen = null, focusAnswer = false) {
    const item = practice[at];
    const answer = h("div", { class: "ss-answer", "aria-live": "polite", tabindex: "-1" }, chosen ? [
      h("p", { class: "ss-answer-head" }, chosen === item.answer ? `Yes: ${item.answer.toLowerCase()}.` : `Not quite. This one is ${item.answer.toLowerCase()}.`),
      h("p", {}, item.why),
      h("p", { class: "ss-try-foot" }, refLink(item.r, item.ref), " ",
        h("button", { type: "button", class: "ss-action", onclick: () => { at = (at + 1) % practice.length; drawTry(); tryBox.querySelector("button").focus({ preventScroll: true }); } }, "Next passage →")),
    ] : []);
    tryBox.replaceChildren(
      h("p", { class: "ss-kind" }, "Passage ", h("b", {}, `${at + 1} / ${practice.length}`)),
      h("blockquote", { class: "ss-try-text" }, passages[item.r].verses.map((v) => `${v.t} `)),
      h("p", { class: "ss-small" }, "What kind of writing is this?"),
      h("div", { class: "ss-options", role: "group", "aria-label": "Choose a kind of writing" }, item.options.map((option) => h("button", { type: "button", class: chosen === option ? "is-chosen" : "", "aria-pressed": String(chosen === option), onclick: () => drawTry(option, true) }, option))),
      answer);
    if (focusAnswer) answer.focus({ preventScroll: true });
  }
  page.append(h("section", { class: "t-sec", id: "try" }, sectionHead("04", "Name it", "yourself.", runs(study.try)), tryBox));
  drawTry();
})();
