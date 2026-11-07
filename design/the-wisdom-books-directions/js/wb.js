// The wisdom books, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js and the shared icon set.
// The one value read from the address (?ref=) is looked up in data.js as an own key, so an unknown value is ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`The wisdom books: ${detail}`);
  }
  if (!window.WB) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.WB is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.WBArt || !window.WBFigures) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon, WBArt or WBFigures is missing");

  const { study, passages, figures, numbers, sources, sourceLabels } = window.WB;
  const BOOKS_AREA = "/study/theology?area=books";

  function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") element.className = value;
      else if (key.startsWith("on")) element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value === true ? "" : value);
    }
    element.append(...children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== ""));
    return element;
  }
  function art(markup, className) {
    const holder = h("span", { class: className });
    holder.innerHTML = markup; // fixed drawings from art.js and the shared icon set only
    return holder;
  }
  const passage = (id) => (typeof id === "string" && Object.hasOwn(passages, id) ? passages[id] : null);
  const refLink = (id, text) => h("a", { class: "wb-ref", href: `?ref=${encodeURIComponent(id)}`, "data-ref": id }, text);
  function runs(list) {
    return (list || []).map((run, i) => {
      if (typeof run === "string") return list[i + 1]?.c !== undefined ? run.replace(/\s+$/, "") : run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "wb-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if (run.s) return h("a", { class: "wb-link", href: run.s, title: "A study mock-up on this PC" }, h("em", {}, run.t));
      if (run.c !== undefined) return run.c === "before publishing"
        ? h("span", { class: "wb-check" }, h("span", { class: "wb-check-tag" }, "to check before publishing"))
        : h("span", { class: "wb-check" }, h("span", { class: "wb-check-tag" }, "to check"), ` ${run.c}`);
      return "";
    });
  }
  const label = (text, extra = "") => h("span", { class: `wb-label ${extra}` }, text);
  function setParam(name, value) {
    const params = new URLSearchParams(location.search);
    if (value === null) params.delete(name); else params.set(name, value);
    const query = params.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
  }

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page wb-page" });
  main.append(page);
  WBFigures.use({ h, refLink, art });

  // ── A printed passage, with its speaker line above the words ──
  function printed(block, className = "wb-quote") {
    const speaker = figures.speakers[block.label];
    const words = block.text || passages[block.r].verses.map((v) => v[1]).join(" ");
    return h("figure", { class: className },
      h("p", { class: "wb-speaker" }, h("span", { class: "wb-who" }, speaker.who), h("span", { class: "wb-kind-name" }, speaker.kind)),
      h("blockquote", {}, words),
      h("figcaption", {}, refLink(block.r, block.label), " · BSB", block.omits ? h("span", { class: "wb-small" }, ` · the verse opens “${block.omits}”`) : null),
      speaker.verdict ? h("p", { class: "wb-verdict" }, label("God's verdict"), ` “${speaker.verdict.words}” `, refLink(speaker.verdict.r, speaker.verdict.label)) : null);
  }

  // ── Hero: the standard heading ──
  const opening = study.opening.find((b) => b.k === "quote");
  const counts = [
    ["Kinds of saying", numbers.kinds, "a report of a debate, proverbs, a searching question, a song"],
    ["Voices", numbers.voices, "speakers this page names across the four books"],
    ["Under the sun", numbers.underTheSun, "times Ecclesiastes uses the phrase"],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
  ];
  const [ink, turn] = [study.title.split(" ").slice(0, 2).join(" "), study.title.split(" ").slice(2).join(" ")];
  page.append(h("section", { class: "t-sec-landing wb-hero", id: "top" },
    h("div", { class: "hc-intro wb-intro" },
      h("div", {},
        h("nav", { class: "wb-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: BOOKS_AREA }, "Explore the Bible"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "wb-here", "aria-current": "page" }, study.title)),
        h("p", { class: "wb-concepts" }, study.concepts.join(" · ")),
        h("h1", {}, `${ink} `, h("em", {}, turn)),
        h("p", { class: "hc-lede wb-lede" }, runs(study.lead)),
        printed(opening, "wb-quote wb-opening")),
      h("figure", { class: "ms-hero-art wb-hero-art" }, art(WBArt.hero), h("span", { class: "ms-art-note" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1])))),
    h("dl", { class: "wb-counts" }, counts.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    h("nav", { class: "wb-toc", "aria-label": "On this page" },
      h("a", { href: "#voices" }, h("b", {}, "00"), "Who is speaking?"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title)),
      h("a", { href: "#close" }, h("b", {}, "→"), "Reading the wisdom books"))));

  const sectionHead = (number, title, turnText, ...lead) => h("header", { class: "t-head wb-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turnText)), lead.length ? h("p", {}, ...lead) : null));

  // ── Blocks of text, with each kind of note under its own label ──
  const NOTE = { care: ["With care", "is-care"], read: ["How this study reads it", "is-read"], open: ["An open question", "is-open"] };
  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "h3": return h("h3", { class: "wb-h3" }, block.t);
      case "quote": return printed(block);
      case "pair": return h("div", { class: "wb-pair" }, block.items.map(renderBlock));
      case "source": return h("aside", { class: "wb-note is-source" }, label(sourceLabels[block.id] || "Source"), h("p", {}, runs(block.runs)));
      default: {
        const [name, kind] = NOTE[block.k] || [];
        if (!name) { console.error(`The wisdom books: unknown block ${block.k}`); return ""; }
        return h("aside", { class: `wb-note ${kind}` }, label(name, kind), h("p", {}, runs(block.runs)));
      }
    }
  }

  // ── 00 Who is speaking? ──
  page.append(h("section", { class: "t-sec wb-voices-sec", id: "voices" },
    sectionHead("00", "Who is speaking,", "and what kind of saying is it?", "Ask it before you ask what a line promises."),
    h("div", { class: "wb-frame" },
      h("p", {}, label("The habit"), " ", runs(study.habit)),
      h("div", {}, h("p", {}, label("Where these books stand"), " ", runs(study.setting)), h("p", { class: "wb-note-plain" }, runs(study.selection)))),
    WBFigures.voices(figures.books, figures.floorName, figures.songNote),
    study.opening.filter((b) => b.k !== "quote").map(renderBlock)));

  // ── 01–06: one part per book or passage ──
  const FIG = { "01": () => WBFigures.shaft(figures.shaft), "02": () => WBFigures.questions(figures.questions), "03": () => WBFigures.proverbs(figures.proverbs),
    "04": () => WBFigures.pair(figures.pair), "05": () => WBFigures.times(figures.times), "06": () => WBFigures.refrains(figures.refrains) };
  study.parts.forEach((part) => {
    page.append(h("section", { class: "t-sec wb-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "wb-part-head" },
        h("span", { class: "wb-part-n", "aria-hidden": "true" }, part.n),
        h("div", {},
          h("h2", { id: `part-${part.n}-title` }, part.title),
          h("p", { class: "wb-hook" }, runs(part.hook)),
          h("p", { class: "wb-readings" }, label("Main readings"), " ", part.readings.map((id, i) => [i ? " · " : "", refLink(id, passages[id].label)])))),
      h("div", { class: "wb-setting" },
        h("p", {}, label("Setting"), " ", runs(part.setting)),
        h("p", { class: "wb-limit" }, label("Its limit", "is-care"), " ", runs(part.limit))),
      FIG[part.n] ? FIG[part.n]() : null,
      h("div", { class: "wb-body" }, part.blocks.map(renderBlock)),
      h("dl", { class: "wb-ask" },
        h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
        h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect))))));
  });

  // ── Close: the way of reading as its questions, then the passage again ──
  const close = study.close;
  const closing = passages[close.passage];
  function wayAsQuestions(list) {
    if (!list.every((run) => typeof run === "string")) return h("p", { class: "wb-way" }, runs(list));
    const sentences = list.join("").split(/(?<=[.?!”])\s+(?=[A-Z])/);
    const steps = [];
    sentences.slice(1).forEach((sentence) => {
      if (/^(Ask|Then ask)\b/.test(sentence) || !steps.length) steps.push([sentence]); else steps[steps.length - 1].push(sentence);
    });
    return h("div", { class: "wb-way" }, h("p", {}, sentences[0]), h("ol", {}, steps.map((step) => h("li", {}, step.join(" ")))));
  }
  page.append(h("section", { class: "t-sec wb-close", id: "close" },
    sectionHead("→", "Reading", "the wisdom books."),
    h("div", { class: "wb-close-grid" },
      h("div", {},
        wayAsQuestions(close.way),
        h("p", { class: "wb-closing" }, runs(close.close)),
        h("p", { class: "wb-invite" }, runs(close.invite)),
        h("p", { class: "wb-question" }, runs(close.question)),
        h("p", { class: "wb-again" }, runs(close.again))),
      h("figure", { class: "wb-passage" },
        h("p", { class: "wb-speaker" }, h("span", { class: "wb-who" }, figures.speakers[closing.label].who), h("span", { class: "wb-kind-name" }, figures.speakers[closing.label].kind)),
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage, closing.label), " · BSB"),
        h("div", { class: "wb-passage-text" }, closing.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))))),
    art(WBArt.close, "wb-close-art"),
    h("div", { class: "wb-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use))),
      h("p", {}, "Every verse in the figures lies inside a passage the study itself cites; this page adds none.")),
    h("a", { class: "wb-back", href: BOOKS_AREA }, art(icon("arrowLeft", 16)), "Back to Explore the Bible")));

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "wb-sheet", "aria-labelledby": "wb-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, remember = true) {
    const item = passage(id);
    if (!item) return;
    sheet.replaceChildren(
      h("div", { class: "wb-sheet-head" }, h("h2", { id: "wb-sheet-title" }, item.label), h("button", { type: "button", class: "wb-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "wb-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "wb-sheet-src" }, "Berean Standard Bible"));
    if (!sheet.open) sheet.showModal();
    if (remember) setParam("ref", id);
  }
  sheet.addEventListener("close", () => {
    setParam("ref", null);
    opener?.focus();
    opener = null;
  });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.wb-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.getAttribute("data-ref"));
  });
  const ref = new URLSearchParams(location.search).get("ref");
  if (passage(ref)) openSheet(ref, false);
})();
