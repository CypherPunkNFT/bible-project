// The hope to come, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js. Values read from the
// address are looked up in maps built from data.js, so an unknown value is simply ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`The hope to come: ${detail}`);
  }
  if (!window.HP) {
    stop("This mock-up has no study data: data.js did not load. Run build-data.py in this folder, then reload.", "window.HP is missing, data.js did not load or did not parse");
    return;
  }
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.HPArt) {
    stop("This mock-up could not load its shared frame or drawings. Check that the preview is serving the whole design folder, then reload.", "Frame, icon or HPArt is missing");
    return;
  }
  const { study, passages, therefore, noCall, bookends, mapSteps, sources, numbers } = window.HP;
  const readings = new Map(study.readings.map((r) => [r.slug, r]));
  const passageIds = new Map(Object.entries(passages));
  const sourceIds = new Map(sources.map((s) => [s.id, s]));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

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
    const holder = document.createElement("span");
    if (className) holder.className = className;
    holder.innerHTML = markup; // fixed drawings from art.js only
    return holder;
  }
  const refLink = (id, text, extra = "") => h("a", { class: `hp-ref ${extra}`.trim(), href: `?sheet=${id}`, "data-sheet": id }, text);
  const runs = (list) => list.map((run) => (typeof run === "string" ? run : refLink(run.r, run.t)));
  const plain = (list) => list.map((run) => (typeof run === "string" ? run : run.t)).join("");

  // ── Address ──
  function readAddress() {
    const params = new URLSearchParams(location.search);
    const reading = params.get("reading");
    const sheet = (params.get("sheet") ?? "").replaceAll("–", "-");
    return { reading: readings.has(reading) ? reading : null, sheet: passageIds.has(sheet) ? sheet : null };
  }
  function addressFor(view) {
    const params = new URLSearchParams();
    if (view.reading) params.set("reading", view.reading);
    if (view.sheet) params.set("sheet", view.sheet);
    const query = params.toString();
    return `${location.pathname}${query ? `?${query}` : ""}`;
  }

  // ── Frame ──
  const brandCount = (text) => (text.match(/Bible Project/g) ?? []).length;
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => {
    const original = header();
    if (!brandCount(original)) console.error("The hope to come: the site name was not found in the shared header");
    return original
      .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}<span class="sep"`)
      .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  };
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page hp-page" });
  main.append(page);

  // ── Hero ──
  const motto = plain(study.motto).split(" / ");
  const figures = [
    ["Readings", numbers.readings, "each opens where it sits, and each starts with its passage"],
    ["Verses walked", numbers.verses, "each counted once, in the Berean"],
    ["Promise and call", numbers.rows, `joined in the verse itself; ${numbers.saysTherefore} say therefore. Chosen for the pattern, not a count of it`],
    ["First and last pages", numbers.bookends, `${numbers.shares} share a word, ${numbers.echoes} are this study's matching`],
    ["The thousand years", numbers.thousandVerses, "verses, all in Revelation 20, the only place the Bible ties those years to a reign"],
  ];
  page.append(h("section", { class: "t-sec-landing hp-hero", id: "top" },
    h("div", { class: "hc-intro hp-intro" },
      h("div", {},
        h("nav", { class: "hp-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "hp-here", "aria-current": "page" }, study.title)),
        h("p", { class: "hp-concepts" }, plain(study.concepts)),
        h("h1", {}, "The hope", h("em", {}, "to come")),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "hp-opening" },
          h("blockquote", {}, study.opening.t),
          h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible")),
      ),
      h("figure", { class: "ms-hero-art hp-hero-art" },
        art(HPArt.hero),
        h("span", { class: "ms-art-note" }, h("i"), motto[0], h("br"), h("span", {}, motto[1])),
      ),
    ),
    h("dl", { class: "hp-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
  ));

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));

  // ── 01 The six readings ──
  const panel = h("section", { class: "hp-panel", id: "hp-reading", "aria-live": "off", hidden: true });
  const cardGrid = h("div", { class: "hp-cards" });
  const cards = new Map();
  study.readings.forEach((reading) => {
    const parts = reading.read.map((id) => passages[id].label);
    const card = h("a", {
      class: "hp-card", href: `?reading=${reading.slug}`, "aria-expanded": "false", "aria-controls": "hp-reading", "data-reading": reading.slug,
    },
      h("span", { class: "hp-kind" }, "Reading ", h("b", {}, `${reading.n} / ${String(study.readings.length).padStart(2, "0")}`)),
      art(HPArt.cards[reading.slug], "hp-mini-wrap"),
      h("span", { class: "hp-card-title" }, reading.title),
      h("span", { class: "hp-card-hook" }, plain(reading.hook)),
      h("span", { class: "hp-card-parts" }, `${reading.verseCount} verses · ${parts.join(" · ")}`),
      h("span", { class: "hp-action" }, h("span", { class: "hp-action-text" }, "Open the reading"), h("span", { "aria-hidden": "true" }, " →")),
    );
    cards.set(reading.slug, card);
    cardGrid.append(card);
  });
  cardGrid.append(panel); // always in the page, so each card's aria-controls has a target
  page.append(h("section", { class: "t-sec", id: "readings" },
    sectionHead("01", "Six readings.", "Three questions each.", runs(study.frame)),
    h("p", { class: "hp-key" },
      h("b", {}, "How to read this page: "), "gold-referenced lines set apart are Scripture, in the Berean. Plain text is written by this site from Scripture. Outside sources are named, with what was read. An application is called an application. The numbers mark the order of the readings, not levels of difficulty."),
    cardGrid, h("p", { class: "hp-note" }, runs(study.selection))));

  const sourceNote = (id) => {
    const source = sourceIds.get(id);
    if (!id || !source) return null;
    return h("small", {}, h("a", { href: source.href, rel: "noopener noreferrer", target: "_blank" }, source.name), ". ", source.note);
  };
  const flag = (className, label, block) => h("div", { class: `hp-flag ${className}` }, h("span", { class: "hp-flag-label" }, label), h("p", {}, runs(block.runs)), sourceNote(block.src));
  const blockView = {
    quote: (b) => h("figure", { class: "hp-quote" }, h("blockquote", {}, b.t), h("figcaption", {}, refLink(b.r, b.label), " · BSB")),
    p: (b) => h("p", {}, runs(b.runs)),
    care: (b) => flag("hp-flag-care", "A detail to handle carefully", b),
    other: (b) => flag("", "Another tradition, labelled as theirs", b),
    open: (b) => flag("hp-flag-open", "Open question · this study does not choose", b),
    source: (b) => flag("hp-flag-source", "Named source", b),
    own: (b) => flag("hp-flag-source", "Named source · told in this site's words", b),
  };
  const QUESTIONS = [["promised", "What is promised"], ["asks", "What it asks now"], ["open", "What it leaves open"]];
  function drawPanel(reading) {
    const next = study.readings[(study.readings.indexOf(reading) + 1) % study.readings.length];
    const closeButton = h("button", { type: "button", class: "hp-close", "aria-label": `Close the reading: ${reading.title}`, onclick: () => setReading(null, true) });
    closeButton.append(art(icon("x", 18)));
    panel.replaceChildren(
      h("header", { class: "hp-panel-head" },
        h("div", {},
          h("p", { class: "hp-kind" }, "Reading ", h("b", {}, reading.n)),
          h("h3", { tabindex: "-1", id: "hp-reading-title" }, reading.title),
          h("p", { class: "hp-hook" }, runs(reading.hook)),
          h("p", { class: "hp-read" }, h("span", {}, "Begin with the passage: "), reading.read.flatMap((id, i) => [i ? " · " : null, refLink(id, passages[id].label)])),
          h("p", { class: "hp-setting" }, h("span", {}, "Its setting: "), runs(reading.setting))),
        closeButton),
      h("dl", { class: "hp-strip" }, QUESTIONS.map(([key, label]) => h("div", {}, h("dt", {}, label), h("dd", {}, runs(reading[key]))))),
      h("div", { class: "hp-parts" }, reading.parts.map((part) => h("div", { class: "hp-part" }, h("h4", {}, part.title), part.blocks.map((block) => blockView[block.k](block))))),
      h("div", { class: "hp-prompts" },
        h("div", {}, h("h4", {}, "Look closely"), h("p", {}, runs(reading.look))),
        h("div", {}, h("h4", {}, "Your response"), h("p", {}, runs(reading.response)))),
      h("footer", { class: "hp-panel-foot" },
        h("button", { type: "button", class: "hp-next", onclick: () => setReading(next.slug, false, true) }, `Next: ${next.title} →`),
        h("button", { type: "button", class: "hp-next", onclick: () => setReading(null, true) }, "Close this reading ↑")),
    );
  }
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

  let state = readAddress();
  function setReading(slug, returnFocus = false, moveToPanel = false) {
    const previous = state.reading;
    state = { ...state, reading: slug };
    history.replaceState(null, "", addressFor(state));
    syncReading();
    if (!slug && returnFocus && previous) { cards.get(previous).focus({ preventScroll: false }); cards.get(previous).scrollIntoView({ block: "nearest" }); }
    if (slug && moveToPanel) {
      document.getElementById("hp-reading-title")?.focus({ preventScroll: true });
      panel.scrollIntoView({ block: "start", behavior: reducedMotion.matches ? "auto" : "smooth" });
    }
  }
  function syncReading() {
    for (const [slug, card] of cards) {
      const on = slug === state.reading;
      card.setAttribute("aria-expanded", String(on));
      card.classList.toggle("is-on", on);
      card.querySelector(".hp-action-text").textContent = on ? "Reading now · close" : "Open the reading";
    }
    if (state.reading) {
      drawPanel(readings.get(state.reading));
      panel.hidden = false;
      placePanel();
    } else {
      panel.hidden = true;
      panel.replaceChildren();
    }
  }
  cardGrid.addEventListener("click", (event) => {
    const card = event.target.closest("a.hp-card");
    if (!card || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    const slug = card.dataset.reading;
    setReading(state.reading === slug ? null : slug);
    if (state.reading) panel.scrollIntoView({ block: "nearest", behavior: reducedMotion.matches ? "auto" : "smooth" });
  });
  addEventListener("resize", placePanel);

  // ── 02 Promise, joining word, call: a real table, which stacks on a phone ──
  const COLUMNS = ["The promise", "The word that joins them", "The call"];
  page.append(h("section", { class: "t-sec", id: "therefore" },
    sectionHead("02", "The promise.", "Then the therefore.", "Does hope about the end make people passive? Read what comes straight after the promise. The joining word in the middle column is in the verse."),
    h("p", { class: "hp-reads" }, `Here are ${numbers.rows} places where a promise about the end is tied to something to do now, and ${numbers.saysTherefore} of them use the word therefore.`),
    h("div", { class: "hp-table-wrap" }, h("table", { class: "hp-table", role: "table" },
      h("caption", { class: "hp-sr" }, "Each promise about the end, the word that joins it to a call, and the call, with its verse."),
      h("thead", { role: "rowgroup" }, h("tr", { role: "row" }, COLUMNS.map((label) => h("th", { scope: "col", role: "columnheader" }, label)))),
      h("tbody", { role: "rowgroup" }, therefore.map((row) => h("tr", { role: "row" },
        h("td", { role: "cell", "data-label": COLUMNS[0] }, h("span", { class: "hp-phrase" }, row.promiseText), refLink(row.promise, row.promiseLabel, "hp-row-ref")),
        h("td", { role: "cell", "data-label": COLUMNS[1], class: "hp-link-word" }, h("b", {}, row.link), h("span", { "aria-hidden": "true" }, " →")),
        h("td", { role: "cell", "data-label": COLUMNS[2] }, h("span", { class: "hp-phrase" }, row.callText), refLink(row.call, row.callLabel, "hp-row-ref"))))))),
    h("p", { class: "hp-note" }, `These ${numbers.rows} were chosen because they show the pattern, so they cannot prove it is everywhere. It is not: `,
      noCall.flatMap((item, i) => [i ? "; " : null, refLink(item.r, item.label), `, ${item.why}`]),
      ". In some rows the joining word is the verse's own therefore; in others it is a smaller word, and a reader may weigh those less. Where a row runs from one verse to the next, the verse division is the translators', not the author's.")));

  // ── 03 First pages, prophets, last pages ──
  const kindLabel = (row) => (row.kind === "shares" ? `Both verses say: ${row.word}` : "This study's matching, and nothing more");
  const end = (label, reference, text) => h("div", { class: "hp-end" },
    h("span", { class: "hp-end-head" }, label), h("span", { class: "hp-phrase" }, text), refLink(reference, passages[reference].label, "hp-row-ref"));
  page.append(h("section", { class: "t-sec", id: "lost" },
    sectionHead("03", "What was lost.", "What Revelation answers.", "How much of the end was already on the first pages? Read each row in order: what Genesis or Exodus says, where a prophet picks it up, and what John sees. Solid line: the same English word in both end verses. Dotted line: a likeness this study is pointing out, which you should weigh."),
    h("ol", { class: "hp-ends" }, bookends.map((row) => h("li", { class: `hp-end-row hp-end-${row.kind}` },
      h("h3", {}, row.name, h("small", {}, kindLabel(row))),
      h("div", { class: "hp-end-cols" },
        end("First", row.start, row.startText),
        h("div", { class: "hp-end hp-end-mid" }, h("span", { class: "hp-end-head" }, "Between"),
          row.middle.length ? row.middle.map((item) => h("span", { class: "hp-mid" }, h("span", { class: "hp-phrase" }, item.t), refLink(item.r, item.label, "hp-row-ref"))) : h("span", { class: "hp-none" }, "None drawn here")),
        end("Last", row.last, row.lastText))))),
    h("p", { class: "hp-note" }, "Compared in the Berean's English only, with no check in Hebrew or Greek, and Revelation uses no quotation formula, so sharing a word does not prove John is quoting. The one identification Revelation makes outright is the deceiver: it names the devil as the ancient serpent twice (", refLink("REV.12.9", "Revelation 12:9"), "; ", refLink("REV.20.2", "Revelation 20:2"), "). Paul makes another himself, calling Christ the last Adam (", refLink("1CO.15.45", "1 Corinthians 15:45"), "). The rest are echoes: a script checks that the words are there and in Bible order, and cannot check that the writer meant the link.")));

  // ── 04 Several maps: ordered lists lined up on the return, so before and after can be read down the page ──
  const [mapsFirst, mapsTurn] = study.mapsTitle.split(". ");
  const BEFORE = Math.max(...mapSteps.map((map) => map.steps.findIndex(([, kind]) => kind === "return")));
  const AFTER = Math.max(...mapSteps.map((map) => map.steps.length - 1 - map.steps.findIndex(([, kind]) => kind === "return")));
  const strip = (map) => {
    const at = map.steps.findIndex(([, kind]) => kind === "return");
    return h("ol", { class: "hp-map", style: `--before:${BEFORE};--after:${AFTER}`, "aria-label": `Order of events, not scale: ${map.name}` },
      map.steps.map(([label, kind], index) => h("li", { class: `hp-step hp-step-${kind || "plain"}`, style: `grid-column:${BEFORE + 1 - at + index}` },
        h("i", { "aria-hidden": "true" }),
        h("span", {}, label),
        kind === "return" ? h("small", {}, "The return") : kind === "reign" ? h("small", {}, "The thousand years") : null)));
  };
  const mapParts = study.maps.slice(0, mapSteps.length);
  const otherParts = study.maps.slice(mapSteps.length);
  page.append(h("section", { class: "t-sec", id: "maps" },
    sectionHead("04", `${mapsFirst}.`, mapsTurn, runs(study.mapsLead)),
    h("p", { class: "hp-reads" }, `All ${mapSteps.length} line up below on the return, in gold. Look at whether the thousand years come before it or after it.`),
    h("div", { class: "hp-maps" }, mapParts.map((part, index) => h("div", { class: "hp-map-part" },
      h("h3", { class: "hp-map-title" }, part.title),
      h("p", { class: "hp-map-reads" }, mapSteps[index].reads),
      strip(mapSteps[index]),
      h("div", { class: "hp-map-text" }, part.blocks.map((block) => blockView[block.k](block)))))),
    h("p", { class: "hp-note" }, "Each strip shows order, not length: no step is drawn to scale."),
    h("div", { class: "hp-parts" }, otherParts.map((part) => h("div", { class: "hp-part" }, h("h3", { class: "hp-map-title" }, part.title), part.blocks.map((block) => blockView[block.k](block)))))));

  // ── Close ──
  page.append(h("section", { class: "t-sec hp-closing", id: "close" },
    h("div", { class: "hp-close-text" },
      h("p", { class: "hp-concepts" }, study.closing),
      h("p", {}, runs(study.close)),
      h("p", { class: "hp-way-line" }, runs(study.way)),
      h("p", { class: "hp-invite" }, runs(study.invite)),
      h("p", { class: "hp-question" }, runs(study.question)),
      h("p", { class: "hp-again" }, runs(study.again), " ", refLink(study.passage, passages[study.passage].label)),
      h("nav", { class: "hp-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=doctrine" }, "← Back to God & Christian Faith"),
        h("a", { href: "/mockups/faith-under-pressure-directions/" }, "Faith under pressure, its mock-up →"),
        h("a", { href: "/mockups/covenants-and-promises-directions/" }, "Covenants and promises, its mock-up →"))),
    art(HPArt.land, "hp-land"),
    h("details", { class: "hp-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, h("a", { href: source.href, rel: "noopener noreferrer", target: "_blank" }, source.name), h("span", {}, source.note)))),
      h("p", { class: "hp-note" }, "Not read for this page, so not shown: any writer who holds the golden-age view, and any named source on whether 2 Peter 3:10 means replaced or renewed. Scripture references and the Calvin, Boyce and Abstract of Principles quotations were checked by script: that proves the words are there, not that the reading is right.")),
  ));

  // ── The record sheet: one, from the right, for every passage ──
  const sheetBody = h("div", { class: "ms-sheet-body hp-sheet-body" });
  const sheetClose = h("button", { type: "button", class: "ms-sheet-close", "aria-label": "Close the passage", onclick: () => closeSheet() });
  sheetClose.append(art(icon("x", 18)));
  const sheetEl = h("aside", { class: "ms-sheet hp-sheet", role: "dialog", "aria-modal": "true", "aria-label": "Passage in the Berean Standard Bible", tabindex: "-1" }, sheetClose, sheetBody);
  document.body.append(sheetEl);
  const backgroundParts = () => [document.querySelector(".site-header"), document.getElementById("main"), document.querySelector(".site-footer")].filter(Boolean);
  let sheetOpener = null;

  function drawSheet(id) {
    const p = passages[id];
    let chapter = null;
    const paragraph = h("p", { class: "hp-sheet-text" });
    p.verses.forEach((v) => {
      if (v.c !== chapter) { chapter = v.c; if (p.chapters.length > 1) paragraph.append(h("span", { class: "hp-sheet-ch" }, `Chapter ${v.c}`)); }
      paragraph.append(h("sup", {}, String(v.v)), `${v.t} `);
    });
    sheetBody.replaceChildren(
      h("p", { class: "hp-kind" }, "Scripture · Berean Standard Bible"),
      h("h3", {}, p.label), paragraph,
      h("p", { class: "hp-sheet-links" }, p.chapters.map((c) => h("a", { href: `/read/bsb/${p.code}/${c}` }, `Open ${p.label.replace(/ \d+:.*/, "")} ${c} in the reader →`))),
      h("p", { class: "hp-note" }, "Berean Standard Bible, public domain. Courtesy credit: berean.bible."),
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
    if (!passageIds.has(id)) { console.error(`The hope to come: unknown passage ${id}`); return; }
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
    if (state.reading && panel.contains(document.activeElement)) { event.preventDefault(); setReading(null, true); }
  });
  addEventListener("popstate", () => {
    const next = readAddress();
    const hadSheet = state.sheet;
    state = next;
    syncReading();
    if (state.sheet) showSheet(state.sheet);
    else if (hadSheet) hideSheet();
  });

  // Cold load from a shared address.
  syncReading();
  if (state.sheet) showSheet(state.sheet);
  window.HP_READY = true;
})();
