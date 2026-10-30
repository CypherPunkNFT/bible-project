// Sections 02 and 03. 02: each promise hangs above the horizon, its joining word sits on the line, its call stands below.
// 03: one land told twice, high to low, the first pages on the left and the last on the right, with each thing's line running
// the whole Bible between them and the prophets placed by the order of the books.
(() => {
  if (!window.HZ) return;
  const { h, art, refLink, state, setView, onView, page, sectionHead } = HZ;
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
  // High to low: where each thing sits in a land. This order is the page's layout and nothing more.
  const ABOVE = ["be-11", "be-2", "be-3", "be-9", "be-5", "be-10"];
  const BELOW = ["be-4", "be-6", "be-8", "be-1", "be-7"];
  const wave = (cycles, amplitude, fade = 0) => {
    let d = "M0 10";
    for (let i = 0; i < cycles; i += 1) {
      const a = amplitude * (1 - (fade * i) / cycles);
      const x = (100 / cycles) * i, w = 100 / cycles;
      d += `C${(x + w * .25).toFixed(2)} ${10 - a} ${(x + w * .25).toFixed(2)} ${10 - a} ${(x + w * .5).toFixed(2)} 10S${(x + w * .75).toFixed(2)} ${10 + a} ${(x + w).toFixed(2)} 10`;
    }
    return d;
  };
  // Each line is drawn as the thing it names. Solid or dotted carries the kind of link; the shape claims nothing.
  const LINE = {
    "be-1": wave(16, 5), // the serpent
    "be-2": "M0 16Q50 -8 100 16", // the sky
    "be-3": "M0 17L100 3", // the light
    "be-4": wave(6, 3.5), // the river
    "be-5": "M0 10H100M50 10V2M58 10V4M42 10V4", // the tree
    "be-6": `M0 10${Array.from({ length: 14 }, (_, i) => `L${(i + 1) * 3} ${i % 2 ? 10 : 4}`).join("")}H100`, // thorns on the ground
    "be-7": "M0 4Q50 28 100 4", // death
    "be-8": wave(12, 6, 1), // pain, settling
    "be-9": "M0 2L100 10M0 18L100 10", // apart, then together
    "be-10": "M0 10H100M7 3V17", // the way barred, then open
    "be-11": "M0 10H100", // the face
  };
  const threadSvg = (id, kind) => `<svg viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true" class="hz-thread hz-thread-${kind}"><path d="${LINE[id]}"/></svg>`;
  const BOOKS = { ISA: 23, EZK: 26, ZEC: 38 };
  const canonPercent = (ref) => {
    const book = BOOKS[ref.slice(0, 3)];
    if (!book) console.error(`The hope to come: no book position for ${ref}`);
    return ((book - 1) / 65) * 100;
  };
  const kindLabel = (row) => (row.kind === "shares" ? `Both verses say: ${row.word}` : "This study's matching, and nothing more");
  const byId = new Map(bookends.map((row) => [row.id, row]));
  const endRow = (id, ground) => {
    const row = byId.get(id);
    const places = row.middle.map((item) => canonPercent(item.r));
    const tracks = [];
    places.forEach((place, i) => tracks.push(`${(place - (places[i - 1] ?? 0)).toFixed(2)}%`));
    tracks.push("1fr");
    return h("li", { class: `hz-end hz-end-${row.kind} ${ground ? "hz-end-ground" : ""}` },
      h("div", { class: "hz-end-first" }, h("span", { class: "hz-end-head" }, "First"), h("span", { class: "hz-phrase" }, row.startText), refLink(row.start, passages[row.start].label, "hz-row-ref")),
      h("div", { class: "hz-end-span" },
        h("h3", {}, row.name),
        art(threadSvg(id, row.kind), "hz-thread-wrap"),
        h("div", { class: "hz-end-below", style: `grid-template-columns:${places.length ? tracks.join(" ") : "1fr 1fr"}` },
          row.middle.length
            ? row.middle.map((item, i) => h("span", { class: "hz-mid", style: `grid-column:${i + 2}` }, h("span", { class: "hz-end-head" }, "Between"), h("span", { class: "hz-phrase" }, item.t), refLink(item.r, item.label, "hz-row-ref")))
            : h("span", { class: "hz-none" }, "None drawn here"),
          h("small", { class: "hz-end-kind", style: `grid-column:-2` }, kindLabel(row)))),
      h("div", { class: "hz-end-last" }, h("span", { class: "hz-end-head" }, "Last"), h("span", { class: "hz-phrase" }, row.lastText), refLink(row.last, passages[row.last].label, "hz-row-ref")));
  };
  const axisMark = (label, percent, side) => h("span", { class: `hz-axis-mark hz-axis-${side}`, style: `left:${percent.toFixed(2)}%` }, label);
  const weighShares = h("button", { type: "button", class: "hz-weigh", "aria-pressed": "false", onclick: () => setView({ shares: !state.shares }) });
  const land = h("ol", { class: "hz-ends" }, ABOVE.map((id) => endRow(id, false)), BELOW.map((id) => endRow(id, true)));
  page.append(h("section", { class: "hz-sec hz-sec-ends", id: "lost" },
    sectionHead("03", "What was lost.", "What Revelation answers.", "How much of the end was already on the first pages? Read each row in order: what Genesis or Exodus says, where a prophet picks it up, and what John sees. Solid line: the same English word in both end verses. Dotted line: a likeness this study is pointing out, which you should weigh."),
    h("div", { class: "hz-reads-row" },
      h("p", { class: "hz-reads hz-reads-small" }, "The same land told twice, high to low, with each thing at its own height. The height is only how this page lays them out. On a wide screen the prophets sit where their books come in the Bible."),
      weighShares),
    h("div", { class: "hz-axis", "aria-hidden": "true" },
      h("span", { class: "hz-axis-end" }, "The first pages"),
      h("div", { class: "hz-axis-track" }, axisMark("Isaiah", canonPercent("ISA"), "before"), axisMark("Ezekiel", canonPercent("EZK"), "after"), axisMark("Zechariah", canonPercent("ZEC"), "after")),
      h("span", { class: "hz-axis-end hz-axis-right" }, "The last pages")),
    land,
    h("p", { class: "hz-note" }, "Compared in the Berean's English only, with no check in Hebrew or Greek, and Revelation uses no quotation formula, so sharing a word does not prove John is quoting. The one identification Revelation makes outright is the deceiver: it names the devil as the ancient serpent twice (", refLink("REV.12.9", "Revelation 12:9"), "; ", refLink("REV.20.2", "Revelation 20:2"), "). Paul makes another himself, calling Christ the last Adam (", refLink("1CO.15.45", "1 Corinthians 15:45"), "). The rest are echoes: a script checks that the words are there and in Bible order, and cannot check that the writer meant the link.")));

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
