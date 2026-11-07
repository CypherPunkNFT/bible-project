// Learning to discern, one mock-up page drawn from data.js (built by build-data.py from content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js. A reference in the
// address (?ref=) is looked up in data.js with Object.hasOwn, so an unknown value is simply ignored.
(() => {
  const NAME = "Learning to discern";
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`${NAME}: ${detail}`);
  }
  if (!window.LTD) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.LTD is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.LTDArt) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon or LTDArt is missing");

  const D = window.LTD;
  const { study, passages, numbers } = D;
  const { intro, close } = study;
  const Art = window.LTDArt;

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
  const refLink = (id, text) => h("a", { class: "ltd-ref", href: `?ref=${id}`, "data-ref": id }, text ?? passages[id].label);
  function runs(list) {
    return list.map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "ltd-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, runs(run.b));
      if (run.i) return h("em", {}, run.i);
      if (run.chk) return h("span", { class: "ltd-chk", title: `To confirm before publishing: ${run.chk}` }, "to confirm");
      if ("s" in run) return run.s ? h("a", { class: "ltd-link", href: run.s, title: "Mock-up on this PC" }, run.t) : h("em", { class: "ltd-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }
  const label = (text, extra = "") => h("span", { class: `ltd-label ${extra}` }, text);
  const verseText = (id) => passages[id].verses.map((v) => v[1]).join(" ");
  const partTitle = (n) => study.parts.find((p) => p.n === n).title;
  const toPart = (n) => h("a", { class: "ltd-to-part", href: `#part-${n}`, title: partTitle(n) }, `→ ${n}`);
  // The three-dot mark: which of the study's three questions a part trains, lit in the tone, the rest faint.
  const checkMark = (list) => h("span", { class: "ltd-checkmark", role: "img", "aria-label": `Trains question ${list.join(" and ")} of three` },
    [1, 2, 3].map((n) => h("i", { class: list.includes(n) ? `is-on${n === 3 ? " is-turn" : ""}` : "" })));
  // A verse with some of its words marked: phrases are found in the Berean text itself, never typed here.
  function marked(text, phrases) {
    const spans = phrases.map((p, i) => [text.indexOf(p.t), p.t.length, i, p]).filter(([at]) => at >= 0).sort((a, b) => a[0] - b[0]);
    const out = [];
    let last = 0;
    for (const [at, length, i, p] of spans) {
      if (at < last) continue;
      out.push(text.slice(last, at), h("mark", { class: `ltd-mark ltd-m${i}`, "data-mark": String(i) }, text.slice(at, at + length), p.label ? h("small", {}, p.label) : null));
      last = at + length;
    }
    return [...out, text.slice(last)];
  }

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ltd-page" });
  main.append(page);

  // ── Hero: the standard heading, the motto drawn, four counts ──
  const opening = intro.quotes[0];
  const figures = [
    ["Passages walked", numbers.walked, "each read whole, in its paragraph, not as a verse alone", "Main readings of parts 01–05"],
    ["Verses printed", numbers.versesShown, "in full, word for word the Berean, so you can check them here", "Counted once each; checked by script"],
    ["Wisdom from above", numbers.qualities, "qualities in James 3:17, in his order, purity first", "Found in the verse by script"],
    ["Questions to listen for", numbers.listen, "God, Jesus, the Spirit, Scripture, the gospel", "This site's list, part 06"],
  ];
  page.append(h("section", { class: "ltd-hero", id: "top" },
    h("div", { class: "ltd-intro" },
      h("div", {},
        h("nav", { class: "ltd-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=life" }, "Living the Christian Life"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "ltd-here", "aria-current": "page" }, study.title)),
        h("p", { class: "ltd-concepts" }, intro.concepts.join(" · ")),
        h("h1", {}, D.title[0], " ", h("em", {}, D.title[1])),
        h("p", { class: "ltd-lede" }, runs(intro.lead)),
        h("figure", { class: "ltd-opening" }, h("blockquote", {}, verseText(opening.r)), h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ltd-hero-art" }, art(Art.hero, "ltd-art"), h("figcaption", { class: "ltd-motto" }, h("i"), intro.motto[0], h("br"), h("span", {}, intro.motto[1])))),
    h("dl", { class: "ltd-figures" }, figures.map(([name, value, means, rule]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, means), h("small", { class: "ltd-rule" }, rule)))),
    h("nav", { class: "ltd-toc", "aria-label": "On this page" },
      h("a", { href: "#habit" }, h("b", {}, "00"), "One habit, three questions"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title)),
      h("a", { href: "#asked" }, h("b", {}, "?"), "Questions readers ask"),
      h("a", { href: "#close" }, h("b", {}, "→"), "Learning to discern"))));

  const sectionHead = (number, title, turn, lead) => h("header", { class: "ltd-head" },
    h("span", { class: "ltd-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead ? h("p", {}, lead) : null));

  // ── 00 One habit, three questions: a claim's line through three stations; the third turns back ──
  const reading = h("p", { class: "ltd-reading", "aria-live": "polite" });
  const showCheck = (c) => reading.replaceChildren(h("b", {}, `${c.n} · ${c.name}`), " ", ...c.verses.flatMap((v) => [h("q", {}, verseText(v.r)), " ", h("span", { class: "ltd-reading-ref" }, passages[v.r].label), " "]));
  const stations = h("ol", { class: "ltd-stations" }, D.checks.map((c) => h("li", { class: `ltd-station${c.n === 3 ? " is-turn" : ""}`, tabindex: "0", onmouseenter: () => showCheck(c), onfocus: () => showCheck(c) },
    h("span", { class: "ltd-station-dot", "aria-hidden": "true" }),
    label(`${c.n} · ${c.name}`),
    h("p", { class: "ltd-ask" }, c.ask),
    h("p", { class: "ltd-means" }, c.means),
    h("p", { class: "ltd-station-verses" }, c.verses.map((v, i) => [i ? " · " : "", h("q", {}, v.t), " ", refLink(v.r)])),
    h("p", { class: "ltd-station-parts" }, Object.entries(D.partChecks).filter(([, list]) => list.includes(c.n)).map(([n]) => toPart(n))))));
  showCheck(D.checks[0]);
  page.append(h("section", { class: "t-sec ltd-habit", id: "habit" },
    sectionHead("00", "One habit,", "three questions.", "Hear the claim. Then ask, in this order, what it says about Jesus, whether the passage says so, and what is driving you as you judge it."),
    h("p", { class: "ltd-frame" }, runs(intro.frame)),
    h("figure", { class: "ltd-claim", "aria-label": "The three questions, in order" },
      h("figcaption", { class: "ltd-fig-q" }, h("strong", {}, "What do the letters test, and in what order?"), " The message, then the Scriptures, then the one doing the testing. Point at a question to read its verses below; choose a number to go to the part that trains it."),
      h("div", { class: "ltd-claim-row" },
        h("p", { class: "ltd-claim-start" }, label("A claim you hear"), h("span", {}, "a voice, a book, a sermon, a neighbour at the door")),
        stations),
      reading,
      h("p", { class: "ltd-together" }, label("Both at once"), "Part 05 asks the first and third questions together: ", h("q", {}, D.together.t), " ", toPart(D.together.part))),
    h("aside", { class: "ltd-selection" }, label("This is a selection"), h("p", {}, runs(intro.selection)))));

  // ── Each part's own figure ──
  function clauses() {
    const C = D.clauses;
    return h("figure", { class: "ltd-clauses", "aria-label": "1 John 4:2–3 as two clauses" },
      h("figcaption", { class: "ltd-fig-q" }, h("strong", {}, "What does John's test ask about?"), " Who Jesus is. Two clauses, two outcomes, and nothing about how impressive the speaker is."),
      h("ol", {}, C.items.map((c, i) => h("li", { class: i ? "is-not" : "is-yes" }, h("q", {}, c.t), h("span", { class: "ltd-arrow", "aria-hidden": "true" }), h("strong", {}, c.then), refLink(c.r)))),
      h("p", { class: "ltd-ground" }, label("Where the testers stand"), h("q", {}, C.ground.t), " ", refLink(C.ground.r)));
  }
  function messengers() {
    const M = D.messengers;
    return h("figure", { class: "ltd-messengers", "aria-label": "Galatians 1:8–9: who is under the warning" },
      h("figcaption", { class: "ltd-fig-q" }, h("strong", {}, "Who is under the warning?"), " Paul, an angel, anyone. The line they are measured against stays where it is."),
      h("ul", { class: "ltd-who" }, M.who.map((w) => h("li", {}, h("span", { class: "ltd-who-dot", "aria-hidden": "true" }), h("q", {}, w.t), h("small", {}, w.gloss), refLink(w.r)))),
      h("p", { class: "ltd-fixed" }, M.line.map((l, i) => [i ? h("span", { class: "ltd-sep", "aria-hidden": "true" }, "·") : null, h("q", {}, l.t), " ", refLink(l.r)])),
      h("p", { class: "ltd-verdict" }, label("For any of them"), h("q", {}, M.verdict.t), " ", refLink(M.verdict.r)));
  }
  function widen() {
    const W = D.widen;
    const body = h("div", { class: "ltd-widen-text", "aria-live": "polite" });
    const buttons = W.steps.map((s, i) => h("button", { type: "button", class: "ltd-step", "aria-pressed": i === 0 ? "true" : "false", onclick: () => show(i) }, h("b", {}, String(i + 1)), s.t, h("small", {}, passages[s.r].label)));
    function show(i) {
      buttons.forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
      body.replaceChildren(...passages[W.steps[i].r].verses.map(([cv, text]) => {
        const own = W.halves.filter((x) => passages[x.r].verses.some((v) => v[0] === cv)).map((x) => ({ t: x.t, label: x.label }));
        return h("span", { class: `ltd-v${passages[W.focus].verses[0][0] === cv ? " is-focus" : ""}` }, h("sup", {}, cv.split(":")[1]), " ", marked(text, own), " ");
      }));
    }
    show(0);
    return h("figure", { class: "ltd-widen", "aria-label": "Acts 17:11, then its paragraph, then the account it belongs to" },
      h("figcaption", { class: "ltd-fig-q" }, h("strong", {}, "What changes when you read around a verse?"), " The verse compares Berea with Thessalonica; only the account around it shows what that comparison means. Widen the view one step at a time."),
      h("div", { class: "ltd-steps", role: "group", "aria-label": "How much to read" }, buttons), body);
  }
  function wisdoms() {
    const W = D.wisdom;
    const verse = h("p", { class: "ltd-wis-verse" });
    const light = (t) => verse.replaceChildren(...marked(verseText(W.above), t ? [{ t }] : []), " ", refLink(W.above));
    const quality = (t, n) => h("li", { tabindex: "0", onmouseenter: () => light(t), onfocus: () => light(t), onmouseleave: () => light(null) }, h("span", { class: "ltd-q-n" }, String(n)), t);
    light(null);
    return h("figure", { class: "ltd-wisdoms", "aria-label": "James 3:14–17: two wisdoms" },
      h("figcaption", { class: "ltd-fig-q" }, h("strong", {}, "What does wisdom from above look like?"), " Purity comes first, so peace is never bought by pretending; then the rest, so truth is never a licence for harshness. Point at a quality to find it in the verse."),
      h("div", { class: "ltd-wis-row" },
        h("div", { class: "ltd-below" }, label("Does not come from above"), h("ul", {}, W.below.map((b) => h("li", {}, h("q", {}, b.t), " ", refLink(b.r))))),
        h("div", { class: "ltd-above" }, label("The wisdom from above"),
          h("div", { class: "ltd-first" }, h("small", {}, "first of all"), h("ol", { class: "ltd-qualities" }, quality(W.first, 1))),
          h("div", { class: "ltd-then" }, h("small", {}, "then"), h("ol", { class: "ltd-qualities", start: "2" }, W.then.map((t, i) => quality(t, i + 2)))))),
      verse);
  }
  function marksFigure(items) {
    const M = D.marks;
    const text = h("p", { class: "ltd-marks-text" }, passages[M.r].verses.map(([cv, t]) => [h("sup", {}, cv.split(":")[1]), " ", marked(t, M.items.filter((m) => passages[m.r].label.endsWith(cv)).map((m) => ({ t: m.t }))), " "]));
    // marked() numbers marks per verse; renumber them in passage order so each matches its item.
    text.querySelectorAll("mark").forEach((m, i) => m.setAttribute("data-mark", String(i)));
    const lit = (i) => text.querySelectorAll("mark").forEach((m) => m.classList.toggle("is-lit", m.dataset.mark === String(i)));
    return h("figure", { class: "ltd-marks", "aria-label": "2 Peter 2:1–3 with Peter's five marks" },
      h("figcaption", { class: "ltd-fig-q" }, h("strong", {}, "Where are the marks in Peter's words?"), " All five are in three verses. Point at a mark to light its words in the passage."),
      h("div", { class: "ltd-marks-row" },
        h("ol", { class: "ltd-marks-list" }, items.map((item, i) => h("li", { tabindex: "0", onmouseenter: () => lit(i), onfocus: () => lit(i), onmouseleave: () => lit(-1) }, h("h4", {}, item.label), h("p", {}, runs(item.runs))))),
        h("div", { class: "ltd-marks-passage" }, text, h("p", { class: "ltd-cap" }, refLink(M.r), " · Berean Standard Bible"))));
  }
  function listenFigure(items) {
    const from = Object.fromEntries(D.listen.map((x) => [x.label, x.part]));
    return h("figure", { class: "ltd-listen", "aria-label": "What to listen for" },
      h("ol", {}, items.map((item, i) => h("li", {}, h("span", { class: "ltd-listen-n" }, String(i + 1)), h("h4", {}, item.label), h("p", {}, runs(item.runs)),
        from[item.label] ? h("a", { class: "ltd-back-to", href: `#part-${from[item.label]}` }, `from part ${from[item.label]}`) : h("span", { class: "ltd-back-to" }, "asked here")))));
  }
  const FIGURES = { "01": [[1, clauses]], "02": [[1, messengers]], "03": [[2, widen]], "04": [[1, wisdoms]] };
  const NOTE = { care: "With care", read: "How this study reads it", open: "Shown, not chosen" };

  function renderBlock(block, n) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "quote": return h("figure", { class: "ltd-quote" }, h("blockquote", {}, verseText(block.r)), h("figcaption", {}, refLink(block.r, block.label), " · BSB"));
      case "care": case "read": case "open": return h("aside", { class: `ltd-note is-${block.k}` }, label(NOTE[block.k]), h("p", {}, runs(block.runs)));
      case "list": return n === "05" ? marksFigure(block.items) : listenFigure(block.items);
      default: console.error(`${NAME}: unknown block ${block.k}`); return "";
    }
  }

  const parts = h("div", { class: "ltd-parts" });
  study.parts.forEach((part) => {
    const figs = FIGURES[part.n] ?? [];
    parts.append(h("section", { class: "t-sec ltd-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("aside", { class: "ltd-rail" },
        h("span", { class: "ltd-n", "aria-hidden": "true" }, part.n),
        checkMark(D.partChecks[part.n]),
        h("span", { class: "ltd-rail-ask" }, D.partChecks[part.n].map((c) => D.checks[c - 1].ask).join(" · ")),
        art(Art.parts[part.n], "ltd-mini-wrap")),
      h("div", { class: "ltd-part-main" },
        h("h2", { id: `part-${part.n}-title` }, part.title),
        h("p", { class: "ltd-hook" }, runs(part.hook)),
        h("p", { class: "ltd-readings" }, label("Main readings"), " ", part.readings.map((r, i) => [i ? " · " : "", refLink(r.r, r.t), r.carried ? h("small", {}, " carried forward") : null])),
        part.subs.map((sub, i) => [h("h3", { class: "ltd-sub" }, sub.title), sub.blocks.map((b) => renderBlock(b, part.n)), figs.filter(([at]) => at === i).map(([, draw]) => draw())]),
        h("dl", { class: "ltd-askback" },
          h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
          h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect)))))));
  });
  page.append(parts);

  // ── Questions readers ask: open in place, joined by rules, not boxes ──
  page.append(h("section", { class: "t-sec ltd-asked", id: "asked" },
    sectionHead("?", "Questions", "readers ask."),
    h("div", { class: "ltd-qs" }, study.questions.map((q) => h("details", {}, h("summary", {}, q.q), q.blocks.map((b) => renderBlock(b, "questions")))))));

  // ── Close: the habit, the question, and the passage read whole ──
  page.append(h("section", { class: "t-sec ltd-close", id: "close" },
    art(Art.close, "ltd-close-art"),
    sectionHead("→", "Learning", "to discern."),
    h("p", { class: "ltd-way" }, runs(close.way)),
    h("ol", { class: "ltd-recap" }, D.checks.map((c) => h("li", { class: c.n === 3 ? "is-turn" : "" }, h("b", {}, String(c.n)), c.ask))),
    h("p", { class: "ltd-close-text" }, runs(close.close)),
    h("p", { class: "ltd-invite" }, runs(close.invite)),
    h("p", { class: "ltd-question" }, label("Your question"), runs(close.question)),
    h("p", { class: "ltd-again" }, runs(close.again)),
    h("figure", { class: "ltd-passage" }, h("blockquote", {}, passages[close.passage].verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), " ", text, " "))),
      h("figcaption", {}, refLink(close.passage), " · Berean Standard Bible. The passage this study began its parts with, whole.")),
    h("div", { class: "ltd-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, D.sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use))),
      h("details", {}, h("summary", {}, `Quotations from outside Scripture: ${numbers.outside}, of which ${numbers.outsideHeld} were checked by script`),
        h("ul", {}, D.outside.map((o) => h("li", {}, h("q", {}, o.t), " ", h("span", { class: "ltd-from" }, `${o.from} · ${o.checked ? "checked by script" : "not held here; compare by eye"}`))))),
      h("details", {}, h("summary", {}, `Still to confirm before publishing: ${numbers.openChecks} points, each marked “to confirm” in the text`),
        h("ul", {}, D.openChecks.map((c) => h("li", {}, h("b", {}, `Part ${c.part}. `), c.note))))),
    h("a", { class: "ltd-back", href: "/study/theology?area=life" }, art(icon("arrowLeft", 16)), "Back to Living the Christian Life")));

  // ── The verse sheet, from the right ──
  const sheet = h("dialog", { class: "ltd-sheet", "aria-labelledby": "ltd-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    if (!Object.hasOwn(passages, id)) return;
    const item = passages[id];
    sheet.replaceChildren(
      h("div", { class: "ltd-sheet-head" }, h("h2", { id: "ltd-sheet-title" }, item.label), h("button", { type: "button", class: "ltd-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "ltd-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "ltd-sheet-src" }, "Berean Standard Bible"));
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
    const link = event.target.closest("a.ltd-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  const asked = new URLSearchParams(location.search).get("ref");
  if (asked) openSheet(asked, false);
})();
