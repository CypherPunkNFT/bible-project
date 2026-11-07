// Reading Daniel and Revelation, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js. A reference in the address
// (?ref=) is looked up in data.js, so an unknown value is simply ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`Reading Daniel and Revelation: ${detail}`);
  }
  if (!window.RDR) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.RDR is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.RDRArt || !window.RDRFigs) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon, RDRArt or RDRFigs is missing");

  const data = window.RDR;
  const { study, passages, numbers, sources } = data;
  const Art = window.RDRArt;

  function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") element.className = value;
      else if (key.startsWith("on")) element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value === true ? "" : value);
    }
    element.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false));
    return element;
  }
  function art(markup, className) {
    const holder = h("span", { class: className });
    holder.innerHTML = markup; // fixed drawings from art.js and the shared icon set only
    return holder;
  }
  const refLink = (id, text) => h("a", { class: "rdr-ref", href: `?ref=${id}`, "data-ref": id }, text ?? passages[id].label);
  function runs(list) {
    return list.map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "rdr-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, runs(run.b));
      if (run.i) return h("em", {}, run.i);
      if (run.p) return h("a", { class: "rdr-link", href: `#part-${run.p}` }, run.t);
      if ("s" in run) return run.s ? h("a", { class: "rdr-link", href: run.s, title: "Mock-up on this PC" }, run.t) : h("em", { class: "rdr-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }
  const label = (text, extra = "") => h("span", { class: `rdr-label ${extra}` }, text);
  const kit = { h, art, refLink, runs, label, data };
  const Figs = window.RDRFigs(kit);

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page rdr-page" });
  main.append(page);

  // ── Heading ──
  const figures = [
    [`${numbers.danChapters} · ${numbers.revChapters}`, "chapters", "Daniel's and Revelation's, drawn below one column each"],
    [numbers.aramaic, "verses in Aramaic", "Daniel 2:4 to 7:28, by the Berean's note; the rest of Daniel is Hebrew"],
    [numbers.revThrone, "verses name a throne", `in Revelation, the first at ${numbers.throneFirst}, before any beast`],
    [numbers.sevenVerses, "verses say “seven”", "in Revelation: churches, seals, trumpets, bowls and more"],
    [numbers.references, "references", "on this page, each opening its verses in the Berean"],
  ];
  page.append(h("section", { class: "t-sec-landing rdr-hero", id: "top" },
    h("div", { class: "hc-intro rdr-intro" },
      h("div", {},
        h("nav", { class: "rdr-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=books" }, "Explore the Bible"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "rdr-here", "aria-current": "page" }, study.title)),
        h("p", { class: "rdr-concepts" }, data.concepts.join(" · ")),
        h("h1", {}, data.title[0], " ", h("em", {}, data.title[1])),
        h("p", { class: "hc-lede rdr-lede" }, runs(study.lead))),
      h("figure", { class: "ms-hero-art rdr-hero-art" }, art(Art.hero),
        h("span", { class: "ms-art-note" }, h("i"), data.motto.lines[0], h("br"), h("span", {}, data.motto.lines[1], " ", refLink(data.motto.r, "Daniel 7:9")))),
    ),
    h("dl", { class: "rdr-figures" }, figures.map(([value, name, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
  ));

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head rdr-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));

  // ── Sealed, then open: the opening, the two last orders side by side, and the three questions ──
  const [first, sealed, opened, neighbours] = study.intro;
  const side = (block, book, broken, note) => h("figure", { class: `rdr-order rdr-${book}` },
    art(broken ? Art.sealBroken : Art.sealWhole, "rdr-order-seal"),
    h("blockquote", {}, block.part ? block.text : passages[block.r].verses.map((v) => v[1]).join(" ")),
    h("figcaption", {}, refLink(block.r, block.label), block.part ? " · first sentence of the verse" : "", " · ", note));
  page.append(h("section", { class: "t-sec rdr-opening", id: "sealed" },
    h("p", { class: "rdr-first" }, runs(first.runs)),
    h("div", { class: "rdr-orders" },
      side(sealed, "dan", false, "the end of Daniel"),
      h("p", { class: "rdr-hinge" }, runs(study.hinge)),
      side(opened, "rev", true, "the end of Revelation")),
    h("p", { class: "rdr-neighbours" }, runs(neighbours.runs)),
    h("ol", { class: "rdr-questions", "aria-label": "Three questions to carry into every vision" }, study.questions.map((q, i) =>
      h("li", { id: `question-${i + 1}` }, h("span", { class: "rdr-q-n", "aria-hidden": "true" }, String(i + 1)), h("p", {}, h("strong", {}, q.q), " ", runs(q.then))))),
  ));

  // ── The two books, chapter by chapter ──
  page.append(h("section", { class: "t-sec rdr-books", id: "books" },
    sectionHead("", "The two books,", "chapter by chapter.", "Where does each book put the throne, and where the beasts? Daniel sees the beasts rise before the thrones are set; Revelation shows a throne from its first chapter, and its beast does not rise from the sea until 13:1."),
    Figs.chart()));

  // ── 01–07, down a scroll of seven seals ──
  const askedBy = { "02": 1, "03": 2, "07": 3 };
  const kinds = { shows: "The text", means: "Meaning", stops: "Where it stops", views: "Readers differ" };
  function renderBlock(block, part) {
    if (block.k === "p") return h("p", {}, runs(block.runs));
    if (block.k === "quote") return h("figure", { class: "rdr-quote" }, h("blockquote", {}, passages[block.r].verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))), h("figcaption", {}, refLink(block.r, block.label), " · Berean Standard Bible"));
    if (block.k === "list") return h("ul", { class: "rdr-key" }, block.items.map((item, i) => h("li", {}, part.n === "02" ? art(Art.glyphs[data.keyGlyphs[i]], "rdr-glyph") : null, h("p", {}, runs(item)))));
    if (block.k === "views") return h("dl", { class: "rdr-views" }, block.items.map((item) => h("div", {}, h("dt", {}, item.label), h("dd", {}, runs(item.runs)))));
    return null;
  }
  const scroll = h("div", { class: "rdr-scroll" });
  const rod = h("nav", { class: "rdr-rod", "aria-label": "The seven parts" },
    study.parts.map((p) => h("a", { href: `#part-${p.n}`, class: "rdr-rod-seal", "data-part": p.n, title: p.title },
      art(Art.sealWhole, "rdr-rod-whole"), art(Art.sealBroken, "rdr-rod-broken"), h("span", { class: "rdr-rod-n" }, p.n), h("span", { class: "rdr-rod-t" }, p.title))));
  const partsHolder = h("div", { class: "rdr-parts" });
  for (const part of study.parts) {
    const words = part.title.split(" ");
    const q = askedBy[part.n];
    partsHolder.append(h("section", { class: "rdr-part", id: `part-${part.n}`, "data-part": part.n },
      h("header", { class: "rdr-part-head" },
        h("span", { class: "rdr-part-seal", "aria-hidden": "true" }, art(Art.sealBroken), h("b", {}, part.n)),
        h("div", {},
          h("h2", {}, words.slice(0, -1).join(" "), " ", h("em", {}, words.at(-1))),
          q ? h("a", { class: "rdr-asks", href: `#question-${q}` }, `Question ${q} · ${study.questions[q - 1].q}`) : null)),
      h("div", { class: "rdr-hook" }, part.hook.map((b) => renderBlock(b, part))),
      h("p", { class: "rdr-readings" }, label("Main readings"), " ", part.readings.flatMap((r, i) => [i ? "; " : "", refLink(r.r, r.t)])),
      h("div", { class: "rdr-part-body" },
        h("div", { class: "rdr-text" }, part.subs.map((sub) => h("div", { class: `rdr-sub rdr-sub-${sub.kind}` },
          h("h3", {}, label(kinds[sub.kind]), h("span", {}, sub.title)),
          sub.blocks.map((b) => renderBlock(b, part))))),
        h("div", { class: "rdr-fig-col" }, Figs[part.n]())),
      h("div", { class: "rdr-respond" },
        h("p", {}, label("Consider · the text"), h("span", {}, runs(part.consider))),
        h("p", {}, label("Reflect · your life"), h("span", {}, runs(part.reflect)))),
    ));
  }
  scroll.append(rod, partsHolder);
  page.append(h("section", { class: "t-sec rdr-seven", id: "parts", "aria-label": "The seven parts" }, scroll));

  // A seal breaks once its part has been reached, and stays broken; the current part is marked.
  const seals = new Map([...rod.querySelectorAll(".rdr-rod-seal")].map((a) => [a.dataset.part, a]));
  const watcher = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const link = seals.get(entry.target.dataset.part);
      if (entry.isIntersecting) {
        link.classList.add("is-open");
        seals.forEach((a) => a.removeAttribute("aria-current"));
        link.setAttribute("aria-current", "true");
      }
    }
  }, { rootMargin: "-35% 0px -55% 0px" });
  partsHolder.querySelectorAll(".rdr-part").forEach((section) => watcher.observe(section));

  // ── Close ──
  const close = study.close;
  page.append(h("section", { class: "t-sec rdr-close", id: "close" },
    sectionHead("", "Read Daniel and Revelation", "again."),
    h("div", { class: "rdr-close-grid" },
      h("div", {},
        close.blocks.map((b) => h("p", { class: "rdr-closing" }, runs(b.runs))),
        h("p", { class: "rdr-question" }, label("Your question"), " ", runs(close.question)),
        h("p", { class: "rdr-again" }, close.again)),
      h("div", { class: "rdr-close-seals", "aria-hidden": "true" }, art(Art.sealBroken, "rdr-dan"), art(Art.sealBroken, "rdr-rev"))),
    h("div", { class: "rdr-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use))),
      h("p", { class: "rdr-byline" }, study.byline, " · page built from the study's text and checked by script against the Berean")),
    h("a", { class: "rdr-back", href: "/study/theology?area=books" }, art(icon("arrowLeft", 16)), "Back to Explore the Bible"),
  ));

  // ── The verse sheet, from the right ──
  const sheet = h("dialog", { class: "rdr-sheet", "aria-labelledby": "rdr-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    const item = passages[id];
    if (!item) return;
    sheet.replaceChildren(
      h("div", { class: "rdr-sheet-head" }, h("h2", { id: "rdr-sheet-title" }, item.label), h("button", { type: "button", class: "rdr-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "rdr-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "rdr-sheet-src" }, "Berean Standard Bible"));
    if (!sheet.open) sheet.showModal();
    if (push) history.replaceState(null, "", `?ref=${encodeURIComponent(id)}${location.hash}`);
  }
  sheet.addEventListener("close", () => {
    history.replaceState(null, "", location.pathname + location.hash);
    opener?.focus();
    opener = null;
  });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.rdr-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  const asked = new URLSearchParams(location.search).get("ref");
  if (asked && passages[asked]) openSheet(asked, false);
})();
