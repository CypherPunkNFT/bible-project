// Faith under pressure, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js. Values read from the
// address are looked up in maps built from data.js, so an unknown value is simply ignored.
(() => {
  if (!window.FP) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = "This mock-up has no study data: data.js did not load. Run build-data.py in this folder, then reload.";
    document.body.prepend(notice);
    console.error("Faith under pressure: window.FP is missing, data.js did not load or did not parse");
    return;
  }
  const { study, passages, strips, calls, pairs, sources, numbers } = window.FP;
  const readings = new Map(study.readings.map((r) => [r.slug, r]));
  const passageIds = new Map(Object.entries(passages));
  const pairIds = new Map(pairs.map((p) => [p.id, p]));
  const sourceIds = new Map(sources.map((s) => [s.id, s]));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const narrow = matchMedia("(max-width: 640px)");
  const KIND = { P: "Names the pressure", C: "Gives the call", G: "States the ground" };

  const { h, art, pills, chips, readingPanel, threads } = StudyKit;
  const refLink = (id, text) => h("a", { class: "fp-ref", href: `?sheet=${id}`, "data-sheet": id }, text);
  const runs = (list) => list.map((run) => (typeof run === "string" ? run : refLink(run.r, run.t)));
  const plain = (list) => list.map((run) => (typeof run === "string" ? run : run.t)).join("");

  // ── Address ──
  const VIEWS = ["verses", "calls"];
  const ONLY = ["all", "P", "C", "G"];
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
    if (!brandCount(original)) console.error("Faith under pressure: the site name was not found in the shared header");
    return original
      .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}<span class="sep"`)
      .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  };
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page fp-page sk-page" });
  main.append(page);

  // ── Hero ──
  const motto = plain(study.motto).split(" / ");
  const figures = [
    ["Pressures", numbers.pressures, "each with its own passage and its own call"],
    ["Verses walked", numbers.verses, `each counted once, in ${numbers.passages} passages`],
    ["Letters", numbers.letters, "and 2 Corinthians 1 to open and close"],
    ["Older passages", numbers.quoted + numbers.retold, `${numbers.quoted} quoted, ${numbers.retold} retold in 1 Corinthians 10`],
    ["Phrases marked", numbers.marks, "chosen by this study, not a census"],
  ];
  page.append(h("section", { class: "t-sec-landing fp-hero", id: "top" },
    h("div", { class: "hc-intro fp-intro" },
      h("div", {},
        h("nav", { class: "fp-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=life" }, "Living the Christian Life"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "fp-here", "aria-current": "page" }, study.title)),
        h("p", { class: "fp-concepts" }, plain(study.concepts)),
        h("h1", {}, "Faith", h("em", {}, "under pressure")),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "fp-opening" },
          h("blockquote", {}, study.opening.t),
          h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible")),
      ),
      h("figure", { class: "ms-hero-art fp-hero-art" },
        art(FPArt.hero),
        h("span", { class: "ms-art-note" }, h("i"), motto[0], h("br"), h("span", {}, motto[1])),
      ),
    ),
    h("dl", { class: "fp-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
    h("nav", { class: "sk-jump", "aria-label": "On this page" }, [["pressures", "01", "Six pressures. Not one answer."], ["ground", "02", "Name the pressure. Find the ground."], ["older", "03", "Older words, underneath."]].map(([to, number, text]) => h("a", { href: `#${to}` }, h("b", {}, number), text))),
  ));

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, `${number} / 03`),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));

  // ── 01 The six pressures ──
  const panel = h("section", { class: "fp-panel sk-panel", id: "fp-reading", "aria-live": "off", hidden: true });
  const cardGrid = h("div", { class: "fp-cards" });
  const cards = new Map();
  study.readings.forEach((reading) => {
    const parts = reading.read.map((id) => passages[id].label);
    const card = h("a", {
      class: "fp-card sk-card", href: `?reading=${reading.slug}`, "aria-expanded": "false", "aria-controls": "fp-reading", "data-reading": reading.slug,
    },
      h("span", { class: "sk-card-top" }, h("span", {}, "Reading ", h("b", {}, `${reading.n} / ${String(study.readings.length).padStart(2, "0")}`)), h("span", { class: "sk-arrow", "aria-hidden": "true" }, "↗")),
      art(FPArt.cards[reading.slug], "sk-scene"),
      h("span", { class: "sk-card-title" }, reading.title),
      h("span", { class: "sk-card-hook" }, plain(reading.hook)),
      h("span", { class: "sk-card-parts" }, h("span", {}, `${reading.verseCount} verses · ${parts.join(" · ")}`)),
      h("span", { class: "sk-action" }, h("span", { class: "sk-action-text fp-action-text" }, "Open the reading"), h("span", { "aria-hidden": "true" }, " →")),
    );
    cards.set(reading.slug, card);
    cardGrid.append(card);
  });
  page.append(h("section", { class: "t-sec", id: "pressures" },
    sectionHead("01", "Six pressures.", "Not one answer.", runs(study.frame)),
    h("p", { class: "fp-key sk-key" },
      h("b", {}, "How to read this page: "), "gold-referenced lines set apart are Scripture, in the Berean. Plain text is written by this site from Scripture. Outside sources are named, with what was read. An application is called an application. The numbers mark reading order, not levels of difficulty or stages to pass through."),
    cardGrid, h("p", { class: "fp-note" }, runs(study.selection))));

  const blockView = {
    quote: (b) => h("figure", { class: "fp-quote" }, h("blockquote", {}, b.t), h("figcaption", {}, refLink(b.r, b.label), " · BSB")),
    p: (b) => h("p", {}, runs(b.runs)),
    care: (b) => h("div", { class: "fp-flag fp-flag-care" }, h("span", { class: "fp-flag-label" }, "A detail to handle carefully"), h("p", {}, runs(b.runs))),
    other: (b) => h("div", { class: "fp-flag" }, h("span", { class: "fp-flag-label" }, "Another reading, labelled as such"), h("p", {}, runs(b.runs))),
    open: (b) => h("div", { class: "fp-flag fp-flag-open" }, h("span", { class: "fp-flag-label" }, "Open question · this study does not choose"), h("p", {}, runs(b.runs))),
    source: (b) => {
      const source = sourceIds.get(b.src);
      return h("div", { class: "fp-flag fp-flag-source" }, h("span", { class: "fp-flag-label" }, "Named source"), h("p", {}, runs(b.runs)),
        h("small", {}, source.name, ". ", source.note));
    },
  };
  const reader = readingPanel({
    pre: "fp", study, passages, runs, refLink, blockView, closeIcon: icon("x", 18),
    strip: { title: "The pressure, the call, the ground", view: (r) => h("dl", { class: "fp-strip" },
      h("div", {}, h("dt", {}, h("i", { class: "fp-g fp-g-P" }), "The pressure"), h("dd", {}, runs(r.pressure))),
      h("div", {}, h("dt", {}, h("i", { class: "fp-g fp-g-C" }), "The call"), h("dd", {}, runs(r.call))),
      h("div", {}, h("dt", {}, h("i", { class: "fp-g fp-g-G" }), "The ground"), h("dd", {}, runs(r.ground))),
      h("div", {}, h("dt", {}, "What it does not promise · this site's reading"), h("dd", {}, runs(r.limit)))) },
    setting: (r) => r.setting,
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
    const lastCard = cards.get(study.readings[lastInRow].slug);
    // Moving the panel restarts its fade and drops focus, and phones fire resize whenever the address bar slides.
    if (lastCard.nextElementSibling !== panel) lastCard.after(panel);
  }

  let state = state0;
  function setReading(slug, returnFocus = false, moveToPanel = false) {
    const previous = state.reading;
    state = { ...state, reading: slug };
    history.replaceState(null, "", addressFor(state));
    syncReading();
    if (!slug && returnFocus && previous) { cards.get(previous).focus({ preventScroll: false }); cards.get(previous).scrollIntoView({ block: "nearest" }); }
    if (slug && moveToPanel) {
      document.getElementById("fp-reading-title")?.focus({ preventScroll: true });
      panel.scrollIntoView({ block: "start", behavior: reducedMotion.matches ? "auto" : "smooth" });
    }
  }
  function syncReading() {
    for (const [slug, card] of cards) {
      const on = slug === state.reading;
      card.setAttribute("aria-expanded", String(on));
      card.classList.toggle("is-on", on);
      card.querySelector(".fp-action-text").textContent = on ? "Reading now · close" : "Open the reading";
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
    const card = event.target.closest("a.fp-card");
    if (!card || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    const slug = card.dataset.reading;
    setReading(state.reading === slug ? null : slug);
    if (state.reading) panel.scrollIntoView({ block: "nearest", behavior: reducedMotion.matches ? "auto" : "smooth" });
  });
  addEventListener("resize", placePanel);

  // ── 02 Name the pressure, find the ground: every verse of every passage, one cell each ──
  const verseLine = h("div", { class: "fp-readout", "aria-live": "polite" });
  const cellButtons = [];
  let lastPointer = "mouse";
  addEventListener("pointerdown", (event) => { lastPointer = event.pointerType; }, { capture: true });
  function showVerse(cell, announce) {
    verseLine.setAttribute("aria-live", announce ? "polite" : "off");
    const kinds = cell.kinds.map((k) => KIND[k]).join(" · ") || "Not marked by this study";
    verseLine.replaceChildren(
      h("p", {}, cell.segs.map((seg) => (seg.k.length ? h("mark", { class: seg.k.map((k) => `fp-m-${k}`).join(" ") }, seg.t) : seg.t))),
      h("p", { class: "fp-readout-meta" }, h("span", {}, kinds), " · ", refLink(cell.r, `Open ${cell.label} →`)));
  }
  function markCell(button) {
    for (const other of cellButtons) { other.classList.toggle("is-on", other === button); other.tabIndex = other === button ? 0 : -1; }
    if (narrow.matches) button.closest(".fp-row").after(verseLine);
    else if (verseLine.previousElementSibling !== figureMain) figureMain.after(verseLine);
  }
  const cellButton = (cell) => {
    const said = cell.kinds.map((k) => KIND[k]).join(", ");
    const button = h("button", { type: "button", class: "fp-cell", tabindex: "-1", "aria-label": `${cell.label}${said ? `: ${said}` : ""}` },
      ["P", "C", "G"].map((k) => h("i", { class: `fp-lane ${cell.kinds.includes(k) ? `fp-g fp-g-${k}` : ""}` })),
      h("span", { class: "fp-cell-v", "aria-hidden": "true" }, String(cell.v)));
    button.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") { showVerse(cell, false); markCell(button); } });
    button.addEventListener("focus", () => { showVerse(cell, true); markCell(button); });
    button.addEventListener("click", (event) => {
      event.stopPropagation(); // the page's click-outside rule must not close the sheet this opens
      showVerse(cell, true); markCell(button);
      if (event.detail > 0 && lastPointer === "touch") return; // on touch, a tap shows the verse, whose link opens it
      openSheet(cell.r, button);
    });
    cellButtons.push(button);
    return button;
  };
  const rows = study.readings.map((reading) => h("div", { class: "fp-row" },
    h("div", { class: "fp-row-name" }, h("span", {}, reading.title), h("small", {}, "the call: ", refLink(calls[reading.slug].r, calls[reading.slug].word))),
    h("div", { class: "fp-row-strips" }, strips.filter((s) => s.place === reading.slug).map((strip) => h("div", { class: "fp-strip-v" },
      h("span", { class: "fp-strip-label" }, refLink(strip.p, strip.label)),
      h("div", { class: "fp-cells" }, strip.cells.map(cellButton)))))));
  const firstOfRow = rows.map((row) => cellButtons.indexOf(row.querySelector(".fp-cell")));
  const cellGroup = h("div", {
    class: "fp-field", role: "group", "aria-label": "Every verse of the six readings. Arrow keys move between verses, up and down move between readings, Enter opens the verse.",
    onkeydown: (event) => {
      const at = cellButtons.indexOf(document.activeElement);
      if (at < 0) return;
      const row = firstOfRow.findLastIndex((first) => first <= at);
      const jump = (delta) => firstOfRow[(row + delta + rows.length) % rows.length];
      const target = { ArrowRight: at + 1, ArrowLeft: at - 1, ArrowDown: jump(1), ArrowUp: jump(-1), Home: 0, End: cellButtons.length - 1 }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      cellButtons[(target + cellButtons.length) % cellButtons.length].focus();
    },
  }, h("p", { class: "fp-legend" },
    h("span", {}, h("i", { class: "fp-g fp-g-P" }), "bar: names the pressure"), h("span", {}, h("i", { class: "fp-g fp-g-C" }), "ring: gives the call"), h("span", {}, h("i", { class: "fp-g fp-g-G" }), "disc: states the ground")), rows);
  cellButtons[0].tabIndex = 0;
  showVerse(strips[0].cells[0], false);
  const allCells = strips.flatMap((strip) => strip.cells);
  const callCards = h("div", { class: "fp-calls" }, study.readings.map((reading) => h("div", { class: "fp-call" },
    h("span", { class: "fp-call-name" }, reading.title),
    h("b", { class: "fp-call-word" }, calls[reading.slug].word),
    refLink(calls[reading.slug].r, calls[reading.slug].label))));
  const figureMain = h("div", { class: "sk-figure-main" }, cellGroup, callCards);
  verseLine.classList.add("sk-side");
  function drawGround() {
    allCells.forEach((cell, index) => cellButtons[index].classList.toggle("is-dim", state.only !== "all" && !cell.kinds.includes(state.only)));
    cellGroup.hidden = state.view !== "verses";
    verseLine.hidden = state.view !== "verses";
    callCards.hidden = state.view !== "calls";
    figureMain.closest(".sk-figure")?.classList.toggle("is-text", state.view === "calls");
    groundChips.hidden = state.view !== "verses";
  }
  const setGround = (change) => { state = { ...state, ...change }; history.replaceState(null, "", addressFor(state)); drawGround(); };
  const groundPills = pills("How to see the verses", [["verses", "Every verse"], ["calls", "The six calls"]], state0.view, (id) => setGround({ view: id }));
  const kindCount = (k) => allCells.filter((cell) => cell.kinds.includes(k)).length;
  const groundChips = chips("Show the marks", [
    ["all", "All", numbers.verses],
    ["P", KIND.P, kindCount("P"), h("i", { class: "fp-g fp-g-P" })],
    ["C", KIND.C, kindCount("C"), h("i", { class: "fp-g fp-g-C" })],
    ["G", KIND.G, kindCount("G"), h("i", { class: "fp-g fp-g-G" })],
  ], state0.only, (id) => setGround({ only: id }));
  page.append(h("section", { class: "t-sec", id: "ground" },
    sectionHead("02", "Name the pressure.", "Find the ground.", "Does a passage hurry past the difficulty, or name it? Does it tell everyone to do the same thing? Here is every verse of the six readings, one mark to a phrase. Point at a verse to read it here; choose it to open the verse."),
    h("p", { class: "fp-reads" }, `All six readings name a pressure, give a call and state a ground, and the call is never the same twice. In ${numbers.passages} passages only Romans 5:1–5 gives no command at all: there Paul simply says what is true.`),
    h("div", { class: "sk-controls" }, groundChips, groundPills),
    h("div", { class: "sk-figure" }, figureMain, verseLine),
    h("p", { class: "fp-note" }, `This is a hand-picked selection: ${numbers.marks} phrases in ${numbers.marked} of the ${numbers.verses} verses, and sorting them into three kinds is this site's reading of each sentence. It is a way of noticing, not a count of the letters. An unmarked verse is not a less important verse.`),
    h("ol", { class: "fp-way" }, ["What kind of pressure is this?", "What does this passage call for?", "What ground does it stand on?", "What does it not promise?"].map((text) => h("li", {}, text)))));

  // ── 03 The older words ──
  const pairLine = h("div", { class: "fp-readout", "aria-live": "polite" });
  function showPair(pair, announce) {
    pairLine.setAttribute("aria-live", announce ? "polite" : "off");
    const text = (id) => passages[id].verses.map((v) => v.t).join(" ");
    pairLine.replaceChildren(
      h("div", { class: "fp-pair-read" },
        h("div", {}, h("span", { class: "fp-pair-head" }, pair.olderLabel), h("p", {}, text(pair.older))),
        h("div", {}, h("span", { class: "fp-pair-head" }, `${pair.letterLabel} · ${pair.kind}`), h("p", {}, text(pair.letter)))));
  }
  const pairRow = (pair) => {
    const row = h("button", { type: "button", class: `fp-pair fp-sec-${pair.section}`, "data-sheet": pair.id, "aria-label": `${pair.olderLabel}, ${pair.sectionName}, ${pair.kind} in ${pair.letterLabel}. Open both.` },
      h("span", { class: "fp-pair-older" }, h("i"), h("b", {}, pair.olderLabel), h("small", {}, pair.sectionName)),
      h("span", { class: "fp-pair-rule", "aria-hidden": "true" }),
      h("span", { class: "fp-pair-letter" }, pair.letterLabel));
    row.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") showPair(pair, false); });
    row.addEventListener("focus", () => showPair(pair, true));
    return row;
  };
  const pairGroup = (kind, title) => [h("h3", { class: "fp-pairs-title" }, title), h("div", { class: "fp-pairs" }, pairs.filter((p) => p.kind === kind).map(pairRow))];
  const threadFigure = threads({ pairs, label: "Each older passage joined to the letter that quotes or retells it. Choose one to open both.", onShow: showPair, isDashed: (pair) => pair.kind === "retold", describe: (pair) => `${pair.olderLabel}, ${pair.sectionName}, ${pair.kind} in ${pair.letterLabel}. Open both.` });
  threadFigure.show(pairs[0]);
  const threadKey = h("p", { class: "sk-threads-key" }, h("span", {}, h("i"), "Quoted, with quotation marks in the Berean"), h("span", {}, h("i", { class: "is-dashed" }), "Retold, in Paul's own words"));
  const pairList = h("div", {}, pairGroup("quoted", "Quoted, with quotation marks in the Berean"), pairGroup("retold", "Retold, in Paul's own words"));
  pairLine.classList.add("sk-side");
  function drawOlder() { threadFigure.hidden = state.older !== "threads"; threadKey.hidden = state.older !== "threads"; pairList.hidden = state.older !== "list"; }
  const olderPills = pills("How to see the older words", [["threads", "The threads"], ["list", "The list"]], state0.older, (id) => { state = { ...state, older: id }; history.replaceState(null, "", addressFor(state)); drawOlder(); });
  page.append(h("section", { class: "t-sec", id: "older" },
    sectionHead("03", "Older words,", "underneath.", "Were these people the first to be tested? When the letters quote older Scripture, or retell it, they show you who stood under pressure before you. Point at a line to read both passages; choose it to open them."),
    h("p", { class: "fp-reads" }, `The readings quote ${numbers.quoted} older passages, and 1 Corinthians 10 retells Israel's wilderness years through ${numbers.retold} more.`),
    h("div", { class: "sk-controls" }, h("span"), olderPills),
    h("div", { class: "sk-figure" }, h("div", { class: "sk-figure-main" }, threadFigure, threadKey, pairList), pairLine),
    h("p", { class: "fp-note" }, "Every quotation inside the walked passages is here. The letter's wording can differ from the Old Testament passage in the Berean, because the letters often follow a Greek translation. Retellings are this study's matching of Paul's sentences to the stories they recall; 1 Corinthians 10:10 may recall more than one grumbling. A possible echo, such as Psalm 55:22 behind 1 Peter 5:7, is named in its reading as possible and is not counted.")));

  // ── Close ──
  page.append(h("section", { class: "t-sec fp-closing", id: "close" },
    h("div", { class: "fp-close-text sk-carry" },
      h("p", { class: "fp-concepts" }, study.closing),
      h("p", {}, runs(study.close)),
      h("p", { class: "fp-way-line" }, runs(study.way)),
      h("p", { class: "fp-question" }, runs(study.question)),
      h("p", { class: "fp-again" }, runs(study.again), " ", refLink(study.passage, passages[study.passage].label)),
      h("nav", { class: "fp-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=life" }, "← Back to Living the Christian Life"),
        h("a", { href: "/mockups/faith-in-daily-life-directions/" }, "Faith in daily life, its mock-up →"),
        h("a", { href: "/study/letters" }, "Read the letters as they were sent →"))),
    art(FPArt.land, "fp-land"),
    h("details", { class: "fp-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, h("a", { href: source.href, rel: "noopener noreferrer", target: "_blank" }, source.name), h("span", {}, source.note)))),
      h("p", { class: "fp-note" }, "Studies this one leaves to others, none of them a page yet: Prayer in the letters, Bearing witness (answering others at full length), The hope to come (the last things), Grief and death, Faith and the troubled mind. Scripture references and the Calvin and Maclaren quotations were checked by script: that proves the words are there, not that the reading is right.")),
  ));

  // ── The record sheet: one, from the right, for every passage ──
  const sheetBody = h("div", { class: "ms-sheet-body fp-sheet-body" });
  const sheetClose = h("button", { type: "button", class: "ms-sheet-close", "aria-label": "Close the passage", onclick: () => closeSheet() });
  sheetClose.append(art(icon("x", 18)));
  const sheetEl = h("aside", { class: "ms-sheet fp-sheet", role: "dialog", "aria-modal": "true", "aria-label": "Passage in the Berean Standard Bible", tabindex: "-1" }, sheetClose, sheetBody);
  document.body.append(sheetEl);
  const backgroundParts = () => [document.querySelector(".site-header"), document.getElementById("main"), document.querySelector(".site-footer")].filter(Boolean);
  let sheetOpener = null;

  const verseBlock = (id) => {
    const p = passages[id];
    let chapter = null;
    const paragraph = h("p", { class: "fp-sheet-text" });
    p.verses.forEach((v) => {
      if (v.c !== chapter) { chapter = v.c; if (p.chapters.length > 1) paragraph.append(h("span", { class: "fp-sheet-ch" }, `Chapter ${v.c}`)); }
      paragraph.append(h("sup", {}, String(v.v)), `${v.t} `);
    });
    return [h("h3", {}, p.label), paragraph, h("p", { class: "fp-sheet-links" }, p.chapters.map((c) => h("a", { href: `/read/bsb/${p.code}/${c}` }, `Open ${p.label.replace(/ \d+:.*/, "")} ${c} in the reader →`)))];
  };
  function drawSheet(id) {
    const pair = pairIds.get(id);
    sheetBody.replaceChildren(
      h("p", { class: "fp-kind" }, pair ? `Scripture · ${pair.sectionName} · ${pair.kind} in a letter` : "Scripture · Berean Standard Bible"),
      ...(pair ? [...verseBlock(pair.older), ...verseBlock(pair.letter)] : verseBlock(id)),
      h("p", { class: "fp-note" }, "Berean Standard Bible, public domain. Courtesy credit: berean.bible."),
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
    if (!passageIds.has(id) && !pairIds.has(id)) { console.error(`Faith under pressure: unknown passage ${id}`); return; }
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
    drawGround(); drawOlder();
    syncReading();
    if (state.sheet) showSheet(state.sheet);
    else if (hadSheet) hideSheet();
  });

  // Cold load from a shared address: land on what it names.
  drawGround(); drawOlder();
  syncReading();
  if (state.reading) panel.scrollIntoView({ block: "start" });
  if (state.sheet) showSheet(state.sheet);
  window.FP_READY = true;
})();
