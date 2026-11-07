// The figures of Money, possessions and generosity, each drawn from data.js (built and proved by figures.py). Every
// word in them is a verse's words or the study's own; build-data.py refuses anything else. Text goes in as text nodes.
window.MPFigures = (() => {
  let h, refLink, passages, sections;
  const SVG = "http://www.w3.org/2000/svg";
  const svg = (tag, attrs = {}, ...children) => {
    const node = document.createElementNS(SVG, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    node.append(...children);
    return node;
  };
  const SHORT = { "1 Chronicles": "1 Chr", Deuteronomy: "Deut", Malachi: "Mal", Proverbs: "Prov", Luke: "Luke", Mark: "Mark" };
  let stamps = 0;

  // A postmark: the book and verse inside a ring, the section named around it, cancel lines beside. Shape and words
  // say where the line was spoken; the section colour says it again.
  function postmark(label, section) {
    const id = `mp-ring-${++stamps}`;
    const [, book, place] = /^(.+?) (\d+:[\d–]+)$/.exec(label) || [, label, ""];
    const ring = (sections[section] || "").split(" · ")[0].toUpperCase();
    return svg("svg", { class: `mp-stamp is-${section}`, viewBox: "0 0 120 84", "aria-hidden": "true" },
      svg("defs", {}, svg("path", { id, d: "M42 72a30 30 0 1 1 0.1 0" })),
      svg("circle", { cx: "42", cy: "42", r: "38", class: "mp-stamp-ring" }),
      svg("circle", { cx: "42", cy: "42", r: "24", class: "mp-stamp-inner" }),
      svg("text", { class: "mp-stamp-around" }, svg("textPath", { href: `#${id}`, startOffset: "4%" }, `${ring} · ${ring} ·`)),
      svg("text", { x: "42", y: "40", class: "mp-stamp-book", "text-anchor": "middle" }, SHORT[book] || book),
      svg("text", { x: "42", y: "54", class: "mp-stamp-place", "text-anchor": "middle" }, place),
      svg("path", { class: "mp-stamp-cancel", d: "M84 30c6-4 10 4 16 0s10 4 16 0M84 42c6-4 10 4 16 0s10 4 16 0M84 54c6-4 10 4 16 0s10 4 16 0" }));
  }

  // The address lines: a label in small capitals over each line, joined by fine rules, as an address is written.
  function addressLines(lines) {
    return h("dl", { class: "mp-address" }, lines.map(([field, name, words, key]) => h("div", { class: `is-${field}` },
      h("dt", {}, name), h("dd", {}, key ? h("q", {}, words) : words, key ? [" ", refLink(key, passages[key].label)] : ""))));
  }

  // 00: lines as they are often heard, then with their address on. One switch turns the whole board.
  function heard(rows, view, setView) {
    const board = h("ol", { class: `mp-board is-${view}` }, rows.map((row) => h("li", { class: `is-${row.section}` },
      postmark(row.label, row.section),
      h("div", { class: "mp-board-body" },
        h("p", { class: "mp-board-line" }, h("q", {}, row.line), " ", refLink(row.r, row.label)),
        h("p", { class: "mp-board-heard" }, h("span", { class: "mp-label" }, "How it is often heard"), " ", row.heard.replace(/^./, (c) => c.toUpperCase()), "."),
        h("div", { class: "mp-board-address" }, addressLines(row.lines),
          row.part ? h("a", { class: "mp-board-go", href: `#part-${row.part}` }, `Read it in part ${row.part}`, h("span", { "aria-hidden": "true" }, " →")) : h("a", { class: "mp-board-go", href: "?q=prosperity#questions" }, "Read it in the questions", h("span", { "aria-hidden": "true" }, " →")))))));
    const buttons = [["heard", "As it is often heard"], ["address", "With its address"]].map(([value, text]) =>
      h("button", { type: "button", class: "mp-switch", "aria-pressed": String(view === value), onclick: () => {
        board.className = `mp-board is-${value}`;
        buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === buttons[value === "heard" ? 0 : 1])));
        setView(value);
      } }, text));
    return h("figure", { class: "mp-fig mp-heard" },
      h("div", { class: "mp-switches", role: "group", "aria-label": "How to read the lines" }, buttons),
      board,
      h("figcaption", {}, "Five lines from the study, each lifted out of its setting somewhere. Choose “With its address” to read who first heard each one, what it was for, and what it does not promise. Every address line is the study’s own words or the verse’s, checked by script."));
  }

  // The address beside each part's heading.
  const partAddress = (item, readings) => h("div", { class: `mp-part-address is-${item.section}` },
    postmark(passages[readings[0]].label, item.section), addressLines(item.lines));

  // 01: four gifts rising, then "then" and the heart.
  function order(fig) {
    let gift = 0;
    return h("figure", { class: "mp-fig mp-order" },
      h("p", { class: "mp-fig-q" }, "What comes before the proud heart?"),
      h("ol", {}, fig.steps.map((step) => h("li", { class: `is-${step.kind}`, style: step.kind === "gift" ? `--step:${++gift}` : `--step:${gift}` },
        h("span", { class: "mp-order-bar", "aria-hidden": "true" }), h("span", { class: "mp-order-words" }, step.words)))),
      h("figcaption", {}, fig.read, " ", refLink(fig.r, fig.label)));
  }

  // 02: every word in David's prayer that speaks to God, and every word for the givers, verse by verse.
  function yours(fig) {
    return h("figure", { class: "mp-fig mp-yours" },
      h("p", { class: "mp-fig-q" }, "In David’s prayer, who is spoken of more: God or the givers?"),
      h("ul", { class: "mp-yours-key" },
        h("li", {}, h("i", { class: "is-y" }), h("b", {}, String(fig.you)), " words speak to God: You, Your, Yours"),
        h("li", {}, h("i", { class: "is-w" }), h("b", {}, String(fig.we)), " words for the givers: I, me, my, we, us, our")),
      h("ol", { class: "mp-yours-rows" }, fig.verses.map((verse) => h("li", {},
        refLink(`1CH.${verse.v.replace(":", ".")}`, verse.v),
        h("span", { class: "mp-yours-dots", "aria-label": `${verse.y} for God, ${verse.w} for the givers` },
          Array.from({ length: verse.y }, () => h("i", { class: "is-y" })), Array.from({ length: verse.w }, () => h("i", { class: "is-w" })))))),
      h("figcaption", {}, `Counted by script in the Berean, ${fig.label}: ${fig.you} words speak to God and ${fig.we} speak of the givers. Choose a verse number to read it. A count of words, not a measure of the prayer.`));
  }

  // 03: six years of the rabbis' count, and the four guests of Deuteronomy 14:29.
  function tithe(fig) {
    return h("figure", { class: "mp-fig mp-tithe" },
      h("p", { class: "mp-fig-q" }, "Where did the tenth go, year by year?"),
      h("ol", { class: "mp-years" }, fig.years.map((y) => h("li", { class: `is-${y.kind}` },
        h("span", { class: "mp-year-mark", "aria-hidden": "true" }), h("b", {}, `Year ${y.year}`),
        h("span", {}, y.kind === "poor" ? "Left in the towns, for those in need" : "Eaten as a feast before the LORD")))),
      h("ul", { class: "mp-guests" }, fig.guests.map((g) => h("li", {}, h("b", {}, g.word.replace(/^the /, "The ")), h("span", {}, g.why)))),
      h("figcaption", {}, "Deuteronomy says “", fig.three, "” ", refLink(fig.threeRef, "14:28"), ". The six years drawn here follow the rabbis’ reading, as the study summarises it: the third and sixth for the poor, the others eaten as a feast. The four guests are named in ", refLink(fig.guestsRef, "Deuteronomy 14:29"), "."));
  }

  // 05: the two bills the manager rewrites.
  function bills(rows) {
    return h("figure", { class: "mp-fig mp-bills" },
      h("p", { class: "mp-fig-q" }, "What did the manager write?"),
      rows.map((bill) => h("div", { class: "mp-bill" },
        h("span", { class: "mp-bill-name" }, `A hundred measures of ${bill.what}`, " ", refLink(bill.r, bill.ref)),
        h("span", { class: "mp-bill-bar", style: `--now:${bill.now}%`, "aria-hidden": "true" }, h("i"), h("s")),
        h("span", { class: "mp-bill-n" }, h("s", {}, String(bill.was)), " ", h("b", {}, String(bill.now))))),
      h("figcaption", {}, "One bill is cut by half, the other by a fifth. The story still calls him “the dishonest manager”; he is commended for being shrewd."));
  }

  // 06: Luke 16:25 as a crossing, and the thread of the gate.
  function reversal(fig) {
    const [rich, lazarus] = fig.rows;
    return h("figure", { class: "mp-fig mp-reversal" },
      h("p", { class: "mp-fig-q" }, "What changes places, and what was at the gate?"),
      h("div", { class: "mp-cross" },
        h("span", { class: "mp-label" }, "During your lifetime"), h("span"), h("span", { class: "mp-label" }, "But now"),
        h("p", {}, h("b", {}, rich.who), h("q", {}, rich.then)),
        svg("svg", { class: "mp-cross-lines", viewBox: "0 0 100 100", preserveAspectRatio: "none", "aria-hidden": "true" },
          svg("path", { d: "M0 20L100 80", class: "is-rich" }), svg("path", { d: "M0 80L100 20", class: "is-lazarus" })),
        h("p", {}, h("b", {}, lazarus.who), h("q", {}, lazarus.now)),
        h("p", {}, h("b", {}, lazarus.who), h("q", {}, lazarus.then)),
        h("p", {}, h("b", {}, rich.who), h("q", {}, rich.now))),
      h("p", { class: "mp-cross-ref" }, "Abraham’s words, ", refLink(fig.r, fig.label), ". The rich man’s line is solid, Lazarus’s dashed."),
      h("ol", { class: "mp-gate" }, fig.gate.map((step) => h("li", {}, h("span", { class: "mp-label" }, step.note), h("q", {}, step.words), " ", refLink(step.r, step.ref)))));
  }

  // 07: what each gift left behind. Proportions only; Mark gives no amounts for the rich.
  function coins(fig) {
    return h("figure", { class: "mp-fig mp-coins" },
      h("p", { class: "mp-fig-q" }, "How does Jesus measure a gift?"),
      fig.sides.map((side) => h("div", { class: `mp-coin-row ${side.kept ? "is-kept" : "is-all"}` },
        h("b", {}, side.who),
        h("span", { class: "mp-coin-bar", "aria-hidden": "true" }, h("i"), side.kept ? h("s") : null),
        h("span", { class: "mp-coin-words" }, h("q", {}, side.words), side.kept ? " · given, and much kept" : " · given, nothing kept"))),
      h("figcaption", {}, "Illustrative proportions only: Mark gives no amounts for the rich. Her gift was “", fig.gift, "” ", refLink(fig.giftR, "12:42"), "; ", refLink(fig.r, fig.ref), " says what each gift left behind."));
  }

  // The close: the habit as a loop of five steps, the last returning to the first.
  const way = (steps) => h("ol", { class: "mp-way" }, steps.map((step) => h("li", {}, h("span", { class: "mp-way-n" }, step.n), h("b", {}, step.name), h("span", {}, step.words))));

  return {
    use(tools) { ({ h, refLink, passages, sections } = tools); },
    heard, partAddress, order, yours, tithe, bills, reversal, coins, way,
  };
})();
