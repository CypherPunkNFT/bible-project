// Every life in God's image, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js and the shared icon set.
// Values in the address (?ref=) are looked up in data.js, so an unknown value is simply ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`Every life in God's image: ${detail}`);
  }
  if (!window.EL) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.EL is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.ELArt || !window.ELFigures) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon, ELArt or ELFigures is missing");

  const { study, passages, figures, numbers, sources, sourceLabels, closeActs } = window.EL;
  const LIFE = "/study/theology?area=life";

  function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") element.className = value;
      else if (key.startsWith("on")) element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value === true ? "" : value);
    }
    element.append(...children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== ""));
    return element;
  }
  function art(markup, className) {
    const holder = h("span", { class: className });
    holder.innerHTML = markup; // fixed drawings from art.js and the shared icon set only
    return holder;
  }
  // A passage by key; a single verse of a chapter held whole ("2SA.9.3" from "2SA.9") is read from that chapter.
  function passage(id) {
    if (passages[id]) return passages[id];
    const m = /^([1-3]?[A-Z]{2,3})\.(\d+)\.(\d+)$/.exec(id || "");
    const chapter = m && passages[`${m[1]}.${m[2]}`];
    const verse = chapter?.verses.find(([cv]) => cv === `${m[2]}:${m[3]}`);
    return verse ? { label: `${chapter.label}:${m[3]}`, verses: [verse] } : null;
  }
  const refLink = (id, text) => h("a", { class: "el-ref", href: `?ref=${id}`, "data-ref": id }, text);
  // A note still to check may name a study in *italics*; show it as italics, not asterisks.
  const noteText = (text) => text.split(/\*([^*]+)\*/).map((piece, i) => (i % 2 ? h("em", {}, piece) : piece));
  function runs(list) {
    return (list || []).map((run, i) => {
      if (typeof run === "string") return list[i + 1]?.c !== undefined ? run.replace(/\s+$/, "") : run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "el-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if (run.s) return h("a", { class: "el-link", href: run.s, title: "A study mock-up on this PC" }, h("em", {}, run.t));
      if (run.c !== undefined) return run.c === "before publishing"
        ? h("span", { class: "el-check" }, h("span", { class: "el-check-tag" }, "to check before publishing"))
        : h("span", { class: "el-check" }, h("span", { class: "el-check-tag" }, "to check"), " ", noteText(run.c));
      return "";
    });
  }
  const label = (text, extra = "") => h("span", { class: `el-label ${extra}` }, text);
  function setParam(name, value) {
    const params = new URLSearchParams(location.search);
    if (value === null) params.delete(name); else params.set(name, value);
    const query = params.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
  }

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page el-page" });
  main.append(page);
  ELFigures.use({ h, refLink, passages });

  // ── Hero: the standard heading ──
  const opening = study.opening.find((b) => b.k === "quote");
  const care = study.opening.find((b) => b.k === "care");
  const figuresBar = [
    ["Rooms", numbers.rooms, "scenes on this page where you look for the one who cannot speak"],
    ["At the table", numbers.atTable, "verses of 2 Samuel 9 that set Mephibosheth at the king's table"],
    ["“Me”", numbers.speaker, "times Psalm 139:13–16 says I, me or my of a life before birth"],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
  ];
  const [ink, turn] = [study.title.split(" ").slice(0, 2).join(" "), study.title.split(" ").slice(2).join(" ")];
  page.append(h("section", { class: "t-sec-landing el-hero", id: "top" },
    h("div", { class: "hc-intro el-intro" },
      h("div", {},
        h("nav", { class: "el-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: LIFE }, "Living the Christian Life"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "el-here", "aria-current": "page" }, study.title)),
        h("p", { class: "el-concepts" }, study.concepts.join(" · ")),
        h("h1", {}, `${ink} `, h("em", {}, turn)),
        h("p", { class: "el-subtitle" }, study.subtitle.replace(/^./, (c) => c.toUpperCase())),
        h("p", { class: "hc-lede el-lede" }, runs(study.lead)),
        h("figure", { class: "el-opening" }, h("blockquote", {}, passages[opening.r].verses.map((v) => v[1]).join(" ")),
          h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art el-hero-art" }, art(ELArt.hero), h("span", { class: "ms-art-note" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1])))),
    h("dl", { class: "el-figures" }, figuresBar.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    care ? h("aside", { class: "el-crisis", id: "help", "aria-label": "If you are hurting right now" }, label("With care", "is-care"),
      h("p", {}, runs(care.runs)),
      care.items ? h("ul", { class: "el-lines" }, care.items.map((item) => h("li", {}, runs(item)))) : null,
      (care.more || []).map((more) => h("p", {}, runs(more)))) : null,
    h("nav", { class: "el-toc", "aria-label": "On this page" },
      h("a", { href: "#overlooked" }, h("b", {}, "00"), "The ones easy to overlook"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title.split(":")[0])),
      h("a", { href: "#questions" }, h("b", {}, "?"), "Questions"),
      h("a", { href: "#close" }, h("b", {}, "→"), "Who is in the room?")),
  ));

  const sectionHead = (number, title, turnText, ...lead) => h("header", { class: "t-head el-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turnText)), lead.length ? h("p", {}, ...lead) : null));

  // ── 00 The ones easy to overlook: the frame, and what this selection walks ──
  page.append(h("section", { class: "t-sec el-overlooked", id: "overlooked" },
    sectionHead("00", "The ones", "easy to overlook.", "When a passage tells you how to treat a person, ask who is in the room who cannot speak for themselves."),
    h("div", { class: "el-two" }, h("p", { class: "el-frame" }, runs(study.frame)), h("p", { class: "el-note" }, runs(study.selection)))));

  // ── Blocks of text; notes that read or limit the text stand in the margin beside it ──
  const NOTE = { care: ["With care", "is-care"], read: ["How this study reads it", "is-read"], open: ["An open question", "is-open"], limit: ["Its limits", "is-limit"] };
  const speakerVerses = Object.fromEntries(figures.speaker.verses.map((v) => [v.cv, v.parts]));
  function quoteText(block) {
    if (block.text) return block.text;
    const verses = passages[block.r].verses;
    if (!block.r.startsWith("PSA.139.")) return verses.map((v) => v[1]).join(" ");
    return verses.map(([cv, text], i) => [i ? " " : "", (speakerVerses[cv] || [[text, false]]).map(([piece, on]) => (on ? h("mark", { class: "el-me" }, piece) : piece))]);
  }
  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "h3": return h("h3", { class: "el-h3" }, block.t);
      case "quote": return h("figure", { class: "el-quote" }, h("blockquote", {}, quoteText(block)),
        h("figcaption", {}, refLink(block.r, block.label), " · BSB", block.partial ? h("span", { class: "el-partial" }, ` · ${block.partial}`) : ""));
      case "source": return h("aside", { class: "el-side is-source" }, label(sourceLabels[block.id] || "Source"), h("p", {}, runs(block.runs)));
      default: {
        const [name, kind] = NOTE[block.k] || [];
        if (!name) { console.error(`Every life in God's image: unknown block ${block.k}`); return ""; }
        return h("aside", { class: `${block.k === "care" ? "el-care" : "el-side"} ${kind}` }, label(name), h("p", {}, runs(block.runs)));
      }
    }
  }

  // ── 01–06: one part per passage; 02–06 each open on the room their passage describes ──
  const rooms = Object.fromEntries(figures.rooms.map((r) => [r.part, r]));
  function partFigures(part) {
    const out = [];
    if (part.n === "01") out.push(ELFigures.twice(figures.twice));
    if (rooms[part.n]) out.push(ELFigures.room(rooms[part.n]));
    if (part.n === "02") {
      const toggle = h("button", { type: "button", class: "el-find is-quiet", "aria-pressed": "false" }, `Mark every I, me and my (${figures.speaker.count})`);
      toggle.addEventListener("click", () => {
        const on = toggle.getAttribute("aria-pressed") !== "true";
        toggle.setAttribute("aria-pressed", String(on));
        document.getElementById("part-02").classList.toggle("show-me", on);
      });
      out.push(h("p", { class: "el-speaker" }, "Who is speaking? In ", refLink(figures.speaker.r, passages[figures.speaker.r].label), ` the grown man says I, me or my ${figures.speaker.count} times, of himself before he was born. `, toggle));
    }
    if (part.n === "03") out.push(ELFigures.table(figures.table));
    if (part.n === "06") out.push(h("p", { class: "el-speaker" }, refLink(figures.mouth.r, passages[figures.mouth.r].label), ` says “${figures.mouth.phrase}” ${figures.mouth.count === 2 ? "twice" : `${figures.mouth.count} times`}: “for those with no voice”, and to “judge righteously”.`));
    return out;
  }
  study.parts.forEach((part) => {
    const [title, turnText] = part.title.split(": ");
    page.append(h("section", { class: "t-sec el-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "el-part-head" },
        h("p", { class: "el-part-tag" }, h("b", {}, part.n), rooms[part.n] ? rooms[part.n].place : "The ground"),
        h("h2", { id: `part-${part.n}-title` }, title, turnText ? [": ", h("em", {}, turnText)] : ""),
        h("p", { class: "el-hook" }, runs(part.hook)),
        h("p", { class: "el-readings" }, label("Main readings"), " ", part.readings.map((id, i) => [i ? " · " : "", refLink(id, passages[id].label)]),
          part.readingsNote ? h("span", { class: "el-readings-note" }, " (", runs(part.readingsNote), ")") : null)),
      partFigures(part),
      h("div", { class: "el-body" }, part.blocks.map(renderBlock)),
      h("dl", { class: "el-ask" },
        h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
        h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect))))));
  });

  // ── Questions readers bring: each opens in place; the first, on forgiveness, is open from the start ──
  page.append(h("section", { class: "t-sec el-questions", id: "questions" },
    sectionHead("?", "Questions", "readers bring.", "Three questions this study is often asked. Each answer starts from its verse."),
    h("div", { class: "el-q-list" }, study.questions.map((q, i) => h("details", { class: "el-q", id: `question-${i + 1}`, open: i === 0 },
      h("summary", {}, h("span", { class: "el-q-n" }, String(i + 1).padStart(2, "0")), h("span", { class: "el-q-t" }, q.title)),
      h("p", { class: "el-q-text" }, label("From"), " ", refLink(q.text, passages[q.text].label)),
      h("div", { class: "el-body is-answer" }, q.blocks.map(renderBlock)))))));

  // ── Close: who is in the room, the way to read, and 2 Samuel 9 again ──
  const close = study.close;
  const closing = passages[close.passage];
  page.append(h("section", { class: "t-sec el-close", id: "close" },
    sectionHead("→", close.title.split(" ").slice(0, -2).join(" "), close.title.split(" ").slice(-2).join(" ")),
    ELFigures.close(figures.rooms, closeActs),
    h("div", { class: "el-close-grid" },
      h("div", {},
        h("p", { class: "el-way" }, runs(close.way)),
        h("p", { class: "el-closing" }, runs(close.close)),
        h("p", { class: "el-question" }, runs(close.question)),
        h("p", { class: "el-again" }, runs(close.again))),
      h("figure", { class: "el-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(close.passage, closing.label), " · BSB"),
        h("div", { class: "el-passage-text" }, closing.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))))),
    h("div", { class: "el-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use)))),
    h("a", { class: "el-back", href: LIFE }, art(icon("arrowLeft", 16)), "Back to Living the Christian Life")));

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "el-sheet", "aria-labelledby": "el-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, remember = true) {
    const item = passage(id);
    if (!item) return;
    sheet.replaceChildren(
      h("div", { class: "el-sheet-head" }, h("h2", { id: "el-sheet-title" }, item.label), h("button", { type: "button", class: "el-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "el-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "el-sheet-src" }, "Berean Standard Bible"));
    if (!sheet.open) sheet.showModal();
    if (remember) setParam("ref", id);
  }
  sheet.addEventListener("close", () => {
    setParam("ref", null);
    opener?.focus();
    opener = null;
  });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.el-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  const ref = new URLSearchParams(location.search).get("ref");
  if (ref && passage(ref)) openSheet(ref, false);
})();
