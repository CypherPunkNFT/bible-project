// Humanity, sin and renewal: shared pieces. All text goes in as text nodes; the only markup strings are the fixed drawings in
// art.js and the site's icons. Values read from the address are looked up in Maps built from data.js, so an unknown value is ignored.
window.HSK = (() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.style.cssText = "padding:2rem;font:1rem Georgia,serif";
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`Humanity, sin and renewal: ${detail}`);
  }
  if (!window.HS) {
    stop("This mock-up has no study data: data.js did not load. Run build-data.py in this folder, then reload.", "window.HS is missing");
    return null;
  }
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.HSArt) {
    stop("This mock-up could not load its shared frame or drawings. Check that the preview is serving the whole design folder, then reload.", "Frame, icon or HSArt is missing");
    return null;
  }
  const { study, passages, image, sources } = window.HS;
  const readings = new Map(study.readings.map((r) => [r.slug, r]));
  const passageIds = new Map(Object.entries(passages));
  const imageStates = new Map(image.map((s) => [s.id, s]));
  const sourceIds = new Map(sources.map((s) => [s.id, s]));
  const bodyViews = new Map([["sin", true], ["renewed", true]]);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const DEFAULTS = { reading: study.readings[0].slug, body: "sin", state: image[0].id };

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
  const SVG_NS = "http://www.w3.org/2000/svg";
  function svg(tag, props = {}, ...children) {
    const element = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(props)) if (value !== undefined && value !== null) element.setAttribute(key, value);
    element.append(...children.flat());
    return element;
  }
  function art(markup, className) {
    const holder = document.createElement("span");
    if (className) holder.className = className;
    holder.innerHTML = markup; // fixed drawings from art.js and the frame's icons only
    return holder;
  }
  const refLink = (id, text, extra = "") => h("a", { class: `hs-ref ${extra}`.trim(), href: `?sheet=${id}`, "data-sheet": id }, text);
  const runs = (list) => list.map((run) => (typeof run === "string" ? run : refLink(run.r, run.t)));
  const plain = (list) => list.map((run) => (typeof run === "string" ? run : run.t)).join("");

  function readAddress() {
    const params = new URLSearchParams(location.search);
    const pick = (name, map) => (map.has(params.get(name)) ? params.get(name) : DEFAULTS[name]);
    const sheet = (params.get("sheet") ?? "").replaceAll("–", "-");
    return { reading: pick("reading", readings), body: pick("body", bodyViews), state: pick("state", imageStates), sheet: passageIds.has(sheet) ? sheet : null };
  }
  function addressFor(view) {
    const params = new URLSearchParams();
    for (const name of ["reading", "body", "state"]) if (view[name] !== DEFAULTS[name]) params.set(name, view[name]);
    if (view.sheet) params.set("sheet", view.sheet);
    const query = params.toString();
    return `${location.pathname}${query ? `?${query}` : ""}`;
  }

  // The shared frame, with the site name and menu this site now uses.
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => {
    const original = header();
    if (!original.includes("Bible Project")) console.error("Humanity, sin and renewal: the site name was not found in the shared header");
    return original
      .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}<span class="sep"`)
      .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  };
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page hs-page" });
  main.append(page);

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));

  const FLAG_LABELS = { care: "Care", open: "Left open", read: "This study reads" };
  function flagLabel(block) {
    if (FLAG_LABELS[block.k]) return FLAG_LABELS[block.k];
    const name = sourceIds.get(block.src)?.short ?? block.src;
    if (block.k === "other") return `${name} · another tradition, not this site's`;
    if (block.k === "own") return `${name} · told in this site's words`;
    return name;
  }
  const blockView = (block) => {
    if (block.k === "p") return h("p", {}, runs(block.runs));
    if (block.k === "quote") return h("figure", { class: "hs-quote" }, h("blockquote", {}, block.t), h("figcaption", {}, refLink(block.r, block.label), " · Berean Standard Bible"));
    return h("div", { class: `hs-flag hs-flag-${block.k}` }, h("p", { class: "hs-flag-label" }, flagLabel(block)), h("p", {}, runs(block.runs)));
  };
  const partView = (part) => h("section", { class: "hs-part" }, h("h4", {}, part.title), part.blocks.map(blockView));

  const kit = { h, svg, art, refLink, runs, plain, page, sectionHead, blockView, partView, readings, imageStates, reducedMotion, addressFor, state: readAddress(), syncers: [] };
  kit.setView = (changes) => {
    kit.state = { ...kit.state, ...changes };
    history.replaceState(history.state, "", addressFor(kit.state)); // a change of view is not a Back-button step; only the sheet is
  };

  // The record sheet: one, from the right, for every passage.
  const sheetBody = h("div", { class: "ms-sheet-body hs-sheet-body" });
  const sheetClose = h("button", { type: "button", class: "ms-sheet-close", "aria-label": "Close the passage", onclick: () => closeSheet() });
  sheetClose.append(art(icon("x", 18)));
  const sheetEl = h("aside", { class: "ms-sheet hs-sheet", role: "dialog", "aria-modal": "true", "aria-label": "Passage in the Berean Standard Bible", tabindex: "-1" }, sheetClose, sheetBody);
  document.body.append(sheetEl);
  const backgroundParts = () => [document.querySelector(".site-header"), document.getElementById("main"), document.querySelector(".site-footer")].filter(Boolean);
  let sheetOpener = null;
  function drawSheet(id) {
    const p = passages[id];
    let chapter = null;
    const paragraph = h("p", { class: "hs-sheet-text" });
    p.verses.forEach((v) => {
      if (v.c !== chapter) { chapter = v.c; if (p.chapters.length > 1) paragraph.append(h("span", { class: "hs-sheet-ch" }, `Chapter ${v.c}`)); }
      paragraph.append(h("sup", {}, String(v.v)), `${v.t} `);
    });
    sheetBody.replaceChildren(
      h("p", { class: "hs-small" }, "Scripture · Berean Standard Bible"),
      h("h3", { tabindex: "-1" }, p.label), paragraph,
      h("p", { class: "hs-sheet-links" }, p.chapters.map((c) => h("a", { href: `/read/bsb/${p.code}/${c}` }, `Open ${p.label.replace(/ \d+:.*/, "")} ${c} in the reader →`))),
      h("p", { class: "hs-note" }, "Berean Standard Bible, public domain. Courtesy credit: berean.bible."));
    sheetBody.scrollTop = 0;
  }
  function showSheet(id, coldLoad = false) {
    drawSheet(id);
    sheetEl.classList.add("open");
    for (const part of backgroundParts()) part.inert = true;
    (coldLoad ? sheetBody.querySelector("h3") : sheetClose).focus({ preventScroll: true });
  }
  function hideSheet() {
    sheetEl.classList.remove("open");
    for (const part of backgroundParts()) part.inert = false;
    const target = sheetOpener?.isConnected ? sheetOpener : document.querySelector("h1");
    if (target === document.querySelector("h1")) target.tabIndex = -1;
    target?.focus({ preventScroll: true });
    sheetOpener = null;
  }
  function openSheet(id, opener) {
    if (!passageIds.has(id)) { console.error(`Humanity, sin and renewal: unknown passage ${id}`); return; }
    sheetOpener = opener ?? document.activeElement;
    kit.state = { ...kit.state, sheet: id };
    history.pushState({ hsSheet: true }, "", addressFor(kit.state));
    showSheet(id);
  }
  function closeSheet() {
    if (!kit.state.sheet) return;
    if (history.state?.hsSheet) { history.back(); return; } // popstate hides it, so Back and close are one path
    kit.state = { ...kit.state, sheet: null };
    history.replaceState(null, "", addressFor(kit.state));
    hideSheet();
  }
  kit.startSheet = () => {
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-sheet]");
      if (trigger) { event.preventDefault(); if (!kit.state.sheet) openSheet(trigger.dataset.sheet, trigger); return; }
      if (kit.state.sheet && !sheetEl.contains(event.target)) closeSheet();
    });
    addEventListener("keydown", (event) => {
      if (event.key === "Escape" && kit.state.sheet) { event.preventDefault(); closeSheet(); }
    });
    addEventListener("popstate", () => {
      const hadSheet = kit.state.sheet;
      kit.state = readAddress();
      kit.syncers.forEach((sync) => sync());
      if (kit.state.sheet) showSheet(kit.state.sheet);
      else if (hadSheet) hideSheet();
    });
    if (kit.state.sheet) showSheet(kit.state.sheet, true);
  };
  return kit;
})();
