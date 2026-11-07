// The cross, the empty tomb and the throne: one mock-up page drawn from data.js (built by build-data.py from the
// study's content.md). All text goes in as text nodes; the only markup strings are the fixed drawings in art.js.
// The address carries the chosen picture (?picture=01…06) and an open verse (?ref=); both are checked against data.js,
// so an unknown value is ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`The cross, the empty tomb and the throne: ${detail}`);
  }
  if (!window.WC) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.WC is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.WCArt) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon or WCArt is missing");

  const { study, passages, pictures, centre, lines, witnesses, echo, numbers, sources } = window.WC;
  const parts = Object.fromEntries(study.parts.map((p) => [p.n, p]));
  const PICTURE = /^0[1-6]$/;

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
    holder.innerHTML = markup; // fixed drawings from art.js or frame.js icons only
    return holder;
  }
  const refLink = (id, text) => h("a", { class: "wc-ref", href: `?ref=${id}`, "data-ref": id }, text || passages[id].label);
  function runs(list) {
    return list.map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "wc-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if (run.c) return h("span", { class: "wc-check", title: "A note for the editor: check this before publishing" }, `to check: ${run.c}`);
      if ("s" in run) return run.s ? h("a", { class: "wc-link", href: run.s, title: "Mock-up on this PC" }, h("em", {}, run.t)) : h("em", { class: "wc-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }
  const label = (text, cls = "") => h("span", { class: `wc-label ${cls}` }, text);
  const verseText = (block) => block.part ? block.text : passages[block.r].verses.map((v) => v[1]).join(" ");

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page wc-page" });
  main.append(page);

  // ── Hero: the standard study heading ──
  const opening = study.opening[0];
  const turnAt = study.title.lastIndexOf(" and ");
  const figures = [
    ["Pictures", numbers.pictures, "of the cross, each from its own world, each read in its own passage"],
    ["Lines", numbers.lines, "of the gospel in 1 Corinthians 15:3–5: died, buried, raised, appeared"],
    ["Appearances", numbers.appearances, "in Paul's list, from Cephas to Paul himself. It names no women"],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
  ];
  page.append(h("section", { class: "t-sec-landing wc-hero", id: "top" },
    h("div", { class: "hc-intro wc-intro" },
      h("div", {},
        h("nav", { class: "wc-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "wc-here", "aria-current": "page" }, study.title)),
        h("p", { class: "wc-concepts" }, study.concepts.join(" · ")),
        h("h1", {}, study.title.slice(0, turnAt), " ", h("em", {}, study.title.slice(turnAt + 1))),
        h("p", { class: "wc-subtitle" }, study.subtitle),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "wc-opening" }, h("blockquote", {}, verseText(opening)),
          h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art wc-hero-art" }, art(WCArt.hero), h("span", { class: "ms-art-note" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1])))),
    h("dl", { class: "wc-figures" }, figures.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
  ));

  // ── The ascent: the four lines of 1 Corinthians 15:3–5, then the throne, as the page's own contents ──
  const stations = [...lines.lines.map((line) => ({ ...line, r: lines.r })), { ...lines.after, why: null, scripture: false }];
  page.append(h("nav", { class: "wc-ascent", "aria-label": "On this page: the gospel in four lines, then the throne" },
    h("p", { class: "wc-ascent-note" }, label("The way up the page"), " ", refLink(lines.r), " gives the gospel in four lines. ", refLink(lines.after.r), " carries it to the throne. The page follows them upward."),
    h("ol", {}, stations.map((s, i) => h("li", { class: `wc-station wc-step-${i}` },
      h("a", { href: `#${s.to}` },
        h("span", { class: "wc-station-n" }, s.parts),
        h("span", { class: "wc-station-event" }, s.event),
        s.why ? h("span", { class: "wc-station-why" }, s.why) : null,
        s.scripture ? h("span", { class: "wc-station-scr" }, "according to the Scriptures") : null))))));

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));

  // ── 01–06 One cross, six pictures: the window and the chosen picture's reading ──
  const answer = h("div", { class: "wc-answer", "aria-live": "polite" });
  const reading = h("article", { class: "wc-reading" });
  const choices = [];
  const windowFigure = h("div", { class: "wc-window", role: "radiogroup", "aria-label": "Six pictures of the cross. Choose one to read it." },
    art(`<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" class="wc-spokes">${pictures.map((p, i) => {
      const a = (-90 + i * 60) * Math.PI / 180;
      return `<line class="${p.n === centre.n ? "is-centre" : ""}" x1="50" y1="50" x2="${(50 + 38 * Math.cos(a)).toFixed(2)}" y2="${(50 + 38 * Math.sin(a)).toFixed(2)}"/>`;
    }).join("")}<circle cx="50" cy="50" r="38"/></svg>`, "wc-spokes-wrap"),
    h("div", { class: "wc-centre" }, art(WCArt.centre), h("span", { class: "wc-centre-words" }, centre.words), refLink(centre.r)),
    pictures.map((p, i) => {
      const a = (-90 + i * 60) * Math.PI / 180;
      const button = h("button", { type: "button", role: "radio", class: `wc-choice${p.n === centre.n ? " is-centre" : ""}`, "data-n": p.n,
        style: `--x:${(50 + 38 * Math.cos(a)).toFixed(2)}%;--y:${(50 + 38 * Math.sin(a)).toFixed(2)}%`,
        onclick: () => choose(p.n, { scroll: false }) },
      art(WCArt.emblems[p.n], "wc-choice-art"), h("span", { class: "wc-choice-n" }, p.n), h("span", { class: "wc-choice-word" }, p.word), h("span", { class: "wc-choice-home" }, p.home));
      choices.push(button);
      return button;
    }));
  windowFigure.addEventListener("keydown", (event) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const at = choices.findIndex((c) => c.getAttribute("aria-checked") === "true");
    const next = pictures[(at + step + pictures.length) % pictures.length].n;
    choose(next, { scroll: false });
    choices.find((c) => c.dataset.n === next).focus();
  });

  page.append(h("section", { class: "t-sec wc-pictures", id: "pictures" },
    sectionHead("01–06", "One cross.", "Six pictures.", "Every picture of the cross has a home. Choose one: its home, what it says Christ did and where the writer stops pressing it appear beside the window, and its whole reading below."),
    h("p", { class: "wc-frame" }, runs(study.frame)),
    h("div", { class: "wc-window-row" }, windowFigure, answer),
    h("p", { class: "wc-note" }, "Each line beside the window is checked: the verse words are in their verse, and each limit is the study's own sentence. The lines to the centre are the page's drawing of the study's close, where one claim stands among the pictures; part 04 says it in the site's voice. ", runs(study.selection)),
    reading));

  function choose(n, { scroll = true, push = true } = {}) {
    if (!PICTURE.test(n) || !parts[n]) return;
    const p = pictures.find((x) => x.n === n);
    choices.forEach((c) => { const on = c.dataset.n === n; c.setAttribute("aria-checked", String(on)); c.tabIndex = on ? 0 : -1; });
    answer.replaceChildren(
      h("p", { class: "wc-answer-n" }, label(`Picture ${p.n} · ${p.word}`)),
      h("dl", {},
        h("div", {}, h("dt", {}, "Its home"), h("dd", { class: "wc-home" }, p.home)),
        h("div", {}, h("dt", {}, "What it says Christ did"), h("dd", {}, p.did, h("span", { class: "wc-answer-verse" }, h("q", {}, p.phrase), " ", refLink(p.r)))),
        h("div", { class: "wc-answer-stop" }, h("dt", {}, "Where it stops"), h("dd", {}, p.stops))),
      h("a", { class: "wc-answer-go", href: `#part-${p.n}` }, `Read part ${p.n}, ${parts[n].title}`, art(WCArt.down)));
    reading.replaceChildren(...renderPart(parts[n], "picture"));
    reading.id = `part-${n}`;
    reading.setAttribute("aria-labelledby", `part-${n}-title`);
    if (push) {
      const params = new URLSearchParams(location.search);
      params.set("picture", n);
      history.replaceState(null, "", `?${params}${location.hash}`);
    }
    if (scroll) reading.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  // ── A part's reading. Pictures get prev/next; the reports and the throne are read in order. ──
  function renderPart(part, kind) {
    const body = h("div", { class: "wc-body" }, part.blocks.map(renderBlock));
    body.append(h("dl", { class: "wc-ask" },
      h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
      h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect)))));
    const out = [
      h("header", { class: "wc-part-head" },
        h("span", { class: "wc-part-n", "aria-hidden": "true" }, part.n),
        h("div", {},
          h("h3", { id: `part-${part.n}-title`, class: "wc-part-title" }, part.title),
          h("p", { class: "wc-hook" }, part.hook),
          h("p", { class: "wc-readings" }, label("Main readings"), " ", part.readings.map((id, i) => [i ? " · " : "", refLink(id)]).flat(),
            ...(part.quoted.length ? [" ", label("Also quoted", "wc-label-soft"), " ", ...part.quoted.map((id, i) => [i ? " · " : "", refLink(id)]).flat()] : [])))),
      body];
    if (kind === "picture") {
      const at = pictures.findIndex((p) => p.n === part.n);
      const prev = pictures[at - 1], next = pictures[at + 1];
      out.push(h("nav", { class: "wc-turn-pages", "aria-label": "Other pictures" },
        prev ? h("button", { type: "button", onclick: () => choose(prev.n) }, art(icon("arrowLeft", 14)), `${prev.n} ${prev.word}`) : h("span"),
        next ? h("button", { type: "button", onclick: () => choose(next.n) }, `${next.n} ${next.word}`, art(icon("arrowRight", 14)))
          : h("a", { href: "#turn" }, "On to the empty tomb", art(WCArt.down))));
    }
    return out;
  }

  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "h3": return h("h4", { class: "wc-h4" }, block.t);
      case "quote": return h("figure", { class: "wc-quote" }, h("blockquote", {}, verseText(block)), h("figcaption", {}, refLink(block.r, block.label), block.part ? " · BSB, part of the verse" : " · BSB"));
      case "care": return h("aside", { class: "wc-care" }, label("With care"), h("p", {}, runs(block.runs)));
      case "stops": return h("div", { class: "wc-stops" }, h("p", { class: "wc-stops-rule" }, h("span", {}, block.label)), h("p", {}, runs(block.runs)));
      case "ask": return h("div", { class: "wc-question" }, label(block.label), h("p", { class: "wc-question-q" }, block.q), h("p", {}, runs(block.runs)));
      case "open": return h("aside", { class: "wc-open" }, label("Where Baptists differ"), h("p", { class: "wc-question-q" }, block.q), h("p", {}, runs(block.runs)));
      default: console.error(`The cross, the empty tomb and the throne: unknown block ${block.k}`); return "";
    }
  }

  // ── The turn: from pictures to a report ──
  page.append(h("section", { class: "t-sec wc-turn", id: "turn", "aria-labelledby": "turn-title" },
    h("h2", { id: "turn-title" }, "Not a picture. ", h("em", {}, "A report.")),
    h("div", { class: "wc-turn-grid" },
      h("div", { class: "wc-turn-was" }, label("Six pictures: ask"), h("ol", {}, h("li", {}, "What world does the word come from?"), h("li", {}, "What does it say Christ did?"), h("li", {}, "Where does the writer stop pressing it?"))),
      art(icon("arrowRight", 22), "wc-turn-arrow"),
      h("div", { class: "wc-turn-now" }, label("At the empty tomb: ask"), h("ol", {}, h("li", {}, "Who saw what?"), h("li", {}, "What did they say?")))),
  ));

  // ── 07–08 The reports: who saw what, then Luke and Paul ──
  function joinsLayer() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "wc-joins");
    svg.setAttribute("aria-hidden", "true");
    return svg;
  }
  const register = h("figure", { class: "wc-register", "aria-labelledby": "register-cap" },
    h("div", { class: "wc-register-col" }, h("p", { class: "wc-register-head" }, "Luke 24 ", h("span", {}, "a report, in story order")),
      h("ol", {}, witnesses.luke.map((w) => h("li", { "data-who": w.id },
        h("span", { class: "wc-who" }, w.who), " ", refLink(w.r),
        h("span", { class: "wc-saw" }, w.kind, ": ", h("q", {}, w.saw), " ", refLink(w.sr)))))),
    joinsLayer(),
    h("div", { class: "wc-register-col" }, h("p", { class: "wc-register-head" }, "1 Corinthians 15 ", h("span", {}, "a list Paul received and passed on")),
      h("ol", {}, witnesses.paul.map((w) => h("li", { "data-who": w.id }, h("span", { class: "wc-who" }, w.who), " ", refLink(w.r))))),
    h("figcaption", { id: "register-cap" }, "Who saw the risen Jesus, or his empty tomb? A line joins the same people in both: Simon is Cephas, and the Eleven are the group Paul calls the Twelve. Peter at the tomb saw only the linen cloths; Luke tells of Simon's meeting with the risen Lord later the same day. Luke names the women first. Paul's list names no women, so read the two side by side, not one instead of the other."));

  page.append(h("section", { class: "t-sec wc-reports", id: "reports" },
    sectionHead("07–08", "An empty tomb.", "Who saw what.", "Two reports: Luke's account of the first morning and evening, and the list of witnesses Paul received."),
    register,
    ["07", "08"].map((n) => h("article", { class: "wc-report", id: `part-${n}`, "aria-labelledby": `part-${n}-title` }, renderPart(parts[n], "report")))));

  // ── 09 The throne ──
  const marked = (text, words) => {
    const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    return text.split(pattern).map((piece, i) => i % 2 ? h("mark", {}, piece) : piece);
  };
  const echoText = (id) => passages[id].verses.map((v) => v[1]).join(" ");
  page.append(h("section", { class: "t-sec wc-throne", id: "throne" },
    sectionHead("09", "The throne.", "Exalted and praying.", "The story does not end at the tomb. Philippians gives Jesus words Isaiah keeps for God alone; Hebrews shows him praying now."),
    h("figure", { class: "wc-echo", "aria-labelledby": "echo-cap" },
      h("div", {}, label("Isaiah, the LORD speaking"), h("p", {}, marked(echoText(echo.fr), echo.shared)), refLink(echo.fr)),
      h("span", { class: "wc-echo-line", "aria-hidden": "true" }),
      h("div", {}, label("Philippians, of Jesus"), h("p", {}, marked(echoText(echo.tr), echo.shared)), refLink(echo.tr)),
      h("figcaption", { id: "echo-cap" }, "The marked words are in both verses. In Isaiah every knee bows to God; Paul gives that honour to Jesus, to the glory of the Father. Every knee will bow, but these verses do not say everyone will be saved.")),
    h("article", { class: "wc-report wc-report-throne", id: "part-09", "aria-labelledby": "part-09-title" }, renderPart(parts["09"], "throne"))));

  // ── Close ──
  const close = study.close;
  const passage = passages[close.passage];
  page.append(h("section", { class: "t-sec wc-close", id: "close" },
    sectionHead("→", close.title.replace(/\.$/, "") + ".", "Then read on."),
    h("div", { class: "wc-close-grid" },
      h("div", {},
        h("p", { class: "wc-way" }, runs(close.way)),
        h("p", { class: "wc-invite" }, runs(close.invite)),
        h("p", { class: "wc-question-end" }, runs(close.question)),
        h("p", { class: "wc-again" }, runs(close.again))),
      h("figure", { class: "wc-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage, passage.label), " · BSB"),
        h("div", { class: "wc-passage-text" }, passage.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))))),
    art(WCArt.close, "wc-close-art"),
    h("div", { class: "wc-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use)))),
    h("a", { class: "wc-back", href: "/study/theology?area=doctrine" }, art(icon("arrowLeft", 16)), "Back to God & Christian Faith"),
  ));

  // The register's joining lines, drawn from where the names actually sit, so they hold at any width.
  function drawJoins() {
    const svg = register.querySelector(".wc-joins");
    const box = svg.getBoundingClientRect();
    if (!box.width) { svg.replaceChildren(); return; }
    const ns = "http://www.w3.org/2000/svg";
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    svg.replaceChildren(...witnesses.joins.map(([a, b]) => {
      const from = register.querySelector(`[data-who="${a}"] .wc-who`).getBoundingClientRect();
      const to = register.querySelector(`[data-who="${b}"] .wc-who`).getBoundingClientRect();
      const y1 = from.top + from.height / 2 - box.top, y2 = to.top + to.height / 2 - box.top;
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", `M0 ${y1}C${box.width / 2} ${y1} ${box.width / 2} ${y2} ${box.width} ${y2}`);
      return path;
    }));
  }
  new ResizeObserver(drawJoins).observe(register);

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "wc-sheet", "aria-labelledby": "wc-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    const item = passages[id];
    if (!item) return;
    sheet.replaceChildren(
      h("div", { class: "wc-sheet-head" }, h("h2", { id: "wc-sheet-title" }, item.label), h("button", { type: "button", class: "wc-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "wc-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "wc-sheet-src" }, "Berean Standard Bible"));
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
    const query = params.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
    opener?.focus();
    opener = null;
  });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.wc-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });

  // A link to #part-01…06 chooses that picture; the reading then sits where the link points.
  function followHash() {
    const n = /^#part-(0[1-6])$/.exec(location.hash)?.[1];
    if (n) choose(n, { scroll: true });
  }
  window.addEventListener("hashchange", followHash);
  const params = new URLSearchParams(location.search);
  const asked = params.get("picture");
  choose(PICTURE.test(asked || "") ? asked : "01", { scroll: false, push: PICTURE.test(asked || "") });
  followHash();
  const ref = params.get("ref");
  if (ref && passages[ref]) openSheet(ref, false);
})();
