// Saved by grace, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js and the frame's icons.
// The address carries two things: ?ref= (a verse sheet, looked up in data.js, an unknown value ignored) and
// ?verbs=off (the verb marks hidden). Each is changed without disturbing the other.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.style.cssText = "padding:2rem;font:1rem serif";
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`Saved by grace: ${detail}`);
  }
  const SG = window.SG;
  if (!SG || !SG.study || !SG.passages || !SG.numbers || !SG.chart) return stop("This mock-up has no study data: data.js did not load or is incomplete. Run build-data.py, then reload.", "window.SG is missing or incomplete");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.SGArt) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon or SGArt is missing");

  const { study, passages, marks, numbers, chart, verbs, kinds, prayers, declaring, standing, abraham, chain, twoVerbs, sources } = SG;
  const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const verbById = Object.fromEntries(verbs.map((v) => [v.id, v]));

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
    holder.innerHTML = markup; // fixed drawings from art.js and frame icons only
    return holder;
  }
  const siteLink = (url) => /^\/(?![/\\])[A-Za-z0-9/_\-?=&#.]*$/.test(url) ? url : null;
  const refLink = (id, text) => h("a", { class: "sg-ref", href: `?ref=${id}`, "data-ref": id }, text);
  const label = (text) => h("span", { class: "sg-label" }, text);
  const hidden = (text) => h("span", { class: "sg-vh" }, text);
  function runs(list) {
    return (list || []).map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return siteLink(run.a) ? h("a", { class: "sg-link", href: run.a }, run.t) : run.t;
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if ("s" in run) return run.s && siteLink(run.s) ? h("a", { class: "sg-link", href: run.s, title: "Mock-up on this PC" }, h("em", {}, run.t)) : h("em", { class: "sg-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }

  // ── The verb switch: one state for the whole page, kept in the address ──
  const params = () => new URLSearchParams(location.search);
  function setAddress(change) {
    const query = params();
    change(query);
    const text = query.toString();
    history.replaceState(null, "", location.pathname + (text ? `?${text}` : "") + location.hash);
  }
  let marked = params().get("verbs") !== "off";
  document.documentElement.classList.toggle("sg-unmarked", !marked);
  const switches = [];
  function verbSwitch() {
    const button = h("button", { type: "button", class: "sg-switch", "aria-pressed": String(marked), onclick: () => setMarked(!marked) },
      h("span", { class: "sg-switch-track", "aria-hidden": "true" }, h("i")), "Mark the verbs");
    switches.push(button);
    return button;
  }
  function setMarked(on) {
    marked = on;
    document.documentElement.classList.toggle("sg-unmarked", !on);
    switches.forEach((button) => button.setAttribute("aria-pressed", String(on)));
    setAddress((query) => (on ? query.delete("verbs") : query.set("verbs", "off")));
  }

  // A printed passage, verse by verse, with each checked verb marked where the build found it.
  function verseText(key, cv, text) {
    const spans = marks[`${key.split(".")[0]} ${cv}`] || [];
    const out = [];
    let last = 0;
    for (const [start, end, who, id] of spans) {
      out.push(text.slice(last, start), h("mark", { class: `sg-m k-${who}`, "data-verb": id }, text.slice(start, end)));
      last = end;
    }
    out.push(text.slice(last));
    return out;
  }
  function printed(key, numbered) {
    const item = passages[key];
    return item.verses.map(([cv, text], i) => [numbered && item.verses.length > 1 ? h("sup", {}, cv.split(":")[1]) : null, verseText(key, cv, text), i < item.verses.length - 1 ? " " : ""]);
  }

  // ── Frame: the site's header and footer, with Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page sg-page" });
  main.append(page);

  // ── Hero: the standard heading ──
  const opening = study.opening[0];
  const figures = [
    ["Passages walked", numbers.walked, "one in each of parts 01 to 06; part 07 gathers them"],
    ["God’s verbs", numbers.godVerbs, "marked on this page, each found word for word in its verse"],
    ["Turns on “But”", `${numbers.turns} of ${numbers.walked}`, "passages turn on that word; James does not"],
    ["Verses printed", numbers.versesPrinted, "in full on this page, each word for word the Berean"],
  ];
  const [titleHead, titleTurn] = ["Saved by", "grace"];
  page.append(h("section", { class: "t-sec-landing sg-hero", id: "top" },
    h("div", { class: "hc-intro sg-intro" },
      h("div", {},
        h("nav", { class: "sg-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "sg-here", "aria-current": "page" }, study.title)),
        h("p", { class: "sg-concepts" }, study.concepts.join(" · ")),
        h("h1", { tabindex: "-1" }, `${titleHead} `, h("em", {}, titleTurn)),
        h("p", { class: "sg-subtitle" }, study.subtitle.replace(/^./, (c) => c.toUpperCase())),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "sg-opening" }, h("blockquote", {}, printed(opening.r, false)),
          h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art sg-hero-art" }, art(SGArt.hero), h("span", { class: "ms-art-note" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1])))),
    h("dl", { class: "sg-figures" }, figures.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    h("nav", { class: "sg-toc", "aria-label": "On this page" },
      h("a", { href: "#habit" }, h("b", {}, "00"), "Who is acting?"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title.split(":")[0])),
      h("a", { href: "#close" }, h("b", {}, "→"), "Close"))));

  const sectionHead = (number, title, turn, lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead ? h("p", {}, lead) : null));

  // ── 00 Who is acting? The habit, then the verb chart ──
  const readout = h("p", { class: "sg-readout", "aria-live": "polite" });
  const readoutRest = "Point at a verb, or reach it with Tab, to see who acts and where. Choose it to read the verse.";
  readout.textContent = readoutRest;
  const marker = (who) => h("span", { class: `sg-mk k-${who}`, "aria-hidden": "true" });
  const kindLead = { people: "People: ", ruled: "Ruled out: ", god: "God: ", passive: "God, in the passive: ", reply: "People: " };
  function verbButton(verb) {
    return h("li", {}, h("button", { type: "button", class: `sg-verb k-${verb.who}`, "data-ref": verb.r, "data-verb": verb.id },
      marker(verb.who), hidden(kindLead[verb.who]), h("span", { class: "sg-verb-t" }, verb.phrase)));
  }
  const bands = [["people", ["people", "ruled"]], ["turn", []], ["god", ["god", "passive"]], ["reply", ["reply"]]];
  const bandNames = { people: "What people were doing", turn: "Where it turns", god: "What God does", reply: "What people do" };
  function chartColumn(column) {
    const reading = passages[column.reading];
    const items = column.verbs.map((id) => verbById[id]);
    return h("section", { class: "sg-col", "aria-labelledby": `col-${column.part}` },
      h("h3", { class: "sg-col-head", id: `col-${column.part}` }, h("a", { href: `#part-${column.part}` }, h("b", {}, column.part), reading.label)),
      bands.map(([band, kindsHere]) => h("div", { class: `sg-band b-${band}` },
        h("span", { class: "sg-band-name" }, bandNames[band]),
        band === "turn"
          ? (column.hinge ? h("button", { type: "button", class: "sg-verb sg-hinge", "data-ref": column.hinge.r, "data-hinge": column.part }, h("span", { class: "sg-verb-t" }, h("b", {}, "But"), column.hinge.phrase.slice(3)))
            : h("p", { class: "sg-noturn" }, column.noTurn || "No turn."))
          : (() => { const here = items.filter((v) => kindsHere.includes(v.who)); return here.length ? h("ul", {}, here.map(verbButton)) : h("p", { class: "sg-none" }, "Not in these verses."); })())));
  }
  const legend = h("ul", { class: "sg-legend", "aria-label": "Key" }, Object.entries(kinds).map(([who, text]) => h("li", {}, marker(who), text)));
  const intro = study.intro;
  page.append(h("section", { class: "t-sec sg-habit", id: "habit" },
    sectionHead("00", "Who is acting?", "Watch the verbs.", "Before you ask what a passage means, ask who is doing each verb, then what the other one does in reply."),
    h("div", { class: "sg-habit-text" }, intro[0].blocks.map(renderBlock)),
    h("div", { class: "sg-chart-head" }, h("h3", {}, "Six passages, read for their verbs"), verbSwitch()),
    legend,
    h("div", { class: "sg-chart" },
      h("div", { class: "sg-chart-bands", "aria-hidden": "true" }, h("span", {}, "Passage"), bands.map(([band]) => h("span", { class: `b-${band}` }, bandNames[band]))),
      chart.map(chartColumn)),
    readout,
    h("p", { class: "sg-note" }, "The verbs are a selection, chosen to show who acts; they are not every verb in each passage. A script proves each phrase is in its verse, word for word. Which column a verb sits in is this study’s reading. Where a verse uses the passive and names no actor (“went home justified”), it is drawn as God’s act with a half-filled mark, because Scripture names God as the one who justifies (", refLink("ROM.4.5", "Romans 4:5"), ")."),
    h("aside", { class: "sg-covers" }, h("h3", {}, intro[1].title), intro[1].blocks.map(renderBlock))));

  function showVerb(button) {
    if (button.dataset.hinge) {
      const column = chart.find((c) => c.part === button.dataset.hinge);
      readout.replaceChildren(label("Where it turns"), " ", h("q", {}, column.hinge.phrase), " · ", refLink(column.hinge.r, column.hinge.label), " · the subject changes here.");
      return;
    }
    const verb = verbById[button.dataset.verb];
    if (!verb) return;
    readout.replaceChildren(label(kinds[verb.who]), " ", h("q", {}, verb.phrase), " · ", refLink(verb.r, verb.label), verb.note ? ` · ${verb.note}` : "");
  }
  page.addEventListener("pointerover", (event) => { const b = event.target.closest(".sg-verb"); if (b) showVerb(b); });
  page.addEventListener("focusin", (event) => { const b = event.target.closest(".sg-verb"); if (b) showVerb(b); });
  page.addEventListener("click", (event) => { const b = event.target.closest(".sg-verb"); if (b) { opener = b; openSheet(b.dataset.ref); } });

  // ── 01–07: the parts ──
  const graphics = {
    "02": [(b) => b.k === "quote" && b.label === "Luke 18:13", twoPrayers],
    "04": [(b) => b.k === "quote" && b.label === "Romans 4:4–5", bookWords],
    "05": [(b) => b.k === "quote" && b.label === "Galatians 4:7", standingLine],
    "06": [(b) => b.k === "h3" && b.t.startsWith("Does James"), abrahamLine],
    "07": [(b) => b.k === "quote" && b.label === "Romans 8:29–30", chainLine],
  };
  study.parts.forEach((part) => {
    const body = h("div", { class: "sg-body" });
    const [isPlace, draw] = graphics[part.n] || [];
    part.blocks.forEach((block) => {
      body.append(renderBlock(block));
      if (isPlace && isPlace(block)) body.append(draw());
      if (part.n === "07" && block.k === "quote" && block.label === "Philippians 2:12–13") body.append(twoVerbsLine());
    });
    body.append(h("dl", { class: "sg-ask" },
      h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
      h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect)))));
    page.append(h("article", { class: "sg-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "sg-part-head" },
        h("span", { class: "sg-big", "aria-hidden": "true" }, part.n),
        h("p", { class: "sg-kicker" }, `Part ${part.n} · `, runs(part.readingsText)),
        h("h2", { id: `part-${part.n}-title` }, part.title),
        part.hook ? h("p", { class: "sg-hook" }, runs(part.hook)) : null),
      h("div", { class: "sg-part-grid" }, body, margin(part))));
  });

  function margin(part) {
    const column = chart.find((c) => c.part === part.n);
    const list = column ? column.verbs.map((id) => verbById[id]) : null;
    const groups = list ? ["people", "ruled", "god", "passive", "reply"].map((who) => [who, list.filter((v) => v.who === who)]).filter(([, l]) => l.length) : [];
    return h("aside", { class: "sg-margin", "aria-label": `Verbs in part ${part.n}` },
      art(SGArt.parts[part.n], "sg-mini-wrap"),
      verbSwitch(),
      column && column.hinge ? h("p", { class: "sg-margin-turn" }, label("Where it turns"), h("span", {}, refLink(column.hinge.r, column.hinge.label), " ", h("q", {}, column.hinge.phrase))) : null,
      column && !column.hinge ? h("p", { class: "sg-margin-turn" }, label("Where it turns"), h("span", {}, column.noTurn)) : null,
      groups.map(([who, l]) => h("div", { class: "sg-margin-group" }, h("h3", {}, marker(who), kinds[who]), h("ul", {}, l.map(verbButton)))),
      part.n === "07" ? h("div", { class: "sg-margin-group" }, h("h3", {}, marker("god"), kinds.god), h("ul", {}, chain.map((c) => h("li", {}, refLink(c.r, c.phrase))))) : null);
  }

  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "h3": return h("h3", { class: "sg-h3" }, block.t);
      case "setting": return h("p", { class: "sg-setting" }, label("Setting"), " ", runs(block.runs));
      case "quote": return h("figure", { class: "sg-quote" }, h("blockquote", {}, printed(block.r, true)), h("figcaption", {}, refLink(block.r, block.label), " · BSB"));
      case "care": return h("aside", { class: "sg-care" }, label("With care"), h("p", {}, runs(block.runs)));
      case "other": return h("aside", { class: "sg-voice sg-other" }, label("Their teaching, in their words"), h("p", {}, runs(block.runs)));
      case "read": return h("aside", { class: "sg-voice sg-read" }, label("How Baptists read it"), h("p", {}, runs(block.runs)));
      case "source": return h("aside", { class: "sg-voice sg-source" }, label("A named source, in paraphrase"), h("p", {}, runs(block.runs)));
      case "limits": return h("p", { class: "sg-limits" }, label(block.label), " ", runs(block.runs));
      case "more": return h("p", { class: "sg-more" }, art(icon("arrowRight", 14)), runs(block.runs));
      default: console.error(`Saved by grace: unknown block ${block.k}`); return "";
    }
  }

  // Part 02: the two prayers in the verses' own words, with what the script marked in each.
  function twoPrayers() {
    return h("figure", { class: "sg-prayers", "aria-label": "The two prayers side by side" },
      h("p", { class: "sg-fig-q" }, "Who is the subject of each prayer?"),
      h("div", { class: "sg-prayer-row" }, prayers.map((p, i) => h("div", { class: `sg-prayer${i ? " is-asked" : ""}` },
        h("p", { class: "sg-prayer-who" }, p.who, " ", refLink(p.r, p.label)),
        h("p", { class: "sg-prayer-words" }, "‘", p.segments.map(([text, on]) => on ? h("mark", {}, text) : text), "’"),
        h("p", { class: "sg-prayer-count" }, i === 0 ? [h("b", {}, String(p.count)), ` times “I”`] : [h("b", {}, "God"), " is asked to act"])))),
      h("figcaption", {}, "One prayer reports what the speaker does; the other asks God to do what the speaker cannot. The words are the Berean’s; the marks are counted by script."));
  }
  // Part 04: Romans 4's bookkeeping words, each from its verse.
  function bookWords() {
    return h("figure", { class: "sg-words", "aria-label": "Four words for how God treats the believer" },
      h("p", { class: "sg-fig-q" }, "What does God do with the believer’s account?"),
      h("ol", {}, declaring.map((d) => h("li", {}, h("span", { class: "sg-word" }, d.phrase), refLink(d.r, d.label)))),
      h("figcaption", {}, "Each word declares; none of them describes a change inside the person. That is why Baptists read justification as a verdict."));
  }
  // Part 05: three standings in one verse.
  function standingLine() {
    return h("figure", { class: "sg-standing", "aria-label": "Slave, son, heir" },
      h("ol", {}, standing.map((s, i) => h("li", { class: i === 0 ? "is-was" : "" }, h("span", { class: "sg-word" }, s.phrase), refLink(s.r, s.label)))),
      h("figcaption", {}, "One verse moves the reader twice: out of slavery into sonship, and from sonship to an inheritance."));
  }
  // Part 06: Abraham's two moments on one line of his life, with the ages the script found in Genesis.
  function abrahamLine() {
    const [younger, older] = abraham.ages;
    return h("figure", { class: "sg-abraham", "aria-label": "Two moments in Abraham's life" },
      h("p", { class: "sg-fig-q" }, "Which moment does each writer point to?"),
      h("div", { class: "sg-abe-line" },
        h("div", { class: "sg-abe-pt is-first" }, h("span", { class: "sg-abe-dot", "aria-hidden": "true" }),
          h("p", { class: "sg-abe-when" }, refLink(abraham.believed.r, abraham.believed.label)), h("p", { class: "sg-abe-what" }, h("q", {}, abraham.believed.phrase)),
          h("p", { class: "sg-abe-who" }, "Quoted by Paul ", refLink(abraham.quotedBy[0].r, abraham.quotedBy[0].label), " and by James ", refLink(abraham.quotedBy[1].r, abraham.quotedBy[1].label))),
        h("div", { class: "sg-abe-gap" }, h("span", {}, "Ishmael born, Abram ", refLink(younger.r, younger.phrase)), h("span", {}, "Isaac born, Abraham ", refLink(older.r, older.phrase))),
        h("div", { class: "sg-abe-pt" }, h("span", { class: "sg-abe-dot", "aria-hidden": "true" }),
          h("p", { class: "sg-abe-when" }, "Genesis 22 · ", refLink(abraham.offered.r, abraham.offered.label)), h("p", { class: "sg-abe-what" }, h("q", {}, abraham.offered.phrase)),
          h("p", { class: "sg-abe-who" }, "Pointed to by James ", refLink(abraham.pointedBy.r, abraham.pointedBy.label)))),
      h("figcaption", {}, `At least ${older.years - younger.years} years lie between the two. The verdict came first; the offering showed it was true.`));
  }
  // Part 07: Romans 8's chain, every link a verb of God, and Philippians 2's two verbs in one breath.
  function chainLine() {
    return h("figure", { class: "sg-chain", "aria-label": "Five verbs of God in Romans 8:29–30" },
      h("p", { class: "sg-fig-q" }, "Who is the subject of each link?"),
      h("ol", {}, chain.map((c) => h("li", {}, h("span", { class: "sg-word" }, c.phrase), refLink(c.r, c.label)))),
      h("figcaption", {}, "God is the subject of all five. Baptists differ over what “foreknew” and “predestined” mean in detail, and this study does not choose; all read the chain as unbroken."));
  }
  function twoVerbsLine() {
    return h("figure", { class: "sg-two", "aria-label": "Two verbs in one breath" },
      twoVerbs.map((t) => h("p", { class: `sg-two-row k-${t.who}` }, marker(t.who), h("span", { class: "sg-word" }, t.phrase), " ", refLink(t.r, t.label))),
      h("figcaption", {}, "The believer works out; God works in, underneath that effort and before it."));
  }

  // ── Close ──
  const close = study.close;
  page.append(h("section", { class: "t-sec sg-close", id: "close" },
    sectionHead("→", "Watch who is doing", "the verbs."),
    h("div", { class: "sg-close-grid" },
      h("div", {},
        h("p", { class: "sg-way" }, runs(close.way)),
        h("p", { class: "sg-invite" }, runs(close.invite)),
        h("p", { class: "sg-question" }, runs(close.question)),
        h("p", { class: "sg-again" }, runs(close.again))),
      h("figure", { class: "sg-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage, passages[close.passage].label), " · BSB", verbSwitch()),
        h("div", { class: "sg-passage-text" }, printed(close.passage, true)))),
    art(SGArt.close, "sg-close-art"),
    h("div", { class: "sg-sources" }, h("h3", {}, "Sources"), h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use)))),
    h("a", { class: "sg-back", href: "/study/theology?area=doctrine" }, art(icon("arrowLeft", 16)), "Back to God & Christian Faith")));

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "sg-sheet", "aria-labelledby": "sg-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    if (!has(passages, id)) return;
    const item = passages[id];
    sheet.replaceChildren(
      h("div", { class: "sg-sheet-head" }, h("h2", { id: "sg-sheet-title" }, item.label), h("button", { type: "button", class: "sg-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "sg-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", verseText(id, cv, text), " "))),
      h("p", { class: "sg-sheet-src" }, "Berean Standard Bible"));
    if (!sheet.open) sheet.showModal();
    if (push) setAddress((query) => query.set("ref", id));
  }
  sheet.addEventListener("close", () => {
    setAddress((query) => query.delete("ref"));
    const back = opener && opener.isConnected ? opener : document.querySelector(".sg-hero h1");
    back?.focus();
    opener = null;
  });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.sg-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  const asked = params().get("ref");
  if (asked && /^[A-Z0-9]{3}\.\d+\.\d+(-[\d.]+)?$/.test(asked)) openSheet(asked, false);
})();
