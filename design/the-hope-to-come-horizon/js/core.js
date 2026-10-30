// The hope to come, drawn as one horizon. Everything the study says comes from the first mock-up's data.js, read and never
// edited. All text goes in as text nodes; the only markup strings are fixed drawings written in these files.
// Address values are looked up in maps built from data.js, so an unknown value is simply ignored.
window.HZ = (() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`The hope to come: ${detail}`);
    return null;
  }
  if (!window.HP) return stop("This page has no study data: the first mock-up's data.js did not load. Check that the preview is serving the whole design folder, then reload.", "window.HP is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined") return stop("This page could not load its shared frame. Check that the preview is serving the whole design folder, then reload.", "Frame or icon is missing");

  const { study, passages, sources } = window.HP;
  const readingSlugs = new Set(study.readings.map((r) => r.slug));
  const sourceIds = new Map(sources.map((s) => [s.id, s]));
  const LOOKS = new Set(["up", "out", "down"]);

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
    holder.innerHTML = markup; // fixed drawings only
    return holder;
  }
  const refLink = (id, text, extra = "") => h("a", { class: `hz-ref ${extra}`.trim(), href: `?sheet=${id}`, "data-sheet": id }, text);
  const runs = (list) => list.map((run) => (typeof run === "string" ? run : refLink(run.r, run.t)));
  const plain = (list) => list.map((run) => (typeof run === "string" ? run : run.t)).join("");

  // ── Address: every view on the page can be shared ──
  function readAddress() {
    const params = new URLSearchParams(location.search);
    const look = params.get("look"), reading = params.get("reading");
    const sheet = (params.get("sheet") ?? "").replaceAll("–", "-");
    return {
      look: LOOKS.has(look) ? look : null,
      reading: readingSlugs.has(reading) ? reading : null,
      sheet: Object.hasOwn(passages, sheet) ? sheet : null,
      therefore: params.get("weigh") === "therefore",
      shares: params.get("weigh-ends") === "shares",
    };
  }
  function addressFor(view) {
    const params = new URLSearchParams();
    if (view.look) params.set("look", view.look);
    if (view.reading) params.set("reading", view.reading);
    if (view.therefore) params.set("weigh", "therefore");
    if (view.shares) params.set("weigh-ends", "shares");
    if (view.sheet) params.set("sheet", view.sheet);
    const query = params.toString();
    return `${location.pathname}${query ? `?${query}` : ""}${location.hash}`;
  }
  const state = readAddress();
  const listeners = [];
  // Change one part of the view, write it to the address and redraw whatever listens.
  function setView(change, { push = false } = {}) {
    Object.assign(state, change);
    history[push ? "pushState" : "replaceState"](null, "", addressFor(state));
    listeners.forEach((listen) => listen(state));
  }
  addEventListener("popstate", () => {
    Object.assign(state, readAddress());
    listeners.forEach((listen) => listen(state));
  });

  // ── Frame: the same site header and footer as the study's first mock-up ──
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  const header = Frame.header, footer = Frame.footer;
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "hz-page" });
  main.append(page);

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "hz-head" },
    h("span", { class: "hz-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));

  // ── Study text blocks: asides leave the reading line and stand in the margin ──
  const sourceNote = (id) => {
    const source = sourceIds.get(id);
    if (!id || !source) return null;
    return h("small", {}, h("a", { href: source.href, rel: "noopener noreferrer", target: "_blank" }, source.name), ". ", source.note);
  };
  const aside = (kind, label, block) => h("aside", { class: `hz-aside hz-aside-${kind}` }, h("span", { class: "hz-aside-label" }, label), h("p", {}, runs(block.runs)), sourceNote(block.src));
  // The words of a quotation the study itself turns on. Gold only; the wording is untouched.
  const TURNS = {
    "1TH.4.17": "we will always be with the Lord", "1CO.15.20": "the firstfruits", "1CO.15.58": "your labor in the Lord is not in vain",
    "REV.20.12": "great and small", "REV.21.4": "no more death or mourning or crying or pain", "2PE.3.9": "patient with you", "REV.22.17": "Come!",
  };
  function quoteWords(block) {
    const turn = TURNS[block.r];
    if (!turn) return [block.t];
    if (!block.t.includes(turn)) console.error(`The hope to come: "${turn}" is not in ${block.r}`);
    return block.t.split(turn).flatMap((piece, index) => (index ? [h("em", {}, turn), piece] : [piece]));
  }
  const blockView = {
    quote: (b) => h("figure", { class: "hz-quote" }, h("blockquote", {}, quoteWords(b)), h("figcaption", {}, refLink(b.r, b.label), " · BSB")),
    p: (b) => h("p", { class: "hz-p" }, runs(b.runs)),
    care: (b) => aside("care", "A detail to handle carefully", b),
    other: (b) => aside("other", "Another tradition, labelled as theirs", b),
    open: (b) => aside("open", "Open question · this study does not choose", b),
    source: (b) => aside("source", "Named source", b),
    own: (b) => aside("source", "Named source · told in this site's words", b),
  };

  return { h, art, refLink, runs, plain, state, setView, onView: (listen) => listeners.push(listen), page, sectionHead, blockView, reducedMotion: matchMedia("(prefers-reduced-motion: reduce)") };
})();
