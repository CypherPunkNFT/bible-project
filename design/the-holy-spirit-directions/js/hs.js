// The Holy Spirit, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js. A reference or question in
// the address (?ref=, ?q=) is looked up in data.js, so an unknown value is simply ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`The Holy Spirit: ${detail}`);
  }
  if (!window.HS) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.HS is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.HSArt || !window.HSFigures) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon, HSArt or HSFigures is missing");

  const data = window.HS;
  const { study, heading, passages, numbers, sources } = data;
  const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

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
  function holder(markup, className) {
    const element = h("span", { class: className });
    element.innerHTML = markup; // fixed drawings from art.js only
    return element;
  }
  const art = { ...window.HSArt, svg: (body, box) => holder(`<svg viewBox="${box}" aria-hidden="true">${body}</svg>`, "hs-svg") };
  const refLink = (id, text) => h("a", { class: "hs-ref", href: `?ref=${id}`, "data-ref": id }, text);
  const label = (text) => h("span", { class: "hs-label" }, text);
  function runs(list) {
    return list.map((run) => {
      if (typeof run === "string") return run;
      if (run.chk) return h("span", { class: "hs-chk", title: `To be checked: ${run.chk}`, tabindex: "0" }, h("span", { class: "hs-sr" }, ` (to be checked: ${run.chk})`));
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "hs-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if ("s" in run) return run.s ? h("a", { class: "hs-link", href: run.s, title: "Mock-up on this PC" }, h("em", {}, run.t)) : h("em", { class: "hs-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }
  const fig = window.HSFigures({ h, refLink, label, art, data });

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page hs-page" });
  main.append(page);

  // ── Hero: the standard heading ──
  const opening = study.opening[0];
  const figures = [
    ["Readings", numbers.readings, "passages walked in full, each giving a paragraph to one part of His work"],
    ["Where He points", numbers.targets, "places, in these readings: to Jesus, to new life, to other people"],
    ["What He does", numbers.verbs, "things the passages say He does that only a person does"],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
  ];
  page.append(h("section", { class: "t-sec-landing hs-hero", id: "top" },
    h("div", { class: "hc-intro hs-intro" },
      h("div", {},
        h("nav", { class: "hs-trail", "aria-label": "Study trail" }, heading.trail.flatMap(([text, to]) => [h("a", { href: to }, text), h("span", { "aria-hidden": "true" }, "/")]), h("span", { class: "hs-here", "aria-current": "page" }, study.title)),
        h("p", { class: "hs-concepts" }, study.concepts.join(" · ")),
        h("h1", {}, heading.title[0], " ", h("em", {}, heading.title[1])),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "hs-opening" }, h("blockquote", {}, passages[opening.r].verses.map((v) => v[1]).join(" ")),
          h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art hs-hero-art" }, holder(art.hero), h("span", { class: "ms-art-note" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1])))),
    h("dl", { class: "hs-figures" }, figures.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    h("nav", { class: "hs-toc", "aria-label": "On this page" },
      h("a", { href: "#pointing" }, h("b", {}, "00"), "Where is He pointing?"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title)),
      h("a", { href: "#questions" }, h("b", {}, "07"), "Questions"),
      h("a", { href: "#close" }, h("b", {}, "→"), "Close")),
  ));

  const sectionHead = (number, title, turn, lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, turn ? [" ", h("em", {}, turn)] : null), lead ? h("p", {}, lead) : null));

  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "h3": return h("h3", { class: "hs-h3" }, block.t);
      case "quote": return h("figure", { class: "hs-quote" }, h("blockquote", {}, passages[block.r].verses.map((v) => v[1]).join(" ")), h("figcaption", {}, refLink(block.r, block.label), " · BSB"));
      case "note": return h("aside", { class: `hs-note is-${block.mark}` }, h("p", { class: "hs-note-k" }, h("span", { class: "hs-mark", "aria-hidden": "true" }), label(block.label)), h("p", {}, runs(block.runs)));
      default: console.error(`The Holy Spirit: unknown block ${block.k}`); return "";
    }
  }
  const text = (block) => (block.runs || []).map((r) => (typeof r === "string" ? r : r.t || r.i || r.b || "")).join("");

  // ── 00 Where is He pointing? The study's opening, then the floodlight ──
  page.append(h("section", { class: "t-sec hs-pointing", id: "pointing" },
    sectionHead("00", "Where is He", "pointing?", "Ask it of every passage that speaks of the Spirit."),
    h("div", { class: "hs-frame" }, study.frame.map(renderBlock)),
    fig.floodlight()));

  // ── 01–06 The readings ──
  const figureAfter = { // each part's own figure goes after the paragraph that first speaks of what it draws
    "01": [["Look at who is speaking", () => fig.strip("01")]],
    "02": [["here means languages", () => fig.nationsRoll()]],
    "03": [["Look at the order in verse 27", () => fig.strip("03")]],
    "04": [["Notice also the two names", () => fig.strip("04")]],
    "05": [["Look at which qualities stand out", () => fig.harvest()]],
    "06": [["Paul cannot speak about gifts", () => fig.strip("06")], ["No list in the New Testament", () => fig.giftLists()]],
  };
  study.parts.forEach((part) => {
    const concept = heading.conceptOf[part.n];
    const body = h("div", { class: "hs-body" });
    const waiting = [...(figureAfter[part.n] || [])];
    part.blocks.forEach((block) => {
      body.append(renderBlock(block));
      const at = waiting.findIndex(([words]) => text(block).includes(words));
      if (at >= 0) body.append(waiting.splice(at, 1)[0][1]());
    });
    waiting.forEach(([words, draw]) => { console.warn(`The Holy Spirit: part ${part.n} has no paragraph with "${words}"; figure placed at the end`); body.append(draw()); });
    body.append(fig.pointer(part.n), h("dl", { class: "hs-ask" },
      h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
      h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect)))));
    page.append(h("article", { class: "t-sec hs-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "hs-part-head" },
        h("span", { class: "hs-part-n", "aria-hidden": "true" }, part.n),
        h("div", {},
          h("p", { class: "hs-concept" }, holder(art.glyphs[concept], "hs-glyph-wrap"), concept),
          h("h2", { id: `part-${part.n}-title` }, part.title, part.turn ? [": ", h("em", {}, part.turn)] : null),
          h("p", { class: "hs-hook" }, runs(part.hook)),
          h("p", { class: "hs-readings" }, label("Main readings"), " ", part.readings.map((id, i) => [i ? " · " : "", refLink(id, passages[id].label)]).flat()))),
      fig.doesRow(part.n),
      body));
  });

  // ── 07 Questions readers bring: five words on one line, the answer beside it ──
  const qs = study.questions;
  const tabs = [], panels = [];
  qs.items.forEach((item, i) => {
    const id = `q-${i + 1}`;
    const blocks = item.blocks.map(renderBlock);
    if (i === 0) blocks.splice(1, 0, fig.verbs());
    panels.push(h("div", { class: "hs-q-panel", id, role: "tabpanel", "aria-labelledby": `${id}-tab`, hidden: i !== 0 },
      h("h3", { class: "hs-q-title" }, h("span", {}, String(i + 1).padStart(2, "0")), item.title), blocks));
    tabs.push(h("button", { type: "button", class: "hs-q-tab", id: `${id}-tab`, role: "tab", "aria-controls": id, "aria-selected": String(i === 0), tabindex: i === 0 ? "0" : "-1",
      onclick: () => choose(i, true) }, h("span", { class: "hs-q-n" }, String(i + 1).padStart(2, "0")), h("span", {}, item.title)));
  });
  function choose(index, focus) {
    tabs.forEach((tab, i) => { tab.setAttribute("aria-selected", String(i === index)); tab.tabIndex = i === index ? 0 : -1; panels[i].hidden = i !== index; });
    if (focus) tabs[index].focus();
    const params = new URLSearchParams(location.search);
    params.set("q", String(index + 1));
    history.replaceState(null, "", `?${params}${location.hash}`);
  }
  const tablist = h("div", { class: "hs-q-line", role: "tablist", "aria-label": "Questions readers bring", "aria-orientation": "vertical" }, tabs);
  tablist.addEventListener("keydown", (event) => {
    const now = tabs.indexOf(document.activeElement);
    if (now < 0) return;
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (step) { event.preventDefault(); choose((now + step + tabs.length) % tabs.length, true); }
    if (event.key === "Home") { event.preventDefault(); choose(0, true); }
    if (event.key === "End") { event.preventDefault(); choose(tabs.length - 1, true); }
  });
  page.append(h("section", { class: "t-sec hs-questions", id: "questions" },
    sectionHead("07", "Questions", "readers bring.", runs(qs.hook)),
    h("p", { class: "hs-readings" }, label("Main readings"), " ", qs.readings.map((id, i) => [i ? " · " : "", refLink(id, passages[id].label)]).flat()),
    h("div", { class: "hs-qs" }, tablist, h("div", { class: "hs-q-panels" }, panels)),
    h("dl", { class: "hs-ask" },
      h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(qs.consider))),
      h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(qs.reflect))))));
  const askedQ = Number(new URLSearchParams(location.search).get("q"));
  if (Number.isInteger(askedQ) && askedQ >= 1 && askedQ <= tabs.length) choose(askedQ - 1, false);

  // ── Close ──
  const close = study.close;
  const passage = passages[close.passage];
  page.append(h("section", { class: "t-sec hs-close", id: "close" },
    sectionHead("→", heading.closeTitle[0], heading.closeTitle[1]),
    h("div", { class: "hs-close-grid" },
      h("div", {},
        close.blocks.map(renderBlock),
        h("p", { class: "hs-question" }, runs(close.question)),
        h("p", { class: "hs-again" }, close.again)),
      h("figure", { class: "hs-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage, passage.label), " · BSB"),
        h("div", { class: "hs-passage-text" }, passage.verses.map(([cv, words]) => h("span", {}, h("sup", {}, cv.split(":")[1]), words, " "))))),
    holder(art.close, "hs-close-art"),
    h("div", { class: "hs-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use))),
      h("p", {}, "Marks on this page: ", h("span", { class: "hs-chk", "aria-hidden": "true" }), " a note the study still has to check before release; point at it to read the note.")),
    h("a", { class: "hs-back", href: heading.back[0] }, holder(icon("arrowLeft", 16)), heading.back[1]),
  ));

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "hs-sheet", "aria-labelledby": "hs-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    if (!has(passages, id)) return;
    const item = passages[id];
    sheet.replaceChildren(
      h("div", { class: "hs-sheet-head" }, h("h2", { id: "hs-sheet-title" }, item.label), h("button", { type: "button", class: "hs-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, holder(icon("x", 18)))),
      h("p", { class: "hs-sheet-text" }, item.verses.map(([cv, words]) => h("span", {}, h("sup", {}, cv), " ", words, " "))),
      h("p", { class: "hs-sheet-src" }, "Berean Standard Bible"));
    if (!sheet.open) sheet.showModal();
    if (push) {
      const params = new URLSearchParams(location.search);
      params.set("ref", id);
      history.replaceState(null, "", `?${params}${location.hash}`);
    }
  }
  sheet.addEventListener("close", () => {
    const params = new URLSearchParams(location.search);
    params.delete("ref");
    history.replaceState(null, "", `${location.pathname}${params.size ? `?${params}` : ""}${location.hash}`);
    opener?.focus();
    opener = null;
  });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.hs-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  document.addEventListener("hs:open", (event) => { opener = event.detail.from; openSheet(event.detail.id); });
  const asked = new URLSearchParams(location.search).get("ref");
  if (asked) openSheet(asked, false);
})();
