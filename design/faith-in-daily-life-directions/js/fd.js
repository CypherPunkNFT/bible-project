// Faith in daily life, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js. Values read from the
// address are looked up in maps built from data.js, so an unknown value is simply ignored.
(() => {
  const { study, passages, reasons, pairs, sources, numbers } = window.FD;
  const readings = new Map(study.readings.map((r) => [r.slug, r]));
  const passageIds = new Map(Object.entries(passages));
  const pairIds = new Map(pairs.map((p) => [p.id, p]));
  const sourceIds = new Map(sources.map((s) => [s.id, s]));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  const { h, art, pills, chips, readingPanel, threads } = StudyKit;
  const refLink = (id, text) => h("a", { class: "fd-ref", href: `?sheet=${id}`, "data-sheet": id }, text);
  const runs = (list) => list.map((run) => (typeof run === "string" ? run : refLink(run.r, run.t)));
  const plain = (list) => list.map((run) => (typeof run === "string" ? run : run.t)).join("");

  // ── Address ──
  const VIEWS = ["marks", "sentences"];
  const ONLY = ["all", "L", "N"];
  function readAddress() {
    const params = new URLSearchParams(location.search);
    const reading = params.get("reading");
    const sheet = (params.get("sheet") ?? "").replaceAll("–", "-");
    const oneOf = (name, allowed) => (allowed.includes(params.get(name)) ? params.get(name) : allowed[0]);
    return {
      reading: readings.has(reading) ? reading : null,
      sheet: passageIds.has(sheet) || pairIds.has(sheet) ? sheet : null,
      lens: oneOf("lens", ["whole", "step", "scripture"]),
      view: oneOf("view", VIEWS),
      only: oneOf("only", ONLY),
      older: oneOf("older", ["threads", "list"]),
    };
  }
  function addressFor(state) {
    const params = new URLSearchParams();
    if (state.reading) params.set("reading", state.reading);
    if (state.sheet) params.set("sheet", state.sheet);
    if (state.lens !== "whole") params.set("lens", state.lens);
    if (state.view !== VIEWS[0]) params.set("view", state.view);
    if (state.only !== ONLY[0]) params.set("only", state.only);
    if (state.older !== "threads") params.set("older", state.older);
    const query = params.toString();
    return `${location.pathname}${query ? `?${query}` : ""}`;
  }

  const state0 = readAddress();

  // ── Frame ──
  const brandCount = (text) => (text.match(/Bible Project/g) ?? []).length;
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => {
    const original = header();
    if (!brandCount(original)) console.error("Faith in daily life: the site name was not found in the shared header");
    return original
      .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}<span class="sep"`)
      .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  };
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page fd-page sk-page" });
  main.append(page);

  // ── Hero ──
  const motto = plain(study.motto).split(" / ");
  const figures = [
    ["Places", numbers.places, "home, work, money, table, street, conscience"],
    ["Verses walked", numbers.verses, "each counted once, across the readings"],
    ["Letters", numbers.letters, "and Acts, for one clash of commands"],
    ["Older passages quoted", numbers.older, `in ${numbers.letterVerses} verses of the letters`],
    ["Reasons sorted", numbers.reasons, "chosen by this study, not a census"],
  ];
  const hero = h("section", { class: "t-sec-landing fd-hero", id: "top" },
    h("div", { class: "hc-intro fd-intro" },
      h("div", {},
        h("nav", { class: "fd-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=life" }, "Living the Christian Life"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "fd-here", "aria-current": "page" }, study.title)),
        h("p", { class: "fd-concepts" }, plain(study.concepts)),
        h("h1", {}, "Faith in", h("em", {}, "daily life")),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "fd-opening" },
          h("blockquote", {}, study.opening.t),
          h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible")),
      ),
      h("figure", { class: "ms-hero-art fd-hero-art" },
        art(FDArt.hero),
        h("span", { class: "ms-art-note" }, h("i"), motto[0], h("br"), h("span", {}, motto[1])),
      ),
    ),
    h("dl", { class: "fd-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
    h("nav", { class: "sk-jump", "aria-label": "On this page" }, [["places", "01", "Six places. One Lord."], ["why", "02", "Ask the sentence why."], ["older", "03", "Older words, underneath."]].map(([to, number, text]) => h("a", { href: `#${to}` }, h("b", {}, number), text))),
  );
  page.append(hero);

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, `${number} / 03`),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));

  // ── 01 The six places ──
  const panel = h("section", { class: "fd-panel sk-panel", id: "fd-reading", "aria-live": "off", hidden: true });
  const cardGrid = h("div", { class: "fd-cards" });
  const cards = new Map();
  study.readings.forEach((reading) => {
    const parts = reading.read.map((id) => passages[id].label);
    const card = h("a", {
      class: "fd-card sk-card", href: `?reading=${reading.slug}`, "aria-expanded": "false", "aria-controls": "fd-reading", "data-reading": reading.slug,
    },
      h("span", { class: "sk-card-top" }, h("span", {}, "Reading ", h("b", {}, `${reading.n} / ${String(study.readings.length).padStart(2, "0")}`)), h("span", { class: "sk-arrow", "aria-hidden": "true" }, "↗")),
      art(FDArt.cards[reading.slug], "sk-scene"),
      h("span", { class: "sk-card-title" }, reading.title),
      h("span", { class: "sk-card-hook" }, plain(reading.hook)),
      h("span", { class: "sk-card-parts" }, h("span", {}, `${reading.verseCount} verses · ${parts.length === 1 ? parts[0] : `${parts[0]} and ${parts.length - 1} more`}`)),
      h("span", { class: "sk-action" }, h("span", { class: "sk-action-text fd-action-text" }, "Open the reading"), h("span", { "aria-hidden": "true" }, " →")),
    );
    cards.set(reading.slug, card);
    cardGrid.append(card);
  });
  const selection = h("p", { class: "fd-note" }, runs(study.selection));
  page.append(h("section", { class: "t-sec", id: "places" },
    sectionHead("01", "Six places.", "One Lord.", runs(study.frame)),
    h("p", { class: "fd-key sk-key" },
      h("b", {}, "How to read this page: "), "gold-referenced lines set apart are Scripture, in the Berean. Plain text is written by this site from Scripture. Outside sources are named, with what was read. An application is called an application."),
    cardGrid, selection));

  const blockView = {
    quote: (b) => h("figure", { class: "fd-quote" }, h("blockquote", {}, b.t), h("figcaption", {}, refLink(b.r, b.label), " · BSB")),
    p: (b) => h("p", {}, runs(b.runs)),
    care: (b) => h("div", { class: "fd-flag fd-flag-care" }, h("span", { class: "fd-flag-label" }, "A detail to handle carefully"), h("p", {}, runs(b.runs))),
    other: (b) => h("div", { class: "fd-flag" }, h("span", { class: "fd-flag-label" }, "Another reading, labelled as such"), h("p", {}, runs(b.runs))),
    open: (b) => h("div", { class: "fd-flag fd-flag-open" }, h("span", { class: "fd-flag-label" }, "Open question · this study does not choose"), h("p", {}, runs(b.runs))),
    source: (b) => {
      const source = sourceIds.get(b.src);
      return h("div", { class: "fd-flag fd-flag-source" }, h("span", { class: "fd-flag-label" }, "Named source"), h("p", {}, runs(b.runs)),
        h("small", {}, source.name, ". ", source.note));
    },
  };
  const reader = readingPanel({
    pre: "fd", study, passages, runs, refLink, blockView, closeIcon: icon("x", 18),
    strip: { title: "What the passage says", view: (r) => h("dl", { class: "fd-strip" },
      h("div", {}, h("dt", {}, "What the passage says"), h("dd", {}, runs(r.says))),
      h("div", {}, h("dt", {}, "Its setting"), h("dd", {}, runs(r.setting))),
      h("div", {}, h("dt", {}, "A response you might make"), h("dd", {}, runs(r.respond)))) },
    lens: readAddress().lens,
    onLens: (id) => { state = { ...state, lens: id }; history.replaceState(null, "", addressFor(state)); },
    onChoose: (slug) => setReading(slug, false, true),
    onClose: () => setReading(null, true),
  });
  // The panel sits on its own row straight after the row holding the chosen card, so it opens in place at every width.
  function placePanel() {
    if (!state.reading) return;
    const columns = getComputedStyle(cardGrid).gridTemplateColumns.split(" ").length || 1;
    const index = study.readings.findIndex((r) => r.slug === state.reading);
    const lastInRow = Math.min(study.readings.length - 1, Math.floor(index / columns) * columns + columns - 1);
    const rowEnd = cards.get(study.readings[lastInRow].slug);
    if (rowEnd.nextElementSibling !== panel) rowEnd.after(panel); // moving it replays its fade, so only when the row changed
  }

  let state = state0;
  function setReading(slug, returnFocus = false, moveToPanel = false) {
    const previous = state.reading;
    state = { ...state, reading: slug };
    history.replaceState(null, "", addressFor(state));
    syncReading();
    if (!slug && returnFocus && previous) { cards.get(previous).focus({ preventScroll: false }); cards.get(previous).scrollIntoView({ block: "nearest" }); }
    if (slug && moveToPanel) {
      const title = document.getElementById("fd-reading-title");
      title?.focus({ preventScroll: true });
      panel.scrollIntoView({ block: "start", behavior: reducedMotion.matches ? "auto" : "smooth" });
    }
  }
  function syncReading() {
    for (const [slug, card] of cards) {
      const on = slug === state.reading;
      card.setAttribute("aria-expanded", String(on));
      card.classList.toggle("is-on", on);
      card.querySelector(".fd-action-text").textContent = on ? "Reading now · close" : "Open the reading";
    }
    if (state.reading) {
      panel.replaceChildren(...reader.draw(readings.get(state.reading)));
      panel.hidden = false;
      placePanel();
    } else {
      panel.hidden = true;
      panel.replaceChildren();
    }
  }
  cardGrid.addEventListener("click", (event) => {
    const card = event.target.closest("a.fd-card");
    if (!card || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    const slug = card.dataset.reading;
    setReading(state.reading === slug ? null : slug);
    if (state.reading) panel.scrollIntoView({ block: "nearest", behavior: reducedMotion.matches ? "auto" : "smooth" });
  });
  addEventListener("resize", placePanel);

  // ── 02 Ask the sentence why ──
  const reasonLine = h("div", { class: "fd-readout", "aria-live": "polite" });
  function showReason(reason) {
    reasonLine.replaceChildren(
      h("p", {}, reason.pre, h("mark", {}, reason.mark), reason.post),
      h("p", { class: "fd-readout-meta" },
        h("span", {}, reason.pole === "L" ? "Toward the Lord" : "Toward another person"), " · ", refLink(reason.r, `Open ${reason.label} →`)));
  }
  const dots = [];
  const POLE = { L: "Toward the Lord", N: "Toward another person" };
  const place = (slug, pole) => reasons.filter((r) => r.place === slug && r.pole === pole).map((reason) => {
    const dot = h("button", { type: "button", class: `fd-dot fd-dot-${pole}`, "aria-label": `${reason.label}: ${reason.mark}. ${POLE[pole]}.`, tabindex: "-1" }, h("i"));
    dot.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") { showReason(reason); markDot(dot); } });
    dot.addEventListener("focus", () => { showReason(reason); markDot(dot); });
    dot.addEventListener("click", (event) => {
      event.stopPropagation(); // the page's click-outside rule must not close the sheet this opens
      showReason(reason); markDot(dot);
      if (event.detail > 0 && lastPointer === "touch") return; // on touch, a tap shows the line, whose link opens the verse
      openSheet(reason.r, dot);
    });
    dots.push(dot);
    return dot;
  });
  let lastPointer = "mouse";
  addEventListener("pointerdown", (event) => { lastPointer = event.pointerType; }, { capture: true });
  function markDot(dot) {
    for (const other of dots) { other.classList.toggle("is-on", other === dot); other.tabIndex = other === dot ? 0 : -1; }
  }
  const rows = study.readings.map((reading) => h("div", { class: "fd-row" },
    h("div", { class: "fd-row-left" }, place(reading.slug, "L")),
    h("div", { class: "fd-row-name" }, reading.title),
    h("div", { class: "fd-row-right" }, place(reading.slug, "N"))));
  const liveDots = () => dots.filter((dot) => !dot.classList.contains("is-dim"));
  const dotGroup = h("div", {
    class: "fd-dots", role: "group", "aria-label": "Reasons in each place. Use the arrow keys to move between them, Enter to open the verse.",
    onkeydown: (event) => {
      const live = liveDots();
      const at = live.indexOf(document.activeElement);
      if (at < 0) return;
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      live[(at + step + live.length) % live.length].focus();
    },
  }, h("div", { class: "fd-poles", "aria-hidden": "true" },
    h("span", {}, h("i", { class: "fd-dot-sample fd-dot-sample-L" }), POLE.L), h("span"), h("span", {}, POLE.N, h("i", { class: "fd-dot-sample fd-dot-sample-N" }))), rows);
  dots[0].tabIndex = 0;
  showReason(reasons[0]);
  const sentences = h("div", { class: "sk-sentences" });
  function drawWhy() {
    dots.forEach((dot) => dot.classList.toggle("is-dim", state.only !== "all" && !dot.classList.contains(`fd-dot-${state.only}`)));
    const firstLive = liveDots()[0];
    if (firstLive && !liveDots().some((dot) => dot.tabIndex === 0)) markDot(firstLive);
    dotGroup.hidden = state.view !== "marks";
    reasonLine.hidden = state.view !== "marks";
    sentences.hidden = state.view !== "sentences";
    const poles = state.only === "all" ? ["L", "N"] : [state.only];
    sentences.classList.toggle("is-one", poles.length === 1);
    sentences.replaceChildren(...poles.map((pole) => h("div", {},
      h("p", { class: "sk-sentence-head" }, h("i", { class: `fd-dot-sample fd-dot-sample-${pole}` }), POLE[pole], h("b", {}, String(reasons.filter((r) => r.pole === pole).length))),
      reasons.filter((r) => r.pole === pole).map((reason) => h("div", { class: "sk-sentence" },
        h("p", {}, reason.pre, h("mark", {}, reason.mark), reason.post),
        h("small", {}, readings.get(reason.place).title, " · ", refLink(reason.r, reason.label)))))));
    figure.classList.toggle("is-text", state.view === "sentences");
  }
  const figure = h("div", { class: "sk-figure" }, h("div", { class: "sk-figure-main" }, dotGroup, sentences), reasonLine);
  reasonLine.classList.add("sk-side");
  const setWhy = (change) => { state = { ...state, ...change }; history.replaceState(null, "", addressFor(state)); drawWhy(); };
  const whyPills = pills("How to see the reasons", [["marks", "The marks"], ["sentences", "Every sentence"]], state0.view, (id) => setWhy({ view: id }));
  const whyChips = chips("Show the reasons", [
    ["all", "All", numbers.reasons],
    ["L", POLE.L, numbers.towardLord, h("i", { class: "fd-dot-sample fd-dot-sample-L" })],
    ["N", POLE.N, numbers.towardPerson, h("i", { class: "fd-dot-sample fd-dot-sample-N" })],
  ], state0.only, (id) => setWhy({ only: id }));
  page.append(h("section", { class: "t-sec", id: "why" },
    sectionHead("02", "Ask the sentence", "why.", "What reason does the instruction itself give? This is the way of reading this study wants you to take with you. Point at a mark to read its verse here; choose it to open the verse."),
    h("p", { class: "fd-reads" }, `Of the ${numbers.reasons} reasons chosen here, ${numbers.towardLord} point to the Lord and ${numbers.towardPerson} to another person, and all six places have both.`),
    h("div", { class: "sk-controls" }, whyChips, whyPills),
    figure,
    h("p", { class: "fd-note" }, "This is a hand-picked selection from the readings, and the sorting into two sides is this site's reading of each sentence. It is a way of noticing, not a count of the letters. A circle means toward the Lord; a ring means toward another person."),
    h("ol", { class: "fd-way" }, ["Who is being spoken to?", "What are they asked to do?", "What reason does the sentence give?", "What carries over to you, and what does not?"].map((text) => h("li", {}, text)))));

  // ── 03 The older words underneath ──
  const pairLine = h("div", { class: "fd-readout", "aria-live": "polite" });
  function showPair(pair) {
    const text = (id) => passages[id].verses.map((v) => v.t).join(" ");
    pairLine.replaceChildren(
      h("div", { class: "fd-pair-read" },
        h("div", {}, h("span", { class: "fd-pair-head" }, pair.olderLabel), h("p", {}, text(pair.older))),
        h("div", {}, h("span", { class: "fd-pair-head" }, pair.letterLabel), h("p", {}, text(pair.letter)))));
  }
  const pairRows = pairs.map((pair) => {
    const row = h("button", { type: "button", class: `fd-pair fd-sec-${pair.section}`, "data-sheet": pair.id, "aria-label": `${pair.olderLabel}, ${pair.sectionName}, quoted in ${pair.letterLabel}. Open both.` },
      h("span", { class: "fd-pair-older" }, h("i"), h("b", {}, pair.olderLabel), h("small", {}, pair.sectionName)),
      h("span", { class: "fd-pair-rule", "aria-hidden": "true" }),
      h("span", { class: "fd-pair-letter" }, pair.letterLabel));
    row.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") showPair(pair); });
    row.addEventListener("focus", () => showPair(pair));
    return row;
  });
  const threadFigure = threads({ pairs, label: "Each older passage joined to the letter that quotes it. Choose one to open both.", onShow: showPair, describe: (pair) => `${pair.olderLabel}, ${pair.sectionName}, quoted in ${pair.letterLabel}. Open both.` });
  threadFigure.show(pairs[0]);
  const pairList = h("div", { class: "fd-pairs" }, pairRows);
  pairLine.classList.add("sk-side");
  function drawOlder() { threadFigure.hidden = state.older !== "threads"; pairList.hidden = state.older !== "list"; }
  const olderPills = pills("How to see the older words", [["threads", "The threads"], ["list", "The list"]], state0.older, (id) => { state = { ...state, older: id }; history.replaceState(null, "", addressFor(state)); drawOlder(); });
  page.append(h("section", { class: "t-sec", id: "older" },
    sectionHead("03", "Older words,", "underneath.", "Did the letters invent these duties? Each time they quote older Scripture, they show you where the duty comes from. Point at a line to read both passages; choose it to open them."),
    h("p", { class: "fd-reads" }, `These ${numbers.letterVerses} verses quote ${numbers.older} older passages, and every one of them comes from the Law, Psalms, Proverbs or Isaiah.`),
    h("div", { class: "sk-controls" }, h("span"), olderPills),
    h("div", { class: "sk-figure" }, h("div", { class: "sk-figure-main" }, threadFigure, pairList), pairLine),
    h("p", { class: "fd-note" }, "Every quotation inside the walked passages is here. The letter's wording can differ from the Old Testament passage in the Berean, because the letters often follow a Greek translation. Possible echoes, such as Hebrews 13:2 and Abraham's visitors, are named in the readings as possible, and are not counted.")));

  // ── Close ──
  page.append(h("section", { class: "t-sec fd-closing", id: "close" },
    h("div", { class: "fd-close-text sk-carry" },
      h("p", { class: "fd-concepts" }, study.closing),
      h("p", {}, runs(study.close)),
      h("p", { class: "fd-way-line" }, runs(study.way)),
      h("p", { class: "fd-question" }, runs(study.question)),
      h("p", { class: "fd-again" }, runs(study.again), " ", refLink(study.passage, passages[study.passage].label)),
      h("nav", { class: "fd-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=life" }, "← Back to Living the Christian Life"),
        h("a", { href: "/study/letters" }, "Read the letters as they were sent →"))),
    art(FDArt.street, "fd-street"),
    h("details", { class: "fd-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, h("a", { href: source.href, rel: "noopener noreferrer", target: "_blank" }, source.name), h("span", {}, source.note)))),
      h("p", { class: "fd-note" }, "Studies this one leaves to others, none of them a page yet: Freedom that serves (conscience at full length), Learning to discern, Bearing witness, Returning and restoring. Scripture references and the Calvin and Gill quotations were checked by script: that proves the words are there, not that the reading is right.")),
  ));

  // ── The record sheet: one, from the right, for every passage ──
  const sheetBody = h("div", { class: "ms-sheet-body fd-sheet-body" });
  const sheetClose = h("button", { type: "button", class: "ms-sheet-close", "aria-label": "Close the passage", onclick: () => closeSheet() });
  sheetClose.append(art(icon("x", 18)));
  const sheetEl = h("aside", { class: "ms-sheet fd-sheet", role: "dialog", "aria-modal": "true", "aria-label": "Passage in the Berean Standard Bible", tabindex: "-1" }, sheetClose, sheetBody);
  document.body.append(sheetEl);
  const backgroundParts = () => [document.querySelector(".site-header"), document.getElementById("main"), document.querySelector(".site-footer")].filter(Boolean);
  let sheetOpener = null;

  const verseBlock = (id) => {
    const p = passages[id];
    let chapter = null;
    const out = [h("h3", {}, p.label)];
    const paragraph = h("p", { class: "fd-sheet-text" });
    p.verses.forEach((v) => {
      if (v.c !== chapter) { chapter = v.c; if (p.chapters.length > 1) paragraph.append(h("span", { class: "fd-sheet-ch" }, `Chapter ${v.c}`)); }
      paragraph.append(h("sup", {}, String(v.v)), `${v.t} `);
    });
    out.push(paragraph, h("p", { class: "fd-sheet-links" }, p.chapters.map((c) => h("a", { href: `/read/bsb/${p.code}/${c}` }, `Open ${p.label.replace(/ \d+:.*/, "")} ${c} in the reader →`))));
    return out;
  };
  function drawSheet(id) {
    const pair = pairIds.get(id);
    sheetBody.replaceChildren(
      h("p", { class: "fd-kind" }, pair ? `Scripture · ${pair.sectionName} · quoted in a letter` : "Scripture · Berean Standard Bible"),
      ...(pair ? [...verseBlock(pair.older), ...verseBlock(pair.letter)] : verseBlock(id)),
      h("p", { class: "fd-note" }, "Berean Standard Bible, public domain. Courtesy credit: berean.bible."),
    );
    sheetBody.scrollTop = 0;
  }
  function showSheet(id) {
    drawSheet(id);
    sheetEl.classList.add("open");
    for (const part of backgroundParts()) part.inert = true;
    sheetClose.focus({ preventScroll: true });
  }
  function hideSheet() {
    sheetEl.classList.remove("open");
    for (const part of backgroundParts()) part.inert = false;
    const target = sheetOpener?.isConnected ? sheetOpener : (state.reading ? cards.get(state.reading) : document.querySelector("h1"));
    if (target === document.querySelector("h1")) target.tabIndex = -1;
    target?.focus({ preventScroll: true });
    sheetOpener = null;
  }
  function openSheet(id, opener) {
    if (!passageIds.has(id) && !pairIds.has(id)) { console.error(`Faith in daily life: unknown passage ${id}`); return; }
    sheetOpener = opener ?? document.activeElement;
    state = { ...state, sheet: id };
    history.pushState(null, "", addressFor(state));
    showSheet(id);
  }
  function closeSheet() {
    if (!state.sheet) return;
    state = { ...state, sheet: null };
    history.replaceState(null, "", addressFor(state));
    hideSheet();
  }
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-sheet]");
    if (trigger) { event.preventDefault(); openSheet(trigger.dataset.sheet, trigger); return; }
    if (state.sheet && !sheetEl.contains(event.target)) closeSheet();
  });
  addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (state.sheet) { event.preventDefault(); closeSheet(); return; }
    if (state.reading && (panel.contains(document.activeElement) || cards.get(state.reading) === document.activeElement)) { event.preventDefault(); setReading(null, true); }
  });
  addEventListener("popstate", () => {
    const next = readAddress();
    const hadSheet = state.sheet;
    state = next;
    reader.setLens(state.lens);
    drawWhy(); drawOlder();
    syncReading();
    if (state.sheet) showSheet(state.sheet);
    else if (hadSheet) hideSheet();
  });

  // Cold load from a shared address: land on what it names.
  drawWhy(); drawOlder();
  syncReading();
  if (state.reading) panel.scrollIntoView({ block: "start" });
  if (state.sheet) showSheet(state.sheet);
  window.FD_READY = true;
})();
