// One figure per part, only where the text already has the shape. Each states the question it answers and the one
// sentence that reads it, and every mark reaches its verse. Counts and phrases come from data.js, checked by script.
window.PSFigures = (() => {
  const { data, h, refLink, psalm, bookName, label } = PSKit;
  const frame = (cls, question, reading, ...body) => h("figure", { class: `ps-fig ${cls}` },
    h("p", { class: "ps-fig-q" }, label("Question"), " ", question), ...body, h("figcaption", {}, reading));

  // 01 The five closings side by side, each under its book, the bar as long as the book.
  function closings() {
    const most = Math.max(...data.books.map((b) => b.last - b.first + 1));
    return frame("ps-closings", "How does each book end?",
      "Four books close by blessing the LORD, and the fourth adds Hallelujah. The fifth has no closing line: its last psalm is the closing.",
      h("ol", {}, data.books.map((b) => h("li", { class: b.n === 5 ? "is-last" : "" },
        h("span", { class: "ps-closing-book" }, h("b", {}, bookName(b.n)), ` ${b.first}–${b.last}`),
        h("span", { class: "ps-closing-bar", style: `--w:${((b.last - b.first + 1) / most * 100).toFixed(1)}%`, "aria-hidden": "true" }),
        h("q", {}, b.text.replace(/"/g, "")), refLink(b.closing, data.passages[b.closing].label)))));
  }

  // 02 The gate: one word at the start of Psalm 1 and the end of Psalm 2; the man of 1:1 walks, then stands, then sits.
  function gate() {
    const g = data.gate;
    return frame("ps-gatefig", "Where do Psalms 1 and 2 begin and end?",
      "The same word opens the first psalm and closes the second, so the two stand together as one doorway.",
      h("div", { class: "ps-gate-frame" },
        h("p", { class: "ps-gate-open" }, h("q", {}, g.open[1]), " ", refLink(g.open[0], data.passages[g.open[0]].label)),
        h("span", { class: "ps-gate-line", "aria-hidden": "true" }),
        h("p", { class: "ps-gate-close" }, h("q", {}, g.close[1]), " ", refLink(g.close[0], data.passages[g.close[0]].label))),
      h("ol", { class: "ps-gate-steps", "aria-label": "Psalm 1:1 in three steps" }, g.steps.map(([verb, words], i) =>
        h("li", { style: `--i:${i}` }, h("b", {}, verb), h("span", {}, words)))));
  }

  // 03 The headings: where each named writer's psalms fall in the book, and the thirteen days in David's life.
  function headings() {
    const writers = data.groups.writers.filter((g) => !["unnamed", "none"].includes(g.id));
    const ticks = (numbers) => h("span", { class: "ps-lane", "aria-hidden": "true" },
      numbers.map((n) => h("i", { style: `--x:${((n - 0.5) / 150 * 100).toFixed(2)}%` })));
    return frame("ps-writers", "Whose names do the headings give, and where in the book?",
      "Each line is the whole book, Psalm 1 at the left and 150 at the right; a mark is a heading that names that writer. Choose a name to see those psalms in the whole book above.",
      h("div", { class: "ps-lanes" },
        h("p", { class: "ps-lane-scale", "aria-hidden": "true" }, data.books.map((b) => h("span", { style: `--from:${((b.first - 1) / 150 * 100).toFixed(2)}%` }, bookName(b.n)))),
        writers.map((g) => h("div", { class: `ps-lane-row w-${g.id}` },
          h("button", { type: "button", class: "ps-lane-name", title: "Show in the whole book",
            onclick: () => { PSField.setLens("writers", g.id); document.getElementById("book").scrollIntoView({ behavior: PSKit.reduced() ? "auto" : "smooth" }); } },
            g.label, " ", h("b", {}, String(g.psalms.length))), ticks(g.psalms)))),
      h("div", { class: "ps-days" }, h("p", { class: "ps-days-title" }, label("A day in David's life"), ` ${data.events.length} headings`),
        h("ol", {}, data.events.map((e) => h("li", {}, refLink(`PS.${e.n}`, `Psalm ${e.n}`), h("span", {}, e.heading.replace(/"/g, "")))))));
  }

  // 04 Psalm 13 in the three movements the study names, across its six verses.
  function psalm13() {
    const stages = data.psalm13;
    const x = (i) => 30 + i * 120, y = (level) => 110 - level * 40;
    const path = stages.map((s, i) => `${i ? "L" : "M"}${x(i)} ${y(s.level)}`).join(" ");
    const svg = `<svg viewBox="0 0 300 130" aria-hidden="true"><path class="ps-faint" d="M10 120h280"/><path class="ps-tone" d="${path}"/>${stages.map((s, i) => `<circle class="ps-dot" cx="${x(i)}" cy="${y(s.level)}" r="5"/>`).join("")}</svg>`;
    return frame("ps-thirteen", "How does a lament move?",
      "Psalm 13 in the three movements the study names. The line marks the order of the movements, not a measure of anything.",
      PSKit.art(svg, "ps-thirteen-art"),
      h("ol", {}, stages.map((s) => h("li", {}, h("b", {}, s.name), h("q", {}, s.words), refLink(s.r, data.passages[s.r].label)))));
  }

  // 05 Psalm 119's alphabet: twenty-two stanzas of eight verses, each under its letter; the stanza for nun lit.
  function alphabet() {
    return frame("ps-alphabet", "How is the longest psalm built?",
      `${data.stanzas.length} stanzas of eight verses, one for each letter of the Hebrew alphabet, as the Berean names them. Choose a stanza to read it.`,
      h("ol", { class: "ps-stanzas" }, data.stanzas.map((s) => h("li", { class: s.first === 105 ? "is-lit" : "" },
        h("a", { class: "ps-ref ps-stanza", href: `?ref=${encodeURIComponent(s.r)}`, "data-ref": s.r, "aria-label": `${s.letter}, Psalm 119:${s.first}–${s.last}` },
          h("span", { class: "ps-stanza-dots", "aria-hidden": "true" }, Array.from({ length: 8 }, () => h("i"))),
          h("span", { class: "ps-stanza-letter" }, s.letter))))));
  }

  // 06 The psalms the New Testament quotes most, by the Berean's notes, with the five this part reads marked.
  function quoted(part) {
    const read = new Set([2, 16, 22, 110, 118].filter((n) => part.psalms.includes(n)));
    const shown = [...data.ranked];
    for (const n of read) if (!shown.some((r) => r.n === n)) shown.push({ n, count: psalm(n).cited.length });
    const most = shown[0].count;
    return frame("ps-quoted", "Which psalms does the New Testament quote most?",
      `By the Berean's notes, ${data.numbers.cited} psalms are quoted in ${data.numbers.pairs} New Testament passages. These are the most quoted, and the five this part reads are marked.`,
      h("ol", {}, shown.map((r) => h("li", { class: read.has(r.n) ? "is-read" : "" },
        refLink(`PS.${r.n}`, `Psalm ${r.n}`),
        h("span", { class: "ps-qbar", style: `--w:${(r.count / most * 100).toFixed(1)}%`, "aria-hidden": "true" }),
        h("b", {}, String(r.count)), read.has(r.n) ? h("span", { class: "ps-read-mark" }, "read here") : null))));
  }

  const byPart = { "01": closings, "02": gate, "03": headings, "04": psalm13, "05": alphabet, "06": quoted };
  return { forPart: (part) => (byPart[part.n] ? byPart[part.n](part) : null) };
})();
