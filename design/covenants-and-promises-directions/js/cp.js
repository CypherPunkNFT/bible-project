// Covenants and promises, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js. Values read from the
// address are looked up in maps built from data.js, so an unknown value is simply ignored.
(() => {
  if (!window.CP) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = "This mock-up has no study data: data.js did not load. Run build-data.py in this folder, then reload.";
    document.body.prepend(notice);
    console.error("Covenants and promises: window.CP is missing, data.js did not load or did not parse");
    return;
  }
  const { study, passages, lines, covenants, axis, sources, numbers, notDrawn } = window.CP;
  const readings = new Map(study.readings.map((r) => [r.slug, r]));
  const passageIds = new Map(Object.entries(passages));
  const lineIds = new Map(lines.map((l) => [l.id, l]));
  const covenantKeys = new Map(Object.entries(covenants));
  const sourceIds = new Map(sources.map((s) => [s.id, s]));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const narrow = matchMedia("(max-width: 640px)");
  const KIND = { quoted: "Quotes it", names: "Names it", recalls: "Remembers it" };
  const SVG_NS = "http://www.w3.org/2000/svg";

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
  function s(tag, attributes = {}) {
    const element = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    return element;
  }
  function art(markup, className) {
    const holder = document.createElement("span");
    if (className) holder.className = className;
    holder.innerHTML = markup; // fixed drawings from art.js only
    return holder;
  }
  const refLink = (id, text) => h("a", { class: "cp-ref", href: `?sheet=${id}`, "data-sheet": id }, text);
  const runs = (list) => list.map((run) => (typeof run === "string" ? run : refLink(run.r, run.t)));
  const plain = (list) => list.map((run) => (typeof run === "string" ? run : run.t)).join("");

  // ── Address ──
  function readAddress() {
    const params = new URLSearchParams(location.search);
    const reading = params.get("reading");
    const line = params.get("line");
    const sheet = (params.get("sheet") ?? "").replaceAll("–", "-");
    return {
      reading: readings.has(reading) ? reading : null,
      line: covenantKeys.has(line) ? line : null,
      sheet: passageIds.has(sheet) || lineIds.has(sheet) ? sheet : null,
    };
  }
  function addressFor(state) {
    const params = new URLSearchParams();
    if (state.reading) params.set("reading", state.reading);
    if (state.line) params.set("line", state.line);
    if (state.sheet) params.set("sheet", state.sheet);
    const query = params.toString();
    return `${location.pathname}${query ? `?${query}` : ""}`;
  }

  // ── Frame ──
  const brandCount = (text) => (text.match(/Bible Project/g) ?? []).length;
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => {
    const original = header();
    if (!brandCount(original)) console.error("Covenants and promises: the site name was not found in the shared header");
    return original
      .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}<span class="sep"`)
      .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  };
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page cp-page" });
  main.append(page);

  // ── Hero ──
  const motto = plain(study.motto).split(" / ");
  const figures = [
    ["Covenants", numbers.covenants, `each walked where it was first spoken, in ${numbers.readings} readings with the letters`],
    ["Verses walked", numbers.verses, "each counted once, in the Berean"],
    ["Later verses drawn", numbers.lines, `${numbers.quoted} quote, ${numbers.names} name, ${numbers.recalls} remember. A selection`],
    ["In the New Testament", numbers.reachNT, `of those ${numbers.lines} lines end there`],
    ["The word covenant", numbers.wordVerses, `verses, in ${numbers.wordBooks} of ${numbers.totalBooks} books. A count of the word, not the idea`],
  ];
  page.append(h("section", { class: "t-sec-landing cp-hero", id: "top" },
    h("div", { class: "hc-intro cp-intro" },
      h("div", {},
        h("nav", { class: "cp-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "cp-here", "aria-current": "page" }, study.title)),
        h("p", { class: "cp-concepts" }, plain(study.concepts)),
        h("h1", {}, "Covenants", h("em", {}, "and promises")),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "cp-opening" },
          h("blockquote", {}, study.opening.t),
          h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible")),
      ),
      h("figure", { class: "ms-hero-art cp-hero-art" },
        art(CPArt.hero),
        h("span", { class: "ms-art-note" }, h("i"), motto[0], h("br"), h("span", {}, motto[1])),
      ),
    ),
    h("dl", { class: "cp-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
  ));

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));

  // ── 01 The six readings ──
  const panel = h("section", { class: "cp-panel", id: "cp-reading", "aria-live": "off", hidden: true });
  const cardGrid = h("div", { class: "cp-cards" });
  const cards = new Map();
  study.readings.forEach((reading) => {
    const parts = reading.read.map((id) => passages[id].label);
    const card = h("a", {
      class: "cp-card", href: `?reading=${reading.slug}`, "aria-expanded": "false", "aria-controls": "cp-reading", "data-reading": reading.slug,
    },
      h("span", { class: "cp-kind" }, "Reading ", h("b", {}, `${reading.n} / ${String(study.readings.length).padStart(2, "0")}`)),
      art(CPArt.cards[reading.slug], "cp-mini-wrap"),
      h("span", { class: "cp-card-title" }, reading.title),
      h("span", { class: "cp-card-hook" }, plain(reading.hook)),
      h("span", { class: "cp-card-parts" }, `${reading.verseCount} verses · ${parts.join(" · ")}`),
      h("span", { class: "cp-action" }, h("span", { class: "cp-action-text" }, "Open the reading"), h("span", { "aria-hidden": "true" }, " →")),
    );
    cards.set(reading.slug, card);
    cardGrid.append(card);
  });
  cardGrid.append(panel); // always in the page, so each card's aria-controls has a target
  page.append(h("section", { class: "t-sec", id: "readings" },
    sectionHead("01", "Five covenants, one set of heirs.", "Read where they were spoken.", runs(study.frame)),
    h("p", { class: "cp-key" },
      h("b", {}, "How to read this page: "), "gold-referenced lines set apart are Scripture, in the Berean. Plain text is written by this site from Scripture. Outside sources are named, with what was read. An application is called an application. The numbers mark the order of the Bible's story, not levels of difficulty."),
    cardGrid, h("p", { class: "cp-note" }, runs(study.selection))));

  const sourceNote = (id) => {
    const source = sourceIds.get(id);
    if (!id || !source) return null;
    return h("small", {}, h("a", { href: source.href, rel: "noopener noreferrer", target: "_blank" }, source.name), ". ", source.note);
  };
  const flag = (className, label, block) => h("div", { class: `cp-flag ${className}` }, h("span", { class: "cp-flag-label" }, label), h("p", {}, runs(block.runs)), sourceNote(block.src));
  const blockView = {
    quote: (b) => h("figure", { class: "cp-quote" }, h("blockquote", {}, b.t), h("figcaption", {}, refLink(b.r, b.label), " · BSB")),
    p: (b) => h("p", {}, runs(b.runs)),
    care: (b) => flag("cp-flag-care", "A detail to handle carefully", b),
    other: (b) => flag("", "Another tradition, labelled as theirs", b),
    open: (b) => flag("cp-flag-open", "Open question · this study does not choose", b),
    source: (b) => flag("cp-flag-source", "Named source", b),
    own: (b) => flag("cp-flag-source", "Named source · told in this site's words", b),
  };
  const QUESTIONS = [["speaks", "Who speaks"], ["whom", "To whom"], ["promised", "What is promised"], ["asked", "What is asked"], ["sign", "What sign"]];
  function drawPanel(reading) {
    const next = study.readings[(study.readings.indexOf(reading) + 1) % study.readings.length];
    const closeButton = h("button", { type: "button", class: "cp-close", "aria-label": `Close the reading: ${reading.title}`, onclick: () => setReading(null, true) });
    closeButton.append(art(icon("x", 18)));
    panel.replaceChildren(
      h("header", { class: "cp-panel-head" },
        h("div", {},
          h("p", { class: "cp-kind" }, "Reading ", h("b", {}, reading.n)),
          h("h3", { tabindex: "-1", id: "cp-reading-title" }, reading.title),
          h("p", { class: "cp-hook" }, runs(reading.hook)),
          h("p", { class: "cp-read" }, h("span", {}, "Begin with the passage: "), reading.read.flatMap((id, i) => [i ? " · " : null, refLink(id, passages[id].label)])),
          h("p", { class: "cp-setting" }, h("span", {}, "Its setting: "), runs(reading.setting))),
        closeButton),
      h("dl", { class: "cp-strip" }, QUESTIONS.map(([key, label]) => h("div", {}, h("dt", {}, label), h("dd", {}, runs(reading[key]))))),
      h("div", { class: "cp-parts" }, reading.parts.map((part) => h("div", { class: "cp-part" }, h("h4", {}, part.title), part.blocks.map((block) => blockView[block.k](block))))),
      h("div", { class: "cp-prompts" },
        h("div", {}, h("h4", {}, "Look closely"), h("p", {}, runs(reading.look))),
        h("div", {}, h("h4", {}, "Your response"), h("p", {}, runs(reading.response)))),
      h("footer", { class: "cp-panel-foot" },
        h("button", { type: "button", class: "cp-next", onclick: () => setReading(next.slug, false, true) }, `Next: ${next.title} →`),
        h("button", { type: "button", class: "cp-next", onclick: () => setReading(null, true) }, "Close this reading ↑")),
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
      document.getElementById("cp-reading-title")?.focus({ preventScroll: true });
      panel.scrollIntoView({ block: "start", behavior: reducedMotion.matches ? "auto" : "smooth" });
    }
  }
  function syncReading() {
    for (const [slug, card] of cards) {
      const on = slug === state.reading;
      card.setAttribute("aria-expanded", String(on));
      card.classList.toggle("is-on", on);
      card.querySelector(".cp-action-text").textContent = on ? "Reading now · close" : "Open the reading";
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
    const card = event.target.closest("a.cp-card");
    if (!card || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    const slug = card.dataset.reading;
    setReading(state.reading === slug ? null : slug);
    if (state.reading) panel.scrollIntoView({ block: "nearest", behavior: reducedMotion.matches ? "auto" : "smooth" });
  });
  addEventListener("resize", placePanel);

  // ── 02 Five covenants by five questions: a real table, which stacks on a phone ──
  const covenantReadings = study.readings.filter((r) => covenantKeys.has(r.slug));
  page.append(h("section", { class: "t-sec", id: "questions" },
    sectionHead("02", "Five covenants.", "Five questions.", "Do all God's promises say the same thing to the same people? Ask each one the same five questions and look down the columns."),
    h("p", { class: "cp-reads" }, "God speaks first every time. The people, the demands and the signs all differ, and 2 Samuel 7, the great promise to David, names no sign at all."),
    h("div", { class: "cp-table-wrap" }, h("table", { class: "cp-table", role: "table" },
      h("caption", { class: "cp-sr" }, "Each covenant, with who speaks, to whom, what is promised, what is asked and what sign is given."),
      h("thead", { role: "rowgroup" }, h("tr", { role: "row" }, h("th", { scope: "col", role: "columnheader" }, "Covenant"), QUESTIONS.map(([, label]) => h("th", { scope: "col", role: "columnheader" }, label)))),
      h("tbody", { role: "rowgroup" }, covenantReadings.map((reading) => h("tr", { role: "row" },
        h("th", { scope: "row", role: "rowheader" }, h("a", { href: `?reading=${reading.slug}`, "data-open-reading": reading.slug }, covenants[reading.slug])),
        QUESTIONS.map(([key, label]) => h("td", { role: "cell", "data-label": label }, runs(reading[key])))))))),
    h("p", { class: "cp-note" }, "Every cell is a short summary with its verse: this site's wording around the Berean's. The letters are left out of the table because Paul is reading these covenants, not making a sixth; their answers are in reading 06.")));
  page.addEventListener("click", (event) => {
    const link = event.target.closest("[data-open-reading]");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    setReading(link.dataset.openReading, false, true);
  });

  // ── 03 The whole Bible as one line, with an arc from each covenant to later verses ──
  const AXIS_Y = 296, WIDTH = 1000;
  const lineOut = h("div", { class: "cp-readout", "aria-live": "polite" });
  const arcFor = new Map(), rowFor = new Map();
  let lastPointer = "mouse";
  addEventListener("pointerdown", (event) => { lastPointer = event.pointerType; }, { capture: true });
  function showLine(line, announce) {
    lineOut.setAttribute("aria-live", announce ? "polite" : "off");
    const text = (id) => passages[id].verses.map((v) => v.t).join(" ");
    lineOut.replaceChildren(
      h("div", { class: "cp-pair-read" },
        h("div", {}, h("span", { class: "cp-pair-head" }, `${covenants[line.covenant]} · ${line.originLabel}`), h("p", {}, text(line.origin))),
        h("div", {}, h("span", { class: "cp-pair-head" }, `${line.laterLabel} · ${line.sectionName} · ${KIND[line.kind]}`), h("p", {}, text(line.later)))),
      h("p", { class: "cp-readout-meta" }, refLink(line.id, "Open both passages →")));
  }
  function markLine(line, row) {
    for (const [id, arc] of arcFor) arc.classList.toggle("is-on", id === line.id);
    for (const [id, other] of rowFor) { other.classList.toggle("is-on", id === line.id); other.tabIndex = id === line.id ? 0 : -1; }
    if (narrow.matches) rowFor.get(line.id).after(lineOut);
    else if (lineOut.previousElementSibling !== lineList) lineList.after(lineOut);
    return row;
  }
  const svg = s("svg", { viewBox: `0 0 ${WIDTH} 340`, preserveAspectRatio: "none", class: "cp-arcs", role: "img",
    "aria-label": `The whole Bible as one line, Genesis at the left and Revelation at the right, with ${lines.length} arcs from the five covenants to later verses. The list below holds every arc.` });
  axis.forEach((section, index) => {
    const x1 = section.a * WIDTH, x2 = section.b * WIDTH;
    svg.append(s("line", { x1: x1 + 1, x2: x2 - 1, y1: AXIS_Y, y2: AXIS_Y, class: `cp-axis cp-sec-${section.slug}`, "vector-effect": "non-scaling-stroke" }));
    const last = index === axis.length - 1;
    const label = s("text", { x: last ? WIDTH : x1 + 2, y: last ? AXIS_Y + 36 : AXIS_Y + 20, "text-anchor": last ? "end" : "start", class: `cp-axis-name cp-sec-${section.slug}` });
    label.textContent = section.name;
    svg.append(label);
  });
  lines.forEach((line) => {
    const x1 = line.a * WIDTH, x2 = line.b * WIDTH;
    const rx = (x2 - x1) / 2, ry = 18 + 250 * Math.sqrt(line.b - line.a);
    const d = `M${x1.toFixed(1)} ${AXIS_Y}A${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${AXIS_Y}`;
    const arc = s("path", { d, class: `cp-arc cp-kind-${line.kind} cp-sec-${line.section}`, "vector-effect": "non-scaling-stroke" });
    const hit = s("path", { d, class: "cp-arc-hit", "vector-effect": "non-scaling-stroke" });
    hit.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") { showLine(line, false); markLine(line); } });
    hit.addEventListener("click", (event) => { event.stopPropagation(); openSheet(line.id, rowFor.get(line.id)); });
    arcFor.set(line.id, arc);
    svg.append(arc, hit);
  });
  [...covenantKeys.keys()].forEach((key) => {
    const first = lines.find((l) => l.covenant === key);
    svg.append(s("line", { x1: first.a * WIDTH, x2: first.a * WIDTH, y1: AXIS_Y - 7, y2: AXIS_Y + 7, class: "cp-origin", "vector-effect": "non-scaling-stroke" }));
  });

  const lineButtons = new Map();
  const chooser = h("div", { class: "cp-chooser", role: "group", "aria-label": "Show one covenant's lines" },
    [...covenantKeys].map(([key, name]) => {
      const button = h("button", { type: "button", class: "cp-choose", "aria-pressed": "false", onclick: () => setLine(state.line === key ? null : key) }, name, " ", h("small", {}, String(numbers.perCovenant[key])));
      lineButtons.set(key, button);
      return button;
    }));
  const lineRow = (line) => {
    const row = h("button", { type: "button", class: `cp-line cp-sec-${line.section}`, tabindex: "-1", "aria-label": `${line.originLabel} to ${line.laterLabel}, ${KIND[line.kind]}, in ${line.sectionName}. Open both.` },
      h("i", { class: `cp-dash cp-dash-${line.kind}`, "aria-hidden": "true" }),
      h("span", { class: "cp-line-refs" }, h("b", {}, line.laterLabel), h("small", {}, `from ${line.originLabel}`)),
      h("span", { class: "cp-line-kind" }, `${KIND[line.kind]}${line.loose ? ", loosely" : ""} · ${line.sectionName}`));
    row.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") { showLine(line, false); markLine(line); } });
    row.addEventListener("focus", () => { showLine(line, true); markLine(line); });
    row.addEventListener("click", (event) => {
      event.stopPropagation(); // the page's click-outside rule must not close the sheet this opens
      showLine(line, true); markLine(line);
      if (event.detail > 0 && lastPointer === "touch") return; // on touch, a tap shows both verses, with a link to open them
      openSheet(line.id, row);
    });
    rowFor.set(line.id, row);
    return row;
  };
  const groups = new Map();
  const lineList = h("div", {
    class: "cp-line-list", role: "group", "aria-label": "Every line. Arrow keys move, Home and End jump, Enter opens both passages.",
    onkeydown: (event) => {
      const visible = [...rowFor.values()].filter((row) => row.offsetParent !== null);
      const at = visible.indexOf(document.activeElement);
      if (at < 0) return;
      const target = { ArrowRight: at + 1, ArrowDown: at + 1, ArrowLeft: at - 1, ArrowUp: at - 1, Home: 0, End: visible.length - 1 }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      visible[(target + visible.length) % visible.length].focus();
    },
  }, [...covenantKeys].map(([key, name]) => {
    const group = h("div", { class: "cp-group" },
      h("h3", { class: "cp-pairs-title" }, `${name} · ${numbers.perCovenant[key]} lines`),
      h("div", { class: "cp-lines" }, lines.filter((l) => l.covenant === key).map(lineRow)));
    groups.set(key, group);
    return group;
  }));
  function syncLine() {
    const shown = state.line ?? [...covenantKeys.keys()][0]; // a phone shows one covenant's list at a time
    for (const [key, button] of lineButtons) { button.setAttribute("aria-pressed", String(key === state.line)); }
    for (const [key, group] of groups) group.classList.toggle("is-chosen", key === shown);
    for (const line of lines) arcFor.get(line.id).classList.toggle("is-dim", Boolean(state.line) && line.covenant !== state.line);
    if (narrow.matches) {
      const first = lines.find((l) => l.covenant === shown);
      if (lineOut.isConnected && !groups.get(shown).contains(lineOut)) { showLine(first, false); markLine(first); }
    } else if (lineOut.isConnected && lineOut.previousElementSibling !== lineList) lineList.after(lineOut);
  }
  function setLine(key) {
    state = { ...state, line: key };
    history.replaceState(null, "", addressFor(state));
    syncLine();
  }
  narrow.addEventListener("change", syncLine);
  const dashLegend = Object.entries({ quoted: "solid: quotes it, with quotation marks in the Berean", names: "dashed: names it, with the word covenant, promise or oath", recalls: "dotted: remembers the person or the words" })
    .map(([kind, text]) => h("span", {}, h("i", { class: `cp-dash cp-dash-${kind}`, "aria-hidden": "true" }), text));
  const noahLine = lines.find((l) => l.covenant === "noah" && l.kind === "names");
  page.append(h("section", { class: "t-sec", id: "later" },
    sectionHead("03", "Spoken in its day.", "Still being quoted.", "Is a promise over once it has been spoken? Here is the whole Bible as one line, each verse in its place by count, with an arc from each covenant to verses that come back to it. Point at an arc or a row of the list to read both verses; choose it to open them."),
    h("p", { class: "cp-reads" }, `${numbers.reachNT} of these ${numbers.lines} lines end in the New Testament. Noah's is the quiet one: among these lines only `, refLink(noahLine.later, noahLine.laterLabel), " takes up his oath. The New Testament remembers Noah himself, and no verse after Genesis 9 sets his name beside the word covenant."),
    chooser,
    h("figure", { class: "cp-chart" },
      svg,
      h("figcaption", { class: "cp-legend" }, axis.map((section) => h("span", { class: `cp-sec-${section.slug}` }, h("i", { class: "cp-swatch", "aria-hidden": "true" }), section.name)), h("br"), dashLegend)),
    lineList, lineOut,
    h("p", { class: "cp-note" }, `This is a selection, not a census: the word covenant alone comes in ${numbers.wordVerses} verses, in ${numbers.wordBooks} of the ${numbers.totalBooks} books. A line's colour is where the later verse sits, and its dash is how it comes back. Which promise a later verse goes back to is this study's matching, and some verses could join more than one. A script tests each line: the later verse follows its origin, and a quotation has quotation marks and shares three words with it. `, h("span", {}, "Hebrews 10:17 is the one loose exception: it quotes Jeremiah in different order. The letters often follow a Greek translation, so wording can differ.")),
    h("p", { class: "cp-note" }, "Other quotations in the walked letters are not drawn, because they do not start from these five passages: ",
      notDrawn.flatMap((item, i) => [i ? "; " : null, refLink(item.r, item.label), ` ${item.why}`]), ".")));

  // ── 04 Several maps ──
  const [mapsFirst, mapsTurn] = study.mapsTitle.split(". ");
  page.append(h("section", { class: "t-sec", id: "maps" },
    sectionHead("04", `${mapsFirst}.`, mapsTurn, runs(study.mapsLead)),
    h("div", { class: "cp-parts cp-maps" }, study.maps.map((part) => h("div", { class: "cp-part" }, h("h3", { class: "cp-map-title" }, part.title), part.blocks.map((block) => blockView[block.k](block)))))));

  // ── Close ──
  page.append(h("section", { class: "t-sec cp-closing", id: "close" },
    h("div", { class: "cp-close-text" },
      h("p", { class: "cp-concepts" }, study.closing),
      h("p", {}, runs(study.close)),
      h("p", { class: "cp-way-line" }, runs(study.way)),
      h("p", { class: "cp-question" }, runs(study.question)),
      h("p", { class: "cp-again" }, runs(study.again), " ", refLink(study.passage, passages[study.passage].label)),
      h("nav", { class: "cp-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=doctrine" }, "← Back to God & Christian Faith"),
        h("a", { href: "/study/creeds/1689-london-baptist-confession-1677" }, "Read the Second London Confession →"),
        h("a", { href: "/mockups/faith-under-pressure-directions/" }, "Faith under pressure, its mock-up →"))),
    art(CPArt.land, "cp-land"),
    h("details", { class: "cp-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("ul", {}, sources.map((source) => h("li", {}, h("a", { href: source.href, rel: "noopener noreferrer", target: "_blank" }, source.name), h("span", {}, source.note)))),
      h("p", { class: "cp-note" }, "Not read for this page, so not shown: other Baptist accounts of the covenants, such as New Covenant Theology. Scripture references and the Calvin, Maclaren and confession quotations were checked by script: that proves the words are there, not that the reading is right.")),
  ));

  // ── The record sheet: one, from the right, for every passage ──
  const sheetBody = h("div", { class: "ms-sheet-body cp-sheet-body" });
  const sheetClose = h("button", { type: "button", class: "ms-sheet-close", "aria-label": "Close the passage", onclick: () => closeSheet() });
  sheetClose.append(art(icon("x", 18)));
  const sheetEl = h("aside", { class: "ms-sheet cp-sheet", role: "dialog", "aria-modal": "true", "aria-label": "Passage in the Berean Standard Bible", tabindex: "-1" }, sheetClose, sheetBody);
  document.body.append(sheetEl);
  const backgroundParts = () => [document.querySelector(".site-header"), document.getElementById("main"), document.querySelector(".site-footer")].filter(Boolean);
  let sheetOpener = null;

  const verseBlock = (id) => {
    const p = passages[id];
    let chapter = null;
    const paragraph = h("p", { class: "cp-sheet-text" });
    p.verses.forEach((v) => {
      if (v.c !== chapter) { chapter = v.c; if (p.chapters.length > 1) paragraph.append(h("span", { class: "cp-sheet-ch" }, `Chapter ${v.c}`)); }
      paragraph.append(h("sup", {}, String(v.v)), `${v.t} `);
    });
    return [h("h3", {}, p.label), paragraph, h("p", { class: "cp-sheet-links" }, p.chapters.map((c) => h("a", { href: `/read/bsb/${p.code}/${c}` }, `Open ${p.label.replace(/ \d+:.*/, "")} ${c} in the reader →`)))];
  };
  function drawSheet(id) {
    const line = lineIds.get(id);
    sheetBody.replaceChildren(
      h("p", { class: "cp-kind" }, line ? `Scripture · ${covenants[line.covenant]} · ${KIND[line.kind]} · ${line.sectionName}` : "Scripture · Berean Standard Bible"),
      ...(line ? [...verseBlock(line.origin), ...verseBlock(line.later)] : verseBlock(id)),
      h("p", { class: "cp-note" }, "Berean Standard Bible, public domain. Courtesy credit: berean.bible."),
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
    if (!passageIds.has(id) && !lineIds.has(id)) { console.error(`Covenants and promises: unknown passage ${id}`); return; }
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
    syncLine();
    if (state.sheet) showSheet(state.sheet);
    else if (hadSheet) hideSheet();
  });

  // Cold load from a shared address.
  const firstShown = lines.find((l) => l.covenant === (state.line ?? [...covenantKeys.keys()][0]));
  showLine(firstShown, false);
  markLine(firstShown);
  syncReading();
  syncLine();
  if (state.sheet) showSheet(state.sheet);
  window.CP_READY = true;
})();
