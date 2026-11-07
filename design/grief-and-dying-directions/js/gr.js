// Grief and dying, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js. Values in the address
// (?ref=, ?q=) are looked up in data.js, so an unknown value is simply ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`Grief and dying: ${detail}`);
  }
  if (!window.GR) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.GR is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.GRArt || !window.GRFigures) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon, GRArt or GRFigures is missing");

  const { study, passages, figures, numbers, sources, sourceLabels } = window.GR;
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
  // A passage by key; a single verse of a chapter held whole ("LAM.3.21" from "LAM.3") is read from that chapter.
  function passage(id) {
    if (passages[id]) return passages[id];
    const m = /^([1-3]?[A-Z]{2,3})\.(\d+)\.(\d+)$/.exec(id || "");
    const chapter = m && passages[`${m[1]}.${m[2]}`];
    const verse = chapter?.verses.find(([cv]) => cv === `${m[2]}:${m[3]}`);
    return verse ? { label: `${chapter.label}:${m[3]}`, verses: [verse] } : null;
  }
  const refLink = (id, text) => h("a", { class: "gr-ref", href: `?ref=${id}`, "data-ref": id }, text);
  function runs(list) {
    return (list || []).map((run, i) => {
      if (typeof run === "string") return list[i + 1]?.c !== undefined ? run.replace(/\s+$/, "") : run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "gr-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if (run.s) return h("a", { class: "gr-link", href: run.s, title: "A study mock-up on this PC" }, h("em", {}, run.t));
      if (run.c !== undefined) return run.c === "before publishing"
        ? h("span", { class: "gr-check" }, h("span", { class: "gr-check-tag" }, "to check before publishing"))
        : h("span", { class: "gr-check" }, h("span", { class: "gr-check-tag" }, "to check"), ` ${run.c}`);
      return "";
    });
  }
  const label = (text, extra = "") => h("span", { class: `gr-label ${extra}` }, text);
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
  const page = h("div", { class: "wrap t-page ms-page gr-page" });
  main.append(page);
  GRFigures.use({ h, refLink, passages, openSheet: (id, from) => { opener = from; openSheet(id); } });

  // ── Hero: the standard heading ──
  const opening = study.opening.find((b) => b.k === "quote");
  const care = study.opening.find((b) => b.k === "care");
  const figuresBar = [
    ["Voices", numbers.voices, "mourners' words or acts drawn in 00, each aimed at someone"],
    ["Lamentations", numbers.lament, `verses; the hope ends at ${numbers.middle}, the middle of the book`],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
    ["Questions", numbers.questions, "readers bring, answered after the five parts"],
  ];
  const [ink, turn] = [study.title.split(" ")[0], study.title.split(" ").slice(1).join(" ")];
  page.append(h("section", { class: "t-sec-landing gr-hero", id: "top" },
    h("div", { class: "hc-intro gr-intro" },
      h("div", {},
        h("nav", { class: "gr-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: LIFE }, "Living the Christian Life"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "gr-here", "aria-current": "page" }, study.title)),
        h("p", { class: "gr-concepts" }, study.concepts.join(" · ")),
        h("h1", {}, `${ink} `, h("em", {}, turn)),
        h("p", { class: "hc-lede gr-lede" }, runs(study.lead)),
        h("figure", { class: "gr-opening" }, h("blockquote", {}, passages[opening.r].verses.map((v) => v[1]).join(" ")),
          h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art gr-hero-art" }, art(GRArt.hero), h("span", { class: "ms-art-note" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1])))),
    h("dl", { class: "gr-figures" }, figuresBar.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    care ? h("aside", { class: "gr-crisis", "aria-label": "If you are in danger" }, label("With care", "is-care"), h("p", {}, runs(care.runs))) : null,
    h("nav", { class: "gr-toc", "aria-label": "On this page" },
      h("a", { href: "#voices" }, h("b", {}, "00"), "Who is weeping, and to whom"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title)),
      h("a", { href: "#questions" }, h("b", {}, "?"), "Questions"),
      h("a", { href: "#close" }, h("b", {}, "→"), "Close")),
  ));

  const sectionHead = (number, title, turnText, ...lead) => h("header", { class: "t-head gr-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turnText)), lead.length ? h("p", {}, ...lead) : null));

  // ── 00 Who is weeping, and to whom ──
  page.append(h("section", { class: "t-sec gr-voices-sec", id: "voices" },
    sectionHead("00", "Who is weeping,", "and to whom?", "Before you ask what a grief passage explains, ask who is weeping, and to whom."),
    GRFigures.voices(figures.voices),
    h("p", { class: "gr-note" }, runs(study.selection))));

  // ── Blocks of text, with each kind of note under its own label ──
  const NOTE = { care: ["With care", "is-care"], read: ["How this study reads it", "is-read"], open: ["An open question", "is-open"], other: ["Other teaching", "is-other"] };
  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "h3": return h("h3", { class: "gr-h3" }, block.t);
      case "quote": return h("figure", { class: "gr-quote" }, h("blockquote", {}, passages[block.r].verses.map((v) => v[1]).join(" ").replace(block.frame ? new RegExp(`^${block.frame}\\s*“?`) : /$^/, "").replace(block.frame ? /”$/ : /$^/, "")),
        h("figcaption", {}, refLink(block.r, block.label), " · BSB", block.frame ? ` · the spoken words; the verse opens “${block.frame.replace(/,$/, "")}”` : ""));
      case "answer": return h("p", { class: "gr-answer" }, h("q", {}, runs(block.runs)), " ", refLink(block.r, block.label));
      case "source": return h("aside", { class: "gr-note-block is-source" }, label(sourceLabels[block.id] || "Source"), h("p", {}, runs(block.runs)));
      default: {
        const [name, kind] = NOTE[block.k] || [];
        if (!name) { console.error(`Grief and dying: unknown block ${block.k}`); return ""; }
        return h("aside", { class: `gr-note-block ${kind}` }, label(name), h("p", {}, runs(block.runs)));
      }
    }
  }
  // Notes of other teaching and named outside sources that stand together are set side by side.
  function renderBlocks(blocks) {
    const out = [];
    blocks.forEach((block) => {
      const side = block.k === "source" || block.k === "other";
      const last = out[out.length - 1];
      if (side && last?.classList?.contains("gr-views")) last.append(renderBlock(block));
      else if (side) out.push(h("div", { class: "gr-views" }, renderBlock(block)));
      else out.push(renderBlock(block));
    });
    return out;
  }

  // ── 01–05: one part per passage, each with its own figure ──
  const FIG = { "01": () => GRFigures.days(figures.days), "02": () => GRFigures.song(figures.song), "03": () => GRFigures.lament(figures.lament), "04": () => GRFigures.luke(figures.luke), "05": () => GRFigures.nowThen(figures.nowThen) };
  study.parts.forEach((part) => {
    page.append(h("section", { class: "t-sec gr-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "gr-part-head" },
        h("span", { class: "gr-part-n", "aria-hidden": "true" }, part.n),
        h("div", {},
          h("h2", { id: `part-${part.n}-title` }, part.title),
          h("p", { class: "gr-hook" }, runs(part.hook)),
          h("p", { class: "gr-line" }, runs(part.line)),
          h("p", { class: "gr-readings" }, label("Main readings"), " ", part.readings.map((id, i) => [i ? " · " : "", refLink(id, passages[id].label)])))),
      GRFigures.partVoices(figures.voices.rows.filter((r) => r.part === part.n), figures.voices.to),
      FIG[part.n] ? FIG[part.n]() : null,
      h("div", { class: "gr-body" }, renderBlocks(part.blocks)),
      h("dl", { class: "gr-ask" },
        h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
        h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect))))));
  });

  // ── Questions readers bring: three titles joined by a line, one open at a time ──
  const asked = new URLSearchParams(location.search);
  const panel = h("div", { class: "gr-q-panel", id: "gr-q-panel", "aria-live": "polite" });
  const qButtons = study.questions.map((q, i) => h("button", { type: "button", class: "gr-q", "aria-controls": "gr-q-panel", onclick: () => openQuestion(i, true) },
    h("span", { class: "gr-q-n" }, String(i + 1).padStart(2, "0")), h("span", { class: "gr-q-t" }, q.title)));
  function openQuestion(index, remember) {
    const q = study.questions[index];
    qButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    panel.replaceChildren(h("h3", { class: "gr-q-title" }, q.title), h("div", { class: "gr-q-body" }, renderBlocks(q.blocks)));
    if (remember) setParam("q", q.id);
  }
  page.append(h("section", { class: "t-sec gr-questions", id: "questions" },
    sectionHead("?", "Questions", "readers bring.", "Three questions people ask beside a grave, answered from Scripture. Choose one to read its answer."),
    h("div", { class: "gr-q-row", role: "group", "aria-label": "Questions" }, qButtons), panel));
  const chosen = study.questions.findIndex((q) => q.id === asked.get("q"));
  openQuestion(chosen >= 0 ? chosen : 0, false);

  // ── Close ──
  const close = study.close;
  const closing = passages[close.passage];
  page.append(h("section", { class: "t-sec gr-close", id: "close" },
    sectionHead("→", close.title.split(" ").slice(0, -2).join(" "), close.title.split(" ").slice(-2).join(" ") + "."),
    h("div", { class: "gr-close-grid" },
      h("div", {},
        h("p", { class: "gr-way" }, runs(close.way)),
        h("p", { class: "gr-closing" }, runs(close.close)),
        h("p", { class: "gr-invite" }, runs(close.invite)),
        h("p", { class: "gr-question" }, runs(close.question)),
        h("p", { class: "gr-again" }, runs(close.again))),
      h("figure", { class: "gr-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage, closing.label), " · BSB"),
        h("div", { class: "gr-passage-text" }, closing.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))))),
    art(GRArt.close, "gr-close-art"),
    h("div", { class: "gr-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use)))),
    h("a", { class: "gr-back", href: LIFE }, art(icon("arrowLeft", 16)), "Back to Living the Christian Life")));

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "gr-sheet", "aria-labelledby": "gr-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, remember = true) {
    const item = passage(id);
    if (!item) return;
    sheet.replaceChildren(
      h("div", { class: "gr-sheet-head" }, h("h2", { id: "gr-sheet-title" }, item.label), h("button", { type: "button", class: "gr-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "gr-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "gr-sheet-src" }, "Berean Standard Bible"));
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
    const link = event.target.closest("a.gr-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  const ref = asked.get("ref");
  if (ref && passage(ref)) openSheet(ref, false);
})();
