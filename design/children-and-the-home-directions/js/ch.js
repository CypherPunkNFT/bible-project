// Children and the home, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js and the shared icon set.
// Values in the address (?ref=, ?kind=, ?ring=) are looked up in data.js, so an unknown value is simply ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`Children and the home: ${detail}`);
  }
  if (!window.CH) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.CH is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.CHArt || !window.CHFigures) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon, CHArt or CHFigures is missing");

  const { study, kinds, passages, figures, numbers, trail, titleParts, sources } = window.CH;
  const [TRAIL_NAME, TRAIL_HREF] = trail;
  const SECTIONS = [["history", "GEN", "EST"], ["poetry", "JOB", "SNG"], ["prophets", "ISA", "MAL"], ["gospels", "MAT", "JHN"], ["acts", "ACT", "ACT"], ["epistles", "ROM", "JUD"], ["revelation", "REV", "REV"]];
  const CANON = ["GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO", "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL", "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"];
  const sectionOf = (key) => {
    const at = CANON.indexOf(String(key).split(".")[0]);
    return (SECTIONS.find(([, from, to]) => at >= CANON.indexOf(from) && at <= CANON.indexOf(to)) || ["history"])[0];
  };

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
  const refLink = (id, text) => h("a", { class: `ch-ref is-${sectionOf(id)}`, href: `?ref=${id}`, "data-ref": id }, text);
  function runs(list) {
    return (list || []).map((run, i) => {
      if (typeof run === "string") return list[i + 1]?.c !== undefined ? run.replace(/\s+$/, "") : run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "ch-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if (run.s) return h("a", { class: "ch-link", href: run.s, title: "A study mock-up on this PC" }, h("em", {}, run.t));
      if (run.c !== undefined) return run.c === "before publishing"
        ? h("span", { class: "ch-check" }, h("span", { class: "ch-check-tag" }, "to check before publishing"))
        : h("span", { class: "ch-check" }, h("span", { class: "ch-check-tag" }, "to check"), ` ${run.c}`);
      return "";
    });
  }
  const label = (text, extra = "") => h("span", { class: `ch-label ${extra}` }, text);
  function setParam(name, value) {
    const params = new URLSearchParams(location.search);
    if (value === null) params.delete(name); else params.set(name, value);
    const query = params.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
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
  const page = h("div", { class: "wrap t-page ch-page" });
  main.append(page);
  let opener = null;
  CHFigures.use({ h, refLink, setParam });

  // ── Hero: the standard heading ──
  const opening = study.opening.find((b) => b.k === "quote");
  const care = study.opening.find((b) => b.k === "care");
  const figuresBar = [
    ["Kinds of sentence", numbers.kinds, "the study names: command, song, story and saying, each asking something different"],
    ["Limits", numbers.limits, "one in every part, saying what its passage does not promise"],
    ["Generations", numbers.links, "named in one chain in Psalm 78:5–6"],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
  ];
  page.append(h("section", { class: "t-sec-landing ch-hero", id: "top" },
    h("div", { class: "hc-intro ch-intro" },
      h("div", {},
        h("nav", { class: "ch-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: TRAIL_HREF }, TRAIL_NAME), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "ch-here", "aria-current": "page" }, study.title)),
        h("p", { class: "ch-concepts" }, study.concepts.join(" · ")),
        h("h1", {}, `${titleParts[0]} `, h("em", {}, titleParts[1])),
        h("p", { class: "hc-lede ch-lede" }, runs(study.lead)),
        h("figure", { class: "ch-opening" }, h("blockquote", {}, verseText(opening.r)),
          h("figcaption", {}, kindTag(opening), refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art ch-hero-art" }, art(CHArt.hero), h("span", { class: "ms-art-note" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1])))),
    h("dl", { class: "ch-figures" }, figuresBar.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    care ? h("aside", { class: "ch-crisis", "aria-label": "If someone at home is hurting you" },
      h("p", { class: "ch-crisis-lead" }, runs(care.runs)),
      h("ul", { class: "ch-lines" }, (care.items || []).map((item) => h("li", {}, runs(item)))),
      (care.more || []).map((more) => h("p", {}, runs(more)))) : null,
    h("nav", { class: "ch-toc", "aria-label": "On this page" },
      h("a", { href: "#kinds" }, h("b", {}, "00"), "What kind of sentence?"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title)),
      h("a", { href: "#questions" }, h("b", {}, "?"), "Questions"),
      h("a", { href: "#close" }, h("b", {}, "→"), "Close"))));

  function kindTag(block, wide = false) {
    const kind = kinds[block.kind];
    if (!kind) return h("span", { class: "ch-kind is-none", title: block.why || "" }, art(CHArt.mark("letter", wide ? 26 : 16)), h("span", {}, wide ? "Letter" : ""), wide ? h("small", {}, block.why) : null);
    return h("span", { class: `ch-kind is-${block.kind}` }, art(CHArt.mark(kind.mark, wide ? 26 : 16)), h("span", {}, kind.name), wide ? h("small", {}, `to be ${kind.asks}`) : null);
  }

  // ── 00 What kind of sentence is it? The key, which marks every quotation of one kind on the page ──
  const quoteFigures = [];
  const kindList = h("p", { class: "ch-key-list", "aria-live": "polite" });
  const kindButtons = Object.entries(kinds).map(([id, kind]) => h("div", { class: `ch-key-item is-${id}` },
    art(CHArt.mark(kind.mark, 44), "ch-key-mark"),
    h("h3", {}, kind.name),
    h("p", { class: "ch-key-sample" }, h("q", {}, kind.sample), " ", refLink(kind.r, kind.ref)),
    h("p", { class: "ch-key-asks" }, `To be ${kind.asks}.`),
    h("button", { type: "button", class: "ch-key-btn", "aria-pressed": "false", "data-kind": id, onclick: () => chooseKind(id, true) },
      `Mark ${numbers.kindsOnPage[id]} on this page`)));
  function chooseKind(id, remember) {
    const current = document.body.dataset.kind;
    const next = current === id || !kinds[id] ? null : id;
    if (next) document.body.dataset.kind = next; else delete document.body.dataset.kind;
    page.querySelectorAll(".ch-key-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === next)));
    const marked = quoteFigures.filter((f) => f.dataset.kind === next);
    kindList.replaceChildren(...(next ? [label(`${kinds[next].name}s on this page`), " ", ...marked.flatMap((f, i) => [i ? " · " : "", h("a", { class: "ch-link", href: `#${f.id}` }, f.dataset.label)])] : ["Choose a kind to mark its quotations through the page."]));
    if (remember) setParam("kind", next);
  }
  page.append(h("section", { class: "t-sec ch-key-sec", id: "kinds" },
    sectionHead("00", "What kind of", "sentence is it?", "Ask it of every line about family before you hold it as a promise."),
    h("p", { class: "ch-frame" }, runs(study.frame)),
    h("div", { class: "ch-key", role: "group", "aria-label": "Four kinds of sentence" }, kindButtons),
    kindList,
    h("p", { class: "ch-note" }, runs(study.selection))));

  function sectionHead(number, title, turnText, ...lead) {
    return h("header", { class: "t-head ch-head" }, h("span", { class: "t-num", "aria-hidden": "true" }, number),
      h("div", {}, h("h2", {}, title, " ", h("em", {}, turnText)), lead.length ? h("p", {}, ...lead) : null));
  }

  // ── Blocks of text: quotations carry their kind in the margin; notes carry their label there ──
  const NOTE = { care: ["With care", "is-care"], open: ["An open question", "is-open"], limits: ["Its limits", "is-limits"] };
  let quoteCount = 0;
  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", { class: "ch-p" }, runs(block.runs));
      case "h3": return h("h3", { class: "ch-h3" }, block.t);
      case "quote": {
        const figure = h("figure", { class: "ch-quote", id: `q-${++quoteCount}`, "data-kind": block.kind || "none", "data-label": block.label },
          h("div", { class: "ch-gutter" }, kindTag(block, true)),
          h("div", {}, h("blockquote", {}, verseText(block.r)), h("figcaption", {}, refLink(block.r, block.label), " · BSB")));
        quoteFigures.push(figure);
        return figure;
      }
      default: {
        const [name, kind] = NOTE[block.k] || [];
        if (!name) { console.error(`Children and the home: unknown block ${block.k}`); return ""; }
        return h("aside", { class: `ch-noted ${kind}` }, h("div", { class: "ch-gutter" }, label(name)), h("p", {}, runs(block.runs)));
      }
    }
  }

  // ── 01–06: one part per reading, each opening with the figure drawn from its own verses ──
  const FIG = {
    "01": () => [CHFigures.rings(figures.rings)],
    "02": () => [CHFigures.answer(figures.answer), CHFigures.chain(figures.chain, figures.timothy)],
    "03": () => [CHFigures.vain(figures.vain)],
    "04": () => [CHFigures.loves(figures.loves, figures.renamed, figures.robe)],
    "05": () => [CHFigures.threads(figures.threads, figures.eli, figures.robes)],
    "06": () => [CHFigures.road(figures.pair, figures.spoken, figures.road)],
  };
  study.parts.forEach((part) => {
    const partKinds = [...new Set(part.blocks.filter((b) => b.k === "quote" && b.kind).map((b) => b.kind))];
    page.append(h("section", { class: "t-sec ch-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "ch-part-head" },
        h("span", { class: "ch-part-n", "aria-hidden": "true" }, part.n),
        art(CHArt.miniature(part.n), "ch-part-mini"),
        h("div", {},
          h("h2", { id: `part-${part.n}-title` }, part.title),
          h("p", { class: "ch-hook" }, runs(part.hook)),
          h("p", { class: "ch-readings" }, label("Main readings"), " ", part.readings.map((id, i) => [i ? " · " : "", refLink(id, passages[id].label)]), part.readingsNote ? h("span", { class: "ch-readings-note" }, ` (${part.readingsNote})`) : null),
          h("p", { class: "ch-part-kinds" }, label("Kinds of sentence here"), " ", partKinds.map((k) => kindTag({ kind: k }))))),
      h("div", { class: "ch-figs" }, FIG[part.n] ? FIG[part.n]() : null),
      h("div", { class: "ch-body" }, part.blocks.map(renderBlock)),
      h("dl", { class: "ch-ask" },
        h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
        h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect))))));
  });

  // ── Questions readers bring: all three answers in view, side by side ──
  page.append(h("section", { class: "t-sec ch-questions", id: "questions" },
    sectionHead("?", "Questions", "readers bring.", "Three questions people ask about their own homes, answered from the passages above."),
    h("div", { class: "ch-q-row" }, study.questions.map((q, i) => h("article", { class: "ch-q", "aria-labelledby": `q-title-${i + 1}` },
      h("p", { class: "ch-q-n" }, String(i + 1).padStart(2, "0")),
      h("h3", { id: `q-title-${i + 1}` }, runs(q.title)),
      q.blocks.map(renderBlock))))));

  // ── Close: the way of reading, the four kinds once more, and the passage again ──
  const close = study.close;
  const closing = passages[close.passage];
  page.append(h("section", { class: "t-sec ch-close", id: "close" },
    sectionHead("→", close.title.split(" ").slice(0, 3).join(" "), `${close.title.split(" ").slice(3).join(" ")}.`),
    h("div", { class: "ch-close-grid" },
      h("div", {},
        h("p", { class: "ch-way" }, runs(close.way)),
        h("ul", { class: "ch-way-kinds" }, Object.values(kinds).map((kind) => h("li", {}, art(CHArt.mark(kind.mark, 22)), h("b", {}, kind.name), ` · ${kind.way}`))),
        h("p", { class: "ch-closing" }, runs(close.close)),
        h("p", { class: "ch-invite" }, runs(close.invite)),
        h("p", { class: "ch-question" }, runs(close.question)),
        h("p", { class: "ch-again" }, runs(close.again))),
      h("figure", { class: "ch-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage, closing.label), " · BSB"),
        h("p", { class: "ch-passage-text" }, closing.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))))),
    art(CHArt.close, "ch-close-art"),
    h("div", { class: "ch-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use)))),
    h("a", { class: "ch-back", href: TRAIL_HREF }, art(icon("arrowLeft", 16)), `Back to ${TRAIL_NAME}`)));

  const askedKind = new URLSearchParams(location.search).get("kind");
  chooseKind(kinds[askedKind] ? askedKind : null, false);

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "ch-sheet", "aria-labelledby": "ch-sheet-title" });
  document.body.append(sheet);
  function openSheet(id, remember = true) {
    const item = passages[id];
    if (!item) return;
    sheet.replaceChildren(
      h("div", { class: "ch-sheet-head" }, h("h2", { id: "ch-sheet-title" }, item.label), h("button", { type: "button", class: "ch-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "ch-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "ch-sheet-src" }, "Berean Standard Bible"));
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
    const link = event.target.closest("a[data-ref]");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  const ref = new URLSearchParams(location.search).get("ref");
  if (ref && passages[ref]) openSheet(ref, false);
})();
