// Encounters with Jesus: shared pieces. All text goes in as text nodes; the only markup strings are the fixed drawings in art.js
// and the site's icons. Values read from the address are looked up in Maps built from data.js, so an unknown value is ignored.
window.ENK = (() => {
  const EXPECTED_SCHEMA = 1;
  let warned = false;
  function stop(message, detail) {
    console.error(`Encounters with Jesus: ${detail}`);
    if (warned) return; // one notice, however many parts fail
    warned = true;
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.style.cssText = "padding:2rem;font:1rem Georgia,serif";
    notice.textContent = message;
    document.body.prepend(notice);
  }
  if (!window.EN || window.EN.schema !== EXPECTED_SCHEMA) {
    stop("This mock-up has no usable study data. Run build-data.py in this folder, then reload.", `window.EN is missing or has schema ${window.EN?.schema}, expected ${EXPECTED_SCHEMA}`);
    return null;
  }
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.ENArt) {
    stop("This mock-up could not load its shared frame or drawings. Check that the preview is serving the whole design folder, then reload.", "Frame, icon or ENArt is missing");
    return null;
  }
  addEventListener("error", (event) => stop("Part of this page failed to draw. Reload it; if this stays, the rest of the page may be incomplete.", event.message));
  const { study, passages, sources, meetings, carry } = window.EN;
  const readings = new Map(study.readings.map((r) => [r.slug, r]));
  const questions = new Map(study.questions.map((q) => [q.id, q]));
  const passageIds = new Map(Object.entries(passages));
  const sourceIds = new Map(sources.map((s) => [s.id, s]));
  const meetingIds = new Map(meetings.map((m) => [m.id, m]));
  const carryIds = new Map(carry.map((c) => [c.id, c]));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const DEFAULTS = { reading: study.readings[0].slug, carry: "" };
  const SHEET_KEYS = ["question", "meeting", "sheet"]; // the one list of what the sheet can hold

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
  function art(markup, className) {
    const holder = document.createElement("span");
    if (className) holder.className = className;
    holder.innerHTML = markup; // fixed drawings from art.js and the frame's icons only
    return holder;
  }
  const drawing = (key, className) => {
    if (!Object.hasOwn(ENArt, key)) { console.error(`Encounters with Jesus: no drawing named ${key}`); return null; }
    return art(ENArt[key], className);
  };
  const refLink = (id, text) => h("a", { class: "en-ref", href: `?sheet=${id}`, "data-sheet": id }, text);
  const runs = (list) => list.map((run) => (typeof run === "string" ? run : refLink(run.r, run.t)));
  const plain = (list) => list.map((run) => (typeof run === "string" ? run : run.t)).join("");
  const phrase = (item) => [h("span", { class: "en-words" }, `“${item.t}”`), " ", h("span", { class: "en-at" }, refLink(item.r, item.label))];

  function readAddress() {
    const params = new URLSearchParams(location.search);
    const sheet = (params.get("sheet") ?? "").replaceAll("–", "-");
    const question = params.get("question"), reading = params.get("reading"), chosen = params.get("carry"), meeting = params.get("meeting");
    const holder = questions.has(question) ? { question, meeting: null } : { question: null, meeting: meetingIds.has(meeting) ? meeting : null };
    return { reading: readings.has(reading) ? reading : DEFAULTS.reading, carry: carryIds.has(chosen) ? chosen : DEFAULTS.carry, ...holder, sheet: passageIds.has(sheet) ? sheet : null };
  }
  function addressFor(view) {
    const params = new URLSearchParams();
    for (const key of Object.keys(DEFAULTS)) if (view[key] !== DEFAULTS[key]) params.set(key, view[key]);
    for (const name of SHEET_KEYS) if (view[name]) params.set(name, view[name]);
    const query = params.toString();
    return `${location.pathname}${query ? `?${query}` : ""}${location.hash}`;
  }

  // The shared frame, with the site name and menu this site now uses.
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => {
    const original = header();
    if (!original.includes("Bible Project")) console.error("Encounters with Jesus: the site name was not found in the shared header");
    return original
      .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}<span class="sep"`)
      .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  };
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page en-page" });
  main.append(page);

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));

  const FLAG_LABELS = { care: "Care", read: "This study reads" };
  const flagLabel = (block) => FLAG_LABELS[block.k] ?? sourceIds.get(block.src)?.short ?? block.src;
  const blockView = (block) => {
    if (block.k === "p") return h("p", {}, runs(block.runs));
    if (block.k === "quote") return h("figure", { class: "en-quote" }, h("blockquote", {}, block.t), h("figcaption", {}, refLink(block.r, block.label), " · Berean Standard Bible"));
    return h("div", { class: `en-flag en-flag-${block.k}` }, h("p", { class: "en-flag-label" }, flagLabel(block)), h("p", {}, runs(block.runs)));
  };
  const partView = (part) => h("section", { class: "en-part" }, h("h4", {}, part.title), part.blocks.map(blockView));
  const passageText = (id) => {
    const p = passages[id];
    let chapter = null;
    const paragraph = h("p", { class: "en-passage-text" });
    p.verses.forEach((v) => {
      if (v.c !== chapter) { chapter = v.c; if (p.chapters.length > 1) paragraph.append(h("span", { class: "en-chapter" }, `Chapter ${v.c}`)); }
      paragraph.append(h("sup", {}, String(v.v)), `${v.t} `);
    });
    return paragraph;
  };

  // Moving through a set of buttons with the arrow keys, with one tab stop for the set. Enter or Space chooses.
  function roving(buttons, current) {
    const mark = (button) => buttons.forEach((b) => { b.tabIndex = b === button ? 0 : -1; });
    mark(current?.() ?? buttons[0]);
    for (const button of buttons) {
      button.addEventListener("focus", () => mark(button));
      button.addEventListener("keydown", (event) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        const index = buttons.indexOf(button);
        let target = null;
        if (step) target = buttons[(index + step + buttons.length) % buttons.length];
        if (event.key === "Home") target = buttons[0];
        if (event.key === "End") target = buttons[buttons.length - 1];
        if (target) { event.preventDefault(); target.focus(); }
      });
    }
    return mark;
  }

  const kit = { h, art, drawing, refLink, runs, plain, phrase, page, sectionHead, blockView, partView, passageText, roving, readings, questions, meetingIds, carryIds, reducedMotion, state: readAddress(), syncers: [] };
  kit.setView = (changes) => {
    kit.state = { ...kit.state, ...changes };
    history.replaceState(history.state, "", addressFor(kit.state)); // a change of view is not a Back-button step; only the sheet is
  };

  // The one sheet, from the right. It holds a hard question, a meeting's record or a passage. A passage opened from either of the others has a way back to it.
  const sheetBody = h("div", { class: "ms-sheet-body en-sheet-body" });
  const sheetClose = h("button", { type: "button", class: "ms-sheet-close", "aria-label": "Close this sheet", onclick: () => closeSheet() });
  sheetClose.append(art(icon("x", 18)));
  const sheetEl = h("aside", { class: "ms-sheet en-sheet", role: "dialog", "aria-modal": "true", "aria-label": "Passage, meeting or question", tabindex: "-1" }, sheetClose, sheetBody);
  document.body.append(sheetEl);
  const backgroundParts = () => [document.querySelector(".site-header"), document.getElementById("main"), document.querySelector(".site-footer")].filter(Boolean);
  const emptySheet = Object.fromEntries(SHEET_KEYS.map((key) => [key, null]));
  let sheetOpener = null, closing = false;
  const isOpen = (view) => SHEET_KEYS.some((key) => Boolean(view[key]));
  const holderName = (view) => (view.question ? questions.get(view.question).title : view.meeting ? meetingIds.get(view.meeting).name : null);

  function drawPassage(id, from) {
    const p = passages[id];
    sheetBody.replaceChildren(...[
      from ? h("button", { type: "button", class: "en-back", onclick: () => backToHolder() }, `← ${from}`) : null,
      h("p", { class: "en-small" }, "Scripture · Berean Standard Bible"),
      h("h3", { tabindex: "-1" }, p.label), passageText(id),
      h("p", { class: "en-sheet-links" }, p.chapters.map((c) => h("a", { href: `/read/bsb/${p.code}/${c}` }, `Open ${p.label.replace(/ \d+:.*/, "")} ${c} in the reader →`))),
      h("p", { class: "en-note" }, "Berean Standard Bible, public domain. Courtesy credit: berean.bible."),
    ].filter(Boolean));
  }
  function drawSheet(view) {
    if (view.sheet) drawPassage(view.sheet, holderName(view));
    else if (view.meeting) kit.drawMeeting(sheetBody, meetingIds.get(view.meeting));
    else if (view.question) kit.drawQuestion(sheetBody, questions.get(view.question));
    sheetBody.scrollTop = 0;
  }
  function showSheet(view, focusHeading = false) {
    drawSheet(view);
    sheetEl.classList.add("open");
    for (const part of backgroundParts()) part.inert = true;
    (focusHeading ? sheetBody.querySelector("h3") : sheetClose).focus({ preventScroll: true });
  }
  function hideSheet() {
    sheetEl.classList.remove("open");
    for (const part of backgroundParts()) part.inert = false;
    const target = sheetOpener?.isConnected && sheetOpener.offsetParent !== null ? sheetOpener : document.querySelector("h1");
    if (target === document.querySelector("h1")) target.tabIndex = -1;
    target?.focus({ preventScroll: true });
    sheetOpener = null;
  }
  function openInSheet(changes, opener) {
    const wasOpen = isOpen(kit.state);
    if (!wasOpen) sheetOpener = opener ?? document.activeElement;
    kit.state = { ...kit.state, ...changes };
    history.pushState({ enDepth: (history.state?.enDepth ?? 0) + 1 }, "", addressFor(kit.state));
    showSheet(kit.state, wasOpen);
  }
  function closeSheet() {
    if (closing || !isOpen(kit.state)) return; // a second click while Back is on its way must not go back twice
    const depth = history.state?.enDepth ?? 0;
    if (depth > 0) { closing = true; setTimeout(() => { closing = false; }, 1500); history.go(-depth); return; } // popstate hides it, so Back and close are one path
    kit.state = { ...kit.state, ...emptySheet };
    history.replaceState(null, "", addressFor(kit.state));
    hideSheet();
  }
  function backToHolder() {
    if ((history.state?.enDepth ?? 0) > 0) { history.back(); return; }
    kit.state = { ...kit.state, sheet: null }; // arrived straight at the passage from a link, so there is no earlier step to go back to
    history.replaceState(null, "", addressFor(kit.state));
    showSheet(kit.state, true);
  }
  kit.openQuestion = (id, opener) => {
    if (questions.has(id)) openInSheet({ question: id, meeting: null, sheet: null }, opener);
    else console.error(`Encounters with Jesus: unknown question ${id}`);
  };
  kit.openMeeting = (id, opener) => {
    if (meetingIds.has(id)) openInSheet({ meeting: id, question: null, sheet: null }, opener);
    else console.error(`Encounters with Jesus: unknown meeting ${id}`);
  };
  kit.startSheet = () => {
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-sheet]");
      if (trigger) {
        event.preventDefault();
        if (passageIds.has(trigger.dataset.sheet)) openInSheet({ sheet: trigger.dataset.sheet }, trigger);
        else console.error(`Encounters with Jesus: unknown passage ${trigger.dataset.sheet}`);
        return;
      }
      // composedPath: the back button is gone from the sheet by now, and must still count as a click inside it
      if (isOpen(kit.state) && !event.composedPath().includes(sheetEl) && !event.target.closest("[data-question], [data-meeting]")) closeSheet();
    });
    addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen(kit.state)) { event.preventDefault(); closeSheet(); }
    });
    addEventListener("popstate", () => {
      const hadSheet = isOpen(kit.state);
      kit.state = readAddress();
      if (closing && isOpen(kit.state)) { // the page was opened straight on a sheet: closing leaves the same address without it
        kit.state = { ...kit.state, ...emptySheet };
        history.replaceState(null, "", addressFor(kit.state));
      }
      closing = false;
      kit.syncers.forEach((sync) => sync());
      if (isOpen(kit.state)) showSheet(kit.state, true);
      else if (hadSheet) hideSheet();
    });
    if (isOpen(kit.state)) showSheet(kit.state, true);
  };
  return kit;
})();
