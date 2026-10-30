// Sections 02 and 03. 02: a wall of small horizons, each promise above its own gold line and its call below. 03: two facing pages
// across a dusk that turns to dawn, what the first pages lost on the left and what the last pages answer on the right.
(() => {
  if (!window.HZ) return;
  const { h, refLink, state, setView, onView, page, sectionHead } = HZ;
  const { passages, therefore, noCall, bookends, numbers } = HP;

  // ── 02 The promise, then the therefore ──
  const saysTherefore = (row) => row.link.toLowerCase() === "therefore";
  const tines = therefore.map((row) => h("li", { class: `hz-tine ${saysTherefore(row) ? "hz-tine-therefore" : "hz-tine-smaller"}` },
    h("div", { class: "hz-tine-sky" }, h("p", {}, h("span", { class: "hz-phrase" }, row.promiseText), refLink(row.promise, row.promiseLabel, "hz-row-ref"))),
    h("div", { class: "hz-tine-word" }, h("b", {}, row.link)),
    h("div", { class: "hz-tine-ground" }, h("p", {}, h("span", { class: "hz-phrase" }, row.callText), refLink(row.call, row.callLabel, "hz-row-ref")))));
  // The two passages the page names as having no call: the line stops at the horizon and nothing stands below.
  const stubs = noCall.map((item) => h("li", { class: "hz-tine hz-tine-stub" },
    h("div", { class: "hz-tine-sky" }, h("p", {}, refLink(item.r, item.label, "hz-row-ref"))),
    h("div", { class: "hz-tine-word" }),
    h("div", { class: "hz-tine-ground" }, h("p", {}, h("span", { class: "hz-phrase" }, item.why)))));
  const weighTherefore = h("button", { type: "button", class: "hz-weigh", "aria-pressed": "false", onclick: () => setView({ therefore: !state.therefore }) });
  const comb = h("ol", { class: "hz-comb" }, tines, stubs);
  page.append(h("section", { class: "hz-sec", id: "therefore" },
    sectionHead("02", "The promise.", "Then the therefore.", "Does hope about the end make people passive? Read what comes straight after the promise. The joining word on the line is in the verse."),
    h("div", { class: "hz-reads-row" },
      h("p", { class: "hz-reads" }, `Here are ${numbers.rows} places where a promise about the end is tied to something to do now, and ${numbers.saysTherefore} of them use the word therefore.`),
      weighTherefore),
    h("p", { class: "hz-comb-key" }, h("span", {}, "Above the line: ", h("b", {}, "The promise")), h("span", {}, "On the line: ", h("b", {}, "The word that joins them")), h("span", {}, "Below the line: ", h("b", {}, "The call"))),
    comb,
    h("p", { class: "hz-note" }, `These ${numbers.rows} were chosen because they show the pattern, so they cannot prove it is everywhere. It is not: `,
      noCall.flatMap((item, i) => [i ? "; " : null, refLink(item.r, item.label), `, ${item.why}`]),
      ". In some rows the joining word is the verse's own therefore; in others it is a smaller word, and a reader may weigh those less. Where a row runs from one verse to the next, the verse division is the translators', not the author's.")));

  // ── 03 What was lost, what Revelation answers ──
  const kindLabel = (row) => (row.kind === "shares" ? `Both verses say: ${row.word}` : "This study's matching, and nothing more");
  const endRow = (row) => h("li", { class: `hz-end hz-end-${row.kind}` },
    h("div", { class: "hz-end-first" }, h("span", { class: "hz-phrase" }, row.startText), refLink(row.start, passages[row.start].label, "hz-row-ref")),
    h("div", { class: "hz-end-span" },
      h("h3", {}, row.name),
      h("span", { class: "hz-end-line", "aria-hidden": "true" }),
      row.middle.length
        ? row.middle.map((item) => h("p", { class: "hz-mid" }, h("span", { class: "hz-phrase" }, item.t), refLink(item.r, item.label, "hz-row-ref")))
        : h("p", { class: "hz-none" }, "None drawn here"),
      h("small", { class: "hz-end-kind" }, kindLabel(row))),
    h("div", { class: "hz-end-last" }, h("span", { class: "hz-phrase" }, row.lastText), refLink(row.last, passages[row.last].label, "hz-row-ref")));
  const weighShares = h("button", { type: "button", class: "hz-weigh", "aria-pressed": "false", onclick: () => setView({ shares: !state.shares }) });
  const land = h("ol", { class: "hz-ends" }, bookends.map(endRow));
  page.append(h("section", { class: "hz-lost", id: "lost" },
    h("div", { class: "hz-sec hz-sec-tight" },
      sectionHead("03", "What was lost.", "What Revelation answers.", "How much of the end was already on the first pages? Read each row in order: what Genesis or Exodus says, where a prophet picks it up, and what John sees. Solid line: the same English word in both end verses. Dotted line: a likeness this study is pointing out, which you should weigh."),
      h("div", { class: "hz-reads-row hz-reads-row-end" }, weighShares)),
    h("div", { class: "hz-facing" },
      h("div", { class: "hz-facing-head", "aria-hidden": "true" }, h("span", {}, "The first pages"), h("span", {}), h("span", {}, "The last pages")),
      land),
    h("div", { class: "hz-sec hz-sec-tight" },
      h("p", { class: "hz-note" }, "Compared in the Berean's English only, with no check in Hebrew or Greek, and Revelation uses no quotation formula, so sharing a word does not prove John is quoting. The one identification Revelation makes outright is the deceiver: it names the devil as the ancient serpent twice (", refLink("REV.12.9", "Revelation 12:9"), "; ", refLink("REV.20.2", "Revelation 20:2"), "). Paul makes another himself, calling Christ the last Adam (", refLink("1CO.15.45", "1 Corinthians 15:45"), "). The rest are echoes: a script checks that the words are there and in Bible order, and cannot check that the writer meant the link."))));

  function syncWeigh() {
    weighTherefore.textContent = state.therefore ? `Show all ${numbers.rows} again` : `Weigh only the ${numbers.saysTherefore} that say therefore`;
    weighTherefore.setAttribute("aria-pressed", String(state.therefore));
    comb.classList.toggle("is-therefore", state.therefore);
    weighShares.textContent = state.shares ? `Show all ${numbers.bookends} again` : `Weigh only the ${numbers.shares} that share a word`;
    weighShares.setAttribute("aria-pressed", String(state.shares));
    land.classList.toggle("is-shares", state.shares);
  }
  onView(syncWeigh);
  syncWeigh();
})();
