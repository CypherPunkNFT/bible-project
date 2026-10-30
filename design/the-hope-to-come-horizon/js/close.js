// The close, set on the same horizon as the opening, then the sources by how they were reached, then the verse sheet.
(() => {
  if (!window.HZ) return;
  const { h, art, refLink, runs, plain, state, setView, onView, page } = HZ;
  const { study, passages, sources } = HP;

  // The same far ridge as the opening, with the motto standing on it.
  const RIDGE = `<svg viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40V26C80 30 150 18 240 21S380 34 470 27 610 10 700 14 850 31 930 22 980 20 1000 24V40Z"/></svg>`;
  const motto = plain(study.motto).split(" / ");
  const verse = passages[study.passage];
  const verseText = verse.verses.map((v) => v.t).join(" ");

  // How each source was reached, read from its own note: the Bible, then read directly, then through a tool or a reprint.
  const REACHED = [
    ["Scripture", ["bsb"]],
    ["Read directly, in part", ["abstract", "boyce", "calvin-peter", "criswell", "piper", "akin"]],
    ["Reached through a tool or a reprint", ["bfm", "waldron", "pinnock"]],
  ];
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const listed = REACHED.flatMap(([, ids]) => ids);
  sources.forEach((s) => { if (!listed.includes(s.id)) console.error(`The hope to come: source ${s.id} is in no group`); });

  page.append(h("section", { class: "hz-close", id: "close" },
    h("div", { class: "hz-close-sky" },
      h("p", { class: "hz-concepts" }, study.closing),
      h("p", { class: "hz-close-line" }, runs(study.close)),
      h("p", { class: "hz-close-way" }, runs(study.way))),
    h("div", { class: "hz-close-far" }, art(RIDGE, "hz-ridge"), h("p", { class: "hz-motto" }, motto[0], h("span", {}, motto[1]))),
    h("div", { class: "hz-close-ground" },
      h("div", {},
        h("p", { class: "hz-close-question" }, runs(study.question)),
        h("p", { class: "hz-close-again" }, runs(study.again), " ", refLink(study.passage, verse.label))),
      h("div", {},
        h("blockquote", { class: "hz-close-verse" }, verseText),
        h("p", { class: "hz-close-invite" }, runs(study.invite)),
        h("nav", { class: "hz-links", "aria-label": "Where next" },
          h("a", { href: "/study/theology?area=doctrine" }, "← Back to God & Christian Faith"),
          h("a", { href: "/mockups/faith-under-pressure-directions/" }, "Faith under pressure, its mock-up →"),
          h("a", { href: "/mockups/covenants-and-promises-directions/" }, "Covenants and promises, its mock-up →"))))));
  page.append(h("section", { class: "hz-sec hz-sources-sec" },
    h("details", { class: "hz-sources" },
      h("summary", {}, `Sources · ${sources.length} · what was read, and how far`),
      h("div", { class: "hz-sources-groups" }, REACHED.map(([label, ids]) => h("div", {},
        h("h3", {}, label),
        h("ul", {}, ids.map((id) => {
          const source = sourceById.get(id);
          return h("li", {}, h("a", { href: source.href, rel: "noopener noreferrer", target: "_blank" }, source.name), h("span", {}, source.note));
        }))))),
      h("p", { class: "hz-note" }, "Not read for this page, so not shown: any writer who holds the golden-age view, and any named source on whether 2 Peter 3:10 means replaced or renewed. Scripture references and the Calvin, Boyce and Abstract of Principles quotations were checked by script: that proves the words are there, not that the reading is right."))));

  // ── The verse sheet: one, from the right, for every passage ──
  const sheetBody = h("div", { class: "hz-sheet-body" });
  const sheetClose = h("button", { type: "button", class: "hz-sheet-close", "aria-label": "Close the passage", onclick: () => closeSheet() });
  sheetClose.append(art(icon("x", 18)));
  const sheetEl = h("aside", { class: "hz-sheet", role: "dialog", "aria-modal": "true", "aria-label": "Passage in the Berean Standard Bible", tabindex: "-1" }, sheetClose, sheetBody);
  document.body.append(sheetEl);
  const backgroundParts = () => [document.querySelector(".site-header"), document.getElementById("main"), document.querySelector(".site-footer")].filter(Boolean);
  let opener = null, shown = null;

  function drawSheet(id) {
    const p = passages[id];
    let chapter = null;
    const paragraph = h("p", { class: "hz-sheet-text" });
    p.verses.forEach((v) => {
      if (v.c !== chapter) { chapter = v.c; if (p.chapters.length > 1) paragraph.append(h("span", { class: "hz-sheet-ch" }, `Chapter ${v.c}`)); }
      paragraph.append(h("sup", {}, String(v.v)), `${v.t} `);
    });
    sheetBody.replaceChildren(
      h("p", { class: "hz-kind" }, "Scripture · Berean Standard Bible"),
      h("h3", {}, p.label), paragraph,
      h("p", { class: "hz-sheet-links" }, p.chapters.map((c) => h("a", { href: `/read/bsb/${p.code}/${c}` }, `Open ${p.label.replace(/ \d+:.*/, "")} ${c} in the reader →`))),
      h("p", { class: "hz-note" }, "Berean Standard Bible, public domain. Courtesy credit: berean.bible."));
    sheetBody.scrollTop = 0;
  }
  function syncSheet() {
    if (state.sheet === shown) return;
    const wasOpen = shown;
    shown = state.sheet;
    if (shown) {
      drawSheet(shown);
      sheetEl.classList.add("open");
      for (const part of backgroundParts()) part.inert = true;
      sheetClose.focus({ preventScroll: true });
    } else if (wasOpen) {
      sheetEl.classList.remove("open");
      for (const part of backgroundParts()) part.inert = false;
      const target = opener?.isConnected ? opener : document.querySelector("h1");
      if (target === document.querySelector("h1")) target.tabIndex = -1;
      target?.focus({ preventScroll: true });
      opener = null;
    }
  }
  function closeSheet() { if (state.sheet) setView({ sheet: null }); }
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-sheet]");
    if (trigger) {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      opener = trigger;
      setView({ sheet: trigger.dataset.sheet }, { push: true });
      return;
    }
    if (state.sheet && !sheetEl.contains(event.target)) closeSheet();
  });
  addEventListener("keydown", (event) => { if (event.key === "Escape" && state.sheet) { event.preventDefault(); closeSheet(); } });
  onView(syncSheet);
  syncSheet();
  window.HP_READY = true;
})();
