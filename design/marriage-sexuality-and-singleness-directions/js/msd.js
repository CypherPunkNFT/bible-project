// Sexuality, singleness and divorce, one mock-up page drawn from data.js (built by build-data.py from content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js. A reference in the
// address (?ref=) is looked up in data.js with Object.hasOwn, so an unknown value is simply ignored.
(() => {
  const NAME = "Sexuality, singleness and divorce";
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`${NAME}: ${detail}`);
  }
  if (!window.MSD) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.MSD is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.MSDArt) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon or MSDArt is missing");

  const D = window.MSD;
  const { study, passages, numbers } = D;
  const Art = window.MSDArt;

  function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") element.className = value;
      else if (key.startsWith("on")) element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value === true ? "" : value);
    }
    element.append(...children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false));
    return element;
  }
  function art(markup, className) {
    const holder = h("span", { class: className });
    holder.innerHTML = markup; // fixed drawings from art.js only
    return holder;
  }
  const refLink = (id, text) => h("a", { class: "msd-ref", href: `?ref=${id}`, "data-ref": id }, text ?? passages[id].label);
  function runs(list) {
    return list.map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "msd-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, runs(run.b));
      if (run.i) return h("em", {}, run.i);
      if ("s" in run) return run.s ? h("a", { class: "msd-link", href: run.s, title: "Mock-up on this PC" }, run.t) : h("em", { class: "msd-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }
  const label = (text, extra = "") => h("span", { class: `msd-label ${extra}` }, text);
  const verseText = (id) => passages[id].verses.map((v) => v[1]).join(" ");
  const partTitle = (n) => study.parts.find((p) => p.n === n).title;

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page msd-page" });
  main.append(page);

  // ── Hero: the standard heading, the garden at the beginning, four counts ──
  const [askedLead, pharisees, openingQuote, frame, carry, wound] = study.intro;
  const figures = [
    ["“One flesh”", numbers.oneFlesh, `verses: Genesis 2:24 and the ${numbers.quotedIn} New Testament passages that quote it`, "Counted in the Berean"],
    ["“From the beginning”", numbers.fromBeginning, "times in Matthew 19:3–12: Jesus goes back before Moses twice in one conversation", "Counted in the passage"],
    ["The divorce saying", numbers.accounts, `tellings in the Gospels; ${numbers.withException} carry an exception, both in Matthew`, "Matthew 5, Matthew 19, Mark 10, Luke 16"],
    ["Views Baptists hold", numbers.views, "on divorce and remarriage, side by side; this study does not choose", "Part 06"],
  ];
  page.append(h("section", { class: "t-sec-landing msd-hero", id: "top" },
    h("div", { class: "hc-intro msd-intro" },
      h("div", {},
        h("nav", { class: "msd-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=life" }, "Living the Christian Life"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "msd-here", "aria-current": "page" }, study.title)),
        h("p", { class: "msd-concepts" }, D.concepts.join(" · ")),
        h("h1", {}, D.title[0], " ", h("em", {}, D.title[1])),
        h("p", { class: "hc-lede msd-lede" }, runs(askedLead.runs)),
        h("p", { class: "msd-lede-2" }, runs(pharisees.runs)),
        h("figure", { class: "msd-opening" }, h("blockquote", {}, verseText(openingQuote.r)), h("figcaption", {}, refLink(openingQuote.r, openingQuote.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art msd-hero-art" }, art(Art.hero), h("span", { class: "ms-art-note" }, h("i"), D.motto.lines[0], h("br"), h("span", {}, D.motto.lines[1]), " ", refLink(D.motto.r, "Matthew 19:4"))),
    ),
    h("dl", { class: "msd-figures" }, figures.map(([name, value, means, rule]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, means), h("small", { class: "msd-rule" }, rule)))),
    h("nav", { class: "msd-toc", "aria-label": "On this page" },
      h("a", { href: "#asked" }, h("b", {}, "00"), "Have you not read?"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title)),
      h("a", { href: "#close" }, h("b", {}, "→"), study.close.title)),
  ));

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head msd-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));

  // ── 00 Have you not read? Matthew 19:3–12 in seven turns, and the ground line they go back to ──
  const reading = h("p", { class: "msd-reading", "aria-live": "polite" });
  function showTurn(turn) {
    reading.replaceChildren(h("b", {}, passages[turn.r].label), " ", verseText(turn.r));
  }
  const turnList = h("ol", { class: "msd-turns" }, D.turns.items.map((turn, i) => {
    const item = h("li", { class: `msd-turn msd-who-${turn.who.toLowerCase()}${turn.back.length ? " is-back" : ""}`, onmouseenter: () => showTurn(turn), onfocusin: () => showTurn(turn) },
      h("span", { class: "msd-turn-n", "aria-hidden": "true" }, String(i + 1)),
      label(turn.who, "msd-who"),
      h("q", { class: "msd-turn-words" }, turn.t),
      h("span", { class: "msd-turn-foot" }, refLink(turn.r),
        turn.parts.map((n) => h("a", { class: "msd-to-part", href: `#part-${n}`, title: partTitle(n) }, `→ ${n}`))),
      turn.back.length ? h("span", { class: "msd-root", "aria-label": "goes back to the beginning" }) : null);
    return item;
  }));
  showTurn(D.turns.items[0]);
  page.append(h("section", { class: "t-sec msd-asked", id: "asked" },
    sectionHead("00", "Have you", "not read?", "One conversation holds all three questions. Twice, Jesus answers by going back to the beginning."),
    h("p", { class: "msd-frame" }, runs(frame.runs)),
    h("figure", { class: "msd-talk", "aria-label": `${passages[D.turns.r].label} in seven turns` },
      h("figcaption", { class: "msd-talk-q" }, h("strong", {}, "Which part of this study does each turn lead to?"), " Point at a turn to read its verse here; choose a number to go to that part."),
      turnList,
      h("div", { class: "msd-ground" },
        label("From the beginning"),
        D.turns.ground.map((g) => h("span", { class: "msd-ground-item" }, h("q", {}, g.t), " ", refLink(g.r)))),
      reading),
    h("p", { class: "msd-carry" }, runs(carry.runs)),
    h("ol", { class: "msd-questions" }, study.questions.map((q, i) => h("li", {},
      art(Art.marks[["beginning", "asked", "balance"][i]], "msd-mark-wrap"),
      h("div", {}, h("strong", {}, q.q), q.then.length ? [" ", runs(q.then)] : null)))),
    h("aside", { class: "msd-care msd-wound" }, label("With care"), h("p", {}, runs(wound.runs))),
  ));

  // ── Each part's own figure ──
  function remembered() {
    const R = D.remembered;
    return h("figure", { class: "msd-remembered", "aria-label": "Genesis 2:24 and the places that quote it" },
      h("figcaption", { class: "msd-fig-q" }, h("strong", {}, "Where does Scripture quote this verse again?"), ` Four times, each to answer a different question. Every verse in the Berean with “one flesh” is here: ${numbers.oneFlesh} in all.`),
      h("div", { class: "msd-rem-row" },
        h("p", { class: "msd-rem-source" }, label("Genesis"), h("q", {}, "they will become one flesh"), " ", refLink(R.source)),
        h("ul", { class: "msd-rem-places" }, R.places.map((p) => h("li", {}, refLink(p.r), h("span", {}, p.answers))))));
  }
  function songStrip() {
    const S = D.song;
    const marks = {};
    for (const [kind, spec] of Object.entries(S.marks)) for (const at of spec.at) marks[at.cv] = { kind, r: at.r };
    return h("figure", { class: "msd-song", "aria-label": "The Song of Songs, verse by verse" },
      h("figcaption", { class: "msd-fig-q" }, h("strong", {}, "How does the Song hold its desire?"), ` Its ${S.verses} verses in ${S.chapters.length} chapters. The refrain comes three times, and three times the lovers say they belong to each other. Found by search in the Berean.`),
      h("ol", { class: "msd-song-row" }, S.chapters.map((count, c) => h("li", { class: "msd-song-ch" },
        h("span", { class: "msd-song-n" }, String(c + 1)),
        h("span", { class: "msd-song-verses" }, Array.from({ length: count }, (_, v) => {
          const mark = marks[`${c + 1}:${v + 1}`];
          return mark ? h("a", { class: `msd-ref msd-v is-${mark.kind}`, href: `?ref=${mark.r}`, "data-ref": mark.r, title: passages[mark.r].label, "aria-label": passages[mark.r].label }) : h("i", { class: "msd-v" });
        }))))),
      h("p", { class: "msd-legend" }, ["refrain", "belong"].map((kind) => h("span", { class: "msd-legend-item" }, h("span", { class: `msd-key is-${kind}` }), S.marks[kind].label))));
  }
  function eunuchs() {
    const E = D.eunuchs;
    return h("figure", { class: "msd-kinds", "aria-label": "Matthew 19:12, three kinds" },
      h("ol", {}, E.kinds.map((k) => h("li", {}, label(k.plain), h("q", {}, k.t)))),
      h("figcaption", {}, refLink(E.r), ". Isaiah had promised the one who could have no children: ",
        E.dry.map((d, i) => [i ? " · " : "", h("q", {}, d.t), " ", refLink(d.r)])));
  }
  function caseLaw() {
    return h("figure", { class: "msd-case", "aria-label": "Deuteronomy 24:1–4 as one case" },
      h("figcaption", { class: "msd-fig-q" }, h("strong", {}, "What does the law command?"), " One thing, at the end. Verses 1 to 3 set out the case; the command is in verse 4."),
      h("ol", {}, D.case.map((step) => h("li", { class: step.word === "then" ? "is-then" : "" },
        h("span", { class: "msd-case-word" }, step.word), h("q", {}, step.t), step.then ? h("q", { class: "msd-faint-q" }, step.then) : null, refLink(step.r)))),
      h("div", { class: "msd-two-words" }, D.orderPermitted.map((w) => h("p", {}, label(w.who), h("span", { class: "msd-word" }, w.t), refLink(w.r)))));
  }
  function tellings() {
    return h("figure", { class: "msd-tellings", "aria-label": "The divorce saying in each Gospel that gives it" },
      h("figcaption", { class: "msd-fig-q" }, h("strong", {}, "Where does the exception stand?"), ` In ${numbers.withException} of the ${numbers.accounts} tellings, both in Matthew. Found by searching each for “${D.accounts.phrase}”.`),
      h("ul", {}, D.accounts.items.map((a) => h("li", { class: a.except ? "has-except" : "" }, refLink(a.r), h("span", {}, a.except ? "With the exception" : "Without one")))),
      h("div", { class: "msd-lord-i" }, D.lordI.map((p) => h("p", {}, h("q", {}, p.t), " ", refLink(p.r)))));
  }
  const FIGURE = { "01": [1, remembered], "02": [1, songStrip], "04": [1, eunuchs], "05": [0, caseLaw], "06": [0, tellings] };

  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "quote":
        if (block.r === D.washed.r) return h("figure", { class: "msd-quote msd-washed" }, h("blockquote", {}, verseText(block.r)),
          h("p", { class: "msd-verbs", "aria-hidden": "true" }, D.washed.verbs.map((v) => h("span", {}, v.replace(/^you were /, "")))),
          h("figcaption", {}, refLink(block.r, block.label), " · BSB"));
        return h("figure", { class: "msd-quote" }, h("blockquote", {}, verseText(block.r)), h("figcaption", {}, refLink(block.r, block.label), " · BSB"));
      case "care": return h("aside", { class: "msd-care" }, label("With care"), h("p", {}, runs(block.runs)));
      case "open": return h("aside", { class: "msd-open" }, label("Open question · shown, not chosen"), h("p", {}, runs(block.runs)));
      case "views": return h("div", { class: "msd-views" },
        h("p", { class: "msd-views-head" }, label("Shown, not chosen")),
        h("div", { class: "msd-views-row" }, block.items.map((item, i) => h("div", { class: "msd-view" }, h("span", { class: "msd-view-n" }, String(i + 1)), h("h4", {}, item.label), h("p", {}, runs(item.runs))))),
        h("div", { class: "msd-agree" }, label("All four agree"), h("ul", {}, D.agree.map((a) => h("li", {}, a)))));
      default: console.error(`${NAME}: unknown block ${block.k}`); return "";
    }
  }

  function threeQuestions(n) {
    const m = D.margin[n];
    return h("ol", { class: "msd-rule", "aria-label": "The three questions, for this part" },
      h("li", {}, art(Art.marks.beginning, "msd-mark-wrap"), label("From the beginning"), h("p", {}, h("q", {}, m.beginning.t), " ", refLink(m.beginning.r))),
      h("li", {}, art(Art.marks.asked, "msd-mark-wrap"), label("Asked first"), h("p", {}, h("span", { class: "msd-asker" }, `${m.asked.who}: `), h("q", {}, m.asked.t), " ", refLink(m.asked.r))),
      h("li", {}, art(Art.marks.balance, "msd-mark-wrap"), label("Holiness · Grace"),
        h("p", {}, h("span", { class: "msd-side" }, "Holiness"), h("q", {}, m.holiness.t), " ", refLink(m.holiness.r)),
        h("p", {}, h("span", { class: "msd-side" }, "Grace"), h("q", {}, m.grace.t), " ", refLink(m.grace.r))));
  }

  const parts = h("div", { class: "msd-parts" });
  study.parts.forEach((part) => {
    const [after, draw] = FIGURE[part.n] ?? [-1, null];
    parts.append(h("section", { class: "t-sec msd-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "msd-part-head" },
        h("span", { class: "msd-n", "aria-hidden": "true" }, part.n),
        h("div", { class: "msd-part-title" },
          h("h2", { id: `part-${part.n}-title` }, part.title),
          h("div", { class: "msd-hook" }, part.hook.map(renderBlock)),
          h("p", { class: "msd-readings" }, label("Main readings"), " ", part.readings.map((item, i) => [i ? " · " : "", refLink(item.r, item.t)]))),
        art(Art.parts[part.n], "msd-mini-wrap")),
      threeQuestions(part.n),
      h("div", { class: "msd-body" }, part.subs.map((sub, i) => [
        h("h3", { class: "msd-sub" }, runs(sub.title)), sub.blocks.map(renderBlock), i === after ? draw() : null])),
      part.consider ? h("dl", { class: "msd-ask" },
        h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
        h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect)))) : null,
    ));
  });
  page.append(parts);

  // ── Close: back to the beginning, the whole conversation, and the question ──
  const [closeStory, again] = study.close.blocks;
  page.append(h("section", { class: "t-sec msd-close", id: "close" },
    art(Art.close, "msd-close-art"),
    sectionHead("→", "Back to", "the beginning."),
    h("p", { class: "msd-close-story" }, runs(closeStory.runs)),
    h("figure", { class: "msd-passage" }, h("blockquote", {}, passages[D.turns.r].verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), " ", text, " "))),
      h("figcaption", {}, refLink(D.turns.r), " · Berean Standard Bible. The conversation this study began with, whole.")),
    h("p", { class: "msd-question" }, label("Your question"), runs(study.close.question)),
    h("p", { class: "msd-again" }, runs(again.runs)),
    h("div", { class: "msd-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, D.sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use))),
      h("p", {}, `All ${numbers.outside} quotations from outside Scripture were found by script in the copies held on this PC, near the place each is cited from. ${study.byline}.`)),
    h("a", { class: "msd-back", href: "/study/theology?area=life" }, art(icon("arrowLeft", 16)), "Back to Living the Christian Life"),
  ));

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "msd-sheet", "aria-labelledby": "msd-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    if (!Object.hasOwn(passages, id)) return;
    const item = passages[id];
    sheet.replaceChildren(
      h("div", { class: "msd-sheet-head" }, h("h2", { id: "msd-sheet-title" }, item.label), h("button", { type: "button", class: "msd-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "msd-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "msd-sheet-src" }, "Berean Standard Bible"));
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
    const link = event.target.closest("a.msd-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  const asked = new URLSearchParams(location.search).get("ref");
  if (asked) openSheet(asked, false);
})();
