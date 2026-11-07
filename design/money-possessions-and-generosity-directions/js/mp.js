// Money, possessions and generosity, one mock-up page drawn from data.js (built by build-data.py from content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js and the shared icons.
// Values in the address (?ref=, ?q=, ?view=) are looked up in data.js, so an unknown value is simply ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`Money, possessions and generosity: ${detail}`);
  }
  if (!window.MP) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.MP is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.MPArt || !window.MPFigures) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon, MPArt or MPFigures is missing");

  const { study, passages, figures, numbers, sources } = window.MP;
  const LIFE = "/study/theology?area=life";
  const asked = new URLSearchParams(location.search);

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
  // A passage by key; a single verse inside a longer passage ("1CH.29.14" inside "1CH.29.10-19") is read from it.
  function passage(id) {
    if (passages[id]) return passages[id];
    const m = /^([1-3]?[A-Z]{2,3})\.(\d+)\.(\d+)$/.exec(id || "");
    if (!m) return null;
    for (const [key, item] of Object.entries(passages)) {
      if (!key.startsWith(`${m[1]}.`)) continue;
      const verse = item.verses.find(([cv]) => cv === `${m[2]}:${m[3]}`);
      if (verse) return { label: `${item.label.replace(/ \d.*$/, "")} ${m[2]}:${m[3]}`, verses: [verse] };
    }
    return null;
  }
  const refLink = (id, text) => h("a", { class: "mp-ref", href: `?ref=${id}`, "data-ref": id }, text);
  function runs(list) {
    return (list || []).map((run, i) => {
      if (typeof run === "string") return list[i + 1]?.c !== undefined ? run.replace(/\s+$/, "") : run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "mp-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if (run.s) return h("a", { class: "mp-link", href: run.s, title: "A study mock-up on this PC" }, h("em", {}, run.t));
      if (run.q) return h("a", { class: "mp-link", href: `?q=${run.q}#questions`, "data-q": run.q }, h("em", {}, run.t));
      if (run.c !== undefined) return run.c === "before publishing"
        ? h("span", { class: "mp-check" }, h("span", { class: "mp-check-tag" }, "to check before publishing"))
        : h("span", { class: "mp-check" }, h("span", { class: "mp-check-tag" }, "to check"), ` ${run.c}`);
      return "";
    });
  }
  const label = (text, extra = "") => h("span", { class: `mp-label ${extra}` }, text);
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
  const page = h("div", { class: "wrap t-page ms-page mp-page" });
  main.append(page);
  MPFigures.use({ h, refLink, passages: new Proxy(passages, { get: (all, id) => passage(id) }), sections: figures.sections });

  // ── Hero: the standard heading ──
  const opening = study.opening.find((b) => b.k === "quote");
  const care = study.opening.find((b) => b.k === "care");
  const figuresBar = [
    ["Parts", numbers.parts, "passages walked, each read with its address before its promise"],
    ["Lines re-addressed", numbers.heard, "lines often heard out of their setting, set back in it in 00"],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
    ["Questions", numbers.questions, "readers bring about tithing, wealth, poverty and debt"],
  ];
  const [ink, turn] = [study.title.split(" ")[0], study.title.split(" ").slice(1).join(" ")];
  page.append(h("section", { class: "t-sec-landing mp-hero", id: "top" },
    h("div", { class: "hc-intro mp-intro" },
      h("div", {},
        h("nav", { class: "mp-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: LIFE }, "Living the Christian Life"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "mp-here", "aria-current": "page" }, study.title)),
        h("p", { class: "mp-concepts" }, study.concepts.join(" · ")),
        h("h1", {}, `${ink} `, h("em", {}, turn)),
        h("p", { class: "hc-lede mp-lede" }, runs(study.lead)),
        h("figure", { class: "mp-opening" }, h("blockquote", {}, passages[opening.r].verses.map((v) => v[1]).join(" ")),
          h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art mp-hero-art" }, art(MPArt.hero), h("span", { class: "ms-art-note" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1])))),
    h("dl", { class: "mp-figures" }, figuresBar.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    care ? h("aside", { class: "mp-crisis", "aria-label": "If money trouble is crushing you" }, label("With care", "is-care"), h("p", {}, runs(care.runs))) : null,
    h("nav", { class: "mp-toc", "aria-label": "On this page" },
      h("a", { href: "#address" }, h("b", {}, "00"), "Read the address"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title)),
      h("a", { href: "#questions" }, h("b", {}, "?"), "Questions"),
      h("a", { href: "#close" }, h("b", {}, "→"), "Close"))));

  const sectionHead = (number, title, turnText, ...lead) => h("header", { class: "t-head mp-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turnText)), lead.length ? h("p", {}, ...lead) : null));

  // ── 00 Read the address ──
  const view = asked.get("view") === "address" ? "address" : "heard";
  page.append(h("section", { class: "t-sec mp-address-sec", id: "address" },
    sectionHead("00", "Read the address", "before the promise.", ...runs(study.frame)),
    MPFigures.heard(figures.heard, view, (value) => setParam("view", value === "address" ? "address" : null)),
    h("p", { class: "mp-note" }, runs(study.selection))));

  // ── Blocks of text, with each kind of note under its own label ──
  const NOTE = { care: ["With care", "is-care"], read: ["How this study reads it", "is-read"], open: ["Where readers differ", "is-open"], limit: ["Its limits", "is-limit"] };
  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "quote": {
        const text = passages[block.r].verses.map((v) => v[1]).join(" ");
        const spoken = block.frame ? text.slice(block.frame.length).trim().replace(/^[“‘]|[”’]+$/g, "") : text;
        return h("figure", { class: "mp-quote" }, h("blockquote", {}, spoken),
          h("figcaption", {}, refLink(block.r, block.label), " · BSB", block.frame ? ` · the spoken words; the verse opens “${block.frame.replace(/,$/, "")}”` : ""));
      }
      case "view": return h("div", { class: "mp-view" }, label(block.label), h("p", {}, runs(block.runs)));
      default: {
        const [name, kind] = NOTE[block.k] || [];
        if (!name) { console.error(`Money, possessions and generosity: unknown block ${block.k}`); return ""; }
        return h("aside", { class: `mp-note-block ${kind}` }, label(name), h("p", {}, runs(block.runs)));
      }
    }
  }
  // List lines that stand together make one list; two readings that stand together are set side by side.
  function renderBlocks(blocks) {
    const out = [];
    blocks.forEach((block) => {
      const last = out[out.length - 1];
      if (block.k === "li") {
        const item = h("li", {}, runs(block.runs));
        if (last?.tagName === "UL") last.append(item); else out.push(h("ul", { class: "mp-list" }, item));
      } else if (block.k === "view") {
        if (last?.classList?.contains("mp-views")) last.append(renderBlock(block)); else out.push(h("div", { class: "mp-views" }, renderBlock(block)));
      } else if ((block.k === "quote" || block.k === "p") && last?.classList?.contains("mp-views")) {
        last.lastElementChild.append(renderBlock(block)); // a reading's own quotation and paragraph stay inside it
      } else out.push(renderBlock(block));
    });
    return out;
  }

  // ── 01–07: one part per passage, each with its address and its own figure ──
  const FIG = { "01": () => MPFigures.order(figures.order), "02": () => MPFigures.yours(figures.yours), "03": () => MPFigures.tithe(figures.tithe),
    "05": () => MPFigures.bills(figures.bills), "06": () => MPFigures.reversal(figures.reversal), "07": () => MPFigures.coins(figures.coins) };
  study.parts.forEach((part) => {
    page.append(h("section", { class: `t-sec mp-part is-${figures.address[part.n].section}`, id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "mp-part-head" },
        h("div", {},
          h("span", { class: "mp-part-n", "aria-hidden": "true" }, part.n),
          h("h2", { id: `part-${part.n}-title` }, part.title),
          h("p", { class: "mp-hook" }, runs(part.hook)),
          h("p", { class: "mp-readings" }, label("Main readings"), " ", part.readings.map((id, i) => [i ? " · " : "", refLink(id, passages[id].label)]))),
        MPFigures.partAddress(figures.address[part.n], part.readings)),
      FIG[part.n] ? FIG[part.n]() : null,
      h("div", { class: "mp-body" }, renderBlocks(part.blocks)),
      h("dl", { class: "mp-ask" },
        h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
        h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect))))));
  });

  // ── Questions readers bring: four titles joined by a line, one open at a time ──
  const panel = h("div", { class: "mp-q-panel", id: "mp-q-panel", "aria-live": "polite" });
  const qButtons = study.questions.map((q, i) => h("button", { type: "button", class: "mp-q", "aria-controls": "mp-q-panel", onclick: () => openQuestion(i, true) },
    h("span", { class: "mp-q-n" }, String(i + 1).padStart(2, "0")), h("span", { class: "mp-q-t" }, q.title)));
  function openQuestion(index, remember) {
    const q = study.questions[index];
    qButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    panel.replaceChildren(h("h3", { class: "mp-q-title" }, q.title), h("div", { class: "mp-q-body" }, renderBlocks(q.blocks)));
    if (remember) setParam("q", q.id);
  }
  page.append(h("section", { class: "t-sec mp-questions", id: "questions" },
    sectionHead("?", "Questions", "readers bring.", "Four questions people ask about giving, wealth and need, answered from Scripture. Choose one to read its answer."),
    h("div", { class: "mp-q-row", role: "group", "aria-label": "Questions" }, qButtons), panel));
  const chosen = study.questions.findIndex((q) => q.id === asked.get("q"));
  openQuestion(chosen >= 0 ? chosen : 0, false);
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-q]");
    if (!link) return;
    event.preventDefault();
    const index = study.questions.findIndex((q) => q.id === link.dataset.q);
    if (index < 0) return;
    openQuestion(index, true);
    qButtons[index].focus();
    document.getElementById("questions").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });

  // ── Close ──
  const close = study.close;
  const closing = passages[close.passage];
  page.append(h("section", { class: "t-sec mp-close", id: "close" },
    sectionHead("→", "Reading", "the address."),
    MPFigures.way(figures.way),
    h("div", { class: "mp-close-grid" },
      h("div", {},
        h("p", { class: "mp-way-text" }, runs(close.way)),
        h("p", { class: "mp-closing" }, runs(close.close)),
        h("p", { class: "mp-invite" }, runs(close.invite)),
        h("p", { class: "mp-question" }, runs(close.question)),
        h("p", { class: "mp-again" }, runs(close.again))),
      h("figure", { class: "mp-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage, closing.label), " · BSB"),
        h("div", { class: "mp-passage-text" }, closing.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))))),
    art(MPArt.close, "mp-close-art"),
    h("div", { class: "mp-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use)))),
    h("a", { class: "mp-back", href: LIFE }, art(icon("arrowLeft", 16)), "Back to Living the Christian Life")));

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "mp-sheet", "aria-labelledby": "mp-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, remember = true) {
    const item = passage(id);
    if (!item) return;
    sheet.replaceChildren(
      h("div", { class: "mp-sheet-head" }, h("h2", { id: "mp-sheet-title" }, item.label), h("button", { type: "button", class: "mp-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "mp-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "mp-sheet-src" }, "Berean Standard Bible"));
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
    const link = event.target.closest("a.mp-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  const ref = asked.get("ref");
  if (ref && passage(ref)) openSheet(ref, false);
})();
