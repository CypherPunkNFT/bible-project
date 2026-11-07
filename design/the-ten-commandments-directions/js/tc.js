// The Ten Commandments, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js and the frame's icons.
// Values in the address (?ref=, ?count=, ?take=) are looked up in data.js, so an unknown value is simply ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`The Ten Commandments: ${detail}`);
  }
  if (!window.TC) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.TC is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.TCArt) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon or TCArt is missing");

  const { study, passages, notes, givings, givenUnder, ten, takes, week, practice, numbers, sources, title } = window.TC;
  const WAYS = [["2", "jewish", "Jewish"], ["3", "protestant", "Most Protestants, Orthodox"], ["4", "catholic", "Catholic, Lutheran"]];

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
    holder.innerHTML = markup; // fixed drawings from art.js and the frame's icons only
    return holder;
  }
  const param = (name) => new URLSearchParams(location.search).get(name);
  function setParam(name, value) {
    const query = new URLSearchParams(location.search);
    if (value) query.set(name, value); else query.delete(name);
    const text = query.toString();
    history.replaceState(null, "", `${location.pathname}${text ? `?${text}` : ""}${location.hash}`);
  }
  const refLink = (id, text) => h("a", { class: "tc-ref", href: `?ref=${encodeURIComponent(id)}`, "data-ref": id }, text || passages[id].label);
  let markCount = 0;
  function mark(index) {
    const note = notes[index];
    const id = `tc-note-${++markCount}`;
    const text = h("span", { class: "tc-mark-text", id, hidden: true }, note.kind === "issue" ? "Editor: " : "To check: ", note.t);
    const button = h("button", { type: "button", class: `tc-mark is-${note.kind}`, "aria-expanded": "false", "aria-controls": id,
      "aria-label": note.kind === "issue" ? "Editor's note found by the build" : "Editor's check note",
      onclick: () => { text.hidden = !text.hidden; button.setAttribute("aria-expanded", String(!text.hidden)); } },
    note.kind === "issue" ? "!" : "?");
    return [button, text];
  }
  function runs(list) {
    return (list || []).map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "tc-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if ("c" in run) return mark(run.c);
      if ("s" in run) return run.s ? h("a", { class: "tc-link", href: run.s, title: "Mock-up on this PC" }, h("em", {}, run.t)) : h("em", { class: "tc-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }
  const label = (text, extra = "") => h("span", { class: `tc-label ${extra}` }, text);

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap tc-page" });
  main.append(page);

  // ── Hero: the standard heading ──
  const opening = study.opening[0];
  const sameLines = givings.filter((g) => !g.dtOnly && !g.exOnly).length;
  const figures = [
    ["Words", numbers.words, "on two stones; each of the three ways of counting comes to ten"],
    ["Given twice", `${sameLines} of ${givings.length}`, "lines word for word the same in Exodus 20 and Deuteronomy 5"],
    ["Ways of counting", numbers.ways, "the same verses, with the lines drawn in different places"],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
  ];
  page.append(h("section", { class: "tc-hero", id: "top" },
    h("div", { class: "tc-intro" },
      h("div", {},
        h("nav", { class: "tc-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "tc-here", "aria-current": "page" }, study.title)),
        h("p", { class: "tc-concepts" }, study.concepts.join(" · ")),
        h("h1", {}, title[0], " ", h("em", {}, title[1])),
        h("p", { class: "tc-subtitle" }, study.subtitle),
        h("p", { class: "tc-lede" }, runs(study.lead)),
        h("figure", { class: "tc-opening" }, h("blockquote", {}, passages[opening.r].verses.map((v) => v[1]).join(" ")),
          h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "tc-hero-art" }, art(TCArt.hero), h("figcaption", { class: "tc-motto" }, study.motto[0], h("br"), h("span", {}, study.motto[1])))),
    h("dl", { class: "tc-figures" }, figures.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    h("nav", { class: "tc-toc", "aria-label": "On this page" },
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title)),
      h("a", { href: "#close" }, h("b", {}, "→"), study.close.title)),
    h("div", { class: "tc-frame" }, h("p", {}, runs(study.frame)), h("p", { class: "tc-selection" }, label("A selection"), " ", runs(study.selection))),
  ));

  // ── The parts ──
  const wordHeading = {};
  Object.entries(givenUnder).forEach(([heading, list]) => { wordHeading[heading] = list; });
  study.parts.forEach((part) => {
    const body = h("div", { class: "tc-body" });
    if (part.n === "04") body.append(takesFigure());
    part.blocks.forEach((block, index) => {
      body.append(...[renderBlock(block)].flat());
      if (part.n === "02" && index === 0) body.append(stonesFigure());
      if (part.n === "05" && index === 0) body.append(weekFigure());
    });
    body.append(h("div", { class: "tc-ask" },
      h("p", {}, label("Consider"), " ", runs(part.consider)),
      h("p", {}, label("Reflect"), " ", runs(part.reflect))));
    page.append(h("section", { class: "tc-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "tc-part-head" },
        h("span", { class: "tc-n", "aria-hidden": "true" }, part.n),
        art(TCArt.parts[part.n], "tc-mini-wrap"),
        h("div", {}, h("h2", { id: `part-${part.n}-title` }, part.title),
          h("p", { class: "tc-readings" }, label("Main readings"), " ", part.readings.map((id, i) => [i ? " · " : "", refLink(id)])))),
      body));
  });

  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "h3": {
        const list = wordHeading[block.t];
        const head = h("h3", { class: "tc-h3", id: list ? `w-${list[0]}` : null }, list ? h("span", { class: "tc-h3-n" }, list.join(" · ")) : null, block.t);
        return list ? [head, ...list.map(twice)] : head;
      }
      case "quote": return h("figure", { class: "tc-quote" }, h("blockquote", {}, quoteText(block)),
        h("figcaption", {}, refLink(block.r, block.label), " · BSB", block.partial ? ` · ${block.partial}` : ""));
      case "table": return countFigure(block);
      case "care": return h("aside", { class: "tc-note tc-care" }, label("With care"), h("p", {}, runs(block.runs)));
      case "luther": return h("aside", { class: "tc-note tc-other" }, label("Lutheran teaching, not this site's"), h("p", {}, runs(block.runs)));
      case "other": return h("aside", { class: "tc-note tc-other" }, label("Another tradition"), h("p", {}, runs(block.runs)));
      case "open": return h("aside", { class: "tc-note tc-open" }, label("Further reading · not yet written"), h("p", {}, runs(block.runs)));
      default: console.error(`The Ten Commandments: unknown block ${block.k}`); return "";
    }
  }
  // A partial quotation shows the study's own words, which build-data.py proved are the verse up to a sentence's end.
  function quoteText(block) { return block.text || passages[block.r].verses.map((v) => v[1]).join(" "); }

  // Given twice: one word in Exodus and in Deuteronomy, the words that differ marked.
  function twice(n) {
    const g = givings.find((item) => item.n === n);
    const line = (list) => list.map(([text, differs]) => (differs ? h("mark", { class: "tc-diff" }, text) : text)).flatMap((x, i) => (i ? [" ", x] : [x]));
    if (!g.dtOnly && !g.exOnly) {
      return h("p", { class: "tc-twice is-same" }, label("Given twice"), " ", refLink(g.exR, g.ex), " and ", refLink(g.dtR, g.dt), ": the same words in both.");
    }
    return h("figure", { class: "tc-twice" },
      h("figcaption", {}, label("Given twice"), ` ${g.same} of Deuteronomy's ${g.dtWords} words stand where Exodus has them.${g.wholeVerses ? " One pair of verses gives a different reason and is marked whole." : ""} Marked: words that differ.`),
      h("p", {}, h("span", { class: "tc-twice-src" }, refLink(g.exR, g.ex)), line(g.exRuns)),
      h("p", {}, h("span", { class: "tc-twice-src" }, refLink(g.dtR, g.dt)), line(g.dtRuns)));
  }

  // 01: the three ways of counting, drawn on the study's own table.
  function countFigure(block) {
    const figure = h("figure", { class: "tc-count tc-wide" });
    const heads = block.head;
    const table = h("table", {},
      h("caption", {}, "The same eleven lines of Exodus 20, counted three ways. Choose a way: its numbers join or split the lines."),
      h("thead", {}, h("tr", {}, h("th", { scope: "col", class: "tc-brace-h" }, h("span", { class: "tc-sr" }, "Chosen count")), heads.map((t, i) => h("th", { scope: "col", "data-col": i }, t)))),
      h("tbody", {}, block.rows.map((row, r) => h("tr", {},
        h("td", { class: "tc-brace", "data-row": r }),
        h("td", { "data-col": 0 }, row.what),
        h("td", { "data-col": 1 }, refLink(row.r, row.v)),
        row.counts.map((c, i) => h("td", { "data-col": i + 2 }, c))))));
    const buttons = WAYS.map(([col, slug, name]) => h("button", { type: "button", class: "tc-way", "aria-pressed": "false", "data-col": col, onclick: () => choose(col, true) }, name));
    function choose(col, push) {
      figure.dataset.way = col;
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.col === col)));
      const ways = block.ways[col];
      table.querySelectorAll(".tc-brace").forEach((cell) => {
        const r = Number(cell.dataset.row);
        const mine = ways[r], before = ways[r - 1] || [], after = ways[r + 1] || [];
        const joinUp = mine.length === 1 && before.length === 1 && before[0] === mine[0];
        const joinDown = mine.length === 1 && after.length === 1 && after[0] === mine[0];
        cell.className = `tc-brace${joinUp ? " up" : ""}${joinDown ? " down" : ""}${mine.length > 1 ? " split" : ""}${!mine.length ? " pre" : ""}`;
        cell.textContent = !mine.length ? "preface" : joinUp ? "" : mine.join(" · ");
      });
      if (push) setParam("count", WAYS.find((w) => w[0] === col)[1]);
    }
    choose((WAYS.find((w) => w[1] === param("count")) || WAYS[1])[0], false);
    figure.append(h("div", { class: "tc-ways", role: "group", "aria-label": "Ways of counting" }, buttons), table,
      h("p", { class: "tc-fig-note" }, "Each way comes to ten: the build checks every column runs 1 to 10, in order. This study follows the second way."));
    return figure;
  }

  // 02: the two stones, words one to four and five to ten, each going to its place in the reading.
  function stonesFigure() {
    const stone = (n, words) => h("div", { class: `tc-stone tc-stone-${n}` },
      h("p", { class: "tc-stone-h" }, n === 1 ? "Love for God" : "Love for neighbour"),
      h("ol", {}, words.map((w) => h("li", { value: w.n }, h("a", { href: `#w-${headingFor(w.n)}`, class: "tc-stone-word" }, h("b", {}, String(w.n)), w.short)))));
    const pre = ten.find((w) => w.n === 0);
    return h("figure", { class: "tc-stones-fig", "aria-label": "The ten words on two stones" },
      h("p", { class: "tc-lintel" }, label("Before the first word"), " ", h("span", {}, passages[pre.exR].verses[0][1].replace(/^“/, "")), " ", refLink(pre.exR, pre.ex)),
      h("div", { class: "tc-stones" }, stone(1, ten.filter((w) => w.stone === 1)), stone(2, ten.filter((w) => w.stone === 2))),
      h("figcaption", {}, "The two-table picture is the study's way of teaching, following Jesus' summary; Exodus does not say how the words were divided. Choose a word to read it."));
  }
  function headingFor(n) {
    const entry = Object.values(givenUnder).find((list) => list.includes(n));
    return entry ? entry[0] : n;
  }

  // 04: which of the ten words each passage takes up.
  function takesFigure() {
    const cells = ten.filter((w) => w.n).map((w) => h("li", { "data-n": w.n, class: `tc-cell s${w.stone}` }, h("b", {}, String(w.n)), h("span", {}, w.short)));
    const said = h("div", { class: "tc-takes-said", "aria-live": "polite" });
    const buttons = takes.map((t) => h("button", { type: "button", class: "tc-way", "aria-pressed": "false", "data-id": t.id, onclick: () => choose(t.id, true) }, t.name));
    const figure = h("figure", { class: "tc-takes tc-wide" });
    function choose(id, push) {
      const item = takes.find((t) => t.id === id);
      figure.dataset.colour = item.colour;
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
      const lit = new Set(item.marks.flatMap((m) => m.words));
      cells.forEach((c) => c.classList.toggle("is-lit", lit.has(Number(c.dataset.n))));
      said.replaceChildren(h("p", { class: "tc-takes-line" }, item.line),
        h("ul", {}, item.marks.map((m) => h("li", {}, h("q", {}, m.phrase), " ", refLink(m.r, m.ref), ` · word${m.words.length > 1 ? "s" : ""} ${m.words.length > 2 ? `${m.words[0]}–${m.words.at(-1)}` : m.words.join(", ")}`))));
      if (push) setParam("take", id);
    }
    figure.append(h("figcaption", {}, h("span", { class: "tc-q" }, "Which of the ten does each passage take up?"), " Choose a passage."),
      h("div", { class: "tc-ways", role: "group", "aria-label": "Passages" }, buttons),
      h("ol", { class: "tc-row" }, cells), said);
    choose((takes.find((t) => t.id === param("take")) || takes[0]).id, false);
    return figure;
  }

  // 05: the week, from the first day to the seventh, with the verses and the practices set at the day they speak of.
  function weekFigure() {
    const column = (day) => h("div", { class: `tc-day tc-day-${day}` },
      h("p", { class: "tc-day-name" }, day === 7 ? "The seventh day" : "The first day", h("small", {}, day === 7 ? "Sabbath · sunset Friday to sunset Saturday" : "The Lord's Day · Sunday")),
      h("ul", { class: "tc-pins" }, week.filter((p) => p.day === day).map((p) => h("li", {}, refLink(p.r, p.ref), h("span", {}, p.say)))),
      h("ul", { class: "tc-keeps" }, practice.filter((p) => p.day === day).map((p) => h("li", {}, h("b", {}, p.who), h("span", {}, `${p.kind} · “${p.phrase}”`)))));
    return h("figure", { class: "tc-week tc-wide" },
      h("figcaption", {}, h("span", { class: "tc-q" }, "Which day, and why?"), " Verses above the line, practices below it. Practices are shown, not ranked."),
      h("div", { class: "tc-week-line" }, column(1),
        h("div", { class: "tc-midweek", "aria-hidden": "true" }, [2, 3, 4, 5, 6].map((d) => h("span", {}, String(d)))), column(7)),
      h("p", { class: "tc-fig-note" }, "Revelation 1:10 says “the Lord’s day”; setting it on the first day is the study's reading. Each phrase is checked: the verse's in the Berean, the practice's in the study's own text."));
  }

  // ── Close ──
  const close = study.close;
  const [inkTitle, turn] = close.title.split(/,\s*/);
  const passage = passages[close.passage];
  const verse = (cv, text) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " ");
  const byVerse = (from, to) => passage.verses.filter(([cv]) => { const v = Number(cv.split(":")[1]); return v >= from && v <= to; }).map(([cv, t]) => verse(cv, t));
  page.append(h("section", { class: "tc-close", id: "close" },
    h("header", { class: "tc-close-head" }, h("h2", {}, `${inkTitle}, `, h("em", {}, turn))),
    h("div", { class: "tc-close-grid" },
      h("div", {},
        h("p", {}, runs(close.close)),
        h("p", { class: "tc-way-p" }, runs(close.way)),
        h("p", { class: "tc-invite" }, label("This site's own word"), " ", runs(close.invite)),
        h("p", { class: "tc-question" }, runs(close.question)),
        h("p", { class: "tc-again" }, runs(close.again))),
      h("figure", { class: "tc-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage, passage.label), " · BSB"),
        h("p", { class: "tc-passage-pre" }, byVerse(1, 2)),
        h("div", { class: "tc-passage-stones" }, h("p", {}, byVerse(3, 11)), h("p", {}, byVerse(12, 17))))),
    h("div", { class: "tc-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use)))),
    h("a", { class: "tc-back", href: "/study/theology?area=doctrine" }, art(icon("arrowLeft", 16)), "Back to God & Christian Faith")));

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "tc-sheet", "aria-labelledby": "tc-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    const item = passages[id];
    if (!item) return;
    sheet.replaceChildren(
      h("div", { class: "tc-sheet-head" }, h("h2", { id: "tc-sheet-title" }, item.label), h("button", { type: "button", class: "tc-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "tc-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "tc-sheet-src" }, "Berean Standard Bible"));
    if (!sheet.open) sheet.showModal();
    if (push) setParam("ref", id);
  }
  sheet.addEventListener("close", () => { setParam("ref", null); opener?.focus(); opener = null; });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.tc-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  const asked = param("ref");
  if (asked && passages[asked]) openSheet(asked, false);
})();
