// Genesis 1–11: the questions readers bring. One mock-up page drawn from data.js (built by build-data.py from the
// study's content.md). The page teaches one habit: read the verse before the view. Every question is laid out in the
// same tiers, in the study's own headings: what the text shows, the readings, and where the reading stops.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.className = "gb-alert";
    notice.textContent = message;
    (document.querySelector("main") || document.body).prepend(notice);
    console.error(`Genesis 1–11: ${detail}`);
  }
  const data = window.GB;
  if (!data || !data.study || !data.passages || !data.band) return stop("The study data did not load. Run build-data.py, then reload.", "window.GB is missing or incomplete");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.GBArt || !window.GBCore || !window.GBGraphics) return stop("This page could not load its shared frame or drawings. Reload the page.", "Frame, icon, GBArt, GBCore or GBGraphics is missing");

  const { h, art, has } = GBCore;
  const G = GBGraphics;
  const { study, numbers } = data;
  const parts = Object.fromEntries(study.parts.map((p) => [p.n, p]));

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const ui = GBCore.make(data);
  const page = h("div", { class: "wrap t-page ms-page gb-page" });
  main.append(page);

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead.length ? h("p", {}, ...lead) : null));
  const mark = (kind) => h("span", { class: `gb-mark gb-mark-${kind}`, "aria-hidden": "true" });

  // ── Hero: the standard heading ──
  const [titleInk] = study.title.split(":");
  page.append(h("section", { class: "t-sec-landing gb-hero", id: "top" },
    h("div", { class: "hc-intro gb-intro" },
      h("div", {},
        h("nav", { class: "gb-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"),
          h("a", { href: "/study/theology?area=books" }, "Explore the Bible"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "gb-here", "aria-current": "page" }, titleInk)),
        h("p", { class: "gb-concepts" }, data.concepts.join(" · ")),
        h("h1", {}, titleInk, h("em", {}, study.title.slice(titleInk.length + 2))),
        h("p", { class: "hc-lede" }, ui.runs(study.lead)),
        h("figure", { class: "gb-opening" }, h("blockquote", {}, ui.verseText(study.quote.r)),
          h("figcaption", {}, ui.refLink(study.quote.r), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art gb-hero-art" }, art(GBArt.hero), h("span", { class: "ms-art-note" }, h("i"), data.motto[0], h("br"), h("span", {}, data.motto[1])))),
    h("dl", { class: "gb-figures" }, [
      ["Questions", numbers.questions, "readers bring to these chapters, each read from the text first"],
      ["Readings shown", numbers.readings, "across the eight questions, each with who holds it"],
      ["Verses", numbers.genesisVerses, "in Genesis 1–11, before one verse narrows to one man"],
      ["Beyond these chapters", numbers.later, "passages where the rest of Scripture takes the questions up"],
    ].map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
  ));

  // ── 00 How to read these chapters: the scope, the three questions to carry, the common ground ──
  const before = study.intro.filter((p) => !p.after_carry), after = study.intro.filter((p) => p.after_carry);
  const carryKinds = ["text", "later", "readings"];
  page.append(h("section", { class: "t-sec gb-how", id: "how" },
    sectionHead("00", "Read the verse", "before the view.", "Three questions to carry into every part, and what every view holds in common."),
    before.map((p, i) => h("p", { class: i ? "gb-how-lead" : "gb-how-scope" }, ui.runs(p.runs))),
    h("ol", { class: "gb-carry" }, study.carry.map((c, i) => h("li", {}, mark(carryKinds[i]), h("h3", {}, c.q), h("p", {}, ui.runs(c.runs))))),
    after.map((p) => h("p", { class: "gb-common" }, ui.runs(p.runs))),
    h("p", { class: "gb-legend" }, mark("text"), " What the text says  ", mark("readings"), " A reading of it  ", mark("stops"), " Where the text stops"),
  ));

  // ── 01 The chapters and the questions: the band, and every question as a card ──
  const readout = h("p", { class: "gb-readout", "aria-live": "polite" }, "Point at an arc to see what a question reads; choose it to open the question.");
  const point = (n) => {
    if (!n || !has(parts, n)) { readout.textContent = "Point at an arc to see what a question reads; choose it to open the question."; return; }
    const part = parts[n];
    readout.textContent = `${n} · ${part.title} · reads ${part.readings.map((id) => data.passages[id].label).filter((l) => l.startsWith("Genesis")).join("; ")}`;
  };
  const cards = h("ol", { class: "gb-cards" }, study.parts.map((part) => {
    const views = part.tiers.flatMap((t) => t.blocks).filter((b) => b.k === "view").length;
    const hook = ui.plain(part.hook.find((b) => b.k === "p")?.runs || []);
    return h("li", {}, h("a", { class: "gb-card", href: `?q=${part.n}`, "data-q": part.n, onfocus: () => point(part.n), onmouseenter: () => point(part.n) },
      h("span", { class: "gb-card-kind" }, `Question ${part.n} / ${String(study.parts.length).padStart(2, "0")}`),
      art(GBArt.minis[part.n], "gb-card-art"),
      h("span", { class: "gb-card-title" }, part.title),
      h("span", { class: "gb-card-line" }, hook),
      h("span", { class: "gb-card-parts" }, `${views} ${views === 1 ? "reading" : "readings"} · ${part.later.length} passages beyond Genesis 1–11`),
      h("span", { class: "gb-card-go" }, "Read the question", art(icon("arrowRight", 14)))));
  }));
  page.append(h("section", { class: "t-sec gb-chapters", id: "chapters" },
    sectionHead("01", "The eleven chapters", "and the questions.", "Each question sits where it arises in Genesis. The blocks are the chapters, as wide as their verses; the last thin block is Genesis 12:1, where the story narrows to one man."),
    h("div", { class: "gb-band" }, G.band(data, ui, (n) => choose(n), point), readout),
    cards));

  // ── One question at a time: the second page of the study, kept in the address (?q=01) ──
  const holder = h("section", { class: "t-sec gb-question", id: "question", "aria-live": "off" });
  page.append(holder);

  function renderBlock(block, part) {
    if (block.k === "p") return h("p", {}, ui.runs(block.runs));
    if (block.k === "quote") return h("figure", { class: "gb-quote" }, h("blockquote", {}, block.text),
      h("figcaption", {}, ui.refLink(block.r), " · BSB", block.part ? h("span", { class: "gb-part-of" }, " · part of the verse") : null));
    if (block.k === "view") return h("div", { class: "gb-view" }, mark("readings"), h("h4", {}, block.label),
      block.tag ? h("span", { class: "gb-view-tag" }, block.tag) : null, h("p", {}, ui.runs(block.runs)));
    console.error(`Genesis 1–11: unknown block ${block.k} in question ${part.n}`);
    return "";
  }
  const extra = { "01": { text: G.days }, "04": { text: G.ages }, "06": { text: G.flood }, "08": { text: G.languages, later: G.thread } };

  function renderTier(tier, part) {
    const views = tier.blocks.filter((b) => b.k === "view"), rest = tier.blocks.filter((b) => b.k !== "view");
    const subquestions = tier.title === "The readings Christians give";
    const body = tier.kind === "readings"
      ? [h("div", { class: subquestions ? "gb-subqs" : "gb-views" }, views.map((b) => renderBlock(b, part))), rest.map((b) => h("div", { class: "gb-after" }, renderBlock(b, part)))]
      : tier.blocks.map((b) => renderBlock(b, part));
    const figure = extra[part.n]?.[tier.kind];
    return h("section", { class: `gb-tier gb-tier-${tier.kind}` },
      h("h3", { class: "gb-tier-head" }, mark(tier.kind === "refused" ? "stops" : tier.kind), tier.title),
      body, figure ? figure(data, ui) : null);
  }

  function render(n) {
    if (!n) { holder.replaceChildren(); holder.hidden = true; document.title = `${study.title} · Bible Guide`; return; }
    const part = parts[n], index = study.parts.indexOf(part);
    const prev = study.parts[index - 1], next = study.parts[index + 1];
    const title = h("h2", { class: "gb-q-title", tabindex: "-1" }, part.title);
    holder.hidden = false;
    holder.replaceChildren(...[
      h("header", { class: "gb-q-head" },
        h("span", { class: "gb-q-n", "aria-hidden": "true" }, part.n),
        h("div", {}, h("p", { class: "gb-q-kind" }, `Question ${part.n} of ${study.parts.length}`), title,
          part.hook.map((b) => renderBlock(b, part)),
          h("p", { class: "gb-readings" }, ui.label("Main readings"), " ", part.readings.map((id, i) => [i ? " · " : "", ui.refLink(id)]))),
        art(GBArt.minis[part.n], "gb-q-art")),
      part.tiers.map((t) => renderTier(t, part)),
      h("section", { class: "gb-later" }, h("h3", { class: "gb-tier-head" }, mark("later"), "Later Scripture on this question"),
        h("p", {}, part.later.map((id, i) => [i ? h("span", { class: "gb-rule", "aria-hidden": "true" }) : null, ui.refLink(id)]))),
      h("dl", { class: "gb-ask" },
        h("div", {}, h("dt", {}, "Consider"), h("dd", {}, ui.runs(part.consider))),
        h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, ui.runs(part.reflect)))),
      h("nav", { class: "gb-q-nav", "aria-label": "Questions" },
        prev ? h("a", { href: `?q=${prev.n}`, "data-q": prev.n }, art(icon("arrowLeft", 14)), `${prev.n} ${prev.title}`) : h("span"),
        h("a", { href: "#chapters", class: "gb-q-all" }, "All eight questions"),
        next ? h("a", { href: `?q=${next.n}`, "data-q": next.n }, `${next.n} ${next.title}`, art(icon("arrowRight", 14))) : h("a", { href: "#close" }, "Read Genesis 1–11 again", art(icon("arrowRight", 14)))),
    ].flat(Infinity));
    document.title = `${part.title} · ${study.title} · Bible Guide`;
    return title;
  }
  function mark_current(n) {
    cards.querySelectorAll(".gb-card").forEach((card) => card.toggleAttribute("aria-current", card.dataset.q === n));
    document.querySelectorAll(".gb-band-q").forEach((g) => g.classList.toggle("is-current", g.dataset.q === n));
  }
  function choose(n, push = true) {
    if (!has(parts, n)) return;
    if (push) {
      const params = new URLSearchParams(location.search);
      params.set("q", n);
      params.delete("ref");
      history.pushState({ q: n }, "", `${location.pathname}?${params}`);
    }
    const title = render(n);
    mark_current(n);
    title.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    title.focus({ preventScroll: true });
  }
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-q]");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    choose(link.dataset.q);
  });
  addEventListener("popstate", () => {
    const n = new URLSearchParams(location.search).get("q");
    const valid = /^0[1-8]$/.test(n || "") && has(parts, n) ? n : null;
    render(valid);
    mark_current(valid);
  });

  // ── Close ──
  const close = study.close;
  const again = close.paras[close.paras.length - 1];
  page.append(h("section", { class: "t-sec gb-close", id: "close" },
    sectionHead("→", close.title.replace(/ again$/, ""), "again."),
    h("div", { class: "gb-close-grid" },
      h("div", {},
        close.paras.slice(0, -1).map((p, i) => h("p", { class: i ? "gb-close-turn" : "gb-close-way" }, ui.runs(p))),
        h("p", { class: "gb-close-q" }, ui.runs(close.question)),
        h("p", { class: "gb-close-again" }, ui.runs(again))),
      h("figure", { class: "gb-passage" },
        h("figcaption", {}, ui.label("The passage again"), " ", ui.refLink(close.passage), " · BSB"),
        h("div", { class: "gb-passage-text" }, data.passages[close.passage].verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))))),
    art(GBArt.close, "gb-close-art"),
    h("div", { class: "gb-sources" }, h("h3", {}, "Sources, and how far each was read"),
      h("ul", {}, data.sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use))),
      h("p", { class: "gb-status" }, study.status)),
    h("a", { class: "gb-back", href: "/study/theology?area=books" }, art(icon("arrowLeft", 16)), "Back to Explore the Bible"),
  ));

  // ── Start from the address ──
  const params = new URLSearchParams(location.search);
  const asked = params.get("q");
  if (/^0[1-8]$/.test(asked || "") && has(parts, asked)) { render(asked); mark_current(asked); } else render(null);
  const ref = params.get("ref");
  if (ref && has(data.passages, ref)) ui.openSheet(ref, false);
})();
