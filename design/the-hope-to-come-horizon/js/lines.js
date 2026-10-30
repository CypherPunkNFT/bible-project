// Sections 02 and 03. 02: promises on the left, calls on the right. Ten threads run through one word and back out to their own call;
// the other seven each pass through a word of their own. 03: two facing pages
// across a dusk that turns to dawn, what the first pages lost on the left and what the last pages answer on the right.
(() => {
  if (!window.HZ) return;
  const { h, refLink, state, setView, onView, page, sectionHead } = HZ;
  const { passages, therefore, noCall, bookends, numbers } = HP;

  // ── 02 The promise, then the therefore ──
  const saysTherefore = (row) => row.link.toLowerCase() === "therefore";
  const NS = "http://www.w3.org/2000/svg";
  const promiseCell = (row, line) => h("div", { class: "hz-bow-promise", style: `grid-row:${line}` }, h("span", { class: "hz-phrase" }, row.promiseText), refLink(row.promise, row.promiseLabel, "hz-row-ref"));
  const callCell = (row, line) => h("div", { class: "hz-bow-call", style: `grid-row:${line}` }, h("span", { class: "hz-phrase" }, row.callText), refLink(row.call, row.callLabel, "hz-row-ref"));
  // Reading one row lights its own thread and quiets the others.
  function lightable(item, group, threads) {
    const set = (on) => {
      group.classList.toggle("has-lit", on);
      item.classList.toggle("is-lit", on);
      threads.forEach((thread) => thread.classList.toggle("is-lit", on));
    };
    item.addEventListener("mouseover", () => set(true));
    item.addEventListener("mouseout", () => set(false));
    item.addEventListener("focusin", () => set(true));
    item.addEventListener("focusout", () => set(false));
    return item;
  }
  // The threads are stretched to the rows, which all share one height, so each ends level with its text at any width.
  function thread(d, kind) {
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("class", `hz-thread hz-thread-${kind}`);
    path.setAttribute("vector-effect", "non-scaling-stroke");
    return path;
  }
  function oneWord(rows) {
    const list = h("ol", {}), lines = document.createElementNS(NS, "svg"), mid = rows.length * 50;
    lines.setAttribute("viewBox", `0 0 1000 ${rows.length * 100}`);
    lines.setAttribute("preserveAspectRatio", "none");
    lines.setAttribute("aria-hidden", "true");
    const group = h("div", { class: "hz-bow hz-bow-one", style: `--rows:${rows.length}` },
      h("div", { class: "hz-bow-lines" }, lines),
      h("p", { class: "hz-bow-hub" }, h("b", {}, rows[0].link)),
      list);
    rows.forEach((row, i) => {
      const y = i * 100 + 50;
      const threads = [thread(`M0 ${y}C130 ${y} 130 ${mid} 250 ${mid}`, "in"), thread(`M750 ${mid}C870 ${mid} 870 ${y} 1000 ${y}`, "out")];
      lines.append(...threads);
      list.append(lightable(h("li", {}, promiseCell(row, i + 1), callCell(row, i + 1)), group, threads));
    });
    return group;
  }
  function ownWords(rows) {
    const list = h("ol", {}), group = h("div", { class: "hz-bow hz-bow-own", style: `--rows:${rows.length}` }, list);
    rows.forEach((row, i) => list.append(lightable(h("li", {},
      promiseCell(row, i + 1),
      h("div", { class: "hz-bow-link", style: `grid-row:${i + 1}` }, h("b", {}, row.link)),
      callCell(row, i + 1)), group, [])));
    return group;
  }
  // The two passages the page names as having no call: the thread stops, and nothing comes out the other side.
  const stubs = h("div", { class: "hz-bow hz-bow-stops", style: `--rows:${noCall.length}` }, h("ol", {}, noCall.map((item, i) => h("li", {},
    h("div", { class: "hz-bow-promise", style: `grid-row:${i + 1}` }, refLink(item.r, item.label, "hz-row-ref")),
    h("div", { class: "hz-bow-stop", style: `grid-row:${i + 1}`, "aria-hidden": "true" }),
    h("div", { class: "hz-bow-call", style: `grid-row:${i + 1}` }, h("span", { class: "hz-phrase" }, item.why))))));
  page.append(h("section", { class: "hz-sec", id: "therefore" },
    sectionHead("02", "The promise.", "Then the therefore.", "Does hope about the end make people passive? Read what comes straight after the promise. The joining word in the middle is in the verse."),
    h("p", { class: "hz-reads" }, `Here are ${numbers.rows} places where a promise about the end is tied to something to do now, and ${numbers.saysTherefore} of them use the word therefore.`),
    h("p", { class: "hz-bow-key" }, h("span", {}, "The promise"), h("span", {}, "The word that joins them"), h("span", {}, "The call")),
    oneWord(therefore.filter(saysTherefore)),
    ownWords(therefore.filter((row) => !saysTherefore(row))),
    stubs,
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
    weighShares.textContent = state.shares ? `Show all ${numbers.bookends} again` : `Weigh only the ${numbers.shares} that share a word`;
    weighShares.setAttribute("aria-pressed", String(state.shares));
    land.classList.toggle("is-shares", state.shares);
  }
  onView(syncWeigh);
  syncWeigh();
})();
