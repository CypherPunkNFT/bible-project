// The story of the Bible, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js and the shared icons.
// Values read from the address (?at=, ?ref=) are looked up in Maps or a fixed list, so an unknown value is ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.style.cssText = "padding:2rem;font:1rem serif";
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`The story of the Bible: ${detail}`);
  }
  const data = window.SB;
  if (!data || !data.study || !data.passages || !Array.isArray(data.threads)) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.SB is missing or incomplete");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.SBArt) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon or SBArt is missing");

  const { study, numbers, sources, checks, threads, states } = data;
  const passages = new Map(Object.entries(data.passages));
  const parts = study.parts;
  const order = parts.map((p) => p.n);
  const KEPT = new Set(["kept", "full"]);

  function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") element.className = value;
      else if (key.startsWith("on")) element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value === true ? "" : value);
    }
    element.append(...children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false));
    return element;
  }
  function art(markup, className) {
    const holder = h("span", { class: className });
    holder.innerHTML = markup; // fixed drawings from art.js and shared icons only
    return holder;
  }
  const label = (text) => h("span", { class: "sb-label" }, text);
  const refLink = (id, text) => passages.has(id) ? h("a", { class: "sb-ref", href: `?ref=${encodeURIComponent(id)}`, "data-ref": id }, text || passages.get(id).label) : text;
  const verseText = (id) => passages.get(id).verses.map((v) => v[1]).join(" ");
  const SAFE = /^\/(?![/\\])[A-Za-z0-9._~/?=&#%-]*$/;
  const tone = (n) => `var(--${data.movementSection[n]})`;
  function runs(list = []) {
    return list.map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return SAFE.test(run.a) ? h("a", { class: "sb-link", href: run.a }, run.t) : run.t;
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if (run.chk) return h("a", { class: "sb-chk", href: `#check-${run.chk}`, "aria-label": `Note ${run.chk}: still to be checked` }, String(run.chk));
      if ("s" in run) return studyLink(run);
      return "";
    });
  }
  const studyLink = (run) => run.s && SAFE.test(run.s) ? h("a", { class: "sb-link", href: run.s, title: "Mock-up on this PC" }, h("em", {}, run.t)) : h("em", { class: "sb-study", title: "Not yet a page" }, run.t);

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page sb-page" });
  main.append(page);

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));

  // ── Hero: the standard heading ──
  const opening = study.opening[0];
  const figures = [
    ["Movements", numbers.movements, "each a place where Scripture itself turns, from the garden to the city"],
    ["Books cited", numbers.books, `with a verse opened on this page; the other ${numbers.canon - numbers.books} sit inside these movements`],
    ["Promises followed", numbers.threads, `on ${numbers.marks} marks, each warranted by the study's own words`],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
  ];
  page.append(h("section", { class: "t-sec-landing sb-hero", id: "top" },
    h("div", { class: "hc-intro sb-intro" },
      h("div", {},
        h("nav", { class: "sb-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=books" }, "Explore the Bible"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "sb-here", "aria-current": "page" }, study.title)),
        h("p", { class: "sb-concepts" }, study.concepts.join(" · ")),
        h("h1", {}, "The story ", h("em", {}, "of the Bible")),
        h("p", { class: "sb-subtitle" }, study.subtitle.charAt(0).toUpperCase() + study.subtitle.slice(1)),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "sb-opening" }, h("blockquote", {}, verseText(opening.r)), h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art sb-hero-art" }, art(SBArt.hero), h("span", { class: "ms-art-note" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1])))),
    h("dl", { class: "sb-figures" }, figures.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    h("nav", { class: "sb-toc", "aria-label": "On this page" },
      h("a", { href: "#map" }, h("b", {}, "00"), "Where am I?"),
      parts.map((p, i) => h("a", { href: `#part-${p.n}`, style: `--tone:${tone(p.n)}` }, h("b", {}, p.n), data.stations[i])),
      h("a", { href: "#close" }, h("b", {}, "→"), "Your place"))));

  // ── 00 Where am I? The map: eight stations on one road, six threads beneath, and the study's three questions ──
  const at = (n) => order.indexOf(n);
  function standing(n) {
    const here = at(n);
    return threads.map((thread) => {
      const before = thread.marks.filter((m) => at(m.at) <= here);
      const promise = [...before].reverse().find((m) => m.state === "made" || m.state === "again");
      const last = before[before.length - 1];
      const ended = thread.ends && at(thread.ends) < here;
      const wait = thread.waits && thread.waits[n];
      return { thread, promise, last, ended, wait };
    });
  }
  const live = h("p", { class: "sb-live", "aria-live": "polite" }, "Point at a mark to read it here; choose it to open the verse.");
  let lastSaid = null;
  function say(thread, mark) {
    if (lastSaid === mark) return;
    lastSaid = mark;
    live.replaceChildren(h("b", {}, thread.name), ` · ${mark.at} ${data.stations[at(mark.at)]} · ${mark.stateName}${mark.reading ? " (a reading)" : ""} · `, h("q", {}, mark.phrase), ` ${mark.ref}. `, h("span", { class: "sb-live-study" }, "The study: ", h("q", {}, mark.study)));
  }
  const pin = h("span", { class: "sb-pin", "aria-hidden": "true" }, "You are here");
  const stationButtons = parts.map((p, i) => h("button", { type: "button", class: "sb-station", role: "radio", "aria-checked": "false", tabindex: "-1", "data-n": p.n, style: `--tone:${tone(p.n)}`,
    onclick: () => choose(p.n) }, h("b", {}, p.n), h("span", {}, data.stations[i]), h("small", {}, data.sections[data.movementSection[p.n]])));
  const road = h("div", { class: "sb-road-row", role: "radiogroup", "aria-label": "Choose a point in the story", onkeydown: roam }, stationButtons);
  function roam(event) {
    const i = stationButtons.indexOf(document.activeElement);
    if (i < 0) return;
    const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: stationButtons.length - 1 }[event.key];
    if (to === undefined) return;
    event.preventDefault();
    const next = stationButtons[Math.max(0, Math.min(stationButtons.length - 1, to))];
    next.focus();
    choose(next.dataset.n);
  }
  const markButton = (thread, mark) => h("button", { type: "button", class: `sb-mark is-${mark.state}${mark.reading ? " is-reading" : ""}`,
    "aria-label": `${thread.name}: ${mark.stateName}${mark.reading ? ", a reading" : ""}, ${mark.ref}. Opens the verse.`,
    onmouseenter: () => say(thread, mark), onfocus: () => say(thread, mark), onclick: (e) => { opener = e.currentTarget; openSheet(mark.r); } },
  h("i", { "aria-hidden": "true" }));
  const grid = h("div", { class: "sb-threads", role: "group", "aria-label": "Six promises across the eight movements; the list beneath gives every mark in words" },
    threads.map((thread) => {
      const first = at(thread.marks[0].at), lastAt = at(thread.marks[thread.marks.length - 1].at);
      const cells = order.map((n, c) => {
        const mark = thread.marks.find((m) => m.at === n);
        // A stretch is solid once the promise has been kept at least in part where it starts; before that it waits.
        const from = (side) => [...thread.marks].reverse().find((m) => (side === "left" ? at(m.at) < c : at(m.at) <= c)) || null;
        const style = (m) => (m && ["part", "kept", "full"].includes(m.state) ? "solid" : "dashed");
        const cls = ["sb-cell"];
        if (c > first && c <= lastAt) cls.push("has-left", `left-${style(from("left"))}`);
        if (c >= first && c < lastAt) cls.push("has-right", `right-${style(from("right"))}`);
        const wait = thread.waits && thread.waits[n];
        return h("div", { class: cls.join(" "), "data-col": c },
          mark ? markButton(thread, mark) : wait ? h("span", { class: "sb-wait", title: wait }, h("i", { "aria-hidden": "true" }), h("span", { class: "sb-sr" }, `${thread.name}, still waiting at ${n}: ${wait}`)) : null);
      });
      return h("div", { class: `sb-thread${thread.gold ? " is-gold" : ""}` },
        h("p", { class: "sb-thread-name" }, h("b", {}, thread.name), h("small", {}, thread.about)), cells);
    }));
  const readout = h("div", { class: "sb-readout", "aria-live": "polite" });
  function choose(n, push = true) {
    if (!order.includes(n)) return;
    const here = at(n);
    stationButtons.forEach((b, i) => { b.setAttribute("aria-checked", String(i === here)); b.tabIndex = i === here ? 0 : -1; b.classList.toggle("is-past", i < here); });
    stationButtons[here].prepend(pin);
    grid.style.setProperty("--here", here);
    grid.querySelectorAll(".sb-cell").forEach((cell) => cell.classList.toggle("is-ahead", Number(cell.dataset.col) > here));
    const part = parts[here];
    const rows = standing(n);
    const promised = rows.filter((r) => r.promise);
    const waiting = rows.filter((r) => r.promise && !r.ended && (r.wait || !KEPT.has(r.last.state)));
    const lost = rows.filter((r) => !r.promise && r.last && r.last.state === "lost");
    const ended = rows.filter((r) => r.ended);
    const item = (r, m, words) => h("li", {}, h("b", {}, r.thread.name), " ", h("span", { class: `sb-tag is-${m.state}` }, words || m.stateName), m.reading ? h("span", { class: "sb-tag is-reading" }, "a reading") : null, " ", h("q", {}, m.phrase), " ", refLink(m.r, m.ref));
    // What is still waiting: since when, in the study's own words where it has them, and where the story keeps it later.
    function waitingItem(r) {
      const later = r.thread.marks.find((m) => at(m.at) > here && (KEPT.has(m.state) || m.state === "part"));
      const since = r.last.state === "part" ? `kept in part at ${r.last.at}` : `waiting since ${r.promise.at}`;
      return h("li", {}, h("b", {}, r.thread.name), " ", h("span", { class: "sb-tag is-waiting" }, since),
        r.wait ? [" ", h("q", {}, r.wait)] : null, " ",
        later ? h("span", { class: "sb-later" }, `${later.stateName} later, at ${later.at} ${data.stations[at(later.at)]}: `, refLink(later.r, later.ref), later.reading ? " (a reading)" : "")
          : h("span", { class: "sb-later" }, "The study follows it no further."));
    }
    readout.replaceChildren(
      h("div", { class: "sb-q sb-q-where", style: `--tone:${tone(n)}` }, h("h3", {}, "Where am I?"),
        h("p", { class: "sb-where-name" }, h("b", {}, part.n), ` ${part.name}`, part.turn ? h("em", {}, `: ${part.turn}`) : null),
        h("p", {}, runs(part.line)), h("p", { class: "sb-small" }, `In ${data.sections[data.movementSection[n]]}. `, h("a", { class: "sb-link", href: `#part-${n}` }, `Read movement ${n}`))),
      h("div", { class: "sb-q" }, h("h3", {}, "What has God promised by this point?"),
        promised.length ? h("ul", {}, promised.map((r) => item(r, r.promise, r.promise.state === "again" ? "promised again" : `promised at ${r.promise.at}`))) : h("p", { class: "sb-small" }, "Nothing yet in these threads.")),
      h("div", { class: "sb-q" }, h("h3", {}, "What is still waiting?"),
        waiting.length ? h("ul", {}, waiting.map(waitingItem)) : h("p", { class: "sb-small" }, "Nothing in these threads: each promise followed here is kept."),
        lost.length ? h("p", { class: "sb-small" }, "Lost from view: ", lost.map((r, i) => [i ? "; " : "", h("b", {}, r.thread.name), " (", refLink(r.last.r, r.last.ref), ")"])) : null,
        ended.length ? h("p", { class: "sb-small" }, ended.map((r) => `${r.thread.name}: the study follows it only as far as movement ${r.thread.ends}.`).join(" ")) : null));
    if (push) setParam("at", n);
  }
  const marksList = h("details", { class: "sb-marks" }, h("summary", {}, `Every mark in words (${numbers.marks})`),
    h("div", { class: "sb-marks-grid" }, threads.map((thread) => h("div", {}, h("h3", {}, thread.name), h("p", { class: "sb-small" }, thread.about),
      h("ol", {}, thread.marks.map((m) => h("li", {}, h("b", {}, `${m.at} ${data.stations[at(m.at)]}`), " ", h("span", { class: `sb-tag is-${m.state}` }, m.stateName), m.reading ? h("span", { class: "sb-tag is-reading" }, "a reading") : null, " ", h("q", {}, m.phrase), " ", refLink(m.r, m.ref)))),
      thread.ends ? h("p", { class: "sb-small" }, `The study follows this thread only as far as movement ${thread.ends}.`) : null))));
  const key = h("ul", { class: "sb-key", "aria-label": "What the marks mean" }, Object.entries(states).map(([state, name]) => h("li", {}, h("i", { class: `sb-mark-shape is-${state}`, "aria-hidden": "true" }), name)),
    h("li", {}, h("i", { class: "sb-mark-shape is-made is-reading", "aria-hidden": "true" }), "a reading, not what the verse says"),
    h("li", {}, h("i", { class: "sb-line-shape", "aria-hidden": "true" }), "dashed: still waiting"));
  const fourPart = h("figure", { class: "sb-four" },
    h("figcaption", {}, label("Two maps of the same country"), " The four-part summary the study names, set against its eight movements. How the four fall across the eight is this page's alignment, not the study's."),
    h("div", { class: "sb-four-grid", "aria-hidden": "true" },
      data.fourPart.map(([name, span]) => h("span", { class: "sb-four-span", style: `grid-column:${at(span[0]) + 1} / ${at(span[span.length - 1]) + 2}` }, name)),
      parts.map((p, i) => h("span", { class: "sb-four-n", style: `grid-column:${i + 1};--tone:${tone(p.n)}` }, h("b", {}, p.n), data.stations[i]))),
    h("p", { class: "sb-sr" }, data.fourPart.map(([name, span]) => `${name}: movement${span.length > 1 ? `s ${span[0]} to ${span[span.length - 1]}` : ` ${span[0]}`}`).join("; ")));
  page.append(h("section", { class: "t-sec sb-map", id: "map" },
    sectionHead("00", "Where", "am I?", "Choose a point in the story. The page answers the study's three questions for it."),
    h("p", { class: "sb-frame" }, runs(study.frame)),
    h("div", { class: "sb-board" }, road, grid, key, live),
    readout, marksList,
    h("p", { class: "sb-note" }, "The six threads and their marks are this page's reading aid. Each mark is a verse the study points to, and each carries words of the study's own that say what the mark claims; none says more. The colour of a station is the part of the Bible its readings come from; the station's name and section say the same in words."),
    h("div", { class: "sb-selection" }, h("p", {}, runs(study.selection)), fourPart)));

  // ── 01–08 The movements, under a strip that keeps the reader's place on wide screens ──
  const strip = h("nav", { class: "sb-strip", "aria-label": "Movements" }, parts.map((p, i) => h("a", { href: `#part-${p.n}`, "data-n": p.n, style: `--tone:${tone(p.n)}` }, h("b", {}, p.n), h("span", {}, data.stations[i]))));
  const story = h("div", { class: "sb-story" }, strip);
  page.append(story);
  parts.forEach((part, index) => {
    const body = h("div", { class: "sb-body" });
    const blocks = part.blocks;
    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i], next = blocks[i + 1];
      if (block.k === "note" && block.kind === "other" && next && next.k === "note" && next.kind === "read") {
        body.append(h("div", { class: "sb-pair" }, h("p", { class: "sb-pair-q" }, label("Two ways of hearing it")), renderBlock(block), renderBlock(next)));
        i += 1;
      } else body.append(renderBlock(block));
    }
    const rows = standing(part.n);
    const promised = rows.filter((r) => r.promise).length;
    const waiting = rows.filter((r) => r.promise && !r.ended && (r.wait || !KEPT.has(r.last.state))).map((r) => r.thread.name);
    body.append(h("p", { class: "sb-standing" }, label("On the map"), ` By this point ${promised} of the ${threads.length} promises ${promised === 1 ? "is" : "are"} made. Still waiting: ${waiting.length ? waiting.join("; ") : "none of them"}. `,
      h("a", { class: "sb-link", href: `?at=${part.n}#map`, "data-at": part.n }, "Stand here on the map")));
    if (part.more.length) body.append(h("div", { class: "sb-more" }, label("Read closely in"), h("ul", {}, part.more.map((m) => h("li", {}, studyLink(m))))));
    body.append(h("dl", { class: "sb-ask" },
      h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
      h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect)))));
    story.append(h("article", { class: "t-sec sb-part", id: `part-${part.n}`, "data-n": part.n, style: `--tone:${tone(part.n)}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "sb-part-head" },
        h("p", { class: "sb-part-where" }, h("span", { class: "sb-n" }, part.n), h("span", {}, data.stations[index]), h("small", {}, data.sections[data.movementSection[part.n]])),
        art(SBArt.parts[part.n], "sb-mini-wrap"),
        h("div", { class: "sb-part-title" },
          h("h2", { id: `part-${part.n}-title` }, part.name, part.turn ? h("em", {}, ` ${part.turn}`) : null),
          h("p", { class: "sb-hook" }, runs(part.hook)),
          h("p", { class: "sb-line" }, runs(part.line)),
          h("p", { class: "sb-readings" }, label("Main readings"), " ", part.readings.map((r, i) => [i ? " · " : "", r.r ? refLink(r.r, r.t) : h("span", { class: "sb-outline" }, r.outline)])))),
      body));
  });

  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "quote": return h("figure", { class: "sb-quote" }, h("blockquote", {}, verseText(block.r)), h("figcaption", {}, refLink(block.r, block.label), " · BSB"));
      case "note": return h("aside", { class: `sb-note-block is-${block.kind}` }, label(block.label), h("p", {}, runs(block.runs)));
      default: console.error(`The story of the Bible: unknown block ${block.k}`); return "";
    }
  }

  // ── Close: finding your place in the story ──
  const close = study.close;
  const [closeTitle, closeTurn] = close.title.split(/ (?=in the story$)/);
  page.append(h("section", { class: "t-sec sb-close", id: "close" },
    sectionHead("→", closeTitle, closeTurn || ""),
    h("div", { class: "sb-close-grid" },
      h("div", {},
        h("p", { class: "sb-way" }, runs(close.way)),
        h("ol", { class: "sb-asks", "aria-label": "The three questions to carry" }, data.questions.way.map((ask) => h("li", {}, ask))),
        h("p", { class: "sb-close-p" }, runs(close.close)),
        h("p", { class: "sb-invite" }, runs(close.invite)),
        close.more.length ? h("div", { class: "sb-more" }, label("Read next"), h("ul", {}, close.more.map((m) => h("li", {}, studyLink(m))))) : null,
        h("p", { class: "sb-question" }, runs(close.question)),
        h("p", { class: "sb-again" }, runs(close.again))),
      h("figure", { class: "sb-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage), " · BSB"),
        h("p", { class: "sb-passage-text" }, passages.get(close.passage).verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))))),
    art(SBArt.close, "sb-close-art"),
    h("details", { class: "sb-checks", id: "checks" },
      h("summary", {}, `Notes still to be checked (${checks.length})`),
      h("p", {}, "The study marks each of these for checking before it is published. A number in the text leads here."),
      h("ol", {}, checks.map((c) => h("li", { id: `check-${c.n}` }, c.t)))),
    h("div", { class: "sb-sources" }, h("h3", {}, "Sources"), h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use)))),
    h("a", { class: "sb-back", href: "/study/theology?area=books" }, art(icon("arrowLeft", 16)), "Back to Explore the Bible")));

  // ── The strip follows the reading ──
  const stripLinks = new Map([...strip.querySelectorAll("a")].map((a) => [a.dataset.n, a]));
  if ("IntersectionObserver" in window) {
    const seen = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      stripLinks.forEach((a, n) => { a.toggleAttribute("aria-current", n === entry.target.dataset.n); a.classList.toggle("is-past", at(n) < at(entry.target.dataset.n)); });
    }), { rootMargin: "-40% 0px -55% 0px" });
    story.querySelectorAll(".sb-part").forEach((part) => seen.observe(part));
  }

  // ── The verse sheet, and the address ──
  function setParam(name, value) {
    const params = new URLSearchParams(location.search);
    if (value) params.set(name, value); else params.delete(name);
    const query = params.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
  }
  const sheet = h("dialog", { class: "sb-sheet", "aria-labelledby": "sb-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    const item = passages.get(id);
    if (!item) return;
    sheet.replaceChildren(
      h("div", { class: "sb-sheet-head" }, h("h2", { id: "sb-sheet-title", tabindex: "-1" }, item.label), h("button", { type: "button", class: "sb-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "sb-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "sb-sheet-src" }, "Berean Standard Bible"));
    if (!sheet.open) sheet.showModal();
    if (!push) sheet.querySelector("h2").focus();
    if (push) setParam("ref", id);
  }
  sheet.addEventListener("close", () => { setParam("ref", null); opener?.focus(); opener = null; });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.sb-ref");
    if (link) { event.preventDefault(); opener = link; openSheet(link.dataset.ref); return; }
    const stand = event.target.closest("a[data-at]");
    if (stand) { event.preventDefault(); choose(stand.dataset.at); document.getElementById("map").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); stationButtons[at(stand.dataset.at)].focus({ preventScroll: true }); return; }
    if (event.target.closest("a.sb-chk")) document.getElementById("checks").open = true;
  });

  const params = new URLSearchParams(location.search);
  const askedAt = params.get("at");
  choose(order.includes(askedAt) ? askedAt : order[0], false);
  const asked = params.get("ref");
  if (asked && passages.has(asked)) openSheet(asked, false);
})();
