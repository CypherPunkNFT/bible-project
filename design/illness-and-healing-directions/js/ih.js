// What Scripture promises the sick, one mock-up page drawn from data.js (built by build-data.py from the study's
// content.md). The page's shape: a register of the sick Scripture leaves in the story, the words offered to the sick
// tested by the study's three questions, then seven parts, then what God promises and what He does not.
(() => {
  if (!window.IHCore || !window.IHFigures) return;
  const { h, art, label, refLink, runs, phrase, sectionHead, mountFrame, mountSheet, addressWith } = window.IHCore;
  const { study, hero, register, offered, kinds, numbers, passages, figures, sources, toConfirm } = window.IH;
  const main = mountFrame();
  const page = h("div", { class: "wrap t-page ih-page" });
  main.append(page);
  const [lead, frame, carry, care] = study.opening;

  // ── Opening ──
  function opening() {
    const counts = [
      ["In the register", numbers.register, "sick people this study reads, from Job to Paul's friends"],
      ["Recovered in the text", `${numbers.recovered} of ${numbers.register}`, `the other ${numbers.notRecovered} are left ill, kept in weakness, or not told`],
      ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
      ["Parts", numbers.parts, "and three questions carried through every one"],
    ];
    return h("section", { class: "t-sec-landing ih-hero", id: "top" },
      h("div", { class: "hc-intro ih-intro" },
        h("div", {},
          h("nav", { class: "ih-trail", "aria-label": "Study trail" }, hero.trail.map(([text, to]) => [h("a", { href: to }, text), h("span", { "aria-hidden": "true" }, "/")]), h("span", { class: "ih-here", "aria-current": "page" }, study.title)),
          h("p", { class: "ih-concepts" }, hero.concepts.join(" · ")),
          h("h1", {}, hero.ink, " ", h("em", {}, hero.turn)),
          h("p", { class: "hc-lede ih-lede" }, runs(lead.runs))),
        h("figure", { class: "ms-hero-art ih-hero-art" }, art(IHArt.hero),
          h("figcaption", { class: "ih-motto" }, h("i"), hero.motto[0], h("br"), h("span", {}, hero.motto[1]), " ", refLink(hero.motto_r, hero.motto_ref)),
          h("small", {}, "Illustrative forms: a sickroom at night. No one is drawn."))),
      h("dl", { class: "ih-figures" }, counts.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
      h("nav", { class: "ih-toc", "aria-label": "On this page" },
        h("a", { href: "#register" }, h("b", {}, "00"), "The sick in the story"),
        h("a", { href: "#offered" }, h("b", {}, "?"), "Test the words"),
        study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title.split(":")[0])),
        h("a", { href: "#close" }, h("b", {}, "→"), "What He promises")));
  }

  // ── The three questions ──
  function asks() {
    return h("section", { class: "ih-asks", "aria-label": "What this study asks" },
      h("p", { class: "ih-frame" }, runs(frame.runs)),
      h("p", { class: "ih-carry" }, runs(carry.runs)),
      h("ol", { class: "ih-questions" }, study.questions.map((q, i) => h("li", {},
        art(IHArt.questions[i], "ih-q-glyph"), h("span", { class: "ih-q-n" }, `0${q.n}`),
        h("div", {}, h("h3", {}, q.ask), h("p", {}, runs(q.runs)))))),
      h("aside", { class: "ih-care" }, label("With care"), h("p", {}, runs(care.runs))));
  }

  // ── 00 The register: the sick Scripture leaves in the story ──
  function registerSection() {
    const filters = [["all", `All ${numbers.register}`], ["recovered", `Recovered in the text · ${numbers.recovered}`], ["other", `Left ill, kept, or not told · ${numbers.notRecovered}`]];
    const list = h("ol", { class: "ih-register" }, register.map((row) => h("li", { class: `ih-row is-${row.kind}`, "data-group": row.kind === "recovered" ? "recovered" : "other" },
      h("div", { class: "ih-row-who" }, h("span", { class: "ih-who" }, row.who),
        h("a", { class: "ih-row-part", href: row.part === "00" ? "#top" : `#part-${row.part}` }, row.part === "00" ? "Opening" : `Part ${row.part}`)),
      h("div", { class: "ih-row-cell" }, label("What was wrong", "is-small"), phrase(row.ill)),
      h("div", { class: "ih-row-cell" }, label("Prayed or said", "is-small"), row.said ? phrase(row.said) : h("span", { class: "ih-none" }, "Not told")),
      h("div", { class: "ih-row-cell ih-row-end" }, h("span", { class: "ih-end-label" }, art(IHArt.mark[row.kind]), row.label),
        row.then ? phrase(row.then) : h("span", { class: "ih-none" }, "Scripture says no more"),
        row.later ? h("span", { class: "ih-later" }, "Later: ", phrase(row.later)) : null))));
    const buttons = filters.map(([key, text]) => h("button", { type: "button", class: "ih-filter", "data-filter": key, "aria-pressed": "false" }, text));
    function show(key, push = true) {
      const chosen = filters.some(([k]) => k === key) ? key : "all";
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === chosen)));
      list.querySelectorAll(".ih-row").forEach((row) => row.classList.toggle("is-dim", chosen !== "all" && row.dataset.group !== chosen));
      if (push) history.replaceState(null, "", `${addressWith("show", chosen === "all" ? null : chosen)}${location.hash}`);
    }
    buttons.forEach((b) => b.addEventListener("click", () => show(b.dataset.filter)));
    show(new URLSearchParams(location.search).get("show") || "all", false);
    const [romans, revelation] = [figures.promises[4], figures.promises[5]];
    return h("section", { class: "t-sec ih-reg", id: "register" },
      sectionHead("00", "The sick", "Scripture leaves in the story.", "Read what each text says happened, and no more."),
      h("div", { class: "ih-filters", role: "group", "aria-label": "Show" }, buttons),
      list,
      h("div", { class: "ih-notyet" }, h("span", { class: "ih-notyet-line", "aria-hidden": "true" }),
        h("p", {}, label("Not yet, for all who are His"), " ", phrase(romans), " ", phrase(revelation))),
      h("p", { class: "ih-note" }, "This is the study's selection, not every sick person in Scripture: the ten it reads, in the order it reads them. Each phrase is the verse's own words, checked by script. The word beside each mark is this study's summary of what the text tells; the shape of the mark says the same."));
  }

  // ── Test the words offered to the sick ──
  function offeredSection() {
    return h("section", { class: "t-sec ih-offered", id: "offered" },
      sectionHead("?", "Test the words", "offered to the sick.", "Ask each one the study's three questions before you hold it as a promise to you."),
      h("div", { class: "ih-off-head", "aria-hidden": "true" }, h("span", {}), ["What kind of word?", "Kept when?", "Who is speaking?"].map((t, i) => h("span", {}, art(IHArt.questions[i], "ih-q-glyph is-small"), t))),
      h("ol", { class: "ih-off" }, offered.map((o) => h("li", { class: "ih-off-row" },
        h("div", { class: "ih-off-says" }, h("q", {}, o.says), " ", o.r ? refLink(o.r, o.label) : h("span", { class: "ih-off-src" }, o.source)),
        h("dl", { class: "ih-off-answers" },
          h("div", {}, h("dt", {}, "What kind of word?"), h("dd", {}, o.kind)),
          h("div", {}, h("dt", {}, "Kept when?"), h("dd", {}, o.when)),
          h("div", {}, h("dt", {}, "Who is speaking?"), h("dd", {}, o.who, o.answer ? [" ", refLink(o.answer, o.answerLabel)] : null))),
        h("a", { class: "ih-off-part", href: `#part-${o.part}` }, `Part ${o.part}`)))),
      h("p", { class: "ih-note" }, "Every answer here is this study's reading, argued in the part named beside it. The quoted words are checked by script: each verse phrase is in its verse, and the two sayings that are not Scripture are word for word in the study."));
  }

  page.append(opening(), asks(), registerSection(), offeredSection());
  window.IHPage = { page, h, art, label, refLink, runs, phrase, sectionHead, study, passages, figures, sources, toConfirm };
  window.IHParts();
  mountSheet();
})();
