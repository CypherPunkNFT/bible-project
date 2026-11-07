// What the Bible says about itself, one mock-up page drawn from data.js (built by build-data.py from the study's
// content.md). All text goes in as text nodes. The only markup strings are the fixed drawings in art.js. A reference
// in the address (?ref=) is looked up as data.js's own key, so an unknown value is simply ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`What the Bible says about itself: ${detail}`);
  }
  if (!window.SW) return stop("This page has no study data: data.js did not load. Run build-data.py, then reload.", "window.SW is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.SWArt || !window.SWFig) return stop("This page could not load its shared frame or drawings. Reload the page.", "Frame, icon, SWArt or SWFig is missing");

  const D = window.SW;
  const { study, heading, passages, numbers, sources } = D;
  const has = (id) => typeof id === "string" && Object.hasOwn(passages, id);

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
  const refLink = (id, text) => h("a", { class: "sw-ref", href: `?ref=${encodeURIComponent(id)}`, "data-ref": id }, text ?? passages[id].label);
  const label = (text) => h("span", { class: "sw-label" }, text);
  function runs(list) {
    return (list || []).map((run) => {
      if (typeof run === "string") return run;
      if (run.r && has(run.r) && run.t) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "sw-link", href: run.a.startsWith("/") && !run.a.startsWith("//") ? run.a : "#" }, run.t);
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if (run.chk) return h("span", { class: "sw-chk" }, h("b", {}, "To check"), " ", run.chk);
      if ("s" in run) return run.s ? h("a", { class: "sw-link", href: run.s }, h("em", {}, run.t)) : h("em", { class: "sw-study" }, run.t);
      return "";
    });
  }
  const verseText = (id) => passages[id].verses.map((v) => v[1]).join(" ");

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page sw-page" });
  main.append(page);
  const ctx = { D, h, art, refLink, label, runs, verseText };

  // ── Heading ──
  const opening = study.opening[0];
  const figures = [
    ["It is written", numbers.written, `times in Matthew 4:1–11: ${numbers.byJesus} by Jesus, ${numbers.byDevil} by the devil`],
    ["Opened", numbers.opened, "times in Luke 24: eyes, the Scriptures, minds"],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
    ["Questions", numbers.questions, "readers ask, answered after the six parts"],
  ];
  page.append(h("section", { class: "t-sec-landing sw-hero", id: "top" },
    h("div", { class: "hc-intro ms-intro sw-intro" },
      h("div", {},
        h("nav", { class: "sw-trail", "aria-label": "Study trail" }, heading.trail.map(([text, href]) => [h("a", { href }, text), h("span", { "aria-hidden": "true" }, "/")]), h("span", { class: "sw-here", "aria-current": "page" }, study.title)),
        h("p", { class: "sw-concepts" }, study.concepts.join(" · ")),
        h("h1", { id: "sw-title", tabindex: "-1" }, heading.title[0], " ", h("em", {}, heading.title[1])),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "sw-opening" }, h("blockquote", {}, verseText(opening.r)),
          h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art sw-hero-art" }, art(SWArt.hero), h("span", { class: "ms-art-note" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1]))),
    ),
    h("dl", { class: "sw-figures" }, figures.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    h("nav", { class: "sw-toc", "aria-label": "On this page" },
      h("a", { href: "#written" }, h("b", {}, "00"), "It is written"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), heading.conceptOf[p.n])),
      h("a", { href: "#questions" }, h("b", {}, "?"), "Questions"),
      h("a", { href: "#close" }, h("b", {}, "→"), "Close")),
  ));

  const sectionHead = (number, title, turn, lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead ? h("p", {}, lead) : null));

  // ── 00 It is written: four times, two speakers ──
  page.append(h("section", { class: "t-sec sw-written", id: "written" },
    sectionHead("00", "It is written.", "Four times, two speakers.", "The same words, said by Jesus and by the devil. Choose one to read the verses it was taken from, and what it is being used to do."),
    h("p", { class: "sw-frame" }, runs(study.frame)),
    SWFig.written(ctx),
    h("p", { class: "sw-note" }, runs(study.selection)),
  ));

  // ── 01–06 Six claims, each with its passage and a figure in the margin ──
  study.parts.forEach((part) => {
    const body = h("div", { class: "sw-body" }, part.blocks.map(renderBlock),
      h("dl", { class: "sw-ask" },
        h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
        h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect)))));
    const readings = [label("Main readings"), " ", part.readings.map((id, i) => [i ? " · " : "", refLink(id)])];
    if (part.quoted?.length) readings.push(h("span", { class: "sw-quoted" }, label("Also quoted"), " ", part.quoted.map((id, i) => [i ? " · " : "", refLink(id)])));
    page.append(h("article", { class: "t-sec sw-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "sw-part-head" },
        h("span", { class: "sw-n", "aria-hidden": "true" }, part.n),
        h("div", {},
          h("p", { class: "sw-concept" }, heading.conceptOf[part.n]),
          h("h2", { id: `part-${part.n}-title` }, part.title, part.turn ? [": ", h("em", {}, part.turn)] : null),
          h("p", { class: "sw-hook" }, runs(part.hook)),
          h("p", { class: "sw-readings" }, readings))),
      h("div", { class: "sw-part-grid" }, body, h("aside", { class: "sw-margin", "aria-label": `Figure for part ${part.n}` }, SWFig.parts[part.n](ctx)))));
  });

  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "more": return h("p", { class: "sw-more" }, runs(block.runs));
      case "h3": return h("h3", { class: "sw-h3" }, block.t);
      case "quote": return h("figure", { class: "sw-quote" }, h("blockquote", {}, verseText(block.r)), h("figcaption", {}, refLink(block.r, block.label), " · BSB"));
      case "note": if (block.mark === "read") return h("p", {}, runs(block.runs)); // every answer is the site's reading; a label on each would be noise
        return h("aside", { class: `sw-note-block sw-note-${block.mark}` }, label(block.label), h("p", {}, runs(block.runs)));
      default: console.error(`What the Bible says about itself: unknown block ${block.k}`); return "";
    }
  }

  // ── Questions readers ask: three questions as words on one line; the chosen one opens below ──
  const qPanel = h("div", { class: "sw-q-panel", id: "sw-q-panel", role: "region", "aria-live": "polite" });
  const qButtons = study.questions.map((q, i) => h("button", { type: "button", class: "sw-q-word", "aria-pressed": i === 0 ? "true" : "false", "aria-controls": "sw-q-panel", onclick: () => showQuestion(i) }, h("span", { class: "sw-q-n" }, String(i + 1).padStart(2, "0")), q.title));
  function showQuestion(index) {
    const q = study.questions[index];
    qButtons.forEach((b, i) => b.setAttribute("aria-pressed", i === index ? "true" : "false"));
    qPanel.replaceChildren(h("h3", {}, q.title), h("p", { class: "sw-q-text" }, label("Read with"), " ", refLink(q.text)), ...q.blocks.map(renderBlock));
  }
  page.append(h("section", { class: "t-sec sw-questions", id: "questions" },
    sectionHead("?", "Questions", "readers ask.", "Three honest questions, answered from the same passages and pointed to the pages that treat them at length."),
    h("div", { class: "sw-q-line" }, qButtons), qPanel));
  showQuestion(0);

  // ── Close ──
  const close = study.close;
  const passage = passages[close.passage];
  const [first, ...rest] = close.title.split(" ");
  page.append(h("section", { class: "t-sec sw-close", id: "close" },
    sectionHead("→", `${first} ${rest.slice(0, 1).join(" ")}`, rest.slice(1).join(" ") + "."),
    h("div", { class: "sw-close-grid" },
      h("div", {},
        h("p", { class: "sw-way" }, runs(close.way)),
        h("p", {}, runs(close.close)),
        h("p", { class: "sw-invite" }, runs(close.invite)),
        h("p", { class: "sw-question" }, runs(close.question)),
        h("p", { class: "sw-again" }, runs(close.again)),
        art(SWArt.close, "sw-close-art")),
      h("figure", { class: "sw-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage, passage.label), " · BSB"),
        h("div", { class: "sw-passage-text", tabindex: "0", "aria-label": `${passage.label}, Berean Standard Bible` }, passage.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))))),
    h("div", { class: "sw-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use)))),
    h("a", { class: "sw-back", href: heading.back[0] }, art(icon("arrowLeft", 16)), heading.back[1]),
  ));

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "sw-sheet", "aria-labelledby": "sw-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    if (!has(id)) return;
    const item = passages[id];
    sheet.replaceChildren(
      h("div", { class: "sw-sheet-head" }, h("h2", { id: "sw-sheet-title" }, item.label), h("button", { type: "button", class: "sw-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "sw-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "sw-sheet-src" }, "Berean Standard Bible"));
    if (!sheet.open) sheet.showModal();
    if (push) history.replaceState(null, "", `?ref=${encodeURIComponent(id)}${location.hash}`);
  }
  sheet.addEventListener("close", () => {
    history.replaceState(null, "", location.pathname + location.hash);
    (opener && document.contains(opener) ? opener : document.getElementById("sw-title"))?.focus();
    opener = null;
  });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.sw-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  const asked = new URLSearchParams(location.search).get("ref");
  if (has(asked)) openSheet(asked, false);
})();
