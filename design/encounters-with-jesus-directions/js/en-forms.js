// Each group of readings opens in a form its own passage gives: what was left behind, who calls him what, one story folded in another,
// two conversations with two last lines, who gives the reason, one line turning off, and the same words twice with terms handed back.
(() => {
  if (!window.ENK) return;
  const { h, drawing, phrase, refLink } = ENK;
  const item = (entry, className) => h("li", { class: className }, phrase(entry));
  const small = (text) => h("p", { class: "en-small" }, text);

  ENK.FORMS = {
    left: (form) => h("div", { class: "en-f-left" },
      h("ol", {}, form.left.map((entry) => item(entry))),
      h("div", { class: "en-f-arrive" }, small("And the next thing we see"), h("p", {}, phrase(form.arrive)))),
    names: (form) => h("ol", { class: "en-f-names" }, form.names.map((entry) => h("li", {}, h("span", { class: "en-f-voice" }, entry.who), h("span", { class: "en-f-name" }, `“${entry.t}”`), h("span", { class: "en-at" }, refLink(entry.r, entry.label))))),
    braid: (form) => h("div", { class: "en-f-braid" },
      h("div", { class: "en-f-braid-head", "aria-hidden": "true" }, h("span", {}, "Jairus and his daughter"), h("span", {}, "The woman")),
      h("ol", {}, form.strands.map((entry) => h("li", { class: `is-${entry.who}` }, h("span", { class: "en-f-strand-label" }, entry.who === "j" ? "Jairus: " : entry.who === "w" ? "The woman: " : "Back to Jairus: "), phrase(entry))))),
    paths: (form) => h("div", { class: "en-f-paths" },
      h("section", { class: "is-night" }, small("John 3 · He comes to Him"), h("ol", {}, form.night.map((entry) => item(entry))), h("p", { class: "en-f-last" }, phrase(form.nightEnd)), h("p", { class: "en-f-after" }, "And the record gives him no other word here.")),
      h("section", { class: "is-day" }, small("John 4 · Jesus speaks first"), h("ol", {}, form.day.map((entry) => item(entry))), h("p", { class: "en-f-last" }, phrase(form.dayEnd)), h("p", { class: "en-f-after" }, "And the town says, ", phrase(form.dayAfter)))),
    motive: (form) => h("div", { class: "en-f-motive" },
      h("section", {}, small("What Mark tells us"), h("ul", {}, form.narrator.map((entry) => item(entry)))),
      h("figure", {}, drawing("hand", "en-f-hand"), h("figcaption", {}, phrase(form.hand))),
      h("section", {}, small("What Jesus says"), h("ul", {}, form.jesus.map((entry) => item(entry))))),
    turn: (form) => h("div", { class: "en-f-turn" },
      h("ol", { class: "en-f-before" }, form.before.map((entry) => item(entry))),
      h("p", { class: "en-f-off" }, h("span", { class: "en-small" }, "He turns off"), " ", phrase(form.turn)),
      h("ol", { class: "en-f-on" }, form.on.map((entry) => item(entry)))),
    same: (form) => h("div", { class: "en-f-same" },
      h("figure", { class: "en-f-sentence" }, h("blockquote", {}, `“${form.sentence}”`), h("figcaption", {}, "Word for word, each sister: ", form.sentenceIn.map((ref, index) => [index ? " and " : "", refLink(ref.r, ref.label)]))),
      h("div", { class: "en-f-two" },
        h("section", {}, small("Martha"), h("ol", {}, form.martha.map((entry) => item(entry)))),
        h("section", {}, small("Mary"), h("ol", {}, form.mary.map((entry) => item(entry))))),
      small("Thomas's terms, and what Jesus says"),
      h("ol", { class: "en-f-pairs" }, form.pairs.map(([his, given]) => h("li", {}, h("span", {}, phrase(his)), h("span", { class: "en-f-pair-rule", "aria-hidden": "true" }), h("span", {}, phrase(given)))))),
  };
})();
