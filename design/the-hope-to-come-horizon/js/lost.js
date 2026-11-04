// Section 03, in two parts. First, what the first pages lost and what Revelation answers, one card each: a solid line where both
// verses share a word, a dotted line where the likeness is this study's to point out. Second, what Scripture says will be redeemed,
// each in its own words, beside the price it names. Every phrase quoted in the second part is checked against its verse here.
(() => {
  if (!window.HZ) return;
  const { h, refLink, state, setView, onView, page, sectionHead } = HZ;
  const { passages, bookends, numbers } = HP;

  // ── What was lost, and how Revelation answers ──
  const kindLabel = (row) => (row.kind === "shares" ? `Both verses say: ${row.word}` : "This study's matching, and nothing more");
  const side = (tag, text, id, kind) => h("div", { class: `hz-end-${kind}` }, h("span", { class: "hz-end-tag" }, tag), h("p", {}, text), refLink(id, passages[id].label, "hz-row-ref"));
  const lostCard = (row) => h("li", { class: `hz-end hz-end-${row.kind}` },
    h("h4", {}, row.name),
    side("Lost", row.startText, row.start, "first"),
    h("div", { class: "hz-end-span" },
      h("span", { class: "hz-end-line", "aria-hidden": "true" }),
      row.middle.map((item) => h("p", { class: "hz-mid" }, h("span", {}, item.t), " ", refLink(item.r, item.label, "hz-row-ref")))),
    side("Revelation answers", row.lastText, row.last, "last"),
    h("small", { class: "hz-end-kind" }, kindLabel(row)));
  const weighShares = h("button", { type: "button", class: "hz-weigh", "aria-pressed": "false", onclick: () => setView({ shares: !state.shares }) });
  const lostList = h("ol", { class: "hz-ends" }, bookends.map(lostCard));

  // ── What will be redeemed, and how the Bible answers ──
  const REDEEMED = [
    ["Our bodies", [["ROM.8.23", "the redemption of our bodies"], ["PHP.3.21", "transform our lowly bodies to be like His glorious body"]]],
    ["A people of His own", [["TIT.2.14", "to redeem us from all lawlessness and to purify for Himself a people for His own possession"]]],
    ["From every nation", [["REV.5.9", "by Your blood You purchased for God those from every tribe and tongue and people and nation"]]],
    ["Free of the curse", [["GAL.3.13", "Christ redeemed us from the curse of the law by becoming a curse for us"], ["REV.22.3", "No longer will there be any curse"]]],
    ["The creation", [["ROM.8.21", "the creation itself will be set free from its bondage to decay"]]],
    ["Heaven and earth", [["2PE.3.13", "a new heaven and a new earth, where righteousness dwells"], ["ACT.3.21", "the restoration of all things"]]],
  ];
  const PRICE = ["1PE.1.18-19", ["it was not with perishable things such as silver or gold that you were redeemed", "but with the precious blood of Christ, a lamb without blemish or spot."]];
  const ALSO = ["EPH.1.7", "In Him we have redemption through His blood"];
  const textOf = (id) => passages[id].verses.map((verse) => verse.t).join(" ");
  const checked = (id, words) => {
    if (!passages[id] || !textOf(id).includes(words)) console.error(`The hope to come: "${words}" is not in ${id}`);
    return words;
  };
  const said = ([id, words]) => h("p", { class: "hz-said" }, h("q", {}, checked(id, words)), " ", refLink(id, passages[id].label, "hz-row-ref"));
  const price = h("figure", { class: "hz-price" },
    h("span", { class: "hz-end-tag" }, "The price"),
    h("blockquote", {}, `… ${PRICE[1].map((words) => checked(PRICE[0], words)).join(" … ")}`),
    h("figcaption", {}, refLink(PRICE[0], passages[PRICE[0]].label), " · BSB"),
    h("p", { class: "hz-price-also" }, h("q", {}, checked(...ALSO)), " ", refLink(ALSO[0], passages[ALSO[0]].label, "hz-row-ref")));

  page.append(h("section", { class: "hz-sec hz-lost", id: "lost" },
    sectionHead("03", "What was lost.", "What will be redeemed.", "The Bible's first pages record what was lost. Its last pages answer it, and in between, Scripture names what God will buy back and the price He paid."),
    h("div", { class: "hz-part" },
      h("header", { class: "hz-part-head" },
        h("div", {},
          h("h3", {}, "What was lost, ", h("em", {}, "and how Revelation answers")),
          h("p", {}, "Each card reads from top to bottom: what Genesis or Exodus says, where a prophet picks it up, and what John sees. Solid line: the same English word in both verses. Dotted line: a likeness this study is pointing out, which you should weigh.")),
        weighShares),
      lostList,
      h("p", { class: "hz-note" }, "Compared in the Berean's English only, with no check in Hebrew or Greek, and Revelation uses no quotation formula, so sharing a word does not prove John is quoting. The one identification Revelation makes outright is the deceiver: it names the devil as the ancient serpent twice (", refLink("REV.12.9", "Revelation 12:9"), "; ", refLink("REV.20.2", "Revelation 20:2"), "). Paul makes another himself, calling Christ the last Adam (", refLink("1CO.15.45", "1 Corinthians 15:45"), "). The rest are echoes: a script checks that the words are there and in Bible order, and cannot check that the writer meant the link.")),
    h("div", { class: "hz-part" },
      h("header", { class: "hz-part-head" },
        h("div", {},
          h("h3", {}, "What will be redeemed, ", h("em", {}, "and how the Bible answers")),
          h("p", {}, "To redeem is to buy back. Here is what Scripture says God will redeem or set free, each in the Bible's own words, and the price it names."))),
      h("div", { class: "hz-redeemed" },
        price,
        h("ol", { class: "hz-free" }, REDEEMED.map(([name, lines]) => h("li", {}, h("h4", {}, name), lines.map(said))))))));

  function syncWeigh() {
    weighShares.textContent = state.shares ? `Show all ${numbers.bookends} again` : `Weigh only the ${numbers.shares} that share a word`;
    weighShares.setAttribute("aria-pressed", String(state.shares));
    lostList.classList.toggle("is-shares", state.shares);
  }
  onView(syncWeigh);
  syncWeigh();
})();
