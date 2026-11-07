// Fear, anxiety and despair, one mock-up page drawn from data.js (built by build-data.py from content.md).
// Its shape is the study's habit: when a passage records someone's darkest words, keep reading to what God does next.
// Help comes first, before the heading's lead; then the distances from each cry to the next thing the text records;
// then six parts, each opening with its cry and its answer joined by a "keep reading" line.
(() => {
  const C = window.FADCore;
  if (!C) return;
  const { h, art, refLink, label, verseText, runs } = C;
  const D = window.FAD;
  const { study, passages, numbers } = D;
  const { intro, close } = study;
  const Art = window.FADArt;
  const main = C.mount();
  const page = h("div", { class: "wrap t-page fad-page" });
  main.append(page);
  const curl = (text) => text.replace(/"([^"]*)"/g, "“$1”").replaceAll("'", "’");
  const toPart = (n) => n === "close" ? h("a", { class: "fad-to", href: "#close" }, "→ the close") : h("a", { class: "fad-to", href: `#part-${n}` }, `→ part ${n}`);

  // ── Help first: before the lead and before any teaching, as the study asks. Every line visible. ──
  const care = study.help.filter((b) => b.k !== "list");
  const list = study.help.find((b) => b.k === "list");
  page.append(h("section", { class: "fad-help", id: "help", "aria-labelledby": "fad-help-title" },
    h("h2", { id: "fad-help-title", class: "fad-label" }, "Help first"),
    h("p", { class: "fad-help-lead" }, runs(care[0].runs)),
    h("ul", { class: "fad-lines" }, list.items.map((item) => h("li", {}, h("span", { class: "fad-country" }, item.label), h("span", { class: "fad-line-text" }, runs(item.runs, true))))),
    h("p", { class: "fad-help-note" }, "† Each line is still to be confirmed before this page is published; the points are listed at the foot of the page."),
    h("div", { class: "fad-help-more" }, care.slice(1).map((b) => h("p", {}, runs(b.runs))))));

  // ── The standard heading: trail, concepts, title, lead, the verse, the drawing with its motto; then the counts ──
  const opening = intro.quotes[0];
  const figures = [
    ["Passages walked", numbers.walked, "each read in its setting, from the cry to what follows", "Main readings of parts 01–06"],
    ["Verses printed", numbers.versesShown, "in full, word for word the Berean, so you can check them here", "Counted once each; checked by script"],
    ["Darkest words, read on", numbers.rows, "each followed to the next thing the text records", "Section 00; distances counted by script"],
    ["Elders sent to Moses", numbers.elders, "to share the weight he said he could not carry alone", "“seventy of the elders”, Numbers 11:16"],
  ];
  page.append(h("section", { class: "fad-hero", id: "top" },
    h("div", { class: "fad-intro" },
      h("div", {},
        h("nav", { class: "fad-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=life" }, "Living the Christian Life"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "fad-here", "aria-current": "page" }, study.title)),
        h("p", { class: "fad-concepts" }, intro.concepts.join(" · ")),
        h("h1", {}, D.title[0], " ", h("em", {}, D.title[1])),
        h("p", { class: "fad-lede" }, runs(intro.lead)),
        h("figure", { class: "fad-opening" }, h("blockquote", {}, verseText(opening.r)), h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "fad-hero-art" }, art(Art.hero, "fad-art"), h("figcaption", { class: "fad-motto" }, h("i"), intro.motto[0], h("br"), h("span", {}, intro.motto[1])))),
    h("dl", { class: "fad-figures" }, figures.map(([name, value, means, rule]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, means), h("small", { class: "fad-rule" }, rule)))),
    h("nav", { class: "fad-toc", "aria-label": "On this page" },
      h("a", { href: "#help" }, h("b", {}, "!"), "Help first"),
      h("a", { href: "#read-on" }, h("b", {}, "00"), "Keep reading"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title.split(": ")[1] ?? p.title)),
      h("a", { href: "#asked" }, h("b", {}, "?"), "Questions readers bring"),
      h("a", { href: "#close" }, h("b", {}, "→"), "What God does next"))));

  const sectionHead = (number, title, turn, lead) => h("header", { class: "fad-head" },
    h("span", { class: "fad-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead ? h("p", {}, lead) : null));

  // ── 00 Keep reading: how far it is, in verses, from each cry to the next thing the text records ──
  const ROW_IDS = D.rows.map((r) => r.id);
  const reading = h("div", { class: "fad-reading", "aria-live": "polite" });
  const TICKS = 12;
  function track(r) {
    const ticks = Math.min(r.gap, TICKS);
    return h("span", { class: `fad-track${r.turns ? "" : " is-open"}${r.gap === 0 ? " is-same" : ""}`, "aria-hidden": "true" },
      h("i", { class: "fad-cry-dot" }),
      Array.from({ length: Math.max(ticks - 1, 0) }, () => h("i", { class: "fad-tick" })),
      r.gap > TICKS ? h("span", { class: "fad-break" }, "≈") : null,
      r.turns ? h("i", { class: "fad-next-dot" }) : h("i", { class: "fad-end" }));
  }
  const gapWords = (r) => r.gap === 0 ? "the same sentence" : !r.turns ? `${r.gap} verses on, the psalm ends` :
    `${r.gap} verse${r.gap === 1 ? "" : "s"} later${r.chapters > 1 ? `, ${r.chapters} chapters on` : r.chapters === 1 ? ", in the next chapter" : ""}`;
  const buttons = D.rows.map((r) => h("button", { type: "button", class: `fad-row${r.turns ? "" : " is-open"}`, "aria-pressed": "false", "data-row": r.id, onclick: () => showRow(r.id, true) },
    h("span", { class: "fad-who" }, r.who),
    h("q", { class: "fad-cry" }, r.cry),
    track(r),
    h("span", { class: "fad-gap" }, gapWords(r)),
    h("span", { class: "fad-next" }, h("small", {}, r.actor), h("q", {}, r.next))));
  function showRow(id, push) {
    const r = D.rows.find((x) => x.id === id);
    if (!r) return;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.row === id)));
    reading.replaceChildren(
      h("p", {}, label("The cry", "is-cry"), h("span", {}, verseText(r.cr)), " ", refLink(r.cr)),
      h("p", { class: "fad-reading-gap" }, gapWords(r)),
      h("p", {}, label(r.turns ? "What comes next" : "How the psalm ends", "is-next"), h("span", {}, verseText(r.nr)), " ", refLink(r.nr), " ", toPart(r.part)));
    if (push) C.setParam("row", id);
  }
  const askedRow = new URLSearchParams(location.search).get("row");
  showRow(ROW_IDS.includes(askedRow) ? askedRow : "elijah", false);
  page.append(h("section", { class: "t-sec fad-readon", id: "read-on" },
    sectionHead("00", "Keep reading", "to what God does next.", "The habit this study teaches, drawn once: someone's darkest words on the left, the next thing the text records on the right, and the verses between."),
    h("p", { class: "fad-words" }, runs(intro.words)),
    h("figure", { class: "fad-distances" },
      h("figcaption", { class: "fad-fig-q" }, h("strong", {}, "How far is it from the cry to what God does next?"), " For Moses, Elijah and Paul, a verse or two. For Job, thirty-five chapters. Heman's psalm has no turn, and it is still a prayer to God. Choose a row to read both verses here."),
      h("div", { class: "fad-rows", role: "group", "aria-label": "Eight cries and what follows" }, buttons),
      reading,
      h("p", { class: "fad-rule-note" }, "Each mark on a line is one verse of the Berean, counted by script; past twelve the line is broken. Jonah's cry in part 03 is read there, not drawn here, because the page does not set words of wanting to die in large type.")),
    h("aside", { class: "fad-selection" }, label("This is a selection"), h("p", {}, runs(intro.selection)))));

  // ── Each part's own figure (js/fad-figures.js) and the blocks of its text ──
  const FIG = window.FADFigures(C, D);
  const FIGURES = { "01": [[1, FIG.match]], "02": [[3, FIG.care]], "03": [[2, FIG.swing]], "04": [[0, FIG.refrain], [1, FIG.dark]], "05": [[1, FIG.though]], "06": [[1, FIG.reasons]] };
  const NOTE = { care: "With care", read: "How this study reads it" };
  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "quote": return h("figure", { class: "fad-quote" }, h("blockquote", {}, block.part ? block.t : verseText(block.r)),
        h("figcaption", {}, refLink(block.r, block.label), block.part ? " · part of the verse · BSB" : " · BSB"));
      case "care": case "read": return h("aside", { class: `fad-note is-${block.k}` }, label(NOTE[block.k]), h("p", {}, runs(block.runs)));
      case "source": return h("aside", { class: "fad-note is-source" }, label(`From outside Scripture · ${block.src}`), h("p", {}, runs(block.runs)));
      default: console.error(`${C.NAME}: unknown block ${block.k}`); return "";
    }
  }
  const parts = h("div", { class: "fad-parts" });
  study.parts.forEach((part) => {
    const figs = FIGURES[part.n] ?? [];
    const curled = curl(part.title);
    const [plain, turn] = curled.includes(": ") ? curled.split(/: (.+)/) : [curled, ""];
    parts.append(h("section", { class: "t-sec fad-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "fad-part-head" },
        h("span", { class: "fad-n", "aria-hidden": "true" }, part.n),
        h("div", { class: "fad-part-titles" },
          h("h2", { id: `part-${part.n}-title` }, plain, part.titleNotes.map((w) => runs([{ w }])), turn ? [h("br"), h("em", {}, turn)] : null),
          h("p", { class: "fad-readings" }, label("Main readings"), " ", part.readings.map((r, i) => [i ? " · " : "", refLink(r.r, r.t)]))),
        art(Art.parts[part.n], "fad-mini-wrap")),
      h("div", { class: "fad-pair" },
        h("p", { class: "fad-hook" }, runs(part.hook)),
        h("span", { class: "fad-keep", "aria-hidden": "true" }, "keep reading"),
        h("p", { class: "fad-line" }, label("What the passage shows", "is-next"), runs(part.line))),
      h("div", { class: "fad-body" },
        part.setting ? h("p", { class: "fad-setting" }, label("The setting"), runs(part.setting)) : null,
        part.subs.map((sub, i) => [h("h3", { class: "fad-sub" }, curl(sub.title)), sub.blocks.map(renderBlock), figs.filter(([at]) => at === i).map(([, draw]) => draw())]),
        part.limit ? h("aside", { class: "fad-note is-limit" }, label("Its limits"), h("p", {}, runs(part.limit))) : null,
        (part.after ?? []).map(renderBlock)),
      h("dl", { class: "fad-askback" },
        h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
        h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect))))));
  });
  page.append(parts);

  // ── Questions readers bring: words on one stem, joined by rules, opening in place. "Does God want me to live?" is open. ──
  page.append(h("section", { class: "t-sec fad-asked", id: "asked" },
    sectionHead("?", "Questions", "readers bring."),
    h("div", { class: "fad-qs" }, study.questions.map((q) => h("details", { open: /want me to live/.test(q.q) },
      h("summary", {}, curl(q.q)), h("div", { class: "fad-answer" }, q.blocks.map(renderBlock)))))));

  // ── Close: the way of reading, "We despaired… but God", the question, and 1 Kings 19:1–18 read whole ──
  page.append(h("section", { class: "t-sec fad-close", id: "close" },
    art(Art.close, "fad-close-art"),
    sectionHead("→", "Keep reading", "to what God does next."),
    h("p", { class: "fad-way" }, runs(close.way)),
    h("ol", { class: "fad-recap" }, D.rows.map((r) => h("li", { class: r.turns ? "" : "is-open" }, h("b", {}, r.who), h("span", {}, r.actor)))),
    h("p", { class: "fad-close-text" }, runs(close.close)),
    close.closeBlocks.map(renderBlock),
    h("p", { class: "fad-invite" }, runs(close.invite)),
    h("aside", { class: "fad-note is-care" }, label("Help"), h("p", {}, runs(close.help), " ", h("a", { class: "fad-link", href: "#help" }, "Back to the help at the top"))),
    h("p", { class: "fad-question" }, label("Your question"), runs(close.question)),
    h("p", { class: "fad-again" }, runs(close.again)),
    h("figure", { class: "fad-passage" }, h("blockquote", {}, passages[close.passage].verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), " ", text, " "))),
      h("figcaption", {}, refLink(close.passage), " · Berean Standard Bible. Elijah under the broom tree, read whole.")),
    h("div", { class: "fad-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, D.sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use))),
      h("details", {}, h("summary", {}, `Quotations from outside Scripture: ${numbers.outside}, of which ${numbers.outsideHeld} was checked by script`),
        h("ul", {}, D.outside.map((o) => h("li", {}, h("q", {}, o.t), " ", h("span", { class: "fad-from" }, `${o.from} · ${o.checked ? "checked by script" : "not held here; compare by eye"}`))))),
      h("details", {}, h("summary", {}, `Wording for the owner: ${numbers.wording} quotations, each marked † in the text, are not the Berean's words`),
        h("ul", {}, collectWording().map((w) => h("li", {}, h("q", {}, w.said), " · the Berean reads ", h("q", {}, w.bsb), " ", refLink(w.r))))),
      h("details", {}, h("summary", {}, `Still to confirm before publishing: ${numbers.openChecks} points, each marked “to confirm” in the text`),
        h("ul", {}, D.openChecks.map((c) => h("li", {}, h("b", {}, c.part === "help" ? "Help first. " : c.part === "intro" ? "Opening. " : `Part ${c.part}. `), c.note))))),
    h("a", { class: "fad-back", href: "/study/theology?area=life" }, art(icon("arrowLeft", 16)), "Back to Living the Christian Life")));

  function collectWording() {
    const found = [];
    JSON.stringify(study, (key, value) => { if (key === "w" || (key === "titleNotes" && Array.isArray(value))) [].concat(value).forEach((w) => w?.said && found.push(w)); return value; });
    return found.filter((w, i) => found.findIndex((x) => x.said === w.said) === i);
  }
  C.sheet();
})();
