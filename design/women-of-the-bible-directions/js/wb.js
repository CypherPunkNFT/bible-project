// Women of the Bible, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js. A reference in the address
// (?ref=) is looked up in data.js, so an unknown value is simply ignored.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`Women of the Bible: ${detail}`);
  }
  if (!window.WB) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.WB is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.WBArt) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon or WBArt is missing");

  const { study, passages, women, junia, litany, motto, canon, numbers, outside, sources, concepts, title, trail } = window.WB;
  const byId = Object.fromEntries(women.map((w) => [w.id, w]));
  const SVG = "http://www.w3.org/2000/svg";

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
  function s(tag, attrs = {}) {
    const element = document.createElementNS(SVG, tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    return element;
  }
  function art(markup, className) {
    const holder = h("span", { class: className });
    holder.innerHTML = markup; // fixed drawings from art.js only
    return holder;
  }
  const refLink = (id, text) => h("a", { class: "wb-ref", href: `?ref=${id}`, "data-ref": id }, text || passages[id].label);
  function runs(list) {
    return (list || []).map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "wb-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if ("s" in run) return h("a", { class: "wb-link", href: run.s, title: "Mock-up on this PC" }, h("em", {}, run.t));
      return "";
    });
  }
  const label = (text) => h("span", { class: "wb-label" }, text);
  const mark = (name) => art(WBArt.mark[name], `wb-mark wb-mark-${name}`);

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page wb-page" });
  main.append(page);

  // ── Hero: the standard heading ──
  const [lead, ...frame] = study.opening.filter((b) => b.k === "p");
  const asks = study.opening.filter((b) => b.k === "ask");
  const figures = [
    ["Stories", numbers.stories, `${numbers.women} women: Martha and Mary share one story`],
    ["Named again", numbers.named, `stories a later book names again; ${numbers.echoed} more are echoed or set aside`],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
    ["Passages", numbers.references, "references in the study, each opening its verses"],
  ];
  const trailNav = h("nav", { class: "wb-trail", "aria-label": "Study trail" },
    trail.map(([href, text]) => [h("a", { href }, text), h("span", { "aria-hidden": "true" }, "/")]), h("span", { class: "wb-here", "aria-current": "page" }, study.title));
  page.append(h("section", { class: "t-sec-landing wb-hero", id: "top" },
    h("div", { class: "hc-intro wb-intro" },
      h("div", {},
        trailNav,
        h("p", { class: "wb-concepts" }, concepts.join(" · ")),
        h("h1", {}, title.plain, " ", h("em", {}, title.turn)),
        h("p", { class: "hc-lede wb-lede" }, runs(lead.runs))),
      h("figure", { class: "ms-hero-art wb-hero-art" }, art(WBArt.hero),
        h("span", { class: "ms-art-note" }, h("i"), motto.lines[0], h("br"), h("span", {}, motto.lines[1]), " ", refLink(motto.r, "Mark 14:9")))),
    h("dl", { class: "wb-figures" }, figures.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    h("nav", { class: "wb-toc", "aria-label": "On this page" },
      h("a", { href: "#questions" }, h("b", {}, "00"), "Three questions"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title)),
      h("a", { href: "#question" }, h("b", {}, "?"), "Women as pastors?"),
      h("a", { href: "#close" }, h("b", {}, "→"), "What they show")),
  ));

  const sectionHead = (number, titleText, turn, ...lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, titleText, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));

  // ── 00 Three questions, and the memory chart ──
  const markNames = ["did", "god", "memory"];
  page.append(h("section", { class: "t-sec wb-questions", id: "questions" },
    sectionHead("00", "Three questions", "for every life.", "Read her story first. Then read how later Scripture remembers her."),
    h("div", { class: "wb-frame" }, frame.map((b) => h("p", {}, runs(b.runs)))),
    h("ol", { class: "wb-asks" }, asks.map((a, i) => h("li", {}, mark(markNames[i]), h("div", {}, h("b", {}, a.label), " ", runs(a.runs))))),
    memoryChart(),
  ));

  function memoryChart() {
    const W = 1600, top = 18, band = 186;
    const xWoman = (i) => (i + 0.5) * (W / women.length);
    const xBook = (code) => (canon.findIndex((b) => b.c === code) + 0.5) * (W / canon.length);
    const svg = s("svg", { viewBox: `0 0 ${W} 250`, class: "wb-chart-svg", "aria-hidden": "true" });
    canon.forEach((b, j) => svg.append(s("line", { x1: xBook(b.c), x2: xBook(b.c), y1: band - 6, y2: band + 6, class: `wb-tick s-${b.s}` })));
    const remembered = new Set();
    const curves = {};
    women.forEach((w, i) => {
      curves[w.id] = w.memory.map((m) => {
        remembered.add(m.book);
        const x1 = xWoman(i), x2 = xBook(m.book);
        const path = s("path", { d: `M${x1} ${top}C${x1} ${band * 0.6} ${x2} ${band * 0.45} ${x2} ${band - 8}`, class: `wb-curve k-${m.kind} s-${canon.find((b) => b.c === m.book).s}` });
        svg.append(path, s("circle", { cx: x2, cy: band - 8, r: 4, class: `wb-end s-${canon.find((b) => b.c === m.book).s}` }));
        return path;
      });
    });
    canon.filter((b) => remembered.has(b.c)).forEach((b) => {
      const text = s("text", { x: xBook(b.c), y: band + 22, class: "wb-book", transform: `rotate(40 ${xBook(b.c)} ${band + 22})` });
      text.textContent = b.n;
      svg.append(text);
    });
    const readout = h("p", { class: "wb-readout", "aria-live": "polite" });
    const idle = () => readout.replaceChildren(label("Read the chart"), " ", `${numbers.named} of the ${numbers.stories} stories are named again by a later book; ${numbers.echoed} more are echoed or set aside. The rest are read on their own words, and the study does not add a memory the text does not give.`);
    idle();
    let chosen = null;
    function show(w) {
      Object.entries(curves).forEach(([id, list]) => list.forEach((p) => p.classList.toggle("is-dim", w !== null && id !== w.id)));
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(w !== null && b.dataset.id === w.id)));
      if (!w) return idle();
      readout.replaceChildren(h("span", {}, h("b", {}, w.name), " ",
        w.memory.length ? w.memory.map((m, i) => [i ? " · " : "", mark("memory"), " ", h("q", {}, m.said), " ", refLink(m.r), m.kind === "echo" ? " (an echo, not a naming)" : m.kind === "aside" ? " (a use this study sets aside)" : ""])
          : "No later book looks back on her in this study's readings.",
        w.note ? ` ${w.note}.` : "", " ", h("a", { class: "wb-link", href: `#part-${w.part}` }, "Read her story")));
    }
    const buttons = women.map((w) => h("button", { type: "button", class: `wb-who${w.memory.length ? "" : " is-quiet"}`, "data-id": w.id, "aria-pressed": "false",
      onmouseenter: () => chosen || show(w), onmouseleave: () => chosen || show(null), onfocus: () => chosen || show(w),
      onclick: () => { chosen = chosen === w ? null : w; show(chosen || w); } },
      h("span", { class: "wb-who-name" }, w.short), h("span", { class: "wb-who-book" }, canon.find((b) => b.c === w.book).n)));
    const list = h("ul", { class: "wb-memory-list" }, women.map((w) => h("li", {}, h("b", {}, w.short),
      w.memory.length ? w.memory.map((m) => [" ", refLink(m.r), m.kind === "named" ? "" : " (echo or set aside)"]) : " No later book in these readings.")));
    return h("figure", { class: "wb-chart" },
      h("figcaption", {}, h("span", { class: "wb-chart-q" }, mark("memory"), " Told in memory of her"), " Where does later Scripture look back on these sixteen stories? The stories run in the Bible's order across the top; the 66 books run along the bottom in their section colours. A solid line names her; a dashed line is an echo or a use set aside. Point at a story to read its memories below; choose a reference to open the verse."),
      h("div", { class: "wb-chart-row" }, buttons), svg, readout, list);
  }

  // ── 01–08: the parts ──
  function womanCard(w, extra = false) {
    return h("div", { class: `wb-face${extra ? " is-extra" : ""}` },
      art(WBArt.minis[w.id], "wb-mini"),
      h("h3", { class: "wb-face-name" }, w.name),
      h("p", { class: "wb-face-line" }, mark("did"), " ", h("q", {}, w.line), " ", refLink(w.r)),
      extra ? h("p", { class: "wb-face-memory" }, "One verse, not a story: not counted among the sixteen.")
        : h("p", { class: "wb-face-memory" }, mark("memory"), " ", w.memory.length ? ["Remembered in ", w.memory.map((m, i) => [i ? ", " : "", refLink(m.r)]), w.memory.every((m) => m.kind !== "named") ? " (not by name)" : ""] : "No later memory in these readings"));
  }
  function renderBlocks(blocks) {
    const out = [];
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.k === "view") {
        const group = [];
        while (i < blocks.length && blocks[i].k === "view") group.push(blocks[i++]);
        i--;
        out.push(h("div", { class: "wb-views" }, group.map((v) => h("div", { class: "wb-view" }, h("p", { class: "wb-view-label" }, v.label), h("p", {}, runs(v.runs))))));
      } else out.push(renderBlock(b));
    }
    return out;
  }
  function renderBlock(b) {
    if (b.k === "hook") return h("p", { class: "wb-hook" }, runs(b.runs));
    if (b.k === "p") return h("p", {}, runs(b.runs));
    if (b.k === "quote") return h("figure", { class: "wb-quote" }, h("blockquote", {}, b.text),
      h("figcaption", {}, refLink(b.r, b.label), " · Berean Standard Bible", b.part ? " · part of the verse" : ""));
    if (b.k === "h3" && b.who) return h("h3", { class: "wb-sub is-woman" }, art(WBArt.minis[b.who], "wb-sub-mini"), b.t);
    if (b.k === "h3") return h("h3", { class: "wb-sub" }, b.t);
    if (b.k === "stop") return h("h3", { class: "wb-stop" }, h("span", {}, b.t));
    if (b.k === "open") return h("div", { class: "wb-open" }, label("Read more than one way"), h("p", {}, runs(b.runs)));
    if (b.k === "step") return h("div", { class: "wb-step" }, h("p", { class: "wb-step-label" }, b.label), h("p", {}, runs(b.runs)));
    return null;
  }
  const readings = (sec) => h("p", { class: "wb-readings" }, label("Main readings"), " ", sec.readings.map((r, i) => [i ? "; " : "", refLink(r)]));
  for (const part of study.parts) {
    const faces = women.filter((w) => w.part === part.n);
    const [hook, ...body] = part.blocks;
    page.append(h("section", { class: "t-sec wb-part", id: `part-${part.n}` },
      sectionHead(part.n, `${part.title}:`, part.turn),
      h("div", { class: "wb-part-top" }, h("p", { class: "wb-hook" }, runs(hook.runs)), readings(part)),
      h("div", { class: `wb-faces n-${faces.length + (junia.part === part.n ? 1 : 0)}` }, faces.map((w) => womanCard(w)), junia.part === part.n ? womanCard(junia, true) : null),
      h("div", { class: "wb-body" }, renderBlocks(body)),
      part.consider ? h("div", { class: "wb-respond" },
        h("p", {}, label("Consider"), " ", runs(part.consider)), h("p", {}, label("Reflect"), " ", runs(part.reflect))) : null));
  }

  // ── The question ──
  const q = study.question;
  page.append(h("section", { class: "t-sec wb-question", id: "question" },
    sectionHead("?", q.title, q.turn),
    h("div", { class: "wb-part-top" }, h("p", { class: "wb-hook" }, runs(q.blocks[0].runs)), readings(q)),
    h("div", { class: "wb-body wb-argue" }, renderBlocks(q.blocks.slice(1)))));

  // ── Close: the last paragraph read as a list, then the passage it began with ──
  const close = study.close;
  const passage = passages[WB.close_passage];
  page.append(h("section", { class: "t-sec wb-close", id: "close" },
    sectionHead("→", "What these women", "show."),
    h("div", { class: "wb-close-grid" },
      h("div", {},
        close.blocks.map(renderBlock),
        h("figure", { class: "wb-litany" },
          h("figcaption", {}, mark("god"), " The same paragraph, read as a list: God is the one acting in every line."),
          h("ol", {}, litany.map((row) => h("li", {}, h("span", { class: "wb-verb" }, "He ", row.verb), h("span", { class: "wb-obj" }, row.rest),
            h("span", { class: "wb-who-links" }, row.who.map((id) => h("a", { class: "wb-link", href: `#part-${byId[id].part}` }, byId[id].short))))))),
        h("p", { class: "wb-your" }, label("Your question"), " ", runs(close.your_question)),
        h("p", { class: "wb-again" }, close.again)),
      h("figure", { class: "wb-passage" },
        h("figcaption", {}, label("The passage this study began with"), " ", refLink(WB.close_passage), " · BSB"),
        h("div", { class: "wb-passage-text" }, passage.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))),
        art(WBArt.close, "wb-close-art"))),
    h("div", { class: "wb-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use)),
        h("li", {}, h("b", {}, "Checked:"), ` ${outside.filter((o) => o.held).length} of the ${outside.length} quotations from outside Scripture were found word for word in copies held on this PC; the other ${outside.filter((o) => !o.held).length} are not held and are marked in the study for checking.`))),
    h("a", { class: "wb-back", href: "/study/theology?area=people" }, art(icon("arrowLeft", 16)), "Back to People of Scripture"),
  ));

  // ── The verse sheet ──
  const sheet = h("dialog", { class: "wb-sheet", "aria-labelledby": "wb-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function openSheet(id, push = true) {
    const item = Object.hasOwn(passages, id) ? passages[id] : null;
    if (!item) return;
    sheet.replaceChildren(
      h("div", { class: "wb-sheet-head" }, h("h2", { id: "wb-sheet-title" }, item.label), h("button", { type: "button", class: "wb-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "wb-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "wb-sheet-src" }, "Berean Standard Bible"));
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
    const link = event.target.closest("a.wb-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    openSheet(link.dataset.ref);
  });
  const asked = new URLSearchParams(location.search).get("ref");
  if (asked) openSheet(asked, false);
})();
