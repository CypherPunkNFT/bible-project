// Angels, demons and spiritual powers, one mock-up page drawn from data.js (built by build-data.py from content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js. A reference in the
// address (?ref=) is looked up in data.js with Object.hasOwn, so an unknown value is simply ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`Angels, demons and spiritual powers: ${detail}`);
  }
  if (!window.ADP) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.ADP is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.ADPArt) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon or ADPArt is missing");

  const { study, passages, edge, counts, named, oneLine, order, notSeparate, motto, numbers, sources, unchecked } = window.ADP;
  const Art = window.ADPArt;

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
    const holder = h("span", { class: className });
    holder.innerHTML = markup; // fixed drawings from art.js only
    return holder;
  }
  const refLink = (id, text) => h("a", { class: "adp-ref", href: `?ref=${id}`, "data-ref": id }, text ?? passages[id].label);
  function runs(list) {
    return list.map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "adp-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, runs(run.b));
      if (run.i) return h("em", {}, run.i);
      if ("s" in run) return run.s ? h("a", { class: "adp-link", href: run.s, title: "Mock-up on this PC" }, run.t) : h("span", { class: "adp-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }
  const label = (text) => h("span", { class: "adp-label" }, text);
  const verseText = (id) => passages[id].verses.map((v) => v[1]).join(" ");
  const SUB = { shows: "What the text shows", means: "What it means", unsaid: "What Scripture leaves unsaid" };

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page adp-page" });
  main.append(page);

  // ── Hero: the hills full of chariots of fire ──
  const [story, storyQuote, prayed, frame, rule, ruleQuote, neighbours] = study.intro;
  const angelsNamed = Object.keys(named);
  const figures = [
    ...counts.map((c) => [c.name, c.value, `${c.rule}: ${c.ot} in the Old Testament, ${c.nt} in the New`, c.means]),
    ["Holy angels named", angelsNamed.length, `${angelsNamed.join(" and ")}, in ${Object.values(named).map((v) => v.length).join(" and ")} verses`, "every other holy angel in Scripture is unnamed"],
  ];
  page.append(h("section", { class: "t-sec-landing adp-hero", id: "top" },
    h("div", { class: "hc-intro adp-intro" },
      h("div", {},
        h("nav", { class: "adp-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "adp-here", "aria-current": "page" }, study.title)),
        h("p", { class: "adp-concepts" }, window.ADP.concepts.join(" · ")),
        h("h1", {}, window.ADP.title[0], " ", h("em", {}, window.ADP.title[1])),
        h("p", { class: "hc-lede adp-lede" }, runs(story.runs)),
        h("figure", { class: "adp-opening" }, h("blockquote", {}, verseText(storyQuote.r)), h("figcaption", {}, refLink(storyQuote.r, storyQuote.label), " · Berean Standard Bible")),
        h("p", { class: "adp-prayed" }, runs(prayed.runs))),
      h("figure", { class: "ms-hero-art adp-hero-art" }, art(Art.hero), h("span", { class: "ms-art-note" }, h("i"), motto.lines[0], h("br"), h("span", {}, motto.lines[1]), " ", refLink(motto.r, "2 Kings 6:17"))),
    ),
    h("dl", { class: "adp-figures" }, figures.map(([name, value, rule, means]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, means), h("small", { class: "adp-rule" }, rule)))),
    h("p", { class: "adp-count-note" }, "Counted by script in the site's Berean: verses, not passages about angels. Cherubim, seraphim, “the host of heaven” and “the sons of God” are not caught by these words."),
    h("nav", { class: "adp-toc", "aria-label": "On this page" },
      h("a", { href: "#line" }, h("b", {}, "00"), "The line Moses drew"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title)),
      h("a", { href: "#close" }, h("b", {}, "→"), "The question for your life")),
  ));

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head adp-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));

  // ── 00 The line Moses drew: Deuteronomy 29:29 split at its "but", then the edge chart ──
  const [secret, revealed] = verseText(ruleQuote.r).split(/(?<=,) (?=but )/);
  page.append(h("section", { class: "t-sec adp-line", id: "line" },
    sectionHead("00", "The line", "Moses drew.", "What is revealed belongs to us. The rest belongs to God."),
    h("p", { class: "adp-frame" }, runs(frame.runs)),
    h("p", { class: "adp-rule-intro" }, runs(rule.runs)),
    h("figure", { class: "adp-split", "aria-label": `${passages[ruleQuote.r].label}, read across its two halves` },
      h("blockquote", {},
        h("p", { class: "adp-secret" }, h("span", { class: "adp-side" }, "The LORD's"), secret),
        h("span", { class: "adp-divide", "aria-hidden": "true" }),
        h("p", { class: "adp-revealed" }, h("span", { class: "adp-side" }, "Ours"), revealed)),
      h("figcaption", {}, refLink(ruleQuote.r, ruleQuote.label), " · Berean Standard Bible")),
    h("p", { class: "adp-neighbours" }, runs(neighbours.runs)),
    h("ol", { class: "adp-questions" }, study.questions.map((q, i) => h("li", {},
      art(Art.marks[["shows", "unsaid", "points"][i]], "adp-mark-wrap"),
      h("div", {}, h("strong", {}, q.q), " ", runs(q.then))))),
    h("div", { class: "adp-edge", role: "table", "aria-label": "Each part: what the text reveals, and what it leaves unsaid" },
      h("div", { class: "adp-edge-row adp-edge-head", role: "row" },
        h("span", { role: "columnheader" }, "Part"), h("span", { role: "columnheader" }, "What the text reveals"),
        h("span", { role: "columnheader", "aria-hidden": "true", class: "adp-edge-mid" }), h("span", { role: "columnheader" }, "What it leaves unsaid")),
      edge.map((row) => {
        const part = study.parts.find((p) => p.n === row.n);
        return h("div", { class: "adp-edge-row", role: "row" },
          h("a", { role: "cell", class: "adp-edge-part", href: `#part-${row.n}` }, h("b", {}, row.n), part.title),
          h("div", { role: "cell", class: "adp-edge-said" }, h("q", {}, row.revealed), " ", refLink(row.r)),
          h("span", { role: "cell", class: "adp-edge-mid", "aria-hidden": "true" }),
          h("div", { role: "cell", class: "adp-edge-unsaid" }, h("p", {}, row.unsaid),
            h("small", {}, row.views.length ? ["Shown, not chosen: ", row.views.join(" · ")] : row.shown)));
      })),
    h("p", { class: "adp-note" }, "Each phrase on the left is in the verse beside it, checked by script. The right-hand side is this site's summary of what each part leaves open; the names are those the part quotes."),
  ));

  // ── 01–07 The parts: shown, meant, then the edge and what lies past it ──
  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "quote": return h("figure", { class: "adp-quote" }, h("blockquote", {}, verseText(block.r)), h("figcaption", {}, refLink(block.r, block.label), " · BSB"));
      case "views": return h("div", { class: "adp-views" },
        h("p", { class: "adp-views-head" }, label("Shown, not chosen")),
        h("div", { class: "adp-views-row" }, block.items.map((item) => h("div", { class: "adp-view" }, h("h4", {}, item.label), h("p", {}, runs(item.runs))))));
      default: console.error(`Angels, demons and spiritual powers: unknown block ${block.k}`); return "";
    }
  }
  const subHead = (kind) => h("h3", { class: `adp-sub adp-sub-${kind}` }, art(Art.marks[kind], "adp-mark-wrap"), SUB[kind]);

  function oneLineFigure() {
    return h("figure", { class: "adp-oneline", "aria-label": "Everything named here was created" },
      h("p", { class: "adp-above" }, h("q", {}, oneLine.above), " ", refLink(oneLine.aboveRef)),
      h("div", { class: "adp-oneline-rule", "aria-hidden": "true" }),
      h("ul", { class: "adp-below" }, oneLine.below.map((item) => h("li", {}, h("a", { class: "adp-ref adp-word", href: `?ref=${item.r}`, "data-ref": item.r, title: passages[item.r].label }, item.t)))),
      h("figcaption", {}, "Above the line, the Son, named in words, not drawn. Below it, every power Paul lists, with the angels, the stars and the sons of God from three other books: all on the same side. ", h("q", {}, oneLine.rule), " ", refLink(oneLine.ruleRef)));
  }
  function orderFigure() {
    return h("figure", { class: "adp-order", "aria-label": `${passages[order.r].label} in its own order` },
      h("ol", {}, order.steps.map((step, i) => h("li", { class: i >= 4 ? "is-victory" : "" }, h("span", { class: "adp-step-n" }, String(i + 1)), h("q", {}, step.t), h("small", {}, step.plain)))),
      h("figcaption", {}, "Read ", refLink(order.r), " in its own order: the forgiving comes first, and the powers are disarmed by the same cross. The order is checked by script: each phrase follows the one before it in the verses."));
  }

  const parts = h("div", { class: "adp-parts" });
  study.parts.forEach((part) => {
    const subs = Object.fromEntries(part.subs.map((s) => [s.kind, s]));
    parts.append(h("section", { class: "t-sec adp-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "adp-part-head" },
        h("span", { class: "adp-n", "aria-hidden": "true" }, part.n),
        h("div", { class: "adp-part-title" },
          h("h2", { id: `part-${part.n}-title` }, part.title),
          h("div", { class: "adp-hook" }, part.hook.map(renderBlock)),
          h("p", { class: "adp-readings" }, label("Main readings"), " ", part.readings.map((item, i) => [i ? " · " : "", refLink(item.r, item.t)]))),
        art(Art.parts[part.n], "adp-mini-wrap")),
      part.n === "01" ? oneLineFigure() : null,
      part.n === "06" ? orderFigure() : null,
      h("div", { class: "adp-light" },
        h("div", { class: "adp-col" }, subHead("shows"), subs.shows.blocks.map(renderBlock)),
        h("div", { class: "adp-col" }, subHead("means"), subs.means.blocks.map(renderBlock))),
      h("div", { class: "adp-stop", role: "separator", "aria-label": "Here the text stops" }, h("span", {}, "Here the text stops")),
      h("div", { class: "adp-veil" }, subHead("unsaid"), subs.unsaid.blocks.map(renderBlock)),
      h("div", { class: "adp-points" },
        h("p", { class: "adp-points-head" }, art(Art.marks.points, "adp-mark-wrap"), "Where it points"),
        h("dl", { class: "adp-ask" },
          h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
          h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect))))),
    ));
  });
  page.append(parts);

  // ── Close: the hills again, Romans 8, and the question ──
  const [closeStory, closeQuote, question, again] = study.close.blocks;
  page.append(h("section", { class: "t-sec adp-close", id: "close" },
    art(Art.close, "adp-close-art"),
    sectionHead("→", "The question", "for your life."),
    h("p", { class: "adp-close-story" }, runs(closeStory.runs)),
    h("figure", { class: "adp-nothing", "aria-label": "What Romans 8 says cannot separate us" },
      h("ul", { class: "adp-pairs" }, notSeparate.pairs.map((pair) => h("li", {}, pair.map((w, i) => [i ? h("span", { class: "adp-nor", "aria-hidden": "true" }) : null, h("span", {}, w)])))),
      h("p", { class: "adp-centre" }, notSeparate.centre),
      h("blockquote", {}, verseText(closeQuote.r)),
      h("figcaption", {}, refLink(closeQuote.r, closeQuote.label), " · Berean Standard Bible. Angels, principalities and powers are on Paul's list of things that cannot reach you.")),
    h("p", { class: "adp-question" }, runs(question.runs)),
    h("p", { class: "adp-again" }, runs(again.runs)),
    h("div", { class: "adp-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use))),
      h("p", {}, `${numbers.outsideChecked} of ${numbers.outside} quotations from outside Scripture were found by script in the copies held on this PC. Not checked by script: `, unchecked.map(([q, src]) => [h("q", {}, q), ` (${src})`]), ". ", study.byline, ".")),
    h("a", { class: "adp-back", href: "/study/theology?area=doctrine" }, art(icon("arrowLeft", 16)), "Back to God & Christian Faith"),
  ));

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "adp-sheet", "aria-labelledby": "adp-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    if (!Object.hasOwn(passages, id)) return;
    const item = passages[id];
    sheet.replaceChildren(
      h("div", { class: "adp-sheet-head" }, h("h2", { id: "adp-sheet-title" }, item.label), h("button", { type: "button", class: "adp-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "adp-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "adp-sheet-src" }, "Berean Standard Bible"));
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
    const link = event.target.closest("a.adp-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  const asked = new URLSearchParams(location.search).get("ref");
  if (asked) openSheet(asked, false);
})();
