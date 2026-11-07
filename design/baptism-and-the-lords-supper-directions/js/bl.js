// Baptism and the Lord's Supper, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js and the frame's icons.
// The address carries ?part= (one of the seven part numbers), ?row= (a crossing of the part 03 river) and ?ref= (a
// reference held in data.js); any other value is ignored, and look-ups use Object.hasOwn so "__proto__" finds nothing.
(() => {
  const fallback = document.getElementById("bl-fallback");
  function stop(message, detail) {
    if (fallback) fallback.textContent = message;
    console.error(`Baptism and the Lord's Supper: ${detail}`);
  }
  if (!window.BL || window.BL.schema !== 1) return stop("This mock-up has no study data: data.js did not load or is from another build. Run build-data.py, then reload.", "window.BL is missing or has the wrong schema");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.BLArt) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon or BLArt is missing");
  fallback?.remove();

  const { study, passages, signs, panel, directions, order, numbers, sources, patches, heldFacts } = window.BL;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const has = (object, key) => typeof key === "string" && Object.hasOwn(object, key);
  const NOTE = { read: "How this site reads it", other: "Other Christians", open: "Left open", care: "With care", limits: "Its limits" };
  const GROUPS = [["both", "Both signs", ["01"]], ["water", "The water", ["02", "03", "04"]], ["table", "The table", ["05", "06", "07"]]];
  const groupOf = (n) => GROUPS.find((g) => g[2].includes(n));

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
    holder.innerHTML = markup; // fixed drawings from art.js and the frame's icons only
    return holder;
  }
  const refLink = (id, text) => (has(passages, id) ? h("a", { class: "bl-ref", href: `?ref=${encodeURIComponent(id)}`, "data-ref": id }, text || passages[id].label) : text);
  function runs(list) {
    return (list || []).map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "bl-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, runs(run.b));
      if (run.i) return h("em", {}, run.i);
      if ("s" in run) return run.s ? h("a", { class: "bl-link", href: run.s, title: "Mock-up on this PC" }, h("em", {}, run.t)) : h("em", { class: "bl-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }
  const label = (text, extra = "") => h("span", { class: `bl-label ${extra}` }, text);
  const verseText = (id) => passages[id].verses.map((v) => v[1]).join(" ");
  const quoted = (item) => [h("em", {}, `“${item.phrase}”`), " ", refLink(item.r, item.label)];

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page bl-page" });
  main.append(page);
  const params = () => new URLSearchParams(location.search);
  function address(changes) {
    const next = params();
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    const query = next.toString();
    return `${location.pathname}${query ? `?${query}` : ""}`;
  }

  // ── Hero: the standard heading ──
  const opening = study.opening[0];
  const [, turn] = study.title.split(/^Baptism and /);
  page.append(h("section", { class: "t-sec-landing bl-hero", id: "top" },
    h("div", { class: "hc-intro bl-intro" },
      h("div", {},
        h("nav", { class: "bl-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"),
          h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "bl-here", "aria-current": "page" }, study.title.replace("'", "’"))),
        h("p", { class: "bl-concepts" }, study.concepts.join(" · ")),
        h("h1", { tabindex: "-1" }, "Baptism and ", h("em", {}, turn.replace("'", "’"))),
        h("p", { class: "bl-subtitle" }, study.subtitle.charAt(0).toUpperCase() + study.subtitle.slice(1)),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "bl-opening" }, h("blockquote", {}, verseText(opening.r)), h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art bl-hero-art" }, art(BLArt.hero),
        h("figcaption", { class: "bl-motto" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1]),
          h("small", {}, "Illustrative forms: water, a loaf and a cup. No person is drawn.")))),
    h("dl", { class: "bl-figures" }, [
      ["Baptisms Acts tells", numbers.baptisms, `${numbers.namedFirst} of ${numbers.baptisms} name something heard, believed or received before the water`],
      ["Other Christians heard", numbers.other, "paragraphs in a tradition’s own words, each labelled as theirs"],
      ["Left open", numbers.open, "questions on which Christians differ; the page does not choose"],
      ["Printed in full", numbers.versesPrinted, "verses on this page, each word for word the Berean"],
    ].map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note))))));

  // ── Seven words ──
  page.append(h("section", { class: "bl-words", "aria-label": "Words" },
    h("p", { class: "bl-words-lead" }, runs(study.words.lead)),
    h("dl", {}, study.words.blocks.map((w) => h("div", {}, h("dt", {}, w.term), h("dd", {}, runs(w.runs)))))));

  const sectionHead = (number, title, turnWords, lead) => h("header", { class: "t-head bl-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turnWords)), lead ? h("p", {}, lead) : null));

  // ── 00 Two signs, two questions ──
  const readout = h("p", { class: "bl-readout", "aria-live": "polite" }, "Point at an answer to read it here; choose it to open the verses.");
  function answer(item, kind, sign) {
    const show = () => readout.replaceChildren(label(`${sign.name} · ${kind}`), " ", h("em", {}, `“${item.phrase}”`), ` ${item.label}. The study: “${sign.says}”`);
    return h("button", { type: "button", class: "bl-ans", "data-ref": item.r, onmouseenter: show, onfocus: show, "aria-label": `${sign.name}, ${kind}: “${item.phrase}”, ${item.label}. Open the verse.` },
      h("span", { class: "bl-ans-words" }, `“${item.phrase}”`), h("small", {}, item.label));
  }
  const signColumn = (sign) => h("div", { class: `bl-sign bl-sign-${sign.id}` },
    h("p", { class: "bl-sign-name" }, art(BLArt.glyph[sign.id], "bl-glyph-wrap"), h("b", {}, sign.name), h("span", {}, sign.rhythm)),
    h("p", { class: "bl-q" }, "What does it point to?"), sign.points.map((p) => answer(p, "points to", sign)),
    h("p", { class: "bl-q" }, "What came before it?"), answer(sign.before, "came before", sign));
  const lifeLine = `<svg viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">
      <rect class="bl-band" x="150" y="52" width="200" height="60"/><path class="bl-band-top" d="M150 52q12.5-6 25 0t25 0t25 0t25 0t25 0t25 0t25 0t25 0"/>
      <path class="bl-life" d="M0 40H170C200 40 205 96 250 96S300 40 330 40H1000"/>
      ${Array.from({ length: 20 }, (_, i) => `<circle class="bl-tick" style="--i:${i}" cx="${430 + i * 28}" cy="40" r="5"/>`).join("")}</svg>`;
  page.append(h("section", { class: "t-sec bl-two", id: "habit" },
    sectionHead("00", "Two signs,", "two questions.", "Ask what the sign points to. Ask what came before it."),
    h("div", { class: "bl-frame" }, h("p", {}, runs(study.intro.frame))),
    h("figure", { class: "bl-signs" },
      h("p", { class: "bl-fig-q" }, "What does each sign point to, and what came first?"),
      h("div", { class: "bl-sign-grid" }, signs.map(signColumn)),
      h("div", { class: "bl-lifeline" }, art(lifeLine, "bl-lifeline-art"),
        h("span", { class: "bl-life-start" }, "A believer’s life"), h("span", { class: "bl-life-under" }, "under once, and up"),
        h("span", { class: "bl-life-end" }, "… until He comes")),
      readout,
      h("figcaption", {}, "One line, one life. It goes under the water once and comes up; then it passes the table again and again, and the marks run on past the edge of the page. Each answer is in its verse’s own words, proved by script; which words answer the two questions is the study’s reading, in its closing paragraph.")),
    h("p", { class: "bl-selection" }, label("What this study covers"), " ", runs(study.intro.selection))));

  // ── The seven parts, one at a time ──
  const PARTS = study.parts.map((p) => p.n);
  const askedPart = () => (PARTS.includes(params().get("part")) ? params().get("part") : PARTS[0]);
  const partNav = h("nav", { class: "bl-partnav", "aria-label": "The seven parts" }, GROUPS.map(([id, name, ns]) => h("div", { class: `bl-group bl-group-${id}` },
    h("p", { class: "bl-group-name" }, art(BLArt.glyph[id], "bl-glyph-wrap"), name),
    h("div", { class: "bl-group-parts" }, ns.map((n) => h("a", { href: `?part=${n}`, "data-part": n }, h("b", {}, n), h("span", {}, study.parts.find((p) => p.n === n).title)))))));
  const current = h("p", { class: "bl-current", "aria-live": "polite" });
  const articles = study.parts.map(renderPart);
  page.append(h("section", { class: "t-sec bl-parts", id: "parts", "aria-label": "The seven parts" },
    sectionHead("01–07", "The water,", "then the table.", "One part for both signs, three for the water, three for the table. Choose a part; the others wait here."),
    partNav, current, articles));

  function renderPart(part, index) {
    const next = study.parts[index + 1];
    const [, group] = groupOf(part.n);
    const article = h("article", { class: "bl-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "bl-part-head" },
        h("span", { class: "bl-big", "aria-hidden": "true" }, part.n),
        art(BLArt.parts[part.n], "bl-mini-wrap"),
        h("div", {},
          h("p", { class: "bl-kicker" }, label(`Part ${part.n} of 07 · ${group}`), " ", label("Main readings", "bl-dim"), h("span", {}, runs(part.readingsText))),
          h("h2", { id: `part-${part.n}-title`, tabindex: "-1" }, part.title.replace(/'/g, "’")),
          h("p", { class: "bl-hook" }, runs(part.hook)))),
      h("div", { class: "bl-body" }, part.blocks.map((block) => renderBlock(block, part))),
      h("dl", { class: "bl-ask" },
        h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
        h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect)))),
      next ? h("a", { class: "bl-next", href: `?part=${next.n}`, "data-part": next.n }, `Next: ${next.n} ${next.title.replace(/'/g, "’")}`, art(icon("arrowRight", 16)))
        : h("a", { class: "bl-next", href: "#close" }, "To the close: signs that point past themselves", art(icon("arrowRight", 16))));
    article.addEventListener("beforematch", () => choose(part.n, { push: false, focus: false }));
    return article;
  }

  // Each block is one row: a narrow gutter that names whose voice it is, and the reading column.
  function renderBlock(block, part) {
    const row = (kind, gutter, ...body) => h("div", { class: `bl-row bl-row-${kind}` }, h("div", { class: "bl-gut" }, gutter), h("div", { class: "bl-text" }, body));
    switch (block.k) {
      case "p": return row("p", null, h("p", {}, runs(block.runs)));
      case "h3": return h("h3", { class: "bl-h3" }, block.t);
      case "quote": {
        const strip = directions.find((d) => d.part === part.n && d.after === block.label);
        return [row("quote", label("Berean", "bl-dim"), h("figure", { class: "bl-quote" }, h("blockquote", {}, verseText(block.r)), h("figcaption", {}, refLink(block.r, block.label), " · BSB"))),
          strip ? row("fig", null, twoWays(strip)) : null];
      }
      case "read": case "other": case "open": case "care": case "limits":
        return row(block.k, h("span", { class: `bl-mark bl-mark-${block.k}`, "aria-hidden": "true" }), h("p", {}, label(NOTE[block.k], `bl-note-label bl-note-${block.k}`), " ", runs(block.runs)));
      case "panel": return row("fig", null, river(part));
      default: console.error(`Baptism and the Lord's Supper: unknown block ${block.k}`); return "";
    }
  }

  // Parts 05 and 06: the meal looks back to the death and forward to the kingdom.
  function twoWays(strip) {
    return h("figure", { class: "bl-ways" },
      h("p", { class: "bl-fig-q" }, "Which way does the meal look?"),
      h("div", { class: "bl-ways-line" },
        h("p", { class: "bl-way-back" }, label("← Looking back"), quoted(strip.back)),
        h("span", { class: "bl-way-meal", "aria-hidden": "true" }, art(BLArt.glyph.table, "bl-glyph-wrap")),
        h("p", { class: "bl-way-on" }, label("Looking forward →"), quoted(strip.forward))),
      h("figcaption", {}, "Both ends are in the verse’s own words, proved by script. The meal stands between a death already died and a coming still ahead."));
  }

  // Part 03: the ten baptisms as crossings of one river, in Acts' order.
  function river(part) {
    const words = h("div", { class: "bl-river-read", "aria-live": "polite" });
    const show = (row) => {
      words.replaceChildren(...[
        h("p", { class: "bl-river-head" }, label(`Crossing ${row.n} of ${panel.length}`), " ", refLink(row.r, row.label)),
        h("div", { class: "bl-river-pair" }, h("p", {}, label("Named first", "bl-dim"), " ", runs(row.before)), h("p", {}, label("The water", "bl-dim"), " ", runs(row.after))),
        row.household ? h("p", { class: "bl-river-house" }, label("The household", "bl-dim"), " ",
          row.household.open ? "Acts says nothing about anyone’s faith or age; it names only Lydia’s opened heart." : quoted(row.household)) : null].filter(Boolean));
      crossings.forEach((c, i) => c.setAttribute("aria-pressed", String(panel[i] === row)));
    };
    const crossings = panel.map((row) => h("button", { type: "button", class: "bl-cross", "aria-pressed": "false", "aria-label": `Crossing ${row.n}, ${row.label}: ${row.kind}. Read it below.`,
      onclick: () => { show(row); history.replaceState(null, "", address({ row: String(row.n) })); }, onmouseenter: () => show(row), onfocus: () => show(row) },
    h("span", { class: "bl-cross-n" }, String(row.n).padStart(2, "0")),
    h("span", { class: "bl-cross-kind" }, row.kind),
    h("span", { class: "bl-cross-stem", "aria-hidden": "true" }),
    h("span", { class: "bl-cross-ref" }, row.label.replace("Acts ", "")),
    row.household ? h("span", { class: `bl-house${row.household.open ? " bl-house-open" : ""}`, title: row.household.open ? "Household: Acts does not say" : "Household: Acts says they believed" }) : null));
    const asked = Number(params().get("row"));
    show(panel.find((r) => r.n === asked) || panel[0]);
    return h("figure", { class: "bl-river" },
      h("p", { class: "bl-river-lead" }, runs(part.panelLead)),
      h("p", { class: "bl-fig-q" }, "What does each passage name before the water?"),
      h("div", { class: "bl-river-field" }, h("div", { class: "bl-river-water", "aria-hidden": "true" }), h("div", { class: "bl-crossings" }, crossings)),
      h("p", { class: "bl-river-key" }, h("span", { class: "bl-house" }), " a household Acts says believed  ", h("span", { class: "bl-house bl-house-open" }), " a household it says nothing about"),
      words,
      h("ol", { class: "bl-river-list" }, panel.map((row) => h("li", {}, h("p", {}, h("b", {}, `${row.n}. `), refLink(row.r, row.label), h("small", {}, ` · ${row.kind}`)),
        h("p", {}, runs(row.before)), h("p", { class: "bl-arrow" }, runs(row.after))))),
      h("p", { class: "bl-river-reads" }, label("What the ten show"), " ", runs(part.panelReads)),
      h("p", { class: "bl-river-care" }, label("With care"), " ", runs(part.panelCare)),
      h("figcaption", {}, "Each crossing’s quotations are proved by script to be in its own passage, and each household mark in its verse; the one marked open is proved to have no verse saying the household believed. The one-word names are the page’s, each taken from the row’s own words."));
  }

  // Part 07: Acts 2:41–42 in its own order.
  function orderFigure() {
    return h("figure", { class: "bl-order" },
      h("p", { class: "bl-fig-q" }, "In what order does Acts tell it?"),
      h("ol", {}, order.steps.map((s) => h("li", {}, h("b", {}, s.name), h("span", {}, `“${s.phrase}”`, " ", refLink(s.r, s.label))))),
      h("figcaption", {}, `The study: “${order.says}” Many read “the breaking of bread” in Acts 2:42 as the Supper; the study’s glossary gives it as one of the Supper’s names. That reading is an interpretation, and it is offered as one.`));
  }
  const seventh = articles[PARTS.indexOf(order.part)];
  seventh.querySelector(".bl-body").prepend(orderFigure());

  function choose(n, { push = true, focus = true } = {}) {
    if (!PARTS.includes(n)) return;
    articles.forEach((article, i) => (PARTS[i] === n ? article.removeAttribute("hidden") : article.setAttribute("hidden", "until-found")));
    partNav.querySelectorAll("a").forEach((a) => (a.dataset.part === n ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
    current.textContent = `${n} ${study.parts.find((p) => p.n === n).title.replace(/'/g, "’")}`;
    if (push) history.pushState(null, "", address({ part: n === PARTS[0] ? null : n, ref: null, row: n === "03" ? params().get("row") : null }));
    if (focus) {
      document.getElementById("parts").scrollIntoView({ block: "start", behavior: reduced.matches ? "auto" : "smooth" });
      document.getElementById(`part-${n}-title`).focus({ preventScroll: true });
    }
  }

  // ── Close ──
  const close = study.close;
  page.append(h("section", { class: "t-sec bl-close", id: "close" },
    sectionHead("→", "Signs that point", "past themselves."),
    h("div", { class: "bl-close-grid" },
      h("div", {},
        h("p", { class: "bl-way" }, label("The way of reading"), " ", runs(close.way)),
        h("p", { class: "bl-invite" }, runs(close.invite)),
        h("p", { class: "bl-question" }, runs(close.question)),
        h("p", { class: "bl-again" }, runs(close.again))),
      h("figure", { class: "bl-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage, passages[close.passage].label), " · BSB"),
        h("p", { class: "bl-passage-text" }, passages[close.passage].verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))),
        art(BLArt.close, "bl-close-art"))),
    h("div", { class: "bl-sources" }, h("h3", {}, "Sources"),
      h("p", {}, `${numbers.compared} of ${numbers.outside} quotations from outside Scripture are found by script in copies held on this PC; the rest are marked below.`),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use))),
      h("p", {}, h("b", {}, "Answered from held sources. "), heldFacts.join(" ")),
      patches.map((p) => h("p", {}, h("b", {}, "One correction on this page. "), p.why))),
    h("a", { class: "bl-back", href: "/study/theology?area=doctrine" }, art(icon("arrowLeft", 16)), "Back to God & Christian Faith")));

  // ── The verse sheet, from the right ──
  const sheet = h("dialog", { class: "bl-sheet", "aria-labelledby": "bl-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id) {
    if (!has(passages, id)) return;
    const item = passages[id];
    const x = h("button", { type: "button", class: "bl-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)));
    sheet.replaceChildren(
      h("div", { class: "bl-sheet-head" }, h("h2", { id: "bl-sheet-title" }, item.label), x),
      h("p", { class: "bl-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      item.leftOut ? h("p", { class: "bl-sheet-src" }, `The Berean has no verse ${item.leftOut.map((cv) => cv.split(":")[1]).join(", ")} here, following the oldest manuscripts.`) : null,
      h("p", { class: "bl-sheet-src" }, "Berean Standard Bible"));
    if (!sheet.open) sheet.showModal();
    x.focus();
    history.replaceState(null, "", address({ ref: id }));
  }
  sheet.addEventListener("close", () => {
    history.replaceState(null, "", address({ ref: null }));
    (opener && document.contains(opener) ? opener : document.querySelector("h1")).focus({ preventScroll: Boolean(!opener) });
    opener = null;
  });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const ref = event.target.closest("a.bl-ref, button.bl-ans");
    if (ref) {
      event.preventDefault();
      opener = ref;
      openSheet(ref.dataset.ref);
      return;
    }
    const go = event.target.closest("a[data-part]");
    if (!go) return;
    event.preventDefault();
    choose(go.dataset.part);
  });
  window.addEventListener("popstate", () => {
    choose(askedPart(), { push: false, focus: false });
    const ref = params().get("ref");
    if (has(passages, ref)) openSheet(ref);
    else if (sheet.open) sheet.close();
  });

  choose(askedPart(), { push: false, focus: false });
  const askedRef = params().get("ref");
  if (has(passages, askedRef)) openSheet(askedRef);
})();
