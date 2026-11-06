// The good news, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js. A reference in the address
// (?ref=) is looked up in data.js, so an unknown value is simply ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`The good news: ${detail}`);
  }
  if (!window.GN) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.GN is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.GNArt) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon or GNArt is missing");

  const { study, passages, news, lost, numbers, sources } = window.GN;

  function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") element.className = value;
      else if (key.startsWith("on")) element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value === true ? "" : value);
    }
    element.append(...children.flat().filter((c) => c !== null && c !== undefined));
    return element;
  }
  function art(markup, className) {
    const holder = h("span", { class: className });
    holder.innerHTML = markup; // fixed drawings from art.js only
    return holder;
  }
  const refLink = (id, text) => h("a", { class: "gn-ref", href: `?ref=${id}`, "data-ref": id }, text);
  function runs(list) {
    return list.map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "gn-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if ("s" in run) return run.s ? h("a", { class: "gn-link", href: run.s, title: "Mock-up on this PC" }, h("em", {}, run.t)) : h("em", { class: "gn-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }
  const label = (text) => h("span", { class: "gn-label" }, text);

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page gn-page" });
  main.append(page);

  // ── Hero ──
  const opening = study.opening[0];
  const figures = [
    ["Parts", numbers.parts, "God, the problem, Jesus, the response, in that order"],
    ["Luke 15, whole", numbers.luke15, "verses: three lost things, read as one answer"],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
    ["Questions", numbers.questions, "readers often ask, answered after the six parts"],
  ];
  page.append(h("section", { class: "t-sec-landing gn-hero", id: "top" },
    h("div", { class: "hc-intro gn-intro" },
      h("div", {},
        h("nav", { class: "gn-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "gn-here", "aria-current": "page" }, study.title)),
        h("p", { class: "gn-concepts" }, study.concepts.join(" · ")),
        h("h1", {}, "The good ", h("em", {}, "news")),
        h("p", { class: "gn-subtitle" }, "How a person is made right with God"),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "gn-opening" }, h("blockquote", {}, passages[opening.r].verses.map((v) => v[1]).join(" ")),
          h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art gn-hero-art" }, art(GNArt.hero), h("span", { class: "ms-art-note" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1]))),
    ),
    h("dl", { class: "gn-figures" }, figures.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    h("nav", { class: "gn-toc", "aria-label": "On this page" },
      h("a", { href: "#news" }, h("b", {}, "00"), "News, then response"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title)),
      h("a", { href: "#questions" }, h("b", {}, "?"), "Questions"),
      h("a", { href: "#close" }, h("b", {}, "→"), "Close")),
  ));

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));

  // ── 00 News, then response: the habit, shown in the verses' own order ──
  page.append(h("section", { class: "t-sec gn-news", id: "news" },
    sectionHead("00", "News first.", "Then the response.", "Read the gospel as news before you read it as advice."),
    h("p", { class: "gn-frame" }, runs(study.frame)),
    h("div", { class: "gn-ledger", role: "table", "aria-label": "What God has done, and what it calls for" },
      h("div", { class: "gn-ledger-row gn-ledger-head", role: "row" }, h("span", { role: "columnheader" }, "What God has done"), h("span", { role: "columnheader", "aria-hidden": "true" }), h("span", { role: "columnheader" }, "What it calls for")),
      news.map((row) => h("div", { class: `gn-ledger-row${row.response ? "" : " is-open"}`, role: "row" },
        h("div", { role: "cell" }, h("p", { class: "gn-said" }, row.news), refLink(row.r, passages[row.r].label)),
        h("span", { class: "gn-then", role: "cell", "aria-label": "then" }, art(icon("arrowRight", 16))),
        h("div", { role: "cell" },
          row.response ? h("p", { class: "gn-said" }, row.response) : h("p", { class: "gn-said gn-left-open" }, "Jesus does not say."),
          refLink(row.then, passages[row.then].label), h("small", {}, row.note))))),
    h("p", { class: "gn-note" }, "These seven rows were chosen to show the order, and each phrase is in its verse. They are not a count of every verse that has it. ", runs(study.selection)),
  ));

  // ── 01–06 The road: six parts, one thread ──
  const road = h("section", { class: "t-sec gn-road", "aria-label": "The six parts" });
  study.parts.forEach((part) => {
    const body = h("div", { class: "gn-body" });
    let steps = null; // next steps sit side by side, in one row
    part.blocks.forEach((block, index) => {
      if (block.k === "step") {
        if (!steps) body.append(steps = h("div", { class: "gn-steps" }));
        steps.append(renderBlock(block));
      } else body.append(renderBlock(block));
      if (part.n === "03" && index === 0) body.append(lostThings());
    });
    body.append(h("dl", { class: "gn-ask" },
      h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
      h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect)))));
    road.append(h("article", { class: "gn-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("aside", { class: "gn-rail" },
        h("span", { class: "gn-dot", "aria-hidden": "true" }),
        h("span", { class: "gn-n" }, part.n),
        art(GNArt.parts[part.n], "gn-mini-wrap"),
        h("h2", { id: `part-${part.n}-title` }, part.title),
        h("p", { class: "gn-readings" }, label("Main readings"), part.readings.map((id, i) => [i ? " · " : "", refLink(id, passages[id].label)]).flat())),
      body));
  });
  page.append(road);

  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "h3": return h("h3", { class: "gn-h3" }, block.t);
      case "quote": return h("figure", { class: "gn-quote" }, h("blockquote", {}, passages[block.r].verses.map((v) => v[1]).join(" ")), h("figcaption", {}, refLink(block.r, block.label), " · BSB"));
      case "care": return h("aside", { class: "gn-care" }, label("With care"), h("p", {}, runs(block.runs)));
      case "limits": return h("p", { class: "gn-limits" }, label("Its limits"), " ", runs(block.runs));
      case "step": return h("div", { class: "gn-step", "data-step": block.label }, h("h3", {}, block.label), h("p", {}, runs(block.runs)));
      default: console.error(`The good news: unknown block ${block.k}`); return "";
    }
  }

  // Luke 15 as three fields of dots: one lost out of a hundred, out of ten, out of two. Counts come from the verses.
  function lostThings() {
    return h("figure", { class: "gn-lost", "aria-label": "One lost out of a hundred, one out of ten, one out of two" },
      lost.map((item) => h("div", { class: `gn-lost-col gn-lost-${item.id}` },
        h("div", { class: "gn-dots", "aria-hidden": "true" }, Array.from({ length: item.count }, (_, i) => h("i", { class: i === item.count - 1 ? "is-lost" : "" }))),
        h("p", { class: "gn-lost-count" }, h("b", {}, `1 of ${item.count}`), " ", item.name.toLowerCase(), " ", refLink(item.r, passages[item.r].label)),
        h("p", { class: "gn-lost-who" }, item.who, ": ", h("q", {}, item.search), " ", refLink(item.sr, passages[item.sr].label)),
        h("p", { class: "gn-lost-end" }, h("q", {}, item.end), " ", refLink(item.er, passages[item.er].label)))),
      h("figcaption", {}, "In every story the one who lost it does the looking, and every story ends in a celebration. In the third, the father goes out twice: once to the son who comes home, once to the son who will not come in."));
  }

  // ── Questions readers ask ──
  page.append(h("section", { class: "t-sec gn-questions", id: "questions" },
    sectionHead("?", "Questions", "readers ask.", "Six honest questions, answered from the same passages."),
    h("div", { class: "gn-qs" }, study.questions.map((q, i) => h("details", { class: "gn-q", open: i === 0 },
      h("summary", {}, h("span", { class: "gn-q-n" }, String(i + 1).padStart(2, "0")), h("span", { class: "gn-q-t" }, q.title), h("span", { class: "gn-q-plus", "aria-hidden": "true" })),
      h("div", { class: "gn-q-body" }, q.blocks.map(renderBlock))))),
  ));

  // ── Close ──
  const close = study.close;
  const passage = passages[close.passage];
  page.append(h("section", { class: "t-sec gn-close", id: "close" },
    sectionHead("→", close.title.replace(/\.$/, "") + ".", "Then go in."),
    h("div", { class: "gn-close-grid" },
      h("div", {},
        h("p", { class: "gn-way" }, runs(close.way)),
        h("p", { class: "gn-invite" }, runs(close.invite)),
        h("p", { class: "gn-question" }, runs(close.question)),
        h("p", { class: "gn-again" }, runs(close.again))),
      h("figure", { class: "gn-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage, passage.label), " · BSB"),
        h("div", { class: "gn-passage-text" }, passage.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))))),
    art(GNArt.close, "gn-close-art"),
    h("div", { class: "gn-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use)))),
    h("a", { class: "gn-back", href: "/study/theology?area=doctrine" }, art(icon("arrowLeft", 16)), "Back to God & Christian Faith"),
  ));

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "gn-sheet", "aria-labelledby": "gn-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    const item = passages[id];
    if (!item) return;
    sheet.replaceChildren(
      h("div", { class: "gn-sheet-head" }, h("h2", { id: "gn-sheet-title" }, item.label), h("button", { type: "button", class: "gn-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "gn-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "gn-sheet-src" }, "Berean Standard Bible"));
    if (!sheet.open) sheet.showModal();
    if (push) history.replaceState(null, "", `?ref=${encodeURIComponent(id)}${location.hash}`);
  }
  sheet.addEventListener("close", () => {
    history.replaceState(null, "", location.pathname + location.hash);
    opener?.focus();
    opener = null;
  });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.gn-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  const asked = new URLSearchParams(location.search).get("ref");
  if (asked && passages[asked]) openSheet(asked, false);
})();
