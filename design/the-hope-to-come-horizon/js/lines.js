// Sections 02 and 03. 02: each promise on the left in its whole verse, its call on the right, its own joining word between them,
// the therefores together and the others together. 03: two facing pages
// across a dusk that turns to dawn, what the first pages lost on the left and what the last pages answer on the right.
(() => {
  if (!window.HZ) return;
  const { h, refLink, state, setView, onView, page, sectionHead } = HZ;
  const { passages, therefore, bookends, numbers } = HP;

  // ── 02 The promise, then the therefore ──
  const saysTherefore = (row) => row.link.toLowerCase() === "therefore";
  const straight = (text) => text.replace(/\u2019/g, "'");
  const verseText = (verses) => verses.map((verse) => verse.t).join(" ");
  const sameVerse = (one, two) => one.c === two.c && one.v === two.v;
  // The whole verse on each side. Where promise and call share a verse, it is cut after whichever comes first, so nothing shows twice.
  function versesOf(row) {
    const promise = passages[row.promise].verses, promiseVerse = promise[promise.length - 1];
    const call = passages[row.call].verses.filter((verse) => !sameVerse(verse, promiseVerse));
    if (call.length) return { promise: verseText(promise), call: verseText(call), callVerse: call[0], promiseVerse };
    const text = verseText(promise), plainText = straight(text);
    const promiseAt = plainText.indexOf(straight(row.promiseText)), callAt = plainText.indexOf(straight(row.callText));
    const firstEnd = promiseAt < callAt ? promiseAt + row.promiseText.length : callAt + row.callText.length;
    const cut = text.indexOf(" ", firstEnd);
    const [first, second] = [text.slice(0, cut), text.slice(cut + 1)];
    return { promise: promiseAt < callAt ? first : second, call: promiseAt < callAt ? second : first, callVerse: promiseVerse, promiseVerse };
  }
  // The verse with its phrase lit and the joining word in gold, where the word falls on this side.
  function litVerse(text, phrase, word, rowId) {
    const plainText = straight(text), at = plainText.indexOf(straight(phrase));
    if (at < 0) console.error(`The hope to come: "${phrase}" is not in its verse (${rowId})`);
    const marks = [{ at, end: at + phrase.length, node: h("mark", { class: "hz-lit" }, phrase) }];
    const wordAt = plainText.toLowerCase().indexOf(word.toLowerCase());
    if (wordAt >= 0 && (wordAt + word.length <= at || wordAt >= at + phrase.length)) marks.push({ at: wordAt, end: wordAt + word.length, node: h("mark", { class: "hz-said" }, text.slice(wordAt, wordAt + word.length)) });
    marks.sort((one, two) => one.at - two.at);
    const parts = [];
    let from = 0;
    marks.forEach((mark) => { parts.push(text.slice(from, mark.at), mark.node); from = mark.end; });
    parts.push(text.slice(from));
    return h("span", { class: "hz-phrase" }, parts);
  }
  // How far apart the promise and its call stand, counted from the verse numbers.
  function apart({ promiseVerse, callVerse }) {
    if (promiseVerse.c !== callVerse.c) return "next chapter";
    const gap = callVerse.v - promiseVerse.v;
    return { 0: "same verse", 1: "next verse", 2: "two verses on", "-1": "the verse before" }[gap];
  }
  function rowsOf(rows) {
    return h("div", { class: "hz-bow" }, h("ol", {}, rows.map((row, i) => {
      const verses = versesOf(row);
      return h("li", {},
        h("div", { class: "hz-bow-promise", style: `grid-row:${i + 1}` }, litVerse(verses.promise, row.promiseText, row.link, row.id), refLink(row.promise, row.promiseLabel, "hz-row-ref")),
        h("div", { class: "hz-bow-link", style: `grid-row:${i + 1}` }, h("p", {}, h("b", {}, row.link), h("small", {}, apart(verses)))),
        h("div", { class: "hz-bow-call", style: `grid-row:${i + 1}` }, litVerse(verses.call, row.callText, row.link, row.id), refLink(row.call, row.callLabel, "hz-row-ref")));
    })));
  }
  page.append(h("section", { class: "hz-sec", id: "therefore" },
    sectionHead("02", "The promise.", "Then the therefore.", "Does hope about the end make people passive? Read what comes straight after the promise. The joining word in the middle is in the verse."),
    h("p", { class: "hz-reads" }, `Here are ${numbers.rows} places where a promise about the end is tied to something to do now, and ${numbers.saysTherefore} of them use the word therefore.`),
    h("p", { class: "hz-bow-key" }, h("span", {}, "The promise"), h("span", {}, "The word that joins them"), h("span", {}, "The call")),
    rowsOf(therefore.filter(saysTherefore)),
    rowsOf(therefore.filter((row) => !saysTherefore(row)))));

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
