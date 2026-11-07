// Leviticus: holiness and sacrifice, one mock-up page drawn from data.js (built by build-data.py from the study's
// content.md). All text goes in as text nodes. The only markup strings are the fixed drawings in art.js and plan.js.
// The address carries the reading (?read=nt), the chosen point (?at=04) and an open verse (?ref=); each is looked up in
// data.js or a fixed list, so an unknown value is simply ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`Leviticus: ${detail}`);
  }
  if (!window.LEV) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.LEV is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.LevArt || !window.LevPlan) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon, LevArt or LevPlan is missing");

  const D = window.LEV;
  const { study, passages, numbers } = D;
  const params = new URLSearchParams(location.search);

  function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") element.className = value;
      else if (key.startsWith("on")) element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value === true ? "" : value);
    }
    element.append(...children.flat().filter((c) => c !== null && c !== undefined));
    return element;
  }
  function art(markup, className) {
    const holder = h("span", { class: className });
    holder.innerHTML = markup; // fixed drawings from art.js and plan.js only
    return holder;
  }
  const refLink = (id, text) => h("a", { class: "lv-ref", href: `?ref=${id}`, "data-ref": id }, text);
  const label = (text) => h("span", { class: "lv-label" }, text);
  function runs(list) {
    return list.map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "lv-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, runs(run.b));
      if (run.i) return h("em", {}, run.i);
      if (run.c) return h("span", { class: "lv-check", title: "An open check from the writer, shown until it is resolved" }, `to check: ${run.c}`);
      if ("s" in run) {
        if (!run.s) return h("em", { class: "lv-study", title: "Not yet a page" }, run.t);
        const pending = D.pending.includes(run.s);
        return h("a", { class: "lv-link", href: run.s, title: pending ? "Being designed in this run" : "Mock-up on this PC" }, run.t);
      }
      return "";
    });
  }
  function quote(block) {
    return h("figure", { class: "lv-quote" }, h("blockquote", {}, block.text),
      h("figcaption", {}, refLink(block.r, block.label), block.part ? " · BSB, part of the passage" : " · BSB"));
  }
  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "quote": return quote(block);
      case "lead": return h("p", { class: "lv-lead-in" }, h("strong", {}, `${block.label}. `), runs(block.runs));
      default: console.error(`Leviticus: unknown block ${block.k}`); return "";
    }
  }

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page lv-page" });
  main.append(page);

  // ── Hero: the standard heading ──
  const [lead, opening, ...frame] = study.intro;
  const figures = [
    ["Chapters", numbers.chapters, "of Leviticus, read in the book's own order"],
    ["Parts", numbers.parts, "offerings to Jubilee, then how Christians read it today"],
    ["Love your neighbor", numbers.neighbour, "New Testament verses repeat Leviticus 19:18's words"],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
  ];
  page.append(h("section", { class: "t-sec-landing lv-hero", id: "top" },
    h("div", { class: "hc-intro lv-intro" },
      h("div", {},
        h("nav", { class: "lv-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "lv-here", "aria-current": "page" }, "Leviticus")),
        h("p", { class: "lv-concepts" }, D.concepts.join(" · ")),
        h("h1", {}, D.title[0], " ", h("em", {}, D.title[1])),
        h("p", { class: "hc-lede" }, runs(lead.runs)),
        quote(opening)),
      h("figure", { class: "ms-hero-art lv-hero-art" }, art(LevArt.hero), h("span", { class: "ms-art-note" }, h("i"), D.motto.lines[0], h("br"), h("span", {}, D.motto.lines[1])))),
    h("dl", { class: "lv-figures" }, figures.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    h("nav", { class: "lv-toc", "aria-label": "On this page" }, h("a", { href: "#camp" }, h("b", {}, "00"), "The camp, read twice"), study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title)), h("a", { href: "#close" }, h("b", {}, "→"), "Read Leviticus again")),
  ));

  // ── 00 The three questions and the camp read twice ──
  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));
  const modeNames = { israel: "In Israel", nt: "As the New Testament reads it" };
  let mode = params.get("read") === "nt" ? "nt" : "israel";
  let chosen = D.plan.some((p) => p.n === params.get("at")) ? params.get("at") : "04";
  const planArt = h("div", { class: "lv-plan-art" });
  const reading = h("p", { class: "lv-plan-line", "aria-live": "polite" });
  const switches = Object.entries(modeNames).map(([key, text]) => h("button", { type: "button", class: "lv-switch", "data-mode": key, onclick: () => setMode(key) }, text));
  const pointButtons = D.plan.map((p) => h("button", {
    type: "button", class: "lv-plan-pt", "data-n": p.n, style: `left:${LevPlan.at[p.n][0] / LevPlan.W * 100}%;top:${LevPlan.at[p.n][1] / LevPlan.H * 100}%`,
    "aria-label": `Part ${p.n}: ${p.where}`, onmouseenter: () => choose(p.n), onfocus: () => choose(p.n), onclick: () => choose(p.n),
  }, p.n));
  const wildMark = h("span", { class: "lv-plan-wild", style: `left:${LevPlan.at["04w"][0] / LevPlan.W * 100}%;top:${LevPlan.at["04w"][1] / LevPlan.H * 100}%`, "aria-hidden": "true" }, "04");
  const list = h("ol", { class: "lv-plan-list" });
  function lineFor(p) {
    const [t, r] = mode === "nt" ? [p.nt, p.ntr] : [p.phrase, p.r];
    return [h("b", {}, `${p.n} · ${p.where}`), " ", h("q", {}, t), " ", refLink(r, passages[r].label), " ", h("a", { class: "lv-link lv-to-part", href: `#part-${p.n}` }, "Read the part")];
  }
  function draw() {
    const p = D.plan.find((x) => x.n === chosen);
    planArt.innerHTML = LevPlan.svg({ zone: p.zone, points: chosen === "04" ? ["04", "04w"] : [chosen], mode });
    switches.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
    pointButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.n === chosen)));
    const wild = D.wilderness;
    reading.replaceChildren(...lineFor(p), chosen === "04" ? h("span", { class: "lv-plan-also" }, " And the second goat: ", h("q", {}, mode === "nt" ? wild.nt : wild.phrase), " ", refLink(mode === "nt" ? wild.ntr : wild.r, passages[mode === "nt" ? wild.ntr : wild.r].label)) : "");
    list.replaceChildren(...D.plan.map((x) => h("li", {}, lineFor(x))));
    const url = new URL(location.href);
    url.searchParams.set("read", mode); url.searchParams.set("at", chosen);
    history.replaceState(null, "", url);
  }
  const setMode = (key) => { mode = key; draw(); };
  const choose = (n) => { if (n !== chosen) { chosen = n; draw(); } };
  const [q1, q2, q3] = study.questions;
  page.append(h("section", { class: "t-sec lv-camp", id: "camp" },
    sectionHead("00", "The camp,", "read twice.", "Every part of this study asks the same three questions."),
    h("div", { class: "lv-frame" }, frame.map(renderBlock)),
    h("ol", { class: "lv-questions" }, [q1, q2, q3].map((q, i) => h("li", {}, h("span", { class: "lv-q-n" }, String(i + 1)), h("p", {}, h("strong", {}, q.q), " ", runs(q.then))))),
    h("div", { class: "lv-plan" },
      h("div", { class: "lv-plan-head" },
        h("p", { class: "lv-plan-ask" }, label("The question"), " Where does each part stand, and how near could Israel come?"),
        h("div", { class: "lv-switches", role: "group", "aria-label": "Read the plan" }, switches)),
      h("figure", { class: "lv-plan-figure" }, planArt, pointButtons, wildMark),
      reading,
      list,
      h("p", { class: "lv-plan-says" }, "Only one man goes behind the veil, ", refLink(D.planFacts[0].r, "once a year"), "; Aaron may not ", refLink(D.planFacts[1].r, "enter freely"), ". Every other part of the book happens further out: at the altar, at the door, in the camp, in the field, across the land. Switch to the New Testament reading to see what it does at each place."),
      h("p", { class: "lv-note" }, "A plan to read by, not to scale. Point at or choose a number to read where that part stands; each line is in the words of its verse and opens it.")),
  ));
  draw();

  // ── 01–08 The parts: In Israel beside the New Testament, and where the reading stops beneath ──
  const zoneOf = Object.fromEntries(D.plan.map((p) => [p.n, p]));
  study.parts.forEach((part) => {
    const place = zoneOf[part.n];
    const mini = LevPlan.svg({ zone: place?.zone, points: place ? [part.n] : [], mode: part.n === "08" ? "nt" : "israel", mini: true });
    const head = h("header", { class: "lv-part-head" },
      h("span", { class: "lv-n", "aria-hidden": "true" }, part.n),
      art(mini, "lv-mini"),
      h("div", { class: "lv-part-title" },
        h("h2", { id: `part-${part.n}-title` }, part.title, h("em", {}, part.turn)),
        h("p", { class: "lv-hook" }, part.hook.flatMap((b) => runs(b.runs))),
        h("p", { class: "lv-readings" }, label("Main readings"), " ", part.readings.map((r, i) => [i ? " · " : "", refLink(r.r, passages[r.r].label)]).flat())));
    const body = part.n === "08" ? partEight(part) : partBody(part);
    page.append(h("section", { class: "t-sec lv-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` }, head, body,
      h("dl", { class: "lv-ask" },
        h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
        h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect))))));
  });

  function sub(s, className) {
    return h("div", { class: `lv-sub ${className}` }, h("h3", { class: "lv-h3" }, s.title), s.blocks.map(renderBlock));
  }
  function partBody(part) {
    const [israel, nt, stops] = part.subs;
    return h("div", { class: "lv-part-body" },
      part.n === "06" ? sevens() : null,
      h("div", { class: "lv-two" }, sub(israel, "lv-israel"), sub(nt, "lv-nt")),
      sub(stops, "lv-stops"));
  }
  function partEight(part) {
    const [agree, three, ended, fulfilled, further, stands] = part.subs;
    return h("div", { class: "lv-part-body" },
      sub(agree, "lv-wide"),
      h("div", { class: "lv-families" }, [three, ended, fulfilled].map((s) => sub(s, "lv-family"))),
      routes(),
      sub(further, "lv-wide lv-further"),
      sub(stands, "lv-wide lv-stands"));
  }

  // Part 06: holy time counted in sevens. Each row's words are its verse's; the marks are the count the words give.
  function sevens() {
    const rows = D.sevens.map((row) => {
      const marks = row.kind === "seventh"
        ? Array.from({ length: 7 }, (_, i) => h("i", { class: i === 6 ? "is-holy" : "" }))
        : [...Array.from({ length: 7 }, (_, g) => h("span", { class: "lv-seven-group" }, Array.from({ length: 7 }, () => h("i")))), h("i", { class: "is-holy is-fifty" })];
      return h("div", { class: `lv-seven-row lv-seven-${row.kind}` },
        h("span", { class: "lv-seven-unit" }, row.unit),
        h("span", { class: "lv-seven-marks", "aria-hidden": "true" }, marks),
        h("span", { class: "lv-seven-words" }, h("q", {}, row.phrase), " ", refLink(row.r, passages[row.r].label)));
    });
    return h("figure", { class: "lv-sevens", "aria-label": "Holy time counted in sevens" },
      h("p", { class: "lv-plan-ask" }, label("The question"), " How does Leviticus count holy time?"),
      rows,
      h("figcaption", {}, "Holy time counts in sevens: the seventh day, the seventh month, the seventh year. After seven sevens comes a fiftieth: fifty days to the feast of Weeks, and ", h("q", {}, D.sevenTimes.t), " ", refLink(D.sevenTimes.r, passages[D.sevenTimes.r].label), " to the Jubilee."));
  }

  // Part 08: two verses, three routes. Every phrase is the study's own; the page does not choose among them.
  function routes() {
    let pick = 0;
    const lines = h("div", { class: "lv-routes-grid" });
    const buttons = D.routes.verses.map((v, i) => h("button", { type: "button", class: "lv-switch", onclick: () => { pick = i; drawRoutes(); } }, v.ref.replace("Leviticus ", ""), " · ", v.short));
    function drawRoutes() {
      const verse = D.routes.verses[pick];
      buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === pick)));
      lines.replaceChildren(
        ...D.routes.families.map((f, i) => h("div", { class: "lv-route", style: `grid-row:${i + 1}` }, h("span", { class: "lv-route-name" }, f.name), h("span", { class: "lv-route-way" }, f.routes[pick]))),
        h("p", { class: "lv-route-end" }, refLink(verse.r, passages[verse.r].label), h("span", {}, verse.arrive)));
    }
    drawRoutes();
    return h("figure", { class: "lv-routes" },
      h("div", { class: "lv-plan-head" }, h("p", { class: "lv-plan-ask" }, label("Two verses, three routes"), " How does each family reach the same verse?"),
        h("div", { class: "lv-switches", role: "group", "aria-label": "Choose a verse" }, buttons)),
      lines,
      h("figcaption", {}, D.routes.caption, " Each line is this study's own words; the study does not choose among them."));
  }

  // ── Close ──
  const close = study.close;
  const again = passages[D.again];
  page.append(h("section", { class: "t-sec lv-close", id: "close" },
    sectionHead("→", "Read Leviticus", "again."),
    h("div", { class: "lv-pair" }, D.closePair.map((id) => h("figure", {},
      h("blockquote", {}, passages[id].verses.map((v) => v[1]).join(" ")), h("figcaption", {}, refLink(id, passages[id].label), " · BSB")))),
    h("div", { class: "lv-close-grid" },
      h("div", {},
        h("p", { class: "lv-way" }, runs(close.blocks[0].runs)),
        h("p", { class: "lv-question" }, runs(close.question)),
        h("p", { class: "lv-again" }, runs(close.blocks[1].runs))),
      h("figure", { class: "lv-passage" },
        h("figcaption", {}, label("The passage again"), " ", refLink(D.again, again.label), " · BSB"),
        h("div", { class: "lv-passage-text" }, again.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))))),
    art(LevArt.close, "lv-close-art"),
    h("div", { class: "lv-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, D.sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use)))),
    h("a", { class: "lv-back", href: "/study/theology?area=doctrine" }, art(icon("arrowLeft", 16)), "Back to God & Christian Faith"),
  ));

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "lv-sheet", "aria-labelledby": "lv-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    const item = passages[id];
    if (!item) return;
    sheet.replaceChildren(
      h("div", { class: "lv-sheet-head" }, h("h2", { id: "lv-sheet-title" }, item.label), h("button", { type: "button", class: "lv-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "lv-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "lv-sheet-src" }, "Berean Standard Bible"));
    if (!sheet.open) sheet.showModal();
    if (push) { const url = new URL(location.href); url.searchParams.set("ref", id); history.replaceState(null, "", url); }
  }
  sheet.addEventListener("close", () => {
    const url = new URL(location.href); url.searchParams.delete("ref"); history.replaceState(null, "", url);
    opener?.focus();
    opener = null;
  });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.lv-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  const asked = params.get("ref");
  if (asked && passages[asked]) openSheet(asked, false);
})();
