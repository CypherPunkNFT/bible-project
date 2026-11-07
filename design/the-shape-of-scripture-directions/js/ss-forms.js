// The heading and section 01: each passage set in the shape of its own kind of writing. The shapes themselves are in css/ss.css.
(() => {
  if (!window.SSK) return;
  const { h, art, refLink, runs, plain, page, sectionHead, readings, sourceIds } = SSK;
  const { study, passages, forms, numbers } = window.SS;
  const tone = { law: "history", history: "history", poetry: "poetry", prophets: "prophets", gospels: "gospels", letters: "epistles" };

  // ── Heading ──
  const motto = plain(study.motto).split(" / ");
  const figures = [
    ["Divisions", numbers.divisions, "this site's reading guide, not a division Scripture gives itself"],
    ["Verses walked", numbers.verses, "each counted once, in the Berean, across the six readings"],
    ["Kinds inside other books", numbers.marks, `places across ${numbers.markBooks} books. A selection, so it shows the mixing and is not a count of it`],
    ["Later looks back", numbers.steps, `one example per pair of parts: ${numbers.names} name, ${numbers.retells} retell, ${numbers.shares} share words`],
  ];
  page.append(h("section", { class: "t-sec-landing ss-hero", id: "top" },
    h("div", { class: "hc-intro ss-intro" },
      h("div", {},
        h("nav", { class: "ss-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=books" }, "Explore the Bible"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "ss-here", "aria-current": "page" }, study.title)),
        h("p", { class: "ss-concepts" }, plain(study.concepts)),
        h("h1", {}, "The shape", h("em", {}, "of Scripture")),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "ss-opening" },
          h("blockquote", {}, study.opening.t),
          h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "ms-hero-art ss-hero-art" },
        art(SSArt.hero),
        h("span", { class: "ms-art-note" }, h("i"), motto[0], h("br"), h("span", {}, motto[1])))),
    h("dl", { class: "ss-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
    h("p", { class: "ss-note" }, "Drawings are illustrative forms, not pictures of real objects.")));

  // ── A form: one renderer; css/ss.css gives each type its shape ──
  const lineView = (runList) => h("span", { class: "ss-line" }, runList.map((run) => (typeof run === "string" ? run : h("mark", {}, run.m))));
  const formView = (block) => h("figure", { class: `ss-form ss-form-${block.type}`, style: block.tone ? `--tone:var(--${block.tone})` : null },
    h("div", { class: "ss-zones" }, block.zones.map((zone) => h("div", { class: "ss-zone" },
      h("span", { class: "ss-zone-label" }, zone.label),
      h("blockquote", {}, zone.lines.map(lineView)),
      refLink(zone.r, passages[zone.r].label, "ss-zone-ref")))),
    h("figcaption", {}, block.caption));

  const sourceNote = (id) => {
    const source = sourceIds.get(id);
    return source ? h("small", {}, h("a", { href: source.href, rel: "noopener noreferrer", target: "_blank" }, source.name), ". ", source.note) : null;
  };
  const flag = (label, className, block) => h("div", { class: `ss-flag ${className}` }, h("span", { class: "ss-flag-label" }, label), h("p", {}, runs(block.runs)), sourceNote(block.src));
  const blockView = {
    p: (b) => h("p", {}, runs(b.runs)),
    care: (b) => flag("This site's own word", "ss-flag-care", b),
    open: (b) => flag("Open here · this study does not settle it", "ss-flag-open", b),
    source: (b) => flag("Named source", "", b),
  };
  const QUESTIONS = [["form", "Its form"], ["hearers", "Its hearers"], ["link", "Its link"], ["own", "Its own words"]];

  // ── 01 ──
  const switches = new Map();
  const stage = h("div", { class: "ss-stage", id: "ss-stage" });
  const group = h("div", { class: "ss-switch", role: "group", "aria-label": "Choose a division of the Bible" },
    study.readings.map((reading) => {
      const button = h("button", { type: "button", "aria-pressed": "false", "aria-controls": "ss-stage", style: `--tone:var(--${tone[reading.slug]})`, onclick: () => { SSK.setView({ d: reading.slug, walk: false }); draw(); } },
        art(SSArt.mini(reading.slug), "ss-switch-art"), h("span", {}, plain(reading.short)));
      switches.set(reading.slug, button);
      return button;
    }));
  page.append(h("section", { class: "t-sec", id: "forms" },
    sectionHead("01", "One word.", "Six shapes.", runs(study.frame)),
    h("p", { class: "ss-reads" }, "Choose a division. Its passage is set the way it was written, in the Berean, so you can see the shape before you read the words."),
    group, stage,
    h("p", { class: "ss-note" }, runs(study.selection))));

  function draw() {
    const reading = readings.get(SSK.state.d);
    const walking = SSK.state.walk;
    for (const [slug, button] of switches) button.setAttribute("aria-pressed", String(slug === reading.slug));
    stage.style.setProperty("--tone", `var(--${tone[reading.slug]})`);
    const walkId = "ss-walk";
    const walkButton = h("button", { type: "button", class: "ss-action", "aria-expanded": String(walking), "aria-controls": walkId, onclick: () => { SSK.setView({ walk: !SSK.state.walk }); draw(); stage.querySelector(".ss-action").focus({ preventScroll: true }); } },
      walking ? "Close this reading ↑" : "Walk this reading ↓");
    stage.replaceChildren(
      h("header", { class: "ss-stage-head" },
        h("p", { class: "ss-kind" }, "Division ", h("b", {}, `${reading.n} / ${String(study.readings.length).padStart(2, "0")}`)),
        h("h3", {}, reading.title),
        h("p", { class: "ss-hook" }, runs(reading.hook)),
        h("p", { class: "ss-line-what" }, runs(reading.line))),
      ...forms[reading.slug].map(formView),
      h("dl", { class: "ss-ledger" }, QUESTIONS.map(([key, label]) => h("div", {}, h("dt", {}, label), h("dd", {}, runs(reading[key]))))),
      h("p", { class: "ss-name" }, h("b", {}, "Why it has this name. "), runs(reading.name)),
      h("p", { class: "ss-parts" }, `${reading.verseCount} verses to read · `, reading.read.flatMap((id, i) => [i ? " · " : null, refLink(id, passages[id].label)])),
      walkButton,
      h("div", { id: walkId, class: "ss-walk", hidden: !walking },
        reading.parts.map((part) => h("div", { class: "ss-part" }, h("h4", {}, part.title), part.blocks.map((block) => blockView[block.k](block)))),
        h("div", { class: "ss-prompt" }, h("h4", {}, "Look closely"), h("p", {}, runs(reading.look))),
        h("div", { class: "ss-prompt" }, h("h4", {}, "Your response"), h("p", {}, runs(reading.response)))));
  }
  draw();
  SSK.syncers.push(draw);
})();
