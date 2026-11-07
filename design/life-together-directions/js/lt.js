// Life together, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js and the frame's icons.
// The address carries ?part= (one of the six part numbers) and ?ref= (a reference held in data.js); any other value is
// ignored, and look-ups use Object.hasOwn so a name such as "__proto__" finds nothing.
(() => {
  const fallback = document.getElementById("lt-fallback");
  function stop(message, detail) {
    if (fallback) fallback.textContent = message;
    console.error(`Life together: ${detail}`);
  }
  if (!window.LT || window.LT.schema !== 1) return stop("This mock-up has no study data: data.js did not load or is from another build. Run build-data.py, then reload.", "window.LT is missing or has the wrong schema");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.LTArt) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon or LTArt is missing");
  fallback?.remove();

  const { study, passages, roots, depths, steps, numbers, sources } = window.LT;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const has = (object, key) => typeof key === "string" && Object.hasOwn(object, key);
  const SIDE = { open: "Left open", read: "How this site reads it", other: "Other Christians" };

  function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") element.className = value;
      else if (key.startsWith("on")) element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value === true ? "" : value);
    }
    element.append(...children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== ""));
    return element;
  }
  function art(markup, className) {
    const holder = h("span", { class: className });
    holder.innerHTML = markup; // fixed drawings from art.js and the frame's icons only
    return holder;
  }
  const refLink = (id, text) => (has(passages, id) ? h("a", { class: "lt-ref", href: `?ref=${encodeURIComponent(id)}`, "data-ref": id }, text || passages[id].label) : text);
  function runs(list) {
    return list.map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "lt-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, runs(run.b));
      if (run.i) return h("em", {}, run.i);
      if ("s" in run) return run.s ? h("a", { class: "lt-link", href: run.s, title: "Mock-up on this PC" }, h("em", {}, run.t)) : h("em", { class: "lt-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }
  const label = (text) => h("span", { class: "lt-label" }, text);
  const verseText = (id) => passages[id].verses.map((v) => v[1]).join(" ");

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page lt-page" });
  main.append(page);

  const PARTS = study.parts.map((p) => p.n);
  const params = () => new URLSearchParams(location.search);
  const askedPart = () => (PARTS.includes(params().get("part")) ? params().get("part") : PARTS[0]);
  function address(changes) {
    const next = params();
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    const query = next.toString();
    return `${location.pathname}${query ? `?${query}` : ""}${location.hash}`;
  }

  // ── Hero: the standard heading ──
  const opening = study.opening[0];
  const washing = "JHN.13.1-17";
  page.append(h("section", { class: "t-sec-landing lt-hero", id: "top" },
    h("div", { class: "hc-intro lt-intro" },
      h("div", {},
        h("nav", { class: "lt-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"),
          h("a", { href: "/study/theology?area=life" }, "Living the Christian Life"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "lt-here", "aria-current": "page" }, study.title)),
        h("p", { class: "lt-concepts" }, study.concepts.join(" · ")),
        h("h1", { tabindex: "-1" }, "Life ", h("em", {}, "together")),
        h("p", { class: "lt-subtitle" }, study.subtitle.charAt(0).toUpperCase() + study.subtitle.slice(1)),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "lt-opening" }, h("blockquote", {}, verseText(opening.r)),
          h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art lt-hero-art" }, art(LTArt.hero),
        h("figcaption", { class: "lt-motto" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1]),
          h("small", {}, "Illustrative forms: a basin, a jug and a towel (", refLink(washing, "John 13:1–17"), "). No person is drawn."))),
    ),
    h("dl", { class: "lt-figures" }, [
      ["Passages walked", numbers.walked, "each giving a paragraph to one part of shared life"],
      ["Commands with their ground", numbers.roots, `pairs the study itself names; ${numbers.unnamed} more are drawn with none`],
      ["Within two verses", `${numbers.close} of ${numbers.roots}`, `gifts stand that close to their command; ${numbers.sameVerse} in the same verse`],
      ["Printed in full", numbers.versesPrinted, "verses on this page, each word for word the Berean"],
    ].map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
  ));

  const sectionHead = (number, title, turn, lead) => h("header", { class: "t-head lt-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead ? h("p", {}, lead) : null));

  // ── 00 Look under the command: the frame, then the ground ──
  const intro = study.intro.blocks;
  const readout = h("p", { class: "lt-readout", "aria-hidden": "true" }, "Point at a command to read its ground here; choose it to open the verses.");
  page.append(h("section", { class: "t-sec lt-under", id: "habit" },
    sectionHead("00", "Look under", "the command.", "Find the gift. Then read the command."),
    h("div", { class: "lt-frame" }, intro.filter((b) => b.k === "p").map((b) => h("p", {}, runs(b.runs)))),
    ground(),
    intro.filter((b) => b.k === "selection").map((b) => h("p", { class: "lt-selection" }, label("What this study covers"), " ", runs(b.runs))),
    intro.filter((b) => b.k === "care").map((b) => h("aside", { class: "lt-care lt-care-intro" }, label("With care"), h("p", {}, runs(b.runs)),
      h("a", { class: "lt-go", href: "?part=04#help", "data-part": "04", "data-help": "" }, "Go to the help in part 04", art(icon("arrowRight", 16))))),
  ));

  function depthOf(root) { return root.gift ? root.depth : "none"; }
  function pairName(root) {
    const command = `Part ${root.part}. Command: “${root.command.phrase}”, ${root.command.label}.`;
    if (!root.gift) return `${command} The study does not name its ground here. Open the verse.`;
    return `${command} Its ground: “${root.gift.phrase}”, ${root.gift.label}, ${depths[root.depth].toLowerCase()}. Open the verses.`;
  }
  function ground() {
    const columns = roots.map((root) => {
      const show = () => {
        readout.replaceChildren(...(root.gift
          ? [h("b", {}, `“${root.command.phrase}”`), ` ${root.command.label} stands on `, h("em", {}, `“${root.gift.phrase}”`), ` ${root.gift.label}. ${depths[root.depth]}. The study: “${root.says}”`]
          : [h("b", {}, `“${root.command.phrase}”`), ` ${root.command.label}. The study does not name the ground under this command. Read the paragraph and look for it.`]));
      };
      return h("button", { type: "button", class: `lt-col lt-depth-${depthOf(root)}`, "aria-label": pairName(root), "data-ref": root.both || root.command.r, onmouseenter: show, onfocus: show },
        h("span", { class: "lt-col-part" }, root.part),
        h("span", { class: "lt-cmd" }, root.command.phrase),
        h("span", { class: "lt-root", "aria-hidden": "true" }),
        root.gift ? h("span", { class: "lt-gift" }, root.gift.phrase) : h("span", { class: "lt-gift lt-none" }, "Ground not named here"),
        root.gift ? h("small", { class: "lt-depthname" }, depths[root.depth]) : null);
    });
    return h("figure", { class: "lt-ground" },
      h("p", { class: "lt-q" }, "Where does each command stand?"),
      h("div", { class: "lt-ground-field" },
        h("div", { class: "lt-strata", "aria-hidden": "true" }, Object.values(depths).map((name, i) => h("span", { class: `lt-stratum lt-stratum-${i}` }, name))),
        h("div", { class: "lt-cols" }, columns)),
      readout,
      h("figcaption", {}, `Above the line, a command to believers about one another; below it, the gift its own paragraph gives, in the verse's words. In all ${numbers.close} pairs the study names, the gift stands within two verses of its command, ${numbers.sameVerse} of them in the same verse: the habit is to look close. Where the study names no ground (parts 02 and 04), the root is left out rather than supplied. A script proves the words are in their verses and measures the distance; which words are the gift is the study's own reading.`));
  }

  // ── The six parts, one at a time ──
  const partNav = h("nav", { class: "lt-partnav", "aria-label": "The six parts" },
    study.parts.map((p) => h("a", { href: `?part=${p.n}`, "data-part": p.n }, h("b", {}, p.n), h("span", {}, p.title))));
  const current = h("p", { class: "lt-current", "aria-hidden": "true" });
  const articles = study.parts.map(renderPart);
  page.append(h("section", { class: "t-sec lt-parts", id: "parts", "aria-label": "The six parts" },
    sectionHead("01–06", "Six parts of", "shared life.", "Each part reads its passages, then asks two questions. Choose a part; the others wait here."),
    partNav, current, articles));

  function renderPart(part, index) {
    const next = study.parts[index + 1];
    const article = h("article", { class: "lt-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "lt-part-head" },
        h("span", { class: "lt-big", "aria-hidden": "true" }, part.n),
        art(LTArt.parts[part.n], "lt-mini-wrap"),
        h("div", {},
          h("p", { class: "lt-kicker" }, label(`Part ${part.n} of 06`), " ", label("Main readings"), h("span", {}, runs(part.readingsText))),
          h("h2", { id: `part-${part.n}-title`, tabindex: "-1" }, part.title),
          h("p", { class: "lt-hook" }, runs(part.hook)))),
      partRoots(part.n),
      body(part),
      h("dl", { class: "lt-ask" },
        h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
        h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect)))),
      next ? h("a", { class: "lt-next", href: `?part=${next.n}`, "data-part": next.n }, `Next: ${next.n} ${next.title}`, art(icon("arrowRight", 16)))
        : h("a", { class: "lt-next", href: "#close" }, "To the close: Loved first, then one another", art(icon("arrowRight", 16))));
    article.addEventListener("beforematch", () => choose(part.n, { push: false, focus: false }));
    return article;
  }

  function partRoots(n) {
    const mine = roots.filter((r) => r.part === n);
    if (!mine.length) return null;
    return h("div", { class: "lt-pairs" }, mine.map((r) => h("div", { class: `lt-pair${r.gift ? "" : " lt-pair-none"}` },
      h("p", { class: "lt-pair-cmd" }, `“${r.command.phrase}”`, " ", refLink(r.command.r, r.command.label)),
      h("span", { class: "lt-pair-root", "aria-hidden": "true" }),
      r.gift ? h("p", { class: "lt-pair-gift" }, label("Under it"), " ", h("em", {}, `“${r.gift.phrase}”`), " ", refLink(r.gift.r, r.gift.label), h("small", {}, depths[r.depth]))
        : h("p", { class: "lt-pair-gift" }, label("Under it"), " ", h("small", {}, "The study does not name the ground here. Read the paragraph and look for it.")))));
  }

  // Paragraphs run in the main column; "Left open", "How this site reads it" and "Other Christians" notes sit in the
  // margin beside the paragraph they follow. Care notes stay in the main column, so safety is never pushed aside.
  function body(part) {
    const holder = h("div", { class: "lt-body" });
    let row = null;
    part.blocks.forEach((block, i) => {
      if (has(SIDE, block.k) && row) {
        row.side.append(h("aside", { class: `lt-note lt-note-${block.k}` }, label(SIDE[block.k]), h("p", {}, runs(block.runs))));
        return;
      }
      const isHelp = part.n === "04" && i === 0 && block.k === "care";
      row = { main: h("div", { class: "lt-main" }, renderBlock(block, isHelp)), side: h("div", { class: "lt-side" }) };
      holder.append(h("div", { class: `lt-row${isHelp ? " lt-row-help" : ""}` }, row.main, row.side));
      if (part.n === "04" && block.k === "quote" && block.label === "Matthew 18:15") row.main.append(stepsFigure());
    });
    return holder;
  }

  function renderBlock(block, isHelp) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "h3": return h("h3", { class: "lt-h3" }, block.t);
      case "quote": return h("figure", { class: "lt-quote" }, h("blockquote", {}, verseText(block.r)), h("figcaption", {}, refLink(block.r, block.label), " · BSB"));
      case "care": return h("aside", { class: `lt-care${isHelp ? " lt-help" : ""}`, id: isHelp ? "help" : null, tabindex: isHelp ? "-1" : null }, label(isHelp ? "Help first" : "With care"), h("p", {}, runs(block.runs)));
      case "list": return h("ul", { class: "lt-list" }, block.items.map((item) => h("li", {}, runs(item))));
      case "open": case "read": case "other": return h("aside", { class: `lt-note lt-note-${block.k}` }, label(SIDE[block.k]), h("p", {}, runs(block.runs)));
      default: console.error(`Life together: unknown block ${block.k}`); return "";
    }
  }

  // Part 04: Matthew 18:15–17 as four steps with one aim. The dots are a drawing of how far the matter goes, not a count.
  function stepsFigure() {
    const dots = [2, 4, 12, 1];
    return h("figure", { class: "lt-steps" },
      h("p", { class: "lt-q" }, "What is every step for?"),
      h("p", { class: "lt-aim" }, label("The one aim"), " ", h("em", {}, `“${steps.aim.phrase}”`), " ", refLink(steps.aim.r, steps.aim.label)),
      h("ol", {}, steps.steps.map((step, i) => h("li", { class: `lt-step${i === 3 ? " lt-step-out" : ""}` },
        i ? h("p", { class: "lt-if" }, `“${step.if.phrase}”`) : null,
        h("span", { class: "lt-dots", "aria-hidden": "true" }, Array.from({ length: dots[i] }, () => h("i"))),
        h("b", {}, `${i + 1}. ${step.name}`),
        h("p", {}, `“${step.said.phrase}”`, " ", refLink(step.said.r, step.said.label)),
        h("small", {}, i === 0 ? `“${step.if.phrase}”: won.` : step.people)))),
      h("figcaption", {}, "Each step goes only as wide as it must, and every one aims at the same thing. The last still treats the person as someone to win back: ",
        h("em", {}, `“${steps.still.phrase}”`), " ", refLink(steps.still.r, steps.still.label), ". The dots show how far the matter goes; they are a drawing, not a count."));
  }

  function choose(n, { push = true, focus = true } = {}) {
    if (!PARTS.includes(n)) return;
    articles.forEach((article, i) => {
      if (PARTS[i] === n) article.removeAttribute("hidden");
      else article.setAttribute("hidden", "until-found");
    });
    partNav.querySelectorAll("a").forEach((a) => (a.dataset.part === n ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
    current.textContent = `${n} ${study.parts.find((p) => p.n === n).title}`;
    if (push) history.pushState(null, "", address({ part: n === PARTS[0] ? null : n, ref: null }).replace(location.hash, ""));
    else if (params().get("part") !== n && n !== PARTS[0]) history.replaceState(null, "", address({ part: n }));
    if (focus) {
      const target = document.getElementById(`part-${n}-title`);
      document.getElementById("parts").scrollIntoView({ block: "start", behavior: reduced.matches ? "auto" : "smooth" });
      target.focus({ preventScroll: true });
    }
  }

  // ── Close ──
  const close = study.close;
  page.append(h("section", { class: "t-sec lt-close", id: "close" },
    sectionHead("→", "Loved first,", "then one another."),
    h("div", { class: "lt-close-grid" },
      h("div", {},
        h("p", { class: "lt-way" }, label("The way of reading"), " ", runs(close.way)),
        h("p", { class: "lt-close-text" }, runs(close.close)),
        h("p", { class: "lt-invite" }, runs(close.invite)),
        h("p", { class: "lt-question" }, runs(close.question)),
        h("p", { class: "lt-again" }, runs(close.again))),
      h("figure", { class: "lt-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage, passages[close.passage].label), " · BSB"),
        h("p", { class: "lt-passage-text" }, passages[close.passage].verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))),
        art(LTArt.close, "lt-close-art"))),
    h("div", { class: "lt-sources" }, h("h3", {}, "Sources"), h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use)))),
    h("a", { class: "lt-back", href: "/study/theology?area=life" }, art(icon("arrowLeft", 16)), "Back to Living the Christian Life"),
  ));

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "lt-sheet", "aria-labelledby": "lt-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id) {
    if (!has(passages, id)) return;
    const item = passages[id];
    const x = h("button", { type: "button", class: "lt-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)));
    sheet.replaceChildren(
      h("div", { class: "lt-sheet-head" }, h("h2", { id: "lt-sheet-title" }, item.label), x),
      h("p", { class: "lt-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "lt-sheet-src" }, "Berean Standard Bible"));
    if (!sheet.open) sheet.showModal();
    x.focus();
    history.replaceState(null, "", address({ ref: id }));
  }
  sheet.addEventListener("close", () => {
    history.replaceState(null, "", address({ ref: null }));
    (opener && document.contains(opener) ? opener : document.querySelector("h1")).focus({ preventScroll: Boolean(!opener) });
    opener = null;
  });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const ref = event.target.closest("a.lt-ref, button.lt-col");
    if (ref) {
      event.preventDefault();
      opener = ref;
      openSheet(ref.dataset.ref);
      return;
    }
    const go = event.target.closest("a[data-part]");
    if (!go) return;
    event.preventDefault();
    choose(go.dataset.part);
    if (go.hasAttribute("data-help")) document.getElementById("help").focus();
  });
  window.addEventListener("popstate", () => {
    choose(askedPart(), { push: false, focus: false });
    const ref = params().get("ref");
    if (has(passages, ref)) openSheet(ref);
    else if (sheet.open) sheet.close();
  });

  choose(askedPart(), { push: false, focus: false });
  if (location.hash === "#help" && askedPart() === "04") document.getElementById("help").focus();
  const asked = params().get("ref");
  if (has(passages, asked)) openSheet(asked);
})();
