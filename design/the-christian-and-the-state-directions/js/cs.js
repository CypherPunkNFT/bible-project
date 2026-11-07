// The Christian and the state, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js and the shared icon set.
// The one value read from the address (?ref=) is looked up in data.js as an own key, so an unknown value is ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`The Christian and the state: ${detail}`);
  }
  if (!window.CS) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.CS is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.CSArt || !window.CSFigures) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon, CSArt or CSFigures is missing");

  const { study, passages, figures, numbers, sources, sourceLabels } = window.CS;
  const LIFE = "/study/theology?area=life";

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
  const refLink = (id, text) => h("a", { class: "cs-ref", href: `?ref=${encodeURIComponent(id)}`, "data-ref": id }, text);
  function runs(list) {
    return (list || []).map((run, i) => {
      if (typeof run === "string") return list[i + 1]?.c !== undefined ? run.replace(/\s+$/, "") : run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "cs-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if (run.s) return h("a", { class: "cs-link", href: run.s, title: "A study mock-up on this PC" }, h("em", {}, run.t));
      if (run.c !== undefined) return run.c === "before publishing"
        ? h("span", { class: "cs-check" }, h("span", { class: "cs-check-tag" }, "to check before publishing"))
        : h("span", { class: "cs-check" }, h("span", { class: "cs-check-tag" }, "to check"), ` ${run.c}`);
      return "";
    });
  }
  const label = (text, extra = "") => h("span", { class: `cs-label ${extra}` }, text);
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
  const page = h("div", { class: "wrap t-page ms-page cs-page" });
  main.append(page);
  CSFigures.use({ h, refLink, art });

  // ── Hero: the standard heading ──
  const opening = study.opening.find((b) => b.k === "quote");
  const counts = [
    ["He will take", numbers.takes, "times Samuel says it in his warning about a king (1 Samuel 8:11–17)"],
    ["Must not", numbers.limits, "things Israel's king must not gather: horses, wives, silver and gold"],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
    ["Questions", numbers.questions, "readers bring, answered after the six parts"],
  ];
  const ink = study.title.split(" ").slice(0, 2).join(" "), turn = study.title.split(" ").slice(2).join(" ");
  page.append(h("section", { class: "t-sec-landing cs-hero", id: "top" },
    h("div", { class: "hc-intro cs-intro" },
      h("div", {},
        h("nav", { class: "cs-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: LIFE }, "Living the Christian Life"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "cs-here", "aria-current": "page" }, study.title)),
        h("p", { class: "cs-concepts" }, study.concepts.join(" · ")),
        h("h1", {}, `${ink} `, h("em", {}, turn)),
        h("p", { class: "hc-lede cs-lede" }, runs(study.lead)),
        h("figure", { class: "cs-opening" }, h("blockquote", {}, passages[opening.r].verses.map((v) => v[1]).join(" ")),
          h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art cs-hero-art" }, art(CSArt.hero), h("span", { class: "ms-art-note" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1])),
        h("small", {}, "Illustrative form · not a particular coin"))),
    h("dl", { class: "cs-figures" }, counts.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    h("nav", { class: "cs-toc", "aria-label": "On this page" },
      h("a", { href: "#whose" }, h("b", {}, "00"), "Whose is it?"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title)),
      h("a", { href: "#questions" }, h("b", {}, "?"), "Questions"),
      h("a", { href: "#close" }, h("b", {}, "→"), "Two columns")),
  ));

  const sectionHead = (number, title, turnText, ...lead) => h("header", { class: "t-head cs-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turnText)), lead.length ? h("p", {}, ...lead) : null));

  // ── 00 Whose is it? ──
  page.append(h("section", { class: "t-sec cs-whose-sec", id: "whose" },
    sectionHead("00", "Whose is it:", "the ruler's, or God's alone?", "Before you read a passage about rulers, sort what it gives the ruler and what it keeps for God alone."),
    h("div", { class: "cs-frame" }, h("p", {}, runs(study.frame)), h("p", { class: "cs-note" }, runs(study.selection))),
    CSFigures.whose(figures.items)));

  // ── Blocks of text, with each kind of note under its own label ──
  const NOTE = { care: ["With care", "is-care"], read: ["How this study reads it", "is-read"], open: ["An open question", "is-open"], other: ["Other traditions", "is-other"], limits: ["Its limits", "is-limits"] };
  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "h3": return h("h3", { class: "cs-h3" }, block.t);
      case "quote": return h("figure", { class: "cs-quote" }, h("blockquote", {}, passages[block.r].verses.map((v) => v[1]).join(" ")),
        h("figcaption", {}, refLink(block.r, block.label), " · BSB"));
      case "source": return h("aside", { class: "cs-note-block is-source" }, label(sourceLabels[block.id] || "Source"), h("p", {}, runs(block.runs)));
      default: {
        const [name, kind] = NOTE[block.k] || [];
        if (!name) { console.error(`The Christian and the state: unknown block ${block.k}`); return ""; }
        return h("aside", { class: `cs-note-block ${kind}` }, label(name), h("p", {}, runs(block.runs)));
      }
    }
  }

  // ── 01–06: one part per passage, the same anatomy each time ──
  const FIG = { "01": () => CSFigures.takes(figures.takes), "02": () => CSFigures.limits(figures.limits), "03": () => CSFigures.owed(figures.owed),
    "04": () => CSFigures.collisions(figures.collisions), "05": () => CSFigures.dates(figures.dates), "06": () => CSFigures.isaiah(figures.isaiah) };
  study.parts.forEach((part) => {
    const [stateName, stateLine] = part.state;
    page.append(h("section", { class: "t-sec cs-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "cs-part-head" },
        h("div", {},
          h("span", { class: "cs-part-n", "aria-hidden": "true" }, part.n),
          h("h2", { id: `part-${part.n}-title` }, part.title),
          h("p", { class: "cs-hook" }, runs(part.hook)),
          h("p", { class: "cs-readings" }, label("Main readings"), " ", part.readings.map((id, i) => [i ? " · " : "", refLink(id, passages[id].label)]))),
        h("div", { class: "cs-state" }, art(CSArt.states[part.n], "cs-state-art"),
          h("p", {}, label("The two columns"), h("b", {}, stateName), h("span", {}, stateLine)))),
      FIG[part.n] ? FIG[part.n]() : null,
      h("div", { class: "cs-body" }, part.blocks.map(renderBlock)),
      h("dl", { class: "cs-ask" },
        h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
        h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect))))));
  });

  // ── Questions readers bring: all three visible, side by side ──
  page.append(h("section", { class: "t-sec cs-questions", id: "questions" },
    sectionHead("?", "Questions", "readers bring.", "Three questions people ask about government, each answered from the passages above."),
    h("div", { class: "cs-q-row" }, study.questions.map((q) => h("article", { class: "cs-q", id: q.id },
      h("h3", {}, q.title), q.blocks.map((b) => (b.k === "read" ? h("p", {}, runs(b.runs)) : renderBlock(b))))))));

  // ── Close: the way of reading in its own sentences, then the passage again ──
  const close = study.close;
  const closing = passages[close.passage];
  function wayAsSteps(list) {
    if (!list.every((run) => typeof run === "string")) return h("p", { class: "cs-way" }, runs(list));
    const sentences = list.join("").split(/(?<=[.?!”])\s+(?=[A-Z])/);
    const steps = [];
    sentences.slice(1).forEach((sentence) => {
      if (/^(Find|Ask|Then notice)\b/.test(sentence) || !steps.length) steps.push([sentence]); else steps[steps.length - 1].push(sentence);
    });
    return h("div", { class: "cs-way" }, h("p", {}, sentences[0]), h("ol", {}, steps.map((step) => h("li", {}, step.join(" ")))));
  }
  page.append(h("section", { class: "t-sec cs-close", id: "close" },
    sectionHead("→", "Two", "columns."),
    h("div", { class: "cs-close-grid" },
      h("div", {},
        wayAsSteps(close.way),
        h("p", { class: "cs-closing" }, runs(close.close)),
        h("p", { class: "cs-invite" }, runs(close.invite)),
        h("p", { class: "cs-question" }, runs(close.question)),
        h("p", { class: "cs-again" }, runs(close.again))),
      h("figure", { class: "cs-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage, closing.label), " · BSB"),
        h("div", { class: "cs-passage-text" }, closing.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))))),
    art(CSArt.close, "cs-close-art"),
    h("div", { class: "cs-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use))),
      h("p", {}, "Verses this page adds beside the study, each marked where it stands: ", figures.added.join(" · "), ".")),
    h("a", { class: "cs-back", href: LIFE }, art(icon("arrowLeft", 16)), "Back to Living the Christian Life")));

  // ── The verse sheet, from the right ──
  const sheet = h("dialog", { class: "cs-sheet", "aria-labelledby": "cs-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, remember = true) {
    const item = passage(id);
    if (!item) return;
    sheet.replaceChildren(
      h("div", { class: "cs-sheet-head" }, h("h2", { id: "cs-sheet-title" }, item.label), h("button", { type: "button", class: "cs-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "cs-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "cs-sheet-src" }, "Berean Standard Bible"));
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
    const link = event.target.closest("a.cs-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  const ref = new URLSearchParams(location.search).get("ref");
  if (passage(ref)) openSheet(ref, false);
})();
