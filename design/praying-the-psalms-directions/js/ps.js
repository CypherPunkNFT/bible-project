// The book of Psalms, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// All text goes in as text nodes; the only markup strings are the fixed drawings in art.js and the frame's icons.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.style.cssText = "padding:2rem;font:1rem serif";
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`The book of Psalms: ${detail}`);
  }
  const ready = window.PS && window.PS.study && Array.isArray(window.PS.psalms) && window.PS.psalms.length === 150 && window.PS.passages;
  if (!ready) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.PS is missing or incomplete");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.PSArt || !window.PSKit || !window.PSField || !window.PSFigures) {
    return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon or a page script is missing");
  }
  const { data, h, art, known, refLink, runs, label, psalm, bookName, plural } = PSKit;
  const { study, passages, numbers } = data;

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page ps-page" });
  main.append(page);

  // ── Hero: the standard heading, the drawing in its circle, the night Jesus sang and the day He named the Psalms ──
  const [sang, named, lead, frameText, questions] = study.opening;
  const figures = [
    ["Psalms", numbers.psalms, "the most chapters of any book in the Bible"],
    ["Books", numbers.books, "four close by blessing the LORD; the fifth ends in Hallelujah"],
    ["Headings", numbers.headed, `of the 150 psalms carry one; ${numbers.psalms - numbers.headed} have none`],
    ["Quoted", numbers.cited, `psalms quoted in ${numbers.pairs} New Testament passages, by the Berean's notes`],
  ];
  page.append(h("section", { class: "t-sec-landing ps-hero", id: "top" },
    h("div", { class: "hc-intro ps-intro" },
      h("div", {},
        h("nav", { class: "ps-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"),
          h("a", { href: "/study/theology?area=life" }, "Living the Christian Life"), h("span", { "aria-hidden": "true" }, "/"),
          h("span", { class: "ps-here", "aria-current": "page" }, study.title)),
        h("p", { class: "ps-concepts" }, data.concepts.join(" · ")),
        h("h1", {}, "The book of ", h("em", {}, "Psalms")),
        h("p", { class: "hc-lede" }, runs(lead.runs)),
        h("div", { class: "ps-opening" }, h("p", {}, runs(sang.runs)),
          h("figure", {}, h("blockquote", {}, passages[named.r].verses.map((v) => v[1]).join(" ")),
            h("figcaption", {}, refLink(named.r, named.label), " · Berean Standard Bible")))),
      h("figure", { class: "ms-hero-art ps-hero-art" }, art(PSArt.hero), h("span", { class: "ms-art-note" }, h("i"), data.motto[0], h("br"), h("span", {}, data.motto[1])))),
    h("dl", { class: "ps-figures" }, figures.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
    h("nav", { class: "ps-toc", "aria-label": "On this page" },
      h("a", { href: "#questions" }, h("b", {}, "?"), "Three questions"), h("a", { href: "#book" }, h("b", {}, "00"), "The whole book"),
      study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title.split(":")[0])),
      h("a", { href: "#close" }, h("b", {}, "→"), "Read again"))));

  // ── Three questions to carry: each opens its view of the whole book ──
  const views = [["books"], ["marks", "writers"], ["nt"]];
  page.append(h("section", { class: "t-sec ps-questions", id: "questions", "aria-label": "Three questions to carry" },
    h("p", { class: "ps-frame" }, runs(frameText.runs)),
    h("ol", { class: "ps-three" }, questions.items.map((item, i) => h("li", {},
      h("span", { class: "ps-three-n" }, String(i + 1)), h("p", {}, runs(item)),
      h("button", { type: "button", class: "ps-see", onclick: () => { PSField.setLens(views[i][0]); document.getElementById("book").scrollIntoView({ behavior: PSKit.reduced() ? "auto" : "smooth" }); } },
        "See it in the whole book"))))));

  page.append(PSField.section());

  // ── 01–07 The parts ──
  function block(b) {
    switch (b.k) {
      case "p": return h("p", {}, runs(b.runs));
      case "h3": return h("h3", { class: "ps-h3" }, b.t);
      case "quote": return h("figure", { class: `ps-quote${b.heading ? " is-heading" : ""}` },
        h("blockquote", {}, b.heading ? psalm(+b.r.slice(3)).heading.replace(/"/g, "") : passages[b.r].verses.map((v) => v[1]).join(" ")),
        h("figcaption", {}, refLink(b.r, b.label), " · BSB"));
      case "ul": return h("ul", { class: "ps-list" }, b.items.map((item) => h("li", {}, runs(item))));
      case "ol": return h("ol", { class: "ps-list ps-numbered" }, b.items.map((item) => h("li", {}, runs(item))));
      default: console.error(`The book of Psalms: unknown block ${b.k}`); return null;
    }
  }
  const parts = h("div", { class: "ps-parts" });
  study.parts.forEach((part) => {
    const figure = PSFigures.forPart(part);
    parts.append(h("article", { class: `t-sec ps-part ps-part-${part.n}${figure ? "" : " no-figure"}`, id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "ps-part-head" },
        h("span", { class: "ps-n", "aria-hidden": "true" }, part.n),
        art(PSArt.parts[part.n], "ps-mini-wrap"),
        h("div", {},
          h("h2", { id: `part-${part.n}-title` }, part.title),
          h("p", { class: "ps-hook" }, runs(part.hook)),
          h("p", { class: "ps-readings" }, label("Main readings"), " ", runs(part.readings_runs))),
        PSField.strip(part.psalms, `Part ${part.n}`)),
      h("div", { class: "ps-part-body" },
        h("div", { class: "ps-text" }, part.blocks.map(block),
          h("dl", { class: "ps-ask" },
            h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
            h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect))))),
        figure ? h("aside", { class: "ps-side" }, figure) : null)));
  });
  page.append(parts);

  // ── Close ──
  const close = study.close;
  page.append(h("section", { class: "t-sec ps-close", id: "close" },
    h("header", { class: "t-head" }, h("span", { class: "t-num", "aria-hidden": "true" }, "→"),
      h("div", {}, h("h2", {}, close.title.replace(/ again$/, ""), " ", h("em", {}, "again.")))),
    h("div", { class: "ps-close-grid" },
      h("div", {}, close.blocks.map(block),
        h("p", { class: "ps-question" }, runs(close.your_question)),
        h("p", { class: "ps-again" }, close.again)),
      h("div", { class: "ps-related" }, h("h3", {}, label("Where to go next")),
        h("ul", {}, data.related.map(([name, href, note]) => h("li", {}, h("a", { class: "ps-link", href }, name), h("span", {}, note)))))),
    art(PSArt.close, "ps-close-art"),
    h("div", { class: "ps-sources" }, h("h3", {}, "Sources"),
      h("ul", {}, data.sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use)))),
    h("a", { class: "ps-back", href: "/study/theology?area=life" }, art(icon("arrowLeft", 16)), "Back to Living the Christian Life")));

  // ── The verse sheet: a passage, a psalm (heading, first verse, where it is quoted) or a run of psalms ──
  const sheet = h("dialog", { class: "ps-sheet", "aria-labelledby": "ps-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  const verses = (list) => h("p", { class: "ps-sheet-text" }, list.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " ")));
  function body(id) {
    if (Object.hasOwn(passages, id)) return [passages[id].label, verses(passages[id].verses), "Berean Standard Bible"];
    const run = /^PSR\.(\d+)-(\d+)$/.exec(id);
    if (run) {
      const list = [];
      for (let n = +run[1]; n <= +run[2]; n += 1) list.push(h("li", {}, refLink(`PS.${n}`, `Psalm ${n}`), h("span", {}, psalm(n).heading.replace(/"/g, "") || "No heading")));
      return [`Psalms ${run[1]}–${run[2]}`, h("ol", { class: "ps-sheet-list" }, list), "Headings from the Berean Standard Bible"];
    }
    const p = psalm(+id.slice(3));
    return [`Psalm ${p.n}`, h("div", {},
      h("p", { class: "ps-sheet-meta" }, `${bookName(p.book)} · ${plural(p.verses, "verse", "verses")}`),
      h("p", { class: "ps-sheet-heading" }, label("Heading"), " ", p.heading ? p.heading.replace(/"/g, "") : "None in the Berean"),
      verses([[`${p.n}:1`, p.first]]),
      p.cited.length ? h("p", { class: "ps-sheet-cited" }, label("Quoted in"), " ", p.cited.map(([v, key], i) => [i ? " · " : "", refLink(key, passages[key].label), ` (verse ${v})`])) : null,
      h("a", { class: "ps-link ps-sheet-read", href: `${data.reader}${p.n}` }, `Read all of Psalm ${p.n} in the Bible`)), "Berean Standard Bible"];
  }
  function openSheet(id, push = true) {
    if (!known(id)) return;
    const [title, content, source] = body(id);
    sheet.replaceChildren(
      h("div", { class: "ps-sheet-head" }, h("h2", { id: "ps-sheet-title" }, title), h("button", { type: "button", class: "ps-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      content, h("p", { class: "ps-sheet-src" }, source));
    if (!sheet.open) sheet.showModal();
    if (push) {
      const query = new URLSearchParams(location.search);
      query.set("ref", id);
      history.replaceState(null, "", `?${query}${location.hash}`);
    }
  }
  sheet.addEventListener("close", () => {
    const query = new URLSearchParams(location.search);
    query.delete("ref");
    history.replaceState(null, "", `${location.pathname}${query.size ? `?${query}` : ""}${location.hash}`);
    if (opener && document.contains(opener)) opener.focus();
    opener = null;
  });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a.ps-ref");
    if (!link) return;
    event.preventDefault();
    if (!sheet.open) opener = link;
    openSheet(link.dataset.ref);
  });
  document.addEventListener("ps-open", (event) => { opener = event.detail.from; openSheet(event.detail.id); });
  const asked = new URLSearchParams(location.search).get("ref");
  if (asked && known(asked)) openSheet(asked, false);
})();
