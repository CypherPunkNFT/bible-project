// Chosen and kept, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js. A reference in the address
// (?ref=) is looked up in data.js, so an unknown value is simply ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`Chosen and kept: ${detail}`);
  }
  if (!window.CK) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.CK is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.CKArt || !window.CKFigures) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon, CKArt or CKFigures is missing");

  const data = window.CK;
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
    element.append(...children.flat(Infinity).filter((c) => c !== null && c !== undefined));
    return element;
  }
  function holder(markup, className) {
    const element = h("span", { class: className });
    element.innerHTML = markup; // fixed drawings from art.js only
    return element;
  }
  const art = window.CKArt;
  const refLink = (id, text) => h("a", { class: "ck-ref", href: `?ref=${id}`, "data-ref": id }, text);
  const label = (text) => h("span", { class: "ck-label" }, text);
  function runs(list) {
    return list.map((run) => {
      if (typeof run === "string") return run;
      if (run.chk) return h("span", { class: "ck-chk", title: `To be checked: ${run.chk}`, tabindex: "0" }, h("span", { class: "ck-sr" }, ` (to be checked: ${run.chk})`));
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "ck-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if ("s" in run) return run.s ? h("a", { class: "ck-link", href: run.s, title: "Mock-up on this PC" }, h("em", {}, run.t)) : h("em", { class: "ck-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }
  const fig = window.CKFigures({ h, refLink, holder, art, data });

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page ck-page" });
  main.append(page);

  // ── Hero: the standard heading ──
  const opening = study.opening[0];
  const figures = [
    ["Passages", numbers.readings, `walked in full: ${numbers.letters} from the letters, ${numbers.gospels} from the Gospels`],
    ["Purposes", numbers.purposes, "a passage can be written for here: to praise, to comfort, to warn, to answer"],
    ["Fears", numbers.fears, "named in the study's own words, each sent to a promise in its own passage"],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
  ];
  page.append(h("section", { class: "t-sec-landing ck-hero", id: "top" },
    h("div", { class: "hc-intro ck-intro" },
      h("div", {},
        h("nav", { class: "ck-trail", "aria-label": "Study trail" }, heading.trail.map(([text, to]) => [h("a", { href: to }, text), h("span", { "aria-hidden": "true" }, "/")]), h("span", { class: "ck-here", "aria-current": "page" }, "Chosen and kept")),
        h("p", { class: "ck-concepts" }, study.concepts.join(" · ")),
        h("h1", {}, heading.title[0], " ", h("em", {}, heading.title[1])),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "ck-opening" }, h("blockquote", {}, passages[opening.r].verses.map((v) => v[1]).join(" ")),
          h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art ck-hero-art" }, holder(art.hero), h("span", { class: "ms-art-note" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1])))),
    h("dl", { class: "ck-figures" }, figures.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    h("nav", { class: "ck-toc", "aria-label": "On this page" },
      h("a", { href: "#written" }, h("b", {}, "00"), "What was it written to do?"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title)),
      h("a", { href: "#close" }, h("b", {}, "→"), "Close")),
  ));

  const sectionHead = (number, title, turn, lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, turn ? [" ", h("em", {}, turn)] : null), lead ? h("p", {}, lead) : null));

  // A paragraph that opens with one of the study's own bold labels gets that label's kind, so its limits, its setting
  // and the site's own reading can be told apart at a glance. The label stays in the text.
  const KINDS = { "Setting.": "setting", "What it does not say.": "limit", "What this does not license.": "limit", "What it does not promise.": "limit",
    "What the confession says.": "site", "The site’s answer.": "site", "What both readings hold.": "both", "The Calvinist reading": "view", "The non-Calvinist reading": "view" };
  const kindOf = (block) => (block.runs && block.runs[0] && block.runs[0].b ? KINDS[block.runs[0].b] : undefined);
  const MARK = { limit: "What it does not say", site: "This site's reading", setting: "Setting" };

  function renderBlock(block) {
    switch (block.k) {
      case "p": {
        const kind = kindOf(block);
        return h("p", { class: kind ? `ck-p is-${kind}` : null }, kind && MARK[kind] ? h("span", { class: "ck-mark", title: MARK[kind], "aria-hidden": "true" }) : null, runs(block.runs));
      }
      case "hook": return h("p", { class: "ck-hook" }, runs(block.runs));
      case "h3": return h("h3", { class: "ck-h3" }, block.t);
      case "ul": return h("ul", { class: "ck-ul" }, block.items.map((item) => h("li", {}, runs(item))));
      case "ol": return h("ol", { class: "ck-ol" }, block.items.map((item, i) => h("li", { class: i === data.otherView ? "is-other" : null },
        i === data.otherView ? h("p", { class: "ck-other" }, h("span", { class: "ck-mark", "aria-hidden": "true" }), label("Another tradition, in its own words")) : null, runs(item))));
      case "quote": return h("figure", { class: "ck-quote" }, h("blockquote", {}, passages[block.r].verses.map((v) => v[1]).join(" ")), h("figcaption", {}, refLink(block.r, block.label), " · BSB"));
      case "care": return h("aside", { class: "ck-care" }, h("p", {}, label("With care")), h("p", {}, runs(block.runs)));
      default: console.error(`Chosen and kept: unknown block ${block.k}`); return "";
    }
  }
  const text = (block) => (block.runs || []).map((r) => (typeof r === "string" ? r : r.t || r.i || r.b || "")).join("");

  // ── 00 What was it written to do? The study's frame, with the reading key after the habit ──
  const frame = study.frame.map(renderBlock);
  frame.splice(1, 0, fig.purposeKey());
  page.append(h("section", { class: "t-sec ck-written", id: "written" },
    sectionHead("00", "What was it", "written to do?", "Ask it of each passage before you ask whether the passage is about you."),
    h("div", { class: "ck-frame" }, frame)));

  // ── 01–07 The passages ──
  const figureAfter = { // each part's own figure goes after the paragraph that first speaks of what it draws
    "01": [["Look at what the sentence says", fig.sentence]],
    "02": [["There are five links", fig.chain], ["What it does not say.", fig.dangers]],
    "03": [["He answers with a potter", fig.objections]],
    "04": [["The verse has two halves", fig.halves], ["The believer is held in the Son", fig.hands]],
    "05": [["The writer pictures two fields", fig.fields]],
    "06": [["is in His Son", fig.ground]],
    "07": [["Read the first sentence first", fig.first]],
  };
  study.parts.forEach((part) => {
    const kinds = data.purposeOf[part.n].kinds;
    const body = h("div", { class: "ck-body" });
    const waiting = [...(figureAfter[part.n] || [])];
    let readings = null;
    part.blocks.forEach((block) => {
      if (kindOf(block) === "view") {
        if (!readings) body.append(readings = h("div", { class: "ck-views" }));
        readings.append(renderBlock(block));
      } else body.append(renderBlock(block));
      const at = waiting.findIndex(([words]) => text(block).includes(words));
      if (at >= 0) body.append(waiting.splice(at, 1)[0][1]());
    });
    waiting.forEach(([words, draw]) => { console.warn(`Chosen and kept: part ${part.n} has no paragraph with "${words}"; figure placed at the end`); body.append(draw()); });
    body.append(h("p", { class: "ck-written-for" }, label("Written to"), " ", data.purposeOf[part.n].close),
      h("dl", { class: "ck-ask" },
        h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
        h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect)))));
    page.append(h("article", { class: `t-sec ck-part is-${data.sec[part.n]}`, id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "ck-part-head" },
        h("div", { class: "ck-part-mark", "aria-hidden": "true" }, holder(art.glyphs[kinds[0]], "ck-glyph-wrap"), h("span", {}, part.n)),
        h("div", {},
          h("p", { class: "ck-kicker" }, `${part.n} · Written to ${kinds.map((k) => fig.purposeName[k].toLowerCase().replace("warning", "warn")).join(", and to ")}`),
          h("h2", { id: `part-${part.n}-title` }, part.title, part.turn ? [": ", h("em", {}, part.turn)] : null),
          h("p", { class: "ck-readings" }, label("Main readings"), " ", part.readings.map((id, i) => [i ? " · " : "", refLink(id, passages[id].label)]),
            part.quoted && part.quoted.length ? [" · quoted, ", part.quoted.map((id) => refLink(id, passages[id].label))] : null))),
      body));
  });

  // ── Close ──
  const close = study.close;
  const passage = passages[close.passage];
  page.append(h("section", { class: "t-sec ck-close", id: "close" },
    sectionHead("→", heading.closeTitle[0], heading.closeTitle[1]),
    h("div", { class: "ck-close-grid" },
      h("div", {}, close.blocks.map(renderBlock)),
      h("figure", { class: "ck-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage, passage.label), " · BSB"),
        h("div", { class: "ck-passage-text" }, passage.verses.map(([cv, words]) => h("span", {}, h("sup", {}, cv.split(":")[1]), words, " "))))),
    fig.fears(),
    h("p", { class: "ck-question" }, runs(close.question)),
    h("p", { class: "ck-again" }, close.again),
    holder(art.close, "ck-close-art"),
    h("div", { class: "ck-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use))),
      h("p", {}, "Marks on this page: ", h("span", { class: "ck-chk", "aria-hidden": "true" }), " a note the study still has to check before release; point at it to read the note.")),
    h("a", { class: "ck-back", href: heading.back[0] }, holder(icon("arrowLeft", 16)), heading.back[1]),
  ));

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "ck-sheet", "aria-labelledby": "ck-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    if (!has(passages, id)) return;
    const item = passages[id];
    sheet.replaceChildren(
      h("div", { class: "ck-sheet-head" }, h("h2", { id: "ck-sheet-title" }, item.label), h("button", { type: "button", class: "ck-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, holder(icon("x", 18)))),
      h("p", { class: "ck-sheet-text" }, item.verses.map(([cv, words]) => h("span", {}, h("sup", {}, cv), " ", words, " "))),
      h("p", { class: "ck-sheet-src" }, "Berean Standard Bible"));
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
    const link = event.target.closest("a.ck-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  document.addEventListener("ck:open", (event) => { opener = event.detail.from; openSheet(event.detail.id); });
  const asked = new URLSearchParams(location.search).get("ref");
  if (asked) openSheet(asked, false);
})();
