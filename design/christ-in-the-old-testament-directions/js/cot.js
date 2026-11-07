// Christ in the Old Testament, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js. A reference in the address
// (?ref=) is looked up in data.js with Object.hasOwn, so an unknown value is simply ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`Christ in the Old Testament: ${detail}`);
  }
  if (!window.COT) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.COT is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.COTArt || !window.COTMap) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon, COTArt or COTMap is missing");

  const data = window.COT;
  const { study, passages, heading, numbers, sources, first, stops, beyond, warning, lines } = data;
  const has = (id) => typeof id === "string" && Object.hasOwn(passages, id);

  function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") element.className = value;
      else if (key.startsWith("on")) element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value === true ? "" : value);
    }
    element.append(...children.flat(Infinity).filter((c) => c !== null && c !== undefined));
    return element;
  }
  function art(markup, className) {
    const holder = h("span", { class: className });
    holder.innerHTML = markup; // fixed drawings from art.js only
    return holder;
  }
  const refLink = (id, text) => h("a", { class: "cot-ref", href: `?ref=${id}`, "data-ref": id }, text);
  function runs(list) {
    return (list || []).map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "cot-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if (run.chk) return h("span", { class: "cot-unchecked", title: `Still to be checked before release: ${run.chk}` }, " ", h("span", { "aria-hidden": "true" }, "to be checked"), h("span", { class: "cot-sr" }, `(still to be checked before release: ${run.chk})`));
      if ("s" in run) return run.s ? h("a", { class: "cot-link", href: run.s, title: "Mock-up on this PC" }, h("em", {}, run.t)) : h("em", { class: "cot-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }
  const label = (text) => h("span", { class: "cot-label" }, text);
  const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);
  const figureName = (n) => heading.figures.find((f) => f[0] === n)[1];
  const MARKS = {
    first: '<svg viewBox="0 0 22 14" aria-hidden="true"><circle cx="11" cy="7" r="4"/></svg>',
    line: '<svg viewBox="0 0 22 14" aria-hidden="true"><path d="M2 12C2 4 20 10 20 2"/></svg>',
    stop: '<svg viewBox="0 0 22 14" aria-hidden="true"><path d="M2 7h14M18 1v12"/></svg>',
    readers: '<svg viewBox="0 0 22 14" aria-hidden="true"><circle cx="8" cy="7" r="4"/><circle cx="15" cy="7" r="4"/></svg>',
  };

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page cot-page" });
  main.append(page);

  // ── Hero: the standard heading ──
  const opening = study.opening[0];
  const named = lines.filter((l) => l.fig !== "06");
  const figures = [
    ["Figures", numbers.figures, "the New Testament itself connects with Christ, one part each"],
    ["Lines drawn", numbers.lines, `each from a New Testament verse to an Old Testament one; ${named.filter((l) => l.kind === "either").length} are dashed, the source uncertain`],
    ["Parts reached", `${numbers.parts} of 3`, "the Law of Moses, the Prophets and the Psalms, as Luke 24:44 names them"],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
  ];
  const [trailStudy, trailCategory] = heading.trail;
  page.append(h("section", { class: "t-sec-landing cot-hero", id: "top" },
    h("div", { class: "hc-intro cot-intro" },
      h("div", {},
        h("nav", { class: "cot-trail", "aria-label": "Study trail" }, h("a", { href: trailStudy[1] }, trailStudy[0]), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: trailCategory[1] }, trailCategory[0]), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "cot-here", "aria-current": "page" }, study.title)),
        h("p", { class: "cot-concepts" }, heading.concepts.words.map(cap).join(" · ")),
        h("h1", {}, `${heading.title[0]} `, h("em", {}, heading.title[1])),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "cot-opening" }, h("blockquote", {}, passages[opening.r].verses.map((v) => v[1]).join(" ")),
          h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art cot-hero-art" }, art(COTArt.hero), h("span", { class: "ms-art-note" }, h("i"), cap(heading.motto.lines[0]), h("br"), h("span", {}, heading.motto.lines[1])))),
    h("dl", { class: "cot-figures" }, figures.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    h("nav", { class: "cot-toc", "aria-label": "On this page" },
      h("a", { href: "#lines" }, h("b", {}, "00"), "The lines it draws"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title)),
      h("a", { href: "#close" }, h("b", {}, "→"), "Read with Him")),
  ));

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));

  // ── 00 The lines it draws: the frame, the anatomy of one line, then the map ──
  const frameText = study.frame.filter((b) => b.k === "p");
  const questions = study.frame.filter((b) => b.k === "q3");
  const lastIntro = study.frame.findIndex((b) => b.k === "q3");
  const before = study.frame.slice(0, lastIntro).filter((b) => b.k === "p");
  const after = frameText.filter((b) => !before.includes(b));
  const drawn = COTMap.map(data, h, refLink);
  const chips = [["all", "All five"], ...heading.figures.slice(0, 5), ["06", "Further lines"], ["every", "Every line"]];
  const chipBar = h("div", { class: "cot-chips", role: "group", "aria-label": "Show the lines of one figure" },
    chips.map(([fig, name]) => h("button", { type: "button", class: "cot-chip", "data-fig": fig, "aria-pressed": fig === "all" ? "true" : "false",
      onclick: (event) => {
        chipBar.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === event.currentTarget)));
        drawn.setFigure(fig);
      } }, name)));
  page.append(h("section", { class: "t-sec cot-lines", id: "lines" },
    sectionHead("00", "The lines", "it draws.", "Draw only the lines the New Testament draws. Then look for where each picture stops."),
    h("div", { class: "cot-frame" }, before.map((b) => h("p", {}, runs(b.runs)))),
    h("figure", { class: "cot-anatomy" },
      h("figcaption", {}, label("One line, three questions"), " Carry them through every part. The study asks them in this order, and each belongs to one place on the line."),
      COTMap.anatomy(),
      h("ol", { class: "cot-q3" }, questions.map((q) => h("li", { class: `is-${["line", "first", "stop"][q.n - 1]}` },
        h("span", { class: "cot-q3-n" }, String(q.n)), art(MARKS[["line", "first", "stop"][q.n - 1]], "cot-mark"),
        h("h3", {}, q.ask), h("p", {}, runs(q.runs)))))),
    h("figure", { class: "cot-map" },
      h("figcaption", {}, h("span", { class: "cot-map-q" }, "Where does the New Testament draw a line back to the Old?"), h("span", { class: "cot-wide-only" }, " Each curve runs from a New Testament verse up to the passage it quotes or names. Solid: the verse says it. Dashed: one of several possible sources."), h("span", { class: "cot-narrow-only" }, " Each line: a New Testament verse, then the passage it quotes or names. Marked “one possible source” where the text does not say which.")),
      chipBar, drawn.count, drawn.art, drawn.readout, drawn.list),
    after.map((b) => h("p", { class: "cot-note" }, runs(b.runs))),
  ));
  drawn.setFigure("all");

  // ── 01–06 The figures: the reading, and beside it the line for that figure ──
  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "h3": return h("h3", { class: `cot-h3 is-${block.mark}` }, art(MARKS[block.mark], "cot-mark"), h("span", {}, block.t));
      case "quote": return h("figure", { class: "cot-quote" }, h("blockquote", {}, passages[block.r].verses.map((v) => v[1]).join(" ")), h("figcaption", {}, refLink(block.r, block.label), " · BSB"));
      default: console.error(`Christ in the Old Testament: unknown block ${block.k}`); return "";
    }
  }
  const node = (cls, tag, words, id, note) => h("li", { class: `cot-stem-${cls}` },
    h("span", { class: "cot-stem-tag" }, tag), h("q", {}, words), " ", refLink(id, passages[id].label), note ? h("small", {}, note) : null);
  function stem(n) {
    if (n === "06") {
      return h("aside", { class: "cot-stem is-further", "aria-label": "Further lines, and a reading beyond them" },
        label("Further lines"),
        h("ol", {}, lines.filter((l) => l.fig === "06").map((l) => node("line", `Back to ${passages[l.otr].label}`, l.nt_words, l.ntr, null))),
        h("ol", { class: "cot-stem-after" },
          node("stop", "Made the point", warning.words, warning.r, "A figure that points to God is not to be worshipped for itself."),
          node("beyond", `Beyond the line · ${beyond.source}`, beyond.words, beyond.r, beyond.note)));
    }
    const mine = lines.filter((l) => l.fig === n);
    return h("aside", { class: "cot-stem", "aria-label": `The line for ${figureName(n).toLowerCase()}` },
      label("The line"),
      h("ol", {},
        node("first", "Then", first[n].words, first[n].r, null),
        mine.map((l) => node(l.kind === "either" ? "either" : "line", l.kind === "either" ? "Perhaps" : "Drawn by", l.nt_words, l.ntr, l.kind === "either" ? `from ${passages[l.otr].label}, ${COTMap.KIND.either}` : `from ${passages[l.otr].label}`)),
        stops[n].map((s) => node(s.runs_on ? "on" : "stop", s.runs_on ? "Runs on" : "Stops", s.words, s.r, s.note))));
  }
  study.parts.forEach((part) => {
    page.append(h("article", { class: `cot-part${part.n === "06" ? " is-limits" : ""}`, id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "cot-part-head" },
        h("span", { class: "cot-n", "aria-hidden": "true" }, part.n),
        art(COTArt.parts[part.n], "cot-mini-wrap"),
        h("div", {},
          h("h2", { id: `part-${part.n}-title` }, part.title, h("em", {}, `: ${part.turn}`)),
          h("p", { class: "cot-hook" }, runs(part.hook)),
          h("p", { class: "cot-readings" }, label("Main readings"), " ", part.readings.map((id, i) => [i ? " · " : "", refLink(id, passages[id].label)])))),
      h("div", { class: "cot-part-grid" },
        h("div", { class: "cot-body" }, part.blocks.map(renderBlock),
          h("dl", { class: "cot-ask" },
            h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
            h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect))))),
        stem(part.n))));
  });

  // ── Close ──
  const close = study.close;
  const passage = passages[heading.close];
  page.append(h("section", { class: "t-sec cot-close", id: "close" },
    sectionHead("→", "Read the Old Testament", "with Him."),
    h("div", { class: "cot-close-grid" },
      h("div", {},
        close.blocks.map((b) => h("p", { class: "cot-way" }, runs(b.runs))),
        h("p", { class: "cot-question" }, label("Your question"), h("br"), runs(close.your_question)),
        h("p", { class: "cot-again" }, close.again)),
      h("figure", { class: "cot-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(heading.close, passage.label), " · BSB"),
        h("div", { class: "cot-passage-text", tabindex: "0", role: "region", "aria-label": passage.label }, passage.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))))),
    art(COTArt.close, "cot-close-art"),
    h("div", { class: "cot-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use)))),
    h("a", { class: "cot-back", href: trailCategory[1] }, art(icon("arrowLeft", 16)), `Back to ${trailCategory[0]}`),
  ));

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "cot-sheet", "aria-labelledby": "cot-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    if (!has(id)) return;
    const item = passages[id];
    sheet.replaceChildren(
      h("div", { class: "cot-sheet-head" }, h("h2", { id: "cot-sheet-title" }, item.label), h("button", { type: "button", class: "cot-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "cot-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "cot-sheet-src" }, "Berean Standard Bible"));
    if (!sheet.open) sheet.showModal();
    if (push) history.replaceState(null, "", `?ref=${encodeURIComponent(id)}${location.hash}`);
  }
  sheet.addEventListener("close", () => {
    history.replaceState(null, "", location.pathname + location.hash);
    (opener && document.contains(opener) ? opener : document.querySelector("h1"))?.focus({ preventScroll: !opener });
    opener = null;
  });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.cot-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref || link.getAttribute("data-ref"));
  });
  document.querySelector("h1")?.setAttribute("tabindex", "-1");
  const asked = new URLSearchParams(location.search).get("ref");
  if (has(asked)) openSheet(asked, false);
})();
