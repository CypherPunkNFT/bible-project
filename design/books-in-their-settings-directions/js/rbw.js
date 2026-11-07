// Reading the Bible well, one mock-up page drawn from data.js (built by build-data.py from content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js and the site header,
// which is rebuilt from constants below. A reference in the address (?ref=) is looked up in data.js with
// Object.hasOwn, so an unknown value is simply ignored.
(() => {
  const NAME = "Reading the Bible well";
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`${NAME}: ${detail}`);
  }
  if (!window.RBW) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.RBW is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.RBWArt || !window.RBWFigs) return stop("This mock-up could not load its shared frame, drawings or figures. Reload the page.", "Frame, icon, RBWArt or RBWFigs is missing");

  const D = window.RBW;
  const { study, passages, numbers } = D;
  const { intro, close } = study;
  const Art = window.RBWArt;

  function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") element.className = value;
      else if (key.startsWith("on")) element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value === true ? "" : value);
    }
    element.append(...children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false));
    return element;
  }
  function art(markup, className) {
    const holder = h("span", { class: className });
    holder.innerHTML = markup; // fixed drawings from art.js only
    return holder;
  }
  const verses = (id) => { const p = passages[id]; return D.text[p.b].slice(p.a, p.z + 1); };
  const verseText = (id) => verses(id).map((v) => v[1]).join(" ");
  const refLink = (id, text) => h("a", { class: "rbw-ref", href: `?ref=${id}`, "data-ref": id }, text ?? passages[id].label);
  function runs(list) {
    return list.map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "rbw-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, runs(run.b));
      if (run.i) return h("em", {}, run.i);
      if (run.chk) return h("span", { class: "rbw-chk", title: `To confirm before publishing: ${run.chk}` }, "to confirm");
      if ("s" in run) return run.s ? h("a", { class: "rbw-link", href: run.s, title: "Mock-up on this PC" }, run.t) : h("em", { class: "rbw-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }
  const label = (text, extra = "") => h("span", { class: `rbw-label ${extra}` }, text);
  const figure = (name, question, says, ...body) => h("figure", { class: `rbw-fig rbw-fig-${name}` },
    h("figcaption", { class: "rbw-fig-q" }, h("strong", {}, question), " ", says), body);
  const kit = { D, h, art, verses, verseText, refLink, runs, label, figure, Art };
  const Figs = window.RBWFigs(kit);

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page rbw-page" });
  main.append(page);

  // ── Hero: the standard heading, the lamp drawn, five counts ──
  const opening = intro.quotes[0];
  const [two, seventy] = numbers.years;
  const figures = [
    ["Books in the library", numbers.books, "written over many centuries, in two main parts", "Counted in the Berean"],
    ["Chapters of John", numbers.johnChapters, "one a day is three weeks: the first book this study suggests", "Counted in the Berean"],
    ["Verses of Jonah", numbers.jonahVerses, `one sitting; only ${numbers.fishVerses} of them name the fish`, "Counted in the Berean"],
    ["Years: promised, then given", `${two} · ${seventy}`, "Hananiah's two against the seventy in the letter around Jeremiah 29:11", "Found in Jeremiah 28:3 and 29:10 by script"],
    ["References", numbers.references, "each opens its verses here, in the Berean", "Every reference on this page"],
  ];
  const sub = study.subtitle.charAt(0).toUpperCase() + study.subtitle.slice(1);
  page.append(h("section", { class: "rbw-hero", id: "top" },
    h("div", { class: "rbw-intro" },
      h("div", {},
        h("nav", { class: "rbw-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: D.trail[1] }, D.trail[0]), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "rbw-here", "aria-current": "page" }, study.title)),
        h("p", { class: "rbw-concepts" }, intro.concepts.join(" · ")),
        h("h1", {}, D.title[0], " ", h("em", {}, D.title[1])),
        h("p", { class: "rbw-sub" }, sub),
        h("p", { class: "rbw-lede" }, runs(intro.lead)),
        h("figure", { class: "rbw-opening" }, h("blockquote", {}, verseText(opening.r)), h("figcaption", {}, refLink(opening.r), " · Berean Standard Bible"))),
      h("figure", { class: "rbw-hero-art" }, art(Art.hero, "rbw-art"), h("figcaption", { class: "rbw-motto" }, h("i"), intro.motto[0], h("br"), h("span", {}, intro.motto[1])))),
    h("dl", { class: "rbw-figures" }, figures.map(([name, value, means, rule]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, means), h("small", { class: "rbw-rule" }, rule)))),
    h("nav", { class: "rbw-toc", "aria-label": "On this page" },
      h("a", { href: "#library" }, h("b", {}, "00"), "A library, not one book"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}`, class: `rbw-tone-${p.tone}` }, h("b", {}, p.n), p.title)),
      h("a", { href: "#close" }, h("b", {}, "→"), close.title))));

  const sectionHead = (number, title, turn, lead) => h("header", { class: "rbw-head" },
    h("span", { class: "rbw-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead ? h("p", {}, lead) : null));

  // ── 00 A library, not one book: the two opening paragraphs and the shelf ──
  page.append(h("section", { class: "t-sec rbw-library rbw-tone-poetry", id: "library" },
    sectionHead("00", "A library,", "not one book.", "Sixty-six books, each with its own writer, first readers, setting and purpose."),
    h("div", { class: "rbw-read" }, intro.paras.map((b) => h("p", {}, runs(b.runs)))),
    Figs.shelf(),
    h("aside", { class: "rbw-selection" }, label("This is a selection"), h("p", {}, runs(intro.selection)))));

  // ── 01–06: each part in the colour of the book it opens, with its figure where its text needs it ──
  function renderBlock(b, part) {
    if (b.k === "p") return h("p", {}, runs(b.runs));
    if (b.k === "h3") return h("h3", { class: "rbw-sub-head" }, b.t);
    if (b.k === "quote") return h("figure", { class: "rbw-quote" }, h("blockquote", {}, verseText(b.r)), h("figcaption", {}, refLink(b.r), " · BSB"));
    if (b.k === "care") return h("aside", { class: "rbw-care" }, label("With care", "rbw-gold"), h("p", {}, runs(b.runs)));
    if (b.k === "limit") return h("aside", { class: "rbw-limit" }, label("Its limits"), h("p", {}, runs(b.runs)));
    if (b.k === "list") return h("ul", { class: "rbw-list" }, b.items.map((it) => h("li", {}, h("strong", {}, runs(it.label)), it.runs.length ? [" ", runs(it.runs)] : null)));
    if (b.k === "steps" && part.n === "06") return Figs.stones(b.items);
    if (b.k === "steps") return h("ol", { class: "rbw-steps" }, b.items.map((it) => h("li", {}, h("span", { class: "rbw-step-n", "aria-hidden": "true" }, String(it.n)), h("strong", {}, runs(it.label)), h("p", {}, runs(it.runs)))));
    return null;
  }
  const textOf = (b) => (b.runs || []).map((r) => (typeof r === "string" ? r : r.t || "")).join("");
  // Where each figure stands: before or after the first block that matches.
  const PLACES = {
    "01": [["before", (b) => b.k === "limit", Figs.john]],
    "02": [["before", (b) => b.k === "care", Figs.weeks]],
    "03": [["before", (b) => b.k === "limit", Figs.reader]],
    "04": [["after", (b) => b.k === "h3" && b.t.startsWith("Follow the book"), Figs.jonah], ["before", (b) => b.k === "care", Figs.shared]],
    "05": [["before", (b) => b.k === "h3" && b.t.startsWith("Who was in the room"), Figs.letter], ["after", (b) => textOf(b).startsWith("Seventy years."), Figs.years]],
  };
  const BOOK = { "01": "JHN", "02": "ACT", "04": "JON", "05": "JER" };
  const parts = h("div", { class: "rbw-parts" });
  study.parts.forEach((part) => {
    const places = PLACES[part.n] || [];
    const used = new Set();
    const body = part.blocks.flatMap((b) => {
      const here = places.filter((p) => !used.has(p) && p[1](b));
      here.forEach((p) => used.add(p));
      return [here.filter((p) => p[0] === "before").map((p) => p[2]()), renderBlock(b, part), here.filter((p) => p[0] === "after").map((p) => p[2]())];
    });
    places.filter((p) => !used.has(p)).forEach((p) => console.error(`${NAME}: part ${part.n}: a figure found no place and was left out`));
    parts.append(h("section", { class: `t-sec rbw-part rbw-tone-${part.tone}`, id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "rbw-part-head" },
        h("span", { class: "rbw-part-n", "aria-hidden": "true" }, part.n),
        h("div", {},
          BOOK[part.n] ? Figs.bookTag(BOOK[part.n]) : null,
          h("h2", { id: `part-${part.n}-title` }, part.title),
          h("p", { class: "rbw-hook" }, runs(part.hook)),
          h("p", { class: "rbw-readings" }, label("Main readings"), " ", runs(part.readings)))),
      h("div", { class: "rbw-read" }, body),
      h("dl", { class: "rbw-askback" },
        h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
        h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect))))));
  });
  page.append(parts);

  // ── Close: the way of reading, the question, and the passage read whole ──
  const [closeTitle, ...closeTurn] = close.title.split(" for ");
  page.append(h("section", { class: "t-sec rbw-close rbw-tone-poetry", id: "close" },
    art(Art.close, "rbw-close-art"),
    sectionHead("→", closeTitle, closeTurn.length ? `for ${closeTurn.join(" for ")}` : ""),
    h("p", { class: "rbw-way" }, runs(close.way)),
    h("p", { class: "rbw-close-text" }, runs(close.close)),
    h("p", { class: "rbw-invite" }, runs(close.invite)),
    h("p", { class: "rbw-question" }, label("Your question"), runs(close.question)),
    h("p", { class: "rbw-again" }, runs(close.again)),
    h("figure", { class: "rbw-passage" }, h("blockquote", {}, verses(close.passage).map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), " ", text, " "))),
      h("figcaption", {}, refLink(close.passage), " · Berean Standard Bible. The end of the whole book this study read, and its last question.")),
    h("div", { class: "rbw-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, D.sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use))),
      h("details", {}, h("summary", {}, `Quotations from outside Scripture: ${D.outside.length}, checked by script against the site's record of the confession`),
        h("ul", {}, D.outside.map((o) => h("li", {}, h("q", {}, o.t), " ", h("span", { class: "rbw-from" }, `${o.from} · ${o.checked ? "checked by script" : "not held here; compare by eye"}`))))),
      h("details", {}, h("summary", {}, `Still to confirm before publishing: ${numbers.openChecks} points, each marked “to confirm” in the text`),
        h("ul", {}, D.openChecks.map((c) => h("li", {}, h("b", {}, `Part ${c.part}. `), c.note))))),
    h("a", { class: "rbw-back", href: D.trail[1] }, art(icon("arrowLeft", 16)), `Back to ${D.trail[0]}`)));

  // ── The verse sheet, from the right ──
  const sheet = h("dialog", { class: "rbw-sheet", "aria-labelledby": "rbw-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    if (!Object.hasOwn(passages, id)) return;
    sheet.replaceChildren(
      h("div", { class: "rbw-sheet-head" }, h("h2", { id: "rbw-sheet-title" }, passages[id].label), h("button", { type: "button", class: "rbw-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "rbw-sheet-text" }, verses(id).map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "rbw-sheet-src" }, "Berean Standard Bible"));
    if (!sheet.open) sheet.showModal();
    sheet.scrollTop = 0;
    if (push) history.replaceState(null, "", `?ref=${encodeURIComponent(id)}${location.hash}`);
  }
  sheet.addEventListener("close", () => {
    history.replaceState(null, "", location.pathname + location.hash);
    opener?.focus();
    opener = null;
  });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.rbw-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  const asked = new URLSearchParams(location.search).get("ref");
  if (asked) openSheet(asked, false);
})();
