// Knowing God, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js and icons from the frame.
// Values in the address (?part=, ?ref=) are looked up in data.js with Object.hasOwn, so an unknown value is ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.className = "kg-stop";
    notice.textContent = message;
    document.body.prepend(notice);
    console.warn(`Knowing God: ${detail}`);
  }
  if (!window.KG) return stop("The study did not load: data.js is missing. Run build-data.py, then reload.", "window.KG is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.KGArt) return stop("The page could not load its shared frame or drawings. Reload the page.", "Frame, icon or KGArt is missing");

  const { study, passages, pairs, echo, numbers, sources, held } = window.KG;
  const has = (object, key) => typeof key === "string" && Object.hasOwn(object, key);
  const SVG = "http://www.w3.org/2000/svg";

  function h(tag, props = {}, ...children) {
    const element = tag.startsWith("svg:") ? document.createElementNS(SVG, tag.slice(4)) : document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") element.setAttribute("class", value);
      else if (key.startsWith("on")) element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value === true ? "" : value);
    }
    element.append(...children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false));
    return element;
  }
  function art(markup, className) {
    const holder = h("span", { class: className });
    holder.innerHTML = markup; // fixed drawings from art.js and frame icons only
    return holder;
  }
  const refLink = (id, text) => h("a", { class: "kg-ref", href: `?ref=${id}`, "data-ref": id }, text);
  const label = (text) => h("span", { class: "kg-label" }, text);
  function runs(list) {
    return list.map((run) => {
      if (typeof run === "string") return run;
      if (run.x) return h("span", { class: "kg-fix" }, " [", run.x, ", ", refLink(run.r, run.t), "]");
      if (run.c) return h("span", { class: "kg-check" }, h("b", {}, "Not yet confirmed: "), run.c);
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "kg-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if ("s" in run) return h("span", { class: "kg-more" }, "Read more in ", run.s ? h("a", { class: "kg-link", href: run.s, title: "Mock-up on this PC" }, h("em", {}, run.t)) : h("em", { title: "Not yet a page" }, run.t), ".");
      return "";
    });
  }

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page kg-page" });
  main.append(page);

  // ── Hero: the standard heading ──
  const opening = study.opening[0];
  const figures = [
    ["Slow to anger", `${numbers.slowGod} of ${numbers.slowAll}`, `verses in the Berean with these words say them of God, each an echo of Exodus 34:6`],
    ["The name", numbers.lord.toLocaleString("en"), `verses print LORD, the name given in Exodus 3:15: ${Math.round((100 * numbers.lord) / numbers.verses)}% of all ${numbers.verses.toLocaleString("en")}`],
    ["Passages", numbers.parts, "each read for what God is like and what He is doing in it"],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
  ];
  page.append(h("section", { class: "t-sec-landing kg-hero", id: "top" },
    h("div", { class: "hc-intro kg-intro" },
      h("div", {},
        h("nav", { class: "kg-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "kg-here", "aria-current": "page" }, "Knowing God")),
        h("p", { class: "kg-concepts" }, study.concepts.join(" · ")),
        h("h1", {}, `${study.title}: `, h("em", {}, study.subtitle)),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "kg-opening" }, h("blockquote", {}, opening.part ? opening.text : passages[opening.r].verses.map((v) => v[1]).join(" ")),
          h("figcaption", {}, refLink(opening.r, opening.label), opening.part ? " (part)" : "", " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art kg-hero-art" }, art(KGArt.hero), h("span", { class: "ms-art-note" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1])))),
    h("dl", { class: "kg-figures" }, figures.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    h("nav", { class: "kg-toc", "aria-label": "On this page" },
      h("a", { href: "#said" }, h("b", {}, "00"), "Said, and done"),
      h("a", { href: "#passages" }, h("b", {}, "01–10"), "The ten passages"),
      h("a", { href: "#close" }, h("b", {}, "→"), "Reading God in what He does")),
  ));

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));

  // ── 00 Said, and done: the Way paragraph's pairs on one orbit ──
  const nodes = pairs.flatMap((pair) => pair.deeds.map((deed, j) => ({ pair, deed, j, count: pair.deeds.length })));
  const reading = h("div", { class: "kg-reading", "aria-live": "polite" });
  function showPair(node) {
    const { pair, deed } = node;
    const part = study.parts.find((p) => p.n === deed.part);
    reading.replaceChildren(
      h("p", { class: "kg-reading-word" }, label("What He is"), " ", h("b", {}, pair.word), pair.r ? [" · “", pair.verse, "” ", refLink(pair.r, passages[pair.r].label)] : [" · the study’s word for His continuing care, defined in part 08"]),
      h("p", { class: "kg-reading-deed" }, label("What He is doing"), " ", h("b", {}, deed.deed), " · “", deed.verse, "” ", refLink(deed.r, passages[deed.r].label)),
      h("button", { type: "button", class: "kg-go", onclick: () => openPart(deed.part, true) }, `Read part ${deed.part}: ${part.name}`, art(icon("arrowRight", 14))));
    orbit.querySelectorAll(".kg-node").forEach((g) => g.classList.toggle("is-on", g.dataset.key === `${deed.part}`));
  }
  const cx = 500, cy = 300, RX = 290, RY = 170, DX = 430, DY = 262; // the ring of words, and the ring of deeds
  const orbit = h("svg:svg", { viewBox: "-200 -20 1400 640", class: "kg-orbit-figure", role: "group", "aria-label": "Seven things the study says God is, each joined to what He is doing in the same passage" },
    h("svg:ellipse", { class: "kg-ring", cx, cy, rx: RX, ry: RY }),
    h("svg:text", { class: "kg-centre", x: cx, y: cy - 8 }, "Let the deed tell you"),
    h("svg:text", { class: "kg-centre", x: cx, y: cy + 22 }, "what the word means."),
    pairs.map((pair, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / pairs.length;
      const wx = cx + RX * Math.cos(angle), wy = cy + RY * Math.sin(angle);
      const beside = Math.abs(Math.sin(angle)) > 0.8; // near the top or bottom the word sits beside its dot, else inside the ring
      const anchor = Math.abs(Math.cos(angle)) < 0.2 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
      return h("svg:g", {}, h("svg:circle", { class: "kg-dot", cx: wx, cy: wy, r: 5 }),
        pair.deeds.map((deed, j) => {
          const spread = pair.deeds.length > 1 ? (j - (pair.deeds.length - 1) / 2) * 0.32 : 0;
          const dx = cx + DX * Math.cos(angle + spread), dy = cy + DY * Math.sin(angle + spread);
          const node = nodes.find((n) => n.deed === deed);
          return h("svg:g", { class: "kg-node", tabindex: "0", role: "button", "data-key": deed.part, "aria-label": `${pair.word}: ${deed.deed}. Part ${deed.part}`,
            onmouseenter: () => showPair(node), onfocus: () => showPair(node), onclick: () => openPart(deed.part, true),
            onkeydown: (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openPart(deed.part, true); } } },
          h("svg:line", { class: "kg-tie", x1: wx, y1: wy, x2: dx, y2: dy }),
          h("svg:circle", { class: "kg-deed-dot", cx: dx, cy: dy, r: 3 }),
          h("svg:text", { class: "kg-deed", x: dx + (anchor === "start" ? 10 : anchor === "end" ? -10 : 0), y: dy + (anchor === "middle" ? (Math.sin(angle) < 0 ? -12 : 24) : 6), "text-anchor": anchor }, deed.deed),
          h("svg:text", { class: "kg-part-n", x: dx + (anchor === "start" ? 10 : anchor === "end" ? -10 : 0), y: dy + (anchor === "middle" ? (Math.sin(angle) < 0 ? -34 : 42) : 24), "text-anchor": anchor }, `part ${deed.part}`));
        }),
        beside
          ? h("svg:text", { class: "kg-word", x: wx + (Math.cos(angle) < -0.01 ? -14 : 14), y: wy + 8, "text-anchor": Math.cos(angle) < -0.01 ? "end" : "start" }, pair.word)
          : h("svg:text", { class: "kg-word", x: wx - 16 * Math.cos(angle), y: wy - 14 * Math.sin(angle) + 8, "text-anchor": Math.cos(angle) > 0 ? "end" : "start" }, pair.word));
    }));
  const list = h("ol", { class: "kg-pair-list" }, nodes.map(({ pair, deed }) => h("li", {},
    h("button", { type: "button", onclick: () => openPart(deed.part, true) }, h("b", {}, pair.word), h("span", {}, deed.deed), h("small", {}, `part ${deed.part}`)))));
  page.append(h("section", { class: "t-sec kg-said", id: "said" },
    sectionHead("00", "Said,", "and done.", "Whenever a passage tells you what God is like, look in the same passage for what He is doing."),
    h("p", { class: "kg-frame" }, runs(study.frame)),
    h("figure", { class: "kg-orbit-wrap" },
      h("figcaption", { class: "kg-ask" }, h("b", {}, "What is God doing in the passage that says what He is like? "), "The study’s closing paragraph names seven pairs. Point at one to read both verses; choose it to open its passage."),
      orbit, list, reading),
    h("p", { class: "kg-note" }, runs(study.selection))));
  showPair(nodes[0]);

  // ── 01–10 The ten passages, grouped under the study's four concepts, one open at a time ──
  const GROUPS = [["Name", ["01"]], ["Character", ["02", "03", "04", "05"]], ["Creation", ["06", "07"]], ["Providence", ["08", "09"]], ["From Him, through Him, to Him", ["10"]]];
  const byNumber = Object.fromEntries(study.parts.map((p) => [p.n, p]));
  const index = h("nav", { class: "kg-index", "aria-label": "The ten passages" }, GROUPS.map(([name, numbersInGroup]) => h("div", { class: "kg-group" },
    h("p", { class: "kg-group-name" }, name),
    numbersInGroup.map((n) => h("button", { type: "button", class: "kg-pick", "data-part": n, "aria-controls": "kg-reader", onclick: () => openPart(n, true) },
      h("b", {}, n), h("span", {}, byNumber[n].name))))));
  const reader = h("article", { class: "kg-reader", id: "kg-reader", "aria-live": "polite" });
  page.append(h("section", { class: "t-sec kg-passages", id: "passages" },
    sectionHead("01–10", "Ten passages,", "one open at a time.", "Grouped by the study’s four concepts. Each opens with its main readings and ends with two questions."),
    index, reader));

  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "h3": return h("h3", { class: "kg-h3" }, block.t);
      case "li": return h("p", { class: "kg-li" }, h("b", {}, block.head), " ", runs(block.runs));
      case "quote": return h("figure", { class: "kg-quote" }, h("blockquote", {}, block.part ? block.text : passages[block.r].verses.map((v) => v[1]).join(" ")), h("figcaption", {}, refLink(block.r, block.label), block.part ? " (part)" : "", " · BSB"));
      case "care": return h("aside", { class: "kg-note-care" }, label("With care"), h("p", {}, runs(block.runs)));
      case "open": return h("aside", { class: "kg-note-open" }, label("Where readers differ"), h("p", {}, runs(block.runs)));
      case "source": return h("aside", { class: "kg-note-source" }, label("Outside source"), h("p", {}, runs(block.runs)));
      default: console.warn(`Knowing God: unknown block ${block.k}`); return "";
    }
  }
  const mentions = (block, id) => (block.runs || []).some((run) => run && run.r === id);

  // Part 03: the nine verses that call God slow to anger, printed with the words they share with Exodus 34:6–7.
  function echoFigure() {
    return h("figure", { class: "kg-echo" },
      h("figcaption", {}, label("Verses that call God slow to anger"),
        h("p", {}, `Every verse of the Berean with the words “slow to anger”: ${echo.all}. ${echo.rows.length} say it of God and are printed here; ${echo.people.length} say it of people (`,
          echo.people.map((id, i) => [i ? "; " : "", refLink(id, passages[id].label)]), "). Underlined: the words each shares with Exodus 34:6–7.")),
      h("ol", {}, echo.rows.map((row) => h("li", {},
        h("p", { class: "kg-echo-ref" }, refLink(row.r, passages[row.r].label)),
        h("p", { class: "kg-echo-who" }, row.who, " ", refLink(row.c, `See ${passages[row.c].label}`)),
        h("p", { class: "kg-echo-text" }, row.text.map((piece) => (typeof piece === "string" ? piece : h("u", {}, piece.u))))))),
      h("p", { class: "kg-echo-miss" }, "The rule is the same English words, so it misses verses that echo the name in other words: ",
        echo.misses.map((m, i) => [i ? " and " : "", refLink(m.r, passages[m.r].label)]), ` say “${echo.misses[0].has}” without “slow to anger”.`));
  }

  // Part 10: Romans 11:36 as the study reads it, from Him (creation), through Him (providence), to Him (His glory).
  function loopFigure() {
    const steps = [["From Him", "creation", ["06", "07"]], ["through Him", "providence", ["08", "09"]], ["to Him", "the purpose of everything, His glory", []]];
    return h("figure", { class: "kg-loop" },
      art(KGArt.loop, "kg-loop-art"),
      h("ol", {}, steps.map(([word, gloss, parts]) => h("li", {}, h("b", {}, word), h("span", {}, gloss),
        parts.length ? h("small", {}, parts.map((n, i) => [i ? " · " : "", h("button", { type: "button", class: "kg-inline", onclick: () => openPart(n, true) }, `part ${n}`)])) : h("small", {}, h("a", { class: "kg-link", href: "#close" }, "the close"))))),
      h("figcaption", {}, "Romans 11:36 as this study reads it. The loop returns to where it began: all things are from Him and to Him."));
  }

  function renderPart(part) {
    const body = h("div", { class: "kg-body" });
    let echoPlaced = false, loopPlaced = false;
    part.blocks.forEach((block) => {
      body.append(renderBlock(block));
      if (part.n === "03" && !echoPlaced && mentions(block, "JON.4.2")) { body.append(echoFigure()); echoPlaced = true; }
      if (part.n === "10" && !loopPlaced && block.k === "p" && (block.runs || []).some((run) => typeof run === "string" && run.includes("gathers up this whole study"))) { body.append(loopFigure()); loopPlaced = true; }
    });
    const at = study.parts.indexOf(part), prev = study.parts[at - 1], next = study.parts[at + 1];
    reader.replaceChildren(
      h("header", { class: "kg-part-head" },
        h("span", { class: "kg-part-n" }, part.n),
        h("div", {},
          h("h2", { id: `part-${part.n}`, tabindex: "-1" }, part.name, h("em", {}, `: ${part.turn}`)),
          h("p", { class: "kg-hook" }, runs(part.hook)),
          h("p", { class: "kg-readings" }, label("Main readings"), " ", part.readings.map((id, i) => [i ? " · " : "", refLink(id, passages[id].label)]))),
        art(KGArt.parts[part.n], "kg-mini-wrap")),
      body,
      h("dl", { class: "kg-askback" },
        h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
        h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect)))),
      h("nav", { class: "kg-steps", "aria-label": "Previous and next passage" },
        prev ? h("button", { type: "button", onclick: () => openPart(prev.n, true) }, art(icon("arrowLeft", 14)), `${prev.n} ${prev.name}`) : h("span"),
        next ? h("button", { type: "button", onclick: () => openPart(next.n, true) }, `${next.n} ${next.name}`, art(icon("arrowRight", 14))) : h("a", { href: "#close" }, "Reading God in what He does", art(icon("arrowRight", 14)))));
  }

  function openPart(n, move) {
    if (!has(byNumber, n)) return;
    renderPart(byNumber[n]);
    index.querySelectorAll(".kg-pick").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.part === n)));
    const params = new URLSearchParams(location.search);
    params.set("part", n);
    params.delete("ref");
    history.replaceState(null, "", `?${params}${move ? "#passages" : location.hash}`);
    if (move) {
      reader.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      reader.querySelector("h2")?.focus({ preventScroll: true });
    }
  }

  // ── Close ──
  const close = study.close;
  const passage = passages[close.passage];
  const [closeTitle, closeTurn] = close.title.split(/ (?=in what)/);
  page.append(h("section", { class: "t-sec kg-close", id: "close" },
    sectionHead("→", closeTitle, closeTurn || ""),
    h("div", { class: "kg-close-grid" },
      h("div", {},
        h("p", { class: "kg-way" }, runs(close.way)),
        h("p", { class: "kg-closing" }, runs(close.close)),
        h("p", { class: "kg-invite" }, runs(close.invite)),
        h("p", { class: "kg-further" }, runs(close.further_answers)),
        h("p", { class: "kg-question" }, runs(close.question)),
        h("p", { class: "kg-again" }, runs(close.again))),
      h("figure", { class: "kg-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage, passage.label), " · BSB"),
        h("div", { class: "kg-passage-text" }, passage.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))))),
    art(KGArt.close, "kg-close-art"),
    h("div", { class: "kg-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use))),
      h("p", {}, "Held copies the build checks against: ", Object.values(held).join("; "), ".")),
    h("a", { class: "kg-back", href: "/study/theology?area=doctrine" }, art(icon("arrowLeft", 16)), "Back to God & Christian Faith"),
  ));

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "kg-sheet", "aria-labelledby": "kg-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    if (!has(passages, id)) return;
    const item = passages[id];
    sheet.replaceChildren(
      h("div", { class: "kg-sheet-head" }, h("h2", { id: "kg-sheet-title" }, item.label), h("button", { type: "button", class: "kg-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "kg-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "kg-sheet-src" }, "Berean Standard Bible"));
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
    const link = event.target.closest("a.kg-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });

  const asked = new URLSearchParams(location.search);
  openPart(has(byNumber, asked.get("part")) ? asked.get("part") : "01", false);
  if (has(passages, asked.get("ref"))) openSheet(asked.get("ref"), false);
})();
