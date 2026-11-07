// The kingdom he announced, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js and the shared icons.
// Values read from the address (?ref=, ?tense=) are looked up in Maps, so an unknown value is simply ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.style.cssText = "padding:2rem;font:1rem serif";
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`The kingdom he announced: ${detail}`);
  }
  const data = window.KH;
  if (!data || !data.study || !data.passages || !Array.isArray(data.tenses)) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.KH is missing or incomplete");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.KHArt) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon or KHArt is missing");

  const { study, numbers, sources, checks } = data;
  const passages = new Map(Object.entries(data.passages));
  const tenses = new Map(data.tenses.map((row) => [row.id, row]));
  const kinds = new Map(data.kinds);

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
    holder.innerHTML = markup; // fixed drawings from art.js and shared icons only
    return holder;
  }
  const label = (text) => h("span", { class: "kh-label" }, text);
  const refLink = (id, text) => passages.has(id) ? h("a", { class: "kh-ref", href: `?ref=${encodeURIComponent(id)}`, "data-ref": id }, text || passages.get(id).label) : text;
  const verseText = (id) => passages.get(id).verses.map((v) => v[1]).join(" ");
  const SAFE = /^\/(?![/\\])[A-Za-z0-9._~/?=&#%-]*$/;
  function runs(list = []) {
    return list.map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return SAFE.test(run.a) ? h("a", { class: "kh-link", href: run.a }, run.t) : run.t;
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if (run.chk) return h("a", { class: "kh-chk", href: `#check-${run.chk}`, "aria-label": `Note ${run.chk}: still to be checked` }, String(run.chk));
      if ("s" in run) return run.s && SAFE.test(run.s) ? h("a", { class: "kh-link", href: run.s, title: "Mock-up on this PC" }, h("em", {}, run.t)) : h("em", { class: "kh-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page kh-page" });
  main.append(page);

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));

  // ── Hero: the standard heading ──
  const opening = study.opening[0];
  const figures = [
    ["Passages walked", numbers.walked, "from Isaiah's runner to the shut door; others are quoted, not walked"],
    ["Sayings by tense", numbers.sayings, `kingdom sayings set out on ${numbers.lines} lines, one for each part`],
    ["Matthew 13", `${numbers.matthew13Kingdom} of ${numbers.matthew13Verses}`, "verses name the kingdom in the chapter part 03 reads whole"],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
  ];
  page.append(h("section", { class: "t-sec-landing kh-hero", id: "top" },
    h("div", { class: "hc-intro kh-intro" },
      h("div", {},
        h("nav", { class: "kh-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=jesus" }, "Jesus Christ"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "kh-here", "aria-current": "page" }, study.title)),
        h("p", { class: "kh-concepts" }, study.concepts.join(" · ")),
        h("h1", {}, "The kingdom ", h("em", {}, "he announced")),
        h("p", { class: "kh-subtitle" }, study.subtitle),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "kh-opening" }, h("blockquote", {}, verseText(opening.r)),
          h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art kh-hero-art" }, art(KHArt.hero), h("span", { class: "ms-art-note" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1]))),
    ),
    h("dl", { class: "kh-figures" }, figures.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    h("nav", { class: "kh-toc", "aria-label": "On this page" },
      h("a", { href: "#tenses" }, h("b", {}, "00"), "The tenses"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.saying || p.title)),
      h("a", { href: "#questions" }, h("b", {}, "?"), "Questions"),
      h("a", { href: "#close" }, h("b", {}, "→"), "Close")),
  ));

  // ── 00 The kingdom in its tenses: one line per part, set like a verb in a grammar book ──
  const printed = h("div", { class: "kh-printed", "aria-live": "polite" }, h("p", { class: "kh-printed-hint" }, "Choose a verb to read it in its own sentence."));
  const verbButtons = [];
  function showVerb(row, verb, push = true) {
    const text = verseText(verb.r);
    const [from, to] = verb.at;
    printed.replaceChildren(
      h("p", { class: "kh-printed-name" }, label(`${row.name} · part ${row.part}`)),
      h("blockquote", {}, text.slice(0, from), h("mark", {}, text.slice(from, to)), text.slice(to)),
      h("p", { class: "kh-printed-foot" }, refLink(verb.r, verb.ref), " · Berean Standard Bible · ", h("a", { class: "kh-link", href: `#part-${row.part}` }, `Read part ${row.part}`)));
    verbButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.key === `${row.id}:${verb.ref}`)));
    if (push) setParam("tense", row.id === "come" && verb.ref.startsWith("Luke 17") ? "midst" : row.id);
  }
  const conj = h("table", { class: "kh-conj" },
    h("caption", { class: "kh-sr" }, "The kingdom in its tenses: each part's saying, its verb, its sentence and how this study reads it"),
    h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Part"), h("th", { scope: "col" }, "The verb"), h("th", { scope: "col" }, "In its sentence"), h("th", { scope: "col" }, "How this study reads it"))),
    h("tbody", {}, data.tenses.map((row) => h("tr", { id: `tense-${row.id}` },
      h("th", { scope: "row" }, h("a", { class: "kh-conj-part", href: `#part-${row.part}` }, h("b", {}, row.part), row.name)),
      h("td", { class: "kh-conj-verbs" }, row.verbs.map((verb) => {
        const button = h("button", { type: "button", class: "kh-verb", "aria-pressed": "false", "data-key": `${row.id}:${verb.ref}`, onclick: () => showVerb(row, verb) }, verb.verb);
        verbButtons.push(button);
        return button;
      })),
      h("td", { class: "kh-conj-clause" }, row.verbs.map((verb) => h("p", {}, h("q", {}, verb.clause), " ", refLink(verb.r, verb.ref),
        verb.differ ? h("span", { class: "kh-differ" }, label("Readers differ"), " ", verb.differ) : null))),
      h("td", { class: "kh-conj-reads" }, row.reads)))));
  page.append(h("section", { class: "t-sec kh-tenses", id: "tenses" },
    sectionHead("00", "The kingdom", "in its tenses.", "Listen for the tense before you decide what a saying means."),
    h("p", { class: "kh-frame" }, runs(study.frame)),
    conj, printed,
    h("p", { class: "kh-note" }, "The six lines were chosen to give each part its saying; they are not a count of every kingdom saying. The names in the first column and the last are this page's reading aids, in the study's words, not words the verses use. ", runs(study.selection))));

  // ── 01–06 The parts: the reading in one column, the study's own readings in the margin ──
  const MARGIN = new Set(["read", "open", "other"]);
  study.parts.forEach((part) => {
    const row = data.tenses.find((t) => t.part === part.n);
    const body = h("div", { class: "kh-body" });
    let current = null, list = null;
    const addMain = (node) => { current = h("div", { class: "kh-row" }, h("div", { class: "kh-main" }, node)); body.append(current); list = null; };
    part.blocks.forEach((block) => {
      if (block.k === "note" && MARGIN.has(block.kind) && current) {
        let side = current.querySelector(".kh-side");
        if (!side) current.append(side = h("aside", { class: "kh-side" }));
        side.append(h("div", { class: `kh-margin kh-margin-${block.kind}` }, label(block.label), h("p", {}, runs(block.runs))));
      } else if (block.k === "li") {
        if (!list) { const ul = h("ul", { class: "kh-list" }); addMain(ul); list = ul; }
        list.append(h("li", {}, runs(block.runs)));
      } else addMain(renderBlock(block));
    });
    if (part.n === "03") body.prepend(h("div", { class: "kh-row kh-row-wide" }, matthew13()));
    body.append(h("dl", { class: "kh-ask" },
      h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
      h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect)))));
    page.append(h("article", { class: "t-sec kh-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "kh-part-head" },
        h("span", { class: "kh-n", "aria-hidden": "true" }, part.n),
        art(KHArt.parts[part.n], "kh-mini-wrap"),
        h("div", { class: "kh-part-title" },
          h("h2", { id: `part-${part.n}-title` }, part.saying ? h("span", { class: "kh-saying" }, `“${part.saying}”`) : null, " ", h("span", { class: "kh-rest" }, part.rest)),
          h("p", { class: "kh-hook" }, runs(part.hook)),
          h("p", { class: "kh-readings" }, label("Main readings"), " ", part.readings.map((r, i) => [i ? (r.with && !part.readings[i - 1].with ? " · with " : " · ") : "", refLink(r.r, r.t)])),
          row ? h("a", { class: "kh-tag", href: `#tense-${row.id}` }, label("Tense"), " ", h("em", {}, row.verbs.map((v) => v.verb).join(" · ")), ` — ${row.name}`) : null)),
      body));
  });

  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "h3": return h("h3", { class: "kh-h3" }, block.t);
      case "quote": return h("figure", { class: "kh-quote" }, h("blockquote", {}, verseText(block.r)), h("figcaption", {}, refLink(block.r, block.label), " · BSB"));
      case "note": return h("aside", { class: `kh-note-block kh-note-${block.kind.replace(":", "-")}` }, label(block.label), h("p", {}, runs(block.runs)));
      default: console.error(`The kingdom he announced: unknown block ${block.k}`); return "";
    }
  }

  // Matthew 13 as the reader meets it: seven parables placed by verse, by the sea and in the house, in the three
  // kinds the part's own question names. Buttons in chapter order; pointing reads a line into a fixed live region.
  function matthew13() {
    const span = numbers.matthew13Verses;
    const at = (verse) => `${((verse - 1) / span) * 100}%`;
    const width = (from, to) => `${((to - from + 1) / span) * 100}%`;
    const line = h("p", { class: "kh-m13-line", "aria-live": "polite" }, "Point at a parable to read its opening line here; choose it to open the verses.");
    const say = (item) => line.replaceChildren(h("b", {}, item.name), ` · ${kinds.get(item.kind)} · `, h("q", {}, item.opening), ".", item.explained ? ` Jesus explains it himself in ${item.explained.ref}.` : "", item.differ ? ` ${item.differ}` : "");
    const lanes = new Map();
    const button = (item) => {
      const lastEnd = lanes.get(item.kind) ?? { to: -99, lane: 1 };
      const lane = item.from - lastEnd.to < 9 ? 1 - lastEnd.lane : 0;
      lanes.set(item.kind, { to: item.to, lane });
      return h("button", { type: "button", class: `kh-par lane-${lane}${item.explained ? " is-explained" : ""}`, style: `left:${at(item.from)};min-width:${width(item.from, item.to)}`,
        "aria-label": `${item.name}, ${item.ref}, ${kinds.get(item.kind)}${item.explained ? ", explained by Jesus" : ""}. Opens the verses.`,
        onmouseenter: () => say(item), onfocus: () => say(item), onclick: (e) => { opener = e.currentTarget; openSheet(item.r); } },
        h("i", { "aria-hidden": "true" }), h("span", {}, item.name));
    };
    const plot = h("div", { class: "kh-m13-plot" },
      h("div", { class: "kh-m13-axis", "aria-hidden": "true" }, data.marks.map((m) => h("span", { class: `kh-m13-mark mark-${m.id}`, style: `left:${at(m.from)}` }, m.label))),
      data.kinds.map(([kind, name]) => h("div", { class: "kh-m13-row" }, h("span", { class: "kh-m13-kind" }, name),
        h("div", { class: "kh-m13-track" }, data.parables.filter((p) => p.kind === kind).map(button)))),
      h("div", { class: "kh-m13-ticks", "aria-hidden": "true" }, [1, 36, span].map((v) => h("span", { style: `left:${at(v)}` }, `13:${v}`))));
    const home = data.marks.find((m) => m.id === "home");
    const listView = h("ol", { class: "kh-m13-list" }, data.parables.map((item) => h("li", {},
      h("b", {}, item.name), " ", refLink(item.r, item.ref), h("span", { class: "kh-m13-k" }, ` · ${kinds.get(item.kind)}`),
      item.explained ? h("span", { class: "kh-m13-x" }, " · explained by Jesus in ", refLink(item.explained.r, item.explained.ref)) : null)));
    return h("figure", { class: "kh-m13", "aria-labelledby": "kh-m13-q" },
      h("p", { class: "kh-m13-q", id: "kh-m13-q" }, label("Matthew 13 in order"), " Which parables are about hearing, which about growth or worth, and which about the end?"),
      plot, listView, line,
      h("figcaption", {}, h("span", { class: "kh-m13-key" }, h("i", { class: "is-explained", "aria-hidden": "true" }), " A ring marks the three Jesus explains himself."),
        " Seven parables: told by the sea to the crowds, then in the house to the disciples (", refLink(data.marks[1].r, data.marks[1].ref), "). The chapter ends in ", refLink(home.r, home.label.toLowerCase()), ". ", home.reads,
        " The three kinds are the part's own question; the weeds and the net are placed under the end because Jesus' explanations of both are about the end of the age."));
  }

  // ── Questions readers ask: four questions on one thread. Each answer opens in place; one that begins with a care
  // note (the crisis lines) is open from the start, so care is never folded away.
  const isCare = (q) => q.blocks[0] && q.blocks[0].k === "note" && q.blocks[0].kind === "care";
  page.append(h("section", { class: "t-sec kh-questions", id: "questions" },
    sectionHead("?", "Questions", "readers ask.", "Four questions, answered from the same passages. Choose one to open it."),
    h("div", { class: "kh-qs" },
      h("nav", { class: "kh-thread", "aria-label": "The four questions" }, h("ol", {}, study.questions.map((q, i) => h("li", {}, h("a", { href: `#q-${i + 1}`, "data-q": i + 1 }, h("b", {}, String(i + 1).padStart(2, "0")), q.title))))),
      h("div", { class: "kh-answers" }, study.questions.map((q, i) => h("details", { class: "kh-q", id: `q-${i + 1}`, open: isCare(q) },
        h("summary", {}, h("span", { class: "kh-q-n" }, String(i + 1).padStart(2, "0")), h("span", { class: "kh-q-t" }, q.title), h("span", { class: "kh-q-plus", "aria-hidden": "true" })),
        h("div", { class: "kh-q-body" },
          q.texts ? h("p", { class: "kh-readings" }, label("Texts"), " ", q.texts.map((id, j) => [j ? " · " : "", refLink(id)])) : null,
          q.blocks.map((block, j) => [renderBlock(block), q.title === data.waitingQuestion && j === 0 ? waiting() : null]))))))));

  function waiting() {
    return h("figure", { class: "kh-wait" },
      h("figcaption", {}, label("Waiting, in Jesus' own stories")),
      h("ol", {}, data.waiting.map((w) => h("li", {}, h("q", {}, w.phrase), " ", refLink(w.r, w.ref)))));
  }

  // ── Close ──
  const close = study.close;
  page.append(h("section", { class: "t-sec kh-close", id: "close" },
    sectionHead("→", "Listening", "for the tense."),
    h("div", { class: "kh-close-grid" },
      h("div", {},
        h("p", { class: "kh-way" }, runs(close.way)),
        h("ol", { class: "kh-asks", "aria-label": "What each tense asks of you" }, ["Has come", "Is near", "Will be like"].map((tense, i) => h("li", {}, h("em", {}, tense), h("span", {}, data.asks ? data.asks[i] : "")))),
        h("p", { class: "kh-invite" }, runs(close.invite)),
        h("p", { class: "kh-question" }, runs(close.question)),
        h("p", { class: "kh-again" }, runs(close.again))),
      h("figure", { class: "kh-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage), " · BSB"),
        h("p", { class: "kh-passage-text" }, passages.get(close.passage).verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))))),
    art(KHArt.close, "kh-close-art"),
    h("details", { class: "kh-checks", id: "checks" },
      h("summary", {}, `Notes still to be checked (${checks.length})`),
      h("p", {}, "The study marks each of these for checking before it is published. A number in the text leads here."),
      h("ol", {}, checks.map((c) => h("li", { id: `check-${c.n}` }, c.t, c.held ? h("span", { class: "kh-held" }, ` ${c.held}`) : null)))),
    h("div", { class: "kh-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use)))),
    h("a", { class: "kh-back", href: "/study/theology?area=jesus" }, art(icon("arrowLeft", 16)), "Back to Jesus Christ"),
  ));

  // ── The verse sheet, and the address ──
  function setParam(key, value) {
    const params = new URLSearchParams(location.search);
    if (value) params.set(key, value); else params.delete(key);
    const query = params.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
  }
  const sheet = h("dialog", { class: "kh-sheet", "aria-labelledby": "kh-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    const item = passages.get(id);
    if (!item) return;
    sheet.replaceChildren(
      h("div", { class: "kh-sheet-head" }, h("h2", { id: "kh-sheet-title", tabindex: "-1" }, item.label), h("button", { type: "button", class: "kh-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "kh-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "kh-sheet-src" }, "Berean Standard Bible"));
    if (!sheet.open) sheet.showModal();
    if (!push) sheet.querySelector("h2").focus();
    if (push) setParam("ref", id);
  }
  sheet.addEventListener("close", () => { setParam("ref", null); opener?.focus(); opener = null; });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.kh-ref");
    if (link) { event.preventDefault(); opener = link; openSheet(link.dataset.ref); return; }
    const note = event.target.closest("a.kh-chk");
    if (note) document.getElementById("checks").open = true;
    const thread = event.target.closest("a[data-q]");
    if (thread) document.getElementById(`q-${thread.dataset.q}`).open = true;
  });

  const params = new URLSearchParams(location.search);
  const askedTense = params.get("tense");
  if (askedTense === "midst") showVerb(tenses.get("come"), tenses.get("come").verbs[1], false);
  else if (askedTense && tenses.has(askedTense)) showVerb(tenses.get(askedTense), tenses.get(askedTense).verbs[0], false);
  const asked = params.get("ref");
  if (asked && passages.has(asked)) openSheet(asked, false);
})();
