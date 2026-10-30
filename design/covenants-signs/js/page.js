// Puts the page together: the site frame, the heading, the stage, the disc, the maps and the close, plus the full reading
// and the verse sheet that open over them.
(() => {
  const { h, art, runs, plain, refLink, study, passages, numbers, sources, QUESTIONS, readings, worldName } = Cov;

  // ── Frame ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => {
    const original = header();
    if (!original.includes("Bible Project")) console.error("Covenants: the site name was not found in the shared header");
    return original
      .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}<span class="sep"`)
      .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  };
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  main.classList.add("cv-page");

  // ── Heading ──
  const motto = plain(study.motto).split(" / ");
  const figures = [
    ["Covenants", numbers.covenants, `each walked where it was first spoken, in ${numbers.readings} readings with the letters`],
    ["Verses walked", numbers.verses, "each counted once, in the Berean"],
    ["Later verses drawn", numbers.lines, `${numbers.quoted} quote, ${numbers.names} name, ${numbers.recalls} remember. A selection`],
    ["In the New Testament", numbers.reachNT, `of those ${numbers.lines} lines end there`],
    ["The word covenant", numbers.wordVerses, `verses, in ${numbers.wordBooks} of ${numbers.totalBooks} books. A count of the word, not the idea`],
  ];
  const top = h("div", { class: "wrap t-page ms-page cv-top" },
    h("section", { class: "t-sec-landing hc-intro cv-hero", id: "top" },
      h("div", {},
        h("nav", { class: "cv-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "cv-here", "aria-current": "page" }, study.title)),
        h("p", { class: "cv-concepts" }, plain(study.concepts)),
        h("h1", {}, "Covenants", h("em", {}, "and promises")),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "cv-opening" }, h("blockquote", {}, study.opening.t), h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art cv-hero-art" },
        art(CovSigns.hero),
        h("span", { class: "ms-art-note" }, h("i"), motto[0], h("br"), h("span", {}, motto[1])))));
  const under = h("div", { class: "wrap cv-under" },
    h("header", { class: "cv-head" }, h("h2", {}, "Five covenants, one set of heirs. ", h("em", {}, "Read where they were spoken.")), h("p", {}, runs(study.frame))));
  const stage = Cov.drawStage();
  const key = h("div", { class: "wrap cv-after" },
    h("dl", { class: "cv-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dd", {}, String(value)), h("dt", {}, label), h("small", {}, note)))),
    h("p", { class: "cv-small" }, h("b", {}, "How to read this page: "), "gold-referenced lines set apart are Scripture, in the Berean. Plain text is written by this site from Scripture. Outside sources are named, with what was read. An application is called an application. The numbers mark the order of the Bible's story, not levels of difficulty."),
    h("p", { class: "cv-small" }, runs(study.selection)));

  // ── The full reading, over the page, in its world's colours at the top ──
  const readingBody = h("div", { class: "cv-reading-in" });
  const readingEl = h("div", { class: "cv-reading", role: "dialog", "aria-modal": "true", "aria-label": "Reading", tabindex: "-1", hidden: true }, readingBody);
  let readingOpener = null;
  function drawReading(reading) {
    const slugs = study.readings.map((r) => r.slug);
    const next = readings.get(slugs[(slugs.indexOf(reading.slug) + 1) % slugs.length]);
    const close = h("button", { type: "button", class: "cv-round", "aria-label": `Close the reading: ${reading.title}`, onclick: () => Cov.closeReading() });
    close.append(art(icon("x", 20)));
    readingEl.dataset.world = reading.slug;
    readingBody.replaceChildren(
      h("header", { class: `cv-reading-top cv-w-${reading.slug}` },
        h("div", { class: "cv-reading-top-in" },
          Cov.miniSign(reading.slug, 72),
          h("div", {},
            h("p", { class: "cv-kind" }, "Reading ", h("b", {}, reading.n)),
            h("h3", { tabindex: "-1", id: "cv-reading-title" }, reading.title),
            h("p", { class: "cv-hook" }, runs(reading.hook))),
          close)),
      h("div", { class: "cv-reading-text" },
        h("p", { class: "cv-begin" }, h("span", {}, "Begin with the passage: "), reading.read.flatMap((id, i) => [i ? " · " : null, refLink(id, passages[id].label)])),
        h("p", { class: "cv-setting" }, h("span", {}, "Its setting: "), runs(reading.setting)),
        h("dl", { class: "cv-five" }, QUESTIONS.map(([keyName, label]) => h("div", {}, h("dt", {}, label), h("dd", {}, runs(reading[keyName]))))),
        reading.parts.map((part) => h("section", { class: "cv-part" }, h("h4", {}, part.title), part.blocks.map((block) => Cov.blockView[block.k](block)))),
        h("div", { class: "cv-prompts" },
          h("div", {}, h("h4", {}, "Look closely"), h("p", {}, runs(reading.look))),
          h("div", {}, h("h4", {}, "Your response"), h("p", {}, runs(reading.response)))),
        h("footer", { class: "cv-reading-foot" },
          h("button", { type: "button", onclick: () => { Cov.set({ reading: next.slug, world: next.slug }); document.getElementById("cv-reading-title")?.focus({ preventScroll: true }); readingEl.scrollTop = 0; } }, `Next: ${next.title} →`),
          h("button", { type: "button", onclick: () => Cov.closeReading() }, "Close this reading")),
      ));
  }
  const page = () => [document.querySelector(".site-header"), document.getElementById("main"), document.querySelector(".site-footer")].filter(Boolean);
  Cov.openReading = (slug, opener) => { readingOpener = opener ?? document.activeElement; Cov.set({ reading: slug, world: slug }); };
  Cov.closeReading = () => Cov.set({ reading: null });
  function syncReading(state, before) {
    const open = Boolean(state.reading);
    if (open && state.reading !== before?.reading) { drawReading(readings.get(state.reading)); readingEl.scrollTop = 0; }
    readingEl.hidden = !open;
    document.documentElement.classList.toggle("cv-locked", open);
    if (open === Boolean(before?.reading)) return;
    for (const part of page()) part.inert = open;
    if (open) document.getElementById("cv-reading-title")?.focus({ preventScroll: true });
    else { readingOpener?.focus({ preventScroll: true }); readingOpener = null; }
  }

  // ── The verse sheet: one, from the right, for every passage ──
  const sheetBody = h("div", { class: "cv-sheet-body" });
  const sheetClose = h("button", { type: "button", class: "cv-round", "aria-label": "Close the passage", onclick: () => Cov.closeSheet() });
  sheetClose.append(art(icon("x", 18)));
  const sheetEl = h("aside", { class: "cv-sheet", role: "dialog", "aria-modal": "true", "aria-label": "Passage in the Berean Standard Bible", tabindex: "-1" }, sheetClose, sheetBody);
  let sheetOpener = null;
  const verseBlock = (id) => {
    const passage = passages[id];
    let chapter = null;
    const paragraph = h("p", { class: "cv-sheet-text" });
    passage.verses.forEach((verse) => {
      if (verse.c !== chapter) { chapter = verse.c; if (passage.chapters.length > 1) paragraph.append(h("span", { class: "cv-sheet-chapter" }, `Chapter ${verse.c}`)); }
      paragraph.append(h("sup", {}, String(verse.v)), `${verse.t} `);
    });
    return [h("h3", {}, passage.label), paragraph, h("p", { class: "cv-sheet-links" }, passage.chapters.map((c) => h("a", { href: `/read/bsb/${passage.code}/${c}` }, `Open ${passage.label.replace(/ \d+:.*/, "")} ${c} in the reader →`)))];
  };
  function drawSheet(id) {
    const line = Cov.lineIds.get(id);
    sheetBody.replaceChildren(
      h("p", { class: "cv-kind" }, line ? `Scripture · ${worldName(line.covenant)} · ${line.sectionName}` : "Scripture · Berean Standard Bible"),
      ...(line ? [...verseBlock(line.origin), ...verseBlock(line.later)] : verseBlock(id)),
      h("p", { class: "cv-small" }, "Berean Standard Bible, public domain. Courtesy credit: berean.bible."));
    sheetBody.scrollTop = 0;
  }
  Cov.openSheet = (id, opener) => { sheetOpener = opener ?? document.activeElement; Cov.set({ sheet: id }, { push: true }); };
  Cov.closeSheet = () => { if (Cov.state.sheet) Cov.set({ sheet: null }); };
  function syncSheet(state, before) {
    if (state.sheet === before?.sheet) return;
    if (state.sheet) {
      drawSheet(state.sheet);
      sheetEl.classList.add("open");
      for (const part of [...page(), readingEl]) part.inert = true;
      sheetClose.focus({ preventScroll: true });
    } else {
      sheetEl.classList.remove("open");
      for (const part of page()) part.inert = Boolean(state.reading);
      readingEl.inert = false;
      sheetOpener?.isConnected && sheetOpener.focus({ preventScroll: true });
      sheetOpener = null;
    }
  }
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-sheet]");
    if (trigger) { event.preventDefault(); Cov.openSheet(trigger.dataset.sheet, trigger); return; }
    if (Cov.state.sheet && !sheetEl.contains(event.target)) Cov.closeSheet();
  });
  addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (Cov.state.sheet) { event.preventDefault(); Cov.closeSheet(); return; }
    if (Cov.state.reading) { event.preventDefault(); Cov.closeReading(); }
  });

  // ── Assemble ──
  const disc = Cov.drawDisc();
  const maps = Cov.drawMaps();
  const close = h("section", { class: "cv-closing", id: "close" },
    h("div", { class: "cv-closing-signs", "aria-hidden": "true" }, Object.keys(Cov.covenants).map((slug) => Cov.miniSign(slug, 54))),
    h("div", { class: "wrap cv-closing-in" },
      h("p", { class: "cv-concepts" }, study.closing),
      h("p", {}, runs(study.close)),
      h("p", {}, runs(study.way)),
      h("p", { class: "cv-question-end" }, runs(study.question)),
      h("p", { class: "cv-again" }, runs(study.again), " ", refLink(study.passage, passages[study.passage].label)),
      h("nav", { class: "cv-links", "aria-label": "Where next" },
        h("a", { href: "/study/theology?area=doctrine" }, "← Back to God & Christian Faith"),
        h("a", { href: "/study/creeds/1689-london-baptist-confession-1677" }, "Read the Second London Confession →")),
      h("details", { class: "cv-sources" },
        h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
        h("ul", {}, sources.map((source) => h("li", {}, h("a", { href: source.href, rel: "noopener noreferrer", target: "_blank" }, source.name), h("span", {}, source.note)))),
        h("p", { class: "cv-small" }, "Not read for this page, so not shown: other Baptist accounts of the covenants, such as New Covenant Theology. Scripture references and the Calvin, Maclaren and confession quotations were checked by script: that proves the words are there, not that the reading is right."))));
  main.append(top, under, stage, key, disc, maps, close);
  document.body.append(readingEl, sheetEl);
  Cov.onChange((state, before) => { syncReading(state, before); syncSheet(state, before); });
  syncReading(Cov.state, {});
  syncSheet(Cov.state, {});
  window.COV_READY = true;
})();
