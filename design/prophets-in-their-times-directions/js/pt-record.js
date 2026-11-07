// The record with its silences: eighteen names, six marks each. A name opens that prophet's six lines; the marks are drawn, not buttons.
(() => {
  if (!window.PTK) return;
  const { h, refLink, runs, plain, page, sectionHead, readings, questions } = PTK;
  const { prophets, numbers } = window.PT;
  const KIND_WORDS = { given: "given", named: "named later", quoted: "quoted, name not given", silent: "no account found" };
  const word = (q) => plain(readings.get(q).word);
  const mark = (kind) => h("span", { class: `pt-dot pt-dot-${kind}`, "aria-hidden": "true" });
  const rows = prophets.map((prophet) => h("li", { class: prophet.basis === "kings" ? "is-kings" : "" },
    h("button", { type: "button", class: "pt-row", "data-prophet": prophet.id, onclick: (event) => PTK.openProphet(prophet.id, event.currentTarget),
      "aria-label": `${prophet.name}: ${questions.map((q) => `${word(q)}, ${KIND_WORDS[prophet.record[q].kind]}`).join("; ")}. Opens the six lines.` },
    h("span", { class: "pt-row-name" }, prophet.name, prophet.basis === "kings" ? h("small", {}, "in Kings") : null),
    questions.map((q) => mark(prophet.record[q].kind)))));
  PTK.drawProphet = (holder, prophet) => {
    holder.replaceChildren(
      h("p", { class: "pt-small" }, prophet.basis === "kings" ? "Six lines · in Kings, no book of the name" : "Six lines · from the book and elsewhere"),
      h("h3", { tabindex: "-1" }, prophet.name),
      h("ol", { class: "pt-lines" }, questions.map((q) => {
        const line = prophet.record[q];
        return h("li", { class: line.kind === "silent" ? "is-empty" : "" },
          h("b", {}, word(q)),
          line.kind === "silent" ? h("p", {}, q === "remembrance" ? "This page lists no later naming." : "No account found.") : h("p", {}, line.kind === "quoted" ? "Quoted, name not given: " : "", `“${line.words}” `, refLink(line.r, line.label)),
          line.note.length ? h("p", { class: "pt-line-note" }, runs(line.note)) : null);
      })),
      h("p", { class: "pt-sheet-links" }, h("a", { href: `/people/${prophet.person}` }, `${prophet.name} among the people of Scripture →`), h("a", { href: "/study/prophets" }, "The prophets timeline →")));
  };
  page.append(h("section", { class: "t-sec pt-record", id: "record" },
    sectionHead("03", "The record,", "with its silences",
      `Six lines for each of the eighteen. ${numbers.lines - numbers.silent} of ${numbers.lines} carry a verse. ${numbers.calls} of the eighteen have a line under calling and ${numbers.responses} under response. An empty mark says only that this study found no such account in the book or the narrative naming that prophet. It is not proof that nothing happened.`),
    h("div", { class: "pt-record-head", "aria-hidden": "true" }, h("span"), questions.map((q) => h("span", {}, word(q)))),
    h("ul", { class: "pt-rows" }, rows),
    h("p", { class: "pt-legend" }, mark("given"), " a verse gives it ", mark("quoted"), " quoted later, name not given ", mark("silent"), " no account found. On a narrow screen the marks run in the order ", questions.map(word).join(", "), ".")));
})();
